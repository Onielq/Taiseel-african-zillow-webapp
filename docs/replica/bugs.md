# QA findings and known gaps

## Confirmed functional gaps addressed in this change

| ID | Severity | Finding | Resolution |
|---|---|---|---|
| TSL-001 | S2 | Featured cards on the home page displayed an inactive save action | Connected them to the shared saved-property state |
| TSL-002 | S2 | Search sort control did not reorder result records | Applied sort order to the filtered rows |
| TSL-003 | S2 | Save search only showed a temporary informational notice | Added browser-local saved searches, restore and remove actions |

## Not yet verified

No claim is made that the application is defect-free until the pushed GitHub Actions build and Playwright run complete. Visual QA, keyboard-only testing, a screen-reader pass and isolated Chrome DevTools inspection remain pending unless evidenced by a later CI or browser report.

## Product/data limitations (not defects in this preview)

- Inventory, prices, addresses and amenities are illustrative.
- Map positions are approximate and do not represent survey-grade parcel boundaries.
- Browser-local saved data does not sync across devices.
- Saved searches do not send notifications.
- Enquiry forms do not contact an agent.

| TSL-004 | S3 | Playwright navigation selectors matched duplicate Saved homes buttons in the header and footer | Scoped navigation actions to the banner/header landmark |
