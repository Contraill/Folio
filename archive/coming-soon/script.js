(() => {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const lettersEl = document.querySelector(".letters");
  const sign = document.querySelector(".sign");

  const STRINGS = {
    en: {
      home: "Öztozlu, home",
      langGroup: "Language",
      hello: "Hi, I’m İzzet Can Öztozlu.",
      headline: "Coming soon.",
      hintFine: "Psst, these letters aren’t glued down. Grab one and throw it, or type one.",
      hintTouch: "Psst, these letters aren’t glued down. Drag one and let go.",
      intro: "I’m putting together a place for my projects, experiments and the half-finished ideas that deserve better. It isn’t ready yet, so for now you get the scaffolding and a few loose letters. Want to say hi before it opens?",
      emailLabel: "Say hello",
      githubLabel: "Peek at the code",
      made: "Handmade with HTML, CSS, plain JavaScript and a lot of fiddling.",
      load: "Careful, those letters are load-bearing.",
      crew: "Fine, you’re officially on the build crew.",
      title: "İzzet Can Öztozlu: coming soon",
      description: "İzzet Can Öztozlu’s corner of the internet is coming soon: a home for projects, experiments and half-finished ideas. Until then, the letters are loose.",
      ogDescription: "A home for projects, experiments and half-finished ideas is on its way.",
      locale: "en_US",
    },
    tr: {
      home: "Öztozlu, ana sayfa",
      langGroup: "Dil",
      hello: "Merhaba, ben İzzet Can Öztozlu.",
      headline: "Çok yakında.",
      hintFine: "Psst, harfler yerine yapıştırılmadı. Birini kap ve fırlat ya da klavyeden yaz.",
      hintTouch: "Psst, harfler yerine yapıştırılmadı. Birini sürükle ve bırak.",
      intro: "Projelerim, deneylerim ve daha iyisini hak eden yarım kalmış fikirlerim için bir yer hazırlıyorum. Henüz hazır değil; şimdilik iskele ve birkaç gevşek harfle idare et. Açılmadan önce bir merhaba demeye ne dersin?",
      emailLabel: "Merhaba de",
      githubLabel: "Kodlara göz at",
      made: "HTML, CSS, sade JavaScript ve bolca kurcalamayla elde yapıldı.",
      load: "Dikkat, o harfler taşıyıcı.",
      crew: "Peki, artık resmen inşaat ekibindesin.",
      title: "İzzet Can Öztozlu: çok yakında",
      description: "İzzet Can Öztozlu’nun internetteki köşesi çok yakında: projeler, deneyler ve yarım kalmış fikirler için bir ev. O zamana kadar harfler biraz gevşek.",
      ogDescription: "Projeler, deneyler ve yarım kalmış fikirler için bir ev yolda.",
      locale: "tr_TR",
    },
  };

  /* ---------- Loose letters ---------- */

  const GRAVITY = 3400;
  let letters = [];
  let frame = 0;
  let last = 0;
  let throws = 0;
  let signTimer = 0;

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  const measure = (L) => {
    const box = L.ch.getBoundingClientRect();
    L.homeX = box.left + scrollX;
    L.homeY = box.top + scrollY;
    L.w = box.width;
    L.h = box.height;
  };

  const render = (L) => {
    const lift = Math.max(0, -L.y);
    const s = 1 / (1 + lift / 120);
    L.glyph.style.transform = `translate(${L.x.toFixed(1)}px, ${L.y.toFixed(1)}px) rotate(${L.r.toFixed(2)}deg) scale(${(1 + L.sq * 0.6).toFixed(3)}, ${(1 - L.sq).toFixed(3)})`;
    L.shade.style.transform = `translateX(${L.x.toFixed(1)}px) scale(${s.toFixed(3)})`;
    L.shade.style.opacity = s.toFixed(3);
    L.ch.classList.toggle("flying", L.held || lift > 2);
  };

  const atRest = (L) =>
    !L.held && L.wait <= 0 && L.y === 0 && L.vy === 0 && Math.abs(L.x) < 0.3 && Math.abs(L.vx) < 4 &&
    Math.abs(L.r) < 0.15 && Math.abs(L.vr) < 3 && L.sq < 0.002;

  const step = (L, dt) => {
    if (L.held) return;
    if (L.wait > 0) { L.wait -= dt; return; }
    const grounded = L.y === 0 && L.vy === 0;
    // Letters drift home gently in the air and walk home briskly once landed.
    L.vx += (-(grounded ? 42 : 9) * L.x - (grounded ? 9 : 0.8) * L.vx) * dt;
    L.vy += GRAVITY * dt;
    L.vr += (-80 * L.r - 9 * L.vr) * dt;
    L.x += L.vx * dt;
    L.y += L.vy * dt;
    L.r += L.vr * dt;
    L.sq *= Math.exp(-14 * dt);
    if (L.y > 0) {
      L.y = 0;
      L.entering = false;
      if (L.vy > 160) {
        L.sq = Math.min(0.16, L.vy / 14000);
        L.vy *= -0.36;
        L.vr += L.vx * 0.015;
      } else {
        L.vy = 0;
      }
    }
    if (!L.entering) {
      const minX = -L.homeX;
      const maxX = root.clientWidth - L.homeX - L.w;
      if (L.x < minX) { L.x = minX; L.vx = Math.abs(L.vx) * 0.5; }
      if (L.x > maxX) { L.x = maxX; L.vx = -Math.abs(L.vx) * 0.5; }
      if (L.y < -L.homeY) { L.y = -L.homeY; L.vy = Math.abs(L.vy) * 0.4; }
    }
    if (atRest(L)) Object.assign(L, { x: 0, vx: 0, r: 0, vr: 0, sq: 0 });
  };

  const loop = (t) => {
    // rAF timestamps can predate the performance.now() taken in the event that woke the loop.
    const dt = clamp((t - last) / 1000, 0, 1 / 30);
    last = t;
    let busy = false;
    for (const L of letters) {
      if (L.idle && !L.held) continue;
      step(L, dt / 2);
      step(L, dt / 2);
      render(L);
      L.idle = atRest(L);
      busy ||= !L.idle;
    }
    frame = busy ? requestAnimationFrame(loop) : 0;
  };

  const wake = (L) => {
    L.idle = false;
    if (!frame) {
      last = performance.now();
      frame = requestAnimationFrame(loop);
    }
  };

  const hop = (L, power = 1) => {
    L.wait = Math.max(L.wait, 0);
    L.vy = -(850 + Math.random() * 350) * power;
    L.vr = (Math.random() - 0.5) * 60 * power;
    wake(L);
  };

  const say = (key) => {
    sign.textContent = STRINGS[root.lang][key];
    sign.dataset.key = key;
    requestAnimationFrame(() => sign.classList.add("show"));
    clearTimeout(signTimer);
    signTimer = setTimeout(() => {
      sign.classList.remove("show");
      signTimer = setTimeout(() => { sign.textContent = ""; delete sign.dataset.key; }, 600);
    }, 4200);
  };

  const played = () => {
    throws += 1;
    if (throws === 6) say("load");
    if (throws === 18) {
      say("crew");
      letters.forEach((L, i) => { L.wait = i * 0.06; hop(L, 0.9); });
    }
  };

  const velocity = (trail) => {
    const a = trail[0];
    const b = trail[trail.length - 1];
    const dt = Math.max((b.t - a.t) / 1000, 0.016);
    return { vx: (b.x - a.x) / dt, vy: (b.y - a.y) / dt };
  };

  const attach = (L) => {
    const g = L.glyph;
    g.addEventListener("pointerdown", (e) => {
      if (reduce.matches || e.button > 0) return;
      e.preventDefault();
      g.setPointerCapture(e.pointerId);
      measure(L);
      Object.assign(L, { held: true, wait: 0, entering: false, moved: 0 });
      L.grab = { dx: e.pageX - (L.homeX + L.x), dy: e.pageY - (L.homeY + L.y) };
      L.trail = [{ x: e.pageX, y: e.pageY, t: e.timeStamp }];
      wake(L);
    });
    g.addEventListener("pointermove", (e) => {
      if (!L.held) return;
      const x = e.pageX - L.homeX - L.grab.dx;
      const y = Math.min(0, e.pageY - L.homeY - L.grab.dy);
      L.moved += Math.hypot(x - L.x, y - L.y);
      L.x = x;
      L.y = y;
      L.trail.push({ x: e.pageX, y: e.pageY, t: e.timeStamp });
      while (L.trail.length > 2 && e.timeStamp - L.trail[0].t > 90) L.trail.shift();
      // Swing a little in the direction of travel, like something held by one corner.
      L.r = clamp(velocity(L.trail).vx * 0.012, -28, 28);
    });
    const release = () => {
      if (!L.held) return;
      L.held = false;
      const v = velocity(L.trail);
      L.vx = clamp(v.vx, -3800, 3800);
      L.vy = clamp(v.vy, -3800, 3800);
      L.vr = L.vx * 0.05;
      if (L.moved > 24) played();
      wake(L);
    };
    g.addEventListener("pointerup", release);
    g.addEventListener("pointercancel", release);
    g.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "mouse" && !reduce.matches && L.idle && !letters.some((o) => o.held)) hop(L, 0.4);
    });
  };

  const build = (text, drop) => {
    lettersEl.textContent = "";
    letters = [];
    for (const word of text.split(" ")) {
      const w = document.createElement("span");
      w.className = "word";
      for (const char of word) {
        const ch = document.createElement("span");
        const glyph = document.createElement("span");
        const shade = document.createElement("span");
        ch.className = "ch";
        glyph.className = "glyph";
        shade.className = "shade";
        glyph.textContent = char;
        ch.append(shade, glyph);
        w.append(ch);
        const L = { char, ch, glyph, shade, x: 0, y: 0, vx: 0, vy: 0, r: 0, vr: 0, sq: 0, wait: 0, held: false, idle: true };
        letters.push(L);
        attach(L);
      }
      lettersEl.append(w, " ");
    }
    letters.forEach(measure);
    if (!drop || reduce.matches) return;
    // Entrance: every letter falls in from above the page and lands on the horizon.
    letters.forEach((L, i) => {
      Object.assign(L, { y: -(L.homeY + L.h + 40 + Math.random() * 160), vy: 0, wait: 0.25 + i * 0.075, entering: true });
      render(L);
      wake(L);
    });
  };

  addEventListener("resize", () => letters.forEach(measure), { passive: true });

  // Typing a letter that appears in the headline makes it hop. Keyboard users get the easter eggs too.
  addEventListener("keydown", (e) => {
    if (reduce.matches || e.ctrlKey || e.metaKey || e.altKey || e.repeat || e.key.length !== 1) return;
    const key = e.key.toLocaleLowerCase(root.lang);
    const hits = letters.filter((L) => L.char.toLocaleLowerCase(root.lang) === key || L.char.toLowerCase() === e.key.toLowerCase());
    if (!hits.length) return;
    hits.forEach((L) => hop(L));
    played();
  });

  reduce.addEventListener("change", () => {
    if (!reduce.matches) return;
    for (const L of letters) {
      Object.assign(L, { x: 0, y: 0, vx: 0, vy: 0, r: 0, vr: 0, sq: 0, wait: 0, held: false, entering: false, idle: true });
      render(L);
    }
  });

  /* ---------- Language ---------- */

  const apply = (lang, drop) => {
    const s = STRINGS[lang];
    root.lang = lang;
    for (const el of document.querySelectorAll("[data-i18n]")) el.textContent = s[el.dataset.i18n];
    for (const el of document.querySelectorAll("[data-i18n-label]")) el.setAttribute("aria-label", s[el.dataset.i18nLabel]);
    for (const btn of document.querySelectorAll(".lang button")) btn.setAttribute("aria-pressed", String(btn.dataset.lang === lang));
    if (sign.dataset.key) sign.textContent = s[sign.dataset.key];
    document.querySelector('meta[name="description"]').content = s.description;
    document.querySelector('meta[property="og:title"]').content = s.title;
    document.querySelector('meta[property="og:description"]').content = s.ogDescription;
    document.querySelector('meta[property="og:locale"]').content = s.locale;
    document.querySelector('meta[property="og:locale:alternate"]').content = STRINGS[lang === "tr" ? "en" : "tr"].locale;
    build(s.headline, drop);
  };

  // Cross-fade the body copy; the headline rebuilds itself by dropping new letters in.
  const swap = async (lang) => {
    const els = [...document.querySelectorAll(".hello, .hint, .intro, .contact .k, .foot [data-i18n]")];
    if (reduce.matches) return apply(lang, false);
    const out = els.map((el) => el.animate({ opacity: [1, 0] }, { duration: 160, easing: "ease-in", fill: "forwards" }));
    await Promise.all(out.map((a) => a.finished.catch(() => {})));
    apply(lang, true);
    out.forEach((a) => a.cancel());
    els.forEach((el) => el.animate({ opacity: [0, 1] }, { duration: 320, easing: "ease-out" }));
  };

  apply(STRINGS[root.lang] ? root.lang : "en", true);
  root.classList.remove("i18n-pending");

  for (const btn of document.querySelectorAll(".lang button")) {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang;
      try { localStorage.setItem("lang", lang); } catch (e) {}
      if (lang !== root.lang) swap(lang);
    });
  }
})();
