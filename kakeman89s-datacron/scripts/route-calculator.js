import { logDebug, MODULE_ID } from "./logger.js";
import {
  buildGraph,
  filterHyperspaceRoutesForSettings,
  loadHyperspaceRoutes
} from "./hyperspace-routes.js";
import { loadPlanetData } from "./planet-data.js";
import { SETTING_KEYS } from "./settings.js";
import { formatTravelTime } from "./time-display.js";
import {
  REGION_ORDER,
  REGION_TRAVEL_MATRIX,
  getCachedRegionMatrix,
  loadRegionMatrix,
  normalizeRegionForLookup,
  planetsAreSameWorld
} from "./navcomputer/region-matrix.js";

export { REGION_ORDER, REGION_TRAVEL_MATRIX };

/** Increase toward 1.0 for faster/more direct routes; decrease toward 0 for more optimal but slower pathfinding. At 0 this degrades to Dijkstra. */
const HEURISTIC_WEIGHT = 0.5;

/** @typedef {'NO_LANE_PATH' | 'MISSING_COORDINATES' | 'FILTERED_LANES_ONLY' | 'DATA_ERROR'} AdvancedFallbackReason */

export const ADVANCED_FALLBACK_REASON = {
  NO_LANE_PATH: "NO_LANE_PATH",
  MISSING_COORDINATES: "MISSING_COORDINATES",
  FILTERED_LANES_ONLY: "FILTERED_LANES_ONLY",
  DATA_ERROR: "DATA_ERROR"
};

function regionIndex(region) {
  return REGION_ORDER.indexOf(region);
}

/**
 * Ring distance between two named regions; null if either is unknown on the chart.
 * @param {string | null | undefined} regionA
 * @param {string | null | undefined} regionB
 * @returns {number | null}
 */
export function advancedRegionRingDistance(regionA, regionB) {
  const i0 = regionIndex(regionA ?? "");
  const i1 = regionIndex(regionB ?? "");
  if (i0 < 0 || i1 < 0) return null;
  return Math.abs(i0 - i1);
}

function buildRegionsCrossed(originRegion, destinationRegion) {
  const i0 = regionIndex(originRegion);
  const i1 = regionIndex(destinationRegion);
  if (i0 < 0 || i1 < 0) return [];
  const low = Math.min(i0, i1);
  const high = Math.max(i0, i1);
  return REGION_ORDER.slice(low, high + 1);
}

function intermediateRegions(regionsCrossed) {
  if (regionsCrossed.length <= 2) return [];
  return regionsCrossed.slice(1, -1);
}

function buildRouteDescription({
  originName,
  destName,
  originRegion,
  destRegion,
  travelTimeHours,
  regionsCrossed,
  sameLocation
}) {
  if (sameLocation) {
    return `You are already at ${originName}. No hyperspace travel is required for this route in Basic mode.`;
  }

  const travelTimeFormatted = formatTravelTime(travelTimeHours);
  const middleRegions = intermediateRegions(regionsCrossed);
  let middlePhrase = "";
  if (middleRegions.length) {
    const listed =
      middleRegions.length === 1
        ? middleRegions[0]
        : `${middleRegions.slice(0, -1).join(", ")}, and ${middleRegions[middleRegions.length - 1]}`;
    middlePhrase = ` The path crosses ${listed} space before reaching ${destRegion}.`;
  }

  return (
    `Basic mode estimates ${travelTimeFormatted} of hyperspace travel from ${originName} (${originRegion}) to ${destName} (${destRegion}).` +
    middlePhrase +
    " Figures are broad regional averages, not a map of individual hyperlanes."
  );
}

/**
 * @param {Map<string, Array<{ to: string, travelTimeBase: number, routeName: string, syntheticHop?: boolean }>>} graph
 */
function collectGraphVertices(graph) {
  const vertices = new Set();
  for (const [node, edges] of graph) {
    vertices.add(node);
    for (const edge of edges) vertices.add(edge.to);
  }
  return vertices;
}

/**
 * Grid to plane (x,y); matches scripts/build-hyperspace-graph.py parse_grid.
 * @param {string | null | undefined} grid
 * @returns {{ x: number, y: number } | null}
 */
function parseGridToPlaneXY(grid) {
  if (!grid || typeof grid !== "string") return null;
  const t = grid.trim().toUpperCase().replace(/\s+/g, "");
  const m = /^([A-Z]+)-?(\d+)$/.exec(t);
  if (!m) return null;
  let col = 0;
  for (let i = 0; i < m[1].length; i++) {
    col = col * 26 + (m[1].charCodeAt(i) - 64);
  }
  const row = Number.parseInt(m[2], 10);
  if (!Number.isFinite(row)) return null;
  return { x: col * 8.0, y: row * 2.2 };
}

/**
 * Same coordinate resolution as planet data + build script (coordinates.x/y or grid).
 * Equivalent to records returned by getPlanetByName.
 * @param {object | null | undefined} planet
 * @returns {{ x: number, y: number } | null}
 */
function planetXYFromRecord(planet) {
  if (!planet) return null;
  const c = planet.coordinates;
  if (c && typeof c === "object") {
    const x = Number(c.x);
    const y = Number(c.y);
    if (Number.isFinite(x) && Number.isFinite(y)) return { x, y };
  }
  return parseGridToPlaneXY(planet.grid);
}

/**
 * @param {string} nodeName
 * @param {string} goalName
 * @param {Map<string, { x: number, y: number }>} coordMap
 */
function heuristicDistanceToGoal(nodeName, goalName, coordMap) {
  const g = coordMap.get(goalName);
  const n = coordMap.get(nodeName);
  if (!g || !n) return 0;
  return HEURISTIC_WEIGHT * Math.hypot(n.x - g.x, n.y - g.y);
}

/**
 * @param {Array<{ node: string, g: number, f: number }>} heap
 * @param {number} i
 */
function heapSiftUp(heap, i) {
  const item = heap[i];
  while (i > 0) {
    const p = (i - 1) >> 1;
    const a = heap[p];
    if (item.f > a.f || (item.f === a.f && item.node >= a.node)) break;
    heap[i] = a;
    i = p;
  }
  heap[i] = item;
}

/**
 * @param {Array<{ node: string, g: number, f: number }>} heap
 * @param {number} i
 */
function heapSiftDown(heap, i) {
  const item = heap[i];
  const n = heap.length;
  while (true) {
    let smallest = i;
    const l = i * 2 + 1;
    const r = l + 1;
    if (l < n) {
      const hl = heap[l];
      const hs = heap[smallest];
      if (hl.f < hs.f || (hl.f === hs.f && hl.node < hs.node)) smallest = l;
    }
    if (r < n) {
      const hr = heap[r];
      const hs = heap[smallest];
      if (hr.f < hs.f || (hr.f === hs.f && hr.node < hs.node)) smallest = r;
    }
    if (smallest === i) break;
    heap[i] = heap[smallest];
    i = smallest;
  }
  heap[i] = item;
}

/** @param {Array<{ node: string, g: number, f: number }>} heap */
function heapPush(heap, entry) {
  heap.push(entry);
  heapSiftUp(heap, heap.length - 1);
}

/** @param {Array<{ node: string, g: number, f: number }>} heap */
function heapPop(heap) {
  if (heap.length === 0) return null;
  const top = heap[0];
  const last = heap.pop();
  if (heap.length > 0) {
    heap[0] = last;
    heapSiftDown(heap, 0);
  }
  return top;
}

/**
 * @param {Map<string, Array<{ to: string, travelTimeBase: number, routeName: string, tier: number, dcBonus: number, syntheticHop: boolean }>>} graph
 * @param {string} start
 * @param {string} end
 * @param {number} hyperdriveMult
 * @param {Map<string, { x: number, y: number }>} coordMap planet positions (same fields as getPlanetByName / build script); missing entries => h=0
 * @returns {{ path: string[], routeNames: string[], routeHopsSynthetic: boolean[], travelTimeHours: number, pathDcBonusTotal: number, pathMaxTier: number, tier5Hops: number } | null}
 */
function aStarShortestPath(graph, start, end, hyperdriveMult, coordMap) {
  const vertices = collectGraphVertices(graph);
  if (!vertices.has(start) || !vertices.has(end)) return null;

  const gScore = new Map();
  /** @type {Map<string, { from: string, edge: { routeName: string, travelTimeBase: number, tier: number, dcBonus: number, syntheticHop: boolean } }>} */
  const cameFrom = new Map();
  const closedSet = new Set();

  /** @type {Array<{ node: string, g: number, f: number }>} */
  const openHeap = [];

  gScore.set(start, 0);
  heapPush(openHeap, { node: start, g: 0, f: heuristicDistanceToGoal(start, end, coordMap) });

  while (openHeap.length > 0) {
    const current = heapPop(openHeap);
    if (!current) break;
    const { node: u, g: gU } = current;
    const bestG = gScore.get(u) ?? Infinity;
    if (gU > bestG + 1e-9) continue;
    if (closedSet.has(u)) continue;
    closedSet.add(u);

    if (u === end) break;

    for (const edge of graph.get(u) ?? []) {
      const w = edge.travelTimeBase * hyperdriveMult;
      if (!Number.isFinite(w)) continue;
      const tentativeG = gU + w;
      const v = edge.to;
      const prevG = gScore.get(v) ?? Infinity;
      if (tentativeG >= prevG - 1e-9) continue;
      gScore.set(v, tentativeG);
      cameFrom.set(v, { from: u, edge });
      const h = heuristicDistanceToGoal(v, end, coordMap);
      heapPush(openHeap, { node: v, g: tentativeG, f: tentativeG + h });
    }
  }

  if ((gScore.get(end) ?? Infinity) === Infinity) return null;

  const path = [];
  const routeNames = [];
  const routeHopsSynthetic = [];
  let pathDcBonusTotal = 0;
  let pathMaxTier = 0;
  let tier5Hops = 0;
  let cur = end;
  while (cur !== start) {
    const step = cameFrom.get(cur);
    if (!step) return null;
    path.push(cur);
    routeNames.push(step.edge.routeName);
    routeHopsSynthetic.push(Boolean(step.edge.syntheticHop));
    const t = Number(step.edge.tier ?? 3);
    const safeT = Number.isFinite(t) ? t : 3;
    pathMaxTier = Math.max(pathMaxTier, safeT);
    const db = Number(step.edge.dcBonus ?? 0);
    pathDcBonusTotal += Number.isFinite(db) ? db : 0;
    if (safeT >= 5) tier5Hops += 1;
    cur = step.from;
  }
  path.push(start);
  path.reverse();
  routeNames.reverse();
  routeHopsSynthetic.reverse();

  return {
    path,
    routeNames,
    routeHopsSynthetic,
    travelTimeHours: gScore.get(end) ?? 0,
    pathDcBonusTotal,
    pathMaxTier,
    tier5Hops
  };
}

/**
 * @param {Map<string, string | undefined>} regionByName
 * @param {string[]} path
 */
function regionsAlongPath(regionByName, path) {
  const regions = [];
  for (const name of path) {
    const reg = regionByName.get(name);
    if (reg && regions[regions.length - 1] !== reg) regions.push(reg);
  }
  return regions;
}

function buildAdvancedRouteDescription({
  originName,
  destName,
  travelTimeFormatted,
  path,
  routeNames,
  routeHopsSynthetic,
  hyperdriveMult
}) {
  const hops = Math.max(0, path.length - 1);
  const synth = routeHopsSynthetic ?? [];
  const namedUnique = [];
  const seenNamed = new Set();
  for (let i = 0; i < routeNames.length; i++) {
    if (synth[i]) continue;
    const n = routeNames[i];
    if (!n || seenNamed.has(n)) continue;
    seenNamed.add(n);
    namedUnique.push(n);
  }
  let transitHops = 0;
  for (let i = 0; i < routeNames.length; i++) {
    if (synth[i]) transitHops++;
  }
  const laneParts = [];
  if (namedUnique.length) {
    laneParts.push(`Named lanes: ${namedUnique.join(", ")}`);
  }
  if (transitHops > 0) {
    laneParts.push(
      transitHops === 1
        ? "(+ 1 transit corridor hop)"
        : `(+ ${transitHops} transit corridor hops)`
    );
  }
  const lanesPhrase =
    hops === 0 ? "" : laneParts.length ? ` ${laneParts.join(" ")}.` : "";

  return (
    `Advanced mode: ${travelTimeFormatted} from ${originName} to ${destName}` +
    ` with hyperdrive class multiplier ×${hyperdriveMult}.${lanesPhrase}` +
    " Charted hyperlanes are preferred where they exist; unmapped segments use transit corridors or regional estimates."
  );
}

/**
 * Last-resort regional matrix hop when the lane graph cannot produce a path on the filtered graph.
 * @param {Map<string, string | undefined>} regionByName
 * @param {{ reason: AdvancedFallbackReason, extraWarnings?: string[] }} opts
 */
function regionalAdvancedRouteFallback(
  originPlanet,
  destinationPlanet,
  hyperdriveMult,
  regionByName,
  opts
) {
  const { reason, extraWarnings = [] } = opts;
  const mult =
    Number.isFinite(Number(hyperdriveMult)) && Number(hyperdriveMult) > 0 ? Number(hyperdriveMult) : 1;
  const oReg = originPlanet.region ?? null;
  const dReg = destinationPlanet.region ?? null;
  let hours = 96;
  if (oReg && dReg && REGION_TRAVEL_MATRIX[oReg]?.[dReg] != null) {
    hours = REGION_TRAVEL_MATRIX[oReg][dReg];
  }
  const travelTimeHours = hours * mult;
  const path = [originPlanet.name, destinationPlanet.name];
  const hopName =
    typeof game !== "undefined" && game?.i18n?.localize
      ? game.i18n.localize("KAKEMAN89SDATACRON.Route.RegionalHyperspaceEstimate")
      : "Regional hyperspace estimate (no lane-graph path)";
  const routeNames = [hopName];
  const routeHopsSynthetic = [true];
  const planetsPassed = [];
  const regionsCrossed = regionsAlongPath(regionByName, path);

  /** @type {{ code: string, reason?: string, severity: string }[]} */
  const routeUiWarnings = [
    { code: "ADVANCED_FALLBACK", reason, severity: "warning" }
  ];
  const ringDiff = advancedRegionRingDistance(oReg, dReg);
  const longSpanFallback =
    ringDiff != null && ringDiff >= 3 && path.length === 2 && path[0] !== path[1];
  if (longSpanFallback) {
    routeUiWarnings.push({ code: "LONG_DISTANCE_FALLBACK_ESTIMATE", severity: "warning" });
  }

  return {
    mode: "advanced",
    advancedRouteFound: true,
    originPlanet,
    destinationPlanet,
    originRegion: oReg,
    destinationRegion: dReg,
    path,
    routeNames,
    routeHopsSynthetic,
    travelTimeHours,
    regionsCrossed,
    planetsPassed,
    hyperdriveMult: mult,
    pathMaxTier: 4,
    pathDcBonusTotal: 2,
    routeDescription: buildAdvancedRouteDescription({
      originName: originPlanet.name,
      destName: destinationPlanet.name,
      travelTimeFormatted: formatTravelTime(travelTimeHours),
      path,
      routeNames,
      routeHopsSynthetic,
      hyperdriveMult: mult
    }),
    usedRegionalAdvancedFallback: true,
    advancedFallbackReason: reason,
    routeUiWarnings,
    warnings: [...extraWarnings]
  };
}

/**
 * @param {object | null | undefined} originPlanet
 * @param {object | null | undefined} destinationPlanet
 * @param {number} [hyperdriveMult=1]
 * @returns {Promise<object>}
 */
export async function calculateRouteAdvanced(originPlanet, destinationPlanet, hyperdriveMult = 1) {
  const mult =
    Number.isFinite(Number(hyperdriveMult)) && Number(hyperdriveMult) > 0 ? Number(hyperdriveMult) : 1;

  const fail = (warnings) => ({
    mode: "advanced",
    advancedRouteFound: false,
    originPlanet: originPlanet ?? null,
    destinationPlanet: destinationPlanet ?? null,
    originRegion: originPlanet?.region ?? null,
    destinationRegion: destinationPlanet?.region ?? null,
    path: [],
    routeNames: [],
    routeHopsSynthetic: [],
    travelTimeHours: 0,
    regionsCrossed: [],
    planetsPassed: [],
    hyperdriveMult: mult,
    pathMaxTier: 0,
    pathDcBonusTotal: 0,
    routeDescription: "",
    usedRegionalAdvancedFallback: false,
    advancedFallbackReason: null,
    routeUiWarnings: [],
    warnings: [...warnings]
  });

  if (!originPlanet?.name || !destinationPlanet?.name) {
    return fail(["Origin or destination world is missing for Advanced mode."]);
  }

  if (originPlanet.name === destinationPlanet.name) {
    const r = originPlanet.region ?? null;
    return {
      mode: "advanced",
      advancedRouteFound: true,
      originPlanet,
      destinationPlanet,
      originRegion: r,
      destinationRegion: destinationPlanet.region ?? null,
      path: [originPlanet.name],
      routeNames: [],
      routeHopsSynthetic: [],
      travelTimeHours: 0,
      regionsCrossed: r ? [r] : [],
      planetsPassed: [],
      hyperdriveMult: mult,
      pathMaxTier: 0,
      pathDcBonusTotal: 0,
      routeDescription: `Curated hyperlanes: already at ${originPlanet.name}; no jump required.`,
      usedRegionalAdvancedFallback: false,
      advancedFallbackReason: null,
      routeUiWarnings: [],
      warnings: []
    };
  }

  /** @type {Map<string, string | undefined>} */
  const regionByName = new Map();
  /** @type {Map<string, { x: number, y: number }>} */
  const planetCoordMap = new Map();
  try {
    await loadRegionMatrix();
    const planets = await loadPlanetData();
    for (const p of planets) {
      if (!p?.name) continue;
      regionByName.set(p.name, p.region);
      const xy = planetXYFromRecord(p);
      if (xy) planetCoordMap.set(p.name, xy);
    }
  } catch (_e) {
    /* regions list may stay empty */
  }

  let routes = null;
  let graph;
  try {
    const loaded = await loadHyperspaceRoutes();
    routes = loaded.routes;
    const filtered = filterHyperspaceRoutesForSettings(routes);
    logDebug(`Advanced graph: ${routes.length} routes, ${filtered.length} after tier/obscure filter.`);
    graph = buildGraph(filtered);
  } catch (_err) {
    return regionalAdvancedRouteFallback(originPlanet, destinationPlanet, mult, regionByName, {
      reason: ADVANCED_FALLBACK_REASON.DATA_ERROR,
      extraWarnings: []
    });
  }

  const startName = originPlanet.name;
  const endName = destinationPlanet.name;
  let solution = aStarShortestPath(graph, startName, endName, mult, planetCoordMap);
  if (!solution && routes) {
    const fullGraph = buildGraph(routes);
    const verts = collectGraphVertices(fullGraph);
    /** @type {AdvancedFallbackReason} */
    let fbReason = ADVANCED_FALLBACK_REASON.NO_LANE_PATH;
    if (!verts.has(startName) || !verts.has(endName)) {
      fbReason = ADVANCED_FALLBACK_REASON.MISSING_COORDINATES;
    } else {
      const fullSol = aStarShortestPath(fullGraph, startName, endName, mult, planetCoordMap);
      if (fullSol) fbReason = ADVANCED_FALLBACK_REASON.FILTERED_LANES_ONLY;
    }
    return regionalAdvancedRouteFallback(originPlanet, destinationPlanet, mult, regionByName, {
      reason: fbReason,
      extraWarnings: []
    });
  }

  const {
    path,
    routeNames,
    routeHopsSynthetic,
    travelTimeHours,
    pathDcBonusTotal,
    pathMaxTier,
    tier5Hops
  } = solution;
  const planetsPassed = path.slice(1, -1);
  const regionsCrossed = regionsAlongPath(regionByName, path);

  const tier5Extra = Number(game.settings?.get?.(MODULE_ID, SETTING_KEYS.advancedTier5ExtraDc) ?? 0);
  const safeExtra = Number.isFinite(tier5Extra) && tier5Extra > 0 ? tier5Extra : 0;
  const extraFromTier5 = safeExtra * tier5Hops;
  const totalLaneDcBonus = pathDcBonusTotal + extraFromTier5;

  return {
    mode: "advanced",
    advancedRouteFound: true,
    originPlanet,
    destinationPlanet,
    originRegion: originPlanet.region ?? null,
    destinationRegion: destinationPlanet.region ?? null,
    path,
    routeNames,
    routeHopsSynthetic,
    travelTimeHours,
    regionsCrossed,
    planetsPassed,
    hyperdriveMult: mult,
    pathMaxTier,
    pathDcBonusTotal: totalLaneDcBonus,
    routeDescription: buildAdvancedRouteDescription({
      originName: originPlanet.name,
      destName: destinationPlanet.name,
      travelTimeFormatted: formatTravelTime(travelTimeHours),
      path,
      routeNames,
      routeHopsSynthetic,
      hyperdriveMult: mult
    }),
    usedRegionalAdvancedFallback: false,
    advancedFallbackReason: null,
    routeUiWarnings: [],
    warnings: []
  };
}

function emptyBasicResult(originPlanet, destinationPlanet, extraWarnings = []) {
  return {
    mode: "basic",
    status: "invalid",
    originPlanet: originPlanet ?? null,
    destinationPlanet: destinationPlanet ?? null,
    sameWorld: false,
    rawOriginRegion: originPlanet?.region ?? null,
    rawDestinationRegion: destinationPlanet?.region ?? null,
    originLookupRegion: null,
    destinationLookupRegion: null,
    originRegion: null,
    destinationRegion: null,
    normalizationApplied: false,
    matrixProfileId: "region-travel-matrix.v1",
    matrixAuthority: "unverified",
    matrixHours: null,
    direction: null,
    hyperdriveApplied: false,
    travelTimeHours: 0,
    regionsCrossed: [],
    planetsPassed: [],
    completedJourney: false,
    routeDescription: "",
    warnings: [...extraWarnings]
  };
}

/**
 * @param {object | null | undefined} originPlanet
 * @param {object | null | undefined} destinationPlanet
 * @param {object | null | undefined} [matrixDoc]
 * @returns {object}
 */
export function calculateRouteBasic(originPlanet, destinationPlanet, matrixDoc = getCachedRegionMatrix()) {
  if (!originPlanet?.name) {
    return emptyBasicResult(originPlanet, destinationPlanet, ["Origin planet is missing or invalid."]);
  }
  if (!destinationPlanet?.name) {
    return emptyBasicResult(originPlanet, destinationPlanet, ["Destination planet is missing or invalid."]);
  }

  const originNorm = normalizeRegionForLookup(originPlanet.region);
  const destNorm = normalizeRegionForLookup(destinationPlanet.region);
  const regionOrder = matrixDoc?.regionOrder ?? REGION_ORDER;
  const matrix = matrixDoc?.matrix ?? REGION_TRAVEL_MATRIX;
  const warnings = [];
  const originSupported = Boolean(originNorm.lookup) && regionOrder.includes(originNorm.lookup);
  const destSupported = Boolean(destNorm.lookup) && regionOrder.includes(destNorm.lookup);
  const sameWorld = planetsAreSameWorld(originPlanet, destinationPlanet);
  const normalizationApplied = originNorm.changed || destNorm.changed;

  const base = {
    mode: "basic",
    originPlanet,
    destinationPlanet,
    sameWorld,
    rawOriginRegion: originPlanet.region ?? null,
    rawDestinationRegion: destinationPlanet.region ?? null,
    originLookupRegion: originNorm.lookup,
    destinationLookupRegion: destNorm.lookup,
    originRegion: originNorm.lookup,
    destinationRegion: destNorm.lookup,
    normalizationApplied,
    matrixProfileId: matrixDoc?.profileId ?? "region-travel-matrix.v1",
    matrixAuthority: matrixDoc?.authority ?? "unverified",
    hyperdriveApplied: false,
    planetsPassed: [],
    warnings
  };

  if (!originSupported) {
    warnings.push(`Origin world "${originPlanet.name}" has no recognized region for Basic mode.`);
  }
  if (!destSupported) {
    warnings.push(`Destination world "${destinationPlanet.name}" has no recognized region for Basic mode.`);
  }

  if (!originSupported || !destSupported) {
    return {
      ...base,
      status: "unsupported",
      sameWorld: false,
      matrixHours: null,
      direction: null,
      travelTimeHours: 0,
      regionsCrossed: [],
      completedJourney: false,
      routeDescription:
        "Route could not be estimated because one or both worlds are outside the Basic mode regional chart."
    };
  }

  if (sameWorld) {
    const regionsCrossed = [originNorm.lookup];
    return {
      ...base,
      status: "same-world",
      sameWorld: true,
      matrixHours: 0,
      direction: `${originNorm.lookup} → ${destNorm.lookup}`,
      travelTimeHours: 0,
      regionsCrossed,
      completedJourney: true,
      routeDescription: buildRouteDescription({
        originName: originPlanet.name,
        destName: destinationPlanet.name,
        originRegion: originNorm.lookup,
        destRegion: destNorm.lookup,
        travelTimeHours: 0,
        regionsCrossed,
        sameLocation: true
      })
    };
  }

  const travelTimeHours = matrix[originNorm.lookup]?.[destNorm.lookup];
  if (travelTimeHours == null || Number.isNaN(Number(travelTimeHours))) {
    warnings.push("No travel time is defined between these regions in the Basic mode matrix.");
    return {
      ...base,
      status: "unsupported",
      sameWorld: false,
      matrixHours: null,
      direction: `${originNorm.lookup} → ${destNorm.lookup}`,
      travelTimeHours: 0,
      regionsCrossed: buildRegionsCrossed(originNorm.lookup, destNorm.lookup),
      completedJourney: false,
      routeDescription: "Could not read travel time between these regions."
    };
  }

  const regionsCrossed = buildRegionsCrossed(originNorm.lookup, destNorm.lookup);
  return {
    ...base,
    status: "ok",
    sameWorld: false,
    matrixHours: travelTimeHours,
    direction: `${originNorm.lookup} → ${destNorm.lookup}`,
    travelTimeHours,
    regionsCrossed,
    completedJourney: true,
    routeDescription: buildRouteDescription({
      originName: originPlanet.name,
      destName: destinationPlanet.name,
      originRegion: originNorm.lookup,
      destRegion: destNorm.lookup,
      travelTimeHours,
      regionsCrossed,
      sameLocation: false
    })
  };
}
