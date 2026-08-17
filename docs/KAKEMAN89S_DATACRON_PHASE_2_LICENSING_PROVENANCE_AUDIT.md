# Kakeman89's Datacron — Phase 2 Licensing, Provenance, and Existing-Asset Audit

**Date:** 2026-08-14  
**Phase:** 2 — Licensing, Provenance, and Existing-Asset Audit  
**Status:** Investigation complete. Awaiting maintainer approval. Phase 3 not started.  
**Nature:** Evidence collection and risk classification. **This document is not legal advice and is not a determination of copyright ownership.**

Stable component identifiers are those established in `KAKEMAN89S_DATACRON_PHASE_0_BASELINE_INVENTORY.md` and carried through `KAKEMAN89S_DATACRON_PHASE_1_COMPATIBILITY_VERIFICATION.md`.

---

## 0. Legal characterization limit

Classifications used in this report:

- Documented license located
- Attribution located
- Source located
- Origin claimed but unverified
- No licensing evidence located
- Redistribution permission not established
- Conflicting evidence
- Requires rights-holder clarification
- Requires maintainer-created replacement
- Requires legal review before public distribution

This report does **not** use “legal,” “illegal,” “copyright-safe,” “free to use,” or “public domain” as conclusions, except where an authoritative source names a license or status and the scope of that source is stated.

Repository presence does not prove ownership. GPL-3 on repository code does not cover datasets or assets. Attribution does not grant redistribution rights. Noncommercial intent does not eliminate licensing requirements. A source URL does not grant permission to copy or package content. Wookieepedia text and Wookieepedia images are not treated as the same license. Facts, prose, database selection, database arrangement, images, maps, logos, and trade dress are not treated as identical. Prior inclusion on `origin/v.next` does not authorize future distribution. Existing documentation is not assumed to identify every original source. An asset without metadata is not assumed original. A filename does not identify owner or license. A Star Wars fan project is not assumed permitted for public distribution. The SW5e ship-builder workbook is not assumed redistributable. The current GPL-3 `LICENSE` is not assumed to be the final distribution license for every future module component.

---

## 1. Accepted Phase 1 state preserved

The following Phase 1 / V13-continuation facts remain in force. Phase 2 did not change them.

| Item | Accepted state |
|------|----------------|
| Locked Foundry target | 13.351 |
| Locked dnd5e target | 5.2.5 |
| Locked SW5e target | module version 1.4.2 |
| Foundry V13 executable | `C:\Foundry\V13\App\Foundry Virtual Tabletop.exe` |
| V13 User Data path | `C:\Foundry\V13` |
| V13 SW5e link | `1.4.1-remediation-test`, not 1.4.2 |
| Combined V13 + dnd5e 5.2.5 + SW5e 1.4.2 runtime | Open |
| Safe disposable world | Not established |
| Worlds during this phase | None opened; none created |
| All `v.next` component dispositions | **UNASSESSED** |
| Phase 3 reuse decision gate | Unselected |

The SW5e runtime mismatch is not a blocker for this Phase 2 licensing and provenance work.

---

## 2. Pre-investigation repository check

Recorded immediately before inspection. Access date for all Git facts: 2026-08-14.

| Check | Result |
|-------|--------|
| Current branch | `main` |
| Current HEAD | `49244ad78067c77ffa1e645fe9038f8690bddc32` |
| Upstream | `origin/main` (`main...origin/main`) |
| Git status (tracked) | Clean. `git diff HEAD` empty. |
| Current `origin/v.next` SHA | `a01c1d7b46a8ea62a7b1d95e39131aace3f6315b` |
| `origin/v.next` checked out | **No.** Inspection used `git show` / `git cat-file` / `git grep` / `git ls-tree` / `git log` only. |
| Tracked files on `main` | `LICENSE`, `README.md` |
| Current roadmap path | `KAKEMAN89S_DATACRON_ROADMAP.md` (untracked working-tree planning document) |
| Current Phase 0 path | `KAKEMAN89S_DATACRON_PHASE_0_BASELINE_INVENTORY.md` |
| Current Phase 1 path | `KAKEMAN89S_DATACRON_PHASE_1_COMPATIBILITY_VERIFICATION.md` |
| `.cursor/` | Pre-existing untracked tree. **Not modified.** |
| Unexpected repository-state change | None relative to Phase 1 close: still `main` at the initial commit; planning markdown and `.cursor/` remain untracked. |

Existing untracked items at start of Phase 2 (pre-existing; not created by this assignment except as noted at closeout):

- `.cursor/` (ECC/Cursor install)
- `KAKEMAN89S_DATACRON_ROADMAP.md`
- `KAKEMAN89S_DATACRON_PHASE_0_BASELINE_INVENTORY.md`
- `KAKEMAN89S_DATACRON_PHASE_1_COMPATIBILITY_VERIFICATION.md`

Read-only investigation remained safe. No branch switch, checkout of `v.next`, staging, commit, push, merge, rebase, PR, tag, package install/update, Foundry launch, world mutation, junction change, download, scrape, or implementation occurred.

---

## 3. Evidence classification legend

Used consistently:

1. **VERIFIED PRIMARY** — Direct license, rights statement, provenance record, source repository metadata, rights-holder statement, or authoritative metadata applies to the exact inspected item.
2. **VERIFIED SECONDARY** — A reliable secondary source identifies origin or licensing, but direct primary evidence for the exact item was not located.
3. **REPOSITORY CLAIM** — A comment, README, filename, commit message, or repository note makes a claim that has not been independently verified against the exact item.
4. **DERIVED INDICATOR** — Metadata, schema, naming, formatting, embedded properties, matching hashes, or structural similarity suggests an origin but does not prove it.
5. **CONFLICTING** — Available evidence disagrees.
6. **UNKNOWN** — No sufficient evidence was found.
7. **NOT APPLICABLE** — The category does not apply to the inspected component.

Licensing/provenance **evidence states** (not dispositions):

- **DOCUMENTED**
- **PARTIALLY DOCUMENTED**
- **UNKNOWN**
- **CONFLICTING**
- **NOT APPLICABLE**

**Do not read these as RETAIN / REVISE / REPLACE / REMOVE / QUARANTINE / DEFER.** All Phase 0 components remain dispositionally **UNASSESSED**. This report may flag public-release blockers or later quarantine *consideration* for Phase 3. It does not assign QUARANTINE.

Project artwork rule recorded for later phases (not implemented here):

- Existing unverified artwork is not approved for public distribution.
- No automated Wookieepedia artwork ingestion is permitted.
- Missing or replacement artwork will be supplied separately by Kakeman89 or another verified licensed source.
- No replacement art was generated in Phase 2.

Future creator attribution in new Datacron materials must use only: **Kakeman89**.

---

## 4. Method and limitations

Inspected without modifying tracked product files:

- `main` `LICENSE` and `README.md`
- Complete 62-file `origin/v.next` tree via Git
- Committed JPEG SOF/JFIF markers (first markers only; image not displayed, transformed, or exported)
- Committed XLSX as a ZIP listing and Open XML parts (not extracted into the working tree; formulas not reproduced)
- JSON keys, record counts, and embedded URL/filename fields
- Adjacent SW5e 1.4.2 checkout at the AppData `sw5e-module` junction (dependency/licensing implications only)
- V13-linked `1.4.1-remediation-test` package as environmental evidence only
- Official/primary web documentation where reachable (access date 2026-08-14)

Internet limitations:

- `https://starwars.fandom.com/wiki/Wookieepedia:Copyrights` fetch timed out. Text-license statements were taken from `Wookieepedia:FAQ`, `Wookieepedia:About` search/fetch excerpts, and search snippets of the Copyrights page. Classification for the Copyrights page itself is therefore **VERIFIED SECONDARY** unless a later fetch succeeds.
- `https://www.fandom.com/licensing` and `https://support.starwars.com/hc/en-us/articles/360001406466-Can-I-get-permission-to-use-Star-Wars-property` returned Cloudflare interstitial HTML rather than full policy text.
- No Wookieepedia articles, infoboxes, or images were downloaded.
- The SW5e ship-builder workbook was not downloaded.

---

## 5. Coverage statement

`git ls-tree -r --name-only origin/v.next` lists **62** tracked files. Every file is covered by an individual record or a grouped record whose membership is listed in Appendix A.

Also covered:

- `LICENSE` and `README.md` on `main` (identical `LICENSE` blob to `origin/v.next`)
- Planning documents as project-created records, not distributable module content
- SW5e 1.4.2 checkout licensing implications
- V13 `1.4.1-remediation-test` as environment only
- Maintainer-provided NavComputer 9×9 matrix (screenshot referenced by the roadmap; not a tracked file)
- Missing SW5e ship-builder workbook as an unresolved required source

---

## 6. GPL-3 scope analysis

**Evidence record:** LIC-001  
**Evidence classification:** VERIFIED PRIMARY for the license *document*; UNKNOWN / NOT APPLICABLE for non-code categories unless separately evidenced.  
**Evidence state:** DOCUMENTED for the repository license file; not extended to third-party assets.

### What the repository GPL-3 file establishes

- Path on `main`: `LICENSE`
- Path on `origin/v.next`: `LICENSE`
- Git blob SHA (both): `f288702d2fa16d3cdf0035b15a9fcbc552cd88e7`
- Title in file: GNU GENERAL PUBLIC LICENSE Version 3, 29 June 2007
- The file is the FSF GPL-3 license text.

This establishes that both `main` and `origin/v.next` present GPL-3 as the repository license document.

`kakeman89s-datacron/module.json` has **no** `license` field. `origin/v.next` `README.md` states that readers should “See the module folder for any license file the author adds.” No license file exists under `kakeman89s-datacron/`.

No JavaScript, Python, Handlebars, or CSS file on `origin/v.next` contains `Copyright`, `@license`, or `SPDX` headers (`git grep`).

### What GPL-3 was **not** evidenced to establish

| Category | Covered by repo GPL-3 from available evidence? |
|----------|-----------------------------------------------|
| Repository-authored code *as presented* | License document present; file-level notices absent |
| Third-party code | No |
| Dataset license | No |
| Image license | No |
| Map license | No |
| Spreadsheet license | No |
| Wookieepedia-derived text | No |
| Star Wars intellectual property | No |
| SW5e rules text | No |
| SW5e code | Separate MIT file in the SW5e checkout |
| Foundry package metadata | No (Foundry terms are separate) |
| Trademarks and logos | No |

GPL-3 is **not** evidenced to relicense third-party assets by mere repository inclusion.

### CC BY-SA content alongside GPL-3 code

Authoritative Creative Commons page `https://creativecommons.org/compatible-licenses/` (access 2026-08-14):

- GPLv3 is listed as a BY-SA–compatible license **for CC BY-SA 4.0**, one-way, with special considerations.
- For BY-SA **3.0**, CC states that contributions to adaptations may be licensed under BY-SA 3.0 or later, ported BY-SA 3.0+, or a license designated as a Creative Commons Compatible License as defined in BY-SA 3.0. CC states that **currently no non-CC licenses have been designated as compatible with BY-SA 3.0**.

Wookieepedia text is named as CC BY-SA **3.0** Unported (see §9). Combining adapted Wookieepedia text with GPL-3 module code therefore **requires separate notices, separate content licensing analysis, or further review**. This report does not conclude that such combination is or is not possible.

**Share-alike / notice / source-disclosure implications of GPL-3 for Datacron-authored code:** GPL-3, if it is the license of Datacron-authored code, typically requires license notices, corresponding source for distributed binaries, and copyleft for derivative *code*. Those implications do not, from available evidence, attach to third-party datasets, maps, or wiki text.

---

## 7. Code licensing audit

### 7.1 Main and v.next license files — LEGAL-001

| Field | Finding |
|-------|---------|
| Component ID | LEGAL-001 |
| Paths | `LICENSE` (`main` and `origin/v.next`) |
| Category | Licensing |
| Evidence classification | VERIFIED PRIMARY (document identity) |
| License or rights statement located | GNU GPL-3 text |
| Attribution located | FSF copyright on the license document itself; no Datacron author header |
| Exact item match | Same Git blob on `main` and `origin/v.next` |
| Redistribution permission established | For the license *text*, FSF permits verbatim copies; for Datacron *code*, the GPL-3 grant applies only if the authors placed the code under that license. File-level confirmation is incomplete because module files lack notices and `module.json` lacks a `license` field. |
| Evidence state | PARTIALLY DOCUMENTED for code-as-a-whole; DOCUMENTED for the LICENSE file |
| Public-release blocker | Missing module-level license field and missing per-file notices are a packaging-quality gap, not by themselves a third-party rights clearance. |
| Disposition | UNASSESSED |

### 7.2 Datacron JavaScript applications — CODE-001

**Grouped record.** Files:

- `kakeman89s-datacron/scripts/actor-helpers.js` (NAV-008)
- `kakeman89s-datacron/scripts/datacron-app.js` (APP-001)
- `kakeman89s-datacron/scripts/droid-ally-app.js` (APP-002)
- `kakeman89s-datacron/scripts/droid-ally-pricing.js` (DROID-001)
- `kakeman89s-datacron/scripts/hyperspace-routes.js` (ROUTE-002)
- `kakeman89s-datacron/scripts/logger.js` (LOG-001)
- `kakeman89s-datacron/scripts/main.js` (HOOK-001)
- `kakeman89s-datacron/scripts/piloting-roll.js` (NAV-006)
- `kakeman89s-datacron/scripts/planet-combo.js` (NAV-007)
- `kakeman89s-datacron/scripts/planet-data.js` (ASTRO-002)
- `kakeman89s-datacron/scripts/route-calculator.js` (NAV-001)
- `kakeman89s-datacron/scripts/settings.js` (SET-000)
- `kakeman89s-datacron/scripts/time-display.js` (NAV-009)
- `kakeman89s-datacron/scripts/travel-calculator.js` (NAV-004)

| Field | Finding |
|-------|---------|
| Author or project claim | Module id `kakeman89s-datacron`; ApplicationV2 Foundry apps |
| Repository origin | `origin/v.next`; no third-party library copies identified in these files |
| License statement | None in file headers; repo `LICENSE` is GPL-3 |
| Notices required | If distributed under GPL-3, GPL notice practice is not currently implemented in these files |
| Source modifications documented | Not applicable as upstream forks; no copied-from notices found |
| GPL-3 compatibility established | Cannot be confirmed for *embedded third-party code* because none was identified; cannot be confirmed that every line was authored for this repository |
| Code origin | REPOSITORY CLAIM of Datacron authorship; UNKNOWN as to any uncredited adaptation from SW5e, Foundry examples, or another NavComputer project |
| Evidence state | PARTIALLY DOCUMENTED |
| Public-release blocker | No, for *code authorship of these files as presently evidenced*, pending notice hygiene. Embedded **data constants** (matrix) are separately blocked (§13). |
| Disposition | UNASSESSED |

`scripts/debug/phase0-runtime-inspector.js` (TOOL-002) is included with this family for licensing: same absence of headers; debug tooling, not runtime-packaged by `module.json`.

### 7.3 Templates, styles, localization — CODE-002

**Grouped record.** Files:

- `kakeman89s-datacron/templates/datacron.hbs` (TEMPLATE-001)
- `kakeman89s-datacron/templates/droid-ally-pricing.hbs` (TEMPLATE-002)
- `kakeman89s-datacron/styles/datacron.css` (STYLE-001)
- `kakeman89s-datacron/lang/en.json` (LANG-001)

No license headers. UI strings use “Kakeman89s Datacron” / “Hyperspace Navigation Uplink.” Star Wars setting terms appear in user-facing copy. Evidence state: PARTIALLY DOCUMENTED for authorship claim; trademark/branding concern identified separately (TRADEMARK-001). Disposition: UNASSESSED.

### 7.4 Python tooling — CODE-003

**Grouped record.** Files:

- `scripts/build-hyperspace-graph.py` (TOOL-001)
- `scripts/generate_starwarsmap_integration_review.py` (TOOL-003)
- `scripts/merge-planet-data.py` (TOOL-004)
- `scripts/normalize_planet_names.py` (TOOL-005)
- `scripts/starwarsmap_audit.py` (TOOL-008)
- `scripts/validate-hyperspace-routes.py` (TEST-001)

No SPDX/copyright headers. Docstrings claim Datacron build/audit roles and cite StarWarsMap / spreadsheet / GeoJSON inputs. Third-party runtime dependency `openpyxl` is imported by `merge-planet-data.py`; that library is not vendored in the 62-file tree. Evidence state: PARTIALLY DOCUMENTED. Disposition: UNASSESSED.

### 7.5 Tracked bytecode — CODE-004

File: `scripts/__pycache__/generate_starwarsmap_integration_review.cpython-313.pyc` (TOOL-009)

Compiled Python cache. No separate license. Accidental/deprecated per Phase 0. Evidence state: NOT APPLICABLE as an independent licensed work; UNKNOWN as a distributable artifact. Public-release blocker: packaging bytecode without corresponding source notices is a source-disclosure/hygiene issue under a GPL model. Disposition: UNASSESSED. Phase 3 may consider removal; Phase 2 does not remove it.

### 7.6 Generated / cached reports — CODE-005

**Grouped record.** Files:

- `scripts/output/hyperspace_validation_report.json` (TEST-001)
- `scripts/output/planets_name_map.json` (TOOL-006)
- `scripts/output/planets_name_report.csv` (TOOL-006)
- `scripts/output/starwarsmap_audit_report.json` (TOOL-007)
- `scripts/output/starwarsmap_integration_review.json` (TOOL-007)
- `scripts/output/starwarsmap_audit_summary.md` (DOC-006)
- `scripts/output/starwarsmap_integration_review.md` (DOC-006)
- `kakeman89s-datacron/data/planets-merge-report.txt` (DATA-006)

Derived from other datasets. Lineage is tool output, not an independent license grant. Evidence state: UNKNOWN (inherit parent dataset uncertainty). Disposition: UNASSESSED.

### 7.7 Package metadata files — CODE-006

Files: `.gitignore` (PKG-003); `kakeman89s-datacron/module.json` (PKG-001, also NOTICE-001).

`.gitignore` is a project ignore list. Evidence state: NOT APPLICABLE as licensed content. `module.json` is audited in §8.

### 7.8 Governance files tracked on v.next — CODE-007

Files:

- `.cursor/rules/SHARED-MASTER-CONTEXT.mdc` (GOV-001)
- `.cursor/rules/karpathy-guidelines.mdc` (GOV-001)

Tracked on `origin/v.next` only. Not Datacron runtime assets. Working-tree `.cursor/` on `main` was not modified. Evidence state: NOT APPLICABLE as module distribution content. Public-release blocker if a future package accidentally includes Cursor rules. Disposition: UNASSESSED.

---

## 8. Manifest and attribution audit — NOTICE-001

Path: `kakeman89s-datacron/module.json`  
Evidence classification: VERIFIED PRIMARY for the file contents.

| Manifest field | Evidence |
|----------------|----------|
| Title | `Kakeman89s Datacron` |
| Module ID | `kakeman89s-datacron` |
| Authors | **Personal-name attribution present in existing metadata.** The personal-name value is not reproduced in this report. Future creator attribution must use only **Kakeman89**. |
| URLs | `"url": "https://github.com/placeholder/kakeman89s-datacron"` — placeholder, not a live project URL |
| Manifest URL | Absent |
| Download URL | Absent |
| License field | Absent |
| Compatibility | Foundry minimum/verified `"13"` |
| System dependencies | `dnd5e` 5.2.5 minimum/verified |
| lib-wrapper | **Not declared.** Datacron does not list lib-wrapper. |
| Readme references | Absent in manifest |
| Description | “A Star Wars 5e datacron for SW5e beta campaigns…” |
| Socket | `"socket": true` with **no** `game.socket` handlers in JS |
| Affiliation / official status | No claim of Lucasfilm, Disney, or Foundry endorsement located |
| Fan-content disclaimer | **Missing** |
| Third-party notices | **Missing** |
| Asset attribution | **Missing** |
| Dataset attribution | **Missing** |

`origin/v.next` `README.md` also contains personal-name attribution in its “License and credits” section. Same redaction rule applies.

Evidence state: CONFLICTING relative to the required future attribution (Kakeman89 only) versus existing personal-name metadata. Public-release blocker: personal-name metadata must be addressed before public listing; Phase 2 does not edit the manifest.

`main` `README.md` is only the heading `# NaviComputer`. Evidence state: PARTIALLY DOCUMENTED as a stub. Disposition: UNASSESSED.

---

## 9. Wookieepedia audit — WIKI-001 / WIKI-002

Access date: 2026-08-14.

### 9.1 Site identity

| Field | Evidence |
|-------|----------|
| Site / project | Wookieepedia |
| Host | `starwars.fandom.com` (legacy host `starwars.wikia.com` still appears in committed GeoJSON links) |
| Text license named by authoritative pages | Creative Commons Attribution-Share Alike License 3.0 Unported (CC BY-SA) |

Sources:

- `https://starwars.fandom.com/wiki/Wookieepedia:FAQ` — “The text of the wiki is licensed under CC BY-SA 3.0”; “Can I copy from Wookieepedia?” points to `Wookieepedia:Copyrights#Re-using Wookieepedia content`; Fandom Forking Policy “places additional restrictions on creating a fork of the wiki.” Footer: community content under CC-BY-SA unless otherwise noted.
- `https://starwars.fandom.com/wiki/Wookieepedia:About` — text licensed CC BY-SA 3.0 Unported; copyright page has more information.
- Search snippets of `https://starwars.fandom.com/wiki/Wookieepedia:Copyrights` — text CC BY-SA 3.0 unless otherwise specified; images/audio/video often included under U.S. fair use and file-specific copyright tags; wiki not affiliated with or endorsed by Lucasfilm / Disney.
- CC BY-SA 3.0 deed: `https://creativecommons.org/licenses/by-sa/3.0/` — Share and Adapt, including commercially, if Attribution and ShareAlike terms are met. The deed states the license may not give all permissions needed (publicity, privacy, moral rights, other rights).
- Fandom Terms of Use (`https://www.fandom.com/terms-of-use`, access 2026-08-14): except as permitted for community text per the licensing page, users may not scrape, reproduce, or create derivative works from content; robots/spiders/scrapers require express written permission; robot-exclusion headers must not be bypassed.
- Fandom Help:Licensing (search): text CC-BY-SA; **images/video are not automatically CC-BY-SA**.

### 9.2 Text (WIKI-001) — evidence state PARTIALLY DOCUMENTED

CC BY-SA 3.0 Unported is named for Wookieepedia **text** unless a page says otherwise.

From the CC BY-SA 3.0 deed (not a Datacron legal opinion):

- Attribution: credit, license link, indication of changes (for derivatives), no implied endorsement.
- ShareAlike: adaptations must be shared under the same license (or a CC-designated compatible license; none designated for 3.0 outside the BY-SA family per CC’s compatible-licenses page).
- Title of the material if supplied (3.0).
- Link to the material.

Unresolved from available pages (Copyrights page not fully fetched):

- Exact “Re-using Wookieepedia content” checklist (revision history, URI form, author list).
- Whether a page-level source link **alone** satisfies attribution. FAQ and CC deed together indicate **more than a bare URL is expected** (creator/attribution parties, license notice, change indication). Individual-entry attribution is **advisable** based on CC 3.0 “if supplied” fields and wiki revision history; whether it is strictly required for every GM snapshot remains **unresolved**.
- Whether planned concise GM snapshots would qualify as adaptations. That depends on whether they copy or recast wiki prose versus independently restating facts. Phase 2 did not ingest pages and does not decide.
- Database extraction / compilation copyright as distinct from facts.
- Fandom Forking Policy contents (not fetched in full).
- MediaWiki API vs Terms of Use automated-access conflict. API existence does not override ToU scrape language. Rate limits for bots are documented on Fandom Help:Bots in general terms; Datacron must not scrape.

### 9.3 Media (WIKI-002) — evidence state DOCUMENTED as *not* the text license

Images, audio, and video are **file-specific**. Wookieepedia Copyrights snippets and Fandom licensing help state they are often fair-use illustrations and remain the property of copyright holders such as Lucasfilm. Fair-use media on the wiki is **not** evidenced as reusable in a Foundry module.

**Wookieepedia images remain excluded from planned automated ingestion.**

### 9.4 Categories of future planet content (obligations / uncertainties)

| Category | Evidence | Remaining obligation / uncertainty |
|----------|----------|-----------------------------------|
| 1. Original module-authored summaries based on independently verified facts | No such production corpus exists on `v.next` except 38 short `description` fields of unknown origin | Facts are not automatically unrestricted as a compiled dataset; still requires review |
| 2. Adapted Wookieepedia text | Not identified as ingested article prose in module `planets.json`; GeoJSON contains Wikia URLs | If used later: CC BY-SA 3.0 attribution + share-alike + GPL coexistence review |
| 3. Direct quotations | None copied in this phase; none identified as wiki quotations in module JSON | Sourcebook/wiki quotes have additional constraints |
| 4. Structured factual metadata | Names, regions, sectors, grids in JSON/xlsx | Compilation/arrangement provenance unknown |
| 5. Infobox extraction | Not performed; not identified as a documented pipeline | Do not treat infobox dumps as uniformly licensed |
| 6. External source links | GeoJSON `link` fields to `starwars.wikia.com/wiki/...` (124 unique URLs in 1574 features) | Linking vs packaging the GeoJSON are different acts; packaging the file redistributes the URL list and geometries |
| 7. Images and media | Root `planets.json` stores **filenames** resembling wiki file titles (1386 nonempty `Image` values); image files are **not** in the 62-file tree | Filenames are not a license. Do not fetch or package those files |

Phase 2 did not scrape, download articles, download images, copy article prose, copy infoboxes, or create planetary records.

---

## 10. Star Wars intellectual property and branding — TRADEMARK-001

Evidence classification: UNKNOWN for a Datacron-specific authorization; VERIFIED SECONDARY for the existence of a Disney/Lucasfilm permission channel.

| Topic | Evidence |
|-------|----------|
| Star Wars name, planet/character/species/organization/location/lane names | Used throughout datasets, UI strings, and documentation |
| Logos, typography, trade dress | `Galactic Map.jpg` is unverified artwork; module has no separate logo file |
| Map artwork / sourcebook artwork | See MAP-001 and DATA-001 `Image` filenames |
| Screenshots | NavComputer matrix screenshot is maintainer-provided; not tracked; original publication unknown |
| Official maps vs fan maps | Not distinguished with provenance for `Galactic Map.jpg` |
| Canon / Legends labels | StarWarsMap JSON uses `is_canon`; module `planets.json` has no canon/legends field |
| Official affiliation | Manifest does not claim affiliation; also lacks a fan disclaimer |
| Module title / description | Uses “Star Wars 5e” / “SW5e” |
| Public repository / Foundry listing | Not currently published from `main`; placeholder GitHub URL |

Primary-source search:

- `https://support.starwars.com/hc/en-us/articles/360001406466-Can-I-get-permission-to-use-Star-Wars-property` exists; full body blocked by Cloudflare in this session. Search snippet points to Walt Disney Studios Licensing.
- Lucasfilm FAQ `https://www.lucasfilm.com/who-we-are/faq/` exists; a comprehensive fan-site policy was **not** retrieved.

**No directly applicable permission located.**  
**Requires legal or platform review before public release.**

This report does **not** conclude that factual names or terms can never be referenced. It records only that Datacron currently has no located authorization covering public Foundry distribution of a Star Wars–branded module with maps, compiled planet datasets, and SW5e integration.

Evidence state: UNKNOWN (authorization). Public-release blocker: **Yes**, for public package listing and public repository distribution of branded/compiled assets until review or a located policy applies.

---

## 11. SW5e licensing audit — SW5E-001

Inspected checkout: AppData `sw5e-module` junction to GitHub `sw5e-foundry/sw5e-module` (Phase 1: tag 1.4.2). This is a **dependency**, not a Datacron asset.

V13-linked `1.4.1-remediation-test` is **environmental evidence only** and is not inventoried as Datacron content.

| Category | Evidence |
|----------|----------|
| Repository / module license | `LICENSE` is an MIT license text (“MIT License”, “Copyright (c) 2020 Repository Owner”) applying to “this software and associated documentation files” |
| Module `license` field | `module.json` `"license": "LICENSE"` |
| README | Implementation of SW5e as a module for dnd5e; **not listed** on Foundry’s website “because it contains homebrew content”; install via GitHub manifest URL |
| Description | States some SnV artwork is unofficial fan-made replacement art, **not licensed, approved, or endorsed by Disney or Lucasfilm** |
| ATTRIBUTION.md | Distinguishes book journals (generated from `sangheili868/StarWars5e.Core` parser sources) from starship art (legacy system artifacts; **does not assert third-party copyright clearance**) and HGTTG PDF-sourced images |
| Code vs content | MIT file speaks to Software; ATTRIBUTION.md says book text is community SW5e reference material and to confirm licensing before redistributing modified or full-text journals outside the module’s intended channel |
| Star Wars IP | Module itself disclaims Disney/Lucasfilm endorsement; no Datacron grant is created by depending on SW5e |
| dnd5e relationship | System dependency; Datacron and SW5e both target dnd5e 5.2.5 |
| Ship-builder workbook | **No** workbook/xlsx ship-builder located in this checkout |
| Droid Shop / hyperspace travel / fuel / supplies rule locations | No matching rule titles for requested Datacron formulas located by search in this checkout (no “Tier I” chassis price table, no “10 percent class markup” droid rule, no fuel-per-hour / food-per-crew Datacron defaults) |

Distinction required:

| Layer | Whose license evidence | Covers Datacron? |
|-------|------------------------|------------------|
| SW5e module code | MIT in SW5e `LICENSE` | No automatic relicensing of Datacron; Datacron must not copy SW5e code |
| SW5e rules text | Community/homebrew; ATTRIBUTION.md urges confirmation | Do not copy into Datacron |
| SW5e data / assets | Mixed; art provenance incomplete in ATTRIBUTION.md | Do not bundle SW5e assets |
| SW5e workbook | Not present | See WORKBOOK-001 |
| Datacron integration code | Datacron GPL-3 document + missing notices | Independent |

Redistribution of **SW5e itself** is outside Datacron’s package. Datacron `module.json` *recommends* `sw5e` / `sw5e-module`. Evidence state for SW5e-as-dependency: PARTIALLY DOCUMENTED. Evidence state for using SW5e rules text inside Datacron: Redistribution permission **not established**. Disposition: UNASSESSED.

---

## 12. Ship-builder workbook — WORKBOOK-001

The official SW5e ship-builder workbook remains **absent** from Kakeman89’s Datacron (`main` and `origin/v.next`) and was **not** found in the SW5e 1.4.2 checkout.

Phase 2 did **not** download any workbook.

| Field | Finding |
|-------|---------|
| Official source page identified | **No** SW5e-foundry official Excel workbook page located |
| Workbook title / version | Unknown (file absent) |
| Publisher / maintainer claim | Unknown |
| Download source | Not identified as an official Datacron input |
| License / redistribution / modification | **No permission established** |
| Community tools observed (not the missing official workbook) | Community “Shipyards of the Galaxy” / Google Sheets shipbuilders (e.g. GM Binder index) describe duplicating sheets for personal use. That is **not** permission to package a workbook inside Datacron. |
| Formulas may be inspected for implementation | Not in this phase; file absent. Even if later supplied, public availability ≠ redistribution permission. |
| Packaging with Datacron | **Blocked** until permission is documented |
| Independently implemented rules | Remaining path if a rights-holder permits implementation-from-rules but not file redistribution — **unverified** |
| External maintainer-supplied development input | Default until permission exists |

Evidence classification: UNKNOWN. Evidence state: UNKNOWN. Public-release blocker: **Yes** (packaging). Shipyard feature remains source-blocked. Disposition: UNASSESSED.

---

## 13. NavComputer matrix — MATRIX-001

| Field | Finding |
|-------|---------|
| Maintainer-provided screenshot | Exists as design/rules evidence for the roadmap; **not** a tracked `v.next` file; original source of the screenshot unknown |
| Matrix values transcribed in the roadmap | Yes |
| `origin/v.next` reproduces all 81 values exactly | Yes (Phase 0/1: 81/81 including asymmetric Deep Core↔Core 18 vs 24) |
| Exact value agreement establishes authorship or permission | **No** |
| Original publication or rules source | **Not identified** |
| License / usage terms | **Not identified** |
| Official SW5e / community / homebrew | **Unresolved** |
| Table arrangement provenance | UNKNOWN |
| Individual numeric values independently verifiable | Only against the maintainer transcription and `REGION_TRAVEL_MATRIX`; not against a published SW5e table |
| Attribution required | Unknown (source unknown) |
| Screenshot may be packaged | **No** — source/license unknown |
| Values may be encoded as module data | Technical encoding already exists; **public-release permission not established** |
| Classification | **SOURCE UNKNOWN, RULE AUTHORITY UNVERIFIED** |

The matrix is **not** removed from roadmap or implementation scope. Technical use remains gated pending source clarification. Public-release blocker: **Yes**. Internal investigation: usable as EXISTING UNVERIFIED BEHAVIOR. Disposition: UNASSESSED.

---

## 14. Fuel, food, supplies, hyperdrive — TRAVEL-RULE-001

Existing formulas (Phase 0), still labeled **EXISTING UNVERIFIED BEHAVIOR**:

- Fuel: `ceil(hours * fuelPerHour)` default setting `1`
- Food: `ceil((hours/24) * crew * foodPerCrewPerDay)` default `1`; crew fallback `4` via `system.attributes.deployment.crew.items` or `crewMinWorkforce`
- Supplies: `ceil(foodRequired * 0.5)`
- Hyperdrive: used in Advanced routing only; Basic mode ignores it
- Rounding: `Math.ceil` as above
- Minimum / reserve consumption: not evidenced as a published rule; settings are configurable numbers only

Settings hints in `settings.js` / `lang/en.json` describe scaling estimates; they do **not** cite a sourcebook. No homebrew label is attached. No SW5e 1.4.2 citation located for these exact formulas.

| Formula | Classification |
|---------|----------------|
| Fuel per hour | Source unknown; configurable assumption |
| Food per crew per day | Source unknown; configurable assumption |
| Supplies = half of food | Source unknown; repository behavior only |
| Crew fallback of four | Repository claim / code default only |
| Hyperdrive treatment | Source unknown; Advanced-only |
| Rounding / minimum / reserve | Source unknown |

Do not approve settings merely because they are configurable. Evidence state: UNKNOWN. Public-release blocker for claiming RAW: **Yes**. Internal investigation: usable as unverified behavior. Disposition: UNASSESSED.

---

## 15. Droid pricing source — DROID-RULE-001

`docs/droid-allies-sw5e.md` states the calculator is “inspired by the Saga Edition alternate pricing system, translated into SW5E-facing terms.” It does **not** cite SW5e Expanded Content page numbers, Tier I–VI chassis prices, a ten-percent class markup, or condition pricing.

Code (`droid-ally-pricing.js`): class presets with `chassisCostRank` 1–5 (tracker rank 2); adders for abilities/traits/skills/feats/level; `floor(total / 2)`.

| Requested rule | Located in v.next? | Located in SW5e 1.4.2 checkout? |
|----------------|--------------------|----------------------------------|
| Tier I–VI chassis prices | No | No |
| Ten-percent class markup | No | No |
| Condition-pricing rule | No | No |
| Current `rank * 1000` + adders + floor/2 | Implemented; documented as Saga-inspired | Not identified as SW5e RAW |

**Current v.next droid formula source unknown** (beyond the Saga-inspired repository claim).  
**Requested Droid Shop formula source missing.**  
Implementation of the requested RAW Droid Shop remains **blocked pending authoritative rule input**.

Phase 2 does **not** decide to retain or replace the current calculator. Evidence state: UNKNOWN (requested RAW); PARTIALLY DOCUMENTED (repository’s own Saga-inspired claim). Public-release blocker for RAW claims: **Yes**. Disposition: UNASSESSED.

---

## 16. Planet dataset audit — DATA-001 / ASTRO-001 / ASSET-002

### 16.1 Module runtime list — ASTRO-001

Path: `kakeman89s-datacron/data/planets.json`  
Count: **2029** array records.  
Keys union: `name`, `grid`, `sector`, `region`, `coordinates`, `description`, `affiliation`, `type`.  
No `source`, `license`, `url`, `canon`, or `legends` fields.  
`description` / `affiliation` / `type` nonempty on **38** records only.

Claimed origin: README and `merge-planet-data.py` — merge of `Star Wars Galaxy Map Grid Coordinates.xlsx` (grid/sector/region) with prior JSON enrichment.  
Proven origin: DERIVED INDICATOR of that merge (script + merge report exist). Independent rights in the spreadsheet and prior JSON: **not established**.  
Canon/Legends: not record-level in this file.  
Public redistribution: **not established**.  
Internal investigation: usable.  
Public-release blocker: **Yes**.  
Evidence state: PARTIALLY DOCUMENTED (pipeline claim) / UNKNOWN (rights).  
Disposition: UNASSESSED.

### 16.2 Root dump — DATA-001

Path: `planets.json`  
Count: **5444** records.  
Keys: `Name`, `Image`, `Coord`, `X`, `Y`, `SubGridCoord`, `SubGridX`, `SubGridY`, `SunName`, `Region`, `Sector`, `Suns`, `Moons`, `Position`, `Distance`, `LengthDay`, `LengthYear`, `Diameter`, `Gravity`.  
`Image` nonempty on **1386** records. Values are **filenames** (not `http://` URLs), many resembling Wookieepedia/file-title patterns (e.g. NEGAS, TEA, SWCT, FDNP suffixes). Those image files are **not** present in the 62-file tree. Phase 2 did not download them.

Claimed origin: none in-file.  
Proven origin: UNKNOWN; DERIVED INDICATOR of a wiki-adjacent media index plus geography fields.  
Schema differs from module `planets.json` (not a simple copy).  
Public redistribution: **not established**.  
Public-release blocker: **Yes** (compiled dataset + implied media index).  
Evidence state: UNKNOWN.  
Disposition: UNASSESSED.

### 16.3 Geography workbook — ASSET-002 / SPREAD-001

Path: `Star Wars Galaxy Map Grid Coordinates.xlsx`  
First appearance: commit `7ed65e7` (2026-04-13, “Advanced Routes”).  
Open XML: **no** `docProps/core.xml` or `app.xml` (no creator/company/timestamps in standard Office core properties).  
Sheet: one visible sheet named `planets`.  
`definedNames` empty. Formula count **0**. No hyperlinks. Drawing part empty. Threaded-comments person list empty. No macros/vba/embeddings.  
No license sheet, credit sheet, or instructions sheet.

Workbook metadata is a **derived indicator only** and here is largely **absent**. It is not proof of rights ownership.

README claims this workbook is primary for grid/sector/region. Redistribution permission: **not established**. Public-release blocker: **Yes**. Evidence state: UNKNOWN. Disposition: UNASSESSED.

---

## 17. Lane and route dataset audit — ROUTE-* / ASSET-003

### 17.1 GeoJSON — ASSET-003

Path: `hyperspace_singlepart_new.json`  
Type: GeoJSON `FeatureCollection`, **1574** features.  
**Every** feature has `cartodb_id` (DERIVED INDICATOR of a CARTO export).  
Property keys sampled: `cartodb_id`, `hid`, `hyperspace`, `id`, `length`, `link`, `name_web`, `zoom_level`.  
`link` values: **124** unique URLs, all inspected samples on `http://starwars.wikia.com/wiki/...` (legacy Wookieepedia).

Docs say: credit the original map or extract source in the distribution README **if license terms require it** — origin still unnamed.

Public redistribution: **not established**. Public-release blocker: **Yes** (geometry compilation + wiki URL payload + likely CARTO lineage). Record-level provenance: dataset-level only. Future route-navigation phase remains deferred regardless. Disposition: UNASSESSED.

### 17.2 Generated / hand route graphs

| Path | Component | Notes |
|------|-----------|-------|
| `kakeman89s-datacron/data/hyperspace-routes.json` | ROUTE-001 | Generated + hand merge; runtime fetch target |
| `kakeman89s-datacron/data/hyperspace-routes-catalog.json` | ROUTE-004 | Authoring list |
| `kakeman89s-datacron/data/hyperspace-routes.hand.json` | ROUTE-005 | Hand edges |
| `kakeman89s-datacron/data/route-tier-overrides.json` | ROUTE-006 | Tier hints |
| `kakeman89s-datacron/data/hyperspace-control-points.json` | DATA-005 | Affine calibration |
| `kakeman89s-datacron/data/grid-to-geo.json` | DATA-004 | Empty `cells`; comment only |
| `kakeman89s-datacron/data/random-events.json` | DATA-007 | Three short event blurbs; unused at runtime per Phase 0; authorship unknown |

Lane names have identified *string* sources (StarWarsMap keys, GeoJSON `hyperspace` / Wikia links) but **not** rights. Coordinates appear copied/transformed from map space, not independently surveyed. Graph arrangement is derived from map + StarWarsMap chains + synthetic connectors. Weights are calculated (`HOURS_PER_DEG`, `STARWARSMAP_HOURS_PER_GRID_UNIT`) — repository-authored numbers, not a cited SW5e table. Canon/Legends mixed or unclear. Era availability not represented. Redistribution permission **not established**. Unresolved route provenance is a **blocker for public route-based navigation**. Disposition: UNASSESSED.

---

## 18. StarWarsMap source family — PROV-001

Treat all StarWarsMap-named items as one family.

Files:

- `StarWarsMap/map_api/data/grid_db.json` (DATA-003)
- `StarWarsMap/map_api/data/hyperlanes_db.json` (DATA-003)
- `StarWarsMap/map_api/data/regions_db.json` (DATA-003)
- `kakeman89s-datacron/data/starwarsmap/hyperlanes_db.json` (DATA-008) — vendored copy
- `kakeman89s-datacron/data/starwarsmap/planet-name-aliases.json` (DATA-009) — Datacron alias table (`Kailor V` → `Kailor`)

**Project identity (VERIFIED SECONDARY / REPOSITORY CLAIM):**

- `docs/hyperspace-coordinate-transform.md` states vendored `hyperlanes_db.json` comes from `https://github.com/Wason1797/StarWarsMap` (`map_api/data/hyperlanes_db.json`) and says to “comply with that repository’s license when redistributing.”
- GitHub API `https://api.github.com/repos/Wason1797/StarWarsMap` (access 2026-08-14): `"license": null`, default branch `master`, description matches “map of the Star Wars Galaxy using graphs,” last push 2023-01-08.
- Search snippets of that README: data files `grid_db.json`, `hyperlanes_db.json`, `regions_db.json`; reference map; CSV from `https://hbernberg.carto.com/tables/planets/public` attributed to the map author.

**No LICENSE file / SPDX license is published on that GitHub repository** (`license: null`). Exact byte-for-byte match to a published version was **not** hashed against upstream in this phase (upstream data was not downloaded). Path/schema identity is a DERIVED INDICATOR.

Wason1797 README (search) points at Henry Bernberg / swgalaxymap / CARTO. `http://www.swgalaxymap.com/download/` (search snippet): “Full resolution maps are available for download for **personal use only**.” Spreadsheet link `https://goo.gl/CG5Vpc`. That site statement, if it applies to maps, is a **commercial-use / redistribution limitation** for Bernberg map rasters. It does **not** automatically license StarWarsMap JSON, nor prove that `Galactic Map.jpg` is that map.

A project-level license, even if later found, would **not** automatically cover third-party Star Wars assets inside that project.

Map display, dataset reuse, and derived-route use may have different conditions; none are established for Datacron public distribution.

Evidence state: PARTIALLY DOCUMENTED (source *claim* and GitHub identity) / UNKNOWN (license and redistribution). Public-release blocker: **Yes**. Disposition: UNASSESSED.

---

## 19. Map and image assets

### 19.1 Galactic Map.jpg — MAP-001 / MEDIA-001

| Field | Finding |
|-------|---------|
| Path | `Galactic Map.jpg` |
| File type | JPEG (JFIF) |
| Dimensions | 10800 × 10800 (SOF0, 8-bit, 3 components) |
| File size | 37,878,510 bytes |
| Embedded author / copyright | **None** in APP1/EXIF; only JFIF APP0 |
| Software metadata | None located in header markers |
| Source URL | None in file; docs call it “canonical layout” / visual reference, not georeferenced |
| Commit first appearance | `7ed65e7` 2026-04-13 “Advanced Routes” |
| Runtime references | Not in `module.json`; not fetched by JS |
| Manifest inclusion | **Not packaged** as a module file |
| Unused at Foundry runtime | Yes (calibration reference per docs) |
| License / attribution | **No licensing evidence located** |
| Exact source match | Not established (not compared to Bernberg or other published maps) |
| Modification evidence | Unknown |
| Public-release blocker | **Yes** |

Evidence classification: UNKNOWN. Evidence state: UNKNOWN. Requires maintainer-created replacement or verified licensed source. Disposition: UNASSESSED.

### 19.2 Other image files

No other raster/logo/icon/banner files are in the 62-file inventory.

### 19.3 Image *references* inside data — MEDIA-002

Root `planets.json` `Image` filenames (1386). Not files. DERIVED INDICATOR of a wiki/media catalog. Do not ingest. Public-release blocker if treated as packable art pointers. Evidence state: UNKNOWN. Disposition: UNASSESSED.

### 19.4 GeoJSON wiki links — MEDIA-003

Embedded `http://starwars.wikia.com/wiki/...` URLs in `hyperspace_singlepart_new.json`. See §17.1.

### 19.5 Maintainer NavComputer screenshot — MEDIA-004

Not in the repository. Maintainer-provided design/rules evidence. Original source unknown unless later established. Do not package. Evidence state: UNKNOWN. Disposition: UNASSESSED.

### 19.6 XLSX drawing part

Empty drawing XML; no embedded workbook images.

---

## 20. Spreadsheet provenance record — SPREAD-001

Covered in §16.3. Additional workbook classification: appears to be a **dataset** (planet geography), not a calculation tool (zero formulas) and not a report. No protection flags inspected beyond absence of vba. Do not use missing core properties as proof of originality.

---

## 21. Foundry and dnd5e licensing context

Not a full audit of Foundry or dnd5e.

**Foundry** (`https://foundryvtt.com/article/license/`, EULA updated March 2, 2023, Version 11.293, access 2026-08-14):

- Limited License for Package Development: packages may utilize/reference/duplicate portions of software code **only to the extent strictly necessary**; packages that function in the absence of Foundry are not permitted.
- Packages may be distributed if designed for use only with a licensed copy of Foundry.
- Publisher bears sole responsibility to uphold intellectual property rights.
- `https://foundryvtt.com/article/licensing-guide/`: Foundry listing review asks whether the author has rights to everything in the package, including other companies’ content and art the author did not create.

**dnd5e 5.2.5** at `C:\Foundry\V13\Data\systems\dnd5e\LICENSE.txt`: MIT-style permission for “this software and associated documentation files,” Copyright 2021 Andrew Clayton. Separate LICENSE files exist under icons/tokens/fonts. Datacron must **not** bundle Foundry or dnd5e code. Datacron should rely on **APIs**. Copying Foundry/dnd5e implementation into Datacron was not done in Phase 2.

Required Foundry package metadata: a `license` field is commonly used; Datacron `module.json` currently omits it. Evidence state: DOCUMENTED for Foundry package-dev terms as published; NOT APPLICABLE as a Datacron asset license.

---

## 22. Runtime network and external content

Static inventory of `origin/v.next` JS:

| Mechanism | Evidence |
|-----------|----------|
| `fetch` | `planet-data.js` → `modules/kakeman89s-datacron/data/planets.json` |
| `fetch` | `hyperspace-routes.js` → `modules/kakeman89s-datacron/data/hyperspace-routes.json` |
| XMLHttpRequest | None found |
| WebSocket | None found |
| `game.socket` handlers | **None** (`git grep`); manifest `"socket": true` only |
| Remote URLs at runtime | None in JS fetch paths |
| iframe / CDN / external scripts / telemetry | None found |
| Update checks | None found |
| Manifest/download URLs | Placeholder GitHub URL only; no `manifest`/`download` fields |
| Hyperlink generation | GeoJSON `link` fields exist in data, not as runtime navigation loaders |

Runtime data access: **module-local** for the two JSON fetches. World-local: none identified. Remote: **not** initiated by inspected code. Unclear: unused `socket: true`.

Licensing implication: module-local JSON still carries the dataset licenses of those files. No network fetch does not make the JSON free to redistribute.

Phase 2 did not initiate remote downloads.

---

## 23. Attribution-model requirements (Phase 3 input; no field selection)

The later architecture must be able to preserve, where a record needs it:

- Source title, URL, project, author
- Revision ID, retrieval date
- Original license, adaptation notice, change notice, share-alike notice
- Media-specific credit
- Record-level and dataset-level source
- Multiple sources
- Canon source and Legends source
- Rules source
- Maintainer-authored content indicator
- Original-art indicator
- License text or license URL

Separate layers (do **not** select storage fields now):

| Layer | Requirement |
|-------|-------------|
| Data schema | Must be able to store the above without destroying lineage |
| Journal display | User-visible credit where share-alike/attribution licenses require it |
| Module-level notice | LICENSE, third-party notices, fan disclaimer, no-affiliation statement |
| README | Dataset/map/code credits; Kakeman89 only as creator name |
| Package-listing | Foundry listing fields; rights representations |
| Source-distribution | GPL corresponding-source for Datacron code if GPL is used; separate content licenses not collapsed into GPL |

---

## 24. Takedown and correction requirements (not implemented)

A future process must support:

- Source correction request
- Attribution correction
- License dispute
- Rights-holder request
- Incorrect Canon/Legends classification
- Incorrect factual data
- Outdated external link
- Removed source page
- Asset removal
- Dataset replacement
- Released-pack correction
- Version tracking
- Change log
- Preservation of historical audit records (append-only `ai/sessions/**` and these Phase documents)

Do not rewrite historical audit records to hide a prior inclusion. Prefer replacement releases plus addenda over silent deletion of history.

---

## 25. Public-release gate

No item advances merely because a plausible source was found.

### A. Items with documented evidence

- GNU GPL-3 license **document** on `main` and `origin/v.next` (LIC-001)
- CC BY-SA 3.0 Unported named for Wookieepedia **text** by FAQ/About (WIKI-001, with Copyrights-page fetch gap)
- Wookieepedia/Fandom statements that **media is not** the text license (WIKI-002)
- Fandom ToU language restricting scraping/automated access (WIKI-001)
- Foundry Limited License for Package Development (package-dev context)
- dnd5e `LICENSE.txt` MIT-style software license (do not bundle)
- SW5e checkout MIT `LICENSE` for Software (SW5E-001)
- GitHub API `license: null` for Wason1797/StarWarsMap (negative documentation)
- Module-local `fetch` paths; no `game.socket` handlers
- JPEG technical properties for `Galactic Map.jpg` (no rights metadata)
- XLSX structural properties (no rights metadata)

### B. Items with partial evidence

- Datacron JS/Python/templates/styles/lang (repo GPL-3 + no file notices)
- Manifest identity (title/id) vs missing license/disclaimer/notices
- StarWarsMap family (claimed GitHub origin; no license)
- Module `planets.json` merge pipeline (script exists; rights unknown)
- GeoJSON CARTO + Wikia URL indicators
- Droid calculator Saga-inspired documentation
- SW5e ATTRIBUTION.md (code vs journals vs art)

### C. Items with unknown evidence

- `Galactic Map.jpg` authorship/license
- Root `planets.json` compilation and `Image` filename catalog
- Geography xlsx rights
- NavComputer matrix original publication
- Fuel / food / supplies / hyperdrive RAW sources
- Requested Droid Shop Tier I–VI / 10% markup / condition rules
- Ship-builder workbook
- Star Wars IP authorization for public distribution
- 38 module planet descriptions
- Random-event blurbs
- Hand-authored route JSON
- Maintainer screenshot

### D. Items with conflicting evidence

- Personal-name attribution in `module.json` and v.next README versus required Kakeman89-only attribution (NOTICE-001)
- Manifest `"socket": true` versus no socket handlers
- v.next README “comply with StarWarsMap license” versus GitHub `license: null`
- Roadmap Phase 2 exit wording (“verified, quarantined, or recommended for removal”) versus this authorized Phase 2 (evidence states only; **no dispositions assigned**)
- GPL-3 presented as repo license versus `module.json` omitting `license` and README saying a module-folder license may be added later

### E. Missing required sources

See §28.

### F. Release blockers

Must **not** be publicly packaged or relied upon as cleared until evidence or replacement is supplied:

1. `Galactic Map.jpg`
2. StarWarsMap JSON family and vendored copy
3. `hyperspace_singlepart_new.json`
4. Root `planets.json` and module `planets.json` (and merge xlsx)
5. Generated hyperspace-routes graph and hand/catalog/overrides derived from the above
6. NavComputer matrix as a claimed RAW/official table
7. Fuel/food/supplies/hyperdrive as claimed RAW
8. Droid Shop as claimed RAW (Tier I–VI path)
9. Ship-builder workbook packaging
10. Wookieepedia media / `Image` filename catalog / any wiki scrape
11. Public Foundry listing / public repo distribution of Star Wars–branded compiled datasets without legal or platform review
12. Personal-name metadata in public package metadata
13. Unverified artwork generally (project rule)

Internal investigation of `v.next` behavior may continue. Internal use is not public clearance.

---

## 26. Provenance traceability matrix

Final disposition for every row: **UNASSESSED**.

| Evidence ID | Phase 0 ID | Req. | Path | Item | Category | Claimed source | Verified source | License | Attribution | Derivative/adaptation | Redistribution evidence | Modification evidence | Record-level provenance | Evidence class | Evidence state | Public-release blocker | Internal investigation | Required next action | Phase 3 input |
|-------------|------------|------|------|------|----------|----------------|-----------------|---------|-------------|----------------------|-------------------------|----------------------|-------------------------|----------------|----------------|------------------------|------------------------|----------------------|---------------|
| LIC-001 | LEGAL-001 | GPL scope | `LICENSE` | GPL-3 text | License | Repo license | Same blob main/v.next | GPL-3 document | FSF on license text | N/A | Verbatim FSF copies of the license text; code coverage incomplete | Identical on main/v.next | N/A | VERIFIED PRIMARY | DOCUMENTED (file) / PARTIALLY DOCUMENTED (code) | Notices gap | Yes | Add module license field later; do not extend to assets | Do not treat as asset license |
| NOTICE-001 | PKG-001 | Attribution | `kakeman89s-datacron/module.json` | Manifest | Package | Kakeman89s Datacron | File contents | None in field | Personal-name present (redacted) | N/A | Not established | Placeholder URL | N/A | VERIFIED PRIMARY | CONFLICTING | Yes (name + missing disclaimer) | Yes | Redact personal name later; Kakeman89 only | Attribution model |
| CODE-001 | APP/NAV/DROID/HOOK | Code | Appendix A group JS | Module JS | Code | Datacron | Repo only | Repo GPL-3; no headers | None in files | Unknown uncredited copies | Not separately evidenced | Git history on v.next | N/A | REPOSITORY CLAIM | PARTIALLY DOCUMENTED | Matrix data inside JS blocked | Yes | Notices; origin review | Reuse gate input |
| CODE-002 | TEMPLATE/STYLE/LANG | Code | Appendix A | UI assets | Code/UI | Datacron | Repo only | None in files | Kakeman89s Datacron strings | N/A | Not established | Unknown | N/A | REPOSITORY CLAIM | PARTIALLY DOCUMENTED | Branding review | Yes | Fan disclaimer | UI copy review |
| CODE-003 | TOOL/TEST | Code | Appendix A Python | Tooling | Code | Datacron | Repo only | None in files | Docstrings | Transforms third-party data | Not established | Unknown | N/A | REPOSITORY CLAIM | PARTIALLY DOCUMENTED | If shipped with uncleared data | Yes | Keep out of module zip unless needed | Tooling vs package |
| CODE-004 | TOOL-009 | Code | `scripts/__pycache__/...pyc` | Bytecode | Generated | Python cache | File present | N/A | N/A | Compiled from TOOL-003 | Not for distribution | Unknown | N/A | DERIVED INDICATOR | NOT APPLICABLE | Hygiene | Limited | Phase 3 consider exclude | Quarantine *consideration* only |
| DOC-001 | DOC-001 | Docs | `README.md` (v.next) | README | Docs | Project | File | Points to missing module license | Personal-name present (redacted) | Describes datasets | N/A | Unknown | N/A | REPOSITORY CLAIM | PARTIALLY DOCUMENTED | Name + over-claims | Yes | Rewrite later without personal name | Docs |
| DOC-002 | DOC-002 | Docs | `CHANGELOG.md` | Changelog | Docs | Keep a Changelog format | File | N/A | N/A | N/A | N/A | Unknown | N/A | REPOSITORY CLAIM | PARTIALLY DOCUMENTED | No | Yes | None in P2 | Docs |
| DOC-003 | DOC-003 | Docs | `docs/compatibility-notes.md` and module copy | Compat notes | Docs | Project | Two paths | N/A | N/A | N/A | N/A | Duplicate paths | N/A | REPOSITORY CLAIM | PARTIALLY DOCUMENTED | No | Yes | Dedup later | Docs |
| DOC-004 | DOC-004 | Droid | `docs/droid-allies-sw5e.md` | Droid doc | Docs/rules | Saga-inspired | Doc claim only | N/A | Saga Edition named, no page | Adaptation claim | Not established | Unknown | N/A | REPOSITORY CLAIM | PARTIALLY DOCUMENTED | RAW claim | Yes | Need RAW source | DROID-RULE-001 |
| DOC-005 | DOC-005 | Routes | `docs/hyperspace-coordinate-transform.md` | Transform doc | Docs | Wason1797/StarWarsMap | GitHub repo exists; license null | Tells reader to comply with missing license | Attribution located as URL | Vendoring described | **Not established** | Unknown | Dataset-level | REPOSITORY CLAIM | CONFLICTING | Yes | Rights-holder clarification | StarWarsMap family |
| WIKI-001 | (planned) | AstroCom | n/a (no scrape) | Wiki text policy | Policy | CC BY-SA 3.0 | FAQ/About; Copyrights fetch incomplete | CC BY-SA 3.0 Unported named for text | Deed + FAQ | Adapted text would be SA | Fandom ToU limits scrape | N/A | Page-level if used | VERIFIED SECONDARY | PARTIALLY DOCUMENTED | If adapted text packaged without notices | Research OK if no scrape | Architecture must support credits | Attribution schema |
| WIKI-002 | (planned) | Art | n/a | Wiki media policy | Policy | File-specific / fair use | FAQ/Copyrights snippets; Fandom help | Not CC BY-SA automatically | Per-file | N/A | **Not established** | N/A | File-level | VERIFIED SECONDARY | DOCUMENTED (exclusion) | Yes | Never ingest wiki art | Art rule |
| TRADEMARK-001 | PKG-001 | Listing | module + datasets | Star Wars IP | Branding | Fan module | No permission located | None located | Missing disclaimer | N/A | **Not established** | N/A | N/A | UNKNOWN | UNKNOWN | Yes | Legal/platform review | Listing gate |
| SW5E-001 | (dep.) | Integration | SW5e 1.4.2 checkout | SW5e module | Dependency | MIT software | `LICENSE` MIT | MIT for Software | ATTRIBUTION.md | Code vs journals vs art | SW5e channel; not Datacron assets | N/A | N/A | VERIFIED PRIMARY (MIT file) | PARTIALLY DOCUMENTED | Do not copy rules/art | Depend only | Do not bundle SW5e | API-only integration |
| WORKBOOK-001 | (missing) | Shipyard | absent | Ship-builder workbook | Spreadsheet | Official SW5e tool (roadmap) | **Not present** | None | None | N/A | **Blocked** | N/A | N/A | UNKNOWN | UNKNOWN | Yes | Maintainer supply + permission | Shipyard blocked |
| MATRIX-001 | NAV-001 | NavComputer | `kakeman89s-datacron/scripts/route-calculator.js` | 9×9 matrix | Rules data | Maintainer screenshot | 81/81 match only | None | None | Encoding of unknown table | **Not established** | Matches transcription | Dataset-level | UNKNOWN | UNKNOWN | Yes | Source clarification | Keep values; gate RAW |
| TRAVEL-RULE-001 | NAV-004 | NavComputer | `travel-calculator.js` / settings | Fuel/food/supplies | Rules | Configurable estimates | None | None | None | Unverified behavior | N/A | Code defaults | N/A | UNKNOWN | UNKNOWN | Yes for RAW | Yes as unverified | Authoritative rules | EXISTING UNVERIFIED BEHAVIOR |
| DROID-RULE-001 | DROID-001 | Droid Shop | `droid-ally-pricing.js` | Pricing formula | Rules | Saga-inspired | Doc + code | None for RAW | Saga named | Adaptation claim | Not established | floor/2 implemented | N/A | REPOSITORY CLAIM | UNKNOWN (RAW) | Yes for RAW | Yes as current behavior | RAW input | Do not retain/replace now |
| DATA-001 | DATA-001 | AstroCom | `planets.json` | Root planet dump | Dataset | None | None | None | Image filenames only | Possible wiki catalog | **Not established** | Unknown | None | DERIVED INDICATOR | UNKNOWN | Yes | Replacement or rights | Quarantine *consideration* |
| ASTRO-001 | ASTRO-001 | AstroCom | `kakeman89s-datacron/data/planets.json` | Runtime planets | Dataset | xlsx+JSON merge | Merge script exists | None | None | Derived merge | **Not established** | Merge report | None | REPOSITORY CLAIM | PARTIALLY DOCUMENTED | Yes | Rights or rebuild | Dataset disposition later |
| SPREAD-001 | ASSET-002 | AstroCom | `Star Wars Galaxy Map Grid Coordinates.xlsx` | Geography workbook | Spreadsheet | Galaxy map coordinates | Filename + merge use | None | No core.xml | Dataset | **Not established** | No formulas | None | UNKNOWN | UNKNOWN | Yes | Rights-holder / replacement | Spreadsheet |
| MAP-001 | ASSET-001 | Art | `Galactic Map.jpg` | Raster map | Image | Visual reference | None | None | None | Unknown | **Not established** | Unknown | N/A | UNKNOWN | UNKNOWN | Yes | Kakeman89 original or licensed art | Replace; do not ship |
| ASSET-003 | ASSET-003 | Routes | `hyperspace_singlepart_new.json` | GeoJSON lanes | Dataset | Unnamed map extract | cartodb_id + wikia links | None | Wikia URLs in `link` | CARTO + wiki-linked geometry | **Not established** | Unknown | Dataset-level URLs | DERIVED INDICATOR | UNKNOWN | Yes | Rights; do not scrape wiki | Route phase still deferred |
| PROV-001 | DATA-003/008 | Routes | StarWarsMap JSON + vendor copy | StarWarsMap family | Dataset | Wason1797/StarWarsMap | GitHub identity; license null | **None located** | README URL | Possible Bernberg/CARTO upstream | **Not established** | Vendored copy | Lane-name lists | REPOSITORY CLAIM | PARTIALLY DOCUMENTED | Yes | License from author or drop | Distinct source family |
| DATA-009 | DATA-009 | Routes | `planet-name-aliases.json` | Alias table | Data | Datacron | File comment | None | None | Tiny mapping | Not established | Unknown | N/A | REPOSITORY CLAIM | PARTIALLY DOCUMENTED | Inherits StarWarsMap | Yes | Keep with family | Small |
| ROUTE-001 | ROUTE-001 | Routes | `hyperspace-routes.json` | Generated graph | Dataset | Build script | Script exists | None | None | Derived from ASSET-003+PROV-001+planets | **Not established** | Generated | None | DERIVED INDICATOR | UNKNOWN | Yes | Inherit parents | Deferred navigation |
| MEDIA-002 | DATA-001 | Art | `planets.json` Image field | Filename catalog | Media refs | None | Filenames only | None | None | Wiki-like titles | **Not established** | Unknown | None | DERIVED INDICATOR | UNKNOWN | Yes | Do not fetch | No wiki art |
| MEDIA-004 | NAV-002 | NavComputer | (untracked screenshot) | Matrix screenshot | Image | Maintainer | File not in repo | None | None | Unknown original | **Not established** | Transcription in roadmap | N/A | UNKNOWN | UNKNOWN | Yes (packaging) | Design evidence only | Do not package |
| FOUNDRY-001 | (env) | Package | Foundry EULA article | Package-dev terms | Policy | Foundry Gaming LLC | Website article | Limited package license | N/A | N/A | Packages with Foundry only | N/A | N/A | VERIFIED PRIMARY | DOCUMENTED | Listing still needs IP clearance | Dev OK | Do not copy Foundry code | API-only |
| DND5E-001 | (env) | Package | dnd5e LICENSE.txt | System software | Policy | MIT software | File | MIT-style | Andrew Clayton in file | N/A | Do not bundle | N/A | N/A | VERIFIED PRIMARY | DOCUMENTED | N/A if not bundled | API only | Do not copy | API-only |
| ENV-001 | (env) | Runtime | V13 sw5e 1.4.1-remediation-test | Linked SW5e | Environment | Remediation build | Phase 1 | N/A to Datacron | N/A | N/A | Not a Datacron asset | N/A | N/A | VERIFIED PRIMARY | NOT APPLICABLE | N/A | Env only | Do not treat as Datacron | Ignore for packaging |
| PLAN-001 | (planning) | Process | Roadmap, Phase 0, Phase 1, this file | Planning records | Project docs | Kakeman89 project | Created this effort | N/A | Kakeman89 | N/A | Not module content | Append-only | N/A | VERIFIED PRIMARY | NOT APPLICABLE | N/A | Yes | Do not ship in module zip | Process |

Additional Appendix A files inherit the grouped row that lists them (CODE-001 through CODE-007, DOC-006, DATA-004–007, ROUTE-004–006, GOV-001, PKG-003). None are omitted.

---

## 27. Risk register

Likelihood scores are not used.

| Risk | Evidence | Unknowns | Public-release effect | Internal-development effect | Mitigation requirement | Phase 3 decision impact | Status |
|------|----------|----------|----------------------|----------------------------|------------------------|-------------------------|--------|
| Wookieepedia attribution | CC BY-SA 3.0 deed; FAQ | Exact Copyrights reuse checklist | Block adapted-text packaging until notices designed | Research without scrape OK | Attribution model | Schema must support credits | Open |
| Wookieepedia share-alike | CC BY-SA 3.0; CC says no non-CC compatible license for 3.0 | Whether GM snapshots are adaptations; GPL coexistence | Block combining adapted text into a GPL-only blob without review | Same | Separate content license / review | May force dual licensing or original summaries only | Open |
| Wookieepedia media | File-specific / fair use | Any file’s tag | Block all wiki image use | Do not download | Original/licensed art only | Art is out of automated pipeline | Open |
| Star Wars IP | No permission located | Whether names-only UI is treated differently | Block public listing until review | Private table use still a rights question | Legal/platform review | May constrain public vs private distribution | Open |
| Trademarks / branding | Title uses Star Wars/SW5e; no disclaimer | Listing standards | Block listing | Add disclaimer later | Fan disclaimer; no official-claim | Manifest rewrite in a later authorized phase | Open |
| SW5e code vs rules | MIT software vs ATTRIBUTION.md content | Journal/art redistribution | Do not copy SW5e into Datacron | Integration via APIs | Keep layers separate | Reuse gate must not absorb SW5e content | Open |
| Ship-builder workbook | Absent; no permission | Official file identity | Packaging blocked | Shipyard implementation blocked | Supply file + permission or independent rules | Shipyard phase gated | Open |
| Unknown matrix origin | 81/81 match ≠ source | Publisher | Cannot claim RAW; packaging of table uncleared | Keep as unverified behavior | Maintainer source | Do not symmetrize; do not drop from scope | Open |
| Fuel/food/supplies | Code defaults only | SW5e/SotG citations | Cannot claim RAW | Configurable unverified | Authoritative rules | Settings ≠ approval | Open |
| Droid pricing | Saga-inspired ≠ requested RAW | Tier I–VI sources | Cannot claim RAW | Current calculator exists | Authoritative rules | Do not retain/replace in P2 | Open |
| Planet dataset provenance | Merge claim; two schemas | Compiler rights; wiki prose in 38 descriptions | Block shipping JSON | Inspect OK | Rebuild from cleared sources or rights | Dataset disposition later | Open |
| Lane dataset provenance | CARTO + Wikia links + StarWarsMap | Geometry rights | Block public routes | Advanced already disabled | Rights or original graph | Route phase remains deferred | Open |
| StarWarsMap licensing | license null; vendored files | Author grant | Block | Topology study OK | Author license or remove from package | Distinct family | Open |
| Galactic Map.jpg | No EXIF; 10800² JPEG | Artist | Block | Calibration internally still a rights question | Replacement art | Do not ship | Open |
| Personal-name metadata | Manifest + README | — | Block public metadata as-is | Docs exist | Kakeman89 only | Manifest edit later | Open |
| GPL-3 scope | File present; over-extension risk | Final product license | Mislabeling third-party assets | Confusion | Keep notices separate | Do not relicense assets | Open |
| Third-party notices | Missing | Complete inventory | Foundry listing likely reject | — | Notices file later | Phase 3+ | Open |
| Public Foundry listing | licensing-guide rights questions | Review outcome | Block until A–F cleared | Dev can continue privately | Clear blockers first | After legal/platform review | Open |
| External-link maintenance | 124 Wikia URLs; placeholder GitHub | Link rot | Stale credits | — | Takedown/correction process | Schema + changelog | Open |
| Takedown/correction | Not implemented | Process owner | Required before/at listing | — | Design in later phase | Append-only history | Open |
| Source revision drift | Wiki/CARTO dumps undated | Retrieval dates | Silent inaccuracy | — | Revision IDs / dates | Attribution fields | Open |
| Generated data lineage | Build scripts exist | Whether outputs match current inputs | Hidden third-party content in “generated” JSON | Rebuilds repeat uncleared inputs | Treat generated as derived | Do not treat generated as original | Open |

---

## 28. Missing-source request list

Do not treat this as questions in chat. Maintainer supply needed:

| Item needed | Why | Requirement supported | Phase blocked | Acceptable evidence examples | File needed? | URL/citation enough? | Redistribution permission must be documented? |
|-------------|-----|----------------------|---------------|------------------------------|--------------|----------------------|-----------------------------------------------|
| Original source of the hyperspace matrix | 81 values encoded; authority unknown | NAV-002 / MATRIX-001 | Public NavComputer RAW; public packaging of table | Sourcebook title+page; community post with license; maintainer original-work statement | Screenshot already exists; published table preferred | Citation may suffice for rules; packaging still needs permission | Yes if the table is shipped |
| Fuel rules | EXISTING UNVERIFIED BEHAVIOR | TRAVEL-RULE-001 | RAW claims | SotG/PHB citation | No | Yes if complete formula | If quoting rules text |
| Food / portion rules | Same | TRAVEL-RULE-001 | RAW claims | Citation | No | Yes | If quoting |
| Supplies rules | Half-food is code-only | TRAVEL-RULE-001 | RAW claims | Citation | No | Yes | If quoting |
| Hyperdrive calculation rules | Advanced uses undocumented hours scaling | TRAVEL-RULE-001 | RAW Advanced | Citation | No | Yes | If quoting |
| Droid Tier I–VI prices | Requested RAW missing | DROID-RULE-001 | Droid Shop RAW | Table citation | No | Yes | If quoting |
| Ten-percent class markup | Requested RAW missing | DROID-RULE-001 | Droid Shop RAW | Citation | No | Yes | If quoting |
| Condition-pricing rule | Requested RAW missing | DROID-RULE-001 | Droid Shop RAW | Citation | No | Yes | If quoting |
| SW5e ship-builder workbook | Absent | WORKBOOK-001 / Shipyard | Shipyard | Official download page + file for private analysis | Yes for implementation inspection | URL identifies source; file needed to implement | **Yes** before packaging; implementation-from-rules still needs permission statement |
| Workbook redistribution or implementation permission | Public availability ≠ permission | WORKBOOK-001 | Packaging | Written terms | Permission record | Terms URL if official | **Yes** |
| Planet dataset source | Two JSON corpora + xlsx | ASTRO-001 / DATA-001 | Public AstroCom data | Author, license, retrieval date | Maybe | If rights-holder statement | **Yes** |
| Lane dataset source | GeoJSON + generated graph | ASSET-003 / ROUTE-001 | Public routes | CARTO/Bernberg/other license | Maybe | If rights-holder statement | **Yes** |
| StarWarsMap source and license | license null | PROV-001 | Public lanes | LICENSE file or author email grant | Not necessarily the whole repo | Authoritative license URL | **Yes** |
| Galactic Map.jpg source and license | No EXIF | MAP-001 | Public art | Artist + license | Replacement file | License statement | **Yes** |
| Approved original or separately licensed artwork | Project rule | Art | Public UI art | Kakeman89 originals or invoices/licenses | Yes | License for third-party art | **Yes** |
| Canon/Legends record-level sources | `is_canon` only in StarWarsMap; module JSON lacks fields | AstroCom | Accurate labels | Per-record citations | No | Yes | If copying wiki text |

---

## 29. Phase 3 inputs (no decisions)

Phase 3 must consume these evidence states. It must not treat Phase 2 as clearance.

Inputs:

- All rows remain UNASSESSED for disposition.
- Reuse gate A–D remains unselected.
- Public-release gate A–F above.
- Attribution-model requirements (§23) without selected fields.
- Takedown requirements (§24) unimplemented.
- Artwork: original or separately licensed only; no wiki art pipeline.
- Matrix remains in scope, source unknown.
- Shipyard remains workbook-blocked.
- Route navigation remains deferred.
- Do not begin architecture design until Phase 3 is authorized.

---

## 30. Phase 2 exit criteria checklist

| Criterion | Met? |
|-----------|------|
| All 62 tracked origin/v.next files covered | Yes (Appendix A) |
| Main LICENSE and README covered | Yes |
| All code families have a licensing evidence state | Yes |
| Every dataset has a source and licensing evidence state | Yes |
| Every image and map has an individual record | Yes (`Galactic Map.jpg`; no other rasters) |
| Every spreadsheet has a provenance record | Yes |
| StarWarsMap audited as a source family | Yes |
| Wookieepedia text and media treated separately | Yes |
| Wookieepedia attribution/share-alike documented from authoritative evidence when accessible | Yes, with Copyrights-page fetch gap recorded |
| Star Wars IP/branding recorded without unsupported legal conclusions | Yes |
| SW5e code, rules, data, workbook, assets separated | Yes |
| Matrix source established or explicitly unknown | Explicitly unknown |
| Fuel/food/supplies/hyperdrive established or unknown | Explicitly unknown |
| Droid Shop sources established or missing | Explicitly missing for requested RAW |
| Ship-builder workbook status recorded | Absent; packaging blocked |
| GPL-3 scope not extended without evidence | Yes |
| Personal-name metadata flagged without reproducing the name | Yes |
| No unverified asset approved for public release | Yes |
| Provenance matrix complete | Yes |
| Public-release gate complete | Yes |
| Missing-source list complete | Yes |
| All components remain UNASSESSED | Yes |
| No final disposition assigned | Yes |
| Reuse gate unselected | Yes |
| No architecture decision | Yes |
| Phase 3 not started | Yes |
| No implementation | Yes |

---

## Appendix A — Complete 62-file coverage map

| # | Path | Phase 0 ID | Evidence ID / group | Evidence state |
|---|------|------------|---------------------|----------------|
| 1 | `.cursor/rules/SHARED-MASTER-CONTEXT.mdc` | GOV-001 | CODE-007 | NOT APPLICABLE |
| 2 | `.cursor/rules/karpathy-guidelines.mdc` | GOV-001 | CODE-007 | NOT APPLICABLE |
| 3 | `.gitignore` | PKG-003 | CODE-006 | NOT APPLICABLE |
| 4 | `CHANGELOG.md` | DOC-002 | DOC-002 | PARTIALLY DOCUMENTED |
| 5 | `Galactic Map.jpg` | ASSET-001 | MAP-001 | UNKNOWN |
| 6 | `LICENSE` | LEGAL-001 | LIC-001 | DOCUMENTED (file) |
| 7 | `README.md` | DOC-001 | DOC-001 | PARTIALLY DOCUMENTED |
| 8 | `Star Wars Galaxy Map Grid Coordinates.xlsx` | ASSET-002 | SPREAD-001 | UNKNOWN |
| 9 | `StarWarsMap/map_api/data/grid_db.json` | DATA-003 | PROV-001 | PARTIALLY DOCUMENTED |
| 10 | `StarWarsMap/map_api/data/hyperlanes_db.json` | DATA-003 | PROV-001 | PARTIALLY DOCUMENTED |
| 11 | `StarWarsMap/map_api/data/regions_db.json` | DATA-003 | PROV-001 | PARTIALLY DOCUMENTED |
| 12 | `docs/compatibility-notes.md` | DOC-003 | DOC-003 | PARTIALLY DOCUMENTED |
| 13 | `docs/droid-allies-sw5e.md` | DOC-004 | DROID-RULE-001 / DOC-004 | PARTIALLY DOCUMENTED |
| 14 | `docs/hyperspace-coordinate-transform.md` | DOC-005 | DOC-005 / PROV-001 | CONFLICTING |
| 15 | `hyperspace_singlepart_new.json` | ASSET-003 | ASSET-003 | UNKNOWN |
| 16 | `kakeman89s-datacron/data/grid-to-geo.json` | DATA-004 | ROUTE-* group | PARTIALLY DOCUMENTED |
| 17 | `kakeman89s-datacron/data/hyperspace-control-points.json` | DATA-005 | ROUTE-* group | UNKNOWN |
| 18 | `kakeman89s-datacron/data/hyperspace-routes-catalog.json` | ROUTE-004 | ROUTE-* group | UNKNOWN |
| 19 | `kakeman89s-datacron/data/hyperspace-routes.hand.json` | ROUTE-005 | ROUTE-* group | UNKNOWN |
| 20 | `kakeman89s-datacron/data/hyperspace-routes.json` | ROUTE-001 | ROUTE-001 | UNKNOWN |
| 21 | `kakeman89s-datacron/data/planets-merge-report.txt` | DATA-006 | CODE-005 | UNKNOWN |
| 22 | `kakeman89s-datacron/data/planets.json` | ASTRO-001 | ASTRO-001 | PARTIALLY DOCUMENTED |
| 23 | `kakeman89s-datacron/data/random-events.json` | DATA-007 | DATA-007 | UNKNOWN |
| 24 | `kakeman89s-datacron/data/route-tier-overrides.json` | ROUTE-006 | ROUTE-* group | UNKNOWN |
| 25 | `kakeman89s-datacron/data/starwarsmap/hyperlanes_db.json` | DATA-008 | PROV-001 | PARTIALLY DOCUMENTED |
| 26 | `kakeman89s-datacron/data/starwarsmap/planet-name-aliases.json` | DATA-009 | DATA-009 | PARTIALLY DOCUMENTED |
| 27 | `kakeman89s-datacron/docs/compatibility-notes.md` | DOC-003 | DOC-003 | PARTIALLY DOCUMENTED |
| 28 | `kakeman89s-datacron/lang/en.json` | LANG-001 | CODE-002 | PARTIALLY DOCUMENTED |
| 29 | `kakeman89s-datacron/module.json` | PKG-001 | NOTICE-001 | CONFLICTING |
| 30 | `kakeman89s-datacron/scripts/actor-helpers.js` | NAV-008 | CODE-001 | PARTIALLY DOCUMENTED |
| 31 | `kakeman89s-datacron/scripts/datacron-app.js` | APP-001 | CODE-001 | PARTIALLY DOCUMENTED |
| 32 | `kakeman89s-datacron/scripts/droid-ally-app.js` | APP-002 | CODE-001 | PARTIALLY DOCUMENTED |
| 33 | `kakeman89s-datacron/scripts/droid-ally-pricing.js` | DROID-001 | CODE-001 / DROID-RULE-001 | PARTIALLY DOCUMENTED / UNKNOWN RAW |
| 34 | `kakeman89s-datacron/scripts/hyperspace-routes.js` | ROUTE-002 | CODE-001 | PARTIALLY DOCUMENTED |
| 35 | `kakeman89s-datacron/scripts/logger.js` | LOG-001 | CODE-001 | PARTIALLY DOCUMENTED |
| 36 | `kakeman89s-datacron/scripts/main.js` | HOOK-001 | CODE-001 | PARTIALLY DOCUMENTED |
| 37 | `kakeman89s-datacron/scripts/piloting-roll.js` | NAV-006 | CODE-001 | PARTIALLY DOCUMENTED |
| 38 | `kakeman89s-datacron/scripts/planet-combo.js` | NAV-007 | CODE-001 | PARTIALLY DOCUMENTED |
| 39 | `kakeman89s-datacron/scripts/planet-data.js` | ASTRO-002 | CODE-001 | PARTIALLY DOCUMENTED |
| 40 | `kakeman89s-datacron/scripts/route-calculator.js` | NAV-001 | CODE-001 / MATRIX-001 | PARTIALLY DOCUMENTED / UNKNOWN matrix |
| 41 | `kakeman89s-datacron/scripts/settings.js` | SET-000 | CODE-001 / TRAVEL-RULE-001 | PARTIALLY DOCUMENTED |
| 42 | `kakeman89s-datacron/scripts/time-display.js` | NAV-009 | CODE-001 | PARTIALLY DOCUMENTED |
| 43 | `kakeman89s-datacron/scripts/travel-calculator.js` | NAV-004 | CODE-001 / TRAVEL-RULE-001 | PARTIALLY DOCUMENTED / UNKNOWN rules |
| 44 | `kakeman89s-datacron/styles/datacron.css` | STYLE-001 | CODE-002 | PARTIALLY DOCUMENTED |
| 45 | `kakeman89s-datacron/templates/datacron.hbs` | TEMPLATE-001 | CODE-002 | PARTIALLY DOCUMENTED |
| 46 | `kakeman89s-datacron/templates/droid-ally-pricing.hbs` | TEMPLATE-002 | CODE-002 | PARTIALLY DOCUMENTED |
| 47 | `planets.json` | DATA-001 | DATA-001 / MEDIA-002 | UNKNOWN |
| 48 | `scripts/__pycache__/generate_starwarsmap_integration_review.cpython-313.pyc` | TOOL-009 | CODE-004 | NOT APPLICABLE |
| 49 | `scripts/build-hyperspace-graph.py` | TOOL-001 | CODE-003 | PARTIALLY DOCUMENTED |
| 50 | `scripts/debug/phase0-runtime-inspector.js` | TOOL-002 | CODE-001 | PARTIALLY DOCUMENTED |
| 51 | `scripts/generate_starwarsmap_integration_review.py` | TOOL-003 | CODE-003 | PARTIALLY DOCUMENTED |
| 52 | `scripts/merge-planet-data.py` | TOOL-004 | CODE-003 | PARTIALLY DOCUMENTED |
| 53 | `scripts/normalize_planet_names.py` | TOOL-005 | CODE-003 | PARTIALLY DOCUMENTED |
| 54 | `scripts/output/hyperspace_validation_report.json` | TEST-001 | CODE-005 | UNKNOWN |
| 55 | `scripts/output/planets_name_map.json` | TOOL-006 | CODE-005 | UNKNOWN |
| 56 | `scripts/output/planets_name_report.csv` | TOOL-006 | CODE-005 | UNKNOWN |
| 57 | `scripts/output/starwarsmap_audit_report.json` | TOOL-007 | CODE-005 | UNKNOWN |
| 58 | `scripts/output/starwarsmap_audit_summary.md` | DOC-006 | CODE-005 | UNKNOWN |
| 59 | `scripts/output/starwarsmap_integration_review.json` | TOOL-007 | CODE-005 | UNKNOWN |
| 60 | `scripts/output/starwarsmap_integration_review.md` | DOC-006 | CODE-005 | UNKNOWN |
| 61 | `scripts/starwarsmap_audit.py` | TOOL-008 | CODE-003 | PARTIALLY DOCUMENTED |
| 62 | `scripts/validate-hyperspace-routes.py` | TEST-001 | CODE-003 | PARTIALLY DOCUMENTED |

Main-only files: `LICENSE` (LIC-001), `README.md` stub (NOT APPLICABLE as module content / PARTIALLY DOCUMENTED as heading).

---

## Appendix B — External sources consulted (access 2026-08-14)

Listed for traceability. Fetch limitations are noted in §4.

- `https://starwars.fandom.com/wiki/Wookieepedia:FAQ`
- `https://starwars.fandom.com/wiki/Wookieepedia:About`
- `https://starwars.fandom.com/wiki/Wookieepedia:Copyrights` (timeout; snippets only)
- `https://creativecommons.org/licenses/by-sa/3.0/`
- `https://creativecommons.org/compatible-licenses/`
- `https://www.fandom.com/terms-of-use`
- `https://www.fandom.com/licensing` (Cloudflare interstitial)
- `https://community.fandom.com/wiki/Help:Licensing` (search)
- `https://community.fandom.com/wiki/Forking_Policy` (cited by FAQ; not fully fetched)
- `https://foundryvtt.com/article/license/`
- `https://foundryvtt.com/article/licensing-guide/`
- `https://foundryvtt.com/article/publisher-handbook/`
- `https://api.github.com/repos/Wason1797/StarWarsMap`
- `https://github.com/Wason1797/StarWarsMap`
- `http://www.swgalaxymap.com/download/` (search snippet)
- `https://support.starwars.com/hc/en-us/articles/360001406466-Can-I-get-permission-to-use-Star-Wars-property` (Cloudflare interstitial)
- SW5e 1.4.2 checkout `LICENSE`, `README.md`, `ATTRIBUTION.md`, `module.json`
- dnd5e 5.2.5 `LICENSE.txt`

---

*End of Phase 2 report. Phase 3 is not authorized by this document.*
