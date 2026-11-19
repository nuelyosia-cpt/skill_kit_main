"""Calm background-music library for the cartoon shorts (numpy only, deterministic).

    from music import bed, STYLES
    music = bed(DUR, style="harp", mood="curious", seed=4,
                sections=[(0, "soft"), (38.3, "tense"), (46.9, "normal")],
                swell=[36.9], stop=None, resolve=66.1)

The bed is quiet and gentle on purpose: no drums, soft attacks, sparse melody. mix.py
puts it at -12 dB under the voice. Pick a different STYLE (and seed) from the last few
videos so every short sounds different (check `grep STYLE projects/*/audio.py`).

Styles (pick one that suits the era and mood):
  harp      gentle harp arpeggios + warm pad             (myths, wonder, ancient)
  lyre      plucked lyre, modal, airy                    (ancient Greece / Rome)
  piano     soft felt piano chords + high notes          (inventors, modern, emotional)
  musicbox  music box + light pad                        (playful, childhood, clever tricks)
  marimba   soft marimba ostinato                        (curious, quirky, science)
  strings   slow warm strings, very calm                 (drama, turning points)
  guitar    fingerpicked nylon guitar                    (travel, everyday inventions)
  kalimba   kalimba patterns + pad                       (light, curious, nature)

Moods: "curious" (major), "mystery" (minor), "warm" (major, slower), "epic" (minor, fuller).
sections: list of (start_seconds, level) with level in "rest" (pad only), "soft", "normal", "tense"
          ("tense" switches to a darker chord and thins the notes out).
swell:    times (s) where a soft rising shimmer should peak (e.g. the eureka word).
stop:     time (s) where the music stops for a twist; a quiet low drone continues to the end.
resolve:  time (s) of the last word for a moral/engagement ending: a warm final chord rings out.
"""
import numpy as np

SR = 48000
midi = lambda m: 440.0 * 2 ** ((m - 69) / 12)

def _lp(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / cutoff) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)

def _place(buf, sig, t0, gain=1.0):
    i = int(t0 * SR); j = min(len(buf), i + len(sig))
    if 0 <= i < len(buf) and j > i: buf[i:j] += sig[: j - i] * gain

# ---------------- instruments ----------------
def _t(d): return np.arange(int(d * SR)) / SR

def pluck(f, d=1.6, bright=0.45, decay=2.2, inharm=0.0):
    t = _t(d); s = np.zeros_like(t)
    for k in range(1, 9):
        fk = f * k * (1 + inharm * k * k)
        if fk > 12000: break
        s += (bright ** (k - 1)) / k * np.sin(2 * np.pi * fk * t) * np.exp(-t * decay * (1 + 0.35 * (k - 1)))
    return (s * np.minimum(1, t / 0.004)).astype(np.float32)

def harp(f, d=2.6): return pluck(f, d, 0.4, 1.4)
def lyre(f, d=1.8): return pluck(f, d, 0.55, 2.0)
def guitar(f, d=2.0): return _lp(pluck(f, d, 0.5, 2.4, 0.00004), 3500)
def piano(f, d=3.0):
    t = _t(d); s = sum((0.5 ** (k - 1)) / k * np.sin(2 * np.pi * f * k * (1 + 0.0003 * k * k) * t) * np.exp(-t * (0.9 + 0.6 * k)) for k in range(1, 7))
    return _lp((s * np.minimum(1, t / 0.006)).astype(np.float32), 2600)
def musicbox(f, d=1.6):
    t = _t(d); s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6) + 0.15 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 10)
    return (s * np.exp(-t * 2.6) * np.minimum(1, t / 0.002)).astype(np.float32)
def marimba(f, d=1.0):
    t = _t(d); s = np.sin(2 * np.pi * f * t) * np.exp(-t * 4.5) + 0.3 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 14)
    return (s * np.minimum(1, t / 0.003)).astype(np.float32)
def kalimba(f, d=1.4):
    t = _t(d); s = np.sin(2 * np.pi * f * t) * np.exp(-t * 3) + 0.25 * np.sin(2 * np.pi * f * 5.9 * t) * np.exp(-t * 18)
    return (s * np.minimum(1, t / 0.002)).astype(np.float32)
def pad(fs, d, bright=1200):
    t = _t(d); s = np.zeros_like(t)
    for f in fs:
        for det in (-0.12, 0.0, 0.11):
            ph = 2 * np.pi * f * (1 + det / 100) * t
            s += np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)
    a = np.minimum(1, t / min(1.2, d / 3)) * np.clip((d - t) / min(1.2, d / 3), 0, 1)
    return _lp((s * a / (3 * len(fs))).astype(np.float32), bright)
def strings(fs, d): return pad(fs, d, 1800) * (1 + 0.04 * np.sin(2 * np.pi * 5 * _t(d)))[: int(d * SR)].astype(np.float32)
def shimmer(d=1.6):
    t = _t(d); s = np.zeros_like(t)
    for k, f0 in enumerate([1320, 1760, 2640]): s += np.sin(2 * np.pi * np.cumsum(f0 * (1 + 0.25 * t / d)) / SR) * (0.5 + 0.5 * np.sin(2 * np.pi * (5 + k) * t))
    return (s * (t / d) ** 2 * 0.12).astype(np.float32)

STYLES = {
    #           lead,      bpm, pattern (eighths: chord-tone index or None), pad,  lead gain, octave
    "harp":     (harp,      72, [0, 1, 2, 3, 2, 1, None, 2], "pad",     0.20, 12),
    "lyre":     (lyre,      80, [0, None, 2, 1, None, 2, 3, None], "pad", 0.20, 12),
    "piano":    (piano,     66, [0, None, None, 2, None, 1, None, None], "pad", 0.26, 12),
    "musicbox": (musicbox,  88, [2, None, 1, 3, None, 2, 0, None], "pad", 0.16, 24),
    "marimba":  (marimba,   92, [0, 2, 1, 2, 0, 2, 1, 3], "pad",        0.17, 12),
    "strings":  (None,      60, [], "strings",                          0.0, 12),
    "guitar":   (guitar,    76, [0, 2, 1, 2, 3, 2, 1, 2], "pad",        0.20, 0),
    "kalimba":  (kalimba,   84, [0, 2, None, 3, 1, None, 2, None], "pad", 0.20, 12),
}
PROGS = {
    "curious": [[0, 5, 3, 4], [0, 4, 5, 3], [0, 3, 0, 4], [0, 5, 1, 4]],
    "warm":    [[0, 3, 0, 4], [0, 5, 3, 4], [3, 4, 0, 0]],
    "mystery": [[0, 5, 2, 6], [0, 3, 6, 4], [0, 6, 5, 6]],
    "epic":    [[0, 5, 2, 6], [0, 6, 5, 4]],
}
MAJOR, MINOR = [0, 2, 4, 5, 7, 9, 11], [0, 2, 3, 5, 7, 8, 10]

def _chord(root, scale, deg):
    return [root + scale[(deg + i) % 7] + 12 * ((deg + i) // 7) for i in (0, 2, 4, 7)]

def bed(dur, style="harp", mood="curious", seed=1, sections=None, swell=(), stop=None, resolve=None, bpm=None):
    rng = np.random.default_rng(seed)
    n = int(dur * SR); out = np.zeros(n, np.float32)
    lead, bpm0, pat, padkind, lg, octv = STYLES[style]
    bpm = bpm or bpm0 * (0.9 if mood == "warm" else 1.0); beat = 60 / bpm
    minor = mood in ("mystery", "epic"); scale = MINOR if minor else MAJOR
    root = 45 + int(rng.integers(0, 8))                       # A2..E3
    prog = PROGS[mood][int(rng.integers(0, len(PROGS[mood])))]
    sections = sorted(sections or [(0, "normal")])
    level_at = lambda t: [lv for (t0, lv) in sections if t0 <= t][-1] if any(t0 <= t for t0, _ in sections) else "normal"
    end = stop if stop is not None else (resolve if resolve is not None else dur)
    bar, t = 0, 0.0
    melody_on = rng.random() < 0.7
    while t < end - 0.05:
        lv = level_at(t); deg = prog[bar % len(prog)]
        if lv == "tense": deg = [5, 1, 5, 4][bar % 4]; ch = _chord(root - 12 if minor else root - 9, MINOR, deg % 7)
        else: ch = _chord(root, scale, deg)
        L = beat * 4
        padsig = strings([midi(m + 12) for m in ch[:3]], L + 0.4) if padkind == "strings" else pad([midi(m + 12) for m in ch[:3]], L + 0.4)
        _place(out, padsig, t, 0.22 if padkind == "strings" else (0.12 if lv != "rest" else 0.14))
        _place(out, pluck(midi(ch[0] - 12), 2.4, 0.25, 1.2) if lead else pad([midi(ch[0] - 12)], L), t, 0.18 if lv != "rest" else 0.1)
        if lead and lv not in ("rest",):
            for e in range(8):
                te = t + e * beat / 2
                if te >= end - 0.05: break
                idx = pat[(e + (bar % 2) * 2 * (style == "musicbox")) % len(pat)]
                if idx is None or (lv == "tense" and e % 2) or (lv == "soft" and e % 4 == 3): continue
                g = lg * (0.7 if lv == "soft" else 1.0) * (1.0 if e == 0 else 0.8)
                _place(out, lead(midi(ch[idx] + octv)), te + rng.uniform(-0.006, 0.006), g)
            if melody_on and lv == "normal" and bar % 2 == 1:   # a few high melody notes, sparse
                for k, tb in enumerate(sorted(rng.choice(8, 2, replace=False))):
                    m = ch[int(rng.integers(0, 3))] + octv + 12
                    _place(out, (lead or harp)(midi(m)), t + tb * beat / 2, lg * 0.6)
        bar += 1; t += L
    for ts in swell: _place(out, shimmer(1.6), max(0, ts - 1.6), 1.0)
    if stop is not None:   # twist: fade out fast, then a quiet low drone
        i0 = int((stop - 0.2) * SR); i1 = int(stop * SR)
        out[i0:i1] *= np.linspace(1, 0, max(1, i1 - i0)); out[i1:] = 0
        td = np.arange(n - i1) / SR; f = midi(root - 12)
        out[i1:] += ((np.sin(2 * np.pi * f * td) + 0.6 * np.sin(2 * np.pi * f * 1.004 * td) + 0.3 * np.sin(2 * np.pi * f * 1.5 * td)) * np.minimum(1, td / 0.5) * 0.08).astype(np.float32)
    elif resolve is not None:   # warm final chord on the last word
        i0 = int((resolve - 0.3) * SR); out[i0:] *= np.linspace(1, 0.3, n - i0)
        ch = _chord(root, MAJOR if not minor else MINOR, 0)
        for k, m in enumerate(ch): _place(out, (lead or harp)(midi(m + 12), 3.5), resolve + k * 0.05, 0.2)
        _place(out, pad([midi(m + 12) for m in ch[:3]], max(0.5, dur - resolve)), resolve, 0.14)
    fade = int(0.6 * SR); out[-fade:] *= np.linspace(1, 0, fade)
    return out
