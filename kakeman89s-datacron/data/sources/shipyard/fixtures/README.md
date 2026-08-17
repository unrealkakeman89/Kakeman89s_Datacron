# Phase 8 vector fixtures

Authored workbook I/O vectors for Kakeman89s Datacron Shipyard calculation parity.

## Source workbook (cite only — never package or commit)

- Path: `C:\Users\ckauble\OneDrive - Riverside Bank of Dublin\Documents\GitHub\SW5e Docs\SotG Shipbuilder and Shipyard.xlsx`
- SHA-256: `090770BAEB5EBE2CFE2D45F3653A2193691111D20D1AD092FE387BB62C3DE1ED`
- Packaging/redistribution into Datacron: **not authorized**

## File

- `phase8-vectors.v1.json` — five valid vectors + one invalid vector

## Re-capture procedure

1. Verify the authoritative workbook hash matches Phase 7/8.
2. Copy the workbook to an OS temporary directory (not into Datacron).
3. Open in Excel without macros; refuse external-link refresh; do not save.
4. Capture scenarios on `Starship Sheet`; for `v1-example-xwing` use `Example X-wing` as expected-value source.
5. Record stable semantic inputs and displayed outputs. Distinguish number / string / blank / error / notAvailable / notCaptured.
6. Close Excel with **Do not Save**.
7. Delete the temporary copy.
8. Re-verify the authoritative workbook hash is unchanged.
9. Update `phase8-vectors.v1.json` with `capturedBy: "Kakeman89"` and the actual capture date.

## Attribution

Authored normalization: Kakeman89 only. No personal names.
