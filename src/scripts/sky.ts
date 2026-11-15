/* The hero's background: the stack as a constellation, densest round Mochi and fading out with distance, faint behind
   the text. The technologies drift slowly and link up with their neighbours, and Mochi is linked to the six nearest.
   The pointer lights up the stars near it; poking Mochi runs a pulse along its links in the colour of its mood. It
   draws only while on screen and the tab is visible, at 30 frames a second; with reduced motion it is a still
   picture. startSky returns a function that stops it. */
type RGB = [number, number, number];
type Star = { x: number; y: number; vx: number; vy: number; z: number; label?: string; flash: number; seed: number };
const SUN: RGB = [16, 157, 217], GLINT: RGB = [139, 213, 255], LILAC: RGB = [198, 160, 246];
const FRAME: RGB = [82, 100, 115], MUTE: RGB = [138, 145, 155], INK: RGB = [245, 245, 245];
const MOOD: Record<string, RGB> = { happy: GLINT, love: [245, 189, 230], dizzy: LILAC };
const STACK = ['TypeScript', 'React', 'Vue 3', 'Node.js', 'Python', 'FastAPI', 'Firebase', 'Docker', 'Linux', 'Three.js', 'SQL', 'ESP32', 'C++', 'Vite', 'GitHub Actions', 'Tailwind'];
const LINK = 140, LEVELS = 6; // the longest link; links are drawn in this many strengths, one path each

const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
const mix = (a: RGB, b: RGB, k: number): RGB => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const smooth = (a: number, b: number, v: number) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

export function startSky(canvas: HTMLCanvasElement, face: HTMLElement | null): () => void {
  const ctx = canvas.getContext('2d')!;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w = 0, h = 0, cx = 0, cy = 0, mw = 0, mh = 0, core = 1, spread = 1, reach = 1, t = 0, raf = 0, last = 0, onScreen = false;
  let stars: Star[] = [];
  let pointer: { x: number; y: number } | null = null;
  const ripples: { r: number; c: RGB }[] = [];

  // 1 round Mochi, falling away with distance, 0 at the canvas edges.
  const fade = (x: number, y: number) =>
    Math.exp(-((Math.max(0, Math.hypot(x - cx, y - cy) - core) / spread) ** 1.6)) * smooth(0, 40, Math.min(x, w - x)) * smooth(0, 40, Math.min(y, h - y));
  const outside = (x: number, y: number) => ((x - cx) / (mw * 0.7)) ** 2 + ((y - cy) / (mh * 0.75)) ** 2 > 1;

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Centred on Mochi where the layout puts it, ignoring the float and drop animations (offsets skip transforms).
    let x = 0, y = 0, n: HTMLElement | null = face;
    while (n && n !== canvas.offsetParent) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent as HTMLElement | null; }
    const found = face && n === canvas.offsetParent;
    mw = face?.offsetWidth || 260; mh = face?.offsetHeight || 180;
    cx = found ? x - canvas.offsetLeft + mw / 2 : w * 0.7; cy = found ? y - canvas.offsetTop + mh / 2 : h / 2;
    core = Math.max(mw, mh) * 0.45; spread = Math.max(240, w * 0.26);
    reach = Math.max(...[[0, 0], [w, 0], [0, h], [w, h]].map(([a, b]) => Math.hypot(a - cx, b - cy))) * 0.8;
    // The technologies only where the backdrop is strong, away from the text and from each other; plain stars anywhere.
    stars = [];
    const place = (label?: string) => {
      for (let k = 0; k < 60; k++) {
        const x = 40 + Math.random() * (w - (label ? 170 : 80)), y = 50 + Math.random() * (h - 100);
        if (!outside(x, y) || (label && fade(x, y) < 0.45)) continue;
        if (label && stars.some((s) => s.label && Math.abs(s.x - x) < 120 && Math.abs(s.y - y) < 46)) continue;
        stars.push({ x, y, vx: (Math.random() - 0.5) * 9, vy: (Math.random() - 0.5) * 9, z: label ? 0.8 + Math.random() * 0.2 : 0.3 + Math.random() * 0.5, label, flash: 0, seed: Math.random() * 7 });
        return;
      }
    };
    STACK.forEach(place);
    for (let k = Math.round((w * h) / 11000); k > 0; k--) place();
  };

  const draw = (dt: number) => {
    for (const s of stars) {
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.x < 30 || s.x > w - 30) s.vx *= -1;
      if (s.y < 40 || s.y > h - 40) s.vy *= -1;
      if (!outside(s.x, s.y)) { s.vx = (s.x - cx) * 0.06; s.vy = (s.y - cy) * 0.06; }
      s.flash = Math.max(0, s.flash - dt * 1.6);
    }
    // Everything fades with distance from Mochi: each star by where it is, each link by its fainter end.
    const faded = stars.map((s) => fade(s.x, s.y));
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;
    // A few paths by strength rather than a stroke per pair: hundreds of strokes a frame were a long task on phones.
    const links = Array.from({ length: LEVELS }, () => new Path2D());
    for (let i = 0; i < stars.length; i++) for (let j = i + 1; j < stars.length; j++) {
      const a = stars[i], b = stars[j], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d > LINK) continue;
      const strength = (1 - d / LINK) * Math.min(a.z, b.z) * Math.min(faded[i], faded[j]);
      if (strength < 0.04) continue;
      const path = links[Math.min(LEVELS - 1, Math.floor(strength * LEVELS))];
      path.moveTo(a.x, a.y); path.lineTo(b.x, b.y);
    }
    links.forEach((path, k) => { ctx.strokeStyle = rgba(FRAME, ((k + 0.5) / LEVELS) * 0.55); ctx.stroke(path); });
    // Mochi's links to its six nearest technologies; a poke runs along them and lights each one as it arrives.
    const hub = stars.filter((s) => s.label).sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy)).slice(0, 6);
    for (const s of hub) {
      const d = Math.hypot(s.x - cx, s.y - cy);
      ctx.strokeStyle = rgba(SUN, (0.22 + 0.1 * Math.sin(t * 1.4 + s.seed)) * fade(s.x, s.y));
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(s.x, s.y); ctx.stroke();
      for (const r of ripples) {
        if (r.r > d + 10) { s.flash = Math.max(s.flash, 1 - (r.r - d) / 400); continue; }
        const k = r.r / d;
        ctx.fillStyle = rgba(r.c, 0.95);
        ctx.beginPath(); ctx.arc(cx + (s.x - cx) * k, cy + (s.y - cy) * k, 2.6, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.font = '500 11px "Geist Mono", ui-monospace, monospace';
    ctx.textBaseline = 'middle';
    stars.forEach((s, i) => {
      const f = faded[i];
      if (f < 0.02) return;
      const near = pointer ? Math.max(0, 1 - Math.hypot(s.x - pointer.x, s.y - pointer.y) / 150) : 0;
      if (near > 0 && pointer) {
        ctx.strokeStyle = rgba(GLINT, near * 0.6 * f);
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(pointer.x, pointer.y); ctx.stroke();
      }
      const twinkle = s.label ? 1 : 0.6 + 0.4 * Math.sin(t * 1.5 + s.seed), glow = Math.max(near, s.flash);
      ctx.fillStyle = rgba(mix(s.label ? GLINT : FRAME, INK, glow), (0.35 + 0.65 * s.z) * twinkle * f);
      ctx.beginPath(); ctx.arc(s.x, s.y, 1 + s.z * 1.6 + glow * 1.5, 0, Math.PI * 2); ctx.fill();
      if (s.label) {
        ctx.fillStyle = rgba(mix(MUTE, INK, glow), (0.6 + 0.4 * glow) * f);
        ctx.fillText(s.label, s.x + 8, s.y);
      }
    });
  };

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (now - last < 1000 / 30) return;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    t += dt;
    for (const r of ripples) r.r += 340 * dt;
    while (ripples.length && ripples[0].r > reach) ripples.shift();
    draw(dt);
  };
  const run = () => {
    cancelAnimationFrame(raf);
    if (still) { draw(0); return; }
    if (onScreen && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); }
  };

  const off = new AbortController();
  const { signal } = off;
  // The pointer is followed over the whole hero, so the stars answer even while it is over Mochi or the text.
  const area = canvas.closest('section') ?? canvas;
  area.addEventListener('pointermove', (e) => { const b = canvas.getBoundingClientRect(); pointer = { x: (e as PointerEvent).clientX - b.left, y: (e as PointerEvent).clientY - b.top }; if (still) draw(0); }, { passive: true, signal });
  area.addEventListener('pointerleave', () => { pointer = null; if (still) draw(0); }, { signal });
  // A poke sends a pulse in the colour of the mood Mochi shows a moment later.
  face?.addEventListener('click', () => window.setTimeout(() => {
    const mood = Object.keys(MOOD).find((m) => face.classList.contains(`is-${m}`)) ?? 'happy';
    ripples.push({ r: 30, c: MOOD[mood] });
  }, 30), { signal });
  document.addEventListener('visibilitychange', run, { signal });
  const seen = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; run(); });
  seen.observe(canvas);
  const sized = new ResizeObserver(() => { resize(); if (still) draw(0); });
  sized.observe(canvas);
  resize();
  return () => { off.abort(); seen.disconnect(); sized.disconnect(); cancelAnimationFrame(raf); };
}
