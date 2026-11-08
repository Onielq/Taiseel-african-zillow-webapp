# Verification plan

## Automated browser suite

The Playwright Test suite is run by GitHub Actions after Chromium installation. Current end-to-end cases cover:

- Home page title and primary search route.
- Search page map/list and demo-data notice.
- Neighbourhood filtering.
- Save and revisit a listing from search.
- Open a property detail and check its illustrative-data and enquiry disclaimers.
- Save a featured home from the home page.
- Sort results by asking-price example.
- Persist and reopen a saved search.
- Switch mobile search between list and map.

Each test page watches for application-origin console errors and 5xx responses. Selectors use roles and labels rather than styling classes.

## Local commands

```bash
npm install
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

Playwright Test is already a declared development dependency; CI installs the matching Chromium browser binary.

## Manual release checks still required

- Visual pass at desktop and phone widths using an isolated browser profile.
- Keyboard-only traversal and screen-reader review.
- Map tile attribution, rate limits and mobile map usability.
- Image licensing, accessibility text and long-term media availability.
- Security/privacy review before adding accounts, saved-search alerts or enquiry transmission.
- Data provenance, verification and publishing rights for every live property field.

## Tool availability note

The reference REA and Chrome DevTools MCP repositories were inspected for their workflows, and the project MCP config contains Context7 and isolated Chrome DevTools entries. Their live MCP browser tools were not exposed in this execution environment. No live browser inspection of Zillow is claimed.
