// Makes the next page feel instant: once this page has settled, quietly fetch the pages it links to, plus the logos and first
// visuals each of them names at the top of its file, one at a time so the page being read never competes. Pointing at a link fetches that page first.
(() => {
  const net = navigator.connection; if (net && (net.saveData || /2g/.test(net.effectiveType || ''))) return;
  const done = new Set([location.pathname.split('/').pop() || 'index.html']), queue = [];
  const file = u => { try { const x = new URL(u, location.href); return x.origin === location.origin && /\.html$/.test(x.pathname) ? x.pathname.split('/').pop() : ''; } catch (e) { return ''; } };
  const get = (u, kind) => fetch(u, { priority: 'low' }).then(r => kind === 'page' && r.ok ? r.text() : '').catch(() => '');
  const page = async name => { if (done.has(name)) return; done.add(name); const html = await get(name, 'page');
    for (const m of html.matchAll(/<link rel="preload" as="image" href="([^"]+)"/g)) await get(m[1]); };
  let running = false;
  const next = async () => { if (running) return; running = true; while (queue.length) await page(queue.shift()); running = false; };
  const start = () => { document.querySelectorAll('a[href]').forEach(a => { const f = file(a.href); if (f && !done.has(f) && !queue.includes(f)) queue.push(f); }); next(); };
  document.addEventListener('pointerover', e => { const a = e.target.closest && e.target.closest('a[href]'); const f = a && file(a.href); if (f && !done.has(f)) { queue.unshift(f); next(); } }, { passive: true });
  // a story video is downloading on this page: it comes first, so the page's own video is never held up
  const story = document.getElementById('story');
  const go = () => { const begin = () => setTimeout(() => (window.requestIdleCallback || (f => f()))(start), 1500); if (!story) return begin();
    let once = false; const run = () => { if (!once) { once = true; begin(); } }; story.addEventListener('canplay', run, { once: true }); setTimeout(run, 7000); };
  document.readyState === 'complete' ? go() : addEventListener('load', go, { once: true });
})();
