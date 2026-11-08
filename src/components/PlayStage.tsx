import { Pause, Play as PlayIcon, Shuffle } from 'lucide-react';
import { useEffect, useRef, useState, type RefObject } from 'react';
import type { Pages } from '@/content/schema';
import { reducedMotion } from '@/lib/motion';
import { Cut, useLoop, useMedia } from './kit';

/* A toy box: circles with gravity. Not a game. */
type Body = { x: number; y: number; vx: number; vy: number; r: number; c: string; l?: string; ring?: boolean; face?: boolean; star?: boolean; a: number; pin?: boolean };
type Peg = { x: number; y: number; r: number };
type World = { P: Peg[]; B: Body[]; w: number; h: number; grab: number; gx: number; gy: number };
const COLORS = ['#ff5a36', '#ffd23f', '#3ec7ff', '#7a5cff', '#20c997', '#ff7ac0', '#f3f3f1'];

/* Pegs give the box some structure: big pieces (the letters) rest on them,
   small ones fall through, so the scene stays composed after things settle. */
function pegs(w: number, h: number, mobile: boolean): Peg[] {
  const out: Peg[] = [], sp = mobile ? 62 : 96, r = mobile ? 5 : 7;
  const x0 = mobile ? 0.1 : 0.47, x1 = mobile ? 0.9 : 0.95, y0 = 0.3, y1 = mobile ? 0.6 : 0.64;
  for (let row = 0, y = h * y0; y < h * y1; y += sp * 0.82, row++) for (let x = w * x0 + (row % 2 ? sp / 2 : 0); x < w * x1; x += sp) out.push({ x, y, r });
  if (!mobile) for (let x = w * 0.07; x < w * 0.4; x += 74) out.push({ x, y: h * 0.66, r });
  return out;
}

function make(w: number, h: number, found: boolean, k: number): Body[] {
  let s = 9;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const B: Body[] = [];
  // The letters start resting in the gaps of the first peg row and stay pinned until
  // something moves them, so the word reads P L A Y.
  const sp = k < 1 ? 62 : 96, pr = k < 1 ? 5 : 7, lr = k < 1 ? 28 : 52, x0 = w * (k < 1 ? 0.1 : 0.47) + sp / 2;
  const ry = h * 0.3 - Math.sqrt((lr + pr) ** 2 - (sp / 2) ** 2);
  ['P', 'L', 'A', 'Y'].forEach((l, i) => B.push({ x: x0 + sp * (k < 1 ? i : i * 2), y: ry, vx: 0, vy: 0, r: lr, c: COLORS[i], l, a: 0, pin: true }));
  B.push({ x: w * 0.7, y: -h * 1.4, vx: 0, vy: 0, r: 40 * k, c: '#111114', face: true, a: 0 });
  for (let i = 0; i < 16; i++) B.push({ x: w * (0.08 + r() * 0.84), y: -h * (0.3 + r() * 1.6), vx: 0, vy: 0, r: (13 + r() * 18) * k, c: COLORS[i % COLORS.length], ring: i % 5 === 0, a: 0 });
  if (found) B.push({ x: w * 0.5, y: -h * 2, vx: 0, vy: 0, r: 30 * k, c: '#ffd23f', star: true, a: 0 });
  return B;
}

function step(s: World, dt: number) {
  const { B, w, h, P } = s;
  B.forEach((b, i) => {
    if (b.pin) { b.vx = 0; b.vy = 0; return; }
    if (i === s.grab) { b.vx = (s.gx - b.x) / dt * 0.35; b.vy = (s.gy - b.y) / dt * 0.35; } else b.vy += 2200 * dt;
    b.x += b.vx * dt; b.y += b.vy * dt; b.vx *= 0.999; b.a += (b.vx / b.r) * dt;
    if (b.y > h - b.r) { b.y = h - b.r; b.vy *= -0.42; b.vx *= 0.985; if (Math.abs(b.vy) < 30) b.vy = 0; }
    if (b.x < b.r) { b.x = b.r; b.vx *= -0.5; }
    if (b.x > w - b.r) { b.x = w - b.r; b.vx *= -0.5; }
    for (const g of P) {
      const dx = b.x - g.x, dy = b.y - g.y, d = Math.hypot(dx, dy), m = b.r + g.r;
      if (d >= m || d === 0) continue;
      const nx = dx / d, ny = dy / d;
      b.x = g.x + nx * m; b.y = g.y + ny * m;
      const vn = b.vx * nx + b.vy * ny;
      if (vn < 0) { b.vx -= 1.5 * vn * nx; b.vy -= 1.5 * vn * ny; b.vx *= 0.98; }
    }
    // Pieces at rest turn back upright so the letters stay readable.
    if (Math.hypot(b.vx, b.vy) < 60 && i !== s.grab) { b.a = Math.atan2(Math.sin(b.a), Math.cos(b.a)) * 0.9; if (b.l) b.vx *= 0.9; }
  });
  for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) {
    const a = B[i], b = B[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = a.r + b.r;
    if (d >= m || d === 0) continue;
    const nx = dx / d, ny = dy / d, o = (m - d) / 2;
    if (a.pin && b.pin) continue;
    if (a.pin) { b.x += nx * o * 2; b.y += ny * o * 2; const vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= 1.45 * vn * nx; b.vy -= 1.45 * vn * ny; } continue; }
    if (b.pin) { a.x -= nx * o * 2; a.y -= ny * o * 2; const vn = a.vx * nx + a.vy * ny; if (vn > 0) { a.vx -= 1.45 * vn * nx; a.vy -= 1.45 * vn * ny; } continue; }
    a.x -= nx * o; a.y -= ny * o; b.x += nx * o; b.y += ny * o;
    const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (rv > 0) continue;
    const ma = a.r * a.r, mb = b.r * b.r, jj = (-(1 + 0.45) * rv) / (1 / ma + 1 / mb);
    a.vx -= (jj * nx) / ma; a.vy -= (jj * ny) / ma; b.vx += (jj * nx) / mb; b.vy += (jj * ny) / mb;
  }
}

function draw(x: CanvasRenderingContext2D, s: World, dpr: number) {
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  x.clearRect(0, 0, s.w, s.h);
  const ink = getComputedStyle(x.canvas).color;
  s.P.forEach((g) => { x.fillStyle = ink; x.globalAlpha = 0.18; x.beginPath(); x.arc(g.x, g.y + 2, g.r + 1, 0, Math.PI * 2); x.fill(); x.globalAlpha = 0.85; x.beginPath(); x.arc(g.x, g.y, g.r, 0, Math.PI * 2); x.fill(); });
  x.globalAlpha = 1;
  s.B.forEach((b, i) => {
    x.save();
    x.translate(b.x, b.y);
    x.rotate(b.a);
    if (i === s.grab) { x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 24; x.shadowOffsetY = 10; }
    if (b.ring) { x.strokeStyle = b.c; x.lineWidth = b.r * 0.45; x.beginPath(); x.arc(0, 0, b.r * 0.78, 0, Math.PI * 2); x.stroke(); } else { x.fillStyle = b.c; x.beginPath(); x.arc(0, 0, b.r, 0, Math.PI * 2); x.fill(); }
    x.shadowColor = 'transparent';
    if (b.l) { x.fillStyle = b.c === '#ffd23f' || b.c === '#f3f3f1' ? '#141414' : '#fff'; x.font = `900 ${b.r * 1.15}px Archivo, system-ui, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(b.l, 0, b.r * 0.06); }
    if (b.face) { x.fillStyle = '#eaf2ff'; const u = b.r / 10; x.fillRect(-5 * u, -3 * u, 3 * u, 4.5 * u); x.fillRect(2 * u, -3 * u, 3 * u, 4.5 * u); x.fillRect(-1.2 * u, 3.4 * u, 2.4 * u, 0.8 * u); }
    if (b.star) { x.fillStyle = '#141414'; x.beginPath(); for (let k = 0; k < 8; k++) { const rr = k % 2 ? b.r * 0.22 : b.r * 0.6, an = (k / 8) * Math.PI * 2 - Math.PI / 2; x.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } x.fill(); }
    x.restore();
  });
}

const foundStar = () => { try { return JSON.parse(localStorage.getItem('fx-secret') ?? 'false') === true; } catch { return false; } };

function ToyBox({ paused, api, label }: { paused: boolean; api: RefObject<{ shake: () => void } | null>; label: string }) {
  const mobile = useMedia('(max-width: 760px)');
  const cv = useRef<HTMLCanvasElement>(null);
  const S = useRef({ P: [] as Peg[], B: [] as Body[], w: 0, h: 0, grab: -1, gx: 0, gy: 0, hist: [] as [number, number, number][], last: 0, mobile: false });
  api.current = { shake: () => { S.current.B.forEach((b) => { b.pin = false; b.vx += (Math.random() - 0.5) * 900; b.vy -= 500 + Math.random() * 900; }); wake(); } };

  // Touching a piece takes the gesture away from page scrolling; touching empty space still scrolls.
  useEffect(() => {
    const canvas = cv.current!;
    const onTouch = (e: TouchEvent) => {
      const b = canvas.getBoundingClientRect(), t = e.touches[0], x = t.clientX - b.left, y = t.clientY - b.top;
      if (S.current.B.some((body) => Math.hypot(body.x - x, body.y - y) < body.r + 6)) e.preventDefault();
    };
    canvas.addEventListener('touchstart', onTouch, { passive: false });
    return () => canvas.removeEventListener('touchstart', onTouch);
  }, []);

  const wake = useLoop(cv, (now) => {
    const c = cv.current!, s = S.current, w = c.clientWidth, h = c.clientHeight;
    if (!w) return;
    const dpr = Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2);
    if (c.width !== Math.round(w * dpr) || !s.B.length || s.mobile !== mobile) {
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); s.w = w; s.h = h; s.mobile = mobile;
      s.B = make(w, h, foundStar(), mobile ? 0.62 : 1);
      s.P = pegs(w, h, mobile);
      if (reducedMotion()) { for (let i = 0; i < 900; i++) step(s, 1 / 120); s.B.forEach((b) => { b.a = 0; }); }
    }
    const dt = s.last ? Math.min(1 / 30, (now - s.last) / 1000) : 1 / 60;
    s.last = now;
    const active = !paused && (!reducedMotion() || s.grab >= 0);
    if (active) for (let k = 0; k < 3; k++) step(s, dt / 3);
    draw(c.getContext('2d')!, s, dpr);
    // Paused or reduced motion: the frame just drawn stays until something changes.
    if (!active) s.last = 0;
    return active;
  }, 60, String(mobile));
  useEffect(wake, [paused, wake]);

  const position = (e: React.PointerEvent) => { const b = cv.current!.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
  return (
    <canvas ref={cv} className="toybox" role="img" aria-label={label}
      onPointerDown={(e) => {
        const s = S.current, [x, y] = position(e);
        (e.target as Element).setPointerCapture(e.pointerId);
        s.grab = s.B.findIndex((b) => Math.hypot(b.x - x, b.y - y) < b.r + 6);
        if (s.grab >= 0) s.B[s.grab].pin = false;
        s.hist = [[x, y, performance.now()]];
        s.gx = x; s.gy = y;
        if (s.grab < 0) s.B.forEach((b) => { const d = Math.hypot(b.x - x, b.y - y); if (d < 180) { b.pin = false; const f = (1 - d / 180) * 900; b.vx += ((b.x - x) / (d || 1)) * f; b.vy += ((b.y - y) / (d || 1)) * f - 200; } });
        wake();
      }}
      onPointerMove={(e) => { const s = S.current; if (s.grab < 0) return; const [x, y] = position(e); s.gx = x; s.gy = y; s.hist.push([x, y, performance.now()]); if (s.hist.length > 5) s.hist.shift(); }}
      onPointerUp={() => {
        const s = S.current;
        if (s.grab < 0) return;
        const b = s.B[s.grab], a = s.hist[0], z = s.hist[s.hist.length - 1], t = Math.max(16, z[2] - a[2]) / 1000;
        b.vx = Math.max(-2600, Math.min(2600, (z[0] - a[0]) / t));
        b.vy = Math.max(-2600, Math.min(2600, (z[1] - a[1]) / t));
        s.grab = -1;
      }}
      onPointerCancel={() => { S.current.grab = -1; }} />
  );
}

export default function PlayStage({ c }: { c: Pages['play'] }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => { if (reducedMotion()) setPaused(true); }, []);
  const api = useRef<{ shake: () => void } | null>(null);
  return (
    <Cut as="section" className="play-stage" label={c.label}>
      <div className="cut-fill" suppressHydrationWarning>
        <p className="play-word" aria-hidden="true">Play</p>
        <ToyBox paused={paused} api={api} label={c.canvas} />
      </div>
      <div className="dock play-note" data-cut>
        <div className="pn">
          <p className="eyebrow"><span className="live-dot" /> {c.status}</p>
          <h1 className="play-h1">{c.h1}</h1>
          <p className="small">{c.note}</p>
          <div className="pn-btns">
            <button type="button" className="btn btn-1 btn-sm" onClick={() => api.current?.shake()}><Shuffle size={15} aria-hidden="true" /> {c.shake}</button>
            <button type="button" className="btn btn-2 btn-sm" onClick={() => setPaused((p) => !p)}>{paused ? <PlayIcon size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />} {paused ? c.resume : c.pause}</button>
          </div>
        </div>
      </div>
    </Cut>
  );
}
