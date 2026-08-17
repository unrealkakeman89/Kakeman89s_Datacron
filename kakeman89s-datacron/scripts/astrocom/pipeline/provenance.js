import { PRESENCE } from "../constants.js";

function readPath(object, path) {
  return path.split(".").reduce((value, key) => value?.[key], object);
}

function writePath(object, path, value) {
  const keys = path.split(".");
  const [key, ...rest] = keys;
  if (!key) return object;
  if (!rest.length) return { ...object, [key]: value };
  return { ...object, [key]: writePath(object?.[key] ?? {}, rest.join("."), value) };
}

function isApprovedPresent(record, path) {
  const field = readPath(record, path);
  const approved = record.fieldProvenance?.[path]?.some((item) => item.reviewStatus === "approved");
  return field?.presence === PRESENCE.PRESENT && approved;
}

export function appendProvenance(record, fieldPath, candidate) {
  if (!fieldPath || !candidate || typeof candidate !== "object") {
    throw new Error("fieldPath and provenance candidate are required");
  }
  const entry = {
    sourceId: candidate.sourceId,
    sourceLocator: candidate.sourceLocator,
    method: candidate.method,
    candidateValue: candidate.candidateValue,
    reviewStatus: candidate.reviewStatus,
    reviewedBy: candidate.reviewedBy ?? null,
    lastReviewedAt: candidate.lastReviewedAt ?? null,
    notes: candidate.notes ?? null,
    continuityScope: candidate.continuityScope ?? null
  };
  return {
    ...record,
    fieldProvenance: {
      ...(record.fieldProvenance ?? {}),
      [fieldPath]: [...(record.fieldProvenance?.[fieldPath] ?? []), entry]
    }
  };
}

export function approveFieldCandidate(record, fieldPath, candidateValue, { override = false, reviewedBy, lastReviewedAt } = {}) {
  if (isApprovedPresent(record, fieldPath) && !override) {
    throw new Error(`Cannot replace approved present ${fieldPath} without explicit override`);
  }
  const current = readPath(record, fieldPath);
  if (!current || typeof current !== "object" || !("presence" in current)) {
    throw new Error(`${fieldPath} must reference a presence field`);
  }
  const next = writePath(record, fieldPath, { ...current, presence: PRESENCE.PRESENT, value: candidateValue });
  const provenance = next.fieldProvenance?.[fieldPath] ?? [];
  return {
    ...next,
    fieldProvenance: {
      ...(next.fieldProvenance ?? {}),
      [fieldPath]: provenance.map((entry) =>
        entry.candidateValue === candidateValue
          ? { ...entry, reviewStatus: "approved", reviewedBy: reviewedBy ?? entry.reviewedBy, lastReviewedAt: lastReviewedAt ?? entry.lastReviewedAt }
          : entry
      )
    }
  };
}
