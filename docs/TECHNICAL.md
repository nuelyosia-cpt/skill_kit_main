# Cartoon Shorts Kit: technical reference

For how to use the kit day to day, see the [main README](../README.md). This page covers the files, the commands and the cloud renderer.

Make vertical (1080x1920, 30 fps) animated YouTube Shorts about inventors, inventions and "eureka" moments, such as Newton's apple or Archimedes in the bath.

You record the voiceover. The kit makes the rest: flat 2D bean-head characters in a painted, ink-outlined 3D world (three.js rendered in headless Chromium, no GPU needed), a synthesized music bed and sound effects. The finished video is exactly as long as your voiceover, and your voice is never edited.

## Folder layout

| Path | What it is |
|---|---|
| [CLAUDE.md](../CLAUDE.md) | The automatic workflow Claude follows when you say "new video". |
| [SKILL.md](../SKILL.md) | The full skill: idea rules, script formula, shot planning, the look, motion, sound, render and QA. |
| [mix.py](../mix.py) | Level-lock mixer. Puts the music at exactly -6 dB under the voice and caps the SFX. Copied into every project. |
| [kit/](../kit/) | The original engine, tools and worked example. **Read-only: never edit it.** |
| [kit/engine/](../kit/engine/) | Renderer (`main.js`), painted textures (`paint.js`), character drawing (`roman.js`), motion helpers (`motion.js`). |
| [kit/tools/](../kit/tools/) | `setup.sh`, `timing.py`, `render.mjs`, `sheet.py`, `finish.sh`. |
| [kit/example/soldier/](../kit/example/soldier/) | Worked example "The Soldier Who Never Left": shot plan (`story.js`) and sound cues (`audio.py`). |
| [scripts/new-project.sh](../scripts/new-project.sh) | One command to create a project: runs `setup.sh`, adds `mix.py`, `finish.sh`, the stems-only `audio.py` and `render.txt`. |
| [scripts/prepare-project.sh](../scripts/prepare-project.sh) | Restores git-ignored generated files (three.js, `toon.js`, Playwright) after a clone. |
| [scripts/tts.py](../scripts/tts.py) | Makes `voice.mp3` from `script.txt` through the ElevenLabs API. |
| [scripts/cloud-setup.sh](../scripts/cloud-setup.sh) | Session-start hook for cloud sessions (does nothing on your PC). |
| [templates/audio.py](../templates/audio.py) | Music and SFX synths that write stems only. Length follows `voice.mp3`. |
| [.github/workflows/render.yml](../.github/workflows/render.yml) | The cloud renderer (GitHub Actions). |
| `ideas/` | Weekly idea lists and `USED.md`. |
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
# 1. Create a project (run from the root folder). This also installs Playwright in the project.
cd /c/Users/nuel.yosia/Downloads/skill_kit_main
bash scripts/new-project.sh my-short
cd projects/my-short

# 2. Once per computer: the Chromium browser for rendering
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
#    audio.py comes from templates/audio.py: rewrite its music and cue table, keep the synths.
python audio.py
python mix.py voice.mp3 music.wav sfx.wav

# 7. Render all frames (N = round(voice length in seconds x 30)). RESUME=1 continues after a stop.
node render.mjs frames "0-1799"

# 8. Encode, normalise loudness to -14 LUFS, and run QA
bash finish.sh "My Short"
#    Look at out/qa_sheet.jpg. Fix frozen spans of 0.4 s or more, and any black frames.
```

Rendering runs on the CPU at about 3-10 seconds per frame, so a 60-second short (1,800 frames) takes a few hours.

## Cloud renderer (GitHub Actions)

Pushing a change to `projects/<slug>/render.txt` starts [render.yml](../.github/workflows/render.yml). You can also start it by hand: Actions tab → render → Run workflow → slug.

`render.txt` options:

| Line | Meaning |
|---|---|
| `mode: stills` | Render only the frames in `stills:` and commit `stills/sheet_ci.jpg` back. Takes a few minutes. |
| `mode: full` | Render the whole video in parallel jobs, mix, encode, run QA, publish a Release with `<slug>.mp4`. |
| `title: ...` | The Release name. |
| `stills: 5,40,90` | Frames for the stills sheet. |
| `frames: 0-59` | Optional: render only this range (for tests). |
| `shards: 6` | Optional: how many parallel render jobs (1-20). |
| `release: no` | Optional: skip the Release (the MP4 is still a run artifact for 14 days). |

Every run commits `projects/<slug>/out/STATUS.md` back to the branch. A full run also commits `out/RESULT.md` (Release link, length, mix levels and QA log) and `out/qa_sheet.jpg`. That is how Claude reads the result: `git pull`.

Minutes: a 60 s video is about 1,800 frames. All jobs together use roughly 3-5 runner hours. Public repos have no minute limit; private repos get 2,000 free minutes a month.

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
| `setup.sh` stops at the type-strip step on Windows | Expected: it hands Git Bash paths to Node. `scripts/new-project.sh` finishes the job with `prepare-project.sh`. |
| A phrase is timed to the wrong pause | Fix the times in `work/phrases.json` by hand, or install `faster-whisper` and run `timing.py` again. |
| Music level is not -6.0 dB in the `mix.py` output | Run `mix.py` again on fresh stems. Do not adjust gains by hand. |
| `finish.sh` reports freeze or black spans | Add motion (idle, camera creep) or fix the shot in `story.js`, re-render those frames, and run `finish.sh` again. |

## Credits

Built on [mromidev/claude-animated-shorts](https://github.com/mromidev/claude-animated-shorts) (MIT): the `toon.ts` Pen library, look values and readability rules. Uses [three.js](https://github.com/mrdoob/three.js) r160 (MIT).
