export const BROWSER_STATE = Object.freeze({
  LOADING: "loading",
  LIVE: "live",
  EMPTY: "empty",
  PARTIAL: "partial",
  UNAVAILABLE: "unavailable",
  ERROR: "error",
  STALE: "stale",
  DISABLED: "disabled"
});

/**
 * Resolve a named AstroCom browser UI state from pack/index outcomes.
 * Pure helper for tests and ApplicationV2 context.
 */
export function resolveBrowserState({
  featureEnabled = true,
  loading = false,
  error = null,
  requestedPacks = [],
  foundPacks = 0,
  entryCount = 0,
  stale = false
} = {}) {
  if (!featureEnabled) {
    return { state: BROWSER_STATE.DISABLED, messageKey: "KAKEMAN89SDATACRON.AstroCom.StateDisabled" };
  }
  if (loading) {
    return { state: BROWSER_STATE.LOADING, messageKey: "KAKEMAN89SDATACRON.AstroCom.StateLoading" };
  }
  if (error) {
    return {
      state: BROWSER_STATE.ERROR,
      messageKey: "KAKEMAN89SDATACRON.AstroCom.StateError",
      detail: String(error?.message ?? error)
    };
  }
  if (stale) {
    return { state: BROWSER_STATE.STALE, messageKey: "KAKEMAN89SDATACRON.AstroCom.StateStale" };
  }
  if (requestedPacks.length > 0 && foundPacks === 0) {
    return { state: BROWSER_STATE.UNAVAILABLE, messageKey: "KAKEMAN89SDATACRON.AstroCom.StateUnavailable" };
  }
  if (foundPacks > 0 && foundPacks < requestedPacks.length) {
    return {
      state: BROWSER_STATE.PARTIAL,
      messageKey: "KAKEMAN89SDATACRON.AstroCom.StatePartial",
      entryCount
    };
  }
  if (entryCount === 0) {
    return { state: BROWSER_STATE.EMPTY, messageKey: "KAKEMAN89SDATACRON.AstroCom.StateEmpty" };
  }
  return { state: BROWSER_STATE.LIVE, messageKey: null, entryCount };
}
