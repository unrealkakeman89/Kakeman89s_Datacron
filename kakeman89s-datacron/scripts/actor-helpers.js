import { logWarn, MODULE_ID } from "./logger.js";
import { SETTING_KEYS } from "./settings.js";

/** @param {Actor} actor */
export function isNormalizedStarship(actor) {
  return actor?.type === "character" && actor?.flags?.sw5e?.starshipCharacter?.enabled === true;
}

/** @param {Actor} actor */
export function isLegacyStarshipVehicle(actor) {
  return actor?.type === "vehicle" && actor?.flags?.sw5e?.legacyStarshipActor?.type === "starship";
}

/** Normalized SW5E starship, legacy starship vehicle, or unmigrated `starship` type. */
export function isStarshipActor(actor) {
  return (
    isNormalizedStarship(actor) ||
    isLegacyStarshipVehicle(actor) ||
    actor?.type === "starship"
  );
}

/**
 * Deployable pilots: character/npc, excluding normalized starship “character” shells.
 * @returns {{ uuid: string, name: string }[]}
 */
export function getPilotActorOptions() {
  const actors = game.actors?.contents ?? [];
  const list = actors.filter(
    (a) => a && ["character", "npc"].includes(a.type) && !isNormalizedStarship(a)
  );
  return list
    .map((a) => ({ uuid: a.uuid, name: a.name ?? a.uuid }))
    .sort((x, y) => x.name.localeCompare(y.name));
}

/**
 * Ship actors per Phase 0 (compatibility-notes): normalized starship, legacy vehicle, or `starship`.
 * @returns {{ uuid: string, name: string }[]}
 */
export function getShipActorOptions() {
  const actors = game.actors?.contents ?? [];
  const list = actors.filter((a) => a && isStarshipActor(a));
  return list
    .map((a) => ({ uuid: a.uuid, name: a.name ?? a.uuid }))
    .sort((x, y) => x.name.localeCompare(y.name));
}

/** @param {Actor} actor */
function skillExists(actor, key) {
  if (!key || !actor?.system?.skills) return false;
  const entry = actor.system.skills[key];
  return entry != null && typeof entry === "object";
}

/**
 * Phase 0 primary key `pil`, then `piloting`, then configured fallback (default acr), then `tec`.
 * @returns {{ skillKey: string | null, usedFallback: boolean }}
 */
export function resolvePilotingSkillKey(actor) {
  if (!actor) return { skillKey: null, usedFallback: false };

  if (skillExists(actor, "pil")) return { skillKey: "pil", usedFallback: false };
  if (skillExists(actor, "piloting")) return { skillKey: "piloting", usedFallback: false };

  const configured =
    String(game.settings?.get?.(MODULE_ID, SETTING_KEYS.pilotingFallbackSkill) ?? "acr").trim() ||
    "acr";

  if (skillExists(actor, configured)) {
    logWarn(
      `Piloting skills (pil / piloting) missing on "${actor.name}"; using configured fallback "${configured}".`
    );
    return { skillKey: configured, usedFallback: true };
  }

  if (configured !== "tec" && skillExists(actor, "tec")) {
    logWarn(
      `Piloting skills and configured fallback "${configured}" missing on "${actor.name}"; using tec.`
    );
    return { skillKey: "tec", usedFallback: true };
  }

  logWarn(`No usable piloting or fallback skill found on "${actor.name}"; cannot roll.`);
  return { skillKey: null, usedFallback: true };
}

/**
 * @param {string} [uuid]
 * @returns {Actor | null}
 */
export function getActorFromUuid(uuid) {
  if (!uuid) return null;
  const doc = globalThis.fromUuidSync?.(uuid);
  return doc instanceof Actor ? doc : null;
}

/**
 * Hyperdrive class as a travel-time multiplier (Phase 0 paths). Higher class = slower = longer time.
 * @param {Actor | null | undefined} shipActor
 * @returns {number}
 */
export function getHyperdriveMultiplierFromShipActor(shipActor) {
  if (!shipActor?.system) return 1;

  const sys =
    typeof shipActor.system.toObject === "function" ? shipActor.system.toObject() : shipActor.system;

  const equipClass = sys.attributes?.equip?.hyperdrive?.class;
  const equipNum = Number(equipClass);
  if (Number.isFinite(equipNum) && equipNum > 0) return equipNum;

  const items = shipActor.items ? [...shipActor.items] : [];
  for (const item of items) {
    const itemSys =
      typeof item.system?.toObject === "function" ? item.system.toObject() : item.system;
    const hd = itemSys?.attributes?.hdclass?.value;
    const hn = Number(hd);
    if (Number.isFinite(hn) && hn > 0) return hn;
  }

  const travelLegacy = sys.attributes?.travel?.hyperdriveClass;
  const tn = Number(travelLegacy);
  if (Number.isFinite(tn) && tn > 0) return tn;

  for (const item of items) {
    const desc =
      typeof item.system?.description === "string"
        ? item.system.description
        : item.system?.description?.value ?? "";
    const blob = `${item.name ?? ""} ${desc}`;
    const match = String(blob).match(/\bclass\s*(\d+)\b/i);
    if (match) {
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }

  logWarn(
    "Could not resolve starship hyperdrive class from equip / items / travel; using multiplier 1.0."
  );
  return 1;
}
