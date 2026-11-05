import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties, type FocusEvent } from 'react';
import type { Pages } from '@/content/pages';
import type { Project } from '@/content/projects';
import { reducedMotion } from '@/lib/motion';
import { Cut, Go, Lines, useMedia } from './kit';
import { Showcase } from './stage';

const DURATION = 8000;
const pad = (x: number) => String(x).padStart(2, '0');

export default function Hero({ projects, c, stage, mochi, locale }: { projects: Project[]; c: Pages['home']; stage: Pages['stage']; mochi: Pages['mochi']; locale: string }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [holding, setHolding] = useState(false);
  const holdTimer = useRef(0);
  const mobile = useMedia('(max-width: 760px)');
  useEffect(() => { if (reducedMotion()) setPaused(true); }, []);
  const n = projects.length, k = i % n, p = projects[k];
  const idle = paused || hover || holding;
  useEffect(() => {
    if (idle || n < 2) return;
    const t = window.setTimeout(() => setI((x) => (x + 1) % n), DURATION);
    return () => window.clearTimeout(t);
  }, [i, idle, n]);
  // Someone using a stage must not lose it to the next slide.
  const hold = () => {
    setHolding(true);
    window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => setHolding(false), 15000);
  };
  const step = (d: number) => setI((x) => (x + d + n) % n);
  const focus = mobile ? { x: 0.5, y: 0.42, s: 0.95 } : { x: 0.73, y: 0.4, s: 0.82 };
  const onFocus = (e: FocusEvent) => { if ((e.target as Element).matches(':focus-visible')) setHover(true); };
  return (
    <Cut as="section" className={'hero' + (paused ? ' is-paused' : '')} label={c.heroLabel}>
      <div className="cut-fill" suppressHydrationWarning onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onPointerDown={hold} onFocus={onFocus} onBlur={() => setHover(false)}>
        <div className="stage-in">
          {projects.map((project, j) => (
            <div key={project.id} className={'layer' + (j === k ? ' on' : '')} aria-hidden={j !== k} inert={j !== k ? true : undefined}>
              <Showcase p={project} active={j === k && !paused} focus={focus} eager={j === 0} c={stage} mochi={mochi} locale={locale} />
            </div>
          ))}
        </div>
        <div className="curtain" aria-hidden="true" />
      </div>

      <div className="carve">
        <div className="c1" data-cut>
          <p className="eyebrow after">{c.eyebrow}</p>
          <h1 className="display hl" style={{ marginTop: 18 }}><Lines lines={[c.line1]} /><span className="sr"> {c.line2}</span></h1>
        </div>
        <div className="c2" data-cut>
          <p className="display hl" aria-hidden="true"><span className="lines"><span className="ln" style={{ '--k': 1 } as CSSProperties}><span>{c.line2}</span></span></span></p>
          <p className="lede after" style={{ '--i': 0 } as CSSProperties}>{c.lede}</p>
          <div className="after" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingBottom: 6, '--i': 1 } as CSSProperties}>
            <a className="btn btn-1" href="/projects">{c.allProjects}<span className="ic"><ArrowRight size={16} aria-hidden="true" /></span></a>
            <a className="btn btn-2" href="/about">{c.about}</a>
          </div>
        </div>
      </div>

      <div className="dock hero-tag" data-cut>
        <div className="bar">
          <span className="eyebrow plain" style={{ color: 'var(--soft)' }}>{c.featured}</span>
          <span className="pager tnum" aria-live={paused ? 'polite' : 'off'}>{pad(k + 1)} / {pad(n)}
            <i className="prog" key={k + (idle ? 'p' : 'r')} style={{ animationDuration: DURATION + 'ms', animationPlayState: idle ? 'paused' : 'running' }} aria-hidden="true" />
          </span>
          <button type="button" className="circle sm" onClick={() => step(-1)} aria-label={c.prev} data-magnet><ChevronLeft size={17} aria-hidden="true" /></button>
          <button type="button" className="circle sm" onClick={() => step(1)} aria-label={c.next} data-magnet><ChevronRight size={17} aria-hidden="true" /></button>
          <button type="button" className="circle sm" onClick={() => setPaused((x) => !x)} aria-label={paused ? c.play : c.pause} data-magnet>{paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}</button>
        </div>
      </div>

      <div className="dock hero-card" data-cut>
        <a className="in" href={`/projects/${p.id}`}>
          <div style={{ minWidth: 0 }} key={p.id} className="swap">
            <span className="eyebrow plain">{p.lang} · {p.since}{p.stars ? ` · ★ ${p.stars}` : ''}</span>
            <h2 className="display">{p.name}</h2>
            <p>{c.hints[p.id] ?? p.desc}</p>
          </div>
          <Go solid />
        </a>
      </div>
    </Cut>
  );
}
