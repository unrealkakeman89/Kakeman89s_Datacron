/**
 * Shipyard Phase 8 input/output schema and fixture validation.
 * Pure Node domain — no Foundry globals.
 */

export const WORKBOOK_SHA256 =
  "090770BAEB5EBE2CFE2D45F3653A2193691111D20D1AD092FE387BB62C3DE1ED";

export const REQUIRED_VALID_VECTOR_IDS = [
  "v1-example-xwing",
  "v2-small-bare",
  "v3-small-armed",
  "v4-medium-suites",
  "v5-large-tier"
];

export const REQUIRED_INVALID_VECTOR_ID = "v-invalid-empty-size";

export const OUTPUT_STATES = Object.freeze([
  "number",
  "string",
  "blank",
  "error",
  "notAvailable",
  "notCaptured",
  "object"
]);

export const BUILD_STATUSES = Object.freeze({
  SUCCESS: "success",
  PARTIAL: "partial",
  INVALID: "invalid",
  FAILED: "failed"
});

export const ABILITY_KEYS = Object.freeze(["str", "dex", "con", "int", "wis"]);

/**
 * Normalize ability bag keys (`int_` from capture → `int`).
 * @param {Record<string, unknown>|null|undefined} bag
 */
export function normalizeAbilityBag(bag = {}) {
  const src = bag && typeof bag === "object" ? bag : {};
  return {
    str: Number(src.str ?? 0),
    dex: Number(src.dex ?? 0),
    con: Number(src.con ?? 0),
    int: Number(src.int ?? src.int_ ?? 0),
    wis: Number(src.wis ?? 0)
  };
}

/**
 * @param {unknown} input
 */
export function assertBuildInputShape(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "input must be an object" };
  }
  return { ok: true };
}

/**
 * Validate authored Phase 8 vector fixture document.
 * @param {unknown} doc
 */
export function validateVectorFixture(doc) {
  const errors = [];
  if (!Array.isArray(doc)) {
    return { ok: false, errors: ["fixture must be an array"] };
  }

  const ids = doc.map((v) => v?.id);
  for (const id of REQUIRED_VALID_VECTOR_IDS) {
    if (!ids.includes(id)) errors.push(`missing valid vector id: ${id}`);
  }
  if (!ids.includes(REQUIRED_INVALID_VECTOR_ID)) {
    errors.push(`missing invalid vector id: ${REQUIRED_INVALID_VECTOR_ID}`);
  }

  const seen = new Set();
  for (const vector of doc) {
    if (!vector || typeof vector !== "object") {
      errors.push("vector entry is not an object");
      continue;
    }
    if (!vector.id || typeof vector.id !== "string") errors.push("vector missing id");
    if (seen.has(vector.id)) errors.push(`duplicate vector id: ${vector.id}`);
    seen.add(vector.id);

    if (vector.workbookSha256 !== WORKBOOK_SHA256) {
      errors.push(`${vector.id}: wrong workbookSha256`);
    }
    if (!vector.sheet || typeof vector.sheet !== "string") {
      errors.push(`${vector.id}: missing sheet`);
    }
    if (!vector.inputs || typeof vector.inputs !== "object") {
      errors.push(`${vector.id}: missing inputs object`);
    }
    if (!vector.expected || typeof vector.expected !== "object") {
      errors.push(`${vector.id}: missing expected object`);
    }
    const capture = vector.capture;
    if (!capture || typeof capture !== "object") {
      errors.push(`${vector.id}: missing capture metadata`);
    } else {
      if (!capture.capturedAt) errors.push(`${vector.id}: missing capturedAt`);
      if (capture.capturedBy !== "Kakeman89") {
        errors.push(`${vector.id}: capturedBy must be Kakeman89`);
      }
      const blob = JSON.stringify(capture);
      if (/\bckauble\b/i.test(blob) || /\bchris\b/i.test(blob)) {
        errors.push(`${vector.id}: personal-name attribution forbidden`);
      }
    }

    if (vector.id === REQUIRED_INVALID_VECTOR_ID) {
      const gt = vector.expected?.grandTotal;
      if (gt?.state === "number" && typeof gt.value === "number") {
        errors.push("invalid vector marked as successful grandTotal number");
      }
    }
  }

  return { ok: errors.length === 0, errors };
}
