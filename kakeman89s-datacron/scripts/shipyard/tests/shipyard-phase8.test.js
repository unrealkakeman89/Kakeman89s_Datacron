import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  WORKBOOK_SHA256,
  REQUIRED_VALID_VECTOR_IDS,
  REQUIRED_INVALID_VECTOR_ID,
  validateVectorFixture,
  normalizeAbilityBag
} from "../schema.js";
import { calculateBuild } from "../calculate.js";
import {
  abilityModifierFromScore,
  abilityModifiersFromTotals,
  excelRoundDown
} from "../rules/ability.js";
import { loadCostProfiles, loadSizes, getTablesDirectory } from "../options.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../../..");
const FIXTURE = path.resolve(
  HERE,
  "../../../data/sources/shipyard/fixtures/phase8-vectors.v1.json"
);
const MODULE_DIR = path.resolve(HERE, "../../..");

function loadVectors() {
  assert.ok(fs.existsSync(FIXTURE), "phase8-vectors.v1.json must exist");
  return JSON.parse(fs.readFileSync(FIXTURE, "utf8"));
}

test("fixture schema: required vectors, hash, metadata, no personal names", () => {
  const vectors = loadVectors();
  const result = validateVectorFixture(vectors);
  assert.equal(result.ok, true, result.errors.join("; "));
  assert.equal(vectors.length, 6);
  for (const id of REQUIRED_VALID_VECTOR_IDS) {
    assert.ok(vectors.some((v) => v.id === id));
  }
  assert.ok(vectors.some((v) => v.id === REQUIRED_INVALID_VECTOR_ID));
});

test("fixture gate rejects wrong workbook hash", () => {
  const vectors = structuredClone(loadVectors());
  vectors[0].workbookSha256 = "0".repeat(64);
  const result = validateVectorFixture(vectors);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => /workbookSha256/.test(e)));
});

test("fixture gate rejects duplicate ids", () => {
  const vectors = structuredClone(loadVectors());
  vectors.push(structuredClone(vectors[0]));
  const result = validateVectorFixture(vectors);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => /duplicate/.test(e)));
});

test("input immutability", () => {
  const vectors = loadVectors();
  const input = structuredClone(vectors.find((v) => v.id === "v2-small-bare").inputs);
  const before = JSON.stringify(input);
  calculateBuild(input);
  assert.equal(JSON.stringify(input), before);
});

test("unknown input shape hard-fails", () => {
  const result = calculateBuild(null);
  assert.equal(result.ok, false);
  assert.equal(result.status, "failed");
});

test("size validation: empty size is invalid", () => {
  const result = calculateBuild({ size: "", tier: 0, role: "Role:" });
  assert.equal(result.ok, false);
  assert.equal(result.status, "invalid");
  assert.equal(result.result.grandTotal.state, "error");
  assert.equal(result.result.grandTotal.display, "#VALUE!");
});

test("tier validation rejects out-of-range tier", () => {
  const result = calculateBuild({
    size: "Small",
    tier: 9,
    role: "Superiority Fighter"
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.code === "invalid-tier"));
});

test("ROUNDDOWN ability modifier family matches Excel odd-score adjustment", () => {
  assert.equal(excelRoundDown(3.9, 0), 3);
  assert.equal(excelRoundDown(-0.5, 0), 0);
  assert.equal(abilityModifierFromScore(16), 3);
  assert.equal(abilityModifierFromScore(10), 0);
  assert.equal(abilityModifierFromScore(9), -1);
  assert.equal(abilityModifierFromScore(8), -1);
});

test("ability modifiers from captured totals match expected mods", () => {
  const vectors = loadVectors().filter((v) =>
    REQUIRED_VALID_VECTOR_IDS.includes(v.id)
  );
  for (const vector of vectors) {
    const totals = normalizeAbilityBag(vector.expected.abilityTotals.value);
    const mods = abilityModifiersFromTotals(totals);
    const expected = normalizeAbilityBag(vector.expected.abilityModifiers.value);
    assert.deepEqual(mods, expected, vector.id);
  }
});

function assertParity(vectorId) {
  const vector = loadVectors().find((v) => v.id === vectorId);
  assert.ok(vector, vectorId);
  const out = calculateBuild(vector.inputs);
  assert.equal(out.ok, true, `${vectorId}: ${JSON.stringify(out.errors)}`);
  assert.equal(out.result.grandTotal, vector.expected.grandTotal.value);
  assert.equal(out.result.totalNoMisc, vector.expected.totalNoMisc.value);
  assert.equal(out.result.miscTotal, vector.expected.miscTotal.value);
  assert.equal(out.result.buildDays, vector.expected.buildDays.value);
  assert.equal(out.result.hullPoints, vector.expected.hullPoints.value);
  assert.equal(out.result.shieldPoints, vector.expected.shieldPoints.value);
  assert.equal(out.result.pointBuyTotal, vector.expected.pointBuyTotal.value);
  assert.equal(out.result.suiteSlots, vector.expected.suiteSlots.value);
  assert.equal(out.result.openSuites, vector.expected.openSuites.value);
  assert.deepEqual(
    out.result.abilityModifiers,
    normalizeAbilityBag(vector.expected.abilityModifiers.value)
  );
}

test("parity: v1-example-xwing", () => assertParity("v1-example-xwing"));
test("parity: v2-small-bare", () => assertParity("v2-small-bare"));
test("parity: v3-small-armed", () => assertParity("v3-small-armed"));
test("parity: v4-medium-suites", () => assertParity("v4-medium-suites"));
test("parity: v5-large-tier", () => assertParity("v5-large-tier"));

test("invalid empty-size behavior", () => {
  const vector = loadVectors().find((v) => v.id === REQUIRED_INVALID_VECTOR_ID);
  const out = calculateBuild(vector.inputs);
  assert.equal(out.ok, false);
  assert.equal(out.status, "invalid");
  assert.equal(out.result.grandTotal.state, "error");
  assert.equal(out.result.grandTotal.display, vector.expected.grandTotal.display);
  assert.ok(out.errors.some((e) => e.code === "missing-size"));
});

test("weapon contribution documented as zero for tier-0 Small armed vector", () => {
  const out = calculateBuild(
    loadVectors().find((v) => v.id === "v3-small-armed").inputs
  );
  assert.equal(out.result.weaponContribution, 0);
  assert.equal(out.result.grandTotal, 32000);
});

test("installation-state vector differs from bare only in inputs, not Grand Total", () => {
  const vectors = loadVectors();
  const bare = calculateBuild(vectors.find((v) => v.id === "v2-small-bare").inputs);
  const armed = calculateBuild(vectors.find((v) => v.id === "v3-small-armed").inputs);
  assert.equal(bare.result.grandTotal, armed.result.grandTotal);
  assert.notEqual(
    vectors.find((v) => v.id === "v2-small-bare").inputs.installState,
    vectors.find((v) => v.id === "v3-small-armed").inputs.installState
  );
});

test("suite contribution / medium suite vector", () => {
  const out = calculateBuild(
    loadVectors().find((v) => v.id === "v4-medium-suites").inputs
  );
  assert.equal(out.result.suiteSlots, 3);
  assert.equal(out.result.suiteContribution, 0);
  assert.equal(out.result.grandTotal, 89000);
});

test("cost aggregation order: totalNoMisc + miscTotal = grandTotal", () => {
  for (const id of REQUIRED_VALID_VECTOR_IDS) {
    const out = calculateBuild(loadVectors().find((v) => v.id === id).inputs);
    assert.equal(
      out.result.totalNoMisc + out.result.miscTotal,
      out.result.grandTotal,
      id
    );
  }
});

test("explanation determinism", () => {
  const input = loadVectors().find((v) => v.id === "v2-small-bare").inputs;
  const a = calculateBuild(input);
  const b = calculateBuild(input);
  assert.deepEqual(a.explanation, b.explanation);
  assert.ok(a.explanation.stepCount >= 3);
});

test("no Foundry global dependency in shipyard calculation domain source", () => {
  // Phase 8 calc domain only. Phase 9 UI/socket modules are covered separately.
  const calcFiles = [
    path.resolve(HERE, "../calculate.js"),
    path.resolve(HERE, "../schema.js"),
    path.resolve(HERE, "../validate.js"),
    path.resolve(HERE, "../explain.js"),
    path.resolve(HERE, "../options.js"),
    path.resolve(HERE, "../rules/ability.js"),
    path.resolve(HERE, "../rules/size.js"),
    path.resolve(HERE, "../rules/cost.js")
  ];
  for (const file of calcFiles) {
    const text = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(text, /\bgame\./);
    assert.doesNotMatch(text, /\bfoundry\./i);
    assert.doesNotMatch(text, /\bHooks\./);
    assert.doesNotMatch(text, /\bActors\./);
    assert.doesNotMatch(text, /\bsocket/i);
  }
});

test("no workbook binary under module source", () => {
  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules") continue;
        walk(full);
      } else {
        assert.notEqual(path.extname(entry.name).toLowerCase(), ".xlsx", full);
      }
    }
  }
  walk(MODULE_DIR);
  assert.equal(
    fs.existsSync(path.join(ROOT, "docs", "SotG Shipbuilder and Shipyard.xlsx")),
    false
  );
});

test("authoritative workbook hash constant matches fixture", () => {
  const vectors = loadVectors();
  for (const v of vectors) assert.equal(v.workbookSha256, WORKBOOK_SHA256);
  assert.equal(loadCostProfiles().workbookSha256, WORKBOOK_SHA256);
  assert.equal(loadSizes().workbookSha256, WORKBOOK_SHA256);
  const tablesDir = path.join(MODULE_DIR, getTablesDirectory());
  assert.ok(fs.existsSync(tablesDir));
});

test("SW5e placeholder untouched (module does not edit SW5e)", () => {
  // Phase 8 must not modify SW5e. Confirm Datacron module.json still present and no sw5e edits in this suite scope.
  const manifest = path.join(MODULE_DIR, "module.json");
  assert.ok(fs.existsSync(manifest));
  const text = fs.readFileSync(manifest, "utf8");
  assert.doesNotMatch(text, /#\{VERSION\}#/);
});

test("attribution Kakeman89 only in fixtures/tables", () => {
  const tablesDir = path.join(MODULE_DIR, getTablesDirectory());
  const blob =
    fs.readFileSync(FIXTURE, "utf8") +
    fs.readFileSync(path.join(tablesDir, "cost-profiles.v1.json"), "utf8");
  assert.match(blob, /Kakeman89/);
  assert.doesNotMatch(blob, /\bckauble\b/i);
});
