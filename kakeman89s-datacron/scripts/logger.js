export const MODULE_ID = "kakeman89s-datacron";
export const LOG_PREFIX = "[Kakeman89s Datacron]";

function formatArgs(args) {
  return [LOG_PREFIX, ...args];
}

function isDebugEnabled() {
  try {
    return Boolean(globalThis.game?.settings?.get?.(MODULE_ID, "debugMode"));
  } catch (_error) {
    return false;
  }
}

export function logDebug(...args) {
  if (!isDebugEnabled()) return;
  console.debug(...formatArgs(args));
}

export function logInfo(...args) {
  console.info(...formatArgs(args));
}

export function logWarn(...args) {
  console.warn(...formatArgs(args));
}

export function logError(...args) {
  console.error(...formatArgs(args));
}
