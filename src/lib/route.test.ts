import assert from 'node:assert/strict';
import { test } from 'node:test';
import { currentMenuItem, directionOf, sectionOf } from './route.ts';

test('sections', () => {
  assert.equal(sectionOf('/'), 'home');
  assert.equal(sectionOf('/projects'), 'projects');
  assert.equal(sectionOf('/projects/helios'), 'project');
  assert.equal(sectionOf('/cv/'), 'cv');
  assert.equal(sectionOf('/nope'), 'missing');
  assert.equal(sectionOf('/play/gates'), 'game');
  assert.equal(sectionOf('/lab/two-spirals'), 'experiment');
});

test('Home always rises, the menu moves sideways', () => {
  assert.equal(directionOf('/', '/lab'), 'up');
  assert.equal(directionOf('/cv', '/'), 'up');
  assert.equal(directionOf('/lab', '/about'), 'fwd');
  assert.equal(directionOf('/about', '/lab'), 'back');
  assert.equal(directionOf('/projects/helios', '/projects'), 'back');
  assert.equal(directionOf('/play', '/play/gates'), 'fwd');
  assert.equal(directionOf('/lab/spirals', '/play'), 'fwd');
});

test('case studies, games and lab apps highlight their section', () => {
  assert.equal(currentMenuItem('/projects/helios'), 'projects');
  assert.equal(currentMenuItem('/play/gates'), 'play');
  assert.equal(currentMenuItem('/lab/spirals'), 'lab');
  assert.equal(currentMenuItem('/about'), 'about');
});
