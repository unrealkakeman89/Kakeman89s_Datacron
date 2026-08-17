import { mkdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { MODULE_ID } from "../../logger.js";

const FOUNDRY_PACKAGE = "C:/Foundry/V13/App/resources/app/package.json";

function classicLevel() {
  const require = createRequire(FOUNDRY_PACKAGE);
  return require("classic-level");
}

function folderRecord(folder, { fixture = false } = {}) {
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
    },
    description: "",
    sorting: "a",
    sort: 0,
    color: null
  };
}

function journalRecord(journal) {
  return {
    _id: journal._id,
    name: journal.name,
    folder: journal.folder,
    pages: journal.pages.map((page) => page._id),
    flags: journal.flags,
    categories: [],
    sort: 0,
    ownership: { default: 0 }
  };
}

function pageRecord(journal, page) {
  return {
    _id: page._id,
    name: page.name,
    type: page.type,
    title: page.title,
    text: page.text
  };
}

export async function writeFoundryJournalPack(directory, { folders = [], journals = [], fixture = false } = {}) {
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });
  const { ClassicLevel } = classicLevel();
  const db = new ClassicLevel(directory, { keyEncoding: "utf8", valueEncoding: "utf8" });
  await db.open();
  try {
    const ops = [];
    for (const folder of folders) {
      ops.push({ type: "put", key: `!folders!${folder._id}`, value: JSON.stringify(folderRecord(folder, { fixture })) });
    }
    for (const journal of journals) {
      ops.push({ type: "put", key: `!journal!${journal._id}`, value: JSON.stringify(journalRecord(journal)) });
      for (const page of journal.pages ?? []) {
        ops.push({
          type: "put",
          key: `!journal.pages!${journal._id}.${page._id}`,
          value: JSON.stringify(pageRecord(journal, page))
        });
      }
    }
    if (ops.length) await db.batch(ops);
  } finally {
    await db.close();
  }
  return directory;
}

