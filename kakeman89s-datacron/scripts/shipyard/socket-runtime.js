/**
 * Foundry-facing Shipyard socket registration (Phase 9).
 * Pure validators live in socket.js.
 *
 * Sender identity is stamped by the emitting client at emit time as
 * `_senderUserId` using `game.user.id`. Receivers validate against
 * `game.users.get(senderUserId)` and role predicates — never against a
 * free-form userId field inside the business payload.
 */
import { MODULE_ID, logWarn } from "../logger.js";
import { SETTING_KEYS } from "../settings.js";
import {
  SHIPYARD_MESSAGE_TYPES,
  SHIPYARD_SOCKET_EVENT,
  createShipyardSocketMessage,
  validateShipyardSocketMessage
} from "./socket.js";
import { cloneProjection } from "./projection.js";

/** @type {((projection: object|null, meta?: object) => void) | null} */
let onProjectionReceived = null;

/** @type {(() => object|null) | null} */
let getAuthoritativeProjection = null;

/** @type {(() => { revision: number, sessionOwnerId: string|null }) | null} */
let getSessionMeta = null;

/**
 * @param {{
 *   onProjectionReceived?: (projection: object|null, meta?: object) => void,
 *   getAuthoritativeProjection?: () => object|null,
 *   getSessionMeta?: () => { revision: number, sessionOwnerId: string|null }
 * }} handlers
 */
export function configureShipyardSocketHandlers(handlers = {}) {
  onProjectionReceived = handlers.onProjectionReceived ?? onProjectionReceived;
  getAuthoritativeProjection =
    handlers.getAuthoritativeProjection ?? getAuthoritativeProjection;
  getSessionMeta = handlers.getSessionMeta ?? getSessionMeta;
}

function isFeatureEnabled() {
  try {
    return Boolean(game.settings.get(MODULE_ID, SETTING_KEYS.featureShipyard));
  } catch (_error) {
    return false;
  }
}

/**
 * @param {object} message
 * @param {string} senderUserId
 */
function handleInbound(message, senderUserId) {
  const senderUser = game.users?.get?.(senderUserId) ?? null;
  const meta = getSessionMeta?.() ?? { revision: 0, sessionOwnerId: null };
  const validation = validateShipyardSocketMessage(message, {
    senderUserId,
    senderUser,
    featureEnabled: isFeatureEnabled(),
    currentRevision: meta.revision,
    sessionOwnerId: meta.sessionOwnerId
  });
  if (!validation.ok) {
    logWarn("[Shipyard] rejected socket message", {
      type: message?.type ?? null,
      senderUserId,
      errors: validation.errors
    });
    return;
  }

  if (
    message.type === SHIPYARD_MESSAGE_TYPES.DRAFT_UPDATED ||
    message.type === SHIPYARD_MESSAGE_TYPES.DRAFT_CLEARED
  ) {
    const projection =
      message.type === SHIPYARD_MESSAGE_TYPES.DRAFT_CLEARED
        ? null
        : cloneProjection(message.projection);
    onProjectionReceived?.(projection, {
      revision: message.revision ?? null,
      cleared: message.type === SHIPYARD_MESSAGE_TYPES.DRAFT_CLEARED,
      sessionOwnerId: message.sessionOwnerId ?? null
    });
    return;
  }

  if (message.type === SHIPYARD_MESSAGE_TYPES.REQUEST_SNAPSHOT) {
    if (!game.user?.isGM) return;
    const projection = getAuthoritativeProjection?.() ?? null;
    const session = getSessionMeta?.() ?? { revision: 0, sessionOwnerId: null };
    emitShipyardMessage(
      createShipyardSocketMessage(SHIPYARD_MESSAGE_TYPES.SNAPSHOT, {
        projection,
        revision: session.revision,
        sessionOwnerId: session.sessionOwnerId,
        targetUserId: senderUserId
      })
    );
    return;
  }

  if (message.type === SHIPYARD_MESSAGE_TYPES.SNAPSHOT) {
    if (message.targetUserId && message.targetUserId !== game.user?.id) return;
    onProjectionReceived?.(
      message.projection ? cloneProjection(message.projection) : null,
      {
        revision: message.revision ?? null,
        cleared: Boolean(message.projection?.cleared),
        sessionOwnerId: message.sessionOwnerId ?? null,
        fromSnapshot: true
      }
    );
  }
}

/**
 * @param {object} message
 */
export function emitShipyardMessage(message) {
  if (!game.socket || !game.user?.id) return;
  game.socket.emit(SHIPYARD_SOCKET_EVENT, {
    ...message,
    _senderUserId: game.user.id
  });
}

export function broadcastShipyardProjection(projection, sessionMeta = {}) {
  if (!game.user?.isGM) return;
  if (!projection || projection.cleared) {
    emitShipyardMessage(
      createShipyardSocketMessage(SHIPYARD_MESSAGE_TYPES.DRAFT_CLEARED, {
        revision: sessionMeta.revision ?? projection?.revision ?? 0,
        sessionOwnerId: sessionMeta.sessionOwnerId ?? null
      })
    );
    return;
  }
  emitShipyardMessage(
    createShipyardSocketMessage(SHIPYARD_MESSAGE_TYPES.DRAFT_UPDATED, {
      revision: projection.revision,
      projection,
      sessionOwnerId: sessionMeta.sessionOwnerId ?? projection.sessionOwnerId
    })
  );
}

export function requestShipyardSnapshot() {
  emitShipyardMessage(
    createShipyardSocketMessage(SHIPYARD_MESSAGE_TYPES.REQUEST_SNAPSHOT, {})
  );
}

export function registerShipyardSockets() {
  if (!game.socket) {
    logWarn("[Shipyard] game.socket unavailable");
    return;
  }
  game.socket.on(SHIPYARD_SOCKET_EVENT, (envelope, foundrySenderId) => {
    if (!envelope || typeof envelope !== "object") return;
    const senderUserId = String(
      typeof foundrySenderId === "string" && foundrySenderId
        ? foundrySenderId
        : envelope._senderUserId ?? ""
    );
    const { _senderUserId: _ignored, ...message } = envelope;
    handleInbound(message, senderUserId);
  });
}
