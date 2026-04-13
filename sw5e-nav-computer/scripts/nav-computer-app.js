import {
  getActorFromUuid,
  getHyperdriveMultiplierFromShipActor,
  getPilotActorOptions,
  getShipActorOptions,
  resolvePilotingSkillKey
} from "./actor-helpers.js";
import { MODULE_ID } from "./logger.js";
import { loadPlanetData, getPlanetList, getPlanetByName } from "./planet-data.js";
import { attachPlanetCombos } from "./planet-combo.js";
import { performPilotingSkillRoll } from "./piloting-roll.js";
import { calculateRouteAdvanced, calculateRouteBasic } from "./route-calculator.js";
import { SETTING_KEYS } from "./settings.js";
import { calculateTravelResources, getPilotingCheckDC } from "./travel-calculator.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Collapse consecutive identical lane labels (same name and same synthetic flag).
 * @param {string[]} names
 * @param {boolean[]} syntheticFlags
 */
function collapseRouteLaneRows(names, syntheticFlags) {
  const rows = [];
  const synList = syntheticFlags ?? [];
  const n = names?.length ?? 0;
  let i = 0;
  while (i < n) {
    const laneName = names[i];
    const syn = Boolean(synList[i]);
    let count = 1;
    while (
      i + count < n &&
      names[i + count] === laneName &&
      Boolean(synList[i + count]) === syn
    ) {
      count++;
    }
    const label = count > 1 ? `${laneName} ×${count}` : laneName;
    rows.push({
      name: label,
      synthetic: syn,
      syntheticTitle: syn ? game.i18n.localize("SW5ENAVCOMPUTER.App.LaneSyntheticTooltip") : ""
    });
    i += count;
  }
  return rows;
}

const FALLBACK_REASON_TO_I18N = {
  NO_LANE_PATH: "NoLanePath",
  MISSING_COORDINATES: "MissingCoordinates",
  FILTERED_LANES_ONLY: "FilteredLanesOnly",
  DATA_ERROR: "DataError"
};

/**
 * Localized inline banners for Advanced regional fallback (no modal UI).
 * @param {object | null | undefined} routeResult
 * @returns {{ message: string, emphasis: boolean }[]}
 */
function buildAdvancedInlineWarnings(routeResult) {
  if (!routeResult || routeResult.mode !== "advanced" || !routeResult.usedRegionalAdvancedFallback) {
    return [];
  }
  const out = [];
  for (const w of routeResult.routeUiWarnings ?? []) {
    if (w.code === "ADVANCED_FALLBACK" && w.reason && FALLBACK_REASON_TO_I18N[w.reason]) {
      const key = `SW5ENAVCOMPUTER.App.AdvancedFallback.${FALLBACK_REASON_TO_I18N[w.reason]}`;
      out.push({ message: game.i18n.localize(key), emphasis: false });
    } else if (w.code === "LONG_DISTANCE_FALLBACK_ESTIMATE") {
      out.push({
        message: game.i18n.localize("SW5ENAVCOMPUTER.App.AdvancedFallback.LongDistanceEstimateWarning"),
        emphasis: true
      });
    }
  }
  return out;
}

/** Regions: drop consecutive duplicates, then unique-only in first-seen order; display arc. */
function buildRegionsJourneyArc(regions) {
  if (!Array.isArray(regions) || !regions.length) return "";
  const collapsed = [];
  for (const r of regions) {
    if (r == null || r === "") continue;
    if (collapsed[collapsed.length - 1] !== r) collapsed.push(r);
  }
  const unique = [...new Set(collapsed)];
  return unique.join(" → ");
}

export class NavComputerApp extends HandlebarsApplicationMixin(ApplicationV2) {
  selectedOrigin = "";

  selectedDestination = "";

  /** @type {string} */
  selectedPilotUuid = "";

  /** @type {string} */
  selectedShipUuid = "";

  /** @type {AbortController | null} */
  _comboAbort = null;

  /** @type {object | null} */
  _routeBasicResult = null;

  /** @type {string | null} */
  _routeError = null;

  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    id: MODULE_ID,
    tag: "section",
    classes: [MODULE_ID, "sw5e-nav-computer-app"],
    position: {
      width: 720,
      height: 540
    },
    window: {
      icon: "fa-solid fa-route",
      title: "SW5ENAVCOMPUTER.App.Title",
      resizable: true
    }
  });

  static PARTS = {
    content: {
      template: `modules/${MODULE_ID}/templates/nav-computer.hbs`
    }
  };

  get title() {
    return game.i18n.localize("SW5ENAVCOMPUTER.App.Title");
  }

  _refreshTravelResourcesIfRoute() {
    if (!this._routeBasicResult?.originPlanet) return;
    const hours = this._routeBasicResult.travelTimeHours ?? 0;
    const shipActor = getActorFromUuid(this.selectedShipUuid);
    const travelResources = calculateTravelResources(hours, shipActor);
    this._routeBasicResult = foundry.utils.mergeObject(
      foundry.utils.deepClone(this._routeBasicResult),
      { travelResources }
    );
  }

  async _prepareContext(_options) {
    let planets = [];
    let planetLoadWarning = null;

    try {
      await loadPlanetData();
      planets = await getPlanetList();
    } catch (_error) {
      planetLoadWarning = game.i18n.localize("SW5ENAVCOMPUTER.Warning.PlanetDataLoadFailed");
    }

    const currentMode = game.settings?.get?.(MODULE_ID, SETTING_KEYS.calculationMode) ?? "basic";
    const modeChoiceKey = currentMode === "advanced" ? "Advanced" : "Basic";

    const canCalculate = Boolean(planets.length && !planetLoadWarning);
    const canRollPiloting = Boolean(this.selectedPilotUuid && this._routeBasicResult);

    let statusText;
    if (planetLoadWarning) statusText = planetLoadWarning;
    else if (this._routeError) statusText = this._routeError;
    else if (this._routeBasicResult) {
      if (this._routeBasicResult.advancedCuratedFallback)
        statusText = game.i18n.localize("SW5ENAVCOMPUTER.App.StatusRouteCalculatedAdvancedFallback");
      else if (this._routeBasicResult.mode === "advanced" && this._routeBasicResult.advancedRouteFound)
        statusText = game.i18n.localize("SW5ENAVCOMPUTER.App.StatusRouteCalculatedAdvanced");
      else statusText = game.i18n.localize("SW5ENAVCOMPUTER.App.StatusRouteCalculated");
    } else statusText = game.i18n.localize("SW5ENAVCOMPUTER.App.StatusPlaceholder");

    return {
      appId: MODULE_ID,
      title: this.title,
      subtitle: game.i18n.localize("SW5ENAVCOMPUTER.App.Subtitle"),
      planets,
      selectedOrigin: this.selectedOrigin,
      selectedDestination: this.selectedDestination,
      currentMode,
      currentModeLabel: game.i18n.localize(`SW5ENAVCOMPUTER.Settings.CalculationMode.Choices.${modeChoiceKey}`),
      searchPlanetsPlaceholder: game.i18n.localize("SW5ENAVCOMPUTER.App.SearchPlanetsPlaceholder"),
      comboNoMatches: game.i18n.localize("SW5ENAVCOMPUTER.App.ComboNoMatches"),
      calculateLabel: game.i18n.localize("SW5ENAVCOMPUTER.App.CalculateRoute"),
      rollPilotingLabel: game.i18n.localize("SW5ENAVCOMPUTER.App.RollPilotingCheck"),
      pilotPlaceholder: game.i18n.localize("SW5ENAVCOMPUTER.App.PilotPlaceholder"),
      shipPlaceholder: game.i18n.localize("SW5ENAVCOMPUTER.App.ShipPlaceholder"),
      pilotActorOptions: getPilotActorOptions(),
      shipActorOptions: getShipActorOptions(),
      resultsPlaceholder: game.i18n.localize("SW5ENAVCOMPUTER.App.ResultsPlaceholder"),
      planetLoadWarning,
      statusText,
      canCalculate,
      canRollPiloting,
      routeBasicResult: this._routeBasicResult,
      routeError: this._routeError,
      showRouteWarnings: Boolean(this._routeBasicResult?.warnings?.length),
      showAdvancedHyperlaneDetails: Boolean(
        this._routeBasicResult?.mode === "advanced" && this._routeBasicResult?.advancedRouteFound
      ),
      advancedCuratedFallback: Boolean(this._routeBasicResult?.advancedCuratedFallback),
      advancedInlineWarnings: buildAdvancedInlineWarnings(this._routeBasicResult)
    };
  }

  _onClose(options) {
    this._comboAbort?.abort();
    this._comboAbort = null;
    super._onClose(options);
  }

  async _onCalculateRoute() {
    this._routeError = null;

    const originName = this.selectedOrigin?.trim() ?? "";
    const destName = this.selectedDestination?.trim() ?? "";

    if (!originName || !destName) {
      this._routeError = game.i18n.localize("SW5ENAVCOMPUTER.App.RouteErrorSelectBoth");
      this._routeBasicResult = null;
      await this.render(true);
      return;
    }

    const originPlanet = await getPlanetByName(originName);
    if (!originPlanet) {
      this._routeError = game.i18n.format("SW5ENAVCOMPUTER.App.RouteErrorUnknownPlanet", { name: originName });
      this._routeBasicResult = null;
      await this.render(true);
      return;
    }

    const destinationPlanet = await getPlanetByName(destName);
    if (!destinationPlanet) {
      this._routeError = game.i18n.format("SW5ENAVCOMPUTER.App.RouteErrorUnknownPlanet", { name: destName });
      this._routeBasicResult = null;
      await this.render(true);
      return;
    }

    const currentMode = game.settings?.get?.(MODULE_ID, SETTING_KEYS.calculationMode) ?? "basic";
    const shipActor = getActorFromUuid(this.selectedShipUuid);
    const hyperMult = getHyperdriveMultiplierFromShipActor(shipActor);

    let result;
    if (currentMode === "advanced") {
      const advanced = await calculateRouteAdvanced(originPlanet, destinationPlanet, hyperMult);
      result = foundry.utils.deepClone(advanced);
      result.advancedCuratedFallback = Boolean(result.usedRegionalAdvancedFallback);
    } else {
      result = calculateRouteBasic(originPlanet, destinationPlanet);
      result = foundry.utils.deepClone(result);
      result.advancedCuratedFallback = false;
      result.usedRegionalAdvancedFallback = false;
      result.advancedFallbackReason = null;
      result.routeUiWarnings = [];
    }

    const hopSynthetic = result.routeHopsSynthetic ?? [];
    let curatedHops = 0;
    let syntheticHops = 0;
    for (let hi = 0; hi < hopSynthetic.length; hi++) {
      if (hopSynthetic[hi]) syntheticHops++;
      else curatedHops++;
    }

    const routeLaneRows = collapseRouteLaneRows(result.routeNames ?? [], hopSynthetic);
    const regionsJourneyArc = buildRegionsJourneyArc(result.regionsCrossed ?? []);

    const travelResources = calculateTravelResources(result.travelTimeHours ?? 0, shipActor);
    const laneDcBonus = Number(result.pathDcBonusTotal ?? 0);
    const pathMaxTier = Number(result.pathMaxTier ?? 0);
    const advancedOk = currentMode === "advanced" && result.advancedRouteFound;
    const pilotingCheck = getPilotingCheckDC(
      result.originRegion,
      result.destinationRegion,
      advancedOk ? "advanced" : "basic",
      advancedOk ? curatedHops : 0,
      advancedOk ? syntheticHops : 0,
      Number.isFinite(laneDcBonus) ? laneDcBonus : 0,
      Number.isFinite(pathMaxTier) ? pathMaxTier : 0
    );

    this._routeBasicResult = foundry.utils.mergeObject(foundry.utils.deepClone(result), {
      travelResources,
      pilotingCheck,
      routeLaneRows,
      regionsJourneyArc
    });
    this._routeError = null;
    await this.render(true);
  }

  async _onRollPilotingCheck() {
    if (!this.selectedPilotUuid) {
      ui.notifications?.warn?.(game.i18n.localize("SW5ENAVCOMPUTER.App.RollErrorNoPilot"));
      return;
    }
    if (!this._routeBasicResult) {
      ui.notifications?.warn?.(game.i18n.localize("SW5ENAVCOMPUTER.App.RollErrorNoRoute"));
      return;
    }

    const pilotActor = getActorFromUuid(this.selectedPilotUuid);
    if (!pilotActor) {
      ui.notifications?.warn?.(game.i18n.localize("SW5ENAVCOMPUTER.App.RollErrorPilotNotFound"));
      return;
    }

    const { skillKey } = resolvePilotingSkillKey(pilotActor);
    if (!skillKey) {
      ui.notifications?.warn?.(
        game.i18n.format("SW5ENAVCOMPUTER.App.RollErrorNoSkill", { name: pilotActor.name })
      );
      return;
    }

    queueMicrotask(() => {
      void this._executePilotingRoll(pilotActor, skillKey);
    });
  }

  async _executePilotingRoll(pilotActor, skillKey) {
    try {
      const ok = await performPilotingSkillRoll(pilotActor, skillKey);
      if (ok) {
        if (game.user?.isGM) {
          ui.notifications?.info?.(game.i18n.localize("SW5ENAVCOMPUTER.App.PilotRollSentGmOnly"));
        }
      } else {
        ui.notifications?.warn?.(game.i18n.localize("SW5ENAVCOMPUTER.App.RollErrorFailed"));
      }
    } finally {
      this.bringToFront?.();
      requestAnimationFrame(() => this.bringToFront?.());
    }
  }

  _applyWindowContentScroll() {
    const host = this.window?.content;
    if (!host) return;
    host.style.overflowX = "hidden";
    host.style.overflowY = "auto";
    host.style.minHeight = "0";
    host.style.flex = "1 1 auto";
  }

  async _onRender(context, options) {
    await super._onRender(context, options);

    this._applyWindowContentScroll();

    const element = this.element;
    if (!element) return;

    this._comboAbort?.abort();
    this._comboAbort = new AbortController();
    const { signal } = this._comboAbort;
    const planetsLoaded = Boolean(context.planets?.length);

    attachPlanetCombos(element, {
      planets: context.planets ?? [],
      getSelected: (role) => (role === "origin" ? this.selectedOrigin : this.selectedDestination) ?? "",
      onChange: (role, value) => {
        if (role === "origin") this.selectedOrigin = value ?? "";
        else this.selectedDestination = value ?? "";
      },
      searchPlaceholder: context.searchPlanetsPlaceholder,
      disabled: !planetsLoaded,
      signal
    });

    const pilotSel = element.querySelector("[data-nav-select-pilot]");
    if (pilotSel) {
      pilotSel.value = this.selectedPilotUuid ?? "";
      pilotSel.addEventListener(
        "change",
        () => {
          this.selectedPilotUuid = pilotSel.value ?? "";
          void this.render(true);
        },
        { signal }
      );
    }

    const shipSel = element.querySelector("[data-nav-select-ship]");
    if (shipSel) {
      shipSel.value = this.selectedShipUuid ?? "";
      shipSel.addEventListener(
        "change",
        () => {
          this.selectedShipUuid = shipSel.value ?? "";
          this._refreshTravelResourcesIfRoute();
          void this.render(true);
        },
        { signal }
      );
    }

    element.querySelector("[data-nav-calculate]")?.addEventListener(
      "click",
      () => {
        void this._onCalculateRoute();
      },
      { signal }
    );

    element.querySelector("[data-nav-roll-piloting]")?.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        event.stopPropagation();
        void this._onRollPilotingCheck();
      },
      { signal, capture: true }
    );
  }
}
