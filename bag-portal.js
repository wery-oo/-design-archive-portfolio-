(() => {
  const cover = document.querySelector('.cover');
  const archive = document.querySelector('.object-archive-chapter');
  if (!cover || !archive) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
  let raf = 0;
  let settleTimer;
  let travel;
  const state = { progress: 0 };
  const motion = window.gsap;
  let previousScroll = scrollY;
  let forward = true;

  function render() {
    raf = 0;
    const distance = Math.max(1, cover.offsetHeight - innerHeight);
    const target = clamp((scrollY - cover.offsetTop) / distance);
    if (motion && !reduced.matches) {
      motion.to(state, { progress:target, duration:.32, ease:'power2.out', overwrite:true, onUpdate:paint });
    } else { state.progress = target; paint(); }
  }
  function paint() {
    const progress = state.progress;
    const distance = Math.max(1, cover.offsetHeight - innerHeight);
    const arrived = scrollY >= cover.offsetTop + distance - 1;
    archive.classList.toggle('is-portal-preview', !arrived);
    archive.classList.toggle('is-portal-visible', arrived);
    archive.inert = !arrived;
    if (reduced.matches) {
      ['--portal-info-opacity','--portal-stage-x','--portal-stage-y','--portal-stage-scale','--portal-belt-opacity','--portal-stage-opacity'].forEach(name => cover.style.removeProperty(name));
      archive.style.setProperty('--portal-arrival', arrived ? '1' : '0');
      return;
    }
    const zoom = smooth((progress - .06) / .82);
    const exit = smooth((progress - .65) / .35);
    const viewportShift = innerWidth < 700 ? -.02 : -.155;
    cover.style.setProperty('--portal-info-opacity', String(1 - smooth(progress / .48)));
    cover.style.setProperty('--portal-stage-x', `${(innerWidth * viewportShift * zoom).toFixed(2)}px`);
    cover.style.setProperty('--portal-stage-y', `${(innerHeight * .035 * zoom).toFixed(2)}px`);
    cover.style.setProperty('--portal-stage-scale', String((1 + zoom * (innerWidth < 700 ? 2.45 : 3.25)).toFixed(4)));
    cover.style.setProperty('--portal-belt-opacity', String(1 - smooth((progress - .22) / .35)));
    cover.style.setProperty('--portal-stage-opacity', String(1 - exit));
    archive.style.setProperty('--portal-arrival', String(exit));
  }
  const request = () => { if (!raf) raf = requestAnimationFrame(render); };
  addEventListener('scroll', () => {
    forward = scrollY >= previousScroll;
    previousScroll = scrollY;
    request();
    clearTimeout(settleTimer);
    if (travel || reduced.matches || !motion) return;
    settleTimer = setTimeout(() => {
      const distance = cover.offsetHeight - innerHeight;
      const progress = (scrollY - cover.offsetTop) / distance;
      if (!forward || progress < .22 || progress >= .98) return;
      const position = { y:scrollY };
      travel = motion.to(position, {
        y:cover.offsetTop + distance, duration:.85, ease:'power2.inOut',
        onUpdate:() => window.scrollTo({top:position.y,behavior:'instant'}),
        onComplete:() => { travel = null; }
      });
    }, 200);
  }, { passive:true });
  const interrupt = () => { clearTimeout(settleTimer); travel?.kill(); travel = null; };
  ['wheel','touchstart','pointerdown','keydown'].forEach(type => addEventListener(type, interrupt, {passive:true}));
  addEventListener('resize', request);
  reduced.addEventListener('change', request);
  render();
})();
