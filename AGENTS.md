# Working rules for Taiseel

## Product boundary
- Build a Rwanda-first property discovery product, not a copy of Zillow's brand.
- Recreate useful user-facing behaviour from public references using original code, wording, visual identity and licensed media.
- Never copy competitor source, images, logo, proprietary copy, private APIs, or scraped listing data.
- Treat all preview property data and prices as fictional. Never present them as verified inventory, valuation or market statistics.

## Engineering rules
- Think before coding. State assumptions and tradeoffs in project docs when they affect architecture.
- Prefer the smallest complete change. Do not refactor unrelated code.
- Build in thin slices. Every screen should have loading, empty, error and responsive states where relevant.
- Use semantic HTML, keyboard-accessible controls and visible focus states.
- Keep user-facing copy short and factual.
- Run npm run build and npm run test:e2e before calling a release verified.
- Use Playwright role/label selectors. Fail tests on app console errors and same-origin 5xx responses.

## Data and privacy
- Do not add API keys or secrets to the repository.
- Do not collect or transmit demo form data.
- Persist demo favourites only in browser local storage.
- Connect verified sources and data provenance before removing the sample-data notice.

## Deployments
- Vercel Git project should point to this repository and deploy main.
- A preview deployment is the default verification target. Do not remove the sample-data notice or represent the preview as a live marketplace.
