# Kakeman89s Datacron — Phase 8 Shipyard Calculation Engine

- **Document title:** Phase 8 — Shipyard Calculation Engine
- **Date:** 2026-08-17
- **Status:** COMPLETE (Node parity + invalid-input tests). Phase 9 UI and Phase 10 Actor creation **not started**.
- **Branch:** `v.next`
- **HEAD at report time:** `3570d7a3b7bfaaba14ecdb086e1c9f43f8d103ad`
- **Attribution:** Kakeman89

## 1. Phase authorization

Executed against the approved plan **Phase 8 Shipyard Calc**, including the 2026-08-17 execution-authorization addendum.

Authorized: hygiene for the untracked Datacron workbook copy; Phase 4–7 checkpoint **validation/recommendation**; interactive Excel vector capture; pure JavaScript calculation engine; option/rule tables; validation + explanation; Node tests; Phase 8 report; append-only Phase 7 + roadmap addenda.

Not authorized / not performed: Phase 9 collaborative UI; ApplicationV2; sockets; Phase 10 Actor/Item/Activity/Token/Folder creation; Foundry runtime; packaging/commit of the workbook; staging/commit/push/merge/rebase/PR/tag/package/release.

## 2. Repository preflight

| Item | Value |
| --- | --- |
| Repository root | `C:\Users\ckauble\OneDrive - Riverside Bank of Dublin\Documents\GitHub\Kakeman89s_Datacron` |
| Branch | `v.next` |
| Upstream | `origin/v.next` (ahead 2 at start) |
| HEAD | `3570d7a3b7bfaaba14ecdb086e1c9f43f8d103ad` |
| Staged files | none |
| Pre-existing dirty docs | Phase 6 report, roadmap, untracked Phase 7 report, untracked SotG docs copy |
| `.cursor/` ignored | yes |
| Node suite before Phase 8 | **45/45** pass |
| Geography workbook | present |
| Datacron SotG copy | present and untracked at start |

Working tree was not reset, cleaned, stashed, restored, or discarded.

## 3. Hygiene result

| Check | Result |
| --- | --- |
| Target | `docs/SotG Shipbuilder and Shipyard.xlsx` |
| Untracked | yes |
| Docs SHA-256 | `090770BAEB5EBE2CFE2D45F3653A2193691111D20D1AD092FE387BB62C3DE1ED` |
| Authoritative SHA-256 | identical |
| External workbook remains | yes |
| Deleted Datacron copy only | yes |
| Geography workbook preserved | yes |
| Broad `*.xlsx` ignore | **not** added |

## 4. Checkpoint commit status

**Not executed.** Execution authorization explicitly forbids staging/commit without separate maintainer authorization.

### Recommended checkpoint (when authorized)

Candidate groups:

1. Docs: Phase 6 addendum, Phase 7 report, Phase 8 report, roadmap addenda
2. Shipyard domain: `kakeman89s-datacron/scripts/shipyard/**`, `kakeman89s-datacron/data/sources/shipyard/**`, `package.json` test script
3. **Never:** SotG `.xlsx`, LevelDB pack churn unless separately requested

Suggested message:

```text
feat(shipyard): Phase 8 calculation engine and workbook vectors

Add pure Node Shipyard calculate/validate/explain domain with authored
Phase 8 Excel vectors, option/rule tables, and parity tests. Document
Phase 7→8 workbook sampling closeout. Do not include SotG workbook binary.
```

## 5. Workbook identity and hash verification

| Field | Value |
| --- | --- |
| Authoritative path | `C:\Users\ckauble\OneDrive - Riverside Bank of Dublin\Documents\GitHub\SW5e Docs\SotG Shipbuilder and Shipyard.xlsx` |
| Hash before capture | `090770BAEB5EBE2CFE2D45F3653A2193691111D20D1AD092FE387BB62C3DE1ED` |
| Hash after capture | identical (unchanged) |
| Excel version | 16.0 |
| Calculation mode | Automatic (`xlCalculationAutomatic` / raw `-4105`) |
| Macros | not enabled |
| Saved to source | **no** |
| Temp working copies | OS `%TEMP%\shipyard-phase8-*` only; deleted after capture |

`Workbooks.Open` COM continued to fail; capture used Start-Process + UI Automation dismiss of repair dialog + `GetActiveObject`, then Formula cell writes on a temporary copy. Closed without saving.

## 6. Vector gate

| Item | Result |
| --- | --- |
| Fixture | `kakeman89s-datacron/data/sources/shipyard/fixtures/phase8-vectors.v1.json` |
| README | `kakeman89s-datacron/data/sources/shipyard/fixtures/README.md` |
| Valid vectors | 5 |
| Invalid vectors | 1 (`v-invalid-empty-size`) |
| Schema validation | pass |
| Invented totals | none — values from evaluated Excel |
| Vector gate | **PASSED** |

### Vector inventory

| ID | Sheet | Grand Total | Notes |
| --- | --- | --- | --- |
| `v1-example-xwing` | Example X-wing | 212,600cr | Expected-value source = Example sheet; misc 2,800; build ~42d |
| `v2-small-bare` | Starship Sheet | 32,000cr | Small / tier 0 / Superiority Fighter / no weapon |
| `v3-small-armed` | Starship Sheet | 32,000cr | Twin laser Installed+Unlocked; **Grand Total unchanged** vs bare at tier 0 |
| `v4-medium-suites` | Starship Sheet | 89,000cr | Medium Freighter; Living Quarters qty 1; suite slots remained 3/3 open |
| `v5-large-tier` | Starship Sheet | 4,319,000cr | Large / tier 3 / Corvette; STR total 16 → ROUNDDOWN mod 3 |
| `v-invalid-empty-size` | Starship Sheet | `#VALUE!` | Empty `B5`; hard invalid |

## 7. Engine scope

New domain under `kakeman89s-datacron/scripts/shipyard/`:

| Module | Role |
| --- | --- |
| `schema.js` | Input/fixture shapes; workbook hash constant |
| `options.js` | Load authored JSON tables |
| `validate.js` | Hard/soft validation |
| `explain.js` | Deterministic trace builder |
| `calculate.js` | `calculateBuild(input)` API |
| `rules/ability.js` | Excel `ROUNDDOWN` + odd-score adjustment |
| `rules/size.js` | Size/tier/profile match |
| `rules/cost.js` | Cost aggregation from profiles |
| `tests/shipyard-phase8.test.js` | Fixture + parity + isolation tests |

Tables under `kakeman89s-datacron/data/sources/shipyard/tables/`: sizes, roles, weapons, ability-adjustments, cost-profiles.

Statuses: `success` | `partial` | `invalid` | `failed`.

Does **not** reuse NavComputer travel, Droid pricing, AstroCom, or `actor-helpers.js`. No Foundry globals.

### Coverage honesty

Phase 8 implements **vector-backed** profiles and formula families evidenced by capture (ability ROUNDDOWN, size/role ability deltas, cost aggregation `totalNoMisc + miscTotal = grandTotal`). It does **not** claim full Starship Sheet formula coverage (338 cells). Unsupported combinations return `unsupported-combination`.

## 8. Rounding

| Topic | Finding |
| --- | --- |
| Ability modifiers | `ROUNDDOWN((score-10)/2, 0)` with workbook odd-score −1 adjustment for `{9,7,5,3,1,-1,-3,-5}` |
| Credit totals | Integers in all five valid vectors |
| Build days | Fractional underlying values with day display (`42d`, `6d`, …); engine stores evaluated numeric value from Excel |
| Tolerances | None used for credit parity |

## 9. Validation messages / invalid behavior

Empty size → workbook Grand Total / related cost cells show `#VALUE!`. Engine returns `status: invalid`, `grandTotal.state: error`, display `#VALUE!`.

## 10. Test results

| Suite | Result |
| --- | --- |
| Phase 8 shipyard tests | 25 pass (included in full run) |
| Full Node `npm test` | **70/70** pass |
| Parity mismatches remaining | **0** |
| Foundry launched | no |
| World opened | no |

## 11. Files created / modified

### Created

- `kakeman89s-datacron/data/sources/shipyard/fixtures/phase8-vectors.v1.json`
- `kakeman89s-datacron/data/sources/shipyard/fixtures/README.md`
- `kakeman89s-datacron/data/sources/shipyard/tables/*.json` (5 tables)
- `kakeman89s-datacron/scripts/shipyard/**`
- `docs/KAKEMAN89S_DATACRON_PHASE_8_SHIPYARD_CALCULATION_ENGINE.md`

### Modified

- `package.json` — append Phase 8 test file to `npm test`
- `docs/KAKEMAN89S_DATACRON_PHASE_7_SHIPYARD_WORKBOOK_ANALYSIS.md` — append-only addendum
- `docs/KAKEMAN89S_DATACRON_ROADMAP.md` — append-only addendum

### Deleted (untracked only)

- `docs/SotG Shipbuilder and Shipyard.xlsx`

## 12. Non-starts and confirmations

- No ApplicationV2 Shipyard UI
- No sockets added
- No Actor/Item/Activity/Token/Folder creation
- Foundry not launched; no world opened
- NavComputer, AstroCom product behavior, Droid Shop, Advanced routing not modified for Shipyard
- SW5e not modified; `#{VERSION}#` left intentional/untouched
- `.cursor/` not modified
- Nothing staged or committed
- Phase 9 not started
- Phase 10 not started

## 13. Unsupported workbook areas (deferred)

- Full dropdown inventories beyond Phase 8 subsets
- Complete IF trees for all sizes/tiers/roles
- Weapon cost contribution paths that do not affect Grand Total at tier 0 Small
- Suite slot consumption mechanics beyond observed Medium Living Quarters case
- “Calculate Cost?” interactive gate beyond labels
- Helpful Calculators (WIP) sheet
- Phase 9 UI / Phase 10 Actor mapping implementation

## 14. Rollback

1. Remove `kakeman89s-datacron/scripts/shipyard/` and `kakeman89s-datacron/data/sources/shipyard/`.
2. Revert `package.json` test script to AstroCom-only list.
3. Retain or remove Phase 8/7/roadmap documentation per maintainer preference (docs are append-only historical if kept).
4. Do not restore SotG xlsx into Datacron docs.

## 15. Remaining blockers / Phase 9 prerequisites

1. Maintainer accept Phase 8 vector profiles as calculation baseline.
2. Optional: expand vectors for weapon cost paths that change Grand Total.
3. Phase 9 requires collaborative UI design, permissions, and (only if needed) socket plan — **not** started here.
4. Phase 10 still blocked on Actor create schema/runtime gates from Phase 1.

## 16. Recommended next decision

Accept Phase 8 closeout, optionally authorize the recommended docs+shipyard checkpoint commit, then separately authorize Phase 9 planning — or expand Phase 8 vector coverage before UI work.

## 17. Closeout

**PHASE 8 COMPLETE** for the pure calculation engine against captured workbook vectors. Packaging of the SotG workbook remains unauthorized. Phases 9–10 not started.
