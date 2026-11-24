const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
function openPanel(key) {
  const panel = document.querySelector('.archive-panel');
  panel.querySelectorAll('[data-view]').forEach(view => { view.hidden = view.dataset.view !== key; });
  if (!panel.open) panel.showModal();
}
document.querySelectorAll('[data-panel]').forEach(button => button.addEventListener('click', () => {
  const key = button.dataset.panel;
  if (key === 'contact') { window.openContactPlayground?.(); return; }
  location.href = key === 'resume' ? './resume.html' : './works.html';
}));
const menu = document.querySelector('.menu-button');
const mobile = document.querySelector('.mobile-nav');
menu.addEventListener('click', () => {
  mobile.hidden = !mobile.hidden;
  menu.setAttribute('aria-expanded', String(!mobile.hidden));
});
document.querySelector('.panel-close').addEventListener('click', () => document.querySelector('.archive-panel').close());
document.querySelectorAll('[data-close-panel]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault(); document.querySelector('.archive-panel').close();
}));
const copy = document.querySelector('.profile-copy');
copy?.addEventListener('scroll', () => {
  const progress = Math.round(copy.scrollTop / Math.max(1, copy.scrollHeight - copy.clientHeight) * 100);
  document.querySelector('[data-profile-progress]').textContent = String(progress).padStart(3, '0');
}, { passive: true });
