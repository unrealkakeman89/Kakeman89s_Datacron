import { DATASET_IDS, INTERMEDIATE_SCHEMA_VERSION, REVIEW_STATUS } from "./constants.js";
import { conflictFlag } from "./flags.js";
import { matchKey, provisionalStableId, slugForId } from "./normalize.js";

function lookupPlanets(name, records, aliasIndex) {
  const key = matchKey(name);
  const direct = records.filter((record) => record.normalizedName === key);
  if (direct.length) return direct;
  return aliasIndex.get(key) ?? [];
}

export function adaptRoutes(edges, records) {
  const aliasIndex = new Map();
  for (const record of records) {
    for (const alias of record.aliases ?? []) {
      const key = matchKey(alias);
      const list = aliasIndex.get(key) ?? [];
      list.push(record);
      aliasIndex.set(key, list);
    }
  }

  const grouped = new Map();
  for (const edge of edges ?? []) {
    const name = edge?.name || "unnamed";
    const list = grouped.get(name) ?? [];
    list.push(edge);
    grouped.set(name, list);
  }

  const routes = [];
  const unresolved = [];
  const ambiguous = [];

  for (const [name, group] of grouped) {
    const flags = [];
    const planetIds = new Set();
    const grids = new Set();
    const resolvedEdges = [];
    let tier = group[0]?.tier ?? null;
    let obscure = group[0]?.obscure ?? null;

    for (const edge of group) {
      const fromHits = lookupPlanets(edge.from, records, aliasIndex);
      const toHits = lookupPlanets(edge.to, records, aliasIndex);
      if (!fromHits.length) unresolved.push({ route: name, endpoint: edge.from, role: "from" });
      if (!toHits.length) unresolved.push({ route: name, endpoint: edge.to, role: "to" });
      if (fromHits.length > 1) ambiguous.push({ route: name, endpoint: edge.from, count: fromHits.length });
      if (toHits.length > 1) ambiguous.push({ route: name, endpoint: edge.to, count: toHits.length });
      if (fromHits.length !== 1 || toHits.length !== 1) {
        flags.push(
          conflictFlag(
            "route-endpoint-unresolved",
            "warning",
            `Endpoint unresolved or ambiguous: ${edge.from} -> ${edge.to}`,
            ["edges"]
          )
        );
      }
      for (const hit of [...fromHits, ...toHits]) {
        planetIds.add(hit.stableId || hit.provisionalStableId);
        if (hit.astrography?.grid?.value) grids.add(hit.astrography.grid.value);
        if (hit.reviewStatus === REVIEW_STATUS.QUARANTINED) {
          flags.push(conflictFlag("route-to-quarantined", "warning", `Route ${name} touches quarantined ${hit.name}.`, ["planetStableIds"]));
        }
      }
      resolvedEdges.push({
        from: edge.from,
        to: edge.to,
        distance: edge.distance ?? null,
        travelTimeBase: edge.travelTimeBase ?? null,
        classification: edge.classification ?? null,
        fromResolved: fromHits.length === 1 ? fromHits[0].provisionalStableId : null,
        toResolved: toHits.length === 1 ? toHits[0].provisionalStableId : null
      });
    }

    if (grids.size > 1) {
      flags.push(conflictFlag("shared-grid-multi-route", "info", "Route spans multiple grids.", ["grids"]));
    }

    routes.push({
      schemaVersion: INTERMEDIATE_SCHEMA_VERSION,
      stableId: `rt:${slugForId(name)}`,
      provisionalStableId: provisionalStableId(name, DATASET_IDS.ROUTE_001),
      name,
      normalizedName: matchKey(name),
      grids: [...grids],
      planetStableIds: [...planetIds],
      edges: resolvedEdges,
      tier,
      obscure,
      reviewStatus: REVIEW_STATUS.DRAFT,
      sourceMetadata: { datasetId: DATASET_IDS.ROUTE_001, edgeCount: group.length },
      conflictFlags: flags
    });
  }

  const recordsWithRoutes = records.map((record) => {
    const ids = [];
    for (const route of routes) {
      if (route.planetStableIds.includes(record.stableId || record.provisionalStableId)) {
        ids.push(route.stableId);
      }
    }
    return {
      ...record,
      astrography: {
        ...record.astrography,
        routes: ids
      }
    };
  });

  return { routes, records: recordsWithRoutes, unresolved, ambiguous };
}
