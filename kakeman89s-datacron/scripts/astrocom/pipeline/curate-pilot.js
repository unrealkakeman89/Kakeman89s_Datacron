import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { REVIEWER, REVIEW_STATUS } from "./constants.js";
import { approvedStableId } from "./normalize.js";
import { runAnalysis } from "./orchestrate.js";
import { moduleRoot } from "./orchestrate.js";
import { stableStringify } from "../generate.js";

const REVIEW_DATE = "2026-08-17";

const CANON_NAMES = [
  "Coruscant",
  "Alderaan",
  "Corellia",
  "Tatooine",
  "Ahch-To",
  "Csilla",
  "Bothawui",
  "Hosnian Prime",
  "Byss",
  "Endor",
  "Yavin 4",
  "Dathomir",
  "Kailor",
  "Korriban"
];

const LEGENDS_NAMES = [
  "Aaeton",
  "Metellos",
  "Alee",
  "Eshan",
  "Galactic Center",
  "Ossus",
  "Rekkiad",
  "A-Foroon",
  "Lenico IV",
  "Alashan",
  "Byblos",
  "Allanteen",
  "Korriban"
];

const CLASSIFICATION_OVERRIDE = {
  "Yavin 4": "moon"
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function approve(record, continuity, notes) {
  const approved = clone(record);
  approved.continuity = continuity;
  approved.reviewStatus = REVIEW_STATUS.APPROVED;
  approved.reviewedBy = REVIEWER;
  approved.lastReviewedAt = REVIEW_DATE;
  approved.stableId = approvedStableId(record.name, continuity);
  approved.reviewNotes = notes;
  approved.conflictFlags = (approved.conflictFlags ?? []).filter((flag) => flag.severity !== "blocking");
  if (CLASSIFICATION_OVERRIDE[record.name]) {
    approved.classification = CLASSIFICATION_OVERRIDE[record.name];
  }
  return approved;
}

export async function buildAuthoredPilot() {
  const analysis = await runAnalysis();
  const byName = new Map();
  for (const record of analysis.records) {
    if (!byName.has(record.name)) byName.set(record.name, record);
  }

  const missing = [...CANON_NAMES, ...LEGENDS_NAMES].filter((name) => !byName.has(name));
  if (missing.length) {
    throw new Error(`Pilot curation missing ASTRO-001 names: ${missing.join(", ")}`);
  }

  const approved = [];
  for (const name of CANON_NAMES) {
    approved.push(
      approve(
        byName.get(name),
        "canon",
        "Kakeman89 approved this ASTRO-001 record for the Phase 5 pilot. Geography follows ASTRO-001; DATA-001 disagreements remain as warnings. Continuity is reviewer-assigned, not inferred from hints."
      )
    );
  }
  for (const name of LEGENDS_NAMES) {
    approved.push(
      approve(
        byName.get(name),
        "legends",
        "Kakeman89 approved this ASTRO-001 record for the Phase 5 pilot. Geography follows ASTRO-001; DATA-001 disagreements remain as warnings. Continuity is reviewer-assigned, not inferred from hints."
      )
    );
  }

  const korribanCanon = approved.find((record) => record.name === "Korriban" && record.continuity === "canon");
  const korribanLegends = approved.find((record) => record.name === "Korriban" && record.continuity === "legends");
  korribanCanon.conceptualId = "concept:korriban";
  korribanLegends.conceptualId = "concept:korriban";
  korribanCanon.relatedContinuityStableId = korribanLegends.stableId;
  korribanLegends.relatedContinuityStableId = korribanCanon.stableId;

  const approvedNames = new Set(approved.map((record) => record.name));
  const routeEdges = analysis.routes
    .flatMap((route) => route.edges ?? [])
    .filter((edge) => approvedNames.has(edge.from) || approvedNames.has(edge.to))
    .map((edge) => ({
      name: analysis.routes.find((route) => (route.edges ?? []).includes(edge))?.name,
      from: edge.from,
      to: edge.to,
      distance: edge.distance,
      travelTimeBase: edge.travelTimeBase,
      classification: edge.classification,
      tier: null,
      obscure: null
    }));

  const namedEdges = [];
  for (const route of analysis.routes) {
    for (const edge of route.edges ?? []) {
      if (approvedNames.has(edge.from) || approvedNames.has(edge.to)) {
        namedEdges.push({
          name: route.name,
          from: edge.from,
          to: edge.to,
          distance: edge.distance,
          travelTimeBase: edge.travelTimeBase,
          classification: edge.classification,
          tier: route.tier,
          obscure: route.obscure
        });
      }
    }
  }

  const quarantineDemos = analysis.records
    .filter((record) => record.name === "Noe'ha'on")
    .map((record) => ({
      name: record.name,
      provisionalStableId: record.provisionalStableId,
      reviewStatus: record.reviewStatus,
      reason: "duplicate-source-name",
      uncleanRoute: "Great Gran Run"
    }));

  return {
    schemaVersion: 1,
    fixtureId: "phase5-pilot",
    attribution: REVIEWER,
    lastReviewedAt: REVIEW_DATE,
    notes: "Authored Phase 5 pilot. Quarantine demos are excluded from packs.",
    records: approved,
    routeEdges: namedEdges,
    quarantineDemos,
    unusedRouteEdges: routeEdges.length
  };
}

const isCli = Boolean(process.argv[1]?.replaceAll("\\", "/").endsWith("pipeline/curate-pilot.js"));
if (isCli) {
  const authored = await buildAuthoredPilot();
  const dir = join(moduleRoot, "data/sources/astrocom/pilot");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "phase5-pilot.json"), stableStringify(authored), "utf8");
  console.log(JSON.stringify({
    approved: authored.records.length,
    canon: authored.records.filter((record) => record.continuity === "canon").length,
    legends: authored.records.filter((record) => record.continuity === "legends").length,
    routeEdges: authored.routeEdges.length,
    quarantineDemos: authored.quarantineDemos.length
  }, null, 2));
}
