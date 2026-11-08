import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { matches, sha256, unpack } from './app-builds.ts';

const bundle = (files: Record<string, string>) => JSON.stringify({ v: 1, files: Object.entries(files).map(([path, text]) => ({ path, b64: Buffer.from(text).toString('base64') })) });

test('a build is used only if it is exactly the one the catalog names', () => {
  const body = Buffer.from(bundle({ 'index.html': 'hi' }));
  assert.ok(matches(body, { sha256: sha256(body), size: body.length }));
  assert.ok(!matches(body, { sha256: sha256(body), size: body.length + 1 }));
  assert.ok(!matches(Buffer.from(bundle({ 'index.html': 'changed' })), { sha256: sha256(body), size: body.length }));
});

test('a build lands in its app folder and nowhere else', () => {
  const dist = mkdtempSync(join(tmpdir(), 'folio-app-'));
  try {
    assert.equal(unpack(bundle({ 'index.html': '<p>game</p>', 'assets/a.js': 'js' }), dist, 'play', 'gates'), 2);
    assert.equal(readFileSync(join(dist, 'play/gates/app/assets/a.js'), 'utf8'), 'js');
    assert.throws(() => unpack(bundle({ 'index.html': 'x' }), dist, 'play', 'gates'), /already exists/);
    for (const path of ['../x.js', 'a/../../../x', '/etc/x', 'a//b']) {
      assert.throws(() => unpack(bundle({ 'index.html': 'x', [path]: 'x' }), dist, 'lab', 'evil'), /not a path/, path);
      rmSync(join(dist, 'lab'), { recursive: true, force: true });
    }
    assert.ok(!existsSync(join(dist, 'x.js')));
    assert.throws(() => unpack(bundle({ 'index.html': 'x' }), dist, 'site', 'x'), /not an app address/);
    assert.throws(() => unpack(bundle({ 'index.html': 'x' }), dist, 'play', '../x'), /not an app address/);
    assert.throws(() => unpack(bundle({ 'app.js': 'x' }), dist, 'lab', 'nopage'), /no index.html/);
  } finally {
    rmSync(dist, { recursive: true, force: true });
  }
});
