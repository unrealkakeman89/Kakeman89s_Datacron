# Phase 10 Plan: Shipyard Starship Actor Creation

- **Date:** 2026-08-17
- **Status:** PLANNING DOCUMENT (controlling implementation specification). Implementation is separately authorized.
- **Planning-only origin:** This file is the accepted Phase 10 plan. It is not the implementation report.
- **Implementation report (later):** `docs/KAKEMAN89S_DATACRON_PHASE_10_SHIPYARD_STARSHIP_ACTOR_CREATION.md`

SESSION DOCUMENT PROTECTION: Files under `ai/sessions/**` are append-only historical records. This Phase 10 plan lives under `docs/` and is the controlling specification for implementation. Do not rewrite it as an implementation report.

## 1. Planning-only status

This document records the accepted Phase 10 architecture, locked runtime, approved maintainer decisions, slices, gates, and non-goals.

Do not treat this file as proof that Phase 10 is complete.

## 2. Repository state at planning (2026-08-17)

| Item | Value |
|---|---|
| Repository root | `C:\Users\ckauble\OneDrive - Riverside Bank of Dublin\Documents\GitHub\Kakeman89s_Datacron` |
| Branch | `v.next` |
| HEAD | `999bc118ba5c16f75271d99f3f26452e6d9b1686` |
| Latest commit | `feat(shipyard): add calculation engine and collaborative UI` |
| Upstream | `origin/v.next` |
| Ahead/behind | ahead 3 |
| Working tree at planning | clean |
| `.cursor/` | gitignored; do not modify |
| Prior Phase 10 plan | none (this file is the first) |
| Node baseline | 91/91 (AstroCom + Phase 8 + Phase 9) |
| Checkpoint | Phase 8 + 9 committed at HEAD |

**Implementation precondition:** begin from this reviewed checkpoint unless the maintainer authorizes a later tree. Do not commit as part of Phase 10 execution.

## 3. Accepted Phase 8 and Phase 9 baseline

- `calculateBuild` is the only cost, build-time, validation, warning, error, explanation, and supported-combination authority.
- GM owns the canonical draft. Players receive a sanitized read-only projection.
- Socket event: `module.kakeman89s-datacron`.
- Player mutation and document-create payloads are rejected.
- `featureShipyard` default false, `requiresReload: true`.
- `shipyardDraftSnapshot` stores sanitized projection only.
- `hydrateDraftFromProjection` does not receive `baseAbilities` from the player projection.
- Phase 9 created no Actor, Item, Activity, Token, Folder, or ownership changes.
- `actor-helpers.js` is NavComputer discovery only. Do not expand it into a creation service.

## 4. Scope

Implement: eligibility, GM-only preview, stale-preview protection, pure Actor/Item mapping, GM-local creation orchestration, folder/ownership/image/token/provenance, operation lock, duplicate-name block, rollback, guarded failure injection, GM UI section, socket rejection of forged Phase 10 requests, GM-only canonical draft persistence, Node tests, disposable-world Foundry gates, implementation report, roadmap addendum.

## 5. Non-goals

Phase 11 NavComputer implementation; Phase 12 Droid Shop; existing Actor conversion or update; bulk create; credit deduction; merchants; construction queues; Actor-to-Shipyard reverse import; workbook coverage expansion; AstroCom changes; advanced routing; public release; workbook packaging; artwork generation; Wookieepedia; staging/commit/push/merge/rebase/PR/tag/package/release; helper text; tooltips; post-success undo.

## 6. Locked runtime

- Foundry 13.351 — `C:\Foundry\V13\App\Foundry Virtual Tabletop.exe`
- User Data — `C:\Foundry\V13`
- dnd5e 5.2.5
- SW5e 1.4.2 — `C:\Users\ckauble\OneDrive - Riverside Bank of Dublin\Documents\GitHub\sw5e-module` (`v.next`, HEAD `294fe31018817dc07f5f38d9a326b8aa3669622b`, tag `1.4.2`)
- Datacron junction — `C:\Foundry\V13\Data\modules\kakeman89s-datacron`
- SW5e junction — `C:\Foundry\V13\Data\modules\sw5e-module`
- JavaScript ES modules; no TypeScript; no bundler
- SW5e `#{VERSION}#` is intentional; do not modify or report it as a defect
- Do not change either junction

World: `datacron-phase10-actor` / title `Datacron Phase 10 Actor Creation` / system `dnd5e`. Modules: `lib-wrapper`, `sw5e-module`, `kakeman89s-datacron` only. Do not reuse `datacron-phase9-shipyard`.

## 7. Approved maintainer decisions

1. Duplicate names: **block**. No silent rename, overwrite, suffix, or acknowledgment bypass.
2. Folder: default **none**. Allow existing Actor folder only. No automatic folder creation (test-only empty folder allowed inside the Phase 10 world for rollback tests).
3. Ownership: default **GM-only**. Allow explicit Owner/Observer assignment to eligible players. Do not infer from observers or connected users.
4. Image: native SW5e/dnd5e default; optional existing Foundry-compatible path; no download/generate/fetch; no Windows filesystem paths.
5. Token: native blank Starship defaults plus verified size grid. Hull/shield bars only if live native blank or verified SW5e behavior confirms them.
6. Post-success undo: **not implemented**. Rollback is for incomplete creation only.
7. Unmapped optional fields: **do not block**. Missing required identity/size/creation data **blocks**.
8. UI: minimal Phase 10 GM section. Do not redesign Phase 9.
9. Helper text: **none**.
10. Tooltips: **none**.
11. Player notification: sanitized status + Actor name only. No Actor source.
12. Player projection: **no UUID or link**. Sidebar follows ownership.
13. Mapping scope: Phase 8 validated fields plus Slice 10.1 required identity and size components. No workbook-calculation expansion.
14. Canonical GM draft persistence: additive GM-only setting preserving `baseAbilities` and other authoritative inputs across reconnect. Do not change the player-projection protocol. Never use the player projection as create input.

### Approved labels (no instructional prose)

Preview; Create Starship; Actor Name; Folder; Ownership; Image; Creating…; Created; Create failed; Preview stale; Duplicate name; Retry.

## 8. Locked Actor target

Create:

```text
type: "vehicle"
flags.sw5e.legacyStarshipActor.type: "starship"
```

Do not create `character` + `flags.sw5e.starshipCharacter.enabled`.

Prefer SW5e helper `createBlankLegacyStarshipActorData` / `flags.sw5e.createStarship` over recreating undocumented internals.

`actor-helpers.js` already detects this identity via `isLegacyStarshipVehicle`. Do not change it unless live evidence proves it contradicts this target.

## 9. Live target-discovery gate (Slice 10.1)

Mandatory before production mapping is treated as verified.

Inside `datacron-phase10-actor`, inspect blank SW5e Starship creation, helper vs flag seed, source vs prepared vs items vs UI-only, flags, token, sheet, size, tier, abilities, hull, shields, movement, hyperdrive, fuel, supplies, cargo, crew/deployment, weapons/mods, token bars, default image, reload, native sheet editability.

Test: native blank create; `flags.sw5e.createStarship`; helper-generated source; nested Items in initial `Actor.create`.

Prefer the most atomic supported method that preserves required data.

Continue automatically if live identity confirms vehicle + `legacyStarshipActor.type === "starship"`. Stop mapping only if that identity is materially contradicted.

Record a versioned target-schema profile. No private filesystem paths in shipped profile data.

## 10. Actor mapping architecture

```text
kakeman89s-datacron/scripts/shipyard/actor/
  mapping-schema.js
  map-actor.js
  map-items.js
  preview.js
  validate-mapping.js
  eligibility.js
  create-starship.js
  rollback.js
```

Pure mapping accepts: validated GM draft, `calculateBuild` result, target-schema profile, creation options.

Pure mapping returns: `actorSource`, `embeddedItemSources`, `tokenSource`, `mappingWarnings`, `unmappedFields`, `provenance`.

It must not create documents. Foundry writes belong only in `create-starship.js` and rollback.

Do not mix mapping into `calculate.js`, sockets, projection, templates, scene controls, or `actor-helpers.js`.

## 11. Item and Activity architecture

Copy verified SW5e Items from `Compendium.sw5e-module.starships` (and related packs if discovery names them). Preserve source identity, Activities, Effects, flags, system data, names, quantity/equipped where applicable.

Do not synthesize Activities or custom automation.

Do not embed character deployments on the ship unless live SW5e ships contain those Items.

Static pack IDs (verify live in 10.1):

| Selection | Pack id | Item `_id` | Type |
|---|---|---|---|
| Small | `starships` | `6BN8l5E8QtYt103T` | feat |
| Medium | `starships` | `6liD1m4hqKSeS5sp` | feat |
| Large | `starships` | `RFKvLuqE13INBxqd` | feat |
| Role: Superiority Fighter | `starships` | `vyc2GIsA50ilVSyg` | feat |
| Role: Freighter | `starships` | `QY7jBe7EgKLz8z1p` | feat |
| Role: Corvette | `starships` | `2KEpnIbTdhgY06tF` | feat |
| Twin laser cannon | `starships` | `sHKo4DKkCRTMJwVK` | weapon |
| Deflection Armor | `starships` | `aG6mKPerYCFmkI00` | equipment |
| Quarters, Living | `starships` | `aieXRd4ADt9T6B8g` | loot |

Map weapon/armor/suite only when Phase 8 input selects them. Placeholder workbook values remain unmapped.

## 12. Eligibility

All required:

Current user is GM; feature enabled; canonical GM draft available; revision current; session owner current; `calculateBuild` succeeds; no hard errors; supported combination valid; Actor name valid; live target profile exists; required mappings valid; preview current; preview hash matches; no operation running; duplicate name absent; operation ID not already consumed.

Do not accept player projection state.

Warnings: optional unmapped fields do not block. Missing identity, size feat, or Actor type blocks.

## 13. Preview and stale-preview

Generate preview from the exact mapped source submitted to creation.

Display: name, type, identity, size, tier if mapped, hull, shields, movement, mapped Items, unmapped fields, cost, build time, folder, ownership, image, token, warnings, provenance.

Do not calculate cost.

`previewHash` covers: canonical Actor source, embedded Item sources, token source, folder, ownership, image, draft revision, calculation identity (`profileId` + `grandTotal` + `buildDays`), operation ID / preview nonce.

Any relevant change invalidates the preview and disables Create until regenerated.

## 14. Phase 9 UI integration

GM-only section with approved labels. Player mode omits all creation controls.

After success: draft remains. Another Actor from the same draft requires a new preview and new operation ID.

## 15. GM-only authority and player boundary

Creation is GM-local. No socket message initiates create, retry, rollback, undo, folder mutation, ownership mutation, item creation, Actor update, or Actor deletion.

Unknown or forged Phase 10 request types are rejected.

Optional `shipyard-actor-created` notification: status, Actor name, revision/operation status only.

Player projection may show created/failed status and Actor name. No UUID.

## 16. Duplicate-name, operation-id, folder, ownership

- Duplicate: exact trimmed-name match against world Actors blocks with localized Duplicate name status.
- Operation ID: UUID at Preview; in-memory lock; consumed on success; double-submit rejected.
- Folder: `null` or existing Actor-type folder id. No production auto-create.
- Ownership: default `{ [gmId]: OWNER, default: NONE }`. Explicit player Owner (3) or Observer (2) only when selected.

## 17. Image, token, provenance

Image: empty → native default. Validate Foundry data paths (`modules/`, `systems/`, `icons/`, `worlds/`). Reject `C:\`, `file:`, remote `http(s):` fetch URLs.

Token: SW5e size grid (`small`/`sm`=1, `medium`/`med`=2, `large`/`lg`=4). `actorLink: true`. Bars only if 10.1 confirms.

Provenance under `flags.kakeman89s-datacron`: `createdByShipyard`, `shipyardSchemaVersion`, `calculationEngineVersion`, `workbookSha256` (hash constant only), `vectorBaselineVersion`, `draftRevision`, `previewHash`, `buildCost`, `buildTime`, `createdAt`, `createdBy` (user id), `sourceProfile`, `operationId`.

Do not store personal names, workbook paths, formulas, capture notes, player payloads, private paths, or workbook binary.

## 18. Transaction-like creation sequence

1. Verify world id `datacron-phase10-actor` for injection only; production create may run in any world where the GM is authorized, but injection cannot.
2. Verify GM, canonical draft, recalculate via `calculateBuild`.
3. Verify eligibility, regenerate mapping, verify preview hash.
4. Acquire lock, check duplicate name, validate sources.
5. Create Actor and Items using the Slice 10.1-selected method.
6. Run required SW5e post-creation handling.
7. Verify identity, items, sheet-safe fields, folder, ownership, provenance.
8. Mark success, release lock, notify. Display success only after verification.

## 19. Rollback

Delete only current-operation Actor (and a test-only empty folder created by this operation). Never delete pre-existing documents or compendium sources.

Preserve draft, calculation, preview, and diagnostics.

Partial rollback reports remaining IDs and does not report success.

No post-success undo.

## 20. Native sheet and NavComputer validation

Verify native SW5e Starship sheet after create, sheet open, world reload, Foundry restart, Shipyard close/reopen, and NavComputer discovery.

If NavComputer fails: compare Actor identity to existing helper. Correct Phase 10 mapping if the helper already matches vehicle+legacy. Do not expand NavComputer.

## 21. Node testing

Preserve existing 91 tests. Add `shipyard-phase10.test.js` to `package.json`.

Cover eligibility, mapping purity, identity, preview hash/stale, duplicate name, lock, items, Activities on copied sources, folder/ownership/image/token, provenance, orchestration success/failure, rollback, pre-existing protection, player rejection, no duplicated calculations, Phase 8 parity, Phase 9 sync, no workbook path, no personal-name attribution, no SW5e mutation.

Mock Foundry APIs. Do not claim native-sheet success from Node.

## 22. Foundry runtime gates

Record PASS / FAIL / BLOCKED / NOT RUN for every gate listed in the original Phase 10 planning assignment (environment, Phase 8/9 regression, preview, create, identity, mappings, rollback, injection, reload, NavComputer, sockets, shutdown, Phase 11 not started). Do not shorten the list.

## 23. Failure injection

Test-only. Guard: world id `datacron-phase10-actor` + GM + setting default false + nonproduction path. No UI control.

Hooks: Actor-create fail before Actor exists; embedded-item fail after Actor exists; post-create verification fail; rollback fail; double submit; stale preview; player-forged create message.

## 24. Document-safety and shutdown

Record Actor/Item/Actor-folder counts and relevant IDs before/after each operation. Deltas must equal the current operation. No existing Actor or Item may be updated.

Shutdown: close player Shipyard and sheets; disconnect player; verify disconnected; close GM windows; `game.shutDown()`; handle other-user dialog if present (not a Shipyard defect); close Foundry V13; verify no V13 process remains.

## 25. Files proposed

**Create:** `scripts/shipyard/actor/*.js`; `scripts/shipyard/tests/shipyard-phase10.test.js`; this plan; later implementation report.

**Modify:** `permissions.js`, `socket.js`, `socket-runtime.js`, `shipyard-app.js`, `shipyard-app.hbs`, `shipyard.css`, `lang/en.json`, `settings.js`, `package.json` test script, `draft-state.js` (canonical hydrate only), `projection.js` (optional sanitized created status/name, no UUID), `docs/KAKEMAN89S_DATACRON_ROADMAP.md` (dated addendum during implementation).

**Do not modify:** `calculate.js` math; `actor-helpers.js` unless identity contradiction; SW5e; junctions; `.cursor/`; workbook binary.

## 26. Implementation slices

| Slice | Purpose |
|---|---|
| 10.0 | Checkpoint revalidation |
| 10.1 | Live SW5e discovery; stop only if identity contradicted |
| 10.2 | Pure Actor mapping schema and validation |
| 10.3 | Embedded Item and Activity mapping |
| 10.4 | Preview and stale-preview |
| 10.5 | GM-only create orchestration and operation locking |
| 10.6 | Folder, ownership, image, token, provenance |
| 10.7 | Failure handling and rollback |
| 10.8 | Phase 9 UI + canonical draft persistence |
| 10.9 | Node regression suite |
| 10.10 | Disposable-world Foundry validation |
| 10.11 | Implementation report and roadmap addendum |

Per-slice entry: prior slice complete. Per-slice rollback: disable `featureShipyard`; delete only current-operation documents; leave world on disk.

## 27. Whole-phase Definition of Done

Live target verified; vehicle+starship identity; pure mapping; items copied with Activities; eligibility; deterministic preview; stale preview blocks; duplicate names block; lock prevents double create; GM-only; player requests rejected; new Actor only; native sheet opens and stays editable; mappings correct; unmapped disclosed; ownership/folder/image/token/provenance correct; no workbook path/formulas; injection and rollback proven; reload and Foundry restart; NavComputer discovery; Phase 9 regression; full Node suite; all Foundry gates recorded; Foundry stopped; no valuable world opened; no workbook binary; no calc math change; nothing staged or committed; Phase 11 not started.

## 28. Phase 11 prerequisites

Separate authorization. Do not start Phase 11 in this phase.

## 29. Exact recommended implementation action

1. Revalidate checkpoint and runtime (10.0).
2. Discover live SW5e create path in `datacron-phase10-actor` (10.1).
3. Implement mapping through UI and tests (10.2–10.9).
4. Run Foundry gates (10.10).
5. Write the implementation report and roadmap addendum (10.11).
6. Stop. Do not commit. Do not begin Phase 11.
