/**
 * Load authored Shipyard option / rule tables.
 * Uses embedded ESM data so Node tests and Foundry browser share one path.
 */
import {
  sizesTable,
  rolesTable,
  weaponsTable,
  abilityAdjustmentsTable,
  costProfilesTable
} from "./tables-data.js";

export function loadSizes() {
  return structuredClone(sizesTable);
}

export function loadRoles() {
  return structuredClone(rolesTable);
}

export function loadWeapons() {
  return structuredClone(weaponsTable);
}

export function loadAbilityAdjustments() {
  return structuredClone(abilityAdjustmentsTable);
}

export function loadCostProfiles() {
  return structuredClone(costProfilesTable);
}

/**
 * Authored JSON table directory relative to the Datacron package root.
 * Node tests resolve this against the package; Foundry UI never needs it.
 */
export function getTablesDirectory() {
  return "data/sources/shipyard/tables";
}
