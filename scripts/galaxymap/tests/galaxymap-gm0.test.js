import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  CENSUS_OUTPUT_PATH,
  REPO_ROOT,
  SOURCE_PATHS,
  runCensus,
  writeCensus,
  requiredLiveAssertions,
  abs
} from "../census-gm0.js";

test("GM-0 live: Coruscant coords are [0, 0]", () => {
  const live = requiredLiveAssertions();
  assert.deepEqual(live.coruscantCoords, [0, 0]);
});

test("GM-0 live: Tatooine coords are [644.386, -673.274]", () => {
  const live = requiredLiveAssertions();
  assert.deepEqual(live.tatooineCoords, [644.386, -673.274]);
});

test("GM-0 live: hyperlanes_db.json has 60 top-level keys", () => {
  const live = requiredLiveAssertions();
  assert.equal(live.hyperlaneKeyCount, 60);
});

test("GM-0 live: module.json does not list Galactic Map.jpg", () => {
  const live = requiredLiveAssertions();
  assert.equal(live.jpegListedInModuleJson, false);
});

test("GM-0 census writes JSON and matches required assertions", () => {
  const census = runCensus(REPO_ROOT);
  const out = writeCensus(census);
  assert.equal(out, CENSUS_OUTPUT_PATH);
  assert.equal(fs.existsSync(CENSUS_OUTPUT_PATH), true);

  assert.equal(census.crs.landmarks.Coruscant.matches, true);
  assert.equal(census.crs.landmarks.Tatooine.matches, true);
  assert.equal(census.hyperlanes.keyCount, 60);
  assert.equal(census.provenance.jpegInModuleJson, false);
  assert.equal(census.files.planetsCsv.present, false);
  assert.equal(census.hops.graphNotRegenerated, true);
  assert.equal(census.hyperlanes.issue32.consecutiveSequenceInHyperlanes, false);

  const moduleJson = fs.readFileSync(abs(REPO_ROOT, SOURCE_PATHS.moduleJson), "utf8");
  assert.equal(moduleJson.includes("Galactic Map.jpg"), false);
  assert.equal(census.provenance.packageExclusionHits.length, 0);
});
