/**
 * Shipyard socket protocol validators (Phase 9).
 * Pure validation — Foundry transport lives in registerShipyardSockets.
 */
import { MODULE_ID } from "../logger.js";
import {
  canEditShipyardDraft,
  canPublishShipyardProjection,
  canRequestShipyardSnapshot,
  resolveUserRole,
  SHIPYARD_ROLES
} from "./permissions.js";
import {
  PROJECTION_PROTOCOL_VERSION,
  validateProjection
} from "./projection.js";

export const SHIPYARD_SOCKET_EVENT = `module.${MODULE_ID}`;

export const SHIPYARD_MESSAGE_TYPES = Object.freeze({
  DRAFT_UPDATED: "shipyard-draft-updated",
  DRAFT_CLEARED: "shipyard-draft-cleared",
  REQUEST_SNAPSHOT: "shipyard-request-snapshot",
  SNAPSHOT: "shipyard-snapshot",
  ACTOR_CREATED: "shipyard-actor-created"
});

export const REJECTED_PHASE10_MESSAGE_TYPES = Object.freeze([
  "shipyard-create",
  "shipyard-create-actor",
  "shipyard-retry",
  "shipyard-rollback",
  "shipyard-undo",
  "shipyard-folder",
  "shipyard-ownership",
  "shipyard-item",
  "shipyard-actor-update",
  "shipyard-actor-delete"
]);

/**
 * @param {object|null|undefined} user
 * @param {string|null|undefined} sessionOwnerId
 * @param {{ allowTakeover?: boolean }} [options]
 */
export function canBroadcastAsSessionOwner(user, sessionOwnerId, options = {}) {
  if (!user?.id) return false;
  if (resolveUserRole(user) < SHIPYARD_ROLES.GAMEMASTER) return false;
  if (!sessionOwnerId) return true;
  if (user.id === sessionOwnerId) return true;
  return Boolean(options.allowTakeover);
}

/**
 * Session metadata used for inbound validation.
 * Observers must never advertise their own user id as session owner.
 * @param {{
 *   draft?: object|null,
 *   projection?: object|null,
 *   isEditor?: boolean,
 *   localUserId?: string|null
 * }} parts
 */
export function resolveShipyardSessionMeta(parts = {}) {
  const draft = parts.draft ?? null;
  const projection = parts.projection ?? null;
  return {
    revision: Number(projection?.revision ?? draft?.revision ?? 0),
    sessionOwnerId:
      projection?.sessionOwnerId ??
      draft?.sessionOwnerId ??
      (parts.isEditor ? parts.localUserId ?? null : null)
  };
}

/**
 * Validate an inbound socket envelope using Foundry-provided sender identity.
 * @param {{
 *   type: string,
 *   protocolVersion?: number,
 *   revision?: number,
 *   projection?: object,
 *   targetUserId?: string|null,
 *   sessionOwnerId?: string|null,
 *   createActor?: unknown,
 *   createItem?: unknown,
 *   documentCreate?: unknown
 * }} message
 * @param {{
 *   senderUserId: string,
 *   senderUser: object|null,
 *   featureEnabled?: boolean,
 *   currentRevision?: number|null,
 *   sessionOwnerId?: string|null
 * }} context
 */
export function validateShipyardSocketMessage(message, context) {
  const errors = [];
  if (!message || typeof message !== "object") {
    return { ok: false, errors: ["message must be an object"] };
  }
  if (!context?.senderUserId || !context.senderUser) {
    return { ok: false, errors: ["sender identity missing"] };
  }

  const type = message.type;
  if (REJECTED_PHASE10_MESSAGE_TYPES.includes(type)) {
    return { ok: false, errors: ["phase10-request-rejected"] };
  }
  const known = Object.values(SHIPYARD_MESSAGE_TYPES);
  if (!known.includes(type)) {
    return { ok: false, errors: ["unknown message type"] };
  }

  const protocolVersion = Number(
    message.protocolVersion ?? PROJECTION_PROTOCOL_VERSION
  );
  if (protocolVersion !== PROJECTION_PROTOCOL_VERSION) {
    errors.push("unsupported protocol version");
  }

  if (
    message.createActor != null ||
    message.createItem != null ||
    message.documentCreate != null ||
    message.actorCreate != null ||
    message.itemCreate != null
  ) {
    errors.push("document-creation request rejected");
  }
  if (
    message.retry != null ||
    message.rollback != null ||
    message.undo != null ||
    message.folderMutation != null ||
    message.ownershipMutation != null
  ) {
    errors.push("phase10-request-rejected");
  }

  const feature = { featureEnabled: Boolean(context.featureEnabled) };

  if (
    type === SHIPYARD_MESSAGE_TYPES.DRAFT_UPDATED ||
    type === SHIPYARD_MESSAGE_TYPES.DRAFT_CLEARED
  ) {
    if (!canEditShipyardDraft(context.senderUser, feature)) {
      errors.push("non-GM mutation rejected");
    }
    if (!canPublishShipyardProjection(context.senderUser, feature)) {
      errors.push("non-GM publish rejected");
    }
    if (
      !canBroadcastAsSessionOwner(
        context.senderUser,
        context.sessionOwnerId ?? message.sessionOwnerId
      )
    ) {
      errors.push("session-owner mismatch");
    }
    if (type === SHIPYARD_MESSAGE_TYPES.DRAFT_UPDATED) {
      const projectionCheck = validateProjection(message.projection);
      if (!projectionCheck.ok) {
        errors.push(...projectionCheck.errors.map((e) => `projection: ${e}`));
      }
      if (!Number.isFinite(Number(message.revision))) {
        errors.push("invalid revision");
      } else if (
        context.currentRevision != null &&
        Number(message.revision) <= Number(context.currentRevision)
      ) {
        errors.push("stale revision");
      }
    }
  }

  if (type === SHIPYARD_MESSAGE_TYPES.REQUEST_SNAPSHOT) {
    if (!canRequestShipyardSnapshot(context.senderUser, feature)) {
      errors.push("snapshot request denied");
    }
    if (message.projection != null || message.mutation != null) {
      errors.push("snapshot request must not carry mutation payload");
    }
  }

  if (type === SHIPYARD_MESSAGE_TYPES.ACTOR_CREATED) {
    if (!canPublishShipyardProjection(context.senderUser, feature)) {
      errors.push("non-GM actor-created rejected");
    }
    if (message.actorSource != null || message.mapping != null || message.uuid != null || message.actorUuid != null) {
      errors.push("actor-created payload must be sanitized");
    }
    if (message.status == null || message.actorName == null) {
      errors.push("actor-created status and name required");
    }
  }

  if (type === SHIPYARD_MESSAGE_TYPES.SNAPSHOT) {
    if (!canPublishShipyardProjection(context.senderUser, feature)) {
      errors.push("non-GM snapshot rejected");
    }
    if (!message.targetUserId) {
      errors.push("snapshot target missing");
    }
    const projectionCheck = validateProjection(message.projection);
    if (!projectionCheck.ok) {
      errors.push(...projectionCheck.errors.map((e) => `projection: ${e}`));
    }
  }

  return { ok: errors.length === 0, errors };
}

/**
 * @param {string} type
 * @param {object} payload
 */
export function createShipyardSocketMessage(type, payload = {}) {
  return {
    type,
    protocolVersion: PROJECTION_PROTOCOL_VERSION,
    ...payload
  };
}
