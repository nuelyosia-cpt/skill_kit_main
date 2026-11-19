#!/usr/bin/env python3
"""Level-lock mixer for the cartoon shorts.

    python3 mix.py voice.mp3 music.wav sfx.wav [--out mix_raw.wav]

    python3 mix.py voice.mp3 music.wav sfx.wav --music-db -12 --sfx-db -8

Voice is untouched. Music is set to --music-db below the voice's gated RMS
(default -12 dB = 25 %: a calm bed that never competes with the narration).
SFX are set to --sfx-db below the voice (default -8 dB, measured over the frames
where the SFX are active), then capped so their peak never exceeds 0.7x the voice peak.
Only one linear gain per stem is applied, no ducking and no compression.
Writes 48 kHz stereo float WAV (mix_raw.wav) for finish.sh to loudness-normalise.
"""
import subprocess, sys, argparse
import numpy as np

SR = 48000
WIN = int(0.05 * SR)  # 50 ms frames for gated RMS


def load(path):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
        capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)


def frames_rms(x):
    mono = x.mean(axis=1)
    n = len(mono) // WIN
    f = mono[: n * WIN].reshape(n, WIN)
    return np.sqrt((f ** 2).mean(axis=1) + 1e-20)


def gated_rms(x, ref_peak=None, gate_db=-40.0):
    """RMS over frames above a gate (relative to the loudest frame)."""
    r = frames_rms(x)
    gate = r.max() * 10 ** (gate_db / 20)
    sel = r > gate
    if not sel.any():
        return 1e-9, sel
    return np.sqrt((r[sel] ** 2).mean()), sel


def db(v):
    return 20 * np.log10(max(v, 1e-12))


def fit(x, n):
    if len(x) >= n:
        return x[:n]
    return np.vstack([x, np.zeros((n - len(x), 2))])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("voice"); ap.add_argument("music"); ap.add_argument("sfx")
    ap.add_argument("--out", default="mix_raw.wav")
    ap.add_argument("--music-db", type=float, default=-12.0, help="music level vs voice (dB)")
    ap.add_argument("--sfx-db", type=float, default=-8.0, help="sfx level vs voice (dB), never above -6")
    a = ap.parse_args()

    v = load(a.voice)
    n = len(v)
    m = fit(load(a.music), n)
    s = fit(load(a.sfx), n)

    v_rms, v_sel = gated_rms(v)
    v_peak = np.abs(v).max()

    # music: gated RMS measured over the frames where the voice speaks
    r_m = frames_rms(m)
    k = min(len(v_sel), len(r_m))
    m_speech = np.sqrt((r_m[:k][v_sel[:k]] ** 2).mean()) if v_sel[:k].any() else gated_rms(m)[0]
    g_m = (10 ** (a.music_db / 20) * v_rms) / max(m_speech, 1e-12)

    # sfx: gated RMS over the frames where the sfx are active, then peak cap
    s_rms, _ = gated_rms(s, gate_db=-50.0)
    g_s = (10 ** (min(a.sfx_db, -6.0) / 20) * v_rms) / max(s_rms, 1e-12)
    s_peak = np.abs(s).max()
    cap = (0.7 * v_peak) / max(s_peak, 1e-12)
    capped = g_s > cap
    g_s = min(g_s, cap)

    mix = v + m * g_m + s * g_s
    peak = np.abs(mix).max()
    if peak > 0.98:  # single linear trim for headroom, same factor on everything
        mix *= 0.98 / peak

    out = (mix * 32767).clip(-32768, 32767).astype("<i2")
    import wave
    with wave.open(a.out, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(out.tobytes())

    m_after, _ = gated_rms(m * g_m)
    print(f"voice  gated RMS {db(v_rms):7.2f} dBFS   peak {db(v_peak):6.2f} dBFS")
    print(f"music  gain {g_m:.3f}   level vs voice {db(m_speech * g_m) - db(v_rms):+.2f} dB (target {a.music_db:+.1f})")
    print(f"sfx    gain {g_s:.3f}   level vs voice {db(s_rms * g_s) - db(v_rms):+.2f} dB (target {min(a.sfx_db, -6.0):+.1f})"
          f"{'   [peak-capped]' if capped else ''}   peak {db(s_peak * g_s):.2f} dBFS vs cap {db(0.7 * v_peak):.2f}")
    print(f"wrote {a.out}  ({n / SR:.2f} s)")


if __name__ == "__main__":
    main()
