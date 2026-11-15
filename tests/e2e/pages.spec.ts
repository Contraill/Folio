/* Every page in a real browser: no errors, nothing wider than the screen, on a desktop and on a phone; the languages
   and the 404 page. */
import { test, expect } from './access';
import { PAGES } from './site';

for (const [name, viewport] of [['desktop', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844 }]] as const) {
  test(`every page loads without errors and fits a ${name} screen`, async ({ page }) => {
    test.slow();
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    for (const path of PAGES) {
      await page.goto(path);
      // Through the page, so lazy images and everything that reveals itself on scroll has appeared.
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      expect(overflow, `${path} is wider than the screen`).toBeLessThanOrEqual(1);
    }
    expect(errors).toEqual([]);
  });
}

test('the home page in both languages @smoke', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('İzzet');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.goto('/tr');
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
  await expect(page.locator('#work h2')).toHaveText('Öne çıkan projeler');
});

test('a project page has its case study in order', async ({ page }) => {
  await page.goto('/projects/helios');
  await expect(page.locator('.case-sec h2')).toHaveText(['Overview', 'Why I built it', 'What I built', 'The hard part', 'Result', 'Screens']);
  await page.goto('/tr/projects/nodesk');
  await expect(page.locator('.case-sec h2')).toHaveText(['Genel bakış', 'Neden yaptım', 'Neler yaptım', 'En zor kısım', 'Sonuç']);
});

test('a Turkish browser gets /tr on its first visit; a choice made with the language link wins after that', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'tr-TR' });
  const page = await context.newPage();
  await page.goto('/projects/helios');
  await expect(page).toHaveURL(/\/tr\/projects\/helios$/);
  await page.locator('header .lang').click();
  await expect(page).toHaveURL(/\/projects\/helios$/);
  await page.goto('/');
  await expect(page).toHaveURL(/\/$/);
  await context.close();
});

test('the 404 page prints the missing address and leads back home', async ({ page }) => {
  await page.goto('/tr/eski/bir-sayfa');
  await expect(page.locator('.lost-err')).toContainText('böyle bir dosya ya da dizin yok: /tr/eski/bir-sayfa');
  await page.locator('.lost .btn-1').click();
  await expect(page).toHaveURL(/\/tr$/);
});

test('the 404 page suggests the page a near miss was meant for', async ({ page }) => {
  await page.goto('/projects/helio');
  await expect(page.locator('[data-suggest-link]')).toHaveAttribute('href', '/projects/helios');
  await page.goto('/tr/projeler');
  await expect(page.locator('[data-suggest-link]')).toHaveAttribute('href', '/tr#work');
  await page.goto('/tamamen/rastgele');
  await expect(page.locator('[data-suggest]')).toBeHidden();
});
