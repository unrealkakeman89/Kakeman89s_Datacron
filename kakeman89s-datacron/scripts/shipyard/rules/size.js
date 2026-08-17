/**
 * Size / tier / role matching helpers.
 */

/**
 * @param {unknown} size
 */
export function normalizeSize(size) {
  if (size == null) return "";
  return String(size).trim();
}

/**
 * @param {unknown} tier
 */
export function normalizeTier(tier) {
  if (tier == null || tier === "") return null;
  const n = Number(tier);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {Record<string, unknown>} input
 * @param {Record<string, unknown>} match
 */
export function profileMatches(input, match) {
  for (const [key, expected] of Object.entries(match)) {
    const actual = input[key];
    if (expected !== actual) return false;
  }
  return true;
}
