import { buildGraph, loadHyperspaceRoutes } from "./hyperspace-routes.js";
import { loadPlanetData } from "./planet-data.js";

export const REGION_ORDER = [
  "Deep Core",
  "Core",
  "Colonies",
  "Inner Rim",
  "Expansion Region",
  "Mid Rim",
  "Outer Rim",
  "Wild Space",
  "Unknown Regions"
];

export const REGION_TRAVEL_MATRIX = {
  "Deep Core": {
    "Deep Core": 12,
    Core: 18,
    Colonies: 24,
    "Inner Rim": 48,
    "Expansion Region": 72,
    "Mid Rim": 96,
    "Outer Rim": 120,
    "Wild Space": 144,
    "Unknown Regions": 168
  },
  Core: {
    "Deep Core": 24,
    Core: 6,
    Colonies: 24,
    "Inner Rim": 36,
    "Expansion Region": 60,
    "Mid Rim": 84,
    "Outer Rim": 96,
    "Wild Space": 120,
    "Unknown Regions": 144
  },
  Colonies: {
    "Deep Core": 48,
    Core: 24,
    Colonies: 12,
    "Inner Rim": 24,
    "Expansion Region": 48,
    "Mid Rim": 72,
    "Outer Rim": 96,
    "Wild Space": 120,
    "Unknown Regions": 96
  },
  "Inner Rim": {
    "Deep Core": 72,
    Core: 36,
    Colonies: 24,
    "Inner Rim": 18,
    "Expansion Region": 24,
    "Mid Rim": 48,
    "Outer Rim": 72,
    "Wild Space": 96,
    "Unknown Regions": 72
  },
  "Expansion Region": {
    "Deep Core": 96,
    Core: 60,
    Colonies: 48,
    "Inner Rim": 24,
    "Expansion Region": 24,
    "Mid Rim": 24,
    "Outer Rim": 48,
    "Wild Space": 72,
    "Unknown Regions": 96
  },
  "Mid Rim": {
    "Deep Core": 120,
    Core: 84,
    Colonies: 72,
    "Inner Rim": 48,
    "Expansion Region": 24,
    "Mid Rim": 36,
    "Outer Rim": 24,
    "Wild Space": 48,
    "Unknown Regions": 72
  },
  "Outer Rim": {
    "Deep Core": 144,
    Core: 96,
    Colonies: 96,
    "Inner Rim": 72,
    "Expansion Region": 48,
    "Mid Rim": 24,
    "Outer Rim": 48,
    "Wild Space": 24,
    "Unknown Regions": 60
  },
  "Wild Space": {
    "Deep Core": 168,
    Core: 120,
    Colonies: 120,
    "Inner Rim": 96,
    "Expansion Region": 72,
    "Mid Rim": 48,
    "Outer Rim": 24,
    "Wild Space": 12,
    "Unknown Regions": 120
  },
  "Unknown Regions": {
    "Deep Core": 192,
    Core: 144,
    Colonies: 96,
    "Inner Rim": 72,
    "Expansion Region": 60,
    "Mid Rim": 72,
    "Outer Rim": 96,
    "Wild Space": 120,
    "Unknown Regions": 48
  }
};

function regionIndex(region) {
  return REGION_ORDER.indexOf(region);
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

  const hours = travelTimeHours;
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
    `Basic mode estimates about ${hours} hours of hyperspace travel from ${originName} (${originRegion}) to ${destName} (${destRegion}).` +
    middlePhrase +
    " Figures are broad regional averages, not a map of individual hyperlanes."
  );
}

/**
 * @param {Map<string, Array<{ to: string, travelTimeBase: number, routeName: string }>>} graph
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
 * @param {Map<string, Array<{ to: string, travelTimeBase: number, routeName: string }>>} graph
 * @param {string} start
 * @param {string} end
 * @param {number} hyperdriveMult
 * @returns {{ path: string[], routeNames: string[], travelTimeHours: number } | null}
 */
function dijkstraShortestPath(graph, start, end, hyperdriveMult) {
  const vertices = collectGraphVertices(graph);
  if (!vertices.has(start) || !vertices.has(end)) return null;

  const dist = new Map();
  /** @type {Map<string, { from: string, edge: { routeName: string, travelTimeBase: number } }>} */
  const prev = new Map();

  for (const v of vertices) dist.set(v, Infinity);
  dist.set(start, 0);

  const unvisited = new Set(vertices);

  while (unvisited.size) {
    let u = null;
    let best = Infinity;
    for (const v of unvisited) {
      const d = dist.get(v) ?? Infinity;
      if (d < best) {
        best = d;
        u = v;
      }
    }
    if (u === null || best === Infinity) break;
    unvisited.delete(u);
    if (u === end) break;

    for (const edge of graph.get(u) ?? []) {
      const w = edge.travelTimeBase * hyperdriveMult;
      const alt = best + w;
      const nextDist = dist.get(edge.to) ?? Infinity;
      if (alt < nextDist) {
        dist.set(edge.to, alt);
        prev.set(edge.to, { from: u, edge });
      }
    }
  }

  if ((dist.get(end) ?? Infinity) === Infinity) return null;

  const path = [];
  const routeNames = [];
  let cur = end;
  while (cur !== start) {
    const step = prev.get(cur);
    if (!step) return null;
    path.push(cur);
    routeNames.push(step.edge.routeName);
    cur = step.from;
  }
  path.push(start);
  path.reverse();
  routeNames.reverse();

  return { path, routeNames, travelTimeHours: dist.get(end) ?? 0 };
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
  travelTimeHours,
  path,
  routeNames,
  hyperdriveMult
}) {
  const hops = Math.max(0, path.length - 1);
  const lanes =
    routeNames.length === 0
      ? ""
      : ` Named lanes (${hops} hop${hops === 1 ? "" : "s"}): ${[...new Set(routeNames)].join(", ")}.`;
  return (
    `Advanced mode (curated prototype): about ${travelTimeHours} hours from ${originName} to ${destName}` +
    ` using in-graph hyperlanes, with hyperdrive class multiplier ×${hyperdriveMult}.${lanes}` +
    " Coverage is limited; worlds off the graph are not reachable in Advanced mode."
  );
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
    travelTimeHours: 0,
    regionsCrossed: [],
    planetsPassed: [],
    hyperdriveMult: mult,
    routeDescription: "",
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
      travelTimeHours: 0,
      regionsCrossed: r ? [r] : [],
      planetsPassed: [],
      hyperdriveMult: mult,
      routeDescription: `Curated hyperlanes: already at ${originPlanet.name}; no jump required.`,
      warnings: []
    };
  }

  let graph;
  try {
    const { routes } = await loadHyperspaceRoutes();
    graph = buildGraph(routes);
  } catch (_err) {
    return fail([
      "No curated hyperspace lane route found. Falling back to region-based estimate.",
      "Hyperspace route data could not be loaded."
    ]);
  }

  const solution = dijkstraShortestPath(graph, originPlanet.name, destinationPlanet.name, mult);
  if (!solution) {
    return fail([
      "No curated hyperspace lane route found. Falling back to region-based estimate.",
      "These worlds are not connected in the curated prototype hyperlane graph."
    ]);
  }

  /** @type {Map<string, string | undefined>} */
  const regionByName = new Map();
  try {
    const planets = await loadPlanetData();
    for (const p of planets) regionByName.set(p.name, p.region);
  } catch (_e) {
    /* regions list may stay empty */
  }

  const { path, routeNames, travelTimeHours } = solution;
  const planetsPassed = path.slice(1, -1);
  const regionsCrossed = regionsAlongPath(regionByName, path);

  return {
    mode: "advanced",
    advancedRouteFound: true,
    originPlanet,
    destinationPlanet,
    originRegion: originPlanet.region ?? null,
    destinationRegion: destinationPlanet.region ?? null,
    path,
    routeNames,
    travelTimeHours,
    regionsCrossed,
    planetsPassed,
    hyperdriveMult: mult,
    routeDescription: buildAdvancedRouteDescription({
      originName: originPlanet.name,
      destName: destinationPlanet.name,
      travelTimeHours,
      path,
      routeNames,
      hyperdriveMult: mult
    }),
    warnings: []
  };
}

/**
 * @param {object | null | undefined} originPlanet
 * @param {object | null | undefined} destinationPlanet
 * @returns {object}
 */
export function calculateRouteBasic(originPlanet, destinationPlanet) {
  const emptyResult = (extraWarnings = []) => ({
    mode: "basic",
    originPlanet: originPlanet ?? null,
    destinationPlanet: destinationPlanet ?? null,
    originRegion: null,
    destinationRegion: null,
    travelTimeHours: 0,
    regionsCrossed: [],
    planetsPassed: [],
    routeDescription: "",
    warnings: [...extraWarnings]
  });

  if (!originPlanet?.name) {
    return emptyResult(["Origin planet is missing or invalid."]);
  }
  if (!destinationPlanet?.name) {
    return emptyResult(["Destination planet is missing or invalid."]);
  }

  const warnings = [];
  const originRegion = originPlanet.region;
  const destinationRegion = destinationPlanet.region;

  if (!originRegion || regionIndex(originRegion) < 0) {
    warnings.push(`Origin world "${originPlanet.name}" has no recognized region for Basic mode.`);
  }
  if (!destinationRegion || regionIndex(destinationRegion) < 0) {
    warnings.push(`Destination world "${destinationPlanet.name}" has no recognized region for Basic mode.`);
  }

  if (warnings.length) {
    return {
      mode: "basic",
      originPlanet,
      destinationPlanet,
      originRegion: originRegion ?? null,
      destinationRegion: destinationRegion ?? null,
      travelTimeHours: 0,
      regionsCrossed: [],
      planetsPassed: [],
      routeDescription: "Route could not be estimated because one or both worlds are outside the Basic mode regional chart.",
      warnings
    };
  }

  const sameLocation = originPlanet.name === destinationPlanet.name;

  if (sameLocation) {
    const regionsCrossed = [originRegion];
    return {
      mode: "basic",
      originPlanet,
      destinationPlanet,
      originRegion,
      destinationRegion,
      travelTimeHours: 0,
      regionsCrossed,
      planetsPassed: [],
      routeDescription: buildRouteDescription({
        originName: originPlanet.name,
        destName: destinationPlanet.name,
        originRegion,
        destRegion: destinationRegion,
        travelTimeHours: 0,
        regionsCrossed,
        sameLocation: true
      }),
      warnings
    };
  }

  const row = REGION_TRAVEL_MATRIX[originRegion];
  const travelTimeHours = row?.[destinationRegion];

  if (travelTimeHours == null || Number.isNaN(travelTimeHours)) {
    warnings.push("No travel time is defined between these regions in the Basic mode matrix.");
    return {
      mode: "basic",
      originPlanet,
      destinationPlanet,
      originRegion,
      destinationRegion,
      travelTimeHours: 0,
      regionsCrossed: buildRegionsCrossed(originRegion, destinationRegion),
      planetsPassed: [],
      routeDescription: "Could not read travel time between these regions.",
      warnings
    };
  }

  const regionsCrossed = buildRegionsCrossed(originRegion, destinationRegion);

  const routeDescription = buildRouteDescription({
    originName: originPlanet.name,
    destName: destinationPlanet.name,
    originRegion,
    destRegion: destinationRegion,
    travelTimeHours,
    regionsCrossed,
    sameLocation: false
  });

  return {
    mode: "basic",
    originPlanet,
    destinationPlanet,
    originRegion,
    destinationRegion,
    travelTimeHours,
    regionsCrossed,
    planetsPassed: [],
    routeDescription,
    warnings
  };
}
