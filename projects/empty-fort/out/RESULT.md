# Render result: The Empty Fort: Zhuge Liang's Open-Gate Bluff

- MP4: https://github.com/nuelyosia-cpt/skill_kit_main/releases/tag/empty-fort-r4
- length: 61.000000 s, size: 66714469 bytes
- run: https://github.com/nuelyosia-cpt/skill_kit_main/actions/runs/43978181870

## Mix and QA log

```
frames: 1830 of 1830
wrote music.wav + sfx.wav (61.00 s, 1830 frames). Next: python mix.py voice.mp3 music.wav sfx.wav
voice  gated RMS  -26.22 dBFS   peak  -5.86 dBFS
music  gain 0.309   level vs voice -6.02 dB (target -6.0)
sfx    gain 0.560   level vs voice -7.28 dB (target <= -6.0)   [peak-capped]   peak -8.96 dBFS vs cap -8.96
wrote mix_raw.wav  (61.00 s)
wrote ./work/captions.ass: 77 caption chunks, 177 words, 0.00-60.66 s
stream|width=1080|height=1920|r_frame_rate=30/1|
stream|r_frame_rate=0/0
format|duration=61.000000
--- QA (empty = no black/frozen spans)
    I:         -14.5 LUFS
captions: ON (177 events)
out/empty-fort.mp4
```
