# Render result: How Odysseus Brought Down a Giant

- MP4: https://github.com/nuelyosia-cpt/skill_kit_main/releases/tag/nobody-cyclops-r11
- length: 67.833333 s, size: 54244726 bytes
- run: https://github.com/nuelyosia-cpt/skill_kit_main/actions/runs/44370198297

## Mix and QA log

```
frames: 2035 of 2035
wrote music.wav + sfx.wav (67.83 s, 2035 frames). Next: python mix.py voice.mp3 music.wav sfx.wav
voice  gated RMS  -23.10 dBFS   peak  -5.74 dBFS
music  gain 0.395   level vs voice -6.02 dB (target -6.0)
sfx    gain 0.568   level vs voice -8.50 dB (target <= -6.0)   [peak-capped]   peak -8.83 dBFS vs cap -8.83
wrote mix_raw.wav  (67.85 s)
wrote ./work/captions.ass: 89 caption chunks, 200 words, 0.00-67.64 s
stream|width=1080|height=1920|r_frame_rate=30/1|
stream|r_frame_rate=0/0
format|duration=67.833333
--- QA (empty = no black/frozen spans)
    I:         -14.0 LUFS
captions: ON (200 events)
out/nobody-cyclops.mp4
```
