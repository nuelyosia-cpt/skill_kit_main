import * as THREE from './lib/three.module.js';
import * as T from './toon.js';
import * as P from './paint.js';
import { SHOTS, TOTAL, shotAt, camAt, dofAt, LIGHTS, lightFor, actorsAt, worldAt, fxAt } from './story.js';

const W = 1080, H = 1920;
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.08, 3000);
const rx = (a) => a * Math.PI / 180;

// ---------- materials ----------
const grad = (() => { const d = new Uint8Array([90, 90, 90, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 2, 1); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const toon = (opts) => new THREE.MeshToonMaterial({ gradientMap: grad, ...opts });
const texM = (c, rx_ = 1, ry_ = 1, color = '#ffffff') => toon({ map: P.tex(c, rx_, ry_), color });
const M = {
  plank: texM(P.planks(1), 1, 6), beam: texM(P.beam(2), 1, 2), beamDark: texM(P.beam(3, [28, 36, 30]), 1, 2),
  rot: texM(P.rotten(4), 1, 1), rotB: texM(P.rotten(14), 1, 1),
  stone: texM(P.stone(4), 1, 1), stoneMoss: texM(P.mossy(P.stone(4), 5, 1.2), 1, 1),
  grass: texM(P.grass(6), 40, 40), dirt: texM(P.dirt(7), 6, 30), plaster: texM(P.plaster(8), 1, 1), plaster2: texM(P.plaster(18, 28), 1, 1),
  roof: texM(P.roof(9), 2, 2), marble: texM(P.marble(10), 1, 1), marbleTop: toon({ color: '#ece2cf' }),
  trunk: toon({ color: '#6a4a32' }), cypress: toon({ color: '#3f6b36' }), pine: toon({ color: '#5c8a3c' }), bush: toon({ color: '#6c9a42' }),
  hill: toon({ color: '#7aa64c' }), hillFar: toon({ color: '#86ad60' }), mount: toon({ color: '#8fa7b8' }), snow: toon({ color: '#f4f6fa' }),
  iron: toon({ color: '#5c5a57' }), bronze: toon({ color: '#b08a4a' }), wood: toon({ color: '#7a5434' }), door: toon({ color: '#5a3a24' }),
  window: toon({ color: '#2b2430' }), red: toon({ color: '#b8282b' }),
};
// ---------- ink / normal-depth contract ----------
const NOINK = 'noink'; // userData flag: never outlined (cards, fx, water handled specially)
const ndMat = new THREE.ShaderMaterial({
  vertexShader: `varying vec3 vN; varying float vD; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vD = -mv.z; gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `varying vec3 vN; varying float vD; void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n; gl_FragColor = vec4(n*.5+.5, vD); }`,
  side: THREE.DoubleSide,
});
const cardNd = (map) => new THREE.ShaderMaterial({
  uniforms: { map: { value: map } },
  vertexShader: `varying vec2 vUv; varying float vD; void main(){ vUv=uv; vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying float vD; void main(){ if(texture2D(map,vUv).a<.5) discard; gl_FragColor=vec4(0.,0.,0.,vD); }`,
  side: THREE.DoubleSide,
});
const waterNd = new THREE.ShaderMaterial({
  vertexShader: `varying float vD; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `varying float vD; void main(){ gl_FragColor=vec4(.5,1.,.5,vD); }`,
});

// ---------- helpers ----------
const add = (geo, mat, x = 0, y = 0, z = 0, parent = scene, opts = {}) => {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = opts.cast ?? true; m.receiveShadow = true; parent.add(m); return m;
};
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const uvScale = (geo, su, sv) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return geo; };
/** box with world-scaled UVs per face (texel density 1 tile per `t` metres) */
const tbox = (w, h, d, t = 2) => {
  const g = box(w, h, d), uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / t, uv.getY(i) * dims[f][1] / t); }
  return g;
};

// ---------- sky ----------
const skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() }, sunSize: { value: 0 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(2600, 32, 16), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 top, hor, sunDir, sunCol; uniform float sunSize; varying vec3 vP;
    void main(){ float h = clamp(vP.y,0.,1.); vec3 c = mix(hor, top, pow(h, .55)); if(vP.y<0.) c = hor;
      float s = dot(normalize(vP), normalize(sunDir)); c += sunCol * (smoothstep(1.-sunSize, 1.-sunSize*.6, s) + .35*pow(max(s,0.), 24.)*step(.001,sunSize));
      gl_FragColor = vec4(c,1.); }`,
}));
sky.userData.sky = true; scene.add(sky);

// ---------- lights ----------
const hemi = new THREE.HemisphereLight('#ffffff', '#ffffff', 1); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffffff', 2); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2;
scene.add(sun); scene.add(sun.target);
scene.fog = new THREE.Fog('#ffffff', 40, 600);

// ---------- world ----------
const DECK = 0;
const world = new THREE.Group(); scene.add(world);
const canvasTex = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const MX = {
  parquet: texM(P.planks(5), 6, 4, '#c89a6a'), redWall: texM(P.plaster(18, 28), 3, 1, '#9a3a34'), cream: texM(P.plaster(8), 6, 2, '#efe2c8'),
  gold: toon({ color: '#d4a640' }), goldDark: toon({ color: '#a8782a' }), iron: toon({ color: '#3a3a40' }), wood: toon({ color: '#8a5a34' }), woodDark: toon({ color: '#5a3a22' }),
  cobble: texM(P.stone(14, 30, 10, 55, 40, 40), 40, 20, '#b8b0a4'), slate: toon({ color: '#4a5060' }), plank: texM(P.planks(2), 2, 2, '#9a7a5a'),
  bench: toon({ color: '#6a3a2a' }), glass: new THREE.MeshBasicMaterial({ color: '#cfe8f4', transparent: true, opacity: 0.22, depthWrite: false }), sky: new THREE.MeshBasicMaterial({ color: '#e8f0f4' }),
  rope: toon({ color: '#b4312c' }), brass: toon({ color: '#d9b24a' }), office: texM(P.plaster(28), 2, 1, '#c8b890'), attic: texM(P.plaster(38), 2, 1, '#d8c8a8'), florence: texM(P.plaster(48), 2, 1, '#e8c88a'),
  bed: toon({ color: '#e8e0d0' }), trunk: toon({ color: '#6a4424' }), lightWarm: new THREE.MeshBasicMaterial({ color: '#ffe8b0' }), dark: toon({ color: '#1e1a1a' }),
};
const facadeTex = canvasTex(1024, 512, (g, w, h) => { g.fillStyle = '#e6d8bc'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b8a888'; g.lineWidth = 3;
  for (let y = 0; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.fillStyle = '#cfc0a0'; g.fillRect(0, 180, w, 18); g.fillRect(0, 40, w, 14);
  for (let i = 0; i < 12; i++) { const x = 20 + i * 84; for (const [y0, hh] of [[230, 220], [70, 95]]) { g.fillStyle = '#3a4a5a'; g.beginPath(); g.moveTo(x + 14, y0 + hh); g.lineTo(x + 14, y0 + 20); g.arc(x + 34, y0 + 20, 20, Math.PI, 0); g.lineTo(x + 54, y0 + hh); g.fill(); g.strokeStyle = '#e6d8bc'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + 34, y0); g.lineTo(x + 34, y0 + hh); g.moveTo(x + 14, y0 + hh * 0.55); g.lineTo(x + 54, y0 + hh * 0.55); g.stroke(); }
    g.fillStyle = '#d8c8a8'; g.fillRect(x + 64, 60, 10, h - 60); } });
const add2 = (geo, mat, x, y, z, parent = world, o) => add(geo, mat, x, y, z, parent, o);
const room = (C, W, D, H, wallMat, floorMat, opts = {}) => { // back wall at z=-D/2, sides, floor, open front
  const g = new THREE.Group(); g.position.set(...C); world.add(g);
  const fl = add(new THREE.PlaneGeometry(W, D), floorMat, 0, 0.01, 0, g, { cast: false }); fl.rotation.x = -Math.PI / 2;
  add(tbox(W, H, 0.3, 2), wallMat, 0, H / 2, -D / 2, g);
  for (const s of [-1, 1]) add(tbox(0.3, H, D, 2), wallMat, s * W / 2, H / 2, 0, g);
  if (opts.ceil) { const c = add(tbox(W, 0.2, D, 2), opts.ceil, 0, H, 0, g); }
  return g;
};
// ===== the Louvre gallery (Salon Carré) at the origin =====
const GAL = [0, 0, 0];
const gal = room(GAL, 26, 18, 9, MX.redWall, MX.parquet);
{ // skylight roof: frame + glow
  add(tbox(26, 0.3, 18, 2), MX.cream, 0, 9.1, 0, gal);
  const sk = add(new THREE.PlaneGeometry(16, 10), MX.sky, 0, 8.9, 0, gal, { cast: false }); sk.rotation.x = Math.PI / 2;
  add(tbox(26, 0.5, 0.4, 2), MX.goldDark, 0, 6.6, -8.8, gal);   // cornice
  for (let i = 0; i < 2; i++) { const b = add(tbox(3.4, 0.5, 0.8, 1), MX.bench, -5 + i * 10, 0.4, 1.5, gal); for (const x of [-1.4, 1.4]) add(new THREE.BoxGeometry(0.15, 0.4, 0.15), MX.woodDark, -5 + i * 10 + x, 0.2, 1.5, gal); }
}
// paintings on the back wall: big ones around, the small Mona Lisa in the centre
const frameMesh = (parent, x, y, z, w, h, tex, ry = 0) => {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  const t = 0.14; add(tbox(w + 2 * t, h + 2 * t, 0.1, 1), MX.gold, 0, 0, 0, g);
  const pl = add(new THREE.PlaneGeometry(w, h), toon({ map: tex }), 0, 0, 0.06, g, { cast: false });
  return g;
};
{ const spots = [[-9.5, 4.6, 4.2, 3.0], [-9.5, 1.9, 2.6, 1.6], [-5.0, 4.8, 3.2, 2.4], [5.0, 4.8, 3.2, 2.4], [9.5, 4.6, 4.2, 3.0], [9.5, 1.9, 2.6, 1.6], [-4.4, 2.0, 1.6, 1.2], [4.4, 2.0, 1.6, 1.2], [0, 5.2, 2.8, 1.8]];
  spots.forEach(([x, y, w, h], i) => frameMesh(gal, x, y, -8.7, w, h, canvasTex(256, Math.round(256 * h / w), (g, W, H) => T.drawPainting(g, 0, 0, W, H, i + 2))));
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) frameMesh(gal, s * 12.8, 2.6 + (i % 2) * 2.4, -6 + i * 3.2, 2.2, 1.6, canvasTex(256, 186, (g, W, H) => T.drawPainting(g, 0, 0, W, H, 20 + i * 2 + (s > 0 ? 1 : 0))), -s * Math.PI / 2); }
// the Mona Lisa: 77 x 53 cm, hung on four iron hooks
const ML = [0, 2.25, -8.7];
let monaKey = ''; const monaCanvas = document.createElement('canvas'); monaCanvas.width = 530; monaCanvas.height = 770;
const monaTex = new THREE.CanvasTexture(monaCanvas); monaTex.colorSpace = THREE.SRGBColorSpace; monaTex.anisotropy = 8;
const drawMona = (o) => { const k = JSON.stringify(o); if (k === monaKey) return; monaKey = k; const g = monaCanvas.getContext('2d'); g.clearRect(0, 0, 530, 770); T.drawMonaLisa(g, 0, 0, 530, 770, o); monaTex.needsUpdate = true; };
drawMona({});
const MONA = frameMesh(gal, ML[0], ML[1], ML[2] + 0.08, 0.8, 1.15, monaTex);
for (const [dx, dy] of [[-0.42, 0.6], [0.42, 0.6], [-0.42, -0.6], [0.42, -0.6]]) { const h = add(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 8), MX.iron, ML[0] + dx, ML[1] + dy, ML[2] + 0.12, gal); h.rotation.x = Math.PI / 2; }
// modern display: glass case, rope barrier
const MODERN = new THREE.Group(); gal.add(MODERN);
add(tbox(1.6, 1.9, 0.5, 1), MX.glass, ML[0], ML[1], ML[2] + 0.3, MODERN).castShadow = false;
for (const x of [-2.2, 2.2]) add(new THREE.CylinderGeometry(0.06, 0.08, 1.0, 10), MX.brass, x, 0.5, -6.2, MODERN);
{ const r = add(new THREE.CylinderGeometry(0.035, 0.035, 4.4, 8), MX.rope, 0, 0.92, -6.2, MODERN); r.rotation.z = Math.PI / 2; }
// a doorway at the side of the gallery
add(tbox(2.2, 3.4, 0.35, 1), MX.dark, -12.85, 1.7, 5, gal).rotation.y = Math.PI / 2;
// ===== the Louvre facade at dawn (x=200) =====
const EXT = [200, 0, 0];
{ const g = new THREE.Group(); g.position.set(...EXT); world.add(g);
  const gr = add(new THREE.PlaneGeometry(200, 120), MX.cobble, 0, 0.01, 20, g, { cast: false }); gr.rotation.x = -Math.PI / 2;
  const fac = add(new THREE.BoxGeometry(90, 14, 8), toon({ map: (() => { facadeTex.wrapS = THREE.RepeatWrapping; facadeTex.repeat.set(4, 1); return facadeTex; })() }), 0, 7, -10, g);
  add(new THREE.BoxGeometry(90.5, 4, 8.6), MX.slate, 0, 15.5, -10.3, g).rotation.x = 0;
  for (let i = -10; i <= 10; i++) { const d = add(tbox(1.4, 1.8, 1.0, 1), MX.cream, i * 4.2, 16.4, -6.4, g); add(new THREE.ConeGeometry(1.05, 1.0, 4), MX.slate, i * 4.2, 17.8, -6.4, g).rotation.y = Math.PI / 4; }
  add(tbox(3.2, 4.4, 0.4, 1), MX.woodDark, 0, 2.2, -5.85, g);  // the door
  add(tbox(4.0, 0.5, 0.6, 1), MX.cream, 0, 4.7, -5.8, g);
  for (const x of [-7, 7]) { add(new THREE.CylinderGeometry(0.1, 0.14, 4.2, 8), MX.iron, x, 2.1, 0, g); add(new THREE.SphereGeometry(0.32, 10, 8), MX.lightWarm, x, 4.4, 0, g, { cast: false }); }
  for (let i = 0; i < 6; i++) { const h = 10 + (i % 3) * 3; add(tbox(14, h, 10, 3), MX.cream, -70 + i * 28, h / 2, 50, g); add(tbox(14.4, 3, 10.4, 3), MX.slate, -70 + i * 28, h + 1.5, 50, g); }
}
// ===== storage cupboard (x=400) =====
const CUP = [400, 0, 0];
{ const g = room(CUP, 3.2, 3.2, 3.2, MX.plank, MX.plank, { ceil: MX.plank });
  for (let k = 0; k < 2; k++) add(tbox(3.0, 0.08, 0.5, 1), MX.wood, 0, 1.7 + k * 0.7, -1.3, g);
  for (let i = 0; i < 4; i++) add(new THREE.CylinderGeometry(0.16, 0.13, 0.32, 10), MX.iron, -1 + i * 0.6, 1.92, -1.3, g);
  for (let i = 0; i < 3; i++) { const b = add(new THREE.CylinderGeometry(0.025, 0.025, 1.6, 6), MX.wood, -1.3 + i * 0.12, 0.8, -1.2, g); b.rotation.z = 0.15 - i * 0.08; }
  for (let i = 0; i < 3; i++) add(tbox(0.9, 0.7, 0.06, 1), MX.gold, 1.0, 0.36 + i * 0.03, -1.0 + i * 0.12, g).rotation.z = 0.05 * i;
  add(new THREE.PlaneGeometry(0.04, 2.6), MX.lightWarm, 0.6, 1.3, 1.55, g, { cast: false }); } // light crack in the door
// ===== police office (x=500) =====
const POL = [500, 0, 0];
const lineupTex = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#d8d0b8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3a3a3a'; g.fillStyle = '#3a3a3a'; g.font = 'bold 26px Arial';
  for (let i = 0; i <= 10; i++) { const y = h - i * 46; g.lineWidth = i % 2 ? 2 : 4; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); if (!(i % 2)) g.fillText((150 + i * 5) + ' cm', 8, y - 6); } });
{ const g = room(POL, 9, 8, 4.5, MX.office, MX.parquet);
  const lw = add(new THREE.PlaneGeometry(6, 3.6), toon({ map: lineupTex }), 0, 1.8, -3.83, g, { cast: false });
  add(tbox(2.4, 0.9, 1.1, 1), MX.wood, 3.0, 0.45, 1.2, g); add(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8), MX.brass, 3.4, 1.15, 1.2, g); add(new THREE.ConeGeometry(0.22, 0.2, 12), toon({ color: '#3a6a3a' }), 3.4, 1.45, 1.2, g); }
// ===== Peruggia's attic room (x=600) =====
const ATT = [600, 0, 0];
const TRUNK = new THREE.Group(), LID = new THREE.Group();
{ const g = room(ATT, 6, 5, 3.6, MX.attic, MX.plank);
  const r = add(tbox(6.2, 0.2, 4, 2), MX.wood, 0, 3.4, -0.6, g); r.rotation.x = -0.5;
  add(tbox(1.2, 1.0, 0.1, 1), new THREE.MeshBasicMaterial({ color: '#a8c8e0' }), 1.6, 2.2, -2.32, g); add(tbox(1.3, 0.08, 0.2, 1), MX.wood, 1.6, 2.2, -2.3, g); add(tbox(0.08, 1.1, 0.2, 1), MX.wood, 1.6, 2.2, -2.3, g);
  add(tbox(1.0, 0.5, 2.0, 1), MX.bed, -2.2, 0.35, -1.2, g); add(tbox(1.0, 0.25, 0.5, 1), MX.cream, -2.2, 0.7, -2.0, g);
  TRUNK.position.set(ATT[0] + 0.2, 0, ATT[2] - 0.6); world.add(TRUNK);
  add(tbox(1.4, 0.6, 0.8, 1), MX.trunk, 0, 0.3, 0, TRUNK); for (const x of [-0.5, 0.5]) add(tbox(0.08, 0.62, 0.82, 1), MX.brass, x, 0.31, 0, TRUNK);
  LID.position.set(0, 0.6, -0.4); TRUNK.add(LID); add(tbox(1.4, 0.12, 0.8, 1), MX.trunk, 0, 0.06, 0.4, LID);
  const pm = frameMesh(TRUNK, 0, 0.55, 0.05, 0.62, 0.9, monaTex); pm.rotation.x = -1.2; pm.scale.setScalar(0.9); }
// ===== Florence art dealer's shop (x=700) =====
const SHOP = [700, 0, 0];
{ const g = room(SHOP, 8, 7, 4.2, MX.florence, MX.parquet);
  add(tbox(3.2, 1.0, 0.9, 1), MX.wood, 0, 0.5, -0.8, g);
  [[-2.8, 2.6], [2.8, 2.6], [-1.2, 3.0], [1.2, 3.0]].forEach(([x, y], i) => frameMesh(g, x, y, -3.3, 1.4, 1.0, canvasTex(256, 182, (gg, W, H) => T.drawPainting(gg, 0, 0, W, H, 40 + i))));
  add(tbox(1.6, 2.8, 0.2, 1), MX.woodDark, 3.6, 1.4, 1.2, g).rotation.y = Math.PI / 2; }
const SHOPMONA = frameMesh(world, SHOP[0], 1.15, SHOP[2] - 0.75, 0.62, 0.9, monaTex); SHOPMONA.rotation.x = -0.25;
// clouds
const clouds = [];
{ const r = P.rng(90);
  for (let i = 0; i < 10; i++) {
    const c = document.createElement('canvas'); c.width = 600; c.height = 400; const pen = new T.Pen(c.getContext('2d')); pen.ol = 0;
    pen.g.translate(300, 200); pen.g.scale(1.4, 1.2); pen.g.translate(-300, -200); T.fxCloud(pen, i + 1);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.667), new THREE.MeshBasicMaterial({ map: P.tex(c), transparent: true, fog: false, depthWrite: false, opacity: 0.8 }));
    const a = r() * Math.PI * 2, d = 1300 + r() * 300; m.position.set(Math.cos(a) * d, 200 + r() * 220, Math.sin(a) * d); m.scale.setScalar(260 + r() * 200);
    m.userData.ndSkip = true; m.renderOrder = -1; scene.add(m); clouds.push(m);
  } }
const setCloudTint = (col, op) => clouds.forEach((m) => { m.material.color.set(col); m.material.opacity = op; });

// ---------- cards ----------
const CW = 1200, CH = 2000, CM = 2.25; // canvas px, card height in metres (design 600x1000 -> 2.25 m)
const cardGeo = new THREE.PlaneGeometry(CM * 0.6, CM); cardGeo.translate(0, CM / 2 - CM * 0.025, 0);
const blobTex = P.tex(P.radial('20,14,30', 0.6));
class Card {
  constructor(scale = 1) {
    [this.c, this.g] = (() => { const c = document.createElement('canvas'); c.width = CW; c.height = CH; return [c, c.getContext('2d')]; })();
    this.t = new THREE.CanvasTexture(this.c); this.t.colorSpace = THREE.SRGBColorSpace; this.t.anisotropy = 4;
    this.mat = new THREE.MeshBasicMaterial({ map: this.t, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, fog: true });
    this.mesh = new THREE.Mesh(cardGeo, this.mat); this.mesh.userData.nd = cardNd(this.t); this.mesh.castShadow = true;
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.t, alphaTest: 0.5 });
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, fog: true }));
    this.blob.rotation.x = -Math.PI / 2; this.blob.userData.ndSkip = true; this.blob.renderOrder = 1;
    scene.add(this.mesh); scene.add(this.blob); this.key = ''; this.mesh.visible = this.blob.visible = false;
  }
  draw(key, fn) {
    if (key === this.key) return; this.key = key;
    const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); g.setTransform(CW / 600, 0, 0, CH / 1000, 0, 0);
    const p = new T.Pen(g); fn(p); this.t.needsUpdate = true;
  }
}
const cards = []; const getCard = (i) => cards[i] || (cards[i] = new Card());

// ---------- render targets & post ----------
const rtColor = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
const rtNd = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
const rtInk = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), fsGeo = new THREE.PlaneGeometry(2, 2);
const fs = (mat) => { const s = new THREE.Scene(); s.add(new THREE.Mesh(fsGeo, mat)); return s; };
const inkU = { col: { value: rtColor.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, px: { value: 1.6 }, fogCol: { value: new THREE.Color() },
  sat: { value: 1.08 }, lift: { value: new THREE.Color(0, 0, 0) }, gain: { value: new THREE.Color(1, 1, 1) }, vig: { value: 0.22 }, flash: { value: 0 } };
const inkScene = fs(new THREE.ShaderMaterial({ uniforms: inkU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D col, nd; uniform vec2 res; uniform float px, sat, vig, flash; uniform vec3 fogCol, lift, gain; varying vec2 vUv;
  float edgeAt(vec2 uv, float r){
    vec4 c = texture2D(nd, uv); if (dot(c.rgb,c.rgb) < .01) return 0.; float d = c.a; vec3 n = c.rgb*2.-1.;
    float e = 0.; float rr = r * clamp(7./d, .62, 1.25);
    for (int i=0;i<16;i++){ float a = float(i)*.785398 + (i>7 ? .39 : 0.); float k = i>7 ? .5 : 1.;
      vec2 o = vec2(cos(a), sin(a))*rr*k/res; vec4 s = texture2D(nd, uv+o);
      float ds = s.a; bool card = dot(s.rgb,s.rgb) < .01;
      if (card && ds > 0.) continue;            // character cards: never outlined by the world ink
      if (card) ds = 1e4;                        // sky
      vec3 ns = s.rgb*2.-1.;
      e = max(e, smoothstep(.006, .02, (ds - d)/d));                           // depth jump, near side only
      if (!card && abs(ds-d)/d < .06) e = max(e, smoothstep(.88, .72, dot(n, ns)) * .9); // crease
    }
    return e * (1. - smoothstep(140., 520., d)*.8);
  }
  void main(){
    vec3 c = texture2D(col, vUv).rgb;
    float e = edgeAt(vUv, px);
    c = mix(c, vec3(.012,.01,.014), e);
    if (flash < -0.5) c = vec3(e);
    float l = dot(c, vec3(.299,.587,.114)); c = mix(vec3(l), c, sat);
    c = c*gain + lift;
    vec2 q = vUv-.5; c *= 1. - vig*dot(q*vec2(1.,.75), q*vec2(1.,.75))*2.2;
    c = mix(c, vec3(1.), flash);
    gl_FragColor = vec4(c,1.); }` }));
const dofU = { src: { value: rtInk.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, focus: { value: 5 }, cinf: { value: 0 }, near: { value: 1 } };
const dofScene = fs(new THREE.ShaderMaterial({ uniforms: dofU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D src, nd; uniform vec2 res; uniform float focus, cinf, near; varying vec2 vUv;
  float coc(vec2 uv){ float d = texture2D(nd, uv).a; if (d <= 0.) d = 2000.; float k = 1. - focus/d; return k > 0. ? cinf*k : min(-k*cinf*near, cinf*1.4); }
  void main(){
    float c0 = coc(vUv);
    if (cinf < .5 || c0 < .6) { gl_FragColor = linearToOutputTexel(vec4(texture2D(src, vUv).rgb, 1.)); return; }
    vec3 acc = vec3(0.); float wsum = 0.;
    for (int i=0;i<48;i++){ float fi = float(i); float r = sqrt((fi+.5)/48.); float a = fi*2.39996;
      vec2 o = vec2(cos(a), sin(a))*r*c0/res; float cs = coc(vUv+o);
      float w = smoothstep(r*c0-1.5, r*c0+.5, cs + .5);
      acc += texture2D(src, vUv+o).rgb*w; wsum += w; }
    gl_FragColor = linearToOutputTexel(vec4(acc/max(wsum,1e-3), 1.)); }` }));
// final copy with sRGB handled by the renderer output (we render to screen with linear->sRGB in the shader chunk)
dofScene.children[0].material.toneMapped = false;

// ---------- per-frame state ----------
const tmpV = new THREE.Vector3();
function applyLight(L, f) {
  hemi.color.set(L.sky); hemi.groundColor.set(L.ground); hemi.intensity = L.hemi;
  sun.color.set(L.sun); sun.intensity = L.sunI;
  scene.fog.color.set(L.fog); scene.fog.near = L.fogNear; scene.fog.far = L.fogFar;
  skyU.top.value.set(L.skyTop); skyU.hor.value.set(L.skyHor); skyU.sunCol.value.set(L.sunDisc || '#000'); skyU.sunSize.value = L.sunSize || 0;
  setCloudTint(L.cloud || '#ffffff', L.cloudOp ?? 0.8);
  inkU.sat.value = L.sat; inkU.gain.value.set(L.gain || '#ffffff'); inkU.lift.value.set(L.lift || '#000000');
}
function placeSun(L, focus) {
  // sun direction from azimuth/elevation in world space
  const az = rx(L.az), el = rx(L.el); tmpV.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  skyU.sunDir.value.copy(tmpV);
  const sd = L.sunDist || 80; sun.position.copy(focus).addScaledVector(tmpV, sd); sun.target.position.copy(focus);
  const ext = L.shadowExt || 30, sc = sun.shadow.camera; sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = sd * 2.5; sc.updateProjectionMatrix();
}

function worldState(S, f) {
  MONA.visible = S.mona !== false; MODERN.visible = !!S.modern;
  LID.rotation.x = -(S.lid || 0) * 1.7;
  drawMona(S.monaFace || {});
  SHOPMONA.visible = !!S.shopMona;
}

function drawActors(list, cam) {
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  list.forEach((a, i) => {
    const c = getCard(i);
    c.draw(a.key, a.draw);
    c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z);
    const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s, s);
    c.mesh.rotation.set(0, a.faceYaw ?? (Math.atan2(cam.position.x - a.x, cam.position.z - a.z) + (a.yaw || 0)), a.roll || 0);
    c.mat.color.set(a.tint || '#ffffff'); c.mat.opacity = a.alpha ?? 1;
    c.mesh.castShadow = a.shadow !== false;
    c.mesh.renderOrder = a.order || 2;
    if (a.blob !== false && a.y - (a.ground ?? DECK) < 0.5) { c.blob.visible = true; c.blob.position.set(a.x, (a.ground ?? DECK) + 0.02, a.z); c.blob.scale.set(0.95 * s, 0.6 * s, 1); }
  });
}

const swapForNd = (on) => {
  scene.traverse((o) => {
    if (!o.isMesh) return;
    if (on) {
      o.userData.mat0 = o.material;
      if (o.userData.ndSkip) { o.userData.vis0 = o.visible; o.visible = false; return; }
      if (o === sky || o.userData.sky) { o.userData.vis0 = o.visible; o.visible = false; return; }
      o.material = o.userData.nd || ndMat;
    } else {
      o.material = o.userData.mat0; if (o.userData.vis0 !== undefined) { o.visible = o.userData.vis0; delete o.userData.vis0; }
    }
  });
};

window.renderFrame = (f) => {
  const S = shotAt(f), L = lightFor(S, f), C = camAt(f);
  applyLight(L, f);
  camera.position.set(...C.pos); camera.up.set(0, 1, 0); camera.lookAt(...C.look); camera.rotateZ(rx(C.roll || 0));
  camera.fov = C.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  const W_ = worldAt(f); worldState(W_, f);
  placeSun(L, new THREE.Vector3(...(C.shadowAt || C.look)));
  drawActors([...actorsAt(f, T), ...fxAt(f, T)], camera);
  sky.position.copy(camera.position);
  for (const c of clouds) c.quaternion.copy(camera.quaternion);
  // pass A: colour
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
  // pass B: normal + depth
  const fog = scene.fog; scene.fog = null; const sm = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false; renderer.shadowMap.autoUpdate = false;
  swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false);
  scene.fog = fog; renderer.shadowMap.enabled = sm; renderer.shadowMap.autoUpdate = true;
  if (window.DEBUG_ND) { const dm = new THREE.MeshBasicMaterial({ map: rtNd.texture }); const ds = fs(dm); renderer.setRenderTarget(null); renderer.render(ds, fsCam); return true; }
  // ink + grade
  const D = dofAt(f);
  inkU.px.value = 2.5; inkU.flash.value = window.DEBUG_E ? -1 : (C.flash || 0); inkU.vig.value = L.vig ?? 0.22;
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  // lens
  dofU.focus.value = D.focus; dofU.cinf.value = D.cinf; dofU.near.value = D.near ?? 1;
  renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  return true;
};
window.TOTAL = TOTAL;
window.ready = true;
