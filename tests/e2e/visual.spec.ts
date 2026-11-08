import { expect, test } from './access';

/* The core pages as they look, compared with screens recorded on the same machine before a change:
   `pnpm test:visual --update-snapshots` on the base commit, then `pnpm test:visual` after the change.
   Rendering differs between machines, so the screens stay out of Git and out of CI. Motion is reduced; live canvases
   and photos are masked (their boxes still count), since Chromium sometimes rasters a scaled photo at lower quality
   first. GitHub figures are stable only with the recorded snapshot (a local build). */
const PAGES = ['/', '/projects', '/projects/helios', '/about', '/cv', '/lab', '/play', '/now', '/?lang=tr', '/about?lang=tr'];
const name = (path: string) => (path.replace(/^\/(\?|$)/, '/home$1').replace(/\?lang=/, '-').replaceAll('/', '-').slice(1) || 'home');

for (const [device, viewport] of [['desktop', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844 }]] as const) {
  test.describe(device, () => {
    test.use({ viewport, reducedMotion: 'reduce' });
    for (const path of PAGES) {
      test(`${path} looks as before`, async ({ page }) => {
        await page.goto(path);
        // A full-page screen shows images below the fold too: load them all first, not while it is taken.
        await page.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((img) => { (img as HTMLImageElement).loading = 'eager'; }));
        await page.waitForFunction(() => [...document.images].every((img) => img.complete));
        await page.evaluate(() => document.fonts.ready);
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveScreenshot(`${device}-${name(path)}.png`, { fullPage: true, animations: 'disabled', mask: [page.locator('canvas, img')], maxDiffPixelRatio: 0.001 });
      });
    }
  });
}
