# AstroCom — GM / Assistant Guide

- **Audience:** Gamemaster and Assistant GM
- **Module:** Kakeman89's Datacron
- **Attribution:** Kakeman89
- **Phase:** 6 AstroCom MVP

---

## Open AstroCom

1. Enable **Kakeman89's Datacron** in the world.
2. Confirm world setting **Feature: AstroCom** (`featureAstroCom`) is on (default **true**).
3. Use the scene-control AstroCom button (Player role and above when the feature is enabled).
4. If you toggle `featureAstroCom`, Foundry **requires a reload** before the change takes effect.

When disabled: no scene-control entry, no app, no index load, no rebuild affordance.

---

## Browse and filter

- Pick **Canon** or **Legends** continuity.
- Search by name/alias (case-insensitive).
- Filter by primary Region, Sector, System, Grid, Route, and region classifications.
- Multi-region classification filters match any approved classification; folder trees still use the primary Region only.
- Open the linked Journal from a result. Direct Journal access still follows Foundry ownership/permissions.

Expected UI states: loading, empty, partial, unavailable pack, index error, stale index, or Journal resolution failure.

---

## Immutable packs (Option A)

Normal play uses **shipped module packs**:

- `kakeman89s-datacron.astrocom-canon`
- `kakeman89s-datacron.astrocom-legends`

These packs are **read-only** during play. Do not hand-edit LevelDB pack files. Content changes go through offline source review + `npm run astrocom:pilot` (see pack-generation guide).

The Phase 6 MVP world `datacron-phase6-mvp` refuses in-world pack mutation / rebuild.

---

## `featureAstroCom`

| Property | Value |
| --- | --- |
| Scope | World |
| Default | `true` |
| `requiresReload` | `true` |
| Who can change it | Full Gamemaster only |

---

## Permissions matrix (summary)

| Capability | Player / Trusted | Assistant GM | Full GM |
| --- | --- | --- | --- |
| Browse / search / open player-visible Journals | Yes | Yes | Yes |
| Source / conflict / review detail | No | Yes | Yes |
| Approve enrichment (offline workflow) | No | No | Yes (maintainer process) |
| Dev rebuild / pack tooling in-world | No | No | Only in known PoC/pilot worlds — **not** `datacron-phase6-mvp` |
| Change `featureAstroCom` | No | No | Yes |

Observer / Limited: no AstroCom entry point.

---

## Related docs

- [astrocom-player-guide.md](astrocom-player-guide.md)
- [astrocom-pack-generation-guide.md](astrocom-pack-generation-guide.md)
- [astrocom-content-review-workflow.md](astrocom-content-review-workflow.md)
