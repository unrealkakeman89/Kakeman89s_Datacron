import { MODULE_ID, logError, logInfo, logWarn } from "../logger.js";
import { INDEX_FIELDS, PACK_KEYS } from "./constants.js";
import { MODULE_PACK_KEYS, MODULE_PACK_LABELS } from "./pipeline/constants.js";
import { summarizeIncremental } from "./incremental.js";
import {
  ASTROCOM_PILOT_WORLD_ID,
  ASTROCOM_POC_WORLD_ID,
  assertAstroComImmutablePackWorld,
  assertAstroComPilotWorld,
  assertAstroComPocWorld
} from "./runtime-guards.js";

const GENERATED_POC_BASE = `modules/${MODULE_ID}/data/generated/astrocom`;
const GENERATED_PILOT_BASE = `modules/${MODULE_ID}/data/generated/astrocom/pilot`;
const POC_PACK_LABELS = {
  [PACK_KEYS.CANON]: "AstroCom PoC Canon",
  [PACK_KEYS.LEGENDS]: "AstroCom PoC Legends"
};

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`AstroCom generated file missing: ${path}`);
  }
  return response.json();
}

export async function loadGeneratedPoc() {
  const [journals, folders, index, routes, summary, recommendation] = await Promise.all([
    fetchJson(`${GENERATED_POC_BASE}/journals-two-pack.json`),
    fetchJson(`${GENERATED_POC_BASE}/folders-two-pack.json`),
    fetchJson(`${GENERATED_POC_BASE}/index.json`),
    fetchJson(`${GENERATED_POC_BASE}/routes.json`),
    fetchJson(`${GENERATED_POC_BASE}/summary.json`),
    fetchJson(`${GENERATED_POC_BASE}/recommendation.json`)
  ]);
  return { journals, folders, index, routes, summary, recommendation };
}

export async function loadGeneratedPilot() {
  const [journals, folders, index, routes, summary, selection, quarantined] = await Promise.all([
    fetchJson(`${GENERATED_PILOT_BASE}/journals-two-pack.json`),
    fetchJson(`${GENERATED_PILOT_BASE}/folders-two-pack.json`),
    fetchJson(`${GENERATED_PILOT_BASE}/index.json`),
    fetchJson(`${GENERATED_PILOT_BASE}/routes.json`),
    fetchJson(`${GENERATED_PILOT_BASE}/summary.json`),
    fetchJson(`${GENERATED_PILOT_BASE}/pilot-selection.json`),
    fetchJson(`${GENERATED_PILOT_BASE}/quarantined-excluded.json`)
  ]);
  return { journals, folders, index, routes, summary, selection, quarantined };
}

export async function loadGeneratedAstroCom() {
  const worldId = game.world?.id;
  if (worldId === ASTROCOM_POC_WORLD_ID) return loadGeneratedPoc();
  // Pilot JSON backs route lists and status for Phase 5/6 module packs.
  return loadGeneratedPilot();
}

function findPackByLabel(label) {
  return game.packs.find((pack) => pack.metadata?.label === label && pack.documentName === "JournalEntry") ?? null;
}

function findPackByCollection(collection) {
  return game.packs.get(collection) ?? null;
}

/**
 * Prefer shipped module packs (Option A) whenever present.
 * Fall back to Phase 4 PoC world packs only in the PoC world.
 */
export function resolveLivePackTargets(worldId = game.world?.id) {
  const moduleTargets = Object.values(MODULE_PACK_KEYS).map((name) => ({
    kind: "module",
    name,
    label: MODULE_PACK_LABELS[name],
    collection: `${MODULE_ID}.${name}`
  }));
  const foundModule = moduleTargets.filter((target) => findPackByCollection(target.collection) || findPackByLabel(target.label));
  if (foundModule.length > 0) return moduleTargets;

  if (worldId === ASTROCOM_POC_WORLD_ID) {
    return Object.entries(POC_PACK_LABELS).map(([name, label]) => ({
      kind: "world",
      name,
      label,
      collection: null
    }));
  }
  return moduleTargets;
}

async function ensureWorldPack(packKey) {
  const label = POC_PACK_LABELS[packKey];
  const existing = findPackByLabel(label);
  if (existing) return existing;
  return foundry.documents.collections.CompendiumCollection.createCompendium({
    label,
    type: "JournalEntry"
  });
}

async function clearPack(pack) {
  const documentIds = pack.index.contents.map((entry) => entry._id);
  if (documentIds.length) {
    await pack.documentClass.deleteDocuments(documentIds, { pack: pack.collection });
  }
  const folders = [...pack.folders.contents].sort((left, right) => (right.depth ?? 0) - (left.depth ?? 0));
  const folderIds = folders.map((folder) => folder.id);
  if (folderIds.length) {
    await Folder.deleteDocuments(folderIds, { pack: pack.collection });
  }
}

function folderSource(folder, fixture) {
  return {
    _id: folder._id,
    name: folder.name,
    type: "JournalEntry",
    folder: folder.folder,
    flags: {
      [MODULE_ID]: {
        domain: "astrocom",
        kind: "folder",
        fixture
      }
    }
  };
}

function journalCreateData(journal) {
  return {
    _id: journal._id,
    name: journal.name,
    folder: journal.folder,
    pages: journal.pages,
    flags: journal.flags
  };
}

export function normalizeIndexEntry(entry, pack) {
  const raw = entry.flags?.[MODULE_ID] ?? {};
  return {
    _id: entry._id,
    name: entry.name,
    folder: entry.folder ?? null,
    packKey: pack?.metadata?.name ?? null,
    uuid: pack ? pack.getUuid(entry._id) : entry.uuid,
    flags: {
      schemaVersion: raw.schemaVersion ?? null,
      stableId: raw.stableId ?? null,
      continuity: raw.continuity ?? null,
      aliases: raw.aliases ?? [],
      region: raw.region ?? null,
      regionClassifications: raw.regionClassifications ?? [],
      sector: raw.sector ?? null,
      system: raw.system ?? null,
      grid: raw.grid ?? null,
      gridPresence: raw.gridPresence ?? null,
      routes: raw.routes ?? [],
      relatedContinuityStableId: raw.relatedContinuityStableId ?? null,
      conceptualId: raw.conceptualId ?? null,
      classification: raw.classification ?? null
    }
  };
}

export async function loadLiveAstroComIndex() {
  const targets = resolveLivePackTargets();
  const entries = [];
  const requested = [];
  let foundPacks = 0;

  for (const target of targets) {
    const pack = (target.collection && findPackByCollection(target.collection)) || findPackByLabel(target.label);
    requested.push({
      label: target.label,
      collection: target.collection ?? pack?.collection ?? null,
      found: Boolean(pack)
    });
    if (!pack) continue;
    foundPacks += 1;
    const index = await pack.getIndex({ fields: [...INDEX_FIELDS] });
    requested[requested.length - 1].size = index.size;
    for (const entry of index.contents) {
      const normalized = normalizeIndexEntry(entry, pack);
      if (normalized.flags.stableId) entries.push(normalized);
    }
  }

  return {
    entries,
    requested,
    foundPacks,
    requestedPackCount: targets.length
  };
}

function snapshotWorld() {
  return {
    worldId: game.world.id,
    packs: Object.fromEntries(
      [...game.packs].map((pack) => [pack.collection, pack.index.size])
    ),
    journalCount: game.journal?.size ?? 0,
    actorCount: game.actors?.size ?? 0,
    itemCount: game.items?.size ?? 0,
    sceneCount: game.scenes?.size ?? 0
  };
}

export async function rebuildAstroComPoc() {
  if (!game.user?.isGM) {
    logWarn("AstroCom rebuild ignored because the user is not a GM.");
    return { status: "failure", message: "GM only" };
  }

  const worldGuard = assertAstroComPocWorld(game.world?.id);
  if (!worldGuard.ok) {
    logWarn(worldGuard.message);
    return worldGuard;
  }

  const generated = await loadGeneratedPoc();
  if (generated.summary.status === "failure") {
    logError("AstroCom generated summary reports failure.", generated.summary);
    return generated.summary;
  }

  const synthetic = generated.journals.every((journal) => journal.flags?.[MODULE_ID]?.fixture === true);
  if (!synthetic) {
    const message = "AstroCom rebuild refused. Generated journals are not marked as the Phase 4 synthetic fixture.";
    logError(message);
    return { status: "failure", message };
  }

  const preRebuild = snapshotWorld();
  const packs = {
    [PACK_KEYS.CANON]: await ensureWorldPack(PACK_KEYS.CANON),
    [PACK_KEYS.LEGENDS]: await ensureWorldPack(PACK_KEYS.LEGENDS)
  };

  for (const pack of Object.values(packs)) {
    if (!pack.collection.startsWith("world.")) {
      const message = `AstroCom rebuild refused. Pack ${pack.collection} is not a world pack.`;
      logError(message);
      return { status: "failure", message };
    }
    await pack.getIndex();
    await clearPack(pack);
  }

  const folders = [...generated.folders].sort((left, right) => left.depth - right.depth);
  for (const folder of folders) {
    const pack = packs[folder.packKey];
    await Folder.create(folderSource(folder, true), { pack: pack.collection, keepId: true });
  }

  for (const journal of generated.journals) {
    const pack = packs[journal.packKey];
    await pack.documentClass.create(journalCreateData(journal), { pack: pack.collection, keepId: true });
  }

  const live = await loadLiveAstroComIndex();
  logInfo("AstroCom PoC rebuild complete", {
    status: generated.summary.status,
    journals: generated.journals.length,
    rejected: generated.summary.rejectedCount,
    liveIndex: live.entries.length,
    worldId: ASTROCOM_POC_WORLD_ID
  });

  return {
    ...generated.summary,
    worldId: game.world.id,
    liveIndexCount: live.entries.length,
    indexRequest: live.requested,
    packs: Object.fromEntries(
      Object.entries(packs).map(([key, pack]) => [
        key,
        { collection: pack.collection, label: pack.metadata?.label, size: pack.index.size }
      ])
    ),
    preRebuild
  };
}

async function ensureModulePack(packKey) {
  const collection = `${MODULE_ID}.${packKey}`;
  const pack = game.packs.get(collection) ?? findPackByLabel(MODULE_PACK_LABELS[packKey]);
  if (!pack) {
    throw new Error(`AstroCom module pack ${collection} was not discovered.`);
  }
  return pack;
}

export async function rebuildAstroComPilot() {
  if (!game.user?.isGM) {
    logWarn("AstroCom pilot rebuild ignored because the user is not a GM.");
    return { status: "refused", message: "GM only" };
  }

  const worldGuard = assertAstroComPilotWorld(game.world?.id);
  if (!worldGuard.ok) {
    logWarn(worldGuard.message);
    return worldGuard;
  }

  const generated = await loadGeneratedPilot();
  if (generated.summary.status === "failure") {
    logError("AstroCom pilot generated summary reports failure.", generated.summary);
    return { ...generated.summary, status: "failed" };
  }

  const hasFixture = generated.journals.some((journal) => journal.flags?.[MODULE_ID]?.fixture === true);
  if (hasFixture) {
    const message = "AstroCom pilot rebuild refused. Generated journals are marked as synthetic fixtures.";
    logError(message);
    return { status: "refused", message };
  }

  const preRebuild = snapshotWorld();
  const packs = {
    [MODULE_PACK_KEYS.CANON]: await ensureModulePack(MODULE_PACK_KEYS.CANON),
    [MODULE_PACK_KEYS.LEGENDS]: await ensureModulePack(MODULE_PACK_KEYS.LEGENDS)
  };

  for (const pack of Object.values(packs)) {
    if (!pack.collection.startsWith(`${MODULE_ID}.`)) {
      const message = `AstroCom pilot rebuild refused. Pack ${pack.collection} is not a module pack.`;
      logError(message);
      return { status: "refused", message };
    }
    if (pack.locked) {
      await pack.configure({ locked: false });
    }
    await pack.getDocuments();
  }

  const previousByStableId = new Map();
  for (const pack of Object.values(packs)) {
    for (const document of pack.contents) {
      const stableId = document.flags?.[MODULE_ID]?.stableId;
      if (stableId) previousByStableId.set(stableId, { _id: document.id, name: document.name });
    }
  }

  const folders = [...generated.folders].sort((left, right) => left.depth - right.depth);
  for (const folder of folders) {
    const pack = packs[folder.packKey];
    const existing = pack.folders.get(folder._id);
    if (!existing) {
      await Folder.create(folderSource(folder, false), { pack: pack.collection, keepId: true });
    }
  }

  for (const journal of generated.journals) {
    const pack = packs[journal.packKey];
    const existing = pack.get(journal._id);
    if (!existing) {
      await pack.documentClass.create(journalCreateData(journal), { pack: pack.collection, keepId: true });
      continue;
    }
    const existingFolder = existing.folder?.id ?? existing.folder ?? null;
    if (existing.name !== journal.name || existingFolder !== (journal.folder ?? null)) {
      await existing.update({ name: journal.name, folder: journal.folder, flags: journal.flags });
    }
  }

  const generatedIds = new Set(generated.journals.map((journal) => journal._id));
  for (const pack of Object.values(packs)) {
    const extras = pack.contents.filter((document) => {
      return document.flags?.[MODULE_ID]?.domain === "astrocom" && !generatedIds.has(document.id);
    });
    if (extras.length) {
      await pack.documentClass.deleteDocuments(extras.map((document) => document.id), { pack: pack.collection });
    }
  }

  const incremental = summarizeIncremental(previousByStableId, generated.journals);
  const live = await loadLiveAstroComIndex();
  logInfo("AstroCom pilot rebuild complete", {
    status: generated.summary.status,
    journals: generated.journals.length,
    liveIndex: live.entries.length,
    incremental,
    worldId: ASTROCOM_PILOT_WORLD_ID
  });

  return {
    ...generated.summary,
    worldId: game.world.id,
    liveIndexCount: live.entries.length,
    indexRequest: live.requested,
    incremental,
    quarantinedCount: generated.quarantined?.length ?? 0,
    rejectedCount: generated.summary.rejectedCount,
    created: incremental.created,
    updated: incremental.updated,
    unchanged: incremental.unchanged,
    removed: incremental.removed,
    packs: Object.fromEntries(
      Object.entries(packs).map(([key, pack]) => [
        key,
        { collection: pack.collection, label: pack.metadata?.label, size: pack.index.size }
      ])
    ),
    preRebuild,
    postWorld: snapshotWorld()
  };
}

export async function rebuildAstroCom() {
  const worldId = game.world?.id;
  const immutable = assertAstroComImmutablePackWorld(worldId);
  if (!immutable.ok) {
    logWarn(immutable.message);
    return immutable;
  }
  if (worldId === ASTROCOM_POC_WORLD_ID) return rebuildAstroComPoc();
  if (worldId === ASTROCOM_PILOT_WORLD_ID) return rebuildAstroComPilot();
  const message = `AstroCom rebuild refused. Active world is ${worldId ?? "none"}.`;
  logWarn(message);
  return { status: "refused", message };
}

export async function attemptBulkAstroComBuild() {
  const authUrl = `modules/${MODULE_ID}/data/sources/astrocom/review/BULK_INGEST_AUTHORIZED.md`;
  const response = await fetch(authUrl);
  if (response.ok) {
    return {
      status: "refused",
      message: "Full generation was not authorized. An explicit bulk flag is also required, and Phase 5 does not emit full packs."
    };
  }
  return {
    status: "refused",
    message: "Full generation was not authorized. Both the exact review/BULK_INGEST_AUTHORIZED.md artifact and an explicit --bulk flag are required. Pilot generation remains available. No full output was created."
  };
}

export async function openAstroComJournal(uuid) {
  const document = await fromUuid(uuid);
  if (!document) {
    logWarn("AstroCom journal UUID did not resolve", uuid);
    return null;
  }
  await document.sheet?.render(true);
  return document;
}
