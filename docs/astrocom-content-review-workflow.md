# AstroCom — Content Review Workflow

- **Audience:** Maintainers reviewing authored AstroCom records
- **Attribution:** Kakeman89 only (no personal names in review fields or docs)
- **Phase:** 6 AstroCom MVP

---

## Purpose

Human review gates every value that ships in module packs. Continuity hints and adapter analysis never auto-approve. Incomplete sources show as not-yet-sourced presence; they must not be invented.

---

## Review status

Typical record-level statuses:

| Status | Meaning |
| --- | --- |
| `draft` | Work in progress; not pack-eligible |
| `approved` | Human-reviewed; eligible for pilot/pack generation when otherwise valid |
| `quarantined` | Held out of packs (conflicts, demos, policy holds) |
| `rejected` | Explicitly not shipped |

Approved records require: `stableId`, approved continuity, `reviewedBy`, and `lastReviewedAt`.

**Attribution:** set `reviewedBy` to **Kakeman89** only.

---

## Approving fields

Field values use a presence model (`present` / `missing` / related vocabulary) plus `fieldProvenance`.

Rules:

1. Promote a candidate only after evidence review.
2. Record provenance (source id, locator, method, candidate value, review status, reviewer, timestamp).
3. **No silent overwrite:** an already-approved present field cannot be replaced unless an **explicit override** is used in the enrichment/approval path.
4. Region classifications and System corrections follow the same approve-then-apply path; do not invent values from planet names.

Offline helpers live under `kakeman89s-datacron/scripts/astrocom/pipeline/` (`provenance.js`, `apply-enrichment.js`). Runtime AstroCom does not approve content in play.

---

## Conflicts and quarantine

- Geography/name/alias conflicts stay in review/quarantine artifacts until resolved.
- Quarantined records stay out of Canon/Legends packs.
- Do not resolve conflicts by guessing lore.

---

## After approval

1. Update authored pilot / enrichment evidence as needed.
2. Regenerate offline with `npm run astrocom:pilot` (see pack-generation guide).
3. Verify Journals/folders in a disposable Foundry world — never mutate packs in `datacron-phase6-mvp` for content authoring.

---

## Related docs

- [astrocom-source-enrichment-guide.md](astrocom-source-enrichment-guide.md)
- [astrocom-pack-generation-guide.md](astrocom-pack-generation-guide.md)
