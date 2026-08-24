/**
 * Galaxy Map GM-0 offline census.
 * Reads local files only. Does not modify module runtime data or regenerate graphs.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(HERE, "../..");
export const CENSUS_OUTPUT_PATH = path.join(REPO_ROOT, "scripts/output/galaxymap-gm0-census.json");

export const SOURCE_PATHS = {
  modulePlanets: "kakeman89s-datacron/data/planets.json",
  parzivailPlanets: "planets.json",
  xlsx: "docs/Star Wars Galaxy Map Grid Coordinates.xlsx",
  gridDb: "StarWarsMap/map_api/data/grid_db.json",
  regionsDb: "StarWarsMap/map_api/data/regions_db.json",
  hyperlanesDb: "StarWarsMap/map_api/data/hyperlanes_db.json",
  vendoredHyperlanes: "kakeman89s-datacron/data/starwarsmap/hyperlanes_db.json",
  geojson: "hyperspace_singlepart_new.json",
  aliases: "kakeman89s-datacron/data/starwarsmap/planet-name-aliases.json",
  hyperspaceRoutes: "kakeman89s-datacron/data/hyperspace-routes.json",
  jpeg: "docs/Galactic Map.jpg",
  planetsCsv: "StarWarsMap/map_api/data/planets.csv",
  moduleJson: "kakeman89s-datacron/module.json"
};

export const ROUTE_NAME_FIXES = {
  "Corellinan Run": "Corellian Run",
  "Way Of Schesa": "Way of Schesa",
  "Path Of The Houses": "Path of the Houses"
};

export const ISSUE_32_STOPS = ["Triton", "Xagobah", "Kabal", "Sharlissia"];

export const CRS_LOCKED = {
  originWorld: "Coruscant",
  originCoords: [0, 0],
  z: 0,
  jpegIsNotOrigin: true,
  gridAlphabetTransform: "A–X → −11 … +12",
  gridNumberTransform: "1–22 → +8 … −13 (row 1 is +Y / north)",
  gridSide: 100,
  parsecScale: "unmeasured (GM-3)",
  landmarks: {
    Coruscant: [0, 0],
    Tatooine: [644.386, -673.274],
    Naboo: [334.442, -707.231]
  }
};

const SAMPLE = 40;
const FORBIDDEN_MODULE_NAMES = ["galactic map.jpg", "starwars.ttf"];
const FORBIDDEN_MODULE_EXTS = [".tif", ".tiff", ".geotiff"];
const FORBIDDEN_MODULE_DIRS = ["map_ui", "flask", "three.js", "react-three-fiber"];

export function abs(root, rel) {
  return path.join(root, rel);
}

export function fileMeta(root, rel) {
  const full = abs(root, rel);
  if (!fs.existsSync(full)) {
    return { path: rel, present: false, bytes: null };
  }
  const st = fs.statSync(full);
  return { path: rel, present: true, bytes: st.size };
}

export function readJson(root, rel) {
  return JSON.parse(fs.readFileSync(abs(root, rel), "utf8"));
}

export function foldName(raw) {
  return String(raw ?? "").trim().toLowerCase();
}

export function normalizeRouteName(name) {
  const t = String(name ?? "").trim();
  return ROUTE_NAME_FIXES[t] ?? t;
}

export function normalizeGridString(raw) {
  const t = String(raw ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (!t) return "";
  const m = t.match(/^([A-Z]+)[-]?(\d+)$/);
  if (!m) return t;
  return `${m[1]}-${m[2]}`;
}

function aliasLookup(aliases) {
  const map = new Map();
  for (const [from, to] of Object.entries(aliases ?? {})) {
    map.set(foldName(from), String(to).trim());
  }
  return map;
}

function applyAlias(name, aliasMap) {
  const folded = foldName(name);
  if (aliasMap.has(folded)) return aliasMap.get(folded);
  return String(name ?? "").trim();
}

function uniqueAndDupes(names) {
  const counts = new Map();
  for (const n of names) {
    const k = foldName(n);
    if (!k) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const unique = [...counts.keys()];
  const duplicates = [...counts.entries()]
    .filter(([, c]) => c > 1)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return { uniqueCount: unique.length, unique, duplicates };
}

function flattenGridDb(gridDb) {
  const rows = [];
  for (const [grid, list] of Object.entries(gridDb ?? {})) {
    if (!Array.isArray(list)) continue;
    for (const planet of list) {
      rows.push({
        name: planet?.name ?? "",
        grid,
        coords: Array.isArray(planet?.coords) ? planet.coords : null,
        is_canon: planet?.is_canon ?? null
      });
    }
  }
  return rows;
}

function flattenRegionsDb(regionsDb) {
  const rows = [];
  let regionCount = 0;
  let sectorCount = 0;
  for (const [region, sectors] of Object.entries(regionsDb ?? {})) {
    regionCount += 1;
    if (!sectors || typeof sectors !== "object") continue;
    for (const [sector, list] of Object.entries(sectors)) {
      sectorCount += 1;
      if (!Array.isArray(list)) continue;
      for (const planet of list) {
        rows.push({
          name: planet?.name ?? "",
          region,
          sector
        });
      }
    }
  }
  return { rows, regionCount, sectorCount };
}

function nameSet(names) {
  const set = new Map();
  for (const n of names) {
    const folded = foldName(n);
    if (!folded) continue;
    if (!set.has(folded)) set.set(folded, String(n).trim());
  }
  return set;
}

function compareNameSets(leftSet, rightSet, aliasMap, { aliasFrom = "right" } = {}) {
  const exact = [];
  const aliasOnly = [];
  const leftOnly = [];
  const rightOnly = [];

  const rightUsed = new Set();
  const leftUsed = new Set();

  for (const [lk, display] of leftSet) {
    if (rightSet.has(lk)) {
      exact.push(display);
      leftUsed.add(lk);
      rightUsed.add(lk);
    }
  }

  if (aliasFrom === "right") {
    for (const [rk, rDisplay] of rightSet) {
      if (rightUsed.has(rk)) continue;
      const aliased = foldName(applyAlias(rDisplay, aliasMap));
      if (aliased && leftSet.has(aliased) && !leftUsed.has(aliased)) {
        aliasOnly.push({ from: rDisplay, to: leftSet.get(aliased) });
        rightUsed.add(rk);
        leftUsed.add(aliased);
      }
    }
  } else {
    for (const [lk, lDisplay] of leftSet) {
      if (leftUsed.has(lk)) continue;
      const aliased = foldName(applyAlias(lDisplay, aliasMap));
      if (aliased && rightSet.has(aliased) && !rightUsed.has(aliased)) {
        aliasOnly.push({ from: lDisplay, to: rightSet.get(aliased) });
        leftUsed.add(lk);
        rightUsed.add(aliased);
      }
    }
  }

  for (const [lk, display] of leftSet) {
    if (!leftUsed.has(lk)) leftOnly.push(display);
  }
  for (const [rk, display] of rightSet) {
    if (!rightUsed.has(rk)) rightOnly.push(display);
  }

  exact.sort((a, b) => a.localeCompare(b));
  aliasOnly.sort((a, b) => a.from.localeCompare(b.from));
  leftOnly.sort((a, b) => a.localeCompare(b));
  rightOnly.sort((a, b) => a.localeCompare(b));

  return {
    exactCount: exact.length,
    aliasOnlyCount: aliasOnly.length,
    leftOnlyCount: leftOnly.length,
    rightOnlyCount: rightOnly.length,
    exactSample: exact.slice(0, SAMPLE),
    aliasOnly,
    leftOnlySample: leftOnly.slice(0, SAMPLE),
    rightOnlySample: rightOnly.slice(0, SAMPLE)
  };
}

function findByName(rows, name) {
  const want = foldName(name);
  return rows.find((r) => foldName(r.name) === want) ?? null;
}

function hopKey(fromName, toName, routeName, aliasMap) {
  const a = foldName(applyAlias(fromName, aliasMap));
  const b = foldName(applyAlias(toName, aliasMap));
  if (!a || !b || a === b) return null;
  const pair = [a, b].sort();
  return `${pair[0]}\t${pair[1]}::${normalizeRouteName(routeName)}`;
}

function consecutiveHops(stops, routeName, aliasMap) {
  const hops = [];
  let prev = null;
  for (const raw of stops ?? []) {
    const name = String(raw ?? "").trim();
    if (!name) continue;
    if (prev && foldName(applyAlias(prev, aliasMap)) === foldName(applyAlias(name, aliasMap))) {
      continue;
    }
    if (prev) {
      const key = hopKey(prev, name, routeName, aliasMap);
      if (key) hops.push({ key, from: prev, to: name, route: routeName });
    }
    prev = name;
  }
  return hops;
}

function sequencePresent(lists, sequence, aliasMap) {
  const want = sequence.map((s) => foldName(applyAlias(s, aliasMap)));
  for (const stops of lists) {
    const folded = (stops ?? []).map((s) => foldName(applyAlias(s, aliasMap)));
    for (let i = 0; i <= folded.length - want.length; i += 1) {
      if (want.every((w, j) => folded[i + j] === w)) return true;
    }
  }
  return false;
}

function tryXlsxInventory(xlsxPath) {
  const py = [
    "import json, sys",
    "try:",
    "    import openpyxl",
    "except Exception as e:",
    "    print(json.dumps({'parsed': False, 'reason': 'openpyxl unavailable: ' + str(e)}))",
    "    raise SystemExit(0)",
    "p = sys.argv[1]",
    "wb = openpyxl.load_workbook(p, read_only=True, data_only=True)",
    "out = {'parsed': True, 'parser': 'openpyxl', 'sheets': list(wb.sheetnames), 'sheetDetails': [], 'names': [], 'grids': []}",
    "for name in wb.sheetnames:",
    "    ws = wb[name]",
    "    headers = None",
    "    nonempty = 0",
    "    data_rows = 0",
    "    planet_i = grid_i = None",
    "    for i, row in enumerate(ws.iter_rows(values_only=True)):",
    "        vals = list(row)",
    "        if i == 0:",
    "            headers = [str(c).strip() if c is not None else '' for c in vals]",
    "            low = [h.lower() for h in headers]",
    "            planet_i = low.index('planet') if 'planet' in low else None",
    "            grid_i = low.index('grid') if 'grid' in low else None",
    "            continue",
    "        if not any(c is not None and str(c).strip() != '' for c in vals):",
    "            continue",
    "        nonempty += 1",
    "        data_rows += 1",
    "        if planet_i is not None and planet_i < len(vals) and vals[planet_i] is not None:",
    "            nm = str(vals[planet_i]).strip()",
    "            if nm:",
    "                out['names'].append(nm)",
    "                gd = ''",
    "                if grid_i is not None and grid_i < len(vals) and vals[grid_i] is not None:",
    "                    gd = str(vals[grid_i]).strip()",
    "                out['grids'].append({'name': nm, 'grid': gd})",
    "    out['sheetDetails'].append({'name': name, 'headers': headers, 'nonemptyRowsIncludingHeader': nonempty + 1, 'dataRows': data_rows})",
    "wb.close()",
    "print(json.dumps(out))"
  ].join("\n");

  try {
    const stdout = execFileSync("python", ["-c", py, xlsxPath], {
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      windowsHide: true
    });
    return JSON.parse(stdout);
  } catch (err) {
    return {
      parsed: false,
      reason: "present, not parsed in Node",
      error: String(err?.message ?? err)
    };
  }
}

function walkForbidden(moduleRoot) {
  const hits = [];
  const stack = [moduleRoot];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      const rel = path.relative(moduleRoot, full).replaceAll("\\", "/");
      const lower = ent.name.toLowerCase();
      if (ent.isDirectory()) {
        if (FORBIDDEN_MODULE_DIRS.includes(lower)) {
          hits.push({ path: rel, reason: `forbidden directory name: ${ent.name}` });
        }
        if (lower !== "node_modules") stack.push(full);
        continue;
      }
      if (FORBIDDEN_MODULE_NAMES.includes(lower)) {
        hits.push({ path: rel, reason: `forbidden file name: ${ent.name}` });
      }
      const ext = path.extname(lower);
      if (FORBIDDEN_MODULE_EXTS.includes(ext)) {
        hits.push({ path: rel, reason: `forbidden extension: ${ext}` });
      }
    }
  }
  return hits;
}

function sample(list) {
  return Array.isArray(list) ? list.slice(0, SAMPLE) : [];
}

export function runCensus(root = REPO_ROOT) {
  const files = {};
  for (const [key, rel] of Object.entries(SOURCE_PATHS)) {
    files[key] = fileMeta(root, rel);
  }

  const modulePlanets = files.modulePlanets.present ? readJson(root, SOURCE_PATHS.modulePlanets) : [];
  const parzivailPlanets = files.parzivailPlanets.present ? readJson(root, SOURCE_PATHS.parzivailPlanets) : [];
  const gridDb = files.gridDb.present ? readJson(root, SOURCE_PATHS.gridDb) : {};
  const regionsDb = files.regionsDb.present ? readJson(root, SOURCE_PATHS.regionsDb) : {};
  const hyperlanesDb = files.hyperlanesDb.present ? readJson(root, SOURCE_PATHS.hyperlanesDb) : {};
  const vendoredHyperlanes = files.vendoredHyperlanes.present
    ? readJson(root, SOURCE_PATHS.vendoredHyperlanes)
    : {};
  const geojson = files.geojson.present ? readJson(root, SOURCE_PATHS.geojson) : { features: [] };
  const aliasDoc = files.aliases.present ? readJson(root, SOURCE_PATHS.aliases) : { aliases: {} };
  const hyperspaceDoc = files.hyperspaceRoutes.present
    ? readJson(root, SOURCE_PATHS.hyperspaceRoutes)
    : { routes: [] };
  const moduleJsonText = files.moduleJson.present
    ? fs.readFileSync(abs(root, SOURCE_PATHS.moduleJson), "utf8")
    : "";

  const aliasMap = aliasLookup(aliasDoc.aliases ?? {});
  const gridRows = flattenGridDb(gridDb);
  const regions = flattenRegionsDb(regionsDb);
  const moduleNames = Array.isArray(modulePlanets) ? modulePlanets.map((p) => p?.name ?? "") : [];
  const parzivailNames = Array.isArray(parzivailPlanets)
    ? parzivailPlanets.map((p) => p?.Name ?? p?.name ?? "")
    : [];
  const gridNames = gridRows.map((p) => p.name);
  const regionNames = regions.rows.map((p) => p.name);

  const moduleDup = uniqueAndDupes(moduleNames);
  const parzivailDup = uniqueAndDupes(parzivailNames);
  const gridDup = uniqueAndDupes(gridNames);
  const regionDup = uniqueAndDupes(regionNames);

  const xlsx = files.xlsx.present
    ? tryXlsxInventory(abs(root, SOURCE_PATHS.xlsx))
    : { parsed: false, reason: "file absent" };
  const xlsxNames = xlsx.parsed ? xlsx.names : [];
  const xlsxDup = uniqueAndDupes(xlsxNames);

  const moduleSet = nameSet(moduleNames);
  const parzivailSet = nameSet(parzivailNames);
  const gridSet = nameSet(gridNames);
  const xlsxSet = nameSet(xlsxNames);

  const nameOverlap = {
    moduleVsGrid: compareNameSets(moduleSet, gridSet, aliasMap, { aliasFrom: "right" }),
    moduleVsParzivail: compareNameSets(moduleSet, parzivailSet, aliasMap, { aliasFrom: "right" }),
    parzivailVsGrid: compareNameSets(parzivailSet, gridSet, aliasMap, { aliasFrom: "right" }),
    moduleVsXlsx: xlsx.parsed
      ? compareNameSets(moduleSet, xlsxSet, aliasMap, { aliasFrom: "right" })
      : { parsed: false }
  };

  const moduleByFold = new Map();
  for (const p of Array.isArray(modulePlanets) ? modulePlanets : []) {
    const k = foldName(p?.name);
    if (k && !moduleByFold.has(k)) moduleByFold.set(k, p);
  }
  const gridByFold = new Map();
  for (const p of gridRows) {
    const k = foldName(p.name);
    if (k && !gridByFold.has(k)) gridByFold.set(k, p);
  }
  const parzivailByFold = new Map();
  for (const p of Array.isArray(parzivailPlanets) ? parzivailPlanets : []) {
    const k = foldName(p?.Name ?? p?.name);
    if (k && !parzivailByFold.has(k)) parzivailByFold.set(k, p);
  }
  const xlsxByFold = new Map();
  for (const p of xlsx.grids ?? []) {
    const k = foldName(p.name);
    if (k && !xlsxByFold.has(k)) xlsxByFold.set(k, p);
  }

  const gridConflicts = [];
  const overlapKeys = new Set();
  for (const k of moduleByFold.keys()) {
    if (gridByFold.has(k) || parzivailByFold.has(k) || xlsxByFold.has(k)) overlapKeys.add(k);
  }
  for (const [from, to] of aliasMap) {
    const left = foldName(to);
    if (moduleByFold.has(left) && gridByFold.has(from)) overlapKeys.add(left);
  }

  function gridRowForModuleKey(k) {
    if (gridByFold.has(k)) return gridByFold.get(k);
    for (const [from, to] of aliasMap) {
      if (foldName(to) === k && gridByFold.has(from)) return gridByFold.get(from);
    }
    return null;
  }

  for (const k of overlapKeys) {
    const mod = moduleByFold.get(k);
    const sw = gridRowForModuleKey(k);
    const parz = parzivailByFold.get(k);
    const sheet = xlsxByFold.get(k);
    const grids = {
      module: mod?.grid ?? null,
      starwarsmap: sw?.grid ?? null,
      parzivail: parz?.Coord ?? parz?.coord ?? null,
      xlsx: sheet?.grid ?? null
    };
    const normalized = {
      module: normalizeGridString(grids.module),
      starwarsmap: normalizeGridString(grids.starwarsmap),
      parzivail: normalizeGridString(grids.parzivail),
      xlsx: normalizeGridString(grids.xlsx)
    };
    const present = Object.values(normalized).filter(Boolean);
    const uniqueGrids = [...new Set(present)];
    if (uniqueGrids.length > 1) {
      gridConflicts.push({
        name: mod?.name ?? sw?.name ?? k,
        grids,
        normalized,
        uniqueGrids
      });
    }
  }
  gridConflicts.sort((a, b) => a.name.localeCompare(b.name));
  const coruscantConflict = gridConflicts.find((c) => foldName(c.name) === "coruscant") ?? null;

  const landmarks = {};
  for (const [name, expected] of Object.entries(CRS_LOCKED.landmarks)) {
    const row = findByName(gridRows, name);
    const coords = row?.coords ?? null;
    landmarks[name] = {
      expected,
      observed: coords,
      matches:
        Array.isArray(coords)
        && coords.length >= 2
        && Number(coords[0]) === expected[0]
        && Number(coords[1]) === expected[1]
    };
  }

  const hyperlaneKeys = Object.keys(hyperlanesDb);
  const hyperlaneStopCounts = hyperlaneKeys
    .map((key) => ({ name: key, stops: Array.isArray(hyperlanesDb[key]) ? hyperlanesDb[key].length : 0 }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const knownTypos = Object.keys(ROUTE_NAME_FIXES).filter((k) => Object.hasOwn(hyperlanesDb, k));
  const issue32 = {
    stops: ISSUE_32_STOPS,
    consecutiveSequenceInHyperlanes: sequencePresent(Object.values(hyperlanesDb), ISSUE_32_STOPS, aliasMap),
    namesPresent: Object.fromEntries(
      ISSUE_32_STOPS.map((n) => [
        n,
        Object.values(hyperlanesDb).some((stops) =>
          (stops ?? []).some((s) => foldName(applyAlias(s, aliasMap)) === foldName(n))
        )
      ])
    )
  };

  const vendoredEqual = JSON.stringify(hyperlanesDb) === JSON.stringify(vendoredHyperlanes);

  const swHops = [];
  for (const [routeName, stops] of Object.entries(hyperlanesDb)) {
    swHops.push(...consecutiveHops(stops, routeName, aliasMap));
  }
  const dcRoutes = Array.isArray(hyperspaceDoc.routes) ? hyperspaceDoc.routes : [];
  const dcHops = [];
  for (const route of dcRoutes) {
    const key = hopKey(route?.from, route?.to, route?.name, aliasMap);
    if (key) dcHops.push({ key, from: route.from, to: route.to, route: route.name });
  }
  const swHopSet = new Set(swHops.map((h) => h.key));
  const dcHopSet = new Set(dcHops.map((h) => h.key));
  const shared = [...swHopSet].filter((k) => dcHopSet.has(k)).sort();
  const swOnly = [...swHopSet].filter((k) => !dcHopSet.has(k)).sort();
  const dcOnly = [...dcHopSet].filter((k) => !swHopSet.has(k)).sort();

  let syntheticTrue = 0;
  let syntheticFalse = 0;
  let syntheticMissing = 0;
  let essentialTrue = 0;
  let essentialFalse = 0;
  let essentialMissing = 0;
  for (const route of dcRoutes) {
    if (route?.syntheticHop === true) syntheticTrue += 1;
    else if (route?.syntheticHop === false) syntheticFalse += 1;
    else syntheticMissing += 1;
    if (route?.essentialConnectivity === true) essentialTrue += 1;
    else if (route?.essentialConnectivity === false) essentialFalse += 1;
    else essentialMissing += 1;
  }

  const features = Array.isArray(geojson.features) ? geojson.features : [];
  let namedHyperspace = 0;
  let unnamedHyperspace = 0;
  const namedLaneValues = new Set();
  for (const feat of features) {
    const hyp = feat?.properties?.hyperspace;
    if (hyp == null || String(hyp).trim() === "") unnamedHyperspace += 1;
    else {
      namedHyperspace += 1;
      namedLaneValues.add(String(hyp).trim());
    }
  }

  const moduleRoot = abs(root, "kakeman89s-datacron");
  const packageHits = walkForbidden(moduleRoot);
  const jpegInModuleJson = moduleJsonText.includes("Galactic Map.jpg");

  return {
    schema: "galaxymap-gm0-census.v1",
    generatedAt: new Date().toISOString(),
    files,
    counts: {
      modulePlanets: Array.isArray(modulePlanets) ? modulePlanets.length : 0,
      parzivailPlanets: Array.isArray(parzivailPlanets) ? parzivailPlanets.length : 0,
      gridDbPlanets: gridRows.length,
      gridDbCells: Object.keys(gridDb).length,
      regionsDbPlanets: regions.rows.length,
      regionsDbRegions: regions.regionCount,
      regionsDbSectors: regions.sectorCount,
      hyperlaneKeys: hyperlaneKeys.length,
      hyperspaceRouteEdges: dcRoutes.length,
      geojsonFeatures: features.length,
      xlsxDataRows: xlsx.parsed ? xlsx.sheetDetails?.[0]?.dataRows ?? null : null,
      jpegPresent: files.jpeg.present,
      planetsCsvPresent: files.planetsCsv.present
    },
    duplicates: {
      module: moduleDup.duplicates,
      parzivail: parzivailDup.duplicates,
      gridDb: gridDup.duplicates,
      regionsDb: regionDup.duplicates,
      xlsx: xlsxDup.duplicates
    },
    uniqueNameCounts: {
      module: moduleDup.uniqueCount,
      parzivail: parzivailDup.uniqueCount,
      gridDb: gridDup.uniqueCount,
      regionsDb: regionDup.uniqueCount,
      xlsx: xlsxDup.uniqueCount
    },
    aliases: aliasDoc.aliases ?? {},
    nameOverlap,
    gridConflicts: {
      count: gridConflicts.length,
      coruscant: coruscantConflict,
      sample: sample(gridConflicts),
      all: gridConflicts
    },
    crs: {
      locked: CRS_LOCKED,
      landmarks,
      originIsCoruscantNotJpegCore: true
    },
    hyperlanes: {
      keyCount: hyperlaneKeys.length,
      keys: hyperlaneStopCounts,
      knownTyposPresent: knownTypos,
      issue32,
      vendoredByteEqual: vendoredEqual,
      vendoredPresent: files.vendoredHyperlanes.present
    },
    hops: {
      starwarsmapCount: swHopSet.size,
      datacronCount: dcHopSet.size,
      sharedCount: shared.length,
      starwarsmapOnlyCount: swOnly.length,
      datacronOnlyCount: dcOnly.length,
      sharedSample: sample(shared),
      starwarsmapOnlySample: sample(swOnly),
      datacronOnlySample: sample(dcOnly),
      syntheticHop: { true: syntheticTrue, false: syntheticFalse, missing: syntheticMissing },
      essentialConnectivity: {
        true: essentialTrue,
        false: essentialFalse,
        missing: essentialMissing
      },
      graphNotRegenerated: true
    },
    geojson: {
      featureCount: features.length,
      namedHyperspace,
      unnamedHyperspace,
      distinctNamedLanes: [...namedLaneValues].sort(),
      distinctNamedLaneCount: namedLaneValues.size
    },
    xlsx,
    provenance: {
      jpegInModuleJson,
      jpegInModuleTreeHits: packageHits.filter((h) => h.path.toLowerCase().includes("galactic map")),
      packageExclusionHits: packageHits,
      planetsCsvExpectedAbsent: true
    }
  };
}

export function writeCensus(census, outPath = CENSUS_OUTPUT_PATH) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const json = JSON.stringify(census, null, 2);
  fs.writeFileSync(outPath, `${json}\n`, "utf8");
  return outPath;
}

export function requiredLiveAssertions(root = REPO_ROOT) {
  const gridDb = readJson(root, SOURCE_PATHS.gridDb);
  const rows = flattenGridDb(gridDb);
  const coruscant = findByName(rows, "Coruscant");
  const tatooine = findByName(rows, "Tatooine");
  const hyperlanes = readJson(root, SOURCE_PATHS.hyperlanesDb);
  const moduleJsonText = fs.readFileSync(abs(root, SOURCE_PATHS.moduleJson), "utf8");
  return {
    coruscantCoords: coruscant?.coords ?? null,
    tatooineCoords: tatooine?.coords ?? null,
    hyperlaneKeyCount: Object.keys(hyperlanes).length,
    jpegListedInModuleJson: moduleJsonText.includes("Galactic Map.jpg")
  };
}

function isMain() {
  const self = fileURLToPath(import.meta.url);
  const argv1 = process.argv[1] ? path.resolve(process.argv[1]) : "";
  return path.normalize(self).toLowerCase() === path.normalize(argv1).toLowerCase();
}

if (isMain()) {
  const census = runCensus();
  const out = writeCensus(census);
  process.stdout.write(`Wrote ${out}\n`);
}
