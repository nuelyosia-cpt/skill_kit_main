// Shot plan for "The Empty Fort": timed to voice.mp3 (61.0 s, 30 fps). See work/PLAN.md.
import { M as E, camFromKeys, idle, blinkAt, walk, q, clamp, lerp, ramp } from './motion.js';
export const FPS = 30, TOTAL = 1831, DECK = 0;
const WH = 7; // wall top
export const SHOTS = [
  { id: 'hook', a: 0, b: 94, light: 'day' },
  { id: 'map', a: 95, b: 219, light: 'day' },
  { id: 'zhuge', a: 220, b: 340, light: 'day' },
  { id: 'masu', a: 341, b: 445, light: 'day' },
  { id: 'army', a: 446, b: 651, light: 'day' },
  { id: 'simayi', a: 652, b: 762, light: 'day' },
  { id: 'inside', a: 763, b: 938, light: 'day' },
  { id: 'dilemma', a: 939, b: 1022, light: 'day' },
  { id: 'strange', a: 1023, b: 1101, light: 'day' },
  { id: 'gates', a: 1102, b: 1222, light: 'day' },
  { id: 'zither', a: 1223, b: 1324, light: 'day' },
  { id: 'stare', a: 1325, b: 1461, light: 'day' },
  { id: 'trap', a: 1462, b: 1565, light: 'drama' },
  { id: 'retreat', a: 1566, b: 1730, light: 'day' },
  { id: 'moral', a: 1731, b: 1830, light: 'golden' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const smooth = E.smooth;

// ---------- lights ----------
export const LIGHTS = {
  day: { az: 120, el: 48, sky: '#c4d6f2', ground: '#8a8262', hemi: 1.15, sun: '#fff1dc', sunI: 2.5, fog: '#d2e0ee', fogNear: 90, fogFar: 1000,
    skyTop: '#4a86d6', skyHor: '#cfe0f2', sat: 1.1, vig: 0.2, shadowExt: 18 },
  drama: { az: 150, el: 30, sky: '#aab8d8', ground: '#6a6250', hemi: 1.0, sun: '#ffe2c0', sunI: 2.6, fog: '#c2cce0', fogNear: 70, fogFar: 800,
    skyTop: '#46609a', skyHor: '#c0cce2', sat: 1.08, vig: 0.32, shadowExt: 16 },
  golden: { az: 20, el: 12, sky: '#9a90c8', ground: '#6a4c40', hemi: 1.0, sun: '#ffb46c', sunI: 2.9, fog: '#f0b88c', fogNear: 80, fogFar: 900,
    skyTop: '#6f6eb0', skyHor: '#ffc27e', sunDisc: '#fff0c8', sunSize: 0.0035, sat: 1.12, gain: '#fff2e2', vig: 0.26, shadowExt: 22 },
};
export const lightFor = (S, f) => {
  const L = { ...LIGHTS[S.light] };
  if (S.id === 'army' || S.id === 'retreat') L.shadowExt = 60;
  if (S.id === 'map') L.shadowExt = 6;
  return L;
};

// ---------- positions ----------
const ZG = [1.45, WH, 0];          // Zhuge standing on the tower
const ZS = [1.5, WH - 0.3, 0];    // Zhuge seated behind the zither (lower body hidden by the floor and the table)
const FACE_STAND = 1.48, FACE_SEAT = WH - 0.3 + 1.48;
const MAP = [-20, 0.86, -30], PASS = [170, 26.5, -230];
const HORSE_Y = 0.85; // rider card sole height on the horse
// face-at-35% helper: look slightly below the face so the face sits in the upper part of the frame
const frame = (pos, face, fov, k = 0.3) => { const d = Math.hypot(pos[0] - face[0], pos[1] - face[1], pos[2] - face[2]); return [face[0], face[1] - k * d * Math.tan(fov * Math.PI / 360), face[2]]; };
const simaAt = (f) => { // Sima Yi's horse position (x along the road), walking in during "stare"
  if (f < 1325) return 20;
  return lerp(27, 15.5, E.easeOut(ramp(f, 1325, 1392)));
};

// ---------- cameras ----------
const zf = [ZG[0], WH + FACE_STAND, 0], zs = [ZS[0], FACE_SEAT, 0];
const CAMS = {
  hook: [
    { f: 0, pos: [17, 1.7, 2.6], look: [1.5, 3.4, 0], fov: 42 },
    { f: 94, pos: [8.2, 2.3, 0.9], look: [-2, 2.6, 0], fov: 46 },
  ],
  map: [
    { f: 95, pos: [MAP[0] + 0.3, MAP[1] + 4.9, MAP[2] + 0.95], look: [MAP[0], MAP[1], MAP[2] + 0.5], fov: 44, roll: -6 },
    { f: 219, pos: [MAP[0] + 0.1, MAP[1] + 4.55, MAP[2] + 0.9], look: [MAP[0], MAP[1], MAP[2] + 0.5], fov: 44, roll: 0 },
  ],
  zhuge: [
    { f: 220, pos: [7.2, 8.7, 1.6], look: frame([7.2, 8.7, 1.6], zf, 34), fov: 34 },
    { f: 340, pos: [5.4, 8.6, 1.1], look: frame([5.4, 8.6, 1.1], zf, 31), fov: 31, roll: -2 },
  ],
  masu: [
    { f: 341, pos: [PASS[0] + 3.6, PASS[1] + 2.0, PASS[2] + 7.6], look: [PASS[0] + 0.5, PASS[1] + 1.0, PASS[2] + 0.6], fov: 44 },
    { f: 445, pos: [PASS[0] + 3.0, PASS[1] + 1.9, PASS[2] + 6.6], look: [PASS[0] + 0.5, PASS[1] + 1.05, PASS[2] + 0.6], fov: 42 },
  ],
  army: [
    { f: 446, pos: [175, 34, 70], look: [110, 2, 4], fov: 52 },
    { f: 560, pos: [110, 30, 60], look: [52, 3, 0], fov: 50, path: [[150, 34, 72]] },
    { f: 651, pos: [58, 24, 34], look: [4, 5, 0], fov: 44 },
  ],
  simayi: [
    { f: 652, pos: [12.4, 1.3, 4.6], look: [20.5, 2.3, 1.6], fov: 38 },
    { f: 762, pos: [13.6, 1.4, 3.8], look: [20.5, 2.2, 1.7], fov: 33, roll: 2 },
  ],
  inside: [
    { f: 763, pos: [-3, 9.5, 9], look: [-15, 1.2, -1.5], fov: 52 },
    { f: 852, pos: [-9.6, 2.1, -4.6], look: [-15.2, 1.15, -5.0], fov: 38 },
    { f: 872, pos: [-9.8, 2.05, -4.4], look: [-15.2, 1.15, -4.9], fov: 37 },
    { f: 886, pos: [-9.8, 2.05, -0.8], look: [-15.8, 1.15, -0.9], fov: 37 },
    { f: 902, pos: [-9.8, 2.05, -0.6], look: [-15.8, 1.15, -0.9], fov: 36 },
    { f: 918, pos: [-8.8, 2.3, 3.6], look: [-15.6, 1.4, 3.9], fov: 40 },
    { f: 938, pos: [-9.3, 2.3, 3.7], look: [-15.6, 1.4, 3.9], fov: 38 },
  ],
  dilemma: [
    { f: 939, pos: [4.6, 8.75, 0.7], look: frame([4.6, 8.75, 0.7], zf, 32), fov: 32 },
    { f: 1022, pos: [4.2, 8.7, 0.6], look: frame([4.2, 8.7, 0.6], zf, 31), fov: 31 },
  ],
  strange: [
    { f: 1023, pos: [4.2, 8.7, 0.6], look: frame([4.2, 8.7, 0.6], zf, 31), fov: 31 },
    { f: 1080, pos: [3.3, 8.6, 0.25], look: frame([3.3, 8.6, 0.25], zf, 26, 0.22), fov: 26, roll: -3 },
    { f: 1101, pos: [3.25, 8.6, 0.24], look: frame([3.25, 8.6, 0.24], zf, 25.5, 0.22), fov: 25.5, roll: -3 },
  ],
  gates: [
    { f: 1102, pos: [-10.5, 1.8, 0.7], look: [6, 1.9, 0], fov: 44 },
    { f: 1222, pos: [-6.2, 1.7, 0.5], look: [6, 1.9, 0], fov: 42 },
  ],
  zither: [
    { f: 1223, pos: [13, 1.8, 2.2], look: [2, 4.6, 0], fov: 46 },
    { f: 1272, pos: [7.4, 8.3, 1.7], look: frame([7.4, 8.3, 1.7], zs, 34), fov: 34, ease: 'easeOut' },
    { f: 1324, pos: [6.6, 8.2, 1.5], look: frame([6.6, 8.2, 1.5], zs, 32), fov: 32 },
  ],
  stare: [
    { f: 1325, pos: [12.5, 2.3, 9.5], look: [20, 2.0, 1.0], fov: 44 },
    { f: 1395, pos: [11.4, 1.5, 4.4], look: [15.5, 2.3, 1.0], fov: 36 },
    { f: 1461, pos: [12.0, 1.5, 3.8], look: [15.5, 2.3, 1.0], fov: 32 },
  ],
  trap: [
    { f: 1462, pos: [17.5, 2.4, 1.2], look: [1.5, 6.9, 0], fov: 40 },
    { f: 1520, pos: [16.0, 2.6, 1.0], look: [1.5, 7.1, 0], fov: 35 },
    { f: 1521, pos: [12.6, 2.0, 3.0], look: [15.5, 2.2, 1.0], fov: 32 },
    { f: 1565, pos: [13.6, 2.1, 2.2], look: [15.5, 2.25, 1.0], fov: 26, roll: 4 },
  ],
  retreat: [
    { f: 1566, pos: [44, 18, 34], look: [52, 2, 0], fov: 50 },
    { f: 1630, pos: [40, 16, 30], look: [64, 2, 0], fov: 50 },
    { f: 1665, pos: [-2.9, 8.7, 0.35], look: [8, 7.3, -0.4], fov: 44, ease: 'smooth' },
    { f: 1730, pos: [-2.5, 8.6, 0.3], look: [8, 7.3, -0.4], fov: 41 },
  ],
  moral: [
    { f: 1731, pos: [5.6, 8.4, 1.3], look: frame([5.6, 8.4, 1.3], zs, 32), fov: 32 },
    { f: 1816, pos: [4.8, 8.3, 1.05], look: frame([4.8, 8.3, 1.05], zs, 30), fov: 30 },
    { f: 1830, pos: [16, 12, 13], look: [0, 6.5, 0], fov: 44, ease: 'smooth' },
  ],
};
const KICKS = [{ f: 1505, a: 0.04 }, { f: 1302, a: 0.025 }];
export const camAt = (f) => {
  const S = shotAt(f), K = CAMS[S.id];
  const c = camFromKeys(K, f, { kicks: KICKS });
  // the trap shot has a hard cut at 1521 (POV of the wall → Sima Yi)
  c.flash = f >= 95 && f < 99 ? 0.5 * (1 - (f - 95) / 4) : f >= 1300 && f < 1305 ? 0.18 * (1 - (f - 1300) / 5) : 0;
  if (S.id === 'map') c.shadowAt = MAP;
  if (S.id === 'masu') c.shadowAt = PASS;
  if (S.id === 'army' || S.id === 'retreat' && f < 1650) c.shadowAt = [60, 0, 0];
  if (S.id === 'inside') c.shadowAt = [-15, 0, -1];
  if (['zhuge', 'dilemma', 'strange', 'zither', 'moral'].includes(S.id) || (S.id === 'retreat' && f >= 1650)) c.shadowAt = [1.5, WH, 0];
  if (S.id === 'simayi' || S.id === 'stare' || (S.id === 'trap' && f >= 1521)) c.shadowAt = [simaAt(f), 0, 1.5];
  if (S.id === 'gates') c.shadowAt = [3, 0, 0];
  if (S.id === 'hook') c.shadowAt = [2, 0, 0];
  return c;
};

// ---------- lens ----------
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  switch (S.id) {
    case 'hook': return { focus: dist(C.pos, [1.5, 2.5, 0]), cinf: 4 };
    case 'map': return { focus: dist(C.pos, MAP), cinf: 6 };
    case 'zhuge': case 'dilemma': case 'strange': return { focus: dist(C.pos, zf), cinf: 11 };
    case 'masu': return { focus: dist(C.pos, [PASS[0], PASS[1] + 1.4, PASS[2] + 1.2]), cinf: 7 };
    case 'army': return { focus: 60, cinf: 0 };
    case 'simayi': return { focus: dist(C.pos, [20, 2.3, 1.6]), cinf: 10 };
    case 'inside': return { focus: dist(C.pos, C.look), cinf: f < 840 ? 0 : 9 };
    case 'gates': return { focus: dist(C.pos, [4, 1.5, 0]), cinf: 5 };
    case 'zither': return { focus: dist(C.pos, zs), cinf: lerp(0, 10, smooth(ramp(f, 1250, 1275))) };
    case 'stare': return { focus: dist(C.pos, [simaAt(f), 2.3, 1.2]), cinf: 8 };
    case 'trap': return f < 1521 ? { focus: dist(C.pos, [2, 7.5, 0]), cinf: 6 } : { focus: dist(C.pos, [15.5, 2.3, 1.2]), cinf: 12 };
    case 'retreat': return f < 1650 ? { focus: 60, cinf: 0 } : { focus: dist(C.pos, zs), cinf: 6 };
    case 'moral': return { focus: dist(C.pos, zs), cinf: lerp(9, 0, smooth(ramp(f, 1808, 1830))) };
  }
  return { focus: 10, cinf: 0 };
};

// ---------- world state ----------
export const worldAt = (f) => {
  const S = shotAt(f), W = { zither: ['zither', 'trap', 'moral'].includes(S.id), doors: 0, army: true, armyX: 0, marching: false, shuDrop: 0, weiUp: 0, map: {} };
  // gate doors
  if (S.id === 'hook') W.doors = E.back(ramp(f, 40, 80), 1.2);
  else if (S.id === 'gates') W.doors = E.back(ramp(f, 1114, 1140), 1.3);
  else if (f >= 1102) W.doors = 1;
  else W.doors = 0;
  // army
  if (S.id === 'hook' || S.id === 'map' || S.id === 'inside' || S.id === 'masu' || S.id === 'moral') W.army = false;
  if (S.id === 'army') { W.armyX = lerp(80, 0, smooth(ramp(f, 446, 651))); W.marching = true; }
  if (S.id === 'zhuge' || S.id === 'dilemma' || S.id === 'strange') W.armyX = 0;
  if (S.id === 'retreat') { W.armyTurn = E.smooth(ramp(f, 1585, 1610)); W.armyX = lerp(0, 160, E.easeIn(ramp(f, 1605, 1730)) * 0.4 + ramp(f, 1605, 1730) * 0.6); W.marching = f > 1600; }
  // the lost pass
  if (S.id === 'masu') { W.shuDrop = 1.5 * E.easeIn(ramp(f, 404, 418)); W.weiUp = E.back(ramp(f, 418, 432), 2.2); }
  // the map
  if (S.id === 'map') W.map = { year: q(smooth(ramp(f, 116, 130)), 2), split: q(3 * smooth(ramp(f, 176, 208)), 2), xc: 0 };
  return W;
};

// ---------- actors (2D cards) ----------
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const HRS = (T, o, pos, extra = {}) => ({ key: 'horse' + JSON.stringify(o), draw: (p) => T.horseCard(p, o), x: pos[0], y: pos[1], z: pos[2], s: 1.8, ...extra });
const life = (f, seed, o = {}) => { const I = idle(f, seed); return { seed, blink: blinkAt(f, seed), bob: q(I.bob, 3), tilt: q(I.tilt, 1), headTilt: q(I.headTilt, 1), ...o }; };
const towardCam = (pos, cam, d) => { const v = [cam[0] - pos[0], 0, cam[2] - pos[2]], l = Math.hypot(v[0], v[2]) || 1; return [pos[0] + v[0] / l * d, pos[1], pos[2] + v[2] / l * d]; };

const zhugeStand = (T, f, o = {}) => R(T, 'zhuge', life(f, 5, { L: 'hang', R: 'fan', prop: 'fan', fanSwing: q(10 * Math.sin(f * 0.12), 0), expr: 'calm', ...o }), ZG, { ground: WH, blob: false });
const zhugeSeat = (T, f, o = {}) => { const pk = Math.abs(Math.sin(f * 0.55)); return R(T, 'zhuge', life(f, 5, { L: 'play', R: 'play', pluck: q(pk, 1), expr: 'calm', bob: 0, ...o }), ZS, { blob: false, shadow: false }); };
const simaRide = (T, f, x, o = {}, step = 0, cam) => {
  const hp = [x, 0, 1.4], rider = towardCam([x - 0.25, HORSE_Y, 1.4], cam, -0.18);
  return [HRS(T, { col: '#3a2a26', mane: '#1a1414', saddle: '#7a1e22', step: q(step, 2) }, hp, { flip: true }),
    R(T, 'simayi', life(f, 9, { L: 'hang', R: 'hang', expr: 'stern', ...o }), rider, { blob: false })];
};
const weiRank = (T, f, x0, n, z0 = -4, dz = 2.0, extra = {}) => { const out = []; for (let i = 0; i < n; i++) out.push(R(T, i % 2 ? 'wei' : 'wei2', life(f, 20 + i, { R: 'hang', expr: 'stern' }), [x0 + (i % 3) * 0.9, 0, z0 + i * dz], extra)); return out; };

export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [], cam = camAt(f).pos;
  const tint = S.light === 'golden' ? '#ffe2c8' : S.light === 'drama' ? '#eef0ff' : '#ffffff';
  switch (S.id) {
    case 'hook': break;
    case 'map': break;
    case 'zhuge': {
      const worried = f >= 300;
      out.push(zhugeStand(T, f, { expr: worried ? 'worried' : f > 232 && f < 250 ? 'smile' : 'calm', look: worried ? 0.4 : 0, fanSwing: worried ? 0 : q(14 * Math.sin(f * 0.14), 0) }));
      break;
    }
    case 'masu': {
      const shrug = f >= 408;
      out.push(R(T, 'masu', life(f, 13, { L: shrug ? 'cheek' : 'thumb', R: shrug ? 'cheek' : 'hip', expr: shrug ? 'shock' : 'nervous', look: f < 400 ? 0.5 : 0 }), [PASS[0] + 0.2, PASS[1], PASS[2] + 1.2], { ground: PASS[1] }));
      break;
    }
    case 'army': break;
    case 'simayi': {
      out.push(...simaRide(T, f, 20, { expr: f >= 727 ? 'squint' : 'stern', look: -0.3 }, 0, cam).map((a) => ({ ...a, tint })));
      out.push(...weiRank(T, f, 26, 5, -3.5, 2.2, { tint }));
      break;
    }
    case 'inside': {
      const lad = q(Math.sin(f * 0.35), 1);
      out.push(R(T, 'cook', life(f, 31, { L: 'hang', R: 'hold', prop: 'ladle', expr: f > 862 ? 'grin' : 'neutral', headTilt: q(lad * 3, 1), look: 0.4 }), [-15.2, 0, -4.9], {}));
      out.push(R(T, 'clerk', life(f, 32, { L: 'hug', R: 'hug', prop: 'scrolls', expr: f > 878 ? 'nervous' : 'neutral', look: 0.3 }), [-16.1, 0, -0.9], {}));
      const tr = f >= 900 ? q((f % 4) / 4, 2) : 0;
      out.push(HRS(T, { col: '#c8a070', mane: '#5a3a2a', saddle: null, tremble: tr, expr: 'nervous', headUp: 0.5 }, [-15.8 + (f % 2 ? 0.015 : -0.015) * (f >= 900 ? 1 : 0), 0, 3.8], { flip: true }));
      break;
    }
    case 'dilemma': {
      const look = f < 975 ? q(lerp(0, 0.9, smooth(ramp(f, 950, 960))), 2) : q(lerp(0.9, -0.9, smooth(ramp(f, 990, 1000))), 2);
      const shake = f > 1006 ? q(6 * Math.sin((f - 1006) * 0.9) * (1 - ramp(f, 1006, 1022)), 1) : 0;
      out.push(zhugeStand(T, f, { expr: 'worried', look, headTilt: shake, fanSwing: 0 }));
      break;
    }
    case 'strange': {
      const expr = f < 1052 ? 'worried' : f < 1078 ? 'squint' : 'smirk';
      const hold = f >= 1084 && f < 1087; // 3-frame eureka hold
      const ff = hold ? 1084 : f;
      out.push(zhugeStand(T, ff, { expr, look: 0, fanSwing: 0, fanLift: f > 1078 ? 1 : 0 }));
      break;
    }
    case 'gates': {
      for (const [i, z, seed] of [[0, -1.2, 41], [1, 1.3, 42]]) {
        const t = Math.max(0, f - 1150 - i * 6), sw = f >= 1150 ? q(Math.sin(t * 0.32 + i), 2) : 0;
        out.push(R(T, i ? 'sweepB' : 'sweepA', life(f, seed, { L: 'sweep', R: 'hang', sw, prop: 'broom', expr: 'whistle', look: 0.2 }), [4.2 + i * 1.6, 0, z], {}));
      }
      break;
    }
    case 'zither': {
      out.push(zhugeSeat(T, f, { expr: f >= 1295 ? 'calm' : 'smile' }));
      break;
    }
    case 'stare': {
      const x = simaAt(f), moving = f < 1392, st = moving ? walk(f, 1325, 2.2, 1.1).phase : 0;
      out.push(...simaRide(T, f, x, { expr: f < 1378 ? 'stern' : 'squint', look: -0.5, headTilt: -4 }, st, cam));
      out.push(...weiRank(T, f, 27, 4, -4, 2.6));
      break;
    }
    case 'trap': {
      if (f < 1521) { // POV: imagined soldiers pop up behind the merlons
        out.push(zhugeSeat(T, f, { expr: 'calm' }));
        const pops = [[-3.0, 1484], [3.0, 1489], [-4.7, 1494], [4.9, 1498], [-1.9, 1503], [2.0, 1507]];
        pops.forEach(([z, f0], i) => { const k = E.back(ramp(f, f0, f0 + 7), 2); if (k > 0) out.push(R(T, i % 2 ? 'wei' : 'wei2', { seed: 50 + i, R: 'hang', expr: 'grin', blink: 0 }, [2.0, WH - 1.65 + k * 1.7, z], { tint: '#9fb6ff', alpha: 0.82, blob: false, shadow: false })); });
      } else {
        out.push(...simaRide(T, f, 15.5, { expr: 'shock', look: -0.2, L: 'cheek', R: 'cheek' }, 0, cam));
      }
      break;
    }
    case 'retreat': {
      if (f >= 1640) out.push(R(T, 'zhuge', life(f, 5, { L: 'play', R: 'play', pluck: q(Math.abs(Math.sin(f * 0.55)), 1), prop: 'zither', expr: f > 1665 ? 'smile' : 'calm', bob: 0 }), [1.5, WH - 0.55, 0], { blob: false, shadow: false }));
      break;
    }
    case 'moral': {
      const expr = f >= 1808 && f < 1822 ? 'wink' : 'calm';
      out.push(R(T, 'zhuge', life(f, 5, { L: 'play', R: f >= 1790 ? 'fan' : 'play', prop: f >= 1790 ? 'fan' : undefined, fanSwing: q(8 * Math.sin(f * 0.15), 0), pluck: q(Math.abs(Math.sin(f * 0.5)), 1), expr, bob: 0 }), ZS, { blob: false, shadow: false, tint }));
      break;
    }
  }
  return out;
};

// ---------- 2D effects ----------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
const notes = (T, f, f0, base, out, spread = 1) => {
  for (let i = 0; i < 4; i++) {
    const t = ((f - f0) * 0.018 + i / 4) % 1; if (f < f0 + i * 8) continue;
    const x = base[0] + 0.1, y = base[1] + 0.2 + t * 2.4, z = base[2] + Math.sin(t * 6 + i * 2) * 0.5 * spread;
    out.push(FX('note' + (i % 2), (p) => T.fxNote(p, i % 2, '#1f2a44'), [x, y, z], 0.32, { alpha: q(Math.min(1, (1 - t) * 3), 2), roll: q(Math.sin(t * 5 + i) * 0.3, 2) }));
  }
};
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [];
  if (S.id === 'army') for (let i = 0; i < 8; i++) { // dust behind the marching blocks
    const k = q(((f * 0.01) + i / 8) % 1, 2), W = worldAt(f);
    out.push(FX('dust' + k, (p) => T.fxDust(p, k, '#e8d6b0'), [34 + W.armyX + 96 + (i % 4) * 6, 1, -40 + i * 10], 9, { tint: '#f2e2c4' }));
  }
  if (S.id === 'retreat' && f < 1660) for (let i = 0; i < 5; i++) {
    const k = q(((f * 0.012) + i / 8) % 1, 2), W = worldAt(f);
    out.push(FX('dust' + k, (p) => T.fxDust(p, k, '#e8d6b0'), [60 + W.armyX + (i % 3) * 10, 1, -52 + i * 8], 7, { tint: '#f2e2c4' }));
  }
  if (S.id === 'gates' && f >= 1150) for (const [i, z] of [[0, -1.2], [1, 1.3]]) {
    const t = q(((f - 1150 - i * 6) % 14) / 14, 2);
    out.push(FX('puff' + t, (p) => { p.g.translate(150, 700); T.fxPuff(p, t); }, [4.5 + i * 1.6, 0, z + 0.3], 0.6));
  }
  if (S.id === 'zither') {
    if (f >= 1291) notes(T, f, 1291, [1.9, FACE_SEAT - 0.6, 0], out);
    if (f >= 1300 && f < 1320) { const t = q((f - 1300) / 20, 2); out.push(FX('burst' + t, (p) => { p.g.translate(50, 250); T.fxBurst(p, t, '#fff3b0', 12); }, [1.4, FACE_SEAT - 1.1, -0.05], 1.6, { order: 1 })); }
  }
  if (S.id === 'retreat' && f >= 1640) notes(T, f, 1640, [1.4, FACE_SEAT - 0.6, 0], out);
  if (S.id === 'moral') notes(T, f, 1700, [1.9, FACE_SEAT - 0.6, 0], out);
  if (S.id === 'trap' && f >= 1521) for (let i = 0; i < 2; i++) {
    const t = ((f - 1521) * 0.04 + i * 0.5) % 1, cam = camAt(f).pos;
    out.push(FX('sweat', (p) => T.fxDrip(p), [15.3 + i * 0.5, HORSE_Y + 2.15 - t * 0.5, 1.6], 0.14));
  }
  if (S.id === 'masu' && f >= 418 && f < 434) { const t = q((f - 418) / 16, 2); out.push(FX('stars' + t, (p) => { p.g.translate(50, 300); T.fxStars(p, t); }, [PASS[0] + 0.2, PASS[1] + 2.0, PASS[2] + 1.3], 0.8)); }
  return out;
};
