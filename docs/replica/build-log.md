# Build log

## 2026-11-09 — Discovery and shortlist slice

- Audited the source and target repositories through the GitHub integration.
- Confirmed the source repository is a screenshot archive, not a runnable app.
- Confirmed the destination is an existing React/Vite preview with Playwright Test and CI browser installation already configured.
- Made featured-home favourites functional using the existing shared local state.
- Implemented result sorting (price ascending/descending, bedroom count and floor/plot area).
- Implemented browser-local saved searches, duplicate prevention, reopening of saved filters and removal.
- Added accessible names for listing cards.
- Added Playwright regression tests for home favourites, sorting, saved-search persistence and mobile map/list switching.
- Updated the clean-room recon, feature matrix, architecture, test plan and QA notes.

### Verification status

Changes are committed to `main` after the atomic Git update. Local build and local Chromium execution are not claimed because this execution environment cannot reach the package registry or GitHub host. The repository CI workflow is the authoritative runtime check and must be inspected after the commit.

## CI selector correction

- First GitHub Actions run: TypeScript/Vite build passed; 5 of 8 Playwright tests passed.
- Three failures had the same strict-mode locator cause: a header navigation action and a footer navigation action shared the accessible name.
- Updated those test actions to locate the navigation control inside the banner landmark. This is a test-only correction; the runtime app build was already successful.

## Home favourite assertion refinement

- The remaining Playwright failure was a test expectation mismatch, not a save-state failure: listing titles are intentionally buttons that open detail pages, not heading elements.
- Updated the regression assertion to locate the listing title button by its accessible name.

- Refined the home favourite test one more time to require an exact title-button name, avoiding a partial match against the adjacent "View [listing]" photo action.

## Final verification — 2026-11-09

- GitHub Actions run: 42534805070, commit 27fedd1c742ad5573b88f89782486158dfd50949 — success.
- TypeScript/Vite production build: passed.
- Playwright E2E: 8 passed (6.1 seconds); all workflow steps completed successfully.
- Vercel deployment dpl_4A5m2CPQDVwxXXybvgSXoLp3Lyde is READY, target production, and points to the same main commit.
- Live visual inspection through Chrome DevTools MCP was not available in this execution session. Do not treat automated E2E as a substitute for manual accessibility and device review.


## 2026-11-09 — Visual system pass

- Inspected the user-provided Zillow design extraction and reference screenshots in the source screenshot repository.
- Confirmed the screenshot archive includes home discovery, navigation dropdowns, search map/list, price, beds/baths, property-type and more-filter states.
- Reworked the Taiseel header to a centered brand with left navigation and right account actions.
- Updated the hero to the location-first four-part headline and rounded search treatment.
- Rebased the UI on white canvas, blue interactive accent, Inter typography, 8px spacing rhythm, 12px cards, pill controls and restrained shadows.
- Tuned the search toolbar and map/list split to better reflect the supplied reference layout.
- Added focus-ring, hover, coarse-pointer and reduced-motion treatments.
- Kept Taiseel name, original copy and current licensed/source media; Zillow logos, photos and proprietary fonts were not reused.
- Updated design tokens, component specifications, screenshot mapping, README and architecture notes.

### Verification — visual system commit

- Commit: `6cafd6b50073fd1c2ce96c2ce811f35d3189a75a`.
- GitHub Actions run: `42537498197` — success.
- TypeScript/Vite production build — passed.
- Playwright E2E — passed; all workflow steps completed successfully.
- Vercel deployment: `dpl_Fk768QEaumb5YMaM7N9nGjHExfFn` — READY, target production, same GitHub main commit.
- Manual desktop/mobile visual inspection remains outstanding; the live browser MCP was not exposed in this session.


## 2026-11-09 — Rebuild from the two supplied HTML demos

- Read zillow-clean.html and zillow-rwanda-v3.html in the user-owned source repository.
- Changed the app route shell so / renders the supplied home prototype and /search renders the supplied Rwanda map/results prototype.
- Added both pages to public/ as standalone HTML. Preserved their section order, component geometry, filter panels, district map logic and map controls instead of recreating the screens with a new design.
- Adapted the brand and Rwanda-facing labels; aligned the six residential/rental example cards and added the two existing land sample records so Buy, Rent and Land have corresponding results.
- Added image assets to the map-page demo cards, linked card IDs to the existing React detail records, and connected search, sorting, saved homes and saved searches to the existing app routes and browser storage.
- Corrected the map attribution and changed the district outline treatment to transparent cyan: normal 1.05px, hover 3px and selected 3.5px.
- Added responsive behavior for the landing page and map/results screen.
- Replaced outdated documentation that described the earlier independently designed UI with the actual prototype-based architecture and screen specifications.
- Rewrote Playwright coverage around the supplied screens, their map/filter behavior and the React saved/detail routes.

### Verification status

- All embedded JavaScript blocks were syntax-parsed successfully.
- GitHub Actions run 42543350156: TypeScript/Vite build passed and Playwright passed 8/8 tests (8.8 seconds).
- Vercel preview deployment dpl_6ECKxiLgfLReFKqWULiAMRDJpn1h reached READY for commit 2c85e44c91aba989cf012cb7066149fae4822b6a; both standalone HTML pages returned HTTP 200.
- Manual visual comparison at desktop and mobile sizes remains a separate check; automated assertions do not replace visual inspection.

## 2026-11-09 — Land Intelligence MapLibre integration

- Audited the reference HTML and screenshots before changing the map. Recorded the 44px top bar, 52px filter row, 64px rail, 60vw desktop map basis and two-column listing grid in `reference-fidelity-audit.md`.
- Inspected `Onielq/african-zillow-` MapView and its geography/places/zoning APIs.
- Ported the source MapLibre MapView, compact-format and parcel-pricing helpers, land-price benchmark data and worker-copy script.
- Ported the viewport-driven administrative/cadastral geography, nearby-place and zoning handlers into root Vercel API handlers using standard Web Request/Response APIs.
- Added a same-origin MapLibre page mounted inside the existing map well. The original search HTML scaffolding, filters, right-side sample listing cards and page proportions remain in place.
- Connected Map / Satellite / Hybrid, layer selection, zoning and draw/remove-boundary controls to the new engine. Default map overlay is landmarks only.
- Preserved source data caveats: administrative geometry is not a parcel; cadastral geometry/UPI does not prove title; source access does not establish Bugesera reuse permission.
- Added test-only synthetic geography fixtures for local browser tests and added screenshot capture at 1440px, 768px and 390px. CI uploads those images for visual review.

### Verification completed

- GitHub Actions run 42595065210: TypeScript/Vite build passed; Playwright passed 12/12 tests (28.4 seconds). Tests cover the home/search/saved/details/filter flows, MapLibre mount and readiness, 60vw layout, layer toggle, draw mode, satellite switching, the mobile map-first scaffold and local Vite API routing.
- CI screenshot artifact taiseel-visual-review was downloaded and inspected. Desktop (1440×900), tablet (768×900), mobile (390×844), the price-filter popover and home screenshots were reviewed.
- Vercel preview dpl_HoVKUdJDREiA7f1GEguAx42meDcz is READY. The app shell, search page, map page, MapLibre worker and shared worker assets returned HTTP 200.
- Live preview API counts: Kigali 3 districts / 35 sectors / 161 cells / 1,163 villages; Bugesera 1 district / 15 sectors / 72 cells / 581 villages. Small viewport parcel queries returned 1,379 Kigali records and 104 Bugesera records with published UPI/area fields.
- CI screenshot routes use explicitly synthetic test polygons to avoid coupling screenshot runs to GIS uptime. Real API feature counts were checked separately; fixture geometry is not production geography.
- Optional nearby-place and zoning queries returned HTTP 502 during this verification window because upstream Overpass and official zoning providers timed out. No missing features are filled with guesses. The MapLibre canvas, administrative hierarchy, land-price reference styling and parcel APIs were independently verified.
- Bugesera cadastral source terms, completeness and current survey accuracy still require confirmation.
