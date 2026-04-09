import { logInfo, logWarn, MODULE_ID } from "./logger.js";
import { NavComputerApp } from "./nav-computer-app.js";
import { registerSettings } from "./settings.js";

let navComputerApp = null;

function clearNavComputerSingletonIfStale() {
  if (!navComputerApp) return;
  const el = navComputerApp.element;
  if (navComputerApp.rendered && (!el || !el.isConnected)) {
    navComputerApp = null;
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
    warnings.push(game.i18n.localize("SW5ENAVCOMPUTER.Warning.UnexpectedSystem"));
  }

  if (!game.modules.get("sw5e-module")?.active && !game.modules.get("sw5e")?.active) {
    warnings.push(game.i18n.localize("SW5ENAVCOMPUTER.Warning.MissingSw5e"));
  }

  return warnings;
}

export async function openNavComputerApp() {
  clearNavComputerSingletonIfStale();
  navComputerApp ??= new NavComputerApp();
  await navComputerApp.render(true);
  if (navComputerApp.rendered) navComputerApp.bringToFront();
  return navComputerApp;
}

Hooks.once("init", () => {
  registerSettings();
  logInfo("Initializing module scaffold.");

  Hooks.on("closeApplicationV2", (app) => {
    if (app === navComputerApp || app?.id === MODULE_ID) {
      navComputerApp = null;
    }
  });
});

Hooks.on("getSceneControlButtons", (controls) => {
  if (!game.user?.isGM) return;

  const hostControl = controls.tokens ?? controls.token ?? null;
  if (!hostControl) {
    logWarn("No token scene control was available to register the nav computer button.");
    return;
  }

  hostControl.tools ??= {};

  const toolName = `${MODULE_ID}-open`;
  hostControl.tools[toolName] = {
    name: toolName,
    title: "SW5ENAVCOMPUTER.SceneControl.Open",
    icon: "fa-solid fa-route",
    order: Object.keys(hostControl.tools).length,
    button: true,
    visible: game.user?.isGM ?? false,
    onChange: (_event, active) => {
      if (active === false) return;
      void openNavComputerApp();
    }
  };
});

Hooks.once("ready", () => {
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
    logWarn(game.i18n.localize("SW5ENAVCOMPUTER.Warning.IncompleteEnvironment"));
  }

  for (const warning of warnings) {
    logWarn(warning);
  }
});
