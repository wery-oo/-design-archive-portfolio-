(() => {
  const cover = document.querySelector('.cover');
  const hero = cover?.querySelector('.hero');
  const stage = cover?.querySelector('.archive-stage');
  const probe = cover?.querySelector('.motion-probe span');
  const title = cover?.querySelector('.ascii-title');
  if (!cover || !hero || !stage) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)');
  let targetX = .5;
  let targetY = .5;
  let x = .5;
  let y = .5;
  let velocity = 0;
  let lastScroll = window.scrollY;
  let lastTime = performance.now();
  let visible = true;
  let raf = 0;
  let nextGlitch = performance.now() + 4200;

  function frame(time) {
    raf = 0;
    if (!visible || reduced.matches) return;
    const dt = Math.min((time - lastTime) / 1000 || 1 / 60, .05);
    lastTime = time;
    const spring = 1 - Math.exp(-dt * 7.5);
    x += (targetX - x) * spring;
    y += (targetY - y) * spring;
    velocity *= Math.exp(-dt * 5.5);
    const mx = (x - .5) * 2;
    const my = (y - .5) * 2;
    cover.style.setProperty('--motion-grid-x', `${(-mx * 18).toFixed(2)}px`);
    cover.style.setProperty('--motion-grid-y', `${(-my * 18).toFixed(2)}px`);
    cover.style.setProperty('--motion-rotate-x', `${(-my * 1.2).toFixed(3)}deg`);
    cover.style.setProperty('--motion-rotate-y', `${(mx * 1.2).toFixed(3)}deg`);
    cover.style.setProperty('--title-x', `${(-mx * 7).toFixed(2)}px`);
    cover.style.setProperty('--title-y', `${(-my * 5).toFixed(2)}px`);
    cover.style.setProperty('--receipt-x', `${(-mx * 4).toFixed(2)}px`);
    cover.style.setProperty('--receipt-y', `${(my * 6).toFixed(2)}px`);
    cover.style.setProperty('--probe-rotate', `${(mx * 4).toFixed(2)}deg`);
    cover.style.setProperty('--pointer-x', `${(x * 100).toFixed(2)}%`);
    cover.style.setProperty('--pointer-y', `${(y * 100).toFixed(2)}%`);
    if (probe) probe.textContent = `SCAN ${String(Math.round(x * 999)).padStart(3, '0')} / ${String(Math.round(y * 999)).padStart(3, '0')}`;
    if (title && time > nextGlitch && window.scrollY < window.innerHeight * .55) {
      title.dispatchEvent(new Event('pointerenter'));
      nextGlitch = time + 5800 + Math.random() * 3400;
    }
    request();
  }

  function request() {
    if (!raf && visible && !reduced.matches) raf = requestAnimationFrame(frame);
  }

  cover.addEventListener('pointermove', event => {
    if (!finePointer.matches) return;
    targetX = event.clientX / Math.max(1, innerWidth);
    targetY = event.clientY / Math.max(1, innerHeight);
    cover.classList.add('is-pointer-active');
    request();
  }, { passive:true });
  cover.addEventListener('pointerleave', () => {
    targetX = .5;
    targetY = .5;
    cover.classList.remove('is-pointer-active');
    request();
  }, { passive:true });
  window.addEventListener('scroll', () => {
    const current = window.scrollY;
    velocity = (current - lastScroll) / Math.max((performance.now() - lastTime) / 1000, 1 / 120);
    lastScroll = current;
    request();
  }, { passive:true });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) { lastTime = performance.now(); request(); }
    else cover.classList.remove('is-pointer-active');
  }, { threshold:0 }).observe(cover);
  reduced.addEventListener('change', () => {
    if (reduced.matches && raf) cancelAnimationFrame(raf);
    raf = 0;
    request();
  });
  request();
})();
