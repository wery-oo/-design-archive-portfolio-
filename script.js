const panel = document.querySelector('.archive-panel');
const closeButton = document.querySelector('.panel-close');
const menuButton = document.querySelector('.menu-button');
const mobileNav = document.querySelector('.mobile-nav');
const stage = document.querySelector('.archive-stage');
const objects = [...document.querySelectorAll('.bag-object')];
const heroBag = document.querySelector('.xray-suitcase');

function openPanel(key) {
  const activeKey = key || 'work';
  document.querySelectorAll('[data-view]').forEach((view) => { view.hidden = view.dataset.view !== activeKey; });
  document.querySelectorAll('.panel-tabs [data-panel]').forEach((tab) => {
    const selected = tab.dataset.panel === activeKey;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  mobileNav.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  if (!panel.open) panel.showModal();
}

document.querySelectorAll('[data-panel]').forEach((button) => {
  button.addEventListener('click', () => {
    openPanel(button.dataset.panel);
    if (button.dataset.project) {
      panel.querySelector(`[data-preview="${button.dataset.project}"]`).focus();
    }
  });
});

closeButton.addEventListener('click', () => panel.close());
document.querySelectorAll('[data-close-panel]').forEach((link) => link.addEventListener('click', () => panel.close()));
panel.addEventListener('click', (event) => {
  if (event.target === panel) panel.close();
});

menuButton.addEventListener('click', () => {
  const nextOpen = mobileNav.hidden;
  mobileNav.hidden = !nextOpen;
  menuButton.setAttribute('aria-expanded', String(nextOpen));
});

const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function moveObjects(event) {
  if (!canHover.matches || reducedMotion.matches) return;
  const bounds = stage.getBoundingClientRect();
  const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
  const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
  objects.forEach((object) => {
    const depth = Number(object.dataset.depth || 0.5);
    object.style.setProperty('--mx', `${x * depth * 9}px`);
    object.style.setProperty('--my', `${y * depth * 7}px`);
  });
  if (heroBag) heroBag.style.transform = `translate(${x * 7}px, ${y * 5}px) rotate(${x * .35 - 1.2}deg)`;
}

function resetObjects() {
  objects.forEach((object) => {
    object.style.removeProperty('--mx');
    object.style.removeProperty('--my');
  });
  if (heroBag) heroBag.style.transform = '';
}

stage.addEventListener('pointermove', moveObjects);
stage.addEventListener('pointerleave', resetObjects);

document.querySelectorAll('.project-row').forEach((row) => {
  const activate = () => {
    document.querySelectorAll('.project-row').forEach((item) => item.classList.toggle('is-active', item === row));
    document.querySelectorAll('[data-art]').forEach((art) => art.classList.toggle('is-visible', art.dataset.art === row.dataset.preview));
  };
  row.addEventListener('pointerenter', activate);
  row.addEventListener('focus', activate);
});

function updateTime() {
  const target = document.querySelector('#local-time');
  if (target) target.textContent = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
}
updateTime();
setInterval(updateTime, 30000);

const initialView = new URLSearchParams(window.location.search).get('view');
if (['work', 'resume', 'contact'].includes(initialView)) openPanel(initialView);
