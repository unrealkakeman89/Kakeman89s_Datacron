import { SCHEMA_VERSION } from "../constants.js";

function clonePresence(field, fallback = { presence: "missing" }) {
  if (!field || typeof field !== "object") return { ...fallback };
  const copy = { presence: field.presence };
  if (field.value != null) copy.value = field.value;
  if (field.atmosphere != null) copy.atmosphere = field.atmosphere;
  if (field.climate != null) copy.climate = field.climate;
  if (field.gravity != null) copy.gravity = field.gravity;
  if (field.population != null) copy.population = field.population;
  if (field.government != null) copy.government = field.government;
  if (field.exports != null) copy.exports = field.exports;
  if (field.imports != null) copy.imports = field.imports;
  return copy;
}

function cloneRegionClassifications(classifications) {
  if (!Array.isArray(classifications)) return undefined;
  return classifications.map((item) => ({
    value: item.value,
    relation: item.relation,
    presence: item.presence
  }));
}

function compactFieldProvenance(fieldProvenance) {
  if (!fieldProvenance || typeof fieldProvenance !== "object") return undefined;
  return Object.fromEntries(Object.entries(fieldProvenance).map(([path, entries]) => [
    path,
    (entries ?? []).map((entry) => ({
      sourceId: entry.sourceId,
      sourceLocator: entry.sourceLocator ?? null,
      method: entry.method,
      candidateValue: entry.candidateValue,
      reviewStatus: entry.reviewStatus,
      reviewedBy: entry.reviewedBy ?? null,
      lastReviewedAt: entry.lastReviewedAt ?? null,
      notes: entry.notes ?? null,
      continuityScope: entry.continuityScope ?? null
    }))
  ]));
}

export function toReleaseRecord(intermediate) {
  return {
    schemaVersion: SCHEMA_VERSION,
    stableId: intermediate.stableId,
    name: intermediate.name,
    continuity: intermediate.continuity,
    classification: intermediate.classification,
    conceptualId: intermediate.conceptualId ?? undefined,
    relatedContinuityStableId: intermediate.relatedContinuityStableId ?? undefined,
    aliases: [...(intermediate.aliases ?? [])],
    eraNotes: [...(intermediate.eraNotes ?? [])],
    description: intermediate.description,
    astrography: {
      region: clonePresence(intermediate.astrography.region),
      sector: clonePresence(intermediate.astrography.sector),
      system: clonePresence(intermediate.astrography.system),
      grid: clonePresence(intermediate.astrography.grid),
      routes: [...(intermediate.astrography.routes ?? [])]
    },
    regionClassifications: cloneRegionClassifications(intermediate.regionClassifications),
    fieldProvenance: compactFieldProvenance(intermediate.fieldProvenance),
    physical: clonePresence(intermediate.physical),
    societal: clonePresence(intermediate.societal),
    economics: clonePresence(intermediate.economics),
    sourceMetadata: {
      datasetId: intermediate.sourceMetadata?.datasetId,
      reviewedBy: intermediate.reviewedBy,
      lastReviewedAt: intermediate.lastReviewedAt,
      adapterSources: [...(intermediate.adapterSources ?? [])]
    },
    externalLinks: [...(intermediate.externalLinks ?? [])]
  };
}

export function toReleaseRoute(route) {
  return {
    stableId: route.stableId,
    name: route.name,
    grids: route.grids?.length ? [...route.grids] : ["unresolved"],
    planetStableIds: [...(route.planetStableIds ?? [])]
  };
}

export function toReleaseDataset(intermediates, routes) {
  return {
    schemaVersion: SCHEMA_VERSION,
    fixtureId: "phase5-pilot",
    attribution: "Kakeman89",
    notes: "Phase 5 approved pilot. Authored review file is the source of truth.",
    records: intermediates.map(toReleaseRecord),
    routes: routes.map(toReleaseRoute).filter((route) => route.planetStableIds.length)
  };
}
