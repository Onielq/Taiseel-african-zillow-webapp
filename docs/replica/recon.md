# Public-reference reconstruction notes

## Scope and source
The reference is the public Zillow web experience plus the screenshots supplied in the original Taiseel reference repository. The screenshots are evidence of visible interaction patterns only. No competitor source, proprietary imagery, logos, copy, hidden endpoints or scraped listing data are included in this build.

## Visible screen map
| Screen | User job | Key behaviours represented in Taiseel |
|---|---|---|
| Home | Start a property search | Search by city/district/neighbourhood; entry points for buying, renting and land |
| Search | Explore a location | Split map/list, location search, category, price, rooms, type and more filters |
| Listing detail | Understand a place | Photo gallery, asking-price example, facts, area and enquiry preview |
| Saved places | Keep a shortlist | Save/remove a property; browser-local saved list |
| Enquiry | Preview next step | Form validation and explicit demo-only feedback; no network submission |

## Flow map
1. Home → choose Buy/Rent/Land → Search.
2. Search → update location or filters → list and map markers update together.
3. Search result or map marker → listing detail.
4. Listing card or detail → save/remove → Saved places.
5. Detail → contact/viewing preview → a local confirmation that clearly says no message was transmitted.

## Design contract
- Original Taiseel identity and forest-green / warm-neutral palette.
- Location and property facts are more important than decorative UI.
- Desktop search uses a map/list split; small screens expose List/Map switching.
- All controls have visible labels or accessible names and keyboard focus.
- Sample inventory and asking-price examples must remain clearly identified as illustrative.
