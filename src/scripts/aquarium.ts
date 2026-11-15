/* A small koi aquarium inside one element (the contact card): koi drawn in ASCII characters on an 8px grid, in the colours of my
   terminal palette. Pressing open water in the card (not a link or button) drops food; the koi nearby turn for it and
   eat. The card's heading is written in food too, and comes back each time the card does. It draws only while the card is on screen and the tab is visible, and the fish drift slowly with reduced
   motion. startAquarium returns a function that stops it. */
const CELL = 8;
const SEGMENTS = 10;
const PROFILE = [0.7, 0.94, 1, 0.98, 0.9, 0.78, 0.62, 0.46, 0.32, 0.22];
type P = { x: number; y: number };
type Spot = { u: number; v: number; ru: number; rv: number; c: string };
type Koi = {
  pts: P[]; angle: number; speed: number; base: number; seg: number; width: number; phase: number; body: string; fin: string; spots: Spot[];
  /** Slow drift of its heading; frames to the next tail beat and how hard that beat was; fright left and its cause. */
  wander: number; beat: number; kick: number; startle: number; flee: P | null;
  /** How near the surface it swims, 0.55–1: deeper koi are fainter and pass under the others. */
  depth: number;
  /** The open water it is heading for, and frames until it looks for another; frames of contentment after eating. */
  goal: P; roam: number; full: number;
};
type Rect = { l: number; t: number; r: number; b: number };
type Food = { x: number; y: number; age: number; fixed?: boolean };
type Ring = { x: number; y: number; r: number; a: number };

// The kitty palette from my desktop: foreground, accent, cyan, blue, magenta, teal.
const WHITE = '#f5f5f5', ACCENT = '#109dd9', CYAN = '#8bd5ff', BLUE = '#7aa2f7', MAGENTA = '#c6a0f6', TEAL = '#8bd5ca', NIGHT = '#1b2430';
const VARIETIES: { w: number; body: string; spots: string[]; head?: string }[] = [
  { w: 3, body: WHITE, spots: [ACCENT, ACCENT, CYAN] },
  { w: 2, body: WHITE, spots: [MAGENTA, BLUE] },
  { w: 1, body: NIGHT, spots: [CYAN, WHITE, ACCENT] },
  { w: 1, body: WHITE, spots: [], head: ACCENT },
  { w: 2, body: BLUE, spots: [CYAN] },
  { w: 1, body: MAGENTA, spots: [WHITE] },
  { w: 1, body: TEAL, spots: [WHITE] },
];
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const alpha = (a: number) => Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, '0');

export function startAquarium(canvas: HTMLCanvasElement, host: HTMLElement): () => void {
  const ctx = canvas.getContext('2d')!;
  let w = 0, h = 0, dpr = 1;
  const fish: Koi[] = [], food: Food[] = [], rings: Ring[] = [];
  /** Where the pointer is over the water and how fast it moves, in px per frame. */
  let pointer: (P & { v: number }) | null = null;
  /** The card's text and buttons, which the koi swim around rather than under. */
  let obstacles: Rect[] = [];
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = host.clientWidth; h = host.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // The tight box of each piece of content, from its text rather than its block, so a heading's empty side is water.
    const box = host.getBoundingClientRect();
    obstacles = [...host.children].filter((el) => !(el instanceof HTMLCanvasElement) && !el.classList.contains('shout')).flatMap((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const r = range.getBoundingClientRect();
      return r.width && r.height ? [{ l: r.left - box.left - 16, t: r.top - box.top - 12, r: r.right - box.left + 16, b: r.bottom - box.top + 12 }] : [];
    });
    // As many koi as the open water holds without crowding: the card less its content, a koi per 90,000 px², 3 to 6.
    const water = w * h - obstacles.reduce((n, o) => n + Math.max(0, Math.min(o.r, w) - Math.max(o.l, 0)) * Math.max(0, Math.min(o.b, h) - Math.max(o.t, 0)), 0);
    const want = Math.max(3, Math.min(6, Math.round(water / 90000)));
    while (fish.length < want) { const at = openSpot(null); fish.push(spawn(at.x, at.y)); }
    fish.length = want;
  };

  function spawn(x: number, y: number, only?: (typeof VARIETIES)[number]): Koi {
    let pick = Math.random() * VARIETIES.reduce((n, v) => n + v.w, 0);
    const kind = only ?? VARIETIES.find((v) => (pick -= v.w) < 0) ?? VARIETIES[0];
    const width = only ? 19 : rand(13, 20), seg = width * rand(1.1, 1.3), angle = rand(-Math.PI, Math.PI);
    const spots: Spot[] = kind.spots.map((c) => ({ u: rand(0.08, 0.75), v: rand(-0.6, 0.6), ru: rand(0.1, 0.22), rv: rand(0.5, 1.1), c }));
    if (kind.head) spots.push({ u: 0.06, v: 0, ru: 0.07, rv: 0.55, c: kind.head });
    return {
      pts: Array.from({ length: SEGMENTS }, (_, i) => ({ x: x - Math.cos(angle) * seg * i, y: y - Math.sin(angle) * seg * i })),
      angle, speed: 0, base: rand(0.6, 1.05), seg, width, phase: rand(0, 6.28), body: kind.body, fin: kind.body, spots,
      wander: rand(0, 6.28), beat: rand(0, 120), kick: 0, startle: 0, flee: null, depth: only ? 1 : rand(0.55, 1),
      goal: { x, y }, roam: 0, full: 0,
    };
  }

  const inside = (x: number, y: number, pad = 0) => obstacles.some((o) => x > o.l - pad && x < o.r + pad && y > o.t - pad && y < o.b + pad);
  /** The most open water: of a dozen random spots clear of the content, the one farthest from every other koi and its goal. */
  function openSpot(self: Koi | null): P {
    let best: P = { x: w / 2, y: h / 2 }, bestScore = -1;
    for (let n = 0; n < 14; n++) {
      const c = { x: rand(70, Math.max(80, w - 70)), y: rand(60, Math.max(70, h - 60)) };
      if (inside(c.x, c.y, 20)) continue;
      let near = Infinity;
      for (const o of fish) {
        if (o === self) continue;
        near = Math.min(near, Math.hypot(o.pts[0].x - c.x, o.pts[0].y - c.y), Math.hypot(o.goal.x - c.x, o.goal.y - c.y) * 1.2);
      }
      const score = Math.min(near, 400) + rand(0, 40);
      if (score > bestScore) { bestScore = score; best = c; }
    }
    return best;
  }

  function steer(k: Koi, dt: number) {
    const head = k.pts[0], hx = Math.cos(k.angle), hy = Math.sin(k.angle);
    // Where it wants to go, as a sum of pulls: keep on, drift, avoid walls and others, then food or curiosity.
    let vx = hx, vy = hy, eager = 0;
    k.wander += rand(-0.07, 0.07) * dt;
    vx += Math.cos(k.angle + Math.sin(k.wander) * 1.3) * 0.4;
    vy += Math.sin(k.angle + Math.sin(k.wander) * 1.3) * 0.4;
    // It looks ahead, far enough to make a wide turn, and turns before the glass rather than bumping into it.
    const look = 90 + k.seg * 3, ax = head.x + hx * look, ay = head.y + hy * look, m = 60;
    let wall = 0;
    if (ax < m) { vx += ((m - ax) / m) * 3; wall = 1; }
    if (ax > w - m) { vx -= ((ax - w + m) / m) * 3; wall = 1; }
    if (ay < m) { vy += ((m - ay) / m) * 3; wall = 1; }
    if (ay > h - m) { vy -= ((ay - h + m) / m) * 3; wall = 1; }
    // The text and buttons on the card: from where it is and from where it is about to be, it leaves by the nearest
    // edge, so a koi under a long heading crosses it instead of following it. Food dropped there overrides this below.
    let ox = 0, oy = 0, blocked = false;
    for (const o of obstacles) {
      for (const [px, py, weight] of [[head.x, head.y, 3.4], [ax, ay, 2.6]]) {
        if (px <= o.l || px >= o.r || py <= o.t || py >= o.b) continue;
        const [, ex, ey] = [[px - o.l, -1, 0], [o.r - px, 1, 0], [py - o.t, 0, -1], [o.b - py, 0, 1]].sort((p1, p2) => p1[0] - p2[0])[0];
        ox += ex * weight; oy += ey * weight;
        blocked = true;
      }
    }
    // Room around the others: the whole of each body, not only its head. Feeding is the one time they crowd together.
    const crowd = food.length ? 0.35 : 1;
    let ahead = false;
    for (const o of fish) {
      if (o === k) continue;
      const room = (k.width + o.width) * 1.75;
      for (let i = 0; i < SEGMENTS; i += 2) {
        const q = o.pts[i];
        const dx = head.x - q.x, dy = head.y - q.y, d = Math.hypot(dx, dy);
        if (d > 0 && d < room) { vx += (dx / d) * ((room - d) / room) * 3.2 * crowd; vy += (dy / d) * ((room - d) / room) * 3.2 * crowd; }
        // Another body across its path: it gives way to the side that body is not on, and slows.
        if (Math.hypot(head.x + hx * room - q.x, head.y + hy * room - q.y) < room) {
          ahead = true;
          const side = Math.sign(hx * (q.y - head.y) - hy * (q.x - head.x)) || 1;
          vx += hy * side * 1.8 * crowd; vy += -hx * side * 1.8 * crowd;
        }
      }
    }
    // A pointer that sweeps past close by is a fright; one that rests over the water is interesting.
    if (pointer && pointer.v > 9 && Math.hypot(pointer.x - head.x, pointer.y - head.y) < 100 && k.startle <= 0) { k.startle = rand(12, 20); k.flee = { x: pointer.x, y: pointer.y }; }
    if (k.startle > 0 && k.flee) {
      // Startled by a splash: it darts away first.
      k.startle -= dt;
      const dx = head.x - k.flee.x, dy = head.y - k.flee.y, d = Math.hypot(dx, dy) || 1;
      vx += (dx / d) * 3; vy += (dy / d) * 3;
      eager = 2;
    } else {
      let best: Food | null = null, bd = 380;
      for (const f of food) { const d = Math.hypot(f.x - head.x, f.y - head.y); if (d < bd) { bd = d; best = f; } }
      if (best) { vx += ((best.x - head.x) / (bd || 1)) * 2.4; vy += ((best.y - head.y) / (bd || 1)) * 2.4; eager = 1; }
      else {
        // Otherwise it heads for open water, and picks new open water once it gets there or every few seconds.
        k.roam -= dt;
        if (k.roam <= 0 || Math.hypot(k.goal.x - head.x, k.goal.y - head.y) < 70) { k.goal = openSpot(k); k.roam = rand(240, 480); }
        const gx = k.goal.x - head.x, gy = k.goal.y - head.y, gd = Math.hypot(gx, gy) || 1;
        vx += (gx / gd) * 0.7; vy += (gy / gd) * 0.7;
        if (pointer && pointer.v < 3) {
          const dx = pointer.x - head.x, dy = pointer.y - head.y, d = Math.hypot(dx, dy);
          if (d < 200 && d > 50) { vx += (dx / d) * 0.5; vy += (dy / d) * 0.5; }
        }
      }
    }
    if (eager === 1) blocked = false;
    else { vx += ox; vy += oy; }
    // A fish turns by swimming, never on the spot: how fast it can turn follows its speed, so the slower it goes the
    // wider its circle (about three body segments at the tightest, less when it is chasing food or fleeing).
    const diff = wrap(Math.atan2(vy, vx) - k.angle);
    const radius = k.seg * (eager ? 2.2 : 3.2);
    const max = (Math.max(k.speed, 0.2) / radius) * dt;
    k.angle = wrap(k.angle + Math.max(-max, Math.min(max, diff)));
    // A few beats of the tail, then a glide; a sharp turn or the glass ahead takes an extra beat. Quicker for food,
    // quickest when frightened, and never so slow that it stops moving forward.
    k.beat -= dt;
    if (k.beat <= 0 || ((Math.abs(diff) > 1 || wall || blocked) && k.kick < 0.4)) { k.kick = rand(0.6, 1.1); k.beat = rand(80, 220); }
    k.kick = Math.max(0, k.kick - 0.01 * dt);
    k.full = Math.max(0, k.full - dt);
    // It slows to let another koi pass in front, and idles for a while once it has eaten.
    const goal = k.base * (eager === 2 ? 3.4 : eager === 1 ? 1.9 : (0.55 + k.kick) * (ahead ? 0.55 : 1) * (k.full > 0 ? 0.6 : 1)) * (still() ? 0.25 : 1);
    k.speed += (goal - k.speed) * (goal > k.speed ? 0.09 : 0.025) * dt;
    k.speed = Math.max(k.speed, k.base * (still() ? 0.12 : 0.4));
    head.x += Math.cos(k.angle) * k.speed * dt;
    head.y += Math.sin(k.angle) * k.speed * dt;
    for (let i = 1; i < SEGMENTS; i++) {
      const a = k.pts[i - 1], b = k.pts[i], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
      if (d > k.seg) { b.x = a.x + (dx / d) * k.seg; b.y = a.y + (dy / d) * k.seg; }
    }
    // The tail beats faster the harder it swims.
    k.phase += (0.05 + k.speed * 0.16) * dt;
    for (let i = food.length - 1; i >= 0; i--) if (Math.hypot(food[i].x - head.x, food[i].y - head.y) < k.width) { food.splice(i, 1); k.kick = 0.8; k.full = rand(150, 300); }
  }

  // Cells are drawn as squares a little smaller than the grid, so the fish read as pixels on the water.
  // Each frame is a grid of characters, as in a terminal: later writes win, so fins sit under the body and the eyes
  // on top of it.
  const grid = new Map<number, [string, string]>();
  const put = (cx: number, cy: number, ch: string, color: string) => {
    if (cx < 0 || cy < 0 || cx * CELL > w || cy * CELL > h) return;
    grid.set(cy * 100000 + cx, [ch, color]);
  };
  function disc(x: number, y: number, r: number, paint: (cx: number, cy: number, depth: number) => [string, string] | null) {
    for (let cy = Math.floor((y - r) / CELL); cy <= Math.floor((y + r) / CELL); cy++)
      for (let cx = Math.floor((x - r) / CELL); cx <= Math.floor((x + r) / CELL); cx++) {
        const depth = Math.hypot(cx * CELL + CELL / 2 - x, cy * CELL + CELL / 2 - y) / (r || 1);
        if (depth > 1) continue;
        const c = paint(cx, cy, depth);
        if (c) put(cx, cy, c[0], c[1]);
      }
  }
  // Denser characters towards the middle of the body, so a fish has volume.
  const shade = (depth: number) => (depth < 0.35 ? '@' : depth < 0.6 ? '#' : depth < 0.85 ? '*' : '+');

  function drawKoi(k: Koi) {
    // The spine, swaying side to side more towards the tail.
    const spine = k.pts.map((p, i) => {
      const next = k.pts[Math.min(i + 1, SEGMENTS - 1)], prev = k.pts[Math.max(i - 1, 0)];
      const ang = Math.atan2(prev.y - next.y, prev.x - next.x);
      const sway = Math.sin(k.phase - i * 0.55) * k.width * 0.5 * (i / SEGMENTS) * Math.min(1.2, 0.35 + k.speed / (k.base * 1.4));
      return { x: p.x - Math.sin(ang) * sway, y: p.y + Math.cos(ang) * sway, ang };
    });
    // Fins: a pair behind the head and the tail, fainter than the body.
    const fins = k.fin + alpha(0.6 * k.depth), body = k.body + alpha(k.depth);
    const s2 = spine[2], flap = Math.sin(k.phase * 1.3) * 0.35;
    for (const side of [-1, 1]) {
      const a = s2.ang + side * (Math.PI / 2 + 0.5 + flap * side);
      disc(s2.x + Math.cos(a) * k.width * 1.25, s2.y + Math.sin(a) * k.width * 1.25, k.width * 0.55, (_x, _y, d) => [d < 0.5 ? ':' : '.', fins]);
    }
    const tail = spine[SEGMENTS - 1];
    for (let j = 1; j <= 3; j++) for (const side of [-1, 1]) {
      const a = tail.ang + Math.PI + side * (0.32 + Math.sin(k.phase) * 0.25);
      disc(tail.x + Math.cos(a) * k.seg * 0.75 * j, tail.y + Math.sin(a) * k.seg * 0.75 * j, k.width * (0.42 - j * 0.07), () => ['~', fins]);
    }
    // The body, its colour from the spots laid out along it.
    for (let i = SEGMENTS - 1; i >= 0; i--) {
      const p = spine[i], r = k.width * PROFILE[i], u = i / (SEGMENTS - 1);
      disc(p.x, p.y, r, (cx, cy, depth) => {
        const dx = cx * CELL + CELL / 2 - p.x, dy = cy * CELL + CELL / 2 - p.y;
        const v = (-Math.sin(p.ang) * dx + Math.cos(p.ang) * dy) / (r || 1);
        for (const s of k.spots) if (((u - s.u) / s.ru) ** 2 + ((v - s.v) / s.rv) ** 2 < 1) return [shade(depth), s.c + alpha(k.depth)];
        return [shade(depth), body];
      });
    }
    // Eyes.
    const e = spine[0];
    for (const side of [-1, 1]) put(Math.floor((e.x + Math.cos(e.ang + side * 1.1) * k.width * 0.55) / CELL), Math.floor((e.y + Math.sin(e.ang + side * 1.1) * k.width * 0.55) / CELL), 'o', '#ffffff' + alpha(k.depth));
  }

  let last = performance.now(), raf = 0;
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (now - last < 1000 / 30) return;
    const dt = Math.min(3, (now - last) / 16.67);
    last = now;
    grid.clear();
    for (const r of rings) {
      r.r += 1.7 * dt; r.a -= 0.012 * dt;
      const color = `rgba(139, 213, 255, ${Math.max(0, r.a) * 0.6})`;
      for (let cy = Math.floor((r.y - r.r) / CELL); cy <= Math.floor((r.y + r.r) / CELL); cy++)
        for (let cx = Math.floor((r.x - r.r) / CELL); cx <= Math.floor((r.x + r.r) / CELL); cx++)
          if (Math.abs(Math.hypot(cx * CELL + 4 - r.x, cy * CELL + 4 - r.y) - r.r) < 4) put(cx, cy, r.a > 0.5 ? 'o' : '·', color);
    }
    for (let i = rings.length - 1; i >= 0; i--) if (rings[i].a <= 0) rings.splice(i, 1);
    for (let i = food.length - 1; i >= 0; i--) {
      const f = food[i];
      if (f.fixed) { put(Math.floor(f.x / CELL), Math.floor(f.y / CELL), '●', '#eed49f'); continue; }
      f.age += dt;
      if (f.age > 900) { food.splice(i, 1); continue; }
      put(Math.floor(f.x / CELL), Math.floor(f.y / CELL), '•', `rgba(238, 212, 159, ${1 - f.age / 900})`);
    }
    for (const k of fish) steer(k, dt);
    // Deeper koi first, so the ones nearer the surface pass over them.
    for (const k of [...fish].sort((a, b) => a.depth - b.depth)) drawKoi(k);
    ctx.clearRect(0, 0, w, h);
    ctx.font = `700 ${CELL + 3}px "Geist Mono", ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const [key, [ch, color]] of grid) {
      const cx = key % 100000, cy = Math.floor(key / 100000);
      ctx.fillStyle = color;
      ctx.fillText(ch, cx * CELL + CELL / 2, cy * CELL + CELL / 2 + 0.5);
    }
  };

  // The fifth feeding brings a golden koi, once.
  let feeds = 0;
  const GOLDEN = { w: 0, body: '#eed49f', spots: ['#f5f5f5', '#f5f5f5'] };
  const feed = (x: number, y: number) => {
    if (++feeds === 5) fish.push(spawn(x < w / 2 ? w + 40 : -40, y, GOLDEN));
    for (let i = 0; i < 6; i++) food.push({ x: x + rand(-26, 26), y: y + rand(-26, 26), age: 0 });
    // Koi right under the splash flinch away first, then come back for the food.
    for (const k of fish) if (Math.hypot(k.pts[0].x - x, k.pts[0].y - y) < 90) { k.startle = rand(14, 26); k.flee = { x, y }; }
    rings.push({ x, y, r: 4, a: 1 });
  };

  const local = (e: PointerEvent) => { const r = host.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const off = new AbortController();
  const { signal } = off;
  host.addEventListener('pointermove', (e) => {
    if ((e.target as Element).closest('a, button')) { pointer = null; return; }
    const at = local(e);
    // Speed in px per frame at 60 frames a second, smoothed so a single jump doesn't count as a sweep.
    const v = pointer ? Math.hypot(at.x - pointer.x, at.y - pointer.y) : 0;
    pointer = { ...at, v: pointer ? pointer.v * 0.6 + v * 0.4 : 0 };
  }, { passive: true, signal });
  host.addEventListener('pointerleave', () => { pointer = null; }, { signal });
  host.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || (e.target as Element).closest('a, button, input, label, .mailrow')) return;
    const p = local(e);
    feed(p.x, p.y);
  }, { signal });
  // The heading is written in food on the water's grid, letter by letter where the page set it. The koi eat it while
  // the card stays on screen; scrolled away and back, it is written again. The text itself stays for screen readers.
  const title = host.querySelector<HTMLElement>('.shout');
  const spell = () => {
    for (let i = food.length - 1; i >= 0; i--) if (food[i].fixed) food.splice(i, 1);
    if (!title || !w || !h) return;
    const box = host.getBoundingClientRect(), cs = getComputedStyle(title);
    const sheet = Object.assign(document.createElement('canvas'), { width: Math.ceil(w), height: Math.ceil(h) });
    const o = sheet.getContext('2d', { willReadFrequently: true })!;
    o.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    if (parseFloat(cs.fontStretch) >= 125) o.fontStretch = 'expanded';
    o.textBaseline = 'middle';
    o.fillStyle = '#fff';
    const lang = document.documentElement.lang;
    const letters = title.querySelectorAll<HTMLElement>('.wl');
    for (const el of letters.length ? letters : [title]) {
      const r = el.getBoundingClientRect();
      const text = cs.textTransform === 'uppercase' ? (el.textContent ?? '').toLocaleUpperCase(lang) : el.textContent ?? '';
      o.fillText(text, r.left - box.left, r.top - box.top + r.height / 2);
    }
    const px = o.getImageData(0, 0, sheet.width, sheet.height).data;
    for (let cy = 0; cy * CELL < h; cy++) for (let cx = 0; cx * CELL < w; cx++) {
      const x = cx * CELL + CELL / 2, y = cy * CELL + CELL / 2;
      // A cell is food if the letters cover any of five points in it, so thin strokes on a phone still read.
      const ink = [[0, 0], [-2, -2], [2, -2], [-2, 2], [2, 2]].some(([dx, dy]) => {
        const sx = Math.floor(x + dx), sy = Math.floor(y + dy);
        return sx >= 0 && sy >= 0 && sx < sheet.width && sy < sheet.height && px[(sy * sheet.width + sx) * 4 + 3] > 90;
      });
      if (ink) food.push({ x, y, age: 0, fixed: true });
    }
  };
  let onScreen = false;
  const run = () => {
    cancelAnimationFrame(raf);
    if (onScreen && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); }
  };
  document.addEventListener('visibilitychange', run, { signal });
  const seen = new IntersectionObserver(([entry]) => {
    const back = entry.isIntersecting && !onScreen;
    onScreen = entry.isIntersecting;
    if (back) document.fonts.ready.then(spell);
    run();
  });
  seen.observe(host);
  const sized = new ResizeObserver(resize);
  sized.observe(host);
  resize();
  return () => { off.abort(); seen.disconnect(); sized.disconnect(); cancelAnimationFrame(raf); };
}
