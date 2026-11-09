import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const pageErrors = new WeakMap<Page, { console: string[]; server: string[] }>();

test.beforeEach(async ({ page }) => {
  // The Vite preview serves the frontend only. Stub the same-origin Vercel
  // geography API with small synthetic polygons so the map interaction tests
  // exercise the real MapLibre rendering without contacting public GIS servers.
  await page.route('**/api/geography/areas**', async route => {
    const requestUrl = new URL(route.request().url());
    const level = requestUrl.searchParams.get('level') || 'district';
    const source = requestUrl.searchParams.get('source') || 'kigali';
    const district = source === 'bugesera' ? 'Bugesera' : 'Gasabo';
    const bounds: Record<string, [number, number, number, number]> = {
      district: source === 'bugesera' ? [30.00, -2.34, 30.28, -2.12] : [30.00, -2.14, 30.28, -1.90],
      sector: [30.08, -2.18, 30.20, -2.02],
      cell: [30.10, -2.15, 30.16, -2.07],
      village: [30.12, -2.13, 30.15, -2.09],
      parcel: [30.128, -2.108, 30.132, -2.104]
    };
    const [west, south, east, north] = bounds[level] || bounds.district;
    const id = source + '-' + level + '-e2e';
    const properties: Record<string, unknown> = {
      map_feature_id: id,
      level,
      province: source === 'bugesera' ? 'Eastern Province' : 'Kigali City',
      district,
      district_id: district.toLowerCase(),
      sector: 'Kacyiru',
      sector_id: 'kacyiru',
      cell: 'Kamatamu',
      cell_id: 'kamatamu',
      village: 'Kamatamu A',
      village_id: 'kamatamu-a',
      upi: 'E2E-UPI-0001',
      parcel_number: '01',
      parcel_size_m2: 500,
      average_land_price_per_m2: source === 'bugesera' ? 4038 : 36103,
      average_transaction_price_per_m2: source === 'bugesera' ? 4038 : 36103,
      average_land_price_source: 'E2E fixture only',
      parcel_price_type: 'calculated-asking-price',
      source_label: 'E2E synthetic fixture only',
      source_type: level === 'parcel' ? 'cadastral-parcel' : 'administrative-boundary'
    };
    await route.fulfill({
      status: 200,
      contentType: 'application/geo+json',
      body: JSON.stringify({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          id,
          properties,
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [west, south], [east, south], [east, north],
              [west, north], [west, south]
            ]]
          }
        }]
      })
    });
  });
  await page.route('**/api/geography/places**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/geo+json',
      body: JSON.stringify({ type: 'FeatureCollection', features: [] })
    });
  });
  await page.route('**/api/geography/zoning**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/geo+json',
      body: JSON.stringify({ type: 'FeatureCollection', features: [] })
    });
  });

  const errors = { console: [] as string[], server: [] as string[] };
  pageErrors.set(page, errors);
  page.on('console', message => {
    const location = message.location().url;
    const isKnownHeadlessWebGlWarning = message.text().includes('GL Driver Message (OpenGL, Performance');
    if (message.type() === 'error' && location.startsWith('http://127.0.0.1:4173') && !isKnownHeadlessWebGlWarning) {
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

test('capture reference-fidelity screenshots at desktop, tablet and mobile widths', async ({ page }) => {
  const output = 'test-results/visual-review';
  await mkdir(output, { recursive: true });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const home = page.frameLocator('iframe[title="Taiseel home"]');
  await expect(home.locator('.hero-title')).toBeVisible();
  await page.screenshot({ path: output + '/home-desktop-1440.png', fullPage: true });

  await page.goto('/search', { waitUntil: 'domcontentloaded' });
  const search = page.frameLocator('iframe[title="Taiseel search"]');
  const map = search.frameLocator('iframe[title="Taiseel Rwanda Land Intelligence map"]');
  await expect(map.locator('.maplibre-mount')).toBeVisible();
  await expect(map.locator('.map-engine-status-dot.ready')).toBeVisible({ timeout: 30000 });
  await page.screenshot({ path: output + '/search-desktop-1440.png', fullPage: true });
  await search.locator('#priceBtn').click();
  await expect(search.locator('#pricePanel')).toHaveClass(/open/);
  await page.screenshot({ path: output + '/search-price-filter-1440.png', fullPage: true });
  await search.locator('#priceBtn').click();

  await page.setViewportSize({ width: 768, height: 900 });
  await page.waitForTimeout(350);
  await page.screenshot({ path: output + '/search-tablet-768.png', fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(350);
  await page.screenshot({ path: output + '/search-mobile-390.png', fullPage: true });
});
