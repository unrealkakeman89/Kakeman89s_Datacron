import { logInfo, logWarn, MODULE_ID } from "./logger.js";
import { DatacronApp } from "./datacron-app.js";
import { DroidAllyApp } from "./droid-ally-app.js";
import { AstroComApp } from "./astrocom/astrocom-app.js";
import { loadGeneratedAstroCom, loadLiveAstroComIndex, openAstroComJournal, rebuildAstroCom, rebuildAstroComPilot, rebuildAstroComPoc, attemptBulkAstroComBuild } from "./astrocom/rebuild.js";
import { registerSettings, SETTING_KEYS } from "./settings.js";

let hyperspaceNavigationApp = null;
let droidAllyPricingApp = null;
let astroComApp = null;

function isAstroComEnabled() {
  try {
    return Boolean(game.settings.get(MODULE_ID, SETTING_KEYS.featureAstroCom));
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
  if (!game.user?.isGM) return null;
  if (!isAstroComEnabled()) return null;
  clearAppSingletonIfStale(astroComApp, () => {
    astroComApp = null;
  });
  astroComApp ??= new AstroComApp();
  await astroComApp.render(true);
  if (astroComApp.rendered) astroComApp.bringToFront();
  return astroComApp;
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
  });
});

Hooks.on("getSceneControlButtons", (controls) => {
  if (!game.user?.isGM) return;

  const hostControl = controls.tokens ?? controls.token ?? null;
  if (!hostControl) {
    logWarn("No token scene control was available to register the Datacron button.");
    return;
  }

  hostControl.tools ??= {};

  const hyperspaceToolName = `${MODULE_ID}-open-hyperspace`;
  hostControl.tools[hyperspaceToolName] = {
    name: hyperspaceToolName,
    title: "KAKEMAN89SDATACRON.SceneControl.OpenHyperspace",
    icon: "fa-solid fa-route",
    order: Object.keys(hostControl.tools).length,
    button: true,
    visible: game.user?.isGM ?? false,
    onChange: (_event, active) => {
      if (active === false) return;
      void openHyperspaceNavigationApp();
    }
  };

  const droidToolName = `${MODULE_ID}-open-droid-ally`;
  hostControl.tools[droidToolName] = {
    name: droidToolName,
    title: "KAKEMAN89SDATACRON.SceneControl.OpenDroidAlly",
    icon: "fa-solid fa-robot",
    order: Object.keys(hostControl.tools).length,
    button: true,
    visible: game.user?.isGM ?? false,
    onChange: (_event, active) => {
      if (active === false) return;
      void openDroidAllyPricingApp();
    }
  };

  if (!isAstroComEnabled()) return;

  const astroComToolName = `${MODULE_ID}-open-astrocom`;
  hostControl.tools[astroComToolName] = {
    name: astroComToolName,
    title: "KAKEMAN89SDATACRON.SceneControl.OpenAstroCom",
    icon: "fa-solid fa-book-atlas",
    order: Object.keys(hostControl.tools).length,
    button: true,
    visible: game.user?.isGM ?? false,
    onChange: (_event, active) => {
      if (active === false) return;
      void openAstroComApp();
    }
  };
});

Hooks.once("ready", () => {
  const module = game.modules.get(MODULE_ID);
  if (module) {
    module.api = {
      openAstroComApp,
      openHyperspaceNavigationApp,
      openDroidAllyPricingApp,
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
