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
    <p class="lcHi"><b>Hello!</b>I’m <span>Loop</span> Apoorva’s chess-loving AI</p>
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
  const draw = n => { if (n !== drawn) { drawn = n; [[ctx, sheet], [ctxN, plain]].forEach(([c, im]) => { if (!im.complete || !im.naturalWidth) return; c.clearRect(0, 0, C, C); c.drawImage(im, (n % 6) * C, (n / 6 | 0) * C, C, C, 0, 0, C, C); }); }
    if (bigReady > 1 && n !== chatDrawn) { chatDrawn = n; [[c2, big], [c3, bigK]].forEach(([c, im]) => { c.clearRect(0, 0, 448, 448); c.drawImage(im, (n % 6) * 448, (n / 6 | 0) * 448, 448, 448, 0, 0, 448, 448); }); } };
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const REST = 5200, OPEN = 700, HOLD = 2000, CYCLE = REST + OPEN + HOLD + OPEN;      // neutral 5.2s, opens in .7s, smiles 2s, settles in .7s
  const cycle = t => { const k = t % CYCLE; if (k < REST) return 0; if (k < REST + OPEN) return ease((k - REST) / OPEN);
    if (k < REST + OPEN + HOLD) return 1; return 1 - ease((k - REST - OPEN - HOLD) / OPEN); };
  let last = 0;
  const tick = now => { const dt = Math.min(50, now - last); last = now; const think = waiting; dock.classList.toggle('thinking', think && dock.classList.contains('up'));
    const goal = near ? 1 : still ? 0 : cycle(now); smile += Math.sign(goal - smile) * Math.min(Math.abs(goal - smile), dt / 450);   // never jumps, even when you hover mid-way
    // blinks between smiles: two or three each rest, at slightly different moments, and now and then a quick double
    const k = now % CYCLE; if (k < lastK) plan = [900 + Math.random() * 500, 2500 + Math.random() * 500, 4100 + Math.random() * 400].filter(() => Math.random() > .15), plan = plan.flatMap(t => Math.random() < .25 ? [t, t + 300] : [t]); lastK = k;
    if (!still && plan.length && k >= plan[0]) { plan.shift(); blinkAt = now; }
    const b = now - blinkAt, lid = smile > .02 ? 0 : b < 55 ? 10 : b < 135 ? 8 : b < 205 ? 10 : 0;   // closes, stays shut a moment, opens
    draw(think ? 9 : lid || Math.round(smile * 7)); requestAnimationFrame(tick); };
  const hello = v => () => { near = v; };
  [me, ask].forEach(el => { el.addEventListener('pointerenter', hello(true)); el.addEventListener('pointerleave', hello(false)); });
  ask.addEventListener('focus', hello(true)); ask.addEventListener('blur', hello(false));
  // ---- the chat window. askLoop() is the one place that will talk to the real Loop later; for now it returns sample answers, and anything else shows the "don't know yet" state
  const chat = document.getElementById('loopChat'), thread = document.getElementById('lcThread'), lcIn = document.getElementById('lcIn'), lcForm = document.getElementById('lcForm');
  const shade = document.getElementById('loopShade');
  const big = new Image(), bigK = new Image(); let bigReady = 0, chatDrawn = -1;
  const askLoop = q => new Promise((ok, no) => setTimeout(() => {
    if (/best project/i.test(q)) ok([['This is a sample answer. Once the real Loop is connected, he’ll tell you about Apoorva’s best projects here.'], ['Check out her best projects: ', { text: 'TMFL', href: 'tmfl.html' }, ' and ', { text: 'Everest.', href: 'everest.html' }]]);
    else if (/strength/i.test(q)) ok([['This is a sample answer. Once the real Loop is connected, he’ll talk through Apoorva’s strengths here.'], ['See them at work in ', { text: 'Everest.', href: 'everest.html' }]]);
    else no(new Error('unknown'));
  }, 4000));   // he thinks for 4 seconds before answering
  const SORRY = [['Oh! Sorry. I don’t know this yet. I’m trying to learn new things every day.'], ['View Apoorva’s projects or get in touch with her to know more!']];
  const note = document.createElement('p'); note.className = 'lcNote'; note.textContent = 'Loop does not save chats. Closing the window erases it.';
  const bubble = (parts, cls) => { const p = document.createElement('p'); p.className = 'lcB ' + cls;
    parts.forEach(x => { if (typeof x === 'string') p.append(x); else { const a = document.createElement('a'); a.href = x.href; a.textContent = x.text; p.append(a); } }); thread.insertBefore(p, note); };
  const toEnd = () => { thread.scrollTop = thread.scrollHeight; };
  let waiting = false, chatRun = 0; const lcThink = document.getElementById('lcThink');
  const send = async q => { q = q.trim(); if (!q || waiting) return; const run = chatRun; chat.classList.add('talking'); if (!note.parentNode) thread.append(note);
    bubble([q], 'me'); toEnd(); lcIn.value = ''; waiting = true; chat.classList.add('waiting'); lcThink.textContent = 'Loop is thinking'; const began = performance.now();
    let reply; try { reply = await askLoop(q); } catch (e) { reply = SORRY; }
    if (run !== chatRun) return;                                   // the window was closed while he was thinking
    lcThink.textContent = `Loop thought for ${Math.max(1, Math.round((performance.now() - began) / 1000))}s`; waiting = false; chat.classList.remove('waiting'); reply.forEach((r, i) => bubble(r, i ? '' : 'first')); toEnd(); };
  const openChat = () => { if (!big.src) { big.onload = bigK.onload = () => { bigReady++; chatDrawn = -1; }; big.src = 'loop/loop-frames-lg.webp?v=33'; bigK.src = 'loop/loop-frames-lg-knight.webp?v=34'; }
    near = false; shade.classList.add('on'); dock.classList.add('chatOpen'); chat.classList.add('open'); chat.setAttribute('aria-hidden', 'false'); setTimeout(() => lcIn.focus({ preventScroll: true }), 60); };
  const closeChat = () => { chatRun++; waiting = false; shade.classList.remove('on'); dock.classList.remove('chatOpen'); chat.classList.remove('open', 'talking', 'waiting'); chat.setAttribute('aria-hidden', 'true');
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
  const place = () => { const s = innerWidth / 1440; document.documentElement.style.setProperty('--ps', Math.min(s, (innerHeight - 16) / 641)); const edge = nav.offsetLeft + nav.offsetWidth, R = 24;   // edge: where the row ends with no Loop in it
    const cx = edge - 1.05 * R, left = cx - 1.05 * R;                                                 // his centre, and his left hand's edge
    
    const homeX = 1440 - 156.8, homeY = document.documentElement.clientHeight / s - 135;                // the centre of his spot on the pill
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
  const boot = () => { place(); if (!HOME || window.__loopUp) goUp(true); running = true; drawn = -1; draw(0); requestAnimationFrame(tick);
    if (!intro || window.__loopIn) show(); else { addEventListener('loopin', show, { once: true }); setTimeout(show, 6000); } };
  if (HOME) { plain.onload = () => { drawn = -1; }; sheet.onload = boot; sheet.src = 'loop/loop-frames.webp?v=34'; } else plain.onload = boot;   // only Home needs the frames with his knight
  plain.src = 'loop/loop-frames-plain.webp?v=36';
})();
