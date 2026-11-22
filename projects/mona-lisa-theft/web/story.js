// Shot plan for "The Theft That Made the Mona Lisa Famous": timed to voice.mp3 (63.37 s, 30 fps). See work/PLAN.md.
import { M as E, camFromKeys, idle, blinkAt, walk, q, clamp, lerp, ramp } from './motion.js';
export const FPS = 30, TOTAL = 1901, DECK = 0;
export const SHOTS = [
  { id: 'hook', a: 0, b: 87, light: 'gal' },
  { id: 'stole', a: 88, b: 137, light: 'gal' },
  { id: 'paris', a: 138, b: 236, light: 'dawn' },
  { id: 'closed', a: 237, b: 300, light: 'dawn' },
  { id: 'walk', a: 301, b: 402, light: 'dawn' },
  { id: 'under', a: 403, b: 482, light: 'dawn' },
  { id: 'name', a: 483, b: 539, light: 'dawn' },
  { id: 'handy', a: 540, b: 597, light: 'gal' },
  { id: 'cup', a: 598, b: 707, light: 'cup' },
  { id: 'simple', a: 708, b: 868, light: 'gal' },
  { id: 'empty', a: 869, b: 974, light: 'gal' },
  { id: 'alarm', a: 975, b: 1057, light: 'gal' },
  { id: 'crazy', a: 1058, b: 1173, light: 'day' },
  { id: 'week', a: 1174, b: 1247, light: 'day' },
  { id: 'queue', a: 1248, b: 1360, light: 'gal' },
  { id: 'police', a: 1361, b: 1410, light: 'office' },
  { id: 'picasso', a: 1411, b: 1514, light: 'office' },
  { id: 'trunk', a: 1515, b: 1663, light: 'attic' },
  { id: 'florence', a: 1664, b: 1744, light: 'shop' },
  { id: 'face', a: 1745, b: 1808, light: 'modern' },
  { id: 'end', a: 1809, b: 1900, light: 'modern' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const smooth = E.smooth;
const FACE = 1.48;
const ML = [0, 2.25, -8.6], EXT = [200, 0, 0], CUP = [400, 0, 0], POL = [500, 0, 0], ATT = [600, 0, 0], SHOP = [700, 0, 0];
const DOOR = [EXT[0], 0, -5.6];
const frame = (pos, face, fov, k = 0.3) => { const d = Math.hypot(pos[0] - face[0], pos[1] - face[1], pos[2] - face[2]); return [face[0], face[1] - k * d * Math.tan(fov * Math.PI / 360), face[2]]; };
const of = (p, y = FACE) => [p[0], p[1] + y, p[2]];

// ---------- light ----------
export const LIGHTS = {
  gal: { az: 90, el: 32, sky: '#fff0dc', ground: '#8a5a3a', hemi: 1.15, sun: '#fff0d8', sunI: 1.6, fog: '#e8d8c0', fogNear: 60, fogFar: 400, skyTop: '#c8d8e8', skyHor: '#f0e4d0', sat: 1.12, vig: 0.28, shadowExt: 18 },
  dawn: { az: 70, el: 14, sky: '#f0c8b0', ground: '#7a6a60', hemi: 1.0, sun: '#ffc89a', sunI: 2.4, fog: '#f0c8b0', fogNear: 80, fogFar: 600, skyTop: '#7a8ac8', skyHor: '#ffcaa0', sunDisc: '#fff0c8', sunSize: 0.004, sat: 1.12, gain: '#fff2e2', lift: '#100a06', vig: 0.24, shadowExt: 30 },
  day: { az: 70, el: 40, sky: '#d0e4f4', ground: '#8a8478', hemi: 1.0, sun: '#fff4e0', sunI: 2.4, fog: '#d8e6f0', fogNear: 80, fogFar: 600, skyTop: '#4a8ad8', skyHor: '#e0ecf4', sat: 1.1, vig: 0.2, shadowExt: 30 },
  cup: { az: 90, el: 20, sky: '#4a3a30', ground: '#1a1210', hemi: 0.42, sun: '#ffd8a0', sunI: 0.4, fog: '#100c0a', fogNear: 20, fogFar: 200, skyTop: '#0a0a12', skyHor: '#1a1a24', sat: 1.0, gain: '#fff0dc', lift: '#040202', vig: 0.42, shadowExt: 6 },
  office: { az: 100, el: 35, sky: '#f0dcc0', ground: '#6a4a30', hemi: 1.0, sun: '#ffe8c8', sunI: 1.4, fog: '#d8c8b0', fogNear: 40, fogFar: 300, skyTop: '#c8b8a0', skyHor: '#e8dcc8', sat: 1.08, vig: 0.3, shadowExt: 10 },
  attic: { az: 100, el: 30, sky: '#c8b8a8', ground: '#4a3a2a', hemi: 0.8, sun: '#ffd8a8', sunI: 1.2, fog: '#c8b8a0', fogNear: 40, fogFar: 300, skyTop: '#9a9aa8', skyHor: '#d8ccbc', sat: 1.06, gain: '#fff0e0', vig: 0.34, shadowExt: 8 },
  shop: { az: 80, el: 35, sky: '#f8e8c8', ground: '#8a6a40', hemi: 1.1, sun: '#fff0d0', sunI: 1.8, fog: '#f0e0c0', fogNear: 40, fogFar: 300, skyTop: '#c8d8e8', skyHor: '#f4e8d0', sat: 1.12, vig: 0.26, shadowExt: 10 },
  modern: { az: 90, el: 32, sky: '#ffffff', ground: '#8a6a4a', hemi: 1.25, sun: '#ffffff', sunI: 1.5, fog: '#f0f0f0', fogNear: 60, fogFar: 400, skyTop: '#dfe8f0', skyHor: '#f4f4f4', sat: 1.14, vig: 0.22, shadowExt: 18 },
};
export const lightFor = (S, f) => {
  const L = { ...LIGHTS[S.light] };
  if (S.id === 'alarm') { const k = (f - 975) / 50; if (k < 1) { L.hemi = 1.15 - 0.6 * Math.sin(k * Math.PI); L.sunI = 1.6 - 1.2 * Math.sin(k * Math.PI); } }
  return L;
};

// ---------- cameras ----------
const MLF = [ML[0], ML[1], ML[2]];
const CAMS = {
  hook: [
    { f: 0, pos: [0.2, 2.3, -6.4], look: [0, 2.25, -8.6], fov: 34 },
    { f: 30, pos: [0.2, 2.3, -6.2], look: [0, 2.25, -8.6], fov: 34 },
    { f: 87, pos: [1.2, 3.0, 4.0], look: [0, 3.0, -8.6], fov: 52, ease: 'smooth' },
  ],
  stole: [
    { f: 88, pos: [0.5, 2.4, -4.8], look: [0, 2.25, -8.6], fov: 34 },
    { f: 137, pos: [0.4, 2.35, -5.6], look: [0, 2.25, -8.6], fov: 32, roll: -3 },
  ],
  paris: [
    { f: 138, pos: [EXT[0] + 14, 22, 46], look: [EXT[0], 9, -10], fov: 50 },
    { f: 236, pos: [EXT[0] + 8, 6, 30], look: [EXT[0], 5, -8], fov: 48, ease: 'smooth' },
  ],
  closed: [
    { f: 237, pos: [EXT[0] + 2.0, 2.4, 1.8], look: [EXT[0], 2.4, -5.6], fov: 40 },
    { f: 300, pos: [EXT[0] + 1.6, 2.3, 0.6], look: [EXT[0], 2.4, -5.6], fov: 38 },
  ],
  walk: [
    { f: 301, pos: [EXT[0] + 4.0, 2.0, 7.0], look: [EXT[0], 1.6, -4.0], fov: 44 },
    { f: 402, pos: [EXT[0] + 2.6, 1.8, 6.0], look: [EXT[0], 1.6, -1.0], fov: 42 },
  ],
  under: [
    { f: 403, pos: [EXT[0] + 1.0, 1.55, 3.4], look: frame([EXT[0] + 1.0, 1.55, 3.4], [EXT[0], 1.3, 0], 40, 0.1), fov: 40 },
    { f: 482, pos: [EXT[0] + 0.8, 1.5, 2.8], look: frame([EXT[0] + 0.8, 1.5, 2.8], [EXT[0], 1.3, 0], 38, 0.1), fov: 38 },
  ],
  name: [
    { f: 483, pos: [EXT[0] + 0.7, 1.65, 2.8], look: frame([EXT[0] + 0.7, 1.65, 2.8], of([EXT[0], 0, 0]), 36), fov: 36 },
    { f: 539, pos: [EXT[0] + 0.5, 1.62, 2.3], look: frame([EXT[0] + 0.5, 1.62, 2.3], of([EXT[0], 0, 0]), 32), fov: 32, roll: -2 },
  ],
  handy: [
    { f: 540, pos: [3.6, 2.2, -3.2], look: [0.2, 2.0, -8.2], fov: 46 },
    { f: 597, pos: [3.2, 2.1, -3.8], look: [0.2, 2.0, -8.2], fov: 44 },
  ],
  cup: [
    { f: 598, pos: [CUP[0] + 0.5, 1.4, 1.4], look: [CUP[0], 1.0, -0.6], fov: 50 },
    { f: 707, pos: [CUP[0] + 0.35, 1.25, 0.9], look: [CUP[0], 1.0, -0.6], fov: 44 },
  ],
  simple: [
    { f: 708, pos: [0, 2.6, 5.0], look: [0, 1.8, -4], fov: 50 },
    { f: 868, pos: [-1.0, 2.4, 3.6], look: [-0.5, 1.8, -4], fov: 46 },
  ],
  empty: [
    { f: 869, pos: [2.8, 1.7, -3.4], look: [0.3, 1.9, -8.6], fov: 48 },
    { f: 974, pos: [2.5, 1.65, -3.9], look: [0.3, 1.9, -8.6], fov: 46 },
  ],
  alarm: [
    { f: 975, pos: [2.5, 1.65, -3.9], look: [0.3, 1.9, -8.6], fov: 46 },
    { f: 1057, pos: [3.0, 1.75, -3.0], look: [0.2, 2.0, -8.6], fov: 52, roll: 3 },
  ],
  crazy: [
    { f: 1058, pos: [EXT[0] + 3, 2.0, 8], look: [EXT[0], 2.2, 0], fov: 50 },
    { f: 1173, pos: [EXT[0] + 2, 2.0, 6.5], look: [EXT[0], 2.2, 0], fov: 46 },
  ],
  week: [
    { f: 1174, pos: [EXT[0] + 2.0, 2.4, 1.8], look: [EXT[0], 2.4, -5.6], fov: 40 },
    { f: 1225, pos: [EXT[0] + 1.6, 2.3, 0.8], look: [EXT[0], 2.4, -5.6], fov: 38 },
    { f: 1247, pos: [EXT[0] + 4, 3, 9], look: [EXT[0], 2.0, -4], fov: 50, ease: 'smooth' },
  ],
  queue: [
    { f: 1248, pos: [7.5, 2.0, -0.5], look: [0.4, 1.9, -8.4], fov: 50 },
    { f: 1360, pos: [6.8, 1.95, -1.2], look: [0.4, 1.9, -8.4], fov: 48 },
  ],
  police: [
    { f: 1361, pos: [POL[0] + 1.0, 1.65, 2.6], look: frame([POL[0] + 1.0, 1.65, 2.6], of([POL[0] - 0.4, 0, -0.6]), 38), fov: 38 },
    { f: 1410, pos: [POL[0] + 0.8, 1.6, 2.1], look: frame([POL[0] + 0.8, 1.6, 2.1], of([POL[0] - 0.4, 0, -0.6]), 34), fov: 34 },
  ],
  picasso: [
    { f: 1411, pos: [POL[0] + 1.6, 1.8, 3.4], look: [POL[0] + 0.2, 1.6, -3.4], fov: 44 },
    { f: 1514, pos: [POL[0] + 0.8, 1.7, 1.6], look: [POL[0] + 0.3, 1.6, -3.4], fov: 38 },
  ],
  trunk: [
    { f: 1515, pos: [ATT[0] + 1.6, 1.8, 2.6], look: [ATT[0] - 0.3, 0.9, -1.0], fov: 48 },
    { f: 1590, pos: [ATT[0] + 0.9, 1.55, 1.9], look: [ATT[0] - 0.1, 0.68, -0.7], fov: 48, ease: 'smooth' },
    { f: 1663, pos: [ATT[0] + 0.8, 1.5, 1.7], look: [ATT[0] - 0.1, 0.72, -0.7], fov: 46 },
  ],
  florence: [
    { f: 1664, pos: [SHOP[0] + 0.8, 1.8, 4.2], look: [SHOP[0] + 0.1, 1.4, -1.0], fov: 52 },
    { f: 1744, pos: [SHOP[0] + 0.7, 1.75, 3.6], look: [SHOP[0] + 0.1, 1.4, -1.0], fov: 50, roll: 2 },
  ],
  face: [
    { f: 1745, pos: [1.0, 2.6, 3.0], look: [0, 2.2, -8.6], fov: 50 },
    { f: 1808, pos: [0.6, 2.4, 0.0], look: [0, 2.2, -8.6], fov: 46 },
  ],
  end: [
    { f: 1809, pos: [0.3, 2.3, -5.2], look: [0, 2.25, -8.6], fov: 34 },
    { f: 1900, pos: [0.1, 2.32, -7.0], look: [0, 2.3, -8.6], fov: 28 },
  ],
};
const KICKS = [{ f: 110, a: 0.02 }, { f: 1031, a: 0.02 }, { f: 1685, a: 0.02 }];
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, { kicks: KICKS });
  const fl = (f0, n, a) => (f >= f0 && f < f0 + n ? a * (1 - (f - f0) / n) : 0);
  c.flash = fl(138, 5, 0.5) + fl(598, 4, 0.3) + fl(1058, 4, 0.3) + fl(1515, 5, 0.4) + fl(1664, 4, 0.3) + fl(1745, 5, 0.5) + fl(1361, 4, 0.3);
  const near = { paris: [EXT[0], 0, -6], closed: DOOR, walk: [EXT[0], 0, 0], under: [EXT[0], 0, 0], name: [EXT[0], 0, 0], crazy: [EXT[0], 0, 2], week: DOOR, cup: CUP, police: POL, picasso: POL, trunk: ATT, florence: SHOP };
  c.shadowAt = near[S.id] || [0, 0, -6];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  switch (S.id) {
    case 'hook': return f < 40 ? { focus: dist(C.pos, MLF), cinf: 6 } : { focus: 100, cinf: 0 };
    case 'stole': case 'end': return { focus: dist(C.pos, MLF), cinf: 7 };
    case 'name': return { focus: dist(C.pos, of([EXT[0], 0, 0])), cinf: 10 };
    case 'police': return { focus: dist(C.pos, of([POL[0] - 0.4, 0, -0.6])), cinf: 9 };
  }
  return { focus: 100, cinf: 0 };
};

// ---------- world state ----------
export const worldAt = (f) => {
  const S = shotAt(f), W = { mona: true, modern: false, lid: 0, shopMona: false, monaFace: {} };
  if (S.id === 'stole') W.mona = f < 112;
  if (['handy', 'simple'].includes(S.id)) W.mona = true;
  if (['empty', 'alarm', 'queue'].includes(S.id)) W.mona = false;
  if (S.id === 'trunk') W.lid = smooth(ramp(f, 1572, 1596));
  if (S.id === 'florence') W.shopMona = true;
  if (S.id === 'face' || S.id === 'end') { W.modern = S.id === 'face'; W.monaFace = { smile: S.id === 'end' ? q(lerp(0.5, 1.2, ramp(f, 1810, 1860)), 2) : 0.5, wink: S.id === 'end' && f >= 1877 ? 1 : 0 }; }
  return W;
};

// ---------- actors ----------
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const life = (f, seed, o = {}) => { const I = idle(f, seed); return { seed, blink: blinkAt(f, seed), bob: q(I.bob, 3), tilt: q(I.tilt, 1), headTilt: q(I.headTilt, 1), ...o }; };
const per = (T, f, o = {}, pos, extra = {}) => R(T, 'peruggia', life(f, 6, { L: 'hang', R: 'hang', expr: 'calm', ...o }), pos, extra);
const who = (T, f, k, seed, o = {}, pos, extra = {}) => R(T, k, life(f, seed, { expr: 'neutral', ...o }), pos, extra);
const VISITORS = ['lady1', 'gent1', 'lady2', 'gent2'];

export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [], tint = S.light === 'dawn' ? '#ffe4cc' : S.light === 'cup' ? '#b8a890' : S.light === 'attic' ? '#ffe8d0' : '#ffffff', T_ = { tint };
  switch (S.id) {
    case 'hook': {
      for (let i = 0; i < 4; i++) { const w = walk(f, i * 8, 0.9); const x = -7 + ((w.dist + i * 3.6) % 14); out.push(who(T, f, VISITORS[i], 20 + i, { expr: 'calm', look: 0.6, step: q(w.phase, 2), L: i % 2 ? 'hang' : 'hip' }, [x, 0, -4.2 + (i % 2) * 1.2])); }
      break;
    }
    case 'paris': break;
    case 'closed': break;
    case 'walk': { const k = clamp((f - 312) / 85); const w = walk(f, 312, 0.9); if (f >= 312) out.push(per(T, f, { expr: f > 360 ? 'smirk' : 'calm', bulge: true, L: 'hang', R: 'belly', step: q(w.phase, 2), look: 0.3 }, [EXT[0] + lerp(0, 0.4, k), 0, lerp(-5.2, -0.2, k)], T_)); break; }
    case 'under': out.push(per(T, f, { expr: 'smirk', bulge: true, L: 'hang', R: 'belly', look: 0.4 }, [EXT[0], 0, 0], T_)); break;
    case 'name': out.push(per(T, f, { expr: f >= 514 ? 'wink' : 'smirk', L: 'hip', R: 'thumb', look: 0 }, [EXT[0], 0, 0], T_)); break;
    case 'handy': out.push(per(T, f, { expr: 'smile', L: 'hold', prop: 'toolbox', R: 'reach', lift: q(0.15 + 0.1 * Math.sin(f * 0.3), 2), look: -0.4 }, [1.3, 0, -7.4])); break;
    case 'cup': out.push(per(T, f, { expr: f > 670 ? 'smirk' : 'squint', L: 'cross', R: 'cross', look: q(0.5 * Math.sin(f * 0.05), 2) }, [CUP[0], -0.55, -0.4], { tint, blob: false })); break;
    case 'simple': {
      for (let i = 0; i < 4; i++) { const w = walk(f, 708 + i * 6, 0.8); const x = 3.5 - ((w.dist + i * 1.6) % 9); out.push(per(T, f, { expr: i === 2 ? 'smirk' : 'calm', step: q(w.phase, 2), L: 'hang', R: 'hang', bulge: i === 2, look: -0.4 }, [x, 0, -3.0 - i * 0.7])); }
      out.push(who(T, f, 'guard', 31, { expr: f > 820 ? 'neutral' : 'squint', L: 'hip', R: 'hip', look: q(-0.6 + 0.4 * Math.sin(f * 0.04), 2) }, [-3.8, 0, -1.2]));
      break;
    }
    case 'empty': {
      out.push(who(T, f, 'guard', 31, { expr: f >= 923 ? 'smile' : 'squint', L: f >= 923 ? 'hip' : 'cheek', R: 'hip', look: -0.7 }, [1.4, 0, -7.0]));
      break;
    }
    case 'alarm': {
      out.push(who(T, f, 'guard', 31, { expr: f >= 1018 ? 'shock' : 'calm', L: f >= 1018 ? 'up' : 'hip', R: f >= 1018 ? 'up' : 'hip', look: -0.7 }, [1.4, 0, -7.0]));
      if (f >= 1001) out.push(who(T, f, 'gent1', 22, { expr: f >= 1018 ? 'shock' : 'squint', L: 'point', R: 'hang', look: -0.6 }, [2.6, 0, -6.4]));
      break;
    }
    case 'crazy': {
      out.push(who(T, f, 'newsboy', 40, { expr: 'shock', L: 'up', R: 'hold', prop: 'newspaper', look: 0 }, [EXT[0], 0, 0.5], T_));
      out.push(who(T, f, 'lady1', 41, { expr: 'shock', L: 'cheek', R: 'cheek', look: -0.5 }, [EXT[0] - 1.6, 0, -0.6], T_));
      out.push(who(T, f, 'gent2', 42, { expr: 'shock', R: 'hold', prop: 'newspaper', look: 0.5 }, [EXT[0] + 1.5, 0, -0.9], T_));
      break;
    }
    case 'week': {
      if (f >= 1231) for (let i = 0; i < 5; i++) { const w = walk(f, 1231 + i * 2, 2.4); out.push(who(T, f, VISITORS[i % 4], 50 + i, { expr: 'grin', step: q(w.phase, 2), L: 'up', look: 0 }, [EXT[0] + (i - 2) * 1.1, 0, lerp(6, -4.5, clamp((f - 1231 - i * 2) / 16))], T_)); }
      break;
    }
    case 'queue': {
      for (let i = 0; i < 5; i++) out.push(who(T, f, VISITORS[i % 4], 60 + i, { expr: (f + i * 7) % 60 < 30 ? 'shock' : 'squint', L: i === 1 && f > 1275 ? 'point' : 'hang', look: -0.7 }, [1.0 + i * 0.85, 0, -7.3 + i * 0.45]));
      break;
    }
    case 'police': out.push(who(T, f, 'detective', 70, { expr: 'squint', R: 'reach', prop: 'magnifier', lift: q(0.2 + 0.1 * Math.sin(f * 0.2), 2), look: 0 }, [POL[0] - 0.4, 0, -0.6])); break;
    case 'picasso': {
      out.push(who(T, f, 'picasso', 71, { expr: f >= 1454 ? 'nervous' : 'squint', L: 'hang', R: 'hang', look: 0.3 }, [POL[0] + 0.2, 0, -3.2]));
      out.push(who(T, f, 'detective', 70, { expr: 'squint', R: 'reach', prop: 'magnifier', lift: 0.25, look: -0.5 }, [POL[0] + 1.6, 0, -1.6]));
      break;
    }
    case 'trunk': out.push(per(T, f, { expr: f >= 1596 ? 'grin' : 'calm', L: 'reach', R: 'reach', lift: 0, look: 0.2 }, [ATT[0] - 0.55, 0, -0.95], T_)); break;
    case 'florence': {
      out.push(who(T, f, 'dealer', 80, { expr: f >= 1685 ? 'smirk' : 'squint', R: 'reach', prop: 'magnifier', lift: 0.05, look: 0.3 }, [SHOP[0] - 1.1, 0, -1.6]));
      out.push(per(T, f, { expr: f >= 1690 ? 'shock' : 'grin', L: f >= 1690 ? 'up' : 'hip', R: f >= 1690 ? 'up' : 'hip', look: -0.3 }, [SHOP[0] + 0.55, 0, -0.3]));
      if (f >= 1682) out.push(who(T, f, 'guard2', 81, { expr: 'stubborn', L: 'reach', R: 'hip', look: -0.4 }, [SHOP[0] + lerp(2.4, 1.3, smooth(ramp(f, 1682, 1694))), 0, 0.5]));
      break;
    }
    case 'face': {
      const mods = ['modA', 'modB', 'modC', 'modD', 'modA', 'modB'];
      for (let i = 0; i < 6; i++) out.push(who(T, f, mods[i], 90 + i, { expr: 'grin', L: 'hang', R: f >= 1758 + i * 2 ? 'reach' : 'hang', lift: 0.35, prop: f >= 1758 + i * 2 ? 'phone' : null, look: -0.4 + (i % 3) * 0.3 }, [-2.5 + i * 1.0, 0, -5.0 + (i % 2) * 0.8]));
      break;
    }
  }
  return out;
};

// ---------- 2D effects ----------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
const text = (g, t, x, y, size, col = '#ffffff', w = 0.11) => { g.save(); g.font = `900 ${size}px Arial Black, Arial`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = size * w; g.strokeStyle = '#241726'; g.strokeText(t, x, y); g.fillStyle = col; g.fillText(t, x, y); g.restore(); };
const sign = (t1, t2, col = '#b4312c') => (p) => { p.poly([[90, 380], [510, 380], [510, 620], [90, 620]], '#f4ead2', 10); text(p.g, t1, 300, 465, 70, col, 0.06); text(p.g, t2, 300, 555, 34, '#3a3a3a', 0.05); };
const paper = (o) => (p) => { const g = p.g; p.poly([[60, 220], [540, 200], [560, 820], [80, 840]], '#f4eed8', 10); text(g, 'PARIS NEWS', 310, 270, 44, '#241726', 0.02); p.stroke([[90, 305], [530, 290]], 4);
  text(g, 'MONA LISA', 310, 370, 64, '#b4312c', 0.04); text(g, 'STOLEN!', 310, 450, 70, '#b4312c', 0.04);
  p.poly([[110, 500], [300, 495], [300, 760], [115, 765]], '#c89a3a', 6); T_ml(p, 128, 515, 158, 230); for (let i = 0; i < 9; i++) p.stroke([[330, 520 + i * 26], [520, 516 + i * 26]], 3, '#9a9488'); };
let T_ml = () => {};
const bubble = (draw) => (p) => { p.poly([[90, 260], [510, 260], [510, 560], [300, 560], [220, 680], [230, 560], [90, 560]], '#ffffff', 12); draw(p); };
const camIcon = (p) => { p.poly([[200, 360], [400, 360], [400, 490], [200, 490]], '#3a3a42', 8); p.ell(300, 425, 46, 46, '#9ad8ff', 8); p.poly([[250, 330], [320, 330], [330, 360], [240, 360]], '#3a3a42', 6); };
const clock = (t) => (p) => { p.ell(300, 500, 200, 200, '#f4ead2', 14); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; p.stroke([[300 + Math.cos(a) * 170, 500 + Math.sin(a) * 170], [300 + Math.cos(a) * 190, 500 + Math.sin(a) * 190]], 6); }
  const a1 = t * Math.PI * 2 * 2 - Math.PI / 2, a2 = t * Math.PI * 2 * 24 - Math.PI / 2; p.stroke([[300, 500], [300 + Math.cos(a1) * 100, 500 + Math.sin(a1) * 100]], 14); p.stroke([[300, 500], [300 + Math.cos(a2) * 150, 500 + Math.sin(a2) * 150]], 8); p.dot(300, 500, 14); };
const bell = (t) => (p) => { const r = Math.sin(t * 40) * 0.25; p.g.save(); p.g.translate(300, 420); p.g.rotate(r); p.g.translate(-300, -420);
  p.poly([[200, 560], [230, 380], [300, 330], [370, 380], [400, 560]], '#e0b040', 10); p.ell(300, 580, 30, 30, '#a8782a', 8); p.g.restore();
  for (let i = 0; i < 3; i++) { p.arc(300, 450, 230 + i * 40, 230 + i * 40, -40, 40, 8, '#ffd23a'); p.arc(300, 450, 230 + i * 40, 230 + i * 40, 140, 220, 8, '#ffd23a'); } };
const calendar = (yr) => (p) => { p.poly([[150, 300], [450, 300], [450, 680], [150, 680]], '#ffffff', 10); p.poly([[150, 300], [450, 300], [450, 400], [150, 400]], '#b4312c', 10); text(p.g, String(yr), 300, 540, 110, '#241726', 0.02); };
const labelCard = (t) => (p) => { p.poly([[90, 560], [510, 560], [510, 700], [90, 700]], '#1e1e26', 8); text(p.g, t, 300, 630, 66, '#ffffff', 0.04); };
const titleCard = (t1, t2) => (p) => { text(p.g, t1, 300, 440, 92, '#ffd23a'); if (t2) text(p.g, t2, 300, 560, 64, '#ffffff'); };
const icon = (kind) => (p) => { const g = p.g;
  if (kind === 'poster') { p.poly([[150, 220], [450, 220], [450, 760], [150, 760]], '#c89a3a', 10); T_ml(p, 170, 240, 260, 500); }
  else if (kind === 'mug') { p.poly([[190, 380], [410, 380], [400, 700], [200, 700]], '#ffffff', 10); p.arc(420, 520, 60, 80, -90, 90, 22, '#ffffff'); p.arc(420, 520, 60, 80, -90, 90, 0); T_ml(p, 235, 430, 130, 190); }
  else if (kind === 'phone') { p.poly([[200, 220], [400, 220], [400, 780], [200, 780]], '#1e1e26', 10); T_ml(p, 218, 250, 164, 500); }
};
const xray = (p) => { const g = p.g; g.save(); g.globalAlpha = 0.85; p.poly([[200, 380], [400, 380], [400, 660], [200, 660]], '#c89a3a', 0); T_ml(p, 214, 394, 172, 252); g.restore(); g.setLineDash([18, 12]); p.poly([[195, 375], [405, 375], [405, 665], [195, 665]], null, 8); g.setLineDash([]); };

export const fxAt = (f, T) => {
  T_ml = (p, x, y, w, h) => T.drawMonaLisa(p.g, x, y, w, h);
  const S = shotAt(f), out = [];
  const pop = (f0) => E.back(ramp(f, f0, f0 + 7), 2);
  if (S.id === 'stole' && f >= 110 && f < 128) { const t = q((f - 110) / 18, 2); out.push(FX('puff' + t, (p) => T.fxDust(p, t, '#e8dcc4'), [0, 1.65, -8.4], 0.55)); }
  if (S.id === 'paris' && f >= 150) { const k = pop(150); out.push(FX('ttl' + q(k, 2), titleCard('PARIS', 'AUGUST 1911'), [EXT[0] + 2, 8, 6], q(9 * k, 2))); }
  if (S.id === 'closed' && f >= 240) { const k = pop(240); out.push(FX('ferme' + q(k, 2), sign('FERMÉ', 'CLOSED MONDAY'), [EXT[0], 1.25, -5.4], q(1.3 * k, 2))); }
  if (S.id === 'under' && f >= 423) { const k = pop(423); out.push(FX('xr' + q(k, 2), xray, [EXT[0], -0.1, 0.08], q(0.8 * k, 2), { order: 7 })); }
  if (S.id === 'name' && f >= 499) { const k = pop(499); out.push(FX('nm' + q(k, 2), titleCard('VINCENZO', 'PERUGGIA'), [EXT[0] - 0.2, 1.25, -0.4], q(1.15 * k, 2), { order: 6 })); }
  if (S.id === 'cup') { const t = q((f % 30) / 30, 2); if (f >= 676) out.push(FX('zz' + t, (p) => T.fxZ(p, t), [CUP[0] + 0.4, 1.3, -0.2], 0.6)); }
  if (S.id === 'empty' && f >= 927) { const k = pop(927); out.push(FX('bub' + q(k, 2), bubble(camIcon), [0.4, 1.75, -7.6], q(0.7 * k, 2))); }
  if (S.id === 'alarm') {
    if (f < 1020) { const t = q((f - 975) / 45, 2); out.push(FX('clk' + t, clock(t), [-1.8, 2.0, -8.2], 1.4)); }
    if (f >= 1029) { const t = q((f - 1029) / 30, 2); out.push(FX('bell' + t, bell(t), [-1.4, 2.6, -8.0], 1.5)); }
  }
  if (S.id === 'crazy' && f >= 1106) for (let i = 0; i < 6; i++) { const f0 = 1106 + i * 7; if (f < f0) continue; const k = clamp((f - f0) / 40); const ang = i * 1.7; out.push(FX('np' + i + q(k, 2), paper(), [EXT[0] + Math.cos(ang) * 2.2 * (1 - k * 0.3), 1.6 + Math.sin(ang * 1.3) * 1.2 + k * 1.5, -1 + k * 4], 0.9, { roll: q(Math.sin(f * 0.1 + i) * 0.4, 2), order: 6 })); }
  if (S.id === 'week') { out.push(FX('wk' + (f >= 1231 ? 1 : 0), f >= 1231 ? sign('OUVERT', 'OPEN', '#2a7a3a') : sign('FERMÉ', 'CLOSED FOR A WEEK'), [EXT[0], 1.25, -5.4], 1.3)); }
  if (S.id === 'picasso' && f >= 1454) { const k = pop(1454); out.push(FX('lbl' + q(k, 2), labelCard('P. PICASSO'), [POL[0] + 0.2, 0.3, -2.9], q(1.0 * k, 2))); }
  if (S.id === 'trunk' && f >= 1627) { const yr = f < 1636 ? 1911 : f < 1645 ? 1912 : 1913; const k = pop(1627); out.push(FX('cal' + yr + q(k, 2), calendar(yr), [ATT[0] - 1.2, 1.4, -2.2], q(1.0 * k, 2))); }
  if (S.id === 'face') { const items = [['poster', [-1.7, 2.6, -6.2], 1754], ['mug', [1.7, 2.7, -6.2], 1766], ['phone', [-1.2, 3.6, -5.8], 1778], ['poster', [1.4, 3.7, -5.8], 1786]];
    for (const [k_, pos, f0] of items) if (f >= f0) { const k = pop(f0); out.push(FX(k_ + f0 + q(k, 2), icon(k_), pos, q(1.3 * k, 2), { order: 6 })); } }
  return out;
};
