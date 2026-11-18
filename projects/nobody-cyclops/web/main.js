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
const DECK = 0, CR = 15; // ground, cave radius
const world = new THREE.Group(); scene.add(world);
const MX = {
  rock: texM(P.rockFace(41), 9, 4, '#c8b8a4'), rockOut: texM(P.rockFace(42, 34, 12, 56), 8, 4, '#c8bca8'), boulder: texM(P.rockFace(44, 28, 10, 50), 3, 2, '#b0a494'), hillTex: texM(P.mossy(P.rockFace(43, 80, 24, 46), 48, 1.6), 12, 5, '#9cc070'),
  grass: texM(P.grass(45), 120, 120), floor: texM(P.dirt(46), 8, 8, '#a08a70'), sand: texM(P.sand(47), 60, 12),
  sea: toon({ color: '#2f7fae' }), seaFar: toon({ color: '#3a8cba' }), wood: toon({ color: '#8a5a34' }), woodDark: toon({ color: '#5a3a22' }),
  cheese: toon({ color: '#f2c84a' }), straw: toon({ color: '#d9b85a' }), wicker: toon({ color: '#a07a48' }), ember: new THREE.MeshBasicMaterial({ color: '#ffb040' }),
  hill: toon({ color: '#6f9a48' }), hillFar: toon({ color: '#7fa65c' }), cliff: toon({ color: '#9c9080' }), sail: null, hullRed: toon({ color: '#b4312c' }), eye: toon({ color: '#f4efe2' }),
};
{ const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#f4ead2' : '#b4312c'; g.fillRect(i * 32, 0, 32, 256); } MX.sail = toon({ map: P.tex(c), side: THREE.DoubleSide }); }
const ground = add(new THREE.PlaneGeometry(4000, 4000), MX.grass, 0, 0, 0, world, { cast: false }); ground.rotation.x = -Math.PI / 2;
// sea + beach (toward +z)
const sand = add(new THREE.PlaneGeometry(400, 40), MX.sand, 0, 0.03, 52, world, { cast: false }); sand.rotation.x = -Math.PI / 2;
const sea = add(new THREE.PlaneGeometry(4000, 2000), MX.sea, 0, 0.12, 1062, world, { cast: false }); sea.rotation.x = -Math.PI / 2; sea.userData.nd = waterNd;
// the cave: a rock dome open toward +z
const GAP = 0.8;
const domeGeo = new THREE.SphereGeometry(CR, 56, 24, Math.PI / 2 + GAP / 2, Math.PI * 2 - GAP, 0, Math.PI / 2);
const dome = add(domeGeo, MX.rock, 0, 0, 0, world); dome.material = MX.rock.clone(); dome.material.side = THREE.DoubleSide;
const shell = add(new THREE.SphereGeometry(CR + 1.2, 40, 18, Math.PI / 2 + GAP / 2 + 0.05, Math.PI * 2 - GAP - 0.1, 0, Math.PI / 2), MX.hillTex, 0, -0.5, 0, world);
const lintel = add(new THREE.SphereGeometry(5.2, 20, 12), MX.rockOut, 0, 11.6, 14.2, world); lintel.scale.set(1.3, 0.75, 0.6);
{ const rr = P.rng(70); for (let i = 0; i < 14; i++) { const a = rr() * Math.PI * 2; if (Math.sin(a) > 0.7) continue; const rad_ = 3 + rr() * 4, d_ = CR + 1.8 + rad_; const r = add(new THREE.SphereGeometry(rad_, 12, 8), MX.rockOut, Math.cos(a) * d_, rr() * 2, Math.sin(a) * d_, world); r.scale.set(1, 0.6 + rr() * 0.5, 1); } }
const floor = add(new THREE.CircleGeometry(CR - 0.2, 48), MX.floor, 0, 0.02, 0, world, { cast: false }); floor.rotation.x = -Math.PI / 2;
// boulder door (rolls between "aside" and "closed")
const BOULDER = new THREE.Group(); world.add(BOULDER);
const bMesh = add(new THREE.SphereGeometry(5.0, 24, 16), MX.boulder, 0, 0, 0, BOULDER); bMesh.scale.set(1, 0.95, 0.7);
const B_CLOSED = [0, 4.6, 14.4], B_OPEN = [-10.5, 4.6, 16.5];
// cheese racks along the back wall
for (const [x, z, ry] of [[-6, -12, 0.35], [0, -13.4, 0], [6, -12, -0.35]]) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; world.add(g);
  for (const dx of [-2.2, 2.2]) add(new THREE.BoxGeometry(0.18, 3.6, 0.18), MX.wood, dx, 1.8, 0, g);
  for (const y of [0.9, 1.9, 2.9]) { add(new THREE.BoxGeometry(4.6, 0.12, 0.9), MX.wood, 0, y, 0, g); for (let k = -3; k <= 3; k += 1.5) add(new THREE.CylinderGeometry(0.42, 0.42, 0.34, 14), MX.cheese, k * 0.6, y + 0.23, 0, g); }
}
// sheep pen (wicker fence)
{ const g = new THREE.Group(); g.position.set(8.5, 0, -2); world.add(g);
  for (let i = 0; i < 9; i++) { const a = -0.3 + i * 0.4; add(new THREE.CylinderGeometry(0.09, 0.09, 1.3, 6), MX.wicker, Math.cos(a) * 3.2, 0.65, Math.sin(a) * 3.2, g); }
  for (const y of [0.45, 0.95]) { const t = add(new THREE.TorusGeometry(3.2, 0.07, 6, 32, 3.2), MX.wicker, 0, y, 0, g); t.rotation.x = Math.PI / 2; t.rotation.z = -0.3; } }
// fire pit
const FIRE = [-4.2, 0, -3.2];
for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; add(new THREE.SphereGeometry(0.32, 8, 6), MX.cliff, FIRE[0] + Math.cos(a) * 1.0, 0.2, FIRE[2] + Math.sin(a) * 1.0, world); }
for (const a of [0.3, 1.9, 3.6]) { const l = add(new THREE.CylinderGeometry(0.13, 0.13, 1.6, 6), MX.woodDark, FIRE[0], 0.25, FIRE[2], world); l.rotation.set(Math.PI / 2, 0, a); }
const fireLight = new THREE.PointLight('#ff9a48', 0, 60, 1.2); fireLight.position.set(FIRE[0], 2.2, FIRE[2]); scene.add(fireLight);
// straw pile (where the stake hides)
const STRAW = [-8.6, 0, 2.6];
const straw = add(new THREE.SphereGeometry(2.0, 16, 10), MX.straw, STRAW[0], 0, STRAW[2], world); straw.scale.set(1.3, 0.55, 1);
// the stake: a long pole with a glowing tip
const STAKE = new THREE.Group(); world.add(STAKE);
add(new THREE.CylinderGeometry(0.075, 0.09, 5, 8), MX.wood, 0, 0, 0, STAKE).rotation.z = Math.PI / 2;
const tip = add(new THREE.ConeGeometry(0.085, 0.5, 8), MX.wood, 2.8, 0, 0, STAKE); tip.rotation.z = -Math.PI / 2;
const glow = add(new THREE.SphereGeometry(0.28, 10, 8), MX.ember, 3.0, 0, 0, STAKE, { cast: false }); glow.userData.ndSkip = true;
// the Greek ship
const SHIP = new THREE.Group(); world.add(SHIP);
{ const hull = add(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), MX.wood, 0, 0.9, 0, SHIP); hull.scale.set(8, 1.8, 2.0);
  add(new THREE.BoxGeometry(14.5, 0.22, 3.6), MX.woodDark, 0, 0.92, 0, SHIP);
  add(new THREE.BoxGeometry(15.5, 0.35, 0.2), MX.hullRed, 0, 1.05, 2.0, SHIP); add(new THREE.BoxGeometry(15.5, 0.35, 0.2), MX.hullRed, 0, 1.05, -2.0, SHIP);
  const prow = add(new THREE.TorusGeometry(1.6, 0.22, 8, 16, Math.PI * 0.8), MX.wood, 7.4, 2.0, 0, SHIP); prow.rotation.z = -0.4;
  const stern = add(new THREE.TorusGeometry(1.4, 0.2, 8, 16, Math.PI * 0.9), MX.wood, -7.6, 2.0, 0, SHIP); stern.rotation.z = Math.PI * 0.55;
  add(new THREE.SphereGeometry(0.28, 10, 8), MX.eye, 7.9, 1.25, 1.85, SHIP); add(new THREE.SphereGeometry(0.28, 10, 8), MX.eye, 7.9, 1.25, -1.85, SHIP);
  add(new THREE.CylinderGeometry(0.16, 0.2, 9, 8), MX.woodDark, 0.5, 5.3, 0, SHIP);
  add(new THREE.CylinderGeometry(0.1, 0.1, 8, 6), MX.woodDark, 0.5, 8.8, 0, SHIP).rotation.x = Math.PI / 2;
  const sail = add(new THREE.PlaneGeometry(7.6, 5.4), MX.sail, 0.7, 6.1, 0, SHIP); sail.rotation.y = Math.PI / 2;
  for (let i = -5; i <= 5; i++) for (const s of [-1, 1]) { const o = add(new THREE.BoxGeometry(0.12, 0.12, 3.2), MX.woodDark, i * 1.1, 0.9, s * 3.0, SHIP); o.rotation.x = s * 0.5; } }
// neighbour hills with their own caves, and far islands
const HILLS = [[-78, 0, -40, 26], [70, 0, -62, 30]];
for (const [x, y, z, r] of HILLS) { const h = add(new THREE.SphereGeometry(r, 24, 14), MX.hill, x, -r * 0.35, z, world); h.scale.set(1.2, 0.85, 1); }
{ const rr = P.rng(80); for (let i = 0; i < 18; i++) { const a = Math.PI + rr() * Math.PI, d = 160 + rr() * 400; const h = add(new THREE.SphereGeometry(40 + rr() * 60, 18, 10), i % 2 ? MX.hill : MX.hillFar, Math.cos(a) * d, -20, Math.sin(a) * d, world, { cast: false }); h.scale.set(1.4, 0.55 + rr() * 0.4, 1); }
  for (let i = 0; i < 4; i++) { const h = add(new THREE.ConeGeometry(30 + rr() * 30, 30 + rr() * 30, 8), MX.cliff, -300 + i * 220, 10, 520 + rr() * 300, world, { cast: false }); } }
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
  const k = S.boulder ?? 1, rp = S.boulderRoll ?? 0;
  BOULDER.position.set(B_OPEN[0] + (B_CLOSED[0] - B_OPEN[0]) * k, B_CLOSED[1], B_OPEN[2] + (B_CLOSED[2] - B_OPEN[2]) * k);
  bMesh.rotation.set(0, 0, (rp + k) * 2.1);
  STAKE.visible = !!S.stake; if (S.stake) { STAKE.position.set(...S.stake.pos); STAKE.rotation.set(0, S.stake.yaw || 0, S.stake.pitch || 0); glow.visible = (S.stake.glow || 0) > 0.05; glow.scale.setScalar(0.6 + (S.stake.glow || 0) * 0.6); }
  SHIP.visible = S.ship !== false; const sh = S.ship || { x: 2, z: 62 };
  SHIP.position.set(sh.x, 0.1 + Math.sin(f * 0.07) * 0.12, sh.z); SHIP.rotation.set(Math.sin(f * 0.05) * 0.03, sh.yaw || 0, Math.sin(f * 0.06) * 0.025);
  fireLight.intensity = (S.fire || 0) * (1 + 0.12 * Math.sin(f * 0.9) + 0.08 * Math.sin(f * 2.3));
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
