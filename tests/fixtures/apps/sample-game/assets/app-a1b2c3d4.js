// A stand-in game for Folio's tests: it reads the language and skin Folio passes, keeps a count in its own
// namespace of the site's storage, and draws on a canvas.
const q = new URLSearchParams(location.search);
const ns = (location.pathname.match(/^\/(play|lab)\/([a-z0-9-]+)\/app\//) ?? []).slice(1, 3).join(':');
const key = `${ns}:visits`;
const visits = Number(localStorage.getItem(key) ?? 0) + 1;
localStorage.setItem(key, String(visits));
document.getElementById('out').textContent = `running ${ns} lang=${q.get('lang') ?? '-'} skin=${q.get('skin') ?? '-'} visits=${visits}`;
const ctx = document.getElementById('board').getContext('2d');
ctx.fillStyle = '#ff5a36'; ctx.fillRect(20, 20, 80, 80);
