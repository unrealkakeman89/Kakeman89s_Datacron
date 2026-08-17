# Kakeman89s Datacron — Phase 9 Shipyard Collaborative UI

- **Document title:** Phase 9 — Shipyard Collaborative UI
- **Date:** 2026-08-17
- **Status:** COMPLETE (ApplicationV2 + sockets + Node 91/91 + disposable two-client Foundry gates). Phase 10 Actor creation **not started**.
- **Branch:** `v.next`
- **HEAD at report time:** `3570d7a3b7bfaaba14ecdb086e1c9f43f8d103ad` (unchanged; no commit)
- **Attribution:** Kakeman89

## 1. Authorization

Executed against the approved plan **Phase 9 Shipyard UI**, including the 2026-08-17 execution-authorization addendum.

Authorized: Stage A draft/projection/permissions/settings; Stage B ApplicationV2 + templates/styles/i18n + scene control; Stage C sockets + snapshot reconnect; Node tests; disposable world `datacron-phase9-shipyard`; two isolated clients; Phase 9 report; append-only roadmap addendum; Foundry shutdown.

Not authorized / not performed: Phase 8 checkpoint commit/push; Phase 10 Actor/Item/Activity/Token/Folder/ownership creation; workbook packaging; staging/commit/push/merge/rebase/PR/tag/package/release; Phase 8 formula-coverage expansion; Create Starship control; NavComputer/AstroCom/Droid window reuse; `actor-helpers.js` reuse.

SESSION DOCUMENT PROTECTION: no `ai/sessions/**` files were edited.

## 2. Preflight

| Item | Value |
| --- | --- |
| Repository root | `C:\Users\ckauble\OneDrive - Riverside Bank of Dublin\Documents\GitHub\Kakeman89s_Datacron` |
| Branch | `v.next` (ahead of `origin/v.next` by 2) |
| HEAD | `3570d7a3b7bfaaba14ecdb086e1c9f43f8d103ad` |
| Staged | none |
| Pre-existing dirty | Phase 6 report, roadmap, untracked Phase 7/8 docs, untracked Phase 8 shipyard domain, `package.json` |
| SotG workbook in Datacron | absent |
| Geography workbook | present |
| Node suite at Phase 9 start | **70/70** (Phase 8 baseline) |
| Working-tree policy | no reset/clean/stash of Phase 8 baseline |

## 3. Locked runtime

| Item | Evidence |
| --- | --- |
| Foundry executable | `C:\Foundry\V13\App\Foundry Virtual Tabletop.exe` |
| User data | `C:\Foundry\V13` |
| Foundry | **13.351** (setup UI + `game.version`) |
| dnd5e | **5.2.5** |
| SW5e source | `C:\Users\ckauble\OneDrive - Riverside Bank of Dublin\Documents\GitHub\sw5e-module` |
| SW5e branch / HEAD / tag | `v.next` / `294fe31018817dc07f5f38d9a326b8aa3669622b` / `1.4.2` |
| Datacron junction | `C:\Foundry\V13\Data\modules\kakeman89s-datacron` → Datacron module folder |
| SW5e junction | `C:\Foundry\V13\Data\modules\sw5e-module` → SW5e source |
| World | `datacron-phase9-shipyard` / Datacron Phase 9 Shipyard / system `dnd5e` |
| Enabled modules | `lib-wrapper`, `sw5e-module`, `kakeman89s-datacron` only |
| Clients | Cursor browser = GM; isolated Chrome (`--user-data-dir`, CDP 9222) = Phase9Player |

Junctions were not changed. `#{VERSION}#` in the SW5e package identity remains the SW5e checkout placeholder and was not edited.

## 4. Inspected / created / changed files

### Created

- `kakeman89s-datacron/scripts/shipyard/draft-state.js`
- `kakeman89s-datacron/scripts/shipyard/projection.js`
- `kakeman89s-datacron/scripts/shipyard/permissions.js`
- `kakeman89s-datacron/scripts/shipyard/socket.js`
- `kakeman89s-datacron/scripts/shipyard/socket-runtime.js`
- `kakeman89s-datacron/scripts/shipyard/shipyard-app.js`
- `kakeman89s-datacron/scripts/shipyard/tables-data.js` (embedded Phase 8 tables for Foundry ESM; JSON tables remain authoritative files)
- `kakeman89s-datacron/scripts/shipyard/tests/shipyard-phase9.test.js`
- `kakeman89s-datacron/templates/shipyard/shipyard-app.hbs`
- `kakeman89s-datacron/styles/shipyard.css`
- `docs/KAKEMAN89S_DATACRON_PHASE_9_SHIPYARD_COLLABORATIVE_UI.md` (this file)

### Changed

- `kakeman89s-datacron/scripts/shipyard/options.js` — load embedded tables (no Node `fs` in Foundry)
- `kakeman89s-datacron/scripts/shipyard/tests/shipyard-phase8.test.js` — tables directory resolved against module root
- `kakeman89s-datacron/scripts/settings.js` — `featureShipyard` default false, `shipyardDraftSnapshot` world object
- `kakeman89s-datacron/scripts/main.js` — singleton, scene control, socket register, API
- `kakeman89s-datacron/lang/en.json` — `KAKEMAN89SDATACRON.Shipyard.*` + setting/scene keys
- `kakeman89s-datacron/module.json` — `styles/shipyard.css`
- `package.json` — Phase 9 test file on `npm test`
- `docs/KAKEMAN89S_DATACRON_ROADMAP.md` — append-only addendum

### Not changed

- SW5e module, junctions, SotG workbook, Actor/Item/Token APIs, NavComputer/AstroCom/Droid apps, `actor-helpers.js`, plan file, `.cursor/`

## 5. Authority chain

GM inputs → immutable draft (`updateDraftField` / `updateDraftAbility`) → `calculateBuild` → result/warnings/errors/explanation → sanitized projection → player observe + world snapshot.

Proof:

- Draft updates always call `calculateBuild(nextInput)` and store that output.
- Projection only reshapes `draft.calculation`; it does not add credits.
- UI handlers map fields → draft → publish projection. Templates display `totals.*` from that result.
- Node tests: vector `v2-small-bare` via draft equals direct `calculateBuild`; UI modules contain no `grandTotal +` / `Actor.create`.

## 6. Draft, projection, permissions, snapshot

- Draft is deep-frozen. Unknown fields and stale revisions are rejected. Reset returns `createEmptyDraft`.
- Projection protocol v1. Forbidden keys: workbook paths, capture notes, formulas, document-create instructions.
- Permissions: feature must be enabled; GM (role ≥ 4) edits/resets/publishes; players observe; assistants cannot edit.
- `featureShipyard` world Boolean, default **false**, `requiresReload: true`.
- `shipyardDraftSnapshot` world object, `config: false`, GM-written sanitized projection + revision/sessionOwnerId/cleared. Not a calculator.

## 7. Socket protocol and multiple-GM policy

Event: `module.kakeman89s-datacron` (Foundry module channel). Message types remain `shipyard-draft-updated`, `shipyard-draft-cleared`, `shipyard-request-snapshot`, `shipyard-snapshot`.

Sender identity: Foundry callback user id when provided; payload `_senderUserId` is a stamp, not a trusted role claim. Validators use `game.users.get(senderUserId)`.

Rules enforced in `validateShipyardSocketMessage`:

- unknown type rejected
- non-GM mutation/publish/clear rejected
- document-create keys rejected
- stale `draft-updated` revision rejected
- snapshot requires target user
- session owner: only the stored owner GM may broadcast; competing GM rejected unless explicit takeover flag (not exposed in UI)

Observers never advertise their own user id as session owner (`resolveShipyardSessionMeta`).

## 8. ApplicationV2, a11y, i18n, styling

Separate `ShipyardApp` (`HandlebarsApplicationMixin(ApplicationV2)`). GM edit vs player observe in one class. Scene control visible when feature enabled. No Create Actor control.

Accessibility: labeled controls, visible focus (`outline` on focus), live status region (`role="status"` `aria-live="polite"`), errors in `role="alert"`. Keyboard: size/tier/role/weapon/install/lock/armor/quarters/abilities/reset are sequential form controls.

Localization under `KAKEMAN89SDATACRON.Shipyard.*` plus setting and scene-control keys. No instructional helper prose/tooltips added.

## 9. Recorded Phase 8 coverage backlog (not implemented)

Nonzero weapon cost, locked-install, fire-link/mount, modification, nonzero-miscellaneous, and cost-multiplier vectors remain a parallel backlog. Phase 9 did not add vectors or formula families.

## 10. Node results

| Suite | Result |
| --- | --- |
| Phase 8 parity + isolation | still green (70 historical tests retained in the combined run) |
| Phase 9 draft/projection/permissions/socket/UI isolation | added |
| Full `npm test` at closeout | **91/91** pass |

## 11. Foundry gates

World created via setup **Create World** (not copied). Users: default Gamemaster + disposable `Phase9Player` (PLAYER).

| ID | Gate | Result | Evidence |
| --- | --- | --- | --- |
| G1 | Environment identity | **PASS** | Foundry 13.351, dnd5e 5.2.5, world `datacron-phase9-shipyard`, modules lib-wrapper + sw5e-module + kakeman89s-datacron |
| G2 | Feature default false | **PASS** | After first join with modules enabled, `featureShipyard === false`; scene tools lacked shipyard |
| G3 | Feature enable + reload | **PASS** | Setting true + reload; tool `kakeman89s-datacron-open-shipyard` present |
| G4 | GM scene control / edit mode | **PASS** | `openShipyardApp()`; mode “GM edit”; inputs present |
| G5 | Player scene control / observe mode | **PASS** | Isolated Chrome as Phase9Player; mode “Player observe”; `hasInputs` false; `hasReset` false |
| G6 | Phase 8 vector-equivalent UI parity | **PASS** | Small + Superiority Fighter → `grandTotal` **32000**, `buildDays` **6d**, status success |
| G7 | Projection sync | **PASS** (retest) | After socket-channel fix, player live-updated from cleared to `32,000cr` without reopen |
| G8 | Mutation rejection | **PASS** | Player `DRAFT_UPDATED` + `createActor` rejected (`non-GM mutation`, `document-creation request rejected`) |
| G9 | GM reset | **PASS** (retest) | Original live reset **FAIL** (player stayed on 32000). After session-meta + `module.${id}` channel: player `displayState=cleared`, grand total empty |
| G10 | Stale revision | **PASS** | Validator returns `stale revision` when `currentRevision` 50 vs message revision 1 |
| G11 | Disconnect/reconnect snapshot | **PASS** | Player Chrome reload + rejoin opened observe at `32,000cr` / calculated / connected |
| G12 | Projection sanitization | **PASS** | Snapshot JSON lacked workbook path / SotG / Actor.create; `validateProjection` rejects dirty keys |
| G13 | Accessibility / keyboard | **PASS** | 13 labels, live region, size focused, tab order size→tier→role→weapon→…→reset |
| G14 | Localization | **PASS** | `Shipyard.Title` → “Shipyard”; scene control and settings keys present |
| G15 | Application lifecycle | **PASS** | Singleton open via API; close hook registered in `main.js`; GM app remained rendered across updates |
| G16 | Document-count safety | **PASS** | Actors 0, Items 0, Tokens 0, Journals 0, Scenes 0 throughout. Folders 12 are world/system defaults, not Shipyard-created documents |
| G17 | Console / log review | **PASS** | No Actor.create from Shipyard. Socket rejections logged as `[Shipyard] rejected socket message` with type/sender/errors only |
| G18 | Node suite | **PASS** | 91/91 after Foundry gates |
| G19 | Shutdown | **PASS** | Recorded in §15 |
| G20 | Phase 10 non-start | **PASS** | No Create control; no Actor/Item APIs in shipyard UI; no Phase 10 files |

### Gate G9 original failure (preserved)

- **Original result:** FAIL — GM reset cleared GM UI and world snapshot, but the player client kept `displayState=calculated` / `32,000cr`.
- **Cause 1:** observer `_sessionMeta` fell back to the player user id, so inbound GM `draft-cleared` failed session-owner checks.
- **Cause 2:** socket event `kakeman89s-datacron.shipyard` was not the Foundry module channel, so live emits were not delivered. Player first totals came from world-setting hydrate on open, not live push.
- **Correction:** `resolveShipyardSessionMeta`; event `module.kakeman89s-datacron`; cleared projections applied as cleared display state.
- **Regression test:** `observer session meta never advertises the player as owner`; `socket event uses Foundry module channel`.
- **Retest result:** PASS — player cleared live; later GM rebuild synced `32,000cr` live.

## 12. Defect loop

In-scope Phase 9 defects were corrected in UI/socket only. Phase 8 `calculateBuild` math was not changed. No documents were created to “fix” a gate. Phase 10 was not started.

## 13. Parity, rollback, blockers, Phase 10 prerequisites

**Parity:** `v2-small-bare` equivalent UI path matches engine 32000 / 6d.

**Rollback:** disable `featureShipyard` (reload); discard uncommitted Phase 9 files listed in §4. Leave world on disk unless the maintainer deletes it. Do not revert Phase 8 domain unless separately authorized.

**Blockers:** none remaining for Phase 9 exit. Foundry may compact Datacron AstroCom LevelDB packs while the world is open; that churn is unrelated and must not be committed.

**Phase 10 prerequisites (not started):**

1. Maintainer authorization for Actor creation in a disposable world
2. SW5e starship document shape confirmed on this runtime
3. Mapping from Phase 8 result → Actor/Items/Activities
4. Ownership/folder policy
5. Keep `calculateBuild` as sole cost authority

## 14. Recommendation

Phase 9 is complete. Do not start Phase 10 until separately authorized. Recommended checkpoint (when authorized) groups Phase 8+9 shipyard domain + docs; **never** SotG xlsx or LevelDB pack churn.

## 15. Shutdown and Git summary

1. GM `game.shutDown()` from world `datacron-phase9-shipyard`.
2. Isolated player Chrome closed.
3. Foundry V13 closed with `CloseMainWindow`.
4. World left on disk: `C:\Foundry\V13\Data\worlds\datacron-phase9-shipyard`.
5. Git: HEAD unchanged, nothing staged, nothing committed or pushed.

### Status

Phase 9 Shipyard collaborative UI complete. Phase 10 not started.

---

## Addendum — 2026-08-17 — Shutdown evidence

### Reason

The first `game.shutDown()` call blocked on a Foundry confirm because Phase9Player was still connected. Closeout completed after that client was closed.

### Evidence

1. Isolated player Chrome (`--user-data-dir=C:\Foundry\V13\Logs\phase9-player-chrome`, PID 41212) closed with `CloseMainWindow`.
2. Stale “other user will be disconnected” dialog dismissed with **No** after that client was already gone.
3. GM `game.shutDown()` then returned the browser to `http://127.0.0.1:30000/setup` from world `datacron-phase9-shipyard`.
4. Foundry V13 main PID **63472** closed with `CloseMainWindow`. After 6s: no `Foundry Virtual Tabletop` processes; HTTP on port 30000 down.
5. AstroCom LevelDB pack files touched while Foundry was open were restored to HEAD; untracked pack logs/ldb/manifests removed.
6. Disposable world remains at `C:\Foundry\V13\Data\worlds\datacron-phase9-shipyard`. Other worlds were not opened or deleted.
7. Git remains unstaged: HEAD `3570d7a3b7bfaaba14ecdb086e1c9f43f8d103ad`, nothing committed or pushed.

### Status

Shutdown complete. Phase 10 not started.
