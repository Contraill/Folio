import { Pause, Play, RotateCcw, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type RefObject } from 'react';
import type { Pages } from '@/content/schema';
import { basins, contours, grid, LEVELS, sample } from '@/lib/field';
import { reducedMotion } from '@/lib/motion';
import { useStore } from '@/lib/store';
import { Cut, useLoop, useMedia } from './kit';

/* Explorers do plain gradient descent on a made-up surface. It is a sketch of what learning
   looks like, not a model, and the page says so. */
type Walker = { x: number; y: number; vx: number; vy: number; tr: number[]; still: number; age: number; done: number };
type Api = { drop: (n: number) => void; calm: () => void };
const INK: Record<string, [string, string]> = { graphite: ['#e9e9e4', '#b8f26c'], paper: ['#1d1d1b', '#1c7a45'], blueprint: ['#cfe6ff', '#8fd8ff'], terminal: ['#9be9b2', '#7dffa8'] };

function Field({ paused, api, label }: { paused: boolean; api: RefObject<Api | null>; label: string }) {
  const effective = useStore((s) => s.effective);
  const cv = useRef<HTMLCanvasElement>(null);
  const S = useRef({ B: basins(5), t: 0, last: 0, ws: [] as Walker[], ptr: { x: 0.5, y: 0.5, a: 0, ta: 0 }, flash: [] as { x: number; y: number; t: number }[] });
  const mobile = useMedia('(max-width: 760px)');
  const spawn = (x?: number, y?: number) => {
    S.current.ws.push({ x: x ?? 0.05 + Math.random() * 0.9, y: y ?? 0.05 + Math.random() * 0.9, vx: 0, vy: 0, tr: [], still: 0, age: 0, done: 0 });
    if (S.current.ws.length > 70) S.current.ws.shift();
  };
  api.current = {
    drop: (n) => { for (let i = 0; i < n; i++) spawn(); wake(); },
    calm: () => { S.current.B = basins(Math.floor(Math.random() * 999) + 1); S.current.ws = []; for (let i = 0; i < 26; i++) spawn(); wake(); },
  };

  const wake = useLoop(cv, (now) => {
    const c = cv.current!, s = S.current, w = c.clientWidth, h = c.clientHeight;
    if (!w) return;
    if (!s.ws.length) for (let i = 0; i < 26; i++) spawn();
    const dpr = Math.min(devicePixelRatio || 1, mobile ? 1.25 : 2);
    if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const x = c.getContext('2d')!;
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const still = paused || reducedMotion();
    const dt = s.last ? Math.min(0.05, (now - s.last) / 1000) : 0.016;
    s.last = now;
    if (!still) s.t += dt;
    // Eases toward the target by time, not by frame: the same 8% per frame at 30 fps, at any frame rate.
    s.ptr.a += (s.ptr.ta - s.ptr.a) * (1 - Math.pow(0.92, dt * 30));
    const extra = { x: s.ptr.x, y: s.ptr.y, a: s.ptr.a, s: 0.09 };
    const [ink, sig] = INK[effective];
    x.clearRect(0, 0, w, h);
    const nx = mobile ? 48 : 88, ny = Math.round(nx * h / w), H = grid(s.B, s.t, nx, ny, extra), segs = contours(H, nx, ny, LEVELS);
    const sx = w / (nx - 1), sy = h / (ny - 1);
    x.strokeStyle = ink; x.lineWidth = 1;
    segs.forEach((seg, L) => {
      x.globalAlpha = 0.08 + (1 - L / LEVELS.length) * 0.28;
      x.beginPath();
      for (let q = 0; q < seg.length; q += 4) { x.moveTo(seg[q] * sx, seg[q + 1] * sy); x.lineTo(seg[q + 2] * sx, seg[q + 3] * sy); }
      x.stroke();
    });
    x.globalAlpha = 1;
    s.ws.forEach((p) => {
      if (!still && !p.done) {
        const [, gx, gy] = sample(s.B, s.t, p.x, p.y, extra);
        p.vx = p.vx * 0.86 + gx * 0.00055 + (Math.random() - 0.5) * 0.0006;
        p.vy = p.vy * 0.86 + gy * 0.00055 + (Math.random() - 0.5) * 0.0006;
        const sp = Math.hypot(p.vx, p.vy), mx = 0.0045;
        if (sp > mx) { p.vx *= mx / sp; p.vy *= mx / sp; }
        p.x = Math.min(0.995, Math.max(0.005, p.x + p.vx));
        p.y = Math.min(0.995, Math.max(0.005, p.y + p.vy));
        p.tr.push(p.x, p.y);
        if (p.tr.length > 44) p.tr.splice(0, 2);
        p.still = Math.hypot(p.vx, p.vy) < 0.0007 ? p.still + dt : 0;
        p.age += dt;
        if (p.still > 1.4) { p.done = now; s.flash.push({ x: p.x, y: p.y, t: now }); }
      }
      x.strokeStyle = sig; x.lineWidth = 1.4; x.globalAlpha = 0.5;
      x.beginPath();
      for (let q = 0; q < p.tr.length; q += 2) { const X = p.tr[q] * w, Y = p.tr[q + 1] * h; if (q) x.lineTo(X, Y); else x.moveTo(X, Y); }
      x.stroke();
      x.globalAlpha = 1; x.fillStyle = sig;
      x.beginPath(); x.arc(p.x * w, p.y * h, 2.4, 0, Math.PI * 2); x.fill();
    });
    // A walker that settled leaves a ring, then a fresh one starts somewhere else.
    s.flash = s.flash.filter((f) => now - f.t < 1200);
    s.flash.forEach((f) => { const k = (now - f.t) / 1200; x.strokeStyle = sig; x.globalAlpha = 1 - k; x.lineWidth = 1.5; x.beginPath(); x.arc(f.x * w, f.y * h, 4 + k * 26, 0, Math.PI * 2); x.stroke(); });
    x.globalAlpha = 1;
    s.ws = s.ws.filter((p) => !p.done || now - p.done < 900);
    while (!still && s.ws.length < 26) spawn();
    // Paused or reduced motion: draw only while the surface is still settling after an input.
    return !still || Math.abs(s.ptr.ta - s.ptr.a) > 0.01 || s.flash.length > 0;
  }, 30, effective + String(mobile));
  useEffect(wake, [paused, wake]);

  const relative = (e: PointerEvent) => { const b = cv.current!.getBoundingClientRect(); return [(e.clientX - b.left) / b.width, (e.clientY - b.top) / b.height]; };
  return (
    <canvas ref={cv} className="field" role="img" aria-label={label}
      onPointerMove={(e) => { const [px, py] = relative(e); Object.assign(S.current.ptr, { x: px, y: py, ta: -0.9 }); wake(); }}
      onPointerLeave={() => { S.current.ptr.ta = 0; wake(); }}
      onPointerDown={(e) => { const [px, py] = relative(e); for (let i = 0; i < 6; i++) spawn(px + (Math.random() - 0.5) * 0.06, py + (Math.random() - 0.5) * 0.06); wake(); }} />
  );
}

export default function LabStage({ c, ready = false }: { c: Pages['lab']; ready?: boolean }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => { if (reducedMotion()) setPaused(true); }, []);
  const api = useRef<Api | null>(null);
  return (
    <Cut as="section" className="lab-stage" label={c.label}>
      <div className="cut-fill" suppressHydrationWarning><Field paused={paused} api={api} label={c.canvas} /></div>
      <div className="lab-intro">
        <p className="lab-kicker" data-reveal suppressHydrationWarning><span className={ready ? 'live-dot' : 'wip-dot'} /> {c.kicker}</p>
        <h1 className="lab-h1" data-reveal suppressHydrationWarning style={{ '--i': 1 } as CSSProperties}>ai lab<span className="caret" aria-hidden="true">_</span></h1>
        <p className="lab-lede" data-reveal suppressHydrationWarning style={{ '--i': 2 } as CSSProperties}>{c.lede}</p>
      </div>
      <div className="lab-tools glass" role="group" aria-label={c.controls}>
        <button type="button" className="chip-btn primary" onClick={() => api.current?.drop(12)}><Sparkles size={15} aria-hidden="true" /><span>{c.drop}</span></button>
        <button type="button" className="chip-btn" onClick={() => api.current?.calm()}><RotateCcw size={15} aria-hidden="true" /><span>{c.surface}</span></button>
        <button type="button" className="chip-btn" onClick={() => setPaused((p) => !p)}>{paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}<span>{paused ? c.resume : c.pause}</span></button>
      </div>
      <div className="dock lab-note" data-cut>
        <div className="nb">
          <p className="nb-h">{c.notebook}</p>
          <ul>
            <li><span className="st now">{c.now}</span>{c.nowText}</li>
            <li><span className="st">{c.nextLabel}</span>{c.nextText}</li>
            <li><span className="st">{c.rule}</span>{c.ruleText}</li>
          </ul>
          <p className="nb-foot">{c.foot}</p>
        </div>
      </div>
    </Cut>
  );
}
