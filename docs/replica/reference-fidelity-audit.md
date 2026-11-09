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

## Verification plan

1. TypeScript/Vite production build.
2. Browser tests for map mount, map/imagery/hybrid switching, overlay toggles, selected-area response, draw/remove boundary, and the existing filter/listing flows.
3. Preview deployment HTTP checks for the map entry and each geography API.
4. Browser screenshots at approximately 1440px, 768px and 390px widths for review of the map/list proportions and responsive behavior.

**Visual QA limitation:** the current integration tools can read deployed HTML and run Playwright through GitHub Actions, but do not expose an interactive browser session or an image-returning screenshot tool for the live Vercel page. The audit therefore records source-level and reference-image measurements before code; it does not claim a manual screenshot comparison of the current production page.
