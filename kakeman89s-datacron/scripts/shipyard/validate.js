/**
 * Soft/hard validation for Shipyard builds.
 */
import { loadRoles, loadSizes, loadWeapons } from "./options.js";
import { normalizeSize, normalizeTier } from "./rules/size.js";

const SIZE_PLACEHOLDERS = new Set(["", "Ship Size"]);
const ROLE_PLACEHOLDERS = new Set(["", "Role:"]);

/**
 * @param {Record<string, unknown>} input
 */
export function validateBuildInput(input) {
  const errors = [];
  const warnings = [];

  const size = normalizeSize(input.size);
  const sizes = loadSizes().options.map((o) => o.display);
  if (!size || SIZE_PLACEHOLDERS.has(size)) {
    errors.push({
      code: "missing-size",
      message: "Ship size is required",
      workbookBehavior: "Grand Total evaluates to #VALUE! when size is empty"
    });
  } else if (!sizes.includes(size)) {
    errors.push({
      code: "unknown-size",
      message: `Unknown size: ${size}`
    });
  }

  const tier = normalizeTier(input.tier);
  if (tier != null && (tier < 0 || tier > 5 || !Number.isInteger(tier))) {
    errors.push({
      code: "invalid-tier",
      message: `Invalid tier: ${input.tier}`
    });
  }

  const role = String(input.role ?? "");
  const roles = loadRoles().options.map((o) => o.display);
  if (!ROLE_PLACEHOLDERS.has(role) && role && !roles.includes(role)) {
    // Soft: workbook has many roles; Phase 8 table is a subset.
    warnings.push({
      code: "role-not-in-phase8-table",
      message: `Role "${role}" is outside the Phase 8 authored subset`
    });
  }

  const weapon = String(input.primaryWeapon ?? "");
  const weapons = loadWeapons().options.map((o) => o.display);
  if (weapon && !weapons.includes(weapon)) {
    warnings.push({
      code: "weapon-not-in-phase8-table",
      message: `Weapon "${weapon}" is outside the Phase 8 authored subset`
    });
  }

  const install = String(input.installState ?? "");
  const lock = String(input.lockState ?? "");
  if (install === "Installed" && lock === "None") {
    warnings.push({
      code: "install-without-lock-state",
      message: "Installed weapons usually pair with Locked or Unlocked"
    });
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings
  };
}
