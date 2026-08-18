const OBSERVER = 2;

/**
 * @param {object | null | undefined} user
 * @param {{ featureEnabled?: boolean }} [options]
 * @returns {boolean}
 */
export function canOpenNavComputer(user, options = {}) {
  if (!options.featureEnabled) return false;
  if (!user?.id) return false;
  return true;
}

/**
 * Preserve Foundry observer-or-better visibility. Do not list GM-only Actors to players.
 * @param {object | null | undefined} actor
 * @param {object | null | undefined} user
 * @returns {boolean}
 */
export function actorIsVisibleToUser(actor, user) {
  if (!actor || !user) return false;
  if (user.isGM) return true;
  if (typeof actor.testUserPermission === "function") {
    return Boolean(actor.testUserPermission(user, "OBSERVER"));
  }
  const ownership = actor.ownership ?? {};
  const level = ownership[user.id] ?? ownership.default ?? 0;
  return Number(level) >= OBSERVER;
}
