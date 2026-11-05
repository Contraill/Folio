import { expect, test, type Page } from '@playwright/test';

/** Fails the test on any page error, console error or CSP violation. */
async function watchForProblems(page: Page) {
  await page.addInitScript(() => document.addEventListener('securitypolicyviolation', (e) => console.error(`CSP ${e.violatedDirective} ${e.blockedURI}`)));
  const problems: string[] = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  return problems;
}
const settled = (page: Page) => page.waitForFunction(() => !document.documentElement.classList.contains('intro'), undefined, { timeout: 5000 });
/** Nothing on the page can be clicked while a page transition is on screen, in any browser. */
const transitionEnded = (page: Page) => page.waitForFunction(() => !document.getAnimations().some((a) => (a.effect as KeyframeEffect | null)?.pseudoElement?.includes('view-transition')));

/** Starts recording the name of every animation that runs, including on transition pseudo-elements. */
async function recordAnimations(page: Page) {
  await page.evaluate(() => {
    const seen = new Set<string>();
    (window as never as { seen: Set<string> }).seen = seen;
    const sample = () => {
      document.getAnimations().forEach((a) => {
        const name = (a as CSSAnimation).animationName;
        const pseudo = (a.effect as KeyframeEffect | null)?.pseudoElement ?? '';
        if (name) seen.add(`${pseudo} ${name}`.trim());
      });
      requestAnimationFrame(sample);
    };
    sample();
  });
}
const recorded = (page: Page) => page.evaluate(() => [...(window as never as { seen: Set<string> }).seen]);

test.describe('motion', () => {
  test('first load plays the intro once, navigation does not replay it', async ({ page }) => {
    await page.goto('/cv');
    await expect(page.locator('html')).toHaveClass(/intro/);
    expect(await page.evaluate(() => document.getAnimations().map((a) => (a as CSSAnimation).animationName))).toContain('drop');
    await settled(page);
    await page.locator('.navcap a', { hasText: 'Lab' }).click();
    await expect(page).toHaveURL(/\/lab$/);
    await expect(page.locator('html')).not.toHaveClass(/intro/);
  });

  test('pages slide along the menu order, and rise to and from Home', async ({ page }) => {
    await page.goto('/about');
    await settled(page);
    await recordAnimations(page);
    await page.locator('.navcap a', { hasText: 'CV' }).click();
    await expect(page).toHaveURL(/\/cv$/);
    await expect.poll(() => recorded(page)).toEqual(expect.arrayContaining(['::view-transition-old(page) out-left', '::view-transition-new(page) in-right']));
    await page.waitForTimeout(1100);
    await recordAnimations(page);
    await page.locator('.navcap a', { hasText: 'Lab' }).click();
    await expect(page).toHaveURL(/\/lab$/);
    await expect.poll(() => recorded(page)).toEqual(expect.arrayContaining(['::view-transition-new(page) in-left']));
    await page.waitForTimeout(1100);
    await recordAnimations(page);
    await page.locator('.cap.brand').click();
    await expect(page).toHaveURL(/\/$/);
    await expect.poll(() => recorded(page)).toEqual(expect.arrayContaining(['::view-transition-new(page) page-in']));
  });

  test('a new skin spreads in a circle from its button', async ({ page }) => {
    await page.goto('/cv');
    await settled(page);
    await page.locator('[data-skin-trigger]').click();
    await recordAnimations(page);
    await page.getByRole('radio', { name: /^Paper/ }).click();
    await expect.poll(() => recorded(page)).toEqual(expect.arrayContaining(['::view-transition-new(root) skin-in']));
  });

  test('reduced motion plays no page or skin animation', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/about');
    await recordAnimations(page);
    await page.locator('.navcap a', { hasText: 'CV' }).click();
    await expect(page).toHaveURL(/\/cv$/);
    await page.locator('[data-skin-trigger]').click();
    await page.getByRole('radio', { name: /^Paper/ }).click();
    await page.waitForTimeout(400);
    expect((await recorded(page)).filter((name) => /in-right|out-left|skin-in|page-in/.test(name))).toEqual([]);
    await context.close();
  });

  test('reveals, and the pointer layer, still work after navigating', async ({ page }) => {
    await page.goto('/cv');
    await settled(page);
    await page.locator('.navcap a', { hasText: 'About' }).click();
    await expect(page.locator('main [data-reveal]').first()).toHaveClass(/\bin\b/);
    await transitionEnded(page);
    await page.locator('.navcap a', { hasText: 'CV' }).click();
    await expect(page.locator('.sheet')).toHaveClass(/\bin\b/);
    const magnet = page.locator('.foot [data-magnet]');
    // Retried because the page ignores the pointer while a view transition is on screen.
    let nudge = 0;
    await expect(async () => {
      await magnet.scrollIntoViewIfNeeded();
      const box = (await magnet.boundingBox())!;
      const x = box.x + box.width / 2 + (nudge++ % 2 ? 10 : 6), y = box.y + box.height / 2;
      await page.mouse.move(x, y);
      await page.waitForTimeout(60);
      const state = await magnet.evaluate((el, [px, py]) => ({ mx: (el as HTMLElement).style.getPropertyValue('--mx'), under: document.elementFromPoint(px, py)?.outerHTML.slice(0, 80), scrollY, innerHeight, transitions: document.getAnimations().filter((a) => (a.effect as KeyframeEffect | null)?.pseudoElement?.includes('view-transition')).length }), [x, y]);
      expect(state.mx, JSON.stringify({ x, y, ...state })).toMatch(/^-?\d/);
    }).toPass({ timeout: 6000 });
  });

  test('the notched panel is restored when returning to its page', async ({ page }) => {
    await page.goto('/cv');
    await settled(page);
    await page.locator('.navcap a', { hasText: 'Lab' }).click();
    await expect(page).toHaveURL(/\/lab$/);
    await page.goBack();
    await expect(page.locator('.cvwrap > .cut-fill')).toHaveCSS('clip-path', /^path/);
    await expect(page.locator('.cvwrap > .cut-fill')).not.toHaveCSS('opacity', '0');
  });
});

test.describe('navigation', () => {
  test('moves between pages without a reload and keeps the shell alive', async ({ page }) => {
    const problems = await watchForProblems(page);
    await page.goto('/cv');
    await page.evaluate(() => { (window as never as { marker: Element }).marker = document.querySelector('.topbar')!; });
    await page.locator('.navcap a', { hasText: 'Lab' }).click();
    await expect(page).toHaveURL(/\/lab$/);
    await expect(page.locator('main h1')).toHaveText('ai lab_');
    expect(await page.evaluate(() => (window as never as { marker: Element }).marker === document.querySelector('.topbar'))).toBe(true);
    await expect(page.locator('.navcap a[aria-current="page"]')).toHaveText('Lab');
    await expect(page.locator('html')).toHaveAttribute('data-dir', 'back');
    await page.goBack();
    await expect(page).toHaveURL(/\/cv$/);
    await expect(page.locator('.navcap a[aria-current="page"]')).toHaveText('CV');
    await page.locator('.cap.brand').click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('html')).toHaveAttribute('data-dir', 'up');
    await expect(page.locator('.navcap a[aria-current="page"]')).toHaveCount(0);
    expect(problems).toEqual([]);
  });

  test('the sliding indicator follows the active item', async ({ page }) => {
    await page.goto('/projects');
    await settled(page);
    const x = () => page.locator('.navcap .ind').evaluate((el) => el.getBoundingClientRect().left);
    const before = await x();
    await page.locator('.navcap a', { hasText: 'About' }).click();
    await expect(page.locator('.navcap a[aria-current="page"]')).toHaveText('About');
    await expect.poll(x, { timeout: 2000 }).toBeGreaterThan(before + 100);
    const target = await page.locator('.navcap a[aria-current="page"]').evaluate((el) => el.getBoundingClientRect().left);
    await expect.poll(x, { timeout: 2000 }).toBeCloseTo(target, 0);
  });

  test('unknown pages answer 404 and stay out of search engines', async ({ page }) => {
    const response = await page.goto('/does-not-exist');
    expect(response?.status()).toBe(404);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    expect((await page.goto('/admin'))?.status()).toBe(404);
  });
});

test.describe('skins', () => {
  test('a chosen skin spreads, persists across navigation and reloads', async ({ page }) => {
    const problems = await watchForProblems(page);
    await page.goto('/cv');
    await settled(page);
    await page.locator('[data-skin-trigger]').click();
    await page.locator('.skin-opt', { hasText: 'Terminal' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-skin', 'terminal');
    await expect(page.locator('[data-skin-label]')).toHaveText('Terminal');
    await page.keyboard.press('Escape');
    await page.locator('.navcap a', { hasText: 'About' }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.locator('html')).toHaveAttribute('data-skin', 'terminal');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-skin', 'terminal');
    await expect(page.locator('[data-skin-trigger]')).toHaveAttribute('aria-label', /Terminal/);
    expect(problems).toEqual([]);
  });

  test('Auto follows the clock', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-11-05T22:00:00'));
    await page.addInitScript(() => localStorage.setItem('fx-skin', JSON.stringify('auto')));
    await page.goto('/cv');
    await expect(page.locator('html')).toHaveAttribute('data-skin', 'graphite');
    await page.clock.setFixedTime(new Date('2026-11-05T10:00:00'));
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-skin', 'paper');
    await expect(page.locator('[data-skin-label]')).toHaveText('Auto (Paper)');
  });

  test('the Auto icon stays inside its box', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('fx-skin', JSON.stringify('auto')));
    await page.goto('/cv');
    await settled(page);
    const fits = await page.locator('[data-skin-trigger] .sw').evaluate((sw) => {
      const box = sw.getBoundingClientRect();
      return [...sw.querySelectorAll('svg g > *')].every((n) => { const r = n.getBoundingClientRect(); return r.left >= box.left && r.top >= box.top && r.right <= box.right && r.bottom <= box.bottom; });
    });
    expect(fits).toBe(true);
  });
});

test.describe('overlays', () => {
  test('search finds a project and navigates', async ({ page }) => {
    const problems = await watchForProblems(page);
    await page.goto('/cv');
    await settled(page);
    await page.keyboard.press('Control+k');
    await page.locator('[cmdk-input]').fill('fastapi');
    await expect(page.locator('[cmdk-item][data-selected="true"]')).toContainText('Orbis');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/projects\/orbis$/);
    await expect(page.locator('[cmdk-input]')).toHaveCount(0);
    await page.keyboard.press('Control+k');
    await expect(page.locator('[cmdk-input]')).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('search lists public pages only, and never the easter egg', async ({ page, request }) => {
    const index = await (await request.get('/search-index.json')).json();
    const pages = index.pages.map((p: { href: string }) => p.href);
    for (const hidden of ['/uses', '/now', '/secret', '/admin']) expect(pages).not.toContain(hidden);
    await page.goto('/cv');
    await settled(page);
    await page.keyboard.press('Control+k');
    await page.locator('[cmdk-input]').fill('secret');
    await expect(page.locator('[cmdk-item]', { hasText: '/secret' })).toHaveCount(0);
  });

  test('contact opens from the top bar and the footer, closes with Escape, returns focus', async ({ page }) => {
    const problems = await watchForProblems(page);
    await page.goto('/cv');
    await settled(page);
    await page.locator('.contact-btn').click();
    await expect(page.getByRole('heading', { name: 'Say hi.' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Say hi.' })).toHaveCount(0);
    await expect(page.locator('.contact-btn')).toBeFocused();
    await page.locator('.foot [data-open-contact]').click();
    await expect(page.getByRole('heading', { name: 'Say hi.' })).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('copying the email address confirms with a toast, after navigating too', async ({ page }) => {
    const problems = await watchForProblems(page);
    await page.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (text: string) => { (window as never as { copied: string }).copied = text; } } }); });
    await page.goto('/cv');
    await settled(page);
    await page.locator('.navcap a', { hasText: 'About' }).click();
    await expect(page).toHaveURL(/\/about$/);
    await page.locator('.foot .circle[data-copy]').click();
    await expect(page.getByText('Email address copied')).toBeVisible();
    expect(await page.evaluate(() => (window as never as { copied: string }).copied)).toBe('izzet@oztozlu.dev');
    expect(problems).toEqual([]);
  });

  test('overlays survive navigation: the sheet closes, reopens and nothing crashes', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const problems = await watchForProblems(page);
    await page.goto('/cv');
    await settled(page);
    for (const [label, path] of [['Lab', /\/lab$/], ['About', /\/about$/]] as const) {
      await page.locator('.menu-btn').click();
      await page.locator('.mm-link', { hasText: label }).click();
      await expect(page).toHaveURL(path);
      await expect(page.locator('.mm-link')).toHaveCount(0);
    }
    await page.locator('.menu-btn').click();
    await expect(page.locator('.skin-opt').first()).toBeVisible();
    expect(problems).toEqual([]);
    await context.close();
  });
});

test.describe('language', () => {
  test('follows the browser, can be switched, and the choice wins afterwards', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, locale: 'tr-TR' });
    const page = await context.newPage();
    await page.goto('/cv');
    await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
    await expect(page.locator('.navcap a').first()).toHaveText('Projeler');
    await page.locator('[data-set-lang="en"]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('.navcap a').first()).toHaveText('Projects');
    await expect(page).toHaveURL(/\/cv$/);
    await page.goto('/about');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await context.close();
  });

  test('each language has its own canonical URL for crawlers and sharing', async ({ page }) => {
    await page.goto('/about?lang=tr');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://oztozlu.dev/about?lang=tr');
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'tr_TR');
    await page.goto('/cv');
    await expect(page.locator('link[rel="alternate"][hreflang="tr"]')).toHaveAttribute('href', 'https://oztozlu.dev/cv?lang=tr');
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute('href', 'https://oztozlu.dev/cv');
  });
});

test.describe('security headers', () => {
  test('the policy really blocks injected scripts and framing', async ({ page }) => {
    const response = await page.goto('/cv');
    const csp = response?.headers()['content-security-policy'] ?? '';
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toMatch(/script-src 'self' 'sha256-/);
    expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
    await page.evaluate(() => { const s = document.createElement('script'); s.textContent = 'window.injected = true'; document.head.append(s); });
    expect(await page.evaluate(() => (window as never as { injected?: boolean }).injected)).toBeUndefined();
  });

  test('every language variant is marked as such for caches', async ({ request }) => {
    const response = await request.get('/cv', { headers: { 'accept-language': 'tr' } });
    expect(response.headers()['content-language']).toBe('tr');
    expect(response.headers().vary).toContain('Accept-Language');
    expect(response.headers().vary).toContain('Cookie');
    expect(response.headers()['cache-control']).toBe('private, max-age=60');
  });
});

test.describe('accessibility and robustness', () => {
  test('reduced motion: no intro, reveals land immediately', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/cv');
    await expect(page.locator('html')).not.toHaveClass(/intro/);
    await expect(page.locator('.sheet')).toHaveCSS('opacity', '1');
    await context.close();
  });

  test('keyboard: the skip link comes first and moves focus to the content', async ({ page }) => {
    await page.goto('/cv');
    await settled(page);
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
  });

  test('without JavaScript the page is complete', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/cv');
    await expect(page.locator('.sheet')).toBeVisible();
    await expect(page.locator('.sheet')).toHaveCSS('opacity', '1');
    await expect(page.locator('.cv-head')).toHaveCSS('opacity', '1');
    await page.locator('.navcap a', { hasText: 'Lab' }).click();
    await expect(page).toHaveURL(/\/lab$/);
    await context.close();
  });

  for (const width of [320, 360, 390, 768, 1100, 1440]) {
    test(`no horizontal overflow at ${width}px`, async ({ browser, baseURL }) => {
      const context = await browser.newContext({ baseURL, viewport: { width, height: 900 } });
      const page = await context.newPage();
      await page.goto('/cv');
      await settled(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await context.close();
    });
  }
});

test.describe('CV: the design-system proof page', () => {
  test('the panel is notched, the toolbar works, printing is reachable from both buttons', async ({ page }) => {
    const problems = await watchForProblems(page);
    await page.addInitScript(() => { (window as never as { printed: number }).printed = 0; window.print = () => { (window as never as { printed: number }).printed++; }; });
    await page.goto('/cv');
    await settled(page);
    await expect(page.locator('.cvwrap > .cut-fill')).toHaveCSS('clip-path', /^path/);
    await expect(page.locator('.sheet h2').first()).toHaveText('İzzet Can Öztozlu');
    await page.locator('.cvbar .seg button', { hasText: 'Türkçe' }).click();
    await expect(page.locator('.sheet')).toHaveAttribute('lang', 'tr');
    await expect(page.locator('.cv-h1')).toHaveText('Özgeçmiş');
    await page.locator('.cv-pdf').click();
    await page.locator('.tools .tool[aria-label*="CV"]').click();
    expect(await page.evaluate(() => (window as never as { printed: number }).printed)).toBe(2);
    expect(problems).toEqual([]);
  });
});
