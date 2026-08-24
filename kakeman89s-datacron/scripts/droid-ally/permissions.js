export function canOpenDroidAllyPricing(user, options = {}) {
  if (!options.featureEnabled) return false;
  return Boolean(user?.isGM);
}

export function canCalculateDroidAllyPricing(user, options = {}) {
  return canOpenDroidAllyPricing(user, options);
}

export function canQuoteDroidAllyPricing(user, options = {}) {
  return canOpenDroidAllyPricing(user, options);
}

export function droidAllyPermissionDenied() {
  return {
    ok: false,
    status: "permission-denied",
    errorKey: "KAKEMAN89SDATACRON.DroidAllyPricing.PermissionDenied"
  };
}
