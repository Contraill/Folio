/* The files of games and lab apps, as the Folio controller keeps them after checking a build: one JSON document per
   build, addressed by its SHA-256. The GitHub step downloads each one the catalog names and keeps it only if the hash
   and size match; postbuild unpacks it into dist/<kind>/<id>/app/. Paths are checked again here, so nothing can land
   outside the app's own folder. */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

type Bundle = { v: 1; files: { path: string; b64: string }[] };
const SAFE = /^(?!.*(?:^|\/)\.\.?(?:\/|$))[A-Za-z0-9._~@+-]+(?:\/[A-Za-z0-9._~@+-]+)*$/;
const ID = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export const sha256 = (body: Uint8Array) => createHash('sha256').update(body).digest('hex');

/** Whether a downloaded build is exactly the one the catalog names. */
export const matches = (body: Uint8Array, build: { sha256: string; size: number }) => body.length === build.size && sha256(body) === build.sha256;

/** Writes a build's files into dist/<kind>/<id>/app/; returns how many. */
export function unpack(body: string, dist: string, kind: string, id: string): number {
  if (!['play', 'lab'].includes(kind) || !ID.test(id)) throw new Error(`${kind}/${id} is not an app address`);
  const bundle = JSON.parse(body) as Bundle;
  if (bundle.v !== 1 || !Array.isArray(bundle.files)) throw new Error(`${kind}/${id}: not a build this site can read`);
  const root = join(dist, kind, id, 'app');
  if (existsSync(root)) throw new Error(`${kind}/${id}: ${root} already exists`);
  if (!bundle.files.some((f) => f.path === 'index.html')) throw new Error(`${kind}/${id}: the build has no index.html`);
  // Every path is checked before anything is written.
  for (const f of bundle.files) if (typeof f.path !== 'string' || !SAFE.test(f.path)) throw new Error(`${kind}/${id}: ${String(f.path)} is not a path this site serves`);
  for (const f of bundle.files) {
    const target = join(root, f.path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, Buffer.from(f.b64, 'base64'));
  }
  return bundle.files.length;
}
