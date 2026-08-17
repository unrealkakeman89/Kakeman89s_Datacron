/**
 * Shipyard permission predicates (Phase 9).
 * Pure functions — Foundry role numbers match USER_ROLES.
 */

export const SHIPYARD_ROLES = Object.freeze({
  NONE: 0,
  PLAYER: 1,
  TRUSTED: 2,
  ASSISTANT: 3,
  GAMEMASTER: 4
});

/**
 * @param {object|null|undefined} user
 */
export function resolveUserRole(user) {
  if (!user) return SHIPYARD_ROLES.NONE;
  if (typeof user.role === "number") return user.role;
  if (user.isGM === true) return SHIPYARD_ROLES.GAMEMASTER;
  return SHIPYARD_ROLES.NONE;
}

/**
 * @param {object|null|undefined} user
 * @param {{ featureEnabled?: boolean }} [options]
 */
export function canOpenShipyard(user, options = {}) {
  if (!options.featureEnabled) return false;
  return resolveUserRole(user) >= SHIPYARD_ROLES.PLAYER;
}

/**
 * Only full GM may edit the canonical draft.
 * @param {object|null|undefined} user
 * @param {{ featureEnabled?: boolean }} [options]
 */
export function canEditShipyardDraft(user, options = {}) {
  if (!options.featureEnabled) return false;
  return resolveUserRole(user) >= SHIPYARD_ROLES.GAMEMASTER;
}

/**
 * @param {object|null|undefined} user
 * @param {{ featureEnabled?: boolean, hasProjection?: boolean }} [options]
 */
export function canObserveShipyard(user, options = {}) {
  if (!options.featureEnabled) return false;
  if (resolveUserRole(user) >= SHIPYARD_ROLES.GAMEMASTER) return true;
  if (resolveUserRole(user) < SHIPYARD_ROLES.PLAYER) return false;
  return options.hasProjection !== false;
}

/**
 * @param {object|null|undefined} user
 * @param {{ featureEnabled?: boolean }} [options]
 */
export function canResetShipyardDraft(user, options = {}) {
  return canEditShipyardDraft(user, options);
}

/**
 * @param {object|null|undefined} user
 * @param {{ featureEnabled?: boolean }} [options]
 */
export function canPublishShipyardProjection(user, options = {}) {
  return canEditShipyardDraft(user, options);
}

/**
 * @param {object|null|undefined} user
 * @param {{ featureEnabled?: boolean }} [options]
 */
export function canRequestShipyardSnapshot(user, options = {}) {
  return canOpenShipyard(user, options);
}
