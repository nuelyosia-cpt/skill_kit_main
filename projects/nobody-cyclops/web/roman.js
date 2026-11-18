FACE.snore = { eye: ["dash", "dash"], brow: [0, -1], mouth: "o" };
FACE.stubborn = { eye: ["lid", "lid"], brow: [4, -3], mouth: "frown" };
FACE.squint = { eye: ["slit", "slit"], brow: [3, -2], mouth: "dash" };
FACE.smirk = { eye: ["lid", "lid"], brow: [-2, 3], mouth: "smirk" };
FACE.wink = { eye: ["happy", "lid"], brow: [-3, -2], mouth: "smirk" };
FACE.calm = { eye: ["happy", "happy"], brow: [-1, -1], mouth: "smile" };
FACE.worried = { eye: ["lid", "lid"], brow: [-5, -5], mouth: "wave" };
FACE.eureka = { eye: ["shock", "shock"], brow: [-6, -6], mouth: "O" };

// ---------------- Roman-era cast (our own designs), built on the Pen / blob / face helpers above ----------------
const SILK = "#f4f0e4";
const STEEL = "#aeb6bf", BRASS = "#d9a845", LEATHER = "#7a4a2a";
export const OUTFITS = {
  odysseus: { tunic: "#e6d6b2", cape: "#b4312c", skin: "#f0c39a", hair: "#4a2e1e", beard: "#5a3824", sash: "#c99a3a" },
  sailorA: { tunic: "#4f7fb8", skin: "#e9b98c", hair: "#2b211c", moustache: "#2b211c", sash: "#8a5a34" },
  sailorB: { tunic: "#c98a3a", skin: "#f5c9a0", hanHat: "kerchief", kerchief: "#b8322f", sash: "#5a3b2a", stout: true },
  sailorC: { tunic: "#6a8a5a", skin: "#c99067", hair: "#1e1714", beard: "#1e1714", sash: "#3a2a20" },
  thales: { tunic: "#f2ece0", dress: "#f2ece0", toga: "#4f74a8", skin: "#f3cfa8", hair: "#bdb8ae", beard: "#dcd8cf", brows: "#cfcac0", sash: "#4f74a8" },
  egyA: { tunic: "#f4efe2", skin: "#b9784a", hanHat: "kerchief", kerchief: "#e9d9a0", sash: "#3a6a9a" },
  egyB: { tunic: "#f4efe2", skin: "#a8683c", hair: "#1a1414", sash: "#c8862a", stout: true },
  zhuge: { tunic: "#f2eee2", dress: "#f2eee2", skin: "#ffe0bf", hair: "#1c1a1e", hanHat: "lunjin", goatee: "#1c1a1e", sash: "#3c5a8c", collar: "#3c5a8c" },
  simayi: { tunic: "#3a3036", cape: "#7a1e22", skin: "#f3d2b0", armor: "lam", lamA: "#c9a24a", lamB: "#a8822e", belt: "#3a2418", hanHat: "helmGold", goatee: "#2a2022" },
  wei: { tunic: "#3a3438", cape: null, skin: "#f2c9a0", armor: "lam", lamA: "#5a5e68", lamB: "#474b55", belt: "#5a2418", hanHat: "helm" },
  wei2: { tunic: "#4a3a34", skin: "#d9a57c", armor: "lam", lamA: "#646873", lamB: "#50545e", belt: "#5a2418", hanHat: "helm" },
  masu: { tunic: "#5f8a52", skin: "#f5c9a0", armor: "lam", lamA: "#8fae7a", lamB: "#6f8f5c", belt: "#3a2418", hanHat: "helmGreen", moustache: "#2a2022" },
  cook: { tunic: "#d8c8a8", skin: "#f0c095", stout: true, apron: "#f4f1ea", hanHat: "chef", moustache: "#3a2a20" },
  clerk: { tunic: "#6a7aa8", dress: "#6a7aa8", skin: "#ffe2c2", hair: "#1c1a1e", hanHat: "futou", sash: "#2b2f45" },
  sweepA: { tunic: "#8a6a4a", skin: "#e9b98c", hanHat: "kerchief", kerchief: "#5a7a9a", sash: "#3a2a20" },
  sweepB: { tunic: "#6a8a6a", skin: "#f5c9a0", hanHat: "kerchief", kerchief: "#9a5a4a", sash: "#3a2a20", stout: true },
  legion: { tunic: "#b8322f", cape: "#8f2228", skin: SKIN, helmet: true, armor: true, spear: true, shield: true },
  old: { tunic: "#9c4a3c", cape: "#6e3330", skin: "#f3d6bb", helmet: "old", armor: true, spear: true, shield: false, beard: "#f4f1ea", brows: "#f4f1ea" },
  toga: { tunic: "#f1ead8", skin: "#f5c9a0", toga: "#6b3c8f", hair: "#3b2a20", stout: true },
  civA: { tunic: "#4f7fb8", skin: "#f5c9a0", hair: "#5a3b2a" },
  civB: { tunic: "#d9a441", skin: SKIN, hair: "#2b211c", dress: "#c25a7a" },
  civC: { tunic: "#5d8a3a", skin: "#c99067", hair: "#1e1714", stout: true },
  workA: { tunic: "#8a5d3b", skin: "#f5c9a0", cap: "#c2733a", apron: "#d8c9a6" },
  workB: { tunic: "#3f6a6f", skin: "#ecd0b6", cap: "#5b4a8a", moustache: "#4a3020" },
};

/** galea: iron bowl, brass brow band, cheek guards, transverse red crest */
const galea = (p, H, cx, hc, light, thick, ow, old, u) => {
  const crest = old ? "#8d4b3f" : "#d2372f", bowl = old ? "#8f8a7e" : STEEL;
  // crest (behind the bowl top)
  const cy0 = hc - H.b * 0.98;
  const cr = ellPts(cx, cy0, 0.66 * 2 * H.a, 0.42 * 2 * H.b, 180, 360, 0, 40);
  cr.push([cx + 0.66 * 2 * H.a * 0.98, cy0 + 4 * u], [cx - 0.66 * 2 * H.a * 0.98, cy0 + 4 * u]);
  const crP = [...ellPts(cx, cy0 + 2 * u, 0.62 * 2 * H.a, 0.36 * 2 * H.b, 180, 360, 0, 40)];
  p.shadedFill(crP, crest, mul(crest, [0.7, 0.62, 0.7]), light, 0.62 * 2 * H.a, 0.3);
  p.clip(crP, () => { for (let i = -9; i <= 9; i++) p.stroke([[cx + i * 7.4 * u, cy0], [cx + i * 9.4 * u, cy0 - 0.62 * H.b * Math.cos(i / 11)]], 1.4 * u, mul(crest, [0.62, 0.55, 0.62])); });
  if (old) p.clip(crP, () => { for (let i = 0; i < 6; i++) p.ell(cx + (i - 3) * 22 * u, cy0 - 18 * u - (i % 2) * 10 * u, 9 * u, 5 * u, "#6f6a5e", 0); });
  p.inkRing(crP, ow * 0.85, thick);
  p.poly(rrect(cx - 10 * u, cy0 - 6 * u, cx + 10 * u, cy0 + 6 * u, 3 * u), BRASS, 2 * u);
  // bowl: upper head cap
  const bandY = hc - H.b * 0.42;
  const bp = ellPts(cx, bandY, H.a * 1.05, H.b * 0.66, 180, 360, 0, 48);
  p.shadedFill(bp, bowl, mul(bowl, [0.62, 0.64, 0.72]), light, H.a, 0.4);
  p.clip(bp, () => {
    p.stroke(ellPts(cx - 20 * u, bandY - 0.3 * H.b, 0.25 * H.a, 0.18 * H.b, 200, 300, 0, 16), 4 * u, "#ffffff55");
    if (old) for (let i = 0; i < 9; i++) p.ell(cx + Math.sin(i * 2.3) * 0.8 * H.a, bandY - (0.08 + 0.5 * ((i * 0.37) % 1)) * H.b, (3 + (i % 3) * 2) * u, (2 + (i % 2)) * u, "#8a4b22", 0);
  });
  p.inkRing(bp, ow * 0.9, thick);
  p.band([[cx - H.a * 1.04, bandY], [cx + H.a * 1.04, bandY]], old ? "#a88a4a" : BRASS, 7 * u, 1.8 * u, "round");
  for (const s of [-1, 1]) p.dot(cx + s * 0.55 * H.a, bandY, 2.2 * u, "#fff3c4");
};
const cheeks = (p, H, cx, hc, light, ow, old, u) => {
  const bowl = old ? "#8f8a7e" : STEEL;
  for (const s of [-1, 1]) {
    const x0 = cx + s * 0.78 * H.a, x1 = cx + s * 1.07 * H.a, y0 = hc - H.b * 0.42, y1 = hc + H.b * 0.48;
    const pts = [[x0, y0], [x1, y0], [x1 - s * 0.04 * H.a, y1 - 0.1 * H.b], [x0 + s * 0.06 * H.a, y1], [x0 - s * 0.05 * H.a, (y0 + y1) / 2]];
    p.shadedFill(pts, bowl, mul(bowl, [0.62, 0.64, 0.72]), light, 0.2 * H.a, 0.3);
    p.poly(pts, null, ow * 0.8);
    p.dot((x0 + x1) / 2, (y0 + y1) / 2 - 0.05 * H.b, 2.2 * u, BRASS);
  }
};
const cobweb = (p, cx, cy, r, u) => {
  const g = p.g; g.save(); g.globalAlpha = 0.8;
  for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.05 + 0.9 * i / 6); p.stroke([[cx, cy], [cx + Math.cos(a) * r, cy + Math.sin(a) * r]], 1.1 * u, "#f2f2f2"); }
  for (let k = 1; k <= 4; k++) { const rr = r * k / 4.3, pts = []; for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.05 + 0.9 * i / 6); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } p.stroke(pts, 1 * u, "#f2f2f2"); }
  g.restore();
};

/** front-facing Roman-era character. opts: expr, blink, look, facing, seed, L/R arm poses, tilt, headTilt, bob, nohelmet, light */
export const romanFront = (p, key, opts = {}) => {
  const O = typeof key === "string" ? OUTFITS[key] : key;
  const { expr = "neutral", blink = 0, look = 0, facing = 0, seed = 3, L = "hang", R = O.spear ? "spear" : "hang", tilt = 0, headTilt = 0,
    bob = 0, nohelmet = false, light = rad(-120), web = false, step = 0 } = opts;
  const lid = lidOf(blink), skin = O.skin ?? SKIN;
  const H = headBlob(seed, 118, facing), W = 2 * H.a, HH = 2 * H.b, u = W / 100;
  const torsoL = O.stout ? 1.12 : 1.08, legsL = 1.38, sole = 975;
  const torsoBot = sole - legsL * HH - bob * HH, chin = torsoBot - torsoL * HH, hc = chin - H.b, hipY = torsoBot - 0.12 * HH;
  const thick = thickAngle(light), ow = 5 * u, cx = 300;
  const legCol = mix(O.tunic, INK, 0.62), armCol = mix(O.tunic, INK, 0.5);
  const helmet = !!O.helmet && !nohelmet, old = O.helmet === "old";
  p.rot = null;
  // ---- cape behind everything ----
  if (O.cape) {
    const cp = [[cx - 0.48 * W, chin + 0.08 * HH], [cx + 0.48 * W, chin + 0.08 * HH], [cx + 0.62 * W, sole - 0.55 * HH], [cx + 0.2 * W, sole - 0.45 * HH], [cx - 0.2 * W, sole - 0.5 * HH], [cx - 0.62 * W, sole - 0.55 * HH]];
    p.gradFill(cp, O.cape, mul(O.cape, [0.6, 0.6, 0.7]), light); p.inkRing(cp, ow * 0.8, thick);
  }
  // ---- legs ----
  const dress = !!O.dress;
  for (const side of [-1, 1]) {
    const up = Math.max(0, Math.sin(Math.PI * 2 * (step + (side > 0 ? 0.5 : 0)))) * 30 * (step ? 1 : 0);
    const hx = cx + side * 16 * u, fx = cx + side * 22 * u, fy = sole - 4 * u - up;
    p.stroke(curve([hx, hipY], [(hx + fx) / 2 + side * 2 * u, (hipY + fy) / 2], [fx, fy]), 5.8 * u, legCol);
    const sandal = O.helmet ? LEATHER : "#5a3b2a";
    p.stroke([[fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u]], 7.5 * u + 3, INK);
    p.stroke([[fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u]], 7.5 * u, sandal);
    if (O.helmet) for (let k = 1; k <= 3; k++) p.stroke([[fx - 4 * u, fy - k * 0.07 * HH], [fx + 4 * u, fy - k * 0.07 * HH - 2 * u]], 2 * u, LEATHER);
  }
  // ---- upper body ----
  p.rot = tilt ? [rad(tilt), cx, hipY] : null;
  const T = { a: (0.4 * W) / 1.06 * (O.stout ? 1.12 : 1), b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.6, egg: O.stout ? 0.17 : 0.12, asym: 0.04 * facing, rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = cx + 3 * u * facing, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const S = (side) => [tcx + side * 0.85 * T.a, chin + 0.12 * HH];
  const arm = (side, pose) => {
    const s = S(side), X = (k) => tcx + side * (T.a * 1.1 + k * u);
    switch (pose) {
      case "spear": return { pts: [s, [X(6), s[1] + 0.42 * HH], [X(10), s[1] + 0.2 * HH]], front: false };
      case "point": return { pts: [s, [X(28), s[1] - 0.02 * HH], [X(62), s[1] - 0.1 * HH]], front: false, finger: true };
      case "up": return { pts: [s, [X(14), s[1] - 0.3 * HH], [X(22), s[1] - 0.75 * HH]], front: false };
      case "wave": return { pts: [s, [X(16), s[1] - 0.2 * HH], [X(30 + 10 * Math.sin(opts.wv || 0)), s[1] - 0.62 * HH]], front: false };
      case "hip": return { pts: [s, [X(22), s[1] + 0.3 * HH], [tcx + side * T.a * 0.95, torsoBot - 0.3 * HH]], front: false };
      case "belly": return { pts: [s, [X(8), s[1] + 0.45 * HH], [tcx + side * 0.25 * T.a, torsoBot - 0.35 * HH]], front: true };
      case "temple": return { pts: [s, [X(26), s[1] + 0.05 * HH], [cx + side * (H.a + 16 * u), hc - 0.1 * HH]], front: false, swirl: true };
      case "lift": return { pts: [s, [X(20), s[1] - 0.25 * HH], [X(4), s[1] - 0.82 * HH]], front: false };
      case "shield": return { pts: [s, [X(4), s[1] + 0.4 * HH], [tcx + side * 0.6 * T.a, torsoBot - 0.1 * HH]], front: true };
      case "cross": return { pts: [s, [X(2), s[1] + 0.38 * HH], [tcx - side * 0.45 * T.a, s[1] + 0.32 * HH]], front: true };
      case "reach": { const lf = (opts.lift || 0) * 0.62 * HH; return { pts: [s, [X(42), s[1] - 0.12 * HH - lf * 0.6], [X(82), s[1] - 0.5 * HH - lf]], front: false }; }
      case "cheek": return { pts: [s, [X(16), s[1] + 0.05 * HH], [cx + side * (H.a + 2 * u), hc + 0.25 * H.b]], front: false };
      case "fan": return { pts: [s, [X(6), s[1] + 0.42 * HH], [tcx + side * 0.55 * T.a, chin + 0.12 * HH - (opts.fanLift || 0) * 0.1 * HH]], front: true, prop: true };
      case "play": { const pk = opts.pluck || 0; return { pts: [s, [X(2), s[1] + 0.36 * HH], [tcx + side * (0.7 * T.a + pk * 8 * u), torsoBot - 0.2 * HH - pk * 0.06 * HH]], front: true }; }
      case "hold": return { pts: [s, [X(10), s[1] + 0.4 * HH], [X(14), torsoBot - 0.15 * HH]], front: true, prop: true };
      case "sweep": { const sw = opts.sw || 0; return { pts: [s, [X(12), s[1] + 0.36 * HH], [tcx + side * 0.2 * T.a + sw * 30 * u, torsoBot - 0.05 * HH]], front: true, prop: true }; }
      case "hug": return { pts: [s, [X(6), s[1] + 0.4 * HH], [tcx - side * 0.15 * T.a, torsoBot - 0.45 * HH]], front: true, prop: true };
      case "think": return { pts: [s, [X(26), s[1] + 0.05 * HH], [cx + side * (H.a + 14 * u), hc - 0.12 * HH]], front: false };
      case "tape": return { pts: [s, [X(20), s[1] + 0.22 * HH], [X(46), s[1] + 0.05 * HH]], front: false, prop: true };
      case "thumb": return { pts: [s, [X(20), s[1] + 0.12 * HH], [X(44), s[1] - 0.12 * HH]], front: false, thumb: true };
      default: return { pts: [s, [X(4), s[1] + 0.48 * HH], [X(3), chin + 1.04 * HH]], front: false };
    }
  };
  const arms = [arm(-1, L), arm(1, R)];
  const drawArm = (a) => {
    p.stroke(curve(a.pts[0], a.pts[1], a.pts[2]), 5.2 * u, armCol);
    const [hx, hy] = a.pts[2];
    p.dot(hx, hy, 5.5 * u);
    if (a.finger) { const dx = a.pts[2][0] - a.pts[1][0], dy = a.pts[2][1] - a.pts[1][1], l = Math.hypot(dx, dy); p.stroke([[hx, hy], [hx + dx / l * 14 * u, hy + dy / l * 14 * u]], 2.6 * u); }
    if (a.thumb) p.stroke([[hx, hy], [hx + Math.sign(hx - cx) * 6 * u, hy - 12 * u]], 2.6 * u);
  };
  // spear behind
  if (O.spear && R === "spear") {
    const [hx, hy] = arms[1].pts[2], s0 = [hx + 2 * u, sole - 2 * u], s1 = [hx - 3 * u, 70];
    p.band([s0, s1], old ? "#6d5236" : "#8a5a34", 4.2 * u, 1.4 * u, "round");
    const tip = [[s1[0] - 7 * u, s1[1] + 6 * u], [s1[0], s1[1] - 34 * u], [s1[0] + 7 * u, s1[1] + 6 * u], [s1[0], s1[1] + 14 * u]];
    p.poly(tip, old ? "#8b7c6a" : "#c9cfd6", 2 * u);
    if (web) cobweb(p, s1[0] - 2 * u, s1[1] + 60 * u, 70 * u, u);
  }
  for (const a of arms) if (!a.front) drawArm(a);
  // torso
  if (dress) {
    const D = { a: 0.5 * W * 0.98, b: 0.5 * ((sole - 0.35 * HH) - (chin - 0.2 * HH)), nTop: 2.0, nBot: 3.0, egg: 0.35, asym: 0, rot: 0, noise: 0.006, seed: seed + 9 };
    const dp = blobPts(cx, sole - 0.35 * HH - D.b, D);
    p.gradFill(dp, O.dress, mul(O.dress, SH_CLOTH), light); p.inkRing(dp, ow, thick);
  }
  // skirt / pteruges below the torso
  if (!dress) {
    const sk = [[tcx - 0.92 * T.a, torsoBot - 0.2 * HH], [tcx + 0.92 * T.a, torsoBot - 0.2 * HH], [tcx + 1.0 * T.a, torsoBot + 0.3 * HH], [tcx - 1.0 * T.a, torsoBot + 0.3 * HH]];
    p.gradFill(sk, O.tunic, mul(O.tunic, SH_CLOTH), light); p.poly(sk, null, ow * 0.8);
    if (O.armor === true) for (let i = -3; i <= 3; i++) { const x = tcx + i * 0.27 * T.a, st = [[x - 9 * u, torsoBot - 0.05 * HH], [x + 9 * u, torsoBot - 0.05 * HH], [x + 9 * u, torsoBot + 0.22 * HH], [x - 9 * u, torsoBot + 0.22 * HH]]; p.poly(st, old ? "#5e4632" : LEATHER, 1.6 * u); }
  }
  p.gradFill(tp, O.tunic, mul(O.tunic, SH_CLOTH), light);
  p.clip(tp, () => {
    if (O.armor === "lam") {
      const top = chin - 0.1 * HH, bot = torsoBot - 0.2 * HH;
      for (let row = 0; row < 7; row++) for (let i = -6; i <= 6; i++) {
        const y = top + (bot - top) * row / 7, x = tcx + i * 0.2 * T.a + (row % 2) * 0.1 * T.a;
        p.poly(rrect(x - 0.09 * T.a, y, x + 0.09 * T.a, y + (bot - top) / 6.2, 3 * u), row % 2 ? O.lamA : O.lamB, 1.2 * u);
      }
      p.band([[tcx - 1.4 * T.a, torsoBot - 0.2 * HH], [tcx + 1.4 * T.a, torsoBot - 0.2 * HH]], O.belt || LEATHER, 0.08 * HH, 1.5 * u);
    } else if (O.armor) {
      const top = chin - 0.1 * HH, bot = torsoBot - 0.25 * HH, n = 5;
      for (let i = 0; i < n; i++) {
        const y0 = top + (bot - top) * i / n, y1 = top + (bot - top) * (i + 1) / n;
        const c = old ? (i % 2 ? "#8d8679" : "#9a9384") : (i % 2 ? "#a7b0ba" : "#bcc4cc");
        p.poly([[tcx - 1.5 * T.a, y0], [tcx + 1.5 * T.a, y0 + 3 * u], [tcx + 1.5 * T.a, y1 + 3 * u], [tcx - 1.5 * T.a, y1]], c, 1.8 * u);
      }
      p.band([[tcx - 1.4 * T.a, torsoBot - 0.2 * HH], [tcx + 1.4 * T.a, torsoBot - 0.2 * HH]], LEATHER, 0.08 * HH, 1.5 * u);
      for (let i = -2; i <= 2; i++) p.dot(tcx + i * 0.3 * T.a, torsoBot - 0.2 * HH, 2.4 * u, BRASS);
      if (old) for (let i = 0; i < 5; i++) p.ell(tcx + Math.sin(i * 1.7) * 0.7 * T.a, top + (bot - top) * ((i * 0.31) % 1), 6 * u, 3 * u, "#8a4b22", 0);
    } else {
      p.band([[tcx - 1.4 * T.a, torsoBot - 0.24 * HH], [tcx + 1.4 * T.a, torsoBot - 0.24 * HH]], O.sash || (O.apron ? "#5a3b2a" : "#e2c27a"), 0.05 * HH, 1.2 * u);
      if (O.collar) { p.stroke([[tcx - 0.45 * T.a, chin - 0.02 * HH], [tcx + 0.05 * T.a, chin + 0.42 * HH]], 0.07 * HH, O.collar); p.stroke([[tcx + 0.45 * T.a, chin - 0.02 * HH], [tcx - 0.02 * T.a, chin + 0.3 * HH]], 0.07 * HH, O.collar); }
      if (O.toga) p.band([[tcx - 1.0 * T.a, chin - 0.1 * HH], [tcx + 1.1 * T.a, torsoBot - 0.1 * HH]], O.toga, 0.16 * HH, 1.6 * u);
      if (O.apron) p.poly([[tcx - 0.55 * T.a, torsoBot - 0.2 * HH], [tcx + 0.55 * T.a, torsoBot - 0.2 * HH], [tcx + 0.6 * T.a, torsoBot + 0.2 * HH], [tcx - 0.6 * T.a, torsoBot + 0.2 * HH]], O.apron, 1.6 * u);
      p.stroke([[tcx - 0.2 * T.a, chin + 0.02 * HH], [tcx, chin + 0.16 * HH], [tcx + 0.2 * T.a, chin + 0.02 * HH]], 2 * u);
    }
  });
  p.inkRing(tp, ow, thick);
  if (O.armor) for (const s of [-1, 1]) { // shoulder plates
    const sp = ellPts(tcx + s * 0.72 * T.a, chin + 0.1 * HH, 0.42 * T.a, 0.13 * HH, 180, 360, s * 8, 20);
    p.poly(sp, old ? "#9a9384" : "#c5ccd3", 1.8 * u);
  }
  if (O.moss) {/* reserved */}
  for (const a of arms) if (a.front) drawArm(a);
  if (opts.prop) { const a = arms.find((x) => x.prop) || arms[1]; drawProp(p, opts.prop, a.pts[2], u, HH, sole, opts); }
  // shield in front, held by the left hand
  if (O.shield && L === "shield") {
    const sx = tcx - 0.55 * T.a, sy = torsoBot + 0.05 * HH, sw = 0.36 * W, sh = 0.78 * HH;
    const sp = rrect(sx - sw, sy - sh, sx + sw, sy + sh, 8 * u);
    p.gradFill(sp, "#c0302c", "#7d1d22", light);
    p.clip(sp, () => {
      p.band([[sx - sw, sy], [sx + sw, sy]], BRASS, 6 * u, 1.2 * u);
      p.band([[sx, sy - sh], [sx, sy + sh]], BRASS, 6 * u, 1.2 * u);
      for (const s of [-1, 1]) { p.stroke([[sx + s * 12 * u, sy - 14 * u], [sx + s * 34 * u, sy - 46 * u], [sx + s * 22 * u, sy - 44 * u], [sx + s * 46 * u, sy - 74 * u]], 3.5 * u, BRASS); p.stroke([[sx + s * 12 * u, sy + 14 * u], [sx + s * 34 * u, sy + 46 * u], [sx + s * 22 * u, sy + 44 * u], [sx + s * 46 * u, sy + 74 * u]], 3.5 * u, BRASS); }
      p.stroke(ellPts(sx - sw * 0.5, sy - sh * 0.7, sw * 0.3, sh * 0.1, 200, 320, 0, 10), 3 * u, "#ffffff44");
    });
    p.ell(sx, sy, 13 * u, 13 * u, "#e6c068", 2.2 * u);
    p.inkRing(sp, ow, thick);
  }
  // ---- head ----
  const [cpx, cpy] = rotAbout([cx, chin], rad(tilt), [cx, hipY]);
  const Ah = tilt + headTilt;
  p.rot = Ah ? [rad(Ah), cx, chin, cpx - cx, cpy - chin] : null;
  if (helmet) galea(p, H, cx, hc, light, thick, ow, old, u);
  const hp = blobPts(cx, hc, H);
  if (O.hair && !helmet) { const hb = blobPts(cx, hc - 0.03 * HH, { ...H, a: H.a * 1.04, b: H.b * 1.05 }); p.poly(hb, O.hair, 0); }
  p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
  p.inkRing(hp, ow, thick);
  if (helmet) {
    const bandY = hc - H.b * 0.42, bp = ellPts(cx, bandY, H.a * 1.05, H.b * 0.66, 180, 360, 0, 48);
    p.shadedFill(bp, old ? "#8f8a7e" : STEEL, mul(old ? "#8f8a7e" : STEEL, [0.62, 0.64, 0.72]), light, H.a, 0.4);
    p.clip(bp, () => { p.stroke(ellPts(cx - 20 * u, bandY - 0.3 * H.b, 0.25 * H.a, 0.18 * H.b, 200, 300, 0, 16), 5 * u, "#ffffff66");
      if (old) for (let i = 0; i < 9; i++) p.ell(cx + Math.sin(i * 2.3) * 0.8 * H.a, bandY - (0.08 + 0.5 * ((i * 0.37) % 1)) * H.b, (4 + (i % 3) * 2) * u, (2.5 + (i % 2)) * u, "#8a4b22", 0); });
    p.poly(bp, null, ow * 0.9);
    p.band([[cx - H.a * 1.05, bandY], [cx + H.a * 1.05, bandY]], old ? "#a88a4a" : BRASS, 7 * u, 1.8 * u, "round");
    p.poly(rrect(cx - 4 * u, bandY - 0.55 * H.b, cx + 4 * u, bandY - 3 * u, 2 * u), old ? "#a88a4a" : BRASS, 1.5 * u);
    cheeks(p, H, cx, hc, light, ow, old, u);
  } else if (O.hanHat) { /* drawn after the face */ }
  else if (O.cap) hatOn(p, { hat: "cap", cap: O.cap, jacket: O.tunic }, hp, H, cx, hc, light, seed, facing, false);
  else if (O.hair) hatOn(p, { hat: "hair", hair: O.hair, jacket: O.tunic }, hp, H, cx, hc, light, seed, facing, false);
  else if (O.helmet && nohelmet) { // bald old head with white side tufts
    for (const s of [-1, 1]) p.ell(cx + s * 0.9 * H.a, hc - 0.1 * H.b, 0.22 * H.a, 0.3 * H.b, "#f4f1ea", 3 * u);
  }
  if (O.beard) {
    const bd = blobPts(cx + 6 * u * facing, hc + 0.85 * H.b, { a: 0.62 * H.a, b: 0.75 * H.b, nTop: 2.4, nBot: 1.6, egg: -0.35, asym: 0, rot: 0, noise: 0.02, seed: seed + 4 });
    p.shadedFill(bd, O.beard, mul(O.beard, [0.86, 0.86, 0.92]), light, 0.6 * H.a, 0.3);
    p.clip(bd, () => { for (let i = -3; i <= 3; i++) p.stroke([[cx + i * 9 * u, hc + 0.45 * H.b], [cx + i * 7 * u, hc + 1.35 * H.b]], 1.2 * u, "#c9c4bb"); });
    p.inkRing(bd, ow * 0.8, thick);
  }
  faceFront(p, cx, hc, W, expr, facing, look, lid, helmet, skin, O.beard ? O.beard : O.moustache, !!O.stout);
  if (O.goatee) { // thin scholar beard + moustache
    const gx = cx + 7 * u * facing, gy = hc + 0.62 * H.b;
    p.poly([[gx - 11 * u, gy], [gx + 11 * u, gy], [gx + 2 * u, gy + 0.62 * H.b], [gx - 2 * u, gy + 0.62 * H.b]], O.goatee, 2.2 * u);
    for (const sd of [-1, 1]) p.stroke([[gx + sd * 4 * u, hc + 0.38 * H.b], [gx + sd * 20 * u, hc + 0.5 * H.b], [gx + sd * 27 * u, hc + 0.66 * H.b]], 3.2 * u, O.goatee);
  }
  if (O.hanHat) hanHat(p, O, H, cx, hc, light, thick, ow, u, facing);
  if (O.brows) for (const s of [-1, 1]) p.ell(cx + 7 * u * facing + s * 14 * u, hc - 20 * u, 11 * u, 5 * u, O.brows, 2 * u);
  if (O.beard) { // re-draw the mouth over the beard for open mouths
    if (expr === "shock" || expr === "snore") p.ell(cx + 8 * u * facing, hc + 22 * u, 6 * u, 7 * u, "#5a1e28", 2 * u);
  }
  p.rot = null;
  if (arms.some((a) => a.swirl)) { // cuckoo swirl next to the temple
    const a = arms.find((x) => x.swirl), [hx, hy] = a.pts[2], ph = opts.swirl || 0, pts = [];
    for (let i = 0; i < 40; i++) { const t = i / 40 * Math.PI * 4 + ph, r = (4 + i * 0.7) * u; pts.push([hx + Math.cos(t) * r, hy - 40 * u + Math.sin(t) * r]); }
    p.stroke(pts, 3 * u, "#ffffff"); p.stroke(pts, 1.4 * u, INK);
  }
};

/** loose helmet prop card (lifted off the old soldier) */
export const helmetCard = (p) => {
  const H = headBlob(3, 118, 0), u = 2 * H.a / 100, hc = 560, light = rad(-120), thick = thickAngle(light), ow = 5 * u;
  galea(p, H, 300, hc, light, thick, ow, true, u);
  const bandY = hc - H.b * 0.42, bp = ellPts(300, bandY, H.a * 1.05, H.b * 0.66, 180, 360, 0, 48);
  // dark inside visible from below
  p.ell(300, bandY, H.a * 1.05, 0.12 * H.b, "#2a221e", 0);
  p.shadedFill(bp, "#8f8a7e", mul("#8f8a7e", [0.62, 0.64, 0.72]), light, H.a, 0.4);
  p.clip(bp, () => { for (let i = 0; i < 9; i++) p.ell(300 + Math.sin(i * 2.3) * 0.8 * H.a, bandY - (0.08 + 0.5 * ((i * 0.37) % 1)) * H.b, (4 + (i % 3) * 2) * u, (2.5 + (i % 2)) * u, "#8a4b22", 0); });
  p.poly(bp, null, ow * 0.9);
  p.band([[300 - H.a * 1.05, bandY], [300 + H.a * 1.05, bandY]], "#a88a4a", 7 * u, 1.8 * u, "round");
  cheeks(p, H, 300, hc, light, ow, true, u);
};

/** ZZZ for the sleeping guard */
export const fxZ = (p, t) => {
  const g = p.g; g.save(); g.font = "900 120px Arial Black, Arial"; g.lineJoin = "round";
  for (let i = 0; i < 3; i++) {
    const k = (t + i / 3) % 1, x = 220 + i * 70 + Math.sin(k * 6) * 20, y = 700 - k * 500, s = 0.5 + k * 0.7;
    g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha = Math.min(1, (1 - k) * 2.5);
    g.lineWidth = 16; g.strokeStyle = INK; g.strokeText("Z", 0, 0); g.fillStyle = "#ffffff"; g.fillText("Z", 0, 0); g.restore();
  }
  g.restore();
};
/** falling leaf */
export const fxLeaf = (p, col) => { p.poly([[300, 380], [420, 470], [300, 620], [180, 470]], col, 14); p.stroke([[300, 400], [300, 600]], 8); };
/** dust cloud puff (k 0..1 growth) */
export const fxDust = (p, k, col = "#e8dcc4") => {
  const g = p.g; g.save(); g.globalAlpha = Math.max(0, 1 - k * k);
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, r = 90 + 150 * k; p.ell(300 + Math.cos(a) * r, 520 + Math.sin(a) * r * 0.6, 120 + 60 * k, 100 + 50 * k, col, 12); }
  p.ell(300, 520, 170 + 110 * k, 140 + 80 * k, col, 0);
  g.restore();
};
export const fxDrip = (p) => p.ell(300, 500, 40, 64, "#9fd4ff", 10);
export const fxWood = (p, seed) => { p.poly([[200, 420], [400, 400], [420, 560], [230, 600]], "#5b3d22", 14); p.stroke([[240, 450], [380, 440]], 6, "#3a2614"); p.ell(330, 520, 26, 18, "#4d7a32", 0); };

export const headCenter = (seed = 3) => { const H = headBlob(seed, 118, 0), HH = 2 * H.b; return 975 - 1.38 * HH - 1.08 * HH - H.b; };


// ---------------- Empty Fort: hats, props, horse ----------------
function hanHat(p, O, H, cx, hc, light, thick, ow, u, facing) {
  const top = hc - H.b;
  if (O.hanHat === "lunjin") { // Zhuge's dark silk scholar cap with a raised back and two ribbons
    const cap = ellPts(cx, hc - 0.38 * H.b, H.a * 1.03, H.b * 0.72, 180, 360, 0, 40);
    p.shadedFill(cap, "#2d3a5c", "#1a2238", light, H.a, 0.35); p.inkRing(cap, ow * 0.9, thick);
    const crest = rrect(cx - 0.42 * H.a, top - 0.42 * H.b, cx + 0.42 * H.a, top + 0.18 * H.b, 10 * u);
    p.shadedFill(crest, "#34436a", "#1a2238", light, 0.5 * H.a, 0.35); p.poly(crest, null, ow * 0.85);
    for (let i = -2; i <= 2; i++) p.stroke([[cx + i * 0.15 * H.a, top - 0.36 * H.b], [cx + i * 0.15 * H.a, top + 0.12 * H.b]], 1.6 * u, "#56679a");
    p.band([[cx - H.a * 1.0, hc - 0.4 * H.b], [cx + H.a * 1.0, hc - 0.4 * H.b]], "#3c5a8c", 6 * u, 1.6 * u, "round");
    for (const s of [-1, 1]) p.band([[cx + s * 0.9 * H.a, hc - 0.38 * H.b], [cx + s * 1.12 * H.a, hc + 0.3 * H.b], [cx + s * 1.05 * H.a, hc + 0.75 * H.b]], "#3c5a8c", 7 * u, 1.4 * u, "round");
    return;
  }
  if (O.hanHat.startsWith("helm")) { // rounded iron helmet, neck flaps, plume tassel
    const gold = O.hanHat === "helmGold", green = O.hanHat === "helmGreen";
    const bowl = gold ? "#c9a24a" : green ? "#7f9a6a" : "#5c616c", dark = mul(bowl, [0.62, 0.62, 0.7]);
    for (const s of [-1, 1]) { const fl = [[cx + s * 0.78 * H.a, hc - 0.35 * H.b], [cx + s * 1.12 * H.a, hc - 0.3 * H.b], [cx + s * 1.16 * H.a, hc + 0.55 * H.b], [cx + s * 0.86 * H.a, hc + 0.5 * H.b]];
      p.shadedFill(fl, bowl, dark, light, 0.3 * H.a, 0.3); p.poly(fl, null, ow * 0.8);
      for (let k = 1; k < 4; k++) p.stroke([[cx + s * 0.82 * H.a, hc - 0.3 * H.b + k * 0.2 * H.b], [cx + s * 1.13 * H.a, hc - 0.25 * H.b + k * 0.2 * H.b]], 1.4 * u, dark); }
    const bp = ellPts(cx, hc - 0.36 * H.b, H.a * 1.08, H.b * 0.78, 180, 360, 0, 44);
    p.shadedFill(bp, bowl, dark, light, H.a, 0.4); p.inkRing(bp, ow * 0.9, thick);
    p.clip(bp, () => { for (let i = -4; i <= 4; i++) p.stroke([[cx + i * 0.22 * H.a, hc - 0.36 * H.b], [cx + i * 0.12 * H.a, top - 0.15 * H.b]], 1.4 * u, dark); p.stroke(ellPts(cx - 22 * u, hc - 0.8 * H.b, 0.22 * H.a, 0.14 * H.b, 200, 300, 0, 12), 4 * u, "#ffffff66"); });
    p.band([[cx - H.a * 1.08, hc - 0.36 * H.b], [cx + H.a * 1.08, hc - 0.36 * H.b]], gold ? "#8a2a1e" : "#8a6a3a", 7 * u, 1.6 * u, "round");
    p.poly(rrect(cx - 4 * u, top - 0.32 * H.b, cx + 4 * u, top - 0.06 * H.b, 2 * u), "#d9b24a", 1.4 * u);
    const pl = gold ? "#d22a2a" : green ? "#2f6a3a" : "#c8302c";
    const tas = [[cx, top - 0.3 * H.b], [cx - 26 * u, top - 0.9 * H.b], [cx - 6 * u, top - 1.3 * H.b], [cx + 16 * u, top - 1.25 * H.b], [cx + 26 * u, top - 0.8 * H.b]];
    p.poly(tas, pl, ow * 0.7);
    for (let i = -2; i <= 2; i++) p.stroke([[cx, top - 0.35 * H.b], [cx + i * 9 * u, top - 1.15 * H.b]], 1.4 * u, mul(pl, [0.6, 0.6, 0.6]));
    return;
  }
  if (O.hanHat === "chef") { const ct = blobPts(cx, top - 0.05 * H.b, { a: 0.95 * H.a, b: 0.55 * H.b, nTop: 2, nBot: 3, egg: -0.1, asym: 0, rot: 0, noise: 0.05, seed: 5 });
    p.shadedFill(ct, "#f6f3ec", "#d4cfc4", light, H.a, 0.3); p.inkRing(ct, ow * 0.8, thick);
    p.band([[cx - 0.9 * H.a, hc - 0.55 * H.b], [cx + 0.9 * H.a, hc - 0.55 * H.b]], "#e6e0d2", 0.22 * H.b, 1.6 * u); return; }
  if (O.hanHat === "futou") { // black official's cap with two stiff wings
    const cp = ellPts(cx, hc - 0.45 * H.b, H.a * 1.0, H.b * 0.62, 180, 360, 0, 32); p.poly(cp, "#1d1b22", ow * 0.8);
    p.poly(rrect(cx - 0.4 * H.a, top - 0.4 * H.b, cx + 0.4 * H.a, top + 0.15 * H.b, 8 * u), "#1d1b22", ow * 0.8);
    for (const s of [-1, 1]) p.band([[cx + s * 0.95 * H.a, hc - 0.6 * H.b], [cx + s * 1.6 * H.a, hc - 0.66 * H.b]], "#1d1b22", 8 * u, 1.4 * u, "round");
    return; }
  if (O.hanHat === "kerchief") { const kp = ellPts(cx, hc - 0.4 * H.b, H.a * 1.04, H.b * 0.7, 180, 360, 0, 32);
    p.shadedFill(kp, O.kerchief, mul(O.kerchief, [0.65, 0.65, 0.72]), light, H.a, 0.35); p.inkRing(kp, ow * 0.8, thick);
    p.ell(cx + 0.8 * H.a, hc - 0.55 * H.b, 0.16 * H.a, 0.12 * H.b, O.kerchief, ow * 0.6); return; }
}

function drawProp(p, kind, [hx, hy], u, HH, sole, opts) {
  if (kind === "fan") { // white crane-feather fan, angled up and out
    const a = rad(-60 + (opts.fanSwing || 0)), L = 0.62 * HH, fx = hx + Math.cos(a) * L * 0.55, fy = hy + Math.sin(a) * L * 0.55;
    p.band([[hx, hy + 6 * u], [fx, fy]], "#8a5a2a", 4 * u, 1.2 * u, "round");
    const fp = ellPts(hx + Math.cos(a) * L, hy + Math.sin(a) * L, 0.2 * HH, 0.3 * HH, 0, 360, (a * 180 / Math.PI) + 90, 32);
    p.poly(fp, "#f8f6f0", 2.4 * u);
    for (let i = -3; i <= 3; i++) p.stroke([[fx, fy], [hx + Math.cos(a + i * 0.12) * L * 1.45, hy + Math.sin(a + i * 0.12) * L * 1.45]], 1.4 * u, "#c9c4b8");
    p.dot(fx, fy, 4 * u, "#3a2614"); return;
  }
  if (kind === "zither") { // long zither across the lap, seen from the player's side
    const zy = sole - 1.24 * HH, zx = 300;
    p.poly([[zx - 170 * u, zy - 6 * u], [zx + 170 * u, zy - 14 * u], [zx + 172 * u, zy + 14 * u], [zx - 168 * u, zy + 22 * u]], "#5a321e", 3 * u);
    for (let i = 0; i < 5; i++) p.stroke([[zx - 160 * u, zy - 2 * u + i * 4.5 * u], [zx + 160 * u, zy - 10 * u + i * 4.5 * u]], 1.1 * u, "#f5ecd2");
    return; }
  if (kind === "tape") { // a comically short measuring tape stretched between the hands
    const x0 = hx, y0 = hy, x1 = 300 - (hx - 300), w = x1 - x0;
    p.poly(rrect(Math.min(x0, x1) - 4 * u, y0 - 5 * u, Math.max(x0, x1) + 4 * u, y0 + 5 * u, 2 * u), "#f2d24a", 1.6 * u);
    for (let i = 1; i < 10; i++) p.stroke([[x0 + w * i / 10, y0 - 5 * u], [x0 + w * i / 10, y0 - (i % 5 ? 1 : -2) * u]], 1 * u);
    p.ell(x0, y0, 12 * u, 12 * u, "#c8302c", 1.8 * u); return; }
  if (kind === "ladle") { p.band([[hx, hy], [hx + 6 * u, hy - 0.75 * HH]], "#8a5a2a", 4 * u, 1.2 * u, "round"); p.ell(hx + 8 * u, hy - 0.8 * HH, 16 * u, 11 * u, "#9aa0a8", 2 * u); p.dot(hx, hy, 5.5 * u); return; }
  if (kind === "scrolls") { for (let i = 0; i < 3; i++) { const y = hy - 8 * u - i * 13 * u; p.poly(rrect(hx - 34 * u, y - 6 * u, hx + 34 * u, y + 6 * u, 6 * u), i % 2 ? "#efe2bc" : "#e2cf98", 1.8 * u); p.ell(hx - 34 * u, y, 4 * u, 7 * u, "#8a5a2a", 1.4 * u); p.ell(hx + 34 * u, y, 4 * u, 7 * u, "#8a5a2a", 1.4 * u); } return; }
  if (kind === "broom") { const bx = hx + 10 * u, by = sole - 6 * u, tx = hx - 20 * u, ty = hy - 0.5 * HH;
    p.band([[tx, ty], [bx, by - 0.2 * HH]], "#9a6a3a", 4 * u, 1.2 * u, "round");
    p.poly([[bx - 6 * u, by - 0.24 * HH], [bx + 8 * u, by - 0.24 * HH], [bx + 30 * u, by], [bx - 22 * u, by]], "#d9b85a", 2 * u);
    for (let i = -3; i <= 3; i++) p.stroke([[bx + i * 1.5 * u, by - 0.2 * HH], [bx + i * 7 * u, by - 2 * u]], 1.2 * u, "#a8862e"); p.dot(hx, hy, 5.5 * u); return; }
}

/** side-view horse, faces +x (right) on the canvas. opts: col, mane, step 0..1, tremble, rein, saddle */
export const horseCard = (p, opts = {}) => {
  const { col = "#8a5a3a", mane = "#2a1e1a", step = 0, tremble = 0, saddle = "#7a1e22", headUp = 0, expr = "calm" } = opts;
  const light = rad(-120), thick = thickAngle(light), sole = 975, U = 247, bx = 262, by = sole - 1.15 * U, dark = mul(col, [0.7, 0.66, 0.66]);
  const tr = (k) => tremble ? Math.sin(k * 7.3 + tremble * 40) * 3 : 0;
  // legs (far pair darker, behind the body)
  const leg = (x, ph, far) => { const up = Math.max(0, Math.sin(Math.PI * 2 * (step + ph))) * 34 * (step ? 1 : 0), x0 = x + tr(x), kx = x + 8 + tr(x + 1), fy = sole - up;
    p.stroke([[x0, by + 40], [kx, by + 140 - up * 0.4], [x0 + 4, fy - 14]], 30, far ? dark : col); p.poly(rrect(x0 - 14, fy - 22, x0 + 20, fy, 6), "#2a2020", 6); };
  leg(bx - 120, 0.5, true); leg(bx + 110, 0, true);
  // tail
  p.band([[bx - 170, by - 40], [bx - 215, by + 40 + tr(3)], [bx - 205, by + 150]], mane, 26, 6, "round");
  // body
  const bodyPts = blobPts(bx, by, { a: 182, b: 84, nTop: 2.2, nBot: 2.3, egg: 0, asym: 0.04, rot: 0, noise: 0.01, seed: 31 });
  p.shadedFill(bodyPts, col, dark, light, 180, 0.4); p.inkRing(bodyPts, 9, thick);
  leg(bx - 95, 0, false); leg(bx + 135, 0.5, false);
  // neck + head
  const nx = bx + 150, ny = by - 30, hx = bx + 262, hy = by - 175 - headUp * 30 + tr(9);
  const neck = [[nx - 40, ny + 40], [nx + 40, ny + 30], [hx + 10, hy + 30], [hx - 40, hy - 10]];
  p.shadedFill(neck, col, dark, light, 80, 0.4); p.poly(neck, null, 8);
  const head = ellPts(hx + 22, hy + 22, 66, 32, 0, 360, 34, 32); p.shadedFill(head, col, dark, light, 60, 0.4); p.poly(head, null, 8);
  p.ell(hx + 70, hy + 54, 14, 10, "#3a2a2a", 0);
  p.poly([[hx - 30, hy - 14], [hx - 20, hy - 58], [hx - 4, hy - 14]], col, 6);
  if (expr === "nervous") { p.ell(hx + 6, hy + 4, 16, 16, "#ffffff", 4); p.dot(hx + 10, hy + 6, 7); for (let i = 0; i < 3; i++) p.ell(hx - 20 + i * 18, hy - 70 - i * 6, 5, 9, "#9fd4ff", 3); }
  else { p.ell(hx + 6, hy + 6, 10, 9, "#ffffff", 3); p.dot(hx + 8, hy + 7, 5); }
  // mane
  for (let i = 0; i < 6; i++) { const t = i / 5, x = hx - 40 + (nx - 40 - hx + 40) * t, y = hy - 6 + (ny + 10 - hy + 6) * t; p.band([[x, y], [x - 26, y + 22 + tr(i)]], mane, 18, 4, "round"); }
  // saddle cloth + bridle
  if (saddle) { const sp = rrect(bx - 60, by - 92, bx + 70, by + 20, 18); p.poly(sp, saddle, 6); p.band([[bx - 60, by - 10], [bx + 70, by - 10]], "#d9b24a", 10, 3); }
  p.stroke([[hx - 10, hy + 6], [hx + 70, hy + 40], [nx + 20, ny - 30]], 4, "#3a2418");
};


// ---------------- Nobody: the Cyclops, sheep, props ----------------
/** front-facing Cyclops. o: { eye: 0..1 open, look, expr, L, R, skin, wool, hair, seed, sway, bob } */
export const cyclopsFront = (p, o = {}) => {
  const { eye = 1, look = 0, expr = "neutral", L = "hang", R = "hang", skin = "#c9a27a", wool = "#efe6cf", hair = "#3a2a1e", bob = 0, prop = null } = o;
  const light = rad(-120), thick = thickAngle(light), dark = mul(skin, [0.72, 0.62, 0.62]), cx = 300, sole = 975, by = bob * 14;
  // legs
  for (const s of [-1, 1]) {
    p.stroke([[cx + s * 70, 700 + by], [cx + s * 78, 840], [cx + s * 74, sole - 18]], 52, dark);
    p.poly(rrect(cx + s * 74 - 46, sole - 40, cx + s * 74 + 46, sole, 16), "#5a3b2a", 9);
  }
  // body
  const B = { a: 175, b: 200, nTop: 2.1, nBot: 2.6, egg: 0.18, asym: 0, rot: 0, noise: 0.01, seed: 61 };
  const bp = blobPts(cx, 545 + by, B);
  const sh = (side) => [cx + side * 140, 400 + by];
  const arm = (side, pose) => {
    const s = sh(side), X = (k) => cx + side * k;
    switch (pose) {
      case "cover": return [s, [X(150), 330 + by], [X(38), 222]];
      case "bowl": return [s, [X(160), 440 + by], [X(70), 330]];
      case "pat": return [s, [X(240), 520 + by], [X(290), 700]];
      case "lift": return [s, [X(200), 260 + by], [X(120), 60]];
      case "shout": return [s, [X(170), 380 + by], [X(70), 300]];
      case "rub": return [s, [X(150), 470 + by], [X(40), 560]];
      case "fist": return [s, [X(220), 320 + by], [X(230), 190]];
      default: return [s, [X(200), 520 + by], [X(196), 690 + by]];
    }
  };
  const arms = [[-1, L], [1, R]].map(([sd, ps]) => arm(sd, ps));
  const drawArm = (a) => { p.stroke(curve(a[0], a[1], a[2]), 50, skin); p.ell(a[2][0], a[2][1], 40, 36, skin, 9); };
  for (const a of arms) drawArm(a);
  p.shadedFill(bp, skin, dark, light, 175);
  // sheepskin over one shoulder
  const wp = [[cx - 160, 470 + by], [cx + 40, 380 + by], [cx + 170, 420 + by], [cx + 170, 700 + by], [cx - 170, 720 + by]];
  p.clip(bp, () => {
    p.shadedFill(wp, wool, mul(wool, [0.78, 0.74, 0.7]), light, 180);
    for (let i = 0; i < 26; i++) { const t = i / 25; p.ell(cx - 160 + 330 * t, 715 + by + Math.sin(i * 2.1) * 8, 22, 18, wool, 4); }
    for (let i = 0; i < 9; i++) p.ell(cx - 150 + i * 36, 470 - i * 10 + by, 20, 16, wool, 4);
    p.band([[cx - 175, 640 + by], [cx + 175, 630 + by]], "#6a4024", 22, 5);
  });
  p.inkRing(bp, 11, thick);
  if (prop === "bowl") { // huge wooden wine bowl at the mouth
    const bx = cx, byy = 300; p.ell(bx, byy, 120, 34, "#6a1e3a", 8); p.poly([[bx - 122, byy], [bx + 122, byy], [bx + 90, byy + 70], [bx - 90, byy + 70]], "#8a5a34", 9); p.ell(bx, byy, 116, 28, "#7a1e44", 0);
  }
  if (prop === "rock") { const rp = blobPts(cx, 70, { a: 150, b: 95, nTop: 2.2, nBot: 2.2, egg: 0, asym: 0.1, rot: 0, noise: 0.06, seed: 9 }); p.shadedFill(rp, "#8c8378", "#5c544c", light, 140); p.inkRing(rp, 10, thick); }
  // head
  const hc = 245 + by * 1.2, H = { a: 138, b: 128, nTop: 2.3, nBot: 2.1, egg: -0.1, asym: 0, rot: 0, noise: 0.01, seed: 7 };
  const hp = blobPts(cx, hc, H);
  // shaggy hair behind
  for (let i = 0; i < 11; i++) { const a = Math.PI * (1.05 + 0.9 * i / 10), r = 128; p.poly([[cx + Math.cos(a) * r * 0.8, hc + Math.sin(a) * r * 0.8], [cx + Math.cos(a - 0.12) * r * 1.32, hc + Math.sin(a - 0.12) * r * 1.3], [cx + Math.cos(a + 0.16) * r * 0.9, hc + Math.sin(a + 0.16) * r * 0.9]], hair, 7); }
  p.shadedFill(hp, skin, dark, light, 138); p.inkRing(hp, 11, thick);
  // ears
  for (const s of [-1, 1]) { p.ell(cx + s * 140, hc + 10, 22, 34, skin, 8); }
  // stubble + beard
  const bd = blobPts(cx, hc + 92, { a: 108, b: 52, nTop: 2.4, nBot: 1.8, egg: -0.2, asym: 0, rot: 0, noise: 0.05, seed: 3 });
  p.poly(bd, mix(hair, skin, 0.25), 0);
  // the eye
  const ey = hc - 22, open = Math.max(0, Math.min(1, eye));
  const angry = expr === "angry" || expr === "shout";
  p.ell(cx, ey, 64, 58, "#f8f4ea", 9);
  if (open > 0.05) {
    p.clip(ellPts(cx, ey, 64, 58), () => {
      p.ell(cx + look * 26, ey + 4, 27, 29, "#5a7a3a", 0); p.dot(cx + look * 26, ey + 4, 15, INK); p.dot(cx + look * 26 - 8, ey - 6, 6, "#ffffff");
      // upper lid
      const lidY = ey - 58 + (1 - open) * 118; p.poly([[cx - 70, ey - 70], [cx + 70, ey - 70], [cx + 70, lidY], [cx - 70, lidY]], skin, 0);
      if (open < 1) p.stroke([[cx - 64, lidY], [cx + 64, lidY]], 7);
    });
    p.ell(cx, ey, 64, 58, null, 9);
  } else { p.ell(cx, ey, 64, 58, skin, 9); p.stroke(ellPts(cx, ey + 4, 54, 22, 10, 170, 0, 16), 8); }
  // unibrow
  const bt = angry ? 18 : expr === "sleepy" ? -8 : expr === "grin" ? -4 : 0;
  p.band([[cx - 80, ey - 70 - bt], [cx, ey - 74 + bt * 0.6], [cx + 80, ey - 70 - bt]], hair, 22, 5, "round");
  // nose
  p.ell(cx + 4, hc + 50, 24, 18, mul(skin, [0.9, 0.8, 0.78]), 7);
  // mouth
  const my = hc + 92;
  if (expr === "grin" || expr === "lick") {
    const m = [[cx - 70, my - 6], [cx + 70, my - 6], [cx + 46, my + 34], [cx - 46, my + 34]];
    p.poly(m, "#5a1e28", 8); p.poly([[cx - 64, my - 4], [cx + 64, my - 4], [cx + 58, my + 8], [cx - 58, my + 8]], "#fffaf0", 0);
    if (expr === "lick") p.ell(cx + 40, my + 22, 24, 16, "#e0606a", 6);
  } else if (expr === "shout" || expr === "O") {
    p.ell(cx, my + 16, expr === "O" ? 30 : 52, expr === "O" ? 30 : 44, "#5a1e28", 8);
    if (expr === "shout") p.poly([[cx - 40, my - 10], [cx + 40, my - 10], [cx + 36, my], [cx - 36, my]], "#fffaf0", 0);
  } else if (expr === "drink") {
    p.ell(cx, my + 10, 26, 16, "#5a1e28", 7);
  } else if (expr === "sleepy") {
    p.stroke(curve([cx - 40, my + 12], [cx, my + 2], [cx + 40, my + 14]), 8); p.ell(cx + 46, my + 4, 9, 12, "#9fd4ff", 4);
  } else {
    p.stroke(curve([cx - 44, my + 6], [cx, my + 18], [cx + 44, my + 6]), 8);
  }
  for (const s of [-1, 1]) if (arms[s < 0 ? 0 : 1] && ((s < 0 ? L : R) === "cover" || (s < 0 ? L : R) === "shout" || (s < 0 ? L : R) === "bowl")) drawArm(arms[s < 0 ? 0 : 1]);
  if (prop === "bowl") { const bx = cx, byy = 300; p.poly([[bx - 122, byy - 20], [bx + 122, byy - 20], [bx + 92, byy + 60], [bx - 92, byy + 60]], "#8a5a34", 9); p.ell(bx, byy - 20, 120, 26, "#7a1e44", 8); for (const s of [-1, 1]) p.ell(cx + s * 110, byy + 10, 40, 36, skin, 9); }
};

/** side-view ram facing right. o: { wool, step 0..1, rider (sailor outfit key or null), patted } */
export const sheepSide = (p, o = {}) => {
  const { wool = "#f2ecdc", face = "#4a4048", step = 0, rider = null, blink = 0 } = o;
  const light = rad(-120), thick = thickAngle(light), sole = 975, cx = 290, cy = 640;
  const leg = (x, ph, far) => { const up = Math.max(0, Math.sin(Math.PI * 2 * (step + ph))) * 26 * (step ? 1 : 0);
    p.stroke([[x, cy + 60], [x + 4, sole - 30 - up]], 20, far ? "#2e2830" : face); p.poly(rrect(x - 14, sole - 34 - up, x + 18, sole - up, 6), "#1e1a20", 5); };
  leg(cx - 120, 0.5, true); leg(cx + 110, 0, true);
  // body: fluffy cloud
  const body = blobPts(cx, cy, { a: 200, b: 118, nTop: 2.2, nBot: 2.4, egg: 0, asym: 0, rot: 0, noise: 0.01, seed: 21 });
  p.shadedFill(body, wool, mul(wool, [0.8, 0.78, 0.76]), light, 200, 0.4);
  for (let i = 0; i < 30; i++) { const a = i / 30 * Math.PI * 2; p.ell(cx + Math.cos(a) * 196, cy + Math.sin(a) * 114, 34, 30, wool, 0); }
  p.clip(body, () => { for (let i = 0; i < 14; i++) p.stroke(ellPts(cx - 150 + (i % 7) * 50, cy - 50 + Math.floor(i / 7) * 70, 20, 14, 200, 340, 0, 8), 4, mul(wool, [0.75, 0.72, 0.7])); });
  const outer = []; for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, w = 1 + 0.07 * Math.sin(i * 1.0 * 5); outer.push([cx + Math.cos(a) * 222 * w, cy + Math.sin(a) * 136 * w]); }
  p.poly(outer, null, 0); p.inkRing(outer, 9, thick);
  if (rider) { // a sailor clinging under the belly, face up, arms gripping the wool
    const O = OUTFITS[rider], ry = cy + 178, skin = O.skin;
    p.stroke([[cx - 170, ry + 10], [cx - 80, ry + 6]], 34, mix(O.tunic, INK, 0.5)); // legs (to the back)
    p.poly(rrect(cx - 110, ry - 30, cx + 70, ry + 34, 30), O.tunic, 7);
    for (const k of [-40, 30]) p.stroke([[cx + k, ry - 20], [cx + k + 14, ry - 74]], 18, mix(O.tunic, INK, 0.4));
    p.ell(cx + 118, ry - 6, 46, 42, skin, 7);
    if (O.beard) p.ell(cx + 120, ry + 30, 26, 11, O.beard, 0); else if (O.hair) p.ell(cx + 150, ry - 10, 14, 30, O.hair, 0);
    if (O.hanHat) p.ell(cx + 106, ry - 30, 40, 22, O.kerchief, 5);
    p.ell(cx + 112, ry - 14, 9, 4, INK, 0); p.ell(cx + 136, ry - 14, 9, 4, INK, 0); p.stroke([[cx + 116, ry + 8], [cx + 136, ry + 8]], 4);
  }
  leg(cx - 90, 0, false); leg(cx + 140, 0.5, false);
  // head
  const hx = cx + 230, hy = cy - 90;
  p.ell(hx - 20, hy + 10, 52, 40, face, 8);
  p.poly(ellPts(hx + 20, hy + 26, 66, 44, 0, 360, 24, 32), face, 8);
  p.ell(hx - 40, hy - 12, 38, 30, wool, 6);
  // curled horn
  const hp = []; for (let i = 0; i < 30; i++) { const t = i / 29 * Math.PI * 1.7, r = 40 - i * 0.9; hp.push([hx - 30 + Math.cos(t + 2.6) * r, hy + 18 + Math.sin(t + 2.6) * r]); }
  p.line(hp, "#d9c49a", 16);
  p.ell(hx + 22, hy + 10, 11, blink ? 2 : 11, "#ffffff", 4); if (!blink) p.dot(hx + 25, hy + 11, 5);
  p.ell(hx + 74, hy + 40, 8, 6, "#2a2228", 0);
};

/** Odysseus' props: long stake (horizontal, being whittled) */
export const stakeProp = (p, k = 1) => {
  p.band([[60, 560], [60 + 480 * k, 520]], "#a8784a", 26, 6, "round");
  p.poly([[60 + 480 * k, 506], [60 + 480 * k + 60, 520], [60 + 480 * k, 534]], "#d9b48a", 6);
};
