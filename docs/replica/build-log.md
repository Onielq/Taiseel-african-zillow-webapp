# Build log

## 2026-11-09 — Discovery and shortlist slice

- Audited the source and target repositories through the GitHub integration.
- Confirmed the source repository is a screenshot archive, not a runnable app.
- Confirmed the destination is an existing React/Vite preview with Playwright Test and CI browser installation already configured.
- Made featured-home favourites functional using the existing shared local state.
- Implemented result sorting (price ascending/descending, bedroom count and floor/plot area).
- Implemented browser-local saved searches, duplicate prevention, reopening of saved filters and removal.
- Added accessible names for listing cards.
- Added Playwright regression tests for home favourites, sorting, saved-search persistence and mobile map/list switching.
- Updated the clean-room recon, feature matrix, architecture, test plan and QA notes.

### Verification status

Changes are committed to `main` after the atomic Git update. Local build and local Chromium execution are not claimed because this execution environment cannot reach the package registry or GitHub host. The repository CI workflow is the authoritative runtime check and must be inspected after the commit.

## CI selector correction

- First GitHub Actions run: TypeScript/Vite build passed; 5 of 8 Playwright tests passed.
- Three failures had the same strict-mode locator cause: a header navigation action and a footer navigation action shared the accessible name.
- Updated those test actions to locate the navigation control inside the banner landmark. This is a test-only correction; the runtime app build was already successful.

## Home favourite assertion refinement

- The remaining Playwright failure was a test expectation mismatch, not a save-state failure: listing titles are intentionally buttons that open detail pages, not heading elements.
- Updated the regression assertion to locate the listing title button by its accessible name.

- Refined the home favourite test one more time to require an exact title-button name, avoiding a partial match against the adjacent "View [listing]" photo action.
