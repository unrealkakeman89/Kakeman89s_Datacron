import { logWarn, MODULE_ID } from "./logger.js";
import { SETTING_KEYS } from "./settings.js";
import { actorIsVisibleToUser } from "./navcomputer/permissions.js";
import { RESOURCE_PROFILE_EXISTING_UNVERIFIED } from "./navcomputer/resource-profile.js";

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
  const user = game.user ?? null;
  const list = actors.filter(
    (a) =>
      a &&
      ["character", "npc"].includes(a.type) &&
      !isNormalizedStarship(a) &&
      actorIsVisibleToUser(a, user)
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
  const user = game.user ?? null;
  const list = actors.filter((a) => a && isStarshipActor(a) && actorIsVisibleToUser(a, user));
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

function asPlain(value) {
  if (!value) return {};
  if (typeof value.toObject === "function") return value.toObject();
  return value;
}

function flagSystem(actor) {
  return asPlain(actor?.flags?.sw5e?.legacyStarshipActor?.system);
}

function preparedSystem(actor) {
  return asPlain(actor?.system);
}

function deploymentCrewCount(sys) {
  const items = sys?.attributes?.deployment?.crew?.items;
  if (Array.isArray(items) && items.length > 0) return items.length;
  return null;
}

function crewMinWorkforce(sys) {
  const n = Number(sys?.attributes?.equip?.size?.crewMinWorkforce);
  if (Number.isFinite(n) && n > 0) return Math.ceil(n);
  return null;
}

function vehicleCrewCount(sys) {
  const value = sys?.attributes?.crew?.value;
  if (Array.isArray(value) && value.length > 0) return value.length;
  return null;
}

function firstFinitePositive(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function readHyperdrive(actor) {
  const flag = flagSystem(actor);
  const prepared = preparedSystem(actor);
  const flagEquip = firstFinitePositive(flag.attributes?.equip?.hyperdrive?.class);
  if (flagEquip != null) return { hyperdrive: flagEquip, hyperdriveSource: "flag-equip" };
  const flagTravel = firstFinitePositive(flag.attributes?.travel?.hyperdriveClass);
  if (flagTravel != null) return { hyperdrive: flagTravel, hyperdriveSource: "flag-travel" };
  const prepEquip = firstFinitePositive(prepared.attributes?.equip?.hyperdrive?.class);
  if (prepEquip != null) return { hyperdrive: prepEquip, hyperdriveSource: "prepared-equip" };
  const prepTravel = firstFinitePositive(prepared.attributes?.travel?.hyperdriveClass);
  if (prepTravel != null) return { hyperdrive: prepTravel, hyperdriveSource: "prepared-travel" };
  const items = actor?.items ? [...actor.items] : [];
  for (const item of items) {
    const itemSys = asPlain(item.system);
    const hd = firstFinitePositive(itemSys?.attributes?.hdclass?.value);
    if (hd != null) return { hyperdrive: hd, hyperdriveSource: "item-hdclass" };
  }
  return { hyperdrive: null, hyperdriveSource: "unresolved" };
}

function optionalCapacity(sys, pathParts) {
  let cursor = sys;
  for (const part of pathParts) {
    cursor = cursor?.[part];
  }
  const n = Number(cursor);
  return Number.isFinite(n) ? n : null;
}

/**
 * NavComputer read-only adapter. Does not write Actor data.
 * @param {object | null | undefined} shipActor
 */
export function readStarshipTravelAdapter(shipActor) {
  const warnings = [];
  if (!shipActor) {
    return {
      crew: RESOURCE_PROFILE_EXISTING_UNVERIFIED.crewFallback,
      crewSource: "profile-default",
      warnings: ["No ship selected; using profile default crew 4."],
      hyperdrive: null,
      hyperdriveSource: "unresolved",
      fuelCapacity: null,
      fuelSource: "unresolved",
      suppliesCapacity: null,
      suppliesSource: "unresolved"
    };
  }

  const flag = flagSystem(shipActor);
  const prepared = preparedSystem(shipActor);
  let crew = deploymentCrewCount(flag);
  let crewSource = "flag-deployment";
  if (crew == null) {
    crew = crewMinWorkforce(flag);
    crewSource = "flag-crewMinWorkforce";
  }
  if (crew == null) {
    crew = deploymentCrewCount(prepared);
    crewSource = "prepared-deployment";
  }
  if (crew == null) {
    crew = crewMinWorkforce(prepared);
    crewSource = "prepared-crewMinWorkforce";
  }
  if (crew == null) {
    crew = vehicleCrewCount(prepared);
    crewSource = "vehicle-crew";
  }
  if (crew == null) {
    crew = RESOURCE_PROFILE_EXISTING_UNVERIFIED.crewFallback;
    crewSource = "profile-default";
    warnings.push("Ship crew could not be resolved; using profile default 4.");
  }

  const hyper = readHyperdrive(shipActor);
  if (hyper.hyperdriveSource === "unresolved") {
    warnings.push("Ship hyperdrive could not be resolved.");
  }

  const fuelCapacity =
    optionalCapacity(flag, ["attributes", "fuel", "fuelCap"]) ??
    optionalCapacity(prepared, ["attributes", "fuel", "fuelCap"]);
  const suppliesCapacity =
    optionalCapacity(flag, ["attributes", "food", "foodCap"]) ??
    optionalCapacity(prepared, ["attributes", "food", "foodCap"]);

  return {
    crew,
    crewSource,
    warnings,
    hyperdrive: hyper.hyperdrive,
    hyperdriveSource: hyper.hyperdriveSource,
    fuelCapacity,
    fuelSource: fuelCapacity == null ? "unresolved" : "capacity",
    suppliesCapacity,
    suppliesSource: suppliesCapacity == null ? "unresolved" : "capacity"
  };
}
