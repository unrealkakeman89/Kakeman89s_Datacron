/**
 * AstroCom role predicates for Foundry USER_ROLES:
 * NONE=0, PLAYER=1, TRUSTED=2, ASSISTANT=3, GAMEMASTER=4
 */

export const ASTROCOM_ROLES = Object.freeze({
  NONE: 0,
  PLAYER: 1,
  TRUSTED: 2,
  ASSISTANT: 3,
  GAMEMASTER: 4
});

export function resolveUserRole(user) {
  if (!user) return ASTROCOM_ROLES.NONE;
  if (typeof user.role === "number") return user.role;
  if (user.isGM) return ASTROCOM_ROLES.GAMEMASTER;
  return ASTROCOM_ROLES.NONE;
}

/** Player and above may browse/search/open player-visible Journals. */
export function canBrowseAstroCom(user) {
  return resolveUserRole(user) >= ASTROCOM_ROLES.PLAYER;
}

/** GM and Assistant GM may view source/provenance/conflict detail. */
export function canViewAstroComSourceDetail(user) {
  return resolveUserRole(user) >= ASTROCOM_ROLES.ASSISTANT;
}

/**
 * Full GM only, and only in known development worlds.
 * Production MVP worlds must not expose pack mutation.
 */
export function canRunAstroComDevRebuild(user, worldId, { pocWorldId, pilotWorldId } = {}) {
  if (resolveUserRole(user) < ASTROCOM_ROLES.GAMEMASTER) return false;
  if (!worldId) return false;
  return worldId === pocWorldId || worldId === pilotWorldId;
}

export function canChangeAstroComFeatureSetting(user) {
  return resolveUserRole(user) >= ASTROCOM_ROLES.GAMEMASTER;
}
