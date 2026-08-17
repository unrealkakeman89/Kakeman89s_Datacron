/**
 * Immutable Shipyard draft model (Phase 9).
 * Pure Node domain — no Foundry globals, no cost arithmetic.
 */
import { normalizeAbilityBag } from "./schema.js";
import { calculateBuild } from "./calculate.js";

export const DRAFT_FIELDS = Object.freeze([
  "size",
  "tier",
  "role",
  "installState",
  "lockState",
  "primaryWeapon",
  "armor",
  "quartersBasic",
  "quartersLiving",
  "baseAbilities"
]);

export const ABILITY_NESTED_FIELDS = Object.freeze(["str", "dex", "con", "int", "wis"]);

const UNKNOWN_FIELD = "unknown-field";
const STALE_REVISION = "stale-revision";

/**
 * @param {object} value
 */
function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) {
    deepFreeze(child);
  }
  return Object.freeze(value);
}

/**
 * @returns {Record<string, unknown>}
 */
export function createEmptyDraftInput() {
  return {
    size: "",
    tier: 0,
    role: "Role:",
    installState: "Not Installed",
    lockState: "None",
    primaryWeapon: "Weapon Selection:",
    armor: "Armor Selection:",
    quartersBasic: 0,
    quartersLiving: 0,
    baseAbilities: {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10
    }
  };
}

/**
 * @param {object} [options]
 */
export function createEmptyDraft(options = {}) {
  const input = createEmptyDraftInput();
  const calculation = calculateBuild(input);
  return deepFreeze({
    revision: 1,
    sessionOwnerId: options.sessionOwnerId ?? null,
    cleared: true,
    input: structuredClone(input),
    calculation: structuredClone(calculation),
    updatedAt: options.updatedAt ?? null
  });
}

/**
 * @param {unknown} draft
 */
export function cloneDraft(draft) {
  return structuredClone(draft);
}

/**
 * @param {Record<string, unknown>} input
 */
export function draftInputToBuildInput(input) {
  const src = input && typeof input === "object" ? input : {};
  const abilities = normalizeAbilityBag(src.baseAbilities);
  return {
    size: String(src.size ?? ""),
    tier: src.tier == null || src.tier === "" ? 0 : Number(src.tier),
    role: String(src.role ?? "Role:"),
    installState: String(src.installState ?? "Not Installed"),
    lockState: String(src.lockState ?? "None"),
    primaryWeapon: String(src.primaryWeapon ?? "Weapon Selection:"),
    armor: String(src.armor ?? "Armor Selection:"),
    quartersBasic: Number(src.quartersBasic ?? 0),
    quartersLiving: Number(src.quartersLiving ?? 0),
    baseAbilities: {
      str: abilities.str,
      dex: abilities.dex,
      con: abilities.con,
      int: abilities.int,
      wis: abilities.wis
    }
  };
}

/**
 * @param {object} draft
 * @param {string} field
 * @param {unknown} value
 * @param {{ expectedRevision?: number, sessionOwnerId?: string|null }} [options]
 */
export function updateDraftField(draft, field, value, options = {}) {
  if (!draft || typeof draft !== "object") {
    return { ok: false, code: "invalid-draft", draft: null };
  }
  if (
    options.expectedRevision != null &&
    Number(options.expectedRevision) !== Number(draft.revision)
  ) {
    return { ok: false, code: STALE_REVISION, draft: cloneDraft(draft) };
  }
  if (!DRAFT_FIELDS.includes(field)) {
    return { ok: false, code: UNKNOWN_FIELD, draft: cloneDraft(draft) };
  }

  const nextInput = draftInputToBuildInput(draft.input);
  if (field === "baseAbilities") {
    if (!value || typeof value !== "object") {
      return { ok: false, code: "invalid-nested-value", draft: cloneDraft(draft) };
    }
    nextInput.baseAbilities = normalizeAbilityBag(value);
  } else if (field === "tier" || field === "quartersBasic" || field === "quartersLiving") {
    nextInput[field] = Number(value ?? 0);
  } else {
    nextInput[field] = value == null ? "" : String(value);
  }

  const calculation = calculateBuild(nextInput);
  return {
    ok: true,
    code: null,
    draft: deepFreeze({
      revision: Number(draft.revision) + 1,
      sessionOwnerId:
        options.sessionOwnerId !== undefined
          ? options.sessionOwnerId
          : draft.sessionOwnerId ?? null,
      cleared: false,
      input: structuredClone(nextInput),
      calculation: structuredClone(calculation),
      updatedAt: options.updatedAt ?? draft.updatedAt ?? null
    })
  };
}

/**
 * @param {object} draft
 * @param {string} abilityKey
 * @param {unknown} value
 * @param {{ expectedRevision?: number, sessionOwnerId?: string|null }} [options]
 */
export function updateDraftAbility(draft, abilityKey, value, options = {}) {
  if (!ABILITY_NESTED_FIELDS.includes(abilityKey)) {
    return { ok: false, code: UNKNOWN_FIELD, draft: cloneDraft(draft) };
  }
  const abilities = {
    ...normalizeAbilityBag(draft?.input?.baseAbilities),
    [abilityKey]: Number(value ?? 0)
  };
  return updateDraftField(draft, "baseAbilities", abilities, options);
}

/**
 * @param {object} [options]
 */
export function resetDraft(options = {}) {
  return createEmptyDraft(options);
}

/**
 * Rebuild an editable draft from a sanitized projection's selections.
 * Recalculates via calculateBuild — never trusts projection totals.
 * @param {object|null|undefined} projection
 * @param {{ sessionOwnerId?: string|null, revision?: number }} [options]
 */
export function hydrateDraftFromProjection(projection, options = {}) {
  if (!projection || typeof projection !== "object") {
    return createEmptyDraft(options);
  }
  if (projection.cleared || !projection.selections) {
    return createEmptyDraft({
      sessionOwnerId: options.sessionOwnerId ?? projection.sessionOwnerId ?? null
    });
  }

  const input = draftInputToBuildInput({
    ...projection.selections,
    baseAbilities: projection.selections.baseAbilities ?? createEmptyDraftInput().baseAbilities
  });
  const calculation = calculateBuild(input);
  return deepFreeze({
    revision: Number(options.revision ?? projection.revision ?? 1),
    sessionOwnerId:
      options.sessionOwnerId ?? projection.sessionOwnerId ?? null,
    cleared: false,
    input: structuredClone(input),
    calculation: structuredClone(calculation),
    updatedAt: null
  });
}

/**
 * Serialize draft for GM-only recovery (not a player projection).
 * @param {object} draft
 */
export function serializeDraft(draft) {
  return structuredClone(draft);
}
