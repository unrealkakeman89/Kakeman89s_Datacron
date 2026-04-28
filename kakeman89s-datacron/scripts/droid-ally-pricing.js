export const DROID_CLASS_PRESETS = [
  {
    id: "class-i",
    chassisCostRank: 1,
    labelKey: "KAKEMAN89SDATACRON.DroidAlly.Class.ClassI",
    helpKey: "KAKEMAN89SDATACRON.DroidAlly.ClassHelp.ClassI"
  },
  {
    id: "class-ii",
    chassisCostRank: 2,
    labelKey: "KAKEMAN89SDATACRON.DroidAlly.Class.ClassII",
    helpKey: "KAKEMAN89SDATACRON.DroidAlly.ClassHelp.ClassII"
  },
  {
    id: "class-iii",
    chassisCostRank: 3,
    labelKey: "KAKEMAN89SDATACRON.DroidAlly.Class.ClassIII",
    helpKey: "KAKEMAN89SDATACRON.DroidAlly.ClassHelp.ClassIII"
  },
  {
    id: "class-iv",
    chassisCostRank: 4,
    labelKey: "KAKEMAN89SDATACRON.DroidAlly.Class.ClassIV",
    helpKey: "KAKEMAN89SDATACRON.DroidAlly.ClassHelp.ClassIV"
  },
  {
    id: "class-v",
    chassisCostRank: 5,
    labelKey: "KAKEMAN89SDATACRON.DroidAlly.Class.ClassV",
    helpKey: "KAKEMAN89SDATACRON.DroidAlly.ClassHelp.ClassV"
  },
  {
    id: "tracker",
    chassisCostRank: 2,
    labelKey: "KAKEMAN89SDATACRON.DroidAlly.Class.Tracker",
    helpKey: "KAKEMAN89SDATACRON.DroidAlly.ClassHelp.Tracker"
  },
  {
    id: "custom",
    chassisCostRank: 1,
    labelKey: "KAKEMAN89SDATACRON.DroidAlly.Class.Custom",
    helpKey: "KAKEMAN89SDATACRON.DroidAlly.ClassHelp.Custom"
  }
];

const PRESETS_BY_ID = new Map(DROID_CLASS_PRESETS.map((p) => [p.id, p]));

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

export function normalizeDroidAllyInput(input = {}) {
  const preset = PRESETS_BY_ID.get(input.droidClass) ?? PRESETS_BY_ID.get("class-ii");
  return {
    droidName: String(input.droidName ?? "").trim(),
    droidClass: preset.id,
    companionLevel: nonNegativeInteger(input.companionLevel, 1),
    systemsCost: nonNegativeInteger(input.systemsCost, 0),
    abilityModifierTotal: Math.trunc(toFiniteNumber(input.abilityModifierTotal, 0)),
    traitProtocolCount: nonNegativeInteger(input.traitProtocolCount, 0),
    trainedSkillToolCount: nonNegativeInteger(input.trainedSkillToolCount, 0),
    featUpgradeCount: nonNegativeInteger(input.featUpgradeCount, 0)
  };
}

export function getDroidClassPreset(id) {
  return PRESETS_BY_ID.get(id) ?? PRESETS_BY_ID.get("class-ii");
}

export function formatCredits(amount) {
  const n = nonNegativeInteger(amount, 0);
  return `${n.toLocaleString()} credits`;
}

export function calculateDroidAllyPrice(input = {}) {
  const normalized = normalizeDroidAllyInput(input);
  const classPreset = getDroidClassPreset(normalized.droidClass);
  const baseChassisCost = classPreset.chassisCostRank * 1000;
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
  const finalCost = Math.floor(subtotal / 2);

  return {
    input: normalized,
    classPreset,
    subtotal,
    finalCost,
    breakdown: [
      {
        key: "baseChassisCost",
        labelKey: "KAKEMAN89SDATACRON.DroidAlly.Breakdown.BaseChassis",
        formula: "Class chassis value",
        amount: baseChassisCost
      },
      {
        key: "systemsCost",
        labelKey: "KAKEMAN89SDATACRON.DroidAlly.Breakdown.Systems",
        formula: "GM-entered value",
        amount: systemsCost
      },
      {
        key: "abilityCost",
        labelKey: "KAKEMAN89SDATACRON.DroidAlly.Breakdown.Abilities",
        formula: `max(0, ${normalized.abilityModifierTotal}) x 1,000`,
        amount: abilityCost
      },
      {
        key: "traitProtocolCost",
        labelKey: "KAKEMAN89SDATACRON.DroidAlly.Breakdown.Traits",
        formula: `${normalized.traitProtocolCount} x 2,000`,
        amount: traitProtocolCost
      },
      {
        key: "proficiencyCost",
        labelKey: "KAKEMAN89SDATACRON.DroidAlly.Breakdown.Proficiencies",
        formula: `${normalized.trainedSkillToolCount} x 500`,
        amount: proficiencyCost
      },
      {
        key: "featOrUpgradeCost",
        labelKey: "KAKEMAN89SDATACRON.DroidAlly.Breakdown.Feats",
        formula: `${normalized.featUpgradeCount} x 1,000`,
        amount: featOrUpgradeCost
      },
      {
        key: "levelCost",
        labelKey: "KAKEMAN89SDATACRON.DroidAlly.Breakdown.Level",
        formula: `${normalized.companionLevel} x 1,000`,
        amount: levelCost
      }
    ]
  };
}

