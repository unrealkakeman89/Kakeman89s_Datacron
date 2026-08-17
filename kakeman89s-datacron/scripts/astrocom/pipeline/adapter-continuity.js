import { DATASET_IDS } from "./constants.js";
import { conflictFlag } from "./flags.js";
import { matchKey } from "./normalize.js";

function hintFromCanonFlag(isCanon) {
  if (isCanon === true) return "canon";
  if (isCanon === false) return "legends";
  return null;
}

export function buildContinuityHintIndex(gridDb) {
  const byKey = new Map();
  for (const [grid, worlds] of Object.entries(gridDb ?? {})) {
    if (!Array.isArray(worlds)) continue;
    for (const world of worlds) {
      const key = matchKey(world?.name);
      if (!key) continue;
      const list = byKey.get(key) ?? [];
      list.push({
        name: world.name,
        grid,
        isCanon: world.is_canon,
        hint: hintFromCanonFlag(world.is_canon)
      });
      byKey.set(key, list);
    }
  }
  return byKey;
}

export function applyContinuityHints(records, gridDb) {
  const index = buildContinuityHintIndex(gridDb);
  return records.map((record) => {
    const hints = index.get(record.normalizedName) ?? [];
    if (!hints.length) return record;
    const unique = [...new Set(hints.map((item) => item.hint).filter(Boolean))];
    const flags = [...(record.conflictFlags ?? [])];
    if (unique.length > 1) {
      flags.push(conflictFlag("continuity-hint-conflict", "warning", "Continuity hints disagree; continuity remains unset.", ["continuityHint"]));
    }
    return {
      ...record,
      continuity: record.continuity,
      continuityHint: {
        value: unique.length === 1 ? unique[0] : null,
        source: DATASET_IDS.CONTINUITY_HINT,
        evidence: hints.map((item) => ({ grid: item.grid, isCanon: item.isCanon, hint: item.hint }))
      },
      conflictFlags: flags,
      adapterSources: record.adapterSources.includes(DATASET_IDS.CONTINUITY_HINT)
        ? record.adapterSources
        : [...record.adapterSources, DATASET_IDS.CONTINUITY_HINT]
    };
  });
}
