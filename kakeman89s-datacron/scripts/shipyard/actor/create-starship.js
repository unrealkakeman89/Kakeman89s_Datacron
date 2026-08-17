/**
 * GM-local Starship creation orchestration.
 * Foundry writes live here only. Mapping remains pure.
 */
import { MODULE_ID } from "../../logger.js";
import { calculateBuild } from "../calculate.js";
import { mapStarshipActor } from "./map-actor.js";
import { buildCreationPreview, previewIsCurrent } from "./preview.js";
import { evaluateCreationEligibility } from "./eligibility.js";
import { TARGET_SCHEMA_PROFILE } from "./mapping-schema.js";
import { rollbackCreation } from "./rollback.js";
import { validateMappedActor } from "./validate-mapping.js";

const PHASE10_WORLD_ID = "datacron-phase10-actor";

/** @type {{ running: boolean, consumed: Set<string> }} */
const operationState = {
  running: false,
  consumed: new Set()
};

export function resetCreationOperationState() {
  operationState.running = false;
  operationState.consumed = new Set();
}

export function isOperationConsumed(operationId) {
  return operationState.consumed.has(operationId);
}

function injectionAllowed(worldId, user, testMode) {
  return (
    worldId === PHASE10_WORLD_ID &&
    Boolean(user?.isGM) &&
    Boolean(testMode)
  );
}

function resolveHooks(deps, user) {
  const worldId = deps.worldId ?? null;
  const testMode = Boolean(deps.testMode);
  if (!injectionAllowed(worldId, user, testMode)) return {};
  return deps.hooks ?? {};
}

async function resolvePackItems(refs, deps) {
  if (typeof deps.resolvePackItem !== "function") {
    return refs.map((ref) => ({
      name: ref.name,
      type: ref.type,
      flags: {
        core: { sourceId: ref.uuid }
      },
      _stats: { compendiumSource: ref.uuid },
      system: { quantity: ref.quantity ?? 1 },
      activities: ref.preserveActivities ? { preserved: true } : undefined
    }));
  }
  const items = [];
  for (const ref of refs) {
    const copied = await deps.resolvePackItem(ref);
    if (copied) items.push(copied);
  }
  return items;
}

function verifyCreatedActor(actor, mapping) {
  const errors = [];
  if (!actor) errors.push("actor-missing");
  if (actor?.type !== "vehicle") errors.push("actor-type-mismatch");
  if (actor?.flags?.sw5e?.legacyStarshipActor?.type !== "starship") {
    errors.push("identity-mismatch");
  }
  if (actor?.type === "character") errors.push("character-backed-created");
  const expectedName = mapping?.actorSource?.name;
  if (expectedName && actor?.name !== expectedName) errors.push("name-mismatch");
  return { ok: errors.length === 0, errors };
}

/**
 * @param {object} input
 * @param {object} deps
 */
export async function createStarshipFromDraft(input, deps = {}) {
  const user = deps.user ?? input.user;
  const draft = input.draft;
  const options = { ...(input.options ?? {}) };
  const profile = input.profile ?? TARGET_SCHEMA_PROFILE;
  const hooks = resolveHooks(deps, user);

  if (operationState.running) {
    return { ok: false, status: "failed", errors: ["operation-running"], actor: null };
  }
  if (options.operationId && operationState.consumed.has(options.operationId)) {
    return { ok: false, status: "failed", errors: ["operation-consumed"], actor: null };
  }

  const calculation = calculateBuild(structuredClone(draft?.input ?? {}));
  const mapping = mapStarshipActor({
    draft,
    calculation,
    options,
    profile
  });
  const preview = input.preview;
  if (!previewIsCurrent(preview, mapping, draft, calculation, options)) {
    return { ok: false, status: "failed", errors: ["preview-stale"], actor: null };
  }

  const eligibility = evaluateCreationEligibility({
    user,
    featureEnabled: input.featureEnabled,
    draft,
    calculation,
    mapping,
    preview,
    options,
    profile,
    existingActors: deps.existingActors ?? [],
    operationRunning: operationState.running,
    consumedOperationIds: [...operationState.consumed],
    sessionOwnerId: input.sessionOwnerId ?? draft?.sessionOwnerId,
    currentUserId: user?.id,
    usingPlayerProjection: Boolean(input.usingPlayerProjection)
  });
  if (!eligibility.ok) {
    return { ok: false, status: "failed", errors: eligibility.errors, actor: null };
  }

  const mappingCheck = validateMappedActor(mapping, profile);
  if (!mappingCheck.ok) {
    return { ok: false, status: "failed", errors: mappingCheck.errors, actor: null };
  }

  operationState.running = true;
  const created = { actor: null, folder: null, itemIds: [] };
  const preExisting = {
    actorIds: (deps.existingActors ?? []).map((a) => a.id).filter(Boolean),
    folderIds: (deps.existingFolders ?? []).map((f) => f.id).filter(Boolean),
    itemIds: []
  };

  try {
    if (hooks.failActorCreate) {
      throw new Error("injected-actor-create-failure");
    }

    const itemSources = await resolvePackItems(mapping.embeddedItemSources, deps);
    const actorPayload = structuredClone({
      ...mapping.actorSource,
      items: itemSources
    });
    actorPayload.flags.sw5e.createStarship = true;
    const stamp = deps.now?.() ?? null;
    if (actorPayload.flags[MODULE_ID]) {
      actorPayload.flags[MODULE_ID].createdAt = stamp;
      actorPayload.flags[MODULE_ID].previewHash = preview.previewHash;
    }

    if (typeof deps.actorCreate !== "function") {
      throw new Error("actor-create-unavailable");
    }

    const actor = await deps.actorCreate(actorPayload);
    created.actor = actor;

    if (hooks.failEmbeddedItems) {
      throw new Error("injected-embedded-item-failure");
    }

    const verified = verifyCreatedActor(actor, mapping);
    if (hooks.failPostVerify || !verified.ok) {
      throw new Error(hooks.failPostVerify ? "injected-post-verify-failure" : verified.errors.join(","));
    }

    operationState.consumed.add(options.operationId);
    return {
      ok: true,
      status: "created",
      errors: [],
      actor,
      mapping,
      calculation,
      previewHash: preview.previewHash
    };
  } catch (error) {
    const rollback = await rollbackCreation(
      { operationId: options.operationId, created, preExisting },
      {
        deleteActor: deps.deleteActor,
        deleteFolder: deps.deleteFolder,
        failRollback: Boolean(hooks.failRollback)
      }
    );
    return {
      ok: false,
      status: rollback.partial ? "partial-failure" : "failed",
      errors: [String(error?.message ?? error), ...rollback.errors],
      actor: rollback.remaining.length ? created.actor : null,
      rollback,
      remaining: rollback.remaining
    };
  } finally {
    operationState.running = false;
  }
}

export { PHASE10_WORLD_ID, MODULE_ID };
