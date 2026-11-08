# Taiseel public-reference reconstruction

## Boundary and sources

This is a clean-room reconstruction of useful real-estate discovery behaviours for a Rwanda-first product. Public materials are used to understand workflows and information hierarchy only. No proprietary source, private APIs, scraped listings, competitor logos, competitor copy or competitor images are used.

| Source | Evidence used | Boundary |
|---|---|---|
| https://www.zillow.com/ | Public location-led real-estate discovery entry point | Public browsing only |
| https://www.zillow.com/help/ | Help articles describing search, map/list, filters, sorting and saved items | Behavioural guidance only |
| https://github.com/Onielq/Taiseel-african-zillow-/ | User-provided screenshot archive | Screenshots are visual evidence, not production assets |
| https://github.com/Onielq/rea | Reverse-engineering workflow and evidence-handling guidance | No live REA browser session was available in this environment |
| https://github.com/Onielq/context7 | Versioned documentation workflow and MCP setup reference | Context7 server configuration is in `.mcp.json` |
| https://github.com/Onielq/agent-skills | Front-end engineering and browser test practices | Used as process guidance |
| https://github.com/Onielq/replica-skill | Recon, design, build and test workflow | Clean-room rules applied |
| https://github.com/Onielq/chrome-devtools-mcp | Isolated browser inspection workflow | MCP server configured; browser tool unavailable in this session |

## Screen inventory

| ID | Screen | Route | Purpose | Important elements | Implemented states |
|---|---|---|---|---|---|
| S01 | Home discovery | `/` | Start with a place or intent | Header, Buy/Rent/Land entry, location query, featured examples, neighbourhood links | Filled, responsive |
| S02 | Search results | `/search` | Narrow and compare sample inventory | Location search, filters, sort, map markers, result cards, save search | Filled, empty, mobile list/map |
| S03 | Property detail | `/property/:id` | Review a single example | Gallery, asking-price example, facts, features, verification note, enquiry dialog | Filled, unknown-id, local enquiry confirmation |
| S04 | Saved places | `/saved` | Revisit a shortlist | Saved property cards, saved-search cards, remove and reopen actions | Filled and empty |

## User flows

- **F01 — Find a place:** S01 → S02. Enter a neighbourhood or choose Buy/Rent/Land. Search is a local sample-data filter.
- **F02 — Refine results:** S02. Apply location, price, room, type and amenity filters; change sort; list and map update from the same filtered records.
- **F03 — Inspect a property:** S02 → S03. Open a card or map marker; view the gallery and facts; preview an enquiry without transmitting data.
- **F04 — Save a property:** S01 or S02 → S04. Save/remove a card; the browser-local shortlist remains after reload.
- **F05 — Save and reopen a search:** S02 → S04 → S02. Store a filter configuration locally, reopen it and remove it from the saved-search list.
- **F06 — Mobile map/list:** S02 at a narrow viewport. Switch between a results list and the map without changing the active filter.

## Feature matrix

The detailed implementation matrix is in [features.csv](./features.csv). It separates behaviours already implemented from product capabilities that require live data or backend services.

## Known limits

- The screenshot archive in the source repository does not contain runnable app source.
- The current inventory is sample data, not a real Rwanda listing feed.
- Approximate map markers are not cadastral parcel boundaries or survey geometry.
- No real listing availability, ownership, title, zoning, agent identity or transaction price is asserted.
- Saved homes and searches are browser-local; there are no accounts, notifications or cross-device sync.
- No boundary drawing, schools layer, agent messaging, mortgage/loan workflow or listing submission is in this preview.
- The REA and Chrome DevTools tools were not available as live browser sessions in this execution. This report does not claim to have run those tools against Zillow.

## Sizing

This preview is a medium-sized discovery slice. The most difficult production work is trusted supply/data ingestion, parcel/legal provenance, and the map/geo experience. The next major milestone is a verified Rwanda property data contract and a server-backed API, not inventing more sample listings.
