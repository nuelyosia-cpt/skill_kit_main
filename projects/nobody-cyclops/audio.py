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
BPM = 100; beat = 60 / BPM
DOR = [57, 59, 60, 62, 64, 66, 67, 69, 71, 72]          # A dorian: sly, ancient-Greek feel (lyre)
ROOTS = [45, 45, 43, 50]                               # A A G D
def pluck(f, dur=0.35, bright=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum((bright ** k) * np.sin(2 * np.pi * f * (k + 1) * t) / (k + 1) for k in range(6))
    return (s * env(n, 0.003, dur * 0.35)).astype(np.float32)
def lyre(f, dur=0.9, bend=0.0):
    n = int(dur * SR); t = np.arange(n) / SR
    fr = f * (1 + bend * (1 - np.exp(-t * 18)))
    ph = 2 * np.pi * np.cumsum(fr) / SR
    s = sum((0.55 ** k) * np.sin((k + 1) * ph) / (k + 1) ** 0.7 for k in range(8))
    return (s * np.exp(-t * 3.2) * np.minimum(1, t / 0.002)).astype(np.float32)
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
def doum():
    n = int(0.45 * SR); t = np.arange(n) / SR; f = 62 + 60 * np.exp(-t * 25)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8)).astype(np.float32)
def tek():
    n = int(0.08 * SR); t = np.arange(n) / SR
    return (hp_fast((rng.standard_normal(n) * np.exp(-t * 90)).astype(np.float32), 2000) * 0.7 + np.sin(2 * np.pi * 1200 * t) * np.exp(-t * 70) * 0.3).astype(np.float32)
NIGHT0, NIGHT1, STOP = 1149 / 30, 1406 / 30, 1983 / 30
PAT = ["D", "t", "", "t", "D", "", "t", "t"]
mel = [0, 2, 4, 3, 2, 0, 1, 2, 4, 5, 4, 2, 3, 1, 0, 0]
bar = 0; tt = 0.0
while tt < STOP - 0.1:
    root = ROOTS[bar % 4]; night = NIGHT0 <= tt < NIGHT1; bright = tt >= 1547 / 30
    place(music, pad([midi(root + 12), midi(root + 19)], beat * 4), tt, 0.05 if not night else 0.08)
    for e8 in range(8):
        te = tt + e8 * beat / 2
        if te >= STOP - 0.1: break
        if night:   # tense: no drums, slow low plucks only
            if e8 in (0, 5): place(music, pluck(midi(root - 12), 0.8, 0.3), te, 0.25)
            continue
        if PAT[e8] == "D": place(music, doum(), te, 0.5)
        elif PAT[e8] == "t": place(music, tek(), te, 0.14)
        if e8 % 2 == 0: place(music, pluck(midi(root - 12), 0.5, 0.35), te, 0.2 if e8 == 0 else 0.11)
        if e8 in (1, 3, 4, 6) or (bright and e8 == 7): place(music, lyre(midi(DOR[(mel[(bar * 4 + e8) % 16] + (bar // 4)) % 8] + (12 if bright and e8 == 7 else 0)), 0.7, 0.01), te, 0.13)
    bar += 1; tt += beat * 4
# rising shimmer into "Nobody", warm chord on "Brains beat size"
for k, m in enumerate([57, 64, 69, 73, 76]): place(music, lyre(midi(m), 2.2), 1847 / 30 + k * 0.05, 0.16)
# the twist: music stops on "mistake", a low drone runs to the end
i0 = int((STOP - 0.15) * SR); i1 = int(STOP * SR); music[i0:i1] *= np.linspace(1, 0, i1 - i0); music[i1:] = 0
dn = N - i1; td = np.arange(dn) / SR
music[i1:] += (np.sin(2 * np.pi * 55 * td) * 0.5 + np.sin(2 * np.pi * 55.6 * td) * 0.3 + np.sin(2 * np.pi * 82.4 * td) * 0.2) * np.minimum(1, td / 0.4) * 0.35

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

def baa(d=0.7, f0=330):
    n = int(d * SR); t = np.arange(n) / SR; f = f0 * (1 - 0.15 * t / d) * (1 + 0.04 * np.sin(2 * np.pi * 7 * t))
    ph = np.cumsum(f) / SR; buzz = (np.mod(ph, 1) < 0.35).astype(np.float32) - 0.35
    return lp_fast((buzz * env(n, 0.05, d * 0.5)).astype(np.float32), 2200) * 0.8
def gulp():
    n = int(0.3 * SR); t = np.arange(n) / SR; f = 160 + 220 * np.exp(-t * 18)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 12)).astype(np.float32)
def crickets(d):
    n = int(d * SR); t = np.arange(n) / SR
    chirp = (np.sin(2 * np.pi * 30 * t) > 0.6) * (np.sin(2 * np.pi * 0.9 * t) > 0.2)
    return (np.sin(2 * np.pi * 4200 * t) * chirp * 0.15).astype(np.float32)

place(sfx, thunk(48, 0.6), F(2), 0.6)                     # hook boom
place(sfx, whoosh(1.0), F(48), 0.45)                      # tilt up the giant
place(sfx, thunk(60, 0.4), F(85), 0.55)                   # "fight"
place(sfx, whoosh(0.4), F(106), 0.5); place(sfx, water(1.6), F(109), 0.35)   # flash to the sea
place(sfx, baa(0.7), F(176), 0.4); place(sfx, baa(0.6, 290), F(196), 0.3)
for k in range(4): place(sfx, thunk(55, 0.4), F(214 + k * 11), 0.55)   # the giant comes home
place(sfx, pop(), F(267), 0.4)                            # the eye opens wide
place(sfx, rumble(2.4), F(344), 0.7)                      # boulder rolls
for k in range(22): place(sfx, pop(), F(379 + k), 0.12)   # 22 wagons pop up
place(sfx, crash(1.0), F(414), 0.6); place(sfx, thunk(45, 0.6), F(414), 0.8)   # sealed on "move"
place(sfx, gulp(), F(470), 0.5)                           # "dinner"
for k in range(5): place(sfx, creak(0.4, 110 + k * 10), F(531 + k * 17), 0.4)   # pushing, nothing moves
place(sfx, whoosh(0.5), F(632), 0.35)
place(sfx, ting(), F(759), 0.45)                          # the plan
place(sfx, scrape(1.3), F(793), 0.35); place(sfx, rustle(0.6), F(840), 0.45)   # whittle, hide
place(sfx, water(1.0), F(886), 0.4); place(sfx, gulp(), F(920), 0.5); place(sfx, gulp(), F(932), 0.45)
place(sfx, boing(), F(945), 0.35)                         # hic
place(sfx, shimmer(1.6), F(1060), 0.5)                    # build to the name
place(sfx, ting(), F(1108), 0.75)                         # EUREKA on "Nobody"
place(sfx, snore(1.1), F(1150), 0.4)
place(sfx, whoosh(0.4), F(1164), 0.4); place(sfx, sting(), F(1173), 0.5)      # strike (off-screen)
place(sfx, rumble(1.0), F(1180), 0.5); place(sfx, rumble(0.8), F(1241), 0.5)  # the giant roars
place(sfx, whoosh(0.5), F(1268), 0.35)
place(sfx, pop(), F(1307), 0.4)                           # "?"
place(sfx, rumble(1.2), F(1350), 0.45)                    # "Nobody is hurting me!"
place(sfx, crickets(4.6), F(1407), 0.6)
place(sfx, snore(1.2), F(1445), 0.3)
place(sfx, pop(), F(1471), 0.45)                          # empty speech bubble
place(sfx, rumble(1.4), F(1585), 0.55); place(sfx, thunk(50, 0.5), F(1615), 0.5)   # boulder rolls aside
for k in range(4): place(sfx, baa(0.6, 300 + k * 20), F(1612 + k * 24), 0.3); place(sfx, thunk(200, 0.15), F(1640 + k * 24), 0.3)  # sheep and pats
for k in range(14): place(sfx, hoof(), F(1765 + k * 6), 0.3)   # running to the ship
place(sfx, ting(), F(1869), 0.45)                         # "size"
place(sfx, water(3.5), F(1900), 0.35)
place(sfx, whoosh(1.2), F(1950), 0.4)
place(sfx, rumble(1.8), F(1983), 0.6); place(sfx, splash(1.5), F(2000), 0.5)  # the wave rises
place(sfx, sting(), F(2018), 0.55)                        # "in the end"
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
