import { PACK_KEYS } from "./constants.js";

function textMatch(value, query) {
  return String(value ?? "").toLowerCase().includes(query);
}

function classificationValues(flags) {
  const values = [];
  if (flags?.region) values.push(flags.region);
  for (const entry of flags?.regionClassifications ?? []) {
    const value = typeof entry === "string" ? entry : entry?.value;
    if (value) values.push(value);
  }
  return values;
}

export function filterIndex(entries, filters = {}) {
  const continuity = filters.continuity || "";
  const region = filters.region || "";
  const sector = filters.sector || "";
  const system = filters.system || "";
  const grid = filters.grid || "";
  const route = filters.route || "";
  const classification = filters.classification || "";
  const query = String(filters.nameOrAlias ?? "").trim().toLowerCase();

  return entries.filter((entry) => {
    const flags = entry.flags ?? {};
    if (continuity && flags.continuity !== continuity) return false;
    if (region && !classificationValues(flags).includes(region)) return false;
    if (sector && flags.sector !== sector) return false;
    if (system && flags.system !== system) return false;
    if (grid && flags.grid !== grid) return false;
    if (route && !(flags.routes ?? []).includes(route)) return false;
    if (classification && flags.classification !== classification) return false;
    if (query) {
      const haystack = [entry.name, flags.stableId, ...(flags.aliases ?? [])];
      if (!haystack.some((value) => textMatch(value, query))) return false;
    }
    return true;
  });
}

export function sortIndexEntries(entries) {
  return [...entries].sort((left, right) => {
    const byName = String(left.name ?? "").localeCompare(String(right.name ?? ""));
    if (byName !== 0) return byName;
    return String(left.flags?.stableId ?? "").localeCompare(String(right.flags?.stableId ?? ""));
  });
}

export function uniqueValues(entries, flagKey) {
  if (flagKey === "region") {
    const values = new Set();
    for (const entry of entries) {
      for (const value of classificationValues(entry.flags ?? {})) values.add(value);
    }
    return [...values].sort();
  }
  return [...new Set(entries.map((entry) => entry.flags?.[flagKey]).filter(Boolean))].sort();
}

export function routeHits(index, routeId) {
  return index.filter((entry) => (entry.flags?.routes ?? []).includes(routeId));
}

export function gridHits(index, grid) {
  return index.filter((entry) => entry.flags?.grid === grid);
}

export function relatedEntry(index, entry) {
  const relatedId = entry.flags?.relatedContinuityStableId;
  if (!relatedId) return null;
  return index.find((candidate) => candidate.flags?.stableId === relatedId) ?? null;
}

export function canonicalUuidsForGrid(index, grid) {
  return gridHits(index, grid).map((entry) => entry.uuid);
}

export function emptyBrowserFilters() {
  return {
    continuity: "",
    region: "",
    sector: "",
    system: "",
    grid: "",
    route: "",
    classification: "",
    nameOrAlias: ""
  };
}

export function packCollectionId(packKey, { worldId = "world", packScope = "world", moduleId = "kakeman89s-datacron" } = {}) {
  if (packScope === "module") return `${moduleId}.${packKey}`;
  if (packKey === PACK_KEYS.ONE) return `${worldId}.${PACK_KEYS.ONE}`;
  return `${worldId}.${packKey}`;
}
