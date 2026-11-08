# Verification plan

## Playwright coverage
- Home title and primary search route.
- Map/list results render, with an explicit sample-data notice.
- Neighbourhood query narrows visible results.
- Save a listing and revisit it in Saved places.
- Open a listing detail and confirm the demo-data and enquiry disclaimers.

## CI quality gate
GitHub Actions installs dependencies, installs Chromium, runs the TypeScript/Vite production build and executes the Playwright end-to-end suite on pushes and pull requests targeting main.

## Manual release checks still required
- Verify the app on a real desktop and phone viewport.
- Inspect map tile attribution and rate-limit-safe usage.
- Check keyboard traversal and a screen-reader pass.
- Review image source licensing and long-term availability.
- Connect live data only after validation, provenance and privacy rules are implemented.
