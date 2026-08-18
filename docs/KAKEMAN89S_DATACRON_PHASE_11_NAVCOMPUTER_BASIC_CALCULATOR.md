# Kakeman89s Datacron — Phase 11 NavComputer Basic Calculator

- **Document title:** Phase 11 — NavComputer Basic Calculator
- **Date:** 2026-08-17
- **Status:** COMPLETE for the authorized Basic NavComputer scope. Gate O (piloting roll) is BLOCKED because the disposable world has no character Actors. Phase 12 was not started.
- **Authoritative plan:** `docs/KAKEMAN89S_DATACRON_PHASE_11_NAVCOMPUTER_BASIC_CALCULATOR_PLAN.md` (not rewritten)
- **Branch:** `v.next`
- **HEAD at report time:** `af1af00577308a825a672d774d984b26d7da142d` (unchanged; no commit)
- **Attribution:** Kakeman89

SESSION DOCUMENT PROTECTION: Files under `ai/sessions/**` were not modified. The Phase 11 plan was not rewritten. This file is a new implementation record.

## 1. Authorization

Executed against the approved Phase 11 plan. Maintainer approved Decisions A–D recommended defaults.

Authorized: repository and runtime preflight; read-only Phase 10 Actor inspection; versioned matrix extraction; matrix loader/validator; Basic region lookup; NavComputer-local typo normalization; structured unsupported-region results; NavComputer ship-data adapter; `existing-unverified.v1` resource profile; preserved resource formulas; structured explanations; NavComputer naming; `featureNavComputer`; player scene-control access; Node tests; Foundry V13 in `datacron-phase10-actor`; GM and player gates; in-scope defect correction; this report; dated roadmap addendum; leave changes unstaged.

Not authorized / not performed: Phase 12; Droid Shop changes; Advanced routing; pathfinding; route graph changes; matrix expansion; Hutt Space matrix cells; hyperdrive-adjusted Basic travel; AstroCom product changes; Shipyard product changes; Phase 10 Actor changes; Actor/Item/document creation; new sockets; public release; staging; commit; push; merge; rebase; PR; tag; package; release.

## 2. Preflight / implementation baseline

| Item | Value |
| --- | --- |
| Repository root | `C:\Users\ckauble\OneDrive - Riverside Bank of Dublin\Documents\GitHub\Kakeman89s_Datacron` |
| Branch | `v.next` tracking `origin/v.next` |
| HEAD | `af1af00577308a825a672d774d984b26d7da142d` (`feat(shipyard): add native SW5e starship actor creation`) |
| Ahead / behind | 0 / 0 |
| Staged | none |
| Node at Phase 11 start | **120/120** |
| Node at Phase 11 close | **242/242** |
| Phase 10 | complete and pushed at this HEAD |
| Phase 11 plan | untracked at start; remains untracked (not rewritten) |
| `.cursor/` | not modified |
| SW5e `module.json` version | remains `#{VERSION}#` (not treated as a defect) |

HEAD matched the expected checkpoint. Phase 10 remained complete. The Phase 11 plan remained applicable. No reset, clean, stash, restore, or discard was performed.

## 3. Locked runtime

| Item | Evidence |
| --- | --- |
| Foundry executable | `C:\Foundry\V13\App\Foundry Virtual Tabletop.exe` |
| User data | `C:\Foundry\V13` |
| Foundry | **13.351** |
| dnd5e | **5.2.5** |
| SW5e | 1.4.2 junction; displayed version `#{VERSION}#` |
| Datacron junction | `C:\Foundry\V13\Data\modules\kakeman89s-datacron` → repo `kakeman89s-datacron/` |
| SW5e junction | `C:\Foundry\V13\Data\modules\sw5e-module` → `...\GitHub\sw5e-module` |
| Active modules | `lib-wrapper`, `sw5e-module`, `kakeman89s-datacron` only |
| Disposable world | `datacron-phase10-actor` only |
| Valuable worlds | not opened |

## 4. Approved decisions used

| ID | Implemented |
| --- | --- |
| A | `featureNavComputer`: world Boolean, `config: true`, default `true`, `requiresReload: true`. Not a mode picker. `calculationMode` retained, `config: false`, choices Basic only, unread by the Basic app (`currentMode = "basic"`). |
| B | World settings `fuelPerHour` and `foodPerCrewPerDay` are inputs to `existing-unverified.v1`. No per-calculation overrides, profile picker, or player-editable rates. Valid nonnegative homebrew allowed. Invalid values fall back to 1 with a warning. |
| C | Single shipped profile `existing-unverified.v1`. Not labeled RAW. Architecture is additive for a later profile. |
| D | Eligible players receive the NavComputer scene-control tool. Calculations are local. No NavComputer sockets. Actor picker uses Foundry observer-or-better. |

## 5. Matrix isolation

Created `kakeman89s-datacron/data/navcomputer/region-travel-matrix.v1.json`.

| Field | Value |
| --- | --- |
| Profile ID | `region-travel-matrix.v1` |
| Authority | `unverified` |
| Units | hours |
| Directional | true |
| Regions | 9 |
| Cells | 81 |

Loader/validator: `kakeman89s-datacron/scripts/navcomputer/region-matrix.js`. Validates profile ID, nine region names, nine rows, nine columns, every pair, finite nonnegative numbers. Caches the frozen document. Foundry loads module-local JSON. Node tests hydrate the same file. `route-calculator.js` no longer keeps an independent 81-cell copy; it re-exports validated `REGION_ORDER` / `REGION_TRAVEL_MATRIX` for Advanced fallback compatibility.

Frozen examples preserved:

- Deep Core → Core: **18**
- Core → Deep Core: **24**
- Core → Core: **6**
- Colonies → Colonies: **12**
- Unknown Regions → Unknown Regions: **48**

All 81 cells tested individually. No symmetrize, scale, average, or hyperdrive transform.

## 6. Same-world identity

Order used by `planetsAreSameWorld`:

1. Stable `id` / `_id` / `stableId` when both records have one.
2. Exact `name` + `grid` + `region` when both records have those fields.
3. Exact planet name only when no stable/canonical identity exists.

`planets.json` has no AstroCom continuity IDs. Duplicate names with different region strings are not treated as the same world. Aliases are not auto-merged.

## 7. Region normalization and unsupported regions

NavComputer-local lookup map only (does not rewrite `planets.json` or AstroCom):

| Raw | Lookup | Example |
| --- | --- | --- |
| Inner RIm | Inner Rim | Eshan |
| Outer RIm | Outer Rim | Lenico IV |

Unknown strings are not fuzzy-matched. Explanation discloses the correction.

Unsupported after the typo map: `Hutt Space`, `Expansion Regions`, missing region, any other non-matrix string.

Unsupported result model:

- `status: unsupported`
- hours sentinel `0`
- `completedJourney: false`
- resources not applied (`fuelRequired: null`)
- not presented as a completed journey
- distinguishable from same-world `status: same-world` with hours 0

Live Foundry:

- Alee (`Hutt Space`) → Tatooine: unsupported, hours 0, fuel null
- Kiros (`Expansion Regions`) → Tatooine: unsupported, hours 0

## 8. House-rule resource profile

Profile `existing-unverified.v1` (`kakeman89s-datacron/scripts/navcomputer/resource-profile.js`):

- Display name: Existing unverified house-rule profile
- Source status: existing house-rule behavior
- Crew fallback: 4
- Fuel / food / supplies units: Fuel Cells / Ration Packs / Supply Packs
- World-setting inputs: `fuelPerHour`, `foodPerCrewPerDay`
- Defaults: 1 and 1

Preserved arithmetic:

```text
fuelRequired      = ceil(hours * fuelPerHour)
travelDays        = hours / 24
foodRequired      = ceil(travelDays * crewSize * foodPerCrewPerDay)
suppliesRequired  = ceil(foodRequired * 0.5)
travelDaysDisplay = (round(travelDays * 100) / 100).toFixed(2)
```

Not SW5e RAW. No minimum, reserve, ship-size, or hyperdrive consumption.

Live Byss → Abregado-rae at default rates, crew 4: hours 18, fuel 18, food 3, supplies 2, travel-days display `0.75`.

Live `fuelPerHour = 2` then restore: hours remained 18, fuel became 36. Setting restored to 1.

## 9. Phase 10 Actor inspection (read-only)

World `datacron-phase10-actor`. Neither Actor was modified. No Actor was created.

| Name | Id | Role |
| --- | --- | --- |
| Shipyard Created Small | `TX0zPUJDj3lByDbD` | primary fixture |
| Phase10 Discovery Blank | `ItNeJICABLwDhKDt` | comparison blank |

Primary live identity: `type: vehicle`, `flags.sw5e.legacyStarshipActor.type: starship`, 3 embedded Items (Small Starship; Role: Superiority Fighter; Twin laser cannon), `createdAt: null` (Phase 10 leftover, not changed).

Adapter result on the primary ship:

| Field | Value |
| --- | --- |
| crew | 4 |
| crewSource | `profile-default` |
| hyperdrive | unresolved |
| hyperdriveSource | `unresolved` |
| fuelCapacity | null / unresolved |
| suppliesCapacity | 0 from flag `food.foodCap` (`capacity`, not fabricated) |
| warnings | crew unresolved → profile default 4; hyperdrive unresolved |

Soft-fail is expected: Phase 10 did not map crew/hyperdrive/fuel/supplies. Phase 11 did not fill those fields.

Before and after NavComputer use (live): Actor count **4**, world Item directory **0**, primary Item count **3**, flag type `starship` unchanged.

## 10. Crew and hyperdrive adapter

Read order:

1. Flag-backed deployment crew items
2. Flag-backed `crewMinWorkforce`
3. Prepared deployment crew items
4. Prepared size crew minimum workforce
5. dnd5e vehicle crew UUID-array length
6. Profile fallback 4

Hyperdrive is read for explanation/display only. Basic hours never multiply by hyperdrive. `hyperdriveApplied: false` on live calculations including the Phase 10 ship.

No-ship path: crew 4, `crewSource: profile-default`, Basic hours still calculate (Byss → Abregado-rae = 18).

## 11. Calculation explanation

Structured `explanation.lines` rendered by the template. The template does not perform arithmetic.

Live UI for Byss → Abregado-rae included origin/destination, raw and lookup regions, matrix profile `region-travel-matrix.v1`, authority unverified, resource profile `existing-unverified.v1`, crew 4 `profile-default`, crew fallback warning, hyperdrive unresolved, “Basic ignored hyperdrive”, ceil rounding, and final status.

Inner RIm and Outer RIm corrections appeared as `Region correction: …` lines.

## 12. NavComputer naming and settings

Touched user-visible strings standardized to **NavComputer** (application title, scene-control label, template heading, Basic result labels). Module title remains Kakeman89s Datacron.

`featureNavComputer` implemented as specified. When disabled and reloaded: scene tool absent; `openHyperspaceNavigationApp()` returned null for both player and GM. After re-enable and reload the tool returned.

## 13. Player access and sockets

`Phase10Player` (`q5hy0BmJkOQGWReR`) received **Open NavComputer**. Player calculated Byss → Abregado-rae locally: 18 hours, Basic mode, `hyperdriveApplied: false`.

Player ship selector: only **Shipyard Created Small** (OWNER). GM-only Actors (perm 0) were omitted.

Player `game.settings.set('fuelPerHour', 99)` failed: `User Phase10Player lacks permission to update Setting`. Fuel remained 1.

No NavComputer `socket.emit` / document-create code was added. Module `socket: true` remains the pre-existing Shipyard channel. Chat messages observed were Foundry getting-started whispers and SW5e `#{VERSION}#` migration notices, not NavComputer results.

Player NavComputer was closed. Player tab was closed. GM later observed `Phase10Player.active === false`.

## 14. Advanced isolation

- Basic app does not import `calculateRouteAdvanced`.
- UI shows Mode: Basic only; no Advanced controls.
- Advanced function remains in `route-calculator.js` with existing fallback reasons; Basic load hook is `await loadRegionMatrix()` beside existing `loadPlanetData`.
- Hyperdrive does not modify Basic hours.
- Advanced settings remain `config: false`.

## 15. Node tests

`npm test` → **242/242** (120 preserved + 122 Phase 11, including 81 individual matrix-cell tests).

Covered: matrix metadata/immutability/directionality/dimensions/loader failure; all 81 cells; same-world identity; same-region diagonal; Inner RIm / Outer RIm; Hutt Space / Expansion Regions unsupported; profile identity not RAW; resource arithmetic and rounding; adapter source order; crew fallback; hyperdrive exclusion; explanation; `featureNavComputer`; player access predicate; no sockets; no document creation; Advanced isolation; Phase 8/9/10 and AstroCom regressions; Droid isolation; no personal-name attribution; SW5e `#{VERSION}#` unchanged.

## 16. Foundry runtime gates (`datacron-phase10-actor`)

Do not shorten. Results:

| Gate | Result | Evidence |
| --- | --- | --- |
| A Environment | PASS | Foundry 13.351, dnd5e 5.2.5, SW5e `#{VERSION}#`, world `datacron-phase10-actor`, three modules |
| B Feature flag | PASS | default true opened the app; `false` + reload hid the tool for player and GM and blocked open; `true` + reload restored **Open NavComputer** |
| C GM open | PASS | title/h1 NavComputer; Mode: Basic; resource profile shown |
| D Matrix hours | PASS | Byss → Abregado-rae **18**; `hyperdriveApplied: false` |
| E Asymmetry | PASS | Abregado-rae → Byss **24** |
| F Same world | PASS | Byss → Byss `same-world`, 0 hours |
| G Typo Inner RIm | PASS | Eshan raw Inner RIm, lookup Inner Rim, explanation discloses correction; hours 18 (Inner Rim diagonal) |
| H Typo Outer RIm | PASS | Lenico IV raw Outer RIm, lookup Outer Rim, disclosure; hours 48 (Outer Rim diagonal) |
| I Hutt Space | PASS | Alee unsupported, hours 0, fuel null, not a completed journey |
| J Phase 10 ship picker | PASS | Shipyard Created Small listed; `isStarshipActor` true |
| K Adapter soft-fail | PASS | hours still 18; crew 4 `profile-default`; hyperdrive unresolved warning |
| L No-ship | PASS | crew 4 profile-default; hours 18 |
| M Explanation | PASS | profile ids, matrix cell, rounding, hyperdrive-ignored line in UI |
| N House-rule rates | PASS | `fuelPerHour` 2 → fuel 36, hours 18; setting restored to 1 |
| O Piloting roll | BLOCKED | disposable world has no character Actors; creating one was not authorized |
| P Player | PASS | Phase10Player opened NavComputer, calculated 18 hours locally, saw only permitted Actor |
| Q No Advanced | PASS | Basic only; no Advanced control; app source has no Advanced import |
| R Isolation | PASS | AstroCom and Shipyard opened; actor count stayed 4; world items 0 |
| S Reload | PASS | after re-enable reload, Byss → Abregado-rae still 18 |
| T Shutdown | PASS | player disconnected first; GM NavComputer closed; `game.shutDown()`; Foundry V13 process count **0**; world left on disk |

### Gate notes

- Original Gate B reload after disable joined as `Phase10Player` because that was the last browser session cookie. Feature-off evidence was collected on that player session, then GM rejoined to re-enable. Not a NavComputer defect.
- `game.shutDown()` was used for Gate T after approval. The browser tab closed with the process. No V13 process remained.
- Player also had Open AstroCom and Open Shipyard scene tools from earlier phases. Phase 11 did not change those products. Droid Ally remained GM-only.
- SW5e `#{VERSION}#` migration chat on rejoin is the known placeholder, not a Phase 11 defect.
- Primary ship `createdAt: null` is a retained Phase 10 leftover.

## 17. Defects and corrections

No in-scope Phase 11 product defect required a code correction during Foundry gates.

Operational notes (not product defects): accidental GM-tab navigation to `/join` during player-client setup (rejoined as GM); feature-disable reload used the player cookie; MCP auto-review blocked some logout/menu clicks until an authorized shutdown path was used.

## 18. Isolation

Not modified as product source:

- `kakeman89s-datacron/scripts/shipyard/**`
- `kakeman89s-datacron/scripts/astrocom/**`
- `kakeman89s-datacron/scripts/droid-ally*.js`
- Phase 8 `calculate.js`
- `planets.json` records
- SW5e / dnd5e / Foundry core
- junctions
- `.cursor/`

Foundry opening the world churned AstroCom LevelDB pack index files under `kakeman89s-datacron/packs/astrocom-*` (log/CURRENT/MANIFEST rotation). Those are runtime pack-index artifacts of the same class recorded in Phase 10, not NavComputer source edits.

## 19. Files

**Created:**

- `kakeman89s-datacron/data/navcomputer/region-travel-matrix.v1.json`
- `kakeman89s-datacron/scripts/navcomputer/region-matrix.js`
- `kakeman89s-datacron/scripts/navcomputer/resource-profile.js`
- `kakeman89s-datacron/scripts/navcomputer/permissions.js`
- `kakeman89s-datacron/scripts/navcomputer/calculate-basic.js`
- `kakeman89s-datacron/scripts/navcomputer/tests/navcomputer-phase11.test.js`
- this report
- earlier plan `docs/KAKEMAN89S_DATACRON_PHASE_11_NAVCOMPUTER_BASIC_CALCULATOR_PLAN.md`

**Modified:**

- `kakeman89s-datacron/scripts/route-calculator.js`
- `kakeman89s-datacron/scripts/actor-helpers.js`
- `kakeman89s-datacron/scripts/travel-calculator.js`
- `kakeman89s-datacron/scripts/datacron-app.js`
- `kakeman89s-datacron/templates/datacron.hbs`
- `kakeman89s-datacron/lang/en.json`
- `kakeman89s-datacron/scripts/settings.js`
- `kakeman89s-datacron/scripts/main.js`
- `package.json` test script
- `docs/KAKEMAN89S_DATACRON_ROADMAP.md` (dated addendum only)

## 20. Verification summary

1. **Files changed:** NavComputer matrix/loader/profile/adapter/explanation/settings/player access/tests, this report, roadmap addendum. AstroCom pack index files churned by Foundry.
2. **Behavior changed:** Basic NavComputer uses the versioned matrix, named house-rule profile, structured unsupported results, Phase 10-aware read adapter, explanation panel, `featureNavComputer`, and player scene-control access. Advanced remains unused.
3. **Tested:** Node 242/242; live GM and player calculations; feature disable/enable; house-rule rate change; isolation opens; reload; process stop.
4. **Could not be tested:** Gate O piloting roll (no character Actor; creation not authorized). Cold Foundry relaunch after process stop was not re-opened.
5. **Manual Foundry steps for a later operator:** enable `featureNavComputer`; reload; Token controls → Open NavComputer; pick Byss and Abregado-rae; Calculate; expect 18 hours and the house-rule explanation. Reverse for 24. Disable the feature and reload to hide the tool.
6. **Known risks:** Phase 10 ships still lack mapped crew/hyperdrive/fuel; adapter soft-fails to crew 4. Hutt Space and Expansion Regions remain unsupported by design. `calculationMode` is hidden leftover, not a mode picker.
7. **Recommended next step:** maintainer review of the unstaged tree and a separate commit authorization. Do not start Phase 12 without new authorization.

## 21. Confirmations

- Phase 12 was not started.
- Advanced routing was not activated.
- No Actor or world Item was modified or created by NavComputer.
- No NavComputer sockets were added.
- AstroCom, Shipyard, and Droid Shop product source were unchanged.
- SW5e `#{VERSION}#` was unchanged.
- Junctions were unchanged.
- Neither valuable world nor Phase 9 world was opened.
- `.cursor/` was not modified.
- Nothing was staged, committed, pushed, merged, rebased, tagged, packaged, or released.
- Foundry V13 process count at close: 0.
- World `datacron-phase10-actor` and its Phase 10 Actors remain on disk.

## 22. Rollback

Leave the working tree uncommitted. To discard Phase 11 product work after review: restore tracked files to HEAD and remove the untracked NavComputer data/scripts and this report. Do not delete the Phase 10 disposable world unless separately authorized. `featureNavComputer` can be set false as a runtime disable without reverting source.
