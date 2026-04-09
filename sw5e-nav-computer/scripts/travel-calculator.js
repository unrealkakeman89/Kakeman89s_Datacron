import { MODULE_ID } from "./logger.js";
import { REGION_ORDER } from "./route-calculator.js";
import { SETTING_KEYS } from "./settings.js";

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

/**
 * @param {string | null | undefined} originRegion
 * @param {string | null | undefined} destinationRegion
 * @param {string} mode
 * @param {number} [laneCount=0]
 * @returns {{ dc: number, modifiers: string[] }}
 */
export function getPilotingCheckDC(originRegion, destinationRegion, mode, laneCount = 0) {
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

  if (mode !== "basic" && laneCount > 0) {
    const add = laneCount;
    dc += add;
    modifiers.push(
      game.i18n.format("SW5ENAVCOMPUTER.Travel.DcModifierLaneHops", {
        total: add,
        hops: laneCount
      })
    );
  }

  return { dc, modifiers };
}
