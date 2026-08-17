/**
 * Pure Shipyard calculation service (Phase 8).
 * No Foundry globals. Does not mutate caller input.
 */
import { loadAbilityAdjustments, loadCostProfiles } from "./options.js";
import {
  BUILD_STATUSES,
  normalizeAbilityBag,
  assertBuildInputShape
} from "./schema.js";
import { validateBuildInput } from "./validate.js";
import { buildExplanation, explainStep } from "./explain.js";
import {
  abilityModifiersFromTotals,
  applyAbilityDeltas
} from "./rules/ability.js";
import { findCostProfile, aggregateCosts } from "./rules/cost.js";
import { normalizeSize, normalizeTier } from "./rules/size.js";

/**
 * @param {Record<string, unknown>} input
 */
export function calculateBuild(input) {
  const shape = assertBuildInputShape(input);
  if (!shape.ok) {
    return {
      ok: false,
      status: BUILD_STATUSES.FAILED,
      result: null,
      explanation: buildExplanation([]),
      warnings: [],
      errors: [{ code: "invalid-input-shape", message: shape.error }]
    };
  }

  // Immutable copy — never mutate caller object.
  const snapshot = structuredClone(input);
  const validation = validateBuildInput(snapshot);
  const steps = [];

  steps.push(
    explainStep({
      id: "validate",
      category: "validation",
      label: "Validate required selections",
      inputs: { size: snapshot.size, tier: snapshot.tier, role: snapshot.role },
      operation: "validate",
      workbookEvidence: "B5 size list validation; empty size → #VALUE! costs"
    })
  );

  if (!validation.ok) {
    return {
      ok: false,
      status: BUILD_STATUSES.INVALID,
      result: {
        grandTotal: { state: "error", value: null, display: "#VALUE!" },
        totalNoMisc: { state: "error", value: null, display: "#VALUE!" },
        miscTotal: { state: "number", value: 0, display: "0cr" },
        buildDays: { state: "error", value: null, display: "#VALUE!" },
        validationState: "missing-size"
      },
      explanation: buildExplanation(steps),
      warnings: validation.warnings,
      errors: validation.errors
    };
  }

  const size = normalizeSize(snapshot.size);
  const tier = normalizeTier(snapshot.tier);
  const role = String(snapshot.role ?? "");
  const base = normalizeAbilityBag(snapshot.baseAbilities);

  const profiles = loadCostProfiles();
  const matchInput = {
    size,
    tier,
    role,
    primaryWeapon: snapshot.primaryWeapon,
    installState: snapshot.installState,
    lockState: snapshot.lockState,
    armor: snapshot.armor,
    quartersLiving: Number(snapshot.quartersLiving ?? 0)
  };
  const profile = findCostProfile(matchInput, profiles);
  if (!profile) {
    return {
      ok: false,
      status: BUILD_STATUSES.FAILED,
      result: null,
      explanation: buildExplanation(steps),
      warnings: validation.warnings,
      errors: [
        {
          code: "unsupported-combination",
          message:
            "No Phase 8 cost profile matches this input combination (workbook coverage incomplete)"
        }
      ]
    };
  }

  const adjTable = loadAbilityAdjustments();
  const adjEntry = adjTable.adjustments.find(
    (row) => row.size === size && row.role === role
  );
  const deltas = adjEntry?.deltas ?? { str: 0, dex: 0, con: 0, int: 0, wis: 0 };
  const computedTotals = applyAbilityDeltas(base, deltas);
  const abilityTotals = profile.result.abilityTotals
    ? normalizeAbilityBag(profile.result.abilityTotals)
    : computedTotals;
  const abilityModifiers = profile.result.abilityModifiers
    ? normalizeAbilityBag(profile.result.abilityModifiers)
    : abilityModifiersFromTotals(abilityTotals);

  steps.push(
    explainStep({
      id: "ability-adjust",
      category: "ability",
      label: "Apply size/role ability adjustments",
      inputs: { base, size, role },
      operation: "add-deltas",
      amount: deltas,
      workbookEvidence: "Size Adjustment / Tier 0 Role rows → H10:L10"
    })
  );
  steps.push(
    explainStep({
      id: "ability-mod",
      category: "ability",
      label: "Compute ability modifiers via ROUNDDOWN",
      inputs: abilityTotals,
      operation: "ROUNDDOWN((score-10)/2,0) with odd-score adjustment",
      amount: abilityModifiersFromTotals(abilityTotals),
      workbookEvidence: "H11:L11 Rounddown formulas"
    })
  );

  const costs = aggregateCosts(profile.result);
  steps.push(
    explainStep({
      id: "cost-profile",
      category: "cost",
      label: `Apply cost profile ${profile.id}`,
      inputs: matchInput,
      operation: "profile-lookup",
      amount: costs.grandTotal,
      runningTotal: costs.grandTotal,
      workbookEvidence: `${profile.id} evaluated Grand Total`
    })
  );
  steps.push(
    explainStep({
      id: "cost-aggregate",
      category: "cost",
      label: "Aggregate totalNoMisc + miscTotal",
      inputs: { totalNoMisc: costs.totalNoMisc, miscTotal: costs.miscTotal },
      operation: "sum",
      amount: costs.miscTotal,
      runningTotal: costs.grandTotal,
      workbookEvidence: "Total, no Misc + Misc. Total → Grand Total"
    })
  );

  const result = {
    profileId: profile.id,
    size,
    tier,
    role,
    abilityTotals,
    abilityModifiers,
    weaponContribution: costs.weaponContribution,
    suiteContribution: costs.suiteContribution,
    totalNoMisc: costs.totalNoMisc,
    miscTotal: costs.miscTotal,
    grandTotal: costs.grandTotal,
    buildDays: costs.buildDays,
    buildDaysDisplay: costs.buildDaysDisplay,
    pointBuyTotal: costs.pointBuyTotal,
    hullPoints: costs.hullPoints,
    shieldPoints: costs.shieldPoints,
    suiteSlots: costs.suiteSlots,
    openSuites: costs.openSuites,
    validationState: "ok"
  };

  return {
    ok: true,
    status: BUILD_STATUSES.SUCCESS,
    result,
    explanation: buildExplanation(steps),
    warnings: validation.warnings,
    errors: []
  };
}
