import { PRESENCE } from "../constants.js";

const RELATIONS = new Set(["primary", "subregion", "alternate"]);

function normalizedClassification(item) {
  if (!item || typeof item !== "object" || !String(item.value ?? "").trim() || !RELATIONS.has(item.relation)) {
    return null;
  }
  return {
    value: String(item.value).trim(),
    relation: item.relation,
    presence: item.presence ?? PRESENCE.PRESENT
  };
}

export function classificationsFromPrimary(region) {
  if (region?.presence !== PRESENCE.PRESENT || !String(region.value ?? "").trim()) return [];
  return [{ value: String(region.value).trim(), relation: "primary", presence: region.presence }];
}

export function ensurePrimaryRegion(classifications = [], region) {
  const normalized = classifications.map(normalizedClassification).filter(Boolean);
  const primary = classificationsFromPrimary(region)[0];
  if (!primary) return normalized;
  const matchingPrimary = normalized.findIndex((item) => item.relation === "primary" && item.value === primary.value);
  if (matchingPrimary >= 0) return normalized;
  const conflictingPrimary = normalized.find((item) => item.relation === "primary");
  if (conflictingPrimary) {
    throw new Error(`Region classification primary ${conflictingPrimary.value} conflicts with astrography.region ${primary.value}`);
  }
  return [...normalized.filter((item) => item.relation !== "primary"), primary];
}
