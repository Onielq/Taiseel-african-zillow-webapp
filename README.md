# Taiseel — Rwanda Property Search

A Rwanda-first property discovery preview built with original React, TypeScript and Taiseel branding.

## What works
- Home discovery for Buy, Rent and Land.
- Neighbourhood search and category, price, beds, baths, property type and amenity filters.
- Split Leaflet map and listing results.
- Sorting by price, bedrooms and floor/plot area.
- Property detail pages with photo gallery, core facts and a local enquiry preview.
- Browser-local saved homes and saved searches, including reopening and removing saved filters.
- Responsive desktop and mobile layouts with a map/list switch.

## Visual direction
The current interface follows the user-supplied public Zillow screenshot and design-token reference for broad layout and interaction patterns: a centered header wordmark, vertical navigation rail, photo-led hero, location-first rounded search, sticky map/list filter toolbar, compact listing cards, Inter typography, a white canvas, blue interactive accent, 8px spacing rhythm and reduced-motion support. Taiseel keeps its own name, original copy and original visual assets. See `docs/replica/design/` and `docs/replica/reference-screenshots.md`.

**Demo data notice:** all listing records, prices, addresses, images, amenities and coordinates in this preview are illustrative. They are not live listings, verified offers, valuations, market statistics or cadastral parcel boundaries. No production property database is connected.

## Stack and commands
React 19, TypeScript, Vite, Leaflet, React Leaflet and Playwright Test.

```bash
npm install
npm run dev
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

Playwright Test is already declared in devDependencies; CI installs Chromium and runs the browser suite.

## Clean-room boundary
Public product materials and user-supplied screenshots inform broad interaction patterns only. No competitor source code, logo, proprietary copy, screenshots, photos, private endpoints or scraped listings are included. The user-owned screenshot archive is used as visual evidence and is not bundled into the running app. Inter is used instead of the proprietary Object Sans font named in the reference extraction. Keep the preview disclosure until trusted, publishable Rwanda inventory and field-level provenance are connected.

## Architecture and trust
- One in-repository sample dataset powers cards, search, map markers, details and saved-property links.
- Local storage is limited to saved sample homes and saved sample searches.
- Enquiry forms validate locally and do not transmit personal information.
- Production inventory requires a trusted Rwanda listing source and field-level provenance before sample records are replaced.
- Availability, legal ownership, title, boundaries, zoning, price and agent identity require independent verification.

See `docs/replica/` for the screen map, flows, feature matrix, architecture, design tokens, reference screenshots and testing plan.
