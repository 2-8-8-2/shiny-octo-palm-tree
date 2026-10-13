# PR #7 — first reliability repair

This pass improves the existing single-file prototype. It does not certify the horsepower model, the parts catalog, or retailer fitment, and PR #7 remains unsuitable for a production merge.

## Changes

- Normalize saved builds by engine family and valid part IDs. Recompute saved horsepower, torque, and cost instead of trusting stale stored summaries.
- Reject inconsistent V8 displacement/bore/stroke data with a compatibility error. The existing Coyote 363ci and 408ci entries remain visible for diagnosis, but cannot generate a power estimate or a block shopping link.
- Suppress estimated dyno output when compatibility checks report an error, and show unavailable values rather than zero horsepower.
- Replace the 427ci LSX search for an LSX454R with a bare-block search. Explain that a rotating assembly is still required.
- Label power, compression and parts costs as estimates. Remove the unsupported assertion that a build with no detected issues is valid.
- Explain that retailer searches are not verified product matches or prices. The links still have no affiliate tracking.
- Match comparison curves by RPM rather than array position.
- Stack the layout below 1100px, wrap the family buttons, enlarge shopping controls, and provide keyboard-accessible part selection.
- Observe viewer-size changes when responsive layout changes. Use the supported PCF shadow mode.

## Verification

Run from the repository root with Node.js 22 or newer:

```sh
node --test tests/logic.test.cjs
node tests/calibration-audit.cjs
```

The reliability suite has 10 tests. The calibration audit deliberately exits with status 1 while the PR's claimed stock-engine targets remain unmet. Passing the reliability tests is not evidence of accurate horsepower predictions.

Browser smoke checks use React, React DOM, Three.js, Recharts, esbuild and Playwright. Install those in an isolated QA directory, set NODE_PATH to that directory's node_modules, install Playwright Chromium, then run:

```sh
node tests/browser-smoke.cjs
```

Optional environment variables: CHROMIUM_EXECUTABLE_PATH for an existing Chromium binary and SMOKE_SCREENSHOT_DIR for screenshots.

The smoke suite exercises 1440px and 390px viewports, horizontal overflow, keyboard selection, all five engine-family switches, save/reload/load, and invalid-block warnings and shopping suppression. It does not validate retailer destinations, actual phone hardware, or accurate real-world parts specifications.

## Remaining merge blockers, in order

1. **Power calibration:** the stock-cam/stock-fuel LS3 catalog configuration produces 254 hp against the PR's ~430 claim; the default stock Coyote produces 289 hp against ~420. Establish specific OEM engine configurations and sourced torque/horsepower benchmarks; repair the fuel model and curve calibration together. Do not tune a multiplier just to pass two points.
2. **Parts verification:** verify manufacturer part numbers, specs, generation compatibility, unit quantities, and kit contents. Correct or remove the inconsistent Coyote configurations. Branded searches do not establish that a real matching product exists.
3. **Compression and fitment:** additive catalog compression offsets are approximations. Reliable calculation needs piston, chamber, gasket and deck data. Current checks are incomplete and cannot certify boost limits or safe engine combinations.
4. **Product setup:** the branch has no standalone build/deployment setup. Decide the intended host and establish a reproducible app build before release.
5. **Affiliate setup:** obtain approved program tracking details before expecting commissions. Verify retailer destinations and product mapping, then implement tracking and applicable disclosure.

No main-branch merge, deployment, retailer signup, or external review comment is part of this repair.
