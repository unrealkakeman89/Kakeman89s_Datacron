/**
 * Human-readable travel duration from hours; uses integer minutes to avoid float noise.
 * @param {number} totalHours
 * @returns {string}
 */
export function formatTravelTime(totalHours) {
  const unknown =
    typeof game !== "undefined" && game?.i18n?.localize
      ? game.i18n.localize("SWNAVCOMP.Results.UnknownTime")
      : "Unknown duration";
  const lessThanOne =
    typeof game !== "undefined" && game?.i18n?.localize
      ? game.i18n.localize("SWNAVCOMP.Results.LessThanOneMinute")
      : "Less than 1 minute";

  const h = Number(totalHours);
  if (!Number.isFinite(h) || h < 0) {
    return unknown;
  }

  const totalMins = Math.round(h * 60);
  const minsPerDay = 24 * 60;
  const days = Math.floor(totalMins / minsPerDay);
  const remAfterDays = totalMins % minsPerDay;
  const hoursRem = Math.floor(remAfterDays / 60);
  const minsRem = remAfterDays % 60;

  if (days === 0 && hoursRem === 0 && minsRem === 0) {
    return lessThanOne;
  }

  const parts = [];
  if (days !== 0) {
    parts.push(`${days} day${days === 1 ? "" : "s"}`);
  }
  if (hoursRem !== 0) {
    parts.push(`${hoursRem} hour${hoursRem === 1 ? "" : "s"}`);
  }
  if (minsRem !== 0) {
    parts.push(`${minsRem} minute${minsRem === 1 ? "" : "s"}`);
  }
  return parts.join(", ");
}
