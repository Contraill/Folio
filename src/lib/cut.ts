/* Notched "puzzle" panels: the coloured layer (.cut-fill) is clipped around every child marked
   [data-cut], leaving a constant moat. --r convex radius, --ri concave radius, --gap moat. */
type Point = [number, number];
type Rect = [number, number, number, number];

const numberVar = (el: Element, name: string, fallback: number) => {
  const value = parseFloat(getComputedStyle(el).getPropertyValue(name));
  return Number.isFinite(value) ? value : fallback;
};
const round2 = (x: number) => Math.round(x * 100) / 100;

function roundPath(points: Point[], r: number, ri: number) {
  const n = points.length;
  const corners = points.map((v, i) => {
    const p = points[(i - 1 + n) % n], q = points[(i + 1) % n];
    const ax = v[0] - p[0], ay = v[1] - p[1], bx = q[0] - v[0], by = q[1] - v[1];
    const la = Math.hypot(ax, ay) || 1e-9, lb = Math.hypot(bx, by) || 1e-9;
    const ux = ax / la, uy = ay / la, wx = bx / lb, wy = by / lb, cross = ux * wy - uy * wx;
    if (Math.abs(cross) < 1e-9) return { v, ux, uy, wx, wy, d: 0, t: 0, cross };
    const t = Math.tan(Math.acos(Math.max(-1, Math.min(1, -ux * wx - uy * wy))) / 2);
    const d = Math.min((cross > 0 ? r : ri) / t, la * 0.5, lb * 0.5);
    return { v, ux, uy, wx, wy, d, t, cross };
  });
  let path = '';
  corners.forEach((c, i) => {
    const a = [c.v[0] - c.ux * c.d, c.v[1] - c.uy * c.d], b = [c.v[0] + c.wx * c.d, c.v[1] + c.wy * c.d];
    path += (i ? 'L' : 'M') + round2(a[0]) + ',' + round2(a[1]);
    if (c.d > 0.01) { const radius = round2(c.d * c.t); path += `A${radius},${radius} 0 0 ${c.cross > 0 ? 1 : 0} ${round2(b[0])},${round2(b[1])}`; }
  });
  return path + 'Z';
}

/** Rectangle minus rectangles, as clockwise rectilinear loops. */
export function outline(w: number, h: number, cuts: Rect[]): Point[][] {
  const xs = [...new Set([0, w, ...cuts.flatMap((c) => [c[0], c[2]])])].filter((x) => x >= 0 && x <= w).sort((a, b) => a - b);
  const ys = [...new Set([0, h, ...cuts.flatMap((c) => [c[1], c[3]])])].filter((y) => y >= 0 && y <= h).sort((a, b) => a - b);
  const I = xs.length - 1, J = ys.length - 1;
  const filled = (i: number, j: number) => {
    if (i < 0 || j < 0 || i >= I || j >= J) return false;
    const cx = (xs[i] + xs[i + 1]) / 2, cy = (ys[j] + ys[j + 1]) / 2;
    return !cuts.some((c) => cx > c[0] && cx < c[2] && cy > c[1] && cy < c[3]);
  };
  const edges = new Map<string, [Point, Point][]>();
  const key = (p: Point) => p[0] + ',' + p[1];
  const add = (a: Point, b: Point) => { const k = key(a); if (!edges.has(k)) edges.set(k, []); edges.get(k)!.push([a, b]); };
  for (let i = 0; i < I; i++) for (let j = 0; j < J; j++) {
    if (!filled(i, j)) continue;
    const x0 = xs[i], x1 = xs[i + 1], y0 = ys[j], y1 = ys[j + 1];
    if (!filled(i, j - 1)) add([x0, y0], [x1, y0]);
    if (!filled(i + 1, j)) add([x1, y0], [x1, y1]);
    if (!filled(i, j + 1)) add([x1, y1], [x0, y1]);
    if (!filled(i - 1, j)) add([x0, y1], [x0, y0]);
  }
  const loops: Point[][] = [];
  while (edges.size) {
    const [startKey, startList] = edges.entries().next().value as [string, [Point, Point][]];
    let edge = startList.pop()!;
    if (!startList.length) edges.delete(startKey);
    const loop: Point[] = [edge[0]];
    for (let guard = 0; key(edge[1]) !== key(loop[0]) && guard < 1e4; guard++) {
      loop.push(edge[1]);
      const k = key(edge[1]), list = edges.get(k);
      if (!list) break;
      edge = list.pop()!;
      if (!list.length) edges.delete(k);
    }
    const corners = loop.filter((v, i) => {
      const p = loop[(i - 1 + loop.length) % loop.length], q = loop[(i + 1) % loop.length];
      return (v[0] - p[0]) * (q[1] - v[1]) - (v[1] - p[1]) * (q[0] - v[0]) !== 0;
    });
    if (corners.length >= 3) loops.push(corners);
  }
  return loops;
}

/** Measures the docked children of a panel and clips its fill around them. */
export function applyCut(panel: HTMLElement) {
  const fill = panel.querySelector<HTMLElement>(':scope > .cut-fill');
  if (!fill) return;
  const box = fill.getBoundingClientRect(), w = box.width, h = box.height;
  if (!w || !h) return;
  const gap = numberVar(panel, '--gap', 10), r = numberVar(panel, '--r', 24), ri = numberVar(panel, '--ri', r), snap = numberVar(panel, '--snap', gap * 2.5);
  const rects: Rect[] = [];
  panel.querySelectorAll<HTMLElement>('[data-cut]').forEach((el) => {
    if (el.closest('.cut') !== panel) return;
    const b = el.getBoundingClientRect(), g = el.dataset.gap !== undefined ? parseFloat(el.dataset.gap) : gap;
    const c: Rect = [b.left - box.left - g, b.top - box.top - g, b.right - box.left + g, b.bottom - box.top + g];
    if (c[0] < snap) c[0] = 0;
    if (c[1] < snap) c[1] = 0;
    if (w - c[2] < snap) c[2] = w;
    if (h - c[3] < snap) c[3] = h;
    rects.push([Math.max(0, c[0]), Math.max(0, c[1]), Math.min(w, c[2]), Math.min(h, c[3])]);
  });
  fill.style.clipPath = `path('${outline(w, h, rects).map((loop) => roundPath(loop, r, ri)).join(' ')}')`;
  panel.dataset.cutReady = '';
}

export const applyAllCuts = () => document.querySelectorAll<HTMLElement>('.cut').forEach(applyCut);
