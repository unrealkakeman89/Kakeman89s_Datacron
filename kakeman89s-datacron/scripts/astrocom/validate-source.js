import {
  ALLOWED_LINK_HOSTS,
  ALLOWED_LINK_PROTOCOLS,
  CLASSIFICATIONS,
  CONTINUITY,
  PRESENCE,
  SCHEMA_VERSION
} from "./constants.js";
import { isBlank } from "./html.js";

const PRESENCE_VALUES = new Set(Object.values(PRESENCE));
const REGION_RELATIONS = new Set(["primary", "subregion", "alternate"]);
const REVIEW_STATUSES = new Set(["draft", "quarantined", "approved", "rejected"]);

export function journalNameFor(name, continuity) {
  const label = continuity === CONTINUITY.CANON ? "Canon" : continuity === CONTINUITY.LEGENDS ? "Legends" : null;
  if (!label) return null;
  return `${name} (${label})`;
}

export function isAllowedExternalUrl(url) {
  if (typeof url !== "string" || isBlank(url)) return false;
  let parsed;
  try {
    parsed = new URL(url);
  } catch (_error) {
    return false;
  }
  if (!ALLOWED_LINK_PROTOCOLS.includes(parsed.protocol)) return false;
  const host = parsed.hostname.toLowerCase();
  return ALLOWED_LINK_HOSTS.includes(host);
}

function presenceError(path, field) {
  if (!field || typeof field !== "object" || Array.isArray(field)) {
    return `${path} must be a presence object`;
  }
  if (!PRESENCE_VALUES.has(field.presence)) {
    return `${path}.presence is invalid`;
  }
  if (field.presence === PRESENCE.PRESENT && isBlank(field.value) && !hasPresentDetails(field)) {
    return `${path} is marked present but has no value`;
  }
  return null;
}

function hasPresentDetails(field) {
  return Object.keys(field).some((key) => key !== "presence" && field[key] != null && field[key] !== "");
}

function requiredPresentText(path, field) {
  const error = presenceError(path, field);
  if (error) return error;
  if (field.presence !== PRESENCE.PRESENT || isBlank(field.value)) {
    return `${path} must be a present string`;
  }
  return null;
}

function validateRegionClassifications(classifications) {
  if (classifications == null) return [];
  if (!Array.isArray(classifications)) return ["regionClassifications must be an array"];
  const errors = [];
  let primaryCount = 0;
  for (const [index, item] of classifications.entries()) {
    if (!item || typeof item !== "object" || isBlank(item.value)) errors.push(`regionClassifications[${index}].value is required`);
    if (!REGION_RELATIONS.has(item?.relation)) errors.push(`regionClassifications[${index}].relation is invalid`);
    if (!PRESENCE_VALUES.has(item?.presence)) errors.push(`regionClassifications[${index}].presence is invalid`);
    if (item?.relation === "primary") primaryCount += 1;
  }
  if (primaryCount > 1) errors.push("regionClassifications may only contain one primary");
  return errors;
}

function validateFieldProvenance(fieldProvenance) {
  if (fieldProvenance == null) return [];
  if (!fieldProvenance || typeof fieldProvenance !== "object" || Array.isArray(fieldProvenance)) {
    return ["fieldProvenance must be an object"];
  }
  const errors = [];
  for (const [path, entries] of Object.entries(fieldProvenance)) {
    if (!Array.isArray(entries)) {
      errors.push(`fieldProvenance.${path} must be an array`);
      continue;
    }
    for (const [index, entry] of entries.entries()) {
      if (!entry || typeof entry !== "object") {
        errors.push(`fieldProvenance.${path}[${index}] must be an object`);
        continue;
      }
      if (isBlank(entry.sourceId)) errors.push(`fieldProvenance.${path}[${index}].sourceId is required`);
      if (isBlank(entry.method)) errors.push(`fieldProvenance.${path}[${index}].method is required`);
      if (!("candidateValue" in entry)) errors.push(`fieldProvenance.${path}[${index}].candidateValue is required`);
      if (!REVIEW_STATUSES.has(entry.reviewStatus)) errors.push(`fieldProvenance.${path}[${index}].reviewStatus is invalid`);
    }
  }
  return errors;
}

export function validateExternalLinks(links, path = "externalLinks") {
  if (links == null) return [];
  if (!Array.isArray(links)) return [`${path} must be an array`];
  const errors = [];
  for (const [index, link] of links.entries()) {
    if (!link || typeof link !== "object") {
      errors.push(`${path}[${index}] must be an object`);
      continue;
    }
    if (isBlank(link.label)) errors.push(`${path}[${index}].label is required`);
    if (!isAllowedExternalUrl(link.url)) {
      errors.push(`${path}[${index}].url is not an allowed http(s) example URL`);
    }
  }
  return errors;
}

export function validateRecordShape(record) {
  const errors = [];
  if (!record || typeof record !== "object") return ["record must be an object"];
  if (record.schemaVersion !== SCHEMA_VERSION) errors.push("schemaVersion must be 1");
  if (isBlank(record.stableId) || typeof record.stableId !== "string") errors.push("stableId is required");
  if (isBlank(record.name) || typeof record.name !== "string") errors.push("name is required");
  if (record.continuity !== CONTINUITY.CANON && record.continuity !== CONTINUITY.LEGENDS) {
    errors.push("continuity must be canon or legends");
  }
  if (!CLASSIFICATIONS.includes(record.classification)) {
    errors.push("classification is invalid");
  }
  if (record.aliases != null && !Array.isArray(record.aliases)) errors.push("aliases must be an array");
  if (record.aliases?.some((alias) => typeof alias !== "string" || isBlank(alias))) {
    errors.push("aliases must contain non-empty strings");
  }
  if (record.eraNotes != null && !Array.isArray(record.eraNotes)) errors.push("eraNotes must be an array");
  if (record.eraNotes?.some((note) => !note || isBlank(note.era) || isBlank(note.note))) {
    errors.push("eraNotes entries require era and note");
  }
  if (typeof record.description !== "string" || isBlank(record.description)) {
    errors.push("description is required");
  }

  const astro = record.astrography;
  if (!astro || typeof astro !== "object") {
    errors.push("astrography is required");
  } else {
    const regionError = requiredPresentText("astrography.region", astro.region);
    if (regionError) errors.push(regionError);
    for (const key of ["sector", "system"]) {
      const error = presenceError(`astrography.${key}`, astro[key]);
      if (error) errors.push(error);
    }
    const gridError = presenceError("astrography.grid", astro.grid);
    if (gridError) errors.push(gridError);
    if (astro.routes != null && !Array.isArray(astro.routes)) errors.push("astrography.routes must be an array");
  }
  errors.push(...validateRegionClassifications(record.regionClassifications));
  errors.push(...validateFieldProvenance(record.fieldProvenance));

  for (const group of ["physical", "societal", "economics"]) {
    if (!record[group] || !PRESENCE_VALUES.has(record[group].presence)) {
      errors.push(`${group}.presence is required`);
    }
  }

  if (!record.sourceMetadata || typeof record.sourceMetadata !== "object") {
    errors.push("sourceMetadata is required");
  }

  errors.push(...validateExternalLinks(record.externalLinks));
  return errors;
}

export function validateRouteShape(route) {
  const errors = [];
  if (!route || typeof route !== "object") return ["route must be an object"];
  if (isBlank(route.stableId)) errors.push("route.stableId is required");
  if (isBlank(route.name)) errors.push("route.name is required");
  if (!Array.isArray(route.grids) || route.grids.length === 0) errors.push("route.grids is required");
  if (!Array.isArray(route.planetStableIds) || route.planetStableIds.length === 0) {
    errors.push("route.planetStableIds is required");
  }
  return errors;
}

export function mergeDatasets(...datasets) {
  const records = [];
  const routes = [];
  let schemaVersion = SCHEMA_VERSION;
  for (const dataset of datasets) {
    if (!dataset) continue;
    if (dataset.schemaVersion != null) schemaVersion = dataset.schemaVersion;
    if (Array.isArray(dataset.records)) records.push(...dataset.records);
    if (Array.isArray(dataset.routes)) routes.push(...dataset.routes);
  }
  return { schemaVersion, records, routes };
}
