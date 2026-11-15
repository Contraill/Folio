/* The parts that respond: the terminal, Mochi, the CV viewer and the hero's constellation. */
import { test, expect } from './access';

test('the terminal answers help, an unknown command and opens a project @smoke', async ({ page }) => {
  await page.goto('/');
  const input = page.locator('.term-in');
  await input.fill('help');
  await input.press('Enter');
  await expect(page.locator('.term-out')).toContainText('open <name>');
  await input.fill('frobnicate');
  await input.press('Enter');
  await expect(page.locator('.term-out')).toContainText('Unknown command: frobnicate');
  await input.fill('open helios');
  await input.press('Enter');
  await expect(page).toHaveURL(/\/projects\/helios$/);
});

test('Mochi in the hero answers a poke', async ({ page }) => {
  await page.goto('/');
  const mochi = page.locator('.hero [data-mochi]');
  // It floats, so the click is sent to wherever it is.
  await mochi.click({ force: true });
  await expect(mochi).toHaveClass(/is-happy/);
});

test('the CV viewer shows the page, zooms and switches language', async ({ page }) => {
  await page.goto('/cv');
  const img = page.locator('[data-cv] .cv-page img').first();
  await expect(img).toBeVisible();
  expect(await img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
  await page.locator('[data-cv-zoom="in"]').click();
  await expect(page.locator('.cv-level')).toHaveText('125%');
  await page.locator('[data-cv-lang="tr"]').click();
  await expect(page.locator('[data-cv-lang="tr"]')).toHaveAttribute('aria-pressed', 'true');
});

test('the constellation behind Mochi draws', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('.hero canvas.sky');
  await expect.poll(() => canvas.evaluate((c: HTMLCanvasElement) => {
    const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    let lit = 0;
    for (let i = 3; i < d.length; i += 64) if (d[i] > 8) lit++;
    return lit;
  }), { timeout: 5000 }).toBeGreaterThan(100);
});

test('the contact heading is written in koi food, and the text stays for screen readers', async ({ page }) => {
  await page.goto('/tr');
  await expect(page.locator('#contact-h')).toContainText('Tanışalım.');
  await page.locator('#contact').scrollIntoViewIfNeeded();
  // The food's warm yellow, which nothing else in the aquarium uses.
  await expect.poll(() => page.locator('#contact canvas.aquarium').evaluate((c: HTMLCanvasElement) => {
    const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    let food = 0;
    for (let i = 0; i < d.length; i += 16) if (d[i] > 200 && d[i + 1] > 180 && d[i + 2] > 120 && d[i + 2] < 190 && d[i + 3] > 200) food++;
    return food;
  }), { timeout: 5000 }).toBeGreaterThan(200);
});
