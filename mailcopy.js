// Mail icon in the footer: the email link still opens the visitor's mail app, and the address is also
// copied, with a small note, for people who only use webmail (Gmail / Outlook in a browser tab).
// Also: "Get In Touch" in the nav glides the page down to the footer and makes its contact icons glow briefly.
(() => {
  const css = document.createElement('style');
  css.textContent = `
    .mailNote { position: fixed; left: 50%; bottom: 32px; z-index: 50; transform: translate(-50%, 12px); opacity: 0; pointer-events: none;
      padding: 12px 20px; border-radius: 50px; font-family: 'Satoshi', sans-serif; font-weight: 400; font-size: 14px; line-height: 19px; letter-spacing: .28px;
      color: #f2f2f2; background: rgba(30,36,36,.82); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.14), 0 10px 30px rgba(0,0,0,.35);
      transition: opacity .45s ease, transform .6s cubic-bezier(.2,.7,.2,1); white-space: nowrap; }
    .mailNote b { font-weight: 500; }
    .mailNote.show { opacity: 1; transform: translate(-50%, 0); }
    :root[data-theme="light"] .mailNote { color: #0d1515; background: rgba(244,246,246,.86); box-shadow: inset 0 0 0 1px rgba(1,7,7,.12), 0 10px 30px rgba(0,0,0,.12); }
    .foot:focus { outline: none; }
    .foot.ping .icons a { animation: footPing 1.1s ease-in-out 2; }
    @keyframes footPing { 0%, 100% { fill: var(--footIcon); } 50% { fill: var(--ink, #f2f2f2); } }`;
  document.head.appendChild(css);

  const copy = text => {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    const t = document.createElement('textarea');   // older browsers / pages opened straight from a folder
    t.value = text; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); } finally { t.remove(); }
    return Promise.resolve();
  };

  let note, timer;
  const show = (addr, copied) => {
    if (!note) { note = document.createElement('div'); note.className = 'mailNote'; note.setAttribute('role', 'status'); document.body.appendChild(note); }
    note.innerHTML = copied ? `Email copied: <b>${addr}</b>` : `My email: <b>${addr}</b>`;
    requestAnimationFrame(() => note.classList.add('show'));
    clearTimeout(timer); timer = setTimeout(() => note.classList.remove('show'), 2600);
  };

  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href^="mailto:"]');
    if (!a) return;
    const addr = a.getAttribute('href').slice(7).split('?')[0];
    // the mail app still opens as before; if the browser refuses to copy, the note simply shows the address
    let p; try { p = copy(addr); } catch (err) { p = Promise.reject(err); }
    p.then(() => show(addr, true), () => show(addr, false));
  });

  // "Get In Touch": glide down to the footer, hand it the focus, and let its icons glow twice
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('.nav a.cta');
    const foot = document.querySelector('.foot');
    if (!a || !foot) return;
    e.preventDefault();
    window.__toFooter = true;                       // the home page's first-scroll framing stays out of the way
    const bottom = document.documentElement.scrollHeight - innerHeight;
    scrollTo({ top: bottom, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    const arrive = () => {
      foot.setAttribute('tabindex', '-1'); foot.focus({ preventScroll: true });
      foot.classList.remove('ping'); void foot.offsetWidth; foot.classList.add('ping');
      setTimeout(() => foot.classList.remove('ping'), 2400);
    };
    let last = -1, still = 0;                       // wait until the glide has settled at the bottom
    const check = () => { if (Math.abs(scrollY - last) < 1) still++; else still = 0; last = scrollY;
      still > 3 ? arrive() : setTimeout(check, 60); };
    setTimeout(check, 60);
  });
})();
