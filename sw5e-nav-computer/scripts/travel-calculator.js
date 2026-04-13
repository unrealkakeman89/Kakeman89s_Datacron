import { MODULE_ID } from "./logger.js";
import { REGION_ORDER } from "./route-calculator.js";
import { SETTING_KEYS } from "./settings.js";
import { formatTravelTime } from "./time-display.js";

export { formatTravelTime } from "./time-display.js";

const DEFAULT_CREW_SIZE = 4;

/**
 * Phase 0 / compatibility-notes crew resolution for SW5E starship actors.
 * @param {Actor | null | undefined} shipActor
 * @returns {number | null} null if no usable crew data (caller defaults to 4)
 */
export function getCrewSizeFromShipActor(shipActor) {
  if (!shipActor?.system) return null;

  const sys =
    typeof shipActor.system.toObject === "function" ? shipActor.system.toObject() : shipActor.system;

  const items = sys.attributes?.deployment?.crew?.items;
  if (Array.isArray(items) && items.length > 0) return items.length;

  const crewMin = sys.attributes?.equip?.size?.crewMinWorkforce;
  const minNum = Number(crewMin);
  if (Number.isFinite(minNum) && minNum > 0) return Math.ceil(minNum);

  return null;
}

/**
 * @param {number} travelTimeHours
 * @param {Actor | null | undefined} shipActor
 * @returns {object}
 */
export function calculateTravelResources(travelTimeHours, shipActor) {
  const hours = Number(travelTimeHours);
  const safeHours = Number.isFinite(hours) && hours >= 0 ? hours : 0;

  const fuelPerHour = Number(game.settings?.get?.(MODULE_ID, SETTING_KEYS.fuelPerHour) ?? 1);
  const foodPerCrewPerDay = Number(game.settings?.get?.(MODULE_ID, SETTING_KEYS.foodPerCrewPerDay) ?? 1);
  const fuelRate = Number.isFinite(fuelPerHour) && fuelPerHour >= 0 ? fuelPerHour : 1;
  const foodRate = Number.isFinite(foodPerCrewPerDay) && foodPerCrewPerDay >= 0 ? foodPerCrewPerDay : 1;

  const crewSize = getCrewSizeFromShipActor(shipActor) ?? DEFAULT_CREW_SIZE;

  const travelDays = safeHours / 24;
  const fuelRequired = Math.ceil(safeHours * fuelRate);
  const foodRequired = Math.ceil(travelDays * crewSize * foodRate);
  const suppliesRequired = Math.ceil(foodRequired * 0.5);

  return {
    travelTimeHours: safeHours,
    travelTimeFormatted: formatTravelTime(safeHours),
    travelDays,
    crewSize,
    fuelRequired,
    foodRequired,
    suppliesRequired,
    fuelUnit: "Fuel Cells",
    foodUnit: "Ration Packs",
    travelDaysDisplay: (Math.round(travelDays * 100) / 100).toFixed(2)
  };
}

const MAX_HOP_DC_CONTRIB = 20;
const MAX_DANGER_CONTRIB = 30;

/**
 * @param {string | null | undefined} originRegion
 * @param {string | null | undefined} destinationRegion
 * @param {string} mode
 * @param {number} [curatedHops=0] Charted hyperspace hops (+1 DC each toward hop cap).
 * @param {number} [syntheticHops=0] Synthetic / transit hops (+2 DC each toward hop cap).
 * @param {number} [laneDcBonus=0] Sum of per-hop lane DC bonuses (Advanced curated path).
 * @param {number} [pathMaxTier=0] Highest hyperspace tier used along the path (for display).
 * @returns {{ dc: number, modifiers: string[] }}
 */
export function getPilotingCheckDC(
  originRegion,
  destinationRegion,
  mode,
  curatedHops = 0,
  syntheticHops = 0,
  laneDcBonus = 0,
  pathMaxTier = 0
) {
  const modifiers = [];
  let dc = 10;
  modifiers.push(game.i18n.localize("SW5ENAVCOMPUTER.Travel.DcModifierBase"));

  const oi = REGION_ORDER.indexOf(originRegion ?? "");
  const di = REGION_ORDER.indexOf(destinationRegion ?? "");

  if (oi >= 0 && di >= 0 && di > oi) {
    const outwardSteps = di - oi;
    const add = outwardSteps * 2;
    dc += add;
    modifiers.push(
      game.i18n.format("SW5ENAVCOMPUTER.Travel.DcModifierOutwardSteps", {
        total: add,
        steps: outwardSteps
      })
    );
  }

  if (destinationRegion === "Wild Space" || destinationRegion === "Unknown Regions") {
    dc += 5;
    modifiers.push(game.i18n.localize("SW5ENAVCOMPUTER.Travel.DcModifierRemoteDestination"));
  }

  if (mode !== "basic") {
    const curated = Math.max(0, Math.floor(Number(curatedHops) || 0));
    const synthetic = Math.max(0, Math.floor(Number(syntheticHops) || 0));
    const rawHopDc = curated * 1 + synthetic * 2;
    if (rawHopDc > 0) {
      const hopAdd = Math.min(rawHopDc, MAX_HOP_DC_CONTRIB);
      dc += hopAdd;
      if (rawHopDc > MAX_HOP_DC_CONTRIB) {
        modifiers.push(
          game.i18n.format("SW5ENAVCOMPUTER.Travel.DcModifierHyperspaceHopsCapped", {
            total: hopAdd,
            max: MAX_HOP_DC_CONTRIB
          })
        );
      } else {
        modifiers.push(
          game.i18n.format("SW5ENAVCOMPUTER.Travel.DcModifierHyperspaceHops", {
            total: hopAdd,
            curated,
            synthetic
          })
        );
      }
    }

    const dangerRaw = Number(laneDcBonus);
    const safeDangerRaw =
      Number.isFinite(dangerRaw) && dangerRaw > 0 ? Math.floor(dangerRaw) : 0;
    if (safeDangerRaw > 0) {
      const dangerAdd = Math.min(safeDangerRaw, MAX_DANGER_CONTRIB);
      dc += dangerAdd;
      if (safeDangerRaw > MAX_DANGER_CONTRIB) {
        modifiers.push(
          game.i18n.format("SW5ENAVCOMPUTER.Travel.DcModifierLaneRouteBonusCapped", {
            total: dangerAdd,
            max: MAX_DANGER_CONTRIB
          })
        );
      } else {
        modifiers.push(
          game.i18n.format("SW5ENAVCOMPUTER.Travel.DcModifierLaneRouteBonus", { total: dangerAdd })
        );
      }
    }
    const maxT = Number(pathMaxTier);
    if (Number.isFinite(maxT) && maxT >= 1) {
      modifiers.push(
        game.i18n.format("SW5ENAVCOMPUTER.Travel.DcModifierPathMaxTierNote", { tier: maxT })
      );
    }
  }

  return { dc, modifiers };
}
