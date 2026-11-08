import { expect, test } from './access';
import { frames, recordAnimations, recorded, settled, transitionEnded, watchForProblems } from './helpers';

/* The shell around every page, in a browser: navigation, motion, skins, overlays, language, CSP enforcement, the CV.
   HTTP-level behaviour (headers, status codes, indexing) is in http.spec.ts. */

test.describe('motion', () => {
  test('first load plays the intro once; navigating does not replay it', async ({ page }) => {
    await page.goto('/cv');
    await expect.poll(() => page.evaluate(() => document.getAnimations().map((a) => (a as CSSAnimation).animationName))).toContain('drop');
    await settled(page);
    await recordAnimations(page);
    await page.locator('.navcap a', { hasText: 'Lab' }).click();
    await expect(page).toHaveURL(/\/lab$/);
    await transitionEnded(page);
    expect(await recorded(page)).not.toContain('drop');
  });

  test('pages slide along the menu order, and rise to and from Home', async ({ page }) => {
    await page.goto('/about');
    await settled(page);
    for (const [link, url, animations] of [
      [page.locator('.navcap a', { hasText: 'CV' }), /\/cv$/, ['::view-transition-old(page) out-left', '::view-transition-new(page) in-right']],
      [page.locator('.navcap a', { hasText: 'Lab' }), /\/lab$/, ['::view-transition-new(page) in-left']],
      [page.locator('.cap.brand'), /\/$/, ['::view-transition-new(page) page-in']],
    ] as const) {
      await recordAnimations(page);
      await link.click();
      await expect(page).toHaveURL(url);
      await expect.poll(() => recorded(page)).toEqual(expect.arrayContaining([...animations]));
      await transitionEnded(page);
    }
  });

  test('a new skin spreads in a circle from its button', async ({ page }) => {
    await page.goto('/cv');
    await settled(page);
    await page.locator('[data-skin-trigger]').click();
    await recordAnimations(page);
    await page.getByRole('radio', { name: /^Paper/ }).click();
    await expect.poll(() => recorded(page)).toEqual(expect.arrayContaining(['::view-transition-new(root) skin-in']));
  });

  test('reduced motion: no intro, no page or skin animation, content shown at once', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/about');
    await expect(page.locator('html')).not.toHaveClass(/intro/);
    await recordAnimations(page);
    await page.locator('.navcap a', { hasText: 'CV' }).click();
    await expect(page).toHaveURL(/\/cv$/);
    await expect(page.locator('.cv-head')).toHaveCSS('opacity', '1');
    await page.locator('[data-skin-trigger]').click();
    await page.getByRole('radio', { name: /^Paper/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-skin', 'paper');
    await frames(page);
    expect((await recorded(page)).filter((name) => /in-right|out-left|skin-in|page-in|drop/.test(name))).toEqual([]);
    await context.close();
  });

  test('reveals, and the pointer layer, still work after navigating', async ({ page }) => {
    await page.goto('/cv');
    await settled(page);
    await page.locator('.navcap a', { hasText: 'About' }).click();
    await expect(page.locator('main [data-reveal]').first()).toHaveClass(/\bin\b/);
    await transitionEnded(page);
    await page.locator('.navcap a', { hasText: 'CV' }).click();
    await expect(page.locator('.cv-head')).toHaveClass(/\bin\b/);
    await transitionEnded(page);
    const magnet = page.locator('.foot [data-magnet]');
    await magnet.scrollIntoViewIfNeeded();
    const box = (await magnet.boundingBox())!;
    // Two positions, so that each move is a real change whichever frame the layer samples.
    await expect(async () => {
      for (const dx of [6, 10]) { await page.mouse.move(box.x + box.width / 2 + dx, box.y + box.height / 2); await frames(page); }
      expect(await magnet.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--mx'))).toMatch(/^-?\d/);
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
  test('moves between pages without a reload and keeps the shell alive', { tag: '@smoke' }, async ({ page }) => {
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

  test('leaving a page before its components finish starting raises no error', { tag: '@once' }, async ({ page }) => {
    // A slow phone: the next page is asked for while React is still taking over this one's components.
    const problems = await watchForProblems(page);
    const cpu = await page.context().newCDPSession(page);
    await cpu.send('Emulation.setCPUThrottlingRate', { rate: 10 });
    for (const [from, to, url] of [['/lab', 'About', /\/about$/], ['/cv', 'Lab', /\/lab$/], ['/projects', 'CV', /\/cv$/]] as const) {
      await page.goto(from, { waitUntil: 'domcontentloaded' });
      // Forced: waiting until the link is still would let the components finish first.
      await page.locator('.navcap a', { hasText: to }).click({ force: true });
      await expect(page).toHaveURL(url);
      await expect(page.locator('main h1').first()).toBeVisible();
    }
    await cpu.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    expect(problems).toEqual([]);
  });

  test('the sliding indicator follows the active item', async ({ page }) => {
    await page.goto('/projects');
    await settled(page);
    const x = () => page.locator('.navcap .ind').evaluate((el) => el.getBoundingClientRect().left);
    const before = await x();
    await page.locator('.navcap a', { hasText: 'About' }).click();
    await expect(page.locator('.navcap a[aria-current="page"]')).toHaveText('About');
    await expect.poll(x).toBeGreaterThan(before + 100);
    const target = await page.locator('.navcap a[aria-current="page"]').evaluate((el) => el.getBoundingClientRect().left);
    await expect.poll(x).toBeCloseTo(target, 0);
  });

  test('a press during a page transition ends it and still reaches its target', async ({ page }) => {
    await page.goto('/about');
    await settled(page);
    const target = (await page.locator('.navcap a', { hasText: 'CV' }).boundingBox())!;
    await page.locator('.navcap a', { hasText: 'Lab' }).click();
    await expect(page).toHaveURL(/\/lab$/);
    await page.mouse.click(target.x + target.width / 2, target.y + target.height / 2);
    await expect(page).toHaveURL(/\/cv$/);
    await expect(page.locator('.cv-head')).toBeVisible();
  });

  test('pages start loading on hover', { tag: '@once' }, async ({ page }) => {
    await page.goto('/about');
    await settled(page);
    await page.locator('.navcap a', { hasText: 'Lab' }).hover();
    await expect.poll(() => page.evaluate(() => !!document.querySelector('link[rel="prefetch"][href$="/lab"]'))).toBe(true);
  });
});

test.describe('skins', () => {
  test('Terminal and Blueprint are found, not offered: their pages add them to the menu, once, without changing the skin', { tag: '@smoke' }, async ({ page }) => {
    const problems = await watchForProblems(page);
    await page.goto('/cv');
    await settled(page);
    const offered = async () => { await page.locator('[data-skin-trigger]').click(); const names = await page.getByRole('radio').allInnerTexts(); await page.keyboard.press('Escape'); return names.map((n) => n.split('\n')[0]); };
    expect(await offered()).toEqual(['Auto', 'Graphite', 'Paper']);
    await page.goto('/now');
    await expect(page.getByText('You found the Terminal skin')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('html')).toHaveAttribute('data-skin', 'graphite');
    expect(await offered()).toEqual(['Auto', 'Graphite', 'Paper', 'Terminal']);
    await page.goto('/secret');
    await expect(page.getByText('You found the Blueprint skin')).toBeVisible({ timeout: 10000 });
    expect(await offered()).toEqual(['Auto', 'Graphite', 'Paper', 'Blueprint', 'Terminal']);
    // Found once: coming back says nothing new.
    await page.goto('/now');
    await settled(page);
    await page.waitForTimeout(1200);
    await expect(page.getByText('You found the Terminal skin')).toHaveCount(0);
    expect(problems).toEqual([]);
  });

  test('a chosen skin persists across navigation and reloads, with the tab icon and the monogram', { tag: '@smoke' }, async ({ page }) => {
    const problems = await watchForProblems(page);
    await page.addInitScript(() => localStorage.setItem('fx-skins', JSON.stringify(['terminal'])));
    await page.goto('/cv');
    await settled(page);
    const icon = page.locator('link[data-skin-icon]');
    // The monogram's dot takes the skin's accent: no green on graphite or paper.
    const dot = page.locator('.cap.brand .i-dot');
    await expect(icon).toHaveAttribute('href', '/icons/graphite.svg');
    await expect(dot).toHaveCSS('fill', 'rgb(243, 243, 241)');
    await page.locator('[data-skin-trigger]').click();
    await page.getByRole('radio', { name: /^Terminal/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-skin', 'terminal');
    await expect(page.locator('[data-skin-label]')).toHaveText('Terminal');
    await expect(icon).toHaveAttribute('href', '/icons/terminal.svg');
    await expect(dot).toHaveCSS('fill', 'rgb(125, 255, 168)');
    await page.keyboard.press('Escape');
    await page.locator('.navcap a', { hasText: 'About' }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.locator('html')).toHaveAttribute('data-skin', 'terminal');
    await expect(icon).toHaveAttribute('href', '/icons/terminal.svg');
    // A reload while fonts still download aborts them, which Firefox reports as an error.
    await page.evaluate(() => document.fonts.ready);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-skin', 'terminal');
    await expect(page.locator('[data-skin-trigger]')).toHaveAttribute('aria-label', /Terminal/);
    await expect(icon).toHaveAttribute('href', '/icons/terminal.svg');
    expect(problems).toEqual([]);
  });

  test('the cursor follows the skin on a mouse, and stays the system\'s on touch and in high contrast', async ({ page, browser, baseURL }) => {
    const problems = await watchForProblems(page);
    await page.goto('/projects');
    await settled(page);
    const cursor = (selector: string) => page.locator(selector).first().evaluate((el) => getComputedStyle(el).cursor);
    expect(await cursor('main')).toMatch(/^url\("data:image\/svg\+xml,.*%23f3f3f1.*\) 3 2, default$/);
    expect(await cursor('.btn, a.gcard')).toMatch(/^url\(.*\) 3 2, pointer$/);
    expect(await cursor('main p')).toBe('text');
    expect(problems, 'the policy allows the cursor images').toEqual([]);
    for (const options of [{ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } }, { forcedColors: 'active' as const }]) {
      if ('isMobile' in options && browser.browserType().name() === 'firefox') continue;
      const context = await browser.newContext({ baseURL, ...options });
      const other = await context.newPage();
      await other.goto('/projects');
      expect(await other.locator('main').evaluate((el) => getComputedStyle(el).cursor)).not.toMatch(/^url/);
      await context.close();
    }
  });

  test('Auto follows the clock', { tag: '@once' }, async ({ page }) => {
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

  for (const [skin, radius] of [['terminal', 0], ['blueprint', 8]] as const) {
    test(`${skin} panels follow the skin's corners`, { tag: '@once' }, async ({ page }) => {
      await page.addInitScript((s) => localStorage.setItem('fx-skin', JSON.stringify(s)), skin);
      await page.goto('/cv');
      await settled(page);
      const clip = await page.locator('.cvwrap > .cut-fill').evaluate((el) => (el as HTMLElement).style.clipPath);
      const radii = [...clip.matchAll(/A([\d.]+),/g)].map((m) => Number(m[1]));
      if (radius === 0) expect(radii).toEqual([]);
      else for (const value of radii) expect(value).toBeLessThanOrEqual(radius);
    });
  }

  test('changing skin re-clips panels straight away', { tag: '@once' }, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('fx-skins', JSON.stringify(['terminal'])));
    await page.goto('/cv');
    await settled(page);
    await page.locator('[data-skin-trigger]').click();
    await page.getByRole('radio', { name: /^Terminal/ }).click();
    await expect.poll(() => page.locator('.cvwrap > .cut-fill').evaluate((el) => (el as HTMLElement).style.clipPath.includes('A'))).toBe(false);
  });
});

test.describe('overlays', () => {
  test('search finds a project and navigates, and never offers the unlisted pages', { tag: '@smoke' }, async ({ page }) => {
    const problems = await watchForProblems(page);
    await page.goto('/cv');
    await settled(page);
    await page.keyboard.press('Control+k');
    await page.locator('[cmdk-input]').fill('secret');
    await expect(page.locator('[cmdk-item]', { hasText: '/secret' })).toHaveCount(0);
    await page.locator('[cmdk-input]').fill('fastapi');
    await expect(page.locator('[cmdk-item][data-selected="true"]')).toContainText('Orbis');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/projects\/orbis$/);
    await expect(page.locator('[cmdk-input]')).toHaveCount(0);
    await page.keyboard.press('Control+k');
    await expect(page.locator('[cmdk-input]')).toBeVisible();
    expect(problems).toEqual([]);
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

  test('copying the email address confirms with a toast, after navigating too', { tag: '@once' }, async ({ page }) => {
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

  test('on a phone the menu sheet closes on navigation and reopens without errors', { tag: '@smoke' }, async ({ browser, baseURL }) => {
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

  test('language can be switched from the phone menu', { tag: '@once' }, async ({ browser, baseURL }) => {
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
});

test.describe('language', () => {
  test('follows the browser, can be switched, and the choice wins afterwards', { tag: '@smoke' }, async ({ browser, baseURL }) => {
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

  test('Turkish pages are translated, with a correct dotted capital', { tag: '@once' }, async ({ page }) => {
    for (const [path, locator, text] of [
      ['/?lang=tr', 'h1', 'Tepki veren'],
      ['/about?lang=tr', 'main h1', 'Merhaba, ben İzzet Can'],
      ['/projects/helios?lang=tr', 'main', 'İnsan ölçeğinde gezegen bilimi'],
      ['/lab?lang=tr', 'main', 'burada neler olacak'],
    ]) {
      await page.goto(path);
      await expect(page.locator(locator).first()).toContainText(text);
    }
  });
});

test.describe('security', () => {
  test('the page policy blocks injected scripts', { tag: '@smoke' }, async ({ page }) => {
    await page.goto('/cv');
    await expect(page.locator('main#main')).toBeVisible();
    await page.evaluate(() => { const s = document.createElement('script'); s.textContent = 'window.injected = true'; document.head.appendChild(s); });
    expect(await page.evaluate(() => (window as never as { injected?: boolean }).injected)).toBeUndefined();
  });
});

test.describe('accessibility', () => {
  test('keyboard: the skip link comes first and moves focus to the content', async ({ page }) => {
    await page.goto('/cv');
    await settled(page);
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
  });
});

test.describe("CV: the owner's own PDFs", () => {
  test('shows the chosen language, and its buttons open or download the original file', { tag: '@smoke' }, async ({ page }) => {
    const problems = await watchForProblems(page);
    await page.goto('/cv');
    await settled(page);
    await expect(page.locator('.cvwrap > .cut-fill')).toHaveCSS('clip-path', /^path/);
    const save = page.locator('.cvbar a[download]');
    await expect(save).toHaveAttribute('href', '/cv/en.pdf');
    await expect(save).toHaveAttribute('download', 'Izzet-Can-Oztozlu-CV-EN.pdf');
    await page.locator('.cvbar .seg button', { hasText: 'Türkçe' }).click();
    await expect(save).toHaveAttribute('href', '/cv/tr.pdf');
    await expect(save).toHaveAttribute('download', 'Izzet-Can-Oztozlu-CV-TR.pdf');
    await expect(page.locator('.cvbar a[target="_blank"]')).toHaveAttribute('href', '/cv/tr.pdf');
    // The top bar's CV button follows the page language, not the CV switch.
    await expect(page.locator('.tools a.tool[download]')).toHaveAttribute('href', '/cv/en.pdf');
    expect(problems).toEqual([]);
  });

  test('draws the CV in the page: selectable text, its links, zoom and the other language', { tag: '@smoke' }, async ({ page }) => {
    const problems = await watchForProblems(page);
    await page.goto('/cv');
    const sheet = page.getByRole('document', { name: 'CV in English, PDF' });
    // pdf.js parses in a worker: on a busy machine the first page can take a while.
    await expect(sheet.locator('canvas')).toBeVisible({ timeout: 15000 });
    await expect(sheet.locator('.textLayer')).toContainText('Full-Stack Developer');
    expect(await sheet.locator('.cv-links a[href^="https://github.com/"]').count()).toBeGreaterThan(0);
    const zoom = page.locator('.cv-zoom output');
    const fit = await zoom.textContent();
    const width = (await sheet.boundingBox())!.width;
    await page.getByRole('button', { name: 'Zoom in' }).click();
    await expect(zoom).not.toHaveText(fit!);
    await expect.poll(async () => (await sheet.boundingBox())!.width).toBeGreaterThan(width);
    await page.getByRole('button', { name: 'Fit to width' }).click();
    await expect(zoom).toHaveText(fit!);
    await page.locator('.cvbar .seg button', { hasText: 'Türkçe' }).click();
    await expect(page.getByRole('document', { name: 'CV in Türkçe, PDF' }).locator('.textLayer')).toContainText('İstanbul');
    expect(problems).toEqual([]);
  });

  test('without JavaScript, or when the CV can\'t be drawn, the same place offers to open or download it', { tag: '@once' }, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/cv');
    await expect(page.locator('.cv-card a[download]')).toHaveAttribute('href', '/cv/en.pdf');
    await expect(page.locator('.cv-card a[target="_blank"]')).toHaveAttribute('href', '/cv/en.pdf');
    await context.close();
    const broken = await browser.newContext({ baseURL });
    const failing = await broken.newPage();
    // The download link must still work, so only the viewer's own request is made to fail.
    await failing.route('**/cv/en.pdf', (route) => (route.request().resourceType() === 'fetch' ? route.abort() : route.fallback()));
    await failing.goto('/cv');
    await expect(failing.locator('.cv-card [role="alert"]')).toHaveText('The CV couldn’t be shown here. Open or download the PDF instead.');
    await expect(failing.locator('.cv-card a[download]')).toHaveAttribute('href', '/cv/en.pdf');
    await broken.close();
  });
});
