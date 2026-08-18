import {
  getActorFromUuid,
  getPilotActorOptions,
  getShipActorOptions,
  resolvePilotingSkillKey
} from "./actor-helpers.js";
import { MODULE_ID } from "./logger.js";
import { loadPlanetData, getPlanetList, getPlanetByName } from "./planet-data.js";
import { attachPlanetCombos } from "./planet-combo.js";
import { performPilotingSkillRoll } from "./piloting-roll.js";
import { getPilotingCheckDC } from "./travel-calculator.js";
import { calculateNavComputerBasic } from "./navcomputer/calculate-basic.js";
import { loadRegionMatrix } from "./navcomputer/region-matrix.js";
import { SETTING_KEYS } from "./settings.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

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

export class DatacronApp extends HandlebarsApplicationMixin(ApplicationV2) {
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
    classes: [MODULE_ID, "kakeman89s-datacron-app"],
    position: {
      width: 720,
      height: 540
    },
    window: {
      icon: "fa-solid fa-route",
      title: "KAKEMAN89SDATACRON.App.HyperspaceTitle",
      resizable: true
    }
  });

  static PARTS = {
    content: {
      template: `modules/${MODULE_ID}/templates/datacron.hbs`
    }
  };

  get title() {
    return game.i18n.localize("KAKEMAN89SDATACRON.App.HyperspaceTitle");
  }

  _readHouseRuleRates() {
    const fuelPerHour = Number(game.settings?.get?.(MODULE_ID, SETTING_KEYS.fuelPerHour) ?? 1);
    const foodPerCrewPerDay = Number(game.settings?.get?.(MODULE_ID, SETTING_KEYS.foodPerCrewPerDay) ?? 1);
    return { fuelRate: fuelPerHour, foodRate: foodPerCrewPerDay };
  }

  _attachPilotingAndArc(result) {
    const regionsJourneyArc = buildRegionsJourneyArc(result.regionsCrossed ?? []);
    const pilotingCheck = getPilotingCheckDC(
      result.originLookupRegion ?? result.originRegion,
      result.destinationLookupRegion ?? result.destinationRegion,
      "basic",
      0,
      0,
      0,
      0
    );
    return foundry.utils.mergeObject(foundry.utils.deepClone(result), {
      pilotingCheck,
      routeLaneRows: [],
      regionsJourneyArc,
      advancedCuratedFallback: false,
      usedRegionalAdvancedFallback: false,
      advancedFallbackReason: null,
      routeUiWarnings: []
    });
  }

  _refreshTravelResourcesIfRoute() {
    if (!this._routeBasicResult?.originPlanet || !this._routeBasicResult?.destinationPlanet) return;
    const shipActor = getActorFromUuid(this.selectedShipUuid);
    const { fuelRate, foodRate } = this._readHouseRuleRates();
    const result = calculateNavComputerBasic({
      originPlanet: this._routeBasicResult.originPlanet,
      destinationPlanet: this._routeBasicResult.destinationPlanet,
      shipActor,
      fuelRate,
      foodRate
    });
    this._routeBasicResult = this._attachPilotingAndArc(result);
  }

  async _prepareContext(_options) {
    let planets = [];
    let planetLoadWarning = null;

    try {
      await loadPlanetData();
      await loadRegionMatrix();
      planets = await getPlanetList();
    } catch (_error) {
      planetLoadWarning = game.i18n.localize("KAKEMAN89SDATACRON.Warning.PlanetDataLoadFailed");
    }

    const currentMode = "basic";
    const modeChoiceKey = "Basic";

    const canCalculate = Boolean(planets.length && !planetLoadWarning);
    const canRollPiloting = Boolean(this.selectedPilotUuid && this._routeBasicResult);
    let statusText;
    if (planetLoadWarning) statusText = planetLoadWarning;
    else if (this._routeError) statusText = this._routeError;
    else if (this._routeBasicResult) {
      if (this._routeBasicResult.status === "unsupported") {
        statusText = game.i18n.localize("KAKEMAN89SDATACRON.App.StatusRouteUnsupported");
      } else if (this._routeBasicResult.status === "invalid") {
        statusText = game.i18n.localize("KAKEMAN89SDATACRON.App.StatusRouteInvalid");
      } else {
        statusText = game.i18n.localize("KAKEMAN89SDATACRON.App.StatusRouteCalculated");
      }
    } else statusText = game.i18n.localize("KAKEMAN89SDATACRON.App.StatusPlaceholder");

    return {
      appId: MODULE_ID,
      title: this.title,
      subtitle: game.i18n.localize("KAKEMAN89SDATACRON.App.Subtitle"),
      planets,
      selectedOrigin: this.selectedOrigin,
      selectedDestination: this.selectedDestination,
      currentMode,
      currentModeLabel: game.i18n.localize(`KAKEMAN89SDATACRON.Settings.CalculationMode.Choices.${modeChoiceKey}`),
      searchPlanetsPlaceholder: game.i18n.localize("KAKEMAN89SDATACRON.App.SearchPlanetsPlaceholder"),
      comboNoMatches: game.i18n.localize("KAKEMAN89SDATACRON.App.ComboNoMatches"),
      calculateLabel: game.i18n.localize("KAKEMAN89SDATACRON.App.CalculateRoute"),
      rollPilotingLabel: game.i18n.localize("KAKEMAN89SDATACRON.App.RollPilotingCheck"),
      pilotPlaceholder: game.i18n.localize("KAKEMAN89SDATACRON.App.PilotPlaceholder"),
      shipPlaceholder: game.i18n.localize("KAKEMAN89SDATACRON.App.ShipPlaceholder"),
      pilotActorOptions: getPilotActorOptions(),
      shipActorOptions: getShipActorOptions(),
      resultsPlaceholder: game.i18n.localize("KAKEMAN89SDATACRON.App.ResultsPlaceholder"),
      planetLoadWarning,
      statusText,
      canCalculate,
      canRollPiloting,
      routeBasicResult: this._routeBasicResult,
      routeError: this._routeError,
      showRouteWarnings: Boolean(this._routeBasicResult?.warnings?.length),
      resourceProfileName: this._routeBasicResult?.travelResources?.resourceProfileName
        ?? this._routeBasicResult?.resourceProfileId
        ?? null,
      showResources: Boolean(this._routeBasicResult?.resourcesApplied && this._routeBasicResult?.travelResources)
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
      this._routeError = game.i18n.localize("KAKEMAN89SDATACRON.App.RouteErrorSelectBoth");
      this._routeBasicResult = null;
      await this.render(true);
      return;
    }

    const originPlanet = await getPlanetByName(originName);
    if (!originPlanet) {
      this._routeError = game.i18n.format("KAKEMAN89SDATACRON.App.RouteErrorUnknownPlanet", { name: originName });
      this._routeBasicResult = null;
      await this.render(true);
      return;
    }

    const destinationPlanet = await getPlanetByName(destName);
    if (!destinationPlanet) {
      this._routeError = game.i18n.format("KAKEMAN89SDATACRON.App.RouteErrorUnknownPlanet", { name: destName });
      this._routeBasicResult = null;
      await this.render(true);
      return;
    }

    const shipActor = getActorFromUuid(this.selectedShipUuid);
    const { fuelRate, foodRate } = this._readHouseRuleRates();
    const result = calculateNavComputerBasic({
      originPlanet,
      destinationPlanet,
      shipActor,
      fuelRate,
      foodRate
    });

    this._routeBasicResult = this._attachPilotingAndArc(result);
    this._routeError = null;
    await this.render(true);
  }

  async _onRollPilotingCheck() {
    if (!this.selectedPilotUuid) {
      ui.notifications?.warn?.(game.i18n.localize("KAKEMAN89SDATACRON.App.RollErrorNoPilot"));
      return;
    }
    if (!this._routeBasicResult) {
      ui.notifications?.warn?.(game.i18n.localize("KAKEMAN89SDATACRON.App.RollErrorNoRoute"));
      return;
    }

    const pilotActor = getActorFromUuid(this.selectedPilotUuid);
    if (!pilotActor) {
      ui.notifications?.warn?.(game.i18n.localize("KAKEMAN89SDATACRON.App.RollErrorPilotNotFound"));
      return;
    }

    const { skillKey } = resolvePilotingSkillKey(pilotActor);
    if (!skillKey) {
      ui.notifications?.warn?.(
        game.i18n.format("KAKEMAN89SDATACRON.App.RollErrorNoSkill", { name: pilotActor.name })
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
          ui.notifications?.info?.(game.i18n.localize("KAKEMAN89SDATACRON.App.PilotRollSentGmOnly"));
        }
      } else {
        ui.notifications?.warn?.(game.i18n.localize("KAKEMAN89SDATACRON.App.RollErrorFailed"));
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
