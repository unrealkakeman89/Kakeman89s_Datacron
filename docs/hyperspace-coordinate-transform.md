# Hyperspace GeoJSON → module graph

The file `hyperspace_singlepart_new.json` at the repository root is a GeoJSON `FeatureCollection` in **CRS84** (longitude, latitude). Planet positions in `sw5e-nav-computer/data/planets.json` use a separate **grid-style** `coordinates` / `grid` space, so they must be reconciled before line geometry can be snapped to worlds.

## StarWarsMap (authoritative named lanes)

Vendored [`sw5e-nav-computer/data/starwarsmap/hyperlanes_db.json`](../sw5e-nav-computer/data/starwarsmap/hyperlanes_db.json) comes from **[Wason1797/StarWarsMap](https://github.com/Wason1797/StarWarsMap)** (`map_api/data/hyperlanes_db.json`). The build script treats it as the **canonical source** for those route names:

1. **GeoJSON snapping is skipped** for any feature whose `properties.hyperspace` matches a route key in that file (after normalizing a few spellings, e.g. “Corellinan Run” → “Corellian Run”). This avoids **chord shortcuts** that skip worlds along a run.
2. **Consecutive worlds** in each ordered list become **authoritative** edges (same `from` / `to` / `name` key overwrites GeoJSON-derived weights). Travel hours scale with planet-plane distance (`STARWARSMAP_HOURS_PER_GRID_UNIT` in the script), clamped like other edges.

Optional [`planet-name-aliases.json`](../sw5e-nav-computer/data/starwarsmap/planet-name-aliases.json) maps StarWarsMap labels to `planets.json` names when they differ.

Synthetic **transit corridors**, **regional connectors** (`essentialConnectivity`), and Foundry **Advanced regional fallback** are unchanged.

## Current approach (build script)

[`scripts/build-hyperspace-graph.py`](../scripts/build-hyperspace-graph.py) maps each planet into the GeoJSON bounding box: grid letters/digits become synthetic `(gx, gy)`, combined with `coordinates.x` / `coordinates.y`, then scaled into the line data’s lon/lat extent. Control points and `grid-to-geo.json` refine alignment; StarWarsMap chains define **which** major lanes exist as sequential hops.

## Optional affine calibration

[`sw5e-nav-computer/data/hyperspace-control-points.json`](../sw5e-nav-computer/data/hyperspace-control-points.json) can list `controlPoints`: each entry maps a **planet name** to `{ "lon", "lat" }` on the source map. When at least three non-collinear points are present, the builder fits a 2D affine transform from planet plane `(x, y)` to `(lon, lat)` and uses it instead of bbox scaling.

Bootstrap a first pass (nearest GeoJSON vertex to the bbox seed for several spread-out worlds):

`python scripts/build-hyperspace-graph.py --suggest-control-points`

Copy or merge the printed `controlPoints` into `hyperspace-control-points.json`, then refine lon/lat from an authoritative map when you can.

## Visual reference (raster map)

The repository includes **[`Galactic Map.jpg`](../Galactic%20Map.jpg)** at the repo root as the **canonical layout** when hand-editing [`hyperspace-control-points.json`](../sw5e-nav-computer/data/hyperspace-control-points.json) or [`grid-to-geo.json`](../sw5e-nav-computer/data/grid-to-geo.json). Use it to decide where worlds should sit relative to hyperlanes before you commit lon/lat values.

The JPEG is **not** georeferenced by default: it has no embedded CRS84. GeoJSON vertices **are** lon/lat. If the lines were traced from this artwork, bootstrap control points plus affine are often close enough, then you **nudge** entries until overlays match in a GIS. If the artwork and GeoJSON come from different sources, georeference the raster (see below) or pick control points from a single consistent source.

## Optional QGIS workflow (georeference → lon/lat)

1. Open QGIS, add **`hyperspace_singlepart_new.json`** as a vector layer (CRS **EPSG:4326**).
2. Use **Layer → Georeferencer** on [`Galactic Map.jpg`](../Galactic%20Map.jpg): add **ground control points** (pixel on the image → known lon/lat from the GeoJSON layer or from reference labels).
3. Choose an appropriate transform (affine or polynomial for a flat map), run **Start georeferencing**, save a **geoTIFF** or use the georeferenced layer as a backdrop.
4. Digitize planet locations (point layer) or read coordinates from the status bar, then transcribe into `hyperspace-control-points.json` or `grid-to-geo.json`.

Exporting a CSV from QGIS and a small script to merge into JSON is optional; the build pipeline does not read raster files directly.

## Optional grid cell → geo

[`sw5e-nav-computer/data/grid-to-geo.json`](../sw5e-nav-computer/data/grid-to-geo.json) may define `cells`: object keys are grid ids such as `K-12`, values are `{ "lon", "lat" }` in CRS84. If a planet’s `grid` normalizes to a key present in `cells`, that lon/lat **overrides** the bbox/affine position for that world only (other worlds still use the global transform).

## Outputs and overrides

- **Tier hints** — [`route-tier-overrides.json`](../sw5e-nav-computer/data/route-tier-overrides.json) matches GeoJSON `properties.hyperspace` names; other features use `zoom_level` as a tier proxy.
- **Hand edges** — [`hyperspace-routes.hand.json`](../sw5e-nav-computer/data/hyperspace-routes.hand.json) is merged into the generated [`hyperspace-routes.json`](../sw5e-nav-computer/data/hyperspace-routes.json) to fill gaps.
- **Connectivity** — After GeoJSON and hand data, the builder adds **transit corridors** between off-graph worlds and any remaining components, tagged `essentialConnectivity` / `syntheticHop` so Foundry’s Advanced pathfinder stays connected (see module README).
- **Validation** — `python scripts/validate-hyperspace-routes.py` checks that every `from` / `to` exists in `planets.json`, lists worlds without parseable coordinates, and verifies one undirected component.

## Attribution

- **StarWarsMap** — `hyperlanes_db.json` is from [Wason1797/StarWarsMap](https://github.com/Wason1797/StarWarsMap); comply with that repository’s license when redistributing.
- Credit the original map or extract source you used for `hyperspace_singlepart_new.json` in your distribution README if license terms require it.
