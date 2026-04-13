import { logError, MODULE_ID } from "./logger.js";
import { SETTING_KEYS } from "./settings.js";

/**
 * @typedef {{
 *   name: string,
 *   from: string,
 *   to: string,
 *   distance: number,
 *   travelTimeBase: number,
 *   classification?: string,
 *   tier?: number,
 *   obscure?: boolean,
 *   dcBonus?: number,
 *   essentialConnectivity?: boolean,
 *   syntheticHop?: boolean
 * }} HyperspaceRouteDef
 */

let routesCache = null;
let routesLoadPromise = null;
let routesLoadError = null;

function getHyperspaceRoutesPath() {
  return `modules/${MODULE_ID}/data/hyperspace-routes.json`;
}

/**
 * @returns {Promise<{ routes: HyperspaceRouteDef[] }>}
 */
export async function loadHyperspaceRoutes() {
  if (routesLoadError) throw routesLoadError;
  if (routesCache) return { routes: [...routesCache] };
  if (routesLoadPromise) {
    await routesLoadPromise;
    return { routes: [...(routesCache ?? [])] };
  }

  routesLoadPromise = (async () => {
    const response = await fetch(getHyperspaceRoutesPath());
    if (!response.ok) {
      throw new Error(`Hyperspace routes request failed with status ${response.status}.`);
    }
    const json = await response.json();
    if (!json || !Array.isArray(json.routes)) {
      throw new Error("Hyperspace routes file must contain a routes array.");
    }
    routesCache = json.routes;
  })();

  try {
    await routesLoadPromise;
    routesLoadError = null;
    return { routes: [...(routesCache ?? [])] };
  } catch (error) {
    logError("Failed to load hyperspace route data.", error);
    routesCache = [];
    routesLoadError = error;
    throw error;
  } finally {
    routesLoadPromise = null;
  }
}

/**
 * Undirected adjacency for pathfinding: each JSON segment adds both directions.
 * @param {HyperspaceRouteDef[]} routes
 * @returns {Map<string, Array<{ to: string, distance: number, routeName: string, travelTimeBase: number, classification?: string, tier: number, dcBonus: number, syntheticHop: boolean }>>}
 */
export function buildGraph(routes) {
  /** @type {Map<string, Array<{ to: string, distance: number, routeName: string, travelTimeBase: number, classification?: string, tier: number, dcBonus: number, syntheticHop: boolean }>>} */
  const graph = new Map();

  function addEdge(from, to, edge) {
    if (!from || !to) return;
    const list = graph.get(from) ?? [];
    list.push(edge);
    graph.set(from, list);
  }

  for (const r of routes) {
    if (!r?.from || !r?.to) continue;
    const tier = Number(r.tier ?? 3);
    const dcBonus = Number(r.dcBonus ?? 0);
    const syntheticHop = Boolean(r.syntheticHop);
    const forward = {
      to: r.to,
      distance: Number(r.distance) || 1,
      routeName: r.name ?? "Unnamed lane",
      travelTimeBase: Number(r.travelTimeBase) || 0,
      classification: r.classification,
      tier: Number.isFinite(tier) ? tier : 3,
      dcBonus: Number.isFinite(dcBonus) ? dcBonus : 0,
      syntheticHop
    };
    const backward = {
      to: r.from,
      distance: Number(r.distance) || 1,
      routeName: r.name ?? "Unnamed lane",
      travelTimeBase: Number(r.travelTimeBase) || 0,
      classification: r.classification,
      tier: Number.isFinite(tier) ? tier : 3,
      dcBonus: Number.isFinite(dcBonus) ? dcBonus : 0,
      syntheticHop
    };
    addEdge(r.from, r.to, forward);
    addEdge(r.to, r.from, backward);
  }

  return graph;
}

/**
 * @param {HyperspaceRouteDef[]} routes
 * @returns {HyperspaceRouteDef[]}
 */
export function filterHyperspaceRoutesForSettings(routes) {
  if (typeof game === "undefined" || !game?.settings?.get) return routes;
  const maxTier = Number(game.settings.get(MODULE_ID, SETTING_KEYS.advancedMaxTier) ?? 3);
  const safeMax = Number.isFinite(maxTier) && maxTier >= 1 ? Math.min(5, maxTier) : 3;
  const includeObscure = Boolean(game.settings.get(MODULE_ID, SETTING_KEYS.advancedIncludeObscureRoutes));
  return routes.filter((r) => {
    if (r.essentialConnectivity) return true;
    const t = Number(r.tier ?? 3);
    const tier = Number.isFinite(t) ? t : 3;
    if (tier > safeMax) return false;
    if (r.obscure && !includeObscure) return false;
    return true;
  });
}

/**
 * Direct edges between two worlds (same lane may appear once per direction in the graph).
 * @param {ReturnType<typeof buildGraph>} graph
 * @param {string} from
 * @param {string} to
 */
export function getRoutesBetween(graph, from, to) {
  const edges = graph.get(from) ?? [];
  return edges.filter((e) => e.to === to);
}
