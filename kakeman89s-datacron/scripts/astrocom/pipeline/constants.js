export const INTERMEDIATE_SCHEMA_VERSION = 1;

export const REVIEW_STATUS = Object.freeze({
  DRAFT: "draft",
  QUARANTINED: "quarantined",
  APPROVED: "approved",
  REJECTED: "rejected"
});

export const DATASET_IDS = Object.freeze({
  ASTRO_001: "ASTRO-001",
  DATA_001: "DATA-001",
  ROUTE_001: "ROUTE-001",
  ALIAS: "ALIAS",
  CONTINUITY_HINT: "STARWARSMAP-GRID"
});

export const MATRIX_REGIONS = Object.freeze([
  "Deep Core",
  "Core",
  "Colonies",
  "Inner Rim",
  "Expansion Region",
  "Mid Rim",
  "Outer Rim",
  "Wild Space",
  "Unknown Regions"
]);

export const REGION_CAPITALIZATION = Object.freeze({
  "Inner RIm": "Inner Rim",
  "Outer RIm": "Outer Rim"
});

export const MODULE_PACK_KEYS = Object.freeze({
  CANON: "astrocom-canon",
  LEGENDS: "astrocom-legends"
});

export const MODULE_PACK_LABELS = Object.freeze({
  [MODULE_PACK_KEYS.CANON]: "AstroCom Canon",
  [MODULE_PACK_KEYS.LEGENDS]: "AstroCom Legends"
});

export const ASTROCOM_PILOT_WORLD_ID = "datacron-phase5-pilot";

export const BULK_AUTH_FILE_NAME = "BULK_INGEST_AUTHORIZED.md";
export const BULK_AUTH_RELATIVE_PATH = `data/sources/astrocom/review/${BULK_AUTH_FILE_NAME}`;

export const CLASSIFICATION_FROM_TYPE = Object.freeze({
  "Jungle Moon": "moon"
});

export const DATA_REGION_ALIASES = Object.freeze({
  "Outer Rim Territories": "Outer Rim",
  "Inner Rim Territories": "Inner Rim",
  "Expansion Regions": "Expansion Region",
  "Mid Rim Territories": "Mid Rim"
});

export const REVIEWER = "Kakeman89";
