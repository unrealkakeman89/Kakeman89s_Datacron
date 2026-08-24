export const DROID_ALLY_PRICING_DIVISOR = 2;
export const DROID_ALLY_UNKNOWN_PRESET_FALLBACK_ID = "class-ii";

export const DROID_CLASS_PRESETS = Object.freeze([
  Object.freeze({
    id: "class-i",
    chassisCostRank: 1,
    labelKey: "KAKEMAN89SDATACRON.DroidAllyPricing.Class.ClassI"
  }),
  Object.freeze({
    id: "class-ii",
    chassisCostRank: 2,
    labelKey: "KAKEMAN89SDATACRON.DroidAllyPricing.Class.ClassII"
  }),
  Object.freeze({
    id: "class-iii",
    chassisCostRank: 3,
    labelKey: "KAKEMAN89SDATACRON.DroidAllyPricing.Class.ClassIII"
  }),
  Object.freeze({
    id: "class-iv",
    chassisCostRank: 4,
    labelKey: "KAKEMAN89SDATACRON.DroidAllyPricing.Class.ClassIV"
  }),
  Object.freeze({
    id: "class-v",
    chassisCostRank: 5,
    labelKey: "KAKEMAN89SDATACRON.DroidAllyPricing.Class.ClassV"
  }),
  Object.freeze({
    id: "tracker",
    chassisCostRank: 2,
    labelKey: "KAKEMAN89SDATACRON.DroidAllyPricing.Class.Tracker"
  }),
  Object.freeze({
    id: "custom",
    chassisCostRank: 1,
    labelKey: "KAKEMAN89SDATACRON.DroidAllyPricing.Class.Custom"
  })
]);

const PRESETS_BY_ID = new Map(DROID_CLASS_PRESETS.map((p) => [p.id, p]));

function asInputObject(input) {
  if (input == null) return {};
  if (typeof input !== "object" || Array.isArray(input)) return {};
  return input;
}

function toFiniteNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function nonNegativeInteger(value, fallback = 0) {
  return Math.max(0, Math.floor(toFiniteNumber(value, fallback)));
}

export function defaultDroidAllyInput() {
  const preset = PRESETS_BY_ID.get("class-ii");
  return {
    droidName: "",
    droidClass: preset.id,
    companionLevel: 1,
    systemsCost: 0,
    abilityModifierTotal: 0,
    traitProtocolCount: 0,
    trainedSkillToolCount: 0,
    featUpgradeCount: 0
  };
}

export function getDroidClassPreset(id) {
  return PRESETS_BY_ID.get(id) ?? PRESETS_BY_ID.get(DROID_ALLY_UNKNOWN_PRESET_FALLBACK_ID);
}

export function normalizeDroidAllyInput(input = {}) {
  const raw = asInputObject(input);
  const requestedPresetId =
    raw.droidClass == null || raw.droidClass === "" ? null : String(raw.droidClass);
  const known = requestedPresetId ? PRESETS_BY_ID.get(requestedPresetId) : null;
  const preset = known ?? PRESETS_BY_ID.get(DROID_ALLY_UNKNOWN_PRESET_FALLBACK_ID);
  return {
    droidName: String(raw.droidName ?? "").trim(),
    droidClass: preset.id,
    requestedPresetId,
    presetFallback: Boolean(requestedPresetId && !known),
    companionLevel: nonNegativeInteger(raw.companionLevel, 1),
    systemsCost: nonNegativeInteger(raw.systemsCost, 0),
    abilityModifierTotal: Math.trunc(toFiniteNumber(raw.abilityModifierTotal, 0)),
    traitProtocolCount: nonNegativeInteger(raw.traitProtocolCount, 0),
    trainedSkillToolCount: nonNegativeInteger(raw.trainedSkillToolCount, 0),
    featUpgradeCount: nonNegativeInteger(raw.featUpgradeCount, 0)
  };
}

export function formatCredits(amount) {
  const n = nonNegativeInteger(amount, 0);
  return `${n.toLocaleString()} credits`;
}

function buildExplanation(result) {
  const lines = [];
  lines.push(`Selected preset: ${result.preset.id}`);
  if (result.requestedPresetId && result.requestedPresetId !== result.preset.id) {
    lines.push(`Requested preset: ${result.requestedPresetId}`);
    lines.push(`Unknown preset fallback: ${result.preset.id}`);
  }
  lines.push(`Chassis-cost rank: ${result.chassisCostRank}`);
  lines.push(`Rank multiplied by 1000: ${result.chassisCostRank} × 1000`);
  lines.push(`Base chassis cost: ${result.baseChassisCost}`);
  for (const item of result.lineItems) {
    lines.push(`${item.key}: ${item.formula} = ${item.amount}`);
  }
  if (result.preset.id === "custom") {
    lines.push("Custom preset: chassis rank 1 (no separate custom rank input).");
  }
  lines.push(`Subtotal: ${result.subtotal}`);
  lines.push(`Division by two: ${result.subtotal} / ${result.divisor}`);
  lines.push(`Math.floor application: ${result.rounding}`);
  lines.push(`Final price: ${result.finalCost}`);
  if (result.warnings.length) {
    for (const warning of result.warnings) lines.push(`Warning: ${warning}`);
  }
  lines.push(`Result status: ${result.status}`);
  return { lines };
}

/**
 * Sole Droid Ally Pricing authority. Pure JavaScript. Not SW5e RAW.
 * @param {object | null | undefined} input
 */
export function calculateDroidAllyPrice(input = {}) {
  const normalized = normalizeDroidAllyInput(input);
  const classPreset = getDroidClassPreset(normalized.droidClass);
  const chassisCostRank = classPreset.chassisCostRank;
  const baseChassisCost = chassisCostRank * 1000;
  const systemsCost = normalized.systemsCost;
  const abilityCost = Math.max(0, normalized.abilityModifierTotal) * 1000;
  const traitProtocolCost = normalized.traitProtocolCount * 2000;
  const proficiencyCost = normalized.trainedSkillToolCount * 500;
  const featOrUpgradeCost = normalized.featUpgradeCount * 1000;
  const levelCost = normalized.companionLevel * 1000;
  const subtotal =
    baseChassisCost +
    systemsCost +
    abilityCost +
    traitProtocolCost +
    proficiencyCost +
    featOrUpgradeCost +
    levelCost;
  const finalCost = Math.floor(subtotal / DROID_ALLY_PRICING_DIVISOR);
  const warnings = [];
  if (normalized.presetFallback) {
    warnings.push(
      `Unknown preset "${normalized.requestedPresetId}" fell back to ${DROID_ALLY_UNKNOWN_PRESET_FALLBACK_ID}.`
    );
  }

  const lineItems = [
    {
      key: "baseChassisCost",
      labelKey: "KAKEMAN89SDATACRON.DroidAllyPricing.Line.BaseChassis",
      formula: `${chassisCostRank} × 1000`,
      amount: baseChassisCost
    },
    {
      key: "systemsCost",
      labelKey: "KAKEMAN89SDATACRON.DroidAllyPricing.Line.Systems",
      formula: "GM-entered credits",
      amount: systemsCost
    },
    {
      key: "abilityCost",
      labelKey: "KAKEMAN89SDATACRON.DroidAllyPricing.Line.Abilities",
      formula: `max(0, ${normalized.abilityModifierTotal}) × 1,000`,
      amount: abilityCost
    },
    {
      key: "traitProtocolCost",
      labelKey: "KAKEMAN89SDATACRON.DroidAllyPricing.Line.TraitsProtocols",
      formula: `${normalized.traitProtocolCount} × 2,000`,
      amount: traitProtocolCost
    },
    {
      key: "proficiencyCost",
      labelKey: "KAKEMAN89SDATACRON.DroidAllyPricing.Line.SkillsTools",
      formula: `${normalized.trainedSkillToolCount} × 500`,
      amount: proficiencyCost
    },
    {
      key: "featOrUpgradeCost",
      labelKey: "KAKEMAN89SDATACRON.DroidAllyPricing.Line.Feats",
      formula: `${normalized.featUpgradeCount} × 1,000`,
      amount: featOrUpgradeCost
    },
    {
      key: "levelCost",
      labelKey: "KAKEMAN89SDATACRON.DroidAllyPricing.Line.CompanionLevel",
      formula: `${normalized.companionLevel} × 1,000`,
      amount: levelCost
    }
  ];

  const result = {
    ok: true,
    status: warnings.length ? "warning" : "ok",
    input: normalized,
    normalizedInput: normalized,
    classPreset,
    preset: classPreset,
    requestedPresetId: normalized.requestedPresetId,
    chassisCostRank,
    baseChassisCost,
    lineItems,
    breakdown: lineItems,
    subtotal,
    divisor: DROID_ALLY_PRICING_DIVISOR,
    finalCost,
    rounding: "Math.floor(subtotal / 2)",
    warnings,
    errors: []
  };
  result.explanation = buildExplanation(result);
  return result;
}
