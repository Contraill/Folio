import { LayoutGrid, Rows3 } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import type { Pages } from '@/content/schema';
import type { Project } from '@/content/schema';
import { flip } from '@/lib/motion';
import { Cover } from './Cover';
import { Go, Seg } from './kit';

/* Repeating rhythm for the gallery: one big piece, four squares, two wides. */
const SPAN = ['g-big', 'g-1', 'g-1', 'g-1', 'g-1', 'g-wide', 'g-wide'];
const VIEW_KEY = 'fx-view';
type View = 'gallery' | 'index';

export default function ProjectsBrowser({ projects, areas, slugs, initialArea, c, stage, locale }: { projects: Project[]; areas: string[]; slugs: string[]; initialArea: number | null; c: Pages['projects']; stage: Pages['stage']; locale: string }) {
  const [area, setArea] = useState(initialArea);
  const [view, setViewState] = useState<View>('gallery');
  const [peek, setPeek] = useState<{ p: Project; x: number; y: number } | null>(null);
  const raf = useRef(0);
  const gallery = useRef<HTMLDivElement>(null);
  const rects = useRef(new Map<string, DOMRect>());
  const areaFromUrl = () => { const i = slugs.indexOf(new URLSearchParams(location.search).get('area') ?? ''); return i < 0 ? null : i; };
  useEffect(() => {
    try { if (localStorage.getItem(VIEW_KEY) === '"index"') setViewState('index'); } catch { /* storage unavailable */ }
    // Claims the history step before the client router, which would reload the page for a filter change.
    const onHistory = (e: Event) => {
      if (location.pathname !== '/projects') return;
      e.preventDefault();
      setArea(areaFromUrl());
    };
    addEventListener('page-history', onHistory);
    return () => removeEventListener('page-history', onHistory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const setView = (next: View) => { setViewState(next); try { localStorage.setItem(VIEW_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ } };
  const list = area === null ? projects : projects.filter((p) => p.d === area);
  useLayoutEffect(() => { rects.current = flip(gallery.current, rects.current); }, [area, view, list.length]);
  // Filters stay on the page instead of running a page transition; the URL still follows for sharing.
  const choose = (next: number | null, e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    // Keeps the router's state on the entry, otherwise returning to it from another page does nothing.
    history.pushState(history.state, '', next === null ? '/projects' : `/projects?area=${slugs[next]}`);
    setArea(next);
  };
  const move = (p: Project, e: MouseEvent) => { cancelAnimationFrame(raf.current); const x = e.clientX, y = e.clientY; raf.current = requestAnimationFrame(() => setPeek({ p, x, y })); };
  const month = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' });
  const countText = (list.length === 1 ? c.countOne : c.count.replace('{n}', String(list.length))) + (area !== null ? c.countIn.replace('{area}', areas[area]) : '');
  return (
    <section className="slab pad pj-body" aria-label={c.title}>
      <div className="filters">
        <div className="fscroll"><Seg as="nav" label={c.filter}>
          <a href="/projects" onClick={(e) => choose(null, e)} aria-current={area === null ? 'page' : undefined}>{c.all} <span className="n">{projects.length}</span></a>
          {areas.map((name, i) => {
            const count = projects.filter((p) => p.d === i).length;
            if (!count) return null;
            return <a key={name} href={`/projects?area=${slugs[i]}`} onClick={(e) => choose(i, e)} aria-current={area === i ? 'page' : undefined}>{name} <span className="n">{count}</span></a>;
          })}
        </Seg></div>
        <Seg label={c.view} className="seg-icons">
          <button type="button" aria-pressed={view === 'gallery'} onClick={() => setView('gallery')} aria-label={c.galleryView}><LayoutGrid size={16} aria-hidden="true" /><span className="lbl">{c.gallery}</span></button>
          <button type="button" aria-pressed={view === 'index'} onClick={() => setView('index')} aria-label={c.indexView}><Rows3 size={16} aria-hidden="true" /><span className="lbl">{c.index}</span></button>
        </Seg>
      </div>
      <p className="sr" aria-live="polite">{countText}</p>

      {view === 'gallery' ? (
        <div className="gallery" ref={gallery}>
          {list.map((p, i) => (
            <a key={p.id} data-key={p.id} href={`/projects/${p.id}`} className={'gcard ' + SPAN[i % SPAN.length]} data-tilt="4">
              <span className="gmedia" data-media><Cover p={p} eager={i < 3} c={stage} altSuffix="" /></span>
              <span className="corner"><Go /></span>
              <span className="glab">
                <span className="gl-top"><b>{p.name}</b><span className="mono">{p.lang} · {p.since}{p.stars ? ` · ★ ${p.stars}` : ''}</span></span>
                <span className="gl-desc">{p.desc}</span>
              </span>
            </a>
          ))}
          {!list.length && <p className="small">{c.empty}</p>}
        </div>
      ) : (
        <div className="ixwrap" key="ix">
          <table className="ix" onMouseLeave={() => setPeek(null)}>
            <thead><tr><th scope="col">{c.no}</th><th scope="col">{c.project}</th><th scope="col" className="hide-m">{c.area}</th><th scope="col">{c.language}</th><th scope="col">{c.lastPush}</th><th scope="col" className="r">{c.starsHead}</th></tr></thead>
            <tbody>
              {list.map((p, i) => (
                <tr key={p.id} onMouseMove={(e) => move(p, e)} style={{ '--i': i } as CSSProperties}>
                  <td className="meta tnum">{String(i + 1).padStart(2, '0')}</td>
                  <td className="nm"><a href={`/projects/${p.id}`}>{p.name}</a><p>{p.desc}</p></td>
                  <td className="meta hide-m">{areas[p.d]}</td>
                  <td className="meta">{p.lang}</td>
                  <td className="meta tnum">{month.format(new Date(p.date))}</td>
                  <td className="meta r tnum">{p.stars ? '★ ' + p.stars : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className={'peek' + (peek ? ' on' : '')} style={peek ? { transform: `translate3d(${Math.min(peek.x + 24, innerWidth - 280)}px, ${Math.min(peek.y + 18, innerHeight - 190)}px, 0)` } : undefined} aria-hidden="true">
        {peek && <div style={{ position: 'absolute', inset: 0 }}><Cover p={peek.p} c={stage} altSuffix="" /></div>}
      </div>
    </section>
  );
}
