import type { CSSProperties } from 'react';
import type { Pages } from '@/content/pages';
import type { Project } from '@/content/projects';
import { Img } from './kit';
import { PetCanvas } from './mochi';
import { ThemeDemo } from './stage';

/** Project cover: an image, or a small live preview for the projects that have one. Static unless hydrated. */
export function Cover({ p, variant = 'card', eager = false, c, altSuffix }: { p: Project; variant?: 'hero' | 'card'; eager?: boolean; c: Pages['stage']; altSuffix: string }) {
  const im = variant === 'hero' ? (p.hero ?? p.img) : p.img;
  if (p.kind === 'pixel') return (
    <div className="cov" style={{ position: 'absolute', inset: 0 }}>
      <div className="kit-bg" style={{ '--t1': '#8a5a3c', '--t2': '#2f3d5c' } as CSSProperties} />
      <div className="oled" style={{ left: '14%', right: '14%', top: '32%' }}><PetCanvas label={altSuffix.replace('{n}', p.name)} /></div>
    </div>
  );
  if (p.id === 'huepr') return <div className="cov" style={{ position: 'absolute', inset: 0 }}><ThemeDemo still c={c} /></div>;
  return im ? <Img im={im} alt={altSuffix.replace('{n}', p.name)} pos={p.pos} contain={p.contain} eager={eager} /> : null;
}

export default Cover;
