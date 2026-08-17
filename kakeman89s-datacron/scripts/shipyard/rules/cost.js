/**
 * Cost aggregation family — workbook-vector profiles.
 */
import { profileMatches } from "./size.js";

/**
 * @param {Record<string, unknown>} input
 * @param {{ profiles: Array<{ id: string, match: Record<string, unknown>, result: Record<string, unknown> }> }} table
 */
export function findCostProfile(input, table) {
  for (const profile of table.profiles) {
    if (profileMatches(input, profile.match)) return profile;
  }
  return null;
}

/**
 * Aggregate cost fields from a profile result.
 * Order documented for Phase 8: totalNoMisc + miscTotal = grandTotal (when both numeric).
 * @param {Record<string, unknown>} profileResult
 */
export function aggregateCosts(profileResult) {
  const totalNoMisc = Number(profileResult.totalNoMisc ?? 0);
  const miscTotal = Number(profileResult.miscTotal ?? 0);
  const weaponContribution = Number(profileResult.weaponContribution ?? 0);
  const suiteContribution = Number(profileResult.suiteContribution ?? 0);
  const grandTotal =
    profileResult.grandTotal != null
      ? Number(profileResult.grandTotal)
      : totalNoMisc + miscTotal;

  return {
    weaponContribution,
    suiteContribution,
    totalNoMisc,
    miscTotal,
    grandTotal,
    buildDays: Number(profileResult.buildDays ?? 0),
    buildDaysDisplay: profileResult.buildDaysDisplay ?? null,
    pointBuyTotal: Number(profileResult.pointBuyTotal ?? 0),
    hullPoints: Number(profileResult.hullPoints ?? 0),
    shieldPoints: Number(profileResult.shieldPoints ?? 0),
    suiteSlots: Number(profileResult.suiteSlots ?? 0),
    openSuites: Number(profileResult.openSuites ?? 0)
  };
}
