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
const camera = new THREE.PerspectiveCamera(40, W / H, 0.08, 1500);
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
const sky = new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), new THREE.ShaderMaterial({
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
const DECK = 0, WH = 7, WT = 5; // ground, wall height, wall thickness (gate at x=0, plain is +x, town is -x)
const world = new THREE.Group(); scene.add(world);
const MX = {
  steppe: texM(P.steppe(25), 70, 70), dirt: texM(P.dirt(7), 3, 40), yard: texM(P.dirt(17), 10, 10),
  brick: texM(P.brick(21), 1, 1), earth: texM(P.earth(22), 1, 1), door: texM(P.doorRed(23), 1, 1), tiles: texM(P.tiles(24), 1, 1),
  red: toon({ color: '#a8302a' }), redDark: toon({ color: '#6e1e1a' }), wood: toon({ color: '#6a4228' }), lacquer: toon({ color: '#3a2218' }),
  tileDark: toon({ color: '#3d424b' }), plaster: texM(P.plaster(8, 40), 1, 1), iron: toon({ color: '#3c3a38' }), fire: toon({ color: '#ff9a2a', emissive: '#ff7a10', emissiveIntensity: 0.6 }),
  armor: toon({ color: '#4a4e58' }), skin: toon({ color: '#e2ad80' }), spear: toon({ color: '#7a5a3a' }), tassel: toon({ color: '#c8302c' }),
  rock: toon({ color: '#9a9070' }), rockTop: toon({ color: '#7f9a5a' }), poplar: toon({ color: '#6f9a3c' }), willow: toon({ color: '#8ab04a' }),
  hill: toon({ color: '#a8ad62' }), hillFar: toon({ color: '#9cad78' }), mount: toon({ color: '#8fa0b4' }), snow: toon({ color: '#f4f6fa' }), trunk: toon({ color: '#6a4a32' }),
};
const zTop = P.tex(P.zitherTop()); zTop.wrapS = zTop.wrapT = THREE.ClampToEdgeWrapping; MX.zither = toon({ map: zTop });
const flagMat = (col) => new THREE.MeshToonMaterial({ gradientMap: grad, map: P.tex(P.flag(col)), alphaTest: 0.5, side: THREE.DoubleSide });
MX.flagShu = flagMat('#3f8a4a'); MX.flagWei = flagMat('#c9302c');
const faces6 = (side, top) => [side, side, top, side, side, side];
// ground, road and town yard
const ground = add(new THREE.PlaneGeometry(2400, 2400), MX.steppe, 0, 0, 0, world, { cast: false }); ground.rotation.x = -Math.PI / 2;
const road = add(new THREE.PlaneGeometry(240, 5.2), MX.dirt, 122, 0.02, 0, world, { cast: false }); road.rotation.x = -Math.PI / 2;
const yard = add(new THREE.PlaneGeometry(56, 70), MX.yard, -30, 0.015, 0, world, { cast: false }); yard.rotation.x = -Math.PI / 2;
// the wall: two long runs either side of the gate, lintel over the gate, side walls running back into town
const wallMats = faces6(MX.brick, MX.earth);
for (const s of [-1, 1]) {
  add(tbox(WT, WH, 59.6, 2.4), wallMats, 0, WH / 2, s * (2.4 + 29.8), world);
  add(tbox(70, WH, WT, 2.4), wallMats, -35 + WT / 2, WH / 2, s * 62, world);
}
add(tbox(WT, 2, 4.8, 2.4), wallMats, 0, WH - 1, 0, world);
// gate passage lining (dark inside)
add(tbox(WT - 0.2, 0.2, 4.8, 2), MX.lacquer, 0, WH - 2.1, 0, world, { cast: false });
// crenellations on the outer edge + low inner parapet
const merlonGeo = tbox(0.7, 1.05, 1.0, 1.2);
for (let z = -61; z <= 61; z += 1.75) { if (Math.abs(z) < 2.2) continue; add(merlonGeo, MX.brick, WT / 2 - 0.35, WH + 0.52, z, world); }
for (const s of [-1, 1]) add(tbox(0.4, 0.55, 58, 2), MX.brick, -WT / 2 + 0.2, WH + 0.27, s * 33, world);
// gate doors (pivot groups; open swings inward to -x)
const doors = [];
for (const s of [-1, 1]) {
  const g = new THREE.Group(); g.position.set(1.15, 0, s * 2.4); world.add(g);
  add(tbox(0.25, 5, 2.4, 2.4), faces6(MX.door, MX.lacquer), 0, 2.5, -s * 1.2, g);
  add(new THREE.TorusGeometry(0.16, 0.04, 6, 14), toon({ color: '#d9a845' }), 0.16, 2.4, -s * 2.0, g).rotation.y = Math.PI / 2;
  g.userData.s = s; doors.push(g);
}
// gate tower pavilion on the wall top
const tower = new THREE.Group(); tower.position.set(-0.3, WH, 0); world.add(tower);
add(tbox(4.6, 0.25, 11, 2), MX.wood, 0, 0.12, 0, tower);
const pillarGeo = new THREE.CylinderGeometry(0.17, 0.19, 3.1, 10); pillarGeo.translate(0, 1.55, 0);
for (const x of [-1.7, 1.7]) for (const z of [-4.6, -1.5, 1.5, 4.6]) add(pillarGeo, MX.red, x, 0.25, z, tower);
for (const x of [-1.7, 1.7]) add(tbox(0.32, 0.42, 9.6, 2), MX.redDark, x, 3.4, 0, tower);
for (const z of [-4.6, 4.6]) add(tbox(3.7, 0.42, 0.32, 2), MX.redDark, 0, 3.4, z, tower);
add(tbox(5.8, 0.24, 11.6, 2), MX.tileDark, 0, 3.72, 0, tower);
const hip = add(new THREE.ConeGeometry(1, 1, 4), MX.tiles, 0, 4.85, 0, tower); hip.rotation.y = Math.PI / 4; hip.scale.set(5.9 / 1.414, 2.2, 11.8 / 1.414);
add(tbox(0.28, 0.32, 5.4, 1), MX.tileDark, 0, 5.85, 0, tower);
for (const x of [-2.9, 2.9]) for (const z of [-5.8, 5.8]) { const c = add(new THREE.ConeGeometry(0.16, 0.9, 5), MX.tileDark, x * 1.04, 4.0, z * 1.03, tower); c.rotation.z = -Math.sign(x) * 0.7; c.rotation.x = Math.sign(z) * 0.7; }
for (const z of [-2.6, 2.6]) add(new THREE.SphereGeometry(0.22, 8, 6), MX.tileDark, 0, 6.05, z, tower);
// flags on the wall top (green Shu)
const flags = [];
const mkFlag = (parent, x, y, z, mat, h = 4.2) => {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  add(new THREE.CylinderGeometry(0.05, 0.06, h, 6), MX.wood, 0, h / 2, 0, g);
  const cl = add(new THREE.PlaneGeometry(1.0, 1.9, 6, 6), mat, 0, h - 1.05, 0.52, g); cl.rotation.y = Math.PI / 2;
  cl.userData.cloth = cl.geometry.attributes.position.array.slice(); cl.userData.ph = x * 0.7 + z * 1.3; flags.push(cl); return g;
};
for (const z of [-7, 7, -20, 20, -34, 34]) mkFlag(world, WT / 2 - 0.9, WH, z, MX.flagShu);
// zither on a low table at the front of the tower (Zhuge sits behind it)
const zitherG = new THREE.Group(); zitherG.position.set(2.0, WH, 0); world.add(zitherG);
add(tbox(0.55, 0.42, 1.55, 1), MX.lacquer, 0, 0.21, 0, zitherG);
add(new THREE.BoxGeometry(0.34, 0.07, 1.4), [MX.lacquer, MX.lacquer, MX.zither, MX.lacquer, MX.lacquer, MX.lacquer], 0, 0.46, 0, zitherG);
const incense = add(new THREE.CylinderGeometry(0.1, 0.13, 0.22, 8), toon({ color: '#b08a4a' }), 0.05, 0.53, -0.62, zitherG);
// town houses: white plaster, grey hip roofs with flared eaves
const house = (x, z, w, d, h, rot = 0) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; world.add(g);
  add(tbox(w, h, d, 2), MX.plaster, 0, h / 2, 0, g);
  add(tbox(w + 1.4, 0.2, d + 1.4, 2), MX.tileDark, 0, h + 0.1, 0, g);
  const r = add(new THREE.ConeGeometry(1, 1, 4), MX.tiles, 0, h + 0.95, 0, g); r.rotation.y = Math.PI / 4; r.scale.set((w + 1.3) / 1.414, 1.7, (d + 1.3) / 1.414);
  add(box(1.0, 2.0, 0.1), MX.redDark, 0, 1.0, d / 2 + 0.03, g, { cast: false });
  for (const sx of [-1, 1]) add(box(0.7, 0.7, 0.1), MX.lacquer, sx * w * 0.3, h * 0.6, d / 2 + 0.03, g, { cast: false });
  return g;
};
const rh = P.rng(12);
[[-24, -16, 0], [-34, -16, 0], [-44, -14, 0], [-26, 17, Math.PI], [-37, 18, Math.PI], [-48, 16, Math.PI], [-52, 0, Math.PI / 2], [-56, -30, 0], [-40, -36, 0], [-24, -40, 0], [-30, 36, Math.PI], [-48, 40, Math.PI]]
  .forEach(([x, z, r]) => house(x, z, 6 + rh() * 3, 5 + rh() * 2, 3.2 + rh() * 1.4, r));
// courtyard props: cook's cauldron on a fire, clerk's desk with scrolls
const cauldron = new THREE.Group(); cauldron.position.set(-16.4, 0, -5.9); world.add(cauldron);
add(new THREE.CylinderGeometry(0.75, 0.55, 0.9, 14), MX.iron, 0, 0.75, 0, cauldron);
add(new THREE.TorusGeometry(0.75, 0.07, 6, 16), MX.iron, 0, 1.2, 0, cauldron).rotation.x = Math.PI / 2;
for (let i = 0; i < 5; i++) { const a = i * 1.26; add(new THREE.ConeGeometry(0.2, 0.55, 5), MX.fire, Math.cos(a) * 0.35, 0.28, Math.sin(a) * 0.35, cauldron, { cast: false }); }
const desk = new THREE.Group(); desk.position.set(-15.3, 0, -0.9); desk.rotation.y = Math.PI / 2; world.add(desk);
add(tbox(1.6, 0.75, 0.8, 1), MX.wood, 0, 0.375, 0, desk);
for (let i = 0; i < 4; i++) { const sc = add(new THREE.CylinderGeometry(0.07, 0.07, 0.55, 8), toon({ color: i % 2 ? '#efe2bc' : '#e2cf98' }), -0.5 + i * 0.25, 0.82, 0, desk); sc.rotation.x = Math.PI / 2; }
// map table (in a side yard of the town)
const MAPAT = new THREE.Vector3(-20, 0, -30);
add(tbox(2.3, 0.85, 2.3, 1), MX.wood, MAPAT.x, 0.425, MAPAT.z, world);
const mapCanvas = document.createElement('canvas'); mapCanvas.width = mapCanvas.height = 1024;
const mapTex = new THREE.CanvasTexture(mapCanvas); mapTex.colorSpace = THREE.SRGBColorSpace; mapTex.anisotropy = 8;
const mapMesh = add(new THREE.PlaneGeometry(2.0, 2.0), toon({ map: mapTex }), MAPAT.x, 0.862, MAPAT.z, world, { cast: false }); mapMesh.rotation.x = -Math.PI / 2;
let mapKey = '';
for (const [dx, dz] of [[1.25, 0.6], [-1.25, -0.4]]) add(new THREE.CylinderGeometry(0.12, 0.12, 1.9, 8), toon({ color: '#e2cf98' }), MAPAT.x + dx, 0.95, MAPAT.z + dz, world).rotation.x = Math.PI / 2;
// Ma Su's mountain pass (far to the north-east)
const PASS = new THREE.Vector3(170, 0, -230);
add(new THREE.CylinderGeometry(5, 36, 26, 9), MX.rock, PASS.x, 13, PASS.z, world);
add(new THREE.CylinderGeometry(5.6, 5.0, 0.6, 9), MX.rockTop, PASS.x, 26.2, PASS.z, world);
for (const [dx, dz, r, h] of [[-40, -10, 26, 34], [38, -20, 30, 40], [-10, -45, 34, 46]]) add(new THREE.ConeGeometry(r, h, 8), MX.rock, PASS.x + dx, h / 2, PASS.z + dz, world);
const passFlags = { shu: mkFlag(world, PASS.x - 1.6, 26.4, PASS.z + 0.8, MX.flagShu, 4.6), wei: mkFlag(world, PASS.x + 1.6, 26.4, PASS.z - 0.6, MX.flagWei, 4.6) };
// ---- the Wei army: merged low-poly soldiers in blocks, with red banners ----
const mergeGeos = (parts) => { // parts: [geo, matrix]
  const pos = [], nor = [];
  for (const [g0, m] of parts) { const g = g0.index ? g0.toNonIndexed() : g0.clone(); g.applyMatrix4(m); pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return g;
};
const SOL = { body: new THREE.CylinderGeometry(0.22, 0.3, 1.25, 6), head: new THREE.SphereGeometry(0.17, 6, 4), helm: new THREE.ConeGeometry(0.22, 0.32, 6), spear: new THREE.CylinderGeometry(0.025, 0.025, 2.9, 4), tip: new THREE.ConeGeometry(0.07, 0.25, 4) };
const mtx = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);
const blockGeos = (rows, cols, sp, seed) => {
  const r = P.rng(seed), A = [], Hd = [], S = [], Tp = [];
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    const x = (i - (rows - 1) / 2) * sp + (r() - 0.5) * 0.2, z = (j - (cols - 1) / 2) * sp + (r() - 0.5) * 0.2;
    A.push([SOL.body, mtx(x, 0.63, z)], [SOL.helm, mtx(x, 1.6, z)]); Hd.push([SOL.head, mtx(x, 1.4, z)]);
    S.push([SOL.spear, mtx(x, 1.45, z + 0.32)]); Tp.push([SOL.tip, mtx(x, 3.0, z + 0.32)]);
  }
  return [mergeGeos(A), mergeGeos(Hd), mergeGeos(S), mergeGeos(Tp)];
};
const army = new THREE.Group(); world.add(army);
const blocks = [];
{ const tmpl = blockGeos(8, 12, 1.25, 5);
  for (let ix = 0; ix < 7; ix++) for (let iz = 0; iz < 5; iz++) {
    const g = new THREE.Group(); g.position.set(34 + ix * 15, 0, (iz - 2) * 19 + (ix % 2) * 3); army.add(g);
    add(tmpl[0], MX.armor, 0, 0, 0, g); add(tmpl[1], MX.skin, 0, 0, 0, g, { cast: false }); add(tmpl[2], MX.spear, 0, 0, 0, g, { cast: false }); add(tmpl[3], MX.tassel, 0, 0, 0, g, { cast: false });
    for (const dz of [-5, 5]) mkFlag(g, -5.5, 0, dz, MX.flagWei, 5.2);
    g.userData.base = g.position.clone(); g.userData.ph = ix * 1.3 + iz * 0.7; blocks.push(g);
  } }
// trees: poplars and willows on the plain and in town
const poplar = (x, z, h = 9) => { const g = new THREE.Group(); g.position.set(x, 0, z); world.add(g); add(new THREE.CylinderGeometry(0.16, 0.22, 1.4, 6), MX.trunk, 0, 0.7, 0, g); const c = add(new THREE.SphereGeometry(1, 10, 10), MX.poplar, 0, 1.2 + h / 2, 0, g); c.scale.set(1.1, h / 2, 1.1); return g; };
const willow = (x, z) => { const g = new THREE.Group(); g.position.set(x, 0, z); world.add(g); add(new THREE.CylinderGeometry(0.25, 0.35, 3.4, 6), MX.trunk, 0, 1.7, 0, g); const c = add(new THREE.SphereGeometry(1, 12, 8), MX.willow, 0, 4.2, 0, g); c.scale.set(3.0, 2.2, 3.0); return g; };
const rt = P.rng(44);
for (let i = 0; i < 46; i++) { const x = 8 + rt() * 230, z = (rt() < 0.5 ? -1 : 1) * (70 + rt() * 160); poplar(x, z, 7 + rt() * 5); }
for (let i = 0; i < 10; i++) { const x = 8 + rt() * 20, z = (rt() < 0.5 ? -1 : 1) * (10 + rt() * 40); (i % 2 ? willow : poplar)(x, z, 8); }
for (const [x, z] of [[-20, -7], [-42, 6], [-30, -28], [-12, -24]]) willow(x, z);
// hills + mountains + clouds
for (let i = 0; i < 18; i++) { const a = rt() * Math.PI * 2, d = 260 + rt() * 200; const h = add(new THREE.SphereGeometry(50 + rt() * 50, 20, 10), i % 2 ? MX.hill : MX.hillFar, Math.cos(a) * d, -14, Math.sin(a) * d, world, { cast: false }); h.scale.y = 0.45 + rt() * 0.3; }
for (let i = 0; i < 16; i++) { const a = rt() * Math.PI * 2, d = 560 + rt() * 220, hh = 140 + rt() * 140, r_ = 110 + rt() * 80; const g = new THREE.Group(); g.position.set(Math.cos(a) * d, -5, Math.sin(a) * d); world.add(g); add(new THREE.ConeGeometry(r_, hh, 7), MX.mount, 0, hh / 2, 0, g, { cast: false }); add(new THREE.ConeGeometry(r_ * 0.3, hh * 0.3, 7), MX.snow, 0, hh * 0.86, 0, g, { cast: false }); }
const clouds = [];
{ const r = P.rng(90);
  for (let i = 0; i < 14; i++) {
    const c = document.createElement('canvas'); c.width = 600; c.height = 400; const pen = new T.Pen(c.getContext('2d')); pen.ol = 0;
    pen.g.translate(300, 200); pen.g.scale(1.4, 1.2); pen.g.translate(-300, -200); T.fxCloud(pen, i + 1);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.667), new THREE.MeshBasicMaterial({ map: P.tex(c), transparent: true, fog: false, depthWrite: false }));
    const a = r() * Math.PI * 2, d = 650 + r() * 250; m.position.set(Math.cos(a) * d, 120 + r() * 160, Math.sin(a) * d); m.scale.setScalar(160 + r() * 140);
    m.userData.ndSkip = true; m.renderOrder = -1; scene.add(m); clouds.push(m);
  } }

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
  inkU.sat.value = L.sat; inkU.gain.value.set(L.gain || '#ffffff'); inkU.lift.value.set(L.lift || '#000000');
}
function placeSun(L, focus) {
  // sun direction from azimuth/elevation in world space
  const az = rx(L.az), el = rx(L.el); tmpV.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  skyU.sunDir.value.copy(tmpV);
  sun.position.copy(focus).addScaledVector(tmpV, 80); sun.target.position.copy(focus);
  const ext = L.shadowExt || 30, sc = sun.shadow.camera; sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 200; sc.updateProjectionMatrix();
}

function worldState(S, f) {
  // gate doors: 0 closed .. 1 wide open (swing inward)
  for (const g of doors) g.rotation.y = g.userData.s * (S.doors || 0) * 1.75;
  // army: advance offset (m along +x from the rest line), visibility, marching bob
  army.visible = S.army !== false;
  const adv = S.armyX || 0, marching = !!S.marching;
  for (const b of blocks) {
    b.position.copy(b.userData.base); b.position.x += adv;
    b.position.y = marching ? Math.abs(Math.sin(f * 0.32 + b.userData.ph)) * 0.08 : 0;
    b.rotation.y = S.armyTurn ? Math.PI * S.armyTurn : 0;
  }
  // flags wave
  for (const cl of flags) {
    const pa = cl.geometry.attributes.position, base = cl.userData.cloth;
    for (let i = 0; i < pa.count; i++) { const x = base[i * 3], y = base[i * 3 + 1]; pa.setZ(i, Math.sin(f * 0.2 + cl.userData.ph + x * 3.4 + y * 1.1) * 0.11 * (x + 0.5)); }
    pa.needsUpdate = true;
  }
  // the lost pass: green flag drops, red flag springs up
  passFlags.shu.rotation.x = -Math.min(1.5, S.shuDrop || 0);
  passFlags.wei.scale.y = Math.max(0.001, S.weiUp ?? 1); passFlags.wei.visible = (S.weiUp ?? 1) > 0.01;
  // map
  const mk = JSON.stringify(S.map || {});
  if (mk !== mapKey) { mapKey = mk; P.warMap(mapCanvas, S.map || {}); mapTex.needsUpdate = true; }
  incense.rotation.y = f * 0.01; zitherG.visible = !!S.zither;
}

function drawActors(list, cam) {
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  list.forEach((a, i) => {
    const c = getCard(i);
    c.draw(a.key, a.draw);
    c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z);
    const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s, s);
    c.mesh.rotation.set(0, Math.atan2(cam.position.x - a.x, cam.position.z - a.z) + (a.yaw || 0), a.roll || 0);
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
