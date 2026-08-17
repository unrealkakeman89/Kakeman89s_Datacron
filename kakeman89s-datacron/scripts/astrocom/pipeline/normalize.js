import { DATA_REGION_ALIASES, MATRIX_REGIONS, REGION_CAPITALIZATION } from "./constants.js";

export function collapseSpaces(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function unicodeNormalize(value) {
  return collapseSpaces(value).normalize("NFKC");
}

export function matchKey(value) {
  return unicodeNormalize(value)
    .toLowerCase()
    .replaceAll("’", "'")
    .replaceAll("`", "'");
}

export function slugForId(value) {
  return matchKey(value)
    .replaceAll("'", "")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");
}

export function emptyToNull(value) {
  if (value == null) return null;
  const text = unicodeNormalize(value);
  return text === "" ? null : text;
}

export function normalizeRegionValue(raw) {
  const value = emptyToNull(raw);
  if (!value) return { value: null, rule: null, changed: false };
  if (REGION_CAPITALIZATION[value]) {
    return { value: REGION_CAPITALIZATION[value], rule: "region-capitalization", changed: true };
  }
  if (DATA_REGION_ALIASES[value]) {
    return { value: DATA_REGION_ALIASES[value], rule: "data-region-alias", changed: true };
  }
  return { value, rule: null, changed: false };
}

export function normalizeSectorValue(raw) {
  const value = emptyToNull(raw);
  if (!value) return { value: null, matchValue: null, rule: null };
  const stripped = value.replace(/\s+sector$/i, "").trim();
  return {
    value,
    matchValue: stripped,
    rule: stripped !== value ? "sector-suffix-stripped-for-match" : null
  };
}

export function regionIsMatrixMember(region) {
  return MATRIX_REGIONS.includes(region);
}

export function presenceFromSourceField(raw, { absentMeans = "missing" } = {}) {
  const value = emptyToNull(raw);
  if (value == null) {
    return { presence: absentMeans };
  }
  return { presence: "present", value, rawValue: String(raw) };
}

export function geographyField(raw, { absentMeans = "missing", kind = "generic" } = {}) {
  if (kind === "region") {
    const normalized = normalizeRegionValue(raw);
    if (!normalized.value) return { presence: absentMeans, rawValue: raw ?? null, normalizationRule: null };
    return {
      presence: "present",
      value: normalized.value,
      rawValue: emptyToNull(raw),
      normalizationRule: normalized.rule
    };
  }
  if (kind === "sector") {
    const normalized = normalizeSectorValue(raw);
    if (!normalized.value) return { presence: absentMeans, rawValue: raw ?? null, normalizationRule: null };
    return {
      presence: "present",
      value: normalized.value,
      rawValue: emptyToNull(raw),
      normalizationRule: normalized.rule,
      matchValue: normalized.matchValue
    };
  }
  return presenceFromSourceField(raw, { absentMeans });
}

export function provisionalStableId(name, suffix = "") {
  const slug = slugForId(name) || "unnamed";
  return suffix ? `prov:${slug}:${suffix}` : `prov:${slug}`;
}

export function approvedStableId(name, continuity) {
  const slug = slugForId(name) || "unnamed";
  return `ac:${continuity}:${slug}`;
}
