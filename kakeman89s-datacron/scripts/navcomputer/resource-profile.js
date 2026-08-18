export const RESOURCE_PROFILE_EXISTING_UNVERIFIED = Object.freeze({
  id: "existing-unverified.v1",
  displayName: "Existing unverified house-rule profile",
  version: 1,
  sourceStatus: "existing-house-rule",
  fuelUnit: "Fuel Cells",
  foodUnit: "Ration Packs",
  suppliesUnit: "Supply Packs",
  crewFallback: 4,
  defaultFuelPerHour: 1,
  defaultFoodPerCrewPerDay: 1,
  fuelFormula: "ceil(hours * fuelPerHour)",
  foodFormula: "ceil((hours / 24) * crewSize * foodPerCrewPerDay)",
  suppliesFormula: "ceil(foodRequired * 0.5)",
  rounding: "ceil-fuel-food-supplies; travel-days-display two-decimals",
  settingKeys: Object.freeze(["fuelPerHour", "foodPerCrewPerDay"])
});

function resolveRate(value, fallback, label, warnings) {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric >= 0) {
    return numeric;
  }
  warnings.push(`${label} was invalid; using profile default ${fallback}.`);
  return fallback;
}

/**
 * Pure house-rule resource application. Not SW5e RAW.
 * @param {{ hours: number, crewSize: number, fuelRate: number, foodRate: number }} input
 */
export function applyResourceProfile(input) {
  const profile = RESOURCE_PROFILE_EXISTING_UNVERIFIED;
  const warnings = [];
  const hoursRaw = Number(input?.hours);
  const hours = Number.isFinite(hoursRaw) && hoursRaw >= 0 ? hoursRaw : 0;
  const crewRaw = Number(input?.crewSize);
  const crewSize = Number.isFinite(crewRaw) && crewRaw > 0 ? crewRaw : profile.crewFallback;
  const fuelRate = resolveRate(input?.fuelRate, profile.defaultFuelPerHour, "Fuel per hour", warnings);
  const foodRate = resolveRate(
    input?.foodRate,
    profile.defaultFoodPerCrewPerDay,
    "Food per crew per day",
    warnings
  );

  const travelDays = hours / 24;
  const fuelRequired = Math.ceil(hours * fuelRate);
  const foodRequired = Math.ceil(travelDays * crewSize * foodRate);
  const suppliesRequired = Math.ceil(foodRequired * 0.5);
  const travelDaysDisplay = (Math.round(travelDays * 100) / 100).toFixed(2);

  return {
    resourceProfileId: profile.id,
    resourceProfileName: profile.displayName,
    sourceStatus: profile.sourceStatus,
    fuelUnit: profile.fuelUnit,
    foodUnit: profile.foodUnit,
    suppliesUnit: profile.suppliesUnit,
    crewSize,
    fuelRate,
    foodRate,
    fuelRateCustomized: fuelRate !== profile.defaultFuelPerHour,
    foodRateCustomized: foodRate !== profile.defaultFoodPerCrewPerDay,
    travelTimeHours: hours,
    travelDays,
    fuelRequired,
    foodRequired,
    suppliesRequired,
    travelDaysDisplay,
    warnings
  };
}
