import {
  FLAG_SCOPE,
  PACK_FOLDER_MAX_DEPTH,
  PACK_KEYS,
  SCHEMA_VERSION,
  WORLD_FOLDER_MAX_DEPTH
} from "./constants.js";
import { journalDocumentId } from "./document-id.js";
import {
  buildFolderDocuments,
  folderIdForRecord,
  folderPlansFor,
  optionAPath,
  optionBPath,
  packKeyForContinuity
} from "./folders.js";
import { packCollectionId } from "./index-query.js";
import { buildJournalSource } from "./journal.js";
import { journalNameFor, mergeDatasets, validateRecordShape, validateRouteShape } from "./validate-source.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sortRecords(records) {
  return records
    .map((record, index) => ({ record, index }))
    .sort((left, right) => {
      const byId = String(left.record.stableId ?? "").localeCompare(String(right.record.stableId ?? ""));
      return byId !== 0 ? byId : left.index - right.index;
    })
    .map((entry) => entry.record);
}

function reject(record, reasons) {
  return {
    stableId: record?.stableId ?? null,
    name: record?.name ?? null,
    reasons: [...reasons]
  };
}

function routeNamesFor(record, routeById) {
  return (record.astrography?.routes ?? [])
    .map((routeId) => routeById.get(routeId)?.name)
    .filter(Boolean);
}

function buildIndexEntry(journal, record, routeNames) {
  const flags = journal.flags[FLAG_SCOPE];
  return {
    _id: journal._id,
    name: journal.name,
    folder: journal.folder,
    packKey: journal.packKey,
    uuid: journal.uuid,
    flags: {
      schemaVersion: flags.schemaVersion,
      stableId: flags.stableId,
      continuity: flags.continuity,
      aliases: flags.aliases,
      region: flags.region,
      sector: flags.sector,
      system: flags.system,
      grid: flags.grid,
      gridPresence: flags.gridPresence,
      routes: flags.routes,
      relatedContinuityStableId: flags.relatedContinuityStableId,
      conceptualId: flags.conceptualId,
      classification: flags.classification
    },
    routeNames
  };
}

function validateDatasetRecords(dataset) {
  const rejected = [];
  const accepted = [];
  if (dataset.schemaVersion !== SCHEMA_VERSION) {
    return {
      accepted: [],
      rejected: [reject({ stableId: null, name: "dataset" }, ["schemaVersion must be 1"])]
    };
  }

  const records = sortRecords(dataset.records ?? []);
  const seenStableIds = new Set();
  const seenNames = new Map();

  for (const record of records) {
    const reasons = validateRecordShape(record);
    const nameKey = `${record?.continuity ?? ""}::${record?.name ?? ""}`;

    if (record?.stableId && seenStableIds.has(record.stableId)) {
      reasons.push("duplicate stableId");
    }
    if (record?.name && record?.continuity && seenNames.has(nameKey)) {
      reasons.push("duplicate display name for continuity");
    }

    if (reasons.length) {
      rejected.push(reject(record, reasons));
      continue;
    }

    seenStableIds.add(record.stableId);
    seenNames.set(nameKey, record.stableId);
    accepted.push(clone(record));
  }

  const acceptedIds = new Set(accepted.map((record) => record.stableId));
  const stillAccepted = [];
  for (const record of accepted) {
    const related = record.relatedContinuityStableId;
    if (!related) {
      stillAccepted.push(record);
      continue;
    }
    const partner = accepted.find((candidate) => candidate.stableId === related);
    if (!partner) {
      rejected.push(reject(record, ["relatedContinuityStableId does not resolve to an accepted record"]));
      acceptedIds.delete(record.stableId);
      continue;
    }
    if (partner.continuity === record.continuity) {
      rejected.push(reject(record, ["relatedContinuityStableId must reference the opposite continuity"]));
      acceptedIds.delete(record.stableId);
      continue;
    }
    stillAccepted.push(record);
  }

  return { accepted: stillAccepted, rejected };
}

function validateRoutes(dataset, acceptedRecords) {
  const rejected = [];
  const accepted = [];
  const acceptedIds = new Set(acceptedRecords.map((record) => record.stableId));
  const seen = new Set();
  for (const route of dataset.routes ?? []) {
    const reasons = validateRouteShape(route);
    if (route?.stableId && seen.has(route.stableId)) reasons.push("duplicate route stableId");
    const missingPlanets = (route?.planetStableIds ?? []).filter((id) => !acceptedIds.has(id));
    if (missingPlanets.length) reasons.push("route.planetStableIds references missing records");
    if (reasons.length) {
      rejected.push(reject(route, reasons));
      continue;
    }
    seen.add(route.stableId);
    accepted.push(clone(route));
  }
  return { accepted, rejected };
}

function assignDocumentIds(records) {
  const used = new Set();
  const ids = new Map();
  for (const record of records) {
    const id = journalDocumentId(record.stableId);
    if (used.has(id)) {
      throw new Error(`Deterministic document id collision for ${record.stableId}`);
    }
    used.add(id);
    ids.set(record.stableId, id);
  }
  return ids;
}

export function generateAstroCom(dataset, options = {}) {
  const worldId = options.worldId ?? "world";
  const packKeys = options.packKeys ?? PACK_KEYS;
  const packScope = options.packScope ?? "world";
  const moduleId = options.moduleId ?? "kakeman89s-datacron";
  const fixture = options.fixture ?? true;
  const collectionOptions = { worldId, packScope, moduleId };
  const merged = mergeDatasets(dataset);
  const recordResult = validateDatasetRecords(merged);
  const routeResult = validateRoutes(merged, recordResult.accepted);
  const rejected = [...recordResult.rejected, ...routeResult.rejected];
  const accepted = recordResult.accepted;
  const routes = routeResult.accepted;
  const routeById = new Map(routes.map((route) => [route.stableId, route]));

  let journalsOnePack = [];
  let journalsTwoPack = [];
  let foldersOnePack = [];
  let foldersTwoPack = [];
  let index = [];
  let status = "failure";

  try {
    if (accepted.length) {
      const ids = assignDocumentIds(accepted);
      foldersOnePack = packKeys.ONE ? buildFolderDocuments(accepted, packKeys.ONE, optionBPath) : [];
      const canonRecords = accepted.filter((record) => record.continuity === "canon");
      const legendsRecords = accepted.filter((record) => record.continuity === "legends");
      foldersTwoPack = [
        ...buildFolderDocuments(canonRecords, packKeys.CANON, optionBPath),
        ...buildFolderDocuments(legendsRecords, packKeys.LEGENDS, optionBPath)
      ];

      journalsOnePack = packKeys.ONE
        ? accepted.map((record) => {
        const routeIds = [...(record.astrography.routes ?? [])];
        const routeNames = routeNamesFor(record, routeById);
        const packKey = packKeys.ONE;
        const _id = ids.get(record.stableId);
        return buildJournalSource(record, {
          _id,
          folder: folderIdForRecord(record, packKey, optionBPath),
          packKey,
          routeNames,
          routeIds,
          fixture,
          uuid: `Compendium.${packCollectionId(packKey, collectionOptions)}.JournalEntry.${_id}`
        });
      })
        : [];

      journalsTwoPack = accepted.map((record) => {
        const routeIds = [...(record.astrography.routes ?? [])];
        const routeNames = routeNamesFor(record, routeById);
        const packKey = packKeyForContinuity(record.continuity, packKeys);
        const _id = ids.get(record.stableId);
        return buildJournalSource(record, {
          _id,
          folder: folderIdForRecord(record, packKey, optionBPath),
          packKey,
          routeNames,
          routeIds,
          fixture,
          uuid: `Compendium.${packCollectionId(packKey, collectionOptions)}.JournalEntry.${_id}`
        });
      });

      index = journalsTwoPack.map((journal, offset) =>
        buildIndexEntry(journal, accepted[offset], routeNamesFor(accepted[offset], routeById))
      );
      status = rejected.length ? "partial" : "success";
    }
  } catch (error) {
    return {
      status: "failure",
      schemaVersion: SCHEMA_VERSION,
      accepted: [],
      rejected: [...rejected, reject({ name: "generator" }, [error.message])],
      journalsOnePack: [],
      journalsTwoPack: [],
      foldersOnePack: [],
      foldersTwoPack: [],
      index: [],
      routes: [],
      folderExperiment: null,
      recommendation: null,
      summary: {
        status: "failure",
        acceptedCount: 0,
        rejectedCount: rejected.length + 1,
        journalCount: 0,
        message: error.message
      }
    };
  }

  const samplePlans = accepted[0] ? folderPlansFor(accepted[0]) : null;
  const recommendation = {
    packArrangement: "separate-canon-and-legends-journal-packs",
    folderPattern: "Region -> Sector -> System",
    packFolderMaxDepth: PACK_FOLDER_MAX_DEPTH,
    worldFolderMaxDepth: WORLD_FOLDER_MAX_DEPTH,
    optionAPackFits: samplePlans?.optionAPack.fits ?? false,
    optionBPackFits: samplePlans?.optionBPack.fits ?? false,
    routesAsFolders: false,
    gridAsFolders: false,
    duplicateCanonicalJournals: false,
    rationale: [
      "Foundry v13 pack folder depth is 3.",
      "Continuity -> Region -> Sector -> System is depth 4 and does not fit a pack.",
      "Separate Canon and Legends packs keep continuity distinct while using Region -> Sector -> System at depth 3.",
      "Grid and route browsing remain metadata indexes pointing at the same canonical journals."
    ]
  };

  const journalCount = journalsTwoPack.length;
  const summary = {
    status,
    acceptedCount: accepted.length,
    rejectedCount: rejected.length,
    journalCount,
    folderCountTwoPack: foldersTwoPack.length,
    routeCount: routes.length,
    message:
      status === "success"
        ? `Generated ${journalCount} journals.`
        : status === "partial"
          ? `Generated ${journalCount} journals. Rejected ${rejected.length} source item(s).`
          : "No journals generated."
  };

  return {
    status,
    schemaVersion: SCHEMA_VERSION,
    accepted,
    rejected,
    journalsOnePack,
    journalsTwoPack,
    foldersOnePack,
    foldersTwoPack,
    index,
    routes,
    folderExperiment: {
      optionA: optionAPath,
      optionAPack: samplePlans?.optionAPack ?? null,
      optionBPack: samplePlans?.optionBPack ?? null,
      gridFolders: false,
      routeFolders: false
    },
    recommendation,
    summary
  };
}

export function stableStringify(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}
