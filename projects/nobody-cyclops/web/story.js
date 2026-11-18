// Shot plan for "How Odysseus Brought Down a Giant": timed to voice.mp3 (67.89 s, 30 fps). See work/PLAN.md.
import { M as E, camFromKeys, idle, blinkAt, walk, q, clamp, lerp, ramp } from './motion.js';
export const FPS = 30, TOTAL = 2037, DECK = 0;
export const SHOTS = [
  { id: 'hook', a: 0, b: 108, light: 'cave' },
  { id: 'sea', a: 109, b: 153, light: 'day' },
  { id: 'cave', a: 154, b: 260, light: 'cavein' },
  { id: 'giant', a: 261, b: 326, light: 'cavein' },
  { id: 'boulder', a: 327, b: 440, light: 'cave' },
  { id: 'dinner', a: 441, b: 500, light: 'cave' },
  { id: 'problem', a: 501, b: 713, light: 'cave' },
  { id: 'plan', a: 714, b: 785, light: 'cave' },
  { id: 'stake', a: 786, b: 868, light: 'cave' },
  { id: 'wine', a: 869, b: 989, light: 'cave' },
  { id: 'name', a: 990, b: 1148, light: 'cave' },
  { id: 'night', a: 1149, b: 1269, light: 'nightin' },
  { id: 'neigh', a: 1270, b: 1406, light: 'night' },
  { id: 'bed', a: 1407, b: 1546, light: 'night' },
  { id: 'dawn', a: 1547, b: 1760, light: 'dawn' },
  { id: 'door', a: 1761, b: 1845, light: 'dawn' },
  { id: 'brains', a: 1846, b: 1899, light: 'day' },
  { id: 'irony', a: 1900, b: 2036, light: 'storm' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const smooth = E.smooth;

// ---------- places ----------
const FIRE = [-4.2, 0, -3.2], STRAW = [-8.6, 0, 2.6];
const ODY = [-1.2, 0, 5.2];           // Odysseus' usual spot inside
const GS = 3.6, GEYE = (975 - 223) * 0.00225 * GS; // giant card scale and eye height (m)
const FACE = 1.48;
const HILL1 = [-78, 12.0, -40];        // neighbour hilltop
const SHIP0 = { x: 2, z: 62 };
const frame = (pos, face, fov, k = 0.3) => { const d = Math.hypot(pos[0] - face[0], pos[1] - face[1], pos[2] - face[2]); return [face[0], face[1] - k * d * Math.tan(fov * Math.PI / 360), face[2]]; };

// ---------- light ----------
export const LIGHTS = {
  day: { az: 70, el: 38, sky: '#cfe4f4', ground: '#8aa86a', hemi: 1.0, sun: '#fff1d8', sunI: 2.6, fog: '#cfe2ee', fogNear: 120, fogFar: 1600,
    skyTop: '#3f86d4', skyHor: '#d8ecf6', sat: 1.1, vig: 0.2, shadowExt: 30, fire: 0 },
  cavein: { az: 80, el: 40, sky: '#e8d8c0', ground: '#6a5a48', hemi: 0.75, sun: '#fff1d8', sunI: 2.4, fog: '#cfe2ee', fogNear: 120, fogFar: 1600,
    skyTop: '#3f86d4', skyHor: '#d8ecf6', sat: 1.08, vig: 0.28, shadowExt: 26, fire: 4 },
  cave: { az: 80, el: 40, sky: '#a88a70', ground: '#4a3428', hemi: 0.5, sun: '#ffd8a8', sunI: 0.5, fog: '#2a1a14', fogNear: 60, fogFar: 600,
    skyTop: '#2a3a5a', skyHor: '#6a7088', sat: 1.12, gain: '#fff0e0', lift: '#0c0604', vig: 0.34, shadowExt: 26, fire: 14 },
  nightin: { az: 80, el: 40, sky: '#4a5a8a', ground: '#1a1420', hemi: 0.42, sun: '#9ab0e0', sunI: 0.3, fog: '#141a2a', fogNear: 60, fogFar: 600,
    skyTop: '#0e1630', skyHor: '#2a3660', sat: 1.0, gain: '#e8ecff', lift: '#04060c', vig: 0.38, shadowExt: 26, fire: 6 },
  night: { az: 220, el: 34, sky: '#5a6aa0', ground: '#1c2030', hemi: 0.7, sun: '#b8c8ff', sunI: 1.2, fog: '#1a2440', fogNear: 120, fogFar: 1400,
    skyTop: '#0a1230', skyHor: '#34406e', sunDisc: '#f4f4ff', sunSize: 0.0025, sat: 0.95, gain: '#dfe6ff', lift: '#04060e', vig: 0.34, shadowExt: 60, fire: 0, cloud: '#6a7aa8', cloudOp: 0.5 },
  dawn: { az: 120, el: 14, sky: '#e8c0b0', ground: '#7a6a50', hemi: 1.05, sun: '#ffbe7c', sunI: 2.8, fog: '#f4c4a0', fogNear: 120, fogFar: 1400,
    skyTop: '#6f7ec0', skyHor: '#ffc89a', sunDisc: '#fff0c8', sunSize: 0.004, sat: 1.12, gain: '#fff2e2', lift: '#140c06', vig: 0.24, shadowExt: 40, fire: 0, cloud: '#ffd8c0' },
  storm: { az: 70, el: 30, sky: '#8a96a8', ground: '#4a5a4a', hemi: 0.85, sun: '#d8e0ea', sunI: 1.4, fog: '#6a7484', fogNear: 120, fogFar: 1200,
    skyTop: '#2a3240', skyHor: '#7a8494', sat: 0.92, gain: '#eef2f8', lift: '#06080a', vig: 0.3, shadowExt: 50, fire: 0, cloud: '#4a5262', cloudOp: 0.95 },
};
export const lightFor = (S, f) => {
  const L = { ...LIGHTS[S.light] };
  if (S.id === 'brains') { L.sun = '#ffe0b0'; L.skyHor = '#f6dcc0'; }
  if (S.id === 'irony') { const k = smooth(ramp(f, 1900, 1990)); L.skyTop = mixHex('#3f86d4', '#2a3240', k); L.skyHor = mixHex('#e8dccc', '#7a8494', k); L.sunI = lerp(2.4, 1.2, k); L.hemi = lerp(1, 0.8, k); L.fog = mixHex('#cfe2ee', '#6a7484', k); L.cloud = mixHex('#ffffff', '#4a5262', k); L.sat = lerp(1.1, 0.9, k); }
  if (S.id === 'boulder') { const k = smooth(ramp(f, 344, 414)); L.sunI = lerp(2.4, 0.5, k); L.hemi = lerp(0.75, 0.5, k); L.fire = lerp(4, 14, k); }
  return L;
};
const mixHex = (a, b, t) => { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16); const c = (s) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t); return '#' + ((c(16) << 16) | (c(8) << 8) | c(0)).toString(16).padStart(6, '0'); };

// ---------- cameras ----------
const of = (p, y = FACE) => [p[0], y, p[2]];
const CAMS = {
  hook: [
    { f: 0, pos: [0.5, 1.25, 10.2], look: [0, 1.25, 5.6], fov: 40 },
    { f: 40, pos: [0.5, 1.2, 10.4], look: [0, 1.3, 5.6], fov: 40 },
    { f: 78, pos: [0.6, 0.9, 11.4], look: [0.6, 5.2, -2], fov: 52, ease: 'smooth' },
    { f: 108, pos: [0.6, 0.85, 11.6], look: [0.6, 5.4, -2], fov: 50 },
  ],
  sea: [
    { f: 109, pos: [52, 7, 112], look: [0, 7, 10], fov: 46 },
    { f: 153, pos: [48, 7.5, 104], look: [0, 7, 10], fov: 45 },
  ],
  cave: [
    { f: 154, pos: [5.5, 2.3, 3.0], look: [-1, 1.6, -6.5], fov: 46 },
    { f: 205, pos: [3.5, 2.4, 1.2], look: [-1, 1.7, -6.5], fov: 44 },
    { f: 236, pos: [-1.5, 2.2, -4], look: [0, 4.6, 14], fov: 52, ease: 'smooth' },
    { f: 260, pos: [-1.5, 2.1, -4.6], look: [0, 4.8, 14], fov: 50 },
  ],
  giant: [
    { f: 261, pos: [0.6, 1.4, 4.5], look: [0, GEYE - 1.6, 12], fov: 50 },
    { f: 326, pos: [0.5, 1.6, 6.0], look: [0, GEYE - 1.4, 12], fov: 46 },
  ],
  boulder: [
    { f: 327, pos: [-0.5, 3.4, -7.0], look: [1.6, 4.6, 12.5], fov: 58 },
    { f: 440, pos: [-0.4, 3.5, -5.8], look: [1.8, 4.8, 12.5], fov: 55 },
  ],
  dinner: [
    { f: 441, pos: [-7.5, 2.6, 11.5], look: [1.2, 3.2, 0.5], fov: 50 },
    { f: 500, pos: [-6.8, 2.5, 10.8], look: [1.2, 3.4, 0.5], fov: 47, roll: 3 },
  ],
  problem: [
    { f: 501, pos: [-3.6, 2.5, 1.4], look: [0.4, 2.6, 12.5], fov: 52 },
    { f: 618, pos: [-3.2, 2.5, 2.4], look: [0.4, 2.7, 12.5], fov: 50 },
    { f: 640, pos: [-2.6, 1.7, 9.8], look: frame([-2.6, 1.7, 9.8], of(ODY), 40), fov: 40, ease: 'smooth' },
    { f: 713, pos: [-2.2, 1.7, 9.2], look: frame([-2.2, 1.7, 9.2], of(ODY), 38), fov: 38 },
  ],
  plan: [
    { f: 714, pos: [-1.6, 1.65, 9.0], look: frame([-1.6, 1.65, 9.0], of(ODY), 38), fov: 38 },
    { f: 785, pos: [-1.3, 1.62, 7.6], look: frame([-1.3, 1.62, 7.6], of(ODY), 32), fov: 32, roll: -2 },
  ],
  stake: [
    { f: 786, pos: [-4.0, 2.0, 11.0], look: [-7.0, 1.2, 3.6], fov: 44 },
    { f: 868, pos: [-4.6, 1.9, 10.2], look: [-7.4, 1.1, 3.4], fov: 42 },
  ],
  wine: [
    { f: 869, pos: [-4.0, 1.7, 11.5], look: [0.8, 3.9, -1.5], fov: 50 },
    { f: 989, pos: [-3.4, 1.8, 10.4], look: [0.8, 4.3, -1.5], fov: 48 },
  ],
  name: [
    { f: 990, pos: [0.2, 1.6, 4.2], look: [1.6, GEYE - 0.9, -2.5], fov: 46 },
    { f: 1036, pos: [0.3, 1.7, 4.8], look: [1.6, GEYE - 0.8, -2.5], fov: 44 },
    { f: 1046, pos: [-1.6, 1.62, 9.6], look: frame([-1.6, 1.62, 9.6], of(ODY), 38), fov: 38, ease: 'easeOut' },
    { f: 1106, pos: [-1.35, 1.7, 8.4], look: [-1.2, 1.62, 5.2], fov: 36 },
    { f: 1111, pos: [-1.35, 1.7, 8.4], look: [-1.2, 1.62, 5.2], fov: 36, roll: -2 },
    { f: 1148, pos: [-1.8, 1.9, 9.8], look: frame([-1.8, 1.9, 9.8], of(ODY), 42), fov: 42 },
  ],
  night: [
    { f: 1149, pos: [-6.5, 2.4, 9.5], look: [0.5, 2.0, -2.5], fov: 50 },
    { f: 1172, pos: [-6.0, 2.3, 8.6], look: [0.5, 2.0, -2.5], fov: 48 },
    { f: 1176, pos: [0.4, 1.6, 6.5], look: [2, GEYE - 1.2, -3], fov: 48 },
    { f: 1269, pos: [0.4, 1.4, 7.5], look: [2, GEYE - 1.0, -3], fov: 50, roll: 3 },
  ],
  neigh: [
    { f: 1270, pos: [-50, 9, 6], look: [HILL1[0], HILL1[1] + 4.5, HILL1[2]], fov: 40 },
    { f: 1336, pos: [-52, 9.5, 2], look: [HILL1[0], HILL1[1] + 4.5, HILL1[2]], fov: 38 },
    { f: 1342, pos: [-1.4, 2.4, -0.5], look: [0, GEYE - 1.8, 8.6], fov: 52 },
    { f: 1406, pos: [-1.2, 2.3, 0.6], look: [0, GEYE - 1.6, 8.6], fov: 49, roll: -3 },
  ],
  bed: [
    { f: 1407, pos: [-52, 9.5, 2], look: [HILL1[0], HILL1[1] + 4, HILL1[2]], fov: 38 },
    { f: 1470, pos: [-48, 11, 8], look: [HILL1[0], HILL1[1] + 3, HILL1[2]], fov: 40 },
    { f: 1471, pos: [-22, 20, 60], look: [-3, 12, 4], fov: 46 },
    { f: 1546, pos: [-25, 24, 68], look: [-3, 12.5, 4], fov: 46 },
  ],
  dawn: [
    { f: 1547, pos: [3, 3.2, 32], look: [3.6, 3.8, 15], fov: 48 },
    { f: 1640, pos: [3.6, 2.8, 30], look: [4.4, 3.2, 16], fov: 46 },
    { f: 1690, pos: [7.0, 0.55, 23.5], look: [5.0, 0.9, 17.5], fov: 46, ease: 'smooth' },
    { f: 1760, pos: [8.5, 0.6, 23.2], look: [7.5, 0.9, 17.5], fov: 44 },
  ],
  door: [
    { f: 1761, pos: [15, 4.5, 40], look: [1, 3, 24], fov: 50 },
    { f: 1845, pos: [14, 4.8, 43], look: [1, 3.2, 26], fov: 48 },
  ],
  brains: [
    { f: 1846, pos: [9.2, 2.6, 68.4], look: [5.0, 2.3, 62.4], fov: 40 },
    { f: 1899, pos: [8.5, 2.6, 67.4], look: [5.0, 2.3, 62.4], fov: 36 },
  ],
  irony: [
    { f: 1900, pos: [8.4, 2.7, 68.6], look: [4.5, 2.3, 62.2], fov: 40 },
    { f: 1948, pos: [8.6, 2.8, 69.2], look: [4.5, 2.3, 62.2], fov: 41 },
    { f: 1995, pos: [9, 5.5, 96], look: [1, 8, 30], fov: 48, ease: 'smooth' },
    { f: 2036, pos: [9, 6, 101], look: [1, 8.5, 30], fov: 49 },
  ],
};
const KICKS = [{ f: 414, a: 0.03 }, { f: 1176, a: 0.05 }, { f: 1250, a: 0.03 }, { f: 1108, a: 0.015 }, { f: 2023, a: 0.03 }];
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, { kicks: KICKS });
  const fl = (f0, n, a) => (f >= f0 && f < f0 + n ? a * (1 - (f - f0) / n) : 0);
  c.flash = fl(109, 5, 0.5) + fl(1149, 5, 0.3) + fl(1173, 6, 0.8) + fl(1547, 5, 0.45) + fl(1108, 4, 0.18);
  const near = { sea: [0, 0, 40], neigh: f < 1340 ? HILL1 : [0, 0, 6], bed: HILL1, dawn: [2, 0, 16], door: [4, 0, 30], brains: [2, 0, 62], irony: [2, 0, 50] };
  c.shadowAt = near[S.id] || [0, 0, 2];
  return c;
};

// ---------- lens ----------
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  switch (S.id) {
    case 'hook': return f < 60 ? { focus: dist(C.pos, of(ODY0)), cinf: 9 } : { focus: dist(C.pos, [0.6, 5, -1]), cinf: 5 };
    case 'plan': case 'brains': return { focus: dist(C.pos, S.id === 'brains' ? [5.0, 2.5, 62.4] : of(ODY)), cinf: 10 };
    case 'problem': return f >= 640 ? { focus: dist(C.pos, of(ODY)), cinf: 9 } : { focus: 9, cinf: 4 };
    case 'name': return f >= 1046 ? { focus: dist(C.pos, of(ODY)), cinf: 11 } : { focus: dist(C.pos, [1.6, GEYE, -2.5]), cinf: 6 };
    case 'stake': return { focus: dist(C.pos, [-6.6, 1.3, 3.8]), cinf: 7 };
    case 'giant': return { focus: dist(C.pos, [0, GEYE, 12]), cinf: 6 };
  }
  return { focus: 100, cinf: 0 };
};

// ---------- world state ----------
const ODY0 = [0, 0, 5.6];
export const worldAt = (f) => {
  const S = shotAt(f), L = lightFor(S, f), W = { boulder: 1, boulderRoll: 0, fire: L.fire, ship: { ...SHIP0 }, stake: null };
  if (S.id === 'sea') W.ship = { x: 14, z: lerp(84, 76, ramp(f, 109, 153)), yaw: 1.2 };
  if (S.id === 'cave' || S.id === 'giant') W.boulder = 0;
  if (S.id === 'boulder') { const k = smooth(ramp(f, 344, 414)); W.boulder = k; }
  if (S.id === 'stake') {
    const hide = smooth(ramp(f, 840, 860)), O = [-6.6, 0, 3.8];
    W.stake = { pos: [lerp(O[0] - 1.9, STRAW[0] + 0.2, hide), lerp(1.0, 0.5, hide), lerp(O[2] + 0.45, STRAW[2] + 0.2, hide)], yaw: lerp(0, 0.6, hide), pitch: lerp(-0.04, 0, hide), glow: 0 };
  }
  if (S.id === 'night') {
    if (f < 1176) { const k = smooth(ramp(f, 1149, 1172)); W.stake = { pos: [lerp(-4.6, -2.4, k), 1.85, lerp(2.2, 0.8, k)], yaw: 0.5, pitch: 0.12, glow: 1 }; }
  }
  if (S.id === 'dawn') { const k = smooth(ramp(f, 1585, 1615)); W.boulder = 1 - k; W.boulderRoll = k * 1.2; }
  if (S.id === 'door' || S.id === 'brains' || S.id === 'irony') W.boulder = 0;
  if (S.id === 'irony') W.ship = { x: lerp(2, -3, ramp(f, 1950, 2036)), z: lerp(62, 74, smooth(ramp(f, 1950, 2036))), yaw: lerp(0, 0.35, smooth(ramp(f, 1950, 2000))) };
  if (S.id === 'neigh' || S.id === 'bed') W.boulder = 1;
  return W;
};

// ---------- actors (2D cards) ----------
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const life = (f, seed, o = {}) => { const I = idle(f, seed); return { seed, blink: blinkAt(f, seed), bob: q(I.bob, 3), tilt: q(I.tilt, 1), headTilt: q(I.headTilt, 1), ...o }; };
const ody = (T, f, o = {}, pos = ODY, extra = {}) => R(T, 'odysseus', life(f, 6, { L: 'hang', R: 'hang', expr: 'calm', ...o }), pos, extra);
const sailor = (T, f, k, o = {}, pos, extra = {}) => R(T, ['sailorA', 'sailorB', 'sailorC'][k % 3], life(f, 11 + k * 7, { expr: 'neutral', ...o }), pos, extra);
const cy = (T, f, o = {}, pos, extra = {}) => {
  const I = idle(f, 3), oo = { eye: 1, look: 0, expr: 'neutral', L: 'hang', R: 'hang', ...o };
  if (oo.eye === 1 && blinkAt(f, 4) > 0.5) oo.eye = 0.15;
  oo.eye = q(oo.eye, 2); oo.look = q(oo.look, 2); oo.bob = q(oo.bob ?? I.bob * 0.6, 2);
  return { key: 'cy' + JSON.stringify(oo), draw: (p) => T.cyclopsFront(p, oo), x: pos[0], y: pos[1], z: pos[2], s: extra.s || GS, roll: extra.roll || 0, ...extra };
};
const sheep = (T, f, i, o, pos) => ({ key: 'sh' + JSON.stringify(o), draw: (p) => T.sheepSide(p, o), x: pos[0], y: pos[1], z: pos[2], s: 1.05 });
// the men standing together (sailor index, position)
const CREW = [[0, [-2.9, 0, 6.2]], [1, [0.6, 0, 6.8]], [2, [-0.4, 0, 8.0]], [0, [-3.6, 0, 3.6]], [1, [1.8, 0, 4.6]]];

export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [];
  const tint = S.light === 'dawn' ? '#ffe4cc' : S.light === 'nightin' || S.light === 'night' ? '#c8d0ff' : S.light === 'cave' ? '#ffe6cc' : '#ffffff';
  const T_ = { tint };
  switch (S.id) {
    case 'hook': {
      out.push(ody(T, f, { expr: f < 62 ? 'nervous' : 'worried', look: f < 40 ? 0 : -0.3, headTilt: f > 50 ? -8 : 0 }, ODY0, T_));
      out.push(cy(T, f, { expr: f >= 82 ? 'angry' : 'grin', eye: f >= 82 ? 0.75 : 1, look: 0.1 }, [0.6, 0, -2], T_));
      break;
    }
    case 'sea': break;
    case 'cave': {
      const ex = f > 226 ? 'shock' : 'smile';
      out.push(ody(T, f, { expr: f > 226 ? 'shock' : 'grin', L: f < 200 ? 'point' : 'hang', look: -0.4 }, [-1.8, 0, -6.4], T_));
      out.push(sailor(T, f, 0, { expr: ex, L: 'belly', R: 'belly' }, [0.6, 0, -5.2], T_));
      out.push(sailor(T, f, 1, { expr: f > 226 ? 'shock' : 'grin', R: 'reach' }, [-3.8, 0, -4.8], T_));
      out.push(sailor(T, f, 2, { expr: ex }, [2.4, 0, -7.0], T_));
      if (f >= 214) out.push(cy(T, f, { expr: 'neutral', eye: 1, look: 0 }, [0.4, 0, lerp(19, 14.6, smooth(ramp(f, 214, 250)))], { tint: '#ffffff' }));
      for (let i = 0; i < 3; i++) out.push(sheep(T, f, i, { step: q((f * 0.02 + i * 0.3) % 1, 2) }, [7.2 + i * 1.6, 0, -2.6 + (i % 2) * 1.6]));
      break;
    }
    case 'giant': out.push(cy(T, f, { expr: f >= 291 ? 'grin' : 'neutral', eye: f >= 267 ? 1 : 0.7, look: q(Math.sin(f * 0.06) * 0.4, 2) }, [0, 0, 12.6], { tint: '#ffffff' })); break;
    case 'boulder': {
      const k = smooth(ramp(f, 344, 414));
      out.push(cy(T, f, { expr: f > 414 ? 'grin' : 'angry', L: f < 414 ? 'pat' : 'hang', R: 'hang', bob: q(Math.sin(f * 0.4) * 0.3 * (1 - ramp(f, 405, 414)), 2) }, [lerp(-1.5, 4.6, k), 0, 9.6], T_));
      CREW.slice(0, 3).forEach(([i, p], n) => out.push(sailor(T, f, i, { expr: 'shock' }, [p[0] - 1, 0, p[2] - 3 + n], T_)));
      out.push(ody(T, f, { expr: 'worried' }, [-2.2, 0, 1.2], T_));
      break;
    }
    case 'dinner': {
      out.push(cy(T, f, { expr: f >= 470 ? 'lick' : 'grin', look: -0.6, L: 'rub' }, [1.5, 0, -1.5], T_));
      CREW.slice(0, 3).forEach(([i, p], n) => out.push(sailor(T, f, i, { expr: f >= 466 ? 'shock' : 'nervous', L: 'cheek', R: 'cheek', look: 0.5 }, [p[0] - 1.6 + n * 0.3, 0, p[2] - 1.2], T_)));
      out.push(ody(T, f, { expr: 'worried', look: 0.5 }, [-3.2, 0, 4.0], T_));
      break;
    }
    case 'problem': {
      if (f < 630) {
        const st = q(Math.sin(f * 1.3) * 0.01, 3);
        [[-2.2, 10.0], [-0.2, 9.7], [1.8, 10.0], [3.4, 10.3]].forEach(([x, z], n) => out.push(sailor(T, f, n, { expr: f > 575 ? 'nervous' : 'stubborn', L: 'up', R: 'up', tilt: -6 }, [x + st, 0, z], T_)));
      } else {
        out.push(ody(T, f, { expr: f >= 645 ? 'smirk' : 'squint', L: f >= 628 ? 'point' : 'hang', look: 0.5 }, ODY, T_));
        out.push(cy(T, f, { expr: 'grin', look: 0, L: 'rub' }, [4.5, 0, -6], T_));
      }
      break;
    }
    case 'plan': out.push(ody(T, f, { expr: f >= 752 ? 'smirk' : 'squint', L: f >= 752 ? 'think' : 'hang', look: 0 }, ODY, T_)); break;
    case 'stake': out.push(ody(T, f, { expr: f >= 840 ? 'wink' : 'squint', L: f < 840 ? 'hold' : 'hang', R: f < 840 ? 'reach' : 'hang', lift: 0, look: -0.4 }, [-6.6, 0, 3.8], T_)); break;
    case 'wine': {
      const sleepy = smooth(ramp(f, 930, 960));
      out.push(cy(T, f, { expr: f < 886 ? 'grin' : sleepy > 0.5 ? 'sleepy' : 'drink', L: f >= 886 ? 'bowl' : 'hang', R: f >= 886 ? 'bowl' : 'hang', prop: f >= 886 ? 'bowl' : null, eye: lerp(1, 0.35, sleepy), bob: q(Math.sin(f * 0.15) * sleepy * 0.6, 2) }, [1.2, 0, -2.4], { ...T_, roll: q(Math.sin(f * 0.08) * 0.05 * sleepy, 3) }));
      out.push(ody(T, f, { expr: f < 900 ? 'smile' : 'smirk', L: f < 890 ? 'lift' : 'hip', R: f < 890 ? 'lift' : 'hip', look: 0.4 }, [-1.4, 0, 4.4], T_));
      break;
    }
    case 'name': {
      if (f < 1040) out.push(cy(T, f, { expr: (f >> 2) % 3 ? 'O' : 'neutral', eye: 0.45, look: -0.4 }, [1.6, 0, -2.5], T_));
      else {
        const hold = f >= 1108 && f < 1111, ff = hold ? 1108 : f;
        out.push(ody(T, ff, { expr: f >= 1108 ? 'wink' : f >= 1087 ? 'smirk' : 'calm', L: f >= 1087 ? 'think' : 'hang', look: 0.2 }, ODY, T_));
      }
      break;
    }
    case 'night': {
      if (f < 1176) {
        out.push(cy(T, f, { expr: 'sleepy', eye: 0, look: 0 }, [2, -1.6, -3], { ...T_, blob: false }));
        [[-3.6, 2.2], [-2.6, 1.4], [-4.6, 3.0]].forEach(([x, z], n) => out.push(sailor(T, f, n, { expr: 'stubborn', L: 'up', R: 'up' }, [x, 0, z], T_)));
        out.push(ody(T, f, { expr: 'stubborn', L: 'up', R: 'up' }, [-1.6, 0, 0.6], T_));
      } else {
        const sh = q(Math.sin(f * 2.1) * 0.04, 3);
        out.push(cy(T, f, { expr: 'shout', eye: 0, L: 'cover', R: f >= 1241 ? 'fist' : 'cover', bob: 0 }, [2 + sh, 0, -3], T_));
      }
      break;
    }
    case 'neigh': {
      if (f < 1340) {
        out.push(cy(T, f, { expr: f >= 1307 ? 'shout' : 'O', L: 'shout', R: 'hang', skin: '#b8906a', wool: '#d8c8a0', hair: '#5a3a24' }, [HILL1[0] + 2, HILL1[1], HILL1[2] + 2], { tint }));
        out.push(cy(T, f, { expr: 'O', L: 'hang', R: 'shout', skin: '#d8b08a', wool: '#a8a090', hair: '#2a2420' }, [HILL1[0] - 6, HILL1[1] - 1.2, HILL1[2] - 3], { tint, s: 3.2 }));
      } else out.push(cy(T, f, { expr: 'shout', eye: 0, L: 'shout', R: 'shout' }, [0, 0, 8.6], T_));
      break;
    }
    case 'bed': {
      const down = smooth(ramp(f, 1440, 1475));
      if (f < 1500) {
        out.push(cy(T, f, { expr: f < 1432 ? 'neutral' : 'sleepy', eye: f < 1432 ? 1 : 0.3, L: f < 1440 ? 'pat' : 'hang', R: 'hang', skin: '#b8906a', wool: '#d8c8a0', hair: '#5a3a24' }, [HILL1[0] + 2, HILL1[1] - down * 6, HILL1[2] + 2], { tint, blob: false }));
        out.push(cy(T, f, { expr: 'sleepy', eye: 0.3, skin: '#d8b08a', wool: '#a8a090', hair: '#2a2420' }, [HILL1[0] - 6, HILL1[1] - 1.2 - down * 6, HILL1[2] - 3], { tint, s: 3.2, blob: false }));
      }
      break;
    }
    case 'dawn': {
      out.push(cy(T, f, { expr: 'neutral', eye: 0, L: f >= 1620 ? 'pat' : 'hang', R: 'hang', look: 0 }, [5.6, -1.4, 15.2], { ...T_, blob: false }));
      const riders = ['sailorA', 'sailorB', 'sailorC', 'odysseus'];
      for (let i = 0; i < 4; i++) {
        const x = -1.2 + (f - 1610 - i * 24) * 0.09; if (f < 1610 + i * 24 || x > 18) continue;
        out.push(sheep(T, f, i, { step: q(((f * 0.05) + i * 0.25) % 1, 2), rider: riders[i], wool: i === 3 ? '#f8f2e2' : '#f2ecdc' }, [x, 0, 17.4 + (i % 2) * 0.5]));
      }
      break;
    }
    case 'door': {
      out.push(cy(T, f, { expr: 'neutral', eye: 0, L: 'pat' }, [5.6, -1.4, 15.2], { ...T_, blob: false }));
      for (let i = 0; i < 5; i++) { const w = walk(f, 1761 + i * 5, 3); const k = clamp((f - 1761 - i * 5) / 84); const p = [lerp(3 + i * 1.1, 4 + i * 0.9, k), 0, lerp(19 + i * 0.8, 36 + i * 1.2, k)];
        out.push(i === 0 ? ody(T, f, { expr: 'grin', L: 'up', R: 'hang', step: q(w.phase, 2) }, p, T_) : sailor(T, f, i, { expr: 'grin', L: 'up', R: 'up', step: q(w.phase, 2) }, p, T_)); }
      for (let i = 0; i < 3; i++) out.push(sheep(T, f, i, { step: q((f * 0.05 + i * 0.3) % 1, 2) }, [8 + i * 2.4, 0, 20 + i * 1.4]));
      break;
    }
    case 'brains': {
      out.push(ody(T, f, { expr: f >= 1869 ? 'wink' : 'smirk', L: 'think', R: 'hip', look: 0.2 }, [5.0, 1.0, 62.4], { ...T_, blob: false }));
      out.push(sailor(T, f, 1, { expr: 'grin', L: 'up', R: 'up' }, [3.2, 1.0, 61.3], { ...T_, blob: false }));
      break;
    }
    case 'irony': {
      const sh = worldAt(f).ship;
      out.push(ody(T, f, { expr: f >= 1960 ? 'grin' : 'smirk', L: f >= 1953 ? 'up' : 'hip', R: f >= 1953 ? 'wave' : 'hip', wv: q(f * 0.6, 1), look: -0.4 }, [sh.x + 2.5, 1.0, sh.z], { ...T_, blob: false }));
      if (f >= 1940) out.push(cy(T, f, { expr: 'angry', eye: 0, L: 'lift', R: 'lift', prop: 'rock' }, [0, 15.4, 3], { ...T_, blob: false }));
      break;
    }
  }
  return out;
};

// ---------- 2D effects ----------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
const glyph = (txt, col = '#ffffff', size = 300) => (p) => { const g = p.g; g.save(); g.font = `900 ${size}px Arial Black, Arial`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = size * 0.11; g.strokeStyle = '#241726'; g.strokeText(txt, 300, 500); g.fillStyle = col; g.fillText(txt, 300, 500); g.restore(); };
const flame = (t) => (p) => {
  const g = p.g; g.save();
  const lay = (w, h, col, dx) => { const pts = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2, r = Math.sin(a / 2); pts.push([300 + dx + Math.sin(a) * w * (0.6 + 0.4 * Math.cos(a)) + Math.sin(t * 6 + i) * 6, 960 - h * (1 - Math.cos(a / 2) * 0) * (0.5 - 0.5 * Math.cos(a)) * (a < Math.PI ? 1 : 1)]); } p.poly(pts, col, 0); };
  const tear = (w, h, col, dx) => { const pts = []; for (let i = 0; i <= 30; i++) { const a = i / 30 * Math.PI * 2; const y = -Math.cos(a), x = Math.sin(a) * (1 + y) * 0.5; pts.push([300 + dx + x * w + Math.sin(t * 7 + i * 0.5) * 5 * (1 - y), 900 - (y + 1) * 0.5 * h]); } p.poly(pts, col, 10); };
  tear(190, 560 + 40 * Math.sin(t * 5), '#ff6a2a', 0); tear(130, 420 + 30 * Math.sin(t * 6 + 1), '#ffb03a', 10); tear(70, 260 + 20 * Math.sin(t * 8), '#fff2a0', 0);
  g.restore();
};
const wagon = (p) => { p.poly([[160, 520], [440, 520], [420, 640], [180, 640]], '#a8743e', 14); for (const x of [220, 380]) { p.ell(x, 670, 60, 60, '#6a4a2a', 14); p.dot(x, 670, 14); } };
const bubble = (p) => { p.poly([[90, 300], [510, 300], [510, 620], [330, 620], [250, 740], [260, 620], [90, 620]], '#ffffff', 16); };
const wave = (k) => (p) => {
  const top = 980 - 860 * k, h = 980 - top, P = (x, y) => [x, top + y * h];
  const body = [P(0, 1), P(0, 0.55), P(60, 0.3), P(160, 0.1), P(280, 0.0), P(380, 0.04), P(450, 0.14), P(470, 0.26), P(430, 0.32), P(390, 0.24), P(350, 0.22), P(380, 0.4), P(470, 0.62), P(600, 0.8), P(600, 1)];
  p.poly(body, '#24506e', 14);
  p.poly([P(30, 0.6), P(140, 0.22), P(280, 0.08), P(200, 0.3), P(120, 0.7)], '#2f6a8c', 0);
  for (let i = 0; i < 10; i++) { const t = i / 9; p.ell(260 + t * 200 - (t > 0.8 ? (t - 0.8) * 300 : 0), top + h * (0.02 + 0.2 * t * t), 30 - t * 6, 22 - t * 4, '#eef6fa', 7); }
};
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [], L = lightFor(S, f), head = [ODY[0], FACE + 0.75, ODY[2]];
  // fire flame wherever the cave interior is seen
  if (L.fire > 0 && S.id !== 'sea') out.push(FX('fl' + q((f % 24) / 24, 2) + (S.light === 'nightin' ? 'n' : ''), flame((f % 24) / 24 * Math.PI * 2), [FIRE[0], 0.1, FIRE[2]], S.light === 'nightin' ? 0.55 : 0.9, { order: 3, alpha: 0.95 }));
  if (S.id === 'boulder') {
    if (f >= 379 && f < 414) for (let i = 0; i < 22; i++) { const f0 = 379 + i; if (f < f0) continue; const k = q(E.back(ramp(f, f0, f0 + 5), 2), 2); out.push(FX('wg' + k, wagon, [-3.6 + (i % 11) * 0.72, 6.8 + Math.floor(i / 11) * 0.75, 12.6], 0.42 * k)); }
    if (f >= 414 && f < 430) { const t = q((f - 414) / 16, 2); out.push(FX('dust' + t, (p) => T.fxDust(p, t, '#c8b8a0'), [0, 0.2, 11.5], 4)); }
  }
  if (S.id === 'plan' && f >= 759 && f < 781) { const t = q((f - 759) / 22, 2); out.push(FX('stars' + t, (p) => { p.g.translate(50, 300); T.fxStars(p, t); }, head, 0.7)); }
  if (S.id === 'stake' && f < 836) { const t = q((f % 12) / 12, 2); out.push(FX('chip' + t, (p) => T.fxDust(p, t, '#e6c89a'), [-5.5, 0.85, 4.4], 0.16)); }
  if (S.id === 'name' && f >= 1108 && f < 1148) {
    const k = E.back(ramp(f, 1108, 1116), 1.8);
    out.push(FX('nob' + q(k, 2), glyph('NOBODY', '#ffd23a', 100), [ODY[0] + 0.05, 1.5, ODY[2] + 0.5], q(0.62 * k, 2), { order: 6 }));
    if (f < 1130) { const t = q((f - 1108) / 22, 2); out.push(FX('burst' + t, (p) => { p.g.translate(50, 250); T.fxBurst(p, t, '#fff3b0', 12); }, [ODY[0], FACE - 0.3, ODY[2] - 0.4], 1.6, { order: 1 })); }
  }
  if (S.id === 'night' && f < 1172) { const t = q((f % 40) / 40, 2); out.push(FX('z' + t, (p) => T.fxZ(p, t), [3.4, GEYE - 1.0, -2.6], 1.6)); }
  if (S.id === 'neigh' && f >= 1307 && f < 1340) { const k = E.back(ramp(f, 1307, 1314), 2); out.push(FX('q' + q(k, 2), glyph('?', '#ffd23a'), [HILL1[0] - 1, HILL1[1] + 8.6, HILL1[2]], q(2.4 * k, 2))); }
  if (S.id === 'bed' && f >= 1471 && f < 1532) { const k = E.back(ramp(f, 1471, 1478), 2); out.push(FX('bub' + q(k, 2), bubble, [-3, 18, 4], q(8 * k, 2))); }
  if (S.id === 'bed' && f < 1470) { const t = q((f % 40) / 40, 2); if (f > 1450) out.push(FX('z' + t, (p) => T.fxZ(p, t), [HILL1[0], HILL1[1] + 1, HILL1[2] + 2], 3)); }
  if (S.id === 'irony' && f >= 1983) { const k = smooth(ramp(f, 1983, 2030)); out.push(FX('wave' + q(k, 2), wave(k), [13, -1, 66], 9, { order: 4 })); }
  return out;
};
