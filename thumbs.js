// Selected Work thumbnails: every card's picture loops continuously (never paused).
// Jar, Float and Event Tourism are pure CSS loops; TMFL, Everest and CX Navigator are scripted here.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const A = (el, kf, o) => el.animate(kf, { fill: 'forwards', ...o }).finished;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const soft = 'cubic-bezier(.45,0,.2,1)', smooth = 'cubic-bezier(.32,.72,0,1)';
  const loop = async step => { for (;;) await step(); };

  // ---- TMFL: the zoomed-out phone on Home glides in, then the story plays —
  // scroll the queue, tap a case → the OTP types in, scroll to Send OTP and tap → tap John Doe, the Biometric pop-up, tap Next →
  // the application screen scrolls to Start E-sign and taps it → Home fades back in as the phone draws back out, and round again
  const phone = document.getElementById('tmPhone');
  if (phone) {
    const card = phone.closest('.pcard'), [home, qsa, kyc, fleet] = phone.querySelectorAll('.phSlide');
    const [homeScroll, qsaScroll, kycScroll, fleetScroll] = [home, qsa, kyc, fleet].map(s => s.querySelector('.phScroll'));
    const otp = qsa.querySelector('.otp'), tap = phone.querySelector('.tap');
    const OUT = 'translate(65.4px, -60px) scale(.6)';            // the whole phone, above the glass panel
    const OTP_EDGES = [68, 125, 182, 239, 296, 353];            // right edge of each OTP digit (design px)
    // the next screen slides in from the right while the current one eases left and dims slightly
    const push = (from, to) => Promise.all([
      A(to, [{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }], { duration: 780, easing: smooth }),
      A(from, [{ transform: 'translateX(0)', filter: 'brightness(1)' }, { transform: 'translateX(-28%)', filter: 'brightness(.88)' }], { duration: 780, easing: smooth })]);
    const scroll = (el, y, ms = 1100) => A(el, [{ transform: 'translateY(0)' }, { transform: `translateY(${-y}px)` }], { duration: ms, easing: soft });
    // a finger tap: appear, press, release with a ripple
    const touch = async (x, y) => {
      tap.style.left = x + 'px'; tap.style.top = y + 'px';
      await A(tap, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 240, easing: 'ease-out' });
      await A(tap, [{ transform: 'scale(1)' }, { transform: 'scale(.82)' }], { duration: 140, easing: 'ease-in' });
      A(tap, [{ opacity: 1, transform: 'scale(.82)' }, { opacity: 0, transform: 'scale(1.7)' }], { duration: 460, easing: 'ease-out' });
      await wait(260);
    };
    phone.style.transform = OUT;
    loop(async () => {
      await wait(700);
      await A(phone, [{ transform: OUT }, { transform: 'none' }], { duration: 1200, easing: soft });
      await wait(500);
      await scroll(homeScroll, 120); await wait(300); await touch(145, 311);                 // scroll the queue, tap Riya Gopal's case
      await push(home, qsa); await wait(450);
      for (const e of OTP_EDGES) { otp.style.clipPath = `inset(410px ${374 - e}px 342px 18px)`; await wait(210); }   // the OTP types in
      await wait(350); await scroll(qsaScroll, 340); await wait(250); await touch(146, 310); // scroll to Send OTP and tap
      await push(qsa, kyc); await wait(700);
      await touch(89, 294);                                                                  // tap John Doe
      card.classList.add('popOn'); await wait(700);                                          // Biometric KYC successful, at the centre of the screen
      await scroll(kycScroll, 170, 1000); await wait(600);                                   // scroll so the whole pop-up shows
      await touch(146.5, 300);                                                               // tap Next
      await push(kyc, fleet); card.classList.remove('popOn'); await wait(600);
      await scroll(fleetScroll, 300); await wait(300); await touch(209, 311); await wait(250); // scroll to Start E-sign and tap
      // Home fades back in over everything while the phone draws back out
      [home, homeScroll].forEach(el => el.getAnimations().forEach(x => x.cancel()));
      home.style.zIndex = 4;
      const fadeIn = A(home, [{ opacity: 0 }, { opacity: 1 }], { duration: 800, easing: 'ease-in-out' });
      await wait(250);
      await Promise.all([fadeIn, A(phone, [{ transform: 'none' }, { transform: OUT }], { duration: 1200, easing: soft })]);
      // put the other screens back, out of sight, ready for the next round
      [qsa, kyc, fleet, qsaScroll, kycScroll, fleetScroll, home, phone].forEach(el => el.getAnimations().forEach(x => x.cancel()));
      home.style.zIndex = ''; otp.style.clipPath = ''; phone.style.transform = OUT;
    });
  }

  // ---- Everest: the screen stays put; the agents panel scrolls to show the second row, then back; ~2.5s between rounds
  const evScroll = document.getElementById('evScroll');
  if (evScroll) {
    const go = (a, b, ms) => A(evScroll, [{ transform: `translateY(${-a}px)` }, { transform: `translateY(${-b}px)` }], { duration: ms, easing: soft });
    loop(async () => { await wait(1200); await go(0, 150, 1800); await wait(1600); await go(150, 0, 1600); await wait(2500); });
  }

  // ---- CX Navigator: zoom onto the meter; the score counts 0 → 72 while the Potential Score tag rides the arc from red to green
  const cx = document.getElementById('cxLap'), num = document.getElementById('cxNum'), tag = document.getElementById('cxTag');
  if (cx) {
    const FROM = 'translate(45px, 90px) scale(1)', TO = 'translate(-115.2px, 90px) scale(1.45)';   // both 16px under the CX Strategy tag
    // the meter's arc: centre (260.6, 214) on the screen, +14px for the bezel; the tag ends at ~87, where Figma has it
    const place = p => { const th = Math.PI * (1 - 0.872 * p);
      tag.style.transform = `translate(${274.6 + 60 * Math.cos(th)}px, ${228 - 60 * Math.sin(th)}px)`; num.textContent = Math.round(72 * p); };
    const run = (from, to, ms) => new Promise(done => { const t0 = performance.now();
      const tick = now => { const t = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - t, 3); place(from + (to - from) * e); t < 1 ? requestAnimationFrame(tick) : done(); };
      requestAnimationFrame(tick); });
    cx.style.transform = FROM; place(0);
    loop(async () => {
      await wait(800);
      await A(cx, [{ transform: FROM }, { transform: TO }], { duration: 1600, easing: soft });
      await run(0, 1, 1800); await wait(1400);
      await Promise.all([A(cx, [{ transform: TO }, { transform: FROM }], { duration: 1400, easing: soft }), run(1, 0, 1400)]);
      await wait(2500);
    });
  }
})();
