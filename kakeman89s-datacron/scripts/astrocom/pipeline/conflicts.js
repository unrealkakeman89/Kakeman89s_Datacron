import { REVIEW_STATUS } from "./constants.js";
import { journalDocumentId } from "../document-id.js";
import { isAllowedExternalUrl } from "../validate-source.js";
import { appendFlag, conflictFlag } from "./flags.js";
import { matchKey } from "./normalize.js";

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return map;
}

export function detectConflicts(records, routes = []) {
  let next = records.map((record) => ({ ...record, conflictFlags: [...(record.conflictFlags ?? [])] }));
  const reports = [];

  const byName = groupBy(next, (record) => record.normalizedName);
  for (const [name, group] of byName) {
    if (group.length < 2) continue;
    reports.push({ code: "duplicate-source-name", severity: "blocking", name, count: group.length });
    next = next.map((record) =>
      record.normalizedName === name
        ? appendFlag(
          record,
          conflictFlag("duplicate-source-name", "blocking", `Duplicate ASTRO-001 name ${record.name}.`, ["name"])
        )
        : record
    );
  }

  const byProv = groupBy(next, (record) => record.provisionalStableId);
  for (const [id, group] of byProv) {
    if (!id || group.length < 2) continue;
    reports.push({ code: "duplicate-provisional-stable-id", severity: "blocking", id, count: group.length });
    next = next.map((record) =>
      record.provisionalStableId === id
        ? appendFlag(record, conflictFlag("duplicate-provisional-stable-id", "blocking", `Duplicate provisionalStableId ${id}.`, ["provisionalStableId"]))
        : record
    );
  }

  const byApproved = groupBy(
    next.filter((record) => record.stableId),
    (record) => record.stableId
  );
  for (const [id, group] of byApproved) {
    if (group.length < 2) continue;
    reports.push({ code: "duplicate-approved-stable-id", severity: "blocking", id, count: group.length });
    next = next.map((record) =>
      record.stableId === id
        ? appendFlag(record, conflictFlag("duplicate-approved-stable-id", "blocking", `Duplicate approved stableId ${id}.`, ["stableId"]))
        : record
    );
  }

  const byNameContinuity = groupBy(
    next.filter((record) => record.continuity),
    (record) => `${record.continuity}::${record.normalizedName}`
  );
  for (const [key, group] of byNameContinuity) {
    if (group.length < 2) continue;
    reports.push({ code: "name-continuity-collision", severity: "blocking", key, count: group.length });
    next = next.map((record) =>
      `${record.continuity}::${record.normalizedName}` === key
        ? appendFlag(record, conflictFlag("name-continuity-collision", "blocking", "Name and continuity collide.", ["name", "continuity"]))
        : record
    );
  }

  const canonical = new Set(next.map((record) => record.normalizedName));
  next = next.map((record) => {
    let updated = record;
    for (const alias of record.aliases ?? []) {
      const aliasKey = matchKey(alias);
      if (canonical.has(aliasKey) && aliasKey !== record.normalizedName) {
        updated = appendFlag(
          updated,
          conflictFlag("alias-equals-canonical", "warning", `Alias ${alias} equals another canonical name.`, ["aliases"])
        );
      }
    }
    for (const link of record.externalLinks ?? []) {
      if (link?.url && !isAllowedExternalUrl(link.url)) {
        updated = appendFlag(updated, conflictFlag("unsafe-link", "blocking", `Unsafe or disallowed URL ${link.url}.`, ["externalLinks"]));
      }
    }
    if (!record.sourceMetadata?.datasetId && !record.adapterSources?.length) {
      updated = appendFlag(updated, conflictFlag("missing-provenance", "blocking", "Provenance is missing.", ["sourceMetadata"]));
    }
    if (record.reviewStatus === REVIEW_STATUS.APPROVED && (record.conflictFlags ?? []).some((flag) => flag.severity === "blocking")) {
      updated = appendFlag(updated, conflictFlag("approved-with-blocking", "blocking", "Approved record still has blocking conflicts.", ["reviewStatus"]));
    }
    if (record.relatedContinuityStableId) {
      const partner = next.find((candidate) => candidate.stableId === record.relatedContinuityStableId);
      if (!partner || partner.continuity === record.continuity) {
        updated = appendFlag(
          updated,
          conflictFlag("continuity-pair-inconsistent", "blocking", "Canon/Legends pairing is inconsistent.", ["relatedContinuityStableId"])
        );
      }
    }
    return updated;
  });

  const usedDocIds = new Map();
  next = next.map((record) => {
    if (!record.stableId) return record;
    const docId = journalDocumentId(record.stableId);
    const prior = usedDocIds.get(docId);
    if (prior && prior !== record.stableId) {
      reports.push({ code: "document-id-collision", severity: "blocking", docId, left: prior, right: record.stableId });
      return appendFlag(record, conflictFlag("document-id-collision", "blocking", `Foundry _id collision for ${record.stableId}.`, ["stableId"]));
    }
    usedDocIds.set(docId, record.stableId);
    return record;
  });

  const quarantined = [];
  next = next.map((record) => {
    const blocking = (record.conflictFlags ?? []).some((flag) => flag.severity === "blocking");
    if (blocking && record.reviewStatus !== REVIEW_STATUS.APPROVED && record.reviewStatus !== REVIEW_STATUS.REJECTED) {
      quarantined.push(record.provisionalStableId);
      return { ...record, reviewStatus: REVIEW_STATUS.QUARANTINED };
    }
    return record;
  });

  return { records: next, routes, reports, quarantinedCount: quarantined.length };
}
