import { mkdir, readFile, writeFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import { stableStringify } from "../generate.js";
import { completenessMarkdown, summarizeCompleteness } from "./completeness-report.js";
import { moduleRoot } from "./orchestrate.js";

const inputArgument = process.argv[2];
const inputPath = inputArgument
  ? (isAbsolute(inputArgument) ? inputArgument : resolve(process.cwd(), inputArgument))
  : resolve(moduleRoot, "data/sources/astrocom/pilot/phase5-pilot.json");
const source = JSON.parse(await readFile(inputPath, "utf8"));
const unresolvedRoutes = source.routeUnresolved ?? source.unresolvedRoutes ?? [];
const summary = summarizeCompleteness(source.records ?? [], { unresolvedRoutes });
const reviewDir = resolve(moduleRoot, "data/sources/astrocom/review");

await mkdir(reviewDir, { recursive: true });
await writeFile(resolve(reviewDir, "completeness-summary.json"), stableStringify(summary), "utf8");
await writeFile(resolve(reviewDir, "completeness-summary.md"), completenessMarkdown(summary), "utf8");
console.log(JSON.stringify(summary, null, 2));
