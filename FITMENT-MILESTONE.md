# Dyno Forge: compatibility first

## Product direction

Help an enthusiast plan an engine at home before spending money: identify conflicting parts, understand better candidates, and see the supporting components still needed. A saved plan should remain useful while the owner saves for the build.

The first engine path is Chevy big-block. An AI advisor is deferred until the catalog and rules can support grounded explanations. Power estimates support planning; they do not establish fitment.

## This milestone

- Added a fitment review with explicit conflicts, recorded individual checks, and unresolved details. No complete build is declared approved.
- Added a BBC engine profile for block generation, measured bore and intended use. Unknown is a valid starting point. Measurements are cleared when choosing another block, while saved profiles round-trip through storage.
- Added sourced AFR 265 oval-port and AFR 305 rectangle-port head families, with manufacturer minimum-bore screening. Exact chamber/spring assemblies remain unresolved.
- Retired the erroneous legacy AFR 305 oval entry. Existing saved selections are preserved and flagged, rather than silently converted into a different product. New users do not see the retired option.
- Corrected the Air-Gap catalog labels and searches to Edelbrock dual-plane 7561 oval / 7562 rectangle.
- Suppressed affected head/intake search links for detected bore, port and manufacturer road-use conflicts. Links for other components remain candidate searches, not a fitment-certified shopping cart.
- Added supporting-parts guidance and clickable manufacturer sources. BBC compression is withheld until piston and gasket specifications can support a calculation.

## Evidence boundaries

| Manufacturer reference | Fields used | Still unresolved |
| --- | --- | --- |
| [AFR 265 family](https://www.airflowresearch.com/265cc-bbc-oval-port-cylinder-head/p603) | Oval ports, 4.125-inch minimum bore, chamber variants, supporting-component guidance, published usage restriction | Exact assembly SKU, actual spring package, measured clearances and final installed cost |
| [AFR 305 family](https://www.airflowresearch.com/305cc-bbc-rectangle-port-cylinder-head/p573) | Rectangle ports, 4.250-inch minimum bore, chamber variants, published usage restriction | Same assembly-level details and measurements |
| [Edelbrock 2025 catalog](https://edelbrock-files-v1.s3-us-west-1.amazonaws.com/catalogs/2025-Edelbrock-Catalog.pdf) and [7562 product page](https://www.edelbrock.com/rpm-air-gap-2-r-intake-manifold-7562.html) | Manifold identification, port family, design and installation conditions | Vehicle hood clearance, complete carb/choke pairing, installation measurements |

Checked 2026-10-13. Catalog family data is not verification of the user's engine or a specific retailer listing. The default BBC head selection is now a generic cast-iron candidate, not a recommendation to buy it.

## Validation

```sh
node --test tests/logic.test.cjs
node tests/browser-smoke.cjs
node tests/calibration-audit.cjs
```

The logic suite now has 20 checks, including bore boundaries, legacy selections, unknown details, use restrictions and profile persistence. Browser coverage includes the BBC flow at desktop and phone widths: type a decimal bore, change intended use, save/reload/load, and confirm changing the block clears measurements.

The calibration audit remains a separate failing gate. It uses PR #7's claimed stock-engine targets; it is not an independently validated engine benchmark suite. Test dependency setup is in PR7-REPAIR-NOTES.md.

## Next acceptance gate

Build one complete, sourced parts path for a specific engine configuration. Record exact manufacturer SKUs, cam/lifter/spring requirements, gasket/hardware choices, piston and chamber details, and vehicle clearance requirements. Distinguish dimensional fit from suitability for the owner's use and performance goal. Add at least one sourced alternative with an explained tradeoff.

Do not certify a particular Nova build from the generic 396 label. Actual block identity, bore and assembly measurements remain necessary. The rest of the catalog, power calibration, deployment setup and affiliate tracking remain unfinished.
