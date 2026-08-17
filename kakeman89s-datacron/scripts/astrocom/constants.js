import { MODULE_ID } from "../logger.js";

export const SCHEMA_VERSION = 1;

export const CONTINUITY = Object.freeze({
  CANON: "canon",
  LEGENDS: "legends"
});

export const CONTINUITY_LABEL = Object.freeze({
  canon: "Canon",
  legends: "Legends"
});

export const CLASSIFICATIONS = Object.freeze(["planet", "moon", "station", "phenomenon"]);

export const PRESENCE = Object.freeze({
  PRESENT: "present",
  MISSING: "missing",
  UNKNOWN: "unknown",
  NOT_APPLICABLE: "notApplicable",
  OMITTED: "omitted"
});

export const PRESENCE_LABEL = Object.freeze({
  present: null,
  missing: "not yet sourced",
  unknown: "unknown",
  notApplicable: "not applicable",
  omitted: "intentionally omitted"
});

export const PACK_FOLDER_MAX_DEPTH = 3;
export const WORLD_FOLDER_MAX_DEPTH = 4;

export const FLAG_SCOPE = MODULE_ID;

export const JOURNAL_PAGE_FORMAT_HTML = 1;

export const ALLOWED_LINK_PROTOCOLS = Object.freeze(["http:", "https:"]);
export const ALLOWED_LINK_HOSTS = Object.freeze(["example.com", "example.org", "localhost"]);

export const INDEX_FIELDS = Object.freeze([
  "flags.kakeman89s-datacron.schemaVersion",
  "flags.kakeman89s-datacron.stableId",
  "flags.kakeman89s-datacron.continuity",
  "flags.kakeman89s-datacron.aliases",
  "flags.kakeman89s-datacron.region",
  "flags.kakeman89s-datacron.regionClassifications",
  "flags.kakeman89s-datacron.sector",
  "flags.kakeman89s-datacron.system",
  "flags.kakeman89s-datacron.grid",
  "flags.kakeman89s-datacron.routes",
  "flags.kakeman89s-datacron.relatedContinuityStableId",
  "flags.kakeman89s-datacron.conceptualId",
  "flags.kakeman89s-datacron.classification"
]);

export const DEFAULT_INDEX_FIELDS = Object.freeze(["_id", "name", "sort", "folder"]);

export const PACK_KEYS = Object.freeze({
  ONE: "astrocom-poc",
  CANON: "astrocom-poc-canon",
  LEGENDS: "astrocom-poc-legends"
});

export const FORBIDDEN_PRODUCTION_TERMS = Object.freeze([
  "coruscant",
  "tatooine",
  "naboo",
  "alderaan",
  "kamino",
  "mustafar",
  "endor",
  "hoth",
  "bespin",
  "jakku",
  "wookieepedia",
  "starwars.fandom.com",
  "corellian run",
  "hydraean",
  "hydraean way"
]);
