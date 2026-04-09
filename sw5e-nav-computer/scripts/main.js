import { logInfo, logWarn, MODULE_ID } from "./logger.js";
import { NavComputerApp } from "./nav-computer-app.js";
import { registerSettings } from "./settings.js";

let navComputerApp = null;

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

export function openNavComputerApp() {
  navComputerApp ??= new NavComputerApp();
  navComputerApp.render(true);
  return navComputerApp;
}

Hooks.once("init", () => {
  registerSettings();
  logInfo("Initializing module scaffold.");
});

Hooks.on("getSceneControlButtons", (controls) => {
  if (!game.user?.isGM) return;

  const hostControl = controls.find((control) => control.name === "token") ?? controls[0];
  if (!hostControl) {
    logWarn("No scene control collection was available to register the nav computer button.");
    return;
  }

  hostControl.tools ??= [];
  hostControl.tools.push({
    name: `${MODULE_ID}-open`,
    title: "SW5ENAVCOMPUTER.SceneControl.Open",
    icon: "fa-solid fa-route",
    button: true,
    visible: true,
    onClick: () => openNavComputerApp()
  });
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
