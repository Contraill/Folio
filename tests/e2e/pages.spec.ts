import type { Page } from '@playwright/test';
import { expect, test } from './access';
import { frames, settled, transitionEnded, watchForProblems } from './helpers';

/* Every page and its own interactions, in a browser. Layout and motion run in Chromium and Firefox; app logic that
   doesn't depend on the engine is tagged @once. */

const ROUTES = ['/', '/projects', '/projects/helios', '/projects/mochi', '/projects/huepr', '/projects/orbis', '/projects/bct', '/lab', '/play', '/about', '/cv', '/privacy', '/now', '/secret'];

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

  test('every page is complete without JavaScript, and its links still work', { tag: '@once' }, async ({ browser, baseURL }) => {
    test.slow(); // one test for every page: close to the default timeout against a deployed Preview
    const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
    const page = await context.newPage();
    for (const route of ROUTES) {
      await page.goto(route);
      await expect(page.locator('main h1').first()).toBeVisible();
      for (const el of await page.locator('[data-reveal]').all()) await expect(el).toHaveCSS('opacity', '1');
    }
    await page.locator('.navcap a', { hasText: 'Lab' }).click();
    await expect(page).toHaveURL(/\/lab$/);
    await expect(page.locator('main h1')).toHaveText('lab_');
    await context.close();
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
          await frames(page);
          const clipped = await page.locator('.ln').evaluateAll((lines) => lines.filter((l) => l.scrollWidth > l.clientWidth + 1).map((l) => l.textContent));
          expect(clipped, `${route} at ${width}`).toEqual([]);
        }
      }
      await context.close();
    });
  }
});

test.describe('home', () => {
  test('the hero advances, pauses and keeps its stages reachable', { tag: '@once' }, async ({ page }) => {
    const problems = await watchForProblems(page);
    await page.goto('/');
    await settled(page);
    await expect(page.locator('.hero-card h2')).toHaveText('Helios');
    await page.getByRole('button', { name: 'Next project' }).click();
    await expect(page.locator('.hero-card h2')).toHaveText('huepr');
    await page.getByRole('button', { name: 'Wallpaper: Bloom' }).click();
    await expect(page.locator('.tv-head b')).toHaveText('Bloom');
    // The third pin is Nothing KDE: its island opens into the control centre, and a volume change takes the clock's place.
    await page.getByRole('button', { name: 'Next project' }).click();
    await expect(page.locator('.hero-card h2')).toHaveText('Nothing KDE Theme');
    const island = page.locator('.layer.on .nk-island');
    await island.click();
    await expect(island).toHaveAttribute('aria-expanded', 'true');
    await page.locator('.layer.on').getByRole('button', { name: 'Bluetooth' }).click();
    await expect(page.locator('.layer.on').getByRole('button', { name: 'Bluetooth' })).toHaveAttribute('aria-pressed', 'true');
    await page.locator('.layer.on .nk-slide input').first().fill('20');
    await expect(page.locator('.layer.on .nk-vol')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(island).toHaveAttribute('aria-expanded', 'false');
    await page.getByRole('button', { name: 'Pause the slideshow and animations' }).click();
    await expect(page.locator('.hero')).toHaveClass(/is-paused/);
    await expect(page.getByRole('button', { name: 'Play the slideshow and animations' })).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('the orrery can be explored from the keyboard', { tag: '@once' }, async ({ page }) => {
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
    await transitionEnded(page);
    await page.evaluate(() => (window as never as { seen: Set<string> }).seen.clear());
    await page.locator('.crumbs nav a').click();
    await expect(page).toHaveURL(/\/projects$/);
    await expect.poll(seen).toContain('::view-transition-group(media)');
  });
});

test.describe('projects', () => {
  test('filters stay on the page, keep a shareable URL and follow history', { tag: '@smoke' }, async ({ page, request }) => {
    const problems = await watchForProblems(page);
    await page.goto('/projects');
    await settled(page);
    // Every public repository of this build is a project.
    const total = await page.locator('.gcard').count();
    expect(total).toBe((await (await request.get('/_build.json')).json()).counts.projects);
    // Filtering and going back stay on the page: the router must never start a navigation.
    await page.evaluate(() => {
      const w = window as never as { marker: Element; navigations: number };
      w.marker = document.querySelector('main')!;
      w.navigations = 0;
      document.addEventListener('astro:before-preparation', () => w.navigations++);
    });
    await page.locator('.filters a', { hasText: 'Hardware' }).click();
    await expect(page).toHaveURL(/\?area=hardware$/);
    await expect(page.locator('.gcard')).toHaveCount(1);
    expect(await page.evaluate(() => (window as never as { marker: Element }).marker === document.querySelector('main'))).toBe(true);
    await page.goBack();
    await expect(page.locator('.gcard')).toHaveCount(total);
    await expect(page).toHaveURL(/\/projects$/);
    expect(await page.evaluate(() => (window as never as { navigations: number }).navigations)).toBe(0);
    expect(await page.evaluate(() => (window as never as { marker: Element }).marker === document.querySelector('main'))).toBe(true);
    expect(problems).toEqual([]);
  });

  test('a filtered link opens filtered', { tag: '@once' }, async ({ page }) => {
    await page.goto('/projects?area=hardware');
    await expect(page.locator('.gcard')).toHaveCount(1);
    await expect(page.locator('.filters a[aria-current="page"]')).toContainText('Hardware');
  });

  test('returning from a project restores the filter it was opened from', async ({ page }) => {
    await page.goto('/projects');
    await settled(page);
    const total = await page.locator('.gcard').count();
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
    await expect(page.locator('.gcard')).toHaveCount(total);
    await page.goForward();
    await expect(page).toHaveURL(/\?area=hardware$/);
    await expect(page.locator('.gcard')).toHaveCount(1);
  });

  test('the index view is remembered', { tag: '@once' }, async ({ page }) => {
    await page.goto('/projects');
    await settled(page);
    const total = await page.locator('.gcard').count();
    await page.getByRole('button', { name: 'Index view' }).click();
    await expect(page.locator('.ix tbody tr')).toHaveCount(total);
    await page.reload();
    await expect(page.locator('.ix tbody tr')).toHaveCount(total);
  });
});

test.describe('case studies', () => {
  test('gallery, lightbox and sections work', { tag: '@once' }, async ({ page }) => {
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

  test('previous and next move sideways, the top bar links to the repository', { tag: '@once' }, async ({ page }) => {
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

  test('a project written in Folio is complete as it is: nothing says more is to come', { tag: '@once' }, async ({ page }) => {
    await page.goto('/projects/orbis');
    await expect(page.locator('main h1')).toContainText('Orbis');
    await expect(page.locator('main a', { hasText: 'Repository' })).toHaveAttribute('href', /github\.com\/Contraill\/Orbis/i);
    await expect(page.locator('main')).not.toContainText('comes from the repository on GitHub');
    await page.goto('/projects/orbis?lang=tr');
    await expect(page.locator('main')).not.toContainText('GitHub’daki repodan geliyor');
  });
});

test.describe('lab and play', () => {
  test('the Lab stage draws and its controls respond', { tag: '@once' }, async ({ page }) => {
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

  test('finding the secret page unlocks the star; its letters say hello in the page language', { tag: '@once' }, async ({ page }) => {
    await page.goto('/secret');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('fx-secret'))).toBe('true');
    await expect(page.locator('.letters-word')).toHaveCount(1);
    expect((await page.locator('.letters button').allInnerTexts()).join('')).toBe('HELLO');
    await page.goto('/secret?lang=tr');
    expect((await page.locator('.letters button').allInnerTexts()).join('')).toBe('MERHABA');
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

test.describe('drawing only when something changes', { tag: '@once' }, () => {
  test('Lab stops drawing when paused and redraws for input', async ({ page }) => {
    await page.goto('/lab');
    await settled(page);
    const frames = await countFrames(page);
    expect(await frames(1000)).toBeGreaterThan(3);
    await page.getByRole('button', { name: 'Pause' }).click();
    // A walker that settled just before the pause still fades its ring out (1.2 s), then the drawing stops for good.
    await expect.poll(() => frames(500), { timeout: 15_000 }).toBe(0);
    expect(await frames(1000)).toBeLessThan(2);
    const canvas = page.locator('.field');
    const before = await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL());
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 20);
    await expect.poll(() => canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL())).not.toBe(before);
    await page.mouse.move(0, 0);
    // Settling is counted in frames (each step is capped at 50 ms), so a busy machine drawing few frames takes longer.
    await expect.poll(() => frames(500), { timeout: 15_000 }).toBe(0);
    await page.getByRole('button', { name: 'Resume' }).click();
    expect(await frames(1000)).toBeGreaterThan(3);
  });

  test('Play stops drawing when paused, starts again, and shakes without errors', async ({ page }) => {
    const problems = await watchForProblems(page);
    await page.goto('/play');
    await settled(page);
    const frames = await countFrames(page);
    expect(await frames(1000)).toBeGreaterThan(3);
    await page.getByRole('button', { name: 'Pause' }).click();
    await page.waitForTimeout(300);
    expect(await frames(1000)).toBeLessThan(2);
    await page.getByRole('button', { name: 'Resume' }).click();
    expect(await frames(1000)).toBeGreaterThan(3);
    await page.getByRole('button', { name: 'Shake the Box' }).click();
    expect(problems).toEqual([]);
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

test.describe('shell details', () => {
  test('leaving the monogram mid-turn lets the C finish its turn instead of snapping back', async ({ page }) => {
    await page.goto('/about');
    await settled(page);
    const turning = () => page.locator('.cap.brand .mark .c').evaluate((c) => c.getAnimations().some((a) => a.playState === 'running'));
    await page.locator('.cap.brand').hover();
    await page.waitForTimeout(300);
    await page.mouse.move(640, 600);
    await page.waitForTimeout(100);
    expect(await turning()).toBe(true);
    await expect.poll(turning).toBe(false);
  });

  test('the home link carries the name, and says when it is the current page', { tag: '@once' }, async ({ browser, baseURL }) => {
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

  test('the portrait fills its frame, with a description, and no placeholder is left on About', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto('/about');
    const img = page.locator('.portrait img');
    await expect(img).toHaveAttribute('alt', /İzzet Can Öztozlu/);
    await expect.poll(() => img.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    const frame = (await page.locator('.portrait').boundingBox())!, box = (await img.boundingBox())!;
    expect(Math.round(box.width)).toBe(Math.round(frame.width));
    await expect(page.locator('.draft')).toHaveCount(0);
    await context.close();
  });
});

/* Games and lab apps come from the Folio controller's catalog, so what /play and /lab list depends on the build: the
   recorded catalog has two stand-in apps (tests/fixtures/apps), a live build has whatever is published. The catalogue
   is checked against /_build.json either way; the app pages against the stand-ins, only when the build lists them.
   Apps are this site's own files at /<kind>/<id>/app/: never another host. */
const SAMPLES = { play: { id: 'sample-game', name: 'Sample game' }, lab: { id: 'sample-lab', name: 'Sample lab' } } as const;

test.describe('games and lab apps', () => {
  for (const kind of ['play', 'lab'] as const) {
    test(`/${kind} lists exactly the ${kind === 'play' ? 'games' : 'lab apps'} of this build`, { tag: '@once' }, async ({ page, request }) => {
      const counts = (await (await request.get('/_build.json')).json()).counts;
      await page.goto(`/${kind}`);
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.locator('.app-card')).toHaveCount(counts[kind]);
      // With none yet, the catalogue says so in one line; nothing says the section is unfinished.
      await expect(page.locator('.apps-empty')).toHaveCount(counts[kind] ? 0 : 1);
      await expect(page.locator('main .wip-dot, main .tape')).toHaveCount(0);
      for (const href of await page.locator('.app-card').evaluateAll((cards) => cards.map((c) => c.getAttribute('href')))) {
        expect((await request.get(href!)).status(), href!).toBe(200);
        expect((await request.get(`${href}/app/`)).status(), `${href}/app/`).toBe(200);
      }
    });
  }

  test('an app runs in the page only when asked: from this site, in the visitor language, keeping what it saves', async ({ page, request }) => {
    const app = SAMPLES.play;
    test.skip((await request.get(`/play/${app.id}`)).status() === 404, 'the stand-in game is not in this build');
    const asked: string[] = [];
    page.on('request', (r) => { if (new URL(r.url()).pathname.startsWith(`/play/${app.id}/app/`)) asked.push(r.url()); });
    const problems = await watchForProblems(page);
    await page.goto(`/play/${app.id}`);
    await expect(page.locator('main h1')).toHaveText(app.name);
    await expect(page.locator('.navcap a[aria-current="page"]')).toHaveText('Play');
    const newTab = page.locator('.app-bar a', { hasText: 'Open in a new tab' });
    await expect(newTab).toHaveAttribute('href', `/play/${app.id}/app/`);
    await expect(newTab).toHaveAttribute('target', '_blank');
    expect(asked, 'nothing of the app loads before it is started').toEqual([]);

    await page.locator('.app-poster').click();
    const frame = page.locator('.app-box iframe');
    await expect(frame).toHaveAttribute('title', `${app.name}, running in this page`);
    const src = new URL((await frame.getAttribute('src'))!, page.url());
    expect([src.origin, src.pathname, src.searchParams.get('folio'), src.searchParams.get('lang'), src.searchParams.get('skin')]).toEqual([new URL(page.url()).origin, `/play/${app.id}/app/`, '1', 'en', 'graphite']);
    // What an app needs and nothing more: no popups, no top navigation, no forms.
    expect((await frame.getAttribute('sandbox'))!.split(' ').sort()).toEqual(['allow-downloads', 'allow-pointer-lock', 'allow-same-origin', 'allow-scripts']);
    expect(await frame.getAttribute('allow')).toBe('fullscreen; gamepad; autoplay');
    const out = page.frameLocator('.app-box iframe').locator('#out');
    await expect(out).toHaveText(`running play:${app.id} lang=en skin=graphite visits=1`);

    const full = page.getByRole('button', { name: 'Full screen' });
    await full.click();
    await expect.poll(() => page.evaluate(() => document.fullscreenElement?.className)).toBe('app-frame');
    await page.getByRole('button', { name: 'Leave full screen' }).click();
    await expect.poll(() => page.evaluate(() => document.fullscreenElement)).toBeNull();

    // Opened on its own, it is the same app with the same storage.
    await page.goto(`/play/${app.id}/app/`);
    await expect(page.locator('#out')).toHaveText(`running play:${app.id} lang=- skin=- visits=2`);
    expect(problems).toEqual([]);
  });

  test('a lab app keeps its runs in the site\'s storage, framed or not', { tag: '@once' }, async ({ page, request }) => {
    const app = SAMPLES.lab;
    test.skip((await request.get(`/lab/${app.id}`)).status() === 404, 'the stand-in lab app is not in this build');
    await page.goto(`/lab/${app.id}`);
    await page.locator('.app-poster').click();
    await expect(page.frameLocator('.app-box iframe').locator('#out')).toHaveText(`running lab:${app.id} runs=1`);
    await page.goto(`/lab/${app.id}/app/`);
    await expect(page.locator('#out')).toHaveText(`running lab:${app.id} runs=2`);
  });

  test('an app answers with its own policy, under its own folder only', { tag: '@once' }, async ({ request }) => {
    const app = SAMPLES.play;
    test.skip((await request.get(`/play/${app.id}`)).status() === 404, 'the stand-in game is not in this build');
    const noSlash = await request.get(`/play/${app.id}/app`, { maxRedirects: 0 });
    expect(noSlash.status()).toBe(308);
    expect(noSlash.headers()['location']).toBe(`/play/${app.id}/app/`);
    const page = await request.get(`/play/${app.id}/app/`);
    expect(page.headers()['content-security-policy']).toMatch(/frame-ancestors 'self'/);
    expect(page.headers()['x-robots-tag']).toBe('noindex');
    const js = await request.get(`/play/${app.id}/app/assets/app-a1b2c3d4.js`);
    expect(js.headers()['cache-control']).toBe('public, max-age=31536000, immutable');
    expect((await request.get(`/play/${app.id}/app/assets/missing.js`)).status()).toBe(404);
    expect((await request.get(`/play/${app.id}/app/a/route`)).status(), 'a route of a single-page app is its page').toBe(200);
    expect((await request.get('/play/no-such-app/app/')).status()).toBe(404);
    // Folio's own pages still refuse every frame but this site's.
    expect((await request.get(`/play/${app.id}`)).headers()['content-security-policy']).toMatch(/frame-ancestors 'none'/);
  });

  test('without JavaScript the same button opens the app in its own tab', { tag: '@once' }, async ({ browser, baseURL, request }) => {
    const app = SAMPLES.lab;
    test.skip((await request.get(`/lab/${app.id}`)).status() === 404, 'the stand-in lab app is not in this build');
    const context = await browser.newContext({ baseURL, javaScriptEnabled: false, locale: 'tr-TR' });
    const page = await context.newPage();
    await page.goto(`/lab/${app.id}`);
    await expect(page.locator('main h1')).toHaveText('Örnek deney');
    await expect(page.locator('.app-poster')).toHaveAttribute('href', `/lab/${app.id}/app/`);
    await expect(page.locator('.app-poster')).toHaveAttribute('target', '_blank');
    await context.close();
  });

  test('pages may frame this site only', { tag: '@once' }, async ({ page }) => {
    await page.goto('/play');
    const violations = page.evaluate(() => new Promise<string>((resolve) => document.addEventListener('securitypolicyviolation', (e) => resolve(e.effectiveDirective), { once: true })));
    await page.evaluate(() => { const f = document.createElement('iframe'); f.src = 'https://example.com/'; document.body.appendChild(f); });
    expect(await violations).toBe('frame-src');
  });
});
