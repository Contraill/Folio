import type { Page } from '@playwright/test';
import { expect, test } from './access';

const settled = (page: Page) => page.waitForFunction(() => !document.documentElement.classList.contains('intro'), undefined, { timeout: 5000 });
async function watchForProblems(page: Page) {
  await page.addInitScript(() => document.addEventListener('securitypolicyviolation', (e) => console.error(`CSP ${e.violatedDirective} ${e.blockedURI}`)));
  const problems: string[] = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('404')) problems.push(`console: ${m.text()}`); });
  return problems;
}

const ROUTES = ['/', '/projects', '/projects/helios', '/projects/mochi', '/projects/huepr', '/projects/orbis', '/projects/bct', '/lab', '/play', '/about', '/cv', '/uses', '/now', '/secret'];

test.describe('every page', () => {
  for (const route of ROUTES) {
    test(`${route} renders on desktop and phone width without problems`, async ({ page }) => {
      const problems = await watchForProblems(page);
      for (const width of [1440, 390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route);
        await expect(page.locator('main h1').first()).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
        // Lazy images still loading would be cut off by the next navigation, which Firefox reports as corrupt.
        await page.waitForLoadState('networkidle');
      }
      expect(problems).toEqual([]);
    });
  }

  test('every page is complete without JavaScript', async ({ browser, baseURL }) => {
    test.slow(); // one test for every page: close to the default timeout against a deployed Preview
    const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
    const page = await context.newPage();
    for (const route of ROUTES) {
      await page.goto(route);
      await expect(page.locator('main h1').first()).toBeVisible();
      for (const el of await page.locator('[data-reveal]').all()) await expect(el).toHaveCSS('opacity', '1');
    }
    await context.close();
  });

  test('Turkish pages are translated, with a correct dotted capital', async ({ page }) => {
    await page.goto('/?lang=tr');
    await expect(page.locator('h1')).toContainText('Tepki veren');
    await page.goto('/about?lang=tr');
    await expect(page.locator('main h1')).toContainText('Merhaba, ben İzzet Can');
    await page.goto('/projects/helios?lang=tr');
    await expect(page.locator('main')).toContainText('İnsan ölçeğinde gezegen bilimi');
    await page.goto('/lab?lang=tr');
    await expect(page.locator('main')).toContainText('burada neler olacak');
  });

  test('Turkish text fits on small screens too', async ({ browser, baseURL }) => {
    test.slow();
    const context = await browser.newContext({ baseURL, locale: 'tr-TR' });
    const page = await context.newPage();
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 800 });
      for (const route of ROUTES) {
        await page.goto(route);
        expect(await page.evaluate(() => document.documentElement.scrollWidth), `${route} at ${width}`).toBeLessThanOrEqual(width);
      }
    }
    await context.close();
  });

  for (const locale of ['en-US', 'tr-TR']) {
    test(`headlines fit their masks in ${locale}`, async ({ browser, baseURL }) => {
      test.slow();
      const context = await browser.newContext({ baseURL, locale });
      const page = await context.newPage();
      for (const width of [1440, 768, 390, 320]) {
        await page.setViewportSize({ width, height: 800 });
        for (const route of ['/', '/projects', '/projects/huepr']) {
          await page.goto(route);
          await page.evaluate(() => document.fonts.ready);
          await page.waitForTimeout(150);
          const clipped = await page.locator('.ln').evaluateAll((lines) => lines.filter((l) => l.scrollWidth > l.clientWidth + 1).map((l) => l.textContent));
          expect(clipped, `${route} at ${width}`).toEqual([]);
        }
      }
      await context.close();
    });
  }
});

test.describe('unlisted pages', () => {
  for (const route of ['/uses', '/now', '/secret']) {
    test(`${route} works by direct link but stays out of indexes and navigation`, async ({ page, request }) => {
      await page.goto(route);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
      await expect(page.locator(`.navcap a[href="${route}"], .foot a[href="${route}"]`)).toHaveCount(0);
      const index = await (await request.get('/search-index.json')).text();
      expect(index).not.toContain(route);
    });
  }

  test('only published projects are reachable; candidates stay out of every listing', async ({ request }) => {
    expect((await request.get('/projects/does-not-exist')).status()).toBe(404);
    expect((await request.get('/projects/nodesk')).status()).toBe(404);
    expect(await (await request.get('/search-index.json')).text()).not.toContain('Nodesk');
    expect(await (await request.get('/projects')).text()).not.toContain('Nodesk');
    expect((await request.get('/admin')).status()).toBe(404);
  });
});

test.describe('home', () => {
  test('the hero advances, pauses and keeps its stages reachable', async ({ page }) => {
    const problems = await watchForProblems(page);
    await page.goto('/');
    await settled(page);
    await expect(page.locator('.hero-card h2')).toHaveText('Helios');
    await page.getByRole('button', { name: 'Next project' }).click();
    await expect(page.locator('.hero-card h2')).toHaveText('huepr');
    await page.getByRole('button', { name: 'Wallpaper: Bloom' }).click();
    await expect(page.locator('.tv-head b')).toHaveText('Bloom');
    await page.getByRole('button', { name: 'Next project' }).click();
    await expect(page.locator('.hero-card h2')).toHaveText('Mochi');
    await page.locator('.layer.on').getByRole('button', { name: 'Poke' }).click();
    await expect(page.locator('.layer.on .mood')).toContainText('poked');
    await page.getByRole('button', { name: 'Pause the slideshow and animations' }).click();
    await expect(page.locator('.hero')).toHaveClass(/is-paused/);
    await expect(page.getByRole('button', { name: 'Play the slideshow and animations' })).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('the orrery can be explored from the keyboard', async ({ page }) => {
    await page.goto('/');
    await settled(page);
    await page.locator('.orrery').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.hero .sr[aria-live="polite"]').first()).toContainText('Mercury: one orbit = 88 days');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.hero .sr[aria-live="polite"]').first()).toContainText('Venus');
  });

  test('on a phone the wallpaper picker is fully inside the visible stage', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto('/');
    await settled(page);
    await page.getByRole('button', { name: 'Next project' }).click();
    const picker = page.getByRole('button', { name: 'Wallpaper: Bloom' });
    await expect(picker).toBeVisible();
    const button = (await picker.boundingBox())!;
    const card = (await page.locator('.hero-card .in').boundingBox())!;
    expect(button.y + button.height).toBeLessThan(card.y);
    await context.close();
  });

  test('a card morphs into the case study and back', async ({ page }) => {
    await page.goto('/projects');
    await settled(page);
    await page.evaluate(() => {
      const seen = new Set<string>();
      (window as never as { seen: Set<string> }).seen = seen;
      const sample = () => { document.getAnimations().forEach((a) => { const pseudo = (a.effect as KeyframeEffect | null)?.pseudoElement; if (pseudo) seen.add(pseudo); }); requestAnimationFrame(sample); };
      sample();
    });
    const seen = () => page.evaluate(() => [...(window as never as { seen: Set<string> }).seen]);
    await page.locator('.gcard[href="/projects/helios"]').click();
    await expect(page).toHaveURL(/\/projects\/helios$/);
    await expect.poll(seen).toContain('::view-transition-group(media)');
    await page.evaluate(() => (window as never as { seen: Set<string> }).seen.clear());
    await page.waitForTimeout(900);
    await page.locator('.crumbs nav a').click();
    await expect(page).toHaveURL(/\/projects$/);
    await expect.poll(seen).toContain('::view-transition-group(media)');
  });
});

test.describe('projects', () => {
  test('filters stay on the page, keep a shareable URL and follow history', async ({ page }) => {
    const problems = await watchForProblems(page);
    await page.goto('/projects');
    await settled(page);
    const total = await page.locator('.gcard').count();
    expect(total).toBe(7);
    await page.evaluate(() => { (window as never as { marker: Element }).marker = document.querySelector('main')!; });
    await page.locator('.filters a', { hasText: 'Hardware' }).click();
    await expect(page).toHaveURL(/\?area=hardware$/);
    await expect(page.locator('.gcard')).toHaveCount(1);
    expect(await page.evaluate(() => (window as never as { marker: Element }).marker === document.querySelector('main'))).toBe(true);
    await page.goBack();
    await expect(page.locator('.gcard')).toHaveCount(7);
    await expect(page).toHaveURL(/\/projects$/);
    // Long enough for a router page swap to have happened, if one was wrongly started.
    await page.waitForTimeout(1200);
    expect(await page.evaluate(() => (window as never as { marker: Element }).marker === document.querySelector('main'))).toBe(true);
    expect(problems).toEqual([]);
  });

  test('a filtered link opens filtered', async ({ page }) => {
    await page.goto('/projects?area=hardware');
    await expect(page.locator('.gcard')).toHaveCount(1);
    await expect(page.locator('.filters a[aria-current="page"]')).toContainText('Hardware');
  });

  test('returning from a project restores the filter it was opened from', async ({ page }) => {
    await page.goto('/projects');
    await settled(page);
    await page.locator('.filters a', { hasText: 'Hardware' }).click();
    await expect(page.locator('.gcard')).toHaveCount(1);
    await page.locator('.gcard').click();
    await expect(page).toHaveURL(/\/projects\/mochi$/);
    await expect(page.locator('.crumbs')).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\?area=hardware$/);
    await expect(page.locator('.gcard')).toHaveCount(1);
    await expect(page.locator('.crumbs')).toHaveCount(0);
    await page.goBack();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.locator('.gcard')).toHaveCount(7);
    await page.goForward();
    await expect(page).toHaveURL(/\?area=hardware$/);
    await expect(page.locator('.gcard')).toHaveCount(1);
  });

  test('the index view is remembered', async ({ page }) => {
    await page.goto('/projects');
    await settled(page);
    await page.getByRole('button', { name: 'Index view' }).click();
    await expect(page.locator('.ix tbody tr')).toHaveCount(7);
    await page.reload();
    await expect(page.locator('.ix tbody tr')).toHaveCount(7);
  });
});

test.describe('case studies', () => {
  test('gallery, lightbox and sections work', async ({ page }) => {
    const problems = await watchForProblems(page);
    await page.goto('/projects/helios');
    await settled(page);
    await expect(page.locator('.cmedia > .cut-fill')).toHaveCSS('clip-path', /^path/);
    await page.locator('.thumbs button').nth(1).click();
    await expect(page.locator('.thumbs button').nth(1)).toHaveAttribute('aria-pressed', 'true');
    const opener = page.getByRole('button', { name: 'Enlarge screen' });
    await opener.click();
    await expect(page.locator('.ov-lightbox img')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.ov-lightbox')).toHaveCount(0);
    await expect(opener).toBeFocused();
    await page.locator('.collage button').first().click();
    await expect(page.locator('.ov-lightbox img')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.locator('.acc button').nth(1).click();
    await expect(page.locator('.acc button').nth(1)).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.md h3')).toHaveText('JPL Horizons');
    expect(problems).toEqual([]);
  });

  test('previous and next move sideways, the top bar links to the repository', async ({ page }) => {
    await page.goto('/projects/helios');
    await settled(page);
    await expect(page.locator('.tools a[aria-label="Repository on GitHub"]')).toHaveAttribute('href', 'https://github.com/Contraill/Helios');
    await page.locator('.crumbs a.circle').nth(1).click();
    await expect(page).toHaveURL(/\/projects\/nothing$/);
    await expect(page.locator('html')).toHaveAttribute('data-dir', 'fwd');
    await expect(page.locator('.tools a[aria-label="Repository on GitHub"]')).toHaveAttribute('href', 'https://github.com/Contraill/Nothing-Kde-Theme');
    await page.locator('.crumbs a.circle').nth(0).click();
    await expect(page).toHaveURL(/\/projects\/helios$/);
    await expect(page.locator('html')).toHaveAttribute('data-dir', 'back');
  });

  test('projects without a write-up still make sense', async ({ page }) => {
    await page.goto('/projects/orbis');
    await expect(page.locator('main')).toContainText('From the README');
  });
});

test.describe('lab and play', () => {
  test('the Lab stage draws and its controls respond', async ({ page }) => {
    const problems = await watchForProblems(page);
    await page.goto('/lab');
    await settled(page);
    const canvas = page.locator('.field');
    await expect.poll(() => canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL().length)).toBeGreaterThan(5000);
    await page.getByRole('button', { name: 'Pause' }).click();
    await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
    await page.getByRole('button', { name: 'New Surface' }).click();
    await page.getByRole('button', { name: 'Drop Explorers' }).click();
    expect(problems).toEqual([]);
  });

  test('Lab and Play controls are full size on a phone', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto('/lab');
    for (const button of await page.locator('.lab-tools button').all()) expect((await button.boundingBox())!.height).toBeGreaterThan(43.9);
    await page.goto('/play');
    for (const button of await page.locator('.pn-btns button').all()) expect((await button.boundingBox())!.height).toBeGreaterThan(43.9);
    await context.close();
  });

  test('the toy box moves when shaken', async ({ page }) => {
    const problems = await watchForProblems(page);
    await page.goto('/play');
    await settled(page);
    const frame = () => page.locator('.toybox').evaluate((c: HTMLCanvasElement) => c.toDataURL());
    await page.waitForTimeout(1500);
    const before = await frame();
    await page.getByRole('button', { name: 'Shake the Box' }).click();
    await page.waitForTimeout(250);
    expect(await frame()).not.toBe(before);
    expect(problems).toEqual([]);
  });

  test('finding the secret page unlocks the star', async ({ page }) => {
    await page.goto('/secret');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('fx-secret'))).toBe('true');
    await expect(page.locator('.letters button')).toHaveCount(5);
  });
});

/** Counts canvas frames drawn from now on (every stage clears its canvas once per frame). */
async function countFrames(page: Page) {
  await page.evaluate(() => {
    const w = window as never as { frames: number; patched?: boolean };
    w.frames = 0;
    if (w.patched) return;
    w.patched = true;
    const clear = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) { w.frames++; return clear.apply(this, args); };
  });
  return async (ms: number) => { const start = await page.evaluate(() => (window as never as { frames: number }).frames); await page.waitForTimeout(ms); return (await page.evaluate(() => (window as never as { frames: number }).frames)) - start; };
}

test.describe('drawing only when something changes', () => {
  test('Lab stops drawing when paused and redraws for input', async ({ page }) => {
    await page.goto('/lab');
    await settled(page);
    const frames = await countFrames(page);
    expect(await frames(1000)).toBeGreaterThan(3);
    await page.getByRole('button', { name: 'Pause' }).click();
    await page.waitForTimeout(400);
    expect(await frames(1000)).toBeLessThan(2);
    const canvas = page.locator('.field');
    const before = await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL());
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 20);
    await expect.poll(() => canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL())).not.toBe(before);
    await page.mouse.move(0, 0);
    await expect.poll(() => frames(500), { timeout: 5000 }).toBe(0);
    await page.getByRole('button', { name: 'Resume' }).click();
    expect(await frames(1000)).toBeGreaterThan(3);
  });

  test('Play stops drawing when paused and starts again', async ({ page }) => {
    await page.goto('/play');
    await settled(page);
    const frames = await countFrames(page);
    expect(await frames(1000)).toBeGreaterThan(3);
    await page.getByRole('button', { name: 'Pause' }).click();
    await page.waitForTimeout(300);
    expect(await frames(1000)).toBeLessThan(2);
    await page.getByRole('button', { name: 'Resume' }).click();
    expect(await frames(1000)).toBeGreaterThan(3);
  });

  test('with reduced motion Lab and Play draw once and rest', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, reducedMotion: 'reduce' });
    const page = await context.newPage();
    for (const route of ['/lab', '/play']) {
      await page.goto(route);
      await page.waitForTimeout(800);
      const frames = await countFrames(page);
      expect(await frames(1000), route).toBeLessThan(2);
      expect(await page.locator('canvas').first().evaluate((c: HTMLCanvasElement) => c.toDataURL().length)).toBeGreaterThan(3000);
    }
    await context.close();
  });
});

test.describe('navigation speed', () => {
  test('a press during a page transition ends it and still reaches its target', async ({ page }) => {
    await page.goto('/about');
    await settled(page);
    const target = (await page.locator('.navcap a', { hasText: 'CV' }).boundingBox())!;
    await page.locator('.navcap a', { hasText: 'Lab' }).click();
    await expect(page).toHaveURL(/\/lab$/);
    await page.mouse.click(target.x + target.width / 2, target.y + target.height / 2);
    await expect(page).toHaveURL(/\/cv$/);
    await expect(page.locator('.sheet')).toBeVisible();
  });

  test('pages start loading on hover', async ({ page }) => {
    await page.goto('/about');
    await settled(page);
    await page.locator('.navcap a', { hasText: 'Lab' }).hover();
    await expect.poll(() => page.evaluate(() => !!document.querySelector('link[rel="prefetch"][href$="/lab"]'))).toBe(true);
  });
});

test.describe('shell details', () => {
  test('the tab icon follows the skin, across navigation and reloads', async ({ page, request }) => {
    for (const path of ['/favicon.ico', '/apple-touch-icon.png', '/icons/graphite.svg', '/icons/terminal.svg']) expect((await request.get(path)).status(), path).toBe(200);
    await page.goto('/cv');
    await settled(page);
    const icon = page.locator('link[data-skin-icon]');
    await expect(icon).toHaveAttribute('href', '/icons/graphite.svg');
    await page.locator('[data-skin-trigger]').click();
    await page.getByRole('radio', { name: /^Terminal/ }).click();
    await expect(icon).toHaveAttribute('href', '/icons/terminal.svg');
    await page.keyboard.press('Escape');
    await page.locator('.navcap a', { hasText: 'About' }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(icon).toHaveAttribute('href', '/icons/terminal.svg');
    await page.reload();
    await expect(icon).toHaveAttribute('href', '/icons/terminal.svg');
  });

  test('the home link carries the name, and says when it is the current page', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('.cap.brand')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('.cap.brand .brand-name')).toBeVisible();
    await page.goto('/about');
    await expect(page.locator('.cap.brand')).not.toHaveAttribute('aria-current', 'page');
    await page.setViewportSize({ width: 360, height: 800 });
    await expect(page.locator('.cap.brand .brand-name')).toBeHidden();
    await context.close();
  });

  test('Back to Top sits clear of the footer corner', async ({ page }) => {
    await page.goto('/about');
    await settled(page);
    await expect(page.locator('.foot')).toHaveCSS('overflow-x', 'visible');
    await expect(page.locator('.tcard')).toHaveCount(0);
    await page.goto('/');
    await expect(page.locator('.tcard').first()).toHaveCSS('overflow-x', 'visible');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  });

  test('the footer wordmark stays inside the footer on a phone', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto('/about');
    const foot = (await page.locator('.foot').boundingBox())!, crop = (await page.locator('.wordmark-crop').boundingBox())!;
    expect(crop.x).toBeGreaterThanOrEqual(foot.x);
    expect(crop.x + crop.width).toBeLessThanOrEqual(foot.x + foot.width + 0.5);
    await context.close();
  });

  test('the portrait note stays inside the frame', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto('/about');
    const frame = (await page.locator('.portrait').boundingBox())!, note = (await page.locator('.portrait .draft-t').boundingBox())!;
    expect(note.x + note.width).toBeLessThanOrEqual(frame.x + frame.width);
    await context.close();
  });

  test('language can be switched from the mobile menu', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, locale: 'en-US' });
    const page = await context.newPage();
    await page.goto('/about');
    await settled(page);
    await page.locator('.menu-btn').click();
    await page.locator('.ov-sheet [data-set-lang="tr"]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
    await expect(page.locator('main h1')).toContainText('Merhaba');
    await context.close();
  });

  for (const [skin, radius] of [['terminal', 0], ['blueprint', 8]] as const) {
    test(`${skin} panels follow the skin's corners`, async ({ page }) => {
      await page.addInitScript((s) => localStorage.setItem('fx-skin', JSON.stringify(s)), skin);
      await page.goto('/cv');
      await settled(page);
      const clip = await page.locator('.cvwrap > .cut-fill').evaluate((el) => (el as HTMLElement).style.clipPath);
      const radii = [...clip.matchAll(/A([\d.]+),/g)].map((m) => Number(m[1]));
      if (radius === 0) expect(radii).toEqual([]);
      else for (const value of radii) expect(value).toBeLessThanOrEqual(radius);
    });
  }

  test('changing skin re-clips panels straight away', async ({ page }) => {
    await page.goto('/cv');
    await settled(page);
    await page.locator('[data-skin-trigger]').click();
    await page.getByRole('radio', { name: /^Terminal/ }).click();
    await expect.poll(() => page.locator('.cvwrap > .cut-fill').evaluate((el) => (el as HTMLElement).style.clipPath.includes('A'))).toBe(false);
  });
});
