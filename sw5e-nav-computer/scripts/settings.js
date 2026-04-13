import { MODULE_ID } from "./logger.js";

export const SETTING_KEYS = {
  calculationMode: "calculationMode",
  enableRandomEvents: "enableRandomEvents",
  randomEventChance: "randomEventChance",
  fuelPerHour: "fuelPerHour",
  foodPerCrewPerDay: "foodPerCrewPerDay",
  pilotingFallbackSkill: "pilotingFallbackSkill",
  debugMode: "debugMode",
  advancedMaxTier: "advancedMaxTier",
  advancedIncludeObscureRoutes: "advancedIncludeObscureRoutes",
  advancedTier5ExtraDc: "advancedTier5ExtraDc"
};

export function registerSettings() {
  game.settings.register(MODULE_ID, SETTING_KEYS.calculationMode, {
    name: "SW5ENAVCOMPUTER.Settings.CalculationMode.Name",
    hint: "SW5ENAVCOMPUTER.Settings.CalculationMode.Hint",
    scope: "world",
    config: true,
    type: String,
    choices: {
      basic: "SW5ENAVCOMPUTER.Settings.CalculationMode.Choices.Basic",
      advanced: "SW5ENAVCOMPUTER.Settings.CalculationMode.Choices.Advanced"
    },
    default: "basic"
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.enableRandomEvents, {
    name: "SW5ENAVCOMPUTER.Settings.EnableRandomEvents.Name",
    hint: "SW5ENAVCOMPUTER.Settings.EnableRandomEvents.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.randomEventChance, {
    name: "SW5ENAVCOMPUTER.Settings.RandomEventChance.Name",
    hint: "SW5ENAVCOMPUTER.Settings.RandomEventChance.Hint",
    scope: "world",
    config: true,
    type: Number,
    default: 20,
    range: {
      min: 1,
      max: 100,
      step: 1
    }
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.fuelPerHour, {
    name: "SW5ENAVCOMPUTER.Settings.FuelPerHour.Name",
    hint: "SW5ENAVCOMPUTER.Settings.FuelPerHour.Hint",
    scope: "world",
    config: true,
    type: Number,
    default: 1
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.foodPerCrewPerDay, {
    name: "SW5ENAVCOMPUTER.Settings.FoodPerCrewPerDay.Name",
    hint: "SW5ENAVCOMPUTER.Settings.FoodPerCrewPerDay.Hint",
    scope: "world",
    config: true,
    type: Number,
    default: 1
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.pilotingFallbackSkill, {
    name: "SW5ENAVCOMPUTER.Settings.PilotingFallbackSkill.Name",
    hint: "SW5ENAVCOMPUTER.Settings.PilotingFallbackSkill.Hint",
    scope: "world",
    config: true,
    type: String,
    default: "acr"
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.debugMode, {
    name: "SW5ENAVCOMPUTER.Settings.DebugMode.Name",
    hint: "SW5ENAVCOMPUTER.Settings.DebugMode.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.advancedMaxTier, {
    name: "SW5ENAVCOMPUTER.Settings.AdvancedMaxTier.Name",
    hint: "SW5ENAVCOMPUTER.Settings.AdvancedMaxTier.Hint",
    scope: "world",
    config: true,
    type: Number,
    default: 3,
    range: { min: 1, max: 5, step: 1 }
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.advancedIncludeObscureRoutes, {
    name: "SW5ENAVCOMPUTER.Settings.AdvancedIncludeObscureRoutes.Name",
    hint: "SW5ENAVCOMPUTER.Settings.AdvancedIncludeObscureRoutes.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.advancedTier5ExtraDc, {
    name: "SW5ENAVCOMPUTER.Settings.AdvancedTier5ExtraDc.Name",
    hint: "SW5ENAVCOMPUTER.Settings.AdvancedTier5ExtraDc.Hint",
    scope: "world",
    config: true,
    type: Number,
    default: 0,
    range: { min: 0, max: 10, step: 1 }
  });
}
