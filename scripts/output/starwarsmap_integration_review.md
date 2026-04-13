# StarWarsMap integration review

## 1. Produce a concise report of all modifications already made to:

- **scripts/build-hyperspace-graph.py**: Not tracked in git on this branch (untracked/ignored); present locally for StarWarsMap / hyperspace graph integration.
- **sw5e-nav-computer/data/starwarsmap/hyperlanes_db.json**: Not tracked in git on this branch (untracked/ignored); present locally for StarWarsMap / hyperspace graph integration.
- **sw5e-nav-computer/data/starwarsmap/planet-name-aliases.json**: Not tracked in git on this branch (untracked/ignored); present locally for StarWarsMap / hyperspace graph integration.
- **README.md**: Tracked; differs from `5e1b967` in the working tree: 1 file changed, 21 insertions(+), 7 deletions(-).
- **docs/hyperspace-coordinate-transform.md**: Not tracked in git on this branch (untracked/ignored); present locally for StarWarsMap / hyperspace graph integration.

## 2. List every route-name normalization rule currently applied in the build pipeline.

- StarWarsMap route labels (`hyperlanes_db.json` keys; also `properties.hyperspace` when checked against the authoritative set): `str(name).strip()` then apply `STARWARSMAP_ROUTE_NAME_FIXES` in `scripts/build-hyperspace-graph.py` (`Corellinan Run` -> `Corellian Run`, `Way Of Schesa` -> `Way of Schesa`, `Path Of The Houses` -> `Path of the Houses`).
- StarWarsMap chain worlds: `str(w).strip()`; consecutive duplicates are removed.
- GeoJSON-derived edges store `properties.hyperspace` / vertex labels without running `normalize_starwarsmap_route_name` on the persisted edge name (that normalization is only used for membership checks against StarWarsMap keys).
- Planet grid keys use `normalize_grid_key` (uppercase, strip spaces, canonical `AA-12` form) for lon/lat anchoring; not a hyperspace lane label rule but part of the same build.
- `route-tier-overrides.json` keys and `hyperspace-routes.hand.json` names are used as authored (no automatic spelling pass).

## 3. List every explicit planet alias currently applied and explain why.

- **`Kailor V` -> `Kailor`**: StarWarsMap labels this world `Kailor V` while `planets.json` uses `Kailor`. JSON comment: Map StarWarsMap hyperlane world labels to names in planets.json when they differ.

## 4. Confirm whether authoritative=True only replaces edges with the exact same (from, to, name) key...

`authoritative=True` does **not** use a literal `(from, to, name)` key. `add_edge` uses `key = tuple(sorted([a, b]) + [route_name])`, so the identity is the unordered planet pair plus the exact route name string; directional `from`/`to` order in the stored record is whatever `add_edge(a,b,...)` passed in. Authoritative writes always assign `edges_map[key]`. Non-authoritative writes keep an existing edge if its `travelTimeBase` is already <= the candidate.

## 5. Generate a report of all StarWarsMap route names imported that do NOT already exist by exact name in our prior hyperspace-routes.json (git 5e1b967).

Count: **56**

```
Ado Spine
Ansion Spur
Bothan Run
Byss Run
Celanon Spur
Cerean Reach
Commenor Run
Corellinan Run
D'aelgoth Trade Route
Duros Space Run
Elgit-M'Hanna Corridor
Enarc Run
Entralla Route
Fedalle Run
Great Gran Run
Great Kashyyyk Branch
Guu Run
Hapan Spine
Harrin Trade Corridor
Kegan Run
Kessel Run
Koda Spur
Lesser Lantillian Route
Lipsec Run
Listehol Run
Llanic Spice Run
Lorell Route
Namadii Corridor
Nanth'ri Route
Nothoiin Corridor
Ootmian Pabol
Overic Griplink
Pabol Hutta
Pabol Sleheyron
Path Of The Houses
Quellor Run
Randon Run
Reena Trade Route
Rynmar Trail
Salin Corridor
Sanrafsix Corridor
Shag Pabol
Shaltin Tunnels
Shipwrights' Trace
Shiritoku Way
Shwuy Exchange
Spar Trade Route
Terr'Skiar Pass
Trax Tube
Trellen Trade Route
Trellent Trade Route
Triellus Trade Route
Triellus Trade Run
Varl Run
Veragi Trade Route
Way Of Schesa
```

## 6. Generate a report of all local curated route names that still do not exist in StarWarsMap data.

Count: **8**

```
Carbonite Run
Chasdemonus Route
Corellian Run
Daragon Trail
Death Wind Corridor
Koros Trunk Line
Path of the Houses
Way of Schesa
```

## 7. Run a diagnostic for Coruscant -> Exegol and report: curated path exists, path worlds, named lane list, region arc, curated hop count, synthetic hop count, whether regionalAdvancedRouteFallback is still being triggered.

- **Curated path exists (lane graph under Advanced defaults):** True
- **Path worlds:** Coruscant -> Brentaal IV -> Chandrila -> Commenor -> Corellia -> Ord Mantell -> Korvaii -> Ithor -> Noonar -> Cademimu -> Agamar -> Shaum Hii -> Vinsoth -> Salin -> Ciutric -> Corvis Minor -> Argazda -> Bimmiel -> Birgis -> Seline -> Sernpidal -> Veragi -> Trassitan -> Dubrillion -> Ahakista -> Dantooine -> Schesa -> Noris -> Ornfra -> Naporar -> Sposia -> Csilla -> Ahch-To -> Exegol
- **Named lane list (per hop, direction of travel):** Perlemian Trade Route, Perlemian Trade Route, Perlemian Trade Route, Corellian Trade Spine, Corellian Run, Celanon Spur, Celanon Spur, Celanon Spur, Celanon Spur, Celanon Spur, Celanon Spur, Celanon Spur, Veragi Trade Route, Veragi Trade Route, Veragi Trade Route, Veragi Trade Route, Veragi Trade Route, Veragi Trade Route, Veragi Trade Route, Veragi Trade Route, Veragi Trade Route, Veragi Trade Route, Veragi Trade Route, Veragi Trade Route, Veragi Trade Route, Transit corridor (unmapped), Way of Schesa, Way of Schesa, Path of the Houses, Path of the Houses, Path of the Houses, Transit corridor (unmapped), Transit corridor (unmapped)
- **Region arc (dedupe consecutive, then first-seen order):** Core -> Colonies -> Mid Rim -> Outer Rim -> Unknown Regions
- **Curated hop count:** 30
- **Synthetic hop count:** 3
- **regionalAdvancedRouteFallback still triggered:** False

`regionalAdvancedRouteFallback` in `sw5e-nav-computer/scripts/route-calculator.js` runs when hyperspace JSON cannot be loaded for the graph build, or when `aStarShortestPath` returns no solution after `filterHyperspaceRoutesForSettings`. This script does not execute Foundry; it mirrors the tier/obscure filter and runs a nonnegative shortest-path search on the same undirected edge list. If a path exists here, Advanced mode would not hit the no-path fallback for this pair unless graph data or filtering diverges.

