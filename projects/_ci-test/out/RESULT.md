# Render result: CI self-test

- MP4: no release (release: no) - see the run artifacts
- length: 3.000000 s, size: 5089239 bytes
- run: https://github.com/nuelyosia-cpt/skill_kit_main/actions/runs/43971117993

## Mix and QA log

```
frames: 90 of 592
wrote music.wav + sfx.wav (19.73 s, 592 frames). Next: python mix.py voice.mp3 music.wav sfx.wav
voice  gated RMS  -28.88 dBFS   peak -21.18 dBFS
music  gain 0.216   level vs voice -6.02 dB (target -6.0)
sfx    gain 0.096   level vs voice -19.99 dB (target <= -6.0)   [peak-capped]   peak -24.28 dBFS vs cap -24.28
wrote mix_raw.wav  (19.73 s)
wrote ./work/captions.ass: 18 caption chunks, 40 words, 0.00-19.41 s
stream|width=1080|height=1920|r_frame_rate=30/1|
stream|r_frame_rate=0/0
format|duration=3.000000
--- QA (empty = no black/frozen spans)
    I:         -14.2 LUFS
captions: ON (40 events)
out/_ci-test.mp4
```
