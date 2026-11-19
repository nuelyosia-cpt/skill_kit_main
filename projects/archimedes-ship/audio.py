"""Synthesized music bed + SFX stems.  python audio.py  ->  music.wav + sfx.wav

Rewrite the MUSIC settings and the SFX cue table for each story; keep the synths.
Music: a calm bed from music.py (pick a STYLE/MOOD/SEED different from the last videos).
SFX: follow the picture: one cue for every visible action (a door, a splash, a pop-up,
a step, a camera whoosh), timed to the frame it happens on. This script ONLY writes
stems: mix.py does the mix (music -12 dB under the voice, SFX -8 dB). No ducking here.
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
BPM = 104; beat = 60 / BPM
prog = [(57, [57, 60, 64]), (53, [53, 57, 60]), (55, [55, 59, 62]), (52, [52, 56, 59])]  # Am F G E
def pluck(f, dur=0.35, bright=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum((bright ** k) * np.sin(2 * np.pi * f * (k + 1) * t) / (k + 1) for k in range(6))
    return (s * env(n, 0.003, dur * 0.35)).astype(np.float32)
def brass(fs, dur):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for f in fs:
        ph = 2 * np.pi * f * t + 0.003 * np.sin(2 * np.pi * 5 * t)
        s += sum(np.sin((k + 1) * ph) / (k + 1) ** 1.3 for k in range(8))
    a = np.minimum(1, t / 0.08) * np.minimum(1, (dur - t) / 0.15).clip(0)
    return lp_fast((s * a).astype(np.float32), 1800) / len(fs)
def drum(kind):
    if kind == "kick":
        n = int(0.35 * SR); t = np.arange(n) / SR; f = 50 + 90 * np.exp(-t * 30)
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)).astype(np.float32)
    n = int(0.18 * SR); t = np.arange(n) / SR
    s = rng.standard_normal(n) * np.exp(-t * 28) * 0.6 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 20) * 0.5
    return hp_fast(s.astype(np.float32), 300)

from music import bed, STYLES   # calm music library (see music.py for styles and moods)
# One calm bed per video. Change STYLE / MOOD / SEED every video so no two shorts sound alike:
#   STYLE: lofi, chillhop, explainer, synthwave, cinematic, trap
#   MOOD:  dreamy, curious, mystery, epic
STYLE, MOOD, SEED = "explainer", "curious", 5
music = bed(DUR, style=STYLE, mood=MOOD, seed=SEED,
            sections=[(0, "soft"), (3.1, "normal"), (34.8, "soft"), (37.5, "normal"), (42.6, "rest"), (43.6, "normal"),
                      (52.9, "soft"), (57.3, "normal")],
            swell=[43.1], stop=None, resolve=69.5)[:N]
music = np.pad(music, (0, max(0, N - len(music))))

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
def pop(): n = int(0.12 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * np.cumsum(300 + 900 * t / 0.12) / SR) * np.exp(-t * 30)).astype(np.float32)
def boing():
    n = int(0.5 * SR); t = np.arange(n) / SR; f = 520 * np.exp(-t * 3) + 120
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5)).astype(np.float32)
def scratch(d=0.6):   # quill on parchment
    n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(noise(d), 2500) * (0.4 + 0.6 * (np.sin(2 * np.pi * 9 * t) > 0)) * np.sin(np.pi * t / d) * 0.4).astype(np.float32)
def clack(): n = int(0.1 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * 900 * t) * np.exp(-t * 70) + hp_fast(noise(0.1), 1500) * np.exp(-t * 90) * 0.4).astype(np.float32)
def tick(): n = int(0.06 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 80)).astype(np.float32)
def gulls(d):
    out = np.zeros(int(d * SR), np.float32)
    for k in range(int(d / 1.6)):
        n = int(0.35 * SR); t = np.arange(n) / SR; f = 1500 - 500 * t / 0.35
        place_local = int((0.3 + k * 1.6 + rng.uniform(0, 0.5)) * SR)
        sig = (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.35) * 0.3).astype(np.float32)
        out[place_local:place_local + n] += sig[: max(0, len(out) - place_local)]
    return out
def crowd(d): return (lp_fast(noise(d), 900) * 0.4 * np.minimum(1, np.arange(int(d * SR)) / SR / 0.4)).astype(np.float32)

# --- cues follow the picture (frames / 30) ---
place(sfx, whoosh(1.0), F(0), 0.35)                       # drift through space
for k in range(3): place(sfx, creak(0.4, 120 + k * 15), F(46 + k * 6), 0.45)   # leaning on the lever
place(sfx, boing(), F(56), 0.4); place(sfx, ting(), F(60), 0.3)                  # the Earth wobbles up
place(sfx, pop(), F(124), 0.4)                            # the king points: "prove it"
place(sfx, whoosh(0.4), F(158), 0.45); place(sfx, water(5.0), F(161), 0.35); place(sfx, gulls(5.0), F(161), 0.5)   # flash to Syracuse
place(sfx, pop(), F(225), 0.45)                           # SYRACUSE title
place(sfx, whoosh(0.3), F(314), 0.3); place(sfx, scratch(2.0), F(322), 0.6)    # study, quill
place(sfx, rustle(0.6) if 'rustle' in dir() else scratch(0.5), F(390), 0.4)  # the king opens the letter
place(sfx, pop(), F(432), 0.45); place(sfx, pop(), F(522), 0.45)               # diagram cards
place(sfx, pop(), F(650), 0.35)                           # the king points to the harbour
place(sfx, whoosh(0.4), F(672), 0.4); place(sfx, water(8.0), F(675), 0.3)
for k in range(8): place(sfx, creak(0.5, 100 + (k % 3) * 20), F(690 + k * 18), 0.45)   # hauling ropes
for k in range(6): place(sfx, thunk(160, 0.2), F(842 + k * 8), 0.35)            # crates and passengers on board
place(sfx, crowd(3.4), F(842), 0.5)
for k in range(4): place(sfx, creak(0.5, 90 + k * 12), F(920 + k * 12), 0.5)    # sailors strain
place(sfx, thunk(70, 0.4), F(945), 0.6)                   # nothing moves
place(sfx, whoosh(0.6), F(996), 0.35)                     # pull back to one man
place(sfx, boing(), F(1076), 0.35); place(sfx, pop(), F(1087), 0.5)              # skinny arm, "no muscle"
for k in range(10): place(sfx, clack(), F(1147 + k * 11.5), 0.35); place(sfx, whoosh(0.15), F(1147 + k * 11.5), 0.2)   # rope runs through the pulleys
place(sfx, ting(), F(1298), 0.7)                          # EUREKA on "trick"
place(sfx, pop(), F(1306), 0.4)                           # the diagram appears
for k in range(10): place(sfx, tick(), F(1328 + k * 3.4), 0.45)                  # strands light up one by one
for k in range(10): place(sfx, tick(), F(1372 + k * 7), 0.3)                     # 1/10 labels
place(sfx, ting(), F(1441), 0.5)                          # "a tenth"
place(sfx, whoosh(0.7), F(1479), 0.35); place(sfx, pop(), F(1538), 0.45)        # x10 rope, /10 force
place(sfx, whoosh(0.4), F(1588), 0.35); place(sfx, creak(0.4, 140), F(1608), 0.5)   # sits down
place(sfx, creak(0.6, 110), F(1680), 0.35)                # gentle pull
place(sfx, scrape(3.6), F(1730), 0.5); place(sfx, rumble(3.4), F(1730), 0.4)    # the ship glides over the sand
place(sfx, crowd(2.6), F(1760), 0.6)                      # the crowd gasps
place(sfx, whoosh(0.4), F(1842), 0.45)                    # flash to today
place(sfx, pop(), F(1862), 0.4); place(sfx, pop(), F(1886), 0.4); place(sfx, pop(), F(1925), 0.4)
place(sfx, creak(1.2, 70), F(1862), 0.3)                  # crane winch
place(sfx, rumble(2.4), F(1925), 0.3)                     # truck engine
place(sfx, whoosh(0.4), F(2004), 0.4)                     # back to the beach
place(sfx, ting(), F(2084), 0.45)                         # wink on "ship"
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
