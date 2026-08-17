import { appendProvenance, approveFieldCandidate } from "./provenance.js";
import { ensurePrimaryRegion } from "./region-classifications.js";

function withoutMissingSystemFlag(flags = []) {
  return flags.filter((flag) => flag.code !== "missing-system");
}

function applyCandidate(record, candidate, enrichment) {
  if (candidate.reviewStatus !== "approved") {
    throw new Error(`Enrichment candidate for ${candidate.fieldPath} must be approved`);
  }
  const provenance = appendProvenance(record, candidate.fieldPath, {
    sourceId: candidate.sourceId,
    sourceLocator: candidate.sourceLocator,
    method: candidate.method,
    candidateValue: candidate.value,
    reviewStatus: candidate.reviewStatus,
    reviewedBy: candidate.reviewedBy ?? enrichment.reviewedBy,
    lastReviewedAt: candidate.lastReviewedAt ?? enrichment.lastReviewedAt,
    notes: candidate.notes,
    continuityScope: candidate.continuityScope
  });
  return approveFieldCandidate(provenance, candidate.fieldPath, candidate.value, {
    override: candidate.override === true,
    reviewedBy: candidate.reviewedBy ?? enrichment.reviewedBy,
    lastReviewedAt: candidate.lastReviewedAt ?? enrichment.lastReviewedAt
  });
}

export function applyEnrichment(records, enrichment) {
  const enrichmentById = new Map((enrichment.records ?? []).map((entry) => [entry.stableId, entry]));
  return {
    records: records.map((record) => {
      const entry = enrichmentById.get(record.stableId);
      if (!entry) return record;
      if (record.reviewStatus !== "approved") {
        throw new Error(`Enrichment target ${record.stableId} is not approved`);
      }

      let next = record;
      for (const candidate of entry.candidates ?? []) next = applyCandidate(next, candidate, entry);
      if (entry.regionClassifications) {
        if (!entry.regionClassifications.every((item) => item.presence === "present")) {
          throw new Error(`Region classifications for ${record.stableId} must be approved present values`);
        }
        if (next.regionClassifications?.some((item) => item.presence === "present") && entry.override !== true) {
          throw new Error(`Cannot replace approved regionClassifications for ${record.stableId} without explicit override`);
        }
        const sourceId = entry.sourceId ?? entry.candidates?.[0]?.sourceId;
        if (!sourceId) throw new Error(`Region classifications for ${record.stableId} require sourceId`);
        next = appendProvenance(next, "regionClassifications", {
          sourceId,
          sourceLocator: entry.sourceLocator ?? entry.candidates?.[0]?.sourceLocator,
          method: entry.method ?? entry.candidates?.[0]?.method,
          candidateValue: entry.regionClassifications.map((item) => item.value),
          reviewStatus: "approved",
          reviewedBy: entry.reviewedBy,
          lastReviewedAt: entry.lastReviewedAt,
          notes: entry.notes,
          continuityScope: entry.continuityScope
        });
        next = {
          ...next,
          regionClassifications: ensurePrimaryRegion(entry.regionClassifications, next.astrography.region)
        };
      }
      return {
        ...next,
        conflictFlags: next.astrography.system?.presence === "present"
          ? withoutMissingSystemFlag(next.conflictFlags)
          : next.conflictFlags
      };
    })
  };
}
