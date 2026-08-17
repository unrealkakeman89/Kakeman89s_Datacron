import { MODULE_ID } from "../logger.js";

export function summarizeIncremental(previousByStableId, nextJournals) {
  const created = [];
  const updated = [];
  const unchanged = [];
  const nextIds = new Set();
  for (const journal of nextJournals) {
    const stableId = journal.flags?.[MODULE_ID]?.stableId;
    nextIds.add(stableId);
    const prior = previousByStableId.get(stableId);
    if (!prior) {
      created.push(stableId);
      continue;
    }
    if (prior._id === journal._id && prior.name === journal.name) unchanged.push(stableId);
    else updated.push(stableId);
  }
  const removed = [...previousByStableId.keys()].filter((id) => !nextIds.has(id));
  return {
    created: created.length,
    updated: updated.length,
    unchanged: unchanged.length,
    removed: removed.length,
    createdIds: created,
    updatedIds: updated,
    unchangedIds: unchanged,
    removedIds: removed
  };
}
