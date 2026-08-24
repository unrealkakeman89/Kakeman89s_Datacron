# Phase 12 Plan: Droid Ally Pricing

- **Date:** 2026-08-18
- **Status:** PLANNING DOCUMENT (controlling implementation specification). Implementation is separately authorized.
- **Planning-only origin:** This file is the reopened Phase 12 plan. It is not the implementation report.
- **Implementation report (later):** `docs/KAKEMAN89S_DATACRON_PHASE_12_DROID_ALLY_PRICING.md`

SESSION DOCUMENT PROTECTION: Files under `ai/sessions/**` are append-only historical records. This Phase 12 plan lives under `docs/` and is the controlling specification for implementation. Do not rewrite it as an implementation report. Do not rewrite the historical Phase 12 Droid Shop plan in the program master. Do not delete the 2026-08-18 Phase 12 deferral addendum.

## 1. Planning-only status

This document records the accepted Phase 12 architecture, locked runtime, locked product decisions, recommended maintainer defaults, slices, gates, and non-goals.

Do not treat this file as proof that Phase 12 is complete. Do not start runtime work until the maintainer separately authorizes implementation.

Do not implement Phase 13 in this phase.

## 2. Repository state at planning (2026-08-18)

| Item | Value |
|---|---|
| Repository root | `C:\Users\ckauble\OneDrive - Riverside Bank of Dublin\Documents\GitHub\Kakeman89s_Datacron` |
| Branch | `v.next` tracking `origin/v.next` |
| HEAD | `c2271d3fb0ebf3f6d0783e8a972554fa413e9a7f` (`Update .gitignore`) |
| Unpushed | ahead 2: `2cacf2c feat(navcomputer): productionize basic travel calculator`; `c2271d3 Update .gitignore` |
| Staged | none |
| Working tree at planning | unstaged `docs/KAKEMAN89S_DATACRON_ROADMAP.md` (Phase 12 deferral, Galaxy Map planning, and this reopening addendum) |
| `.cursor/` | gitignored; do not modify |
| Phase 11 | committed at `2cacf2c`; report `docs/KAKEMAN89S_DATACRON_PHASE_11_NAVCOMPUTER_BASIC_CALCULATOR.md` |
| Phase 12 deferral | documented in the 2026-08-18 deferral addendum; **superseded, not deleted** |
| Phase 13 plan | **does not exist** (`docs/KAKEMAN89S_DATACRON_PHASE_13_UX_INTEGRATION_PLAN.md` absent) |
| Node at planning | **242/242** |
| Dedicated Droid tests | **absent** (other suites only assert Droid isolation) |

**Implementation precondition:** begin from a reviewed checkpoint that still contains the current `droid-ally-pricing.js` arithmetic. Do not commit as part of Phase 12 execution unless separately authorized.

## 3. Maintainer product decision (controlling)

The existing GM-only Droid Ally pricing calculator is the intended private-use droid pricing feature.

Accepted implementation baseline:

`kakeman89s-datacron/scripts/droid-ally-pricing.js`

The existing pricing model is approved for Phase 12 **on its own terms**.

This decision supersedes the 2026-08-18 deferral that waited for a missing Tier I–VI source. That source is **not** required before proceeding. The existing formula is **not** merely unapproved prior art.

Do not call the calculator a Tier I–VI Droid Shop. It does not include:

- Tier I–VI chassis prices
- A 10 percent class markup
- Condition modifiers

Those requirements belong to an **abandoned alternative design** and are out of reopened Phase 12 scope.

Phase 3 historical disposition `DROID-001` **REPLACE** remains a historical record. Reopened Phase 12 direction is **REVISE/productionize** the existing calculator, not replace its arithmetic.

Formula provenance (`docs/droid-allies-sw5e.md` Saga-inspired estimate) is informational for private use and is **not** an implementation blocker. Do not label the formula RAW unless a later repository source establishes that status.

## 4. Feature name

Current user-visible strings:

| Surface | Current text |
|---|---|
| Scene control | Open Droid Ally Pricing |
| Window title | Droid Ally Pricing |
| Template kicker / subtitle | Companion Cost Estimator |
| Calculate button | Calculate Droid Price |
| Chat title | Droid Ally Price Quote |
| Result heading | Estimated Buy Price |
| Internal files | `droid-ally-*` |

**Recommended final name:** **Droid Ally Pricing**

Rationale: title and scene control already agree. “Droid Ally Estimator” is acceptable as descriptive copy, not as a second product name. Align the subtitle/kicker to **Droid Ally Pricing** during implementation i18n. Do not rename the module. Do not rename internal files solely for cosmetics.

Do not introduce “Droid Shop” as the live feature name unless a later authorized design actually ships that abandoned model.

## 5. Locked runtime

| Item | Value |
|---|---|
| Foundry | 13.351 |
| dnd5e | 5.2.5 |
| SW5e | 1.4.2 (`#{VERSION}#` placeholder is not a defect) |
| Modules | `lib-wrapper`, `sw5e-module`, `kakeman89s-datacron` |
| Disposable world | `datacron-phase12-droid-ally` (create at implementation; do not reuse Phase 9/10 worlds) |

## 6. Current pricing-domain inventory

### 6.1 Files

| Path | Role |
|---|---|
| `kakeman89s-datacron/scripts/droid-ally-pricing.js` | Pure presets, normalize, calculate, formatCredits |
| `kakeman89s-datacron/scripts/droid-ally-app.js` | ApplicationV2 UI, GM gates, ChatMessage quote |
| `kakeman89s-datacron/templates/droid-ally-pricing.hbs` | Form + result; no arithmetic |
| `kakeman89s-datacron/styles/datacron.css` | `.droid-ally-shell` and quote styles |
| `kakeman89s-datacron/lang/en.json` `DroidAlly` / `SceneControl.OpenDroidAlly` | Copy |
| `kakeman89s-datacron/scripts/main.js` | GM scene tool; `openDroidAllyPricingApp()` |
| `kakeman89s-datacron/scripts/settings.js` | **No droid setting today** |
| `docs/droid-allies-sw5e.md` | Saga-inspired estimator notes; not RAW |

No dedicated `scripts/droid/` domain folder yet. Phase 12 may add `kakeman89s-datacron/scripts/droid-ally/tests/` without moving files unless refactor slices require it.

### 6.2 Entry points

1. Token scene control `kakeman89s-datacron-open-droid-ally` (GM only; always registered today; no feature flag).
2. `openDroidAllyPricingApp()` (returns `null` if not GM).
3. Module API `openDroidAllyPricingApp` / `getDroidApp`.
4. In-app Calculate (`data-droid-ally-calculate`) and Share to Chat (`data-droid-ally-share`).

No sockets. No Actor/Item APIs in Droid files.

### 6.3 Inputs (current)

| Field | Key | Normalization today |
|---|---|---|
| Droid name | `droidName` | `String(...).trim()` |
| Droid class | `droidClass` | Unknown id → Class II preset |
| Companion level / CR override | `companionLevel` | Non-negative integer; invalid/missing → 1; `0` remains 0 |
| Systems / factory cost | `systemsCost` | Non-negative integer credits, added as-is |
| Total ability modifiers | `abilityModifierTotal` | `Math.trunc`; negatives allowed; price uses `max(0, n)` |
| Traits / protocols | `traitProtocolCount` | Non-negative integer |
| Trained skills / tools | `trainedSkillToolCount` | Non-negative integer |
| Feats / upgrades | `featUpgradeCount` | Non-negative integer |

Default input: Class II, companion level 1, all adders 0, empty name.

### 6.4 Presets (current)

| id | chassisCostRank | Notes |
|---|---:|---|
| `class-i` | 1 | Class I |
| `class-ii` | 2 | Class II; unknown-preset fallback |
| `class-iii` | 3 | Class III |
| `class-iv` | 4 | Class IV |
| `class-v` | 5 | Class V |
| `tracker` | 2 | Same rank as Class II |
| `custom` | 1 | Same rank as Class I; no extra chassis field |

Retain Custom. Do not add a custom rank input unless a tested defect requires it (none identified in arithmetic).

### 6.5 Arithmetic (freeze)

Treat the exact current code as the candidate behavioral baseline. Do not rewrite, simplify, or reinterpret during implementation unless characterization tests prove a defect.

```text
baseChassisCost    = chassisCostRank * 1000
systemsCost        = GM-entered non-negative integer
abilityCost        = max(0, abilityModifierTotal) * 1000
traitProtocolCost  = traitProtocolCount * 2000
proficiencyCost    = trainedSkillToolCount * 500
featOrUpgradeCost  = featUpgradeCount * 1000
levelCost          = companionLevel * 1000
subtotal           = sum of the above
finalCost          = Math.floor(subtotal / 2)
```

Divisor is 2. Rounding is `Math.floor` after division. Odd subtotals floor down (example: subtotal 1001 → 500).

### 6.6 Outputs (current)

`calculateDroidAllyPrice` returns `{ input, classPreset, subtotal, finalCost, breakdown[] }` where breakdown rows have `key`, `labelKey`, `formula`, `amount`.

UI localizes those rows and shows name, class, level, subtotal, final price.

ChatMessage HTML is built from the already-calculated localized result. `escapeHtml` is applied. No recalculation in the message builder.

### 6.7 Settings

None. Phase 12 must add `featureDroidAllyPricing` (see §13). Do not add Tier, markup, or condition settings.

### 6.8 Permissions (current)

| Action | Behavior |
|---|---|
| Scene tool | `if (game.user?.isGM)` |
| Open app | `if (!game.user?.isGM) return null` |
| Calculate | `if (!game.user?.isGM) return` |
| Share to chat | `if (!game.user?.isGM) return` |
| Player | No scene tool; open/calculate/share no-op |

Preserve GM-only. Do not infer Phase 11 player NavComputer access for Droid Ally Pricing.

### 6.9 Reset / empty / invalid / result states (current)

| State | Current behavior |
|---|---|
| Empty | Default Class II form; no result block until Calculate |
| Result | Result block after successful calculate |
| Invalid numbers | Silent normalize (floor, clamp, fallback); calculate still succeeds |
| Error | `_error` exists in context but is never set |
| Reset | No reset control. Changing a field sets `_result = null` in memory. Only class change re-renders immediately |
| Share without result | Warning notification |

### 6.10 Current defects (separate from formula)

Record these; do not “fix” the frozen arithmetic to match the abandoned shop model.

1. **Stale result UI:** non-class field edits null `_result` without re-render, so the previous quote can remain visible while Share would warn “no result.” Implementation should re-render or keep the last quote until Calculate, then characterization-lock the chosen UX. Recommended: re-render on any field change so empty and result states stay honest.
2. **Unknown preset silent fallback** to Class II. Retain unless tests require an explicit warning; if a warning is added, hours and costs must stay identical.
3. **Chassis breakdown formula string** is `"Class chassis value"`, not `rank × 1000`. Explanation work should disclose rank × 1000 without changing the amount.
4. **Subtitle drift:** “Companion Cost Estimator” vs “Droid Ally Pricing.”
5. **No feature flag;** GM tool is always registered.
6. **No dedicated Node tests.**
7. **ResultDisclaimer** mentions GM-decided condition narratively. That is not a condition-modifier calculation. Do not add condition math. Copy may stay as GM-judgment language; do not imply the abandoned condition table exists.
8. **Existing help paragraphs** (`DroidAlly.Help.*`, `ClassHelp.*`, `GmGuidance`) are already in the template. Phase 12 must **not add** new helper text or tooltips. Clear field/result labels are allowed. Do not expand instructional prose without a later maintainer approval.

## 7. Characterization tests (required before refactor)

Write tests first against `calculateDroidAllyPrice` / `normalizeDroidAllyInput` **without changing product arithmetic**.

Lock at least:

- Every preset id with default adders and companionLevel 1
- Custom preset rank 1
- Tracker rank 2 equals Class II chassis contribution
- Minimum valid input (empty object / defaults)
- Multiple systemsCost values
- Positive, zero, and negative abilityModifierTotal (negative does not reduce other lines)
- Traits/protocols × 2000
- Skills/tools × 500
- Feats × 1000
- Companion level including 0 and 1
- Zero adders
- Fractional values (floor via `nonNegativeInteger` / trunc for abilities)
- Invalid non-numeric values
- Negative counts (clamp to 0 except abilities)
- Unknown preset → class-ii
- Missing input `{}`
- Subtotal equals sum of line amounts
- Odd subtotal floor (example Class I, level 0, systems 1 → subtotal 1001 → final 500)
- Even subtotal
- `Math.floor` not `Math.round` / `Math.ceil`
- Input object not mutated
- Deterministic identical outputs
- No 0.10 markup
- No condition field
- No Tier I–VI table
- `formatCredits` display-only

Derived default-level-1 zero-adder finals (verify in RED tests, do not hardcode a second formula in the UI):

| Preset | rank | expected subtotal | expected final |
|---|---:|---:|---:|
| class-i | 1 | 2000 | 1000 |
| class-ii | 2 | 3000 | 1500 |
| class-iii | 3 | 4000 | 2000 |
| class-iv | 4 | 5000 | 2500 |
| class-v | 5 | 6000 | 3000 |
| tracker | 2 | 3000 | 1500 |
| custom | 1 | 2000 | 1000 |

## 8. Calculation architecture

`calculateDroidAllyPrice` may remain the authority if characterization tests pass.

Recommended implementation after tests:

- Keep arithmetic in one pure module (no `game` / `foundry` globals).
- Separate preset table from calculation if a small extract is cleaner; do not duplicate ranks.
- Normalization remains a pure function returning a new object.
- Validation may emit warnings (unknown preset fallback, stale UI) without changing amounts.
- Structured explanation generated in JS; template only renders lines.
- UI must not recompute `finalCost`.

Recommended result shape (equivalent allowed if current breakdown is extended rather than replaced):

```text
{
  ok, status,
  normalizedInput,
  baseChassisCost,
  lineItems,          // current breakdown, plus rank and multiplier metadata
  subtotal,
  divisor,            // 2
  finalCost,
  rounding,           // "Math.floor(subtotal / 2)"
  warnings, errors,
  explanation         // { lines: string[] }
}
```

Preserve result parity with current amounts.

## 9. Pricing explanation

Plan structured lines covering:

- Selected preset id and display name
- Chassis-cost rank
- Rank × 1000 → base chassis
- Every applied adder with its current multiplier
- Systems as GM-entered credits
- Subtotal
- Division by 2
- Math.floor rounding
- Final price
- Warnings (fallback, empty name, etc.)
- Custom preset selected, if applicable

Template renders `explanation.lines`. Template must not calculate.

No new helper text or tooltips. Existing help paragraphs may remain; do not add more.

## 10. ApplicationV2, localization, accessibility

Retain `HandlebarsApplicationMixin(ApplicationV2)` singleton pattern already used.

Implementation must:

- Keep one window (`id: kakeman89s-datacron-droid-ally`); close/reopen must not duplicate.
- Align visible title/kicker to **Droid Ally Pricing**.
- Preserve labeled inputs (`for`/`id` already present).
- Keep keyboard-operable calculate/share buttons.
- English localization only in this phase.
- Escape chat HTML (already present; regression-test).
- Empty state: no fabricated price.
- Result state: show structured explanation + existing totals.
- Invalid numeric entry: keep current normalize-and-calculate behavior unless tests prove a crash.

## 11. ChatMessage quote

**Recommended default: retain.**

If retained during implementation:

- GM-only
- Use structured calculated result; do not recalculate in the formatter
- Escape user-controlled values (name and all interpolated strings)
- Identify the calculator as Droid Ally Pricing
- Do not claim RAW
- Do not create Actors or Items
- Do not deduct credits
- Do not initiate a transaction
- ChatMessage is the only allowed document write, and only via the existing quote path

## 12. Permissions and security

Recommended default: GM-only scene control, GM-only calculate, GM-only quote.

Implementation tests:

- Player has no scene tool when feature is on
- Player `openDroidAllyPricingApp()` returns null
- Player calculate/share no-op even if the function is invoked
- World setting is GM-controlled (`featureDroidAllyPricing` world scope)
- No sockets
- No Actor.create / Item.create

Do not add player access because Phase 11 NavComputer allows players.

## 13. Feature setting

Plan `featureDroidAllyPricing`:

| Property | Recommended |
|---|---|
| Scope | world |
| Type | Boolean |
| Config | true |
| Default | **false** until Phase 12 Foundry gates pass |
| requiresReload | true |
| Name | Enable Droid Ally Pricing |

After gates pass, default-true is a **separate** maintainer decision. Do not reuse a “Droid Shop” setting name.

When disabled: scene tool absent; opener returns null; calculation module remains loadable for Node tests.

## 14. Phase 13 integration prerequisites

`docs/KAKEMAN89S_DATACRON_PHASE_13_UX_INTEGRATION_PLAN.md` **does not exist** at this planning date.

When Phase 13 is later planned or implemented:

- Do not permanently hide Droid Ally Pricing solely because Phase 12 was once deferred.
- Do not integrate Droid Ally Pricing as a completed initial-release feature until this Phase 12 implementation and Foundry gates pass.
- Until then, the integrated active-feature inventory remains AstroCom, NavComputer, and Shipyard.
- After Phase 12 completion, add Droid Ally Pricing through the Phase 13 integration workflow.
- Phase 13 must not delete Droid prior-art code.
- Galaxy Map (GM-0 … GM-10) is a separate program and is not Phase 12 or Phase 13.

Phase 12 implementation slice 12.10 appends a Phase 13 plan addendum **if that file exists by then**; otherwise the implementation report restates this section.

## 15. Isolation and non-goals

Do not modify:

- NavComputer product code
- AstroCom product code
- Shipyard product code
- Advanced routing
- SW5e / dnd5e / Foundry core
- junctions
- `.cursor/`
- Droid arithmetic during this planning assignment (already frozen)

Phase 12 implementation non-goals:

- Tier I–VI replacement pricing
- 10 percent class markup
- Condition modifiers
- Droid Actor creation
- Merchant transactions / credit deduction / inventory transfer
- Character-sheet integration
- Player-authoritative pricing
- Sockets
- Public release
- Commit or push without separate authorization
- New helper text or tooltips

## 16. Node test plan

Preserve the existing 242 tests. Add `kakeman89s-datacron/scripts/droid-ally/tests/droid-ally-phase12.test.js` (or equivalent) to `package.json` `test`.

Cover §7 plus:

- Structured explanation contains rank × 1000, divisor 2, Math.floor, preset id
- Template/source has no `Math.floor` / `* 1000` arithmetic
- GM permission predicate
- Player denial predicate
- Chat HTML escaping unit test of the escape helper
- No Actor API / Item API / socket.emit in Droid modules
- No abandoned Tier table / 10% markup / condition modifier
- No personal-name attribution in Droid domain
- AstroCom, Shipyard, NavComputer regression files still run
- SW5e `#{VERSION}#` untouched

Harness: Node built-in test runner. No new dependencies.

## 17. Foundry gates (`datacron-phase12-droid-ally`)

Record PASS / FAIL / BLOCKED / NOT RUN. Do not delete a failed gate later.

| Gate | Steps | Expected |
|---|---|---|
| A Environment | Foundry 13.351, dnd5e 5.2.5, SW5e 1.4.2, three modules | versions match; `#{VERSION}#` ignored |
| B Feature off | `featureDroidAllyPricing` false + reload | no scene tool; open returns null |
| C Feature on | true + reload | GM sees Open Droid Ally Pricing |
| D App launch | GM click | one window titled Droid Ally Pricing |
| E Presets | calculate each of 7 presets at defaults | amounts match characterization table |
| F Custom | select Custom; add systems | rank 1 chassis; systems adder applied |
| G Explanation | read panel | rank × 1000, adders, subtotal, floor/2, final |
| H Reset/stale | change a field after a quote | UI state honest (no silent stale quote) |
| I ChatMessage | Share to Chat | escaped quote; Droid Ally Pricing; no RAW claim |
| J HTML escaping | name contains `<script>` | escaped in chat |
| K Close/reopen | close and open | singleton; no duplicate windows |
| L Player | Phase12Player join | no scene tool; open/calculate/share rejected |
| M No Actor/Item | after all GM actions | actor and world-item counts unchanged |
| N No credits | inspect chat/app | no debit, no transaction |
| O No sockets | Droid modules | no new socket listeners |
| P Isolation | open AstroCom/NavComputer/Shipyard if enabled | unchanged; no Droid writes |
| Q Node | `npm test` | full suite green including Phase 12 file |
| R Shutdown | close apps; leave world; stop V13 | process count 0 |

## 18. Documentation (implementation closeout)

Create `docs/KAKEMAN89S_DATACRON_PHASE_12_DROID_ALLY_PRICING.md`.

Update:

- Root `README.md` (name Droid Ally Pricing; GM-only; not the abandoned shop)
- Feature overview copy in README / known limitations
- GM-facing guidance: estimator, not RAW; purchase ≠ companion permission
- `docs/droid-allies-sw5e.md` only as needed to stop calling the live feature a Droid Shop and to keep Saga provenance informational
- Phase 13 plan addendum if that file exists
- Roadmap dated addendum (implementation), not a history rewrite

The live model must be named **Droid Ally Pricing**. Do not claim the implementation is the abandoned Tier I–VI Droid Shop design.

## 19. Maintainer decisions (recommended defaults)

Do not wait for answers during planning. Implementation uses:

1. **Final feature name:** Droid Ally Pricing
2. **Scene-control access:** GM-only
3. **Feature default:** `false` until runtime gates pass; default-true is a later decision
4. **ChatMessage quote:** retain
5. **Custom preset:** retain
6. **Pricing-model parity:** freeze current behavior unless a tested defect is found
7. **Phase 13 integration:** integrate only after Phase 12 implementation passes

## 20. Implementation slices

Per-slice entry: prior slice complete. Rollback: disable `featureDroidAllyPricing`; leave disposable world on disk. Do not revert the frozen formula to a shop table.

### 12.0 Repository and behavior baseline

- **Entry:** this plan accepted; implementation authorized
- **Deliverables:** confirm HEAD; Node 242/242; inventory still matches §6
- **Files:** none required
- **Node / Foundry:** full Node; no Foundry yet
- **Exit:** baseline recorded
- **Boundary:** no product edits

### 12.1 Characterization tests

- **Entry:** 12.0
- **Deliverables:** RED tests for §7
- **Files:** new test file; `package.json` test script
- **Exit:** tests fail only for missing product coverage, not because arithmetic was changed first
- **Boundary:** no formula edits

### 12.2 Preset and option-table isolation

- **Entry:** 12.1 green or explicitly failing only on missing exports
- **Deliverables:** presets remain the seven current rows
- **Files:** `droid-ally-pricing.js` only if extract is needed
- **Exit:** preset tests pass; ranks unchanged
- **Boundary:** no new presets; no Tier table

### 12.3 Pure calculation result and explanation

- **Entry:** 12.2
- **Deliverables:** structured result + explanation; amount parity
- **Files:** `droid-ally-pricing.js`
- **Exit:** characterization still green; explanation tests green
- **Boundary:** no UI arithmetic

### 12.4 Validation and security

- **Entry:** 12.3
- **Deliverables:** warning model; escape helper tests; no Actor/Item/socket
- **Files:** pricing + app helpers
- **Exit:** invalid inputs still match frozen normalize rules
- **Boundary:** no condition/markup validation

### 12.5 ApplicationV2 and localization

- **Entry:** 12.4
- **Deliverables:** name alignment; explanation render; stale-result UX
- **Files:** `droid-ally-app.js`, `droid-ally-pricing.hbs`, `en.json`, CSS if needed
- **Exit:** template has no arithmetic; no new helper text
- **Boundary:** no player UI

### 12.6 Feature setting and scene control

- **Entry:** 12.5
- **Deliverables:** `featureDroidAllyPricing`; GM tool gated
- **Files:** `settings.js`, `main.js`, `en.json`
- **Exit:** disabled hides tool
- **Boundary:** no Droid Shop setting

### 12.7 ChatMessage quote

- **Entry:** 12.6
- **Deliverables:** retain quote; escaping; Droid Ally Pricing identity
- **Files:** `droid-ally-app.js`
- **Exit:** no Actor/Item; no credit debit
- **Boundary:** ChatMessage only

### 12.8 Node regression suite

- **Entry:** 12.7
- **Deliverables:** full `npm test` green including AstroCom/Shipyard/NavComputer
- **Exit:** 242 + new Phase 12 tests all pass
- **Boundary:** do not weaken isolation tests

### 12.9 Disposable-world Foundry gates

- **Entry:** 12.8
- **Deliverables:** world `datacron-phase12-droid-ally`; gates A–R recorded
- **Exit:** every gate has PASS/FAIL/BLOCKED/NOT RUN; V13 stopped
- **Boundary:** do not open valuable worlds

### 12.10 Phase 13 integration correction

- **Entry:** 12.9
- **Deliverables:** if Phase 13 plan exists, append-only addendum per this document §14; else restate in the implementation report
- **Exit:** Phase 13 still not implemented
- **Boundary:** no Phase 13 UX rewrite of other domains

### 12.11 Documentation and closeout

- **Entry:** 12.10
- **Deliverables:** implementation report; README/limitations; roadmap addendum
- **Exit:** unstaged unless commit is separately authorized
- **Boundary:** no public release

## 21. Whole-phase Definition of Done (implementation)

- Characterization tests lock current arithmetic
- Live feature name is Droid Ally Pricing
- Formula not labeled as the abandoned Tier I–VI shop
- Explanation shows rank × 1000, adders, subtotal, floor/2
- GM-only; feature flag works
- Chat quote retained and escaped
- No Actor/Item/sockets/transactions
- AstroCom / NavComputer / Shipyard unchanged
- Full Node suite green
- Every Foundry gate recorded
- Foundry stopped
- Implementation report exists
- Phase 13 not started
- No commit unless separately authorized

## 22. Exact recommended implementation action (after separate authorization)

1. Revalidate checkpoint and Node 242/242 (12.0).
2. Write characterization tests (12.1).
3. Productionize explanation, flag, GM UX, and quote (12.2–12.7).
4. Full Node suite (12.8).
5. Foundry gates in `datacron-phase12-droid-ally` (12.9).
6. Phase 13 documentation correction only (12.10).
7. Implementation report (12.11).
8. Stop. Do not begin Phase 13 implementation. Do not enable Advanced routing.

## 23. Planning-assignment Definition of Done

This planning assignment is complete when this file exists, the roadmap reopening addendum exists, the 2026-08-18 deferral remains in place as superseded history, no Droid pricing/UI/settings code changed, no Foundry ran, and Phase 13 implementation did not start.
