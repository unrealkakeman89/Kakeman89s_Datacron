# Changelog

All notable changes to **SW5e Nav Computer** are documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-04-09

### Added

- **Foundry module** `sw5e-nav-computer` for **Foundry VTT 13** and **dnd5e 5.2.5**, with optional SW5e companion module support (`sw5e-module` / `sw5e`).
- **Nav Computer application** (`ApplicationV2` + Handlebars): resizable window with origin/destination planet comboboxes, pilot and optional ship selectors, **Calculate Route** and **Roll Piloting Check** actions.
- **Scene control** (GM-only) on the token controls to open the Nav Computer.
- **Curated planet dataset** (`data/planets.json`) for origin/destination selection and region metadata.
- **Basic mode** route calculation: region-to-region travel time matrix, regions crossed, narrative route summary, and piloting DC helper based on regions.
- **Advanced mode (prototype)**: curated hyperlane graph (`data/hyperspace-routes.json`), bidirectional edges from defined segments, **Dijkstra** shortest path with edge cost `travelTimeBase × hyperdrive multiplier`, path and per-hop lane names in the UI.
- **Advanced fallback**: when no curated path exists (or route data fails to load), automatic **Basic** estimate with a visible banner and warnings: *“No curated hyperspace lane route found. Falling back to region-based estimate.”*
- **Travel resources**: estimated fuel, food, and supplies from travel hours, module fuel/food settings, and **crew size** resolved from SW5e starship actor patterns when a ship is selected.
- **Hyperdrive multiplier** for Advanced mode from Phase 0–aligned resolution: `system.attributes.equip.hyperdrive.class`, equipped item `hdclass`, legacy `travel.hyperdriveClass`, then text parse for “Class N”; defaults to **1.0** with a console warning when a ship is present but class cannot be resolved.
- **Piloting skill roll** integration: prefers `pil`, then `piloting`, then configurable fallback skill; posts a **private GM** skill roll with custom flavor; attempts fast-forward / low-dialog roll shapes and refocuses the Nav window after rolling.
- **Actor helpers**: pilot list (character/npc excluding normalized starship shells), ship list (normalized starship, legacy starship vehicle, `starship` type).
- **Module settings**: calculation mode (Basic/Advanced), fuel per hour, food per crew per day, piloting fallback skill, debug logging; placeholders for random travel events (registered for future use).
- **English localization** (`lang/en.json`) for UI, warnings, travel DC modifiers, and settings labels.
- **Styling** (`styles/nav-computer.css`) for a readable, dark, Star Wars–inspired layout, including Advanced fallback and lane list presentation.
- **Documentation**: repository `README.md` with purpose, requirements, installation, usage, and settings overview.

### Changed

- **Module version** set to **1.0.0** for this release (manifest and changelog alignment).
