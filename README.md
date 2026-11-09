# Taiseel — Rwanda Property Search

A Rwanda-first property discovery preview using the supplied HTML prototypes as the page-level source of truth and the Rwanda Land Intelligence MapLibre implementation as the search-map engine.

## Screens

- `/` renders the supplied landing page from `public/zillow-clean.html`.
- `/search` renders the supplied Rwanda search page from `public/zillow-rwanda-v3.html`.
- `/map.html` is the same-origin MapLibre entry mounted inside the search page's existing map rectangle.
- `/saved` and `/property/:id` retain the existing React screens.

## Reference fidelity

The home layout remains the supplied 65px navigation rail, 56px header, 378px hero and original section order. The search layout remains the supplied 44px top bar, 52px filter toolbar, 64px side rail, 60vw desktop map well, results panel and two-column card grid. The map integration replaces only the obsolete Leaflet map implementation inside that map well.

## Rwanda Land Intelligence map

The embedded map uses the MapLibre GL implementation from `Onielq/african-zillow-` and its published geography APIs. It supports:

- Map, Satellite and Hybrid basemaps.
- Administrative levels District → Sector → Cell → Village, with a separate cadastral parcel layer at close zoom.
- Kigali pilot districts and Bugesera, using the source project's published GIS coverage.
- Parcel UPI, area and source fields when supplied by the cadastral service.
- Land-transaction price reference shading and the source map's parcel price methodology.
- Landmarks enabled by default; optional schools/health, transport, nature and zoning overlays.
- Drawing and removing a user-defined boundary.

The map does not establish title or ownership. An administrative polygon is not a parcel. A cadastral polygon is not proof of current registered ownership, encumbrances or survey completeness. Estimated values retain their source and method caveats.

## Search page preview listings

Eight sample records cover homes, a rental and land. They are illustrative, not live inventory. The listing cards are still in the supplied HTML scaffold and link to the existing React detail records.

## Stack and commands

React 19, TypeScript, Vite, MapLibre GL, Leaflet (retained in the previous React prototype code), and Playwright Test.

```bash
npm install
npm run dev
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

The MapLibre worker modules are copied to `public/vendor/maplibre-gl/<version>/` by the package lifecycle script.

## Same-origin map APIs

- `/api/geography/areas`: administrative polygons and cadastral parcels.
- `/api/geography/places`: optional nearby-place overlays.
- `/api/geography/zoning`: optional planning/zoning overlays.

The Vite development server does not implement serverless functions; browser E2E tests stub these routes with explicitly synthetic fixtures. Vercel serves the standard Web Request/Response handlers from the root `api/` directory and must be checked independently in the preview deployment.

## Source and adaptation boundary

The home and search scaffolds are ported from the two user-supplied files in `Onielq/Taiseel-african-zillow-`: `zillow-clean.html` and `zillow-rwanda-v3.html`. The map engine and geography logic are adapted from `Onielq/african-zillow-`. Taiseel's current wordmark is a placeholder pending the final logo asset.

## Data and trust

Sample listing data stays clearly marked as illustrative. Geographic records show the publisher/source labels returned by the GIS routes. Public access does not itself establish permission to republish, completeness, title or current survey accuracy; in particular Bugesera cadastral reuse terms remain pending. The map's selection panel must not imply that a mapped boundary proves ownership.
