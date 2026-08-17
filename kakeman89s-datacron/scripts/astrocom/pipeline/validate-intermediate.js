import { CLASSIFICATIONS, PRESENCE } from "../constants.js";
import { isBlank } from "../html.js";
import { INTERMEDIATE_SCHEMA_VERSION, REVIEW_STATUS } from "./constants.js";

const REVIEW_VALUES = new Set(Object.values(REVIEW_STATUS));
const PRESENCE_VALUES = new Set(Object.values(PRESENCE));
const REGION_RELATIONS = new Set(["primary", "subregion", "alternate"]);

export function validateIntermediateRecord(record) {
  const errors = [];
  if (!record || typeof record !== "object") return ["record must be an object"];
  if (record.schemaVersion !== INTERMEDIATE_SCHEMA_VERSION) errors.push("schemaVersion must be 1");
  if (isBlank(record.provisionalStableId)) errors.push("provisionalStableId is required");
  if (isBlank(record.name)) errors.push("name is required");
  if (isBlank(record.normalizedName)) errors.push("normalizedName is required");
  if (!REVIEW_VALUES.has(record.reviewStatus)) errors.push("reviewStatus is invalid");
  if (!CLASSIFICATIONS.includes(record.classification)) errors.push("classification is invalid");
  if (record.continuity != null && record.continuity !== "canon" && record.continuity !== "legends") {
    errors.push("continuity must be canon, legends, or null");
  }
  if (!record.astrography || typeof record.astrography !== "object") errors.push("astrography is required");
  if (!record.sourceMetadata || typeof record.sourceMetadata !== "object") errors.push("sourceMetadata is required");
  if (record.reviewStatus === REVIEW_STATUS.APPROVED) {
    if (isBlank(record.stableId)) errors.push("approved records require stableId");
    if (record.continuity !== "canon" && record.continuity !== "legends") {
      errors.push("approved records require continuity");
    }
    if (isBlank(record.reviewedBy)) errors.push("approved records require reviewedBy");
    if (isBlank(record.lastReviewedAt)) errors.push("approved records require lastReviewedAt");
  }
  for (const key of ["region", "sector", "system", "grid"]) {
    const field = record.astrography?.[key];
    if (field && !PRESENCE_VALUES.has(field.presence)) errors.push(`astrography.${key}.presence is invalid`);
  }
  if (record.regionClassifications != null && !Array.isArray(record.regionClassifications)) {
    errors.push("regionClassifications must be an array");
  }
  let primaryCount = 0;
  for (const [index, item] of (record.regionClassifications ?? []).entries()) {
    if (!item || isBlank(item.value)) errors.push(`regionClassifications[${index}].value is required`);
    if (!REGION_RELATIONS.has(item?.relation)) errors.push(`regionClassifications[${index}].relation is invalid`);
    if (!PRESENCE_VALUES.has(item?.presence)) errors.push(`regionClassifications[${index}].presence is invalid`);
    if (item?.relation === "primary") primaryCount += 1;
  }
  if (primaryCount > 1) errors.push("regionClassifications may only contain one primary");
  if (record.fieldProvenance != null && (!record.fieldProvenance || typeof record.fieldProvenance !== "object" || Array.isArray(record.fieldProvenance))) {
    errors.push("fieldProvenance must be an object");
  }
  for (const [path, entries] of Object.entries(record.fieldProvenance ?? {})) {
    if (!Array.isArray(entries)) {
      errors.push(`fieldProvenance.${path} must be an array`);
      continue;
    }
    for (const [index, entry] of entries.entries()) {
      if (!entry || isBlank(entry.sourceId) || isBlank(entry.method) || !("candidateValue" in entry) || !REVIEW_VALUES.has(entry.reviewStatus)) {
        errors.push(`fieldProvenance.${path}[${index}] is invalid`);
      }
    }
  }
  return errors;
}

export function canEmitToPack(record) {
  if (record?.reviewStatus !== REVIEW_STATUS.APPROVED) return { ok: false, reason: "reviewStatus is not approved" };
  if (record.continuity !== "canon" && record.continuity !== "legends") {
    return { ok: false, reason: "continuity is not approved" };
  }
  if (isBlank(record.stableId)) return { ok: false, reason: "stableId is missing" };
  if (isBlank(record.sourceMetadata?.datasetId) && !record.adapterSources?.length) {
    return { ok: false, reason: "missing provenance" };
  }
  const blocking = (record.conflictFlags ?? []).filter((flag) => flag.severity === "blocking");
  if (blocking.length) return { ok: false, reason: "unresolved blocking conflict" };
  const shape = validateIntermediateRecord(record);
  if (shape.length) return { ok: false, reason: shape.join("; ") };
  return { ok: true };
}
