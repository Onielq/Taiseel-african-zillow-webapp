# Reference-fidelity audit — 2026-11-09

## Source of truth reviewed

- Home structure: `Onielq/Taiseel-african-zillow-/zillow-clean.html`.
- Search structure and controls: `Onielq/Taiseel-african-zillow-/zillow-rwanda-v3.html`.
- Desktop reference states inspected: `Screenshot 2026-04-12 100527.jpg`, `100934.jpg`, `101033.jpg`, `101102.jpg`, `101311.jpg`, `101416.jpg`, `101514.jpg`.
- Rwanda map coverage states inspected: `Screenshot 2026-05-03 105511.jpg` and `105612.jpg`.
- Map engine source reviewed: `Onielq/african-zillow-/src/components/map/MapView.tsx` and its `MapExperience.tsx` host, geography APIs, pricing helpers and GIS data modules.

## Visual measurements to preserve

The supplied search HTML contains the actual layout tokens: 44px top navigation, 52px filter toolbar, 64px vertical rail, a 60vw map basis, and a flexible results panel. The map/results split, scroll ownership, filter popover anchors and two-column result cards must remain in that order. The visual reference screenshots show the page in a browser-scaled viewport; the existing HTML measurements remain the implementation source of truth rather than introducing a new responsive composition.

The supplied home HTML remains the implementation source of truth: 65px navigation rail, 56px top navigation, 378px hero, 370px hero search, and the original section order (recommendations, budget/affordability, feature cards, explanatory note and footer). This map pass does not redesign the home screen.

## Current implementation gaps identified before edits

| Area | Current Taiseel webapp | Target from the supplied references |
|---|---|---|
| Map engine | A separate Leaflet demo map with embedded district GeoJSON | The MapLibre map from Rwanda Land Intelligence |
| Geography | District-only outline data | District → sector → cell → village → cadastral parcel, with geometry-driven zoom transitions |
| Parcel data | No cadastral parcel layer in the Zillow search map | Published Kigali and Bugesera parcel geometry with UPI/area/source fields where available |
| Basemaps | CARTO/OSM, Esri satellite and OpenTopoMap | The Land Intelligence MapLibre Map, Satellite and Hybrid styles |
| Map overlays | A basic Schools control | Land Intelligence place overlays, with landmarks enabled by default and optional schools/health, transport, nature and zoning |
| Map detail | District hover and click zoom only | Source-driven administrative selection, parcel selection, transparent parcel boundaries, selected/hover state |
| Price context | Sample property-card prices only | The source map's transaction-price reference shading and parcel price-basis calculations, with explicit data caveats |
| Loading | A single map loader | MapLibre loading/status state and a skeleton constrained to the same map rectangle; do not resize or recompose the surrounding page |

## Implementation boundary

- Keep the supplied HTML home and search scaffolding intact.
- Replace only the obsolete Leaflet map implementation in the search page with a same-origin MapLibre map entry.
- Port the existing Land Intelligence `MapView` and only the API/data dependencies it actually calls in its default search-map state.
- Keep the existing right-side sample listing experience and its warning; do not present the map's administrative or cadastral geometry as proof of title or an available property.
- Retain the current Taiseel wordmark placeholder. The user will supply the final logo asset separately.
- Preserve normal, hover and selected visual hierarchy for boundaries; do not introduce opaque fills that obscure the base map or imagery.

## Verification result — 2026-11-09

- TypeScript/Vite production build: passed.
- Playwright: 12/12 passed in GitHub Actions run 42595065210 (commit 7cfada013afae166b211cac485eecb3501145a6c).
- Browser screenshots were captured and inspected at 1440×900, 768×900 and 390×844. The 1440px price-filter popover and home screen were also inspected.
- The search map retains the reference map/results split and original filter row. The right results panel remains two-column on desktop and the map stacks above results on mobile.
- Vercel preview deployment dpl_HoVKUdJDREiA7f1GEguAx42meDcz returned HTTP 200 for the app shell, search page, map page and versioned MapLibre worker assets.
- Real preview API checks returned: Kigali 3 districts / 35 sectors / 161 cells / 1,163 villages; Bugesera 1 district / 15 sectors / 72 cells / 581 villages. Small viewport requests returned 1,379 Kigali parcel features and 104 Bugesera parcel features, with UPI and area fields where published.
- The screenshots use synthetic test polygons so the UI checks do not depend on live GIS availability. Live API data counts are verified separately; the screenshots must not be interpreted as actual district or parcel geometry.

### Known provider limitations

The nearby-place Overpass query and official zoning GIS query returned HTTP 502 during this check because the upstream services timed out. They are optional overlays; the basemap, administrative hierarchy, transaction-price layer and cadastral parcel APIs are separate. Missing place or zoning features are not fabricated. Bugesera cadastral reuse permission, completeness and survey currency remain pending in the source project.
