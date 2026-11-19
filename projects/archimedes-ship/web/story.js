// Shot plan for "The Man Who Pulled a Ship With One Hand": timed to voice.mp3 (69.85 s, 30 fps). See work/PLAN.md.
import { M as E, camFromKeys, idle, blinkAt, walk, q, clamp, lerp, ramp } from './motion.js';
export const FPS = 30, TOTAL = 2096, DECK = 0;
export const SHOTS = [
  { id: 'hook', a: 0, b: 92, light: 'space' },
  { id: 'king', a: 93, b: 160, light: 'palace' },
  { id: 'city', a: 161, b: 316, light: 'day' },
  { id: 'write', a: 317, b: 386, light: 'study' },
  { id: 'letter', a: 387, b: 625, light: 'palace' },
  { id: 'test', a: 626, b: 674, light: 'palace' },
  { id: 'haul', a: 675, b: 914, light: 'day' },
  { id: 'budge', a: 915, b: 1042, light: 'day' },
  { id: 'muscle', a: 1043, b: 1126, light: 'day' },
  { id: 'rope', a: 1127, b: 1282, light: 'day' },
  { id: 'trick', a: 1283, b: 1466, light: 'day' },
  { id: 'trade', a: 1467, b: 1589, light: 'day' },
  { id: 'sit', a: 1590, b: 1722, light: 'gold' },
  { id: 'slide', a: 1723, b: 1843, light: 'gold' },
  { id: 'today', a: 1844, b: 2005, light: 'modern' },
  { id: 'end', a: 2006, b: 2095, light: 'gold' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const smooth = E.smooth;
const FACE = 1.48;
const SP = [0, 1500, 0], PAL = [300, 0, 0], STUDY = [340, 0, 0], MOD = [600, 0, 0];
const ARCH_SPACE = [10.3, 1500.05, 0.5];
const KING = [PAL[0] + 0.2, 0, -3.0];
const POST = [0, 0, 6.5], CHAIR = [0, 0, 0];
const ARCH = [2.2, 0, 8.5];              // Archimedes standing by the rig
const DIAG = [-1.6, 0.25, 10.5];         // the parchment diagram card
const SHIP_Z0 = 32, SHIP_Z1 = 22;
const frame = (pos, face, fov, k = 0.3) => { const d = Math.hypot(pos[0] - face[0], pos[1] - face[1], pos[2] - face[2]); return [face[0], face[1] - k * d * Math.tan(fov * Math.PI / 360), face[2]]; };
const of = (p, y = FACE) => [p[0], p[1] + y, p[2]];

// ---------- light ----------
export const LIGHTS = {
  day: { az: 60, el: 42, sky: '#cfe4f4', ground: '#c9b07a', hemi: 1.0, sun: '#fff1d8', sunI: 2.6, fog: '#d4e6f0', fogNear: 150, fogFar: 1600, skyTop: '#3f86d4', skyHor: '#d8ecf6', sat: 1.12, vig: 0.2, shadowExt: 40 },
  gold: { az: 100, el: 20, sky: '#e8c8b0', ground: '#b8925a', hemi: 1.05, sun: '#ffc88c', sunI: 2.8, fog: '#f4d0b0', fogNear: 150, fogFar: 1500, skyTop: '#6f86c8', skyHor: '#ffd4a8', sunDisc: '#fff0c8', sunSize: 0.004, sat: 1.14, gain: '#fff4e6', lift: '#100a04', vig: 0.22, shadowExt: 40, cloud: '#ffe4d0' },
  palace: { az: 120, el: 50, sky: '#f0e0c8', ground: '#a88a68', hemi: 1.1, sun: '#fff0d8', sunI: 1.6, fog: '#e8dccb', fogNear: 60, fogFar: 600, skyTop: '#d8c8b0', skyHor: '#efe4d4', sat: 1.1, vig: 0.26, shadowExt: 14 },
  study: { az: 120, el: 40, sky: '#8a7a8a', ground: '#4a3a30', hemi: 0.85, sun: '#c8b8e0', sunI: 0.4, fog: '#2a2024', fogNear: 40, fogFar: 400, skyTop: '#1a1830', skyHor: '#3a3048', sat: 1.08, gain: '#fff0e0', lift: '#080404', vig: 0.34, shadowExt: 10 },
  space: { az: 40, el: 30, sky: '#9aa8d8', ground: '#2a2a40', hemi: 0.9, sun: '#fff4e0', sunI: 2.4, fog: '#05070f', fogNear: 2000, fogFar: 3000, skyTop: '#02030a', skyHor: '#0c1430', sat: 1.12, vig: 0.3, shadowExt: 20, cloudOp: 0 },
  modern: { az: 60, el: 45, sky: '#d0e4f4', ground: '#808890', hemi: 1.0, sun: '#ffffff', sunI: 2.5, fog: '#d8e6f0', fogNear: 150, fogFar: 1500, skyTop: '#3f86d4', skyHor: '#e0eef8', sat: 1.1, vig: 0.2, shadowExt: 50 },
};
export const lightFor = (S, f) => ({ ...LIGHTS[S.light] });

// ---------- cameras ----------
const CAMS = {
  hook: [
    { f: 0, pos: [20, 1502.6, 12], look: [6, 1502.2, 0], fov: 46 },
    { f: 92, pos: [19, 1502.5, 11], look: [6, 1502.3, 0], fov: 45, roll: 2 },
  ],
  king: [
    { f: 93, pos: [PAL[0] + 0.9, 1.7, 1.2], look: frame([PAL[0] + 0.9, 1.7, 1.2], of(KING), 40), fov: 40 },
    { f: 160, pos: [PAL[0] + 0.7, 1.68, 0.4], look: frame([PAL[0] + 0.7, 1.68, 0.4], of(KING), 36), fov: 36 },
  ],
  city: [
    { f: 161, pos: [40, 26, 110], look: [10, 22, -40], fov: 50 },
    { f: 316, pos: [28, 12, 82], look: [6, 16, -30], fov: 48 },
  ],
  write: [
    { f: 317, pos: [STUDY[0] + 0.7, 2.1, 1.8], look: [STUDY[0], 1.15, -2.2], fov: 42 },
    { f: 386, pos: [STUDY[0] + 0.5, 2.0, 1.2], look: [STUDY[0], 1.2, -2.2], fov: 40 },
  ],
  letter: [
    { f: 387, pos: [PAL[0] + 1.3, 1.8, 3.0], look: [PAL[0] + 0.85, 1.8, -3.0], fov: 46 },
    { f: 625, pos: [PAL[0] + 1.2, 1.8, 2.3], look: [PAL[0] + 0.85, 1.8, -3.0], fov: 44 },
  ],
  test: [
    { f: 626, pos: [PAL[0] + 0.7, 1.68, 0.6], look: frame([PAL[0] + 0.7, 1.68, 0.6], of(KING), 36), fov: 36 },
    { f: 674, pos: [PAL[0] + 0.6, 1.66, 0.1], look: frame([PAL[0] + 0.6, 1.66, 0.1], of(KING), 34), fov: 34, roll: -2 },
  ],
  haul: [
    { f: 675, pos: [9, 4.5, -4], look: [0, 5, 40], fov: 50 },
    { f: 835, pos: [8, 4.0, 0], look: [0, 4.6, 36], fov: 48 },
    { f: 860, pos: [-14, 9, 40], look: [0, 3.2, 28], fov: 48, ease: 'smooth' },
    { f: 914, pos: [-13, 8.5, 38], look: [0, 3.2, 28], fov: 46 },
  ],
  budge: [
    { f: 915, pos: [7, 2.2, 12], look: [0, 2.2, 20], fov: 48 },
    { f: 970, pos: [6.6, 2.2, 12.4], look: [0, 2.3, 20], fov: 46 },
    { f: 1000, pos: [30, 5, 4], look: [0, 5, 24], fov: 50, ease: 'smooth' },
    { f: 1042, pos: [32, 5.5, 2], look: [0, 5.5, 24], fov: 50 },
  ],
  muscle: [
    { f: 1043, pos: [5.0, 1.75, 11.8], look: frame([5.0, 1.75, 11.8], of(ARCH), 38), fov: 38 },
    { f: 1126, pos: [4.6, 1.72, 11.0], look: frame([4.6, 1.72, 11.0], of(ARCH), 34), fov: 34 },
  ],
  rope: [
    { f: 1127, pos: [7, 3.2, 3], look: [0, 2.2, 14], fov: 50 },
    { f: 1282, pos: [6, 3.6, 1], look: [0, 2.2, 15], fov: 48 },
  ],
  trick: [
    { f: 1283, pos: [5.0, 1.75, 11.8], look: frame([5.0, 1.75, 11.8], of(ARCH), 36), fov: 36 },
    { f: 1296, pos: [4.2, 1.72, 10.6], look: frame([4.2, 1.72, 10.6], of(ARCH), 30), fov: 30 },
    { f: 1300, pos: [4.2, 1.72, 10.6], look: frame([4.2, 1.72, 10.6], of(ARCH), 30), fov: 30, roll: -2 },
    { f: 1318, pos: [-1.4, 1.95, 15.4], look: [-1.6, 1.85, 10.5], fov: 42, ease: 'smooth' },
    { f: 1466, pos: [-1.45, 1.92, 15.0], look: [-1.6, 1.85, 10.5], fov: 41 },
  ],
  trade: [
    { f: 1467, pos: [-1.45, 1.92, 15.0], look: [-1.6, 1.85, 10.5], fov: 41 },
    { f: 1589, pos: [-1.5, 1.9, 14.6], look: [-1.6, 1.85, 10.5], fov: 40 },
  ],
  sit: [
    { f: 1590, pos: [0.6, 1.2, -4.6], look: [-0.3, 1.75, 10], fov: 52 },
    { f: 1660, pos: [0.55, 1.15, -4.3], look: [-0.3, 1.75, 10], fov: 50 },
    { f: 1722, pos: [0.5, 1.1, -4.0], look: [-0.3, 1.8, 10], fov: 50 },
  ],
  slide: [
    { f: 1723, pos: [0.5, 1.1, -4.0], look: [-0.3, 1.8, 10], fov: 50 },
    { f: 1843, pos: [0.5, 1.2, -4.5], look: [-0.3, 2.2, 10], fov: 54 },
  ],
  today: [
    { f: 1844, pos: [MOD[0] + 12, 9, 22], look: [MOD[0] - 3, 17, -16], fov: 52 },
    { f: 1883, pos: [MOD[0] + 11, 9.5, 20], look: [MOD[0] - 3, 18, -16], fov: 51 },
    { f: 1884, pos: [MOD[0] + 14, 8, 14], look: [MOD[0] + 6.5, 13, -11.8], fov: 52 },
    { f: 1918, pos: [MOD[0] + 13.5, 9, 13], look: [MOD[0] + 6.5, 15, -11.8], fov: 51 },
    { f: 1919, pos: [MOD[0] + 4, 3.6, 28], look: [MOD[0] - 6, 2.4, 6], fov: 50 },
    { f: 2005, pos: [MOD[0] + 8, 3.6, 26], look: [MOD[0] - 2, 2.6, 6], fov: 48 },
  ],
  end: [
    { f: 2006, pos: [0.9, 1.4, 4.2], look: frame([0.9, 1.4, 4.2], [0.1, 1.05, 0.8], 38), fov: 38 },
    { f: 2050, pos: [0.8, 1.38, 3.7], look: frame([0.8, 1.38, 3.7], [0.1, 1.05, 0.8], 34), fov: 34 },
    { f: 2095, pos: [4.2, 1.9, 5.5], look: [0.2, 1.6, -1], fov: 50, ease: 'smooth' },
  ],
};
const KICKS = [{ f: 54, a: 0.02 }, { f: 1298, a: 0.015 }, { f: 951, a: 0.02 }];
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, { kicks: KICKS });
  const fl = (f0, n, a) => (f >= f0 && f < f0 + n ? a * (1 - (f - f0) / n) : 0);
  c.flash = fl(161, 5, 0.5) + fl(317, 4, 0.3) + fl(675, 4, 0.3) + fl(1844, 5, 0.5) + fl(2006, 4, 0.35) + fl(1298, 4, 0.18);
  const near = { hook: [4, 1500, 0], king: PAL, letter: PAL, test: PAL, write: STUDY, city: [10, 0, -20], today: MOD, haul: [0, 0, 22] };
  c.shadowAt = near[S.id] || [0, 0, 12];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  switch (S.id) {
    case 'king': case 'test': return { focus: dist(C.pos, of(KING)), cinf: 10 };
    case 'muscle': return { focus: dist(C.pos, of(ARCH)), cinf: 10 };
    case 'trick': return f < 1310 ? { focus: dist(C.pos, of(ARCH)), cinf: 10 } : { focus: dist(C.pos, [-1.6, 1.85, 10.5]), cinf: 7 };
    case 'trade': return { focus: dist(C.pos, [-1.6, 1.85, 10.5]), cinf: 7 };
    case 'write': return { focus: dist(C.pos, [STUDY[0], 1.4, -2.3]), cinf: 8 };
    case 'end': return f < 2060 ? { focus: dist(C.pos, [0, 1.0, 0.3]), cinf: 9 } : { focus: 100, cinf: 0 };
  }
  return { focus: 100, cinf: 0 };
};

// ---------- world state ----------
const STRANDS = 10;
const rig = (shipZ, k = 1) => {
  const segs = [], bz = shipZ - 11.6 - 0.35, fz = POST[2] + 0.45 + 0.35;
  for (let i = 0; i < STRANDS; i++) {
    const x = -0.45 + 0.1 * i, y = 2.2 + (i % 2 ? 0.32 : -0.32), kk = clamp(k * STRANDS - i);
    if (kk <= 0) continue;
    const fwd = i % 2 === 0; segs.push({ a: fwd ? [x, y, fz] : [x, y, bz], b: fwd ? [x, y, bz] : [x, y, fz], k: kk, r: 0.035 });
  }
  return segs;
};
export const worldAt = (f) => {
  const S = shotAt(f), W = { ship: { x: 0, z: SHIP_Z0, yaw: -Math.PI / 2 }, cargo: true, rig: false, lines: [], study: S.id === 'write' };
  if (S.id === 'hook') { const k = E.back(ramp(f, 50, 66), 1.4); W.lever = lerp(0.32, 0.0, k); W.earthLift = lerp(0, 0.9, k); }
  if (S.id === 'haul') {
    const k = smooth(ramp(f, 675, 830)); W.ship.z = lerp(64, SHIP_Z0, k); W.ship.roll = Math.sin(f * 0.2) * 0.01 * (1 - k);
    W.cargoK = smooth(ramp(f, 842, 895)); W.cargo = f >= 842;
    if (f < 840) for (let i = 0; i < 8; i++) { const mz = W.ship.z - 11.6 - 4 - (i >> 1) * 2.2, mx = (i % 2 ? 1.4 : -1.4); W.lines.push({ a: [0, 2.0, W.ship.z - 11.4], b: [mx, 1.1, mz], r: 0.04 }); }
  }
  if (S.id === 'rope') { W.rig = true; W.lines = rig(SHIP_Z0, smooth(ramp(f, 1147, 1262))); }
  if (S.id === 'trick' || S.id === 'trade' || S.id === 'budge' || S.id === 'muscle') { W.rig = S.id !== 'budge'; if (W.rig) W.lines = rig(SHIP_Z0, 1); }
  if (S.id === 'sit' || S.id === 'slide' || S.id === 'end') {
    W.rig = true;
    const k = S.id === 'sit' ? 0 : S.id === 'slide' ? E.smooth(ramp(f, 1730, 1838)) : 1;
    W.ship.z = lerp(SHIP_Z0, SHIP_Z1, k);
    W.lines = rig(W.ship.z, 1);
    const tug = S.id === 'sit' && f >= 1677 ? 0.15 * Math.sin((f - 1677) * 0.25) : 0;
    W.lines.push({ a: [0, 2.2, POST[2] + 0.1], b: [0.3, 0.85 + tug * 0.2, 1.0 + tug], r: 0.04 });
  }
  if (S.id === 'today') {
    W.craneY = lerp(3, 16, smooth(ramp(f, 1858, 1900))); W.elevY = lerp(0, 18, smooth(ramp(f, 1884, 1940))); W.truckX = lerp(-26, -6, smooth(ramp(f, 1920, 2000)));
    W.lines = [{ a: [MOD[0] - 2, 34, MOD[2] - 16], b: [MOD[0] - 2, W.craneY + 0.3, MOD[2] - 16], r: 0.05 }];
  }
  return W;
};

// ---------- actors ----------
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const life = (f, seed, o = {}) => { const I = idle(f, seed); return { seed, blink: blinkAt(f, seed), bob: q(I.bob, 3), tilt: q(I.tilt, 1), headTilt: q(I.headTilt, 1), ...o }; };
const arch = (T, f, o = {}, pos = ARCH, extra = {}) => R(T, 'archimedes', life(f, 6, { L: 'hang', R: 'hang', expr: 'calm', ...o }), pos, extra);
const king = (T, f, o = {}, pos = KING, extra = {}) => R(T, 'hiero', life(f, 9, { L: 'hang', R: 'hang', expr: 'calm', ...o }), pos, extra);
const man = (T, f, k, o = {}, pos, extra = {}) => R(T, ['sailorA', 'sailorB', 'sailorC', 'workA', 'workB'][k % 5], life(f, 11 + k * 7, { expr: 'neutral', ...o }), pos, extra);
const SEAT = (p) => [p[0], p[1] - 0.42, p[2]];

export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [], tint = S.light === 'gold' ? '#ffe6cc' : S.light === 'study' ? '#ffd8b0' : '#ffffff', T_ = { tint };
  switch (S.id) {
    case 'hook': {
      const push = f >= 46;
      out.push(arch(T, f, { L: push ? 'up' : 'hip', R: push ? 'up' : 'point', expr: f >= 56 ? 'grin' : push ? 'stubborn' : 'smirk', look: -0.5, tilt: push ? -4 : 0 }, ARCH_SPACE, { blob: false }));
      break;
    }
    case 'king': out.push(king(T, f, { expr: f >= 126 ? 'smirk' : 'squint', L: f >= 124 ? 'point' : 'hip', R: 'hip', look: 0.3 })); break;
    case 'write': out.push(arch(T, f, { expr: 'smile', L: 'hang', R: 'reach', lift: q(0.05 * Math.sin(f * 0.9), 2), look: 0.2, headTilt: 6 }, [STUDY[0], -0.12, -2.3], { tint: '#ffd8b0', blob: false })); break;
    case 'letter': out.push(king(T, f, { expr: f >= 580 ? 'squint' : f >= 470 ? 'shock' : 'calm', R: 'hold', prop: 'scrolls', L: f >= 560 ? 'cheek' : 'hang', look: -0.2 })); break;
    case 'test': out.push(king(T, f, { expr: f >= 645 ? 'grin' : 'smirk', L: f >= 650 ? 'point' : 'hip', R: 'hip', look: 0.4 })); break;
    case 'haul': {
      const sz = worldAt(f).ship.z;
      if (f < 840) for (let i = 0; i < 8; i++) { const w = walk(f, 675 + i * 3, 0.9); out.push(man(T, f, i, { expr: 'stubborn', L: 'reach', R: 'reach', lift: 0.1, tilt: -8, step: q(w.phase, 2) }, [i % 2 ? 1.6 : -1.6, 0, sz - 11.6 - 4 - (i >> 1) * 2.2])); }
      if (f >= 842) for (let i = 0; i < 4; i++) { const k = E.back(ramp(f, 850 + i * 9, 858 + i * 9), 2); if (k > 0) out.push(['civA', 'civB', 'civC', 'toga'].map((w) => w)[i] && R(T, ['civA', 'civB', 'civC', 'toga'][i], life(f, 30 + i, { expr: 'smile', L: i % 2 ? 'wave' : 'hang', wv: q(f * 0.5, 1) }), [(i % 2 ? 1.2 : -1.2), 1.5, SHIP_Z0 - 6 + i * 3.5], { blob: false, s: q(k, 2) })); }
      break;
    }
    case 'budge': {
      const st = q(Math.sin(f * 1.4) * 0.012, 3);
      [[-1.4, 19.6], [0.2, 19.4], [1.6, 19.6], [-0.6, 18.8]].forEach(([x, z], n) => out.push(man(T, f, n, { expr: f > 940 ? 'nervous' : 'stubborn', L: 'up', R: 'up', tilt: -6 }, [x + st, 0, z])));
      if (f >= 977) out.push(arch(T, f, { expr: 'calm', L: 'hip', R: 'hip', look: 0.4 }, [4.0, 0, 17.0]));
      break;
    }
    case 'muscle': out.push(arch(T, f, { expr: f >= 1076 ? 'nervous' : 'smirk', L: f < 1090 ? 'up' : 'hang', R: f < 1090 ? 'belly' : 'hang', look: -0.3, headTilt: f >= 1076 ? 6 : 0 })); break;
    case 'rope': out.push(arch(T, f, { expr: 'grin', L: 'reach', R: 'reach', lift: q(0.25 + 0.2 * Math.sin(f * 0.18), 2), look: 0.3 }, [2.6, 0, 10.5])); break;
    case 'trick': {
      const hold = f >= 1298 && f < 1301, ff = hold ? 1298 : f;
      out.push(arch(T, ff, { expr: f >= 1298 ? 'eureka' : 'squint', L: f >= 1298 ? 'up' : 'hang', R: f >= 1298 ? 'think' : 'hang', look: 0 }));
      break;
    }
    case 'trade': out.push(arch(T, f, { expr: 'smirk', L: 'point', R: 'hip', look: -0.6 })); break;
    case 'sit': {
      const sat = f >= 1612;
      if (!sat) { const k = smooth(ramp(f, 1590, 1612)); out.push(arch(T, f, { expr: 'calm', L: 'hang', R: 'hang' }, [lerp(1.6, 0.1, k), lerp(0, -0.36, ramp(f, 1600, 1612)), lerp(1.6, -0.85, k)])); }
      else out.push(arch(T, f, { expr: f >= 1677 ? 'smirk' : 'calm', L: 'hang', R: f >= 1677 ? 'reach' : 'hang', lift: f >= 1677 ? q(0.05 * Math.sin((f - 1677) * 0.25), 2) : 0, look: 0.5 }, [0.1, -0.36, -0.85], { ...T_, blob: false }));
      for (let i = 0; i < 4; i++) out.push(man(T, f, i, { expr: 'squint', L: i % 2 ? 'cross' : 'hip', R: i % 2 ? 'cross' : 'hip', look: 0.4 }, [-3.5 - (i % 2) * 1.2, 0, 5 + i * 2.2], T_));
      break;
    }
    case 'slide': {
      out.push(arch(T, f, { expr: 'smirk', L: 'hang', R: 'reach', lift: q(0.05 * Math.sin(f * 0.25), 2), look: 0.6 }, [0.1, -0.36, -0.85], { ...T_, blob: false }));
      for (let i = 0; i < 4; i++) { const ch = f >= 1760; out.push(man(T, f, i, { expr: ch ? 'shock' : 'squint', L: ch ? 'up' : 'hip', R: ch ? 'up' : 'hip', look: 0.4 }, [-3.5 - (i % 2) * 1.2, 0, 5 + i * 2.2], T_)); }
      break;
    }
    case 'end': {
      out.push(arch(T, f, { expr: f >= 2074 ? 'wink' : 'smile', L: 'hang', R: f >= 2048 ? 'thumb' : 'reach', look: 0.2 }, [0.1, -0.36, 0.8], { ...T_, blob: false }));
      break;
    }
  }
  return out;
};

// ---------- 2D effects ----------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
const text = (g, t, x, y, size, col = '#ffffff', w = 0.11) => { g.save(); g.font = `900 ${size}px Arial Black, Arial`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = size * w; g.strokeStyle = '#241726'; g.strokeText(t, x, y); g.fillStyle = col; g.fillText(t, x, y); g.restore(); };
const glyph = (txt, col, size) => (p) => text(p.g, txt, 300, 500, size, col);
const INK = '#3a2418', PAPER = '#f1e2bd';
// parchment diagram: stage 1 (strands share the weight), stage 2 (x10 rope vs /10 force)
const diagram = (o) => (p) => {
  const g = p.g; g.save();
  p.poly([[20, 20], [580, 30], [575, 990], [25, 980]], PAPER, 10);
  g.globalAlpha = 0.25; for (let i = 0; i < 12; i++) p.stroke([[40, 60 + i * 80], [560, 70 + i * 80]], 2, '#b89a6a'); g.globalAlpha = 1;
  if (o.stage === 1) {
    // top block, bottom block, strands, weight
    const top = 90, bot = 380, x0 = 130, x1 = 470;
    p.poly([[x0 - 20, top - 40], [x1 + 20, top - 40], [x1 + 20, top + 10], [x0 - 20, top + 10]], '#8a5a34', 7);
    p.poly([[x0 - 10, bot], [x1 + 10, bot], [x1 + 10, bot + 50], [x0 - 10, bot + 50]], '#8a5a34', 7);
    for (let i = 0; i < 10; i++) {
      const x = x0 + (x1 - x0) * i / 9, k = clamp(o.strands * 10 - i), lit = k > 0.5;
      p.stroke([[x, top + 10], [x, top + 10 + (bot - top - 10) * clamp(o.draw * 10 - i)]], 9, lit ? '#e8a020' : INK);
      if (k > 0.05 && o.labels > i / 10) text(g, '1/10', x, (top + bot) / 2 + (i % 2 ? 26 : -26), 30, '#ffd23a', 0.16);
    }
    p.stroke([[300, bot + 50], [300, bot + 100]], 8, INK);
    p.poly([[190, bot + 100], [410, bot + 100], [430, bot + 230], [170, bot + 230]], '#6a6a72', 8);
    text(g, 'SHIP', 300, bot + 168, 64, '#ffffff');
    if (o.big > 0) text(g, '÷10', 510, bot + 165, 0.001 + 70 * o.big, '#ffd23a');
  } else {
    // long rope coil vs tiny force arrow
    text(g, 'PULL', 300, 80, 56, '#ffffff');
    const k = o.rope;
    for (let i = 0; i < 6; i++) p.ell(160, 300, 110 - i * 14, 70 - i * 9, null, 0);
    for (let i = 0; i < 6; i++) if (k > i / 6) p.arc(160, 300, 110 - i * 14, 70 - i * 9, 0, 360, 9, '#c8902a');
    if (k > 0.3) text(g, '×10', 160, 450, 84, '#ffd23a');
    text(g, 'ROPE', 160, 530, 48, '#ffffff');
    if (o.force > 0) {
      const L = 140 * o.force; p.stroke([[440 - L / 2, 300], [440 + L / 2, 300]], 12, '#d83a3a');
      p.poly([[440 + L / 2, 284], [440 + L / 2 + 26, 300], [440 + L / 2, 316]], '#d83a3a', 0);
      text(g, '÷10', 440, 450, 84, '#ffd23a'); text(g, 'FORCE', 440, 530, 48, '#ffffff');
    }
  }
  g.restore();
};
const weightCard = (o) => (p) => {
  const g = p.g; p.poly([[60, 60], [540, 60], [540, 640], [60, 640]], PAPER, 10);
  if (o.stage === 1) { p.poly([[330, 360], [500, 360], [520, 560], [310, 560]], '#6a6a72', 8); text(g, 'BIG', 415, 460, 56); p.stroke([[150, 560], [150, 420], [330, 410]], 12, '#c8902a'); p.ell(150, 400, 30, 30, '#f0c49a', 6); text(g, 'small force', 300, 170, 44, '#ffd23a'); text(g, 'any weight', 300, 250, 44, '#ffffff'); }
  else { p.ell(380, 300, 110, 110, '#2f78c8', 8); p.ell(350, 270, 40, 26, '#5aa850', 0); p.ell(410, 330, 34, 22, '#5aa850', 0); p.stroke([[80, 520], [520, 380]], 18, '#8a5a34'); p.poly([[250, 560], [300, 470], [350, 560]], '#9a8a7a', 6); p.ell(110, 470, 26, 26, '#f0c49a', 6); text(g, 'ANOTHER WORLD?', 300, 140, 46, '#ffd23a'); }
};
const nope = (p) => { p.stroke([[170, 500], [430, 500]], 26, '#5a5a62'); for (const x of [160, 440]) p.poly([[x - 40, 420], [x + 40, 420], [x + 40, 580], [x - 40, 580]], '#3a3a42', 10); p.ell(300, 500, 230, 230, null, 0); p.arc(300, 500, 230, 230, 0, 360, 34, '#d83a3a'); p.stroke([[140, 340], [460, 660]], 34, '#d83a3a'); };
const crate = (p) => { p.poly([[180, 400], [420, 400], [420, 640], [180, 640]], '#a8743e', 12); p.stroke([[180, 400], [420, 640]], 10, '#6a4424'); p.stroke([[420, 400], [180, 640]], 10, '#6a4424'); };

export const fxAt = (f, T) => {
  const S = shotAt(f), out = [];
  const pop = (f0) => E.back(ramp(f, f0, f0 + 7), 2);
  if (S.id === 'city' && f >= 225) { const k = pop(225); out.push(FX('syr' + q(k, 2), (p) => { text(p.g, 'SYRACUSE', 300, 420, 92, '#ffd23a'); text(p.g, '2,000+ YEARS AGO', 300, 540, 52, '#ffffff'); }, [22, 20, 40], q(16 * k, 2))); }
  if (S.id === 'letter') {
    if (f >= 432 && f < 515) { const k = pop(432); out.push(FX('w1' + q(k, 2), weightCard({ stage: 1 }), [PAL[0] + 1.25, 1.45, -2.0], q(0.6 * k, 2))); }
    if (f >= 522) { const k = pop(522); out.push(FX('w2' + q(k, 2), weightCard({ stage: 2 }), [PAL[0] + 1.25, 1.45, -2.0], q(0.6 * k, 2))); }
  }
  if (S.id === 'hook' && f >= 54 && f < 76) { const t = q((f - 54) / 22, 2); out.push(FX('st' + t, (p) => { p.g.translate(50, 300); T.fxStars(p, t); }, [-2, 1508, 0], 3)); }
  if (S.id === 'haul' && f >= 842 && f < 900) for (let i = 0; i < 6; i++) { const k = pop(842 + i * 8); if (k > 0) out.push(FX('cr' + i + q(k, 2), crate, [i % 2 ? 1.6 : -1.6, 2.4, SHIP_Z0 - 9 + i * 3.4], q(0.8 * k, 2), { order: 3 })); }
  if (S.id === 'budge' && f >= 945 && f < 960) { const t = q((f - 945) / 15, 2); out.push(FX('d' + t, (p) => T.fxDust(p, t, '#e8d8b0'), [0, 0.1, 20.6], 2.2)); }
  if (S.id === 'muscle' && f >= 1087) { const k = pop(1087); out.push(FX('no' + q(k, 2), nope, [ARCH[0] + 0.55, 1.55, ARCH[2] + 0.5], q(0.38 * k, 2))); }
  if (S.id === 'trick' && f >= 1298 && f < 1318) { const t = q((f - 1298) / 20, 2); out.push(FX('b' + t, (p) => { p.g.translate(50, 250); T.fxBurst(p, t, '#fff3b0', 12); }, [ARCH[0], 0.9, ARCH[2] - 0.5], 1.6, { order: 1 })); }
  if (S.id === 'trick' && f >= 1306) {
    const k = pop(1306), o = { stage: 1, draw: q(ramp(f, 1312, 1344), 2), strands: q(ramp(f, 1328, 1362), 2), labels: q(ramp(f, 1372, 1441), 2), big: q(E.back(ramp(f, 1441, 1450), 2), 2) };
    out.push(FX('dg' + JSON.stringify(o) + q(k, 2), diagram(o), DIAG, q(1.3 * k, 2), { order: 6 }));
  }
  if (S.id === 'trade') {
    const o = { stage: 2, rope: q(ramp(f, 1479, 1520), 2), force: q(E.back(ramp(f, 1538, 1556), 1.6), 2) };
    out.push(FX('dg2' + JSON.stringify(o), diagram(o), DIAG, 1.3, { order: 6 }));
  }
  if (S.id === 'slide' && f >= 1730) { const t = q(((f - 1730) % 20) / 20, 2); const z = worldAt(f).ship.z - 11; out.push(FX('sd' + t, (p) => T.fxDust(p, t, '#ecd8a8'), [1.8, 0.05, z], 1.1)); }
  if (S.id === 'today') {
    for (const [f0, pos, label] of [[1862, [MOD[0] - 1, 21, MOD[2] - 8], 'CRANE'], [1886, [MOD[0] + 7.5, 9, MOD[2] - 6], 'ELEVATOR'], [1925, [MOD[0] - 3, 2.6, MOD[2] + 10], 'TOW TRUCK']])
      if (f >= f0) { const k = pop(f0); out.push(FX(label + q(k, 2), glyph(label, '#ffd23a', 90), pos, q((label === 'TOW TRUCK' ? 5 : 8) * k, 2), { order: 6 })); }
  }
  return out;
};
