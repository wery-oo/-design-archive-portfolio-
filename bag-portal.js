(() => {
  const cover = document.querySelector('.cover');
  const archive = document.querySelector('.object-archive-chapter');
  if (!cover || !archive) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
  let raf = 0;

  function render() {
    raf = 0;
    const distance = Math.max(1, cover.offsetHeight - innerHeight);
    const progress = clamp((scrollY - cover.offsetTop) / distance);
    const arrived = scrollY >= cover.offsetTop + distance - 1;
    archive.classList.toggle('is-portal-preview', !arrived);
    archive.classList.toggle('is-portal-visible', arrived);
    archive.inert = !arrived;
    if (reduced.matches) return;
    const zoom = smooth((progress - .06) / .82);
    const exit = smooth((progress - .78) / .22);
    const viewportShift = innerWidth < 700 ? -.02 : -.155;
    cover.style.setProperty('--portal-info-opacity', String(1 - smooth(progress / .48)));
    cover.style.setProperty('--portal-stage-x', `${(innerWidth * viewportShift * zoom).toFixed(2)}px`);
    cover.style.setProperty('--portal-stage-y', `${(innerHeight * .035 * zoom).toFixed(2)}px`);
    cover.style.setProperty('--portal-stage-scale', String((1 + zoom * (innerWidth < 700 ? 2.45 : 3.25)).toFixed(4)));
    cover.style.setProperty('--portal-belt-opacity', String(1 - smooth((progress - .22) / .35)));
    cover.style.setProperty('--portal-stage-opacity', '1');
    archive.style.setProperty('--portal-arrival', String(exit));
  }
  const request = () => { if (!raf) raf = requestAnimationFrame(render); };
  addEventListener('scroll', request, { passive:true });
  addEventListener('resize', request);
  reduced.addEventListener('change', request);
  render();
})();
