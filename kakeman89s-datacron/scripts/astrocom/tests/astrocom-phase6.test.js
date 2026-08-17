import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { PRESENCE_LABEL } from "../constants.js";
import { summarizeCompleteness } from "../pipeline/completeness-report.js";
import { applyEnrichment } from "../pipeline/apply-enrichment.js";
import { assertBulkPackBuildAuthorized } from "../pipeline/bulk-guard.js";
import { appendProvenance, approveFieldCandidate } from "../pipeline/provenance.js";
import { classificationsFromPrimary, ensurePrimaryRegion } from "../pipeline/region-classifications.js";

const here = dirname(fileURLToPath(import.meta.url));
const moduleRoot = join(here, "..", "..", "..");

function approvedFixture(overrides = {}) {
  return {
    schemaVersion: 1,
    stableId: "ac:canon:alderaan-like",
    name: "Alderaan-like",
    continuity: "canon",
    classification: "planet",
    description: "Fixture description.",
    astrography: {
      region: { presence: "present", value: "Core" },
      sector: { presence: "present", value: "Alderaan Sector" },
      system: { presence: "missing" },
      grid: { presence: "present", value: "M-10" },
      routes: []
    },
    physical: { presence: "missing" },
    societal: { presence: "missing" },
    economics: { presence: "missing" },
    sourceMetadata: { datasetId: "ASTRO-001" },
    reviewStatus: "approved",
    conflictFlags: [{ code: "missing-system", severity: "info", message: "missing", fields: ["astrography.system"] }],
    ...overrides
  };
}

test("completeness summary counts missing data, review debt, and conflicts", () => {
  const summary = summarizeCompleteness([
    approvedFixture(),
    {
      ...approvedFixture({
        stableId: "ac:canon:duplicate",
        name: "Alderaan-like",
        reviewStatus: "draft",
        continuity: null,
        astrography: {
          region: { presence: "missing" },
          sector: { presence: "missing" },
          system: { presence: "missing" },
          grid: { presence: "missing" },
          routes: ["rt:missing"]
        },
        description: "",
        physical: { presence: "missing" },
        societal: { presence: "missing" },
        economics: { presence: "missing" },
        conflictFlags: [{ code: "geography-disagreement-region", severity: "warning" }]
      })
    }
  ], { unresolvedRoutes: [{ stableId: "rt:missing" }] });

  assert.equal(summary.recordCount, 2);
  assert.equal(summary.missing.region, 1);
  assert.equal(summary.missing.description, 1);
  assert.equal(summary.missing.continuity, 1);
  assert.equal(summary.pendingReview, 1);
  assert.equal(summary.geographyConflicts, 1);
  assert.equal(summary.unresolvedRoutes, 1);
  assert.equal(summary.duplicateNames, 1);
});

test("region classifications preserve one primary region", () => {
  const classifications = classificationsFromPrimary({ presence: "present", value: "Core" });
  const normalized = ensurePrimaryRegion([
    { value: "The Interior", relation: "subregion", presence: "present" },
    ...classifications
  ], { presence: "present", value: "Core" });

  assert.deepEqual(normalized, [
    { value: "The Interior", relation: "subregion", presence: "present" },
    { value: "Core", relation: "primary", presence: "present" }
  ]);
  assert.throws(
    () => ensurePrimaryRegion([{ value: "Outer Rim", relation: "primary", presence: "present" }], { presence: "present", value: "Core" }),
    /conflicts/
  );
});

test("approved present field candidates cannot silently overwrite", () => {
  const record = appendProvenance(approvedFixture({
    astrography: {
      ...approvedFixture().astrography,
      system: { presence: "present", value: "Existing system" }
    },
    fieldProvenance: {
      "astrography.system": [{
        sourceId: "existing",
        sourceLocator: "fixture",
        method: "manual-curation",
        candidateValue: "Existing system",
        reviewStatus: "approved"
      }]
    }
  }), "astrography.system", {
    sourceId: "candidate",
    sourceLocator: "fixture",
    method: "manual-curation",
    candidateValue: "Replacement system",
    reviewStatus: "approved"
  });

  assert.throws(
    () => approveFieldCandidate(record, "astrography.system", "Replacement system"),
    /explicit override/
  );
  assert.equal(
    approveFieldCandidate(record, "astrography.system", "Replacement system", { override: true })
      .astrography.system.value,
    "Replacement system"
  );
});

test("reviewed enrichment applies Alderaan-like correction without silent overwrite", () => {
  const output = applyEnrichment([approvedFixture()], {
    records: [{
      stableId: "ac:canon:alderaan-like",
      candidates: [{
        fieldPath: "astrography.system",
        value: "Alderaan system",
        sourceId: "MANUAL",
        sourceLocator: "maintainer screenshot",
        method: "manual-curation",
        reviewStatus: "approved"
      }],
      regionClassifications: [
        { value: "Core", relation: "primary", presence: "present" },
        { value: "The Interior", relation: "subregion", presence: "present" }
      ]
    }]
  });

  assert.equal(output.records[0].astrography.system.value, "Alderaan system");
  assert.equal(output.records[0].conflictFlags.some((flag) => flag.code === "missing-system"), false);
  assert.equal(output.records[0].regionClassifications[1].value, "The Interior");
  assert.throws(
    () => applyEnrichment(output.records, {
      records: [{
        stableId: "ac:canon:alderaan-like",
        sourceId: "MANUAL",
        regionClassifications: [{ value: "Core", relation: "primary", presence: "present" }]
      }]
    }),
    /explicit override/
  );
});

test("missing presence label says not yet sourced", () => {
  assert.equal(PRESENCE_LABEL.missing, "not yet sourced");
});

test("bulk guard still refuses without artifact", () => {
  assert.equal(assertBulkPackBuildAuthorized({ moduleRoot, bulkFlag: true }).ok, false);
});

test("authored Alderaan has a reviewed present system", async () => {
  const authored = JSON.parse(await readFile(join(moduleRoot, "data/sources/astrocom/pilot/phase5-pilot.json"), "utf8"));
  const alderaan = authored.records.find((record) => record.stableId === "ac:canon:alderaan");

  assert.ok(alderaan);
  assert.equal(alderaan.astrography.system.presence, "present");
  assert.equal(alderaan.astrography.system.value, "Alderaan system");
  assert.equal(alderaan.regionClassifications[0].relation, "primary");
});

test("permissions allow browse for players and source detail for assistants", async () => {
  const {
    canBrowseAstroCom,
    canViewAstroComSourceDetail,
    canRunAstroComDevRebuild,
    ASTROCOM_ROLES
  } = await import("../permissions.js");

  assert.equal(canBrowseAstroCom({ role: ASTROCOM_ROLES.PLAYER }), true);
  assert.equal(canBrowseAstroCom({ role: ASTROCOM_ROLES.NONE }), false);
  assert.equal(canViewAstroComSourceDetail({ role: ASTROCOM_ROLES.ASSISTANT }), true);
  assert.equal(canViewAstroComSourceDetail({ role: ASTROCOM_ROLES.PLAYER }), false);
  assert.equal(canRunAstroComDevRebuild({ role: ASTROCOM_ROLES.GAMEMASTER }, "datacron-phase5-pilot", {
    pocWorldId: "datacron-phase4-poc",
    pilotWorldId: "datacron-phase5-pilot"
  }), true);
  assert.equal(canRunAstroComDevRebuild({ role: ASTROCOM_ROLES.GAMEMASTER }, "datacron-phase6-mvp", {
    pocWorldId: "datacron-phase4-poc",
    pilotWorldId: "datacron-phase5-pilot"
  }), false);
});

test("browser states cover unavailable empty partial and live", async () => {
  const { resolveBrowserState, BROWSER_STATE } = await import("../browser-state.js");
  assert.equal(resolveBrowserState({ featureEnabled: false }).state, BROWSER_STATE.DISABLED);
  assert.equal(resolveBrowserState({ requestedPacks: ["a", "b"], foundPacks: 0 }).state, BROWSER_STATE.UNAVAILABLE);
  assert.equal(resolveBrowserState({ requestedPacks: ["a", "b"], foundPacks: 1, entryCount: 3 }).state, BROWSER_STATE.PARTIAL);
  assert.equal(resolveBrowserState({ requestedPacks: ["a"], foundPacks: 1, entryCount: 0 }).state, BROWSER_STATE.EMPTY);
  assert.equal(resolveBrowserState({ requestedPacks: ["a"], foundPacks: 1, entryCount: 2 }).state, BROWSER_STATE.LIVE);
});

test("region filter matches reviewed classifications and sort is deterministic", async () => {
  const { filterIndex, sortIndexEntries, uniqueValues } = await import("../index-query.js");
  const entries = [
    {
      name: "Zeta",
      flags: {
        stableId: "ac:canon:zeta",
        region: "Core",
        regionClassifications: [{ value: "Core", relation: "primary" }, { value: "The Interior", relation: "subregion" }]
      }
    },
    {
      name: "Alpha",
      flags: {
        stableId: "ac:canon:alpha",
        region: "Outer Rim",
        regionClassifications: []
      }
    }
  ];
  const hits = filterIndex(entries, { region: "The Interior" });
  assert.equal(hits.length, 1);
  assert.equal(hits[0].name, "Zeta");
  assert.deepEqual(uniqueValues(entries, "region"), ["Core", "Outer Rim", "The Interior"]);
  assert.deepEqual(sortIndexEntries(entries).map((entry) => entry.name), ["Alpha", "Zeta"]);
});

test("immutable pack world guard refuses Phase 6 MVP rebuild", async () => {
  const { assertAstroComImmutablePackWorld, ASTROCOM_MVP_WORLD_ID } = await import("../runtime-guards.js");
  assert.equal(assertAstroComImmutablePackWorld(ASTROCOM_MVP_WORLD_ID).ok, false);
  assert.equal(assertAstroComImmutablePackWorld("datacron-phase5-pilot").ok, true);
  assert.equal(assertAstroComImmutablePackWorld("campaign-world").ok, false);
});

test("generated Alderaan journal keeps stable id and system folder segment", async () => {
  const journals = JSON.parse(await readFile(join(moduleRoot, "data/generated/astrocom/pilot/journals-two-pack.json"), "utf8"));
  const folders = JSON.parse(await readFile(join(moduleRoot, "data/generated/astrocom/pilot/folders-two-pack.json"), "utf8"));
  const alderaan = journals.find((journal) => journal.flags?.["kakeman89s-datacron"]?.stableId === "ac:canon:alderaan");
  assert.ok(alderaan);
  assert.equal(alderaan._id, "3e7b2a0fd1598fb9");
  assert.equal(alderaan.flags["kakeman89s-datacron"].system, "Alderaan system");
  const systemFolder = folders.find((folder) => folder._id === alderaan.folder);
  assert.equal(systemFolder?.name, "Alderaan system");
});

test("performance fixture filters a 2000-entry metadata index under budget", async () => {
  const { filterIndex } = await import("../index-query.js");
  const { buildMetadataIndexFixture } = await import("./fixtures/phase6-performance-fixture.js");
  const index = buildMetadataIndexFixture(2000);
  const started = performance.now();
  const hits = filterIndex(index, { region: "Core", nameOrAlias: "world-42" });
  const elapsed = performance.now() - started;
  assert.ok(hits.length >= 1);
  assert.ok(elapsed < 50, `expected <50ms, got ${elapsed}ms`);
});
