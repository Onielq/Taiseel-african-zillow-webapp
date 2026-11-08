# E2E test plan

| Case | Flow | Expected result | Automated |
|---|---|---|---|
| F01-H1 | Home → Search | Primary search opens the Kigali results view | Yes |
| F02-H1 | Search filters | Location query narrows cards and markers | Yes |
| F02-H2 | Search sort | Lowest-price result becomes first when selected | Yes |
| F03-H1 | Card → Detail | Detail facts and illustrative-data warning are visible | Yes |
| F03-H2 | Enquiry preview | Dialog validates locally and states that nothing is transmitted | Yes |
| F04-H1 | Save from results | Favourite appears on Saved places after navigation | Yes |
| F04-H2 | Save from Home | Featured favourite appears on Saved places | Yes |
| F05-H1 | Save search | Search filter combination is persisted locally | Yes |
| F05-H2 | Reopen search | Saved location and matching result are restored | Yes |
| F06-H1 | Mobile list/map | Map and list controls switch visible panel at 390px | Yes |

## Additional edge cases to cover

- Empty search result after a location that matches nothing.
- Long neighbourhood input and punctuation/diacritics.
- Browser storage unavailable or malformed.
- Unknown property ID and unknown route.
- Back/forward navigation from search to detail.
- Slow or unavailable tile requests without blocking the result cards.
- Keyboard traversal, visible focus and screen-reader announcement of saved-search feedback.
- A11y scan with axe or equivalent in a browser-enabled execution environment.
