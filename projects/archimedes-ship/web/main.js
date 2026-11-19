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
const MX = {
  rock: texM(P.rockFace(41), 4, 3, '#c8b8a4'), grass: texM(P.grass(45), 120, 120), sand: texM(P.sand(47), 80, 14),
  sea: toon({ color: '#2f7fae' }), wood: toon({ color: '#8a5a34' }), woodDark: toon({ color: '#5a3a22' }), rope: toon({ color: '#d9b06a' }),
  plaster: texM(P.plaster(8), 1, 1), roof: texM(P.roof(9), 2, 2), marble: texM(P.marble(10), 2, 2), marbleW: toon({ color: '#ece2cf' }),
  gold: toon({ color: '#e0b040' }), purple: toon({ color: '#6b3c8f' }), red: toon({ color: '#b4312c' }), cream: toon({ color: '#f4ead2' }),
  hill: toon({ color: '#7fa65c' }), hillFar: toon({ color: '#8fb46a' }), cliff: toon({ color: '#b8a888' }), eye: toon({ color: '#f4efe2' }),
  earthSea: toon({ color: '#2f78c8' }), earthLand: toon({ color: '#5aa850' }), cloudW: toon({ color: '#ffffff' }),
  asphalt: toon({ color: '#4a4a52' }), yellow: toon({ color: '#f2c22a' }), steel: toon({ color: '#8a96a4' }), glass: toon({ color: '#9cc8e8' }), carRed: toon({ color: '#d84a3a' }),
  crate: texM(P.planks(3), 1, 1), lamp: new THREE.MeshBasicMaterial({ color: '#ffd27a' }),
};
let sail; { const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#f4ead2' : '#b4312c'; g.fillRect(i * 32, 0, 32, 256); } sail = toon({ map: P.tex(c), side: THREE.DoubleSide }); }
const ground = add(new THREE.PlaneGeometry(4000, 4000), MX.grass, 0, 0, 0, world, { cast: false }); ground.rotation.x = -Math.PI / 2;
const sandM = add(new THREE.PlaneGeometry(600, 64), MX.sand, 0, 0.03, 34, world, { cast: false }); sandM.rotation.x = -Math.PI / 2;
const sea = add(new THREE.PlaneGeometry(4000, 2000), MX.sea, 0, 0.12, 1058, world, { cast: false }); sea.rotation.x = -Math.PI / 2; sea.userData.nd = waterNd;
// --- Syracuse on the hill behind the beach ---
{ const hill = add(new THREE.SphereGeometry(90, 32, 16), MX.hill, 20, -58, -95, world); hill.scale.set(1.6, 1, 1);
  const rr = P.rng(12);
  for (let i = 0; i < 46; i++) {
    const x = -70 + rr() * 150, z = -22 - rr() * 40, gy = Math.max(0, -58 + Math.sqrt(Math.max(0, 90 * 90 - ((x - 20) / 1.6) ** 2 - (z + 95) ** 2)));
    const w = 4 + rr() * 4, h = 3 + rr() * 3, d = 4 + rr() * 3, g = new THREE.Group(); g.position.set(x, gy, z); g.rotation.y = (rr() - 0.5) * 0.4; world.add(g);
    add(tbox(w, h, d, 2), MX.plaster, 0, h / 2, 0, g);
    const r = add(new THREE.ConeGeometry(Math.hypot(w, d) * 0.55, 1.8, 4), MX.roof, 0, h + 0.9, 0, g); r.rotation.y = Math.PI / 4; r.scale.set(w / Math.hypot(w, d) * 1.4, 1, d / Math.hypot(w, d) * 1.4);
    if (rr() < 0.5) add(new THREE.BoxGeometry(1, 1.8, 0.1), MX.woodDark, 0, 0.9, d / 2 + 0.05, g);
  }
  // temple on top
  const T = new THREE.Group(); T.position.set(10, 26, -62); world.add(T);
  add(tbox(26, 1.6, 14, 2), MX.marbleW, 0, 0.8, 0, T);
  for (let i = 0; i < 8; i++) for (const z of [-6, 6]) add(new THREE.CylinderGeometry(0.7, 0.8, 9, 12), MX.marbleW, -11 + i * 22 / 7, 6.1, z, T);
  add(tbox(27, 1.2, 15, 2), MX.marbleW, 0, 11.2, 0, T);
  const pd = add(new THREE.CylinderGeometry(8.5, 8.5, 27, 3, 1), MX.roof, 0, 13.6, 0, T); pd.rotation.set(0, 0, Math.PI / 2); pd.scale.set(0.42, 1, 1);
}
// far hills
{ const rr = P.rng(80); for (let i = 0; i < 14; i++) { const a = Math.PI + 0.3 + rr() * (Math.PI - 0.6), d = 260 + rr() * 300; const h = add(new THREE.SphereGeometry(50 + rr() * 60, 18, 10), i % 2 ? MX.hill : MX.hillFar, Math.cos(a) * d, -20, Math.sin(a) * d, world, { cast: false }); h.scale.set(1.5, 0.5 + rr() * 0.3, 1); } }
// --- the three-masted ship (bow toward -x) ---
const SHIP = new THREE.Group(); world.add(SHIP);
const CARGO = new THREE.Group(); SHIP.add(CARGO);
{ const hull = add(new THREE.SphereGeometry(1, 28, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), MX.wood, 0, 1.4, 0, SHIP); hull.scale.set(11, 2.6, 2.8);
  add(new THREE.BoxGeometry(20.5, 0.25, 5.0), MX.woodDark, 0, 1.42, 0, SHIP);
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(21.5, 0.45, 0.25), MX.red, 0, 1.6, s * 2.75, SHIP);
  const prow = add(new THREE.TorusGeometry(2.0, 0.28, 8, 16, Math.PI * 0.8), MX.wood, -10.2, 2.8, 0, SHIP); prow.rotation.z = Math.PI + 0.4;
  const stern = add(new THREE.TorusGeometry(1.9, 0.26, 8, 16, Math.PI * 0.9), MX.wood, 10.4, 2.8, 0, SHIP); stern.rotation.z = -0.4;
  for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.36, 10, 8), MX.eye, -10.7, 1.9, s * 2.5, SHIP);
  for (const [mx, h, sw] of [[-5.5, 9, 6], [0.5, 12, 8], [6.5, 9, 6]]) {
    add(new THREE.CylinderGeometry(0.2, 0.26, h, 8), MX.woodDark, mx, 1.4 + h / 2, 0, SHIP);
    add(new THREE.CylinderGeometry(0.12, 0.12, sw + 1, 6), MX.woodDark, mx, 1.4 + h - 0.6, 0, SHIP).rotation.x = Math.PI / 2;
    const sl = add(new THREE.PlaneGeometry(sw, h * 0.55), sail, mx + 0.25, 1.4 + h - 0.6 - h * 0.28, 0, SHIP); sl.rotation.y = Math.PI / 2;
  }
  // cargo: crates and amphorae on deck
  for (let i = 0; i < 7; i++) { const c = add(tbox(1.2, 1.0, 1.2, 1.2), MX.crate, -8 + i * 2.6, 2.0, (i % 2 ? 1.2 : -1.0), CARGO); c.rotation.y = i * 0.3; }
  for (let i = 0; i < 5; i++) add(new THREE.CylinderGeometry(0.25, 0.4, 1.1, 10), MX.cliff, -6.5 + i * 3.3, 2.05, (i % 2 ? -1.6 : 1.7), CARGO);
}
// --- pulley rig: fixed block on a post near the chair, moving block at the bow ---
const RIG = { post: [0, 0, 6.5], chair: [0, 0, 0] };
add(new THREE.CylinderGeometry(0.28, 0.34, 3.2, 10), MX.woodDark, RIG.post[0], 1.6, RIG.post[2], world);
const blockGeo = tbox(0.7, 1.1, 1.4, 1);
const fixedBlock = add(blockGeo, MX.wood, RIG.post[0], 2.2, RIG.post[2] + 0.45, world); fixedBlock.rotation.y = Math.PI / 2;
const moveBlock = add(blockGeo, MX.wood, 0, 2.2, 30, world); moveBlock.rotation.y = Math.PI / 2;
for (const B of [fixedBlock, moveBlock]) for (let k = -1; k <= 1; k++) { const w = add(new THREE.CylinderGeometry(0.42, 0.42, 0.14, 16), MX.cream, 0, 0, k * 0.4, B); w.rotation.x = Math.PI / 2; }
// chair
{ const g = new THREE.Group(); g.position.set(...RIG.chair); g.rotation.y = -Math.PI / 2; world.add(g);
  add(tbox(1.4, 0.18, 1.3, 1), MX.wood, 0, 0.75, 0, g);
  for (const [x, z] of [[-0.6, -0.55], [0.6, -0.55], [-0.6, 0.55], [0.6, 0.55]]) add(new THREE.BoxGeometry(0.14, 0.75, 0.14), MX.woodDark, x, 0.37, z, g); }
// --- palace (x=300) ---
const PAL = [300, 0, 0];
{ const g = new THREE.Group(); g.position.set(...PAL); world.add(g);
  const fl = add(new THREE.PlaneGeometry(22, 22), MX.marble, 0, 0.02, 0, g, { cast: false }); fl.rotation.x = -Math.PI / 2;
  add(tbox(22, 9, 0.6, 2), MX.plaster, 0, 4.5, -7, g);
  add(tbox(4, 3, 0.7, 1), new THREE.MeshBasicMaterial({ color: '#9ccff0' }), 6, 4.5, -6.9, g);   // window light
  for (const x of [-8, -3.5, 3.5, 8]) add(new THREE.CylinderGeometry(0.55, 0.65, 9, 14), MX.marbleW, x, 4.5, -5.4, g);
  add(tbox(3.0, 0.6, 2.2, 1), MX.gold, 0, 0.3, -4.6, g); add(tbox(2.2, 0.5, 1.6, 1), MX.purple, 0, 0.85, -4.6, g); add(tbox(2.2, 3.6, 0.4, 1), MX.gold, 0, 2.4, -5.6, g);
  for (const x of [-1.2, 1.2]) add(tbox(0.3, 1.2, 1.6, 1), MX.gold, x, 1.3, -4.6, g);
  const rug = add(new THREE.PlaneGeometry(3, 10), MX.red, 0, 0.03, 0, g, { cast: false }); rug.rotation.x = -Math.PI / 2; }
// --- study (x=340) ---
const STUDY = [340, 0, 0];
{ const g = new THREE.Group(); g.position.set(...STUDY); world.add(g);
  const fl = add(new THREE.PlaneGeometry(14, 14), MX.wood, 0, 0.02, 0, g, { cast: false }); fl.rotation.x = -Math.PI / 2;
  add(tbox(14, 6, 0.5, 2), MX.plaster, 0, 3, -4, g); add(tbox(0.5, 6, 10, 2), MX.plaster, -5, 3, 0, g);
  add(tbox(3.2, 0.16, 1.6, 1), MX.wood, 0, 1.0, -1.5, g); for (const [x, z] of [[-1.4, -2.1], [1.4, -2.1], [-1.4, -0.9], [1.4, -0.9]]) add(new THREE.BoxGeometry(0.14, 1.0, 0.14), MX.woodDark, x, 0.5, z, g);
  for (let i = 0; i < 4; i++) { const sc = add(new THREE.CylinderGeometry(0.1, 0.1, 0.7, 10), MX.cream, -1.0 + i * 0.22, 1.18, -1.9, g); sc.rotation.z = Math.PI / 2; }
  const pg = add(new THREE.PlaneGeometry(0.9, 0.6), MX.cream, 0.4, 1.09, -1.3, g, { cast: false }); pg.rotation.x = -Math.PI / 2;
  add(new THREE.CylinderGeometry(0.12, 0.16, 0.2, 10), MX.gold, 1.2, 1.18, -1.8, g); add(new THREE.SphereGeometry(0.07, 8, 6), MX.lamp, 1.2, 1.36, -1.8, g, { cast: false });
  for (let k = 0; k < 3; k++) add(tbox(3, 0.12, 0.8, 1), MX.wood, -2.6, 1.5 + k * 1.1, -3.4, g); }
const studyLight = new THREE.PointLight('#ffb060', 0, 20, 1.3); studyLight.position.set(STUDY[0] + 1.2, 1.8, STUDY[2] - 1.6); scene.add(studyLight);
// --- space: the Earth on a lever (y=1500) ---
const SP = [0, 1500, 0];
const EARTH = new THREE.Group(); EARTH.position.set(SP[0] + 0.8, SP[1] + 3.5, SP[2]); world.add(EARTH); EARTH.scale.setScalar(0.62);
{ add(new THREE.SphereGeometry(4, 32, 20), MX.earthSea, 0, 0, 0, EARTH);
  const rr = P.rng(5); for (let i = 0; i < 9; i++) { const c = add(new THREE.SphereGeometry(1.2 + rr() * 1.4, 12, 8), MX.earthLand, 0, 0, 0, EARTH); const th = rr() * Math.PI * 2, ph = Math.acos(rr() * 2 - 1); c.position.set(3.2 * Math.sin(ph) * Math.cos(th), 3.2 * Math.cos(ph), 3.2 * Math.sin(ph) * Math.sin(th)); c.scale.set(1, 0.5, 1); c.lookAt(0, 0, 0); }
  for (let i = 0; i < 5; i++) { const c = add(new THREE.SphereGeometry(0.6 + rr() * 0.6, 10, 6), MX.cloudW, 0, 0, 0, EARTH); const th = rr() * 6.28, ph = Math.acos(rr() * 2 - 1); c.position.set(3.9 * Math.sin(ph) * Math.cos(th), 3.9 * Math.cos(ph), 3.9 * Math.sin(ph) * Math.sin(th)); c.scale.set(1.6, 0.3, 1); c.lookAt(0, 0, 0); } }
const LEVER = new THREE.Group(); LEVER.position.set(SP[0] + 4, SP[1] + 1.2, SP[2]); world.add(LEVER);
add(tbox(12, 0.3, 0.7, 1), MX.wood, 1.5, 0, 0, LEVER);
add(new THREE.ConeGeometry(1.0, 1.4, 4), MX.cliff, SP[0] + 4, SP[1] + 0.4, SP[2], world);
for (const [x, sx] of [[2.5, 2.4], [10.2, 1.8]]) { const r = add(new THREE.SphereGeometry(1, 16, 10), MX.rock, SP[0] + x, SP[1] - 0.6, SP[2], world); r.scale.set(sx, 0.7, 1.6); }
{ const n = 900, pos = new Float32Array(n * 3), rr = P.rng(33); for (let i = 0; i < n; i++) { const th = rr() * Math.PI * 2, ph = Math.acos(rr() * 2 - 1), R = 900; pos.set([SP[0] + R * Math.sin(ph) * Math.cos(th), SP[1] + R * Math.cos(ph), SP[2] + R * Math.sin(ph) * Math.sin(th)], i * 3); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, fog: false })); stars.userData.ndSkip = true; scene.add(stars); }
// --- today (x=600): crane, elevator tower, tow truck ---
const MOD = [600, 0, 0];
const CRANE_HOOK = new THREE.Group(); world.add(CRANE_HOOK);
const ELEV = new THREE.Group(); world.add(ELEV);
const TRUCK = new THREE.Group(); world.add(TRUCK);
{ const a = add(new THREE.PlaneGeometry(140, 140), MX.asphalt, MOD[0], 0.04, MOD[2], world, { cast: false }); a.rotation.x = -Math.PI / 2;
  for (let i = -3; i <= 3; i++) { const l = add(new THREE.PlaneGeometry(0.3, 4), MX.yellow, MOD[0] + i * 8, 0.05, MOD[2] + 12, world, { cast: false }); l.rotation.set(-Math.PI / 2, 0, Math.PI / 2); }
  // crane
  add(tbox(1.4, 34, 1.4, 2), MX.yellow, MOD[0] - 14, 17, MOD[2] - 16, world);
  add(tbox(30, 1.0, 1.0, 2), MX.yellow, MOD[0] - 6, 34.5, MOD[2] - 16, world);
  add(tbox(3, 2.5, 2, 1), MX.steel, MOD[0] - 14, 32, MOD[2] - 16, world);
  add(tbox(4, 3, 2, 1), MX.steel, MOD[0] - 22, 34, MOD[2] - 16, world);
  add(new THREE.CylinderGeometry(0.05, 0.05, 1, 6), MX.steel, 0, -0.5, 0, CRANE_HOOK).scale.y = 1;
  add(tbox(8, 0.6, 0.6, 1), MX.red, 0, 0, 0, CRANE_HOOK);
  // building with a glass elevator
  add(tbox(12, 28, 10, 2), MX.plaster, MOD[0] + 14, 14, MOD[2] - 20, world);
  add(tbox(3.6, 30, 3.6, 2), MX.glass, MOD[0] + 6.5, 15, MOD[2] - 14, world).material = MX.glass;
  add(tbox(3.0, 3.2, 3.0, 1), MX.red, 0, 1.6, 0, ELEV);
  // tow truck towing a car
  add(tbox(3.0, 2.4, 2.6, 1), MX.yellow, -3.5, 2.0, 0, TRUCK); add(tbox(6.5, 0.8, 2.6, 1), MX.steel, 1.0, 1.2, 0, TRUCK);
  add(tbox(0.3, 0.3, 3.5, 1), MX.steel, 4.6, 2.2, 0, TRUCK).rotation.z = 0.6;
  for (const x of [-3.2, 2.5]) for (const z of [-1.3, 1.3]) { const w = add(new THREE.CylinderGeometry(0.6, 0.6, 0.4, 14), MX.woodDark, x, 0.6, z, TRUCK); w.rotation.x = Math.PI / 2; }
  const car = new THREE.Group(); car.position.set(9.5, 0, 0); TRUCK.add(car); car.rotation.z = 0.12;
  add(tbox(4.4, 1.0, 2.2, 1), MX.carRed, 0, 1.0, 0, car); add(tbox(2.4, 0.9, 2.0, 1), MX.carRed, -0.2, 1.9, 0, car);
  for (const x of [-1.4, 1.4]) for (const z of [-1.1, 1.1]) { const w = add(new THREE.CylinderGeometry(0.45, 0.45, 0.3, 12), MX.woodDark, x, 0.45, z, car); w.rotation.x = Math.PI / 2; } }
// --- rope lines (pooled cylinders, lit) ---
const linePool = [], lineGeo = new THREE.CylinderGeometry(1, 1, 1, 6); lineGeo.translate(0, 0.5, 0);
const upV = new THREE.Vector3(0, 1, 0), tA = new THREE.Vector3(), tB = new THREE.Vector3();
const drawLines = (segs = []) => {
  linePool.forEach((m) => { m.visible = false; });
  segs.forEach((sg, i) => {
    let m = linePool[i]; if (!m) { m = new THREE.Mesh(lineGeo, MX.rope); m.castShadow = false; m.receiveShadow = true; scene.add(m); linePool[i] = m; }
    const k = sg.k ?? 1; if (k <= 0.001) return;
    tA.set(...sg.a); tB.set(...sg.b).sub(tA).multiplyScalar(k); const L = tB.length(); if (L < 1e-4) return;
    m.visible = true; m.position.copy(tA); m.quaternion.setFromUnitVectors(upV, tB.clone().normalize()); m.scale.set(sg.r || 0.05, L, sg.r || 0.05);
  });
};
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
  const sh = S.ship || { x: 0, z: 30 };
  SHIP.position.set(sh.x, sh.y ?? 0, sh.z); SHIP.rotation.set(0, sh.yaw || 0, sh.roll || 0);
  CARGO.visible = !!S.cargo; CARGO.children.forEach((c, i) => { const k = S.cargoK ?? 1; c.visible = i / CARGO.children.length < k; });
  moveBlock.position.set(sh.x, 2.2, sh.z - 11.6); moveBlock.visible = fixedBlock.visible = !!S.rig;
  studyLight.intensity = S.study ? 12 : 0;
  EARTH.rotation.y = f * 0.004; EARTH.position.y = SP[1] + 3.5 + (S.earthLift || 0);
  LEVER.rotation.z = -0.16 + (S.lever || 0);
  CRANE_HOOK.position.set(MOD[0] - 2, S.craneY ?? 4, MOD[2] - 16);
  ELEV.position.set(MOD[0] + 6.5, S.elevY ?? 0, MOD[2] - 11.8);
  TRUCK.position.set(MOD[0] + (S.truckX ?? -10), 0, MOD[2] + 6);
  drawLines(S.lines);
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
