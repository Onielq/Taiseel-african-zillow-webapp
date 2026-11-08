# Taiseel component specifications

## Navigation
- Header: primary route entry points; buttons expose clear labels; compact navigation at mobile widths.
- Side rail: persistent desktop shortcuts with current-section styling and accessible names.
- Footer: repeat navigation and preview-only disclosure.

## Discovery and search
- Location input: semantic text input with a descriptive accessible label; Enter and Search activate the search route.
- Category entry: Buy, Rent and Land share one category model.
- Search toolbar: location, category, price, rooms, property type and amenity filters.
- Sort control: labelled native select; options reorder the already-filtered sample rows.
- Map panel: Leaflet/OpenStreetMap with attribution and approximate sample markers. Card results remain the authoritative sample list.

## Listing card
- Image has meaningful alt text.
- Property title opens the detail screen.
- Favourite action is a real button; `aria-pressed` reflects state and label changes between Save and Remove.
- Card exposes a concise accessible name containing title, sample price and location.

## Saved items
- Saved properties and saved searches are grouped separately.
- Saved searches show key filters and provide View results and Remove actions.
- Browser-local persistence is explicitly disclosed; no account or cloud sync is implied.

## Detail and enquiry
- Gallery controls are buttons with labels.
- Facts and data confidence disclaimers are visible.
- Enquiry preview is a labelled modal form; submission produces a local confirmation and transmits nothing.

## Interaction states
- Buttons provide hover and visible keyboard focus states.
- Empty result and empty saved states explain how to recover.
- Search filters update the visible list and map together.
- At mobile widths the user can switch between list and map.
- All inventory and prices keep the sample-data disclosure.
