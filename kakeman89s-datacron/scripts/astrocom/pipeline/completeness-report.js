import { PRESENCE } from "../constants.js";

const PRESENCE_FIELDS = Object.freeze([
  ["region", (record) => record.astrography?.region],
  ["sector", (record) => record.astrography?.sector],
  ["system", (record) => record.astrography?.system],
  ["grid", (record) => record.astrography?.grid],
  ["physical", (record) => record.physical],
  ["societal", (record) => record.societal],
  ["economics", (record) => record.economics]
]);

function isMissing(field) {
  return !field || field.presence !== PRESENCE.PRESENT;
}

function normalizedName(record) {
  return String(record.name ?? "").trim().toLocaleLowerCase();
}

function countDuplicateNames(records) {
  const names = new Map();
  for (const record of records) {
    const name = normalizedName(record);
    if (!name) continue;
    names.set(name, (names.get(name) ?? 0) + 1);
  }
  return [...names.values()].filter((count) => count > 1).reduce((total, count) => total + count - 1, 0);
}

function countAliasConflicts(records) {
  const aliases = new Map();
  let conflicts = 0;
  for (const record of records) {
    for (const alias of record.aliases ?? []) {
      const key = String(alias).trim().toLocaleLowerCase();
      if (!key) continue;
      const existing = aliases.get(key);
      if (existing && existing !== record.stableId) conflicts += 1;
      else aliases.set(key, record.stableId);
    }
  }
  return conflicts;
}

export function summarizeCompleteness(records = [], { unresolvedRoutes = [] } = {}) {
  const missing = Object.fromEntries(PRESENCE_FIELDS.map(([name]) => [name, 0]));
  missing.description = 0;
  missing.continuity = 0;
  missing.provenance = 0;

  let pendingReview = 0;
  let geographyConflicts = 0;
  for (const record of records) {
    for (const [name, getField] of PRESENCE_FIELDS) {
      if (isMissing(getField(record))) missing[name] += 1;
    }
    if (!String(record.description ?? "").trim()) missing.description += 1;
    if (!["canon", "legends"].includes(record.continuity)) missing.continuity += 1;
    if (!record.sourceMetadata && !(record.adapterSources?.length) && !Object.keys(record.fieldProvenance ?? {}).length) {
      missing.provenance += 1;
    }
    if (record.reviewStatus !== "approved") pendingReview += 1;
    geographyConflicts += (record.conflictFlags ?? []).filter((flag) =>
      String(flag.code ?? "").startsWith("geography-disagreement-")
    ).length;
  }

  return {
    schemaVersion: 1,
    recordCount: records.length,
    missing,
    pendingReview,
    geographyConflicts,
    unresolvedRoutes: unresolvedRoutes.length,
    duplicateNames: countDuplicateNames(records),
    aliasConflicts: countAliasConflicts(records)
  };
}

export function completenessMarkdown(summary) {
  return [
    "# AstroCom completeness summary",
    "",
    `- Records: ${summary.recordCount}`,
    `- Pending review: ${summary.pendingReview}`,
    `- Geography conflicts: ${summary.geographyConflicts}`,
    `- Unresolved routes: ${summary.unresolvedRoutes}`,
    `- Duplicate names: ${summary.duplicateNames}`,
    `- Alias conflicts: ${summary.aliasConflicts}`,
    "",
    "## Missing or not yet sourced",
    "",
    ...Object.entries(summary.missing).map(([field, count]) => `- ${field}: ${count}`),
    ""
  ].join("\n");
}
