# Taiseel preview architecture

## Current implementation

- Vite serves the React 19 / TypeScript route shell.
- The / route renders public/zillow-clean.html in a full-viewport iframe.
- The /search route renders public/zillow-rwanda-v3.html in a full-viewport iframe and forwards query parameters such as q and category.
- The search HTML keeps the supplied layout: top navigation, filter toolbar, 64px side rail, Leaflet map and right-side results panel.
- The map page embeds Rwanda district GeoJSON and uses Leaflet/Turf libraries from a CDN. CARTO/OSM, Esri World Imagery and OpenTopoMap tiles are available through the layer selector.
- The existing React app continues to render /saved and /property/:id. Search-page cards use matching sample record IDs so navigation opens the corresponding details.
- Saved homes and saved searches use same-origin browser local storage.
- Vercel rewrites client routes to index.html.

## Screen fidelity

- Home and search screens are ports of the user-supplied zillow-clean.html and zillow-rwanda-v3.html; they are not recreated with a new design system.
- The home prototype retains its Open Sans typography, 56px navbar, 65px left rail, 378px hero and original section sequence.
- The Rwanda search prototype retains its Inter typography, 44px top navigation, 52px filter bar, map/results split and original filter-panel structure.
- Responsive rules were added so the home sections reflow and the search map stacks above results on narrow screens.
- District boundaries use transparent fill and cyan outlines: 1.05px normal, 3px hover and 3.5px selected. The prototype's zoom-level clearing behavior remains.

## Data and trust boundaries

The listings in the HTML search page are sample cards aligned by ID with the React detail dataset. They are not live inventory. District polygons are administrative boundaries and do not represent parcel/title boundaries. All prices, locations, amenities, photos and coordinates require verification before being treated as market information.

## Intentionally not present

- No live property API, ingestion or production data sync.
- No account authentication, cross-device sync, production messaging or payments.
- No title registry or ownership verification.
- No production cadastral parcel layer, zoning layer or transaction-market feed.
- No verified valuation or live listing availability.

## Production data architecture

A production release should introduce a versioned property API backed by validated records and field-level provenance. Each record should identify its source, observation time, confidence and rights to publish. Price, listing status, legal documents, agent identity, parcel shape and transaction history need separate source and freshness rules.