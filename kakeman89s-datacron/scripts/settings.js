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
  advancedTier5ExtraDc: "advancedTier5ExtraDc",
  featureNavComputer: "featureNavComputer",
  featureAstroCom: "featureAstroCom",
  featureShipyard: "featureShipyard",
  shipyardDraftSnapshot: "shipyardDraftSnapshot",
  shipyardCanonicalDraft: "shipyardCanonicalDraft",
  shipyardPhase10TestHooks: "shipyardPhase10TestHooks"
};

export function registerSettings() {
  game.settings.register(MODULE_ID, SETTING_KEYS.calculationMode, {
    name: "KAKEMAN89SDATACRON.Settings.CalculationMode.Name",
    hint: "KAKEMAN89SDATACRON.Settings.CalculationMode.Hint",
    scope: "world",
    config: false,
    type: String,
    choices: {
      basic: "KAKEMAN89SDATACRON.Settings.CalculationMode.Choices.Basic"
    },
    default: "basic"
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.enableRandomEvents, {
    name: "KAKEMAN89SDATACRON.Settings.EnableRandomEvents.Name",
    hint: "KAKEMAN89SDATACRON.Settings.EnableRandomEvents.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.randomEventChance, {
    name: "KAKEMAN89SDATACRON.Settings.RandomEventChance.Name",
    hint: "KAKEMAN89SDATACRON.Settings.RandomEventChance.Hint",
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
    name: "KAKEMAN89SDATACRON.Settings.FuelPerHour.Name",
    hint: "KAKEMAN89SDATACRON.Settings.FuelPerHour.Hint",
    scope: "world",
    config: true,
    type: Number,
    default: 1
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.foodPerCrewPerDay, {
    name: "KAKEMAN89SDATACRON.Settings.FoodPerCrewPerDay.Name",
    hint: "KAKEMAN89SDATACRON.Settings.FoodPerCrewPerDay.Hint",
    scope: "world",
    config: true,
    type: Number,
    default: 1
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.pilotingFallbackSkill, {
    name: "KAKEMAN89SDATACRON.Settings.PilotingFallbackSkill.Name",
    hint: "KAKEMAN89SDATACRON.Settings.PilotingFallbackSkill.Hint",
    scope: "world",
    config: true,
    type: String,
    default: "acr"
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.debugMode, {
    name: "KAKEMAN89SDATACRON.Settings.DebugMode.Name",
    hint: "KAKEMAN89SDATACRON.Settings.DebugMode.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.advancedMaxTier, {
    name: "KAKEMAN89SDATACRON.Settings.AdvancedMaxTier.Name",
    hint: "KAKEMAN89SDATACRON.Settings.AdvancedMaxTier.Hint",
    scope: "world",
    config: false,
    type: Number,
    default: 3,
    range: { min: 1, max: 5, step: 1 }
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.advancedIncludeObscureRoutes, {
    name: "KAKEMAN89SDATACRON.Settings.AdvancedIncludeObscureRoutes.Name",
    hint: "KAKEMAN89SDATACRON.Settings.AdvancedIncludeObscureRoutes.Hint",
    scope: "world",
    config: false,
    type: Boolean,
    default: false
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.advancedTier5ExtraDc, {
    name: "KAKEMAN89SDATACRON.Settings.AdvancedTier5ExtraDc.Name",
    hint: "KAKEMAN89SDATACRON.Settings.AdvancedTier5ExtraDc.Hint",
    scope: "world",
    config: false,
    type: Number,
    default: 0,
    range: { min: 0, max: 10, step: 1 }
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.featureNavComputer, {
    name: "KAKEMAN89SDATACRON.Settings.FeatureNavComputer.Name",
    hint: "KAKEMAN89SDATACRON.Settings.FeatureNavComputer.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: true
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.featureAstroCom, {
    name: "KAKEMAN89SDATACRON.Settings.FeatureAstroCom.Name",
    hint: "KAKEMAN89SDATACRON.Settings.FeatureAstroCom.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: true
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.featureShipyard, {
    name: "KAKEMAN89SDATACRON.Settings.FeatureShipyard.Name",
    hint: "KAKEMAN89SDATACRON.Settings.FeatureShipyard.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    requiresReload: true
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.shipyardDraftSnapshot, {
    name: "KAKEMAN89SDATACRON.Settings.ShipyardDraftSnapshot.Name",
    hint: "KAKEMAN89SDATACRON.Settings.ShipyardDraftSnapshot.Hint",
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.shipyardCanonicalDraft, {
    name: "KAKEMAN89SDATACRON.Settings.ShipyardCanonicalDraft.Name",
    hint: "KAKEMAN89SDATACRON.Settings.ShipyardCanonicalDraft.Hint",
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.shipyardPhase10TestHooks, {
    name: "KAKEMAN89SDATACRON.Settings.ShipyardPhase10TestHooks.Name",
    hint: "KAKEMAN89SDATACRON.Settings.ShipyardPhase10TestHooks.Hint",
    scope: "world",
    config: false,
    type: Object,
    default: { enabled: false }
  });
}
