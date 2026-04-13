# StarWarsMap audit summary (Phase 1)

**StarWarsMap root:** `C:\Users\ckauble\OneDrive - Riverside Bank of Dublin\Documents\GitHub\NaviComputer\StarWarsMap`

## Source files

| File | Role |
|------|------|
| `map_api/data/hyperlanes_db.json` | Route name → ordered list of planet names along that lane (implicit path). |
| `map_api/data/grid_db.json` | Grid cell id → list of planets with `name`, map `coords`, `is_canon`. |
| `map_api/data/regions_db.json` | Region → sector → planet entries with `coords`. |

## Schema (inspected)

### hyperlanes_db

```json
{
  "topLevelType": "dict",
  "interpretation": "Object mapping route name (string) -> ordered list of planet name strings; each list is an implicit path along that lane (consecutive pairs would be hops). No per-hop metadata (tier, travel time, region) at this level. Directionality is implicit: lists are ordered; bidirectional travel is not stated in file.",
  "routeCount": 60,
  "valueShapes": [],
  "notes": [],
  "sampleKeys": [
    "Rimma Trade Route",
    "Corellinan Run",
    "Corellian Trade Spine",
    "Hydian Way",
    "Perlemian Trade Route"
  ],
  "maxChainLength": 86
}
```

### grid_db

```json
{
  "topLevelType": "dict",
  "interpretation": "Object mapping grid cell id (e.g. 'K-9') -> list of planet records. Each record typically has name, coords ([x,y] floats in map space), is_canon. This is not the same keying as hyperlanes_db (planet names vs grid cells).",
  "topLevelKeyCount": 240,
  "sampleKeys": [
    "K-9",
    "M-8",
    "P-8",
    "C-16",
    "S-9",
    "K-10",
    "K-11",
    "K-12"
  ],
  "entryFieldKeys": [
    "coords",
    "is_canon",
    "name"
  ],
  "notes": []
}
```

### regions_db

```json
{
  "topLevelType": "dict",
  "interpretation": "Object mapping region name -> object mapping sector name -> list of planet records (name, coords, is_canon). Independent hierarchy from hyperlanes_db.",
  "regionCount": 10,
  "sampleRegions": [
    "Core",
    "Inner Rim",
    "Mid Rim",
    "Unknown Regions",
    "Deep Core"
  ],
  "sectorEntryFields": [
    "coords",
    "is_canon",
    "name"
  ],
  "notes": []
}
```

## Counts (exact string matching for cross-file comparisons)

| Metric | Value |
|--------|-------|
| starwarsmapPlanetsReferenced | 707 |
| starwarsmapUniqueLaneNames | 60 |
| localPlanets | 2028 |
| localRouteSegments | 2094 |
| missingPlanetExactMatches | 1 |
| missingLaneNameExactMatches | 3 |
| localPlanetsWithoutCoords | 3 |
| sourcePlanetsWithoutCoords | 0 |

## What appears safe to import (topology-only mindset)

- **Ordered lane chains** from `hyperlanes_db.json`: route label + sequence of world names is explicit and stable input for consecutive-hop topology.
- **No runtime coupling**: files are plain JSON suitable for build-time consumption only.

## What appears unsafe or ambiguous

- **Planet name drift**: hyperlanes reference names that may not match `planets.json` exactly (see `missingPlanetExactMatches`).
- **Lane name drift**: StarWarsMap route keys may not match `hyperspace-routes.json` `name` field exactly (see `missingLaneNameExactMatches`).
- **Coordinate systems**: `grid_db` / `regions_db` use map `coords`; local module uses `coordinates` / `grid` in `planets.json` — different spaces; not merged in this audit.
- **Directionality**: hyperlanes are ordered lists; bidirectional edges are not stated in the file (module graph typically duplicates both directions at build time).

## Likely Phase 2 reconciliation issues

- Name normalization / alias tables (explicitly out of scope for Phase 1).
- Merging or choosing authority when GeoJSON and StarWarsMap disagree on the same route label.
- Mapping StarWarsMap `coords` to travel times or tiers (explicitly out of scope for Phase 1).

## Suitability as topology authority for named lanes

StarWarsMap `hyperlanes_db.json` is **well-suited as a topology authority for named lanes** in the sense that it encodes **which worlds lie on which named route in order**. 
Operational use still requires reconciliation to local planet names and a build-time policy for lane metadata (times, tiers), which this phase does not perform.

## Notes

- All five JSON files parsed; hyperlanes_db/grid_db/regions_db match expected top-level types.