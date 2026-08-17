/**
 * Sanitized Shipyard player projection (Phase 9).
 * Never calculates costs — only reshapes calculateBuild output.
 */

export const PROJECTION_PROTOCOL_VERSION = 1;

const FORBIDDEN_KEYS = Object.freeze([
  "workbookPath",
  "workbookSha256",
  "capture",
  "capturedBy",
  "capturedAt",
  "excelCalculationMode",
  "notes",
  "formula",
  "formulas",
  "cell",
  "cells",
  "workbookEvidence",
  "actorCreate",
  "itemCreate",
  "createActor",
  "createItem",
  "documentCreate"
]);

/**
 * @param {unknown} value
 */
function sanitizeDisplayValue(value) {
  if (value == null) return null;
  if (typeof value === "number" || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "object" && "state" in value) {
    return {
      state: value.state ?? null,
      value: value.value ?? null,
      display: value.display ?? null
    };
  }
  return null;
}

/**
 * @param {unknown} explanation
 */
function sanitizeExplanation(explanation) {
  if (!explanation || typeof explanation !== "object") {
    return { stepCount: 0, steps: [] };
  }
  const steps = Array.isArray(explanation.steps) ? explanation.steps : [];
  return {
    stepCount: Number(explanation.stepCount ?? steps.length),
    steps: steps.map((step) => ({
      stepId: step?.stepId ?? null,
      category: step?.category ?? null,
      label: step?.label ?? null,
      operation: step?.operation ?? null,
      amount: step?.amount ?? null,
      runningTotal: step?.runningTotal ?? null,
      note: step?.note ?? null
    }))
  };
}

/**
 * Build a sanitized player projection from draft + calculateBuild output.
 * @param {{
 *   draft?: object|null,
 *   calculation?: object|null,
 *   revision?: number,
 *   sessionOwnerId?: string|null,
 *   cleared?: boolean,
 *   connectionState?: string,
 *   displayState?: string
 * }} parts
 */
export function buildProjection(parts = {}) {
  const draft = parts.draft ?? null;
  const calculation = parts.calculation ?? draft?.calculation ?? null;
  const revision = Number(parts.revision ?? draft?.revision ?? 0);
  const cleared = Boolean(parts.cleared ?? draft?.cleared ?? false);
  const connectionState = parts.connectionState ?? "connected";
  const result = calculation?.result ?? null;
  const status = calculation?.status ?? (cleared ? "cleared" : "empty");

  const selections = draft?.input
    ? {
        size: draft.input.size ?? "",
        tier: draft.input.tier ?? 0,
        role: draft.input.role ?? "",
        installState: draft.input.installState ?? "",
        lockState: draft.input.lockState ?? "",
        primaryWeapon: draft.input.primaryWeapon ?? "",
        armor: draft.input.armor ?? "",
        quartersBasic: draft.input.quartersBasic ?? 0,
        quartersLiving: draft.input.quartersLiving ?? 0
      }
    : null;

  const totals = {};
  if (result?.grandTotal && typeof result.grandTotal === "object" && "state" in result.grandTotal) {
    totals.grandTotal = sanitizeDisplayValue(result.grandTotal);
    totals.totalNoMisc = sanitizeDisplayValue(result.totalNoMisc);
    totals.miscTotal = sanitizeDisplayValue(result.miscTotal);
    totals.buildDays = sanitizeDisplayValue(result.buildDays);
    totals.buildDaysDisplay = null;
    totals.pointBuyTotal = null;
    totals.hullPoints = null;
    totals.shieldPoints = null;
    totals.suiteSlots = null;
    totals.openSuites = null;
    totals.validationState = result.validationState ?? null;
    totals.abilityTotals = null;
    totals.abilityModifiers = null;
  } else if (result) {
    totals.grandTotal = result.grandTotal ?? null;
    totals.totalNoMisc = result.totalNoMisc ?? null;
    totals.miscTotal = result.miscTotal ?? null;
    totals.buildDays = result.buildDays ?? null;
    totals.buildDaysDisplay = result.buildDaysDisplay ?? null;
    totals.pointBuyTotal = result.pointBuyTotal ?? null;
    totals.hullPoints = result.hullPoints ?? null;
    totals.shieldPoints = result.shieldPoints ?? null;
    totals.suiteSlots = result.suiteSlots ?? null;
    totals.openSuites = result.openSuites ?? null;
    totals.validationState = result.validationState ?? null;
    totals.abilityTotals = result.abilityTotals ?? null;
    totals.abilityModifiers = result.abilityModifiers ?? null;
  } else {
    totals.grandTotal = null;
    totals.totalNoMisc = null;
    totals.miscTotal = null;
    totals.buildDays = null;
    totals.buildDaysDisplay = null;
    totals.pointBuyTotal = null;
    totals.hullPoints = null;
    totals.shieldPoints = null;
    totals.suiteSlots = null;
    totals.openSuites = null;
    totals.validationState = null;
    totals.abilityTotals = null;
    totals.abilityModifiers = null;
  }

  let displayState = parts.displayState ?? null;
  if (!displayState) {
    if (connectionState === "disconnected") displayState = "disconnected";
    else if (cleared) displayState = "cleared";
    else if (status === "invalid") displayState = "invalid";
    else if (status === "failed") displayState = "unsupported";
    else if (status === "success") displayState = "calculated";
    else displayState = "empty";
  }
  if (parts.creationStatus === "created") displayState = "created";
  if (parts.creationStatus === "failed") displayState = "createFailed";

  return Object.freeze({
    protocolVersion: PROJECTION_PROTOCOL_VERSION,
    revision,
    sessionOwnerId: parts.sessionOwnerId ?? draft?.sessionOwnerId ?? null,
    cleared,
    connectionState,
    displayState,
    status,
    ok: Boolean(calculation?.ok),
    selections,
    totals,
    creationStatus: parts.creationStatus ?? null,
    createdActorName: parts.createdActorName ?? null,
    warnings: Array.isArray(calculation?.warnings)
      ? structuredClone(calculation.warnings)
      : [],
    errors: Array.isArray(calculation?.errors)
      ? structuredClone(calculation.errors)
      : [],
    explanation: sanitizeExplanation(calculation?.explanation)
  });
}

/**
 * @param {unknown} projection
 */
export function validateProjection(projection) {
  const errors = [];
  if (!projection || typeof projection !== "object" || Array.isArray(projection)) {
    return { ok: false, errors: ["projection must be an object"] };
  }
  if (projection.protocolVersion !== PROJECTION_PROTOCOL_VERSION) {
    errors.push("unsupported protocol version");
  }
  if (!Number.isFinite(Number(projection.revision))) {
    errors.push("invalid revision");
  }
  for (const key of FORBIDDEN_KEYS) {
    if (Object.prototype.hasOwnProperty.call(projection, key)) {
      errors.push(`forbidden key: ${key}`);
    }
  }
  const blob = JSON.stringify(projection);
  if (/workbookPath|SotG Shipbuilder|capturedBy|Actor\.create|Item\.create/i.test(blob)) {
    errors.push("projection contains prohibited private or document-create content");
  }
  if (projection.createdActorUuid != null || projection.actorUuid != null || projection.uuid != null) {
    errors.push("projection must not include Actor UUID");
  }
  return { ok: errors.length === 0, errors };
}

/**
 * @param {object} projection
 */
export function cloneProjection(projection) {
  return structuredClone(projection);
}
