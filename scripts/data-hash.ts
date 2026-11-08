/* What a build publishes from outside the repository, as one hash: the GitHub snapshot (repositories, pins, last
   commits) and the controller's catalog, without the time they were read. Two builds of the same commit with the
   same hash publish the same site, so a scheduled sync can skip the deploy. */
import { createHash } from 'node:crypto';
import type { Snapshot } from '../src/content/discover.ts';

export function dataHash(s: Snapshot): string {
  const { fetchedAt: _f, source: _s, ...data } = s;
  return createHash('sha256').update(JSON.stringify(data)).digest('hex');
}
