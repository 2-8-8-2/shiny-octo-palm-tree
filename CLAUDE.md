# CLAUDE.md — DYNO//FORGE

## Project Overview

This repository contains two related projects:

1. **`App.jsx`** — A React single-file web app called **DYNO//FORGE**: an interactive V8 engine builder, dyno simulator, and compatibility checker.
2. **`chatbot.py`** — A minimal Python CLI chatbot powered by the Anthropic API.

---

## App.jsx — DYNO//FORGE

### What It Does

DYNO//FORGE lets users configure a V8 engine build from a catalog of real-world parts, see a 3D visualization of the engine update in real-time, simulate a dyno curve (HP and TQ vs RPM), check compatibility issues, save builds, and compare two builds side-by-side.

### Architecture

The app is a **single-file React component** with no build toolchain — it is designed to run in environments like Claude Artifacts, CodePen, or similar sandboxed renderers that provide React, Three.js, and Recharts as globals.

**Dependencies (expected as globals or via import):**
- `react` (useState, useRef, useEffect, useMemo)
- `three` (Three.js for 3D engine visualization)
- `recharts` (AreaChart for dyno curves)

**No bundler, no package.json, no test suite.**

### File Structure

Everything lives in `App.jsx`. The code is organized into clearly delimited sections:

| Section | Purpose |
|---|---|
| `ENGINE_FAMILIES` | Top-level config for each engine family (id, name, accent color, valvetrain type, fuel type, default build) |
| `CATALOG_LS / _COYOTE / _BBC / _HEMI / _SBC` | Per-family part catalogs — blocks, heads, cams, intakes, forced induction, fuel systems |
| `getCatalog(family)` | Returns the correct catalog object for a family string |
| `getStorageAdapter()` | Abstraction over `window.storage` (custom) or `window.localStorage` for saving builds |
| `sanitizeBuild(raw)` | Validates/normalizes a build object loaded from storage |
| `calculateCR(blockId, headId, catalog)` | Computes compression ratio from block + head data |
| `calculateIdealCFM(displacement, camChar)` | Estimates ideal carburetor CFM for carbureted engines |
| `checkCompatibility(build)` | Returns an array of `{severity, message}` issues for the current build |
| `simulateDyno(build)` | Returns `[{rpm, hp, tq}]` — the simulated dyno curve |
| `totalCost(build)` | Sums part costs for the build |
| `peakStats(dyno)` | Extracts peak HP/TQ and their RPM points from a dyno array |
| `Engine3D` | React component — renders a Three.js 3D engine model that updates when `build` changes |
| `EngineBuilder` (default export) | Root component — all state, layout, and UI logic |

### Supported Engine Families

| ID | Name | Valvetrain | Fuel | Accent Color |
|---|---|---|---|---|
| `ls` | GM LS | Pushrod OHV | EFI | Orange `#ff6600` |
| `coyote` | Ford Coyote | DOHC | EFI | Blue `#0066ff` |
| `bbc` | Chevy Big Block | Pushrod OHV | Carbureted | Red `#cc2200` |
| `hemi` | Dodge Hemi Gen III | Pushrod OHV | EFI | Purple `#9900cc` |
| `sbc` | Chevy Small Block | Pushrod OHV | Carbureted | Gold `#cc8800` |

### Part Catalog Schema

Each part category uses consistent object shapes:

**Block:** `{ id, name, displacement, bore, stroke, compression, maxBoost, cost, notes }`

**Heads:** `{ id, name, flow, chamber, compression, springRate, cost, portStyle, notes }`

**Cam:** `{ id, name, dur, lift, lsa, springReq, cost, character, notes }`
- `character`: `'docile' | 'mild' | 'aggressive' | 'race'`
- `springReq`: `'stock' | 'mild' | 'aggressive' | 'race'`

**Intake:** `{ id, name, flowMatch, powerCurve, cost, notes }`
- `flowMatch`: must match head's `portStyle` (or be `'any'`) for compatibility
- `powerCurve`: `'low' | 'mid' | 'broad' | 'high' | 'race'`

**Forced Induction:** `{ id, name, type, boost, efficiency, cost, notes }`
- `type`: `'none' | 'turbo' | 'centri' | 'roots' | 'nitrous'`

**Fuel (EFI families):** `{ id, name, flowRate, e85, cost, notes }`

**Fuel (carbureted families — BBC/SBC):** `{ id, name, flowRate, e85, cost, notes }`
- `flowRate` is CFM for carb families (not lb/hr)

### Compatibility Checker Rules

`checkCompatibility(build)` runs these checks in order:

1. **Port matching** — intake `flowMatch` must equal head `portStyle` (or be `'any'`)
2. **SBC Vortec** — Vortec heads require Vortec-pattern intake
3. **Valve spring upgrade** — cam's `springReq` must not exceed head's `springRate`
4. **Coyote high CR + boost** — CR > 10.8 with > 8 psi warns about detonation
5. **Hemi boost + CR** — warns above 5 psi / errors above 15 psi with high CR
6. **Hemi MDS cam** — stock MDS cam limiting performance intake benefit
7. **Carb sizing (BBC/SBC)** — carburetor CFM vs. ideal CFM from `calculateIdealCFM()`
8. **Block boost ceiling** — `fi.boost` must not exceed `block.maxBoost`
9. **Tight LSA for boost** — LSA < 113° on forced induction warns
10. **Nitrous on cast pistons** — 100+ shot warns about forged pistons

Severity levels: `'error'` (red) | `'warn'` (amber) | `'info'` (blue)

### Dyno Simulator

`simulateDyno(build)` produces a realistic HP/TQ curve:

- RPM sweep varies by family: Coyote goes to 8000, Gen I (BBC/SBC) to 7000, others to 7500
- Peak RPM is averaged between `intakePeaks[intake.powerCurve]` and `camPeaks[cam.character]`
- Volumetric efficiency (VE) curve centered on peak RPM with Gaussian-ish falloff
- Boost multiplier accounts for turbo spool lag, centrifugal linearity, and nitrous step-in
- Coyote gets a VCT bonus on docile/mild cams
- Carb families apply a `carbFactor` based on CFM vs. ideal
- Fuel ceiling caps HP to prevent physically impossible numbers
- HP→TQ conversion: `tq = (hp * 5252) / rpm`

### 3D Engine Viewer (`Engine3D`)

- Uses Two `useEffect` hooks: one for scene/renderer/controls setup (runs once), one for geometry rebuild when `build` changes
- Mouse drag rotates the view; scroll zooms; auto-rotates after 1.5 s of inactivity
- The `frameId` variable ensures the `requestAnimationFrame` loop is cancelled on unmount
- Geometry is fully rebuilt on `build` change — all children removed and re-added with `.dispose()` on old geometries/materials
- Engine accent color (`ENGINE_FAMILIES[family].accent`) is applied to valve covers / cam covers

### Storage

`getStorageAdapter()` returns a unified async interface:
- Prefers `window.storage` (provided by some hosting environments like Claude Artifacts)
- Falls back to `window.localStorage`
- Keys are prefixed `build:` (e.g., `build:1715000000000`)
- Values are JSON-stringified build objects

### State (in `EngineBuilder`)

| State | Type | Purpose |
|---|---|---|
| `family` | string | Active engine family id |
| `build` | object | Current build (all part selections) |
| `savedBuilds` | array | Builds loaded/saved from storage |
| `compareWith` | object \| null | A saved build to overlay on the dyno chart |
| `activeTab` | string | Which part category tab is shown in the left panel |

All expensive derivations (`dyno`, `peak`, `cost`, `issues`, `compareDyno`, `comparePeak`, `chartData`) are computed with `useMemo`.

### Styling

All styles are inline JavaScript objects defined in the `styles` object. The design language is:
- Dark background (`#0a0a0c`)
- Monospace font (`JetBrains Mono` → `SF Mono` → `Roboto Mono`)
- Per-family accent color applied to borders, glows, active states
- `Rajdhani` display font loaded from Google Fonts for the logo and family name

Do not introduce external CSS files or CSS-in-JS libraries — keep everything as inline styles consistent with the existing pattern.

### Adding a New Engine Family

1. Add an entry to `ENGINE_FAMILIES` with `id`, `name`, `label`, `subtitle`, `accent`, `valvetrain`, `fuelType`, `defaultBuild`.
2. Create a `CATALOG_<NAME>` constant with all 6 part categories following the schema above.
3. Add a branch in `getCatalog()` to return the new catalog.
4. Add 3D geometry handling in `Engine3D` for the new family (check `build.family`).
5. Update `simulateDyno` constants (`baseMult`, `flowBaseline`, `liftBaseline`, RPM range) for the new family's characteristics.

### Adding Parts to an Existing Family

Add an object to the relevant array in the catalog constant (e.g., `CATALOG_LS.block`). Ensure:
- `id` is unique within the category
- All required fields for that category schema are present
- `portStyle` on heads matches valid `flowMatch` values used by intakes

---

## chatbot.py — CLI Chatbot

### What It Does

A minimal terminal chatbot that maintains a multi-turn conversation with Claude.

### Usage

```bash
# Install dependency
pip install anthropic

# Set API key
export ANTHROPIC_API_KEY=sk-ant-...

# Run
python chatbot.py
```

### Key Details

- **Model:** `claude-opus-4-7` — update this string to switch models
- **API key:** Read from the `ANTHROPIC_API_KEY` environment variable (never hardcode)
- **Conversation:** Maintained as a list of `{"role": "user"/"assistant", "content": str}` dicts appended after each turn
- **Exit:** Type `quit` or `exit`, or send EOF (Ctrl+D) / KeyboardInterrupt (Ctrl+C)
- **Max tokens:** 1024 per response — increase for longer replies

---

## Development Workflow

### Git Branches

- `main` — stable, merged work
- Feature branches follow the pattern: `claude/<description>-<short-hash>`

### Commit Style

Commits are imperative, present-tense, descriptive. Examples from this repo:
- `Add Dodge Hemi (Gen III 5.7/6.1/6.4/6.2SC) engine family`
- `Fix 4 bugs: syntax error, rAF leak, carb CFM check, card positioning`
- `Visual upgrade: glow effects, AreaChart dyno, LS 3D heads, spec bars`

### No Build Step

`App.jsx` has no build toolchain. Validate changes by:
1. Checking for JavaScript syntax errors
2. Verifying the app renders correctly in the target environment (Claude Artifacts, CodePen, etc.)
3. Testing each engine family switches correctly
4. Confirming 3D viewer renders without console errors
5. Saving and loading a build to verify storage adapter works

### Python

```bash
pip install -r requirements.txt
python chatbot.py
```

---

## Common Pitfalls

- **Carb vs. EFI fuel schema:** BBC and SBC use CFM as `flowRate`; LS/Coyote/Hemi use lb/hr. The `simulateDyno` and `checkCompatibility` functions branch on `isGenI` to handle this correctly.
- **Three.js cleanup:** Always `dispose()` geometries and materials in the `Engine3D` rebuild effect and always cancel the `requestAnimationFrame` loop in the cleanup function to avoid memory/RAF leaks.
- **Intake/head compatibility:** `flowMatch` on intake must match `portStyle` on heads exactly (or be `'any'`). Mismatches produce `error`-severity issues.
- **`useMemo` dependencies:** `issues` depends on `peak.hp` (via `_estPower`); make sure derived state is included in dependency arrays.
- **`sanitizeBuild`:** Always run loaded storage data through `sanitizeBuild()` before setting state — it fills missing fields from `defaultBuild` to prevent crashes on old saved data.
