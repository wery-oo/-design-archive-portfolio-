(() => {
  const story = document.querySelector('.resume-story');
  if (!story) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const smooth = value => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  };
  let scheduled = false;
  function update() {
    scheduled = false;
    const progress = -story.getBoundingClientRect().top / innerHeight;
    const fold = reduced.matches ? 0 : smooth(progress / .8);
    // Spread, then gather into the left reading column. Every position is reversible.
    const melt = reduced.matches ? 0 : Math.sin(smooth(progress / .85) * Math.PI);
    story.style.setProperty('--fold', fold);
    story.style.setProperty('--melt', melt);
    const reading = reduced.matches ? 1 : smooth((progress - .5) / .27);
    story.style.setProperty('--reading-open', reading);
    story.dataset.melt = String(melt);
    story.querySelector('.resume-reading').inert = reading < .05;
    story.querySelector('.resume-read-link').inert = fold > .95;
  }
  function requestUpdate() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  }
  addEventListener('scroll', requestUpdate, { passive: true });
  addEventListener('resize', requestUpdate);
  reduced.addEventListener('change', requestUpdate);
  update();
})();
