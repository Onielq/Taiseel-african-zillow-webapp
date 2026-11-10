# Taiseel screen specifications — source HTML and Land Intelligence map

## Home: `public/zillow-clean.html`

- Fixed 56px white navbar with left navigation, centered wordmark placeholder and right-side account action.
- Fixed 65px vertical navigation rail.
- 378px photographic hero with dark readability overlay and a two-line heading.
- 370px search field inside the hero.
- Original recommendations, budget/affordability, feature-card, explanatory and footer sequence remains in place.
- The final brand logo asset is still pending from the user.

## Search: `public/zillow-rwanda-v3.html`

- 44px top navigation and 52px filter toolbar.
- Search, listing category, price, beds/baths, property type, more filters and save-search controls remain in the supplied order.
- 64px side rail.
- Map well uses `flex: 0 0 60vw; width: 60vw` on desktop. Results panel takes the remaining width.
- Results use a two-column listing grid.
- Existing price, beds/baths, property-type, more-filter popovers and search behavior remain in the parent page.

## Embedded MapLibre map

- Reuses the Land Intelligence `MapView` renderer and geography hierarchy.
- Map, Satellite and Hybrid modes.
- District, sector, cell, village and cadastral parcel layers.
- Land-price reference coloring; optional schools/health, transportation, nature and zoning overlays.
- User drawing mode with a separate cyan boundary overlay and remove action.
- Source data statuses and a selected-area summary are kept inside the map rectangle.

## Responsive behavior

- The source home and search scaffolds keep their own responsive rules.
- Search map stays inside its allocated map rectangle and stacks above results on mobile; it must not create an independent full-page map.
- The nested map iframe resizes with the same rectangle and keeps map controls inside its bounds.

## Data trust

Administrative and cadastral geometry are not proof of ownership or title. Sample listing prices/status remain illustrative. Transaction-price reference shading, size estimates and any asking-price calculation must keep the source and methodology visible. Bugesera parcel layer reuse/completeness caveats remain.
