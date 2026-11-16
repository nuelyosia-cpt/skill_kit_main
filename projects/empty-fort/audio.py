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
BPM = 96; beat = 60 / BPM
PENTA = [62, 64, 66, 69, 71, 74, 76, 78, 81]          # D major pentatonic
ROOTS = [50, 47, 43, 45]                             # D  Bm  G  A
def pluck(f, dur=0.35, bright=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum((bright ** k) * np.sin(2 * np.pi * f * (k + 1) * t) / (k + 1) for k in range(6))
    return (s * env(n, 0.003, dur * 0.35)).astype(np.float32)
def zither(f, dur=0.9, bend=0.0):
    """plucked guqin-like tone: bright attack, slow decay, optional little upward slide"""
    n = int(dur * SR); t = np.arange(n) / SR
    fr = f * (1 + bend * (1 - np.exp(-t * 18)))
    ph = 2 * np.pi * np.cumsum(fr) / SR
    s = sum((0.62 ** k) * np.sin((k + 1) * ph) / (k + 1) ** 0.8 for k in range(7))
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
def drum(kind):
    if kind == "kick":   # big low war drum
        n = int(0.5 * SR); t = np.arange(n) / SR; f = 45 + 70 * np.exp(-t * 22)
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)).astype(np.float32)
    n = int(0.16 * SR); t = np.arange(n) / SR   # small rim/wood block
    s = np.sin(2 * np.pi * 820 * t) * np.exp(-t * 60) + rng.standard_normal(n) * np.exp(-t * 80) * 0.3
    return s.astype(np.float32)

T_TENSE, T_BACK = 48.85, 52.45   # music drops out on "An open gate means a trap" .. returns on "So he turns his army around"
DRUMS = [(14.0, 22.0), (44.4, 48.85)]  # war drums under the army and the ride-up
bar = 0; tt = 0.0; mel = rng.integers(0, 5, 64)
while tt < T_TENSE:
    root = ROOTS[bar % 4]
    place(music, pad([midi(root + 12), midi(root + 19)], beat * 4), tt, 0.05)
    for b in range(4):
        tb = tt + b * beat
        if tb >= T_TENSE: break
        place(music, pluck(midi(root - 12 + 12), 0.45, 0.35), tb, 0.30)
        if any(a <= tb < z for a, z in DRUMS): place(music, drum("kick"), tb, 0.7 if b % 2 == 0 else 0.45)
        else: place(music, drum("kick"), tb, 0.30) if b == 0 else place(music, drum("wood"), tb, 0.12)
        n1 = PENTA[(mel[(bar * 4 + b) % 64] + bar) % 7]
        place(music, zither(midi(n1), 0.7), tb + beat / 2, 0.16)
    bar += 1; tt += beat * 4
i0 = int((T_TENSE - 0.1) * SR); i1 = int(T_BACK * SR); music[i0:i1] *= np.linspace(1, 0, i1 - i0) ** 10
# tension: low drone + heartbeat drums
dn = int((T_BACK - T_TENSE) * SR); td = np.arange(dn) / SR
drone = lp_fast(((np.sin(2 * np.pi * 55 * td) + 0.5 * np.sin(2 * np.pi * 82.4 * td)) * np.minimum(1, td / 0.6) * np.minimum(1, (td[-1] - td) / 0.3).clip(0)).astype(np.float32), 600)
place(music, drone, T_TENSE, 0.12)
for k in range(5): place(music, drum("kick"), T_TENSE + 0.35 + k * 0.7, 0.35); place(music, drum("kick"), T_TENSE + 0.55 + k * 0.7, 0.2)
# release: solo zither melody over a warm pad to the end, last chord on "himself"
phrase = [69, 71, 74, 76, 74, 71, 69, 66, 69, 74, 78, 76, 74, 71, 74, 69]
tt = T_BACK; k = 0
while tt < DUR - 1.6:
    root = ROOTS[(k // 4) % 4]
    if k % 4 == 0: place(music, pad([midi(root + 12), midi(root + 16 if root in (50, 43) else root + 15), midi(root + 19)], beat * 4), tt, 0.06)
    place(music, zither(midi(phrase[k % 16]), 1.1, 0.02 if k % 4 == 3 else 0), tt, 0.2)
    if k % 2 == 0: place(music, pluck(midi(root), 0.6, 0.3), tt, 0.25)
    k += 1; tt += beat
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

place(sfx, creak(0.9, 110), F(42), 0.9)        # the gate swings open on "wide-open gate"
place(sfx, whoosh(0.6), F(70), 0.45)           # push through the gate
place(sfx, whoosh(0.4), F(93), 0.5)            # flash cut to the map
place(sfx, rustle(0.7), F(98), 0.5)            # map unrolled
place(sfx, thunk(70, 0.3), F(116), 0.6)        # "228 AD"
for k, f0 in enumerate([180, 190, 200]): place(sfx, thunk(90 + k * 15, 0.25), F(f0), 0.7)  # three kingdoms land
place(sfx, ting(), F(233), 0.4)                # "Zhuge Liang"
place(sfx, whoosh(0.5), F(404), 0.5)           # Shu flag drops
place(sfx, boing(), F(418), 0.6)               # Wei flag springs up
place(sfx, rumble(5.5), F(446), 0.5)           # 150,000 marching
place(sfx, brass([midi(38), midi(45)], 1.1), F(727), 0.35)  # "Sima Yi"
place(sfx, clang(), F(866), 0.45)              # cook's ladle on "cooks"
place(sfx, rustle(0.5), F(881), 0.5)           # clerk's scrolls on "clerks"
place(sfx, whinny(1.1), F(912), 0.5)           # nervous horse
place(sfx, ting(), F(955), 0.25); place(sfx, ting(), F(997), 0.25)  # can't fight / can't run
place(sfx, shimmer(1.7), F(1040), 0.6)         # the idea is coming
place(sfx, creak(1.0, 90), F(1114), 1.0)       # gates thrown open
for k in range(6): place(sfx, swish(0.3), F(1152 + k * 10), 0.35)  # sweeping
place(sfx, whoosh(0.8), F(1226), 0.5)          # crane up the gate
place(sfx, ting(), F(1300), 0.7)               # EUREKA sparkle on the zither
place(sfx, shimmer(1.0), F(1296), 0.35)
for k in range(10): place(sfx, hoof(), F(1325) + k * 0.23 + (k % 2) * 0.05, 0.5)  # Sima Yi rides up
for k in range(6): place(sfx, pop(), F([1484, 1489, 1494, 1498, 1503, 1507][k]), 0.4)  # imagined ambushers
place(sfx, sting(), F(1505), 0.8)              # "trap."
place(sfx, whoosh(0.6), F(1521), 0.4)          # cut back to Sima Yi
place(sfx, whoosh(0.9), F(1586), 0.5)          # the army turns around
place(sfx, rumble(3.5), F(1600), 0.4)          # marching away
place(sfx, thunk(60, 0.5), F(1811), 0.5)       # soft hit on "himself"
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
