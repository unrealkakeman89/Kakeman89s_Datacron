(function phase0RuntimeInspector() {
  const PREFIX = "[Kakeman89s Datacron][Phase 0]";
  const MAX_PREVIEW_ACTORS = 2;

  if (typeof game === "undefined") {
    console.warn(`${PREFIX} No Foundry runtime detected. Run this file from a Foundry browser console or macro.`);
    return;
  }

  function safeNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function shallowClone(value, depth = 2) {
    if (depth < 0) return "[Max depth]";
    if (value == null) return value;
    if (Array.isArray(value)) {
      return value.slice(0, 6).map((entry) => shallowClone(entry, depth - 1));
    }
    if (typeof value !== "object") return value;

    const output = {};
    for (const [key, entry] of Object.entries(value).slice(0, 20)) {
      output[key] = shallowClone(entry, depth - 1);
    }
    return output;
  }

  function getActorSystem(actor) {
    if (!actor?.system) return {};
    return typeof actor.system.toObject === "function" ? actor.system.toObject() : actor.system;
  }

  function isNormalizedStarship(actor) {
    return actor?.type === "character" && actor?.flags?.sw5e?.starshipCharacter?.enabled === true;
  }

  function isLegacyStarshipVehicle(actor) {
    return actor?.type === "vehicle" && actor?.flags?.sw5e?.legacyStarshipActor?.type === "starship";
  }

  function buildActorPreview(actor) {
    const system = getActorSystem(actor);
    const skills = system.skills ?? {};
    const attributes = system.attributes ?? {};

    return {
      name: actor.name,
      type: actor.type,
      uuid: actor.uuid,
      normalizedStarship: isNormalizedStarship(actor),
      legacyStarshipVehicle: isLegacyStarshipVehicle(actor),
      skillKeys: Object.keys(skills),
      pilotingValue: safeNumber(skills?.pil?.value, null),
      preview: {
        details: shallowClone(system.details ?? {}, 2),
        attributes: shallowClone(
          {
            deployment: attributes.deployment,
            equip: attributes.equip,
            fuel: attributes.fuel,
            travel: attributes.travel
          },
          2
        ),
        sw5eFlags: shallowClone(actor.flags?.sw5e ?? {}, 2)
      }
    };
  }

  const actors = Array.from(game.actors?.contents ?? []);
  const actorTypeCounts = actors.reduce((counts, actor) => {
    const key = actor?.type ?? "<missing>";
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});

  const moduleSnapshots = ["sw5e", "sw5e-module"].map((id) => {
    const module = game.modules?.get(id);
    return {
      id,
      present: Boolean(module),
      active: module?.active ?? null,
      version: module?.version ?? null
    };
  });

  const previewCandidates = [];
  const normalizedStarship = actors.find(isNormalizedStarship);
  const legacyVehicleStarship = actors.find(isLegacyStarshipVehicle);
  const likelyPilot = actors
    .filter((actor) => ["character", "npc"].includes(actor?.type) && !isNormalizedStarship(actor))
    .sort((left, right) => {
      const leftPil = safeNumber(getActorSystem(left)?.skills?.pil?.value, -1);
      const rightPil = safeNumber(getActorSystem(right)?.skills?.pil?.value, -1);
      return rightPil - leftPil || String(left.name).localeCompare(String(right.name));
    })[0];

  for (const candidate of [normalizedStarship, legacyVehicleStarship, likelyPilot]) {
    if (!candidate) continue;
    if (previewCandidates.some((actor) => actor.id === candidate.id)) continue;
    previewCandidates.push(candidate);
    if (previewCandidates.length >= MAX_PREVIEW_ACTORS) break;
  }

  const summary = {
    foundryVersion: game.version ?? null,
    systemId: game.system?.id ?? null,
    systemVersion: game.system?.version ?? null,
    worldId: game.world?.id ?? null,
    actorCount: actors.length,
    actorTypeCounts,
    modules: moduleSnapshots,
    normalizedStarshipCount: actors.filter(isNormalizedStarship).length,
    legacyStarshipVehicleCount: actors.filter(isLegacyStarshipVehicle).length,
    pilotableActorCount: actors.filter((actor) => ["character", "npc"].includes(actor?.type) && !isNormalizedStarship(actor)).length
  };

  const skillKeySamples = actors
    .filter((actor) => ["character", "npc", "vehicle"].includes(actor?.type) || isNormalizedStarship(actor))
    .slice(0, 6)
    .map((actor) => {
      const system = getActorSystem(actor);
      return {
        name: actor.name,
        type: actor.type,
        normalizedStarship: isNormalizedStarship(actor),
        skillKeys: Object.keys(system.skills ?? {})
      };
    });

  const previews = previewCandidates.map(buildActorPreview);

  console.groupCollapsed(`${PREFIX} Runtime Summary`);
  console.info(summary);
  console.info(`${PREFIX} Skill key samples`, skillKeySamples);
  console.info(`${PREFIX} Actor previews`, previews);
  console.groupEnd();

  globalThis.SW5E_NAV_PHASE0 = {
    summary,
    skillKeySamples,
    previews
  };
})();
