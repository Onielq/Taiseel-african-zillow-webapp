# Taiseel — Rwanda Property Search

Taiseel is a Rwanda-first property discovery experience. This repository contains an original React implementation of common real-estate discovery patterns, with Taiseel branding and illustrative Kigali property records.

## Product preview

- Location-led discovery for homes, rentals and land.
- Split map-and-list search with category, location, price, room, property-type and amenity filters.
- Functional sorting by price, bedrooms and area.
- Property detail pages with photo gallery, core facts and a local enquiry preview.
- Browser-local saved homes and saved searches, including reopening a saved filter set.
- Responsive desktop and mobile layouts with a map/list switch.

**Demo data notice:** all listings, prices, addresses, agent details and coordinates currently shown are illustrative sample data. They are not live listings, verified offers, valuations, cadastral parcel boundaries or market statistics. No production property database is connected.

## Stack

- React 19 + TypeScript
- Vite
- Leaflet + React Leaflet, using OpenStreetMap tiles
- Playwright Test for browser end-to-end checks
- GitHub Actions for build and Chromium E2E verification
- Vercel for hosting

## Local development

```bash
npm install
npm run dev
```

## Checks

```bash
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

Playwright Test is declared in `devDependencies`. CI installs the matching Chromium browser binary.

## Deployment

The Vercel Git project should be connected to this repository and deploy `main`. Client-side routes are rewritten to `index.html` by `vercel.json`. Preview deployment is the verification target until the release checklist is complete.

## Clean-room boundary

Public product guidance and supplied screenshots were used to understand broad user workflows only. This implementation uses original code, Taiseel-owned brand styling and original copy. It does not include Zillow source code, logo, proprietary copy, screenshots, photos, private endpoints or scraped listing data. Reference screenshots are not bundled into the webapp. Use Taiseel-owned branding and properly licensed media in production.

## Architecture and trust

- One in-repository sample dataset powers cards, search, map markers, details and saved-property links.
- Local storage is limited to saved sample homes and saved sample searches.
- Enquiry forms validate locally and do not transmit personal information.
- Production inventory requires a trusted Rwanda listing source and field-level provenance before sample records are replaced.
- Availability, legal ownership, title, boundaries, zoning, price and agent identity require independent verification.

See `docs/replica/` for the screen map, flows, feature matrix, architecture and testing plan.
