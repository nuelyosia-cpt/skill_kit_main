// Canvas2D painted textures (our own). All deterministic.
import * as THREE from './lib/three.module.js';

export const rng = (seed) => { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
export const tex = (c, rx = 1, ry = 1) => {
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
};
const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
const speckle = (g, w, h, r, n, cols, rad = [1, 3]) => { for (let i = 0; i < n; i++) { g.fillStyle = cols[(r() * cols.length) | 0]; g.beginPath(); g.ellipse(r() * w, r() * h, rad[0] + r() * rad[1], rad[0] + r() * rad[1] * 0.7, r() * 3, 0, 7); g.fill(); } };

export function planks(seed = 1, rot = 0) {
  const [c, g] = cv(512, 512), r = rng(seed), n = 8, w = 512 / n;
  for (let i = 0; i < n; i++) {
    const L = 52 + r() * 10, H = 30 + r() * 6;
    g.fillStyle = hsl(H, 42, L); g.fillRect(i * w, 0, w, 512);
    for (let k = 0; k < 14; k++) { g.strokeStyle = hsl(H - 4, 40, L - 10 - r() * 8, 0.5); g.lineWidth = 1 + r() * 2; g.beginPath(); const x = i * w + 4 + r() * (w - 8); g.moveTo(x, 0); g.bezierCurveTo(x + r() * 6 - 3, 170, x + r() * 6 - 3, 340, x + r() * 4 - 2, 512); g.stroke(); }
    const cut = r() * 512; g.fillStyle = 'rgba(40,24,14,.9)'; g.fillRect(i * w, cut, w, 4);
    for (const y of [cut - 18, cut + 18]) { g.fillStyle = '#2b2620'; g.beginPath(); g.arc(i * w + w * 0.3, y, 2.6, 0, 7); g.arc(i * w + w * 0.7, y, 2.6, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(30,18,10,.95)'; g.fillRect(i * w, 0, 3, 512);
    if (r() < 0.5) { g.fillStyle = hsl(H, 40, L - 16, .8); g.beginPath(); g.ellipse(i * w + w / 2, r() * 512, 5, 9, 0, 0, 7); g.fill(); }
  }
  return c;
}
export function beam(seed = 2, base = [30, 40, 40]) {
  const [c, g] = cv(256, 512), r = rng(seed);
  g.fillStyle = hsl(base[0], base[1], base[2]); g.fillRect(0, 0, 256, 512);
  for (let k = 0; k < 40; k++) { g.strokeStyle = hsl(base[0] - 3, base[1], base[2] - 8 - r() * 10, .45); g.lineWidth = 1 + r() * 3; g.beginPath(); const x = r() * 256; g.moveTo(x, 0); g.bezierCurveTo(x + 8, 170, x - 8, 340, x + r() * 10 - 5, 512); g.stroke(); }
  return c;
}
/** rotting pile: wet dark lower part, moss, rot holes, pale fungus streaks */
export function rotten(seed = 3) {
  const [c, g] = cv(256, 1024), r = rng(seed);
  const gr = g.createLinearGradient(0, 0, 0, 1024); gr.addColorStop(0, '#6b4a2e'); gr.addColorStop(0.45, '#4f3722'); gr.addColorStop(0.8, '#33281c'); gr.addColorStop(1, '#22231a');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 1024);
  for (let k = 0; k < 50; k++) { g.strokeStyle = `rgba(20,12,6,${.3 + r() * .4})`; g.lineWidth = 1 + r() * 3; g.beginPath(); const x = r() * 256; g.moveTo(x, 0); g.bezierCurveTo(x + 10, 300, x - 10, 700, x + r() * 10 - 5, 1024); g.stroke(); }
  // moss bands near the water line and patches
  for (let i = 0; i < 260; i++) { const y = 650 + Math.pow(r(), 0.6) * 374; g.fillStyle = hsl(85 + r() * 25, 45, 26 + r() * 14, .85); g.beginPath(); g.ellipse(r() * 256, y, 4 + r() * 12, 3 + r() * 6, 0, 0, 7); g.fill(); }
  for (let i = 0; i < 70; i++) { g.fillStyle = hsl(95, 40, 30 + r() * 10, .8); g.beginPath(); g.ellipse(r() * 256, r() * 650, 3 + r() * 8, 2 + r() * 5, 0, 0, 7); g.fill(); }
  // rot holes with cracks
  for (let i = 0; i < 9; i++) {
    const x = r() * 256, y = 200 + r() * 760, w = 10 + r() * 26, h = 18 + r() * 50;
    g.fillStyle = '#120c08'; g.beginPath(); g.ellipse(x, y, w, h, 0, 0, 7); g.fill();
    g.strokeStyle = '#8a6a48'; g.lineWidth = 3; g.beginPath(); g.ellipse(x - 2, y - 2, w, h, 0, 3.6, 5.6); g.stroke();
    g.strokeStyle = '#120c08'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x, y - h); g.lineTo(x + 6, y - h - 40 - r() * 60); g.moveTo(x, y + h); g.lineTo(x - 5, y + h + 30 + r() * 50); g.stroke();
  }
  // pale fungus spots
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(226,214,180,${.5 + r() * .4})`; g.beginPath(); g.ellipse(r() * 256, 150 + r() * 700, 2 + r() * 4, 2 + r() * 3, 0, 0, 7); g.fill(); }
  return c;
}
export function stone(seed = 4, hue = 36, sat = 14, lig = 66, bw = 128, bh = 64) {
  const [c, g] = cv(512, 512), r = rng(seed);
  g.fillStyle = '#4a4238'; g.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 512 / bh; row++) for (let col = -1; col < 512 / bw + 1; col++) {
    const x = col * bw + (row % 2) * bw / 2, y = row * bh, L = lig - 6 + r() * 12;
    g.fillStyle = hsl(hue + r() * 8 - 4, sat, L); g.beginPath(); g.roundRect(x + 3, y + 3, bw - 6, bh - 6, 6); g.fill();
    g.fillStyle = hsl(hue, sat, L + 7, .6); g.fillRect(x + 6, y + 5, bw - 14, 5);
    g.fillStyle = hsl(hue, sat, L - 12, .5); g.fillRect(x + 6, y + bh - 10, bw - 12, 5);
    speckle(g, 0, 0, r, 0, ['#000']);
    for (let k = 0; k < 6; k++) { g.fillStyle = hsl(hue, sat, L - 8 - r() * 8, .6); g.beginPath(); g.ellipse(x + r() * bw, y + r() * bh, 2 + r() * 5, 1 + r() * 3, 0, 0, 7); g.fill(); }
  }
  return c;
}
export function mossy(c0, seed = 5, amt = 1) {
  const [c, g] = cv(c0.width, c0.height), r = rng(seed); g.drawImage(c0, 0, 0);
  for (let i = 0; i < 500 * amt; i++) { const y = c.height * (0.4 + 0.6 * Math.pow(r(), 0.5)); g.fillStyle = hsl(90 + r() * 30, 40, 28 + r() * 16, .85); g.beginPath(); g.ellipse(r() * c.width, y, 4 + r() * 10, 3 + r() * 6, 0, 0, 7); g.fill(); }
  // ivy strands with leaves
  for (let s = 0; s < 8 * amt; s++) {
    let x = r() * c.width, y = c.height;
    for (let k = 0; k < 40; k++) { x += (r() - 0.5) * 18; y -= 8 + r() * 6; g.fillStyle = hsl(100 + r() * 20, 45, 30 + r() * 15); g.beginPath(); g.ellipse(x, y, 7, 5, r() * 3, 0, 7); g.fill(); g.strokeStyle = '#1d2b14'; g.lineWidth = 1.5; g.stroke(); }
  }
  return c;
}
export function grass(seed = 6) {
  const [c, g] = cv(512, 512), r = rng(seed);
  g.fillStyle = '#6fa04a'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) { g.fillStyle = hsl(85 + r() * 20, 42, 38 + r() * 14, .5); g.beginPath(); g.ellipse(r() * 512, r() * 512, 20 + r() * 50, 12 + r() * 30, r() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 1400; i++) { const x = r() * 512, y = r() * 512; g.strokeStyle = hsl(80 + r() * 30, 45, 30 + r() * 25, .9); g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + r() * 4 - 2, y - 5 - r() * 7); g.stroke(); }
  for (let i = 0; i < 30; i++) { g.fillStyle = ['#f3e27a', '#ffffff', '#e8a0c0'][i % 3]; g.beginPath(); g.arc(r() * 512, r() * 512, 2.5, 0, 7); g.fill(); }
  return c;
}
export function dirt(seed = 7) {
  const [c, g] = cv(512, 512), r = rng(seed);
  g.fillStyle = '#a88a62'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 300; i++) { g.fillStyle = hsl(30 + r() * 10, 25, 40 + r() * 25, .6); g.beginPath(); g.ellipse(r() * 512, r() * 512, 3 + r() * 14, 2 + r() * 8, r() * 3, 0, 7); g.fill(); }
  return c;
}
export function plaster(seed = 8, hue = 40) {
  const [c, g] = cv(256, 256), r = rng(seed);
  g.fillStyle = hsl(hue, 40, 86); g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 40; i++) { g.fillStyle = hsl(hue, 30, 76 + r() * 8, .5); g.beginPath(); g.ellipse(r() * 256, r() * 256, 10 + r() * 30, 6 + r() * 16, 0, 0, 7); g.fill(); }
  g.fillStyle = hsl(hue, 20, 60, .5); g.fillRect(0, 236, 256, 20);
  return c;
}
export function roof(seed = 9) {
  const [c, g] = cv(256, 256), r = rng(seed);
  g.fillStyle = '#7b2e1c'; g.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
    const x = col * 32 + (row % 2) * 16, y = row * 32; g.fillStyle = hsl(12 + r() * 8, 58, 42 + r() * 10);
    g.beginPath(); g.ellipse(x + 16, y + 16, 14, 17, 0, 0, Math.PI); g.lineTo(x + 2, y); g.fill();
    g.fillStyle = 'rgba(255,220,180,.25)'; g.fillRect(x + 6, y + 2, 5, 22);
  }
  return c;
}
export function marble(seed = 10) {
  const [c, g] = cv(256, 512), r = rng(seed);
  g.fillStyle = '#efe7d6'; g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 8; i++) { g.fillStyle = 'rgba(160,140,110,.25)'; g.fillRect(i * 32 + 2, 0, 6, 512); }
  for (let k = 0; k < 10; k++) { g.strokeStyle = 'rgba(150,140,130,.35)'; g.lineWidth = 1.5; g.beginPath(); let x = r() * 256, y = 0; g.moveTo(x, y); while (y < 512) { x += r() * 30 - 15; y += 20 + r() * 30; g.lineTo(x, y); } g.stroke(); }
  return c;
}
export function banner() {
  const [c, g] = cv(256, 512);
  g.fillStyle = '#b8282b'; g.fillRect(0, 0, 256, 512);
  g.fillStyle = '#8a1c22'; for (let i = 0; i < 5; i++) g.fillRect(20 + i * 50, 0, 12, 512);
  g.strokeStyle = '#e6b84a'; g.lineWidth = 12; g.strokeRect(14, 14, 228, 484);
  g.fillStyle = '#e6b84a'; g.font = 'bold 66px DejaVu Serif, serif'; g.textAlign = 'center'; g.fillText('SPQR', 128, 300);
  g.lineWidth = 9; g.beginPath(); g.arc(128, 180, 60, 0.4, Math.PI - 0.4, true); g.stroke();
  for (let i = 0; i < 9; i++) { const a = Math.PI + 0.35 + i * 0.3; g.beginPath(); g.ellipse(128 + Math.cos(a) * 60, 180 - Math.sin(a) * 60 * -1, 10, 5, a, 0, 7); g.fill(); }
  for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(i * 32, 512); g.lineTo(i * 32 + 16, 470); g.lineTo(i * 32 + 32, 512); g.fillStyle = '#000'; g.globalCompositeOperation = 'destination-out'; g.fill(); g.globalCompositeOperation = 'source-over'; }
  return c;
}
/** interior of the helmet, planar-mapped: rusty iron + the carved message */
export function helmetInside(reveal = 1) {
  const [c, g] = cv(1024, 1024), r = rng(77);
  const gr = g.createRadialGradient(512, 512, 40, 512, 512, 520); gr.addColorStop(0, '#6d675e'); gr.addColorStop(0.7, '#575148'); gr.addColorStop(1, '#3a352f');
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 220; i++) { g.fillStyle = hsl(22 + r() * 12, 55, 28 + r() * 16, .35 + r() * .4); g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 4 + r() * 26, 3 + r() * 14, r() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(30,26,22,${.2 + r() * .3})`; g.lineWidth = 1 + r() * 2; g.beginPath(); const x = r() * 1024, y = r() * 1024; g.moveTo(x, y); g.lineTo(x + r() * 60 - 30, y + r() * 60 - 30); g.stroke(); }
  const lines = ['THE BRIDGE', 'IS NOT', 'SAFE'], ys = [400, 530, 670], sz = [104, 112, 150];
  g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((t, li) => {
    g.font = `bold ${sz[li]}px DejaVu Serif, serif`;
    const w = g.measureText(t).width; let x = 512 - w / 2;
    for (const ch of t) {
      const cw = g.measureText(ch).width, a = (r() - 0.5) * 0.12, dy = (r() - 0.5) * 10;
      g.save(); g.translate(x + cw / 2, ys[li] + dy); g.rotate(a);
      g.fillStyle = '#d6cdbd'; g.fillText(ch, 3, 4);       // lit lower lip of the groove
      g.fillStyle = '#16120f'; g.fillText(ch, 0, 0);       // groove
      g.fillStyle = 'rgba(70,60,50,.9)'; g.fillText(ch, -2, -3);
      g.restore(); x += cw;
    }
  });
  // scratch-out flourish under the words
  g.strokeStyle = '#16120f'; g.lineWidth = 7; g.beginPath(); g.moveTo(330, 765); g.lineTo(700, 760); g.stroke();
  g.strokeStyle = '#cbbfa9'; g.lineWidth = 3; g.beginPath(); g.moveTo(332, 772); g.lineTo(702, 767); g.stroke();
  return c;
}
export function radial(col = '0,0,0', a = 0.55) {
  const [c, g] = cv(128, 128), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(0.55, `rgba(${col},${a * 0.6})`); gr.addColorStop(1, `rgba(${col},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return c;
}

// ---------------- Empty Fort painters (Han-era China) ----------------
/** grey fired-brick town wall with dark mortar seams and a few weathered bricks */
export function brick(seed = 21) {
  const [c, g] = cv(512, 512), r = rng(seed), bw = 96, bh = 36;
  g.fillStyle = '#3e3a36'; g.fillRect(0, 0, 512, 512);
  for (let row = 0; row < Math.ceil(512 / bh); row++) for (let col = -1; col < 512 / bw + 1; col++) {
    const x = col * bw + (row % 2) * bw / 2, y = row * bh, L = 56 + r() * 12;
    g.fillStyle = hsl(30 + r() * 10, 8 + r() * 6, L); g.beginPath(); g.roundRect(x + 2.5, y + 2.5, bw - 5, bh - 5, 3); g.fill();
    g.fillStyle = hsl(32, 10, L + 8, .55); g.fillRect(x + 5, y + 4, bw - 12, 4);
    g.fillStyle = hsl(30, 10, L - 14, .45); g.fillRect(x + 5, y + bh - 8, bw - 10, 4);
    if (r() < 0.12) { g.fillStyle = hsl(28, 14, L - 18, .6); g.beginPath(); g.ellipse(x + r() * bw, y + bh / 2, 8 + r() * 10, 5, 0, 0, 7); g.fill(); }
  }
  return c;
}
/** rammed earth (for the wall top / walkway) */
export function earth(seed = 22) {
  const [c, g] = cv(256, 256), r = rng(seed);
  g.fillStyle = '#b39a74'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 12; i++) { g.fillStyle = hsl(34, 26, 52 + r() * 10, .5); g.fillRect(0, r() * 256, 256, 3 + r() * 6); }
  speckle(g, 256, 256, r, 260, ['#8e7656', '#c9b088', '#7a6448'], [1, 2.5]);
  return c;
}
/** red lacquered gate door with gold studs in a grid and an iron band */
export function doorRed(seed = 23) {
  const [c, g] = cv(256, 512), r = rng(seed);
  g.fillStyle = '#9e2a22'; g.fillRect(0, 0, 256, 512);
  for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(40,6,4,.9)'; g.fillRect(k * 256 / 6, 0, 3, 512); }
  for (let k = 0; k < 30; k++) { g.strokeStyle = `rgba(70,10,8,${.25 + r() * .3})`; g.lineWidth = 1 + r() * 2; g.beginPath(); const x = r() * 256; g.moveTo(x, 0); g.lineTo(x + r() * 6 - 3, 512); g.stroke(); }
  for (let row = 0; row < 9; row++) for (let col = 0; col < 5; col++) {
    const x = 28 + col * 50, y = 34 + row * 55;
    g.fillStyle = '#5a3a10'; g.beginPath(); g.arc(x + 1.5, y + 2, 11, 0, 7); g.fill();
    g.fillStyle = '#e8b84a'; g.beginPath(); g.arc(x, y, 10, 0, 7); g.fill();
    g.fillStyle = '#fff1b8'; g.beginPath(); g.arc(x - 3, y - 3, 3.5, 0, 7); g.fill();
  }
  g.fillStyle = '#2c2420'; g.fillRect(0, 248, 256, 16);
  return c;
}
/** grey clay roof tiles (rows of half-pipes) */
export function tiles(seed = 24) {
  const [c, g] = cv(256, 256), r = rng(seed);
  g.fillStyle = '#4a4f58'; g.fillRect(0, 0, 256, 256);
  for (let col = 0; col < 8; col++) {
    const x = col * 32, L = 46 + r() * 8;
    g.fillStyle = hsl(215, 8, L); g.fillRect(x + 4, 0, 24, 256);
    g.fillStyle = hsl(215, 8, L + 14, .7); g.fillRect(x + 8, 0, 5, 256);
    for (let k = 0; k < 8; k++) { g.fillStyle = 'rgba(25,28,34,.7)'; g.fillRect(x + 4, k * 32 + 28, 24, 3); }
  }
  return c;
}
/** dry steppe grass */
export function steppe(seed = 25) {
  const [c, g] = cv(512, 512), r = rng(seed);
  g.fillStyle = '#b9b46a'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) { g.fillStyle = hsl(55 + r() * 20, 34, 46 + r() * 14, .5); g.beginPath(); g.ellipse(r() * 512, r() * 512, 20 + r() * 50, 12 + r() * 30, r() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 1300; i++) { const x = r() * 512, y = r() * 512; g.strokeStyle = hsl(50 + r() * 30, 38, 34 + r() * 26, .9); g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + r() * 4 - 2, y - 5 - r() * 7); g.stroke(); }
  return c;
}
/** zither top: dark lacquer with seven pale strings and bridges */
export function zitherTop() {
  const [c, g] = cv(512, 128);
  g.fillStyle = '#4a2a1a'; g.fillRect(0, 0, 512, 128);
  g.fillStyle = '#6b3f26'; g.fillRect(0, 10, 512, 108);
  for (let i = 0; i < 7; i++) { const y = 22 + i * 14; g.fillStyle = '#f5ecd2'; g.fillRect(20, y, 472, 2.5); }
  for (let i = 0; i < 13; i++) { g.fillStyle = '#f2d27a'; g.beginPath(); g.arc(60 + i * 30, 120, 4, 0, 7); g.fill(); }
  return c;
}
/** the war map. k = { split: 0..3 regions shown, year: 0..1, xc: 0..1 Xicheng star, pass: 0..1 lost-pass X } */
export function warMap(c, k = {}) {
  const g = c.getContext('2d'), W = c.width, H = c.height, r = rng(77);
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = '#e8d6a8'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(150,110,60,${r() * .12})`; g.beginPath(); g.ellipse(r() * W, r() * H, 10 + r() * 60, 6 + r() * 30, r() * 3, 0, 7); g.fill(); }
  g.strokeStyle = '#7a5a34'; g.lineWidth = 10; g.strokeRect(14, 14, W - 28, H - 28);
  // land outline (stylised), split into three kingdoms
  const land = [[150, 170], [430, 110], [720, 150], [880, 260], [900, 430], [860, 600], [780, 740], [620, 860], [420, 880], [240, 820], [130, 650], [110, 420]];
  const poly = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); };
  poly(land); g.fillStyle = '#d9c58e'; g.fill();
  const regions = [
    { pts: [[150, 170], [430, 110], [720, 150], [880, 260], [900, 430], [640, 470], [420, 440], [118, 450], [110, 420]], col: '#c94a3c', name: 'WEI', at: [500, 300] },
    { pts: [[118, 450], [420, 440], [470, 560], [430, 880], [240, 820], [130, 650]], col: '#4f9a52', name: 'SHU', at: [290, 650] },
    { pts: [[420, 440], [640, 470], [900, 430], [860, 600], [780, 740], [620, 860], [430, 880], [470, 560]], col: '#3f7cc0', name: 'WU', at: [660, 680] },
  ];
  const split = k.split || 0;
  regions.forEach((R, i) => {
    const a = Math.max(0, Math.min(1, split - i)); if (a <= 0) return;
    g.save(); g.globalAlpha = a * 0.85; poly(R.pts); g.fillStyle = R.col; g.fill(); g.restore();
    g.save(); poly(R.pts); g.lineWidth = 6; g.strokeStyle = '#3a2614'; g.globalAlpha = a; g.stroke(); g.restore();
    g.save(); g.globalAlpha = a; g.font = '900 86px Arial Black, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const s = 0.6 + 0.4 * Math.min(1, a * 1.4); g.translate(R.at[0], R.at[1]); g.scale(s, s);
    g.lineWidth = 14; g.strokeStyle = '#2a1a10'; g.strokeText(R.name, 0, 0); g.fillStyle = '#fff6dc'; g.fillText(R.name, 0, 0); g.restore();
  });
  poly(land); g.lineWidth = 8; g.strokeStyle = '#3a2614'; g.stroke();
  // mountains doodles
  for (let i = 0; i < 9; i++) { const x = 200 + (i * 97) % 600, y = 200 + (i * 151) % 520; g.strokeStyle = 'rgba(58,38,20,.55)'; g.lineWidth = 4; g.beginPath(); g.moveTo(x - 22, y + 12); g.lineTo(x, y - 14); g.lineTo(x + 22, y + 12); g.stroke(); }
  if (k.xc > 0) { // Xicheng star + label
    const x = 410, y = 470, s = k.xc; g.save(); g.translate(x, y); g.scale(s, s);
    g.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? 14 : 34, a = i * Math.PI / 5 - Math.PI / 2; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath();
    g.fillStyle = '#ffd84a'; g.fill(); g.lineWidth = 6; g.strokeStyle = '#2a1a10'; g.stroke(); g.restore();
  }
  if (k.year > 0) {
    g.save(); g.globalAlpha = k.year; g.font = '900 92px Arial Black, Arial'; g.textAlign = 'right'; g.textBaseline = 'alphabetic';
    g.lineWidth = 14; g.strokeStyle = '#2a1a10'; g.strokeText('228 AD', W - 56, H - 56); g.fillStyle = '#ffd36a'; g.fillText('228 AD', W - 56, H - 56); g.restore();
  }
  return c;
}
/** plain coloured flag cloth with a darker border */
export function flag(col = '#c9302c', edge = '#2a1a14') {
  const [c, g] = cv(128, 256); g.fillStyle = edge; g.fillRect(0, 0, 128, 256); g.fillStyle = col; g.fillRect(10, 10, 108, 236);
  g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(18, 18, 20, 220); return c;
}

// ---------------- Thales painters (Egypt, c. 600 BC) ----------------
/** wind-rippled desert sand */
export function sand(seed = 31) {
  const [c, g] = cv(512, 512), r = rng(seed);
  g.fillStyle = '#e2c48c'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 70; i++) { g.fillStyle = hsl(36 + r() * 8, 52, 70 + r() * 10, .45); g.beginPath(); g.ellipse(r() * 512, r() * 512, 30 + r() * 60, 10 + r() * 20, r() * 0.4, 0, 7); g.fill(); }
  for (let i = 0; i < 46; i++) { const y = r() * 512, x = r() * 512; g.strokeStyle = hsl(34, 40, 58 + r() * 8, .5); g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 30, y - 6, x + 60, y + 6, x + 100, y); g.stroke(); }
  speckle(g, 512, 512, r, 500, ['#c9a86c', '#f0dcae', '#b8945a'], [0.6, 1.4]);
  return c;
}
/** limestone blocks of the pyramid face: long courses with dark joints */
export function limestone(seed = 32) {
  const [c, g] = cv(512, 512), r = rng(seed), bh = 32;
  g.fillStyle = '#8a7350'; g.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 512 / bh; row++) {
    let x = -r() * 80;
    while (x < 512) { const w = 60 + r() * 70, L = 68 + r() * 10; g.fillStyle = hsl(38 + r() * 6, 34, L); g.fillRect(x + 2, row * bh + 2, w - 4, bh - 4);
      g.fillStyle = hsl(40, 34, L + 8, .55); g.fillRect(x + 4, row * bh + 3, w - 8, 4); g.fillStyle = hsl(36, 30, L - 14, .5); g.fillRect(x + 3, row * bh + bh - 7, w - 6, 4); x += w; }
  }
  return c;
}
/** the travel map. k = { line: 0..1 dotted route drawn, year: 0..1 } */
export function medMap(c, k = {}) {
  const g = c.getContext('2d'), W = c.width, H = c.height, r = rng(78);
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = '#e8d6a8'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(150,110,60,${r() * .12})`; g.beginPath(); g.ellipse(r() * W, r() * H, 10 + r() * 60, 6 + r() * 30, r() * 3, 0, 7); g.fill(); }
  // sea
  g.fillStyle = '#9fc4c8'; g.fillRect(40, 40, W - 80, H - 80);
  const poly = (pts, col) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fillStyle = col; g.fill(); g.lineWidth = 6; g.strokeStyle = '#3a2614'; g.stroke(); };
  poly([[40, 40], [380, 40], [360, 140], [300, 230], [330, 330], [250, 420], [200, 330], [140, 380], [90, 300], [40, 330]], '#d9c58e');               // Greece
  poly([[430, 40], [W - 40, 40], [W - 40, 420], [700, 440], [560, 420], [520, 330], [470, 260], [520, 200], [460, 140]], '#d9c58e');                // Asia Minor
  poly([[40, 760], [430, 700], [600, 720], [760, 690], [W - 40, 640], [W - 40, H - 40], [40, H - 40]], '#d9c58e');                                     // Egypt / Libya coast
  g.strokeStyle = '#3f7cc0'; g.lineWidth = 9; g.beginPath(); g.moveTo(640, 712); g.bezierCurveTo(650, 800, 610, 880, 640, H - 40); g.stroke();       // Nile
  // Miletus dot + Egypt pyramid icon
  g.fillStyle = '#c94a3c'; g.beginPath(); g.arc(520, 290, 16, 0, 7); g.fill(); g.lineWidth = 5; g.strokeStyle = '#2a1a10'; g.stroke();
  g.beginPath(); g.moveTo(560, 880); g.lineTo(610, 800); g.lineTo(660, 880); g.closePath(); g.fillStyle = '#f0c870'; g.fill(); g.lineWidth = 5; g.stroke();
  const label = (t, x, y, s = 58) => { g.save(); g.font = `900 ${s}px Arial Black, Arial`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 12; g.strokeStyle = '#2a1a10'; g.strokeText(t, x, y); g.fillStyle = '#fff6dc'; g.fillText(t, x, y); g.restore(); };
  label('MILETUS', 640, 230); label('EGYPT', 790, 930, 66); label('GREECE', 190, 200, 50);
  // dotted route
  const L = Math.max(0, Math.min(1, k.line || 0));
  if (L > 0) { g.save(); g.setLineDash([22, 18]); g.lineWidth = 9; g.strokeStyle = '#a0281c'; g.beginPath();
    const pts = []; for (let i = 0; i <= 60; i++) { const t = i / 60 * L, x = 520 + (610 - 520) * t + Math.sin(t * Math.PI) * 120, y = 290 + (790 - 290) * t; pts.push([x, y]); }
    pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.restore();
    const [bx, by] = pts[pts.length - 1]; g.save(); g.translate(bx, by); g.fillStyle = '#7a4a2a'; g.beginPath(); g.moveTo(-26, 0); g.lineTo(26, 0); g.lineTo(16, 14); g.lineTo(-16, 14); g.closePath(); g.fill(); g.fillStyle = '#f4f0e4'; g.beginPath(); g.moveTo(0, -4); g.lineTo(0, -44); g.lineTo(22, -10); g.closePath(); g.fill(); g.restore(); }
  if (k.year > 0) { g.save(); g.globalAlpha = k.year; g.font = '900 92px Arial Black, Arial'; g.textAlign = 'left'; g.lineWidth = 14; g.strokeStyle = '#2a1a10'; g.strokeText('600 BC', 70, H - 70); g.fillStyle = '#ffd36a'; g.fillText('600 BC', 70, H - 70); g.restore(); }
  return c;
}
