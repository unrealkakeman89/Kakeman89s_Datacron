import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  createEmptyDraft,
  updateDraftField,
  serializeCanonicalDraft,
  hydrateCanonicalDraft
} from "../draft-state.js";
import { calculateBuild } from "../calculate.js";
import { buildProjection, validateProjection } from "../projection.js";
import {
  canFinalizeShipyardBuild,
  SHIPYARD_ROLES
} from "../permissions.js";
import {
  validateShipyardSocketMessage,
  SHIPYARD_MESSAGE_TYPES,
  REJECTED_PHASE10_MESSAGE_TYPES
} from "../socket.js";
import { WORKBOOK_SHA256 } from "../schema.js";
import {
  TARGET_SCHEMA_PROFILE,
  ACTOR_TYPE_VEHICLE,
  STARSHIP_IDENTITY_TYPE,
  PACK_ITEMS,
  markProfileVerifiedLive,
  DEFAULT_ACTOR_IMAGE
} from "../actor/mapping-schema.js";
import { mapStarshipActor } from "../actor/map-actor.js";
import { mapEmbeddedItems } from "../actor/map-items.js";
import { buildCreationPreview, computePreviewHash } from "../actor/preview.js";
import { validateMappedActor, validateImagePath } from "../actor/validate-mapping.js";
import { evaluateCreationEligibility } from "../actor/eligibility.js";
import {
  createStarshipFromDraft,
  resetCreationOperationState
} from "../actor/create-starship.js";
import { rollbackCreation } from "../actor/rollback.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE_DIR = path.resolve(HERE, "../../..");
const gm = { id: "gm1", role: SHIPYARD_ROLES.GAMEMASTER, isGM: true };
const player = { id: "p1", role: SHIPYARD_ROLES.PLAYER, isGM: false };
const profile = markProfileVerifiedLive();

function validDraft() {
  let draft = createEmptyDraft({ sessionOwnerId: "gm1" });
  draft = updateDraftField(draft, "size", "Small", { expectedRevision: 1 }).draft;
  draft = updateDraftField(draft, "role", "Superiority Fighter", {
    expectedRevision: draft.revision
  }).draft;
  return draft;
}

function mapWith(draft, optionOverrides = {}) {
  const options = {
    actorName: "Test Starship",
    gmUserId: "gm1",
    operationId: "op-1",
    folderId: null,
    imagePath: "",
    ownership: {},
    ...optionOverrides
  };
  const mapping = mapStarshipActor({
    draft,
    calculation: draft.calculation,
    options,
    profile
  });
  const preview = buildCreationPreview({
    mapping,
    draft,
    calculation: draft.calculation,
    options
  });
  return { mapping, preview, options };
}

test("canonical draft persistence preserves baseAbilities and recalculates", () => {
  let draft = validDraft();
  draft = updateDraftField(draft, "baseAbilities", { str: 12, dex: 14, con: 10, int: 10, wis: 8 }, {
    expectedRevision: draft.revision
  }).draft;
  const serialized = serializeCanonicalDraft(draft);
  assert.equal(serialized.input.baseAbilities.dex, 14);
  assert.equal(serialized.calculation, undefined);
  const restored = hydrateCanonicalDraft(serialized, { sessionOwnerId: "gm1" });
  assert.equal(restored.input.baseAbilities.dex, 14);
  assert.equal(restored.calculation.ok, true);
  assert.equal(restored.calculation.result.grandTotal, draft.calculation.result.grandTotal);
});

test("mapping purity does not mutate draft or calculation", () => {
  const draft = validDraft();
  const before = JSON.stringify(draft);
  mapStarshipActor({
    draft,
    calculation: draft.calculation,
    options: { actorName: "A", gmUserId: "gm1", operationId: "op-1" },
    profile
  });
  assert.equal(JSON.stringify(draft), before);
});

test("actor mapping uses vehicle and starship flag, not character", () => {
  const draft = validDraft();
  const { mapping } = mapWith(draft);
  assert.equal(mapping.actorSource.type, ACTOR_TYPE_VEHICLE);
  assert.equal(mapping.actorSource.flags.sw5e.legacyStarshipActor.type, STARSHIP_IDENTITY_TYPE);
  assert.equal(mapping.actorSource.flags.sw5e.starshipCharacter, undefined);
  assert.notEqual(mapping.actorSource.type, "character");
  const check = validateMappedActor(mapping, profile);
  assert.equal(check.ok, true, check.errors.join("; "));
});

test("size tier hull shield abilities map from calculateBuild", () => {
  const draft = validDraft();
  const { mapping } = mapWith(draft);
  assert.equal(mapping.actorSource.system.traits.size, "sm");
  assert.equal(mapping.actorSource.system.details.tier, 0);
  assert.equal(mapping.actorSource.system.attributes.hp.max, draft.calculation.result.hullPoints);
  assert.equal(mapping.actorSource.system.attributes.hp.temp, draft.calculation.result.shieldPoints);
  assert.equal(mapping.actorSource.system.abilities.str.value, draft.calculation.result.abilityTotals.str);
});

test("required size and role items map; placeholder weapon remains unmapped", () => {
  const draft = validDraft();
  const items = mapEmbeddedItems({ draft, calculation: draft.calculation, profile });
  assert.ok(items.embeddedItemSources.some((i) => i.id === PACK_ITEMS.size.Small.id));
  assert.ok(items.embeddedItemSources.some((i) => i.id === PACK_ITEMS.role["Superiority Fighter"].id));
  assert.ok(!items.embeddedItemSources.some((i) => i.kind === "weapon"));
  assert.ok(items.unmappedFields.includes("hyperdrive"));
});

test("twin laser cannon and living quarters map when selected", () => {
  let draft = validDraft();
  draft = updateDraftField(draft, "primaryWeapon", "Twin laser cannon", {
    expectedRevision: draft.revision
  }).draft;
  draft = updateDraftField(draft, "armor", "Deflection armor", {
    expectedRevision: draft.revision
  }).draft;
  draft = updateDraftField(draft, "quartersLiving", 1, {
    expectedRevision: draft.revision
  }).draft;
  const items = mapEmbeddedItems({ draft, calculation: draft.calculation, profile });
  assert.ok(items.embeddedItemSources.some((i) => i.id === PACK_ITEMS.weapon["Twin laser cannon"].id));
  assert.ok(items.embeddedItemSources.some((i) => i.id === PACK_ITEMS.armor["Deflection armor"].id));
  assert.ok(items.embeddedItemSources.some((i) => i.id === PACK_ITEMS.suite.living.id));
  assert.equal(items.embeddedItemSources.filter((i) => i.kind === "weapon").length, 1);
  assert.equal(items.embeddedItemSources.find((i) => i.kind === "weapon").preserveActivities, true);
});

test("preview is deterministic and hashes mapped source", () => {
  const draft = validDraft();
  const first = mapWith(draft);
  const second = mapWith(draft);
  assert.equal(first.preview.previewHash, second.preview.previewHash);
  assert.equal(first.preview.cost, draft.calculation.result.grandTotal);
  assert.equal(first.preview.actorType, "vehicle");
});

test("draft change stale-previews creation", () => {
  const draft = validDraft();
  const { mapping, preview, options } = mapWith(draft);
  const changed = updateDraftField(draft, "tier", 2, {
    expectedRevision: draft.revision
  }).draft;
  const eligibility = evaluateCreationEligibility({
    user: gm,
    featureEnabled: true,
    draft: changed,
    mapping,
    preview,
    options,
    profile,
    existingActors: []
  });
  assert.equal(eligibility.ok, false);
  assert.ok(eligibility.errors.includes("preview-stale"));
});

test("eligibility requires GM, feature, valid calc, name, live profile", () => {
  const draft = validDraft();
  const { mapping, preview, options } = mapWith(draft);
  assert.equal(canFinalizeShipyardBuild(player, { featureEnabled: true }), false);
  const playerAttempt = evaluateCreationEligibility({
    user: player,
    featureEnabled: true,
    draft,
    mapping,
    preview,
    options,
    profile,
    existingActors: []
  });
  assert.ok(playerAttempt.errors.includes("gm-required"));
  const unverified = evaluateCreationEligibility({
    user: gm,
    featureEnabled: true,
    draft,
    mapping,
    preview,
    options,
    profile: { ...TARGET_SCHEMA_PROFILE, verifiedLive: false },
    existingActors: []
  });
  assert.ok(unverified.errors.includes("target-profile-unverified"));
  const empty = createEmptyDraft({ sessionOwnerId: "gm1" });
  const invalid = evaluateCreationEligibility({
    user: gm,
    featureEnabled: true,
    draft: empty,
    mapping,
    preview,
    options,
    profile,
    existingActors: []
  });
  assert.ok(invalid.errors.includes("calculation-invalid") || invalid.errors.includes("draft-missing"));
});

test("duplicate name blocks eligibility", () => {
  const draft = validDraft();
  const { mapping, preview, options } = mapWith(draft);
  const eligibility = evaluateCreationEligibility({
    user: gm,
    featureEnabled: true,
    draft,
    mapping,
    preview,
    options,
    profile,
    existingActors: [{ id: "pre1", name: "Test Starship" }]
  });
  assert.ok(eligibility.errors.includes("duplicate-name"));
});

test("image path validation rejects windows and remote paths", () => {
  assert.equal(validateImagePath("").ok, true);
  assert.equal(validateImagePath("systems/dnd5e/icons/svg/vehicle.svg").ok, true);
  assert.equal(validateImagePath("systems/dnd5e/icons/svg/actors/vehicle.svg").ok, true);
  assert.equal(validateImagePath("C:\\Users\\ckauble\\ship.png").ok, false);
  assert.equal(validateImagePath("https://example.com/a.png").ok, false);
});

test("provenance has cost, no workbook path, no personal name", () => {
  const draft = validDraft();
  const { mapping } = mapWith(draft);
  const flags = mapping.actorSource.flags["kakeman89s-datacron"];
  assert.equal(flags.createdByShipyard, true);
  assert.equal(flags.workbookSha256, WORKBOOK_SHA256);
  assert.equal(flags.buildCost, draft.calculation.result.grandTotal);
  const blob = JSON.stringify(mapping.actorSource);
  assert.doesNotMatch(blob, /workbookPath|SotG Shipbuilder|ckauble|formula/i);
  assert.equal(mapping.actorSource.img, DEFAULT_ACTOR_IMAGE);
  assert.equal(mapping.tokenSource.width, 1);
  assert.equal(mapping.tokenSource.actorLink, true);
  assert.equal(mapping.tokenSource.bar1.attribute, "attributes.hp");
  assert.equal(mapping.tokenSource.bar2.attribute, null);
});

test("ownership mapping defaults GM owner and explicit observer", () => {
  const draft = validDraft();
  const { mapping } = mapWith(draft, {
    ownership: { owners: [], observers: ["p1"] }
  });
  assert.equal(mapping.actorSource.ownership.gm1, 3);
  assert.equal(mapping.actorSource.ownership.p1, 2);
  assert.equal(mapping.actorSource.ownership.default, 0);
});

test("folder is optional and not invented", () => {
  const draft = validDraft();
  const none = mapWith(draft);
  assert.equal(none.mapping.actorSource.folder, null);
  const withFolder = mapWith(draft, { folderId: "FolderABCDEFGH" });
  assert.equal(withFolder.mapping.actorSource.folder, "FolderABCDEFGH");
});

test("create orchestration success uses injected Actor.create once", async () => {
  resetCreationOperationState();
  const draft = validDraft();
  const { mapping, preview, options } = mapWith(draft);
  let creates = 0;
  const result = await createStarshipFromDraft(
    {
      user: gm,
      featureEnabled: true,
      draft,
      preview,
      options,
      profile
    },
    {
      user: gm,
      existingActors: [],
      actorCreate: async (payload) => {
        creates += 1;
        assert.equal(payload.type, "vehicle");
        assert.equal(payload.flags.sw5e.legacyStarshipActor.type, "starship");
        assert.ok(payload.items.length >= 2);
        assert.equal(payload.items[0].activities.preserved, true);
        return { id: "Actor00000001", name: payload.name, type: payload.type, flags: payload.flags };
      }
    }
  );
  assert.equal(result.ok, true);
  assert.equal(creates, 1);
  assert.equal(result.actor.id, "Actor00000001");
});

test("double submit of the same operation id is rejected", async () => {
  resetCreationOperationState();
  const draft = validDraft();
  const { preview, options } = mapWith(draft);
  const deps = {
    user: gm,
    existingActors: [],
    actorCreate: async (payload) => ({
      id: "Actor00000002",
      name: payload.name,
      type: payload.type,
      flags: payload.flags
    })
  };
  const first = await createStarshipFromDraft(
    { user: gm, featureEnabled: true, draft, preview, options, profile },
    deps
  );
  assert.equal(first.ok, true);
  const second = await createStarshipFromDraft(
    { user: gm, featureEnabled: true, draft, preview, options, profile },
    deps
  );
  assert.equal(second.ok, false);
  assert.ok(second.errors.includes("operation-consumed"));
});

test("forced actor-create failure reports failure and rolls back", async () => {
  resetCreationOperationState();
  const draft = validDraft();
  const { preview, options } = mapWith(draft, { operationId: "op-fail-a" });
  const result = await createStarshipFromDraft(
    { user: gm, featureEnabled: true, draft, preview, options, profile },
    {
      user: gm,
      worldId: "datacron-phase10-actor",
      testMode: true,
      hooks: { failActorCreate: true },
      existingActors: [{ id: "pre-actor", name: "Keep Me" }],
      actorCreate: async () => {
        throw new Error("should not run");
      },
      deleteActor: async () => {
        throw new Error("should not delete");
      }
    }
  );
  assert.equal(result.ok, false);
  assert.equal(result.status, "failed");
});

test("embedded item failure after actor exists triggers rollback of current actor only", async () => {
  resetCreationOperationState();
  const draft = validDraft();
  const { preview, options } = mapWith(draft, { operationId: "op-fail-i" });
  const deleted = [];
  const result = await createStarshipFromDraft(
    { user: gm, featureEnabled: true, draft, preview, options, profile },
    {
      user: gm,
      worldId: "datacron-phase10-actor",
      testMode: true,
      hooks: { failEmbeddedItems: true },
      existingActors: [{ id: "pre-actor", name: "Keep Me" }],
      actorCreate: async (payload) => ({
        id: "ActorNEW000001",
        name: payload.name,
        type: payload.type,
        flags: payload.flags
      }),
      deleteActor: async (id) => {
        deleted.push(id);
      }
    }
  );
  assert.equal(result.ok, false);
  assert.deepEqual(deleted, ["ActorNEW000001"]);
  assert.ok(!deleted.includes("pre-actor"));
});

test("post-create verification failure rolls back", async () => {
  resetCreationOperationState();
  const draft = validDraft();
  const { preview, options } = mapWith(draft, { operationId: "op-fail-v" });
  const deleted = [];
  const result = await createStarshipFromDraft(
    { user: gm, featureEnabled: true, draft, preview, options, profile },
    {
      user: gm,
      worldId: "datacron-phase10-actor",
      testMode: true,
      hooks: { failPostVerify: true },
      existingActors: [],
      actorCreate: async (payload) => ({
        id: "ActorNEW000002",
        name: payload.name,
        type: payload.type,
        flags: payload.flags
      }),
      deleteActor: async (id) => deleted.push(id)
    }
  );
  assert.equal(result.ok, false);
  assert.deepEqual(deleted, ["ActorNEW000002"]);
});

test("rollback refuses pre-existing actor and reports partial rollback injection", async () => {
  const refused = await rollbackCreation(
    {
      operationId: "op-x",
      created: { actor: { id: "pre-actor", flags: { "kakeman89s-datacron": { operationId: "op-x" } } } },
      preExisting: { actorIds: ["pre-actor"] }
    },
    { deleteActor: async () => {
      throw new Error("must not delete pre-existing");
    } }
  );
  assert.ok(refused.errors.includes("refused-preexisting-actor"));
  const partial = await rollbackCreation(
    {
      operationId: "op-y",
      created: { actor: { id: "ActorNEW", flags: { "kakeman89s-datacron": { operationId: "op-y" } } } },
      preExisting: { actorIds: [] }
    },
    { failRollback: true }
  );
  assert.equal(partial.ok, false);
  assert.equal(partial.partial, true);
});

test("failure injection is ignored outside the phase 10 world", async () => {
  resetCreationOperationState();
  const draft = validDraft();
  const { preview, options } = mapWith(draft, { operationId: "op-safe" });
  const result = await createStarshipFromDraft(
    { user: gm, featureEnabled: true, draft, preview, options, profile },
    {
      user: gm,
      worldId: "some-other-world",
      testMode: true,
      hooks: { failActorCreate: true },
      existingActors: [],
      actorCreate: async (payload) => ({
        id: "ActorSAFE00001",
        name: payload.name,
        type: payload.type,
        flags: payload.flags
      })
    }
  );
  assert.equal(result.ok, true);
});

test("player create and rollback socket messages are rejected", () => {
  for (const type of REJECTED_PHASE10_MESSAGE_TYPES) {
    const result = validateShipyardSocketMessage(
      { type },
      { senderUserId: "p1", senderUser: player, featureEnabled: true }
    );
    assert.equal(result.ok, false);
    assert.ok(result.errors.includes("phase10-request-rejected"));
  }
  const forgedCreated = validateShipyardSocketMessage(
    { type: SHIPYARD_MESSAGE_TYPES.ACTOR_CREATED, status: "created", actorName: "X" },
    { senderUserId: "p1", senderUser: player, featureEnabled: true }
  );
  assert.equal(forgedCreated.ok, false);
});

test("sanitized actor-created notification from GM is accepted without UUID", () => {
  const ok = validateShipyardSocketMessage(
    { type: SHIPYARD_MESSAGE_TYPES.ACTOR_CREATED, status: "created", actorName: "Test Starship" },
    { senderUserId: "gm1", senderUser: gm, featureEnabled: true }
  );
  assert.equal(ok.ok, true, ok.errors.join("; "));
  const withUuid = validateShipyardSocketMessage(
    { type: SHIPYARD_MESSAGE_TYPES.ACTOR_CREATED, status: "created", actorName: "X", actorUuid: "Actor.abc" },
    { senderUserId: "gm1", senderUser: gm, featureEnabled: true }
  );
  assert.equal(withUuid.ok, false);
});

test("player projection created status has name and no uuid", () => {
  const draft = validDraft();
  const projection = buildProjection({
    draft,
    creationStatus: "created",
    createdActorName: "Test Starship"
  });
  assert.equal(projection.createdActorName, "Test Starship");
  assert.equal(projection.displayState, "created");
  assert.equal(projection.uuid, undefined);
  const check = validateProjection(projection);
  assert.equal(check.ok, true, check.errors.join("; "));
});

test("mapping does not duplicate calculateBuild arithmetic", () => {
  const source = fs.readFileSync(path.resolve(HERE, "../actor/map-actor.js"), "utf8");
  assert.doesNotMatch(source, /grandTotal\s*\+|totalNoMisc\s*\+/);
  assert.match(source, /result\?\.grandTotal|result\?\.hullPoints/);
});

test("Phase 8 calculateBuild still used as sole cost authority in create", async () => {
  resetCreationOperationState();
  const draft = validDraft();
  const expected = calculateBuild(structuredClone(draft.input)).result.grandTotal;
  const { preview, options } = mapWith(draft, { operationId: "op-cost" });
  const result = await createStarshipFromDraft(
    { user: gm, featureEnabled: true, draft, preview, options, profile },
    {
      user: gm,
      existingActors: [],
      actorCreate: async (payload) => ({
        id: "ActorCOST00001",
        name: payload.name,
        type: payload.type,
        flags: payload.flags
      })
    }
  );
  assert.equal(result.calculation.result.grandTotal, expected);
  assert.equal(result.actor.flags["kakeman89s-datacron"].buildCost, expected);
});

test("SW5e module.json placeholder remains #{VERSION}# and actor helpers unused by mapping", () => {
  const sw5e = path.resolve(MODULE_DIR, "../../sw5e-module/module.json");
  if (fs.existsSync(sw5e)) {
    const manifest = fs.readFileSync(sw5e, "utf8");
    assert.match(manifest, /#\{VERSION\}#/);
  }
  const mapActor = fs.readFileSync(path.resolve(HERE, "../actor/map-actor.js"), "utf8");
  const create = fs.readFileSync(path.resolve(HERE, "../actor/create-starship.js"), "utf8");
  assert.doesNotMatch(mapActor, /actor-helpers/);
  assert.doesNotMatch(create, /actor-helpers/);
});

test("preview hash changes when ownership changes", () => {
  const draft = validDraft();
  const a = mapWith(draft, { ownership: {} });
  const b = mapWith(draft, { ownership: { observers: ["p1"] } });
  assert.notEqual(a.preview.previewHash, b.preview.previewHash);
});

test("computePreviewHash is stable for identical canonical payload", () => {
  const hashA = computePreviewHash({ operationId: "op", draftRevision: 2, actorSource: { name: "A" } });
  const hashB = computePreviewHash({ draftRevision: 2, operationId: "op", actorSource: { name: "A" } });
  assert.equal(hashA, hashB);
});
