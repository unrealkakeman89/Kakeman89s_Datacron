/**
 * Mapping and image-path validation. Pure.
 */
import {
  ACTOR_TYPE_VEHICLE,
  PACK_ITEMS,
  STARSHIP_IDENTITY_TYPE,
  TARGET_SCHEMA_PROFILE
} from "./mapping-schema.js";

export function validateImagePath(imagePath) {
  if (imagePath == null || String(imagePath).trim() === "") {
    return { ok: true, useDefault: true, path: null };
  }
  const path = String(imagePath).trim().replace(/\\/g, "/");
  if (/^[a-zA-Z]:\//.test(path) || path.startsWith("//") || /^file:/i.test(path)) {
    return { ok: false, useDefault: false, path, code: "unsafe-image-path" };
  }
  if (/^https?:\/\//i.test(path)) {
    return { ok: false, useDefault: false, path, code: "remote-image-path" };
  }
  if (!/^(modules|systems|icons|worlds)\//i.test(path)) {
    return { ok: false, useDefault: false, path, code: "unsupported-image-path" };
  }
  return { ok: true, useDefault: false, path };
}

export function validateMappedActor(mapping, profile = TARGET_SCHEMA_PROFILE) {
  const errors = [];
  const actor = mapping?.actorSource;
  if (!actor || typeof actor !== "object") {
    return { ok: false, errors: ["actor source missing"] };
  }
  if (!String(actor.name ?? "").trim()) errors.push("actor name required");
  if (actor.type !== ACTOR_TYPE_VEHICLE && actor.type !== profile.actorType) {
    errors.push("actor type must be vehicle");
  }
  const identity = actor.flags?.sw5e?.legacyStarshipActor?.type;
  if (identity !== STARSHIP_IDENTITY_TYPE) {
    errors.push("starship identity flag required");
  }
  if (actor.type === "character" || actor.flags?.sw5e?.starshipCharacter?.enabled) {
    errors.push("character-backed starship is not a create target");
  }
  if (profile.sizeItemRequired) {
    const hasSize = (mapping.embeddedItemSources ?? []).some((item) => item.kind === "size");
    if (!hasSize) errors.push("size item mapping required");
  }
  if (profile.roleItemRequired) {
    const hasRole = (mapping.embeddedItemSources ?? []).some((item) => item.kind === "role");
    if (!hasRole) errors.push("role item mapping required");
  }
  if (mapping.imageCheck && mapping.imageCheck.ok === false) {
    errors.push(mapping.imageCheck.code ?? "invalid-image-path");
  }
  const blob = JSON.stringify(actor);
  if (/workbookPath|SotG Shipbuilder|[A-Z]:\\Users\\/i.test(blob)) {
    errors.push("actor source contains prohibited private path");
  }
  if (/\bckauble\b|\bchris\b/i.test(blob)) {
    errors.push("personal-name attribution forbidden");
  }
  return { ok: errors.length === 0, errors };
}

export function knownSizeItemId(sizeDisplay) {
  return PACK_ITEMS.size[sizeDisplay]?.id ?? null;
}
