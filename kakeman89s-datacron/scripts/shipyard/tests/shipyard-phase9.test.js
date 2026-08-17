import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  createEmptyDraft,
  updateDraftField,
  updateDraftAbility,
  resetDraft,
  cloneDraft,
  hydrateDraftFromProjection,
  DRAFT_FIELDS
} from "../draft-state.js";
import {
  buildProjection,
  validateProjection,
  PROJECTION_PROTOCOL_VERSION
} from "../projection.js";
import {
  canOpenShipyard,
  canEditShipyardDraft,
  canObserveShipyard,
  canResetShipyardDraft,
  canPublishShipyardProjection,
  canRequestShipyardSnapshot,
  SHIPYARD_ROLES
} from "../permissions.js";
import {
  validateShipyardSocketMessage,
  createShipyardSocketMessage,
  canBroadcastAsSessionOwner,
  resolveShipyardSessionMeta,
  SHIPYARD_MESSAGE_TYPES,
  SHIPYARD_SOCKET_EVENT
} from "../socket.js";
import { calculateBuild } from "../calculate.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.resolve(
  HERE,
  "../../../data/sources/shipyard/fixtures/phase8-vectors.v1.json"
);

const gm = { id: "gm1", role: SHIPYARD_ROLES.GAMEMASTER, isGM: true };
const player = { id: "p1", role: SHIPYARD_ROLES.PLAYER, isGM: false };
const assistant = { id: "a1", role: SHIPYARD_ROLES.ASSISTANT, isGM: false };

test("empty draft creation and immutability", () => {
  const draft = createEmptyDraft({ sessionOwnerId: "gm1" });
  assert.equal(draft.revision, 1);
  assert.equal(draft.cleared, true);
  assert.equal(draft.sessionOwnerId, "gm1");
  assert.throws(() => {
    draft.input.size = "Small";
  });
  const cloned = cloneDraft(draft);
  cloned.input.size = "Medium";
  assert.equal(draft.input.size, "");
  assert.equal(cloned.input.size, "Medium");
});

test("controlled update increments revision and calls calculateBuild", () => {
  const draft = createEmptyDraft({ sessionOwnerId: "gm1" });
  const updated = updateDraftField(draft, "size", "Small", {
    expectedRevision: 1,
    sessionOwnerId: "gm1"
  });
  assert.equal(updated.ok, true);
  assert.equal(updated.draft.revision, 2);
  assert.equal(updated.draft.cleared, false);
  assert.equal(updated.draft.input.size, "Small");
  assert.ok(updated.draft.calculation);
  assert.equal(draft.revision, 1);
});

test("nested ability update", () => {
  let draft = createEmptyDraft({ sessionOwnerId: "gm1" });
  draft = updateDraftField(draft, "size", "Large", { expectedRevision: 1 }).draft;
  const next = updateDraftAbility(draft, "str", 15, {
    expectedRevision: draft.revision
  });
  assert.equal(next.ok, true);
  assert.equal(next.draft.input.baseAbilities.str, 15);
});

test("reset draft", () => {
  let draft = createEmptyDraft({ sessionOwnerId: "gm1" });
  draft = updateDraftField(draft, "size", "Small", { expectedRevision: 1 }).draft;
  const reset = resetDraft({ sessionOwnerId: "gm1" });
  assert.equal(reset.cleared, true);
  assert.equal(reset.input.size, "");
  assert.equal(reset.revision, 1);
});

test("stale revision rejection", () => {
  const draft = createEmptyDraft();
  const result = updateDraftField(draft, "size", "Small", { expectedRevision: 99 });
  assert.equal(result.ok, false);
  assert.equal(result.code, "stale-revision");
});

test("unknown field rejection", () => {
  const draft = createEmptyDraft();
  const result = updateDraftField(draft, "hyperdriveClass", "1", {
    expectedRevision: 1
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, "unknown-field");
  assert.ok(DRAFT_FIELDS.includes("size"));
});

test("calculateBuild remains sole cost authority for vector parity via draft", () => {
  const vectors = JSON.parse(fs.readFileSync(FIXTURE, "utf8"));
  const vector = vectors.find((v) => v.id === "v2-small-bare");
  let draft = createEmptyDraft({ sessionOwnerId: "gm1" });
  for (const [field, value] of Object.entries(vector.inputs)) {
    if (field === "baseAbilities") {
      draft = updateDraftField(draft, "baseAbilities", value, {
        expectedRevision: draft.revision
      }).draft;
    } else if (field === "tier0RoleCell" || field === "purchaseOrBuild") {
      continue;
    } else {
      draft = updateDraftField(draft, field, value, {
        expectedRevision: draft.revision
      }).draft;
    }
  }
  assert.equal(draft.calculation.result.grandTotal, vector.expected.grandTotal.value);
  const direct = calculateBuild(draft.input);
  assert.equal(direct.result.grandTotal, draft.calculation.result.grandTotal);
});

test("projection schema and sanitization", () => {
  let draft = createEmptyDraft({ sessionOwnerId: "gm1" });
  draft = updateDraftField(draft, "size", "Small", { expectedRevision: 1 }).draft;
  draft = updateDraftField(draft, "role", "Superiority Fighter", {
    expectedRevision: draft.revision
  }).draft;
  const projection = buildProjection({ draft });
  const check = validateProjection(projection);
  assert.equal(check.ok, true, check.errors.join("; "));
  assert.equal(projection.protocolVersion, PROJECTION_PROTOCOL_VERSION);
  assert.equal(projection.sessionOwnerId, "gm1");
  assert.equal(projection.selections.size, "Small");
  assert.ok(!("workbookEvidence" in (projection.explanation.steps[0] ?? {})));
});

test("projection excludes workbook path, capture notes, formulas, document requests", () => {
  const dirty = {
    protocolVersion: PROJECTION_PROTOCOL_VERSION,
    revision: 1,
    workbookPath: "C:/secret.xlsx",
    capture: { notes: "private" },
    createActor: true
  };
  const check = validateProjection(dirty);
  assert.equal(check.ok, false);
});

test("permission matrix", () => {
  assert.equal(canOpenShipyard(gm, { featureEnabled: false }), false);
  assert.equal(canOpenShipyard(gm, { featureEnabled: true }), true);
  assert.equal(canEditShipyardDraft(gm, { featureEnabled: true }), true);
  assert.equal(canEditShipyardDraft(player, { featureEnabled: true }), false);
  assert.equal(canEditShipyardDraft(assistant, { featureEnabled: true }), false);
  assert.equal(canResetShipyardDraft(player, { featureEnabled: true }), false);
  assert.equal(canPublishShipyardProjection(gm, { featureEnabled: true }), true);
  assert.equal(canObserveShipyard(player, { featureEnabled: true }), true);
  assert.equal(canRequestShipyardSnapshot(player, { featureEnabled: true }), true);
});

test("socket: GM update accepted, non-GM mutation rejected", () => {
  const projection = buildProjection({
    draft: updateDraftField(createEmptyDraft({ sessionOwnerId: "gm1" }), "size", "Small", {
      expectedRevision: 1
    }).draft
  });
  const msg = createShipyardSocketMessage(SHIPYARD_MESSAGE_TYPES.DRAFT_UPDATED, {
    revision: projection.revision,
    projection,
    sessionOwnerId: "gm1"
  });
  const ok = validateShipyardSocketMessage(msg, {
    senderUserId: "gm1",
    senderUser: gm,
    featureEnabled: true,
    currentRevision: 0,
    sessionOwnerId: "gm1"
  });
  assert.equal(ok.ok, true, ok.errors.join("; "));

  const bad = validateShipyardSocketMessage(msg, {
    senderUserId: "p1",
    senderUser: player,
    featureEnabled: true,
    currentRevision: 0,
    sessionOwnerId: "gm1"
  });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.some((e) => /non-GM/.test(e)));
});

test("socket: clear, snapshot request, actor/item rejection, stale revision, unknown type", () => {
  const clearMsg = createShipyardSocketMessage(SHIPYARD_MESSAGE_TYPES.DRAFT_CLEARED, {
    revision: 2,
    sessionOwnerId: "gm1"
  });
  assert.equal(
    validateShipyardSocketMessage(clearMsg, {
      senderUserId: "gm1",
      senderUser: gm,
      featureEnabled: true,
      sessionOwnerId: "gm1"
    }).ok,
    true
  );
  assert.equal(
    validateShipyardSocketMessage(clearMsg, {
      senderUserId: "p1",
      senderUser: player,
      featureEnabled: true,
      sessionOwnerId: "gm1"
    }).ok,
    false
  );

  const req = createShipyardSocketMessage(SHIPYARD_MESSAGE_TYPES.REQUEST_SNAPSHOT, {});
  assert.equal(
    validateShipyardSocketMessage(req, {
      senderUserId: "p1",
      senderUser: player,
      featureEnabled: true
    }).ok,
    true
  );

  const actorMsg = createShipyardSocketMessage(SHIPYARD_MESSAGE_TYPES.DRAFT_UPDATED, {
    revision: 3,
    projection: buildProjection({ draft: createEmptyDraft() }),
    createActor: true,
    sessionOwnerId: "gm1"
  });
  assert.ok(
    validateShipyardSocketMessage(actorMsg, {
      senderUserId: "gm1",
      senderUser: gm,
      featureEnabled: true,
      currentRevision: 1,
      sessionOwnerId: "gm1"
    }).errors.some((e) => /document-creation/.test(e))
  );

  const stale = createShipyardSocketMessage(SHIPYARD_MESSAGE_TYPES.DRAFT_UPDATED, {
    revision: 2,
    projection: buildProjection({ draft: createEmptyDraft() }),
    sessionOwnerId: "gm1"
  });
  assert.ok(
    validateShipyardSocketMessage(stale, {
      senderUserId: "gm1",
      senderUser: gm,
      featureEnabled: true,
      currentRevision: 5,
      sessionOwnerId: "gm1"
    }).errors.some((e) => /stale/.test(e))
  );

  assert.equal(
    validateShipyardSocketMessage(
      { type: "shipyard-hack" },
      { senderUserId: "gm1", senderUser: gm, featureEnabled: true }
    ).ok,
    false
  );
});

test("socket event uses Foundry module channel", () => {
  assert.equal(SHIPYARD_SOCKET_EVENT, "module.kakeman89s-datacron");
});

test("multiple-GM session owner behavior", () => {
  const gm2 = { id: "gm2", role: SHIPYARD_ROLES.GAMEMASTER, isGM: true };
  assert.equal(canBroadcastAsSessionOwner(gm, "gm1"), true);
  assert.equal(canBroadcastAsSessionOwner(gm2, "gm1"), false);
  assert.equal(canBroadcastAsSessionOwner(gm2, "gm1", { allowTakeover: true }), true);
  assert.equal(canBroadcastAsSessionOwner(player, "gm1"), false);
});

test("observer session meta never advertises the player as owner", () => {
  const projection = buildProjection({
    draft: updateDraftField(createEmptyDraft({ sessionOwnerId: "gm1" }), "size", "Small", {
      expectedRevision: 1
    }).draft
  });
  const observerMeta = resolveShipyardSessionMeta({
    draft: createEmptyDraft(),
    projection,
    isEditor: false,
    localUserId: "p1"
  });
  assert.equal(observerMeta.sessionOwnerId, "gm1");
  const emptyObserver = resolveShipyardSessionMeta({
    draft: createEmptyDraft(),
    projection: null,
    isEditor: false,
    localUserId: "p1"
  });
  assert.equal(emptyObserver.sessionOwnerId, null);
  const editorMeta = resolveShipyardSessionMeta({
    draft: createEmptyDraft(),
    projection: null,
    isEditor: true,
    localUserId: "gm1"
  });
  assert.equal(editorMeta.sessionOwnerId, "gm1");

  const clearMsg = createShipyardSocketMessage(SHIPYARD_MESSAGE_TYPES.DRAFT_CLEARED, {
    revision: 1,
    sessionOwnerId: "gm1"
  });
  const accepted = validateShipyardSocketMessage(clearMsg, {
    senderUserId: "gm1",
    senderUser: gm,
    featureEnabled: true,
    currentRevision: observerMeta.revision,
    sessionOwnerId: observerMeta.sessionOwnerId
  });
  assert.equal(accepted.ok, true, accepted.errors.join("; "));
});

test("snapshot target validation", () => {
  const projection = buildProjection({ draft: createEmptyDraft({ sessionOwnerId: "gm1" }) });
  const snap = createShipyardSocketMessage(SHIPYARD_MESSAGE_TYPES.SNAPSHOT, {
    projection,
    targetUserId: "p1",
    revision: projection.revision
  });
  assert.equal(
    validateShipyardSocketMessage(snap, {
      senderUserId: "gm1",
      senderUser: gm,
      featureEnabled: true
    }).ok,
    true
  );
  const missingTarget = createShipyardSocketMessage(SHIPYARD_MESSAGE_TYPES.SNAPSHOT, {
    projection
  });
  assert.ok(
    validateShipyardSocketMessage(missingTarget, {
      senderUserId: "gm1",
      senderUser: gm,
      featureEnabled: true
    }).errors.some((e) => /target/.test(e))
  );
});

test("hydrateDraftFromProjection recalculates via calculateBuild", () => {
  let draft = createEmptyDraft({ sessionOwnerId: "gm1" });
  draft = updateDraftField(draft, "size", "Small", { expectedRevision: 1 }).draft;
  draft = updateDraftField(draft, "role", "Superiority Fighter", {
    expectedRevision: draft.revision
  }).draft;
  const projection = buildProjection({ draft });
  const hydrated = hydrateDraftFromProjection(projection, {
    sessionOwnerId: "gm1"
  });
  assert.equal(hydrated.input.size, "Small");
  assert.equal(hydrated.calculation.result.grandTotal, draft.calculation.result.grandTotal);
  assert.equal(hydrated.cleared, false);
});

test("Phase 9 pure modules contain no cost arithmetic or Actor APIs", () => {
  const files = [
    "draft-state.js",
    "projection.js",
    "permissions.js",
    "socket.js"
  ].map((name) => path.resolve(HERE, "..", name));
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(text, /Actor\.create|Item\.create|createEmbeddedDocuments/);
    assert.doesNotMatch(text, /\+ *miscTotal|grandTotal\s*\+|totalNoMisc\s*\+/);
    assert.doesNotMatch(text, /\bgame\./);
    assert.doesNotMatch(text, /\bfoundry\./i);
  }
});

test("Phase 9 UI modules contain no Actor APIs or credit arithmetic", () => {
  const files = ["shipyard-app.js", "socket-runtime.js"].map((name) =>
    path.resolve(HERE, "..", name)
  );
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(text, /Actor\.create|Item\.create|Token\.create|Folder\.create/);
    assert.doesNotMatch(text, /createEmbeddedDocuments/);
    assert.doesNotMatch(text, /grandTotal\s*\+|totalNoMisc\s*\+\s*miscTotal/);
    assert.match(text, /calculateBuild|buildProjection|broadcastShipyardProjection|updateDraftField/);
  }
  const template = fs.readFileSync(
    path.resolve(HERE, "../../../templates/shipyard/shipyard-app.hbs"),
    "utf8"
  );
  assert.doesNotMatch(template, /Actor\.create/);
});

test("localization keys include Shipyard namespace", () => {
  const lang = JSON.parse(
    fs.readFileSync(path.resolve(HERE, "../../../lang/en.json"), "utf8")
  );
  assert.ok(lang.KAKEMAN89SDATACRON.Shipyard.Title);
  assert.ok(lang.KAKEMAN89SDATACRON.SceneControl.OpenShipyard);
  assert.ok(lang.KAKEMAN89SDATACRON.Settings.FeatureShipyard.Name);
});

test("UI modules stay isolated from NavComputer actor-helpers", () => {
  const app = fs.readFileSync(path.resolve(HERE, "..", "shipyard-app.js"), "utf8");
  const main = fs.readFileSync(path.resolve(HERE, "../../main.js"), "utf8");
  assert.doesNotMatch(app, /actor-helpers/);
  assert.doesNotMatch(app, /from ["'].*datacron-app/);
  assert.doesNotMatch(app, /from ["'].*astrocom-app/);
  assert.doesNotMatch(app, /from ["'].*droid-ally/);
  assert.match(main, /openShipyardApp/);
  assert.match(main, /registerShipyardSockets/);
});
