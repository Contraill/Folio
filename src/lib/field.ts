/* A made-up landscape: a few Gaussian basins that drift slowly.
   Used by the Lab stage (canvas) and the home teaser (SVG). Decorative only. */
export type Basin = { x: number; y: number; a: number; s: number; ox: number; oy: number; f: number };

export function basins(seed = 3): Basin[] {
  let s = seed; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: 6 }, (_, i) => ({ x: 0.12 + r() * 0.76, y: 0.15 + r() * 0.7, a: (i % 3 === 0 ? 0.6 : -1) * (0.55 + r() * 0.6), s: 0.1 + r() * 0.12, ox: r() * 6, oy: r() * 6, f: 0.05 + r() * 0.08 }));
}

export function at(B: Basin[], t: number, i: number) {
  const b = B[i]; return [b.x + Math.sin(t * b.f + b.ox) * 0.05, b.y + Math.cos(t * b.f * 0.8 + b.oy) * 0.05] as const;
}

/** height and gradient at (x, y), coordinates in 0..1 */
export function sample(B: Basin[], t: number, x: number, y: number, extra?: { x: number; y: number; a: number; s: number }) {
  let h = 0, gx = 0, gy = 0;
  const add = (cx: number, cy: number, a: number, s: number) => {
    const dx = x - cx, dy = y - cy, e = a * Math.exp(-(dx * dx + dy * dy) / (2 * s * s));
    h += e; gx += (-dx / (s * s)) * e; gy += (-dy / (s * s)) * e;
  };
  for (let i = 0; i < B.length; i++) { const [cx, cy] = at(B, t, i); add(cx, cy, B[i].a, B[i].s); }
  if (extra && extra.a) add(extra.x, extra.y, extra.a, extra.s);
  return [h, gx, gy] as const;
}

/** Marching squares over a grid of heights. Returns line segments per level in grid units. */
export function contours(H: Float32Array, nx: number, ny: number, levels: number[]) {
  const out: number[][] = levels.map(() => []);
  for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = H[j * nx + i], b = H[j * nx + i + 1], c = H[(j + 1) * nx + i + 1], d = H[(j + 1) * nx + i];
    for (let L = 0; L < levels.length; L++) {
      const v = levels[L];
      const k = (a > v ? 8 : 0) | (b > v ? 4 : 0) | (c > v ? 2 : 0) | (d > v ? 1 : 0);
      if (k === 0 || k === 15) continue;
      const tp = [i + (v - a) / (b - a), j], rt = [i + 1, j + (v - b) / (c - b)], bt = [i + (v - d) / (c - d), j + 1], lf = [i, j + (v - a) / (d - a)];
      const seg = (p: number[], q: number[]) => out[L].push(p[0], p[1], q[0], q[1]);
      switch (k) {
        case 1: case 14: seg(lf, bt); break; case 2: case 13: seg(bt, rt); break; case 3: case 12: seg(lf, rt); break;
        case 4: case 11: seg(tp, rt); break; case 6: case 9: seg(tp, bt); break; case 7: case 8: seg(lf, tp); break;
        case 5: seg(lf, tp); seg(bt, rt); break; case 10: seg(tp, rt); seg(lf, bt); break;
      }
    }
  }
  return out;
}

export function grid(B: Basin[], t: number, nx: number, ny: number, extra?: { x: number; y: number; a: number; s: number }) {
  const H = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) H[j * nx + i] = sample(B, t, i / (nx - 1), j / (ny - 1), extra)[0];
  return H;
}
export const LEVELS = [-1.1, -0.85, -0.62, -0.42, -0.25, -0.1, 0.05, 0.2, 0.38];
