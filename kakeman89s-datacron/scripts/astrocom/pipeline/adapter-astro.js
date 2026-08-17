import { PRESENCE } from "../constants.js";
import {
  CLASSIFICATION_FROM_TYPE,
  DATASET_IDS,
  INTERMEDIATE_SCHEMA_VERSION,
  REVIEW_STATUS
} from "./constants.js";
import { conflictFlag } from "./flags.js";
import {
  geographyField,
  matchKey,
  provisionalStableId,
  regionIsMatrixMember,
  unicodeNormalize
} from "./normalize.js";

const DEFAULT_DESCRIPTION = "No authored description is recorded in ASTRO-001.";

export function classifyAstroType(type) {
  if (!type) return { classification: "planet", supported: true };
  if (CLASSIFICATION_FROM_TYPE[type]) {
    return { classification: CLASSIFICATION_FROM_TYPE[type], supported: true };
  }
  return { classification: "planet", supported: true, assumedPlanet: true, sourceType: type };
}

export function adaptAstro001Record(raw, index) {
  const name = unicodeNormalize(raw?.name);
  const region = geographyField(raw?.region, { kind: "region" });
  const sector = geographyField(raw?.sector, { kind: "sector", absentMeans: "missing" });
  const system = { presence: PRESENCE.MISSING };
  const grid = geographyField(raw?.grid, { absentMeans: "missing" });
  const classified = classifyAstroType(raw?.type);
  const flags = [];

  if (region.normalizationRule === "region-capitalization") {
    flags.push(conflictFlag("region-capitalization", "warning", `Region capitalization corrected from ${region.rawValue}.`, ["astrography.region"]));
  }
  if (region.presence === PRESENCE.PRESENT && !regionIsMatrixMember(region.value)) {
    flags.push(conflictFlag("region-outside-matrix", "warning", `Region ${region.value} is outside the NavComputer matrix set.`, ["astrography.region"]));
  }
  if (sector.presence === PRESENCE.MISSING) {
    flags.push(conflictFlag("missing-sector", "info", "Sector is absent in ASTRO-001.", ["astrography.sector"]));
  }
  if (grid.presence === PRESENCE.MISSING) {
    flags.push(conflictFlag("missing-grid", "info", "Grid is absent in ASTRO-001.", ["astrography.grid"]));
  }
  flags.push(conflictFlag("missing-system", "info", "System is absent in ASTRO-001 and is recorded as missing.", ["astrography.system"]));

  const reviewStatus = flags.some((flag) => flag.severity === "blocking")
    ? REVIEW_STATUS.QUARANTINED
    : REVIEW_STATUS.DRAFT;

  return {
    schemaVersion: INTERMEDIATE_SCHEMA_VERSION,
    stableId: null,
    provisionalStableId: provisionalStableId(name, `${DATASET_IDS.ASTRO_001}:${index}`),
    name,
    normalizedName: matchKey(name),
    continuity: null,
    continuityHint: null,
    classification: classified.classification,
    aliases: [],
    conceptualId: null,
    relatedContinuityStableId: null,
    description: unicodeNormalize(raw?.description) || DEFAULT_DESCRIPTION,
    eraNotes: [],
    astrography: {
      region,
      sector,
      system,
      grid,
      routes: []
    },
    physical: { presence: PRESENCE.MISSING },
    societal: { presence: PRESENCE.MISSING },
    economics: { presence: PRESENCE.MISSING },
    sourceMetadata: {
      datasetId: DATASET_IDS.ASTRO_001,
      sourceIndex: index,
      sourceName: raw?.name ?? null
    },
    externalLinks: [],
    reviewStatus,
    conflictFlags: flags,
    adapterSources: [DATASET_IDS.ASTRO_001],
    normalizedFrom: {
      name: raw?.name ?? null,
      region: raw?.region ?? null,
      sector: raw?.sector ?? null,
      grid: raw?.grid ?? null
    },
    rawSourceReferences: [{ datasetId: DATASET_IDS.ASTRO_001, index }],
    lastReviewedAt: null,
    reviewedBy: null,
    reviewNotes: null,
    typeHint: classified.sourceType ?? null
  };
}

export function adaptAstro001(records) {
  return (records ?? []).map((raw, index) => adaptAstro001Record(raw, index));
}
