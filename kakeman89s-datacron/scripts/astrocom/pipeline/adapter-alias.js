import { DATASET_IDS } from "./constants.js";
import { appendFlag, conflictFlag } from "./flags.js";
import { matchKey, unicodeNormalize } from "./normalize.js";

export function invertAliasMap(aliasObject) {
  const forward = [];
  const reverse = new Map();
  const collisions = [];
  for (const [alias, canonical] of Object.entries(aliasObject ?? {})) {
    const aliasKey = matchKey(alias);
    const canonicalName = unicodeNormalize(canonical);
    forward.push({ alias: unicodeNormalize(alias), aliasKey, canonicalName, canonicalKey: matchKey(canonicalName) });
    if (reverse.has(aliasKey) && reverse.get(aliasKey) !== canonicalName) {
      collisions.push({ alias, left: reverse.get(aliasKey), right: canonicalName });
    }
    reverse.set(aliasKey, canonicalName);
  }
  return { forward, reverse, collisions };
}

export function applyAliases(records, aliasObject) {
  const { forward, collisions } = invertAliasMap(aliasObject);
  const canonicalKeys = new Set(records.map((record) => record.normalizedName));
  let next = records.map((record) => ({ ...record, aliases: [...(record.aliases ?? [])] }));

  for (const entry of forward) {
    const targets = next.filter((record) => record.normalizedName === entry.canonicalKey);
    if (!targets.length) continue;
    next = next.map((record) => {
      if (record.normalizedName !== entry.canonicalKey) return record;
      const aliases = record.aliases.includes(entry.alias) ? record.aliases : [...record.aliases, entry.alias];
      let updated = {
        ...record,
        aliases,
        adapterSources: record.adapterSources.includes(DATASET_IDS.ALIAS)
          ? record.adapterSources
          : [...record.adapterSources, DATASET_IDS.ALIAS]
      };
      if (canonicalKeys.has(entry.aliasKey) && entry.aliasKey !== entry.canonicalKey) {
        updated = appendFlag(
          updated,
          conflictFlag("alias-equals-canonical", "warning", `Alias ${entry.alias} matches another canonical name.`, ["aliases"])
        );
      }
      return updated;
    });
  }

  if (collisions.length) {
    next = next.map((record) =>
      appendFlag(
        record,
        conflictFlag("alias-collision", "blocking", "Alias map contains colliding aliases.", ["aliases"])
      )
    );
  }

  return { records: next, collisions };
}
