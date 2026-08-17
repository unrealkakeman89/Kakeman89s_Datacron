/**
 * Ability / point-buy family — Excel ROUNDDOWN ability modifiers.
 */

/**
 * Excel ROUNDDOWN toward zero for integer digit precision.
 * @param {number} value
 * @param {number} digits
 */
export function excelRoundDown(value, digits = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return NaN;
  const factor = 10 ** digits;
  let out;
  if (n >= 0) out = Math.floor(n * factor) / factor;
  else out = Math.ceil(n * factor) / factor;
  return Object.is(out, -0) ? 0 : out;
}

/**
 * Workbook formula family from H11-style cells:
 * ROUNDDOWN((score-10)/2, 0) minus 1 for odd scores in {9,7,5,3,1,-1,-3,-5}.
 * @param {number} score
 */
export function abilityModifierFromScore(score) {
  const total = Number(score);
  let mod = excelRoundDown((total - 10) / 2, 0);
  const oddNegatives = new Set([9, 7, 5, 3, 1, -1, -3, -5]);
  if (oddNegatives.has(total)) mod -= 1;
  return mod;
}

/**
 * @param {Record<string, number>} totals
 */
export function abilityModifiersFromTotals(totals) {
  return {
    str: abilityModifierFromScore(totals.str),
    dex: abilityModifierFromScore(totals.dex),
    con: abilityModifierFromScore(totals.con),
    int: abilityModifierFromScore(totals.int),
    wis: abilityModifierFromScore(totals.wis)
  };
}

/**
 * Apply authored size/role deltas to base ability scores.
 * @param {Record<string, number>} base
 * @param {{ str:number, dex:number, con:number, int:number, wis:number }} deltas
 */
export function applyAbilityDeltas(base, deltas) {
  return {
    str: base.str + deltas.str,
    dex: base.dex + deltas.dex,
    con: base.con + deltas.con,
    int: base.int + deltas.int,
    wis: base.wis + deltas.wis
  };
}
