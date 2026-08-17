import { CONTINUITY_LABEL, PACK_FOLDER_MAX_DEPTH, PACK_KEYS, PRESENCE, PRESENCE_LABEL, WORLD_FOLDER_MAX_DEPTH } from "./constants.js";
import { folderDocumentId } from "./document-id.js";

function folderSegment(field) {
  if (field?.presence === PRESENCE.PRESENT && field.value) return field.value;
  return PRESENCE_LABEL[field?.presence] ?? PRESENCE_LABEL.missing;
}

export function optionAPath(record) {
  return [
    CONTINUITY_LABEL[record.continuity],
    folderSegment(record.astrography.region),
    folderSegment(record.astrography.sector),
    folderSegment(record.astrography.system)
  ];
}

export function optionBPath(record) {
  return [
    folderSegment(record.astrography.region),
    folderSegment(record.astrography.sector),
    folderSegment(record.astrography.system)
  ];
}

export function evaluateFolderDepth(path, maxDepth) {
  return {
    path,
    depth: path.length,
    maxDepth,
    fits: path.length <= maxDepth
  };
}

export function folderPlansFor(record) {
  return {
    optionAWorld: evaluateFolderDepth(optionAPath(record), WORLD_FOLDER_MAX_DEPTH),
    optionAPack: evaluateFolderDepth(optionAPath(record), PACK_FOLDER_MAX_DEPTH),
    optionBPack: evaluateFolderDepth(optionBPath(record), PACK_FOLDER_MAX_DEPTH),
    onePackRecommended: evaluateFolderDepth(optionBPath(record), PACK_FOLDER_MAX_DEPTH)
  };
}

export function packKeyForContinuity(continuity, packKeys = PACK_KEYS) {
  return continuity === "canon" ? packKeys.CANON : packKeys.LEGENDS;
}

export function buildFolderDocuments(records, packKey, pathFn) {
  const folders = [];
  const seen = new Set();
  for (const record of records) {
    const fullPath = pathFn(record);
    for (let depth = 1; depth <= fullPath.length; depth += 1) {
      const slice = fullPath.slice(0, depth);
      const key = `${packKey}:${slice.join("/")}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const parentPath = slice.slice(0, -1);
      folders.push({
        _id: folderDocumentId(packKey, slice),
        name: slice[slice.length - 1],
        type: "JournalEntry",
        folder: parentPath.length ? folderDocumentId(packKey, parentPath) : null,
        packKey,
        path: slice,
        depth: slice.length
      });
    }
  }
  return folders.sort((left, right) => left.path.join("/").localeCompare(right.path.join("/")));
}

export function folderIdForRecord(record, packKey, pathFn) {
  return folderDocumentId(packKey, pathFn(record));
}

export function gridValue(record) {
  return record.astrography?.grid?.presence === PRESENCE.PRESENT ? record.astrography.grid.value : null;
}
