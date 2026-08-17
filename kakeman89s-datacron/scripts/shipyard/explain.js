/**
 * Structured calculation explanation / trace for later GM UI (Phase 9).
 */

/**
 * @param {Array<Record<string, unknown>>} steps
 */
export function buildExplanation(steps) {
  return {
    stepCount: steps.length,
    steps: steps.map((step) => ({ ...step }))
  };
}

/**
 * @param {Partial<{id:string,category:string,label:string,inputs:unknown,operation:string,amount:unknown,runningTotal:unknown,workbookEvidence:string,note:string}>} fields
 */
export function explainStep(fields) {
  return {
    stepId: fields.id ?? "step",
    category: fields.category ?? "general",
    label: fields.label ?? "",
    inputs: fields.inputs ?? null,
    operation: fields.operation ?? "",
    amount: fields.amount ?? null,
    runningTotal: fields.runningTotal ?? null,
    workbookEvidence: fields.workbookEvidence ?? null,
    note: fields.note ?? null
  };
}
