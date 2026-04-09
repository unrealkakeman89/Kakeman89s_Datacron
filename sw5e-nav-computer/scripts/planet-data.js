import { logError, MODULE_ID } from "./logger.js";

let planetCache = null;
let sortedPlanetCache = null;
let planetLoadPromise = null;
let planetLoadError = null;

function getPlanetDataPath() {
  return `modules/${MODULE_ID}/data/planets.json`;
}

function comparePlanetNames(left, right) {
  return left.name.localeCompare(right.name);
}

function clonePlanet(planet) {
  return planet ? foundry.utils.deepClone(planet) : null;
}

function clonePlanets(planets) {
  return planets.map((planet) => clonePlanet(planet));
}

function shuffle(values) {
  const results = [...values];
  for (let index = results.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [results[index], results[swapIndex]] = [results[swapIndex], results[index]];
  }
  return results;
}

function setPlanetCache(planets) {
  planetCache = planets;
  sortedPlanetCache = [...planets].sort(comparePlanetNames);
  return planetCache;
}

export async function loadPlanetData() {
  if (planetLoadError) throw planetLoadError;
  if (planetCache) return clonePlanets(planetCache);
  if (planetLoadPromise) {
    const pendingPlanets = await planetLoadPromise;
    return clonePlanets(pendingPlanets);
  }

  planetLoadPromise = (async () => {
    const response = await fetch(getPlanetDataPath());
    if (!response.ok) {
      throw new Error(`Planet data request failed with status ${response.status}.`);
    }

    const planets = await response.json();
    if (!Array.isArray(planets)) {
      throw new Error("Planet data file did not contain an array.");
    }

    return setPlanetCache(planets);
  })();

  try {
    const planets = await planetLoadPromise;
    planetLoadError = null;
    return clonePlanets(planets);
  } catch (error) {
    logError("Failed to load curated planet data.", error);
    planetCache = [];
    sortedPlanetCache = [];
    planetLoadError = error;
    throw error;
  } finally {
    planetLoadPromise = null;
  }
}

export async function getPlanetList() {
  if (!sortedPlanetCache) {
    try {
      await loadPlanetData();
    } catch (_error) {
      return [];
    }
  }

  return clonePlanets(sortedPlanetCache ?? []);
}

export async function getPlanetByName(name) {
  if (!name) return null;
  const planets = await getPlanetList();
  return planets.find((planet) => planet.name === name) ?? null;
}

export async function getPlanetRegion(name) {
  const planet = await getPlanetByName(name);
  return planet?.region ?? null;
}

export async function getPlanetsInRegion(region) {
  if (!region) return [];
  const planets = await getPlanetList();
  return planets.filter((planet) => planet.region === region);
}

export async function getRandomPlanetsInRegion(region, count) {
  const planets = await getPlanetsInRegion(region);
  if (!planets.length) return [];

  const requestedCount = Math.max(0, Number.parseInt(count, 10) || 0);
  if (requestedCount <= 0) return [];

  return shuffle(planets).slice(0, Math.min(requestedCount, planets.length));
}
