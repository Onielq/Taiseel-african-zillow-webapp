# Taiseel preview architecture

## Runtime and screens

- Vite serves the React 19 / TypeScript route shell.
- `/` renders `public/zillow-clean.html` in a full-viewport same-origin iframe.
- `/search` renders `public/zillow-rwanda-v3.html` in a full-viewport same-origin iframe.
- The supplied search HTML keeps its navigation, 44px header, 52px filter bar, 64px rail, results panel and card grid.
- Its existing map rectangle contains `map.html` in a nested same-origin iframe. This keeps the reference page's map/results proportions separate from MapLibre's internal controls and rendering.
- `src/MapApp.tsx` mounts the source Land Intelligence `MapView` and bridges basemap/layer/drawing commands to the surrounding HTML controls using origin-checked postMessage events.
- `/saved` and `/property/:id` continue to render in the original React shell.

## Map engine and data flow

- MapLibre GL JS is the map renderer, with the source project's versioned worker assets served from `public/vendor/maplibre-gl/<version>/`.
- Basemaps: OpenFreeMap/MapLibre Liberty, Esri World Imagery and Esri hybrid reference layers.
- Administrative and cadastral features load by current viewport from `/api/geography/areas`.
- Optional places load from `/api/geography/places`; optional planning overlays load from `/api/geography/zoning`.
- The active geography hierarchy is District → Sector → Cell → Village. Individual cadastral parcels remain a distinct layer, not an additional administrative level.
- The map opens with the pilot scope for Gasabo, Kicukiro, Nyarugenge and Bugesera. It uses the source map's geometry-aware zoom transitions and transparent polygon fills.
- Land-price coloring uses the source project's transaction-price reference data. A transaction reference is not automatically a live asking price or formal valuation.
- The map wrapper receives a compact selection summary; it does not replace the listing cards with land-intelligence details.

## Reference geometry preserved

- Home: 65px rail, 56px navbar, 378px hero, 370px hero search; source section order preserved.
- Search: 44px top bar, 52px filter bar, 64px rail, map flex basis 60vw and results in the remaining width; two-column desktop listing cards.
- On narrow screens the source search CSS stacks the map above the listing panel. The map iframe fills the map rectangle, not the full page.
- Map status, selection card and controls are positioned inside the map rectangle so they do not change the page scaffold.

## API deployment distinction

The Vite development server uses a small middleware adapter to execute the same Web Request/Response handlers in `api/geography/` via `ssrLoadModule`. The `predev` script generates the API-compatible JavaScript price modules and MapLibre worker assets. Playwright intercepts those endpoints with explicitly synthetic fixtures for deterministic interaction tests. Vercel serves the standard handlers from root `api/`.

## Trust boundaries

- Administrative area geometry is not an individual plot.
- A cadastral polygon/UPI is not proof of current title, ownership, encumbrances, survey completeness or permission to republish.
- Transaction/reference prices and geometry-derived sizes must retain their source and calculation basis.
- The right-side property listings remain illustrative. They are not linked to the map parcel layer as verified available inventory.
- Bugesera parcel reuse terms remain pending in the source project. Preserve source caveats.

## Not implemented in this slice

- Live property listing ingestion or CRM connection.
- Agent identity/availability verification.
- Parcel title verification.
- Cross-device authentication and saved-search sync.
- A production valuation or transaction data feed beyond the source map's existing reference overlays.
