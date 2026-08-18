import { MODULE_ID } from "../logger.js";

export const REGION_MATRIX_PROFILE_ID = "region-travel-matrix.v1";

export const REGION_ORDER = [];
export const REGION_TRAVEL_MATRIX = {};

const EXPECTED_ORDER = Object.freeze([
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

const REGION_TYPO_MAP = Object.freeze({
  "Inner RIm": "Inner Rim",
  "Outer RIm": "Outer Rim"
});

const MATRIX_DATA_PATH = `modules/${MODULE_ID}/data/navcomputer/region-travel-matrix.v1.json`;

/** @type {object | null} */
let cached = null;

function freezeMatrix(matrix, regionOrder) {
  const frozenRows = {};
  for (const origin of regionOrder) {
    frozenRows[origin] = Object.freeze({ ...matrix[origin] });
  }
  return Object.freeze(frozenRows);
}

function isFiniteNonNegative(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/**
 * @param {object} doc
 * @returns {object}
 */
export function parseRegionMatrixDocument(doc) {
  if (!doc || typeof doc !== "object") {
    throw new Error("Region matrix document is missing.");
  }
  if (doc.profileId !== REGION_MATRIX_PROFILE_ID) {
    throw new Error(`Region matrix profileId must be ${REGION_MATRIX_PROFILE_ID}.`);
  }
  if (!Array.isArray(doc.regionOrder) || doc.regionOrder.length !== 9) {
    throw new Error("Region matrix regionOrder must contain exactly nine regions.");
  }
  for (let i = 0; i < EXPECTED_ORDER.length; i++) {
    if (doc.regionOrder[i] !== EXPECTED_ORDER[i]) {
      throw new Error("Region matrix regionOrder does not match the locked nine-region chart.");
    }
  }
  if (!doc.matrix || typeof doc.matrix !== "object") {
    throw new Error("Region matrix map is missing.");
  }
  const originKeys = Object.keys(doc.matrix);
  if (originKeys.length !== 9) {
    throw new Error("Region matrix must contain exactly nine origin rows.");
  }
  for (const origin of EXPECTED_ORDER) {
    const row = doc.matrix[origin];
    if (!row || typeof row !== "object") {
      throw new Error(`Region matrix is missing origin row ${origin}.`);
    }
    const destKeys = Object.keys(row);
    if (destKeys.length !== 9) {
      throw new Error(`Region matrix row ${origin} must contain exactly nine destinations.`);
    }
    for (const dest of EXPECTED_ORDER) {
      if (!Object.prototype.hasOwnProperty.call(row, dest)) {
        throw new Error(`Region matrix is missing cell ${origin} -> ${dest}.`);
      }
      if (!isFiniteNonNegative(row[dest])) {
        throw new Error(`Region matrix cell ${origin} -> ${dest} must be a finite nonnegative number.`);
      }
    }
  }

  const regionOrder = Object.freeze([...doc.regionOrder]);
  const matrix = freezeMatrix(doc.matrix, regionOrder);
  return Object.freeze({
    profileId: REGION_MATRIX_PROFILE_ID,
    authority: doc.authority === "unverified" ? "unverified" : "unverified",
    units: "hours",
    directional: true,
    regionOrder,
    matrix
  });
}

function applyHydrated(parsed) {
  REGION_ORDER.splice(0, REGION_ORDER.length, ...parsed.regionOrder);
  for (const key of Object.keys(REGION_TRAVEL_MATRIX)) {
    delete REGION_TRAVEL_MATRIX[key];
  }
  for (const origin of parsed.regionOrder) {
    REGION_TRAVEL_MATRIX[origin] = parsed.matrix[origin];
  }
  cached = parsed;
  return parsed;
}

/**
 * @param {object} doc
 * @returns {object}
 */
export function hydrateRegionMatrix(doc) {
  return applyHydrated(parseRegionMatrixDocument(doc));
}

export function getCachedRegionMatrix() {
  return cached;
}

/**
 * Foundry: fetch the module-local JSON. Node tests should call hydrateRegionMatrix.
 * @returns {Promise<object>}
 */
export async function loadRegionMatrix() {
  if (cached) return cached;
  if (typeof game === "undefined" || typeof fetch !== "function") {
    throw new Error("Region matrix is not loaded.");
  }
  const response = await fetch(MATRIX_DATA_PATH);
  if (!response.ok) {
    throw new Error(`Region matrix request failed with status ${response.status}.`);
  }
  const doc = await response.json();
  return hydrateRegionMatrix(doc);
}

/**
 * @param {string | null | undefined} raw
 * @returns {{ raw: string | null, lookup: string | null, rule: string | null, changed: boolean }}
 */
export function normalizeRegionForLookup(raw) {
  if (raw == null || raw === "") {
    return { raw: raw ?? null, lookup: null, rule: null, changed: false };
  }
  const mapped = REGION_TYPO_MAP[raw];
  if (mapped) {
    return { raw, lookup: mapped, rule: "typo-capitalization", changed: true };
  }
  return { raw, lookup: raw, rule: null, changed: false };
}

/**
 * Same-world identity: stable id, then name+grid+region, then exact name.
 * planets.json has no continuity IDs; duplicate names with different regions are not identical.
 * @param {object | null | undefined} left
 * @param {object | null | undefined} right
 * @returns {boolean}
 */
export function planetsAreSameWorld(left, right) {
  if (!left || !right) return false;
  const idA = left.id ?? left._id ?? left.stableId ?? null;
  const idB = right.id ?? right._id ?? right.stableId ?? null;
  if (idA != null && idA !== "" && idB != null && idB !== "") {
    return String(idA) === String(idB);
  }
  const nameA = left.name ?? "";
  const nameB = right.name ?? "";
  if (!nameA || !nameB) return false;
  const canonicalA = left.grid != null && left.grid !== "" && left.region != null && left.region !== "";
  const canonicalB = right.grid != null && right.grid !== "" && right.region != null && right.region !== "";
  if (canonicalA && canonicalB) {
    return nameA === nameB && left.grid === right.grid && left.region === right.region;
  }
  return nameA === nameB;
}
