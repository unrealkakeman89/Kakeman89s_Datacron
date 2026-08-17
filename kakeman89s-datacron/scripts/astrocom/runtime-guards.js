export const ASTROCOM_POC_WORLD_ID = "datacron-phase4-poc";
export const ASTROCOM_PILOT_WORLD_ID = "datacron-phase5-pilot";
export const ASTROCOM_MVP_WORLD_ID = "datacron-phase6-mvp";

export function assertAstroComPocWorld(worldId) {
  if (worldId !== ASTROCOM_POC_WORLD_ID) {
    return {
      ok: false,
      status: "failure",
      message: `AstroCom rebuild refused. Active world is ${worldId ?? "none"}, expected ${ASTROCOM_POC_WORLD_ID}.`
    };
  }
  return { ok: true };
}

export function assertAstroComPilotWorld(worldId) {
  if (worldId !== ASTROCOM_PILOT_WORLD_ID) {
    return {
      ok: false,
      status: "refused",
      message: `AstroCom pilot rebuild refused. Active world is ${worldId ?? "none"}, expected ${ASTROCOM_PILOT_WORLD_ID}.`
    };
  }
  return { ok: true };
}

/** Production MVP worlds must not mutate shipped module packs. */
export function assertAstroComImmutablePackWorld(worldId) {
  if (worldId === ASTROCOM_MVP_WORLD_ID || (worldId && worldId !== ASTROCOM_POC_WORLD_ID && worldId !== ASTROCOM_PILOT_WORLD_ID)) {
    return {
      ok: false,
      status: "refused",
      message: `AstroCom rebuild refused. World ${worldId ?? "none"} uses immutable module packs (Option A).`
    };
  }
  return { ok: true };
}

export function resolveBrowserEntries(liveIndex) {
  if (Array.isArray(liveIndex) && liveIndex.length > 0) {
    return { source: "live", entries: liveIndex };
  }
  return { source: "empty", entries: [] };
}

export function isSyntheticGeneratedSummary(summary) {
  return Boolean(summary && typeof summary.status === "string" && Number.isInteger(summary.rejectedCount));
}

