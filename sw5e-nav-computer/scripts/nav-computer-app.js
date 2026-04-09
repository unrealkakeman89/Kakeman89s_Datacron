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
      advancedCuratedFallback: Boolean(this._routeBasicResult?.advancedCuratedFallback)
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
      if (advanced.advancedRouteFound) {
        result = foundry.utils.deepClone(advanced);
        result.advancedCuratedFallback = false;
      } else {
        result = foundry.utils.deepClone(calculateRouteBasic(originPlanet, destinationPlanet));
        result.advancedCuratedFallback = true;
        result.warnings = [...(result.warnings ?? []), ...(advanced.warnings ?? [])];
      }
    } else {
      result = calculateRouteBasic(originPlanet, destinationPlanet);
      result = foundry.utils.deepClone(result);
      result.advancedCuratedFallback = false;
    }

    const travelResources = calculateTravelResources(result.travelTimeHours ?? 0, shipActor);
    const laneHops =
      result.mode === "advanced" && result.advancedRouteFound
        ? Math.max(0, (result.path?.length ?? 1) - 1)
        : 0;
    const pilotingCheck = getPilotingCheckDC(
      result.originRegion,
      result.destinationRegion,
      currentMode === "advanced" && result.advancedRouteFound ? "advanced" : "basic",
      laneHops
    );

    this._routeBasicResult = foundry.utils.mergeObject(foundry.utils.deepClone(result), {
      travelResources,
      pilotingCheck
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
