/**
 * Shipyard ApplicationV2 (Phase 9).
 * GM edit / player observe. Cost authority: calculateBuild only.
 */
import { MODULE_ID } from "../logger.js";
import { SETTING_KEYS } from "../settings.js";
import {
  createEmptyDraft,
  updateDraftField,
  updateDraftAbility,
  resetDraft,
  hydrateDraftFromProjection,
  serializeCanonicalDraft,
  hydrateCanonicalDraft
} from "./draft-state.js";
import { buildProjection, cloneProjection } from "./projection.js";
import {
  canEditShipyardDraft,
  canObserveShipyard,
  canOpenShipyard,
  canResetShipyardDraft,
  canFinalizeShipyardBuild
} from "./permissions.js";
import { loadRoles, loadSizes, loadWeapons } from "./options.js";
import {
  broadcastShipyardProjection,
  configureShipyardSocketHandlers,
  requestShipyardSnapshot,
  broadcastActorCreated
} from "./socket-runtime.js";
import { resolveShipyardSessionMeta } from "./socket.js";
import { mapStarshipActor } from "./actor/map-actor.js";
import { buildCreationPreview } from "./actor/preview.js";
import { createStarshipFromDraft } from "./actor/create-starship.js";
import { TARGET_SCHEMA_PROFILE } from "./actor/mapping-schema.js";
import {
  buildFoundryCreateDeps,
  listActorFolders,
  listOwnershipCandidates
} from "./actor/foundry-create-deps.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

function featureEnabled() {
  try {
    return Boolean(game.settings.get(MODULE_ID, SETTING_KEYS.featureShipyard));
  } catch (_error) {
    return false;
  }
}

function readSnapshotSetting() {
  try {
    return game.settings.get(MODULE_ID, SETTING_KEYS.shipyardDraftSnapshot) ?? null;
  } catch (_error) {
    return null;
  }
}

async function writeSnapshotSetting(value) {
  if (!game.user?.isGM) return;
  try {
    await game.settings.set(MODULE_ID, SETTING_KEYS.shipyardDraftSnapshot, value);
  } catch (_error) {
    /* ignore */
  }
}

function readCanonicalDraftSetting() {
  try {
    return game.settings.get(MODULE_ID, SETTING_KEYS.shipyardCanonicalDraft) ?? null;
  } catch (_error) {
    return null;
  }
}

async function writeCanonicalDraftSetting(value) {
  if (!game.user?.isGM) return;
  try {
    await game.settings.set(MODULE_ID, SETTING_KEYS.shipyardCanonicalDraft, value);
  } catch (_error) {
    /* ignore */
  }
}

function newOperationId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `op-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function optionList(options, selected) {
  return options.map((opt) => ({
    value: opt.display,
    label: opt.display,
    selected: opt.display === selected
  }));
}

function formatTotal(value) {
  if (value == null) return "";
  if (typeof value === "object" && value.display != null) return String(value.display);
  if (typeof value === "number") return `${value.toLocaleString()}cr`;
  return String(value);
}

export class ShipyardApp extends HandlebarsApplicationMixin(ApplicationV2) {
  /** @type {AbortController | null} */
  _abort = null;

  /** @type {object} */
  _draft = createEmptyDraft();

  /** @type {object|null} */
  _playerProjection = null;

  /** @type {string} */
  _connectionState = "connected";

  /** @type {boolean} */
  _hydrated = false;

  /** @type {string} */
  _actorName = "";

  /** @type {string|null} */
  _folderId = null;

  /** @type {string[]} */
  _ownerIds = [];

  /** @type {string[]} */
  _observerIds = [];

  /** @type {string} */
  _imagePath = "";

  /** @type {object|null} */
  _preview = null;

  /** @type {object|null} */
  _mapping = null;

  /** @type {string|null} */
  _operationId = null;

  /** @type {string} */
  _createStatus = "";

  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    id: `${MODULE_ID}-shipyard`,
    tag: "section",
    classes: [MODULE_ID, "kakeman89s-datacron-app", "kakeman89s-shipyard-app"],
    position: {
      width: 760,
      height: 720
    },
    window: {
      icon: "fa-solid fa-rocket",
      title: "KAKEMAN89SDATACRON.Shipyard.Title",
      resizable: true
    }
  });

  static PARTS = {
    content: {
      template: `modules/${MODULE_ID}/templates/shipyard/shipyard-app.hbs`
    }
  };

  get title() {
    return game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Title");
  }

  get isEditor() {
    return canEditShipyardDraft(game.user, { featureEnabled: featureEnabled() });
  }

  _ensureHydrated() {
    if (this._hydrated) return;
    this._hydrated = true;
    const snap = readSnapshotSetting();
    if (this.isEditor) {
      const canonical = readCanonicalDraftSetting();
      if (canonical?.input && !canonical.cleared) {
        this._draft = hydrateCanonicalDraft(canonical, {
          sessionOwnerId: game.user?.id ?? canonical.sessionOwnerId ?? null,
          revision: canonical.revision
        });
      } else if (snap?.projection && !snap.cleared) {
        this._draft = hydrateDraftFromProjection(snap.projection, {
          sessionOwnerId: game.user?.id ?? snap.sessionOwnerId ?? null,
          revision: snap.revision ?? snap.projection.revision
        });
      } else {
        this._draft = createEmptyDraft({ sessionOwnerId: game.user?.id ?? null });
      }
      return;
    }
    if (snap?.projection) {
      this._playerProjection = cloneProjection(snap.projection);
      this._connectionState = snap.projection.cleared ? "cleared" : "connected";
    } else {
      this._connectionState = "disconnected";
    }
  }

  _currentProjection() {
    if (this.isEditor) {
      return buildProjection({
        draft: this._draft,
        connectionState: this._connectionState
      });
    }
    return this._playerProjection;
  }

  _sessionMeta() {
    return resolveShipyardSessionMeta({
      draft: this._draft,
      projection: this._currentProjection(),
      isEditor: this.isEditor,
      localUserId: game.user?.id ?? null
    });
  }

  async _publish() {
    if (!this.isEditor) return;
    const projection = buildProjection({
      draft: this._draft,
      sessionOwnerId: this._draft.sessionOwnerId ?? game.user?.id ?? null
    });
    await writeSnapshotSetting({
      projection: cloneProjection(projection),
      revision: projection.revision,
      sessionOwnerId: projection.sessionOwnerId,
      cleared: Boolean(projection.cleared)
    });
    await writeCanonicalDraftSetting(serializeCanonicalDraft(this._draft));
    broadcastShipyardProjection(projection, {
      revision: projection.revision,
      sessionOwnerId: projection.sessionOwnerId
    });
  }

  async _applyField(field, value) {
    if (!this.isEditor) return;
    const result = updateDraftField(this._draft, field, value, {
      expectedRevision: this._draft.revision,
      sessionOwnerId: this._draft.sessionOwnerId ?? game.user?.id ?? null
    });
    if (!result.ok) {
      ui.notifications?.warn?.(
        game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Error.UpdateFailed")
      );
      return;
    }
    this._draft = result.draft;
    this._invalidatePreview();
    await this._publish();
    await this.render(true);
  }

  async _applyAbility(abilityKey, value) {
    if (!this.isEditor) return;
    const result = updateDraftAbility(this._draft, abilityKey, value, {
      expectedRevision: this._draft.revision,
      sessionOwnerId: this._draft.sessionOwnerId ?? game.user?.id ?? null
    });
    if (!result.ok) return;
    this._draft = result.draft;
    this._invalidatePreview();
    await this._publish();
    await this.render(true);
  }

  async _onReset() {
    if (!canResetShipyardDraft(game.user, { featureEnabled: featureEnabled() })) return;
    this._draft = resetDraft({ sessionOwnerId: game.user?.id ?? null });
    this._invalidatePreview();
    this._createStatus = "";
    await this._publish();
    await this.render(true);
  }

  _invalidatePreview() {
    this._preview = null;
    this._mapping = null;
    this._operationId = null;
    if (this._createStatus === "created") return;
    this._createStatus = "";
  }

  _creationOptions() {
    return {
      actorName: this._actorName,
      gmUserId: game.user?.id ?? null,
      createdBy: game.user?.id ?? null,
      operationId: this._operationId,
      folderId: this._folderId || null,
      imagePath: this._imagePath,
      ownership: {
        owners: [...this._ownerIds],
        observers: [...this._observerIds]
      }
    };
  }

  _onPreview() {
    if (!this.isEditor) return;
    this._operationId = newOperationId();
    const options = this._creationOptions();
    this._mapping = mapStarshipActor({
      draft: this._draft,
      calculation: this._draft.calculation,
      options,
      profile: TARGET_SCHEMA_PROFILE
    });
    this._preview = buildCreationPreview({
      mapping: this._mapping,
      draft: this._draft,
      calculation: this._draft.calculation,
      options
    });
    this._createStatus = "";
    void this.render(true);
  }

  async _onCreate() {
    if (!canFinalizeShipyardBuild(game.user, { featureEnabled: featureEnabled() })) return;
    if (!this._preview || !this._operationId) return;
    this._createStatus = "creating";
    await this.render(true);
    const result = await createStarshipFromDraft(
      {
        user: game.user,
        featureEnabled: featureEnabled(),
        draft: this._draft,
        preview: this._preview,
        options: this._creationOptions(),
        profile: TARGET_SCHEMA_PROFILE,
        sessionOwnerId: this._draft.sessionOwnerId ?? game.user?.id
      },
      buildFoundryCreateDeps()
    );
    if (result.ok) {
      this._createStatus = "created";
      this._operationId = null;
      broadcastActorCreated({
        status: "created",
        actorName: this._actorName,
        revision: this._draft.revision
      });
      await this._publishCreatedProjection();
    } else if (result.errors?.includes("duplicate-name")) {
      this._createStatus = "duplicate";
    } else if (result.errors?.includes("preview-stale")) {
      this._createStatus = "stale";
    } else {
      this._createStatus = "failed";
      broadcastActorCreated({
        status: "failed",
        actorName: this._actorName,
        revision: this._draft.revision
      });
    }
    await this.render(true);
  }

  async _publishCreatedProjection() {
    if (!this.isEditor) return;
    const projection = buildProjection({
      draft: this._draft,
      sessionOwnerId: this._draft.sessionOwnerId ?? game.user?.id ?? null,
      creationStatus: "created",
      createdActorName: this._actorName
    });
    await writeSnapshotSetting({
      projection: cloneProjection(projection),
      revision: projection.revision,
      sessionOwnerId: projection.sessionOwnerId,
      cleared: Boolean(projection.cleared)
    });
    broadcastShipyardProjection(projection, {
      revision: projection.revision,
      sessionOwnerId: projection.sessionOwnerId
    });
  }

  _onPlayerCreated(payload) {
    if (this.isEditor) return;
    this._createStatus = payload?.status === "created" ? "created" : "failed";
    this._actorName = payload?.actorName ?? "";
    void this.render(true);
  }

  _onPlayerProjection(projection, meta = {}) {
    if (this.isEditor) return;
    if (meta.cleared) {
      this._playerProjection = buildProjection({
        cleared: true,
        revision: meta.revision ?? 0,
        sessionOwnerId: meta.sessionOwnerId ?? null,
        connectionState: "connected",
        displayState: "cleared"
      });
      this._connectionState = "cleared";
    } else if (projection) {
      this._playerProjection = projection;
      this._connectionState = projection.cleared ? "cleared" : "connected";
    } else {
      this._playerProjection = null;
      this._connectionState = "disconnected";
    }
    void this.render(true);
  }

  async _prepareContext(_options) {
    this._ensureHydrated();
    const enabled = featureEnabled();
    const editor = this.isEditor;
    const projection = this._currentProjection();
    const calc = editor ? this._draft.calculation : null;
    const input = editor ? this._draft.input : projection?.selections ?? {};
    const totals = editor
      ? {
          grandTotal: formatTotal(calc?.result?.grandTotal),
          totalNoMisc: formatTotal(calc?.result?.totalNoMisc),
          miscTotal: formatTotal(calc?.result?.miscTotal),
          buildDays:
            calc?.result?.buildDaysDisplay ??
            formatTotal(calc?.result?.buildDays),
          hullPoints: calc?.result?.hullPoints ?? "",
          shieldPoints: calc?.result?.shieldPoints ?? "",
          pointBuyTotal: calc?.result?.pointBuyTotal ?? "",
          suiteSlots: calc?.result?.suiteSlots ?? "",
          openSuites: calc?.result?.openSuites ?? ""
        }
      : {
          grandTotal: formatTotal(projection?.totals?.grandTotal),
          totalNoMisc: formatTotal(projection?.totals?.totalNoMisc),
          miscTotal: formatTotal(projection?.totals?.miscTotal),
          buildDays:
            projection?.totals?.buildDaysDisplay ??
            formatTotal(projection?.totals?.buildDays),
          hullPoints: projection?.totals?.hullPoints ?? "",
          shieldPoints: projection?.totals?.shieldPoints ?? "",
          pointBuyTotal: projection?.totals?.pointBuyTotal ?? "",
          suiteSlots: projection?.totals?.suiteSlots ?? "",
          openSuites: projection?.totals?.openSuites ?? ""
        };

    const displayState =
      projection?.displayState ??
      (editor
        ? this._draft.cleared
          ? "cleared"
          : calc?.status === "success"
            ? "calculated"
            : calc?.status === "invalid"
              ? "invalid"
              : calc?.status === "failed"
                ? "unsupported"
                : "empty"
        : this._connectionState === "disconnected"
          ? "disconnected"
          : "empty");

    const warnings = editor
      ? calc?.warnings ?? []
      : projection?.warnings ?? [];
    const errors = editor ? calc?.errors ?? [] : projection?.errors ?? [];
    const explanation = editor
      ? calc?.explanation?.steps ?? []
      : projection?.explanation?.steps ?? [];

    const createStatus = editor
      ? this._createStatus
      : projection?.creationStatus === "created" || this._createStatus === "created"
        ? "created"
        : projection?.creationStatus === "failed" || this._createStatus === "failed"
          ? "failed"
          : "";
    const createStatusLabel =
      createStatus === "creating"
        ? game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Create.Creating")
        : createStatus === "created"
          ? game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Create.Created")
          : createStatus === "failed"
            ? game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Create.Failed")
            : createStatus === "stale"
              ? game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Create.PreviewStale")
              : createStatus === "duplicate"
                ? game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Create.DuplicateName")
                : "";

    return {
      appId: `${MODULE_ID}-shipyard`,
      title: this.title,
      modeLabel: game.i18n.localize(
        editor
          ? "KAKEMAN89SDATACRON.Shipyard.Mode.Edit"
          : "KAKEMAN89SDATACRON.Shipyard.Mode.Observe"
      ),
      isEditor: editor,
      featureEnabled: enabled,
      displayState,
      displayStateLabel: game.i18n.localize(
        `KAKEMAN89SDATACRON.Shipyard.State.${displayState}`
      ),
      revision: projection?.revision ?? this._draft.revision,
      syncLabel: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Sync.Live"),
      input,
      sizes: optionList(loadSizes().options, input.size),
      roles: optionList(loadRoles().options, input.role),
      weapons: optionList(loadWeapons().options, input.primaryWeapon),
      installStates: ["Not Installed", "Installed"].map((value) => ({
        value,
        label: value,
        selected: value === input.installState
      })),
      lockStates: ["None", "Locked", "Unlocked"].map((value) => ({
        value,
        label: value,
        selected: value === input.lockState
      })),
      armorOptions: [
        { display: "Armor Selection:" },
        { display: "Deflection armor" }
      ].map((opt) => ({
        value: opt.display,
        label: opt.display,
        selected: opt.display === input.armor
      })),
      abilities: ["str", "dex", "con", "int", "wis"].map((key) => ({
        key,
        label: game.i18n.localize(`KAKEMAN89SDATACRON.Shipyard.Ability.${key}`),
        value: input.baseAbilities?.[key] ?? 10
      })),
      totals,
      warnings,
      errors,
      explanation,
      showCreate: editor,
      actorName: editor ? this._actorName : projection?.createdActorName ?? this._actorName,
      folderId: this._folderId ?? "",
      folders: editor
        ? [{ id: "", name: "" }, ...listActorFolders()].map((folder) => ({
            id: folder.id,
            name: folder.name,
            selected: (folder.id || "") === (this._folderId || "")
          }))
        : [],
      ownershipUsers: editor
        ? listOwnershipCandidates().map((user) => ({
            id: user.id,
            name: user.name,
            ownerSelected: this._ownerIds.includes(user.id),
            observerSelected: this._observerIds.includes(user.id)
          }))
        : [],
      imagePath: this._imagePath,
      preview: this._preview,
      createStatus,
      createStatusLabel,
      createEnabled: Boolean(editor && this._preview && this._createStatus !== "creating"),
      labels: {
        size: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Field.Size"),
        tier: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Field.Tier"),
        role: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Field.Role"),
        weapon: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Field.Weapon"),
        install: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Field.Install"),
        lock: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Field.Lock"),
        armor: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Field.Armor"),
        quartersLiving: game.i18n.localize(
          "KAKEMAN89SDATACRON.Shipyard.Field.QuartersLiving"
        ),
        grandTotal: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Result.GrandTotal"),
        buildDays: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Result.BuildDays"),
        totalNoMisc: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Result.TotalNoMisc"),
        miscTotal: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Result.MiscTotal"),
        hull: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Result.Hull"),
        shields: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Result.Shields"),
        reset: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Action.Reset"),
        warnings: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Section.Warnings"),
        errors: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Section.Errors"),
        explanation: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Section.Explanation"),
        results: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Section.Results"),
        inputs: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Section.Inputs"),
        status: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Section.Status"),
        selections: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Section.Selections"),
        preview: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Create.Preview"),
        createStarship: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Create.CreateStarship"),
        actorName: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Create.ActorName"),
        folder: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Create.Folder"),
        ownership: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Create.Ownership"),
        image: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Create.Image"),
        retry: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Create.Retry"),
        owner: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Create.Owner"),
        observer: game.i18n.localize("KAKEMAN89SDATACRON.Shipyard.Create.Observer")
      }
    };
  }

  _onClose(options) {
    this._abort?.abort();
    this._abort = null;
    super._onClose(options);
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const element = this.element;
    if (!element) return;

    this._abort?.abort();
    this._abort = new AbortController();
    const { signal } = this._abort;

    configureShipyardSocketHandlers({
      onProjectionReceived: (projection, meta) => this._onPlayerProjection(projection, meta),
      onActorCreated: (payload) => this._onPlayerCreated(payload),
      getAuthoritativeProjection: () =>
        this.isEditor
          ? buildProjection({
              draft: this._draft,
              sessionOwnerId: this._draft.sessionOwnerId ?? game.user?.id ?? null
            })
          : null,
      getSessionMeta: () => this._sessionMeta()
    });

    if (this.isEditor) {
      for (const field of element.querySelectorAll("[data-shipyard-field]")) {
        field.addEventListener(
          "change",
          () => {
            void this._applyField(field.dataset.shipyardField, field.value);
          },
          { signal }
        );
      }
      for (const field of element.querySelectorAll("[data-shipyard-ability]")) {
        field.addEventListener(
          "change",
          () => {
            void this._applyAbility(field.dataset.shipyardAbility, field.value);
          },
          { signal }
        );
      }
      element.querySelector("[data-shipyard-reset]")?.addEventListener(
        "click",
        () => {
          void this._onReset();
        },
        { signal }
      );
      element.querySelector("[data-shipyard-actor-name]")?.addEventListener(
        "change",
        (event) => {
          this._actorName = String(event.currentTarget.value ?? "");
          this._invalidatePreview();
          void this.render(true);
        },
        { signal }
      );
      element.querySelector("[data-shipyard-folder]")?.addEventListener(
        "change",
        (event) => {
          this._folderId = String(event.currentTarget.value ?? "") || null;
          this._invalidatePreview();
          void this.render(true);
        },
        { signal }
      );
      element.querySelector("[data-shipyard-image]")?.addEventListener(
        "change",
        (event) => {
          this._imagePath = String(event.currentTarget.value ?? "");
          this._invalidatePreview();
          void this.render(true);
        },
        { signal }
      );
      for (const box of element.querySelectorAll("[data-shipyard-owner]")) {
        box.addEventListener(
          "change",
          () => {
            this._ownerIds = [...element.querySelectorAll("[data-shipyard-owner]:checked")].map(
              (el) => el.value
            );
            this._invalidatePreview();
            void this.render(true);
          },
          { signal }
        );
      }
      for (const box of element.querySelectorAll("[data-shipyard-observer]")) {
        box.addEventListener(
          "change",
          () => {
            this._observerIds = [...element.querySelectorAll("[data-shipyard-observer]:checked")].map(
              (el) => el.value
            );
            this._invalidatePreview();
            void this.render(true);
          },
          { signal }
        );
      }
      element.querySelector("[data-shipyard-preview]")?.addEventListener(
        "click",
        () => this._onPreview(),
        { signal }
      );
      element.querySelector("[data-shipyard-create]")?.addEventListener(
        "click",
        () => {
          void this._onCreate();
        },
        { signal }
      );
      element.querySelector("[data-shipyard-retry]")?.addEventListener(
        "click",
        () => {
          this._createStatus = "";
          this._onPreview();
        },
        { signal }
      );
    } else {
      requestShipyardSnapshot();
    }
  }
}

export async function openShipyardAppGate() {
  if (!canOpenShipyard(game.user, { featureEnabled: featureEnabled() })) {
    return false;
  }
  if (canEditShipyardDraft(game.user, { featureEnabled: featureEnabled() })) {
    return true;
  }
  return canObserveShipyard(game.user, {
    featureEnabled: featureEnabled(),
    hasProjection: true
  });
}
