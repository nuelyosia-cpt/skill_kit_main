# Cartoon shorts: automatic workflow

You are making vertical (1080x1920, 30 fps) animated YouTube Shorts about inventors, inventions and "eureka" discovery stories.

## Fixed locations (Windows; use Git Bash for .sh files; use `python` if `python3` fails)
Root folder (this folder, open it in VS Code): `C:\Users\nuel.yosia\Downloads\skill_kit_main`  (Git Bash: `/c/Users/nuel.yosia/Downloads/skill_kit_main`)

- `SKILL.md`: the full skill with all rules and stage details. READ IT AT THE START OF EVERY NEW VIDEO and follow it.
- `mix.py`: the level-lock mixer. Copy it into every project.
- `kit/`: the original cartoon-short kit (engine, tools, example). Read-only: never edit it. Its `tools/finish.sh` must be copied into every project, because `setup.sh` does not copy it.
- `projects/<slug>/`: one working folder per video, created by `kit/tools/setup.sh`. All building happens here.
- **Finished videos go here: `C:\Users\nuel.yosia\Downloads\shorts`** (Git Bash: `/c/Users/nuel.yosia/Downloads/shorts`). Only final MP4s are placed in this folder, nothing else.

## When the user says "new video" (or gives a topic)
Do all of this yourself. Ask the user only at the two points marked USER.

1. **Ideas.** Follow SKILL.md stage 2. Web-search every idea's key facts first. Give exactly 10 numbered ideas with title, hook, eureka, twist, why it animates, and fact status (documented / anecdote / legend). Mark your single best pick as "Recommended". Use AskUserQuestion if available.
   **USER: picks a number.**
2. **Script.** Follow SKILL.md stage 3. Target about 60 s: 200-215 words at the user's ElevenLabs voice (about 3.3 words per second). Say "supposedly" / "the story goes" for anything that is not documented. Create `projects/<slug>/script.txt`, show the script in chat with the word count.
3. **Voiceover.** Tell the user to record it in ElevenLabs (no music, read exactly) and save the mp3 as `projects/<slug>/voice.mp3`.
   **USER: supplies voice.mp3.** (If the environment variable ELEVENLABS_API_KEY is set, you may generate it through the ElevenLabs API instead. Never ask for the key in chat.)
4. **Setup.** Run `bash kit/tools/setup.sh projects/<slug>` from the root folder. Copy `mix.py` and `kit/tools/finish.sh` into the project. In the project run `npm install playwright` and `npx playwright install chromium` if not already done.
5. **Timing and plan.** Run `timing.py voice.mp3 script.txt --out work`, then write `work/PLAN.md` (SKILL.md stage 4.2).
6. **Build.** Write `web/story.js`, the world in `web/main.js`, outfits in `web/roman.js` (then rebuild `toon.js`), and `audio.py` (SKILL.md stages 4.3 to 4.7). Reuse cast and sets from earlier projects in `projects/` when useful. Render stills and a contact sheet, LOOK at it, and fix problems (stage 4.6). Do not wait for approval unless something is badly broken.
7. **Render and finish.** Run `mix.py` (music must read -6.0 dB vs voice), render all frames in the background with progress checks, then run `finish.sh`. Look at `out/qa_sheet.jpg` and fix frozen or black spans.
8. **Deliver.** Copy the final MP4 from `projects/<slug>/out/` into `C:\Users\nuel.yosia\Downloads\shorts` (name it `<slug>.mp4`). Verify the copy exists and has the same size. Tell the user the full path, the length, and one line per shot. Suggest the next idea from the list.

## Rules
- Never edit or re-time the voice. The picture follows it.
- Facts first. Never present a legend as fact. Dead historical people only as characters; nothing graphic or political.
- No captions unless asked. Diegetic text must not be mirrored.
- Never change files in `kit/`.
- Use a task list and keep progress updates short.
