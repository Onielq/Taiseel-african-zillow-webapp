# Taiseel preview architecture

## Current implementation

- Vite serves a client-side React 19 and TypeScript application.
- A single illustrative sample dataset powers home cards, filtered results, map markers, property details and saved links.
- Search applies category, location, price, room, property type and amenity filters before sorting the results.
- Leaflet renders the Kigali-area map with OpenStreetMap tiles. Marker coordinates are approximate examples, not parcel boundaries or verified addresses.
- Browser local storage holds sample favourites and saved-search filter configurations.
- Enquiry forms validate locally and do not send personal information.
- Client routes are handled with the History API and Vercel rewrites client requests to `index.html`.

## Trust boundaries

The following fields are intentionally not represented as verified facts: ownership, title, availability, asking price, legal status, zoning, exact parcel geometry and agent identity. The sample-data notice remains visible. A map marker is not proof of a plot's legal location.

## Intentionally not present

- No live property API, ingestion or production data sync.
- No authentication, cross-device sync, messaging, payments or viewing calendar.
- No title registry or ownership verification.
- No cadastral parcel layer, production zoning layer or transaction-market feed.
- No private competitor API or third-party content scraping.

## Production data architecture

A production release should introduce a versioned property API backed by validated records and field-level provenance. Each record should identify its source, observation time, confidence and rights to publish. Price, listing status, legal documents, agent identity, parcel shape and transaction history need separate source and freshness rules. Authentication and saved-search sync should be introduced only with a privacy and security review.
