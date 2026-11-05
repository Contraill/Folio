import assert from 'node:assert/strict';
import { test } from 'node:test';
import { outline } from './cut.ts';

const area = (loop: [number, number][]) =>
  Math.abs(loop.reduce((sum, p, i) => { const q = loop[(i + 1) % loop.length]; return sum + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;

test('no cuts gives the plain rectangle', () => {
  const loops = outline(100, 50, []);
  assert.equal(loops.length, 1);
  assert.equal(loops[0].length, 4);
  assert.equal(area(loops[0]), 5000);
});

test('a corner notch removes exactly its area and adds two corners', () => {
  const loops = outline(100, 100, [[70, 0, 100, 30]]);
  assert.equal(loops.length, 1);
  assert.equal(loops[0].length, 6);
  assert.equal(area(loops[0]), 10000 - 900);
});

test('two notches on separate corners keep a single outline', () => {
  const loops = outline(100, 100, [[70, 0, 100, 30], [0, 70, 30, 100]]);
  assert.equal(loops.length, 1);
  assert.equal(area(loops[0]), 10000 - 1800);
});

test('a full-height cut splits the panel in two', () => {
  const loops = outline(100, 100, [[40, 0, 60, 100]]);
  assert.equal(loops.length, 2);
  assert.equal(area(loops[0]) + area(loops[1]), 8000);
});
