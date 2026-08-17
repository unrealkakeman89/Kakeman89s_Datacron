/**
 * Phase 10 target-schema profile and mapping constants.
 * Pure Node domain — no Foundry writes.
 */
import { MODULE_ID } from "../../logger.js";
import { WORKBOOK_SHA256 } from "../schema.js";

export const SHIPYARD_SCHEMA_VERSION = 1;
export const CALCULATION_ENGINE_VERSION = "phase8-v1";
export const VECTOR_BASELINE_VERSION = "phase8-vectors.v1";
export const TARGET_SCHEMA_PROFILE_ID = "sw5e-1.4.2-starship-vehicle.v1";

export const ACTOR_TYPE_VEHICLE = "vehicle";
export const STARSHIP_IDENTITY_TYPE = "starship";

export const OWNERSHIP_LEVELS = Object.freeze({
  NONE: 0,
  LIMITED: 1,
  OBSERVER: 2,
  OWNER: 3
});

export const SIZE_TO_TRAIT = Object.freeze({
  Tiny: "tiny",
  Small: "sm",
  Medium: "med",
  Large: "lg",
  Huge: "huge",
  Gargantuan: "grg"
});

export const SIZE_TOKEN_SPACES = Object.freeze({
  tiny: 1,
  sm: 1,
  small: 1,
  med: 2,
  medium: 2,
  lg: 4,
  large: 4,
  huge: 8,
  grg: 16,
  gargantuan: 16
});

export const DEFAULT_ACTOR_IMAGE = "systems/dnd5e/icons/svg/actors/vehicle.svg";

export const COMPENDIUM_PACK = "starships";
export const SW5E_MODULE_ID = "sw5e-module";

/** Static pack IDs verified against SW5e 1.4.2 YAML; live UUID resolution happens at create time. */
export const PACK_ITEMS = Object.freeze({
  size: Object.freeze({
    Small: Object.freeze({
      id: "6BN8l5E8QtYt103T",
      name: "Small Starship",
      type: "feat"
    }),
    Medium: Object.freeze({
      id: "6liD1m4hqKSeS5sp",
      name: "Medium Starship",
      type: "feat"
    }),
    Large: Object.freeze({
      id: "RFKvLuqE13INBxqd",
      name: "Large Starship",
      type: "feat"
    })
  }),
  role: Object.freeze({
    "Superiority Fighter": Object.freeze({
      id: "vyc2GIsA50ilVSyg",
      name: "Role: Superiority Fighter",
      type: "feat"
    }),
    Freighter: Object.freeze({
      id: "QY7jBe7EgKLz8z1p",
      name: "Role: Freighter",
      type: "feat"
    }),
    Corvette: Object.freeze({
      id: "2KEpnIbTdhgY06tF",
      name: "Role: Corvette",
      type: "feat"
    })
  }),
  weapon: Object.freeze({
    "Twin laser cannon": Object.freeze({
      id: "sHKo4DKkCRTMJwVK",
      name: "Twin laser cannon",
      type: "weapon"
    })
  }),
  armor: Object.freeze({
    "Deflection armor": Object.freeze({
      id: "aG6mKPerYCFmkI00",
      name: "Deflection Armor",
      type: "equipment"
    })
  }),
  suite: Object.freeze({
    living: Object.freeze({
      id: "aieXRd4ADt9T6B8g",
      name: "Quarters, Living",
      type: "loot"
    })
  })
});

export const UNMAPPED_OPTIONAL_FIELDS = Object.freeze([
  "hyperdrive",
  "fuel",
  "supplies",
  "cargo",
  "crew",
  "deployments"
]);

export const PLACEHOLDER_WEAPON = "Weapon Selection:";
export const PLACEHOLDER_ARMOR = "Armor Selection:";
export const PLACEHOLDER_ROLE = "Role:";

/**
 * Static profile. Slice 10.1 live confirmation (datacron-phase10-actor):
 * vehicle + flags.sw5e.legacyStarshipActor.type === "starship".
 * Native blank token bar1 is attributes.hp; bar2 is unbound.
 */
export const TARGET_SCHEMA_PROFILE = Object.freeze({
  id: TARGET_SCHEMA_PROFILE_ID,
  actorType: ACTOR_TYPE_VEHICLE,
  identityFlagValue: STARSHIP_IDENTITY_TYPE,
  characterBacked: false,
  createStarshipFlag: true,
  showVehicleAbilities: true,
  defaultImage: DEFAULT_ACTOR_IMAGE,
  bindTokenBars: true,
  tokenBarHull: "attributes.hp",
  tokenBarShields: null,
  sizeItemRequired: true,
  roleItemRequired: true,
  pack: COMPENDIUM_PACK,
  sw5eModuleId: SW5E_MODULE_ID,
  workbookSha256: WORKBOOK_SHA256,
  datacronModuleId: MODULE_ID,
  verifiedLive: true
});

export function cloneProfile(profile = TARGET_SCHEMA_PROFILE) {
  return structuredClone(profile);
}

export function markProfileVerifiedLive(profile = TARGET_SCHEMA_PROFILE) {
  return Object.freeze({
    ...cloneProfile(profile),
    verifiedLive: true
  });
}

export function packItemUuid(itemId, profile = TARGET_SCHEMA_PROFILE) {
  return `Compendium.${profile.sw5eModuleId}.${profile.pack}.Item.${itemId}`;
}
