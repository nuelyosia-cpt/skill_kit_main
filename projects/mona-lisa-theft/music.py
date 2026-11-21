"""Modern, calm background-music library for the cartoon shorts (numpy only, deterministic).

    from music import bed, STYLES
    music = bed(DUR, style="lofi", mood="dreamy", seed=4,
                sections=[(0, "soft"), (3.2, "normal"), (38.3, "tense"), (46.9, "normal")],
                swell=[36.9], stop=None, resolve=66.1)

Sounds like current YouTube / Shorts background beds: soft drums, warm keys, sub bass,
plucks and pads, low-passed so the narration always sits on top. mix.py puts it at
-12 dB under the voice. Pick a different STYLE and SEED from the last few videos
(check `grep -h "^STYLE" projects/*/audio.py`) so every short sounds different.

Styles:
  lofi       swung lo-fi hip hop: electric piano 7th chords, soft kick/rim, hats, vinyl crackle
             (cosy, curious, everyday inventions, gentle stories)
  chillhop   brighter lo-fi with a plucky synth hook and claps (clever tricks, light science)
  explainer  modern "explainer" pop: syncopated marimba-pluck, claps, shaker, sub bass
             (big-brain ideas, how-it-works, upbeat but calm)
  synthwave  dreamy retro synth: pulsing filtered arpeggio, pad, soft four-on-the-floor
             (inventions, tech, Tesla-type stories, wonder)
  cinematic  documentary pulse: ticking 16th hats, low synth ostinato, wide pads, soft hits
             (history, myths, drama, turning points)
  trap       chill trap: airy pad, 808 sub glides, light hat rolls, snaps
             (bold characters, modern-feeling myths, hype but not loud)

Moods: "dreamy" (major 7ths), "curious" (major, bright), "mystery" (minor), "epic" (minor, fuller).
sections: list of (start_seconds, level): "rest" (pad only), "soft" (keys + bass, no drums),
          "normal" (everything), "tense" (minor, thin drums, ticking hats).
swell:    times (s) where a soft riser should peak (the eureka word).
stop:     time (s) where the music stops for a twist; a quiet low drone continues to the end.
resolve:  time (s) of the last word for a moral/engagement ending: a warm final chord rings out.
"""
import numpy as np

SR = 48000
midi = lambda m: 440.0 * 2 ** ((m - 69) / 12)
_R = np.random.default_rng(99)

def _t(d): return np.arange(int(d * SR)) / SR
def _lp(x, cutoff, order=4):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / cutoff) ** order); return np.fft.irfft(X, len(x)).astype(np.float32)
def _hp(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 - 1 / (1 + (f / cutoff) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)
def _place(buf, sig, t0, gain=1.0):
    i = int(t0 * SR); j = min(len(buf), i + len(sig))
    if 0 <= i < len(buf) and j > i: buf[i:j] += sig[: j - i] * gain

# ---------------- instruments ----------------
def rhodes(f, d=2.4):
    t = _t(d); idx = 1.6 * np.exp(-t * 3.5)
    s = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t)) + 0.25 * np.sin(2 * np.pi * f * 7.1 * t) * np.exp(-t * 12)
    s *= np.exp(-t * 1.1) * (1 + 0.12 * np.sin(2 * np.pi * 4.5 * t)) * np.minimum(1, t / 0.004)
    return s.astype(np.float32)

def saw(f, t, maxf=9000):
    s = np.zeros_like(t)
    for k in range(1, int(maxf / f) + 1): s += np.sin(2 * np.pi * f * k * t) / k
    return s

def pluck(f, d=0.6, bright=1.0):   # filtered-saw pluck: high harmonics die fast
    t = _t(d); s = np.zeros_like(t)
    for k in range(1, min(24, int(8000 / f)) + 1):
        s += np.sin(2 * np.pi * f * k * t) / k * np.exp(-t * (5 + 9 * k / bright))
    return (s * np.exp(-t * 3) * np.minimum(1, t / 0.002)).astype(np.float32)

def mallet(f, d=0.8):   # marimba-ish pluck for the explainer style
    t = _t(d); s = np.sin(2 * np.pi * f * t) * np.exp(-t * 6) + 0.35 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 18) + 0.15 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 9)
    return (s * np.minimum(1, t / 0.002)).astype(np.float32)

def bell(f, d=1.4):
    t = _t(d); s = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t * 4) + 0.2 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t * 7)
    return (s * np.exp(-t * 2.4) * np.minimum(1, t / 0.002)).astype(np.float32)

def pad(fs, d, cutoff=1400, air=0.0):
    t = _t(d); s = np.zeros_like(t)
    for f in fs:
        for det in (-0.18, 0.0, 0.17): s += saw(f * (1 + det / 100), t, 5000)
    s = _lp((s / (3 * len(fs))).astype(np.float32), cutoff)
    if air: s += _lp(_hp(_R.standard_normal(len(t)).astype(np.float32), 5000), 9000) * air * 0.004
    a = np.minimum(1, t / min(0.8, d / 3)) * np.clip((d - t) / min(0.8, d / 3), 0, 1)
    return (s * a).astype(np.float32)

def sub(f, d=0.9, glide_from=None):
    t = _t(d); fr = f if glide_from is None else f + (glide_from - f) * np.exp(-t * 14)
    s = np.tanh(1.6 * np.sin(2 * np.pi * np.cumsum(np.full_like(t, 1.0) * fr) / SR)) * np.exp(-t * 1.6) * np.minimum(1, t / 0.01)
    return s.astype(np.float32)

def kick(soft=1.0):
    t = _t(0.42); f = 46 + 90 * np.exp(-t * 28)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5) + _R.standard_normal(len(t)) * np.exp(-t * 300) * 0.15
    return (_lp(s.astype(np.float32), 2500 * soft)).astype(np.float32)
def snare(lofi=True):
    t = _t(0.25); n = _R.standard_normal(len(t)).astype(np.float32)
    s = _lp(_hp(n, 900), 4500 if lofi else 8000) * np.exp(-t * 18) + np.sin(2 * np.pi * 185 * t) * np.exp(-t * 25) * 0.5
    return s.astype(np.float32)
def rim():
    t = _t(0.08); return (np.sin(2 * np.pi * 1700 * t) * np.exp(-t * 90) + _hp(_R.standard_normal(len(t)).astype(np.float32), 3000) * np.exp(-t * 120) * 0.4).astype(np.float32)
def clap():
    t = _t(0.3); n = _hp(_lp(_R.standard_normal(len(t)).astype(np.float32), 5000), 900); e = np.zeros_like(t)
    for k, dt in enumerate((0, 0.011, 0.022)): e += (t >= dt) * np.exp(-(t - dt).clip(0) * (90 if k < 2 else 16))
    return (n * e * 0.8).astype(np.float32)
def snap():
    t = _t(0.12); return (_hp(_R.standard_normal(len(t)).astype(np.float32), 2500) * np.exp(-t * 60) + np.sin(2 * np.pi * 2200 * t) * np.exp(-t * 80) * 0.3).astype(np.float32)
def hat(open_=False):
    t = _t(0.35 if open_ else 0.06); return (_hp(_R.standard_normal(len(t)).astype(np.float32), 7000) * np.exp(-t * (9 if open_ else 70))).astype(np.float32)
def shaker():
    t = _t(0.09); return (_hp(_R.standard_normal(len(t)).astype(np.float32), 5000) * np.sin(np.pi * t / 0.09) ** 2 * 0.6).astype(np.float32)
def crackle(d):
    n = int(d * SR); x = np.zeros(n, np.float32); idx = _R.integers(0, n, int(d * 14)); x[idx] = _R.uniform(-1, 1, len(idx)).astype(np.float32)
    return _lp(x, 3000) * 2.0 + _lp(_hp(_R.standard_normal(n).astype(np.float32), 2000), 6000) * 0.012
def riser(d=1.8):
    t = _t(d); s = _lp(_hp(_R.standard_normal(len(t)).astype(np.float32), 1500), 6000) * (t / d) ** 3 * 0.035
    s += sum(np.sin(2 * np.pi * np.cumsum(f0 * (1 + 0.5 * t / d)) / SR) for f0 in (880, 1320)) * (t / d) ** 2 * 0.025
    return s.astype(np.float32)

# ---------------- styles ----------------
# keys instrument, bpm, swing, drum kit, chords voice, lead instrument, lead pattern (16ths), pump
STYLES = {
    "lofi":      dict(keys=rhodes, bpm=78, swing=0.18, kit="lofi", lead=bell, lead_g=0.10, hook=[0, None, None, 2, None, None, 1, None, None, None, 3, None, None, None, None, None], cutoff=2600, crackle=True),
    "chillhop":  dict(keys=rhodes, bpm=86, swing=0.14, kit="chillhop", lead=pluck, lead_g=0.13, hook=[0, None, 2, None, 3, None, 2, 1, None, None, 0, None, 2, None, None, None], cutoff=4200, crackle=True),
    "explainer": dict(keys=None, bpm=100, swing=0.0, kit="explainer", lead=mallet, lead_g=0.16, hook=[0, None, 2, 0, None, 3, None, 2, None, 0, None, 2, 3, None, 1, None], cutoff=6000, crackle=False),
    "synthwave": dict(keys=None, bpm=96, swing=0.0, kit="synthwave", lead=pluck, lead_g=0.11, hook="arp", cutoff=3000, crackle=False, pump=True),
    "cinematic": dict(keys=None, bpm=90, swing=0.0, kit="cinematic", lead=pluck, lead_g=0.10, hook="ostinato", cutoff=2200, crackle=False),
    "trap":      dict(keys=None, bpm=70, swing=0.0, kit="trap", lead=bell, lead_g=0.10, hook=[0, None, None, None, 2, None, None, None, 3, None, None, 2, None, None, None, None], cutoff=3500, crackle=False),
}
PROGS = {
    "dreamy":  [[1, 4, 0, 5], [3, 2, 1, 0], [0, 5, 3, 4]],     # ii-V-I-vi, IV-iii-ii-I, I-vi-IV-V (as 7ths)
    "curious": [[0, 4, 5, 3], [0, 3, 4, 3], [5, 3, 0, 4]],
    "mystery": [[0, 5, 3, 4], [0, 3, 6, 5], [0, 6, 5, 4]],
    "epic":    [[0, 5, 2, 6], [0, 6, 5, 6]],
}
MAJOR, MINOR = [0, 2, 4, 5, 7, 9, 11], [0, 2, 3, 5, 7, 8, 10]
def _chord(root, scale, deg, seventh=True):
    return [root + scale[(deg + i) % 7] + 12 * ((deg + i) // 7) for i in ((0, 2, 4, 6) if seventh else (0, 2, 4))]

def bed(dur, style="lofi", mood="dreamy", seed=1, sections=None, swell=(), stop=None, resolve=None, bpm=None):
    S = STYLES[style]; rng = np.random.default_rng(seed)
    n = int(dur * SR); mus = np.zeros(n, np.float32); drm = np.zeros(n, np.float32)
    bpm = bpm or S["bpm"]; beat = 60 / bpm; s16 = beat / 4
    minor = mood in ("mystery", "epic"); scale = MINOR if minor else MAJOR
    root = 48 + int(rng.integers(0, 7))                          # C3..F#3
    prog = PROGS[mood][int(rng.integers(0, len(PROGS[mood])))]
    sections = sorted(sections or [(0, "normal")])
    lvl = lambda t: ([lv for (t0, lv) in sections if t0 <= t] or ["normal"])[-1]
    sw = lambda i: (S["swing"] * s16 if i % 2 else 0.0)          # swing the off-16ths
    end = stop if stop is not None else (resolve if resolve is not None else dur)
    bar, t = 0, 0.0
    hook = S["hook"]
    while t < end - 0.05:
        lv = lvl(t); L = beat * 4
        deg = prog[bar % len(prog)]
        sc = MINOR if (lv == "tense" or minor) else scale
        ch = _chord(root, sc, deg if lv != "tense" else [0, 5, 0, 6][bar % 4])
        # chords / pad
        if S["keys"] is not None and lv != "rest":
            hits = [0.0, 2.5 * beat] if style == "lofi" else [0.0, 1.5 * beat, 3.0 * beat]
            for h in hits:
                for k, m in enumerate(ch): _place(mus, S["keys"](midi(m + 12), 2.2), t + h + k * 0.012, 0.11 if h == 0 else 0.07)
        _place(mus, pad([midi(m + 12) for m in ch[:3]], L + 0.5, 900 if style in ("lofi", "chillhop") else 1600, air=1.0 if style in ("trap", "synthwave", "cinematic") else 0), t, 0.16 if lv == "rest" else 0.10)
        # bass
        if lv != "rest":
            b = midi(ch[0] - 12)
            if style == "trap": _place(mus, sub(b, 1.6, glide_from=b * 1.5 if bar % 2 else None), t, 0.32); _place(mus, sub(b, 0.9), t + 2.5 * beat, 0.24)
            elif style in ("synthwave", "cinematic"):
                for e in range(8): _place(mus, sub(b, 0.25), t + e * beat / 2, 0.16 if e % 2 == 0 else 0.11)
            else:
                for h in (0, 1.75 * beat, 2.5 * beat): _place(mus, sub(b, 0.8), t + h, 0.26)
        # lead: hook / arp / ostinato
        if lv in ("normal", "tense") or (lv == "soft" and hook in ("arp", "ostinato")):
            pent = [ch[0], ch[1], ch[2], ch[3] if len(ch) > 3 else ch[0] + 12]
            if hook == "arp":
                order = [0, 1, 2, 3, 2, 1, 2, 3, 0, 1, 2, 3, 2, 1, 3, 2]
                for i, o in enumerate(order): _place(mus, S["lead"](midi(pent[o] + 12), 0.4, 0.8 + 0.6 * np.sin(bar * 0.7 + i * 0.2) ** 2), t + i * s16, S["lead_g"])
            elif hook == "ostinato":
                for i in range(16): _place(mus, S["lead"](midi(pent[[0, 2, 1, 2][i % 4]]), 0.3, 0.6), t + i * s16, S["lead_g"] * (1.0 if i % 4 == 0 else 0.6))
            elif lv != "tense":
                var = (bar // 2) % 2
                for i, o in enumerate(hook):
                    if o is None: continue
                    m = pent[(o + var) % 4] + 12 + (12 if style == "lofi" else 0)
                    _place(mus, S["lead"](midi(m)), t + i * s16 + sw(i), S["lead_g"])
        # drums
        if lv in ("normal", "tense"):
            kit = S["kit"]
            for i in range(16):
                tt = t + i * s16 + sw(i); thin = lv == "tense"
                if kit in ("lofi", "chillhop"):
                    if i in (0, 10) or (i == 7 and bar % 2): _place(drm, kick(0.8), tt, 0.55)
                    if i in (4, 12) and not thin: _place(drm, rim() if kit == "lofi" else clap(), tt, 0.28 if kit == "lofi" else 0.3)
                    if i % 2 == 0: _place(drm, hat(), tt, 0.10 if i % 4 else 0.14)
                elif kit == "explainer":
                    if i in (0, 6, 8) and not (thin and i == 6): _place(drm, kick(1.0), tt, 0.5)
                    if i in (4, 12) and not thin: _place(drm, clap(), tt, 0.32)
                    _place(drm, shaker(), tt, 0.07 if i % 2 else 0.11)
                elif kit == "synthwave":
                    if i % 4 == 0: _place(drm, kick(1.0), tt, 0.5)
                    if i in (4, 12) and not thin: _place(drm, snare(False), tt, 0.24)
                    if i % 4 == 2: _place(drm, hat(True), tt, 0.07)
                elif kit == "cinematic":
                    _place(drm, hat(), tt, 0.08 if i % 4 else 0.12)
                    if i in (0, 10) and bar % 2 == 0: _place(drm, kick(0.6), tt, 0.5)
                elif kit == "trap":
                    if i in (0, 11) : _place(drm, kick(0.9), tt, 0.4)
                    if i in (8,) and not thin: _place(drm, snap(), tt, 0.3)
                    if i % 2 == 0 or (bar % 4 == 3 and i >= 12): _place(drm, hat(), tt, 0.09)
        bar += 1; t += L
    if S.get("pump"):   # gentle side-chain feel inside the music (not the voice)
        tt = np.arange(n) / SR; ph = (tt % beat) / beat; mus *= (0.72 + 0.28 * np.minimum(1, ph / 0.35)).astype(np.float32)
    out = _lp(mus, S["cutoff"]) + _lp(drm, S["cutoff"] * 1.6)
    if S.get("crackle"): out += crackle(dur)[:n] * 0.06
    for ts in swell: _place(out, riser(1.8), max(0, ts - 1.8), 1.0)
    if stop is not None:   # twist: fade out fast, then a quiet low drone
        i0 = int((stop - 0.2) * SR); i1 = int(stop * SR)
        out[i0:i1] *= np.linspace(1, 0, max(1, i1 - i0)); out[i1:] = 0
        td = np.arange(n - i1) / SR; f = midi(root - 24)
        out[i1:] += ((np.sin(2 * np.pi * f * td) + 0.5 * np.sin(2 * np.pi * f * 1.5 * td) + 0.4 * np.sin(2 * np.pi * f * 2.005 * td)) * np.minimum(1, td / 0.6) * 0.07).astype(np.float32)
    elif resolve is not None:   # warm final chord on the last word
        i0 = int((resolve - 0.25) * SR); out[i0:] *= np.linspace(1, 0.15, n - i0) ** 2
        ch = _chord(root, MINOR if minor else MAJOR, 0)
        keys = STYLES[style]["keys"] or rhodes
        for k, m in enumerate(ch): _place(out, keys(midi(m + 12), 3.5), resolve + k * 0.04, 0.12)
        _place(out, pad([midi(m + 12) for m in ch[:3]], max(0.5, dur - resolve), 1200, air=1.0), resolve, 0.12)
    fade = int(0.6 * SR); out[-fade:] *= np.linspace(1, 0, fade)
    return out.astype(np.float32)
