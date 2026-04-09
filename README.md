# NaviComputer

Repository for **SW5e Nav Computer**, a [Foundry Virtual Tabletop](https://foundryvtt.com/) module that helps **Star Wars 5e (SW5e)** games plan hyperspace travel: route estimates, travel time, consumables, and optional piloting checks.

The installable module lives in [`sw5e-nav-computer/`](sw5e-nav-computer/).

---

## What this module is for

- **Hyperspace planning at the table** — Pick an origin and destination from curated planet data, then get travel time and rough resource needs (fuel, food, supplies) without leaving Foundry.
- **Two calculation modes**
  - **Basic** — Region-to-region travel times from a matrix (broad galactic averages, not individual hyperlanes).
  - **Advanced** — Shortest path on a **small curated hyperlane graph** (prototype). Many planet pairs are **not** on the graph; the UI explains that and can **fall back** to Basic with a clear notice.
- **Starship-aware estimates** — Optional ship selection feeds crew size (for provisions) and hyperdrive class (Advanced time multiplier) when the actor data matches SW5e conventions.
- **Piloting checks** — Roll the pilot’s skill (default `pil`, with configurable fallback) as a **private GM roll** so the table does not see the full result in chat.

It does **not** replace the GM’s judgment, move tokens, or enforce strict SW5e rules for every edge case. It is a navigation aid and consistency helper.

---

## Requirements

| Component | Notes |
|-----------|--------|
| **Foundry VTT** | Version **13** (see `module.json` for verified range). |
| **System** | **dnd5e** **5.2.5** (as declared in the manifest). |
| **SW5e** | Strongly recommended: **`sw5e-module`** or **`sw5e`** companion content for skills, starship data, and rolls to align with your campaign. |

---

## Installation

1. Copy or symlink the `sw5e-nav-computer` folder into your Foundry user `Data/modules/` directory, **or** install from a manifest URL if you publish releases.
2. In Foundry: **Add-on Modules** → enable **SW5e Nav Computer**.
3. Launch a world that uses **dnd5e** (ideally with SW5e active).

---

## How to use it

### Opening the Nav Computer

- **Gamemasters** — Use the **scene controls** (token tools): click the **route** icon labeled for opening the Nav Computer. The app window opens and can be moved and resized like other Foundry applications.

### Calculating a route

1. **Origin** and **Destination** — Type or pick worlds from the curated list (loaded from module data).
2. **Pilot** — Choose an actor (character or NPC) for piloting rolls. Required only if you plan to roll.
3. **Ship (optional)** — Select a starship-type actor if you want crew-based food estimates and (in Advanced mode) hyperdrive-based travel time scaling.
4. Click **Calculate Route**.

Read the **Results** panel for travel hours, regions, route summary, suggested piloting DC, and warnings. In **Advanced** mode, when a curated path exists, you will also see the **world-by-world path**, **lane names per hop**, and the **hyperdrive multiplier** used.

### Advanced mode and coverage

- Advanced mode uses `data/hyperspace-routes.json` — a **limited** set of major lanes and worlds.
- If no graph path exists between the two worlds, the module **does not error out**; it shows a **fallback banner** and uses **Basic** regional estimates instead, with text in **Warnings** as well.

### Piloting check

1. Calculate a route first.
2. Select a **Pilot**.
3. Click **Roll Piloting Check**.

The roll is sent using the system’s skill roll, in **private GM** mode by default. The Nav Computer window is kept in front after the roll where possible.

### Module settings

Configure under **Configure Settings → Module Settings → SW5e Nav Computer**:

| Setting | Purpose |
|---------|--------|
| **Calculation Mode** | **Basic** or **Advanced** (see above). |
| **Fuel Per Hour** / **Food Per Crew Per Day** | Scale resource estimates from travel duration and crew. |
| **Piloting fallback skill** | Skill id used if `pil` / `piloting` are missing on the pilot (default `acr`). |
| **Enable Random Events** / **Random Event Chance** | Reserved for future travel events (hooks exist in settings). |
| **Debug Logging** | Extra client-side logging for troubleshooting. |

World scope vs client scope follows each setting’s definition in Foundry.

---

## Project layout (high level)

| Path | Role |
|------|------|
| `sw5e-nav-computer/module.json` | Foundry manifest |
| `sw5e-nav-computer/data/planets.json` | Curated planet list |
| `sw5e-nav-computer/data/hyperspace-routes.json` | Curated hyperlane segments (Advanced mode) |
| `sw5e-nav-computer/scripts/` | Application logic, routing, rolls, settings |
| `sw5e-nav-computer/templates/` | Handlebars UI |
| `sw5e-nav-computer/lang/en.json` | English strings |

---

## License and credits

See the module folder for any license file the author adds. Author: **Caleb Kauble** (per `module.json`).

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
