/* Runs in <head> before first paint: applies the saved skin and marks what CSS needs to know.
   It also goes first on history traversal: a page that handles its own entries, like the project
   filters, claims them here before the client router would reload the page.
   Kept as a string so the layout can inline it and allow exactly this text in the CSP. */
export const PREPAINT = `(() => {
  const html = document.documentElement;
  let skin = null;
  try { skin = JSON.parse(localStorage.getItem('fx-skin')); } catch (e) {}
  if (skin === 'auto') { const h = new Date().getHours(); skin = h >= 7 && h < 19 ? 'paper' : 'graphite'; }
  const colors = { graphite: '#0f0f10', paper: '#e7eaee', blueprint: '#061529', terminal: '#000000' };
  if (colors[skin]) {
    html.dataset.skin = skin;
    document.querySelector('meta[name="theme-color"]').setAttribute('content', colors[skin]);
    document.querySelector('link[data-skin-icon]').setAttribute('href', '/icons/' + skin + '.svg');
  }
  html.classList.add('js');
  if (/Mac|iPhone|iPad/.test(navigator.platform)) html.classList.add('mac');
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) html.classList.add('intro');
  addEventListener('popstate', (e) => { if (!dispatchEvent(new Event('page-history', { cancelable: true }))) e.stopImmediatePropagation(); });
})();`;
