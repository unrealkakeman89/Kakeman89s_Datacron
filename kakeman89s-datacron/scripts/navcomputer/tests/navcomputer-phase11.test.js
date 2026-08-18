import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  REGION_MATRIX_PROFILE_ID,
  REGION_ORDER,
  REGION_TRAVEL_MATRIX,
  hydrateRegionMatrix,
  parseRegionMatrixDocument,
  getCachedRegionMatrix,
  normalizeRegionForLookup,
  planetsAreSameWorld
} from "../region-matrix.js";
import { calculateRouteBasic } from "../../route-calculator.js";
import { calculateNavComputerBasic } from "../calculate-basic.js";
import {
  RESOURCE_PROFILE_EXISTING_UNVERIFIED,
  applyResourceProfile
} from "../resource-profile.js";
import { readStarshipTravelAdapter } from "../../actor-helpers.js";
import { canOpenNavComputer, actorIsVisibleToUser } from "../permissions.js";
import { SETTING_KEYS } from "../../settings.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE_DIR = path.resolve(HERE, "../../..");
const REPO_ROOT = path.resolve(MODULE_DIR, "..");
const MATRIX_JSON = path.join(MODULE_DIR, "data/navcomputer/region-travel-matrix.v1.json");

const EXPECTED_ORDER = [
  "Deep Core",
  "Core",
  "Colonies",
  "Inner Rim",
  "Expansion Region",
  "Mid Rim",
  "Outer Rim",
  "Wild Space",
  "Unknown Regions"
];

const EXPECTED_MATRIX = {
  "Deep Core": {
    "Deep Core": 12,
    Core: 18,
    Colonies: 24,
    "Inner Rim": 48,
    "Expansion Region": 72,
    "Mid Rim": 96,
    "Outer Rim": 120,
    "Wild Space": 144,
    "Unknown Regions": 168
  },
  Core: {
    "Deep Core": 24,
    Core: 6,
    Colonies: 24,
    "Inner Rim": 36,
    "Expansion Region": 60,
    "Mid Rim": 84,
    "Outer Rim": 96,
    "Wild Space": 120,
    "Unknown Regions": 144
  },
  Colonies: {
    "Deep Core": 48,
    Core: 24,
    Colonies: 12,
    "Inner Rim": 24,
    "Expansion Region": 48,
    "Mid Rim": 72,
    "Outer Rim": 96,
    "Wild Space": 120,
    "Unknown Regions": 96
  },
  "Inner Rim": {
    "Deep Core": 72,
    Core: 36,
    Colonies: 24,
    "Inner Rim": 18,
    "Expansion Region": 24,
    "Mid Rim": 48,
    "Outer Rim": 72,
    "Wild Space": 96,
    "Unknown Regions": 72
  },
  "Expansion Region": {
    "Deep Core": 96,
    Core: 60,
    Colonies: 48,
    "Inner Rim": 24,
    "Expansion Region": 24,
    "Mid Rim": 24,
    "Outer Rim": 48,
    "Wild Space": 72,
    "Unknown Regions": 96
  },
  "Mid Rim": {
    "Deep Core": 120,
    Core: 84,
    Colonies: 72,
    "Inner Rim": 48,
    "Expansion Region": 24,
    "Mid Rim": 36,
    "Outer Rim": 24,
    "Wild Space": 48,
    "Unknown Regions": 72
  },
  "Outer Rim": {
    "Deep Core": 144,
    Core: 96,
    Colonies: 96,
    "Inner Rim": 72,
    "Expansion Region": 48,
    "Mid Rim": 24,
    "Outer Rim": 48,
    "Wild Space": 24,
    "Unknown Regions": 60
  },
  "Wild Space": {
    "Deep Core": 168,
    Core: 120,
    Colonies: 120,
    "Inner Rim": 96,
    "Expansion Region": 72,
    "Mid Rim": 48,
    "Outer Rim": 24,
    "Wild Space": 12,
    "Unknown Regions": 120
  },
  "Unknown Regions": {
    "Deep Core": 192,
    Core: 144,
    Colonies: 96,
    "Inner Rim": 72,
    "Expansion Region": 60,
    "Mid Rim": 72,
    "Outer Rim": 96,
    "Wild Space": 120,
    "Unknown Regions": 48
  }
};

const matrixFile = JSON.parse(fs.readFileSync(MATRIX_JSON, "utf8"));
hydrateRegionMatrix(matrixFile);

function planet(name, region, extra = {}) {
  return { name, region, ...extra };
}

function read(rel) {
  return fs.readFileSync(path.join(MODULE_DIR, rel), "utf8");
}

test("matrix file metadata", () => {
  assert.equal(matrixFile.profileId, "region-travel-matrix.v1");
  assert.equal(matrixFile.authority, "unverified");
  assert.equal(matrixFile.units, "hours");
  assert.equal(matrixFile.directional, true);
  assert.deepEqual(matrixFile.regionOrder, EXPECTED_ORDER);
  assert.equal(REGION_MATRIX_PROFILE_ID, "region-travel-matrix.v1");
});

test("matrix dimensions are 9 by 9", () => {
  assert.equal(EXPECTED_ORDER.length, 9);
  assert.equal(Object.keys(matrixFile.matrix).length, 9);
  for (const origin of EXPECTED_ORDER) {
    assert.equal(Object.keys(matrixFile.matrix[origin]).length, 9);
  }
});

for (const origin of EXPECTED_ORDER) {
  for (const dest of EXPECTED_ORDER) {
    test(`matrix cell ${origin} -> ${dest}`, () => {
      assert.equal(
        matrixFile.matrix[origin][dest],
        EXPECTED_MATRIX[origin][dest],
        `${origin} -> ${dest}`
      );
      assert.equal(
        REGION_TRAVEL_MATRIX[origin][dest],
        EXPECTED_MATRIX[origin][dest],
        `runtime ${origin} -> ${dest}`
      );
    });
  }
}

test("matrix directionality Deep Core <-> Core", () => {
  assert.equal(EXPECTED_MATRIX["Deep Core"].Core, 18);
  assert.equal(EXPECTED_MATRIX.Core["Deep Core"], 24);
  assert.notEqual(EXPECTED_MATRIX["Deep Core"].Core, EXPECTED_MATRIX.Core["Deep Core"]);
});

test("same-region diagonals are not uniform", () => {
  assert.equal(EXPECTED_MATRIX.Core.Core, 6);
  assert.equal(EXPECTED_MATRIX.Colonies.Colonies, 12);
  assert.equal(EXPECTED_MATRIX["Unknown Regions"]["Unknown Regions"], 48);
});

test("parsed matrix is frozen", () => {
  const parsed = parseRegionMatrixDocument(matrixFile);
  assert.ok(Object.isFrozen(parsed.matrix));
  assert.ok(Object.isFrozen(parsed.matrix.Core));
  assert.throws(() => {
    parsed.matrix.Core.Core = 0;
  });
});

test("loader rejects malformed documents", () => {
  assert.throws(() => parseRegionMatrixDocument({ ...matrixFile, profileId: "wrong" }));
  assert.throws(() =>
    parseRegionMatrixDocument({
      ...matrixFile,
      regionOrder: EXPECTED_ORDER.slice(0, 8)
    })
  );
  const missingCell = structuredClone(matrixFile);
  delete missingCell.matrix.Core.Colonies;
  assert.throws(() => parseRegionMatrixDocument(missingCell));
  const negative = structuredClone(matrixFile);
  negative.matrix.Core.Core = -1;
  assert.throws(() => parseRegionMatrixDocument(negative));
  const nanDoc = structuredClone(matrixFile);
  nanDoc.matrix.Core.Core = Number.NaN;
  assert.throws(() => parseRegionMatrixDocument(nanDoc));
});

test("hydrate caches the validated document", () => {
  const cached = getCachedRegionMatrix();
  assert.equal(cached.profileId, "region-travel-matrix.v1");
  assert.deepEqual([...REGION_ORDER], EXPECTED_ORDER);
});

test("same-world identity prefers stable ids", () => {
  assert.equal(
    planetsAreSameWorld({ name: "A", id: "1", region: "Core" }, { name: "B", id: "1", region: "Mid Rim" }),
    true
  );
  assert.equal(
    planetsAreSameWorld({ name: "A", id: "1" }, { name: "A", id: "2" }),
    false
  );
});

test("same-world identity uses name+grid+region when no id", () => {
  const a = planet("Noe'ha'on", "Expansion Region", { grid: "K-16" });
  const b = planet("Noe'ha'on", "Expansion Regions", { grid: "K-16" });
  assert.equal(planetsAreSameWorld(a, b), false);
  assert.equal(planetsAreSameWorld(a, { ...a }), true);
});

test("same-world identity falls back to exact name", () => {
  assert.equal(planetsAreSameWorld(planet("Byss", "Deep Core"), planet("Byss", "Deep Core")), true);
  assert.equal(planetsAreSameWorld(planet("Byss", "Deep Core"), planet("Abregado-rae", "Core")), false);
});

test("Byss to Abregado-rae is 18 hours", () => {
  const result = calculateRouteBasic(planet("Byss", "Deep Core"), planet("Abregado-rae", "Core"));
  assert.equal(result.status, "ok");
  assert.equal(result.travelTimeHours, 18);
  assert.equal(result.hyperdriveApplied, false);
  assert.equal(result.matrixHours, 18);
});

test("Abregado-rae to Byss is 24 hours", () => {
  const result = calculateRouteBasic(planet("Abregado-rae", "Core"), planet("Byss", "Deep Core"));
  assert.equal(result.status, "ok");
  assert.equal(result.travelTimeHours, 24);
});

test("same-world Byss is 0 hours and not unsupported", () => {
  const result = calculateRouteBasic(planet("Byss", "Deep Core"), planet("Byss", "Deep Core"));
  assert.equal(result.status, "same-world");
  assert.equal(result.sameWorld, true);
  assert.equal(result.travelTimeHours, 0);
  assert.notEqual(result.status, "unsupported");
});

test("same-region different worlds use the diagonal", () => {
  const result = calculateRouteBasic(planet("Aaeton", "Core"), planet("Aargau", "Core"));
  assert.equal(result.status, "ok");
  assert.equal(result.sameWorld, false);
  assert.equal(result.travelTimeHours, 6);
});

test("Inner RIm normalizes to Inner Rim", () => {
  const norm = normalizeRegionForLookup("Inner RIm");
  assert.equal(norm.lookup, "Inner Rim");
  assert.equal(norm.raw, "Inner RIm");
  assert.equal(norm.changed, true);
  const result = calculateRouteBasic(planet("Eshan", "Inner RIm"), planet("Ambria", "Inner Rim"));
  assert.equal(result.status, "ok");
  assert.equal(result.originLookupRegion, "Inner Rim");
  assert.equal(result.rawOriginRegion, "Inner RIm");
  assert.equal(result.travelTimeHours, 18);
  assert.ok(result.normalizationApplied);
});

test("Outer RIm normalizes to Outer Rim", () => {
  const result = calculateRouteBasic(planet("Lenico IV", "Outer RIm"), planet("Tatooine", "Outer Rim"));
  assert.equal(result.status, "ok");
  assert.equal(result.originLookupRegion, "Outer Rim");
  assert.equal(result.travelTimeHours, 48);
});

test("Hutt Space is unsupported with sentinel 0", () => {
  const result = calculateRouteBasic(planet("Alee", "Hutt Space"), planet("Byss", "Deep Core"));
  assert.equal(result.status, "unsupported");
  assert.equal(result.travelTimeHours, 0);
  assert.equal(result.sameWorld, false);
  assert.equal(result.rawOriginRegion, "Hutt Space");
  assert.ok(result.warnings.length > 0);
});

test("Expansion Regions is unsupported", () => {
  const result = calculateRouteBasic(
    planet("Noe'ha'on", "Expansion Regions"),
    planet("Byss", "Deep Core")
  );
  assert.equal(result.status, "unsupported");
  assert.equal(result.travelTimeHours, 0);
});

test("missing planet name is invalid", () => {
  const result = calculateRouteBasic(null, planet("Byss", "Deep Core"));
  assert.equal(result.status, "invalid");
  assert.equal(result.travelTimeHours, 0);
});

test("unknown region is not silently substituted", () => {
  const result = calculateRouteBasic(planet("Alee", "Hutt Space"), planet("Nal Hutta", "Mid Rim"));
  assert.notEqual(result.originLookupRegion, "Mid Rim");
  assert.equal(result.status, "unsupported");
});

test("resource profile identity is house-rule not RAW", () => {
  assert.equal(RESOURCE_PROFILE_EXISTING_UNVERIFIED.id, "existing-unverified.v1");
  assert.equal(RESOURCE_PROFILE_EXISTING_UNVERIFIED.sourceStatus, "existing-house-rule");
  assert.doesNotMatch(RESOURCE_PROFILE_EXISTING_UNVERIFIED.displayName, /RAW/i);
  assert.equal(RESOURCE_PROFILE_EXISTING_UNVERIFIED.fuelUnit, "Fuel Cells");
  assert.equal(RESOURCE_PROFILE_EXISTING_UNVERIFIED.foodUnit, "Ration Packs");
  assert.equal(RESOURCE_PROFILE_EXISTING_UNVERIFIED.crewFallback, 4);
});

test("resource arithmetic and rounding", () => {
  const applied = applyResourceProfile({
    hours: 18,
    crewSize: 4,
    fuelRate: 1,
    foodRate: 1
  });
  assert.equal(applied.fuelRequired, Math.ceil(18 * 1));
  assert.equal(applied.travelDays, 18 / 24);
  assert.equal(applied.foodRequired, Math.ceil((18 / 24) * 4 * 1));
  assert.equal(applied.suppliesRequired, Math.ceil(applied.foodRequired * 0.5));
  assert.equal(applied.travelDaysDisplay, (Math.round((18 / 24) * 100) / 100).toFixed(2));
  assert.equal(applied.resourceProfileId, "existing-unverified.v1");
});

test("invalid rates fall back to 1 with warning", () => {
  const applied = applyResourceProfile({
    hours: 10,
    crewSize: 4,
    fuelRate: -2,
    foodRate: Number.NaN
  });
  assert.equal(applied.fuelRate, 1);
  assert.equal(applied.foodRate, 1);
  assert.ok(applied.warnings.length >= 1);
});

test("custom nonnegative rates are allowed and labeled", () => {
  const applied = applyResourceProfile({
    hours: 18,
    crewSize: 4,
    fuelRate: 2,
    foodRate: 1
  });
  assert.equal(applied.fuelRequired, Math.ceil(18 * 2));
  assert.equal(applied.fuelRateCustomized, true);
  assert.equal(applied.foodRateCustomized, false);
});

test("crew adapter reads flag deployment then workforce then prepared then vehicle crew", () => {
  const flagDeploy = {
    type: "vehicle",
    flags: {
      sw5e: {
        legacyStarshipActor: {
          type: "starship",
          system: { attributes: { deployment: { crew: { items: ["a", "b"] } } } }
        }
      }
    },
    system: {}
  };
  const deploy = readStarshipTravelAdapter(flagDeploy);
  assert.equal(deploy.crew, 2);
  assert.equal(deploy.crewSource, "flag-deployment");

  const flagMin = {
    type: "vehicle",
    flags: {
      sw5e: {
        legacyStarshipActor: {
          type: "starship",
          system: { attributes: { equip: { size: { crewMinWorkforce: 1.2 } } } }
        }
      }
    },
    system: {}
  };
  const min = readStarshipTravelAdapter(flagMin);
  assert.equal(min.crew, 2);
  assert.equal(min.crewSource, "flag-crewMinWorkforce");

  const prepared = {
    type: "vehicle",
    flags: { sw5e: { legacyStarshipActor: { type: "starship", system: {} } } },
    system: { attributes: { deployment: { crew: { items: ["x"] } } } }
  };
  const prep = readStarshipTravelAdapter(prepared);
  assert.equal(prep.crew, 1);
  assert.equal(prep.crewSource, "prepared-deployment");

  const vehicleCrew = {
    type: "vehicle",
    flags: { sw5e: { legacyStarshipActor: { type: "starship", system: {} } } },
    system: { attributes: { crew: { value: ["u1", "u2", "u3"] } } }
  };
  const veh = readStarshipTravelAdapter(vehicleCrew);
  assert.equal(veh.crew, 3);
  assert.equal(veh.crewSource, "vehicle-crew");
});

test("unresolved crew falls back to 4", () => {
  const blank = {
    type: "vehicle",
    flags: { sw5e: { legacyStarshipActor: { type: "starship", system: {} } } },
    system: {},
    items: []
  };
  const readBlank = readStarshipTravelAdapter(blank);
  assert.equal(readBlank.crew, 4);
  assert.equal(readBlank.crewSource, "profile-default");
  assert.ok(readBlank.warnings.length > 0);
  assert.equal(readBlank.hyperdrive, null);
  assert.equal(readBlank.hyperdriveSource, "unresolved");
  assert.equal(readBlank.fuelCapacity, null);
  assert.equal(readBlank.suppliesCapacity, null);
});

test("null ship uses profile-default crew", () => {
  const readNull = readStarshipTravelAdapter(null);
  assert.equal(readNull.crew, 4);
  assert.equal(readNull.crewSource, "profile-default");
});

test("hyperdrive is read but does not change Basic hours", () => {
  const ship = {
    type: "vehicle",
    flags: {
      sw5e: {
        legacyStarshipActor: {
          type: "starship",
          system: { attributes: { equip: { hyperdrive: { class: 2 } } } }
        }
      }
    },
    system: {},
    items: []
  };
  const adapter = readStarshipTravelAdapter(ship);
  assert.equal(adapter.hyperdrive, 2);
  assert.equal(adapter.hyperdriveSource, "flag-equip");
  const result = calculateNavComputerBasic({
    originPlanet: planet("Byss", "Deep Core"),
    destinationPlanet: planet("Abregado-rae", "Core"),
    shipActor: ship,
    fuelRate: 1,
    foodRate: 1
  });
  assert.equal(result.travelTimeHours, 18);
  assert.equal(result.hyperdriveApplied, false);
  assert.equal(result.hyperdrive, 2);
});

test("unsupported calculation is not a successful journey and does not apply resources", () => {
  const result = calculateNavComputerBasic({
    originPlanet: planet("Alee", "Hutt Space"),
    destinationPlanet: planet("Byss", "Deep Core"),
    shipActor: null,
    fuelRate: 1,
    foodRate: 1
  });
  assert.equal(result.status, "unsupported");
  assert.equal(result.completedJourney, false);
  assert.equal(result.resourcesApplied, false);
  assert.equal(result.fuelRequired, null);
});

test("explanation includes profile ids, rounding, and hyperdrive ignored", () => {
  const result = calculateNavComputerBasic({
    originPlanet: planet("Eshan", "Inner RIm"),
    destinationPlanet: planet("Ambria", "Inner Rim"),
    shipActor: null,
    fuelRate: 1,
    foodRate: 1
  });
  const text = result.explanation.lines.join("\n");
  assert.match(text, /region-travel-matrix\.v1/);
  assert.match(text, /existing-unverified\.v1/);
  assert.match(text, /Inner RIm/);
  assert.match(text, /Inner Rim/);
  assert.match(text, /unverified/i);
  assert.match(text, /ceil/i);
  assert.match(text, /ignored hyperdrive/i);
  assert.match(text, /profile-default/);
  assert.doesNotMatch(text, /\bRAW\b/);
});

test("fuelPerHour 2 changes fuel not hours", () => {
  const result = calculateNavComputerBasic({
    originPlanet: planet("Byss", "Deep Core"),
    destinationPlanet: planet("Abregado-rae", "Core"),
    shipActor: null,
    fuelRate: 2,
    foodRate: 1
  });
  assert.equal(result.travelTimeHours, 18);
  assert.equal(result.fuelRequired, Math.ceil(18 * 2));
});

test("featureNavComputer key exists and calculationMode is not a mode picker", () => {
  assert.equal(SETTING_KEYS.featureNavComputer, "featureNavComputer");
  const settingsSrc = read("scripts/settings.js");
  assert.match(settingsSrc, /featureNavComputer/);
  assert.match(settingsSrc, /requiresReload:\s*true/);
  assert.match(settingsSrc, /calculationMode/);
});

test("player access predicate allows players when enabled", () => {
  assert.equal(canOpenNavComputer({ id: "p1", isGM: false }, { featureEnabled: true }), true);
  assert.equal(canOpenNavComputer({ id: "gm", isGM: true }, { featureEnabled: true }), true);
  assert.equal(canOpenNavComputer({ id: "p1", isGM: false }, { featureEnabled: false }), false);
  assert.equal(canOpenNavComputer(null, { featureEnabled: true }), false);
});

test("actor visibility preserves Foundry observer permission", () => {
  const hidden = {
    name: "Hidden Ship",
    testUserPermission: (user, level) => user.isGM && level === "OBSERVER"
  };
  assert.equal(actorIsVisibleToUser(hidden, { isGM: false, id: "p1" }), false);
  assert.equal(actorIsVisibleToUser(hidden, { isGM: true, id: "gm" }), true);
  const owned = {
    ownership: { p1: 3, default: 0 }
  };
  assert.equal(actorIsVisibleToUser(owned, { isGM: false, id: "p1" }), true);
});

test("Basic UI does not import Advanced calculator", () => {
  const app = read("scripts/datacron-app.js");
  assert.doesNotMatch(app, /calculateRouteAdvanced/);
  assert.doesNotMatch(app, /currentMode\s*=\s*"advanced"/);
});

test("NavComputer modules do not add sockets or create documents", () => {
  const files = [
    "scripts/navcomputer/region-matrix.js",
    "scripts/navcomputer/calculate-basic.js",
    "scripts/navcomputer/resource-profile.js",
    "scripts/navcomputer/permissions.js",
    "scripts/datacron-app.js",
    "scripts/main.js"
  ];
  for (const rel of files) {
    const src = read(rel);
    assert.doesNotMatch(src, /socket\.emit/, rel);
    assert.doesNotMatch(src, /Actor\.create/, rel);
    assert.doesNotMatch(src, /Item\.create/, rel);
    assert.doesNotMatch(src, /ChatMessage\.create/, rel);
  }
});

test("route-calculator does not keep an independent 81-cell copy", () => {
  const src = read("scripts/route-calculator.js");
  assert.doesNotMatch(src, /REGION_TRAVEL_MATRIX\s*=\s*\{/);
  assert.match(src, /navcomputer\/region-matrix\.js/);
});

test("AstroCom, Shipyard, and Droid isolation", () => {
  const navFiles = [
    "scripts/navcomputer/region-matrix.js",
    "scripts/navcomputer/calculate-basic.js",
    "scripts/navcomputer/resource-profile.js",
    "scripts/navcomputer/permissions.js"
  ];
  for (const rel of navFiles) {
    const src = read(rel);
    assert.doesNotMatch(src, /scripts\/shipyard/, rel);
    assert.doesNotMatch(src, /scripts\/astrocom/, rel);
    assert.doesNotMatch(src, /droid-ally/, rel);
    assert.doesNotMatch(src, /calculateBuild/, rel);
  }
  assert.match(read("scripts/droid-ally-app.js"), /DroidAllyApp/);
  assert.match(read("scripts/shipyard/calculate.js"), /export function calculateBuild/);
});

test("SW5e placeholder remains #{VERSION}#", () => {
  const sw5e = path.resolve(REPO_ROOT, "../sw5e-module/module.json");
  if (fs.existsSync(sw5e)) {
    assert.match(fs.readFileSync(sw5e, "utf8"), /#\{VERSION\}#/);
  }
});

test("no personal-name attribution in NavComputer domain", () => {
  const blob =
    read("scripts/navcomputer/region-matrix.js") +
    read("scripts/navcomputer/calculate-basic.js") +
    read("scripts/navcomputer/resource-profile.js") +
    read("scripts/navcomputer/permissions.js") +
    fs.readFileSync(MATRIX_JSON, "utf8");
  assert.doesNotMatch(blob, /\bckauble\b/i);
  assert.doesNotMatch(blob, /Caleb Kauble/);
});

test("visible naming uses NavComputer", () => {
  const lang = read("lang/en.json");
  assert.match(lang, /"OpenHyperspace": "Open NavComputer"/);
  assert.match(lang, /"HyperspaceTitle": "NavComputer"/);
  assert.match(lang, /FeatureNavComputer/);
  assert.match(lang, /house-rule/i);
});
