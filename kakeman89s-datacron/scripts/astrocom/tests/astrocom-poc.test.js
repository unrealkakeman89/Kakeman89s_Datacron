import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_INDEX_FIELDS,
  FORBIDDEN_PRODUCTION_TERMS,
  INDEX_FIELDS,
  PACK_FOLDER_MAX_DEPTH,
  PRESENCE_LABEL,
  SCHEMA_VERSION
} from "../constants.js";
import { journalDocumentId } from "../document-id.js";
import { folderPlansFor, optionAPath, optionBPath } from "../folders.js";
import { generateAstroCom, stableStringify } from "../generate.js";
import { canonicalUuidsForGrid, filterIndex, relatedEntry, routeHits } from "../index-query.js";
import { generateFromDefaultFixtures, writeGeneratedOutput } from "../cli-generate.js";
import { mergeDatasets } from "../validate-source.js";

const here = dirname(fileURLToPath(import.meta.url));
const moduleRoot = join(here, "..", "..", "..");
const validPath = join(moduleRoot, "data/sources/astrocom/fixtures/phase4-synthetic.json");
const invalidPath = join(moduleRoot, "data/sources/astrocom/fixtures/phase4-synthetic-invalid.json");

async function loadJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function generated() {
  const valid = await loadJson(validPath);
  const invalid = await loadJson(invalidPath);
  return generateAstroCom(mergeDatasets(valid, invalid));
}

function journalByStableId(result, stableId) {
  return result.journalsTwoPack.find((journal) => journal.flags["kakeman89s-datacron"].stableId === stableId);
}

function indexByStableId(result, stableId) {
  return result.index.find((entry) => entry.flags.stableId === stableId);
}

test("valid Canon and Legends records generate correct names", async () => {
  const result = await generated();
  const aurek = journalByStableId(result, "ac-test-world-aurek-canon");
  const besh = journalByStableId(result, "ac-test-world-besh-legends");
  assert.equal(aurek.name, "Test World Aurek (Canon)");
  assert.equal(besh.name, "Test World Besh (Legends)");
  assert.equal(aurek.flags["kakeman89s-datacron"].continuity, "canon");
  assert.equal(besh.flags["kakeman89s-datacron"].continuity, "legends");
});

test("stable IDs are preserved and independent of display names", async () => {
  const result = await generated();
  const aurek = journalByStableId(result, "ac-test-world-aurek-canon");
  assert.equal(aurek.flags["kakeman89s-datacron"].stableId, "ac-test-world-aurek-canon");
  assert.equal(aurek._id, journalDocumentId("ac-test-world-aurek-canon"));
  assert.notEqual(aurek._id, journalDocumentId("Test World Aurek"));
  assert.match(aurek._id, /^[a-z0-9]{16}$/);
});

test("duplicate stable IDs and display names are rejected", async () => {
  const result = await generated();
  const reasons = result.rejected.map((item) => item.reasons.join(" "));
  assert.ok(reasons.some((text) => text.includes("duplicate stableId")));
  assert.ok(reasons.some((text) => text.includes("duplicate display name")));
  assert.equal(result.journalsTwoPack.filter((journal) => journal.name === "Test World Aurek (Canon)").length, 1);
});

test("invalid continuity, classification, and URLs are rejected", async () => {
  const result = await generated();
  const blob = result.rejected.map((item) => item.reasons.join(" ")).join(" | ");
  assert.match(blob, /continuity must be canon or legends/);
  assert.match(blob, /classification is invalid/);
  assert.match(blob, /not an allowed http\(s\) example URL/);
  assert.equal(result.status, "partial");
  assert.ok(result.summary.message.includes("Rejected"));
});

test("alias, era notes, and optional-field presence are preserved", async () => {
  const result = await generated();
  const aurek = journalByStableId(result, "ac-test-world-aurek-canon");
  const jenth = journalByStableId(result, "ac-test-world-jenth-canon");
  const krill = journalByStableId(result, "ac-test-world-krill-canon");
  const leth = journalByStableId(result, "ac-test-world-leth-legends");
  const html = aurek.pages[0].text.content;
  assert.deepEqual(aurek.flags["kakeman89s-datacron"].aliases, ["Aurek Catalog Label"]);
  assert.match(html, /Test Era One/);
  assert.match(jenth.pages[0].text.content, /Physical Information[\s\S]*not yet sourced/);
  assert.match(krill.pages[0].text.content, /Societal Information[\s\S]*not yet sourced/);
  assert.match(leth.pages[0].text.content, /Planetary Economics[\s\S]*not yet sourced/);
});

test("region, sector, system, grid, and multiple routes are in metadata", async () => {
  const result = await generated();
  const aurek = indexByStableId(result, "ac-test-world-aurek-canon");
  const grek = indexByStableId(result, "ac-test-world-grek-canon");
  const mern = indexByStableId(result, "ac-test-world-mern-canon");
  assert.equal(aurek.flags.region, "Test Region Coreward");
  assert.equal(aurek.flags.sector, "Test Sector One");
  assert.equal(aurek.flags.system, "Example System One");
  assert.equal(aurek.flags.grid, "Fixture-A1");
  assert.deepEqual(grek.flags.routes, ["rt-synthetic-alpha", "rt-synthetic-beta"]);
  assert.equal(mern.flags.grid, null);
  assert.equal(mern.flags.gridPresence, "unknown");
});

test("Canon and Legends variants link without mixing content", async () => {
  const result = await generated();
  const canon = indexByStableId(result, "ac-test-world-cresh-canon");
  const legends = indexByStableId(result, "ac-test-world-cresh-legends");
  assert.equal(canon.flags.relatedContinuityStableId, "ac-test-world-cresh-legends");
  assert.equal(legends.flags.relatedContinuityStableId, "ac-test-world-cresh-canon");
  assert.equal(relatedEntry(result.index, canon).flags.stableId, "ac-test-world-cresh-legends");
  assert.notEqual(canon.flags.region, legends.flags.region);
  assert.equal(canon.name, "Test World Cresh (Canon)");
  assert.equal(legends.name, "Test World Cresh (Legends)");
});

test("folders stay within pack depth and Option A exceeds pack depth", async () => {
  const result = await generated();
  const aurek = result.accepted.find((record) => record.stableId === "ac-test-world-aurek-canon");
  const plans = folderPlansFor(aurek);
  assert.equal(optionAPath(aurek).length, 4);
  assert.equal(optionBPath(aurek).length, 3);
  assert.equal(plans.optionAPack.fits, false);
  assert.equal(plans.optionBPack.fits, true);
  assert.ok(result.foldersTwoPack.every((folder) => folder.depth <= PACK_FOLDER_MAX_DEPTH));
  const assigned = journalByStableId(result, "ac-test-world-aurek-canon").folder;
  assert.ok(result.foldersTwoPack.some((folder) => folder._id === assigned && folder.name === "Example System One"));
});

test("grid and route browsing point at canonical journals without duplicates", async () => {
  const result = await generated();
  const gridUuids = canonicalUuidsForGrid(result.index, "Fixture-A1");
  const routeEntries = routeHits(result.index, "rt-synthetic-alpha");
  assert.equal(gridUuids.length, 2);
  assert.ok(routeEntries.length >= 2);
  const names = result.journalsTwoPack.map((journal) => journal.name);
  assert.equal(names.length, new Set(names).size);
  assert.equal(result.journalsTwoPack.length, result.accepted.length);
  assert.ok(result.routes.some((route) => route.stableId === "rt-synthetic-alpha"));
  assert.equal(result.journalsTwoPack.some((journal) => journal.flags["kakeman89s-datacron"].kind === "route"), false);
});

test("browser filters operate on metadata index", async () => {
  const result = await generated();
  assert.equal(filterIndex(result.index, { continuity: "legends" }).every((entry) => entry.flags.continuity === "legends"), true);
  assert.ok(filterIndex(result.index, { region: "Test Region Rimward" }).length >= 2);
  assert.equal(filterIndex(result.index, { sector: "Test Sector One", system: "Example System One" }).length, 2);
  assert.equal(filterIndex(result.index, { grid: "Fixture-A1" }).length, 2);
  assert.ok(filterIndex(result.index, { route: "rt-synthetic-beta" }).every((entry) => entry.flags.stableId === "ac-test-world-grek-canon"));
  assert.equal(filterIndex(result.index, { nameOrAlias: "Former Name Isk" }).length, 1);
  assert.equal(DEFAULT_INDEX_FIELDS.includes("folder"), true);
  assert.ok(INDEX_FIELDS.some((field) => field.includes("stableId")));
});

test("HTML is escaped and UUIDs are deterministic", async () => {
  const result = await generated();
  const osk = journalByStableId(result, "ac-test-world-osk-canon");
  const html = osk.pages[0].text.content;
  assert.equal(html.includes("<script>"), false);
  assert.match(html, /&lt;script&gt;/);
  assert.equal(osk.pages.length, 1);
  assert.match(osk.uuid, /^Compendium\.world\.astrocom-poc-canon\.JournalEntry\.[a-z0-9]{16}$/);
  const again = await generated();
  assert.equal(stableStringify(result.journalsTwoPack), stableStringify(again.journalsTwoPack));
  assert.equal(stableStringify(result.index), stableStringify(again.index));
});

test("generated data is synthetic and omits personal-name attribution", async () => {
  const result = await generated();
  const text = stableStringify({
    journals: result.journalsTwoPack,
    index: result.index,
    routes: result.routes
  }).toLowerCase();
  for (const term of FORBIDDEN_PRODUCTION_TERMS) {
    assert.equal(text.includes(term), false, term);
  }
  const manifest = JSON.parse(await readFile(join(moduleRoot, "module.json"), "utf8"));
  const personalName = manifest.authors?.[0]?.name;
  if (personalName) {
    assert.equal(text.includes(personalName.toLowerCase()), false);
  }
  assert.match(text, /kakeman89/);
});

test("generator does not modify unrelated module content and writes only generated output", async () => {
  const watched = [
    join(moduleRoot, "scripts/travel-calculator.js"),
    join(moduleRoot, "scripts/droid-ally-pricing.js"),
    join(moduleRoot, "scripts/actor-helpers.js"),
    join(moduleRoot, "scripts/hyperspace-routes.js"),
    join(moduleRoot, "scripts/route-calculator.js")
  ];
  const before = {};
  for (const path of watched) {
    before[path] = createHash("sha256").update(await readFile(path)).digest("hex");
  }
  const result = await generateFromDefaultFixtures();
  await writeGeneratedOutput(result);
  for (const path of watched) {
    const after = createHash("sha256").update(await readFile(path)).digest("hex");
    assert.equal(after, before[path], path);
  }
  const written = JSON.parse(await readFile(join(moduleRoot, "data/generated/astrocom/summary.json"), "utf8"));
  assert.equal(written.status, "partial");
  assert.equal(written.journalCount, 12);
  assert.equal(result.recommendation.packArrangement, "separate-canon-and-legends-journal-packs");
  assert.equal(result.schemaVersion, SCHEMA_VERSION);
  assert.equal(PRESENCE_LABEL.missing, "not yet sourced");
});

test("rebuild world guard and empty browser index", async () => {
  const { ASTROCOM_POC_WORLD_ID, assertAstroComPocWorld, resolveBrowserEntries } = await import("../runtime-guards.js");
  assert.equal(ASTROCOM_POC_WORLD_ID, "datacron-phase4-poc");
  assert.equal(assertAstroComPocWorld("datacron-phase4-poc").ok, true);
  assert.equal(assertAstroComPocWorld("kakeman-created").ok, false);
  assert.match(assertAstroComPocWorld("kakeman-created").message, /rebuild refused/);
  assert.deepEqual(resolveBrowserEntries([]), { source: "empty", entries: [] });
  assert.equal(resolveBrowserEntries([{ name: "Test World Aurek (Canon)" }]).source, "live");
});
