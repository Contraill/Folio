import type { CSSProperties } from 'react';
import type { Project } from '@/content/schema';

/** A repository's name as words: dashes and underscores become spaces, so long names wrap between words. */
export const words = (name: string) => name.replace(/[-_]+/g, ' ').trim();
/** A hue that stays the same for a name, so a project keeps its colour from build to build. */
const hue = (name: string) => [...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7);

/* The cover of a project with no image of its own: its name set large, the repository path and its languages. Nothing
   invented: every word on it comes from GitHub. Sized by its own box, so the same markup works as a card and a stage. */
export function Typo({ p, stage = false }: { p: Project; stage?: boolean }) {
  const name = words(p.name);
  const longest = Math.max(...name.split(' ').map((w) => [...w].length));
  return (
    <div className={'typo' + (stage ? ' typo-stage' : '')} style={{ '--h': hue(p.name), '--n': longest } as CSSProperties} aria-hidden="true">
      <span className="typo-path mono" translate="no">{p.repo ? `Contraill/${p.repo}` : p.name}</span>
      <span className="typo-name">{name}</span>
      {p.langs.length > 0 && <span className="typo-langs mono">{p.langs.slice(0, 4).map((l) => <span key={l}>{l}</span>)}</span>}
    </div>
  );
}
