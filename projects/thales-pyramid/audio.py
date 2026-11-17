"""Synthesized music bed + SFX stems.  python audio.py  ->  music.wav + sfx.wav

Template from the soldier example. Rewrite the music section and the SFX cue table
for each story; keep the synths. This script ONLY writes stems: mix.py does the mix
(music at -6 dB vs voice, SFX at or below that). No ducking, no compression here.
Length always follows voice.mp3, so the picture and the sound stay locked to the voice.
"""
import numpy as np, subprocess, wave

SR = 48000
def voice_seconds(path="voice.mp3"):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True).stdout
    return float(out)

FPS = 30
TOTAL = round(voice_seconds() * FPS)   # must match TOTAL in web/story.js
DUR = TOTAL / FPS
N = int(DUR * SR)
rng = np.random.default_rng(7)
t_all = np.arange(N) / SR

def load_voice():
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", "voice.mp3", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    v = np.frombuffer(raw, np.float32).copy()
    out = np.zeros(N, np.float32); out[:min(N, len(v))] = v[:N]; return out

def env(n, a=0.005, r=0.2, sus=None):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)
    return e

def lp(x, k):  # one-pole low-pass, k in (0,1)
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)): acc += k * (x[i] - acc); y[i] = acc
    return y

def lp_fast(x, cutoff):
    # FFT brick-ish low-pass (fast, fine for beds)
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / cutoff) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)

def hp_fast(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 - 1 / (1 + (f / cutoff) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)

def place(buf, sig, t0, gain=1.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if i < N and j > i: buf[i:j] += sig[: j - i] * gain

midi = lambda m: 440 * 2 ** ((m - 69) / 12)

# ---------------- music ----------------
music = np.zeros(N, np.float32)
BPM = 92; beat = 60 / BPM
HIJAZ = [62, 63, 66, 67, 69, 70, 72, 74, 75, 78]        # D Eb F# G A Bb C D Eb F#: Egyptian flavour
ROOTS = [50, 50, 55, 50]                               # D D G D
def pluck(f, dur=0.35, bright=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum((bright ** k) * np.sin(2 * np.pi * f * (k + 1) * t) / (k + 1) for k in range(6))
    return (s * env(n, 0.003, dur * 0.35)).astype(np.float32)
def zither(f, dur=0.9, bend=0.0):
    """oud-like pluck: bright attack, quick decay, small slide"""
    n = int(dur * SR); t = np.arange(n) / SR
    fr = f * (1 + bend * (1 - np.exp(-t * 18)))
    ph = 2 * np.pi * np.cumsum(fr) / SR
    s = sum((0.6 ** k) * np.sin((k + 1) * ph) / (k + 1) ** 0.7 for k in range(8))
    return (s * np.exp(-t * 4.0) * np.minimum(1, t / 0.002)).astype(np.float32)
def brass(fs, dur):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for f in fs:
        ph = 2 * np.pi * f * t + 0.003 * np.sin(2 * np.pi * 5 * t)
        s += sum(np.sin((k + 1) * ph) / (k + 1) ** 1.3 for k in range(8))
    a = np.minimum(1, t / 0.08) * np.minimum(1, (dur - t) / 0.15).clip(0)
    return lp_fast((s * a).astype(np.float32), 1800) / len(fs)
def pad(fs, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t) for f in fs) / len(fs)
    a = np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.6).clip(0)
    return (s * a).astype(np.float32)
def drum(kind):
    if kind == "kick":   # big low war drum
        n = int(0.5 * SR); t = np.arange(n) / SR; f = 45 + 70 * np.exp(-t * 22)
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)).astype(np.float32)
    n = int(0.16 * SR); t = np.arange(n) / SR   # small rim/wood block
    s = np.sin(2 * np.pi * 820 * t) * np.exp(-t * 60) + rng.standard_normal(n) * np.exp(-t * 80) * 0.3
    return s.astype(np.float32)

END = 1866 / 30   # resolving chord on "down"
def doum():   # deep frame drum
    n = int(0.45 * SR); t = np.arange(n) / SR; f = 70 + 60 * np.exp(-t * 25)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8)).astype(np.float32)
def tek():    # rim tap
    n = int(0.08 * SR); t = np.arange(n) / SR
    return (hp_fast((rng.standard_normal(n) * np.exp(-t * 90)).astype(np.float32), 2000) * 0.7 + np.sin(2 * np.pi * 1200 * t) * np.exp(-t * 70) * 0.3).astype(np.float32)
# maqsum-like rhythm: D t t D t (8 eighths per bar)
PAT = ["D", "t", "", "t", "D", "", "t", ""]
mel = [0, 2, 3, 4, 3, 2, 1, 0, 4, 5, 4, 3, 2, 3, 1, 0]
bar = 0; tt = 0.0
while tt < END - 0.2:
    root = ROOTS[bar % 4]
    place(music, pad([midi(root + 12), midi(root + 19)], beat * 4), tt, 0.045)
    for e8 in range(8):
        te = tt + e8 * beat / 2
        if te >= END - 0.2: break
        if PAT[e8] == "D": place(music, doum(), te, 0.55)
        elif PAT[e8] == "t": place(music, tek(), te, 0.18)
        if e8 % 2 == 0: place(music, pluck(midi(root - 12), 0.5, 0.35), te, 0.22 if e8 == 0 else 0.12)
        if e8 in (1, 3, 4, 6): place(music, zither(midi(HIJAZ[(mel[(bar * 4 + e8) % 16] + (bar // 4)) % 8]), 0.6, 0.015), te, 0.14)
    bar += 1; tt += beat * 4
i0 = int((END - 0.25) * SR); music[i0:] *= np.linspace(1, 0, N - i0) ** 3
# warm resolving chord on the last word
for k, m in enumerate([50, 57, 62, 66, 69]): place(music, zither(midi(m), 2.6), END + k * 0.04, 0.22)
place(music, pad([midi(50), midi(57), midi(62)], DUR - END), END, 0.08)

# ---------------- sfx ----------------
sfx = np.zeros(N, np.float32)
def noise(d): return rng.standard_normal(int(d * SR)).astype(np.float32)
def thunk(f0=90, d=0.3):
    n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f0 * t * (1 + 0.6 * np.exp(-t * 40))) * np.exp(-t * 14) + lp_fast(noise(d), 1200) * np.exp(-t * 30) * 0.5).astype(np.float32)
def rumble(d):
    n = int(d * SR); t = np.arange(n) / SR
    s = lp_fast(noise(d), 160) * 3 * np.minimum(1, t / 0.15) * np.exp(-t / (d * 0.45))
    return s.astype(np.float32)
def crash(d=1.2):
    n = int(d * SR); t = np.arange(n) / SR; s = np.zeros(n, np.float32)
    for k in range(14):
        tk = rng.uniform(0, d * 0.6); i = int(tk * SR); g = thunk(rng.uniform(60, 160), 0.35) * rng.uniform(0.3, 0.9)
        s[i:i + len(g)] += g[: n - i]
    s += lp_fast(noise(d), 2500) * np.exp(-t * 3) * 0.25
    return s
def cuckoo():
    out = []
    for f, d in [(740, 0.16), (587, 0.24)]:
        n = int(d * SR); t = np.arange(n) / SR
        out.append(np.sin(2 * np.pi * f * t) * np.minimum(1, t / 0.01) * np.exp(-t * 6)); out.append(np.zeros(int(0.06 * SR)))
    return np.concatenate(out).astype(np.float32)
def scrape(d=0.8):
    n = int(d * SR); t = np.arange(n) / SR
    s = noise(d) * (0.5 + 0.5 * np.sin(2 * np.pi * 13 * t)) * np.sin(np.pi * t / d)
    s = hp_fast(lp_fast(s, 5000), 1500)
    ring = np.sin(2 * np.pi * 1870 * t) * np.exp(-t * 3) * 0.2
    return (s * 0.6 + ring).astype(np.float32)
def ting():
    n = int(1.2 * SR); t = np.arange(n) / SR
    return (sum(np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, k in [(2093, 4), (3136, 6), (4186, 8)]) * 0.3).astype(np.float32)
def sting():
    n = int(2.0 * SR); t = np.arange(n) / SR
    low = np.sin(2 * np.pi * 41 * t) * np.exp(-t * 1.5) * 1.2
    hit = lp_fast(noise(2.0), 900) * np.exp(-t * 6) * 0.8
    stab = brass([midi(45), midi(48), midi(51)], 1.4); s = low + hit; s[: len(stab)] += stab * 2.2 * np.exp(-np.arange(len(stab)) / SR * 2)
    return s.astype(np.float32)
def creak(d=0.6, f0=140):
    n = int(d * SR); t = np.arange(n) / SR
    rate = f0 * (1 + 0.35 * np.sin(2 * np.pi * 1.3 * t / d))
    ph = np.cumsum(rate) / SR; pulses = (np.mod(ph, 1) < 0.08).astype(np.float32)
    s = lp_fast(pulses * (0.6 + 0.4 * rng.random(n).astype(np.float32)), 2200) * np.sin(np.pi * t / d)
    return hp_fast(s, 200) * 2.5
def snap():
    d = 0.5; n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(noise(d), 800) * np.exp(-t * 18) * 1.4 + np.pad(thunk(120, 0.4), (0, n - int(0.4 * SR))) * 0.6).astype(np.float32)
def splash(d=1.0):
    n = int(d * SR); t = np.arange(n) / SR
    s = lp_fast(noise(d), 4000) * (np.exp(-t * 4) * np.minimum(1, t / 0.01)) + lp_fast(noise(d), 400) * np.exp(-t * 7) * 1.5
    return s.astype(np.float32)
def whoosh(d=0.5):
    n = int(d * SR); t = np.arange(n) / SR
    return (lp_fast(noise(d), 1500) * np.sin(np.pi * t / d) ** 2 * 0.6).astype(np.float32)
def snore(d=1.1):
    n = int(d * SR); t = np.arange(n) / SR
    buzz = (np.mod(np.cumsum(60 + 25 * np.sin(np.pi * t / d)) / SR, 1) < 0.3).astype(np.float32)
    return (lp_fast(buzz * 0.5 + noise(d) * 0.15, 700) * np.sin(np.pi * t / d) ** 2).astype(np.float32)
def leaves(d):
    n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(lp_fast(noise(d), 6000), 2500) * (0.3 + 0.3 * np.sin(2 * np.pi * 0.7 * t) ** 2) * np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.4)).astype(np.float32)
def water(d):
    n = int(d * SR); t = np.arange(n) / SR
    return (lp_fast(noise(d), 900) * 0.5 + hp_fast(lp_fast(noise(d), 3000), 1200) * 0.15 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.4 * t))).astype(np.float32)

F = lambda f: f / 30
def boing():
    n = int(0.5 * SR); t = np.arange(n) / SR; f = 520 * np.exp(-t * 3) + 120
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5)).astype(np.float32)
def shimmer(d=1.6):
    n = int(d * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for k, f0 in enumerate([880, 1320, 1760, 2200]): s += np.sin(2 * np.pi * np.cumsum(f0 * (1 + 0.6 * t / d)) / SR) * (0.5 + 0.5 * np.sin(2 * np.pi * (6 + k) * t))
    return (s * (t / d) ** 2 * 0.25).astype(np.float32)
def rustle(d=0.6):
    x = hp_fast(lp_fast(noise(d), 5000), 1500); n = len(x); t = np.arange(n) / SR
    return (x * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 7 * t))) * np.minimum(1, (d - t) / 0.2)).astype(np.float32)
def clang():
    n = int(0.9 * SR); t = np.arange(n) / SR
    return (sum(np.sin(2 * np.pi * f * t) * np.exp(-t * dk) for f, dk in [(620, 5), (1490, 7), (2310, 9)]) * 0.4).astype(np.float32)
def whinny(d=1.0):
    n = int(d * SR); t = np.arange(n) / SR; f = 700 + 300 * np.sin(2 * np.pi * 11 * t) * np.exp(-t * 2) - 300 * t / d
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return lp_fast((s * env(n, 0.04, 0.4)).astype(np.float32), 2500) * 0.6
def hoof():
    n = int(0.12 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 180 * t) * np.exp(-t * 60) + lp_fast(noise(0.12), 1500) * np.exp(-t * 50) * 0.5).astype(np.float32)
def swish(d=0.35): x = hp_fast(lp_fast(noise(d), 4000), 600); t = np.arange(len(x)) / SR; return (x * np.sin(np.pi * t / d) ** 2 * 0.6).astype(np.float32)
def pop(): n = int(0.12 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * np.cumsum(300 + 900 * t / 0.12) / SR) * np.exp(-t * 30)).astype(np.float32)

place(sfx, whoosh(0.9), F(10), 0.5)            # tilt up the pyramid on "tallest"
place(sfx, whoosh(0.5), F(60), 0.4)             # whip down to Thales
for k in range(4): place(sfx, pop(), F(94 + k * 5), 0.25)   # finger wiggle "without touching"
place(sfx, whoosh(0.4), F(126), 0.5)            # flash to the map
place(sfx, rustle(0.7), F(130), 0.5)            # map
place(sfx, thunk(70, 0.3), F(160), 0.6)         # "600 BC"
for k in range(5): place(sfx, swish(0.15), F(259 + k * 7), 0.2)  # dotted route drawing
place(sfx, shimmer(1.6), F(330), 0.45)          # the Great Pyramid
place(sfx, pop(), F(468), 0.5)                  # "?"
place(sfx, swish(0.4), F(536), 0.4)             # tape zip
place(sfx, boing(), F(572), 0.45)               # tape far too short
place(sfx, whoosh(0.5), F(600), 0.45)           # rope thrown up
place(sfx, whoosh(0.6), F(622), 0.35); place(sfx, thunk(90, 0.3), F(640), 0.6)  # rope slides back, thud
for k in range(5): place(sfx, creak(0.35, 150 + k * 12), F(652 + k * 17), 0.5)   # wobbly ladder
for k in range(6): place(sfx, ting(), F(742 + k * 12), 0.08)                    # tick-tock, he waits
place(sfx, shimmer(1.4), F(990), 0.55)          # the moment builds
place(sfx, ting(), F(1035), 0.75)               # EUREKA on "tall"
place(sfx, whoosh(1.0), F(1060), 0.5)           # the big pull-back
place(sfx, sting(), F(1209), 0.45)              # "Even the pyramid."
place(sfx, rustle(0.8), F(1259), 0.35)          # rope laid on the sand
place(sfx, whoosh(0.9), F(1368), 0.5); place(sfx, ting(), F(1405), 0.55)          # the line swings up to the apex
place(sfx, pop(), F(1426), 0.4); place(sfx, pop(), F(1472), 0.4)               # ladder / rope icons
place(sfx, ting(), F(1532), 0.4)                # one idea
for f0 in (1700, 1716, 1737): place(sfx, ting(), F(f0), 0.45)                  # trees, towers, mountains
place(sfx, whoosh(0.5), F(1772), 0.35)          # into the sunset
def write_stem(path, x):
    x = np.asarray(x, np.float32)
    peak = float(np.abs(x).max()) or 1.0
    x = x / peak * 0.9                       # level is irrelevant: mix.py sets the gain
    fade = int(0.04 * SR); x[-fade:] *= np.linspace(1, 0, fade)
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())

write_stem("music.wav", music)
write_stem("sfx.wav", sfx)
print(f"wrote music.wav + sfx.wav ({DUR:.2f} s, {TOTAL} frames). Next: python mix.py voice.mp3 music.wav sfx.wav")
