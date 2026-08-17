import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { adaptAstro001 } from "../pipeline/adapter-astro.js";
import { applyAliases } from "../pipeline/adapter-alias.js";
import { applyData001Enrichment } from "../pipeline/adapter-data.js";
import { applyContinuityHints } from "../pipeline/adapter-continuity.js";
import { adaptRoutes } from "../pipeline/adapter-routes.js";
import { detectConflicts } from "../pipeline/conflicts.js";
import { assertBulkPackBuildAuthorized, bulkAuthAbsolutePath } from "../pipeline/bulk-guard.js";
import { REVIEWER, REVIEW_STATUS } from "../pipeline/constants.js";
import { matchKey, normalizeRegionValue, provisionalStableId } from "../pipeline/normalize.js";
import { canEmitToPack, validateIntermediateRecord } from "../pipeline/validate-intermediate.js";
import { generatePilotPacks, realBulkAuthExists, selectApprovedPilotRecords } from "../pipeline/generate-pilot.js";
import { summarizeIncremental } from "../incremental.js";
import { generateAstroCom, stableStringify } from "../generate.js";
import { MODULE_PACK_KEYS } from "../pipeline/constants.js";

const here = dirname(fileURLToPath(import.meta.url));
const moduleRoot = join(here, "..", "..", "..");

function draftRecord(overrides = {}) {
  return {
    schemaVersion: 1,
    stableId: null,
    provisionalStableId: "prov:test",
    name: "Test",
    normalizedName: "test",
    continuity: null,
    classification: "planet",
    aliases: [],
    description: "Desc",
    astrography: {
      region: { presence: "present", value: "Core" },
      sector: { presence: "missing" },
      system: { presence: "missing" },
      grid: { presence: "present", value: "M-10" },
      routes: []
    },
    physical: { presence: "missing" },
    societal: { presence: "missing" },
    economics: { presence: "missing" },
    sourceMetadata: { datasetId: "ASTRO-001" },
    reviewStatus: REVIEW_STATUS.DRAFT,
    conflictFlags: [],
    adapterSources: ["ASTRO-001"],
    rawSourceReferences: [],
    ...overrides
  };
}

test("intermediate validation requires review fields for approval", () => {
  const draft = draftRecord();
  assert.equal(validateIntermediateRecord(draft).length, 0);
  assert.equal(canEmitToPack(draft).ok, false);
  const approved = draftRecord({
    stableId: "ac:canon:test",
    continuity: "canon",
    reviewStatus: REVIEW_STATUS.APPROVED,
    reviewedBy: REVIEWER,
    lastReviewedAt: "2026-08-17"
  });
  assert.equal(canEmitToPack(approved).ok, true);
  assert.ok(canEmitToPack({ ...approved, conflictFlags: [{ code: "x", severity: "blocking", message: "no" }] }).ok === false);
});

test("normalization corrects region capitalization and DATA region aliases", () => {
  assert.equal(normalizeRegionValue("Inner RIm").value, "Inner Rim");
  assert.equal(normalizeRegionValue("Inner RIm").rule, "region-capitalization");
  assert.equal(normalizeRegionValue("Outer Rim Territories").value, "Outer Rim");
  assert.equal(matchKey("Noe'ha'on"), matchKey("Noe’ha’on"));
});

test("ASTRO-001 adapter never auto-approves continuity and records missing system", () => {
  const [record] = adaptAstro001([{ name: "Aaeton", grid: "K-9", sector: null, region: "Core" }]);
  assert.equal(record.continuity, null);
  assert.equal(record.reviewStatus, REVIEW_STATUS.DRAFT);
  assert.equal(record.astrography.system.presence, "missing");
  assert.equal(record.astrography.sector.presence, "missing");
  assert.ok(record.conflictFlags.some((flag) => flag.code === "missing-system"));
  assert.match(record.provisionalStableId, /^prov:aaeton:/);
});

test("DATA-001 overlay does not copy Image and does not overwrite ASTRO geography", () => {
  const [base] = adaptAstro001([{ name: "Tatooine", grid: "R-16", sector: "Arkanis", region: "Outer Rim" }]);
  const { records } = applyData001Enrichment([base], [{
    Name: "Tatooine",
    Image: "Tatooine TPM.png",
    Coord: "R-16",
    Region: "Outer Rim Territories",
    Sector: "Arkanis Sector",
    Gravity: 1
  }]);
  const text = stableStringify(records);
  assert.equal(text.includes("Tatooine TPM.png"), false);
  assert.equal(records[0].astrography.region.value, "Outer Rim");
  assert.equal(records[0].physical.presence, "present");
  assert.equal(records[0].physical.gravity, "1");
});

test("DATA-001 geography disagreement is a warning and retains ASTRO-001", () => {
  const [base] = adaptAstro001([{ name: "Demo", grid: "A-1", sector: "Alpha", region: "Core" }]);
  const { records } = applyData001Enrichment([base], [{
    Name: "Demo",
    Coord: "B-2",
    Region: "Outer Rim Territories",
    Sector: "Arkanis Sector"
  }]);
  assert.equal(records[0].astrography.region.value, "Core");
  assert.ok(records[0].conflictFlags.some((flag) => flag.code === "geography-disagreement-region"));
  assert.ok(records[0].conflictFlags.some((flag) => flag.code === "geography-disagreement-grid"));
});

test("continuity hints never set approved continuity", () => {
  const [base] = adaptAstro001([{ name: "Metellos", grid: "K-9", sector: null, region: "Core" }]);
  const hinted = applyContinuityHints([base], { "K-9": [{ name: "Metellos", is_canon: false }] });
  assert.equal(hinted[0].continuity, null);
  assert.equal(hinted[0].continuityHint.value, "legends");
  assert.equal(hinted[0].reviewStatus, REVIEW_STATUS.DRAFT);
});

test("alias adapter preserves originals and flags alias-equals-canonical", () => {
  const records = adaptAstro001([
    { name: "Kailor", grid: "A-1", sector: "X", region: "Core" },
    { name: "Kailor V", grid: "A-1", sector: "X", region: "Core" }
  ]);
  const { records: next } = applyAliases(records, { "Kailor V": "Kailor" });
  assert.ok(next[0].aliases.includes("Kailor V"));
  assert.ok(next[0].conflictFlags.some((flag) => flag.code === "alias-equals-canonical"));
});

test("duplicate names are blocking and quarantined", () => {
  const records = adaptAstro001([
    { name: "Noe'ha'on", grid: "A-1", sector: "X", region: "Outer Rim" },
    { name: "Noe'ha'on", grid: "B-2", sector: "Y", region: "Outer Rim" }
  ]);
  const { records: next } = detectConflicts(records, []);
  assert.equal(next.every((record) => record.reviewStatus === REVIEW_STATUS.QUARANTINED), true);
  assert.ok(next[0].conflictFlags.some((flag) => flag.code === "duplicate-source-name" && flag.severity === "blocking"));
});

test("route adapter reports unresolved endpoints and does not invent journals", () => {
  const records = adaptAstro001([{ name: "Eiattu", grid: "A-1", sector: "X", region: "Inner Rim" }]);
  const { routes, unresolved } = adaptRoutes([
    { name: "Ado Spine", from: "Eiattu", to: "StarForge Nebula", tier: 3, obscure: false }
  ], records);
  assert.equal(routes.length, 1);
  assert.ok(unresolved.some((row) => row.endpoint === "StarForge Nebula"));
  assert.equal(routes[0].reviewStatus, REVIEW_STATUS.DRAFT);
});

test("bulk guard requires exact file and explicit flag", async () => {
  const temp = await mkdtemp(join(tmpdir(), "astrocom-bulk-"));
  const expected = join(temp, "data/sources/astrocom/review/BULK_INGEST_AUTHORIZED.md");
  const similar = join(temp, "data/sources/astrocom/review/BULK_INGEST_AUTHORIZED.txt");
  await mkdir(dirname(expected), { recursive: true });
  await writeFile(similar, "nope", "utf8");
  assert.equal(assertBulkPackBuildAuthorized({ moduleRoot: temp, bulkFlag: true }).ok, false);
  assert.equal(assertBulkPackBuildAuthorized({ moduleRoot: temp, bulkFlag: false, authPath: expected }).ok, false);
  await writeFile(expected, "authorized", "utf8");
  assert.equal(assertBulkPackBuildAuthorized({ moduleRoot: temp, bulkFlag: false, authPath: expected }).ok, false);
  assert.equal(assertBulkPackBuildAuthorized({ moduleRoot: temp, bulkFlag: true, authPath: expected }).ok, true);
  const injected = join(temp, "not-the-real-path.md");
  await writeFile(injected, "nope", "utf8");
  assert.equal(assertBulkPackBuildAuthorized({ moduleRoot: temp, bulkFlag: true, authPath: injected }).ok, false);
  await rm(temp, { recursive: true, force: true });
});

test("real bulk authorization artifact is absent", () => {
  assert.equal(realBulkAuthExists(moduleRoot), false);
  assert.equal(existsSync(bulkAuthAbsolutePath(moduleRoot)), false);
});

test("bulk generate refuses without leftover full pack files", async () => {
  const temp = await mkdtemp(join(tmpdir(), "astrocom-refuse-"));
  const bulkOutput = join(temp, "data/generated/astrocom/bulk");
  const outcome = await generatePilotPacks({
    moduleRoot: temp,
    bulk: true,
    write: false,
    paths: {
      authored: join(temp, "missing.json"),
      generated: join(temp, "pilot"),
      packCanon: join(temp, "packs/astrocom-canon"),
      packLegends: join(temp, "packs/astrocom-legends"),
      bulkOutput
    }
  });
  assert.equal(outcome.status, "refused");
  assert.match(outcome.summary.message, /not authorized/);
  assert.equal(existsSync(bulkOutput), false);
  await rm(temp, { recursive: true, force: true });
});

test("approved-only selection excludes quarantined and rejected", () => {
  const authored = {
    records: [
      draftRecord({
        name: "Good",
        stableId: "ac:canon:good",
        continuity: "canon",
        reviewStatus: REVIEW_STATUS.APPROVED,
        reviewedBy: REVIEWER,
        lastReviewedAt: "2026-08-17"
      }),
      draftRecord({ name: "Bad", reviewStatus: REVIEW_STATUS.QUARANTINED, provisionalStableId: "prov:bad" }),
      draftRecord({ name: "Nope", reviewStatus: REVIEW_STATUS.REJECTED, provisionalStableId: "prov:nope" })
    ],
    quarantineDemos: [{ name: "Noe'ha'on" }]
  };
  const selected = selectApprovedPilotRecords(authored);
  assert.equal(selected.approved.length, 1);
  assert.equal(selected.approved[0].name, "Good");
  assert.equal(selected.quarantined.length, 1);
});

test("provisional IDs are not silently used as approved IDs", () => {
  const id = provisionalStableId("Coruscant", "ASTRO-001:1");
  assert.match(id, /^prov:/);
  assert.notEqual(id, "ac:canon:coruscant");
});

test("incremental summary reports created updated unchanged removed", () => {
  const prev = new Map([["ac:canon:a", { _id: "1111111111111111", name: "A (Canon)" }]]);
  const next = [
    { flags: { "kakeman89s-datacron": { stableId: "ac:canon:a" } }, _id: "1111111111111111", name: "A (Canon)" },
    { flags: { "kakeman89s-datacron": { stableId: "ac:canon:b" } }, _id: "2222222222222222", name: "B (Canon)" }
  ];
  const summary = summarizeIncremental(prev, next);
  assert.equal(summary.unchanged, 1);
  assert.equal(summary.created, 1);
  assert.equal(summary.removed, 0);
});

test("module pack generation uses module collection IDs and fixture false", () => {
  const dataset = {
    schemaVersion: 1,
    records: [
      {
        schemaVersion: 1,
        stableId: "ac:canon:unit-pilot",
        name: "Unit Pilot",
        continuity: "canon",
        classification: "planet",
        description: "Pilot unit record.",
        astrography: {
          region: { presence: "present", value: "Core" },
          sector: { presence: "missing" },
          system: { presence: "missing" },
          grid: { presence: "present", value: "L-9" },
          routes: []
        },
        physical: { presence: "missing" },
        societal: { presence: "missing" },
        economics: { presence: "missing" },
        sourceMetadata: { datasetId: "ASTRO-001" }
      }
    ],
    routes: []
  };
  const result = generateAstroCom(dataset, {
    packKeys: MODULE_PACK_KEYS,
    packScope: "module",
    fixture: false
  });
  assert.equal(result.status, "success");
  assert.equal(result.journalsTwoPack[0].flags["kakeman89s-datacron"].fixture, false);
  assert.match(result.journalsTwoPack[0].uuid, /^Compendium\.kakeman89s-datacron\.astrocom-canon\.JournalEntry\./);
  assert.match(result.journalsTwoPack[0].pages[0].text.content, /not yet sourced/);
});

test("generated pilot contains approved-only real records and both continuities", async () => {
  const journals = JSON.parse(await readFile(join(moduleRoot, "data/generated/astrocom/pilot/journals-two-pack.json"), "utf8"));
  const index = JSON.parse(await readFile(join(moduleRoot, "data/generated/astrocom/pilot/index.json"), "utf8"));
  const quarantined = JSON.parse(await readFile(join(moduleRoot, "data/generated/astrocom/pilot/quarantined-excluded.json"), "utf8"));
  const manifest = JSON.parse(await readFile(join(moduleRoot, "module.json"), "utf8"));
  assert.equal(journals.length, 27);
  assert.equal(journals.some((journal) => journal.name.includes("Noe'ha'on")), false);
  assert.equal(quarantined.length, 2);
  assert.ok(journals.some((journal) => journal.name === "Korriban (Canon)"));
  assert.ok(journals.some((journal) => journal.name === "Korriban (Legends)"));
  assert.ok(index.some((entry) => entry.flags.region === "Expansion Region"));
  assert.ok(index.some((entry) => entry.flags.aliases?.includes("Kailor V")));
  assert.ok(journals.every((journal) => journal.flags["kakeman89s-datacron"].fixture === false));
  assert.deepEqual(
    manifest.packs.map((pack) => pack.name),
    ["astrocom-canon", "astrocom-legends"]
  );
  const blob = stableStringify({ journals, index }).toLowerCase();
  assert.equal(blob.includes("wookieepedia"), false);
  assert.equal(blob.includes(".png"), false);
  const personalName = manifest.authors?.[0]?.name;
  if (personalName) assert.equal(blob.includes(personalName.toLowerCase()), false);
  assert.match(blob, /kakeman89/);
});

test("pilot world guard refuses other worlds", async () => {
  const { ASTROCOM_PILOT_WORLD_ID, assertAstroComPilotWorld } = await import("../runtime-guards.js");
  assert.equal(ASTROCOM_PILOT_WORLD_ID, "datacron-phase5-pilot");
  assert.equal(assertAstroComPilotWorld("datacron-phase5-pilot").ok, true);
  assert.equal(assertAstroComPilotWorld("datacron-phase4-poc").ok, false);
  assert.match(assertAstroComPilotWorld("datacron-phase4-poc").message, /refused/);
});
