import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { INTERMEDIATE_SCHEMA_VERSION } from "./constants.js";
import { adaptAstro001 } from "./adapter-astro.js";
import { applyAliases } from "./adapter-alias.js";
import { applyData001Enrichment } from "./adapter-data.js";
import { applyContinuityHints } from "./adapter-continuity.js";
import { adaptRoutes } from "./adapter-routes.js";
import { detectConflicts } from "./conflicts.js";
import { canEmitToPack } from "./validate-intermediate.js";
import { stableStringify } from "../generate.js";

const here = dirname(fileURLToPath(import.meta.url));
export const moduleRoot = join(here, "..", "..", "..");
export const repoRoot = join(moduleRoot, "..");

export function analysisPaths(root = moduleRoot, repo = repoRoot) {
  return {
    astro: join(root, "data/planets.json"),
    routes: join(root, "data/hyperspace-routes.json"),
    aliases: join(root, "data/starwarsmap/planet-name-aliases.json"),
    data: join(repo, "planets.json"),
    gridDb: join(repo, "StarWarsMap/map_api/data/grid_db.json"),
    intermediateDir: join(root, "data/sources/astrocom/intermediate"),
    quarantineDir: join(root, "data/sources/astrocom/quarantine"),
    reviewDir: join(root, "data/sources/astrocom/review")
  };
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

export async function loadPrivateDatasets(paths = analysisPaths()) {
  const astro = await readJson(paths.astro);
  const routeFile = await readJson(paths.routes);
  const aliasFile = await readJson(paths.aliases);
  const data = await readJson(paths.data);
  let gridDb = {};
  try {
    gridDb = await readJson(paths.gridDb);
  } catch (_error) {
    gridDb = {};
  }
  return {
    astroCount: astro.length,
    dataCount: data.length,
    routeEdgeCount: routeFile.routes?.length ?? 0,
    astro,
    data,
    routeEdges: routeFile.routes ?? [],
    aliases: aliasFile.aliases ?? {},
    gridDb
  };
}

export async function runAnalysis(options = {}) {
  const paths = options.paths ?? analysisPaths();
  const datasets = options.datasets ?? await loadPrivateDatasets(paths);
  let records = adaptAstro001(datasets.astro);
  const aliasResult = applyAliases(records, datasets.aliases);
  records = aliasResult.records;
  const dataResult = applyData001Enrichment(records, datasets.data);
  records = dataResult.records;
  records = applyContinuityHints(records, datasets.gridDb);
  const routeResult = adaptRoutes(datasets.routeEdges, records);
  records = routeResult.records;
  const conflicted = detectConflicts(records, routeResult.routes);
  records = conflicted.records;

  const statusCounts = { draft: 0, quarantined: 0, approved: 0, rejected: 0 };
  for (const record of records) {
    statusCounts[record.reviewStatus] = (statusCounts[record.reviewStatus] ?? 0) + 1;
  }

  const autoApproved = records.filter((record) => record.reviewStatus === "approved" && record.reviewedBy == null);
  if (autoApproved.length) {
    throw new Error("Adapters must not auto-approve records.");
  }

  const reviewQueue = records
    .filter((record) => record.reviewStatus === "draft" || record.reviewStatus === "quarantined")
    .map((record) => ({
      provisionalStableId: record.provisionalStableId,
      name: record.name,
      reviewStatus: record.reviewStatus,
      continuity: record.continuity,
      continuityHint: record.continuityHint?.value ?? null,
      conflictFlags: record.conflictFlags,
      canEmit: canEmitToPack(record).ok
    }));

  const quarantined = records.filter((record) => record.reviewStatus === "quarantined");
  const summary = {
    schemaVersion: INTERMEDIATE_SCHEMA_VERSION,
    astroCount: datasets.astroCount,
    dataCount: datasets.dataCount,
    routeEdgeCount: datasets.routeEdgeCount,
    intermediateCount: records.length,
    namedRouteCount: routeResult.routes.length,
    unresolvedRouteEndpoints: routeResult.unresolved.length,
    ambiguousRouteEndpoints: routeResult.ambiguous.length,
    aliasCollisions: aliasResult.collisions.length,
    dataAmbiguous: dataResult.ambiguous.length,
    statusCounts,
    quarantinedCount: quarantined.length,
    reviewQueueCount: reviewQueue.length,
    emitCount: records.filter((record) => canEmitToPack(record).ok).length,
    imageFieldsIgnored: true,
    continuityNeverAutoApproved: true
  };

  return {
    summary,
    records,
    routes: conflicted.routes,
    quarantined,
    reviewQueue,
    conflictReports: conflicted.reports,
    routeUnresolved: routeResult.unresolved,
    routeAmbiguous: routeResult.ambiguous
  };
}

function markdownChecklist(queue) {
  const lines = ["# AstroCom review queue", "", "Generated. Do not hand-edit.", ""];
  for (const item of queue) {
    lines.push(`- [ ] ${item.name} (${item.provisionalStableId}) — ${item.reviewStatus}; hint=${item.continuityHint ?? "none"}`);
  }
  lines.push("");
  return lines.join("\n");
}

function markdownConflicts(reports, summary) {
  return [
    "# AstroCom conflict summary",
    "",
    "Generated. Do not hand-edit.",
    "",
    `- Intermediate records: ${summary.intermediateCount}`,
    `- Quarantined: ${summary.quarantinedCount}`,
    `- Unresolved route endpoints: ${summary.unresolvedRouteEndpoints}`,
    `- Conflict report rows: ${reports.length}`,
    "",
    ...reports.slice(0, 200).map((row) => `- ${row.severity}: ${row.code} ${JSON.stringify(row)}`),
    ""
  ].join("\n");
}

export async function writeAnalysisReports(result, paths = analysisPaths()) {
  await mkdir(paths.intermediateDir, { recursive: true });
  await mkdir(paths.quarantineDir, { recursive: true });
  await mkdir(paths.reviewDir, { recursive: true });
  await writeFile(join(paths.intermediateDir, "analysis-summary.json"), stableStringify(result.summary), "utf8");
  await writeFile(join(paths.quarantineDir, "quarantined.json"), stableStringify({ schemaVersion: 1, records: result.quarantined }), "utf8");
  await writeFile(join(paths.reviewDir, "review-queue.json"), stableStringify({ schemaVersion: 1, items: result.reviewQueue }), "utf8");
  await writeFile(join(paths.reviewDir, "review-checklist.md"), markdownChecklist(result.reviewQueue), "utf8");
  await writeFile(join(paths.reviewDir, "conflicts.json"), stableStringify(result.conflictReports), "utf8");
  await writeFile(join(paths.reviewDir, "conflicts.md"), markdownConflicts(result.conflictReports, result.summary), "utf8");
  await writeFile(
    join(paths.reviewDir, "route-resolution.json"),
    stableStringify({
      unresolved: result.routeUnresolved,
      ambiguous: result.routeAmbiguous
    }),
    "utf8"
  );
  await writeFile(
    join(paths.reviewDir, "adapter-summary.json"),
    stableStringify(result.summary),
    "utf8"
  );
  return paths;
}
