export const ASTROCOM_POC_WORLD_ID = "datacron-phase4-poc";
export const ASTROCOM_PILOT_WORLD_ID = "datacron-phase5-pilot";

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

export function resolveBrowserEntries(liveIndex) {
  if (Array.isArray(liveIndex) && liveIndex.length > 0) {
    return { source: "live", entries: liveIndex };
  }
  return { source: "empty", entries: [] };
}

export function isSyntheticGeneratedSummary(summary) {
  return Boolean(summary && typeof summary.status === "string" && Number.isInteger(summary.rejectedCount));
}

