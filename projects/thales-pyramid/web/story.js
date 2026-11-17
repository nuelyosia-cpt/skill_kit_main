// Shot plan for "The Shadow That Measured a Pyramid": timed to voice.mp3 (62.93 s, 30 fps). See work/PLAN.md.
import { M as E, camFromKeys, idle, blinkAt, walk, q, clamp, lerp, ramp } from './motion.js';
export const FPS = 30, TOTAL = 1888, DECK = 0;
export const SHOTS = [
  { id: 'hook', a: 0, b: 127, light: 'day' },
  { id: 'map', a: 128, b: 300, light: 'day' },
  { id: 'reveal', a: 301, b: 451, light: 'day' },
  { id: 'question', a: 452, b: 531, light: 'day' },
  { id: 'gags', a: 532, b: 736, light: 'day' },
  { id: 'waits', a: 737, b: 815, light: 'day' },
  { id: 'shrink', a: 816, b: 930, light: 'day' },
  { id: 'moment', a: 931, b: 1052, light: 'day' },
  { id: 'trick', a: 1053, b: 1235, light: 'day' },
  { id: 'measure', a: 1236, b: 1425, light: 'day' },
  { id: 'idea', a: 1426, b: 1565, light: 'day' },
  { id: 'today', a: 1566, b: 1772, light: 'day' },
  { id: 'moral', a: 1773, b: 1887, light: 'golden' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const smooth = E.smooth;

// ---------- positions ----------
const TH = [150, 0, 8];            // where Thales stands, just past the tip of the pyramid's shadow
const THH = 1.75;                  // his height on the card (m) = his shadow length at 45°
const FACE = 1.48;                 // face height on a standing card
const MAP = [260, 0.86, 120];
const PALM = [168, 0, 34], OBEL = [182, 0, 18], OBH = 21, MOUNT = [700, 150, -260];
const PB2 = 115, PH = 146;         // half base, height of the Great Pyramid
const slope = Math.atan2(PB2, PH), nx = PH / Math.hypot(PH, PB2), ny = PB2 / Math.hypot(PH, PB2);
const faceAt = (along, z, out = 0.2) => [PB2 - Math.sin(slope) * along + nx * out, Math.cos(slope) * along + ny * out, z];
const frame = (pos, face, fov, k = 0.3) => { const d = Math.hypot(pos[0] - face[0], pos[1] - face[1], pos[2] - face[2]); return [face[0], face[1] - k * d * Math.tan(fov * Math.PI / 360), face[2]]; };

// ---------- sun ----------
// Sun comes from -x (az 180) so shadows fall toward +x. Elevation hits exactly 45° on "tall" (f1035).
export const sunEl = (f) => {
  if (f < 737) return 30;
  if (f < 816) return lerp(15, 24, ramp(f, 737, 815));
  if (f < 931) return lerp(24, 40, smooth(ramp(f, 816, 930)));
  if (f < 1036) return lerp(40, 45, E.easeOut(ramp(f, 931, 1035)));
  if (f < 1773) return 45;
  return 18;
};
export const LIGHTS = {
  day: { az: 180, el: 45, sky: '#cfe0f0', ground: '#c9a46a', hemi: 1.0, sun: '#fff1d8', sunI: 2.7, fog: '#efe0c6', fogNear: 300, fogFar: 2600,
    skyTop: '#4f8ed8', skyHor: '#f0dcb6', sat: 1.08, vig: 0.2, shadowExt: 8 },
  golden: { az: 120, el: 18, sky: '#c8b0d0', ground: '#b88a60', hemi: 1.2, sun: '#ffbe7c', sunI: 3.2, fog: '#f0b88c', fogNear: 300, fogFar: 2400,
    skyTop: '#6f6eb0', skyHor: '#ffc27e', sunDisc: '#fff0c8', sunSize: 0.0035, sat: 1.12, gain: '#fff2e2', lift: '#140c06', vig: 0.24, shadowExt: 10 },
};
export const lightFor = (S, f) => {
  const L = { ...LIGHTS[S.light], el: sunEl(f) };
  if (S.id === 'map') L.shadowExt = 3;
  if (S.id === 'gags') L.shadowExt = 22;
  if (S.id === 'hook' || S.id === 'reveal') { L.shadowExt = 40; }
  if (S.id === 'trick' || (S.id === 'measure' && f >= 1320)) { L.shadowExt = 230; L.sunDist = 520; }
  if (S.id === 'today') { L.shadowExt = 70; L.sunDist = 300; }
  return L;
};

// ---------- cameras ----------
const thf = [TH[0], FACE, TH[2]];
const LADDER_AT = faceAt(4.2, 9.2, 0.75);
const CAMS = {
  hook: [
    { f: 0, pos: [166, 1.6, 19], look: [70, 40, 0], fov: 46 },
    { f: 56, pos: [165, 1.7, 18.5], look: [10, 140, 0], fov: 50 },
    { f: 82, pos: [154.6, 2.1, 13.6], look: frame([154.6, 2.1, 13.6], thf, 38), fov: 38, ease: 'easeOut' },
    { f: 127, pos: [154.2, 2.05, 13.0], look: frame([154.2, 2.05, 13.0], thf, 36), fov: 36 },
  ],
  map: [
    { f: 128, pos: [MAP[0] + 0.3, MAP[1] + 4.9, MAP[2] + 0.95], look: [MAP[0], MAP[1], MAP[2] + 0.5], fov: 44, roll: -6 },
    { f: 300, pos: [MAP[0] + 0.1, MAP[1] + 4.55, MAP[2] + 0.9], look: [MAP[0], MAP[1], MAP[2] + 0.5], fov: 44 },
  ],
  reveal: [
    { f: 301, pos: [156, 1.0, 11], look: [149, 3.0, 7.6], fov: 46 },
    { f: 451, pos: [190, 16, 34], look: [60, 52, 0], fov: 50 },
  ],
  question: [
    { f: 452, pos: [153.9, 1.8, 10.8], look: frame([153.9, 1.8, 10.8], thf, 32), fov: 32 },
    { f: 531, pos: [153.4, 1.75, 10.4], look: frame([153.4, 1.75, 10.4], thf, 30), fov: 30, roll: -2 },
  ],
  gags: [
    { f: 532, pos: [122.6, 1.9, 11.6], look: [117.4, 1.45, 6.6], fov: 40 },
    { f: 592, pos: [122.2, 1.9, 11.2], look: [117.4, 1.45, 6.6], fov: 38 },
    { f: 640, pos: [126, 3.0, 13.5], look: [113, 5.5, 6], fov: 50 },
    { f: 662, pos: [126, 4.6, 18], look: [LADDER_AT[0], LADDER_AT[1] + 1.2, 9.2], fov: 40 },
    { f: 736, pos: [125, 5.0, 17], look: [LADDER_AT[0], LADDER_AT[1] + 1.4, 9.2], fov: 36 },
  ],
  waits: [
    { f: 737, pos: [151.5, 1.3, 15.5], look: [150.2, 0.9, 8], fov: 40 },
    { f: 815, pos: [151.2, 1.3, 14.8], look: [150.2, 0.9, 8], fov: 38 },
  ],
  shrink: [
    { f: 816, pos: [145.6, 3.8, 13.4], look: [151.4, 0.6, 8], fov: 42 },
    { f: 930, pos: [146.2, 3.3, 12.6], look: [151.2, 0.7, 8], fov: 40 },
  ],
  moment: [
    { f: 931, pos: [146.2, 3.3, 12.6], look: [151.0, 0.75, 8.2], fov: 40 },
    { f: 1030, pos: [146.4, 2.5, 12.0], look: [150.7, 0.9, 8.3], fov: 37 },
    { f: 1052, pos: [146.5, 2.5, 11.9], look: [150.7, 0.9, 8.3], fov: 36.5, roll: -2 },
  ],
  trick: [
    { f: 1053, pos: [146.5, 2.5, 11.9], look: [150.7, 0.9, 8.3], fov: 36.5 },
    { f: 1140, pos: [235, 72, 158], look: [72, 34, 0], fov: 46, path: [[188, 30, 74]] },
    { f: 1235, pos: [244, 80, 172], look: [64, 38, 0], fov: 44 },
  ],
  measure: [
    { f: 1236, pos: [152, 1.8, 2.6], look: [128, 1.1, 0.4], fov: 44 },
    { f: 1312, pos: [152.8, 2.1, 3.0], look: [128, 1.1, 0.4], fov: 46 },
    { f: 1345, pos: [230, 66, 150], look: [66, 36, 0], fov: 46, ease: 'smooth' },
    { f: 1425, pos: [238, 74, 162], look: [60, 42, 0], fov: 44 },
  ],
  idea: [
    { f: 1426, pos: [156.4, 1.85, 12.2], look: frame([156.4, 1.85, 12.2], thf, 36), fov: 36 },
    { f: 1565, pos: [155.2, 1.8, 11.4], look: frame([155.2, 1.8, 11.4], thf, 32), fov: 32 },
  ],
  today: [
    { f: 1566, pos: [146, 5, 58], look: [172, 7, 28], fov: 46 },
    { f: 1700, pos: [116, 9, 84], look: [300, 34, -56], fov: 52 },
    { f: 1772, pos: [112, 10, 88], look: [300, 36, -60], fov: 50 },
  ],
  moral: [
    { f: 1773, pos: [155.2, 0.9, 11.4], look: [150, 1.05, 7.6], fov: 40 },
    { f: 1846, pos: [155.0, 0.95, 11.2], look: [150, 1.05, 7.6], fov: 38 },
    { f: 1872, pos: [153.2, 3.6, 13.6], look: [150.6, 0.35, 5.8], fov: 50, ease: 'smooth' },
    { f: 1887, pos: [153.1, 3.65, 13.5], look: [150.6, 0.35, 5.8], fov: 49 },
  ],
};
const KICKS = [{ f: 1209, a: 0.03 }, { f: 1035, a: 0.02 }];
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, { kicks: KICKS });
  c.flash = f >= 128 && f < 132 ? 0.5 * (1 - (f - 128) / 4) : f >= 1035 && f < 1040 ? 0.18 * (1 - (f - 1035) / 5) : f >= 1773 && f < 1777 ? 0.4 * (1 - (f - 1773) / 4) : 0;
  const near = { map: MAP, gags: [116, 0, 7], hook: [150, 0, 8] };
  c.shadowAt = near[S.id] || ((S.id === 'trick' || (S.id === 'measure' && f >= 1320)) ? [60, 0, 0] : S.id === 'today' ? [170, 0, 30] : TH);
  return c;
};

// ---------- lens ----------
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  switch (S.id) {
    case 'hook': return f < 70 ? { focus: 200, cinf: 0 } : { focus: dist(C.pos, thf), cinf: 9 };
    case 'map': return { focus: dist(C.pos, MAP), cinf: 6 };
    case 'reveal': return { focus: dist(C.pos, thf), cinf: lerp(6, 0, ramp(f, 330, 400)) };
    case 'question': case 'idea': return { focus: dist(C.pos, thf), cinf: 11 };
    case 'gags': return { focus: dist(C.pos, C.look), cinf: 5 };
    case 'waits': case 'shrink': case 'moment': return { focus: dist(C.pos, [151, 0.8, 8]), cinf: 7 };
    case 'measure': return f < 1320 ? { focus: dist(C.pos, [140, 1, 0]), cinf: 4 } : { focus: 200, cinf: 0 };
    case 'moral': return { focus: dist(C.pos, f < 1850 ? thf : [151.5, 0, 8]), cinf: 8 };
  }
  return { focus: 100, cinf: 0 };
};

// ---------- world state ----------
const G = '#ffd23a', SUN = '#fff4b0', ROPE = '#d9b06a';
const tri = (base, h, k1, k2, k3, r) => [
  { a: [base[0], base[1] + 0.05, base[2]], b: [base[0], base[1] + h, base[2]], k: k1, r },
  { a: [base[0], base[1] + 0.05, base[2]], b: [base[0] + h, base[1] + 0.05, base[2]], k: k2, r },
  { a: [base[0], base[1] + h, base[2]], b: [base[0] + h, base[1] + 0.05, base[2]], k: k3, r: r * 0.6, col: SUN, alpha: 0.85 },
];
export const worldAt = (f) => {
  const S = shotAt(f), W = { rock: S.id === 'waits', rope: 0, ladder: false, map: {}, lines: [] };
  if (S.id === 'map') W.map = { year: q(smooth(ramp(f, 160, 176)), 2), line: q(smooth(ramp(f, 255, 292)), 2) };
  if (S.id === 'gags') {
    // rope thrown up the face: up to 22 m, then slides back down
    if (f >= 600) W.rope = f < 618 ? 22 * E.easeOut(ramp(f, 600, 618)) : Math.max(1.5, 22 - 20 * E.easeIn(ramp(f, 622, 642)));
    W.ladder = f >= 646; W.ladderWobble = f >= 646 ? 0.035 * Math.sin(f * 0.6) : 0;
  }
  if (S.id === 'idea') W.ladder = false;
  // Thales' little triangle: height bar, shadow bar
  const small = (k1, k2, k3) => [
    { a: [TH[0], 0.03, TH[2] + 0.55], b: [TH[0], THH, TH[2] + 0.55], k: k1, r: 0.035 },
    { a: [TH[0], 0.03, TH[2]], b: [TH[0] + THH, 0.03, TH[2]], k: k2, r: 0.035 },
    { a: [TH[0], THH, TH[2] + 0.55], b: [TH[0] + THH, 0.03, TH[2]], k: k3, r: 0.02, col: SUN, alpha: 0.85 }];
  if (S.id === 'moment') W.lines = small(smooth(ramp(f, 969, 990)), smooth(ramp(f, 1007, 1033)), smooth(ramp(f, 1036, 1048)));
  if (S.id === 'trick') {
    W.lines = [...small(1, 1, 1),
      { a: [0, 0.4, 0], b: [PH, 0.4, 0], k: smooth(ramp(f, 1147, 1178)), r: 0.9 },
      { a: [0, 0, 0], b: [0, PH, 0], k: smooth(ramp(f, 1196, 1214)), r: 0.9 },
      { a: [0, PH, 0], b: [PH, 0.4, 0], k: smooth(ramp(f, 1206, 1226)), r: 0.5, col: SUN, alpha: 0.85 }];
  }
  if (S.id === 'measure') {
    const rp = smooth(ramp(f, 1259, 1300)), dots = smooth(ramp(f, 1316, 1348));
    W.lines = [{ a: [PB2 + 0.3, 0.06, 0], b: [PH, 0.06, 0], k: rp, r: 0.05, col: ROPE }];
    for (let i = 0; i < 10; i++) { const x0 = i * PB2 / 10, k = clamp(dots * 10 - (9 - i)); if (k > 0) W.lines.push({ a: [PB2 - x0, 0.4, 0], b: [PB2 - x0 - PB2 / 20, 0.4, 0], k, r: 0.8 }); }
    if (f >= 1340) { const th = (Math.PI / 2) * E.back(ramp(f, 1368, 1404), 1.1); W.lines.push({ a: [0, 0.4, 0], b: [PH * Math.cos(th), 0.4 + PH * Math.sin(th), 0], k: smooth(ramp(f, 1340, 1356)), r: 1.0 }); }
  }
  if (S.id === 'today') {
    const p = (f0) => smooth(ramp(f, f0, f0 + 16));
    W.lines = [...tri(PALM, 12, p(1700), p(1704), p(1708), 0.28), ...tri(OBEL, OBH, p(1716), p(1720), p(1724), 0.38), ...tri([MOUNT[0], 0, MOUNT[2]], MOUNT[1], p(1737), p(1741), p(1745), 4.5)];
  }
  return W;
};

// ---------- actors (2D cards) ----------
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const life = (f, seed, o = {}) => { const I = idle(f, seed); return { seed, blink: blinkAt(f, seed), bob: q(I.bob, 3), tilt: q(I.tilt, 1), headTilt: q(I.headTilt, 1), ...o }; };
const thales = (T, f, o = {}, pos = TH, extra = {}) => R(T, 'thales', life(f, 6, { L: 'hang', R: 'hang', expr: 'calm', ...o }), pos, extra);

export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [];
  const tint = S.light === 'golden' ? '#ffe2c8' : '#ffffff';
  switch (S.id) {
    case 'hook': {
      const wig = f >= 92 && f < 118;
      out.push(thales(T, f, { L: wig ? 'wave' : 'hang', R: wig ? 'wave' : 'hang', wv: q(f * 0.9, 1), expr: wig ? 'grin' : 'smile', look: f < 92 ? -0.4 : 0 }));
      break;
    }
    case 'reveal': out.push(thales(T, f, { expr: f < 380 ? 'shock' : 'calm', look: -0.6, headTilt: -5 })); break;
    case 'question': out.push(thales(T, f, { L: 'think', expr: f < 480 ? 'squint' : 'worried', look: -0.5 })); break;
    case 'gags': {
      if (f < 594) out.push(thales(T, f, { L: 'tape', R: 'tape', prop: 'tape', expr: f > 560 ? 'nervous' : 'neutral', look: -0.6 }, [117.6, 0, 6.6]));
      else if (f < 646) out.push(thales(T, f, { L: f < 616 ? 'up' : 'cheek', R: f < 616 ? 'up' : 'cheek', expr: f < 620 ? 'grin' : 'shock', look: -0.6 }, [117.8, 0, 6.2]));
      else { const j = q(Math.sin(f * 1.7) * 0.012, 3); out.push(thales(T, f, { L: 'reach', R: 'reach', lift: 0.3, expr: 'nervous', look: -0.4, headTilt: q(5 * Math.sin(f * 0.9), 1) }, [LADDER_AT[0] + j, LADDER_AT[1] - 0.15, 9.2 + j], { blob: false })); }
      break;
    }
    case 'waits': out.push(thales(T, f, { L: 'cross', R: 'cross', expr: f % 60 < 30 ? 'neutral' : 'whistle', look: q(0.5 * Math.sin(f * 0.08), 2), bob: 0 }, [TH[0], -0.5, TH[2]], { blob: false })); break;
    case 'shrink': out.push(thales(T, f, { L: 'hip', R: 'hip', expr: f > 880 ? 'squint' : 'neutral', look: 0.4, headTilt: 6 })); break;
    case 'moment': {
      const hold = f >= 1035 && f < 1038, ff = hold ? 1035 : f;
      out.push(thales(T, ff, { L: f >= 1035 ? 'up' : 'hip', R: f >= 1035 ? 'up' : 'hip', expr: f >= 1035 ? 'eureka' : f > 990 ? 'squint' : 'neutral', look: f < 1035 ? 0.4 : 0, headTilt: f < 1035 ? 6 : 0 }));
      break;
    }
    case 'trick': if (f < 1110) out.push(thales(T, f, { L: 'point', R: 'hip', expr: 'grin', look: -0.4 })); break;
    case 'measure': {
      if (f < 1330) {
        out.push(R(T, 'egyA', life(f, 41, { L: 'reach', R: 'reach', expr: 'whistle', look: 0.4 }), [PB2 + 1.2, 0, 0.9]));
        out.push(R(T, 'egyB', life(f, 42, { L: 'reach', R: 'reach', expr: 'grin', look: -0.4, lift: q(0.2 * Math.sin(f * 0.3), 2) }), [PH - 0.6, 0, 1.0]));
      }
      break;
    }
    case 'idea': {
      const tap = f >= 1498;
      out.push(thales(T, f, { L: tap ? 'think' : 'hang', R: 'hang', expr: tap ? 'grin' : f >= 1472 ? 'smile' : 'calm', look: 0 }));
      break;
    }
    case 'moral': {
      const down = f >= 1849;
      out.push(thales(T, f, { L: 'hang', R: 'hang', expr: down ? 'smile' : 'calm', look: 0.2, headTilt: down ? 8 : -6 }, TH, { tint }));
      break;
    }
  }
  return out;
};

// ---------- 2D effects ----------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
const glyph = (txt, col = '#ffffff') => (p) => { const g = p.g; g.save(); g.font = '900 300px Arial Black, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = 34; g.strokeStyle = '#241726'; g.strokeText(txt, 300, 500); g.fillStyle = col; g.fillText(txt, 300, 500); g.restore(); };
const ladderIcon = (p) => { for (const x of [230, 370]) p.stroke([[x, 260], [x, 760]], 22, '#8a5a34'); for (let y = 320; y < 760; y += 90) p.stroke([[230, y], [370, y]], 16, '#8a5a34'); };
const ropeIcon = (p) => { for (let i = 0; i < 4; i++) p.ell(300, 500, 150 - i * 30, 110 - i * 22, null, 22); p.stroke([[420, 520], [520, 700]], 18, '#c8a46a'); };
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [], head = [TH[0], FACE + 0.75, TH[2]];
  if (S.id === 'question' && f >= 468) { const k = E.back(ramp(f, 468, 478), 2.2); out.push(FX('q', glyph('?', '#ffd23a'), [TH[0] + 0.45, FACE + 0.55, TH[2] + 0.2], q(0.55 * k, 2))); }
  if (S.id === 'moment' && f >= 1035 && f < 1056) { const t = q((f - 1035) / 21, 2); out.push(FX('burst' + t, (p) => { p.g.translate(50, 250); T.fxBurst(p, t, '#fff3b0', 12); }, [TH[0] - 0.1, 0.6, TH[2] - 0.3], 2.2, { order: 1 })); }
  if (S.id === 'idea') {
    const pop = (f0, f1, key, draw, dx) => {
      if (f >= f0 && f < f1) { const k = E.back(ramp(f, f0, f0 + 6), 2); out.push(FX(key, draw, [TH[0] + 0.2, FACE + 0.35, TH[2] + dx], q(0.7 * k, 2))); }
      if (f >= f1 && f < f1 + 14) { const t = q((f - f1) / 14, 2); out.push(FX('poof' + t, (p) => { p.g.translate(150, 320); p.g.scale(1.6, 1.6); T.fxPuff(p, t); }, [TH[0] + 0.2, FACE + 0.35, TH[2] + dx], 0.9)); }
    };
    pop(1426, 1446, 'ladderI', ladderIcon, 0.75); pop(1472, 1490, 'ropeI', ropeIcon, -0.75);
    if (f >= 1532 && f < 1552) { const t = q((f - 1532) / 20, 2); out.push(FX('stars' + t, (p) => { p.g.translate(50, 300); T.fxStars(p, t); }, head, 0.7)); }
  }
  if (S.id === 'gags' && f >= 640 && f < 652) { const t = q((f - 640) / 12, 2); out.push(FX('dust' + t, (p) => T.fxDust(p, t, '#efd8a8'), [116.4, 0.2, 5.4], 1.4)); }
  return out;
};
