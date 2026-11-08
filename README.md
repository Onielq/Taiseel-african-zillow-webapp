# Taiseel — Rwanda Property Search

Taiseel is a Rwanda-first property discovery experience. This repository contains a clean-room web implementation of common real-estate search patterns, rebuilt with Taiseel's own identity and sample Kigali listings.

## Preview scope

- Location-led discovery for homes, rentals and land.
- Split map-and-list search with interactive filters.
- Property detail view with gallery, key facts and enquiry form.
- Browser-local saved homes.
- Responsive desktop and mobile layouts.

**Demo data notice:** all listings, prices, addresses and agent details currently shown are illustrative sample data. They are not live listings, verified offers, valuations, or market statistics. The preview does not connect to a production property database.

## Stack

- React 19 + TypeScript
- Vite
- Leaflet + React Leaflet, using OpenStreetMap tiles
- Playwright for browser end-to-end checks
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

## Deployment

The Vercel project is intended to be connected to this repository and deploy the `main` branch. Client-side routes are rewritten to `index.html` by `vercel.json`.

## Clean-room boundary

The reference material was used to understand high-level interaction patterns only. This repository does not include Zillow source code, logo, proprietary copy, screenshots, photos, private endpoints or scraped listing data. Use Taiseel-owned branding, original copy and properly licensed media in production.

## Next production steps

1. Connect a trusted Rwanda listings source and model listing verification.
2. Replace sample records with validated API data and provenance.
3. Add authentication and server-backed saved searches/favourites.
4. Add agent/developer onboarding, privacy policy, terms and contact routing.
5. Complete accessibility, security, performance and real-device QA before public launch.
