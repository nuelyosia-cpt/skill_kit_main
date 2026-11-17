# Cartoon shorts: automatic workflow

You are making vertical (1080x1920, 30 fps) animated YouTube Shorts about three themes: inventions and inventors, "big brain" moments (a genius idea and how it was executed: real, viral or from a famous story/myth), and famous characters' turning points. See the channel concept in SKILL.md.

## Which mode am I in?
- **Cloud mode**: the environment variable `CLAUDE_CODE_REMOTE` is `true` (Claude Code on the web or the phone app, or a scheduled routine). The repo is at `$CLAUDE_PROJECT_DIR`. Rendering happens in GitHub Actions, not in the session. Use `python3`.
- **Local mode**: anything else (the user's Windows PC in VS Code). Root folder: `C:\Users\nuel.yosia\Downloads\skill_kit_main` (Git Bash: `/c/Users/nuel.yosia/Downloads/skill_kit_main`). Use Git Bash for `.sh` files and `python` (the `python3` command is a Windows Store stub).

## Fixed locations
- `SKILL.md`: the full skill with all rules and stage details. READ IT AT THE START OF EVERY NEW VIDEO and follow it.
- `kit/`: the original kit (engine, tools, example). Read-only: never edit it.
- `scripts/new-project.sh <slug>`: creates `projects/<slug>/` with everything (engine, tools, `mix.py`, `finish.sh`, the stems-only `audio.py` template, `render.txt`). Use this instead of calling `kit/tools/setup.sh` directly.
- `scripts/prepare-project.sh projects/<slug>`: restores the git-ignored generated files (three.js, `toon.js`, Playwright). Run it after a fresh clone.
- `scripts/tts.py projects/<slug>`: makes `voice.mp3` from `script.txt` with ElevenLabs when `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` are set.
- `templates/finish.sh` + `scripts/captions.py` + `assets/fonts/`: the encode step with burned-in captions (copied into each project by `new-project.sh`).
- `templates/audio.py`: synths + cue table that writes only `music.wav` and `sfx.wav`. Never use the kit example's `audio.py`, which ducks and mixes by itself.
- `ideas/YYYY-MM-DD.md`: idea lists (written by the weekly routine or by you). `ideas/USED.md`: one line per idea already made.
- `projects/<slug>/`: one working folder per video.
- `.github/workflows/render.yml`: the cloud renderer, started by pushing `projects/<slug>/render.txt`.
- Local only: **finished videos go to `C:\Users\nuel.yosia\Downloads\shorts`** (Git Bash: `/c/Users/nuel.yosia/Downloads/shorts`). Only final MP4s go there.

## When the user says "ideas"
Show the newest `ideas/*.md` list (numbered, with the Recommended pick), skipping anything in `ideas/USED.md`. If there is no list from the last 7 days, make a new one (step 1 below) and save it.

## When the user says "new video" (or gives a topic, or picks an idea number)
Do all of this yourself. Ask the user only at the two points marked USER.

1. **Ideas.** Follow SKILL.md stage 2. Web-search every idea's key facts first. Give exactly 10 numbered ideas mixing the three themes (about 4 inventions, 3 big brain moments, 3 turning points unless the user asks for one theme), each with theme, title, hook, eureka / turning point, ending (twist, moral or engagement; SKILL.md stage 2), why it animates, and fact status (documented / anecdote / legend). Mark your single best pick as "Recommended". Save them as `ideas/<today>.md`. Use AskUserQuestion if available. Skip this step if the user already picked from a saved list.
   **USER: picks a number** (or gives their own topic).
2. **Script.** Follow SKILL.md stage 3. Target about 60 s: 200-215 words at the user's ElevenLabs voice (about 3.3 words per second). Say "supposedly" / "the story goes" for anything that is not documented. Run `bash scripts/new-project.sh <slug>`, save `projects/<slug>/script.txt`, add the idea to `ideas/USED.md`, show the script in chat with the word count. In cloud mode commit and push now, so the script is safe.
3. **Voiceover.**
   - If `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` are set: run `python3 scripts/tts.py projects/<slug>` and tell the user the voice is done (length in seconds). No upload needed.
   - Otherwise tell the user to record it in ElevenLabs (no music, read exactly) and either upload `voice.mp3` here, or (from a phone) open the repo on github.com → `projects/<slug>/` → Add file → Upload files, commit to the branch you name, and then say "voice uploaded". In cloud mode, `git pull` to get it.
   **USER: supplies voice.mp3.** Never ask for the API key in chat.
4. **Timing and plan.** In the project run `timing.py voice.mp3 script.txt --out work`, then write `work/PLAN.md` (SKILL.md stage 4.2). Set `TOTAL` in `web/story.js` to round(voice seconds × 30).
5. **Build.** Write `web/story.js`, the world in `web/main.js`, outfits in `web/roman.js` (then `cat web/toonbase.js web/roman.js > web/toon.js`), and the cue table in `audio.py` (SKILL.md stages 4.3 to 4.7). Reuse cast and sets from earlier projects in `projects/` when useful.
6. **Look check (SKILL.md 4.6).** Render stills and a contact sheet and LOOK at it, then fix problems. Do not wait for approval unless something is badly broken.
   - Local, or cloud when Chromium works: `node render.mjs stills/a "<frames>"` then `python sheet.py stills/a stills/sheet_a.jpg`.
   - Cloud when Chromium is missing: set `mode: stills` and `stills: <frames>` in `render.txt`, commit, push, then wait for `projects/<slug>/stills/sheet_ci.jpg` (poll with `git pull` about every 2 minutes; `out/STATUS.md` says if it failed).
7. **Render and finish.**
   - **Local:** run `python mix.py voice.mp3 music.wav sfx.wav` after `python audio.py` (music must read -6.0 dB vs voice), render all frames in the background with progress checks, then `bash finish.sh "<slug>"`. Look at `out/qa_sheet.jpg` and fix frozen or black spans.
   - **Cloud:** run `audio.py` and `mix.py` once to check the levels (music -6.0 dB), then set `render.txt` to `mode: full` with the real `title:`, commit and push. GitHub Actions renders, mixes, encodes and publishes a Release. Tell the user it has started and roughly how long it takes (about 1-2 hours for 60 s). If the session is still open, poll `git pull` every 5-10 minutes for `out/RESULT.md` (success) or `out/STATUS.md` with FAILED. Then look at `out/qa_sheet.jpg`; if there are frozen or black spans, fix and push `render.txt` again.
8. **Deliver.**
   - **Local:** copy `projects/<slug>/out/<slug>.mp4` into `C:\Users\nuel.yosia\Downloads\shorts` as `<slug>.mp4`. Verify the copy exists and has the same size. Tell the user the full path.
   - **Cloud:** give the Release link from `out/RESULT.md` (the MP4 downloads from there on a phone).
   - Both: give the length and one line per shot, then write `projects/<slug>/youtube.md` with 5 title options and a copy-paste description (SKILL.md 4.10) and show it in chat. Suggest the next idea from the list.

## Git in cloud mode
- Commit code, `script.txt`, `voice.mp3`, `work/`, `render.txt` and small sheets. Never commit `frames/`, stills folders, WAV files or MP4s (`.gitignore` covers them).
- Push to the branch the session is on. The render workflow runs on any branch and commits its results back to the same branch, so always `git pull --rebase` before pushing.
- Re-render: change anything in `render.txt` (e.g. the title or a comment line) and push.

## Rules
- Never edit or re-time the voice. The picture follows it.
- Facts first. Never present a legend as fact. Dead historical people only as characters; nothing graphic or political.
- Captions are always on: `finish.sh` burns them in from `work/words.json` (SKILL.md 4.9). Keep faces and key objects out of the caption band (y ≈ 1180-1420 px). Diegetic text must not be mirrored.
- Never change files in `kit/`.
- Mix only with `mix.py`.
- Use a task list and keep progress updates short.
