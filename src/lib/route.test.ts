import assert from 'node:assert/strict';
import { test } from 'node:test';
import { currentMenuItem, directionOf, sectionOf } from './route.ts';

test('sections', () => {
  assert.equal(sectionOf('/'), 'home');
  assert.equal(sectionOf('/projects'), 'projects');
  assert.equal(sectionOf('/projects/helios'), 'project');
  assert.equal(sectionOf('/cv/'), 'cv');
  assert.equal(sectionOf('/nope'), 'missing');
});

test('Home always rises, the menu moves sideways', () => {
  assert.equal(directionOf('/', '/lab'), 'up');
  assert.equal(directionOf('/cv', '/'), 'up');
  assert.equal(directionOf('/lab', '/about'), 'fwd');
  assert.equal(directionOf('/about', '/lab'), 'back');
  assert.equal(directionOf('/projects/helios', '/projects'), 'back');
});

test('case studies highlight Projects', () => {
  assert.equal(currentMenuItem('/projects/helios'), 'projects');
  assert.equal(currentMenuItem('/about'), 'about');
});
