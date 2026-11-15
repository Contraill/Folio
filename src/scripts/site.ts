import { startAquarium } from './aquarium';
import { startSky } from './sky';
import { startTerminal } from './terminal';

/** Square pixels in the terminal palette, falling over the page for a few seconds. */
function pixelRain() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = Object.assign(document.createElement('canvas'), { ariaHidden: 'true' });
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:90;pointer-events:none';
  document.body.append(canvas);
  const dpr = Math.min(devicePixelRatio || 1, 2), w = innerWidth, h = innerHeight, ctx = canvas.getContext('2d')!;
  canvas.width = w * dpr; canvas.height = h * dpr; ctx.scale(dpr, dpr);
  const colors = ['#109dd9', '#8bd5ff', '#7aa2f7', '#c6a0f6', '#8bd5ca', '#eed49f', '#ed8796', '#f5f5f5'];
  const bits = Array.from({ length: 180 }, () => ({ x: Math.random() * w, y: -Math.random() * h * 0.6, vx: (Math.random() - 0.5) * 1.6, vy: 2 + Math.random() * 3.5, s: Math.random() < 0.3 ? 10 : 6, c: colors[(Math.random() * colors.length) | 0] }));
  const start = performance.now();
  const step = (now: number) => {
    const t = now - start;
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = t > 2600 ? Math.max(0, 1 - (t - 2600) / 700) : 1;
    for (const b of bits) { b.x += b.vx; b.y += b.vy; b.vy += 0.05; ctx.fillStyle = b.c; ctx.fillRect(Math.round(b.x / 2) * 2, Math.round(b.y / 2) * 2, b.s, b.s); }
    if (t < 3300) requestAnimationFrame(step); else canvas.remove();
  };
  requestAnimationFrame(step);
}

// For whoever opens the developer tools: the name in ANSI Shadow letters, then what there is to know.
{
  const G: Record<string, string[]> = {
    A: [' █████╗ ', '██╔══██╗', '███████║', '██╔══██║', '██║  ██║', '╚═╝  ╚═╝'],
    C: [' ██████╗', '██╔════╝', '██║     ', '██║     ', '╚██████╗', ' ╚═════╝'],
    E: ['███████╗', '██╔════╝', '█████╗  ', '██╔══╝  ', '███████╗', '╚══════╝'],
    I: ['██╗', '██║', '██║', '██║', '██║', '╚═╝'],
    L: ['██╗     ', '██║     ', '██║     ', '██║     ', '███████╗', '╚══════╝'],
    N: ['███╗   ██╗', '████╗  ██║', '██╔██╗ ██║', '██║╚██╗██║', '██║ ╚████║', '╚═╝  ╚═══╝'],
    O: [' ██████╗ ', '██╔═══██╗', '██║   ██║', '██║   ██║', '╚██████╔╝', ' ╚═════╝ '],
    T: ['████████╗', '╚══██╔══╝', '   ██║   ', '   ██║   ', '   ██║   ', '   ╚═╝   '],
    U: ['██╗   ██╗', '██║   ██║', '██║   ██║', '██║   ██║', '╚██████╔╝', ' ╚═════╝ '],
    Z: ['███████╗', '╚══███╔╝', '  ███╔╝ ', ' ███╔╝  ', '███████╗', '╚══════╝'],
    ' ': ['  ', '  ', '  ', '  ', '  ', '  '],
  };
  // Turkish letters: the plain letter with its dot or dots above it.
  const DOTS: Record<string, [string, string, string]> = { 'İ': ['I', '██╗', '╚═╝'], 'Ö': ['O', ' ██╗ ██╗ ', ' ╚═╝ ╚═╝ '] };
  const banner = (text: string) => {
    const rows = Array.from({ length: 8 }, () => '');
    for (const ch of text) {
      const [base, dot = '', shade = ''] = DOTS[ch] ?? [ch];
      const g = G[base];
      rows[0] += dot.padEnd(g[0].length);
      rows[1] += shade.padEnd(g[0].length);
      g.forEach((line, i) => { rows[i + 2] += line; });
    }
    return rows.filter((r) => r.trim()).join('\n');
  };
  const tr = document.documentElement.lang === 'tr';
  const box = (title: string, lines: string[]) => [`╔═ ${title} ${'═'.repeat(Math.max(4, 30 - title.length))}╗`, ...lines.map((l) => `║ ${l}`), `╚${'═'.repeat(34)}╝`].join('\n');
  const sections = tr ? [
    box('Merhaba', ['Konsolu açtığınıza göre siz de bir geliştiricisiniz. Hoş geldiniz.', 'Bu site statik bir Astro sitesi: istemci tarafında framework yok, yalnızca birkaç yüz satır TypeScript ve CSS.']),
    box('İletişim', ['E-posta   ⇒ izzet@oztozlu.dev', 'GitHub    ⇒ https://github.com/Contraill', 'LinkedIn  ⇒ https://www.linkedin.com/in/izzetcanoztozlu', 'CV        ⇒ https://oztozlu.dev/tr/cv']),
    box('Keşfedilecekler', ['` tuşu sizi terminale götürür. help yazın, sonra listede olmayan komutları arayın.', 'Mochi’yi dürtün, okşayın ya da üst üste dürtün. Telefonunuzu sallayın.', 'İletişim kartındaki koileri besleyin. Beslemeye devam edin.', 'Konami.']),
  ] : [
    box('Hi', ['You opened the console, so you are probably a developer too. Welcome.', 'This site is static Astro with no client framework: a few hundred lines of TypeScript and CSS.']),
    box('Reach me', ['Mail      ⇒ izzet@oztozlu.dev', 'GitHub    ⇒ https://github.com/Contraill', 'LinkedIn  ⇒ https://www.linkedin.com/in/izzetcanoztozlu', 'CV        ⇒ https://oztozlu.dev/cv']),
    box('Things to find', ['Press ` to jump to the terminal. Type help, then look for the commands it doesn’t list.', 'Poke Mochi, pet it, or poke it a lot. Shake your phone.', 'Feed the koi in the contact card. Keep feeding them.', 'Konami.']),
  ];
  console.log(`%c${banner('İZZET CAN')}\n\n${banner('ÖZTOZLU')}\n%c\n${sections.join('\n\n')}`, 'color:#109dd9;font-weight:700;line-height:1.1', 'color:inherit;line-height:1.5');
}

/* Everything that moves or responds on the page. The client router keeps this module alive between pages, so each
   page sets itself up on astro:page-load and tears down on astro:before-swap (one AbortController per page). */
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
let page: AbortController | undefined;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

// The router copies <html> from the next page, which doesn't have the class the inline script set.
document.addEventListener('astro:after-swap', () => document.documentElement.classList.add('js'));
document.addEventListener('astro:before-swap', () => page?.abort());
// A link to the CV grows into the CV itself: the pressed link and the viewer share one transition name.
document.addEventListener('astro:before-preparation', (event) => {
  const link = (event as Event & { sourceElement?: Element }).sourceElement?.closest<HTMLElement>('[data-cv-link]');
  if (link && !reduce()) link.style.setProperty('view-transition-name', 'cv-sheet');
});
document.addEventListener('astro:page-load', () => {
  page?.abort();
  page = new AbortController();
  const { signal } = page;
  const on = <K extends keyof WindowEventMap>(type: K, fn: (e: WindowEventMap[K]) => void) => addEventListener(type, fn, { passive: true, signal });

  /* ---------- the menu: a pill slides to the current section, another follows the pointer ---------- */
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  const top = document.querySelector<HTMLElement>('.top');
  const pill = nav?.querySelector<HTMLElement>('.nav-pill');
  const hover = nav?.querySelector<HTMLElement>('.nav-hover');
  const navLinks = [...(nav?.querySelectorAll<HTMLAnchorElement>('a[data-key]') ?? [])];
  const place = (el: HTMLElement | null | undefined, link: HTMLElement | undefined) => {
    if (!el) return;
    el.style.opacity = link ? '1' : '0';
    if (link) { el.style.setProperty('--x', `${link.offsetLeft}px`); el.style.setProperty('--w', `${link.offsetWidth}px`); }
  };
  let current = document.body.dataset.section ?? '';
  const mark = (key: string) => {
    current = key;
    for (const a of navLinks) a.toggleAttribute('aria-current', a.dataset.key === key);
    place(pill, navLinks.find((a) => a.dataset.key === key));
  };
  // The first placement happens without a slide, so the pill doesn't fly in from the left on every page.
  pill?.classList.add('no-anim');
  mark(current);
  requestAnimationFrame(() => pill?.classList.remove('no-anim'));
  for (const a of navLinks) a.addEventListener('pointerenter', () => place(hover, a), { signal });
  nav?.addEventListener('pointerleave', () => place(hover, undefined), { signal });
  on('resize', () => mark(current));

  /* ---------- the name in the corner is hidden while the big one is on screen ---------- */
  const big = document.querySelector('.hero .name');
  if (big && top) {
    const watch = new IntersectionObserver(([e]) => top.classList.toggle('over-hero', e.isIntersecting), { rootMargin: '-72px 0px 0px 0px' });
    watch.observe(big);
    signal.addEventListener('abort', () => watch.disconnect());
  } else top?.classList.remove('over-hero');

  /* ---------- reveals ---------- */
  const seen = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); seen.unobserve(e.target); }
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-reveal]').forEach((el) => seen.observe(el));
  signal.addEventListener('abort', () => seen.disconnect());

  /* ---------- words that light up as the paragraph passes ---------- */
  // Screen readers get the sentence whole, from a hidden copy; the lit words are only drawn.
  const words = [...document.querySelectorAll<HTMLElement>('[data-words]')].map((p) => {
    if (!p.dataset.split) {
      p.dataset.split = '1';
      const text = p.textContent ?? '';
      p.innerHTML = `<span class="sr">${esc(text)}</span>` + text.split(/(\s+)/).map((w) => (w.trim() ? `<span class="w" aria-hidden="true">${esc(w)}</span>` : w)).join('');
    }
    // Each word's height within its paragraph, measured once per layout rather than every frame.
    return { p, list: [...p.querySelectorAll<HTMLElement>('.w')], at: null as number[] | null };
  });
  const remeasure = () => words.forEach((g) => { g.at = null; });
  document.fonts?.ready.then(remeasure);
  on('resize', remeasure);

  /* ---------- letters that wave under the pointer ---------- */
  document.querySelectorAll<HTMLElement>('[data-wave]').forEach((h) => {
    if (h.dataset.split) return;
    h.dataset.split = '1';
    const text = h.textContent ?? '';
    let i = 0;
    // Letters in words that never break apart; lines break only between words. The hidden copy is what is read out.
    h.innerHTML = `<span class="sr">${esc(text)}</span>` + text.split(' ').map((word) => `<span class="ww">${[...word].map((ch) => `<span class="wl" aria-hidden="true" style="--i:${i++}">${esc(ch)}</span>`).join('')}</span>`).join(' ');
  });

  /* ---------- scroll: header, progress, current section, the project deck, the timeline, the words ---------- */
  const spies = [...document.querySelectorAll<HTMLElement>('[data-spy]')];
  const deck = [...document.querySelectorAll<HTMLElement>('.deck-item')];
  // A card taller than the screen would have its end hidden under the next one: such a card scrolls normally instead.
  const fitDeck = () => deck.forEach((item) => item.classList.toggle('loose', item.offsetHeight + (parseFloat(getComputedStyle(item).top) || 0) > innerHeight - 12));
  fitDeck();
  on('resize', fitDeck);
  const line = document.querySelector<HTMLElement>('[data-timeline]');
  let ticking = false;
  const frame = () => {
    ticking = false;
    const y = scrollY, h = innerHeight, still = reduce();
    // Every measurement first, then every change: measuring after each change made the browser lay the page out again.
    let key = '';
    for (const s of spies) if (s.getBoundingClientRect().top < h * 0.45) key = s.dataset.spy ?? '';
    const cards = still ? [] : deck.map((item) => item.getBoundingClientRect());
    const timeline = still ? undefined : line?.getBoundingClientRect();
    const tops = still ? [] : words.map((g) => {
      const top = g.p.getBoundingClientRect().top;
      g.at ??= g.list.map((w) => w.getBoundingClientRect().top - top);
      return top;
    });

    top?.classList.toggle('scrolled', y > 24);
    nav?.style.setProperty('--progress', String(clamp(y / Math.max(1, document.documentElement.scrollHeight - h))));
    if (spies.length && key !== current) mark(key);
    if (still) return;
    // A card is covered by the one after it: it shrinks and dims a little as that one slides over.
    deck.forEach((item, i) => {
      const a = cards[i], b = cards[i + 1];
      if (!b) return;
      item.style.setProperty('--cover', item.classList.contains('loose') ? '0' : String(clamp(1 - (b.top - a.top) / a.height)));
      // Once the card above it is covered too, this one would peek out round the shrunken cards: it fades away.
      const after = cards[i + 2];
      item.style.setProperty('--buried', after ? String(clamp(1 - (after.top - b.top) / b.height)) : '0');
    });
    if (line && timeline) line.style.setProperty('--p', String(clamp((h * 0.6 - timeline.top) / timeline.height)));
    // Unlit words stay readable (3:1 against the panel), lit ones are full white.
    words.forEach((g, n) => g.list.forEach((w, i) => { w.style.opacity = String(0.42 + 0.58 * clamp((h * 0.82 - (tops[n] + g.at![i])) / (h * 0.3))); }));
  };
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  on('scroll', request);
  on('resize', request);
  frame();

  /* ---------- numbers that count up when they come into view ---------- */
  const counter = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      counter.unobserve(e.target);
      const el = e.target as HTMLElement, end = Number(el.dataset.count);
      if (reduce() || !Number.isFinite(end) || end === 0) continue;
      const start = performance.now();
      const tick = (now: number) => {
        const k = clamp((now - start) / 900);
        el.textContent = String(Math.round(end * (1 - (1 - k) ** 3)));
        if (k < 1 && !signal.aborted) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  });
  document.querySelectorAll('[data-count]').forEach((el) => counter.observe(el));
  signal.addEventListener('abort', () => counter.disconnect());

  /* ---------- Mochi ---------- */
  const faces = [...document.querySelectorAll<HTMLElement>('[data-mochi]')];
  // A poke makes it smile; five quick pokes make it dizzy; stroking it back and forth with the pointer, hearts.
  const moodTimers = new WeakMap<HTMLElement, number>();
  const setMood = (face: HTMLElement, mood: 'happy' | 'love' | 'dizzy', ms: number) => {
    face.classList.remove('is-happy', 'is-love', 'is-dizzy');
    void face.offsetWidth;
    face.classList.add(`is-${mood}`);
    clearTimeout(moodTimers.get(face));
    moodTimers.set(face, window.setTimeout(() => face.classList.remove(`is-${mood}`), ms));
  };
  for (const face of faces) {
    let pokes: number[] = [], turns: number[] = [], lastX = 0, dir = 0;
    face.addEventListener('click', () => {
      const now = performance.now();
      pokes = [...pokes.filter((t) => now - t < 2500), now];
      if (pokes.length >= 5) { pokes = []; setMood(face, 'dizzy', 2600); } else setMood(face, 'happy', 1600);
    }, { signal });
    face.addEventListener('pointermove', (e) => {
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      if (Math.abs(dx) < 2 || Math.sign(dx) === dir) return;
      dir = Math.sign(dx);
      const now = performance.now();
      turns = [...turns.filter((t) => now - t < 1400), now];
      if (turns.length >= 5) { turns = []; setMood(face, 'love', 2400); }
    }, { signal });
  }
  // Shaking the phone makes every Mochi dizzy, as shaking the real one does.
  let shakes: number[] = [];
  addEventListener('devicemotion', (e) => {
    const a = e.acceleration;
    if (!a || Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0) < 18) return;
    const now = performance.now();
    shakes = [...shakes.filter((t) => now - t < 900), now];
    if (shakes.length >= 3) { shakes = []; faces.forEach((f) => setMood(f, 'dizzy', 2600)); }
  }, { signal });
  // The Konami code: pixels rain in the terminal's colours, and Mochi is delighted.
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let typed = 0;
  addEventListener('keydown', (e) => {
    if ((e.target as Element).closest?.('input, textarea')) return;
    // ` opens the terminal from anywhere, like a drop-down terminal.
    if (e.key === '`') {
      const input = document.querySelector<HTMLInputElement>('.term-in');
      if (input) { e.preventDefault(); input.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'center' }); input.focus({ preventScroll: true }); }
      return;
    }
    typed = e.key.toLowerCase() === KONAMI[typed].toLowerCase() ? typed + 1 : e.key === 'ArrowUp' ? Math.min(typed, 1) + 1 : 0;
    if (typed === KONAMI.length) { typed = 0; pixelRain(); faces.forEach((f) => setMood(f, 'love', 3200)); }
  }, { signal });

  if (faces.length && !reduce()) {
    let raf = 0;
    on('pointermove', (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        for (const face of faces) {
          const r = face.getBoundingClientRect();
          face.style.setProperty('--lx', `${clamp((e.clientX - r.left - r.width / 2) / 600, -1, 1) * 7}px`);
          face.style.setProperty('--ly', `${clamp((e.clientY - r.top - r.height / 2) / 600, -1, 1) * 4}px`);
        }
      });
    });
  }

  /* ---------- copy the email address ---------- */
  document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((button) => button.addEventListener('click', async () => {
    const status = button.parentElement?.querySelector('.copied');
    try {
      await navigator.clipboard.writeText(button.dataset.copy!);
      if (status) { status.textContent = button.dataset.done!; window.setTimeout(() => { status.textContent = ''; }, 2000); }
    } catch { /* clipboard blocked: the address is on screen to select */ }
  }, { signal }));

  document.querySelectorAll<HTMLElement>('[data-to-top]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    scrollTo({ top: 0, behavior: reduce() ? 'auto' : 'smooth' });
  }, { signal }));

  /* ---------- the CV, loaded before it is asked for ---------- */
  // Pointing at a CV link fetches the image the CV page will show at this width, so the page arrives drawn.
  let warmed = false;
  const warm = () => {
    if (warmed) return;
    warmed = true;
    const lang = document.documentElement.lang === 'tr' ? 'tr' : 'en';
    const img = new Image();
    img.sizes = '(max-width: 900px) 100vw, 860px';
    img.srcset = [800, 1240, 1800].map((w) => `/cv/${lang}-1-${w}.webp ${w}w`).join(', ');
  };
  document.querySelectorAll('[data-cv-link]').forEach((a) => ['pointerenter', 'focus', 'touchstart'].forEach((type) => a.addEventListener(type, warm, { signal, passive: true })));

  /* ---------- the terminal ---------- */
  document.querySelectorAll<HTMLFormElement>('[data-term]').forEach((form) => startTerminal(form, signal));

  /* ---------- the hero's background: the stack as a constellation round Mochi ---------- */
  document.querySelectorAll<HTMLCanvasElement>(':is(.hero, .lost) canvas.sky').forEach((canvas) => {
    signal.addEventListener('abort', startSky(canvas, canvas.parentElement?.querySelector<HTMLElement>('[data-mochi]') ?? null));
  });

  /* ---------- the koi aquarium in the contact card ---------- */
  document.querySelectorAll<HTMLElement>('[data-aquarium]').forEach((host) => {
    const canvas = host.querySelector<HTMLCanvasElement>('canvas.aquarium');
    if (canvas) signal.addEventListener('abort', startAquarium(canvas, host));
  });

  /* ---------- the CV viewer ---------- */
  document.querySelectorAll<HTMLElement>('[data-cv]').forEach((cv) => {
    const stage = cv.querySelector<HTMLElement>('.cv-stage')!;
    const level = cv.querySelector<HTMLOutputElement>('.cv-level')!;
    const steps = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3];
    let zoom = 1;
    const apply = () => {
      cv.style.setProperty('--zoom', String(zoom));
      level.value = `${Math.round(zoom * 100)}%`;
      // Tell the browser how wide the page now is, so it picks a sharp enough image.
      const width = Math.round(Math.min(stage.clientWidth, 860) * zoom);
      cv.querySelectorAll<HTMLImageElement>('.cv-page img').forEach((img) => { img.sizes = `${width}px`; });
    };
    cv.querySelectorAll<HTMLButtonElement>('[data-cv-zoom]').forEach((b) => b.addEventListener('click', () => {
      const i = steps.indexOf(zoom);
      zoom = b.dataset.cvZoom === 'in' ? steps[Math.min(steps.length - 1, i + 1)] : b.dataset.cvZoom === 'out' ? steps[Math.max(0, i - 1)] : 1;
      apply();
    }, { signal }));
    cv.querySelectorAll<HTMLButtonElement>('[data-cv-lang]').forEach((b) => b.addEventListener('click', () => {
      const lang = b.dataset.cvLang!;
      cv.querySelectorAll<HTMLButtonElement>('[data-cv-lang]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      cv.querySelectorAll<HTMLElement>('[data-doc]').forEach((d) => { d.hidden = d.dataset.doc !== lang; });
      cv.querySelectorAll<HTMLElement>('.cv-file').forEach((f) => { f.hidden = f.dataset.for !== lang; });
      cv.dataset.lang = lang;
    }, { signal }));
    apply();
  });
});
