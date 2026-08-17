import { runAnalysis, writeAnalysisReports } from "./orchestrate.js";

const result = await runAnalysis();
await writeAnalysisReports(result);
console.log(JSON.stringify(result.summary, null, 2));
if (!result.summary.continuityNeverAutoApproved) process.exitCode = 1;
