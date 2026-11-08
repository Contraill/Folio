/* Against a deployed site, before any test: proves that it answers with Folio itself and, when FOLIO_EXPECTED_SHA is
   set (CI), that it serves that commit. The Preview sits behind Access, so there it also proves that the service
   token gets through; production (oztozlu.dev) is open and needs none. If anything fails, no test runs and this one
   error says why. It never prints the token, only what is wrong with its shape. */
export default async function preflight() {
  const base = process.env.BASE_URL;
  if (!base?.startsWith('https://')) return;
  const fail = (why: string): never => { throw new Error(`Preflight failed for ${base}: ${why} No tests were run.`); };
  const production = new URL(base).hostname === 'oztozlu.dev';
  const id = process.env.CF_ACCESS_CLIENT_ID ?? '';
  const secret = process.env.CF_ACCESS_CLIENT_SECRET ?? '';
  if (!production && (!id || !secret)) fail('CF_ACCESS_CLIENT_ID and CF_ACCESS_CLIENT_SECRET are not set, and the Preview sits behind Cloudflare Access.');
  const headers: Record<string, string> = production ? {} : { 'cf-access-client-id': id, 'cf-access-client-secret': secret };
  const get = (path: string) => fetch(new URL(path, base), { headers, redirect: 'manual' });

  const home = await get('/');
  const location = home.headers.get('location') ?? '';
  if (home.headers.has('cf-access-aud') || /\.cloudflareaccess\.com$/.test(location && new URL(location, base).host))
    fail(`Cloudflare Access answered HTTP ${home.status} instead of the site: it did not accept the service token. ${shapeOf(id, secret)}`);
  const html = await home.text();
  if (home.status !== 200 || !html.includes('<main id="main"')) fail(`expected the Folio home page, got HTTP ${home.status} (${home.headers.get('content-type')}).`);

  const expected = process.env.FOLIO_EXPECTED_SHA;
  if (!expected) return;
  // A fresh Preview can take a few seconds to be served everywhere.
  let live = '';
  for (let attempt = 0; attempt < 12; attempt++) {
    const build = await get('/_build.json');
    if (build.ok) live = ((await build.json()) as { sha?: string }).sha ?? '';
    if (live === expected) return;
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  fail(`the site serves build ${live.slice(0, 7) || '(none)'}, not ${expected.slice(0, 7)}.`);
}

/** What can be said about the token without revealing it. */
function shapeOf(id: string, secret: string) {
  const problems = [];
  if (secret.endsWith('.access') && !id.endsWith('.access')) problems.push('the client ID and secret look swapped');
  else if (!id.endsWith('.access')) problems.push('the client ID does not end in ".access"');
  for (const [name, value] of [['client ID', id], ['client secret', secret]]) {
    if (/^\s|\s$/.test(value)) problems.push(`the ${name} has surrounding whitespace`);
    if (/["'=]/.test(value)) problems.push(`the ${name} contains a quote or "=", as if copied with its variable name`);
  }
  return problems.length
    ? `The token is malformed: ${problems.join('; ')}.`
    : "Both values are well-formed, so they are probably not the current values of the token the Access policy allows: set them again from that token's source.";
}
