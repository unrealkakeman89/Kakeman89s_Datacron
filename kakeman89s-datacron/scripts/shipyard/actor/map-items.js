/**
 * Pure embedded-item mapping. Returns pack references; does not copy documents.
 */
import {
  PACK_ITEMS,
  PLACEHOLDER_ARMOR,
  PLACEHOLDER_WEAPON,
  TARGET_SCHEMA_PROFILE,
  UNMAPPED_OPTIONAL_FIELDS,
  packItemUuid
} from "./mapping-schema.js";

function itemRef(kind, entry, profile, extra = {}) {
  return {
    kind,
    pack: profile.pack,
    id: entry.id,
    name: entry.name,
    type: entry.type,
    uuid: packItemUuid(entry.id, profile),
    quantity: extra.quantity ?? 1,
    preserveActivities: true
  };
}

/**
 * @param {{ draft?: object, calculation?: object, profile?: object }} input
 */
export function mapEmbeddedItems(input = {}) {
  const draft = input.draft ?? null;
  const calculation = input.calculation ?? draft?.calculation ?? null;
  const profile = input.profile ?? TARGET_SCHEMA_PROFILE;
  const selections = draft?.input ?? {};
  const result = calculation?.result ?? {};
  const embeddedItemSources = [];
  const mappingWarnings = [];
  const unmappedFields = [...UNMAPPED_OPTIONAL_FIELDS];
  const seen = new Set();

  function push(ref) {
    if (!ref?.id || seen.has(ref.id)) return;
    seen.add(ref.id);
    embeddedItemSources.push(ref);
  }

  const sizeKey = String(result.size ?? selections.size ?? "");
  const sizeEntry = PACK_ITEMS.size[sizeKey];
  if (sizeEntry) {
    push(itemRef("size", sizeEntry, profile));
  } else if (sizeKey) {
    mappingWarnings.push({
      code: "size-item-unmapped",
      message: `No size Item mapping for ${sizeKey}`
    });
    unmappedFields.push("sizeItem");
  }

  const roleKey = String(result.role ?? selections.role ?? "");
  const roleEntry = PACK_ITEMS.role[roleKey];
  if (roleEntry) {
    push(itemRef("role", roleEntry, profile));
  } else if (roleKey && roleKey !== "Role:") {
    mappingWarnings.push({
      code: "role-item-unmapped",
      message: `No role Item mapping for ${roleKey}`
    });
    unmappedFields.push("roleItem");
  }

  const weaponKey = String(selections.primaryWeapon ?? "");
  const weaponEntry = PACK_ITEMS.weapon[weaponKey];
  if (weaponEntry) {
    push(itemRef("weapon", weaponEntry, profile));
  } else if (weaponKey && weaponKey !== PLACEHOLDER_WEAPON) {
    mappingWarnings.push({
      code: "weapon-unmapped",
      message: `No weapon Item mapping for ${weaponKey}`
    });
    unmappedFields.push("primaryWeapon");
  }

  const armorKey = String(selections.armor ?? "");
  const armorEntry = PACK_ITEMS.armor[armorKey];
  if (armorEntry) {
    push(itemRef("armor", armorEntry, profile));
  } else if (armorKey && armorKey !== PLACEHOLDER_ARMOR) {
    mappingWarnings.push({
      code: "armor-unmapped",
      message: `No armor Item mapping for ${armorKey}`
    });
    unmappedFields.push("armor");
  }

  const living = Number(selections.quartersLiving ?? 0);
  if (Number.isFinite(living) && living > 0) {
    const suiteEntry = PACK_ITEMS.suite.living;
    push(itemRef("suite", suiteEntry, profile, { quantity: living }));
  }

  return {
    embeddedItemSources,
    mappingWarnings,
    unmappedFields
  };
}
