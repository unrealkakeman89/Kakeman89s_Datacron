import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateAstroCom, stableStringify } from "./generate.js";
import { mergeDatasets } from "./validate-source.js";

const here = dirname(fileURLToPath(import.meta.url));
const moduleRoot = join(here, "..", "..");
const repoRoot = join(moduleRoot, "..");

export function defaultPaths() {
  return {
    validFixture: join(moduleRoot, "data/sources/astrocom/fixtures/phase4-synthetic.json"),
    invalidFixture: join(moduleRoot, "data/sources/astrocom/fixtures/phase4-synthetic-invalid.json"),
    outputDir: join(moduleRoot, "data/generated/astrocom")
  };
}

export async function readJson(path) {
  const { readFile } = await import("node:fs/promises");
  return JSON.parse(await readFile(path, "utf8"));
}

export async function generateFromDefaultFixtures(options = {}) {
  const paths = defaultPaths();
  const valid = await readJson(paths.validFixture);
  const invalid = await readJson(paths.invalidFixture);
  const dataset = mergeDatasets(valid, invalid);
  return generateAstroCom(dataset, options);
}

export async function writeGeneratedOutput(result, outputDir = defaultPaths().outputDir) {
  await mkdir(outputDir, { recursive: true });
  const files = {
    "summary.json": result.summary,
    "rejected.json": result.rejected,
    "journals-one-pack.json": result.journalsOnePack,
    "journals-two-pack.json": result.journalsTwoPack,
    "folders-one-pack.json": result.foldersOnePack,
    "folders-two-pack.json": result.foldersTwoPack,
    "index.json": result.index,
    "routes.json": result.routes,
    "recommendation.json": result.recommendation
  };
  for (const [name, value] of Object.entries(files)) {
    await writeFile(join(outputDir, name), stableStringify(value), "utf8");
  }
  await writeFile(
    join(outputDir, "README.md"),
    [
      "# Generated AstroCom PoC output",
      "",
      "Do not hand-edit these files.",
      "Modify `data/sources/astrocom/fixtures/` or the generator, then rebuild.",
      "This output is synthetic Phase 4 proof-of-concept data only.",
      ""
    ].join("\n"),
    "utf8"
  );
  return outputDir;
}

const isCli = Boolean(process.argv[1]?.replaceAll("\\", "/").endsWith("scripts/astrocom/cli-generate.js"));
if (isCli) {
  const result = await generateFromDefaultFixtures();
  await writeGeneratedOutput(result);
  const payload = {
    status: result.status,
    acceptedCount: result.summary.acceptedCount,
    rejectedCount: result.summary.rejectedCount,
    journalCount: result.summary.journalCount,
    message: result.summary.message
  };
  console.log(JSON.stringify(payload, null, 2));
  if (result.status === "failure") process.exitCode = 1;
}

export { repoRoot };
