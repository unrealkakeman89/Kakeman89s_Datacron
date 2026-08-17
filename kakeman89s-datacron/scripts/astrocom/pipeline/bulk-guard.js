import { existsSync } from "node:fs";
import { basename, join, normalize } from "node:path";
import { BULK_AUTH_FILE_NAME, BULK_AUTH_RELATIVE_PATH } from "./constants.js";

export function bulkAuthAbsolutePath(moduleRoot) {
  return join(moduleRoot, ...BULK_AUTH_RELATIVE_PATH.split("/"));
}

export function isExactBulkAuthPath(moduleRoot, candidatePath) {
  if (!candidatePath) return false;
  const expected = normalize(bulkAuthAbsolutePath(moduleRoot));
  const actual = normalize(candidatePath);
  return actual === expected && basename(actual) === BULK_AUTH_FILE_NAME;
}

export function assertBulkPackBuildAuthorized({ moduleRoot, bulkFlag = false, authPath = null } = {}) {
  const expected = bulkAuthAbsolutePath(moduleRoot);
  const pathToCheck = authPath ?? expected;
  const fileOk = isExactBulkAuthPath(moduleRoot, pathToCheck) && existsSync(pathToCheck);
  if (bulkFlag === true && fileOk) {
    return { ok: true, status: "authorized", authPath: pathToCheck };
  }
  return {
    ok: false,
    status: "refused",
    message:
      "Full generation was not authorized. Both the exact review/BULK_INGEST_AUTHORIZED.md artifact and an explicit --bulk flag are required. Pilot generation remains available. No full output was created.",
    missingFlag: bulkFlag !== true,
    missingArtifact: !fileOk,
    expectedPath: expected
  };
}
