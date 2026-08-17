/**
 * Foundry document adapters for Phase 10 orchestration.
 * Isolated from the ApplicationV2 module so UI source stays free of Actor.create.
 */
import { MODULE_ID } from "../../logger.js";
import { SETTING_KEYS } from "../../settings.js";

export function buildFoundryCreateDeps() {
  const hooksSetting = (() => {
    try {
      return game.settings.get(MODULE_ID, SETTING_KEYS.shipyardPhase10TestHooks) ?? {};
    } catch (_error) {
      return {};
    }
  })();
  return {
    user: game.user,
    worldId: game.world?.id ?? null,
    testMode: Boolean(hooksSetting.enabled),
    hooks: hooksSetting.hooks ?? {},
    existingActors: (game.actors?.contents ?? []).map((actor) => ({
      id: actor.id,
      name: actor.name
    })),
    existingFolders: (game.folders?.contents ?? [])
      .filter((folder) => folder.type === "Actor")
      .map((folder) => ({ id: folder.id, name: folder.name, type: folder.type })),
    now: () => Date.now(),
    actorCreate: (data) => Actor.create(data),
    deleteActor: (id) => game.actors.get(id)?.delete(),
    deleteFolder: (id) => game.folders.get(id)?.delete(),
    resolvePackItem: async (ref) => {
      const doc = await fromUuid(ref.uuid);
      if (!doc) return null;
      const obj = doc.toObject();
      obj.flags = obj.flags ?? {};
      obj.flags.core = { ...(obj.flags.core ?? {}), sourceId: ref.uuid };
      if (ref.quantity && obj.system) obj.system.quantity = ref.quantity;
      return obj;
    }
  };
}

export function listActorFolders() {
  return (game.folders?.contents ?? [])
    .filter((folder) => folder.type === "Actor")
    .map((folder) => ({ id: folder.id, name: folder.name }));
}

export function listOwnershipCandidates() {
  return (game.users?.contents ?? [])
    .filter((user) => !user.isGM)
    .map((user) => ({ id: user.id, name: user.name }));
}
