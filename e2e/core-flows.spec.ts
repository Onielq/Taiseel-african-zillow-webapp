import { expect, test, type Page } from '@playwright/test';

const pageErrors = new WeakMap<Page, { console: string[]; server: string[] }>();

test.beforeEach(async ({ page }) => {
  const errors = { console: [] as string[], server: [] as string[] };
  pageErrors.set(page, errors);
  page.on('console', message => {
    const location = message.location().url;
    if (message.type() === 'error' && location.startsWith('http://127.0.0.1:4173')) {
      errors.console.push(message.text());
    }
  });
  page.on('response', response => {
    if (response.url().startsWith('http://127.0.0.1:4173') && response.status() >= 500) {
      errors.server.push(response.url() + ' returned ' + response.status());
    }
  });
});

test.afterEach(async ({ page }) => {
  const errors = pageErrors.get(page);
  expect(errors?.server ?? []).toEqual([]);
  expect(errors?.console ?? []).toEqual([]);
});

test('home follows the supplied landing-page structure and searches Rwanda', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Taiseel/);
  const home = page.frameLocator('iframe[title="Taiseel home"]');
  await expect(home.locator('.hero-title')).toContainText('Homes. Land.');
  await expect(home.getByRole('heading', { name: 'Get home recommendations' })).toBeVisible();
  await expect(home.getByRole('heading', { name: /Find homes you can afford/ })).toBeVisible();
  await expect(home.getByRole('heading', { name: 'Buy a home' })).toBeVisible();
  await home.locator('#taiseelHeroSearch').fill('Kacyiru');
  await Promise.all([
    page.waitForURL(/\/search\?/),
    home.getByRole('button', { name: 'Search' }).click()
  ]);
  const search = page.frameLocator('iframe[title="Taiseel search"]');
  await expect(search.locator('#mapFrame')).toBeVisible();
  await expect(search.locator('.results-panel')).toBeVisible();
  await expect(search.locator('#searchInput')).toHaveValue('Kacyiru');
});

test('Rwanda search filters cards by neighbourhood', async ({ page }) => {
  await page.goto('/search', { waitUntil: 'domcontentloaded' });
  const search = page.frameLocator('iframe[title="Taiseel search"]');
  await expect(search.locator('#mapFrame')).toBeVisible();
  await search.locator('#searchInput').fill('Kacyiru');
  await expect(search.locator('.listing-card:not([hidden])')).toHaveCount(1);
  await expect(search.locator('[data-property-id="kacyiru-apartment"]')).toBeVisible();
  await expect(search.locator('[data-property-id="nyarutarama-villa"]')).toBeHidden();
});

test('a property can be saved and revisited from the saved page', async ({ page }) => {
  await page.goto('/search', { waitUntil: 'domcontentloaded' });
  const search = page.frameLocator('iframe[title="Taiseel search"]');
  await search.locator('[data-property-id="nyarutarama-villa"] .listing-heart').click();
  await Promise.all([
    page.waitForURL(/\/saved$/),
    search.locator('a.saved-label').click()
  ]);
  await expect(page.getByRole('heading', { name: /Places worth keeping/ })).toBeVisible();
  await expect(page.getByText('Quiet family villa with garden')).toBeVisible();
});

test('a search listing opens its matching property details', async ({ page }) => {
  await page.goto('/search', { waitUntil: 'domcontentloaded' });
  const search = page.frameLocator('iframe[title="Taiseel search"]');
  await Promise.all([
    page.waitForURL(/\/property\/nyarutarama-villa$/),
    search.locator('[data-property-id="nyarutarama-villa"]').click()
  ]);
  await expect(page.getByRole('heading', { name: 'Quiet family villa with garden' })).toBeVisible();
  await expect(page.getByText('Illustrative listing')).toBeVisible();
  await expect(page.getByText(/ownership, title, planning status/)).toBeVisible();
});

test('the map page preserves its filter dropdowns and sorting controls', async ({ page }) => {
  await page.goto('/search', { waitUntil: 'domcontentloaded' });
  const search = page.frameLocator('iframe[title="Taiseel search"]');
  await search.locator('#bbBtn').click();
  await expect(search.locator('#bbPanel')).toHaveClass(/open/);
  await search.locator('#bbBtn').click();
  await search.locator('#sortListings').selectOption('price-low');
  await expect(search.locator('.listing-card:not([hidden])').first()).toHaveAttribute('data-property-id', 'rebero-home');
  await search.locator('#forsaleBtn').click();
  await search.locator('input[name="listingType"][value="For rent"]').check();
  await search.locator('#forsalePanel .dp-apply').click();
  await expect(search.locator('.listing-card:not([hidden])')).toHaveCount(1);
  await expect(search.locator('[data-property-id="kicukiro-rental"]')).toBeVisible();
});

test('saved searches persist and reopen inside the Rwanda search layout', async ({ page }) => {
  await page.goto('/search', { waitUntil: 'domcontentloaded' });
  const search = page.frameLocator('iframe[title="Taiseel search"]');
  await search.locator('#searchInput').fill('Kacyiru');
  await search.locator('#saveSearchButton').click();
  await expect(search.locator('#saveSearchButton')).toHaveText('Search saved');
  await Promise.all([
    page.waitForURL(/\/saved$/),
    search.locator('a.saved-label').click()
  ]);
  await expect(page.getByRole('heading', { name: 'Saved searches' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Kacyiru' })).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/search$/),
    page.getByRole('button', { name: 'View results' }).click()
  ]);
  const reopened = page.frameLocator('iframe[title="Taiseel search"]');
  await expect(reopened.locator('#searchInput')).toHaveValue('Kacyiru');
  await expect(reopened.locator('[data-property-id="kacyiru-apartment"]')).toBeVisible();
});

test('the search page stacks the map above listings on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/search', { waitUntil: 'domcontentloaded' });
  const search = page.frameLocator('iframe[title="Taiseel search"]');
  await expect(search.locator('.map-wrap')).toBeVisible();
  await expect(search.locator('.listing-card:not([hidden])').first()).toBeVisible();
  await expect(search.locator('.results-panel')).toBeVisible();
});
test('the Land category returns the two Kigali plot examples', async ({ page }) => {
  await page.goto('/search?category=Land', { waitUntil: 'domcontentloaded' });
  const search = page.frameLocator('iframe[title="Taiseel search"]');
  await expect(search.locator('.listing-card:not([hidden])')).toHaveCount(2);
  await expect(search.locator('[data-property-id="kagarama-land"]')).toBeVisible();
  await expect(search.locator('[data-property-id="gahanga-land"]')).toBeVisible();
});

test('the Land Intelligence MapLibre map mounts inside the reference map proportions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/search', { waitUntil: 'domcontentloaded' });
  const search = page.frameLocator('iframe[title="Taiseel search"]');
  await expect(search.locator('#mapFrame')).toBeVisible();
  const map = search.frameLocator('iframe[title="Taiseel Rwanda Land Intelligence map"]');
  await expect(map.locator('.maplibre-mount')).toBeVisible();
  await expect(map.locator('.maplibregl-canvas')).toBeVisible();
  await expect(map.locator('.map-engine-status-dot.ready')).toBeVisible({ timeout: 30000 });
  const ratio = await search.locator('.map-wrap').evaluate(element => element.getBoundingClientRect().width / window.innerWidth);
  expect(ratio).toBeGreaterThan(0.55);
  expect(ratio).toBeLessThan(0.65);
  await search.locator('#schoolsBtn').click();
  await expect(search.locator('#mapLayerPanel')).toBeVisible();
  await search.locator('input[data-map-layer="healthEducation"]').check();
  await search.locator('#drawBtn').click();
  await expect(map.locator('.map-draw-hint')).toBeVisible();
  await search.locator('#drawBtn').click();
  await expect(map.locator('.map-draw-hint')).toHaveCount(0);
  await search.locator('#mapTypeSelect').selectOption('satellite');
  await expect(map.locator('.maplibregl-canvas')).toBeVisible();
});

test('the search page preserves the map-first mobile scaffold', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/search', { waitUntil: 'domcontentloaded' });
  const search = page.frameLocator('iframe[title="Taiseel search"]');
  const map = search.frameLocator('iframe[title="Taiseel Rwanda Land Intelligence map"]');
  await expect(search.locator('.map-wrap')).toBeVisible();
  await expect(map.locator('.maplibre-mount')).toBeVisible();
  await expect(search.locator('.results-panel')).toBeVisible();
  const widths = await Promise.all([
    search.locator('.map-wrap').evaluate(element => element.getBoundingClientRect().width),
    search.locator('.results-panel').evaluate(element => element.getBoundingClientRect().width)
  ]);
  expect(widths[0]).toBeGreaterThan(0);
  expect(widths[1]).toBeGreaterThan(0);
});
