/**
 * Operation-constrained rollback. Never deletes pre-existing documents.
 */

function idsOf(list) {
  return (list ?? []).map((doc) => doc?.id).filter(Boolean);
}

/**
 * @param {{
 *   operationId: string,
 *   created: { actor?: object|null, folder?: object|null, itemIds?: string[] },
 *   preExisting: { actorIds?: string[], folderIds?: string[], itemIds?: string[] }
 * }} context
 * @param {{
 *   deleteActor?: (id: string) => Promise<unknown>,
 *   deleteFolder?: (id: string) => Promise<unknown>,
 *   failRollback?: boolean
 * }} deps
 */
export async function rollbackCreation(context, deps = {}) {
  const operationId = context.operationId;
  const created = context.created ?? {};
  const preExisting = context.preExisting ?? {};
  const protectedActorIds = new Set(preExisting.actorIds ?? []);
  const protectedFolderIds = new Set(preExisting.folderIds ?? []);
  const remaining = [];
  const deleted = [];
  const errors = [];

  if (deps.failRollback) {
    return {
      ok: false,
      partial: true,
      deleted,
      remaining: [
        created.actor?.id,
        created.folder?.id,
        ...(created.itemIds ?? [])
      ].filter(Boolean),
      errors: ["rollback-injection"]
    };
  }

  const actorId = created.actor?.id ?? null;
  if (actorId) {
    if (protectedActorIds.has(actorId)) {
      errors.push("refused-preexisting-actor");
    } else if (created.actor?.flags?.["kakeman89s-datacron"]?.operationId !== operationId) {
      errors.push("refused-foreign-operation-actor");
      remaining.push(actorId);
    } else if (typeof deps.deleteActor === "function") {
      try {
        await deps.deleteActor(actorId);
        deleted.push(actorId);
      } catch (error) {
        errors.push("actor-delete-failed");
        remaining.push(actorId);
      }
    }
  }

  const folderId = created.folder?.id ?? null;
  if (folderId) {
    if (protectedFolderIds.has(folderId)) {
      errors.push("refused-preexisting-folder");
    } else if (created.folder?.empty === false) {
      errors.push("refused-nonempty-folder");
      remaining.push(folderId);
    } else if (typeof deps.deleteFolder === "function") {
      try {
        await deps.deleteFolder(folderId);
        deleted.push(folderId);
      } catch (_error) {
        errors.push("folder-delete-failed");
        remaining.push(folderId);
      }
    }
  }

  return {
    ok: errors.length === 0 && remaining.length === 0,
    partial: remaining.length > 0,
    deleted,
    remaining,
    errors,
    protectedIds: {
      actors: [...protectedActorIds],
      folders: [...protectedFolderIds],
      items: [...(preExisting.itemIds ?? [])]
    },
    trackedCreated: idsOf([created.actor, created.folder])
  };
}
