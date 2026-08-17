# Kakeman89's Datacron — Phase 3 Shared Architecture and v.next Disposition Plan

**Date:** 2026-08-14  
**Phase:** 3 — Shared Architecture and v.next Disposition Plan  
**Status:** Planning complete. Proposed dispositions and reuse-gate recommendation await maintainer approval.  
**Implementation authorization:** None. This document does not authorize code, packs, junctions, worlds, or Phase 4.

Stable component identifiers are those from `KAKEMAN89S_DATACRON_PHASE_0_BASELINE_INVENTORY.md`. Compatibility facts are from `KAKEMAN89S_DATACRON_PHASE_1_COMPATIBILITY_VERIFICATION.md`. Licensing evidence states are from `KAKEMAN89S_DATACRON_PHASE_2_LICENSING_PROVENANCE_AUDIT.md` and remain **informational**.

A proposed disposition is **not** implementation authorization.

---

## 1. Phase 2 acceptance and private-use policy

Phase 2 is **accepted** as the completed licensing and provenance evidence baseline.

**Product and risk decision (maintainer, 2026-08-14):** Kakeman89's Datacron is being developed as a **private, noncommercial TTRPG tool for the maintainer's own use**. The maintainer accepts the risk of using source material, datasets, maps, rules references, and other components whose redistribution rights have not been established.

### 1.1 Licensing policy change

Licensing and provenance are **not** development blockers for architecture, local/private implementation, local data conversion, local compendium generation, testing, private Foundry installation, private gameplay, internal validation, or selective reuse of `origin/v.next`.

Phase 2 evidence is preserved for source tracking, attribution, later correction, content replacement, takedown response, and a **future** public-distribution review. Later development phases must **not** repeatedly warn about licensing. Implementation must **not** stop because a dataset license, matrix source, map source, Wookieepedia-derived information, StarWarsMap license, provenance, or public redistribution permission is incomplete.

For this private-use profile, technical reuse is judged on data quality, accuracy, completeness, maintainability, performance, compatibility, security, architectural suitability, and repair/replace effort.

**Licensing evidence state remains an informational field. It is not a veto on private development.**

### 1.2 Public distribution boundary

This decision is **not** a finding that material is licensed or approved for public distribution.

- Private development and private use are authorized by the maintainer.
- Public packaging, Foundry package listing, or broad redistribution is **not** part of the currently authorized release profile.
- If public distribution is chosen later, that review will use preserved Phase 2 evidence at that time.
- Public-distribution uncertainty must not delay the private-use roadmap.
- Public-release blockers must not be repeatedly surfaced unless the maintainer changes the release profile or asks about distribution.

### 1.3 Takedown policy (architecture requirement, not a workflow to implement now)

Where practical, retain enough source metadata to identify and replace a component, record, image, map, or dataset.

Simple future requirement only:

1. Record known source information.
2. Allow affected content to be identified.
3. Remove or replace content if the maintainer decides to do so.
4. Preserve append-only historical documentation of the change.

Do not implement a complex legal workflow.

### 1.4 Artwork policy

Artwork remains under Kakeman89's control. Do not generate artwork, automatically ingest Wookieepedia artwork, stop development because artwork is missing, or require final artwork during architecture or calculator implementation. Existing images and maps may be inventoried and technically evaluated. Selection and replacement are handled separately by Kakeman89.

### 1.5 QUARANTINE rule for this profile

QUARANTINE must **not** be assigned solely because licensing or redistribution evidence is unknown.

QUARANTINE may still be proposed when a component is technically unsafe, corrupt, has unknown behavior that cannot be bounded, could damage data, cannot be validated, conflicts with the locked runtime, presents a security concern, has lineage so unclear that reliable correction is impossible, or is otherwise unsuitable for implementation for reasons **beyond** public licensing.

---

## 2. Pre-planning repository check

| Item | Value |
|------|--------|
| Current branch | `main` |
| HEAD | `49244ad78067c77ffa1e645fe9038f8690bddc32` |
| Upstream | `origin/main` |
| Tracked diff | Empty (`git diff HEAD`) |
| `origin/v.next` | `a01c1d7b46a8ea62a7b1d95e39131aace3f6315b` |
| `origin/v.next` checked out | **No** |
| `.cursor/` | Pre-existing; **not modified** |
| Unexpected product change | None |

---

## 3. SW5e 1.4.2 location and V13 junction mismatch

| Item | Recorded state |
|------|----------------|
| Authoritative SW5e 1.4.2 repository | `C:\Users\ckauble\OneDrive - Riverside Bank of Dublin\Documents\GitHub\sw5e-module` |
| That checkout exists | **Yes** |
| Git HEAD | `294fe31018817dc07f5f38d9a326b8aa3669622b` |
| Tag | `1.4.2` |
| Manifest version field | `#{VERSION}#` (unsubstituted in source) |
| Expected V13 junction target | The SW5e 1.4.2 repository above |
| Observed V13 path | `C:\Foundry\V13\Data\modules\sw5e-module` |
| Observed junction type | Junction / mount point |
| Observed target | `C:\Foundry\investigation-runtime\sw5e-module-1.4.1-remediation-runtime` |
| Observed manifest version | `1.4.1-remediation-test` |
| Required target for locked-runtime testing | SW5e **1.4.2** repository |
| Junction correction in Phase 3 | **Not performed.** Requires separate explicit authorization. |
| Live runtime claiming 1.4.2 | **Forbidden** while V13 points at the remediation tree |

This is a **configuration mismatch**, not a Datacron code defect. Combined V13 + dnd5e 5.2.5 + SW5e 1.4.2 runtime verification remains open. No safe disposable world has been established. Actor creation and live starship `actor.system` verification remain gated.

---

## 4. Language and toolchain

**Proposed language: JavaScript ES modules**, matching `origin/v.next` and Foundry v13 native module loading.

TypeScript and an npm bundler are **not** selected. Phase 1 verified ApplicationV2, HandlebarsApplicationMixin, and scene-control registration on Foundry 13.351 without a compile step. `v.next` has no `package.json`. Introducing a build toolchain would be modernization, not a demonstrated compatibility or maintainability necessity.

Optional later **dev-only** Node `node:test` (or a tiny assert harness) may run pure functions without bundling. That is not authorization to install packages in Phase 3.

---

## 5. Reuse-gate recommendation

**Recommended outcome: B. SELECTIVE SALVAGE**

This is a recommendation for maintainer approval. It is not implementation authorization.

### 5.1 Why not A — Reuse as primary foundation

`origin/v.next` is a working Basic hyperspace ApplicationV2 plus a GM droid estimator. It is **not** a four-domain module. Adopting it as the primary foundation would freeze:

- Droid pricing that is not the approved Tier I–VI + 10% markup + condition model
- Starship helpers that read `actor.system.attributes.deployment` / `equip.hyperdrive` rather than the Phase 1 SW5e 1.4.2 static target (`vehicle` + `flags.sw5e.legacyStarshipActor.type === "starship"`, with crew/hyperdrive likely on flags / VehicleData rather than those paths)
- No AstroCom Journal model
- No Shipyard
- Disabled Advanced graph still occupying a large share of code and data
- Inconsistent naming (NaviComputer / Datacron / Hyperspace Navigation vs NavComputer)
- No tests, no schema version, unused `socket: true`

Those are architecture and correctness problems, not licensing problems.

### 5.2 Why not C — Rebuild feature domains from scratch

Rebuilding every domain would discard Phase 1–compatible ApplicationV2 + Handlebars mixin usage, GM scene-control registration, settings registration, local JSON `fetch` of module data, localization namespace, shared CSS, and the exact 81-cell matrix already encoded with 0 mismatches. Replacement effort for that platform shell is high relative to the salvage value.

### 5.3 Why not D — Clean rebuild

Unresolved public redistribution rights **must not** independently force a clean rebuild under the private-use profile. A clean rebuild is not justified by Foundry 13 incompatibility of the shell (the shell is statically compatible). It would delay NavComputer Basic and Droid Shop UI for no locked-runtime gain.

### 5.4 Why B — Selective salvage

Salvage the **platform and NavComputer Basic workflow**; replace or redesign domains that fail requirements; defer the route graph; invent Shipyard and AstroCom journals as new domains rather than stretching the planet combobox or actor picker.

| Keep / revise | Replace / redesign |
|---------------|-------------------|
| Module ID `kakeman89s-datacron` | Fuel/food/supplies as unlabeled RAW (keep as **rule profile**, not hardcoded approved rules) |
| Basic manifest structure (Foundry 13 / dnd5e 5.2.5) | Starship actor access helpers (NAV-008) |
| ApplicationV2 + Handlebars mixin | Droid pricing model (DROID-001) |
| GM scene-control registration pattern | AstroCom data model (journals + browser; JSON is a source, not the product) |
| Settings registration pattern | Route-graph integration in the initial release |
| Exact 81-cell matrix **values** | Product naming consistency (NavComputer) |
| Basic calculation workflow shell | Collaborative sockets (none until Shipyard observe-mode needs them) |
| Local JSON-loading pattern | Test infrastructure (absent; add lightweight harness later) |
| Route-validation **knowledge** (Python scripts as deferred tooling) | Migration/versioning (absent; add conservative schema version later) |
| CSS / Handlebars / `lang/en.json` structure | Attribution metadata (Kakeman89 only; personal-name fields) |

Licensing uncertainty did not drive this choice.

---

## 6. Shared platform architecture

One Foundry module. Four isolated feature domains plus shared services. Features must be separately enableable so a defect in one domain can be switched off.

### 6.1 Proposed install layout (not created in Phase 3)

```
kakeman89s-datacron/
  module.json
  LICENSE                (root license may remain repo-root; module folder should reference it)
  lang/en.json
  styles/datacron.css    (shared tokens; domain files may split later)
  templates/
    shared/
    navcomputer/
    droidshop/
    astrocom/
    shipyard/
  scripts/
    main.js              (init/ready/scene controls only)
    shared/              (logger, settings, permissions, schema version)
    navcomputer/
    droidshop/
    astrocom/
    shipyard/
  data/
    sources/             (private local datasets; not generated Foundry documents)
    navcomputer/         (matrix JSON once extracted)
    generated/           (rebuildable journals/packs; separable from sources)
```

`v.next` currently flattens all JS under `kakeman89s-datacron/scripts/`. Selective salvage **may** keep that flat layout for the first NavComputer/Droid increment and introduce domain folders when AstroCom/Shipyard are implemented. Either path is compatible with ES modules. Do not create directories in Phase 3.

Root-level maps, xlsx, GeoJSON, Python, and `Galactic Map.jpg` stay **outside** the Foundry install unit unless a later phase explicitly copies a private data file into `data/sources/`.

### 6.2 Shared platform responsibilities

| Concern | Proposal |
|---------|----------|
| Responsibility | Lifecycle, settings, logging, permissions helpers, feature flags, schema version marker, scene-control registry |
| Inputs | Foundry hooks; world/client settings |
| Outputs | Registered settings; opened applications; log lines |
| Data ownership | World settings for flags and rule-profile numbers; no Actor/Journal ownership |
| Settings | Feature flags; debug; later schemaVersion. Fuel/food remain NavComputer rule-profile settings, not platform RAW. |
| Applications | None owned by platform except future shared dialogs |
| Services | `logger`, `permissions.isGM`, `features.isEnabled(id)` |
| Templates / styles | Shared chrome only |
| Permissions | Scene tools GM-only unless a later phase adds observer apps |
| Document operations | None at init/ready |
| Hooks | `init` (settings), `ready` (log environment; **no writes**), `getSceneControlButtons` (GM tools), existing stale-app cleanup |
| Socket needs | **None** for initial private NavComputer/Droid. Keep `"socket": false` until Shipyard observe-mode requires it. |
| Migration needs | World setting `schemaVersion`; no automatic document mutation at ready |
| Test boundaries | Feature-flag defaults; permission helpers |
| Dependencies | Foundry 13.351 APIs; dnd5e 5.2.5 as system; SW5e 1.4.2 recommended, not bundled |
| Failure boundaries | Missing SW5e → warn, do not crash; disabled feature → hide control |
| Feature-enable | World booleans: `featureNavComputer`, `featureDroidShop`, `featureAstroCom`, `featureShipyard` (names indicative, not final keys) |
| Relationship to v.next | REVISE `main.js`, `settings.js`, `logger.js`, `module.json` |

### 6.3 Manifest plan (later edit, not now)

- Keep id `kakeman89s-datacron` and Foundry 13 / dnd5e 5.2.5 declarations.
- Authors: **Kakeman89** only (remove personal-name attribution when editing is authorized).
- Set `"socket": false` until a domain needs it.
- Add `license` field pointing at GPL-3 for **code**.
- Do not list root maps in the manifest.
- Placeholder GitHub URL: replace or omit when packaging is authorized; not a Phase 3 edit.

### 6.4 Entry points

| Entry | Users | Permission | Essential? |
|-------|-------|------------|------------|
| Scene control — NavComputer | GM | GM | Yes for NavComputer |
| Scene control — Droid Shop | GM | GM | Yes for Droid Shop |
| Scene control — AstroCom | GM | GM | Yes when AstroCom ships; Journal pack remains usable without the app |
| Scene control — Shipyard | GM | GM | Yes when Shipyard ships |
| Module settings | GM | world settings ACL | Yes |
| Player observe (Shipyard) | Players | later; not sockets yet | Optional later |
| Actor sheet buttons | — | Not for initial release | No |
| Macros | Avoid as the only GM gate | If exposed, re-check GM inside openers | Optional |

ApplicationV2 is **required** for new module windows on the locked Foundry 13 target (Phase 1 verified the APIs `v.next` already uses).

---

## 7. Isolated feature domains

### 7.1 AstroCom

| Concern | Proposal |
|---------|----------|
| Responsibility | GM planetary / hyperspace **reference** (gazetteer), not the travel calculator |
| Inputs | Private source datasets; human corrections; schema |
| Outputs | Generated JournalEntry documents and/or a custom browser view; never scrape at runtime |
| Data ownership | Source records in `data/sources/`; generated journals in a module pack or world import distinguished from sources |
| Settings | Feature flag; optional pack visibility |
| Applications | Custom browser (recommended); Journal sidebar still works |
| Services | Ingest/normalize (offline or GM-triggered rebuild, not runtime scrape); search/index |
| Templates / styles | AstroCom browser only |
| Permissions | GM edit/rebuild; players may later read if the GM allows journal visibility |
| Document operations | Journal create/update **only** via an explicit rebuild path after Phase 4 PoC; never at `ready` |
| Hooks | Scene control when enabled |
| Sockets | None |
| Migrations | Pack version / rebuild, not silent journal mutation |
| Test boundaries | Schema validation; duplicate detection; fixture journals — not 2029-record import in Phase 4 |
| Dependencies | Foundry JournalEntry + Folder APIs (v13: single `folder` field; folder depth 4 / pack 3) |
| Failure | Missing field → display “not documented”; do not invent prose |
| Feature-enable | Off until Phase 6 MVP |
| v.next relationship | ASTRO-001/002 and DATA-001 are **sources**, not the gazetteer. NAV-007 is NavComputer, not AstroCom. |

### 7.2 Shipyard

| Concern | Proposal |
|---------|----------|
| Responsibility | Guided SW5e starship construction from the **actual** workbook once analyzed; GM leads; players observe; cost; gated Actor creation |
| Inputs | Workbook (external maintainer file); verified SW5e Actor shape |
| Outputs | Draft build state; preview; optional Actor |
| Data ownership | Draft in memory / world flag / Journal — **decide in Phase 9**; not Actor until commit |
| Settings | Feature flag |
| Applications | GM builder app; later player observe view |
| Services | Rule model and calculation engine **after** Phase 7 workbook analysis. **No formulas invented in Phase 3.** |
| Permissions | GM authority for edits and Actor create; players observe |
| Document operations | `Actor.create` only after runtime gates below |
| Hooks | Scene control when enabled |
| Sockets | Deferred until observe-mode needs sync |
| Migrations | None until a draft schema exists |
| Test boundaries | Pure calculation tests after mapping exists |
| Dependencies | SW5e 1.4.2 on the V13 junction; dnd5e 5.2.5 VehicleData |
| Failure | Invalid draft cannot create an Actor; recoverable errors |
| Feature-enable | Off until Phases 7–10 |
| v.next relationship | **No Shipyard implementation exists.** NAV-008 is not a Shipyard foundation. |

**Actor creation gates (unchanged):**

1. V13 junction points at the SW5e **1.4.2** repository.
2. New empty disposable world.
3. Live target verification of starship Actor shape.
4. Actual workbook analysis (Phase 7).

Static starship target (do not expand field maps now): `vehicle` + `flags.sw5e.legacyStarshipActor.type === "starship"`. Character + `starshipCharacter.enabled` is legacy.

### 7.3 NavComputer

| Concern | Proposal |
|---------|----------|
| Responsibility | Basic region-to-region travel estimate using the **exact** 81-cell matrix; resource estimates via a **rule profile**; optional private GM piloting roll |
| Inputs | Planet name → region; optional ship Actor via a **new adapter**; settings rule profile |
| Outputs | Hours, regions crossed, resources, DC notes, explanation of which profile produced resources |
| Data ownership | Matrix as data (retain values); planets as NavComputer lookup subset or shared read of AstroCom index later |
| Settings | Fuel/food numbers as **unverified private defaults**, labeled as rule profile, not RAW |
| Applications | REVISE APP-001; title **NavComputer** |
| Services | See §10 separation |
| Permissions | GM launch; re-check GM in openers (close macro hole) |
| Document operations | None |
| Hooks | Scene control |
| Sockets | None |
| Migrations | None for matrix |
| Test boundaries | 81-cell matrix tests; region typo warnings; adapter tests with fixtures (not live worlds) |
| Dependencies | Planet list; dnd5e actors only through adapter |
| Failure | Unknown region → warn, do not silently 0-hour without explanation |
| Feature-enable | On for initial private use after implementation authorization |
| v.next relationship | Salvage APP-001, NAV-001 values, NAV-002, NAV-007, NAV-009; replace NAV-008; revise NAV-004/005; defer NAV-003 |

Hyperdrive remains **out of Basic**. Do not let current fuel/food/supplies defaults become hardcoded approved rules.

### 7.4 Droid Shop

| Concern | Proposal |
|---------|----------|
| Responsibility | Companion **pricing only** using Tier I–VI chassis, 10% class markup, condition modifiers, optional adjustments |
| Inputs | GM-entered tier, class, condition, optionals; **not** the Saga floor/2 engine |
| Outputs | Quote; optional chat card |
| Data ownership | Tables as data/config; no droid Actor creation in scope |
| Settings | Optional house-rule overrides; feature flag |
| Applications | REVISE APP-002 shell; rename to Droid Shop |
| Services | New pricing domain |
| Permissions | GM-only calculate/share (keep) |
| Document operations | Optional ChatMessage; keep HTML escaping |
| Hooks | Scene control |
| Sockets | None |
| Test boundaries | Table-driven quotes once the maintainer supplies tier/markup/condition numbers |
| Dependencies | None on SW5e documents for pricing-only |
| Failure | Missing table → refuse to quote rather than fall back to Saga floor/2 |
| Feature-enable | On after pricing tables exist; do not ship Saga formula as Droid Shop |
| v.next relationship | Reuse ApplicationV2 **shell**; **replace** DROID-001 |

Until Tier I–VI / markup / condition sources are supplied, the UI may be scaffolded to show “rules table not loaded” rather than computing the old formula under a new name.

---

## 8. AstroCom architecture decision (one-folder limitation)

Phase 1: JournalEntry has a **single** `folder` field. Folder max depth 4 (world) / 3 (pack). Dual physical membership is impossible.

### 8.1 Options compared

| Option | Canon/Legends | Region/sector/system/grid | Routes | Search | Maintenance | Duplicate drift | Index fields | Performance | UX | Rebuildability |
|--------|---------------|---------------------------|--------|--------|-------------|-----------------|--------------|-------------|-----|----------------|
| 1. Physical folder duplication | Two trees | Extra copies per axis | Poor | Sidebar only | High | **Severe** | Weak | More docs | Familiar sidebar | Poor |
| 2. Duplicate JournalEntries | Same | Same | Poor | Confusing | High | **Severe** | Weak | Worse | Worse | Poor |
| 3. Lightweight linking Journals | Links to canonical | Many stub journals | Awkward | Mixed | Medium | Link rot | Medium | Extra docs | Extra clicks | Medium |
| 4. One canonical Journal + metadata-driven custom browser | Field on record | Indexes, not folders | Index of lane names | App search | **Best** | **Lowest** | **Required** | Depends on index; PoC in Phase 4 | Best GM speed | **Best** |
| 5. Multiple packs | Canon pack vs Legends pack | Does not solve multi-axis | Separate pack possible | Per pack | Medium | Low if no dupes | Per pack | Good split | Sidebar split useful | Good |
| 6. Flags-only with no browser | Possible | Unusable at table | Poor | Foundry search only | Low | Low | Limited | Fine | Poor for GM speed | Fine |

### 8.2 Recommendation

**Preferred: option 4, with option 5 as an optional split of Canon vs Legends packs** (two packs of canonical journals, still one folder membership each).

- One journal (or one journal per planet continuity record) is canonical.
- Continuity is a field (`canon` / `legends` / `both` — exact enum is a Phase 4 decision).
- Region, sector, system, grid, lanes are **metadata and indexes**, not duplicate folders.
- A custom AstroCom browser queries indexes. The Journal directory can still show a shallow folder (e.g. by region) as a convenience, not as the dual-tree.
- Hyperspace routes are references (names/ids), not duplicated journal trees, in the initial AstroCom. Full route navigation remains **deferred**.

**Phase 4 proof-of-concept gate still required:** tiny synthetic fixture; confirm pack folder depth; confirm index/search; confirm a journal cannot be placed in two folders; measure browser performance on a small set before any 2029-record rebuild.

Do not import or normalize production data in Phase 3 or Phase 4 until that PoC is accepted.

---

## 9. Data architecture (private use)

Ingest and normalize **local** data while retaining source metadata. Do not import in Phase 3.

Support:

- Multiple source datasets (module `planets.json`, root dump, xlsx, StarWarsMap, GeoJSON, aliases, future manual tables)
- Source identifiers
- Record-level source metadata where available
- Canon and Legends classification
- Validation and duplicate detection
- Aliases and corrections / manual overrides
- Rebuilding generated compendiums
- Removal or replacement of a source
- Private local datasets not intended for release
- **Separation of source data from generated Foundry documents**

Licensing evidence state is stored as metadata, not used as a private-use veto.

Simple takedown: filter-by-source-id and rebuild. Append-only session/roadmap notes for the change.

Artwork files are not part of automated ingest.

---

## 10. NavComputer calculation separation

Keep these modules conceptually distinct (files may stay split or be split later):

| Piece | Role | v.next today | Proposal |
|-------|------|--------------|----------|
| Region matrix data | 81 cells, including asymmetry | Hardcoded in `route-calculator.js` | **RETAIN values**; extract to JSON; tests for every cell |
| Calculation service | Lookup hours; same-name 0; warn on unknown region | `calculateRouteBasic` | REVISE; do not “fix” asymmetry |
| Rule profile | Names the resource model and whether it is verified | Implicit defaults | New; current fuel/food/supplies = profile `existing-unverified` |
| Fuel calculation | Profile function | `ceil(hours * fuelPerHour)` | Remain in profile until maintainer supplies rules |
| Food/supplies | Profile function | food ceil; supplies half food; crew fallback 4 | Same |
| Ship data adapter | Crew / hyperdrive from Actor | NAV-008 wrong surface likely | **REPLACE** adapter; Basic still ignores hyperdrive |
| Basic UI | Origin/destination, results, explanation | APP-001 | REVISE; show profile name; NavComputer title |
| Future graph router | Advanced path | NAV-003 disabled | **DEFER** |
| Planet/route data | Name→region for Basic | ASTRO-001 via planet-data.js | Shared read; clean region typos in ingest |
| Result explanation | Why the numbers | Partial narrative | Required: matrix cell + profile id |

Invalid regions (`Hutt Space`, `Inner RIm`, etc.) are **data-quality** issues: warn in NavComputer; correct in ingest. Do not expand `REGION_ORDER` silently to invent matrix cells.

Matrix rule authority remains **unverified** until the maintainer provides its source. It may still be used as a local private-use data source.

---

## 11. Droid Shop calculation separation

| Piece | Role |
|-------|------|
| Chassis tier table | Tier I–VI prices (data; not yet supplied) |
| Class markup | 10% class markup (data; not yet supplied) |
| Condition modifier | Condition table (data; not yet supplied) |
| Optional adjustments | Explicit GM extras |
| Calculation service | `tier + markup + condition + optionals` only when tables present |
| UI | REVISE APP-002 / TEMPLATE-002 |
| Quote output | Chat card with escaped HTML |
| Settings / house rules | Overrides labeled as house rules |

**Do not preserve the Saga-inspired `floor(subtotal / 2)` formula as Droid Shop.** The existing ApplicationV2 shell can be reused while the pricing domain is replaced. If tables are missing, do not silently compute the old formula.

---

## 12. Shipyard boundaries (no formulas)

| Boundary | Proposal |
|----------|----------|
| Workbook analysis | Phase 7; file remains external until permission/storage is decided |
| Rule model | Output of Phase 7 mapping |
| Calculation engine | Phase 8; tests from workbook vectors |
| Draft build state | Not an Actor |
| GM authority | All destructive and create actions |
| Player observation | Later UI; sockets only if required |
| Validation | Soft warnings vs hard blocks per homebrew-flexibility (data safety only for hard blocks) |
| Preview | Derived stats before create |
| Starship Actor mapping | Only verified static target until live 1.4.2 |
| Actor creation | Gated (§7.2) |
| Provenance/version flags | On created Actor flags when create is authorized |
| Error recovery | Failed create must not leave a half-initialized Actor as “success” |

---

## 13. Test architecture (proposed, not installed)

Do not apply ECC 80% coverage as a gate for this Foundry module. Prefer tests that lock **behavior that must not drift**.

| Kind | Purpose | When |
|------|---------|------|
| Pure calculation tests | Matrix 81 cells; later droid tables; later shipyard math | First NavComputer implementation |
| Matrix-cell tests | Asymmetry included | With NAV-001 extract |
| Schema validation | Planet/source records | AstroCom ingest |
| Data validation | Duplicates, region typos | Ingest |
| Adapter tests | Fixtures for vehicle+flag vs character+legacy | After NAV-008 replacement; no live world |
| Application tests | Optional; high cost in Foundry | Manual first |
| Manual Foundry tests | Scene controls; GM gates; Basic calculate | Disposable world after junction fix |
| Migration tests | Idempotency of schemaVersion | When migrator exists |
| Disposable-world tests | Never on campaign worlds | After a safe world exists |
| Build/package validation | Manifest id, esmodules paths, no `__pycache__` | Packaging |

Harness: Node built-in test runner or a no-dependency assert file importing ES modules. **Do not install packages in Phase 3.**

---

## 14. Migration architecture (proposed, not implemented)

- Explicit module schema version (constant + world setting).
- World setting marker written only after a successful, idempotent step.
- Idempotency: re-running a version is a no-op.
- No automatic destructive cleanup.
- No image clearing.
- No unrelated Actor mutation.
- Record-level failure reporting.
- No false successful completion.
- Backup requirement before any world-mutating migrator (manual Foundry backup).
- Interrupted-run recovery: version marker not advanced on failure.
- Manual validation gates after first use.

`ready` must not migrate documents in the initial NavComputer/Droid salvage. MIG-001 (absence) is replaced by this design when implementation is authorized.

---

## 15. Runtime prerequisites (not done in Phase 3)

1. Separate explicit authorization to retarget `C:\Foundry\V13\Data\modules\sw5e-module` to the 1.4.2 repository.
2. New empty disposable world on Foundry 13.351 + dnd5e 5.2.5 + SW5e 1.4.2.
3. No world open until that world exists.
4. Ship-builder workbook supplied for Phase 7.
5. Droid Shop tables supplied before quotes are computed.
6. Matrix source optional for private use; still recorded as unverified.

---

## 16. Component disposition catalog

**Approval status for every row:** Proposed — awaiting maintainer approval.

Compatibility columns use Phase 1 static evidence. SW5e 1.4.2 **runtime** remains unverified while the V13 junction points at 1.4.1-remediation-test. “SW5e 1.4.2 compatibility” below means static target alignment, not live proof.

Licensing evidence is informational (Phase 2 states).

### 16.1 Platform, package, hooks

| ID | Path | Purpose / behavior | Req. | F13 | dnd5e 5.2.5 | SW5e 1.4.2 static | Rules | Data quality | Provenance | License evidence | Security | Perms | Mig. risk | Testability | Maintain | Deps | Disposition | Justification | Required work | Regression | Removal impact | Architecture destination |
|----|------|--------------------|------|-----|-------------|-------------------|-------|--------------|------------|------------------|----------|-------|-----------|-------------|----------|------|-------------|---------------|----------------|------------|----------------|--------------------------|
| BASE-001 | `main` checkout | LICENSE + README stub | Packaging | N/A | N/A | N/A | N/A | N/A | Project | GPL-3 file | N/A | N/A | Low | N/A | Low | None | **RETAIN** | Valid git root | Later merge of salvaged module | N/A | Would drop license stub | Repo root |
| BASE-002 | `origin/v.next` tree | Candidate module | All | Partial | Declared | Unverified live | Mixed | Mixed | Mixed | Informational | Mixed | Mixed | Low today | Poor | Medium | Foundry | **REVISE** | Salvage, not wholesale adopt | Apply this plan | Per component | High if discarded | Selective salvage source |
| PKG-001 | `module.json` | Manifest 1.0.1 | Packaging | Declares 13 | Declares 5.2.5 | Recommends unpinned | N/A | N/A | N/A | No license field | Socket flag unused | N/A | Low | Manifest checks | Medium | dnd5e | **REVISE** | Compatible core; metadata wrong | Kakeman89; socket false; license field | Load module | Cannot install | Shared platform |
| PKG-002 | `kakeman89s-datacron/` | Install unit | Packaging | Yes as folder | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | Low | N/A | Medium | Manifest | **REVISE** | Correct install grain | Keep as package root | Install path | Loses module | Shared |
| PKG-003 | `.gitignore` | Ignores json backups only | Packaging | N/A | N/A | N/A | N/A | N/A | N/A | N/A | Tracks pyc | N/A | Low | N/A | Low | None | **REVISE** | Does not ignore bytecode | Ignore `__pycache__` | N/A | Low | Shared |
| HOOK-001 | `scripts/main.js` | Entry | Shared | Compatible APIs | System check | Snapshot warn | N/A | N/A | Project | Partial | Macro hole on hyperspace open | GM scene | None | Poor | Medium | Apps | **REVISE** | Salvage lifecycle | Feature flags; GM re-check | Open apps | No entry | Shared |
| HOOK-002 | init | registerSettings | Shared | Yes | N/A | N/A | N/A | N/A | Project | N/A | N/A | N/A | None | Poor | Medium | SET-* | **REVISE** | Pattern good | Flags | Settings exist | No settings | Shared |
| HOOK-003 | ready | Log only | Shared | Yes | N/A | N/A | N/A | N/A | Project | N/A | No writes | N/A | None | Poor | High | Logger | **RETAIN** | Safe ready | Keep no-write | Log | Low | Shared |
| HOOK-004 | getSceneControlButtons | GM tools | Shared | Record API on v13 | N/A | N/A | N/A | N/A | Project | N/A | GM early return | GM | None | Manual | Medium | Apps | **REVISE** | Pattern verified | Per-feature tools | Buttons | No UI entry | Shared |
| HOOK-005 | closeApplicationV2 | Stale singleton | Shared | Yes | N/A | N/A | N/A | N/A | Project | N/A | N/A | N/A | None | Poor | High | Apps | **RETAIN** | Harmless hygiene | Keep | N/A | Low | Shared |
| SOCKET-001 | manifest socket | Declared, unused | Collab | N/A | N/A | N/A | N/A | N/A | N/A | N/A | Unused surface | N/A | None | N/A | Low | None | **REVISE** | Not needed yet | `socket: false` | N/A | None | Shared later Shipyard |
| MIG-001 | (absent) | No migrator | Safety | N/A | N/A | N/A | N/A | N/A | N/A | N/A | No silent writes | N/A | N/A | N/A | N/A | None | **REPLACE** | Need conservative version marker later | Design §14 | Version tests | None now | Shared |
| LOG-001 | `logger.js` | Prefixed logs | Shared | Yes | N/A | N/A | N/A | N/A | Project | Partial | N/A | N/A | None | Easy | High | Settings debug | **RETAIN** | Small and useful | Keep | N/A | Debug harder | Shared |
| LEGAL-001 | `LICENSE` | GPL-3 text | Code license | N/A | N/A | N/A | N/A | N/A | FSF text | DOCUMENTED file | N/A | N/A | None | N/A | High | None | **RETAIN** | Code license document | Do not treat as dataset license | N/A | License missing | Repo |
| LEGAL-002 | authors/README | Personal-name credit | Attribution | N/A | N/A | N/A | N/A | N/A | Conflict | CONFLICTING | Privacy | N/A | None | N/A | Low | Manifest | **REPLACE** | Kakeman89 only | Edit when authorized | N/A | Wrong credit | Notices |
| GOV-001 | `origin/v.next` `.cursor/rules` | Old Cursor rules | None | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | None | N/A | Low | None | **REMOVE** | Not module runtime | Exclude from package | N/A | None for Foundry | Out of product |
| GOV-002 | untracked `.cursor/` on main | ECC install | None | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | None | N/A | N/A | None | **DEFER** | Out of scope; do not modify | Leave | N/A | N/A | Tooling only |

### 16.2 Applications, UI, settings

| ID | Path | Purpose | Disposition | Justification / work |
|----|------|---------|-------------|----------------------|
| APP-001 | `datacron-app.js` | Basic hyperspace UI; mode hardcoded basic | **REVISE** | Compatible ApplicationV2. Rename NavComputer; GM re-check; explanation panel; do not enable Advanced. Destination: NavComputer. Regression: calculate + roll. |
| APP-002 | `droid-ally-app.js` | GM pricing UI | **REVISE** | Shell reusable. Bind to new pricing service; refuse old formula. Destination: Droid Shop. |
| TEMPLATE-001 | `datacron.hbs` | Hyperspace markup | **REVISE** | Keep structure; NavComputer copy; profile explanation. |
| TEMPLATE-002 | `droid-ally-pricing.hbs` | Droid form | **REVISE** | Fields for tier/class/condition when tables exist. |
| STYLE-001 | `datacron.css` | Shared dark UI | **REVISE** | Salvage tokens; split later if needed. |
| LANG-001 | `lang/en.json` | en strings | **REVISE** | NavComputer / Droid Shop names; drop Advanced from UI until deferred feature returns. |
| SET-000 | `settings.js` | Registration helper | **REVISE** | Pattern good; add feature flags; do not treat defaults as RAW. |
| SET-001 | calculationMode | Unread by app | **REVISE** | Replace with feature flags / explicit Basic-only. |
| SET-002 | enableRandomEvents | Unused | **DEFER** | Reserved; no consumer. |
| SET-003 | randomEventChance | Unused | **DEFER** | Reserved. |
| SET-004 | fuelPerHour | Unverified fuel | **REVISE** | Keep as rule-profile input, labeled unverified. |
| SET-005 | foodPerCrewPerDay | Unverified food | **REVISE** | Same. |
| SET-006 | pilotingFallbackSkill | Fallback `acr` | **REVISE** | Verify SW5e skill ids on 1.4.2 runtime later. |
| SET-007 | debugMode | Client log gate | **RETAIN** | Harmless. |
| SET-008–010 | Advanced graph filters | Hidden; unused UI | **DEFER** | With NAV-003. |

Foundry 13 compatibility for APP/TEMPLATE/STYLE/SET: Phase 1 VERIFIED STATIC for ApplicationV2, PARTS, Handlebars mixin, settings API. Rules accuracy for SET-004/005: unverified. Testability: poor until harness. Migration risk: world settings persist — changing keys needs a setting migrator or dual-read.

### 16.3 NavComputer domain

| ID | Path | Behavior | Disposition | Justification |
|----|------|----------|-------------|---------------|
| NAV-001 | `REGION_TRAVEL_MATRIX` | 81/81 match; asymmetric | **REVISE** | **Retain exact values**; extract to data; tests; authority unverified; private use allowed. Do not symmetrize. |
| NAV-002 | `calculateRouteBasic` | Matrix lookup; ignores hyperdrive | **REVISE** | Correct Basic scope. Improve unknown-region handling. |
| NAV-003 | `calculateRouteAdvanced` | Graph A*; UI disabled | **DEFER** | Future route phase; do not enable. |
| NAV-004 | `travel-calculator.js` | Fuel/food/supplies unverified; crew paths likely wrong | **REVISE** | Become rule profile + call replaced adapter. Not approved RAW. |
| NAV-005 | Piloting DC | Heuristic | **REVISE** | Private heuristic profile; do not label RAW. |
| NAV-006 | `piloting-roll.js` | Private GM roll | **REVISE** | Keep behavior; verify skill keys live later. |
| NAV-007 | `planet-combo.js` | Name picker | **REVISE** | NavComputer input, not AstroCom. |
| NAV-008 | `actor-helpers.js` | Character+enabled treated normalized; system.attributes crew | **REPLACE** | Conflicts with static 1.4.2 starship target. Not Shipyard. |
| NAV-009 | `time-display.js` | Format hours | **RETAIN** | Pure display. |

Removal of NAV-001 values would destroy the only exact matrix encoding. Removal of NAV-008 without replacement breaks crew estimates (acceptable if adapter is replaced first).

### 16.4 Droid

| ID | Path | Disposition | Justification |
|----|------|-------------|---------------|
| DROID-001 | `droid-ally-pricing.js` | **REPLACE** | Saga floor/2 ≠ Tier I–VI + 10% + condition. Do not silently keep. |
| DOC-004 | `docs/droid-allies-sw5e.md` | **REPLACE** | Documents the rejected model as the product aid. |

APP-002/TEMPLATE-002 remain REVISE (shell).

### 16.5 AstroCom-related data (not a gazetteer)

| ID | Path | Disposition | Justification |
|----|------|-------------|---------------|
| ASTRO-001 | module `planets.json` 2029 | **REVISE** | Private source for ingest; region typos/duplicate `Noe'ha'on`; no Canon/Legends; not journals. Quality work, not licensing veto. |
| ASTRO-002 | `planet-data.js` | **REVISE** | Keep module-local fetch pattern; add validation. |
| DATA-001 | root `planets.json` 5444 | **REVISE** | Second private source; Image filenames not to fetch. |
| DATA-009 | aliases | **REVISE** | Useful ingest table; extend. |
| ASSET-002 | geography xlsx | **REVISE** | Private geography source for merge; not ship-builder. |
| DATA-006 | merge report | **REMOVE** | Generated; regenerable; not runtime. |
| DATA-007 | random-events.json | **DEFER** | Unused placeholders. |

### 16.6 Route graph family (deferred navigation)

| ID | Path | Disposition | Justification |
|----|------|-------------|---------------|
| ROUTE-001 | `hyperspace-routes.json` | **DEFER** | Generated graph; UI disabled; future phase. |
| ROUTE-002 | `hyperspace-routes.js` | **DEFER** | Loader for Advanced. |
| ROUTE-004–006 | catalog/hand/tiers | **DEFER** | Authoring inputs. |
| DATA-003 | StarWarsMap JSON | **DEFER** | Topology source for later routes; private reuse allowed; not initial release. |
| DATA-008 | vendored hyperlanes copy | **DEFER** | Duplicate of DATA-003 subset; keep one source later. |
| DATA-004, DATA-005 | grid-to-geo, control points | **DEFER** | Build calibration. |
| ASSET-003 | GeoJSON | **DEFER** | Build input; CARTO/Wikia lineage informational. |
| TOOL-001,003,008 | graph/audit Python | **DEFER** | Tooling for deferred graph. |
| DOC-005 | coordinate transform doc | **DEFER** | Documents deferred pipeline. |
| TEST-001 | Python route validator + report | **DEFER** | Valuable later; not JS matrix tests. |

### 16.7 Artwork and maps

| ID | Path | Disposition | Justification |
|----|------|-------------|---------------|
| ASSET-001 | `Galactic Map.jpg` | **DEFER** | Maintainer artwork track; not required for calculators; may remain as private calibration file. Do not generate replacement. |

### 16.8 Docs, tools, generated files

| ID | Path | Disposition | Justification |
|----|------|-------------|---------------|
| DOC-001 | v.next README | **REVISE** | Useful map of the old module; personal-name; naming. |
| DOC-002 | CHANGELOG | **REVISE** | Keep history; continue append-only. |
| DOC-003 | compatibility-notes (two paths) | **REVISE** | Keep one; drop duplicate module copy when editing authorized. |
| DOC-006 | generated audit md | **REMOVE** | Regenerable. |
| TOOL-002 | debug inspector | **REMOVE** | Not an esmodule; not product. |
| TOOL-004 | merge-planet-data.py | **REVISE** | Private ingest helper. |
| TOOL-005 | normalize_planet_names.py | **REVISE** | Ingest helper. |
| TOOL-006,007 | generated maps/audits | **REMOVE** | Regenerable outputs. |
| TOOL-009 | `__pycache__/*.pyc` | **REMOVE** | Accidental bytecode; not unsafe to worlds; do not ship. |
| TEST-002–004 | absent lint/package/runtime | **REPLACE** | Introduce lightweight tests later (§13). Absence records, not files. |

### 16.9 QUARANTINE

**None.** No inventoried component is proposed for QUARANTINE. Unused socket, wrong formulas, and unknown licenses are REVISE/REPLACE/DEFER/informational — not technical quarantine.

Bytecode TOOL-009 is REMOVE (hygiene), not QUARANTINE: it does not run in Foundry and cannot damage world documents.

---

## 17. Disposition counts

Counts below are **proposed component IDs** (Phase 0 identifiers), not file counts. Files inherit their parent component.

| Disposition | Count (approx.) | Notes |
|-------------|-----------------|--------|
| RETAIN | 7 | BASE-001, HOOK-003, HOOK-005, SET-007, NAV-009, LOG-001, LEGAL-001 |
| REVISE | Majority of platform, NavComputer Basic, data sources, UI | Salvage set |
| REPLACE | DROID-001, NAV-008, LEGAL-002, DOC-004, MIG-001 (new system), TEST-002–004 (new harness) | Wrong domain or absence |
| REMOVE | GOV-001 from product, TOOL-002, TOOL-006, TOOL-007, TOOL-009, DATA-006, DOC-006 | Non-runtime / accidental / regenerable |
| QUARANTINE | **0** | |
| DEFER | Advanced graph family, artwork, random events, GOV-002, SET-002/003/008–010 | Initial release out of scope |

Exact per-ID assignments are in §16. If two IDs share a file (HOOK-* in `main.js`), the file is revised once; hook-level rows still apply.

---

## 18. Remaining blockers (private-use development)

These delay **specific** later phases or live tests. They are not licensing vetoes.

1. V13 junction still on `1.4.1-remediation-test` — blocks any claim of live SW5e 1.4.2 verification and Actor creation.
2. No safe disposable world.
3. Ship-builder workbook still missing — blocks Phase 7+ Shipyard formulas.
4. Droid Shop numeric tables not supplied — blocks computing the approved quote (UI may still be structured).
5. AstroCom folder/index PoC not done — Phase 4.
6. Combined V13 + 5.2.5 + 1.4.2 runtime still open.

Matrix source unknown does **not** block private NavComputer Basic.

---

## 19. Decisions requiring maintainer approval

1. Accept **B. SELECTIVE SALVAGE**.
2. Accept proposed dispositions in §16 (or mark exceptions).
3. Accept AstroCom option 4 (+ optional Canon/Legends pack split), with Phase 4 PoC still required.
4. Accept JavaScript-without-bundler.
5. Accept Droid Shop as **new pricing domain** (no Saga fallback).
6. Accept fuel/food/supplies as **existing-unverified rule profile** until rules are supplied.
7. Separately authorize V13 junction retarget to the 1.4.2 repo when ready for live tests.
8. Do **not** treat this document as Phase 4 or implementation authorization.

---

## 20. Phase 3 exit checklist

| Criterion | Met? |
|-----------|------|
| Every inventoried component has a proposed disposition | Yes |
| Licensing uncertainty does not independently block private reuse | Yes |
| Shared architecture defined | Yes |
| Four domain boundaries defined | Yes |
| AstroCom architecture recommended | Yes (option 4; Phase 4 PoC required) |
| Shipyard defined without invented formulas | Yes |
| NavComputer separates rules from UI | Yes |
| Droid Shop replaces prior pricing behavior | Yes (REPLACE DROID-001; REVISE shell) |
| Test architecture proposed | Yes |
| Migration architecture proposed | Yes |
| One reuse-gate outcome recommended | **B. SELECTIVE SALVAGE** |
| Recommendation subject to maintainer approval | Yes |
| No implementation | Yes |
| No junction change | Yes |
| No branch change | Yes |
| Phase 4 not started | Yes |

---

## 21. What Phase 4 may consume (when authorized)

- Reuse outcome if the maintainer accepts B (or a stated alternative).
- AstroCom option 4 PoC with **synthetic** fixture only.
- Journal single-folder constraint from Phase 1.
- Planet JSON as a **private source candidate**, not a shipped gazetteer.
- No junction change unless separately authorized.
- No production ingest.

---

*End of Phase 3 plan. Phase 4 is not authorized by this document.*
