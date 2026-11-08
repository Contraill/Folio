import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import type { Pages } from '@/content/schema';
import { NothingStage } from './NothingStage';
import { Typo } from './Typo';
import type { Project } from '@/content/schema';
import { reducedMotion } from '@/lib/motion';
import { Img, useLoop } from './kit';
import { MochiDevice } from './mochi';

/* Live project stages. Each one shows what the project actually does, not a screenshot of its repository. */
type Focus = { x: number; y: number; s?: number };
export type StageCopy = Pages['stage'];

const PLANETS = [
  { n: 'Mercury', a: 0.387, p: 0.241, r: 2.6, c: '#b9aea3' }, { n: 'Venus', a: 0.723, p: 0.615, r: 4.2, c: '#e8c98f' },
  { n: 'Earth', a: 1, p: 1, r: 4.4, c: '#5b9bea' }, { n: 'Mars', a: 1.524, p: 1.881, r: 3.4, c: '#d9653b' },
  { n: 'Jupiter', a: 5.203, p: 11.86, r: 9.5, c: '#d8b48a' }, { n: 'Saturn', a: 9.537, p: 29.46, r: 8, c: '#e6d19a', ring: true },
  { n: 'Uranus', a: 19.19, p: 84.01, r: 6, c: '#9fd8de' }, { n: 'Neptune', a: 30.07, p: 164.8, r: 5.8, c: '#5a7de0' },
] as const;

export function Orrery({ active = true, focus = { x: 0.5, y: 0.5 }, c, locale }: { active?: boolean; focus?: Focus; c: StageCopy; locale: string }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const st = useRef({ drawn: false, t: 3.1, tilt: 0.42, tTilt: 0.42, hover: -1, tour: 2, tourAt: 0, keyed: false, last: 0, focusX: focus.x, stars: null as HTMLCanvasElement | null, pos: [] as [number, number, number][] });
  const act = useRef(active);
  act.current = active;
  const [announce, setAnnounce] = useState('');
  const orbitText = (i: number) => {
    const y = PLANETS[i].p;
    const span = y < 1 ? c.days.replace('{n}', String(Math.round(y * 365.25))) : y === 1 ? c.oneYear : c.years.replace('{n}', y.toLocaleString(locale, { maximumFractionDigits: 1 }));
    return c.orbit.replace('{v}', span);
  };
  const wake = useLoop(cv, (now) => {
    const canvas = cv.current!, S = st.current, w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w) return;
    // A paused or hidden slide keeps its last frame until someone explores it.
    if (!act.current && S.drawn && !S.keyed && S.hover < 0) return false;
    S.drawn = true;
    const dpr = Math.min(devicePixelRatio || 1, innerWidth < 760 ? 1.5 : 2);
    if (canvas.width !== Math.round(w * dpr) || S.focusX !== focus.x) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); S.stars = null; S.focusX = focus.x; }
    const x = canvas.getContext('2d')!;
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const dt = S.last ? Math.min(0.05, (now - S.last) / 1000) : 0;
    S.last = now;
    if (act.current && !reducedMotion()) S.t += dt * (S.hover >= 0 ? 0.04 : 0.16);
    S.tilt += (S.tTilt - S.tilt) * 0.06;
    if (!S.stars) {
      const s = document.createElement('canvas');
      s.width = canvas.width; s.height = canvas.height;
      const g = s.getContext('2d')!;
      const bg = g.createRadialGradient(w * focus.x * dpr, h * focus.y * dpr, 0, w * focus.x * dpr, h * focus.y * dpr, Math.max(w, h) * dpr);
      bg.addColorStop(0, '#16131c'); bg.addColorStop(0.5, '#0a0a10'); bg.addColorStop(1, '#050507');
      g.fillStyle = bg; g.fillRect(0, 0, s.width, s.height);
      let seed = 7;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 220; i++) { g.globalAlpha = 0.15 + rnd() * 0.6; g.fillStyle = '#fff'; const r = rnd() < 0.08 ? 1.4 : 0.8; g.fillRect(rnd() * s.width, rnd() * s.height, r * dpr, r * dpr); }
      S.stars = s;
    }
    x.drawImage(S.stars, 0, 0, w, h);
    const cx = w * focus.x, cy = h * focus.y, R0 = 30 * (focus.s ?? 1), Rm = Math.min(w * 0.46, h * 1.05) * (focus.s ?? 1), k = S.tilt;
    const L = Math.log(1 + 30.07);
    const rad = (a: number) => R0 + (Rm - R0) * (Math.log(1 + a) / L);
    x.lineWidth = 1;
    // With nobody exploring, it walks through the planets on its own, so the stage explains itself.
    if (act.current && !reducedMotion() && now > S.tourAt) { if (S.tourAt) S.tour = (S.tour + 1) % PLANETS.length; S.tourAt = now + 2600; }
    const shown = S.hover >= 0 ? S.hover : S.tour;
    PLANETS.forEach((p, i) => { x.strokeStyle = i === shown ? 'rgba(255,255,255,.4)' : 'rgba(255,255,255,.09)'; x.beginPath(); x.ellipse(cx, cy, rad(p.a), rad(p.a) * k, 0, 0, Math.PI * 2); x.stroke(); });
    const pos = PLANETS.map((p, i) => { const an = (S.t / p.p) * Math.PI * 2 + i * 1.7; return [cx + Math.cos(an) * rad(p.a), cy + Math.sin(an) * rad(p.a) * k, Math.sin(an)] as [number, number, number]; });
    S.pos = pos;
    const sun = () => {
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, 70);
      g.addColorStop(0, 'rgba(255,214,140,.95)'); g.addColorStop(0.18, 'rgba(255,170,70,.75)'); g.addColorStop(0.45, 'rgba(255,120,40,.14)'); g.addColorStop(1, 'rgba(255,120,40,0)');
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, 70, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#ffe2a8'; x.beginPath(); x.arc(cx, cy, 11, 0, Math.PI * 2); x.fill();
    };
    const order = PLANETS.map((_, i) => i).sort((a, b) => pos[a][2] - pos[b][2]);
    let sunDrawn = false;
    order.forEach((i) => {
      if (!sunDrawn && pos[i][2] >= 0) { sun(); sunDrawn = true; }
      const p = PLANETS[i], [px, py] = pos[i], r = p.r * (0.85 + 0.15 * (pos[i][2] + 1));
      const ang = Math.atan2(py - cy, px - cx);
      if ('ring' in p) { x.strokeStyle = 'rgba(230,209,154,.55)'; x.lineWidth = 1.6; x.beginPath(); x.ellipse(px, py, r * 2.1, r * 0.7, -0.35, 0, Math.PI * 2); x.stroke(); }
      const g = x.createRadialGradient(px - Math.cos(ang) * r * 0.5, py - Math.sin(ang) * r * 0.5, r * 0.1, px, py, r * 1.1);
      g.addColorStop(0, p.c); g.addColorStop(1, '#07070a');
      x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill();
      if (i === shown) { x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 1; x.beginPath(); x.arc(px, py, r + 6, 0, Math.PI * 2); x.stroke(); }
    });
    if (!sunDrawn) sun();
    {
      const [px, py] = pos[shown], t1 = c.planets[PLANETS[shown].n], t2 = orbitText(shown);
      x.font = '600 12px Geist, system-ui, sans-serif';
      const w1 = x.measureText(t1).width;
      x.font = '500 11px "Geist Mono", monospace';
      const w2 = x.measureText(t2).width;
      const bw = Math.max(w1, w2) + 22, bx = Math.max(8, Math.min(w - bw - 8, px + 14)), by = Math.max(8, py - 50);
      x.fillStyle = 'rgba(14,14,18,.86)'; x.beginPath(); x.roundRect(bx, by, bw, 40, 10); x.fill(); x.strokeStyle = 'rgba(255,255,255,.14)'; x.stroke();
      x.fillStyle = '#f3f3f1'; x.font = '600 12px Geist, system-ui, sans-serif'; x.fillText(t1, bx + 11, by + 16);
      x.fillStyle = '#a9a9b2'; x.font = '500 11px "Geist Mono", monospace'; x.fillText(t2, bx + 11, by + 31);
    }
  }, 60, active);
  const pick = (e: PointerEvent) => {
    const b = cv.current!.getBoundingClientRect(), mx = e.clientX - b.left, my = e.clientY - b.top, S = st.current;
    S.tTilt = 0.22 + 0.4 * Math.min(1, Math.max(0, my / b.height));
    let best = -1, bd = e.pointerType === 'mouse' ? 26 : 36;
    S.pos.forEach((q, i) => { const d = Math.hypot(q[0] - mx, q[1] - my); if (d < bd) { bd = d; best = i; } });
    // On touch a planet stays selected after the finger lifts, otherwise its label would be gone at once.
    if (e.pointerType === 'mouse' || e.type === 'pointerdown') S.hover = best;
    wake();
  };
  const onKey = (e: KeyboardEvent) => {
    const S = st.current, n = PLANETS.length;
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (e.key === 'Escape') { S.hover = -1; S.keyed = false; setAnnounce(''); return; }
    if (!delta) return;
    e.preventDefault();
    S.hover = S.hover < 0 ? (delta > 0 ? 0 : n - 1) : (S.hover + delta + n) % n;
    S.keyed = true;
    wake();
    setAnnounce(`${c.planets[PLANETS[S.hover].n]}: ${orbitText(S.hover)}`);
  };
  return (
    <>
      <canvas ref={cv} tabIndex={0} role="application" aria-label={c.orreryLabel} onPointerMove={pick} onPointerDown={pick} onKeyDown={onKey}
        onPointerLeave={(e) => { if (e.pointerType === 'mouse') st.current.hover = -1; }}
        onBlur={() => { st.current.hover = -1; st.current.keyed = false; setAnnounce(''); }}
        className="orrery" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'pan-y' }} />
      <p className="sr" aria-live="polite">{announce}</p>
    </>
  );
}

const WALLS = [
  { n: 'Dune', bg: 'radial-gradient(60% 50% at 75% 78%, #ffd3a1 0%, transparent 60%), radial-gradient(70% 60% at 20% 90%, #e98a55 0%, transparent 65%), linear-gradient(160deg, #241536 0%, #6d3350 50%, #c8694a 100%)', v: { bg: '#2a1b2e', surf: '#3a2638', ink: '#fff0e6', mute: '#d6b8b0', acc: '#ff9a62', accInk: '#2a1208' } },
  { n: 'Fjord', bg: 'radial-gradient(55% 45% at 30% 30%, #c6f1e7 0%, transparent 60%), radial-gradient(80% 60% at 80% 85%, #4fb3a9 0%, transparent 65%), linear-gradient(180deg, #06182a 0%, #0f4c5c 55%, #0b2f3d 100%)', v: { bg: '#0b2230', surf: '#123444', ink: '#e8fffb', mute: '#a7d3cd', acc: '#59d0c0', accInk: '#04211d' } },
  { n: 'Bloom', bg: 'radial-gradient(50% 45% at 70% 25%, #ffc2e2 0%, transparent 60%), radial-gradient(70% 60% at 25% 80%, #d64f9a 0%, transparent 62%), linear-gradient(200deg, #1a1033 0%, #4b2373 55%, #2a1446 100%)', v: { bg: '#22143a', surf: '#30204d', ink: '#fff0fa', mute: '#dcb9d6', acc: '#ff7ac0', accInk: '#33061d' } },
];

export function ThemeDemo({ active = true, still = false, focus = { x: 0.5, y: 0.5 }, c }: { active?: boolean; still?: boolean; focus?: Focus; c: Pick<StageCopy, 'site' | 'wallpaper' | 'injected' | 'chooseWall' | 'wallItem' | 'vars'> }) {
  const [i, setI] = useState(still ? 1 : 0);
  const hold = useRef(0);
  useEffect(() => {
    if (still || !active || reducedMotion()) return;
    const t = window.setInterval(() => { if (Date.now() > hold.current) setI((x) => (x + 1) % WALLS.length); }, 3200);
    return () => window.clearInterval(t);
  }, [active, still]);
  const v = WALLS[i].v;
  const vars = { '--fx': focus.x * 100 + '%', '--fy': focus.y * 100 + '%', '--w-bg': v.bg, '--w-surf': v.surf, '--w-ink': v.ink, '--w-mute': v.mute, '--w-acc': v.acc, '--w-acc-ink': v.accInk } as CSSProperties;
  const win: CSSProperties | undefined = still ? { left: '10%', top: '16%', width: '86%' } : undefined;
  return (
    <div className={'td' + (still ? ' still' : '')} style={vars}>
      {WALLS.map((w, k) => <div key={w.n} className={'td-wall' + (k === i ? ' on' : '')} style={{ background: w.bg }} aria-hidden="true" />)}
      <div className="td-win" style={win} aria-hidden="true">
        <div className="td-bar"><i /><i /><i /><span>{c.site}</span></div>
        <div className="td-body">
          <div className="td-nav"><b /><span /><span /><span /><em /></div>
          <div className="td-h"><span style={{ width: '64%' }} /><span style={{ width: '42%' }} /></div>
          <div className="td-p"><span style={{ width: '88%' }} /><span style={{ width: '72%' }} /></div>
          <div className="td-btns"><em /><span /></div>
          <div className="td-cards"><div /><div /><div /></div>
        </div>
      </div>
      {!still && (
        <div className="td-vars">
          <div className="tv-head"><span>{c.wallpaper}</span><b aria-live="polite">{WALLS[i].n}</b></div>
          <div className="td-pick" role="group" aria-label={c.chooseWall}>
            {WALLS.map((w, k) => <button key={w.n} type="button" aria-pressed={k === i} aria-label={c.wallItem.replace('{n}', w.n)} onClick={() => { setI(k); hold.current = Date.now() + 9000; }} style={{ background: w.bg }} />)}
          </div>
          <p className="tv-sub">{c.injected}</p>
          <ul className="tv-list" aria-label={c.vars}>
            {([['--accent', v.acc], ['--surface', v.surf], ['--text', v.ink], ['--muted', v.mute]] as const).map(([n, color]) => <li key={n}><i style={{ background: color }} /><code>{n}</code><span>{color}</span></li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Picks the stage that best shows what a project does. */
export function Showcase({ p, active = true, focus, eager = false, c, mochi, locale }: { p: Project; active?: boolean; focus: Focus; eager?: boolean; c: StageCopy; mochi: Pages['mochi']; locale: string }) {
  if (p.id === 'helios') return <Orrery active={active} focus={focus} c={c} locale={locale} />;
  if (p.id === 'huepr') return <ThemeDemo active={active} focus={focus} c={c} />;
  if (p.id === 'nothing') return <NothingStage active={active} focus={focus} c={c.nothing} locale={locale} />;
  if (p.kind === 'pixel') return (<><div className="kit-bg" style={{ '--t1': '#8a5a3c', '--t2': '#2f3d5c' } as CSSProperties} /><div className="stage-pet" style={{ left: `${focus.x * 100}%`, top: `${focus.y * 100}%` }}><MochiDevice c={mochi} /></div></>);
  const im = p.hero ?? p.img;
  return im ? <div className="istage"><Img im={im} alt={p.name} pos={p.pos} eager={eager} /></div> : <Typo p={p} stage />;
}
