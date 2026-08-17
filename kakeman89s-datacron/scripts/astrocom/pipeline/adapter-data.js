import { PRESENCE } from "../constants.js";
import { DATASET_IDS } from "./constants.js";
import { appendFlag, conflictFlag } from "./flags.js";
import { emptyToNull, geographyField, matchKey } from "./normalize.js";

function physicalFromData(raw) {
  const atmosphere = emptyToNull(raw?.Atmosphere);
  const climate = emptyToNull(raw?.Climate);
  const gravity = raw?.Gravity == null ? null : String(raw.Gravity);
  if (!atmosphere && !climate && gravity == null && raw?.Diameter == null && raw?.Moons == null) {
    return { presence: PRESENCE.MISSING };
  }
  return {
    presence: PRESENCE.PRESENT,
    atmosphere,
    climate,
    gravity,
    diameter: raw?.Diameter ?? null,
    moons: raw?.Moons ?? null,
    suns: raw?.Suns ?? null
  };
}

function geographyDisagrees(left, right) {
  if (!right || right.presence !== PRESENCE.PRESENT) return false;
  if (!left || left.presence !== PRESENCE.PRESENT) return false;
  const leftMatch = left.matchValue ?? left.value;
  const rightMatch = right.matchValue ?? right.value;
  return matchKey(leftMatch) !== matchKey(rightMatch);
}

export function applyData001Enrichment(records, dataRecords) {
  const byKey = new Map();
  for (const raw of dataRecords ?? []) {
    const key = matchKey(raw?.Name);
    if (!key) continue;
    const list = byKey.get(key) ?? [];
    list.push(raw);
    byKey.set(key, list);
  }

  const ambiguous = [];
  const unmatchedData = [];
  const seenData = new Set();

  const next = records.map((record) => {
    const aliasKeys = (record.aliases ?? []).map((alias) => matchKey(alias));
    const keys = [record.normalizedName, ...aliasKeys];
    const matches = [];
    for (const key of keys) {
      for (const raw of byKey.get(key) ?? []) {
        if (!matches.includes(raw)) matches.push(raw);
      }
    }
    if (matches.length > 1) {
      ambiguous.push({ name: record.name, count: matches.length });
      return appendFlag(
        record,
        conflictFlag("data-ambiguous-match", "warning", "DATA-001 matched more than one overlay candidate; overlay skipped.", ["adapterSources"])
      );
    }
    if (!matches.length) return record;
    const raw = matches[0];
    seenData.add(raw);
    if (Object.prototype.hasOwnProperty.call(raw, "Image") && raw.Image) {
      // Image is ignored by design. Never copied onto the intermediate record.
    }
    const dataRegion = geographyField(raw.Region, { kind: "region" });
    const dataSector = geographyField(raw.Sector, { kind: "sector", absentMeans: "missing" });
    const dataGrid = geographyField(raw.Coord, { absentMeans: "missing" });
    let updated = {
      ...record,
      adapterSources: record.adapterSources.includes(DATASET_IDS.DATA_001)
        ? record.adapterSources
        : [...record.adapterSources, DATASET_IDS.DATA_001],
      rawSourceReferences: [...record.rawSourceReferences, { datasetId: DATASET_IDS.DATA_001, name: raw.Name }],
      physical: record.physical?.presence === PRESENCE.PRESENT ? record.physical : physicalFromData(raw)
    };
    if (geographyDisagrees(record.astrography.region, dataRegion)) {
      updated = appendFlag(
        updated,
        conflictFlag(
          "geography-disagreement-region",
          "warning",
          `ASTRO-001 region ${record.astrography.region.value} disagrees with DATA-001 ${dataRegion.value}. ASTRO-001 retained.`,
          ["astrography.region"]
        )
      );
    }
    if (geographyDisagrees(record.astrography.sector, dataSector)) {
      updated = appendFlag(
        updated,
        conflictFlag(
          "geography-disagreement-sector",
          "warning",
          `ASTRO-001 sector ${record.astrography.sector.value} disagrees with DATA-001 ${dataSector.value}. ASTRO-001 retained.`,
          ["astrography.sector"]
        )
      );
    }
    if (geographyDisagrees(record.astrography.grid, dataGrid)) {
      updated = appendFlag(
        updated,
        conflictFlag(
          "geography-disagreement-grid",
          "warning",
          `ASTRO-001 grid ${record.astrography.grid.value} disagrees with DATA-001 ${dataGrid.value}. ASTRO-001 retained.`,
          ["astrography.grid"]
        )
      );
    }
    return updated;
  });

  for (const raw of dataRecords ?? []) {
    if (!seenData.has(raw)) unmatchedData.push(raw?.Name ?? null);
  }

  return { records: next, ambiguous, unmatchedDataCount: unmatchedData.length };
}
