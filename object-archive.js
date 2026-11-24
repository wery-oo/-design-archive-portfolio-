(() => {
  const section = document.querySelector('.object-archive-chapter');
  if (!section) return;
  const rail = section.querySelector('.object-rail');
  const meter = section.querySelector('.object-scroll-meter i');
  const cards = [...section.querySelectorAll('.archive-object')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let target = 0;
  let animation = 0;
  let pointer = null;
  let moved = false;
  let scrollFrame = 0;
  const max = () => Math.max(0, rail.scrollWidth - rail.clientWidth);

  function paint() {
    const progress = max() > 0 ? rail.scrollLeft / max() : 0;
    meter.style.transform = `translateX(${progress * 400}%)`;
  }

  function tick() {
    const delta = target - rail.scrollLeft;
    rail.scrollLeft += delta * .13;
    paint();
    if (Math.abs(delta) > .7) animation = requestAnimationFrame(tick);
    else { rail.scrollLeft = target; animation = 0; paint(); }
  }

  function seek(value) {
    target = Math.max(0, Math.min(max(), value));
    if (!animation) animation = requestAnimationFrame(tick);
  }

  function syncFromDocument() {
    scrollFrame = 0;
    if (pointer) return;
    const start = section.offsetTop;
    const distance = Math.max(1, section.offsetHeight - innerHeight);
    const progress = Math.max(0, Math.min(1, (scrollY - start) / distance));
    cancelAnimationFrame(animation);
    animation = 0;
    target = max() * progress;
    rail.scrollLeft = target;
    paint();
  }

  window.openObjectArchive = () => section.scrollIntoView({ behavior:reduced.matches ? 'auto' : 'smooth', block:'start' });

  new IntersectionObserver(([entry]) => {
    section.classList.toggle('is-entered', entry.isIntersecting);
  }, { threshold:.08 }).observe(section);

  rail.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    seek(event.key === 'Home' ? 0 : event.key === 'End' ? max() : rail.scrollLeft + (event.key === 'ArrowRight' ? 1 : -1) * rail.clientWidth * .55);
  });

  rail.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    cancelAnimationFrame(animation);
    animation = 0;
    pointer = { x:event.clientX, scroll:rail.scrollLeft };
    moved = false;
    rail.setPointerCapture?.(event.pointerId);
  });
  rail.addEventListener('pointermove', event => {
    if (!pointer) return;
    const delta = event.clientX - pointer.x;
    if (Math.abs(delta) > 5) { moved = true; rail.classList.add('is-dragging'); }
    if (moved) { rail.scrollLeft = pointer.scroll - delta; target = rail.scrollLeft; paint(); }
  });
  rail.addEventListener('pointerup', () => { pointer = null; rail.classList.remove('is-dragging'); });
  rail.addEventListener('pointercancel', () => { pointer = null; rail.classList.remove('is-dragging'); });

  cards.forEach(card => card.addEventListener('click', event => {
    if (moved) { event.preventDefault(); moved = false; return; }
    const selected = !card.classList.contains('is-selected');
    cards.forEach(item => { item.classList.remove('is-selected'); item.setAttribute('aria-pressed', 'false'); });
    card.classList.toggle('is-selected', selected);
    card.setAttribute('aria-pressed', String(selected));
  }));

  addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(syncFromDocument);
  }, { passive:true });
  addEventListener('resize', syncFromDocument);
  requestAnimationFrame(() => { syncFromDocument(); paint(); });
})();
