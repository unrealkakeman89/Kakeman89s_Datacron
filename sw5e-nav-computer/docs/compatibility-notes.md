# Phase 0 Compatibility Notes

This document records the Phase 0 discovery pass for the intended SW5E beta on DND5E 5.2.5 stack. It intentionally separates:

- confirmed local evidence from the installed Foundry data directory and installed SW5E module source
- live runtime values that still require an in-browser Foundry console or macro execution

## Intended Targets

| Target | Intended Value |
| --- | --- |
| Foundry VTT | `13` |
| DND5E | `5.2.5` |
| SW5E beta | SW5E beta module compatible with `dnd5e 5.2.5` |

## Confirmed Local Environment Evidence

| Field | Value | Status |
| --- | --- | --- |
| Installed Foundry core | `13.351` | Confirmed from local debug log and world metadata |
| Installed world | `vanilla` | Confirmed from local Foundry config |
| Installed world system id | `dnd5e` | Confirmed from `world.json` |
| Installed world system version | `5.2.5` | Confirmed from `world.json` |
| Installed DND5E system id | `dnd5e` | Confirmed from local `system.json` |
| Installed DND5E system version | `5.2.5` | Confirmed from local `system.json` |
| Installed SW5E module id | `sw5e-module` | Confirmed from local `module.json` |
| Installed SW5E module compatibility | `dnd5e >= 5.0.0`, verified `5.2.5` | Confirmed from local `module.json` |
| Installed SW5E module revision | `1.2.9-9-g9a54d53f4` | Confirmed from local git checkout |
| Installed SW5E module manifest version | `#{VERSION}#` | Local checkout is an unrendered source checkout, not a packaged release |

## Requested Runtime Values

These are the exact runtime fields requested for Phase 0.

| Runtime field | Current finding |
| --- | --- |
| `game.version` | Not captured from a live browser session yet. Local install evidence indicates `13.351`. |
| `game.system.id` | Not captured live yet. Local world and system metadata indicate `dnd5e`. |
| `game.system.version` | Not captured live yet. Local world and system metadata indicate `5.2.5`. |
| `game.modules.get("sw5e")?.active` | Likely `undefined` on this machine because the installed module id is `sw5e-module`, not `sw5e`. Confirm live with the helper. |
| `game.modules.get("sw5e")?.version` | Likely `undefined` for the same reason. Confirm live with the helper. |

Recommended additional live checks during Phase 0:

- `game.modules.get("sw5e-module")?.active`
- `game.modules.get("sw5e-module")?.version`

## Actor Types

### DND5E 5.2.5 actor document types

Installed `dnd5e` declares these actor document types:

- `character`
- `encounter`
- `group`
- `npc`
- `vehicle`

### SW5E-specific actor behavior discovered from the installed module

Legacy SW5E data and migration code still reference these actor concepts:

- `character`
- `npc`
- `starship`
- `vehicle`
- `group`

Important current-module behavior:

- Legacy `starship` actors are normalized into `character` actors with `flags.sw5e.starshipCharacter.enabled === true`.
- Some compatibility code still recognizes legacy starship state via `flags.sw5e.legacyStarshipActor.type === "starship"`.
- A vehicle-sheet compatibility patch still checks `actor.type === "vehicle"` together with `flags.sw5e.legacyStarshipActor.type === "starship"`.

### Live `game.actors` counts

Live counts from the currently running world were not captured directly from the browser runtime during this pass. Use the temporary Phase 0 inspector to record:

- actor type counts
- whether `character`, `vehicle`, and any custom/legacy `starship` records are present
- sample skill keys on likely pilot actors

## Pilot Actor Selection Strategy

Confirmed from installed SW5E module logic:

- deployable crew actors are limited to `character` and `npc`
- starship actors are explicitly excluded from crew selection

Recommended selector logic:

1. Include actors where `actor.type` is `character` or `npc`.
2. Exclude actors where `flags.sw5e.starshipCharacter.enabled === true`.
3. Prefer actors that have a numeric `system.skills.pil.value`.
4. If needed, sort candidates by highest `system.skills.pil.value`, then name.

## Ship Actor Selection Strategy

Recommended selector logic, in order:

1. Prefer normalized SW5E starship actors where `actor.type === "character"` and `flags.sw5e.starshipCharacter.enabled === true`.
2. Accept legacy actors where `actor.type === "starship"` if they still exist pre-normalization.
3. Allow compatibility fallback for records where `actor.type === "vehicle"` and `flags.sw5e.legacyStarshipActor.type === "starship"`.

This ordering matches the installed module's current migration and compatibility behavior better than a plain `vehicle` filter.

## Piloting Skill

Confirmed local findings:

- SW5E patches `CONFIG.DND5E.skills.pil`
- the piloting skill key used by current module code is `pil`
- pilot skill reads use `actor.system.skills.pil.value`

Recommended resolution logic:

1. Primary: `actor.system.skills.pil`
2. Fallback: `actor.system.skills.tec`
3. If neither exists, fail gracefully and warn with the module prefix

Rationale:

- `pil` is explicitly added by the SW5E module
- `tec` is also added by SW5E, shares the same default ability (`int`), and is the least-bad fallback if a migrated or partial actor is missing `pil`

## Hyperdrive Class Resolution

Confirmed local findings from installed SW5E module code:

- equipped hyperdrive item data can store class at `item.system.attributes.hdclass.value`
- normalized actor data stores hyperdrive class at `actor.system.attributes.equip.hyperdrive.class`
- legacy travel data may store it at `actor.system.attributes.travel.hyperdriveClass`
- the installed module also has a final text-parsing fallback that extracts `Class N` from hyperdrive item name/description

Recommended resolution order:

1. `actor.system.attributes.equip.hyperdrive.class`
2. equipped hyperdrive item `item.system.attributes.hdclass.value`
3. legacy `actor.system.attributes.travel.hyperdriveClass`
4. last-resort text parse from equipped hyperdrive item text

## Crew Size Resolution

Two different crew-related values matter:

- assigned crew roster
- minimum required crew

Confirmed local findings:

- assigned pilot lives at `actor.system.attributes.deployment.pilot.value`
- assigned crew list lives at `actor.system.attributes.deployment.crew.items`
- minimum required crew is stored at `actor.system.attributes.equip.size.crewMinWorkforce`
- the source classification item can also supply `starshipsize.system.crewMinWorkforce`

Recommended resolution logic:

- assigned crew count: `Array.isArray(actor.system.attributes.deployment.crew.items) ? actor.system.attributes.deployment.crew.items.length : 0`
- assigned pilot: `actor.system.attributes.deployment.pilot.value`
- minimum required crew: `actor.system.attributes.equip.size.crewMinWorkforce`
- classification fallback: starship size item `system.crewMinWorkforce`

## SW5E Differences From Assumed Stock DND5E Patterns

- The active SW5E integration on this machine is `sw5e-module`, not `sw5e`.
- SW5E patches `CONFIG.DND5E.skills` to add `lor`, `pil`, and `tec`.
- SW5E adds a separate `CONFIG.DND5E.starshipSkills` namespace for starship-only skills such as `ast`, `man`, and `scn`.
- SW5E normalizes legacy starship actors into `character` actors with a starship flag instead of relying only on native `vehicle` actors.
- SW5E uses custom starship skill rolling logic via `rollStarshipSkill(...)`; this is a distinct path from stock creature skill rolling.
- SW5E raises creature skill/ability proficiency caps to `5` and allows fractional non-weapon proficiencies.
- The local SW5E checkout is source-based and still contains a manifest version placeholder, so live module version checks may not look like a packaged release.

## Unresolved Assumptions

These still need live confirmation in the browser runtime:

- exact values for `game.version`, `game.system.id`, and `game.system.version`
- exact result of `game.modules.get("sw5e")`
- exact result of `game.modules.get("sw5e-module")`
- actual actor type counts in `game.actors`
- whether the currently loaded world contains any unmigrated legacy `starship` actors
- whether creature piloting checks in this exact runtime should use `actor.rollSkill({ skill: "pil" })` or an older positional signature

## Phase 0 Recommendation

Before Phase 1 production logic, run the temporary inspector from the repository root at `scripts/debug/phase0-runtime-inspector.js` inside the target Foundry world and paste the console output back into this document so the remaining runtime-only fields can be marked as confirmed.
