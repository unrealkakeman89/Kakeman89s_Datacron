import { PACK_KEYS } from "./constants.js";

function textMatch(value, query) {
  return String(value ?? "").toLowerCase().includes(query);
}

export function filterIndex(entries, filters = {}) {
  const continuity = filters.continuity || "";
  const region = filters.region || "";
  const sector = filters.sector || "";
  const system = filters.system || "";
  const grid = filters.grid || "";
  const route = filters.route || "";
  const query = String(filters.nameOrAlias ?? "").trim().toLowerCase();

  return entries.filter((entry) => {
    const flags = entry.flags ?? {};
    if (continuity && flags.continuity !== continuity) return false;
    if (region && flags.region !== region) return false;
    if (sector && flags.sector !== sector) return false;
    if (system && flags.system !== system) return false;
    if (grid && flags.grid !== grid) return false;
    if (route && !(flags.routes ?? []).includes(route)) return false;
    if (query) {
      const haystack = [entry.name, flags.stableId, ...(flags.aliases ?? [])];
      if (!haystack.some((value) => textMatch(value, query))) return false;
    }
    return true;
  });
}

export function uniqueValues(entries, flagKey) {
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

export function packCollectionId(packKey, { worldId = "world", packScope = "world", moduleId = "kakeman89s-datacron" } = {}) {
  if (packScope === "module") return `${moduleId}.${packKey}`;
  if (packKey === PACK_KEYS.ONE) return `${worldId}.${PACK_KEYS.ONE}`;
  return `${worldId}.${packKey}`;
}
