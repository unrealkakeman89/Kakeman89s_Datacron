# AstroCom — Source Enrichment Guide

- **Audience:** Maintainers filling allowlisted gaps in private sources
- **Attribution:** Kakeman89
- **Phase:** 6 AstroCom MVP

---

## Policy (Phase 6)

Enrichment is **manifest-led** and **MANUAL only**.

| Allowed | Not allowed |
| --- | --- |
| Manual evidence under the enrichment tree | Automated offline parser (unauthorized until a separate gate) |
| Allowlisted fields on allowlisted `stableId`s | Wookieepedia / web scrape |
| Reviewed promotion into authored pilot | Image fetch or packaging |
| Completeness reports that measure gaps | Inventing System/Region from planet names |

---

## Layout

All enrichment artifacts live under:

`kakeman89s-datacron/data/sources/astrocom/enrichment/`

| Path | Role |
| --- | --- |
| `manifest.v1.json` | Allowlist: which records/evidence files may be applied |
| `evidence/` | Reviewed evidence JSON (e.g. Alderaan System correction) |
| `candidates/` | Optional candidate staging (still review-gated) |

Example manifest entry points at evidence such as `evidence/ac-canon-alderaan-system.v1.json` for `ac:canon:alderaan`.

---

## Workflow

1. Measure gaps with `npm run astrocom:completeness` (does not invent values).
2. Add or update **evidence** for allowlisted fields only.
3. Register the evidence file on `manifest.v1.json`.
4. Human review (Kakeman89): approve field candidates; never silently overwrite approved present values.
5. Apply enrichment offline into the authored pilot.
6. Regenerate packs with `npm run astrocom:pilot`.

Presence vocabulary: missing fields stay “not yet sourced” until evidence is approved. Do not treat missing as proof of empty lore.

---

## Parser gate

An automated offline parser is **out of scope** for the current Phase 6 execution. Do not add scrape/parser pipelines without a separate maintainer authorization.

---

## Related docs

- [astrocom-content-review-workflow.md](astrocom-content-review-workflow.md)
- [astrocom-pack-generation-guide.md](astrocom-pack-generation-guide.md)
