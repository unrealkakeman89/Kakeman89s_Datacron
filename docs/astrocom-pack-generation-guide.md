# AstroCom — Pack Generation Guide

- **Audience:** Maintainers generating Canon/Legends module packs offline
- **Attribution:** Kakeman89
- **Phase:** 6 AstroCom MVP

---

## Option A — immutable module packs

Phase 6 ships **Option A**:

1. Generate Journals/folders/index **offline** from reviewed authored sources.
2. Emit Foundry LevelDB packs `astrocom-canon` and `astrocom-legends` under `kakeman89s-datacron/packs/`.
3. Register packs in `module.json`.
4. At the table: packs are **immutable** — browse and open Journals only.

Do not hand-edit LevelDB files. Do not treat in-world rebuild as the content authoring path for MVP.

---

## Pilot generate (authorized default)

From the repository root:

```bash
npm run astrocom:pilot
```

This builds the curated Phase 5/6 pilot (approved records only), not the full 2029-record corpus.

Useful companions:

| Script | Purpose |
| --- | --- |
| `npm run astrocom:completeness` | Gap counts for review |
| `npm run astrocom:analyze` | Adapter analysis (no full emit) |
| `npm run astrocom:generate` | Generators used by pipeline CLIs |

---

## World behavior

| World id | Pack mutation |
| --- | --- |
| `datacron-phase6-mvp` | **Refused** — immutable Option A |
| Other non-PoC/non-pilot worlds | Treated as immutable |
| `datacron-phase5-pilot` / `datacron-phase4-poc` | Dev/pilot tooling only; not the Phase 6 play path |

Gameplay rebuild that mutates installed module packs is removed from the MVP path.

---

## Bulk ingest guard

Full-dataset pack emit requires **both**:

1. Exact file `kakeman89s-datacron/data/sources/astrocom/review/BULK_INGEST_AUTHORIZED.md`
2. Explicit `--bulk` on the authorized CLI path

If either is missing, bulk generation is **refused**. Pilot generation remains available.

### Never create `BULK_INGEST_AUTHORIZED.md` casually

Creating that file is a **separate maintainer authorization**, not a convenience flag. Do not add it to unblock scripts, tests, or “just this once” full emits. Phase 6 docs and tools must keep it absent unless Kakeman89 explicitly authorizes bulk ingest.

---

## After generation

1. Confirm generated journals/folders under `data/generated/astrocom/` (and pilot subtree as applicable).
2. Confirm pack discovery ids `kakeman89s-datacron.astrocom-canon` / `.astrocom-legends`.
3. Validate in disposable Foundry world `datacron-phase6-mvp` with packs locked/read-only for play.

---

## Related docs

- [astrocom-source-enrichment-guide.md](astrocom-source-enrichment-guide.md)
- [astrocom-gm-guide.md](astrocom-gm-guide.md)
- [KAKEMAN89S_DATACRON_PHASE_6_ASTROCOM_MVP_PLAN.md](KAKEMAN89S_DATACRON_PHASE_6_ASTROCOM_MVP_PLAN.md)
