/**
 * Creation eligibility. Pure. Does not write documents.
 */
import { canFinalizeShipyardBuild } from "../permissions.js";
import { BUILD_STATUSES } from "../schema.js";
import { TARGET_SCHEMA_PROFILE } from "./mapping-schema.js";
import { validateMappedActor } from "./validate-mapping.js";
import { previewIsCurrent } from "./preview.js";

export { canFinalizeShipyardBuild };

function duplicateNameExists(actorName, existingActors = []) {
  const wanted = String(actorName ?? "").trim();
  if (!wanted) return false;
  return existingActors.some(
    (actor) => String(actor?.name ?? "").trim() === wanted
  );
}

/**
 * @param {{
 *   user: object,
 *   featureEnabled: boolean,
 *   draft: object,
 *   calculation?: object,
 *   mapping: object,
 *   preview: object,
 *   options: object,
 *   profile?: object,
 *   existingActors?: object[],
 *   operationRunning?: boolean,
 *   consumedOperationIds?: string[],
 *   sessionOwnerId?: string|null,
 *   currentUserId?: string|null
 * }} input
 */
export function evaluateCreationEligibility(input = {}) {
  const errors = [];
  const user = input.user;
  const featureEnabled = Boolean(input.featureEnabled);
  const draft = input.draft;
  const calculation = input.calculation ?? draft?.calculation;
  const mapping = input.mapping;
  const preview = input.preview;
  const options = input.options ?? {};
  const profile = input.profile ?? TARGET_SCHEMA_PROFILE;
  const actorName = String(options.actorName ?? mapping?.actorSource?.name ?? "").trim();

  if (!canFinalizeShipyardBuild(user, { featureEnabled })) {
    errors.push("gm-required");
  }
  if (!featureEnabled) errors.push("feature-disabled");
  if (!draft || draft.cleared) errors.push("draft-missing");
  if (draft && input.expectedRevision != null && Number(draft.revision) !== Number(input.expectedRevision)) {
    errors.push("revision-mismatch");
  }
  const sessionOwnerId = input.sessionOwnerId ?? draft?.sessionOwnerId ?? null;
  const currentUserId = input.currentUserId ?? user?.id ?? null;
  if (sessionOwnerId && currentUserId && sessionOwnerId !== currentUserId) {
    errors.push("session-owner-mismatch");
  }
  if (!calculation?.ok || calculation.status !== BUILD_STATUSES.SUCCESS) {
    errors.push("calculation-invalid");
  }
  if (Array.isArray(calculation?.errors) && calculation.errors.length) {
    if (calculation.errors.some((err) => err?.code === "unsupported-combination")) {
      errors.push("unsupported-combination");
    }
  }
  if (!actorName) errors.push("actor-name-required");
  if (!profile?.id) errors.push("target-profile-missing");
  if (!profile?.verifiedLive) errors.push("target-profile-unverified");
  const mappingCheck = validateMappedActor(mapping, profile);
  if (!mappingCheck.ok) errors.push(...mappingCheck.errors);
  if (!preview || !previewIsCurrent(preview, mapping, draft, calculation, options)) {
    errors.push("preview-stale");
  }
  if (input.operationRunning) errors.push("operation-running");
  const operationId = options.operationId ?? preview?.operationId;
  if (operationId && (input.consumedOperationIds ?? []).includes(operationId)) {
    errors.push("operation-consumed");
  }
  if (duplicateNameExists(actorName, input.existingActors)) {
    errors.push("duplicate-name");
  }
  if (input.usingPlayerProjection) {
    errors.push("player-projection-not-authority");
  }

  const unique = [...new Set(errors)];
  return {
    ok: unique.length === 0,
    errors: unique,
    canCreate: unique.length === 0
  };
}
