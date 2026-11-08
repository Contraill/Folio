/* Mochi: a browser re-implementation of the idea of the pet, drawn on a 128×64 canvas. */
const HEART = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000'];
const Z = ['11111', '00010', '00100', '01000', '11111'];

export type Mood = 'idle' | 'waking' | 'poked' | 'petted' | 'love' | 'happy' | 'dizzy' | 'sleep';
type Floater = { x: number; y: number; t: number };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export class Pet {
  private x: CanvasRenderingContext2D;
  private onMood: (mood: Mood) => void;
  mood: Mood = 'idle';
  private until = 0;
  private act = performance.now();
  private blinkAt = performance.now() + 2200;
  private blinkT = -1;
  private look = [0, 0];
  private target = [0, 0];
  private reversals: number[] = [];
  private sign = 0;
  private lastX: number | null = null;
  private petStart = 0;
  private lastPet = 0;
  private zs: Floater[] = [];
  private hearts: Floater[] = [];
  private nextZ = 0;
  private nextHeart = 0;

  constructor(canvas: HTMLCanvasElement, onMood: (mood: Mood) => void) {
    canvas.width = 128;
    canvas.height = 64;
    this.x = canvas.getContext('2d')!;
    this.onMood = onMood;
  }

  set(mood: Mood, duration = 0) {
    this.mood = mood;
    this.until = duration ? performance.now() + duration : 0;
    this.onMood(mood);
  }

  poke() { this.act = performance.now(); this.petStart = 0; this.set('poked', 1100); }

  /** Back-and-forth movement over the face counts as petting. */
  move(px: number) {
    const now = performance.now();
    this.act = now;
    if (this.mood === 'sleep') this.set('waking', 900);
    if (this.lastX != null) {
      const dx = px - this.lastX;
      if (Math.abs(dx) > 1.2) {
        const sign = dx > 0 ? 1 : -1;
        if (this.sign && sign !== this.sign) this.reversals.push(now);
        this.sign = sign;
      }
    }
    this.lastX = px;
    this.reversals = this.reversals.filter((t) => now - t < 1300);
    if (this.reversals.length >= 3 && this.mood !== 'poked' && this.mood !== 'dizzy') {
      if (!this.petStart) this.petStart = now;
      this.lastPet = now;
      const mood = now - this.petStart > 2600 ? 'love' : 'petted';
      if (this.mood !== mood) this.set(mood);
    }
  }

  leave() { this.lastX = null; this.sign = 0; }
  lookAt(nx: number, ny: number) { this.target = [clamp(nx, -1, 1), clamp(ny, -1, 1)]; }

  tick(now: number, color: string) {
    if ((this.mood === 'petted' || this.mood === 'love') && now - this.lastPet > 750) { this.petStart = 0; this.set('happy', 1500); }
    if (this.until && now > this.until) this.set('idle');
    if (this.mood === 'idle' && now - this.act > 20000) this.set('sleep');
    if (now > this.blinkAt) { this.blinkT = now; this.blinkAt = now + 2400 + Math.random() * 3200; }
    this.look[0] += (this.target[0] - this.look[0]) * 0.18;
    this.look[1] += (this.target[1] - this.look[1]) * 0.18;
    this.draw(now, color);
  }

  private draw(now: number, on: string) {
    const x = this.x, mood = this.mood;
    x.fillStyle = '#000';
    x.fillRect(0, 0, 128, 64);
    x.fillStyle = on;
    const px = (a: number, b: number, w: number, h: number) => x.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(h));
    const line = (x0: number, y0: number, x1: number, y1: number, th: number) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let i = 0; i <= n; i++) px(x0 + (x1 - x0) * i / n - th / 2, y0 + (y1 - y0) * i / n - th / 2, th, th);
    };
    const sprite = (rows: string[], ox: number, oy: number) => rows.forEach((row, r) => [...row].forEach((c, i) => { if (c === '1') px(ox + i, oy + r, 1, 1); }));
    const eye = (cx: number, cy: number, w: number, h: number) => {
      px(cx - w / 2, cy - h / 2, w, h);
      if (h > 6) {
        x.fillStyle = '#000';
        [[0, 0], [w - 2, 0], [0, h - 2], [w - 2, h - 2]].forEach(([a, b]) => px(cx - w / 2 + a, cy - h / 2 + b, 2, 2));
        x.fillStyle = on;
      }
    };
    const lx = this.look[0] * 5, ly = this.look[1] * 3;
    if (mood === 'idle' || mood === 'waking') {
      let b = 1;
      if (this.blinkT > 0) { const e = (now - this.blinkT) / 160; b = e < 1 ? Math.abs(1 - e * 2) : 1; }
      if (mood === 'waking') b = Math.min(b, 0.35 + 0.65 * Math.abs(Math.sin(now / 140)));
      const h = Math.max(3, 22 * b);
      eye(42 + lx, 28 + ly, 16, h);
      eye(86 + lx, 28 + ly, 16, h);
      px(60 + lx * 0.5, 48, 8, 2);
    } else if (mood === 'poked') {
      line(35, 21, 48, 28, 3); line(48, 28, 35, 35, 3);
      line(93, 21, 80, 28, 3); line(80, 28, 93, 35, 3);
      px(61, 44, 6, 2); px(61, 50, 6, 2); px(61, 44, 2, 8); px(65, 44, 2, 8);
    } else if (mood === 'petted' || mood === 'love' || mood === 'happy') {
      const bob = Math.round(Math.sin(now / 180) * (mood === 'happy' ? 0 : 1));
      line(34, 32 + bob, 42, 23 + bob, 3); line(42, 23 + bob, 50, 32 + bob, 3);
      line(78, 32 + bob, 86, 23 + bob, 3); line(86, 23 + bob, 94, 32 + bob, 3);
      px(56, 45, 2, 3); px(58, 48, 12, 2); px(70, 45, 2, 3);
      if (mood === 'love') {
        for (let i = 0; i < 10; i += 2) { px(30 + i, 38, 1, 1); px(31 + i, 39, 1, 1); px(88 + i, 38, 1, 1); px(89 + i, 39, 1, 1); }
        if (now > this.nextHeart) { this.hearts.push({ x: 100 + Math.random() * 14, y: 40, t: now }); this.nextHeart = now + 650; }
      }
    } else if (mood === 'dizzy') {
      [42, 86].forEach((cx) => {
        for (let a = 0; a < 6.283; a += 0.25) px(cx + Math.cos(a) * 9, 28 + Math.sin(a) * 9, 2, 2);
        const an = now / 90 * (cx < 60 ? 1 : -1);
        px(cx + Math.cos(an) * 4 - 1, 28 + Math.sin(an) * 4 - 1, 3, 3);
      });
      for (let wx = 52; wx < 76; wx += 2) px(wx, 49 + Math.round(Math.sin(wx * 0.6 + now / 110)), 2, 2);
    } else if (mood === 'sleep') {
      px(34, 34, 16, 3); px(78, 34, 16, 3);
      if (now > this.nextZ) { this.zs.push({ x: 100, y: 24, t: now }); this.nextZ = now + 1300; }
    }
    this.zs = mood === 'sleep' ? this.zs.filter((z) => now - z.t < 2600) : [];
    this.zs.forEach((z) => { const k = (now - z.t) / 2600; sprite(Z, z.x + k * 14, z.y - k * 20); });
    this.hearts = this.hearts.filter((h) => now - h.t < 1800);
    this.hearts.forEach((h) => { const k = (now - h.t) / 1800; sprite(HEART, h.x + Math.sin(k * 9) * 2, h.y - k * 34); });
  }
}
