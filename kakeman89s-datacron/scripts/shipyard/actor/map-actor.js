/**
 * Pure Actor source mapping. Does not create documents or calculate cost.
 */
import { MODULE_ID } from "../../logger.js";
import { WORKBOOK_SHA256 } from "../schema.js";
import {
  ACTOR_TYPE_VEHICLE,
  CALCULATION_ENGINE_VERSION,
  DEFAULT_ACTOR_IMAGE,
  OWNERSHIP_LEVELS,
  SHIPYARD_SCHEMA_VERSION,
  SIZE_TO_TRAIT,
  SIZE_TOKEN_SPACES,
  STARSHIP_IDENTITY_TYPE,
  TARGET_SCHEMA_PROFILE,
  VECTOR_BASELINE_VERSION
} from "./mapping-schema.js";
import { mapEmbeddedItems } from "./map-items.js";
import { validateImagePath } from "./validate-mapping.js";

function numericCost(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value && typeof value === "object" && Number.isFinite(Number(value.value))) {
    return Number(value.value);
  }
  return null;
}

function abilityBlock(totals = {}) {
  const keys = ["str", "dex", "con", "int", "wis"];
  const abilities = {};
  for (const key of keys) {
    const score = Number(totals[key] ?? 10);
    abilities[key] = {
      value: Number.isFinite(score) ? score : 10,
      proficient: 0
    };
  }
  abilities.cha = { value: 10, proficient: 0 };
  return abilities;
}

function tokenDimensions(sizeTrait) {
  const spaces = SIZE_TOKEN_SPACES[sizeTrait] ?? SIZE_TOKEN_SPACES.med;
  return { width: spaces, height: spaces };
}

/**
 * @param {{
 *   draft: object,
 *   calculation?: object,
 *   options?: object,
 *   profile?: object
 * }} input
 */
export function mapStarshipActor(input = {}) {
  const draft = structuredClone(input.draft ?? null);
  const calculation = structuredClone(input.calculation ?? draft?.calculation ?? null);
  const options = structuredClone(input.options ?? {});
  const profile = structuredClone(input.profile ?? TARGET_SCHEMA_PROFILE);
  const result = calculation?.result ?? null;
  const sizeDisplay = String(result?.size ?? draft?.input?.size ?? "");
  const sizeTrait = SIZE_TO_TRAIT[sizeDisplay] ?? null;
  const tier = Number(result?.tier ?? draft?.input?.tier ?? 0);
  const hull = Number(result?.hullPoints ?? 0);
  const shields = Number(result?.shieldPoints ?? 0);
  const abilities = abilityBlock(result?.abilityTotals);
  const name = String(options.actorName ?? "").trim();
  const imageCheck = validateImagePath(options.imagePath);
  const img = imageCheck.ok && !imageCheck.useDefault ? imageCheck.path : profile.defaultImage ?? DEFAULT_ACTOR_IMAGE;
  const tokenSize = tokenDimensions(sizeTrait ?? "med");
  const gmUserId = options.gmUserId ?? null;
  const ownership = buildOwnership(gmUserId, options.ownership ?? {});
  const folder = options.folderId ?? null;
  const operationId = options.operationId ?? null;
  const createdBy = options.createdBy ?? gmUserId ?? null;
  const createdAt = options.createdAt ?? null;

  const itemMapping = mapEmbeddedItems({
    draft,
    calculation,
    profile
  });

  const unmappedFields = [...itemMapping.unmappedFields];
  const mappingWarnings = [...itemMapping.mappingWarnings];

  if (!sizeTrait) {
    mappingWarnings.push({
      code: "size-unmapped",
      message: "Size trait is required"
    });
  }

  const prototypeToken = {
    name,
    actorLink: true,
    displayName: 0,
    disposition: -1,
    displayBars: 0,
    width: tokenSize.width,
    height: tokenSize.height,
    texture: {
      src: img
    },
    bar1: { attribute: profile.bindTokenBars ? profile.tokenBarHull : null },
    bar2: { attribute: profile.bindTokenBars ? profile.tokenBarShields : null }
  };

  const provenance = {
    createdByShipyard: true,
    shipyardSchemaVersion: SHIPYARD_SCHEMA_VERSION,
    calculationEngineVersion: CALCULATION_ENGINE_VERSION,
    workbookSha256: WORKBOOK_SHA256,
    vectorBaselineVersion: VECTOR_BASELINE_VERSION,
    draftRevision: Number(draft?.revision ?? 0),
    previewHash: options.previewHash ?? null,
    buildCost: numericCost(result?.grandTotal),
    buildTime: numericCost(result?.buildDays),
    createdAt,
    createdBy,
    sourceProfile: profile.id ?? null,
    operationId
  };

  const actorSource = {
    name,
    type: ACTOR_TYPE_VEHICLE,
    img,
    folder,
    ownership,
    prototypeToken,
    items: [],
    flags: {
      sw5e: {
        createStarship: Boolean(profile.createStarshipFlag),
        legacyStarshipActor: {
          type: STARSHIP_IDENTITY_TYPE,
          system: {
            details: { tier: Number.isFinite(tier) ? tier : 0 },
            traits: { size: sizeTrait },
            abilities: structuredClone(abilities),
            attributes: {
              hp: {
                value: Number.isFinite(hull) ? hull : 0,
                max: Number.isFinite(hull) ? hull : 0,
                temp: Number.isFinite(shields) ? shields : 0,
                tempmax: Number.isFinite(shields) ? shields : 0
              }
            }
          }
        }
      },
      dnd5e: {
        showVehicleAbilities: Boolean(profile.showVehicleAbilities)
      },
      [MODULE_ID]: structuredClone(provenance)
    },
    system: {
      details: {
        tier: Number.isFinite(tier) ? tier : 0
      },
      traits: {
        size: sizeTrait
      },
      abilities: structuredClone(abilities),
      attributes: {
        hp: {
          value: Number.isFinite(hull) ? hull : 0,
          max: Number.isFinite(hull) ? hull : 0,
          temp: Number.isFinite(shields) ? shields : 0,
          tempmax: Number.isFinite(shields) ? shields : 0
        }
      }
    }
  };

  return {
    actorSource,
    embeddedItemSources: itemMapping.embeddedItemSources,
    tokenSource: structuredClone(prototypeToken),
    mappingWarnings,
    unmappedFields,
    provenance,
    imageCheck
  };
}

function buildOwnership(gmUserId, selection = {}) {
  const ownership = { default: OWNERSHIP_LEVELS.NONE };
  if (gmUserId) ownership[gmUserId] = OWNERSHIP_LEVELS.OWNER;
  const owners = Array.isArray(selection.owners) ? selection.owners : [];
  const observers = Array.isArray(selection.observers) ? selection.observers : [];
  for (const id of owners) {
    if (id && id !== gmUserId) ownership[id] = OWNERSHIP_LEVELS.OWNER;
  }
  for (const id of observers) {
    if (id && ownership[id] == null) ownership[id] = OWNERSHIP_LEVELS.OBSERVER;
  }
  return ownership;
}
