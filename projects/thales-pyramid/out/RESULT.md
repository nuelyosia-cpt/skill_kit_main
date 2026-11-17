# Render result: The Shadow That Measured a Pyramid

- MP4: https://github.com/nuelyosia-cpt/skill_kit_main/releases/tag/thales-pyramid-r8
- length: 62.900000 s, size: 54254253 bytes
- run: https://github.com/nuelyosia-cpt/skill_kit_main/actions/runs/44060416872

## Mix and QA log

```
frames: 1887 of 1887
wrote music.wav + sfx.wav (62.90 s, 1887 frames). Next: python mix.py voice.mp3 music.wav sfx.wav
voice  gated RMS  -27.95 dBFS   peak  -8.87 dBFS
music  gain 0.250   level vs voice -6.02 dB (target -6.0)
sfx    gain 0.396   level vs voice -6.38 dB (target <= -6.0)   [peak-capped]   peak -11.97 dBFS vs cap -11.97
wrote mix_raw.wav  (62.90 s)
note: script has 181 words, words.json has 182; using words.json spelling
wrote ./work/captions.ass: 80 caption chunks, 182 words, 0.30-62.37 s
stream|width=1080|height=1920|r_frame_rate=30/1|
stream|r_frame_rate=0/0
format|duration=62.900000
--- QA (empty = no black/frozen spans)
    I:         -14.3 LUFS
captions: ON (182 events)
out/thales-pyramid.mp4
```
