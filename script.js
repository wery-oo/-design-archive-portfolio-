const panel = document.querySelector('.archive-panel');
const closeButton = document.querySelector('.panel-close');
const menuButton = document.querySelector('.menu-button');
const mobileNav = document.querySelector('.mobile-nav');
const stage = document.querySelector('.archive-stage');
const composition = document.querySelector('.xray-composition');
const objects = [...document.querySelectorAll('.bag-object')];
const heroBag = document.querySelector('.xray-suitcase');
const monitorBox = document.querySelector('.monitor-box');
const asciiTitle = document.querySelector('.ascii-title');
let physicsBodies = [];
let draggedBody = null;
let selectedBody = null;

function buildAsciiTitle(word) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const font = '600 220px Arial, Helvetica, sans-serif';
  context.font = font;
  const metrics = context.measureText(word);
  const ascent = Math.ceil(metrics.actualBoundingBoxAscent);
  const descent = Math.ceil(metrics.actualBoundingBoxDescent);
  canvas.width = Math.ceil(metrics.width) + 8;
  canvas.height = ascent + descent + 4;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#000';
  context.font = font;
  context.textBaseline = 'alphabetic';
  context.fillText(word, 4, ascent + 2);

  const rows = 28;
  const columns = 232;
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const cellWidth = canvas.width / columns;
  const cellHeight = canvas.height / rows;
  const ink = ['X', 'X', 'x', 'X', 'x'];
  const lines = [];

  for (let row = 0; row < rows; row += 1) {
    let line = '';
    for (let column = 0; column < columns; column += 1) {
      const startX = Math.floor(column * cellWidth);
      const endX = Math.max(startX + 1, Math.floor((column + 1) * cellWidth));
      const startY = Math.floor(row * cellHeight);
      const endY = Math.max(startY + 1, Math.floor((row + 1) * cellHeight));
      let alpha = 0;
      let samples = 0;
      for (let y = startY; y < endY; y += 2) {
        for (let x = startX; x < endX; x += 2) {
          alpha += pixels[(y * canvas.width + x) * 4 + 3];
          samples += 1;
        }
      }
      const density = samples ? alpha / samples : 0;
      // Strong interior strokes, lighter boundary cells keep the silhouette legible.
      line += density > 155 ? ink[(row * 11 + column * 5) % ink.length]
        : density > 85 ? '+' : density > 45 ? '=' : density > 22 ? '-' : ' ';
    }
    lines.push(line);
  }
  return lines.join('\n');
}

const resolvedTitleWord = 'PORTFOLIO';
const resolvedAsciiTitle = buildAsciiTitle(resolvedTitleWord);
if (asciiTitle) asciiTitle.textContent = resolvedAsciiTitle;

function fitAsciiTitle() {
  if (!asciiTitle) return;
  const width = Math.min(window.innerWidth * (window.innerWidth <= 600 ? .9 : .73), 1120);
  const measure = document.createElement('canvas').getContext('2d');
  measure.font = '600 100px "Courier New", monospace';
  const cellWidth = measure.measureText('X').width / 100 + .035;
  asciiTitle.style.fontSize = `${width / (232 * cellWidth)}px`;
}
fitAsciiTitle();
window.addEventListener('resize', fitAsciiTitle);

let titleGlitchTimer;
function glitchAsciiTitle() {
  if (!asciiTitle || reducedMotion.matches) return;
  window.clearInterval(titleGlitchTimer);
  asciiTitle.classList.add('is-glitching');
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let frame = 0;
  titleGlitchTimer = window.setInterval(() => {
    const progress = frame / 15;
    const changingWord = [...resolvedTitleWord].map((character, index) => {
      const restored = ((index * 13 + frame * 7) % 17) / 17 < progress;
      if (restored) return character;
      return letters[Math.floor(Math.random() * letters.length)];
    }).join('');
    asciiTitle.textContent = buildAsciiTitle(changingWord);
    frame += 1;
    if (frame > 15) {
      window.clearInterval(titleGlitchTimer);
      asciiTitle.textContent = resolvedAsciiTitle;
      asciiTitle.classList.remove('is-glitching');
    }
  }, 52);
}

asciiTitle?.addEventListener('pointerenter', glitchAsciiTitle);
asciiTitle?.addEventListener('click', glitchAsciiTitle);

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
    if (button.dataset.panel === 'contact') {
      mobileNav.hidden = true;
      menuButton.setAttribute('aria-expanded', 'false');
      window.openContactPlayground?.();
      return;
    }
    if (['work', 'resume'].includes(button.dataset.panel) && !button.closest('.archive-panel')) {
      mobileNav.hidden = true;
      menuButton.setAttribute('aria-expanded', 'false');
      window.location.href = button.dataset.panel === 'resume' ? './resume.html' : './works.html';
      return;
    }
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

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function physicsBounds() {
  const width = composition.clientWidth;
  const height = composition.clientHeight;
  return {
    left: width * 0.16,
    right: width * 0.88,
    top: height * 0.4,
    floor: height * 0.87,
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function paintBody(body) {
  body.el.style.left = `${body.x}px`;
  body.el.style.top = `${body.y}px`;
  body.el.style.zIndex = body.dragging ? '7' : '2';
  body.el.style.setProperty('--inertia-angle', `${body.angle || 0}deg`);
}

function selectBody(body) {
  const changed = selectedBody !== body;
  objects.forEach(object => window.animateObjectLift?.(object, object === body.el));
  window.animateObjectLift?.(monitorBox, true);
  objects.forEach(object => object.classList.toggle('is-tracked', object === body.el));
  selectedBody = body;
  monitorBox.dataset.label = body.el.dataset.label;
  if (!monitorBox.querySelector('.scan-name')) {
    const name = document.createElement('span');
    name.className = 'scan-name';
    monitorBox.append(name);
  }
  const name = monitorBox.querySelector('.scan-name');
  if (changed) window.decodeObjectName(name, body.el.dataset.label);
  const scanColors = {
    'object-notebook': '#ff2fa2',
    'object-id': '#19e873',
    'object-muzzle': '#ff7a18',
    'object-phone': '#7657ff',
    'object-powerbank': '#ff2f92',
  };
  const colorClass = Object.keys(scanColors).find((className) => body.el.classList.contains(className));
  monitorBox.style.setProperty('--scan-color', scanColors[colorClass] || '#0bbcff');
  monitorBox.classList.add('is-visible');
  updateMonitor();
}

function clearSelection() {
  objects.forEach(object => window.animateObjectLift?.(object, false));
  window.animateObjectLift?.(monitorBox, false);
  const name = monitorBox.querySelector('.scan-name');
  if (name && selectedBody) window.decodeObjectName(name, selectedBody.el.dataset.label, false);
  objects.forEach(object => object.classList.remove('is-tracked'));
  selectedBody = null;
  monitorBox.classList.remove('is-visible');
}

function updateMonitor() {
  if (!selectedBody) return;
  const { el, x, y, index } = selectedBody;
  const pad = 7;
  monitorBox.style.left = `${x - pad}px`;
  monitorBox.style.top = `${y - pad}px`;
  monitorBox.style.width = `${el.offsetWidth + pad * 2}px`;
  monitorBox.style.height = `${el.offsetHeight + pad * 2}px`;
  monitorBox.dataset.meta = `TRACK 0${index + 1} / X ${Math.round(x)} Y ${Math.round(y)}`;
}

function constrainBody(body, bounds) {
  const width = body.el.offsetWidth;
  const height = body.el.offsetHeight;

  if (body.x < bounds.left) {
    body.x = bounds.left;
    body.vx = Math.abs(body.vx) * 0.28;
  }
  if (body.x + width > bounds.right) {
    body.x = bounds.right - width;
    body.vx = -Math.abs(body.vx) * 0.28;
  }
  if (body.y < 0) {
    body.y = 0;
    body.vy = Math.max(body.vy, 0);
  }
  if (body.y + height > bounds.floor) {
    body.y = bounds.floor - height;
    if (body.vy > 0) body.vy *= -0.18;
    if (Math.abs(body.vy) < 32) body.vy = 0;
  }
}

function resolveObjectCollisions(bounds) {
  for (let pass = 0; pass < 3; pass += 1) {
    for (let i = 0; i < physicsBodies.length; i += 1) {
      for (let j = i + 1; j < physicsBodies.length; j += 1) {
        const a = physicsBodies[i];
        const b = physicsBodies[j];
        if (!a.active || !b.active || a.dragging || b.dragging) continue;

        const aw = a.el.offsetWidth;
        const ah = a.el.offsetHeight;
        const bw = b.el.offsetWidth;
        const bh = b.el.offsetHeight;
        const overlapX = Math.min(a.x + aw, b.x + bw) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + ah, b.y + bh) - Math.max(a.y, b.y);
        if (overlapX <= 0 || overlapY <= 0) continue;

        const aCenterY = a.y + ah / 2;
        const bCenterY = b.y + bh / 2;
        if (overlapY <= overlapX * 1.3) {
          if (aCenterY < bCenterY) {
            a.y -= overlapY * 0.72;
            b.y += overlapY * 0.28;
          } else {
            b.y -= overlapY * 0.72;
            a.y += overlapY * 0.28;
          }
          const sharedVelocity = Math.min(a.vy, b.vy, 0);
          a.vy = sharedVelocity;
          b.vy = sharedVelocity;
        } else {
          const direction = (a.x + aw / 2) < (b.x + bw / 2) ? -1 : 1;
          a.x += direction * overlapX * 0.52;
          b.x -= direction * overlapX * 0.48;
          a.vx *= -0.18;
          b.vx *= -0.18;
        }
        constrainBody(a, bounds);
        constrainBody(b, bounds);
      }
    }
  }
}

let lastPhysicsFrame = performance.now();
let conveyorStartedAt = 0;
let previousBeltVelocity = 0;
let conveyorDistance = 0;
let bagPosition = 0;
let bagVelocity = 0;
let bagLean = 0;
let bagLeanVelocity = 0;
const rollerCanvas = document.querySelector('.conveyor-rollers');
const rollerContext = rollerCanvas?.getContext('2d');
let rollerWidth = 0;

function paintRollers(distance) {
  if (!rollerContext) return;
  const width = rollerCanvas.clientWidth;
  if (!width) return;
  if (rollerWidth !== width) {
    rollerWidth = width;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    rollerCanvas.width = Math.round(width * dpr);
    rollerCanvas.height = Math.round(width * 724 / 2172 * dpr);
    rollerContext.setTransform(dpr * width / 2172, 0, 0, dpr * width / 2172, 0, 0);
  }
  const ctx = rollerContext;
  ctx.clearRect(0, 0, 2172, 724);
  const source = document.querySelector('.conveyor-belt');
  const wheelPhase = distance / (width / 2172 * 43);
  if (source.complete && source.naturalWidth) {
    for (const cx of [88, 2085]) {
      ctx.save();
      ctx.translate(cx, 428);
      ctx.beginPath(); ctx.arc(0, 0, 42, 0, Math.PI * 2); ctx.clip();
      ctx.rotate(wheelPhase);
      ctx.drawImage(source, cx - 43, 385, 86, 86, -43, -43, 86, 86);
      // Three restrained dark tread marks make rotation readable on silver metal.
      for (let spoke = 0; spoke < 3; spoke++) {
        ctx.rotate(Math.PI * 2 / 3);
        ctx.strokeStyle = 'rgba(57,63,67,.52)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(28, 0); ctx.lineTo(38, 0); ctx.stroke();
      }
      ctx.restore();
    }
  }
  // Surface marks revolve around fixed roller axes; the frame never shakes.
  for (let i = 0; i < 21; i += 1) {
    const center = 88 + i * 99;
    for (let mark = 0; mark < 3; mark += 1) {
      const phase = distance / (width / 2172 * 19) + mark * Math.PI * 2 / 3;
      const face = Math.sin(phase);
      if (face <= 0) continue;
      const offset = Math.cos(phase) * 16;
      ctx.strokeStyle = `rgba(76,85,91,${face * .35})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(center + offset + 17, 328);
      ctx.bezierCurveTo(center + offset + 12, 333, center + offset - 10, 350, center + offset - 19, 355);
      ctx.stroke();
    }
  }
}

function updateConveyor(time, dt) {
  const elapsed = Math.max(0, (time - conveyorStartedAt) / 1000);
  const ramp = .42, cruise = 1.1, brake = .56;
  const duration = ramp + cruise + brake;
  const speed = conveyorDistance / (cruise + (ramp + brake) / 2);
  let travelled;
  if (elapsed < ramp) {
    const u = elapsed / ramp;
    travelled = speed * ramp * (u ** 3 - .5 * u ** 4);
  } else if (elapsed < ramp + cruise) {
    travelled = speed * (ramp / 2 + elapsed - ramp);
  } else if (elapsed < duration) {
    const u = (elapsed - ramp - cruise) / brake;
    travelled = speed * (ramp / 2 + cruise + brake * (u - u ** 3 + .5 * u ** 4));
  } else travelled = conveyorDistance;
  const travel = clamp(travelled / conveyorDistance, 0, 1);
  const target = conveyorDistance - travelled;
  // A real load follows the belt through a damped spring, overshoots at braking,
  // then settles at the original position without lifting off its contact plane.
  bagVelocity += ((target - bagPosition) * 80 - bagVelocity * 8.5) * dt;
  bagPosition += bagVelocity * dt;
  const bagAcceleration = dt > 0 ? (bagVelocity - previousBeltVelocity) / dt : 0;
  bagLeanVelocity += (-bagAcceleration * .012 - bagLean * 90 - bagLeanVelocity * 11) * dt;
  bagLean = clamp(bagLean + bagLeanVelocity * dt, -3.2, 3.2);
  if (elapsed > duration + 1.4 && Math.abs(bagPosition) < .25 && Math.abs(bagVelocity) < 1) {
    bagPosition = 0; bagVelocity = 0; bagLean = 0;
    stage.classList.remove('is-conveying');
  }
  composition.style.setProperty('--arrival-x', `${bagPosition}px`);
  composition.style.setProperty('--load-lean', `${bagLean}deg`);
  paintRollers(-conveyorDistance * travel);
  return bagVelocity;
}

function stepPhysics(time) {
  if (!physicsBodies.length) return;
  const dt = Math.min((time - lastPhysicsFrame) / 1000, 0.032);
  lastPhysicsFrame = time;
  const bounds = physicsBounds();
  const gravity = reducedMotion.matches ? 2400 : 1180;
  const beltVelocity = reducedMotion.matches ? 0 : updateConveyor(time, dt);
  if (reducedMotion.matches) {
    composition.style.setProperty('--arrival-x', '0px');
    composition.style.setProperty('--load-lean', '0deg');
    paintRollers(0);
  }
  const acceleration = dt > 0 ? clamp((beltVelocity - previousBeltVelocity) / dt, -2200, 2200) : 0;
  previousBeltVelocity = beltVelocity;

  physicsBodies.forEach((body) => {
    if (!body.active && time >= body.releaseAt) {
      body.active = true;
      body.el.style.opacity = '1';
    }
    if (!body.active || body.dragging) return;
    body.vx -= acceleration * dt * body.inertia * .6;
    body.angularVelocity += (-acceleration * .045 * body.inertia - body.angle * 35 - body.angularVelocity * 5.5) * dt;
    body.angle = clamp(body.angle + body.angularVelocity * dt, -13, 13);
    body.vy += gravity * dt;
    body.x += body.vx * dt;
    body.y += body.vy * dt;
    body.vx *= Math.exp(-1.2 * dt);
    if (body.y + body.el.offsetHeight >= bounds.floor - 1) {
      body.vx = Math.sign(body.vx) * Math.max(0, Math.abs(body.vx) - 95 * dt);
    }
    constrainBody(body, bounds);
  });

  resolveObjectCollisions(bounds);
  physicsBodies.forEach(paintBody);
  updateMonitor();
  requestAnimationFrame(stepPhysics);
}

function releaseBody(body, pointerId) {
  if (!body || !body.dragging) return;
  body.dragging = false;
  body.el.classList.remove('is-dragging');
  if (body.el.hasPointerCapture(pointerId)) body.el.releasePointerCapture(pointerId);
  draggedBody = null;
  requestAnimationFrame(() => {
    if (!body.el.matches(':hover, :focus-visible')) clearSelection();
  });
}

function bindBodyInteractions(body) {
  const { el } = body;

  el.addEventListener('pointerenter', () => selectBody(body));
  el.addEventListener('pointerleave', () => {
    if (!body.dragging && selectedBody === body) clearSelection();
  });

  el.addEventListener('pointerdown', (event) => {
    const bounds = composition.getBoundingClientRect();
    body.dragging = true;
    body.active = true;
    body.vx = 0;
    body.vy = 0;
    body.grabX = event.clientX - bounds.left - body.x;
    body.grabY = event.clientY - bounds.top - body.y;
    body.lastPointerX = event.clientX;
    body.lastPointerY = event.clientY;
    body.lastPointerTime = event.timeStamp;
    draggedBody = body;
    el.classList.add('is-dragging');
    el.setPointerCapture(event.pointerId);
    selectBody(body);
    event.preventDefault();
  });

  el.addEventListener('pointermove', (event) => {
    if (!body.dragging) return;
    const boundsRect = composition.getBoundingClientRect();
    const bounds = physicsBounds();
    const elapsed = Math.max(event.timeStamp - body.lastPointerTime, 16);
    body.x = clamp(event.clientX - boundsRect.left - body.grabX, bounds.left, bounds.right - el.offsetWidth);
    body.y = clamp(event.clientY - boundsRect.top - body.grabY, 0, bounds.floor - el.offsetHeight);
    body.vx = ((event.clientX - body.lastPointerX) / elapsed) * 1000;
    body.vy = ((event.clientY - body.lastPointerY) / elapsed) * 1000;
    body.lastPointerX = event.clientX;
    body.lastPointerY = event.clientY;
    body.lastPointerTime = event.timeStamp;
    paintBody(body);
    updateMonitor();
  });

  el.addEventListener('pointerup', (event) => releaseBody(body, event.pointerId));
  el.addEventListener('pointercancel', (event) => releaseBody(body, event.pointerId));
  el.addEventListener('focus', () => selectBody(body));
  el.addEventListener('blur', () => {
    if (!body.dragging && selectedBody === body) clearSelection();
  });
  el.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      selectBody(body);
      event.preventDefault();
    }
  });
}

function initializePhysics() {
  if (!composition || physicsBodies.length) return;
  const bounds = physicsBounds();
  const now = performance.now();
  conveyorStartedAt = now;
  conveyorDistance = Math.max(composition.clientWidth * .8, window.innerWidth - stage.getBoundingClientRect().left + 40);
  previousBeltVelocity = 0;
  bagPosition = conveyorDistance;
  bagVelocity = 0;
  bagLean = 0;
  bagLeanVelocity = 0;
  stage.classList.toggle('is-conveying', !reducedMotion.matches);
  composition.classList.add('is-loaded');
  composition.style.setProperty('--arrival-x', reducedMotion.matches ? '0px' : `${conveyorDistance}px`);

  physicsBodies = objects.map((el, index) => {
    const startX = el.offsetLeft;
    const startY = el.offsetTop;
    const body = {
      el,
      index,
      x: startX,
      y: Math.min(startY, bounds.floor - el.offsetHeight),
      vx: 0,
      vy: 0,
      active: true,
      angle: 0,
      angularVelocity: 0,
      inertia: [.8, 1.15, .95, 1.3, 1.1][index],
      dragging: false,
      releaseAt: now + index * 115,
    };
    el.style.opacity = body.active ? '1' : '0';
    paintBody(body);
    bindBodyInteractions(body);
    return body;
  });

  lastPhysicsFrame = performance.now();
  requestAnimationFrame(stepPhysics);
}

composition.addEventListener('pointerdown', (event) => {
  if (event.target === composition) clearSelection();
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !panel.open) clearSelection();
});

let previousCompositionSize = { width: 0, height: 0 };
const compositionObserver = new ResizeObserver(([entry]) => {
  const { width, height } = entry.contentRect;
  if (previousCompositionSize.width && physicsBodies.length) {
    const scaleX = width / previousCompositionSize.width;
    const scaleY = height / previousCompositionSize.height;
    physicsBodies.forEach((body) => {
      body.x *= scaleX;
      body.y *= scaleY;
      paintBody(body);
    });
  }
  previousCompositionSize = { width, height };
});
compositionObserver.observe(composition);

if (document.readyState === 'complete') initializePhysics();
else window.addEventListener('load', initializePhysics, { once: true });

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
if (initialView === 'work' || initialView === 'resume') window.location.replace(initialView === 'resume' ? './resume.html' : './works.html');
else if (initialView === 'contact') window.openContactPlayground?.();

const profileSection = document.querySelector('.profile-scanner');
const profileCopy = document.querySelector('.profile-copy');
const profileProgress = document.querySelector('[data-profile-progress]');
const profileScanCode = document.querySelector('[data-scan-code]');
const profileLiveTime = document.querySelector('.figure-head span:last-child');
const biographyBody = document.querySelector('.profile-copy-body');
function measureBiography() {
  if (!biographyBody || !profileSection) return;
  profileSection.style.removeProperty('height');
  updateProfileProgress();
}

function updateProfileProgress() {
  if (!profileCopy) return;
  const available = Math.max(profileCopy.scrollHeight - profileCopy.clientHeight, 1);
  const travelled = profileCopy.scrollTop;
  const progress = Math.round(clamp(travelled / available, 0, 1) * 100);
  if (profileProgress) profileProgress.textContent = String(progress).padStart(3, '0');
  const sectionTop = profileSection.getBoundingClientRect().top;
  const entrance = clamp(1 - sectionTop / (window.innerHeight * .9), 0, 1);
  profileSection.style.setProperty('--profile-entry', String(entrance));
  profileSection.style.setProperty('--figure-reveal', String(clamp(entrance * 1.4, 0, 1)));
  profileSection.style.setProperty('--chapter-entry', String(entrance));
  profileSection.style.setProperty('--chapter-exit', String(clamp(-sectionTop / (window.innerHeight * .8), 0, 1)));
}

let profileScrollFrame = 0;
window.addEventListener('scroll', () => {
  if (profileScrollFrame) return;
  profileScrollFrame = requestAnimationFrame(() => {
    updateProfileProgress();
    profileScrollFrame = 0;
  });
}, { passive: true });
window.addEventListener('resize', measureBiography);
profileCopy?.addEventListener('scroll', updateProfileProgress, { passive: true });
if (biographyBody) new ResizeObserver(measureBiography).observe(biographyBody);
measureBiography();
updateProfileProgress();

let profileVisible = false;
const profileObserver = new IntersectionObserver(([entry]) => {
  profileVisible = entry.isIntersecting;
  profileSection?.classList.toggle('is-scanning', profileVisible);
}, { threshold: 0 });
if (profileSection) profileObserver.observe(profileSection);

const scanAlphabet = 'Xx+=-01/';
function refreshProfileTelemetry() {
  if (profileLiveTime) {
    const elapsed = Math.max(0, Math.floor(performance.now() / 1000));
    const hours = String(Math.floor(elapsed / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
    const seconds = String(elapsed % 60).padStart(2, '0');
    profileLiveTime.textContent = `LIVE / ${hours}:${minutes}:${seconds}`;
  }
  if (!profileVisible || reducedMotion.matches || !profileScanCode) return;
  profileScanCode.textContent = Array.from({ length: 10 }, (_, index) => (
    index === 2 || index === 7 ? '/' : scanAlphabet[Math.floor(Math.random() * scanAlphabet.length)]
  )).join('');
}
refreshProfileTelemetry();
setInterval(refreshProfileTelemetry, 760);
