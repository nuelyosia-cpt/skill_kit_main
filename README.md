# Cartoon Shorts Kit

Make vertical (1080x1920, 30 fps) animated YouTube Shorts about inventors, inventions and "eureka" moments, such as Newton's apple or Archimedes in the bath.

You record the voiceover. The kit makes the rest: flat 2D bean-head characters in a painted, ink-outlined 3D world (three.js rendered in headless Chromium, no GPU needed), a synthesized music bed and sound effects. The finished video is exactly as long as your voiceover, and your voice is never edited.

## Quick start (with Claude Code)

1. Open this folder in VS Code with Claude Code.
2. Say **"new video"**, or give a topic (for example "new video about the microwave oven").
3. Claude fact-checks and offers 10 ideas. **Pick a number.**
4. Claude writes a script of about 60 seconds (200-215 words) and saves it as `projects/<slug>/script.txt`.
5. Record the script in ElevenLabs. Read it exactly, with no music. Save it as `projects/<slug>/voice.mp3`.
6. Claude builds, renders, mixes and checks the video, then copies it to `C:\Users\nuel.yosia\Downloads\shorts\<slug>.mp4`.

You only make decisions at steps 3 and 5. [CLAUDE.md](CLAUDE.md) holds the full automatic workflow and [SKILL.md](SKILL.md) holds every stage rule.

## Folder layout

| Path | What it is |
|---|---|
| [CLAUDE.md](CLAUDE.md) | The automatic workflow Claude follows when you say "new video". |
| [SKILL.md](SKILL.md) | The full skill: idea rules, script formula, shot planning, the look, motion, sound, render and QA. |
| [mix.py](mix.py) | Level-lock mixer. Puts the music at exactly -6 dB under the voice and caps the SFX. Copied into every project. |
| [kit/](kit/) | The original engine, tools and worked example. **Read-only: never edit it.** |
| [kit/engine/](kit/engine/) | Renderer (`main.js`), painted textures (`paint.js`), character drawing (`roman.js`), motion helpers (`motion.js`). |
| [kit/tools/](kit/tools/) | `setup.sh`, `timing.py`, `render.mjs`, `sheet.py`, `finish.sh`. |
| [kit/example/soldier/](kit/example/soldier/) | Worked example "The Soldier Who Never Left": shot plan (`story.js`) and sound cues (`audio.py`). |
| `projects/<slug>/` | One working folder per video. All building happens here. |
| `*.zip` | Original downloads of the kit. Not used by the workflow. |

Finished MP4s go to `C:\Users\nuel.yosia\Downloads\shorts`. That folder holds final videos only.

## Requirements

- Windows with **Git Bash** to run the `.sh` scripts.
- **Node.js 22.6 or newer**, which `setup.sh` needs to strip TypeScript types.
- **Python 3** with `numpy` and `Pillow` (`pip install numpy pillow`). If `python3` fails, use `python`.
- **ffmpeg** and **ffprobe** on your PATH.
- **Playwright with Chromium**, installed in each project (see step 2 below).
- Optional: `faster-whisper` or `openai-whisper` for more exact word timings. Without them, `timing.py` lines the script up against the pauses in the audio.

## Manual pipeline

Use this if you want to run the steps yourself. Run the commands in Git Bash.

```bash
# 1. Create a project (run from the root folder)
cd /c/Users/nuel.yosia/Downloads/skill_kit_main
bash kit/tools/setup.sh projects/my-short
cp mix.py kit/tools/finish.sh projects/my-short/
cd projects/my-short

# 2. Install the renderer (once per project)
npm install playwright
npx playwright install chromium

# 3. Add script.txt and voice.mp3, then get word timings
python timing.py voice.mp3 script.txt --out work
#    Check work/phrases.json: pauses should fall at sentence ends.

# 4. Write work/PLAN.md, then edit:
#    web/story.js   shots, cameras, actors, effects (pure functions of the frame number)
#    web/main.js    the world, between "// ---------- world ----------" and "// ---------- cards ----------"
#    web/roman.js   outfits and poses; after editing, rebuild toon.js:
cat web/toonbase.js web/roman.js > web/toon.js

# 5. Look check: render a few stills and a contact sheet, then look at it
node render.mjs stills/a "5,40,90,150"
python sheet.py stills/a stills/sheet_a.jpg

# 6. Sound: write the stems, then mix (music must read -6.0 dB vs voice)
#    The audio.py copied from the example ends by ducking and mixing into mix_raw.wav itself.
#    Replace that ending so it only writes music.wav and sfx.wav, then let mix.py do the mix.
python audio.py
python mix.py voice.mp3 music.wav sfx.wav

# 7. Render all frames (N = round(voice length in seconds x 30)). RESUME=1 continues after a stop.
node render.mjs frames "0-1799"

# 8. Encode, normalise loudness to -14 LUFS, and run QA
bash finish.sh "My Short"
#    Look at out/qa_sheet.jpg. Fix frozen spans of 0.4 s or more, and any black frames.
```

Rendering runs on the CPU at about 3-10 seconds per frame, so a 60-second short (1,800 frames) takes a few hours.

## House rules

- **Never edit or re-time the voice.** The picture follows the voice.
- **Facts first.** Every story is labelled *documented*, *anecdote* or *legend*. Narration says "the story goes" for anything that is not documented.
- Only dead historical people appear as characters. Nothing graphic or political.
- No captions unless asked. Text inside the scene (signs, chalk diagrams, notebooks) must not be mirrored.
- Always mix with `mix.py`, never by hand.
- Never change files in `kit/`.

## Troubleshooting

| Problem | Fix |
|---|---|
| `python3: command not found` | Use `python` instead. |
| `setup.sh` fails to strip types | Update Node to 22.6 or newer (`node -v`). |
| `render.mjs` cannot find Playwright | Run `npm install playwright` and `npx playwright install chromium` in the project folder. |
| A phrase is timed to the wrong pause | Fix the times in `work/phrases.json` by hand, or install `faster-whisper` and run `timing.py` again. |
| Music level is not -6.0 dB in the `mix.py` output | Run `mix.py` again on fresh stems. Do not adjust gains by hand. |
| `finish.sh` reports freeze or black spans | Add motion (idle, camera creep) or fix the shot in `story.js`, re-render those frames, and run `finish.sh` again. |

## Credits

Built on [mromidev/claude-animated-shorts](https://github.com/mromidev/claude-animated-shorts) (MIT): the `toon.ts` Pen library, look values and readability rules. Uses [three.js](https://github.com/mrdoob/three.js) r160 (MIT).
