import { generatePilotPacks, realBulkAuthExists } from "./generate-pilot.js";

const bulk = process.argv.includes("--bulk");
const outcome = await generatePilotPacks({ bulk });
const payload = {
  status: outcome.status,
  acceptedCount: outcome.summary?.acceptedCount ?? 0,
  rejectedCount: outcome.summary?.rejectedCount ?? 0,
  journalCount: outcome.summary?.journalCount ?? 0,
  message: outcome.summary?.message,
  realBulkAuthPresent: realBulkAuthExists()
};
console.log(JSON.stringify(payload, null, 2));
if (outcome.status === "failure" || outcome.status === "refused") process.exitCode = 1;
