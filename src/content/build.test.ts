import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { casesFor } from '../../seed/cases.ts';
import { CV_TEXT } from '../../seed/cv.ts';
import { pages } from '../../seed/pages.ts';

/* Content lives in the store, not in the build, so a deploy has no way to carry or overwrite it. */
const dist = new URL('../../dist/', import.meta.url).pathname;
const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]));

test('the build carries no content', { skip: !existsSync(dist) && 'run after a build' }, () => {
  const samples = [pages.en.about.lede, pages.tr.home.lede, casesFor('en').helios!.lede, casesFor('tr').mochi!.lede, CV_TEXT.en.summary, CV_TEXT.tr.summary].map((s) => s.slice(0, 40));
  for (const file of files(dist).filter((f) => /\.(m?js|html|json|css|txt)$/.test(f))) {
    const text = readFileSync(file, 'utf8');
    for (const sample of samples) assert.ok(!text.includes(sample), `${file} contains "${sample}"`);
  }
});
