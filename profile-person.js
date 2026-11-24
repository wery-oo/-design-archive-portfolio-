import * as THREE from 'three';
import { GLTFLoader } from './model-study/vendor/loaders/GLTFLoader.js';
import portraitModelUrl from './typographic-study/model/mia.glb';

const canvas = document.querySelector('.profile-person-canvas');
const section = document.querySelector('.profile-scanner');

if (canvas && section) {
  const context = canvas.getContext('2d', { alpha: true });
  const sourceCanvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({
    canvas: sourceCanvas,
    alpha: true,
    antialias: true,
    premultipliedAlpha: true,
    preserveDrawingBuffer: true
  });
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const sampleCanvas = document.createElement('canvas');
  const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });
  const gapCanvas = document.createElement('canvas');
  const gapContext = gapCanvas.getContext('2d');
  let gapPixels;
  let gapStrength;

  function paintGaps(pixels, columns, rows, width, height) {
    const maskWidth = columns * 2 - 1;
    const maskHeight = rows * 2 - 1;
    if (!gapPixels || gapPixels.width !== maskWidth || gapPixels.height !== maskHeight) {
      gapCanvas.width = maskWidth;
      gapCanvas.height = maskHeight;
      gapPixels = gapContext.createImageData(maskWidth, maskHeight);
      gapStrength = new Float32Array(columns * rows);
    }

    for (let sample = 0; sample < gapStrength.length; sample += 1) {
      const index = sample * 4;
      const coverage = Math.max(0, Math.min(1, (pixels[index + 3] - 184) / 65));
      const luminance = pixels[index] * .2126 + pixels[index + 1] * .7152 + pixels[index + 2] * .0722;
      const shade = Math.max(0, Math.min(1, (luminance - 72) / 120));
      gapStrength[sample] = coverage * shade;
    }

    const mask = gapPixels.data;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const sample = row * columns + column;
        const maskAlpha = (row * 2 * maskWidth + column * 2) * 4 + 3;
        const current = gapStrength[sample];
        const hasRight = column + 1 < columns;
        const hasBelow = row + 1 < rows;
        const right = hasRight ? gapStrength[sample + 1] : 0;
        const below = hasBelow ? gapStrength[sample + columns] : 0;

        // Keep symbol centers transparent in this layer and shade only the gaps.
        if (hasRight) mask[maskAlpha + 4] = Math.round(92 * Math.min(current, right));
        if (hasBelow) mask[maskAlpha + maskWidth * 4] = Math.round(84 * Math.min(current, below));
        if (hasRight && hasBelow) {
          const diagonal = gapStrength[sample + columns + 1];
          mask[maskAlpha + (maskWidth + 1) * 4] = Math.round(72 * Math.min(current, right, below, diagonal));
        }
      }
    }

    gapContext.putImageData(gapPixels, 0, 0);
    const insetX = width / (columns * 4);
    const insetY = height / (rows * 4);
    context.drawImage(gapCanvas, insetX, insetY, width - insetX * 2, height - insetY * 2);
  }
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1.1, -1.1, .01, 20);
  camera.position.set(0, 0, 4);
  camera.lookAt(0, 0, 0);

  const turntable = new THREE.Group();
  const person = new THREE.Group();
  turntable.add(person);
  scene.add(turntable);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x2a211f, 1.3));
  const key = new THREE.DirectionalLight(0xffffff, 2.15);
  key.position.set(-2, 3, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xd9c4bc, .72);
  fill.position.set(3, 1, 2);
  scene.add(fill);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const symbols = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let ready = false;
  let visible = true;
  let paused = reduced.matches;
  reduced.addEventListener('change', () => { paused = reduced.matches; });
  let angle = 0;
  let previousTime = performance.now();
  let lastDraw = 0;

  new GLTFLoader().load(portraitModelUrl, gltf => {
    const meshes = [];
    gltf.scene.traverse(object => {
      if (!object.isMesh) return;
      object.visible = /^(Body|Hair|Skin_tee|Top_tee|Trousers)$/i.test(object.name);
      if (!object.visible) return;
      object.frustumCulled = false;
      meshes.push(object);
    });

    const idle = gltf.animations.find(clip => clip.name === 'Idle');
    if (idle) {
      const mixer = new THREE.AnimationMixer(gltf.scene);
      mixer.clipAction(idle).play();
      mixer.setTime(.12);
    }

    person.add(gltf.scene);
    gltf.scene.updateMatrixWorld(true);
    const bounds = new THREE.Box3();
    meshes.forEach(mesh => bounds.expandByObject(mesh));
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 3.6 / size.y;
    person.scale.setScalar(scale);
    person.position.set(-center.x * scale, -center.y * scale - 1, -center.z * scale);
    ready = true;
  }, undefined, error => console.error('Portrait model failed to load', error));

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const pointer = { x: -1000, y: -1000 };
  canvas.addEventListener('pointermove', event => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) * canvas.clientWidth / rect.width;
    pointer.y = (event.clientY - rect.top) * canvas.clientHeight / rect.height;
  });
  canvas.addEventListener('pointerleave', () => { pointer.x = -1000; pointer.y = -1000; });
  function displace(x, y, column, row, width, height, time, melt) {
    const fold = Number(section.dataset.fold || 0);
    const distance = Math.hypot(x - pointer.x, y - pointer.y);
    const push = reduced.matches ? 0 : Math.max(0, 1 - distance / 80) * 6 * (1 - fold);
    const direction = Math.atan2(y - pointer.y, x - pointer.x);
    // Adjacent samples move together, keeping the head and shoulders connected.
    const flow = Math.sin(row * .11 + column * .04);
    return [
      x - (.6 + .4 * flow) * width * melt * .08 + Math.cos(direction) * push,
      y + (y / height) ** 2 * height * melt * .09 + Math.sin(direction) * push
    ];
  }

  const draw = time => {
    const width = Math.min(1200, canvas.clientWidth);
    const height = Math.min(1200, canvas.clientHeight);
    if (!width || !height) return;
    const cell = width < 430 ? 10 : 13;
    const columns = Math.min(160, Math.max(32, Math.floor(width / cell)));
    const rows = Math.min(200, Math.max(48, Math.floor(height / cell)));

    if (sampleCanvas.width !== columns || sampleCanvas.height !== rows) {
      sampleCanvas.width = columns;
      sampleCanvas.height = rows;
      renderer.setSize(Math.max(300, columns * 3), Math.max(480, rows * 3), false);
      const halfHeight = 1.1;
      const halfWidth = halfHeight * sourceCanvas.width / sourceCanvas.height;
      camera.left = -halfWidth;
      camera.right = halfWidth;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
    }

    renderer.render(scene, camera);
    sampleContext.clearRect(0, 0, columns, rows);
    sampleContext.filter = 'grayscale(.22) brightness(.7) contrast(1.34)';
    sampleContext.drawImage(sourceCanvas, 0, 0, columns, rows);
    sampleContext.filter = 'none';
    const pixels = sampleContext.getImageData(0, 0, columns, rows).data;
    context.clearRect(0, 0, width, height);
    const melt = reduced.matches ? 0 : Number(section.dataset.melt || 0);
      context.globalAlpha = 1 - melt;
      paintGaps(pixels, columns, rows, width, height);
      context.globalAlpha = 1;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    const phase = Math.floor(time / 180);
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const index = (row * columns + column) * 4;
        const alpha = pixels[index + 3] / 255;
        if (alpha < .035) continue;
        const luminance = pixels[index] * .2126 + pixels[index + 1] * .7152 + pixels[index + 2] * .0722;
        const normalized = Math.min(1, Math.max(luminance / 185, alpha * .34));
        const level = Math.min(1, normalized * .9);
        const leftAlpha = column ? pixels[index - 1] / 255 : alpha;
        const aboveAlpha = row ? pixels[index - columns * 4 + 3] / 255 : alpha;
        const edge = Math.max(Math.abs(alpha - leftAlpha), Math.abs(alpha - aboveAlpha)) * 255;
        const homeX = (column + .5) * width / columns;
        const homeY = (row + .5) * height / rows;
        const [x, y] = displace(homeX, homeY, column, row, width, height, time, melt * Math.min(1, edge / 100));
        const inkAlpha = (.38 + level * .6) * alpha;
        context.strokeStyle = `rgba(6,7,7,${inkAlpha})`;
        context.fillStyle = `rgba(6,7,7,${inkAlpha})`;
        const radius = Math.max(1.05, cell * (.07 + Math.pow(level, 1.3) * .5));

        if (edge > 22 || level > .43) {
          context.lineWidth = Math.max(1, cell * (.095 + level * .105));
          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          // Shades live inside the symbols; the model only provides sampling data.
          const interior = Math.max(0, Math.min(1, (alpha - .62) / .34));
          const tone = Math.max(0, Math.min(1, (level - .43) / .48));
          if (interior > 0 && tone > 0) {
            context.fillStyle = `rgba(6,7,7,${inkAlpha * interior * tone})`;
            context.fill();
          }
          context.stroke();
        } else {
          const base = Math.min(symbols.length - 1, Math.floor(level * symbols.length));
          const glyph = symbols[(base * 7 + column * 3 + row * 5 + phase) % symbols.length];
          context.font = `600 ${Math.max(5, cell * (.52 + normalized * .32))}px "Courier New",monospace`;
          context.lineWidth = .35;
          context.strokeText(glyph, x, y);
          context.fillText(glyph, x, y);
        }
      }
    }
  };

  const frame = time => {
    requestAnimationFrame(frame);
    const dt = Math.min((time - previousTime) / 1000, .05);
    previousTime = time;
    if (!paused && visible) angle += dt * Math.PI * 2 / 14;
    turntable.rotation.y = angle;
    if (!ready || !visible || time - lastDraw < 33) return;
    lastDraw = time;
    draw(angle * 14000 / (2 * Math.PI));
  };

  canvas.addEventListener('keydown', event => {
    if (event.key !== ' ') return;
    paused = !paused;
    event.preventDefault();
  });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  }, { rootMargin: '20% 0px', threshold: 0 }).observe(section);
  new ResizeObserver(resize).observe(canvas);
  resize();
  requestAnimationFrame(frame);
}
