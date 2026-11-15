/* The hero's prompt as a small working terminal. Everything typed is shown back as text only (never as HTML); links
   it prints are the site's own. Commands and what they print come from the page (#term-data, built from data.ts). */

type Project = { id: string; name: string; note: string; href: string; external: boolean };
type Data = {
  name: string; email: string; linkedin: string; github: string; cv: string; otherHref: string; projects: Project[];
  log: { hash: string; when: string; msg: string }[];
  s: Record<string, string> & { help: [string, string][]; sudo: [string, string] };
};

export function startTerminal(form: HTMLFormElement, signal: AbortSignal) {
  const source = document.getElementById('term-data');
  if (!source) return;
  const d: Data = JSON.parse(source.textContent ?? '{}');
  const out = form.querySelector<HTMLOListElement>('.term-out')!;
  const input = form.querySelector<HTMLInputElement>('input')!;
  const history: string[] = [];
  let back = 0;

  const span = (text: string, cls: string) => Object.assign(document.createElement('span'), { className: cls, textContent: text });
  const link = (text: string, href: string, external = false) => {
    const a = Object.assign(document.createElement('a'), { textContent: text, href });
    if (external) { a.target = '_blank'; a.rel = 'noreferrer'; }
    return a;
  };
  const print = (...parts: (string | Node)[]) => {
    const li = document.createElement('li');
    li.append(...parts);
    out.append(li);
    while (out.children.length > 40) out.firstElementChild?.remove();
    out.scrollTop = out.scrollHeight;
  };
  // Through the client router, so the page transition still runs.
  const go = (href: string) => { const a = link('', href); document.body.append(a); a.click(); a.remove(); };
  const find = (q: string) => d.projects.find((p) => p.id.startsWith(q) || p.name.toLowerCase().startsWith(q));
  const open = (p: Project) => { print(d.s.opening.replace('{p}', p.name)); window.setTimeout(() => (p.external ? window.open(p.href, '_blank', 'noopener') : go(p.href)), 260); };

  const commands: Record<string, (args: string[]) => void> = {
    help: () => { d.s.help.forEach(([c, text]) => print(span(c.padEnd(14), 'k'), text)); print(span(d.s.hidden, 'm')); },
    whoami: () => { print(span(d.name, 'k')); print(d.s.role); },
    // Only the name is the link; the padding after it stays plain, so the underline doesn't run on.
    ls: () => d.projects.forEach((p) => print(link(p.id, p.href, p.external), ' '.repeat(Math.max(1, 13 - p.id.length)), span(p.note, 'm'))),
    open: ([q]) => {
      if (!q) return print(d.s.openUsage);
      const p = find(q);
      return p ? open(p) : print(d.s.noProject.replace('{p}', q));
    },
    cat: ([q]) => {
      if (q === 'cv' || q === 'cv.pdf') return commands.cv([]);
      const p = q && find(q);
      return p ? open(p) : print(`cat: ${q ?? ''}: ${d.s.noFile}`);
    },
    cv: () => { print(d.s.cv); window.setTimeout(() => go(d.cv), 260); },
    contact: () => {
      print(span('email'.padEnd(10), 'k'), link(d.email, `mailto:${d.email}`));
      print(span('linkedin'.padEnd(10), 'k'), link(d.linkedin.replace(/^https:\/\/(www\.)?/, ''), d.linkedin, true));
      print(span('github'.padEnd(10), 'k'), link(d.github.replace(/^https:\/\//, ''), d.github, true));
    },
    fastfetch: () => {
      // The readout above is fastfetch's output: run again, it prints again.
      const panel = form.closest('.fetch');
      panel?.classList.remove('in');
      void (panel as HTMLElement | null)?.offsetWidth;
      panel?.classList.add('in');
      print(span(d.s.fastfetch, 'm'));
    },
    mochi: () => { document.querySelector<HTMLElement>('.dock [data-mochi], [data-mochi]')?.click(); print(d.s.mochi); },
    lang: () => { print(d.s.lang); try { localStorage.setItem('lang', document.documentElement.lang === 'tr' ? 'en' : 'tr'); } catch { /* private mode */ } location.href = d.otherHref; },
    clear: () => out.replaceChildren(),
    // Not in help: the things people type into any terminal they find.
    echo: (args) => print(args.join(' ')),
    pwd: () => print('/home/izzet/oztozlu.dev'),
    date: () => print(new Date().toLocaleString(document.documentElement.lang, { dateStyle: 'full', timeStyle: 'short' })),
    history: () => history.forEach((h, i) => print(span(String(i + 1).padStart(3) + '  ', 'm'), h)),
    git: ([sub]) => {
      if (sub !== 'log') return print(d.s.gitUsage);
      d.log.forEach((c) => print(span(c.hash, 'k'), span(`  ${c.when.padEnd(12)}`, 'm'), c.msg));
    },
    ping: () => {
      [0, 1, 2].forEach((i) => window.setTimeout(() => print(`64 bytes from oztozlu.dev: icmp_seq=${i + 1} ttl=64 time=${(0.3 + Math.random() * 0.4).toFixed(2)} ms`), 300 * (i + 1)));
      window.setTimeout(() => print(span(d.s.pong, 'ok')), 1200);
    },
    rm: () => print(span(d.s.rm, 'warn')),
    vim: () => print(d.s.vim),
    exit: () => {
      print('logout');
      input.disabled = true;
      window.setTimeout(() => print(span(d.s.closed, 'm')), 500);
      window.setTimeout(() => { print(span(d.s.reopened, 'ok')); input.disabled = false; input.focus(); }, 1600);
    },
    mochisay: (args) => {
      const text = (args.join(' ') || d.s.mochiHi).slice(0, 40);
      const art = [
        ` ${'_'.repeat(text.length + 2)}`,
        `< ${text} >`,
        ` ${'-'.repeat(text.length + 2)}`,
        '    \\',
        '     \\  ┌───────────┐',
        '        │  ▮     ▮  │',
        '        │     ▬     │',
        '        └───────────┘',
      ];
      const pre = document.createElement('pre');
      pre.textContent = art.join('\n');
      print(pre);
      document.querySelectorAll<HTMLElement>('[data-mochi]').forEach((m) => m.classList.add('is-happy'));
      window.setTimeout(() => document.querySelectorAll('[data-mochi]').forEach((m) => m.classList.remove('is-happy')), 1600);
    },
    sudo: () => {
      print(d.s.sudo[0]);
      window.setTimeout(() => { print(d.s.sudo[1]); location.href = `mailto:${d.email}`; }, 800);
    },
  };
  const alias: Record<string, string> = { neofetch: 'fastfetch', cd: 'open', projects: 'ls', mail: 'contact', cowsay: 'mochisay', hire: 'sudo', nano: 'vim', emacs: 'vim', nvim: 'vim', logout: 'exit' };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const raw = input.value.trim();
    input.value = '';
    if (!raw) return;
    history.push(raw);
    back = history.length;
    print(span('❯ ', 'p'), raw);
    const [word, ...args] = raw.toLowerCase().split(/\s+/);
    const run = commands[alias[word] ?? word];
    if (run) run(args);
    else { print(d.s.notFound.replace('{c}', word)); print(span(d.s.tryHelp, 'm')); }
  }, { signal });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && back > 0) { e.preventDefault(); input.value = history[--back]; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); back = Math.min(history.length, back + 1); input.value = history[back] ?? ''; }
    else if (e.key === 'Tab' && input.value.trim()) {
      // Completes a command, or a project after open/cat/cd, as fish would.
      const [word, ...rest] = input.value.toLowerCase().trimStart().split(/\s+/);
      // Hidden commands don't complete, so Tab doesn't give them away.
      const listed = d.s.help.map(([c]) => c.split(' ')[0]);
      const pool = rest.length ? d.projects.map((p) => p.id) : listed;
      const part = rest.length ? rest[rest.length - 1] : word;
      const hit = pool.find((c) => c.startsWith(part) && c !== part);
      if (hit) { e.preventDefault(); input.value = rest.length ? `${word} ${hit}` : `${hit} `; }
    }
  }, { signal });
}
