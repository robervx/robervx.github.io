// A hand-built 3D paper-folding "cootie catcher" experiment, adapted for the
// homepage hero. Ported from a personal CodePen; only the flavour text
// (FORTUNES) and colour tokens were retuned to match the site's palette —
// the folding geometry, materials and animation logic are untouched.
// Vendored locally (assets/vendor/three/three.module.js) instead of a CDN
// import, so the hero has no third-party runtime dependency at all.
import * as THREE from '../vendor/three/three.module.js';

const DEG = Math.PI / 180;
const HALF = Math.SQRT1_2;
const THICK = 0.007;
const GAP = 0.02;
const LIFT = 165 * DEG;
const OPEN = [58 * DEG, 45 * DEG];
const SHUT = [66 * DEG, 86 * DEG];
const SWAP = [66 * DEG, 4 * DEG];
const MOUTH = -0.6;
const LOOK = 0.55;
const W = 1024;
const PAPER = '#fbee9e';
const INK = '#2b2622';
const COLOURS = [
  { word: 'RED', ink: '#d23b27' },
  { word: 'BLUE', ink: '#2a8bc5' },
  { word: 'YELLOW', ink: '#eba314' },
  { word: 'GREEN', ink: '#4faa43' }
];
const VISIBLE = { shut: [2, 3, 6, 7], swap: [1, 4, 5, 8] };
const FORTUNES = [
  'Hoy toca abrir\nun notebook.', 'Un dato oculto\nte espera.', 'Esa hipótesis\nmerece un test.', 'La ciudad tiene\nmás señal de\nla que parece.',
  'Buen día para\nun modelo nuevo.', 'Revisa ese\noutlier.', 'La demanda de\nhoy será alta.', 'Confía en tus\ndashboards.',
  'Documenta ese\nhallazgo ya.', 'Python o R,\nhoy manda R.', 'Guarda ese\nscript.', 'Una patrulla\nmás no sobra.'
];
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const C = V(0, 0, 0);
const mod = (a, m) => (a % m + m) % m;
const rand = n => Math.floor(Math.random() * n);
const sleep = ms => new Promise(done => setTimeout(done, ms));
const ease = k => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const mix = (p, q, k) => p.map((v, i) => v + (q[i] - v) * k);
const normal = (a, b, c) => new THREE.Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a)).normalize();
const away = (n, from, other) => n.dot(other.clone().sub(from)) > 0 ? n.negate() : n;
const corners = flipped => flipped ? [[0, 1], [1, 0]] : [[1, 0], [0, 1]];
const numberOf = face => mod(1 - face, 8) + 1;
const faceOf = number => mod(2 - number, 8);

const heroSection = document.getElementById('cc-hero');
if (heroSection) {
  const stage = heroSection.querySelector('.stage');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  camera.up.set(0, 0, 1);

  const sun = new THREE.DirectionalLight(0xfff6e6, 2.4);
  sun.position.set(2.4, -1.6, 5.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.015;
  Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 14 });
  const fill = new THREE.DirectionalLight(0xe6ecff, 0.7);
  fill.position.set(-3.5, -2.5, 2);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.18 }));
  floor.receiveShadow = true;
  const spin = new THREE.Group();
  const model = new THREE.Group();
  spin.add(model);
  scene.add(new THREE.HemisphereLight(0xfffdf6, 0xd9d0bc, 2.3), sun, fill, floor, spin);

  function elevation(p, q){
    return Math.atan2(q, p) - Math.acos(Math.min(1, HALF / Math.hypot(p, q)));
  }
  function pose([beta, phi]){
    const cb = Math.cos(beta), sb = Math.sin(beta);
    const even = elevation(cb * Math.cos(phi), sb), odd = elevation(cb * Math.sin(phi), sb);
    const A = [0, 1, 2, 3].map(i => {
      const t = i * Math.PI / 2, e = i % 2 ? odd : even;
      return V(Math.cos(e) * Math.cos(t), Math.cos(e) * Math.sin(t), Math.sin(e));
    });
    const O = [phi, Math.PI - phi, Math.PI + phi, -phi].map(t => V(cb * Math.cos(t), cb * Math.sin(t), sb).multiplyScalar(Math.SQRT2));
    const K = A.map((a, i) => {
      const n = normal(a, O[i], A[(i + 1) % 4]);
      return n.multiplyScalar(2 * n.dot(a));
    });
    return { A, O, K };
  }

  function rng(seed){
    return () => {
      seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function grain(x, seed){
    const r = rng(seed);
    x.fillStyle = PAPER;
    x.fillRect(0, 0, W, W);
    for (let i = 0; i < 9000; i++){
      x.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(120,100,40,0.05)';
      x.fillRect(r() * W, r() * W, 1 + r() * 2, 1 + r() * 2);
    }
  }
  function sheet(seed){
    const c = document.createElement('canvas');
    c.width = c.height = W;
    const x = c.getContext('2d');
    grain(x, seed);
    return x;
  }
  function write(x, text, [u, v], [du, dv], size, color, weight, fit = Infinity){
    const font = px => `${weight} ${px}px Caveat, "Segoe Print", cursive`;
    x.save();
    x.translate(u * W, (1 - v) * W);
    x.rotate(Math.atan2(du, dv));
    x.font = font(size * W);
    const width = x.measureText(text).width;
    if (width > fit * W) x.font = font(size * W * fit * W / width);
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillStyle = color;
    x.fillText(text, 0, 0);
    x.restore();
  }
  function blot(x, [u, v], radius, color, seed){
    const r = rng(seed), n = 14;
    const cx = u * W, cy = (1 - v) * W, size = radius * W;
    const pts = Array.from({ length: n }, (_, i) => {
      const a = i / n * 2 * Math.PI, k = size * (1 + (r() - 0.5) * 0.22);
      return [cx + Math.cos(a) * k, cy + Math.sin(a) * k];
    });
    const mid = i => {
      const p = pts[i % n], q = pts[(i + 1) % n];
      return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    };
    x.beginPath();
    x.moveTo(...mid(0));
    for (let i = 1; i <= n; i++) x.quadraticCurveTo(...pts[i % n], ...mid(i));
    x.closePath();
    x.fillStyle = x.strokeStyle = color;
    x.globalAlpha = 0.9;
    x.fill();
    x.globalAlpha = 0.25;
    x.lineWidth = size * 0.12;
    x.stroke();
    x.globalAlpha = 1;
  }
  function material(x, side = THREE.DoubleSide){
    const map = new THREE.CanvasTexture(x.canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return new THREE.MeshStandardMaterial({ map, side, roughness: 0.93, metalness: 0, flatShading: true });
  }

  const faces = [];
  const flaps = [];
  function face(materials, uvs, place){
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(9), 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs.flat(), 2));
    for (const m of [].concat(materials)){
      const mesh = new THREE.Mesh(g, m);
      mesh.castShadow = mesh.receiveShadow = true;
      model.add(mesh);
    }
    faces.push({ g, place });
  }
  function build(){
    const ref = pose(OPEN);
    const back = material(sheet(98), THREE.BackSide);
    for (let i = 0; i < 4; i++){
      const a0 = i, a1 = (i + 1) % 4;
      const A0 = ref.A[a0], A1 = ref.A[a1], O = ref.O[i], K = ref.K[i];
      const inside = away(normal(C, A0, O), C, K);
      const outside = away(normal(K, A0, O), K, C);

      const numbers = sheet(10 + i);
      const [u0, u1] = corners(normal(C, A0, A1).dot(inside) < 0);
      const halves = [[a0, u0, 2 * i], [a1, u1, 2 * i + 1]];
      for (const [a, uv, n] of halves){
        write(numbers, String(numberOf(n)), [(uv[0] + 1) / 3, (uv[1] + 1) / 3], [HALF, HALF], 0.26, INK, 500);
        const under = sheet(60 + n);
        flaps[n] = {
          point: i, a, uv, under, seed: 60 + n, mat: material(under), open: 0,
          sign: Math.sign(normal(C, ref.A[a], O).dot(inside))
        };
        face(flaps[n].mat, [[0, 0], uv, [1, 1]], P => [C, P.A[a], P.O[i]]);
      }

      const front = material(numbers, THREE.FrontSide);
      for (const [a, uv, n] of halves){
        const flap = flaps[n];
        const tip = [1 - (uv[0] ? 0 : GAP), 1 - (uv[1] ? 0 : GAP)];
        const order = flap.sign > 0 ? [0, 1, 2] : [0, 2, 1];
        const uvs = [[0, 0], uv, tip];
        face([front, back], order.map(k => uvs[k]), P => {
          const pa = P.A[a], po = P.O[i];
          const n = normal(C, pa, po).multiplyScalar(flap.sign);
          const lift = n.clone().multiplyScalar(THICK);
          const pt = po.clone().add(pa.clone().sub(po).normalize().multiplyScalar(GAP));
          let pts = [C.clone(), pa.clone(), pt].map(v => v.add(lift));
          if (flap.open > 0){
            const axis = po.clone().sub(pa).normalize();
            const turn = axis.clone().cross(C.clone().sub(pa)).dot(n) > 0 ? 1 : -1;
            const q = new THREE.Quaternion().setFromAxisAngle(axis, turn * LIFT * flap.open);
            pts = pts.map(v => v.sub(pa).applyQuaternion(q).add(pa));
          }
          return order.map(k => pts[k]);
        });
      }

      const { word, ink } = COLOURS[i];
      const colour = sheet(20 + i);
      blot(colour, [0.57, 0.57], 0.15, ink, 40 + i);
      write(colour, word, [0.3, 0.3], [-HALF, -HALF], 0.17, ink, 700, 0.5);
      const mat = material(colour);
      const [v0, v1] = corners(normal(K, A0, A1).dot(outside) < 0);
      face(mat, [[0, 0], v0, [1, 1]], P => [P.K[i], P.A[a0], P.O[i]]);
      face(mat, [[0, 0], v1, [1, 1]], P => [P.K[i], P.A[a1], P.O[i]]);
    }
  }
  function shape(){
    const P = pose(params);
    let low = 0;
    for (const { g, place } of faces){
      const pos = g.attributes.position;
      place(P).forEach((v, k) => {
        pos.setXYZ(k, v.x, v.y, v.z);
        low = Math.min(low, v.z);
      });
      pos.needsUpdate = true;
      g.computeVertexNormals();
      g.computeBoundingSphere();
    }
    model.position.z = THICK * 2 - low;
  }
  function inscribe(flap, text = ''){
    grain(flap.under, flap.seed);
    const lines = text ? text.split('\n') : [];
    const [u, v] = flap.uv.map(c => c * 0.42 + 0.3);
    lines.forEach((line, k) => {
      const off = ((lines.length - 1) / 2 - k) * 0.11 * HALF;
      write(flap.under, line, [u + off, v + off], [HALF, HALF], 0.1, INK, 700, 0.46);
    });
    flap.mat.map.needsUpdate = true;
  }

  const view = { az: MOUTH, el: 0.82, dist: 4.6 };
  function orbit(){
    const canvas = renderer.domElement;
    let last = null;
    canvas.addEventListener('pointerdown', e => {
      last = e;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointerup', () => { last = null; });
    canvas.addEventListener('pointermove', e => {
      if (!last) return;
      view.az -= (e.clientX - last.clientX) * 0.006;
      view.el = Math.min(1.45, Math.max(0.12, view.el + (e.clientY - last.clientY) * 0.005));
      last = e;
    });
  }

  let params = OPEN;
  let closed = null;
  const tweens = [];
  function tween(ms, step){
    return new Promise(done => tweens.push({ start: performance.now(), ms: REDUCED ? 0 : ms, step, done }));
  }
  function advance(now){
    for (const t of [...tweens]){
      const k = t.ms ? Math.min(1, (now - t.start) / t.ms) : 1;
      t.step(ease(k));
      if (k === 1){
        tweens.splice(tweens.indexOf(t), 1);
        t.done();
      }
    }
  }
  function moveTo(to, ms){
    const from = params;
    return tween(ms, k => { params = mix(from, to, k); });
  }
  function openFlap(flap, to, ms){
    const from = flap.open;
    return tween(ms, k => { flap.open = from + (to - from) * k; });
  }
  function turnTo(az, ms){
    const from = view.az;
    return tween(ms, k => { view.az = from + (az - from) * k; });
  }
  const nearest = (az, period) => az + Math.round((view.az - az) / period) * period;
  const faceMouth = () => turnTo(nearest(closed === 'swap' ? MOUTH + Math.PI / 2 : MOUTH, Math.PI), 700);
  function faceFlap(flap){
    const P = pose(params);
    const n = normal(C, P.A[flap.a], P.O[flap.point]).multiplyScalar(flap.sign);
    return turnTo(nearest(Math.PI / 4 - Math.atan2(n.y, n.x), 2 * Math.PI), 800);
  }
  async function fold(){
    closed = closed === 'shut' ? 'swap' : 'shut';
    await moveTo(closed === 'shut' ? SHUT : SWAP, 350);
    await sleep(REDUCED ? 260 : 150);
  }

  const chart = heroSection.querySelector('.chart');
  const board = chart.querySelector('.board');
  const wires = board.querySelector('.wires');
  const tree = board.querySelector('.tree');
  const links = [];
  const show = el => requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
  const follow = () => chart.scrollTo({ top: chart.scrollHeight, behavior: REDUCED ? 'auto' : 'smooth' });
  function element(cls, html = ''){
    const el = document.createElement('div');
    el.className = cls;
    el.innerHTML = html;
    return el;
  }
  const row = () => tree.appendChild(element('row'));
  function wire(from, to, cls = ''){
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('pathLength', 1);
    path.setAttribute('class', `wire ${cls}`);
    wires.appendChild(path);
    links.push({ from, to, path });
    show(path);
    return path;
  }
  function node(html, from, cls = ''){
    const el = row().appendChild(element(`node ${cls}`, html));
    if (from) wire(from, el, 'on');
    show(el);
    follow();
    return el;
  }
  async function options(items, from){
    const line = row();
    const chips = [];
    for (const { label, dot } of items){
      const chip = line.appendChild(element('chip', dot ? `<i style="background:${dot}"></i>${label}` : label));
      chip.wire = wire(from, chip);
      chips.push(chip);
      show(chip);
      follow();
      await sleep(REDUCED ? 0 : 90);
    }
    return chips;
  }
  async function choose(chips, pick){
    if (!REDUCED){
      const steps = 9 + rand(4);
      for (let s = 0; s < steps; s++){
        const lit = mod(pick - steps + 1 + s, chips.length);
        chips.forEach((chip, k) => chip.classList.toggle('scan', k === lit));
        await sleep(60 + s * s * 2.2);
      }
    }
    chips.forEach((chip, k) => {
      const chosen = k === pick;
      chip.classList.remove('scan');
      chip.classList.add(chosen ? 'pick' : 'off');
      chip.wire.classList.add(chosen ? 'on' : 'off');
    });
    await sleep(REDUCED ? 200 : 350);
    return chips[pick];
  }
  async function foldThrough(el, labels){
    const pips = el.appendChild(element('pips', labels.map(t => `<b class="pip">${t}</b>`).join('')));
    follow();
    await sleep(REDUCED ? 150 : 300);
    for (const pip of pips.children){
      pip.classList.add('on');
      await fold();
    }
  }
  function drawWires(){
    const o = board.getBoundingClientRect();
    for (const { from, to, path } of links){
      const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
      const x1 = a.left + a.width / 2 - o.left, y1 = a.bottom - o.top;
      const x2 = b.left + b.width / 2 - o.left, y2 = b.top - o.top;
      const m = (y2 - y1) / 2;
      path.setAttribute('d', `M${x1},${y1} C${x1},${y1 + m} ${x2},${y2 - m} ${x2},${y2}`);
    }
  }
  async function clearChart(){
    tree.classList.add('out');
    wires.classList.add('out');
    await sleep(REDUCED ? 0 : 420);
    tree.replaceChildren();
    wires.replaceChildren();
    links.length = 0;
    tree.classList.remove('out');
    wires.classList.remove('out');
    chart.scrollTo({ top: 0 });
  }

  async function pickNumber(from){
    await faceMouth();
    const shown = VISIBLE[closed];
    const k = rand(shown.length);
    const chip = await choose(await options(shown.map(label => ({ label })), from), k);
    return [shown[k], chip];
  }
  async function play(){
    await faceMouth();
    const start = node('Start', null, 'start');
    await sleep(500);
    const c = rand(COLOURS.length);
    const colour = await choose(await options(COLOURS.map(({ word, ink }) => ({ label: word, dot: ink })), start), c);
    const spelled = node('', colour, 'bare');
    await foldThrough(spelled, [...COLOURS[c].word]);
    await sleep(350);

    const [count, countChip] = await pickNumber(spelled);
    const counted = node('', countChip, 'bare');
    await foldThrough(counted, Array.from({ length: count }, (_, k) => k + 1));
    await sleep(350);

    const [number, numberChip] = await pickNumber(counted);
    const flap = flaps[faceOf(number)];
    const fortune = FORTUNES[rand(FORTUNES.length)];
    inscribe(flap, fortune);
    await faceFlap(flap);
    await openFlap(flap, 1, 900);
    node(fortune.replace('\n', ' '), numberChip, 'fortune');

    await sleep(4200);
    await openFlap(flap, 0, 700);
    inscribe(flap);
    await Promise.all([clearChart(), moveTo(OPEN, 600)]);
    closed = null;
  }

  function frame(now){
    advance(now);
    shape();
    spin.rotation.z = view.az - 3 * Math.PI / 4;
    camera.position.set(0, -view.dist * Math.cos(view.el), LOOK + view.dist * Math.sin(view.el));
    camera.lookAt(0, 0, LOOK);
    renderer.render(scene, camera);
    drawWires();
    requestAnimationFrame(frame);
  }
  function resize(){
    renderer.setSize(stage.clientWidth, stage.clientHeight);
    camera.aspect = stage.clientWidth / stage.clientHeight;
    camera.updateProjectionMatrix();
    view.dist = Math.max(4.6, 1.35 / (Math.tan(camera.fov / 2 * DEG) * camera.aspect));
  }

  (async () => {
    await Promise.race([
      Promise.all(['500 80px Caveat', '700 80px Caveat'].map(f => document.fonts.load(f))).catch(() => {}),
      sleep(2500)
    ]);
    build();
    resize();
    new ResizeObserver(resize).observe(stage);
    orbit();
    requestAnimationFrame(frame);
    for (;;) await play();
  })();
}
