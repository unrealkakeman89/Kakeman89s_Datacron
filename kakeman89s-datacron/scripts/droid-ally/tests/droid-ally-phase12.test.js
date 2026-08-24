import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DROID_CLASS_PRESETS,
  calculateDroidAllyPrice,
  defaultDroidAllyInput,
  formatCredits,
  getDroidClassPreset
} from "../../droid-ally-pricing.js";
import {
  canCalculateDroidAllyPricing,
  canOpenDroidAllyPricing,
  canQuoteDroidAllyPricing
} from "../permissions.js";
import { buildDroidAllyQuoteHtml, escapeHtml } from "../quote.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE_ROOT = path.resolve(HERE, "../../../");
const REPO_ROOT = path.resolve(MODULE_ROOT, "..");

function read(rel) {
  return fs.readFileSync(path.join(MODULE_ROOT, rel), "utf8");
}

function amount(result, key) {
  return result.lineItems.find((row) => row.key === key)?.amount;
}

const DEFAULT_FINALS = {
  "class-i": { rank: 1, subtotal: 2000, finalCost: 1000 },
  "class-ii": { rank: 2, subtotal: 3000, finalCost: 1500 },
  "class-iii": { rank: 3, subtotal: 4000, finalCost: 2000 },
  "class-iv": { rank: 4, subtotal: 5000, finalCost: 2500 },
  "class-v": { rank: 5, subtotal: 6000, finalCost: 3000 },
  tracker: { rank: 2, subtotal: 3000, finalCost: 1500 },
  custom: { rank: 1, subtotal: 2000, finalCost: 1000 }
};

test("seven presets exist and have no Tier VI", () => {
  assert.equal(DROID_CLASS_PRESETS.length, 7);
  const ids = DROID_CLASS_PRESETS.map((p) => p.id);
  assert.deepEqual(ids, [
    "class-i",
    "class-ii",
    "class-iii",
    "class-iv",
    "class-v",
    "tracker",
    "custom"
  ]);
  assert.equal(
    DROID_CLASS_PRESETS.some((p) => /tier/i.test(p.id) || p.chassisCostRank === 6),
    false
  );
});

for (const [id, expected] of Object.entries(DEFAULT_FINALS)) {
  test(`preset ${id} default level-1 zero-adders`, () => {
    const raw = { droidClass: id };
    const result = calculateDroidAllyPrice(raw);
    assert.equal(result.ok, true);
    assert.equal(result.preset.id, id);
    assert.equal(result.chassisCostRank, expected.rank);
    assert.equal(result.baseChassisCost, expected.rank * 1000);
    assert.equal(result.subtotal, expected.subtotal);
    assert.equal(result.finalCost, expected.finalCost);
    assert.equal(result.divisor, 2);
    assert.equal(result.rounding, "Math.floor(subtotal / 2)");
    assert.equal(amount(result, "levelCost"), 1000);
  });
}

test("unknown preset falls back to Class II with warning", () => {
  const result = calculateDroidAllyPrice({ droidClass: "class-ix" });
  assert.equal(result.preset.id, "class-ii");
  assert.equal(result.requestedPresetId, "class-ix");
  assert.equal(result.chassisCostRank, 2);
  assert.equal(result.finalCost, 1500);
  assert.equal(result.status, "warning");
  assert.ok(result.warnings.some((w) => /unknown/i.test(w)));
  assert.match(result.explanation.lines.join("\n"), /class-ix/);
  assert.match(result.explanation.lines.join("\n"), /class-ii/i);
});

test("missing preset uses Class II without unknown warning", () => {
  const result = calculateDroidAllyPrice({});
  assert.equal(result.preset.id, "class-ii");
  assert.equal(result.finalCost, 1500);
  assert.equal(result.warnings.some((w) => /unknown/i.test(w)), false);
});

test("minimum valid input matches defaults", () => {
  const defaults = defaultDroidAllyInput();
  const result = calculateDroidAllyPrice(defaults);
  assert.equal(result.preset.id, "class-ii");
  assert.equal(result.finalCost, 1500);
  assert.deepEqual(result.normalizedInput.droidClass, "class-ii");
});

test("zero adders with companion level 0", () => {
  const result = calculateDroidAllyPrice({
    droidClass: "class-ii",
    companionLevel: 0
  });
  assert.equal(result.baseChassisCost, 2000);
  assert.equal(amount(result, "levelCost"), 0);
  assert.equal(result.subtotal, 2000);
  assert.equal(result.finalCost, 1000);
});

test("systems adder is credits as-is", () => {
  const result = calculateDroidAllyPrice({
    droidClass: "class-i",
    companionLevel: 0,
    systemsCost: 250
  });
  assert.equal(amount(result, "systemsCost"), 250);
  assert.equal(result.subtotal, 1250);
  assert.equal(result.finalCost, 625);
});

test("multiple systems values stay GM-entered credits", () => {
  const a = calculateDroidAllyPrice({ droidClass: "class-i", companionLevel: 0, systemsCost: 1 });
  const b = calculateDroidAllyPrice({ droidClass: "class-i", companionLevel: 0, systemsCost: 2 });
  assert.equal(amount(a, "systemsCost"), 1);
  assert.equal(amount(b, "systemsCost"), 2);
});

test("positive ability modifier", () => {
  const result = calculateDroidAllyPrice({
    droidClass: "class-i",
    companionLevel: 0,
    abilityModifierTotal: 3
  });
  assert.equal(amount(result, "abilityCost"), 3000);
  assert.equal(result.subtotal, 4000);
  assert.equal(result.finalCost, 2000);
});

test("negative ability modifier does not reduce other lines", () => {
  const result = calculateDroidAllyPrice({
    droidClass: "class-i",
    companionLevel: 0,
    abilityModifierTotal: -4
  });
  assert.equal(result.normalizedInput.abilityModifierTotal, -4);
  assert.equal(amount(result, "abilityCost"), 0);
  assert.equal(result.subtotal, 1000);
  assert.equal(result.finalCost, 500);
});

test("trait and protocol count share the 2000 multiplier", () => {
  const result = calculateDroidAllyPrice({
    droidClass: "class-i",
    companionLevel: 0,
    traitProtocolCount: 2
  });
  assert.equal(amount(result, "traitProtocolCost"), 4000);
});

test("skill and tool count share the 500 multiplier", () => {
  const result = calculateDroidAllyPrice({
    droidClass: "class-i",
    companionLevel: 0,
    trainedSkillToolCount: 3
  });
  assert.equal(amount(result, "proficiencyCost"), 1500);
});

test("feat count uses 1000 multiplier", () => {
  const result = calculateDroidAllyPrice({
    droidClass: "class-i",
    companionLevel: 0,
    featUpgradeCount: 2
  });
  assert.equal(amount(result, "featOrUpgradeCost"), 2000);
});

test("companion level uses 1000 multiplier", () => {
  const result = calculateDroidAllyPrice({
    droidClass: "class-i",
    companionLevel: 4
  });
  assert.equal(amount(result, "levelCost"), 4000);
});

test("combined adders", () => {
  const result = calculateDroidAllyPrice({
    droidClass: "class-iii",
    companionLevel: 2,
    systemsCost: 100,
    abilityModifierTotal: 1,
    traitProtocolCount: 1,
    trainedSkillToolCount: 2,
    featUpgradeCount: 1
  });
  assert.equal(result.baseChassisCost, 3000);
  assert.equal(result.subtotal, 3000 + 100 + 1000 + 2000 + 1000 + 1000 + 2000);
  assert.equal(result.finalCost, Math.floor(result.subtotal / 2));
});

test("odd subtotal floors", () => {
  const result = calculateDroidAllyPrice({
    droidClass: "class-i",
    companionLevel: 0,
    systemsCost: 1
  });
  assert.equal(result.subtotal, 1001);
  assert.equal(result.finalCost, 500);
  assert.match(result.explanation.lines.join("\n"), /Math\.floor/);
});

test("even subtotal divides exactly", () => {
  const result = calculateDroidAllyPrice({
    droidClass: "class-i",
    companionLevel: 0
  });
  assert.equal(result.subtotal, 1000);
  assert.equal(result.finalCost, 500);
});

test("fractional counts floor", () => {
  const result = calculateDroidAllyPrice({
    droidClass: "class-i",
    companionLevel: 1.9,
    traitProtocolCount: 1.2,
    systemsCost: 10.8
  });
  assert.equal(result.normalizedInput.companionLevel, 1);
  assert.equal(result.normalizedInput.traitProtocolCount, 1);
  assert.equal(result.normalizedInput.systemsCost, 10);
});

test("negative counts clamp to zero", () => {
  const result = calculateDroidAllyPrice({
    droidClass: "class-i",
    companionLevel: -3,
    systemsCost: -10,
    traitProtocolCount: -1,
    trainedSkillToolCount: -2,
    featUpgradeCount: -4
  });
  assert.equal(result.normalizedInput.companionLevel, 0);
  assert.equal(result.normalizedInput.systemsCost, 0);
  assert.equal(result.normalizedInput.traitProtocolCount, 0);
  assert.equal(result.normalizedInput.trainedSkillToolCount, 0);
  assert.equal(result.normalizedInput.featUpgradeCount, 0);
});

test("nonfinite values use fallbacks", () => {
  const result = calculateDroidAllyPrice({
    droidClass: "class-ii",
    companionLevel: Number.NaN,
    systemsCost: Infinity,
    abilityModifierTotal: -Infinity
  });
  assert.equal(result.normalizedInput.companionLevel, 1);
  assert.equal(result.normalizedInput.systemsCost, 0);
  assert.equal(result.normalizedInput.abilityModifierTotal, 0);
});

test("numeric strings are accepted", () => {
  const result = calculateDroidAllyPrice({
    droidClass: "class-i",
    companionLevel: "2",
    systemsCost: "40"
  });
  assert.equal(result.normalizedInput.companionLevel, 2);
  assert.equal(result.normalizedInput.systemsCost, 40);
});

test("empty string companion level becomes 0", () => {
  const result = calculateDroidAllyPrice({
    droidClass: "class-i",
    companionLevel: ""
  });
  assert.equal(result.normalizedInput.companionLevel, 0);
});

test("null and undefined input use defaults", () => {
  const a = calculateDroidAllyPrice(null);
  const b = calculateDroidAllyPrice(undefined);
  assert.equal(a.preset.id, "class-ii");
  assert.equal(b.preset.id, "class-ii");
  assert.equal(a.finalCost, 1500);
  assert.equal(b.finalCost, 1500);
});

test("input immutability", () => {
  const raw = {
    droidClass: "class-i",
    companionLevel: 2,
    systemsCost: 5
  };
  const frozen = { ...raw };
  calculateDroidAllyPrice(raw);
  assert.deepEqual(raw, frozen);
});

test("determinism", () => {
  const input = {
    droidClass: "tracker",
    companionLevel: 3,
    featUpgradeCount: 1
  };
  const a = calculateDroidAllyPrice(input);
  const b = calculateDroidAllyPrice(input);
  assert.equal(a.finalCost, b.finalCost);
  assert.deepEqual(a.normalizedInput, b.normalizedInput);
  assert.deepEqual(a.explanation.lines, b.explanation.lines);
});

test("structured line items and explanation", () => {
  const result = calculateDroidAllyPrice({ droidClass: "custom", companionLevel: 1 });
  assert.ok(Array.isArray(result.lineItems));
  assert.ok(result.explanation.lines.some((line) => /custom/i.test(line)));
  assert.ok(result.explanation.lines.some((line) => /rank/i.test(line)));
  assert.ok(result.explanation.lines.some((line) => /1000/.test(line)));
  assert.ok(result.explanation.lines.some((line) => /subtotal/i.test(line)));
  assert.ok(result.explanation.lines.some((line) => /final/i.test(line)));
});

test("custom uses rank 1; extra chassisCostRank on input is ignored", () => {
  const result = calculateDroidAllyPrice({
    droidClass: "custom",
    chassisCostRank: 9,
    companionLevel: 0
  });
  assert.equal(result.chassisCostRank, 1);
  assert.equal(result.baseChassisCost, 1000);
});

test("no 10 percent markup or condition modifier", () => {
  const src = read("scripts/droid-ally-pricing.js");
  assert.doesNotMatch(src, /0\.1(?:0)?/);
  assert.doesNotMatch(src, /markup/i);
  assert.doesNotMatch(src, /condition/i);
  const result = calculateDroidAllyPrice({ droidClass: "class-v", companionLevel: 1 });
  assert.equal(result.finalCost, 3000);
  assert.equal(Object.hasOwn(result.normalizedInput, "condition"), false);
});

test("pricing domain has no Foundry global", () => {
  const src = read("scripts/droid-ally-pricing.js");
  assert.doesNotMatch(src, /\bgame\./);
  assert.doesNotMatch(src, /\bfoundry\./);
});

test("UI and quote contain no pricing arithmetic", () => {
  const app = read("scripts/droid-ally-app.js");
  const tpl = read("templates/droid-ally-pricing.hbs");
  const quote = read("scripts/droid-ally/quote.js");
  for (const src of [app, tpl, quote]) {
    assert.doesNotMatch(src, /Math\.floor\s*\(\s*subtotal/);
    assert.doesNotMatch(src, /chassisCostRank\s*\*\s*1000/);
  }
  assert.match(app, /calculateDroidAllyPrice/);
});

test("ChatMessage formatter does not recalculate", () => {
  const quote = read("scripts/droid-ally/quote.js");
  assert.doesNotMatch(quote, /calculateDroidAllyPrice/);
  const result = calculateDroidAllyPrice({ droidClass: "class-i", droidName: "R2" });
  const html = buildDroidAllyQuoteHtml(result, (key) => key);
  assert.match(html, /1000/);
  assert.doesNotMatch(html, /RAW/i);
  assert.doesNotMatch(html, /Tier VI/i);
});

test("ChatMessage escaping", () => {
  const samples = [
    "<script>alert(1)</script>",
    "He said \"hi\" & 'bye'",
    "A".repeat(80)
  ];
  for (const name of samples) {
    const escaped = escapeHtml(name);
    assert.doesNotMatch(escaped, /<script>/i);
    const result = calculateDroidAllyPrice({ droidClass: "class-ii", droidName: name });
    const html = buildDroidAllyQuoteHtml(result, (key) => key);
    assert.doesNotMatch(html, /<script>/i);
    assert.match(html, /Droid Ally Pricing|&amp;|&quot;|&#39;|A{10,}/);
  }
});

test("GM permission and player denial", () => {
  const gm = { id: "gm", isGM: true };
  const player = { id: "p1", isGM: false };
  assert.equal(canOpenDroidAllyPricing(gm, { featureEnabled: true }), true);
  assert.equal(canCalculateDroidAllyPricing(gm, { featureEnabled: true }), true);
  assert.equal(canQuoteDroidAllyPricing(gm, { featureEnabled: true }), true);
  assert.equal(canOpenDroidAllyPricing(player, { featureEnabled: true }), false);
  assert.equal(canCalculateDroidAllyPricing(player, { featureEnabled: true }), false);
  assert.equal(canQuoteDroidAllyPricing(player, { featureEnabled: true }), false);
  assert.equal(canOpenDroidAllyPricing(gm, { featureEnabled: false }), false);
});

test("no Actor API, Item API, or sockets in Droid modules", () => {
  const files = [
    "scripts/droid-ally-pricing.js",
    "scripts/droid-ally-app.js",
    "scripts/droid-ally/permissions.js",
    "scripts/droid-ally/quote.js"
  ];
  for (const rel of files) {
    const src = read(rel);
    assert.doesNotMatch(src, /Actor\.create/, rel);
    assert.doesNotMatch(src, /Item\.create/, rel);
    assert.doesNotMatch(src, /socket\.emit/, rel);
    assert.doesNotMatch(src, /game\.socket/, rel);
  }
});

test("feature setting registration", () => {
  const src = read("scripts/settings.js");
  assert.match(src, /featureDroidAllyPricing/);
  assert.match(src, /requiresReload:\s*true/);
  assert.match(src, /default:\s*false/);
});

test("scene-control visibility is GM and feature gated", () => {
  const src = read("scripts/main.js");
  assert.match(src, /featureDroidAllyPricing|isDroidAllyPricingEnabled/);
  assert.match(src, /canOpenDroidAllyPricing/);
  assert.match(src, /Open Droid Ally Pricing|DroidAllyPricing\.SceneControl|SceneControl.OpenDroidAlly/);
});

test("Droid ApplicationV2 options are not merged in-place onto the parent", () => {
  const src = read("scripts/droid-ally-app.js");
  assert.match(src, /inplace:\s*false/);
  assert.match(src, /kakeman89s-droid-ally-app/);
  assert.match(src, /id:\s*`\$\{MODULE_ID\}-droid-ally`/);
});

test("AstroCom Shipyard NavComputer regression sources exist", () => {
  assert.match(read("scripts/shipyard/calculate.js"), /export function calculateBuild/);
  assert.match(read("scripts/navcomputer/calculate-basic.js"), /calculateNavComputerBasic/);
  assert.match(read("scripts/astrocom/astrocom-app.js"), /AstroComApp/);
});

test("Advanced isolation", () => {
  const app = read("scripts/droid-ally-app.js");
  assert.doesNotMatch(app, /calculateRouteAdvanced/);
});

test("no personal-name attribution in Droid domain", () => {
  const blob =
    read("scripts/droid-ally-pricing.js") +
    read("scripts/droid-ally-app.js") +
    read("scripts/droid-ally/permissions.js") +
    read("scripts/droid-ally/quote.js");
  assert.doesNotMatch(blob, /\bckauble\b/i);
  assert.doesNotMatch(blob, /Caleb Kauble/);
});

test("SW5e placeholder untouched", () => {
  const sw5e = path.resolve(REPO_ROOT, "../sw5e-module/module.json");
  if (fs.existsSync(sw5e)) {
    assert.match(fs.readFileSync(sw5e, "utf8"), /#\{VERSION\}#/);
  }
});

test("no workbook binary under module source", () => {
  const src = read("scripts/droid-ally-pricing.js");
  assert.doesNotMatch(src, /\.xlsx/);
});

test("getDroidClassPreset unknown returns Class II", () => {
  assert.equal(getDroidClassPreset("nope").id, "class-ii");
});

test("formatCredits is display-only", () => {
  assert.match(formatCredits(1500), /1,?500/);
});

test("template has no helper-text or tooltip attributes", () => {
  const tpl = read("templates/droid-ally-pricing.hbs");
  assert.doesNotMatch(tpl, /datacron-help-text/);
  assert.doesNotMatch(tpl, /Help\./);
  assert.doesNotMatch(tpl, /tooltip/i);
  assert.doesNotMatch(tpl, /GmGuidance/);
  assert.doesNotMatch(tpl, /math\.floor/i);
});
