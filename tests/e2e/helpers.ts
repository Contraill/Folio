import type { Page } from '@playwright/test';

/** Records page errors, console errors and CSP violations; tests expect the list to stay empty. */
export async function watchForProblems(page: Page) {
  await page.addInitScript(() => document.addEventListener('securitypolicyviolation', (e) => console.error(`CSP ${e.violatedDirective} ${e.blockedURI}`)));
  const problems: string[] = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  return problems;
}

/** The first-load choreography has ended (the page's own `intro` state). */
export const settled = (page: Page) => page.waitForFunction(() => !document.documentElement.classList.contains('intro'), undefined, { timeout: 5000 });

/** No page transition is on screen; while one is, the page ignores the pointer, in every browser. */
export const transitionEnded = (page: Page) => page.waitForFunction(() => !document.getAnimations().some((a) => (a.effect as KeyframeEffect | null)?.pseudoElement?.includes('view-transition')));

/** Lets the page render `count` more frames. */
export const frames = (page: Page, count = 2) => page.evaluate((n) => new Promise<void>((done) => { const step = () => (n-- > 0 ? requestAnimationFrame(step) : done()); step(); }), count);

/** Starts recording the name of every animation that runs, including on view-transition pseudo-elements. */
export async function recordAnimations(page: Page) {
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
export const recorded = (page: Page) => page.evaluate(() => [...(window as never as { seen: Set<string> }).seen]);
