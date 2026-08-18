import { logInfo, logWarn, MODULE_ID } from "./logger.js";
import { DatacronApp } from "./datacron-app.js";
import { DroidAllyApp } from "./droid-ally-app.js";
import { AstroComApp } from "./astrocom/astrocom-app.js";
import { canBrowseAstroCom } from "./astrocom/permissions.js";
import { loadGeneratedAstroCom, loadLiveAstroComIndex, openAstroComJournal, rebuildAstroCom, rebuildAstroComPilot, rebuildAstroComPoc, attemptBulkAstroComBuild } from "./astrocom/rebuild.js";
import { registerSettings, SETTING_KEYS } from "./settings.js";
import { ShipyardApp, openShipyardAppGate } from "./shipyard/shipyard-app.js";
import { canOpenShipyard } from "./shipyard/permissions.js";
import { registerShipyardSockets } from "./shipyard/socket-runtime.js";
import { canOpenNavComputer } from "./navcomputer/permissions.js";
import { loadRegionMatrix } from "./navcomputer/region-matrix.js";

let hyperspaceNavigationApp = null;
let droidAllyPricingApp = null;
let astroComApp = null;
let shipyardApp = null;

function isNavComputerEnabled() {
  try {
    return Boolean(game.settings.get(MODULE_ID, SETTING_KEYS.featureNavComputer));
  } catch (_error) {
    return false;
  }
}

function isAstroComEnabled() {
  try {
    return Boolean(game.settings.get(MODULE_ID, SETTING_KEYS.featureAstroCom));
  } catch (_error) {
    return false;
  }
}

function isShipyardEnabled() {
  try {
    return Boolean(game.settings.get(MODULE_ID, SETTING_KEYS.featureShipyard));
  } catch (_error) {
    return false;
  }
}

function clearAppSingletonIfStale(appRef, clear) {
  if (!appRef) return;
  const el = appRef.element;
  if (appRef.rendered && (!el || !el.isConnected)) {
    clear();
  }
}

function getSw5eModuleSnapshot() {
  const module = game.modules.get("sw5e-module") ?? game.modules.get("sw5e") ?? null;
  return {
    id: module?.id ?? null,
    active: module?.active ?? false,
    version: module?.version ?? null
  };
}

function getEnvironmentWarnings() {
  const warnings = [];

  if (game.system?.id !== "dnd5e") {
    warnings.push(game.i18n.localize("KAKEMAN89SDATACRON.Warning.UnexpectedSystem"));
  }

  if (!game.modules.get("sw5e-module")?.active && !game.modules.get("sw5e")?.active) {
    warnings.push(game.i18n.localize("KAKEMAN89SDATACRON.Warning.MissingSw5e"));
  }

  return warnings;
}

export async function openHyperspaceNavigationApp() {
  if (!canOpenNavComputer(game.user, { featureEnabled: isNavComputerEnabled() })) return null;
  clearAppSingletonIfStale(hyperspaceNavigationApp, () => {
    hyperspaceNavigationApp = null;
  });
  hyperspaceNavigationApp ??= new DatacronApp();
  await hyperspaceNavigationApp.render(true);
  if (hyperspaceNavigationApp.rendered) hyperspaceNavigationApp.bringToFront();
  return hyperspaceNavigationApp;
}

export async function openDroidAllyPricingApp() {
  if (!game.user?.isGM) return null;
  clearAppSingletonIfStale(droidAllyPricingApp, () => {
    droidAllyPricingApp = null;
  });
  droidAllyPricingApp ??= new DroidAllyApp();
  await droidAllyPricingApp.render(true);
  if (droidAllyPricingApp.rendered) droidAllyPricingApp.bringToFront();
  return droidAllyPricingApp;
}

export async function openAstroComApp() {
  if (!canBrowseAstroCom(game.user)) return null;
  if (!isAstroComEnabled()) return null;
  clearAppSingletonIfStale(astroComApp, () => {
    astroComApp = null;
  });
  astroComApp ??= new AstroComApp();
  await astroComApp.render(true);
  if (astroComApp.rendered) astroComApp.bringToFront();
  return astroComApp;
}

export async function openShipyardApp() {
  if (!(await openShipyardAppGate())) return null;
  clearAppSingletonIfStale(shipyardApp, () => {
    shipyardApp = null;
  });
  shipyardApp ??= new ShipyardApp();
  await shipyardApp.render(true);
  if (shipyardApp.rendered) shipyardApp.bringToFront();
  return shipyardApp;
}

Hooks.once("init", () => {
  registerSettings();
  logInfo("Initializing module scaffold.");

  Hooks.on("closeApplicationV2", (app) => {
    if (app === hyperspaceNavigationApp || app?.id === MODULE_ID) {
      hyperspaceNavigationApp = null;
    }
    if (app === droidAllyPricingApp || app?.id === `${MODULE_ID}-droid-ally`) {
      droidAllyPricingApp = null;
    }
    if (app === astroComApp || app?.id === `${MODULE_ID}-astrocom`) {
      astroComApp = null;
    }
    if (app === shipyardApp || app?.id === `${MODULE_ID}-shipyard`) {
      shipyardApp = null;
    }
  });
});

Hooks.on("getSceneControlButtons", (controls) => {
  const hostControl = controls.tokens ?? controls.token ?? null;
  if (!hostControl) {
    logWarn("No token scene control was available to register the Datacron button.");
    return;
  }

  hostControl.tools ??= {};

  if (isNavComputerEnabled() && canOpenNavComputer(game.user, { featureEnabled: true })) {
    const hyperspaceToolName = `${MODULE_ID}-open-hyperspace`;
    hostControl.tools[hyperspaceToolName] = {
      name: hyperspaceToolName,
      title: "KAKEMAN89SDATACRON.SceneControl.OpenHyperspace",
      icon: "fa-solid fa-route",
      order: Object.keys(hostControl.tools).length,
      button: true,
      visible: true,
      onChange: (_event, active) => {
        if (active === false) return;
        void openHyperspaceNavigationApp();
      }
    };
  }

  if (game.user?.isGM) {
    const droidToolName = `${MODULE_ID}-open-droid-ally`;
    hostControl.tools[droidToolName] = {
      name: droidToolName,
      title: "KAKEMAN89SDATACRON.SceneControl.OpenDroidAlly",
      icon: "fa-solid fa-robot",
      order: Object.keys(hostControl.tools).length,
      button: true,
      visible: true,
      onChange: (_event, active) => {
        if (active === false) return;
        void openDroidAllyPricingApp();
      }
    };
  }

  if (isAstroComEnabled() && canBrowseAstroCom(game.user)) {
    const astroComToolName = `${MODULE_ID}-open-astrocom`;
    hostControl.tools[astroComToolName] = {
      name: astroComToolName,
      title: "KAKEMAN89SDATACRON.SceneControl.OpenAstroCom",
      icon: "fa-solid fa-book-atlas",
      order: Object.keys(hostControl.tools).length,
      button: true,
      visible: true,
      onChange: (_event, active) => {
        if (active === false) return;
        void openAstroComApp();
      }
    };
  }

  if (isShipyardEnabled() && canOpenShipyard(game.user, { featureEnabled: true })) {
    const shipyardToolName = `${MODULE_ID}-open-shipyard`;
    hostControl.tools[shipyardToolName] = {
      name: shipyardToolName,
      title: "KAKEMAN89SDATACRON.SceneControl.OpenShipyard",
      icon: "fa-solid fa-rocket",
      order: Object.keys(hostControl.tools).length,
      button: true,
      visible: true,
      onChange: (_event, active) => {
        if (active === false) return;
        void openShipyardApp();
      }
    };
  }
});

Hooks.once("ready", () => {
  registerShipyardSockets();
  void loadRegionMatrix().catch((error) => {
    logWarn("Region matrix failed to load.", error);
  });

  const module = game.modules.get(MODULE_ID);
  if (module) {
    module.api = {
      openAstroComApp,
      openHyperspaceNavigationApp,
      openDroidAllyPricingApp,
      openShipyardApp,
      rebuildAstroCom,
      rebuildAstroComPoc,
      rebuildAstroComPilot,
      attemptBulkAstroComBuild,
      loadGeneratedAstroCom,
      loadLiveAstroComIndex,
      openAstroComJournal,
      getAstroComApp: () => astroComApp,
      getNavComputerApp: () => hyperspaceNavigationApp,
      getDroidApp: () => droidAllyPricingApp,
      getShipyardApp: () => shipyardApp,
      settingKeys: SETTING_KEYS
    };
  }

  const sw5e = getSw5eModuleSnapshot();
  const warnings = getEnvironmentWarnings();

  logInfo("Runtime environment", {
    foundryVersion: game.version ?? null,
    systemId: game.system?.id ?? null,
    systemVersion: game.system?.version ?? null,
    sw5eActive: sw5e.active,
    sw5eId: sw5e.id,
    sw5eVersion: sw5e.version
  });

  if (warnings.length > 0) {
    logWarn(game.i18n.localize("KAKEMAN89SDATACRON.Warning.IncompleteEnvironment"));
  }

  for (const warning of warnings) {
    logWarn(warning);
  }
});
