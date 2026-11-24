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

## Direct UPI parcel lookup

The map now provides an exact UPI search control. It sends the five-part numeric Rwanda UPI to the parcel API, which checks both connected cadastral sources:

- City of Kigali Master Plan · Kigali Parcels layer
- National Land Authority LAIS · Bugesera_Parcels layer

A matching record opens the parcel on the map and selects it for the connected three-layer property profile. The normal viewport map load then enriches the selected parcel with applicable published zoning records. If a source is unavailable, the search reports an incomplete lookup. If the connected sources return conflicting matches, the API reports an ambiguity instead of choosing one.

This lookup confirms only that a matching record was returned by a connected cadastral source. It does not establish current registered ownership, encumbrances, seller authority, legal title, parcel survey completeness or whether a transaction is safe. Those checks still require current official searches and appropriate professional review.

## Connected property profile

Selecting an individual cadastral parcel on the MapLibre map opens the parcel evidence card. The card's **View connected property profile** action brings the three Taiseel intelligence layers together for that parcel:

1. **Land Intelligence (Singapore-inspired):** UPI, mapped parcel identity and size basis, administrative location, source-published zoning and wetland overlap where supplied. It explicitly warns that mapped parcel data is not proof of current registered ownership, title, encumbrances or seller authority.
2. **Development and Regulatory Intelligence (Dubai-inspired):** a dedicated section for parcel-linked developer, project, approval, off-plan and escrow information. These records are currently not connected to the map, so the profile says **Not connected** rather than implying that no project or approval exists.
3. **Marketplace and Market Intelligence (US-inspired):** available parcel/area price references retain their source labels and limitations. Linked listings, comparable asking prices and verified sale history are shown as unavailable until real parcel-linked inventory and transaction evidence are connected.

The profile is an integrated consumer view, not a title certificate, legal opinion, formal valuation, survey or development approval. Each layer reports what is present and what remains unverified; unavailable data is never converted into a negative finding.

## Verified listing-to-parcel links

The `public.listing_parcel_links` table records three separate things:

- The listing identity and exact five-part UPI asserted by a lister, including the lister's attestation.
- A separate check that the UPI exists in a connected cadastral source.
- Independent evidence and reviewer identity for the relationship between the listing and the parcel.

A cadastral UPI match alone does **not** prove that the listing is on that parcel. A record can become `verified` only after relationship evidence, reviewer identity, and organisation details are present. The database rejects a verified status without those requirements.

Lister and reviewer identities use canonical internal principal IDs. `platform_principal_identities` maps verified identity-provider subjects to those principals, so multiple sign-in identities can resolve to one person. The database requires the reviewer principal to differ from the lister principal. The public API database role can read the link table but is explicitly denied access to the principal and identity tables.

The public read-only endpoint is `GET /api/listings/parcel-links`. Use exactly one lookup form:

- `?source=partner_slug&listingId=external-listing-id`
- `?upi=5/07/08/01/936`

It returns only rows where both the relationship status is `verified` and the cadastral check is `matched`. It never returns evidence references, reviewer notes, lister identity, or pending claims. It does not infer associations from address text or map proximity.

The API uses a dedicated Neon read-only database role. The submission and review workflows are not yet exposed because this project does not yet have an authenticated lister/reviewer identity system or an approved inventory feed. No illustrative preview listing is connected to a real parcel. Do not remove the sample-data notice or claim that the marketplace has live listings until those integrations are approved and connected.

The schema migrations are tracked in `db/migrations/20261124_001_listing_parcel_links.sql`, `db/migrations/20261124_002_canonical_principals.sql`, and `db/migrations/20261124_003_restrict_identity_table_access.sql`.

## Search page preview listings

Eight sample records cover homes, a rental and land. They are illustrative, not live inventory. The listing cards are still in the supplied HTML scaffold and link to the existing React detail records.

## Stack and commands

React 19, TypeScript, Vite, MapLibre GL, Leaflet (retained in the previous React prototype code), Neon Postgres, and Playwright Test.

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
- `/api/listings/parcel-links`: verified listing-to-parcel relationships only.

The Vite development server does not implement Vercel serverless functions; browser E2E tests stub geography routes with explicitly synthetic fixtures. Vercel serves the standard Web Request/Response handlers from the root `api/` directory and must be checked independently in the preview deployment.

## Source and adaptation boundary

The home and search scaffolds are ported from the two user-supplied files in `Onielq/Taiseel-african-zillow-`: `zillow-clean.html` and `zillow-rwanda-v3.html`. The map engine and geography logic are adapted from `Onielq/african-zillow-`. Taiseel's current wordmark is a placeholder pending the final logo asset.

## Data and trust

Sample listing data stays clearly marked as illustrative. Geographic records show the publisher/source labels returned by the GIS routes. Public access does not itself establish permission to republish, completeness, title or current survey accuracy; in particular Bugesera cadastral reuse terms remain pending. The map's selection panel must not imply that a mapped boundary proves ownership.
