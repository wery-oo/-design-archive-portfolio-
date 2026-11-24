(() => {
  const story = document.querySelector('.resume-story');
  if (!story) return;

  const poster = story.querySelector('.resume-poster');
  const portrait = story.querySelector('.resume-portrait');
  const portraitCanvas = story.querySelector('.profile-person-canvas');
  const particleCanvas = story.querySelector('.resume-particle-canvas');
  const particleContext = particleCanvas?.getContext('2d');
  const status = story.querySelector('.resume-particle-status b');
  const greeting = story.querySelector('.resume-greeting');
  const greetingText = story.querySelector('.resume-greeting-text');
  const readingSection = story.querySelector('.resume-reading');
  if (!poster || !portrait || !portraitCanvas || !particleCanvas || !particleContext || !greeting || !greetingText || !readingSection) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finalGreeting = Array.from(greetingText.textContent);
  const symbols = 'Xx+=-01_';
  const sampleCanvas = document.createElement('canvas');
  const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });
  const particles = [];
  let particleWidth = 1;
  let particleHeight = 1;
  let assemblyStart = 0;
  let assemblyFrame = 0;
  let ready = false;
  let entering = false;
  let decodeTimer = 0;
  let passage;
  let assemblyTween;
  const motion = window.gsap;
  if (motion) story.classList.add('gsap-resume');

  greeting.inert = true;
  greeting.setAttribute('aria-disabled', 'true');
  readingSection.inert = true;
  story.dataset.phase = 'assembling';

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const seeded = value => {
    const noise = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
    return noise - Math.floor(noise);
  };
  const easeOutQuart = value => 1 - Math.pow(1 - value, 4);

  function resizeParticles() {
    const rect = particleCanvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    particleWidth = Math.max(1, rect.width);
    particleHeight = Math.max(1, rect.height);
    particleCanvas.width = Math.round(particleWidth * dpr);
    particleCanvas.height = Math.round(particleHeight * dpr);
    particleContext.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function capturePortrait() {
    if (!portraitCanvas.width || !portraitCanvas.height) return false;
    const columns = particleWidth < 480 ? 72 : 96;
    const rows = Math.round(columns * particleHeight / particleWidth);
    sampleCanvas.width = columns;
    sampleCanvas.height = rows;
    sampleContext.clearRect(0, 0, columns, rows);
    try {
      sampleContext.drawImage(portraitCanvas, 0, 0, columns, rows);
    } catch {
      return false;
    }
    const data = sampleContext.getImageData(0, 0, columns, rows).data;
    let visibleSamples = 0;
    for (let index = 3; index < data.length; index += 4) {
      if (data[index] > 28) visibleSamples += 1;
    }
    if (visibleSamples < 120) return false;

    particles.length = 0;
    const stride = particleWidth < 480 ? 2 : 1;
    for (let row = 0; row < rows; row += stride) {
      for (let column = 0; column < columns; column += stride) {
        const pixel = (row * columns + column) * 4;
        const alpha = data[pixel + 3] / 255;
        if (alpha < .12) continue;
        const id = row * columns + column;
        const seed = seeded(id + 1);
        const angle = seed * Math.PI * 2 + row * .035;
        const orbit = .58 + seeded(id + 29) * .48;
        particles.push({
          hx: 1 / 6 + (column + .5) / columns * 2 / 3,
          hy: 1 / 6 + (row + .5) / rows * 2 / 3,
          sx: .5 + Math.cos(angle) * orbit,
          sy: .5 + Math.sin(angle) * orbit * .72,
          angle,
          delay: seeded(id + 71) * .3,
          alpha: .38 + alpha * .62,
          size: 1.6 + seeded(id + 113) * 2.8
        });
      }
    }
    return particles.length > 100;
  }

  function drawParticles(progress, time) {
    particleContext.clearRect(0, 0, particleWidth, particleHeight);
    particleContext.fillStyle = '#080b0c';
    particleContext.strokeStyle = 'rgba(0,138,179,.2)';
    particleContext.lineWidth = .55;
    const centerX = particleWidth * .5;
    const centerY = particleHeight * .5;

    for (let index = 0; index < particles.length; index += 1) {
      const particle = particles[index];
      const local = clamp((progress - particle.delay) / (1 - particle.delay));
      const eased = easeOutQuart(local);
      const spiral = Math.sin(local * Math.PI) * (1 - local) * Math.min(particleWidth, particleHeight) * .12;
      const startX = particle.sx * particleWidth;
      const startY = particle.sy * particleHeight;
      const homeX = particle.hx * particleWidth;
      const homeY = particle.hy * particleHeight;
      const x = startX + (homeX - startX) * eased + Math.cos(particle.angle + local * 5.4) * spiral;
      const y = startY + (homeY - startY) * eased + Math.sin(particle.angle + local * 5.4) * spiral * .72;
      const pulse = 1 + Math.sin(time * .006 + index * .17) * .18 * (1 - local);
      particleContext.globalAlpha = particle.alpha * (.25 + local * .75);
      const size = particle.size * pulse;
      particleContext.fillRect(x - size * .5, y - size * .5, size, size);
      if (index % 41 === 0 && local > .12 && local < .88) {
        particleContext.beginPath();
        particleContext.moveTo(x, y);
        particleContext.lineTo(centerX + (homeX - centerX) * local, centerY + (homeY - centerY) * local);
        particleContext.stroke();
      }
    }
    particleContext.globalAlpha = 1;
  }

  function decodeGreeting() {
    window.clearInterval(decodeTimer);
    if (reduced.matches) {
      greetingText.textContent = finalGreeting.join('');
      return;
    }
    const started = performance.now();
    decodeTimer = window.setInterval(() => {
      const frame = Math.floor((performance.now() - started) / 34);
      const revealed = Math.floor(frame / 2);
      greetingText.textContent = finalGreeting.map((character, index) =>
        index < revealed || /[\s,’]/.test(character) ? character : symbols[(frame + index * 3) % symbols.length]
      ).join('');
      if (revealed >= finalGreeting.length) window.clearInterval(decodeTimer);
    }, 34);
  }

  function markReady() {
    if (ready) return;
    ready = true;
    story.dataset.phase = 'ready';
    story.classList.add('is-ready');
    story.style.setProperty('--assembly', '1');
    portraitCanvas.style.opacity = '1';
    greeting.inert = false;
    greeting.removeAttribute('aria-disabled');
    if (status) status.textContent = 'PORTRAIT LOCKED / CLICK TO OPEN';
    decodeGreeting();
    if (location.hash === '#resume-reading') enterReading(false);
  }

  function assemble(time) {
    if (!assemblyStart) assemblyStart = time;
    const progress = reduced.matches ? 1 : clamp((time - assemblyStart) / 3100);
    story.style.setProperty('--assembly', progress.toFixed(4));
    portraitCanvas.style.opacity = String(clamp((progress - .82) / .18));
    if (status) status.textContent = `ASSEMBLING / ${String(Math.round(progress * 100)).padStart(3, '0')}%`;
    drawParticles(progress, time);
    if (progress < 1) assemblyFrame = requestAnimationFrame(assemble);
    else markReady();
  }

  function waitForPortrait(started = performance.now()) {
    if (ready) return;
    if (capturePortrait()) {
      assemblyStart = 0;
      if (motion) {
        const state = { progress: 0 };
        assemblyTween = motion.to(state, {
          progress: 1, duration: reduced.matches ? 0 : 2.8, ease: 'power1.inOut',
          onUpdate: () => {
            const progress = state.progress;
            story.style.setProperty('--assembly', progress);
            portraitCanvas.style.opacity = String(clamp((progress - .72) / .28));
            particleCanvas.style.opacity = String(1 - clamp((progress - .8) / .2));
            drawParticles(progress, performance.now());
            if (status) status.textContent = `ASSEMBLING / ${String(Math.round(progress * 100)).padStart(3, '0')}%`;
          },
          onComplete: markReady
        });
      } else assemblyFrame = requestAnimationFrame(assemble);
      return;
    }
    if (performance.now() - started < 7000) {
      requestAnimationFrame(() => waitForPortrait(started));
      return;
    }
    markReady();
  }

  function enterReading(updateHistory = true) {
    if (!ready || entering) return;
    entering = true;
    const before = portrait.getBoundingClientRect();
    story.dataset.phase = 'reading';
    story.classList.add('is-reading');
    readingSection.inert = false;
    greeting.inert = true;
    if (updateHistory && location.hash !== '#resume-reading') history.pushState(null, '', '#resume-reading');
    if (motion) {
      passage?.kill();
      motion.set(portrait, { clearProps: 'transform' });
      const after = portrait.getBoundingClientRect();
      const content = [...readingSection.querySelectorAll('.resume-main > section,.resume-personal')];
      passage = motion.timeline({ onComplete: () => readingSection.focus({ preventScroll: true }) });
      passage.fromTo(portrait, {
        xPercent: -50,
        x: before.left + before.width / 2 - after.left - after.width / 2,
        y: before.top + before.height / 2 - after.top - after.height / 2,
        scaleX: before.width / after.width, scaleY: before.height / after.height,
        transformOrigin: '50% 50%'
      }, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: reduced.matches ? 0 : .9, ease: 'power3.inOut', clearProps: 'transform' }, 0);
      passage.fromTo(readingSection, { autoAlpha: 0, y: 24 }, {
        autoAlpha: 1, y: 0, duration: reduced.matches ? 0 : .6, ease: 'power3.out'
      }, reduced.matches ? 0 : .25);
      passage.fromTo(content, { opacity: 0, y: 18 }, {
        opacity: 1, y: 0, duration: reduced.matches ? 0 : .55,
        stagger: reduced.matches ? 0 : .075, ease: 'power3.out'
      }, reduced.matches ? 0 : .35);
    } else window.setTimeout(() => readingSection.focus({ preventScroll: true }), reduced.matches ? 0 : 720);
  }

  greeting.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    enterReading();
  });
  poster.addEventListener('click', event => {
    if (!ready || event.target.closest('.resume-greeting')) return;
    enterReading();
  });
  addEventListener('popstate', () => {
    if (location.hash === '#resume-reading') enterReading(false);
    else if (entering) {
      passage?.kill();
      entering = false;
      story.classList.remove('is-reading');
      story.dataset.phase = 'ready';
      readingSection.inert = true;
      greeting.inert = false;
      if (motion) motion.set([portrait, readingSection, ...readingSection.querySelectorAll('.resume-main > section,.resume-personal')], { clearProps: 'transform,opacity,visibility' });
    }
  });
  addEventListener('resize', resizeParticles);
  reduced.addEventListener('change', () => {
    if (reduced.matches && !ready) {
      cancelAnimationFrame(assemblyFrame);
      assemblyTween?.kill();
      markReady();
    }
  });

  resizeParticles();
  greetingText.textContent = symbols.slice(0, Math.min(symbols.length, finalGreeting.length)).padEnd(finalGreeting.length, '·');
  requestAnimationFrame(() => waitForPortrait());
})();
