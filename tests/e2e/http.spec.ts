/* What the server answers, independent of the browser engine: pages, the 404s, headers, the files search engines
   read, the share images and the structured data. */
import { test, expect } from './access';
import { PAGES, PROJECTS } from './site';

test.describe('@once', () => {
  test('every page answers, names itself as its canonical address and pairs with its translation @smoke', async ({ request }) => {
    for (const page of PAGES) {
      const res = await request.get(page);
      expect(res.status(), page).toBe(200);
      const html = await res.text();
      expect(html, page).toContain(`<link rel="canonical" href="https://oztozlu.dev${page}">`);
      expect(html, page).toContain('hreflang="tr"');
      expect(html, page).toContain('hreflang="x-default"');
    }
  });

  test('unknown and retired addresses get a 404 in the right language', async ({ request }) => {
    for (const [path, title] of [
      ['/no-such-page', 'Not found'], ['/tr/olmayan-sayfa', 'Sayfa bulunamadı'],
      // The previous site's pages are gone, not redirected.
      ['/projects', 'Not found'], ['/about', 'Not found'], ['/play', 'Not found'], ['/lab', 'Not found'],
      ['/privacy', 'Not found'], ['/projects/emu', 'Not found'], ['/tr/projects/zen', 'Sayfa bulunamadı'],
    ]) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(404);
      const html = await res.text();
      expect(html, path).toContain(`<title>${title} · İzzet Can Öztozlu</title>`);
      expect(html, path).toContain('<meta name="robots" content="noindex">');
    }
  });

  test('the sitemap lists every page with its translations, and robots.txt points to it', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    const locs = [...xml.matchAll(/<loc>https:\/\/oztozlu\.dev([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
    expect(locs.sort()).toEqual([...PAGES].sort());
    expect(xml.match(/hreflang="tr"/g)).toHaveLength(PAGES.length);
    expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap: https://oztozlu.dev/sitemap.xml');
  });

  test('security headers on pages, a year of caching on built files', async ({ request }) => {
    const headers = (await request.get('/')).headers();
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    const asset = (await (await request.get('/')).text()).match(/\/_astro\/[^"']+\.(?:js|css)/)?.[0];
    expect(asset).toBeTruthy();
    expect((await request.get(asset!)).headers()['cache-control']).toContain('immutable');
  });

  test('each page’s share image is a 1200×630 PNG', async ({ request }) => {
    const images = new Set<string>();
    for (const page of PAGES) {
      const html = await (await request.get(page)).text();
      images.add(html.match(/<meta property="og:image" content="https:\/\/oztozlu\.dev([^"]+)">/)![1]);
    }
    expect(images.size).toBe(2 + PROJECTS.length * 2);
    for (const image of images) {
      const png = await (await request.get(image)).body();
      expect(png.subarray(1, 4).toString(), image).toBe('PNG');
      expect([png.readUInt32BE(16), png.readUInt32BE(20)], image).toEqual([1200, 630]);
    }
  });

  test('structured data: the person on the home page, each project as software by them', async ({ request }) => {
    const graph = async (page: string) => {
      const json = (await (await request.get(page)).text()).match(/<script type="application\/ld\+json">([^<]+)<\/script>/)![1];
      return JSON.parse(json)['@graph'] as Record<string, any>[];
    };
    for (const page of ['/', '/tr']) {
      const person = (await graph(page)).find((n) => n['@type'] === 'Person')!;
      expect(person.name).toBe('İzzet Can Öztozlu');
      expect(person.sameAs).toEqual(['https://github.com/Contraill', 'https://www.linkedin.com/in/izzetcanoztozlu']);
    }
    for (const id of PROJECTS) {
      const [software, crumbs] = await graph(`/projects/${id}`);
      expect(software['@type']).toBe('SoftwareSourceCode');
      expect(software.codeRepository).toMatch(/^https:\/\/github\.com\/Contraill\//);
      expect(software.author['@id']).toBe('https://oztozlu.dev/#person');
      expect(crumbs.itemListElement).toHaveLength(2);
    }
  });

  test('the build names its commit', async ({ request }) => {
    const build = await (await request.get('/_build.json')).json();
    expect(build.sha).toMatch(/^[0-9a-f]{40}$/);
  });
});
