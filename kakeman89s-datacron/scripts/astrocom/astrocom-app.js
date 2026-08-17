import { MODULE_ID } from "../logger.js";
import { resolveBrowserState } from "./browser-state.js";
import { emptyBrowserFilters, filterIndex, relatedEntry, sortIndexEntries, uniqueValues } from "./index-query.js";
import {
  canBrowseAstroCom,
  canRunAstroComDevRebuild,
  canViewAstroComSourceDetail
} from "./permissions.js";
import { loadGeneratedAstroCom, loadLiveAstroComIndex, openAstroComJournal, rebuildAstroCom } from "./rebuild.js";
import {
  ASTROCOM_PILOT_WORLD_ID,
  ASTROCOM_POC_WORLD_ID,
  resolveBrowserEntries
} from "./runtime-guards.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

function optionList(values, selected) {
  return values.map((value) => ({ value, selected: value === selected }));
}

export class AstroComApp extends HandlebarsApplicationMixin(ApplicationV2) {
  continuity = "";

  region = "";

  sector = "";

  system = "";

  grid = "";

  route = "";

  classification = "";

  nameOrAlias = "";

  /** @type {object | null} */
  generated = null;

  /** @type {object[]} */
  liveIndex = [];

  /** @type {object[]} */
  requestedPacks = [];

  foundPacks = 0;

  requestedPackCount = 0;

  /** @type {string} */
  statusMessage = "";

  /** @type {string | null} */
  loadError = null;

  loading = false;

  /** @type {AbortController | null} */
  _abort = null;

  /** @type {number | null} */
  _searchCaret = null;

  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    id: `${MODULE_ID}-astrocom`,
    tag: "section",
    classes: [MODULE_ID, "kakeman89s-datacron-astrocom"],
    position: {
      width: 720,
      height: 640
    },
    window: {
      icon: "fa-solid fa-book-atlas",
      title: "KAKEMAN89SDATACRON.AstroCom.Title",
      resizable: true
    }
  });

  static PARTS = {
    content: {
      template: `modules/${MODULE_ID}/templates/astrocom/browser.hbs`
    }
  };

  get title() {
    return game.i18n.localize("KAKEMAN89SDATACRON.AstroCom.Title");
  }

  _clearFilters() {
    Object.assign(this, emptyBrowserFilters());
    this._searchCaret = null;
  }

  async _loadData() {
    this.loading = true;
    this.loadError = null;
    try {
      this.generated ??= await loadGeneratedAstroCom();
      const live = await loadLiveAstroComIndex();
      this.liveIndex = live.entries;
      this.requestedPacks = live.requested ?? [];
      this.foundPacks = live.foundPacks ?? this.requestedPacks.filter((pack) => pack.found !== false).length;
      this.requestedPackCount = live.requestedPackCount ?? this.requestedPacks.length;
    } catch (error) {
      this.loadError = error;
      this.liveIndex = [];
      this.requestedPacks = [];
      this.foundPacks = 0;
      this.requestedPackCount = 0;
    } finally {
      this.loading = false;
    }
  }

  _index() {
    return resolveBrowserEntries(this.liveIndex).entries;
  }

  async _prepareContext(_options) {
    await this._loadData();
    const resolved = resolveBrowserEntries(this.liveIndex);
    const index = resolved.entries;
    const browserState = resolveBrowserState({
      featureEnabled: true,
      loading: this.loading,
      error: this.loadError,
      requestedPacks: this.requestedPacks,
      foundPacks: this.foundPacks,
      entryCount: index.length
    });

    const filtered = sortIndexEntries(
      filterIndex(index, {
        continuity: this.continuity,
        region: this.region,
        sector: this.sector,
        system: this.system,
        grid: this.grid,
        route: this.route,
        classification: this.classification,
        nameOrAlias: this.nameOrAlias
      })
    ).map((entry) => {
      const related = relatedEntry(index, entry);
      return {
        name: entry.name,
        uuid: entry.uuid,
        relatedName: related?.name ?? "",
        relatedUuid: related?.uuid ?? ""
      };
    });

    const statusFromState = browserState.messageKey
      ? game.i18n.localize(browserState.messageKey)
      : "";

    return {
      appId: this.id,
      statusMessage: this.statusMessage || statusFromState || (this.generated?.summary?.message ?? ""),
      status: browserState.state,
      resultCountLabel: game.i18n.format("KAKEMAN89SDATACRON.AstroCom.ResultCount", {
        count: filtered.length,
        total: index.length
      }),
      resultCount: filtered.length,
      totalCount: index.length,
      continuityCanonSelected: this.continuity === "canon",
      continuityLegendsSelected: this.continuity === "legends",
      continuityAnySelected: this.continuity === "",
      regions: optionList(uniqueValues(index, "region"), this.region),
      sectors: optionList(uniqueValues(index, "sector"), this.sector),
      systems: optionList(uniqueValues(index, "system"), this.system),
      grids: optionList(uniqueValues(index, "grid"), this.grid),
      classifications: optionList(uniqueValues(index, "classification"), this.classification),
      routes: this.foundPacks > 0
        ? (this.generated?.routes ?? []).map((route) => ({
          ...route,
          selected: route.stableId === this.route
        }))
        : [],
      nameOrAlias: this.nameOrAlias,
      results: filtered,
      canBrowse: canBrowseAstroCom(game.user),
      canViewSourceDetail: canViewAstroComSourceDetail(game.user),
      canRebuild: canRunAstroComDevRebuild(game.user, game.world?.id, {
        pocWorldId: ASTROCOM_POC_WORLD_ID,
        pilotWorldId: ASTROCOM_PILOT_WORLD_ID
      })
    };
  }

  _onClose(options) {
    this._abort?.abort();
    this._abort = null;
    super._onClose(options);
  }

  async _onRebuild() {
    if (!canRunAstroComDevRebuild(game.user, game.world?.id, {
      pocWorldId: ASTROCOM_POC_WORLD_ID,
      pilotWorldId: ASTROCOM_PILOT_WORLD_ID
    })) {
      this.statusMessage = game.i18n.localize("KAKEMAN89SDATACRON.AstroCom.RebuildRefused");
      await this.render(true);
      return;
    }
    this.statusMessage = "";
    try {
      const summary = await rebuildAstroCom();
      this.statusMessage = summary.message;
      this.generated = await loadGeneratedAstroCom();
      const live = await loadLiveAstroComIndex();
      this.liveIndex = live.entries;
      this.requestedPacks = live.requested ?? [];
      this.foundPacks = live.foundPacks ?? 0;
      this.requestedPackCount = live.requestedPackCount ?? 0;
    } catch (error) {
      this.statusMessage = String(error?.message ?? error);
    }
    await this.render(true);
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const host = this.window?.content;
    if (host) {
      host.style.overflowX = "hidden";
      host.style.overflowY = "auto";
      host.style.minHeight = "0";
      host.style.flex = "1 1 auto";
    }

    const element = this.element;
    if (!element) return;

    this._abort?.abort();
    this._abort = new AbortController();
    const { signal } = this._abort;

    element.querySelector("form")?.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();
      },
      { signal }
    );

    const search = element.querySelector("[data-astrocom-filter=\"nameOrAlias\"]");
    if (search && this._searchCaret != null) {
      search.focus();
      search.setSelectionRange(this._searchCaret, this._searchCaret);
    }

    for (const field of element.querySelectorAll("[data-astrocom-filter]")) {
      const eventName = field.dataset.astrocomFilter === "nameOrAlias" ? "input" : "change";
      field.addEventListener(
        eventName,
        () => {
          const key = field.dataset.astrocomFilter;
          this[key] = field.value;
          if (key === "nameOrAlias") this._searchCaret = field.selectionStart;
          void this.render(true);
        },
        { signal }
      );
    }

    element.querySelector("[data-astrocom-clear]")?.addEventListener(
      "click",
      () => {
        this._clearFilters();
        void this.render(true);
      },
      { signal }
    );

    element.querySelector("[data-astrocom-rebuild]")?.addEventListener(
      "click",
      () => {
        void this._onRebuild();
      },
      { signal }
    );

    for (const button of element.querySelectorAll("[data-astrocom-open]")) {
      button.addEventListener(
        "click",
        () => {
          void openAstroComJournal(button.dataset.uuid);
        },
        { signal }
      );
    }
  }
}
