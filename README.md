# Taiseel — Rwanda Property Search

A Rwanda-first property discovery preview using the supplied Taiseel HTML prototypes as the page-level source of truth.

## Screens

- `/` renders the supplied landing-page structure from `public/zillow-clean.html`.
- `/search` renders the supplied Rwanda map-and-results structure from `public/zillow-rwanda-v3.html`.
- `/saved` and `/property/:id` use the existing React screens for saved homes, saved searches and property details.

The two prototype pages remain separate HTML files. The React shell routes to them without rebuilding their layout in a different component system.

## What works in this preview

- The original landing-page sequence: navigation rail, top navigation, photo hero, location search, recommendations, budget section, feature cards and footer.
- The original Rwanda search sequence: top navigation, filter bar, district map, right-side two-column listing cards and map utilities.
- Location, category, price, beds, baths and property-type filtering, plus result sorting.
- Rwanda district polygon hover, selection and zoom behavior; Map, Satellite and Topo layers; draw-boundary control.
- Eight illustrative sample listings across homes, rentals and land.
- Saved homes and saved searches stored in browser local storage.
- Listing-to-detail navigation using the existing React property records.
- Responsive home and map/results layouts.

## Demo data notice

Listing records, prices, addresses, photos and coordinates are illustrative. They are not live listings, verified offers, valuations, market statistics or cadastral parcel boundaries. The district outlines are administrative demo geometry, not individual parcel boundaries. No production property database is connected.

## Stack and commands

React 19, TypeScript, Vite, Leaflet, React Leaflet and Playwright Test.

```bash
npm install
npm run dev
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

## Source and adaptation boundary

The page structure is ported from the two user-supplied files in the source repository Onielq/Taiseel-african-zillow-: zillow-clean.html and zillow-rwanda-v3.html. Taiseel naming, Rwanda-specific labels, listing data, local navigation and the cyan boundary treatment are retained or adapted for this project. The supplied demo files are stored under public/ and are loaded as the actual home and search experiences.

## Architecture and trust

- The two HTML screens are rendered in same-origin iframes by the React route shell.
- The existing React sample dataset powers the saved and detail routes; card IDs and key details in the map demo are aligned with those records.
- Local storage is limited to illustrative saved homes and saved searches.
- The enquiry screen is a local-only preview and does not transmit personal information.
- Availability, legal ownership, title, exact parcel boundaries, zoning, price and agent identity require independent verification.

See docs/replica/ for architecture, design notes, reference mapping and verification history.