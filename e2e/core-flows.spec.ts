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

test('home search opens the Kigali map and listing results', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Taiseel/);
  await expect(page.getByRole('heading', { name: /Find a place to belong in Rwanda/i })).toBeVisible();
  await page.getByRole('button', { name: 'Search', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: /Find homes in Kigali/i })).toBeVisible();
  await expect(page.getByLabel('Map of sample Kigali properties')).toBeVisible();
  await expect(page.getByText(/Preview data only/)).toBeVisible();
});

test('search filters narrow the list by neighbourhood', async ({ page }) => {
  await page.goto('/search', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Search neighbourhood').fill('Kacyiru');
  await expect(page.getByText('Bright apartment close to the city')).toBeVisible();
  await expect(page.getByText('Quiet family villa with garden')).toHaveCount(0);
});

test('a home can be saved and revisited', async ({ page }) => {
  await page.goto('/search', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Save home' }).first().click();
  await page.getByRole('banner').getByRole('button', { name: 'Saved homes' }).click();
  await expect(page.getByRole('heading', { name: /Places worth keeping/i })).toBeVisible();
  await expect(page.getByText('Quiet family villa with garden')).toBeVisible();
});

test('property details explain that the listing is illustrative', async ({ page }) => {
  await page.goto('/search', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /View Quiet family villa with garden/i }).click();
  await expect(page.getByRole('heading', { name: 'Quiet family villa with garden' })).toBeVisible();
  await expect(page.getByText('Illustrative listing')).toBeVisible();
  await expect(page.getByText(/ownership, title, planning status/)).toBeVisible();
  await page.getByRole('button', { name: /Contact about this place/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText(/does not transmit personal information/i)).toBeVisible();
});

test('home featured listings can be saved', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Save home' }).first().click();
  await page.getByRole('banner').getByRole('button', { name: 'Saved homes' }).click();
  await expect(page.getByRole('heading', { name: 'Quiet family villa with garden' })).toBeVisible();
});

test('sort order changes the first search result', async ({ page }) => {
  await page.goto('/search', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Sort listings').selectOption('price-low');
  await expect(page.getByRole('article').first()).toHaveAttribute('aria-label', /Hillside home with open views/);
});

test('saved searches persist and can be reopened', async ({ page }) => {
  await page.goto('/search', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Search neighbourhood').fill('Kacyiru');
  await page.getByRole('button', { name: 'Save search' }).click();
  await expect(page.getByText('Stored on this device.')).toBeVisible();
  await page.reload();
  await page.getByRole('banner').getByRole('button', { name: 'Saved homes' }).click();
  await expect(page.getByRole('heading', { name: 'Saved searches' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Kacyiru' })).toBeVisible();
  await page.getByRole('button', { name: 'View results' }).click();
  await expect(page.getByLabel('Search neighbourhood')).toHaveValue('Kacyiru');
  await expect(page.getByText('Bright apartment close to the city')).toBeVisible();
});

test('mobile search can switch between results and the map', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/search', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Map', exact: true }).click();
  await expect(page.getByLabel('Map of sample Kigali properties')).toBeVisible();
  await page.getByRole('button', { name: 'List', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Find homes in Kigali/i })).toBeVisible();
});
