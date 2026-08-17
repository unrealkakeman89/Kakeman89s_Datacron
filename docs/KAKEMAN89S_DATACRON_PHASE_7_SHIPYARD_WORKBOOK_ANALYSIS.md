# Kakeman89s Datacron — Phase 7 Shipyard Workbook Analysis

- **Document title:** Phase 7 — Shipyard Workbook Analysis
- **Date:** 2026-08-17
- **Status:** Analysis complete for the located SotG ship-builder workbook (private development). Packaging/redistribution into Datacron remains **not authorized**. Phases 8–10 not started.
- **Branch:** `v.next`
- **HEAD at report time:** `3570d7a3b7bfaaba14ecdb086e1c9f43f8d103ad`
- **Investigation only:** no Shipyard calculator, collaborative UI, or Starship Actor creation implemented

## 1. Authorization and HOLD boundary

Phase 7 is investigation-focused per roadmap §Phase 7 and §9.3.

| Situation | Action taken |
| --- | --- |
| Workbook cannot be located/identified | HOLD (not applicable — workbook **was** located) |
| Licensing/redistribution uncertain alone | **Not** a HOLD for this private-use project |
| Workbook found locally | Private §9.3 analysis; cite path; do **not** treat packaging as authorized |

### SESSION DOCUMENT PROTECTION

This is a new `docs/` phase report. Prior Phase 0–6 reports were not rewritten. Roadmap updates are append-only addenda.

## 2. No Shipyard product code

Searched `kakeman89s-datacron/scripts` for `shipyard` / `ship-builder`: **no matches**.

[`actor-helpers.js`](kakeman89s-datacron/scripts/actor-helpers.js) selects **existing** starship actors for NavComputer travel estimates. That is **not** Shipyard.

Planet prose mentioning “shipyards” in JSON descriptions is lore text only.

**Conclusion:** no Shipyard builder domain exists in the module product code.

## 3. Paths inspected (workbook location)

| Path inspected | Result |
| --- | --- |
| Datacron repo `**/*.xlsx` | Geography workbook + SotG ship-builder (see below) |
| `...\GitHub\sw5e-module` / Foundry V13 / AppData SW5e module trees | No ship-builder xlsx (name-hint search) |
| `...\GitHub\SW5e Docs\` | Multiple SotG-related xlsx files |
| `C:\Users\ckauble\Downloads\` | SotG shipyard catalogs / misc ship collections |

### Non-candidate

| File | Why rejected as ship-builder |
| --- | --- |
| `docs/Star Wars Galaxy Map Grid Coordinates.xlsx` | Galaxy geography dataset; not construction |

### Related catalog workbooks (not primary builder)

| File | Notes |
| --- | --- |
| `...\SW5e Docs\Pre-July 2022 - SotG Shipyard.xlsx` (~75 MB) | Large multi-sheet **prebuilt ship catalog** (dozens of named ship sheets + Automation). Not the compact builder workbook. |
| `...\SW5e Docs\Original Trilogy + EU SotG Shipyard - Post-July 2022.xlsx` | Catalog family |
| Downloads `Misc ships - Post-July 2022 - SotG Shipyard.xlsx`, `Tuskman's random collection of starships.xlsx` | Community/catalog collections |

### Primary identified ship-builder workbook

| Field | Value |
| --- | --- |
| Filename | `SotG Shipbuilder and Shipyard.xlsx` |
| Cited local path (analysis source) | `C:\Users\ckauble\OneDrive - Riverside Bank of Dublin\Documents\GitHub\SW5e Docs\SotG Shipbuilder and Shipyard.xlsx` |
| Duplicate path (byte-identical) | `...\Kakeman89s_Datacron\docs\SotG Shipbuilder and Shipyard.xlsx` |
| Size | 281,359 bytes |
| LastWriteTime (local) | 2026-07-28 12:16:59 |
| SHA256 | `090770BAEB5EBE2CFE2D45F3653A2193691111D20D1AD092FE387BB62C3DE1ED` |
| Macros / VBA | **None** (`vbaProject.bin` absent) |
| Workbook protection | None detected in `workbook.xml` |
| Git status in Datacron | Untracked (`?? docs/SotG Shipbuilder and Shipyard.xlsx`) — **must not be committed** as module content under current packaging stance |

**Identity note:** Filename branding is **SotG** (Starships of the Galaxy community tooling family). Phase 2 WORKBOOK-001 still records that an official SW5e-foundry Excel page was not established. This Phase 7 analysis treats the located SotG builder as the **identified local ship-builder workbook** for private development mapping. It does **not** authorize redistribution or packaging into Kakeman89s Datacron.

## 4. Provenance and packaging stance (WORKBOOK-001)

| Topic | Phase 7 finding |
| --- | --- |
| Private analysis | Allowed for this project once located |
| Copy binary into Datacron as redistributable module asset | **Not authorized** |
| Commit untracked `docs/SotG Shipbuilder and Shipyard.xlsx` | **Do not** — packaging/redistribution not authorized by analysis |
| Public release packaging | Remains blocked until explicit rights (Phase 2 WORKBOOK-001) |
| Large proprietary table dumps in git | Avoided; this report cites structure, formula patterns, and cell refs |

## 5. Sheet inventory

| Sheet | State | Role (from structure) |
| --- | --- | --- |
| List of Ships | visible | Filterable catalog table (`A4:R114`); headers include Class, Classification, Size, Tier, Crew/Housing, Era Built, Main Faction, Statblock link, Last Updated, Shipwright, Links and notes. **0 formulas.** |
| Helpful Calculators (WIP) | visible | WIP helpers; size list validation on `B6`. **0 formulas** in OOXML extract. |
| Starship Sheet | visible | Primary construction sheet. **338 formula cells**, **28 list validations**, heavy merge usage. |
| Example X-wing | visible | Example filled sheet (companion to Starship Sheet). |

Named ranges: one Excel filter DB name `_xlnm._FilterDatabase` → `'List of Ships'!$A$4:$R$114`.

Tables (`xl/tables`): **none** (no formal Table Parts; List of Ships uses AutoFilter-style range).

Hidden sheets: **none**. Hidden columns/rows on Starship Sheet: **none** detected via OOXML `@hidden`.

Cross-sheet formula references from Starship Sheet: **0** (self-contained formulas).

## 6. Inputs and outputs (Starship Sheet)

### Inputs (representative — list-validated cells)

Data validations are almost all `type=list` with `allowBlank=1`. Key `sqref` targets include:

| Area | Cells (examples) | Meaning (from shared-string labels / formula context) |
| --- | --- | --- |
| Size | `B5` | Ship Size (Small/Medium/Large/Huge/Gargantuan appear in tier feature formulas) |
| Role / class options | `B6`, `C6`, `C7`, `C8`, `C13`, `F9`, `G13`, `J13` | Classification / role / related picks |
| Equipment toggles | `E15`, `E16` | Installed / Locked / Unlocked style installation state (used in weapon formulas) |
| Weapons | `H27`, `N27`, … mounting grids; fire-link / weapon lists | Weapon selection and mounting |
| Suites / housing | `A75:A84`, `A86`–`A93`, `A95:A99`, `B122:B125` | Suite and crew/housing related picks |
| Tier role | `K136` | Tier 0 / class role strings (Bomber, Scout, Attack Fighter, …) appear in formulas |
| Other | `H111`, `H129`, `A92` | Additional builder picks |

Helpful Calculators validation explicitly lists: `"Ship Size,Tiny,Small,Medium,Large,Huge,Gargantuan"`.

### Outputs (labels present in shared strings)

Observed builder output concepts (labels in workbook strings; exact cell binding confirmed structurally via formula density on Starship Sheet):

- Ability / point-buy aggregates (`Point Buy total`, `Sum(H5:H9)`, ability modifier via `Rounddown((H10-10)/2, 0)` with odd-score adjustments)
- Hull / shield dice and points, resistances, regen
- Suite slots / open suites / crew expansion / security suite
- Weapons totals and mounting interactions
- Hyperdrive / backup / fuel cost modifiers
- Cost block labels: `Cost & Time to Build`, `Calculate Cost?`, `Upgrade Cost`, `Total Cost`, `Total Cost:`, `Total, no Misc`, `Grand Total`, `Misc. Total`, fuel cost/unit, upgrade/mod cost modifiers, tier upgrade

**Note:** Excel COM open failed in this environment (`Unable to get the Open property of the Workbooks class`). Cell-value sampling for Grand Total numeric examples is therefore **NOT RUN** live; structure and formula inventory are from OOXML. Phase 8 should re-open in Excel/LibreOffice to capture concrete cost vectors.

## 7. Formulas, rounding, cost rules

| Metric (Starship Sheet) | Count / finding |
| --- | --- |
| Formula cells | 338 |
| Unique formula texts | 232 |
| `IF(` usage | Dominant (~201 hits) — size-gated tier features, weapon AC interactions |
| `SUM(` short aggregators | e.g. `H10=Sum(H5:H9)`, `E127=Sum(E122:E125)` |
| True `ROUND`/`Rounddown` functions | **`Rounddown((H10-10)/2, 0)`** ability-mod style (plus nested odd-score IF adjustments). Many other “ROUND” string hits are **prose** inside formulas (“rounded down”), not Excel ROUND. |
| `VLOOKUP` / `INDEX` / `MATCH` | **0** |
| `CHOOSE` | Present (4 hits) |
| Cost arithmetic | Present via labeled cost/total concepts; **not** expressed as simple single `SUM` of a named Cost column in the short-formula set — cost logic is interleaved with IF/CHOOSE structures and labeled totals. Exact credit rounding mode for Grand Total remains **UNVERIFIED** pending interactive Excel sampling. |

### Construction options and dependencies (evidence-based)

- **Size (`B5`)** gates large blocks of tier 1–5 feature text/effects (Small/Medium/Large/Huge/Gargantuan branches).
- **Weapon choice + mounting + install lock state (`E15`/`E16`)** adjust derived attack/AC-related outputs (fire-linked / primary weapon interactions).
- **Tier/class role (`K136`)** interacts with size for “best in class” / ASI guidance at high tier.
- Suite and crew capacity features double/triple at higher tiers for larger sizes (formula prose).
- List of Ships catalog is **independent** (no cross-sheet formulas into Starship Sheet).

## 8. Rules that cannot be reproduced from published SW5e rules alone

Without republishing workbook text, Phase 7 records these **categories** as workbook-coupled (need the workbook or equivalent authored tables for Phase 8 vectors):

1. Exact dropdown option inventories (weapon names, suite names, role strings) encoded in validations / sheet lists.
2. Exact credit **Grand Total** composition order and any undocumented modifiers (`Upgrade Cost Mod`, `Mod/Equip Cost Mod`, fuel cost modifiers, misc line items).
3. Interactive “Calculate Cost?” gate behavior (label present; runtime not sampled via Excel COM).
4. WIP Helpful Calculators sheet — incomplete; cannot be treated as authoritative.
5. Community SotG catalog workbooks’ ship-specific sheets — separate from builder; not mapped as construction rules.

Published SW5e book rules may describe sizes, tiers, suites, and weapons generally, but **matching this workbook’s totals** requires workbook-derived test vectors in Phase 8.

## 9. Mapping targets — SW5e 1.4.2 Starship Actors (from Phase 1)

Sources: [`docs/KAKEMAN89S_DATACRON_PHASE_1_COMPATIBILITY_VERIFICATION.md`](docs/KAKEMAN89S_DATACRON_PHASE_1_COMPATIBILITY_VERIFICATION.md) (static). No Actors created in Phase 7.

| Workbook concept | Candidate SW5e 1.4.2 target | Confidence | Notes |
| --- | --- | --- | --- |
| Built ship as Actor | `type: "vehicle"` with `flags.sw5e.legacyStarshipActor.type: "starship"` | High (Phase 1 static) | Current create path `createBlankLegacyStarshipActorData` creates **vehicle**, not character |
| Legacy character+flag shape | `character` + `flags.sw5e.starshipCharacter.enabled` | Legacy detection only | Normalized **to vehicle**; do not assume this is the create shape |
| Size | `system.traits.size` / legacy size items | Medium | Workbook size enum must map to SW5e size items |
| Tier | `system.details.tier` (legacy merged system) | Medium | Workbook Tier 0–5 |
| Hull / shields | Token resources `sw5e.starshipHull` / `sw5e.starshipShields`; legacy attributes | Medium | Phase 1 notes Datacron does not use these today |
| Hyperdrive | `attributes.travel.hyperdriveClass` / `attributes.equip.hyperdrive.class` on **legacy** store | Medium | NavComputer currently reads `actor.system` first — known mismatch risk (Phase 1 F7) |
| Crew / deployment | `flags.sw5e.legacyStarshipActor.system.attributes.deployment` | Medium | Crew/housing suites in workbook ≠ automatic deployment UUID lists |
| Weapons / mods / suites | Starship Items (size/mod/deployment normalized to feat/loot/feat per Phase 1) | Medium | Exact Item documents deferred to Phase 10 |
| Cost total | Module-owned builder field / chat summary — **not** a required Actor field | High | Cost is builder output; Actor may store provenance only |
| Provenance | Module flags (builder version, workbook hash, private-use marker) | Planned | Phase 10 concern |

### Phase 10-only open questions (listed, not implemented)

- Create APIs, ownership, folder selection, image/token defaults
- Activities appropriateness on dnd5e 5.2.5
- Preview before create; undo/rollback; duplicate ship names
- Native sheet editability after create
- Whether creation is GM-only
- How to avoid overwriting existing Actors

**Warning:** Do not assume `v.next` starship detection (`character` + enabled flag) remains the create shape for SW5e 1.4.2.

## 10. Section 9.3 checklist

| # | Item | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Workbook provenance / packaging stance | PASS (documented) | Local path + SHA256; packaging not authorized |
| 2 | Workbook version | PASS (partial) | Filename/SotG family; LastWriteTime; no formal version property in OOXML core/app props (props files absent/empty in extract) |
| 3 | Sheet inventory | PASS | 4 sheets listed |
| 4 | Named ranges | PASS | Filter DB on List of Ships |
| 5 | Tables | PASS | No formal Excel Tables; filter range used |
| 6 | Formulas | PASS | 338 on Starship Sheet; patterns documented |
| 7 | Data validation | PASS | 28 list validations on Starship Sheet; size list on Calculators |
| 8 | Hidden sheets/columns | PASS | None detected |
| 9 | Protected content | PASS | No workbook/sheet protection detected |
| 10 | Macros | PASS | No VBA |
| 11 | Inputs / outputs | PASS | Documented; live numeric sampling NOT RUN (Excel COM open failed) |
| 12 | Cost rules | PASS (structural) | Labels + formula patterns; Grand Total numeric vector NOT RUN |
| 13 | Size / tier rules | PASS | Size-gated IF trees; tier role cell `K136` |
| 14 | Modification / equipment constraints | PASS (partial) | Install lock + weapon mount interactions observed |
| 15 | Deployment / crew rules | PASS (partial) | Suite/crew labels and capacity prose in formulas |
| 16 | Validation messages | NOT RUN | Error titles/prompts not extracted from OOXML beyond `showErrorMessage` on Calculators size list |
| 17 | Rounding | PASS (partial) | Ability mod `Rounddown`; cost credit rounding UNVERIFIED live |
| 18 | Dependencies among choices | PASS | Size/role/weapon/install dependencies |
| 19 | Calculations unreproducible from books alone | PASS | Section 8 |
| 20 | Map to SW5e Actor schema targets | PASS | Section 9 (static Phase 1) |
| 21 | Confirm no Shipyard product code | PASS | Section 2 |

## 11. Explicit non-starts

- **Phase 8** Shipyard calculation engine — not started
- **Phase 9** Collaborative UI — not started
- **Phase 10** Starship Actor creation — not started
- No workbook binary added to git; untracked Datacron `docs/` copy must remain uncommitted unless rights change

## 12. Risks and recommended next maintainer actions

1. Confirm whether SotG builder is the intended authoritative workbook for Datacron Shipyard, or whether a different official file still must be obtained.
2. Do **not** commit `docs/SotG Shipbuilder and Shipyard.xlsx` until packaging rights are explicit.
3. For Phase 8 readiness: open the cited workbook in Excel and capture 3–5 known build vectors (inputs → Grand Total / days) including rounding cases.
4. Re-run Excel COM / desktop open on a machine where Workbooks.Open succeeds to close NOT RUN items (validation prompts, live totals).

## 13. Closeout

**PHASE 7 COMPLETE** for investigation of the **located** SotG ship-builder workbook under the private-analysis boundary. HOLD was **not** used (workbook identified). Packaging/redistribution remains unauthorized. Phases 8–10 not started. No product Shipyard code was added.

---

## Addendum — 2026-08-17 — Phase 8 Excel vector capture closed Phase 7 NOT RUN sampling

### Reason

Phase 8 interactively evaluated the authoritative workbook and captured authored I/O vectors. Live Grand Total sampling is no longer blocked solely by the Phase 7 Excel COM open failure.

### Supersedes

- Phase 7 statements that Grand Total numeric examples / cost credit rounding live sampling / validation-prompt runtime were **NOT RUN** due to Excel COM `Workbooks.Open` failure (Sections 6, 7, 10 checklist items 11–12, 16–17).

The superseded NOT RUN statements above are retained as historical evidence and must not be deleted.

### Revised decision or behavior

- Workbook SHA-256 reconfirmed: `090770BAEB5EBE2CFE2D45F3653A2193691111D20D1AD092FE387BB62C3DE1ED` (unchanged after capture).
- Vector count: **5 valid + 1 invalid** authored into `kakeman89s-datacron/data/sources/shipyard/fixtures/phase8-vectors.v1.json`.
- Capture date: 2026-08-17.
- Capture method: Excel 16.0 via Start-Process + UI Automation dialog dismiss + COM attach on an OS-temp copy; recalculated; closed without saving; authoritative file not modified.
- Cost rounding: credit Grand Totals observed as integers; build-day cells expose fractional underlying values with day display text.
- Validation: empty size yields `#VALUE!` on Grand Total / related cost outputs.
- Phase 8 report: `docs/KAKEMAN89S_DATACRON_PHASE_8_SHIPYARD_CALCULATION_ENGINE.md`.

### Implementation impact

Phase 8 calculation domain added under `kakeman89s-datacron/scripts/shipyard/`. No Phase 9 UI. No Phase 10 Actor creation.

### Validation impact

Original Phase 7 NOT RUN rows retained. This addendum records that live sampling was completed in Phase 8.

### Status

Phase 7 historical record preserved; Phase 8 vector capture complete.
