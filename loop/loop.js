// Loop: holds one pose (his knight in hand), and every few seconds his eyes open from neutral into a smile and settle back. He blinks now and then and smiles when you come near.
// Frames 0-7 are the eyes opening, 8 eyes shut, 9 thinking, 10 eyes half shut, all rendered from his 3D model. Everything loads after the page, so it never slows the first paint.
(() => {
  const HOME = document.documentElement.classList.contains('homePage');
  document.body.insertAdjacentHTML('beforeend', `<div class="loopShade" id="loopShade" aria-hidden="true"></div>
<section class="loopChat" id="loopChat" role="dialog" aria-label="Chat with Loop" aria-hidden="true">
  <button class="lcX" id="lcX" type="button" aria-label="Close chat"><img src="loop/x.svg" alt=""></button>
  <div class="lcMe" aria-hidden="true"><canvas id="lcCv" width="448" height="448"></canvas><canvas id="lcCvK" width="448" height="448"></canvas></div>
  <span class="lcDots" aria-hidden="true"><i></i><i></i><i></i></span>
  <p class="lcThink" id="lcThink" role="status"></p>
  <div class="lcHello">
    <p class="lcHi"><b>Hello!</b>I’m <span>Loop</span>, Apoorva’s chess-loving AI</p>
    <p class="lcQ">What do you want to know today?</p>
    <div class="lcChips"><button type="button" data-q="Tell me her best projects">Tell me her best projects</button><button type="button" data-q="What are her strengths?">What are her strengths?</button></div>
  </div>
  <div class="lcThread" id="lcThread" aria-live="polite"></div>
  <form class="lcForm" id="lcForm" autocomplete="off"><input id="lcIn" type="text" maxlength="300" placeholder="Type and ask me anything!" aria-label="Ask Loop a question"><button class="lcSend" id="lcSend" type="submit" aria-label="Send" tabindex="-1"><img src="loop/send.svg" alt=""></button></form>
</section>
<div class="loopDock" id="loopDock">
  <span class="loopGlow" aria-hidden="true"></span>
  <button class="loopAsk glass" id="loopAsk" type="button" style="--c:11.00deg">Need something? Ask <span class="loopName">Loop</span>!</button>
  <div class="loopMe" id="loopMe" role="button" tabindex="-1" aria-label="Ask Loop"><div class="loopBob"><canvas id="loopCv" width="224" height="224"></canvas><canvas id="loopCvN" width="224" height="224"></canvas><span class="loopDots"><i></i><i></i><i></i></span></div></div>
</div>
`);
  const dock = document.getElementById('loopDock');
  const me = document.getElementById('loopMe'), ask = document.getElementById('loopAsk'), cv = document.getElementById('loopCv');
  const ctx = cv.getContext('2d'), ctxN = document.getElementById('loopCvN').getContext('2d'), plain = new Image(), C = 224, still = matchMedia('(prefers-reduced-motion: reduce)').matches, sheet = new Image();
  let near = false, blinkAt = -1e9, smile = 0, drawn = -1, lastK = 1e9, plan = [];
  const c2 = document.getElementById('lcCv').getContext('2d'), c3 = document.getElementById('lcCvK').getContext('2d');
  // frames 11-26 are the turn. Only the nav view and the chat's first screen have them; the pill and the conversation stay on his resting frame.
  // Between two frames the picture is an exact blend, so the turn moves on every screen refresh instead of stepping
  const STEPS = 16;
  const cell = (c, im, w, f, al) => { c.globalAlpha = al; c.drawImage(im.ready || im, (f % 6) * w, (f / 6 | 0) * w, w, w, 0, 0, w, w); };
  // each sheet is unpacked once, away from the page's main work (fetch → bitmap). Cutting it into pictures here stole a frame at a time from the knight's moves
  const prepare = async im => { try { if (!window.createImageBitmap) return; const b = await fetch(im.src).then(r => r.blob()); im.ready = await createImageBitmap(b); } catch (e) {} };
  const paint = (c, im, w, a, b, m) => { if (!im.complete || !im.naturalWidth) return; c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.clearRect(0, 0, w, w);
    if (m < .01) cell(c, im, w, a, 1); else { c.globalCompositeOperation = 'lighter'; cell(c, im, w, a, 1 - m); cell(c, im, w, b, m); c.globalCompositeOperation = 'source-over'; } c.globalAlpha = 1; };
  const draw = (n, pos = 0) => { const key = n + '|' + pos.toFixed(2), lo = Math.floor(pos), a = pos ? (lo ? 10 + lo : 0) : n, b = pos ? 10 + Math.min(STEPS, lo + 1) : n, m = pos ? pos - lo : 0, rest = pos ? 0 : n;
    if (key !== drawn) { drawn = key; paint(ctx, sheet, C, rest, rest, 0); paint(ctxN, plain, C, a, b, m); }
    if (bigReady > 1 && key !== chatDrawn && dock.classList.contains('chatOpen')) { chatDrawn = key; paint(c2, big, 448, rest, rest, 0); paint(c3, bigK, 448, a, b, m); } };
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const REST = 5200, OPEN = 700, HOLD = 2000, CYCLE = REST + OPEN + HOLD + OPEN;      // neutral 5.2s, opens in .7s, smiles 2s, settles in .7s
  const cycle = t => { const k = t % CYCLE; if (k < REST) return 0; if (k < REST + OPEN) return ease((k - REST) / OPEN);
    if (k < REST + OPEN + HOLD) return 1; return 1 - ease((k - REST - OPEN - HOLD) / OPEN); };
  // now and then he glances to the side, holds, and comes back: left in the nav, right towards his knight in the chat.
  // Never on the first go, then only every third or fourth rest, about half a minute apart
  const T0 = 1100, TURN = 1100, LOOK = 1400, soft = t => .5 - .5 * Math.cos(Math.PI * t);
  const glance = k => k < T0 ? 0 : k < T0 + TURN ? soft((k - T0) / TURN) : k < T0 + TURN + LOOK ? 1 : k < T0 + 2 * TURN + LOOK ? 1 - soft((k - T0 - TURN - LOOK) / TURN) : 0;
  let last = 0, tv = 0, rests = 0, nextGlance = 3, glanceOn = false;
  const tick = now => { const dt = Math.min(50, now - last); last = now; const think = waiting; dock.classList.toggle('thinking', think && dock.classList.contains('up'));
    const goal = near ? 1 : still ? 0 : cycle(now); smile += Math.sign(goal - smile) * Math.min(Math.abs(goal - smile), dt / 450);   // never jumps, even when you hover mid-way
    // blinks between smiles: two or three each rest, at slightly different moments, and now and then a quick double
    const k = now % CYCLE; if (k < lastK) { rests++; glanceOn = rests >= nextGlance; if (glanceOn) nextGlance = rests + 3 + (Math.random() * 2 | 0); plan = [900 + Math.random() * 500, 2500 + Math.random() * 500, 4100 + Math.random() * 400].filter(() => Math.random() > .15), plan = glanceOn ? [] : plan.flatMap(t => Math.random() < .25 ? [t, t + 300] : [t]); } lastK = k;
    if (!still && plan.length && k >= plan[0]) { plan.shift(); blinkAt = now; }
    const tGoal = near || think || still || !glanceOn ? 0 : glance(k); tv += (tGoal - tv) * (1 - Math.exp(-dt / 90));   // a soft follow: even a sudden stop, such as a hover, eases back
    const b = now - blinkAt, lid = smile > .02 || tv > .02 ? 0 : b < 55 ? 10 : b < 135 ? 8 : b < 205 ? 10 : 0;   // closes, stays shut a moment, opens
    if (!think && tv > .004) draw(0, tv * STEPS); else draw(think ? 9 : lid || Math.round(smile * 7)); requestAnimationFrame(tick); };
  const hello = v => () => { near = v; };
  [me, ask].forEach(el => { el.addEventListener('pointerenter', hello(true)); el.addEventListener('pointerleave', hello(false)); });
  ask.addEventListener('focus', hello(true)); ask.addEventListener('blur', hello(false));
  // ---- the chat window. askLoop() talks to the real Loop through the backend; the key lives there, never in this page
  const chat = document.getElementById('loopChat'), thread = document.getElementById('lcThread'), lcIn = document.getElementById('lcIn'), lcForm = document.getElementById('lcForm');
  const shade = document.getElementById('loopShade');
  const big = new Image(), bigK = new Image(); let bigReady = 0, chatDrawn = -1;
  const LOOP_API = 'https://portfolio-chat-nine-phi.vercel.app/api/chat';
  const MIN_THINK = 2000, turns = [];                              // he always thinks for at least 2 seconds; turns is this chat only, and closing the window erases it
  const PAGES = ['home', 'tmfl', 'everest', 'cx-navigator', 'jar', 'float', 'event-tourism', 'about', 'playground'];
  const local = location.hostname === 'localhost';
  const pageLink = name => (local && !/^(home|about|playground)$/.test(name) ? name + '-v' + '2' : name) + '.html';
  // his reply is plain text with [words](link) for links. Only links to these pages become clickable, everything else stays as words
  const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g, pageOf = l => l.replace(/\.html$/, '');
  const NAMES = { home: 'All Projects', tmfl: 'TMFL Fifth Element', everest: 'Everest AI Admin Portal', 'cx-navigator': 'Deloitte CX Navigator', jar: 'Jar User Research', float: 'Service Design for Float', 'event-tourism': 'Gujarat Event Tourism', about: 'About Apoorva', playground: 'Playground' };
  const parts = line => { const out = []; let at = 0; for (const m of line.matchAll(LINK)) { out.push(line.slice(at, m.index)); at = m.index + m[0].length; out.push(m[2] === '#footer' ? { text: m[1], footer: true } : m[1]); }
    out.push(line.slice(at)); return out.filter(x => x !== ''); };
  // project links become buttons under his answer; in the sentence they stay plain words, and a line of nothing but links disappears
  const toBubbles = text => { const cards = []; const note = l => { const n = pageOf(l); if (PAGES.includes(n) && !cards.includes(n)) cards.push(n); };
    for (const m of text.matchAll(LINK)) note(m[2]);
    const body = text.split('\n').filter(l => !(l.trim() && l.replace(LINK, '').replace(/[\s,.&]|\band\b/g, '') === '' && !l.includes('#footer'))).join('\n');
    return { cards, bubbles: body.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean).map(parts) }; };
  const SORRY_TEXT = 'Oh! Sorry. I don’t know this yet. I’m trying to learn new things every day.\n\nView Apoorva’s projects or get in touch with her to know more!';
  const askLoop = async q => { const stop = new AbortController(), timer = setTimeout(() => stop.abort(), 20000);
    try { const r = await fetch(LOOP_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [...turns, { role: 'user', content: q }] }), signal: stop.signal });
      if (!r.ok) throw new Error('busy'); const { reply } = await r.json(); if (!reply) throw new Error('empty'); return reply; } finally { clearTimeout(timer); } };
  const note = document.createElement('p'); note.className = 'lcNote'; note.textContent = 'Loop does not save chats. Closing the window erases it.';
  const bubble = (bits, cls) => { const p = document.createElement('p'); p.className = 'lcB ' + cls;
    bits.forEach(x => { if (typeof x === 'string') p.append(x); else { const a = document.createElement('a'); a.textContent = x.text; a.href = x.href || '#'; if (x.footer) a.addEventListener('click', e => { e.preventDefault(); closeChat(); document.querySelector('.nav a.cta')?.click(); }); p.append(a); } }); thread.insertBefore(p, note); };
  const ARROW = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="#c5c5c5" d="M0 8C0 10.1217 0.842855 12.1566 2.34315 13.6569C3.84344 15.1571 5.87827 16 8 16C10.1217 16 12.1566 15.1571 13.6569 13.6569C15.1571 12.1566 16 10.1217 16 8C16 5.87827 15.1571 3.84344 13.6569 2.34315C12.1566 0.842855 10.1217 0 8 0C5.87827 0 3.84344 0.842855 2.34315 2.34315C0.842855 3.84344 0 5.87827 0 8ZM5.904 10.803C5.85788 10.8508 5.8027 10.8888 5.7417 10.9151C5.6807 10.9413 5.61509 10.955 5.5487 10.9556C5.48231 10.9562 5.41647 10.9436 5.35502 10.9184C5.29357 10.8933 5.23775 10.8561 5.1908 10.8092C5.14386 10.7623 5.10673 10.7064 5.08159 10.645C5.05645 10.5835 5.0438 10.5177 5.04437 10.4513C5.04495 10.3849 5.05874 10.3193 5.08495 10.2583C5.11115 10.1973 5.14924 10.1421 5.197 10.096L9.293 6H6.525C6.39239 6 6.26521 5.94732 6.17145 5.85355C6.07768 5.75979 6.025 5.63261 6.025 5.5C6.025 5.36739 6.07768 5.24021 6.17145 5.14645C6.26521 5.05268 6.39239 5 6.525 5H10.5C10.6326 5 10.7598 5.05268 10.8536 5.14645C10.9473 5.24021 11 5.36739 11 5.5V9.475C11 9.60761 10.9473 9.73479 10.8536 9.82855C10.7598 9.92232 10.6326 9.975 10.5 9.975C10.3674 9.975 10.2402 9.92232 10.1464 9.82855C10.0527 9.73479 10 9.60761 10 9.475V6.707L5.904 10.803Z"/></svg>';
  const card = n => { const a = document.createElement('a'); a.className = 'lcCard'; a.href = pageLink(n); a.textContent = 'View ' + NAMES[n]; a.insertAdjacentHTML('beforeend', ARROW); thread.insertBefore(a, note); };
  const toEnd = () => { thread.scrollTop = thread.scrollHeight; };
  let waiting = false, chatRun = 0; const lcThink = document.getElementById('lcThink');
  const send = async q => { q = q.trim(); if (!q || waiting) return; const run = chatRun; chat.classList.add('talking'); if (!note.parentNode) thread.append(note);
    bubble([q], 'me'); toEnd(); lcIn.value = ''; waiting = true; chat.classList.add('waiting'); lcThink.textContent = 'Loop is thinking'; const began = performance.now();
    let reply, failed = false; const pause = new Promise(ok => setTimeout(ok, MIN_THINK));
    try { reply = await askLoop(q); } catch (e) { reply = SORRY_TEXT; failed = true; } await pause;
    if (run !== chatRun) return;                                   // the window was closed while he was thinking
    lcThink.textContent = `Loop thought for ${Math.max(1, Math.round((performance.now() - began) / 1000))}s`; waiting = false; chat.classList.remove('waiting'); const { bubbles, cards } = toBubbles(reply); bubbles.forEach((r, i) => bubble(r, i ? '' : 'first')); cards.forEach(card); toEnd();
    if (!failed) { turns.push({ role: 'user', content: q }, { role: 'assistant', content: reply.slice(0, 1500) }); turns.splice(0, Math.max(0, turns.length - 10)); } };
  // his large pictures come in quietly soon after the page is up (or the moment the pointer nears him), so he's already there when the chat opens
  const loadBig = () => { if (big.src) return; big.fetchPriority = bigK.fetchPriority = 'low'; big.onload = bigK.onload = e => { bigReady++; chatDrawn = -1; prepare(e.target); }; big.src = 'loop/loop-frames-lg.webp?v=33'; bigK.src = 'loop/loop-frames-lg-knight.webp?v=38'; };
  (document.readyState === 'complete' ? setTimeout(loadBig, 2500) : addEventListener('load', () => setTimeout(loadBig, 2500), { once: true }));
  dock.addEventListener('pointerover', loadBig, { once: true });
  const openChat = () => { loadBig();
    near = false; glanceOn = false; nextGlance = rests + 2; shade.classList.add('on'); dock.classList.add('chatOpen'); chat.classList.add('open'); chat.setAttribute('aria-hidden', 'false'); setTimeout(() => lcIn.focus({ preventScroll: true }), 60); };
  const closeChat = () => { chatRun++; waiting = false; turns.length = 0; shade.classList.remove('on'); dock.classList.remove('chatOpen'); chat.classList.remove('open', 'talking', 'waiting'); chat.setAttribute('aria-hidden', 'true');
    setTimeout(() => { if (!chat.classList.contains('open')) thread.replaceChildren(); }, 450); lcIn.value = ''; lcForm.classList.remove('typing'); if (!dock.classList.contains('up')) ask.focus({ preventScroll: true }); near = false; };   // closing erases the chat, as the window promises
  const toggle = () => chat.classList.contains('open') ? closeChat() : openChat();
  ask.addEventListener('click', toggle); me.addEventListener('click', toggle);
  document.getElementById('lcX').addEventListener('click', closeChat);
  const typed = () => { const on = !!lcIn.value.trim(); lcForm.classList.toggle('typing', on); document.getElementById('lcSend').tabIndex = on ? 0 : -1; };
  lcIn.addEventListener('input', typed);
  lcForm.addEventListener('submit', e => { e.preventDefault(); send(lcIn.value).then(typed); typed(); });
  chat.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => send(b.dataset.q)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && chat.classList.contains('open')) closeChat(); });
  // in the nav he takes the end of the row: his hand's edge lines up with the page's 120px right margin (where Get In Touch normally ends),
  // and the pills slide left to make room, keeping the nav's own 20px gap. All measured in stage units, so it holds at any window size
  const nav = document.getElementById('nav');
  // the screen height he's placed from: fixed once on a phone (it only changes there when the address bar slides or the phone turns)
  const touch = matchMedia('(pointer: coarse)').matches; let dockH = 0, dockW = 0;
  const measure = () => { if (touch && dockH && innerWidth === dockW) return; dockW = innerWidth; dockH = document.documentElement.clientHeight; document.documentElement.style.setProperty('--dockH', dockH + 'px'); };
  measure();
  const place = () => { measure(); const s = innerWidth / 1440; document.documentElement.style.setProperty('--ps', Math.min(s, (innerHeight - 16) / 641)); const edge = nav.offsetLeft + nav.offsetWidth, R = 24;   // edge: where the row ends with no Loop in it
    const cx = edge - 1.05 * R, left = cx - 1.05 * R;                                                 // his centre, and his left hand's edge
    
    const homeX = 1440 - 156.8, homeY = dockH / s - 135;                // the centre of his spot on the pill
    dock.style.setProperty('--nx', cx - homeX + 'px'); dock.style.setProperty('--ny', 55.5 - homeY + 'px'); };
  let running = false;
  const goUp = jump => { if (dock.classList.contains('up')) return; place();
    if (jump) { dock.classList.add('snap'); nav.classList.add('snap'); }                    // already seen the scene this visit: he's simply there, no glide
    dock.classList.add('up'); nav.classList.add('roomForLoop');
    if (jump) requestAnimationFrame(() => requestAnimationFrame(() => { dock.classList.remove('snap'); nav.classList.remove('snap'); })); };
  addEventListener('loopup', () => { if (running) goUp(false); });
  if (HOME && still) addEventListener('scroll', window.loopUp, { once: true, passive: true });             // less-motion visitors never get the scene, so their first scroll moves him
  addEventListener('resize', place);
  // he comes in with the subtitle, at the subtitle's own speed and easing. Coming back to a finished Home, or asking for less motion, he's simply there
  const glow = dock.querySelector('.loopGlow'), intro = HOME && !document.documentElement.classList.contains('settled') && !still;
  const show = () => { if (dock.classList.contains('in')) return; dock.classList.add('in');
    if (intro) [ask, me, glow].forEach(el => el.animate([{ opacity: 0, translate: '0 14px' }, { opacity: 1, translate: '0 0' }], { duration: 1400, easing: 'cubic-bezier(.33,1,.68,1)', fill: 'backwards' })); };
  sheet.fetchPriority = 'low';
  const boot = () => { if (!HOME) prepare(plain); place(); if (!HOME || window.__loopUp) goUp(true); running = true; drawn = -1; draw(0); requestAnimationFrame(tick);
    if (!intro || window.__loopIn) show(); else { addEventListener('loopin', show, { once: true }); setTimeout(show, 6000); } };
  if (HOME) { plain.onload = () => { drawn = -1; prepare(plain); }; sheet.onload = boot; sheet.src = 'loop/loop-frames.webp?v=34'; } else plain.onload = boot;   // only Home needs the frames with his knight
  plain.src = 'loop/loop-frames-plain.webp?v=39';
})();
