import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { generateAstroCom, stableStringify } from "../generate.js";
import { MODULE_PACK_KEYS } from "./constants.js";
import { assertBulkPackBuildAuthorized } from "./bulk-guard.js";
import { canEmitToPack } from "./validate-intermediate.js";
import { toReleaseDataset } from "./convert-release.js";
import { adaptRoutes } from "./adapter-routes.js";
import { writeFoundryJournalPack } from "./pack-write.js";
import { moduleRoot } from "./orchestrate.js";

export function pilotPaths(root = moduleRoot) {
  return {
    authored: join(root, "data/sources/astrocom/pilot/phase5-pilot.json"),
    generated: join(root, "data/generated/astrocom/pilot"),
    packCanon: join(root, "packs/astrocom-canon"),
    packLegends: join(root, "packs/astrocom-legends"),
    bulkOutput: join(root, "data/generated/astrocom/bulk")
  };
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

export function selectApprovedPilotRecords(authored) {
  const approved = [];
  const rejected = [];
  const quarantined = authored.quarantineDemos ?? [];
  for (const record of authored.records ?? []) {
    const emit = canEmitToPack(record);
    if (!emit.ok) {
      rejected.push({ stableId: record.stableId, name: record.name, reasons: [emit.reason] });
      continue;
    }
    approved.push(record);
  }
  return { approved, rejected, quarantined };
}

export async function generatePilotPacks(options = {}) {
  const root = options.moduleRoot ?? moduleRoot;
  const paths = options.paths ?? pilotPaths(root);
  const bulkFlag = options.bulk === true;

  if (bulkFlag) {
    const guard = assertBulkPackBuildAuthorized({
      moduleRoot: root,
      bulkFlag,
      authPath: options.authPath ?? null
    });
    if (!guard.ok) {
      return {
        status: "refused",
        summary: {
          status: "refused",
          acceptedCount: 0,
          rejectedCount: 0,
          journalCount: 0,
          message: guard.message
        },
        guard,
        filesWritten: []
      };
    }
  }

  const authored = options.authored ?? await readJson(paths.authored);
  const selected = selectApprovedPilotRecords(authored);
  const routeSource = authored.routeEdges ?? [];
  const routed = adaptRoutes(routeSource, selected.approved);
  const dataset = toReleaseDataset(routed.records, routed.routes.filter((route) => {
    return route.planetStableIds.every((id) => selected.approved.some((record) => record.stableId === id || record.provisionalStableId === id));
  }).map((route) => ({
    ...route,
    planetStableIds: route.planetStableIds
      .map((id) => selected.approved.find((record) => record.stableId === id || record.provisionalStableId === id)?.stableId)
      .filter(Boolean),
    grids: route.grids.length ? route.grids : ["unresolved"]
  })).filter((route) => route.planetStableIds.length));

  const result = generateAstroCom(dataset, {
    packKeys: MODULE_PACK_KEYS,
    packScope: "module",
    fixture: false,
    worldId: "datacron-phase5-pilot"
  });

  if (options.write !== false) {
    await mkdir(paths.generated, { recursive: true });
    const files = {
      "summary.json": result.summary,
      "rejected.json": [...result.rejected, ...selected.rejected],
      "journals-two-pack.json": result.journalsTwoPack,
      "folders-two-pack.json": result.foldersTwoPack,
      "index.json": result.index,
      "routes.json": result.routes,
      "quarantined-excluded.json": selected.quarantined,
      "pilot-selection.json": {
        approvedCount: selected.approved.length,
        rejectedCount: selected.rejected.length,
        quarantinedDemoCount: selected.quarantined.length,
        names: selected.approved.map((record) => `${record.name} (${record.continuity})`)
      }
    };
    for (const [name, value] of Object.entries(files)) {
      await writeFile(join(paths.generated, name), stableStringify(value), "utf8");
    }
    await writeFile(
      join(paths.generated, "README.md"),
      [
        "# Generated AstroCom Phase 5 pilot output",
        "",
        "Do not hand-edit these files.",
        "Modify data/sources/astrocom/pilot/phase5-pilot.json, then rebuild.",
        "This output is the approved Phase 5 pilot only. It is not a full-dataset pack.",
        ""
      ].join("\n"),
      "utf8"
    );

    const canonJournals = result.journalsTwoPack.filter((journal) => journal.packKey === MODULE_PACK_KEYS.CANON);
    const legendsJournals = result.journalsTwoPack.filter((journal) => journal.packKey === MODULE_PACK_KEYS.LEGENDS);
    const canonFolders = result.foldersTwoPack.filter((folder) => folder.packKey === MODULE_PACK_KEYS.CANON);
    const legendsFolders = result.foldersTwoPack.filter((folder) => folder.packKey === MODULE_PACK_KEYS.LEGENDS);
    await writeFoundryJournalPack(paths.packCanon, { folders: canonFolders, journals: canonJournals, fixture: false });
    await writeFoundryJournalPack(paths.packLegends, { folders: legendsFolders, journals: legendsJournals, fixture: false });
  }

  return {
    status: result.status,
    result,
    selected,
    summary: {
      ...result.summary,
      quarantinedCount: selected.quarantined.length,
      packKeys: [MODULE_PACK_KEYS.CANON, MODULE_PACK_KEYS.LEGENDS]
    }
  };
}

export function realBulkAuthExists(root = moduleRoot) {
  return existsSync(join(root, "data/sources/astrocom/review/BULK_INGEST_AUTHORIZED.md"));
}
