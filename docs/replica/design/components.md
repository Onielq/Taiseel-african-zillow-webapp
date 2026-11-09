# Taiseel screen specifications — supplied HTML prototypes

## Home: public/zillow-clean.html

- Fixed 56px white navbar with left navigation, centered Taiseel wordmark and right-side account action.
- Fixed 65px vertical navigation rail.
- Full-width photographic hero, 378px tall on desktop, with dark overlay and two-line headline.
- 370px search field inside the hero.
- Recommendations section with text on the left and layered property-card composition on the right.
- Budget / affordability section, three feature cards, recommendations note and full footer.
- Open Sans typography as in the supplied home prototype.

## Search: public/zillow-rwanda-v3.html

- 44px top navigation and 52px filter toolbar.
- Search, listing status, price, beds/baths, property type, more filters and save-search controls remain in the supplied order.
- 64px side rail, map on the left (60vw desktop basis) and scrollable results panel on the right.
- Results use a two-column listing grid.
- Map layer selector, schools control, draw control, zoom controls, district hover labels and click-to-zoom behavior remain in place.
- Inter typography as in the supplied Rwanda prototype.

## Rwanda-specific corrections

- Taiseel name and Rwanda property categories replace source-brand labels.
- Listing examples use RWF and metric area units.
- Eight sample records cover homes, a rental and land; sample card IDs link to matching React details.
- The map attribution reflects the actual OSM/CARTO base map instead of the original inaccurate Google attribution.
- District hover, normal and selected outlines use cyan with transparent fill: 1.05px, 3px and 3.5px respectively.

## Responsive behavior and interaction

- The home page stacks the recommendations, budget card, feature cards and footer content on narrower screens.
- The search page turns the map/results split into a vertical flow, with the map above results; filter controls stay horizontally scrollable.
- Search, category, price, bedroom/bathroom and property-type filters update the result cards. Sorting and saved actions are wired to the preview records.
- Saved cards open the existing React property detail route. The Saved Homes route and property detail pages remain in the React shell.

## Verification states

All records remain illustrative. Administrative boundaries are not cadastral parcel shapes. Price, availability, ownership, title status, zoning and agent identity are not verified.