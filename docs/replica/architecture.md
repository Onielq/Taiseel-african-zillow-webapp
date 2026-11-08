# Taiseel preview architecture

## Current implementation
- Vite serves a client-side React and TypeScript application.
- One small sample dataset powers the home cards, filtered results, map markers, detail screens and saved list so the same property record is shown consistently.
- Leaflet renders the Kigali-area map with OpenStreetMap tiles. Marker coordinates are approximate demo coordinates, not cadastral parcel boundaries.
- Browser local storage holds only sample favourites.
- The enquiry form validates locally and does not transmit personal information.

## Intentionally not present
- No live property API, listing ingestion, authentication, payment, agent messaging, title registry or valuation calculation.
- No verified listing, ownership, boundary, zoning, availability or market price claims.
- No private competitor API or third-party scraping.

## Production architecture boundary
A production release should introduce a versioned property API backed by verified records and provenance. Listing status, asking price, parcel shape, legal documents, agent identity and transaction history must each have an explicit source, observation timestamp and confidence state. Authentication and saved-search sync should be introduced only with a privacy and security review.
