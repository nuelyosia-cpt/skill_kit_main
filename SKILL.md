---
name: cartoon-audio-short
description: Make a vertical animated cartoon short about an inventor, an invention, or a "eureka" discovery moment (Newton's apple, Archimedes in the bath, Newton inventing calculus). Offers 10 fact-checked ideas, writes the script, then turns the user's voiceover into a finished MP4 with music and SFX at half the voice level. Use for any inventor/invention story video, cartoon short, or animated story video request.
---

# Cartoon short: inventor idea → script → voiceover → finished MP4

The look: flat 2D bean-head cartoon characters (canvas-drawn "cards" with plum outlines) in a colourful 3D world with black ink outlines, painted textures, depth-of-field and gliding cameras. The output is 1080x1920, 30 fps, exactly as long as the voiceover. The user's voice is unchanged. The music bed and SFX are synthesized and sit at **50 % of the voice level**. Proven on "The Soldier Who Never Left" (19.7 s, 8 shots).

## Channel concept (read this first)
Every video is about **how an invention or discovery came to be**: the problem, the struggle, and the "eureka" moment, told as one surprising story. Examples of the kind of story wanted:
- Newton and the falling apple that led to gravity.
- Newton inventing calculus (fluxions / the integral) on his own during the plague years.
- Archimedes shouting "Eureka!" after the bath-water insight.
Secondary theme, allowed when it fits: how an infamous object or person came to be (a famous hoax, a notorious machine, a legendary blunder), still told as an origin story.

## Rules
- Stories, characters and shots are always original (our own drawings, our own words), but the subject is a real inventor, discovery or invention.
- **Facts first.** Every story must be a real fact or a clearly labelled legend. Make it interesting by adding surrounding background that is also true: the era, the rival, the failed attempts, the odd detail, the consequence.
- **Fact-status honesty.** Many famous eureka moments are anecdotes, not documented events. Always say which kind it is, in the idea list and in the script when relevant: *documented* (primary sources, the inventor's own notes), *anecdote* (told by a contemporary or the inventor late in life), or *legend* (unverifiable or probably embellished). Use "the story goes" / "legend says" in the narration for anything that is not documented. Never present a legend as settled fact. A myth-vs-reality twist (e.g. "the apple never hit his head") is one great way to end, but not the only one (see the ending types in Stage 3).
- Real historical figures who are dead are fine as characters. No living people as the butt of a joke, nothing graphic, nothing political. Keep rivalries (e.g. Newton vs Leibniz) factual and even-handed.
- **Captions are always on.** Every video has burned-in captions that follow the voice word by word (see 4.9). They use the exact script text and the timing in `work/words.json`; never retype or paraphrase them. Diegetic text (a carved message, a sign, a chalk diagram, a notebook page) is also fine, and it must read correctly (not mirrored).
- Never edit or re-time the voice. The picture is timed to it, and every visual reaction lands 0-3 frames before its word.
- **Audio levels:** the music bed sits at 50 % of the voice level (−6 dB, gated RMS). SFX sit at 50 % or slightly less, with peaks capped so no hit pokes out over the narration. Always mix with `mix.py`, never by hand. Use no ducking or compression that would change this ratio; only one linear gain plus a peak limiter goes on the whole mix.
- Keep the user informed with a task list. Send a stills contact sheet before the long render.

## Stage 1: Intake (always first)
If an audio file is already attached, skip to Stage 4. If a script was also given, use it for the timing.
Otherwise ask one AskUserQuestion (or plain text if that tool is missing): **"Where are you starting from?"**
- **Voiceover ready**: ask them to upload it, plus the script text if they have it (the script makes the timing exact). Go to Stage 4 when it arrives.
- **I have a script, need the voiceover**: tighten the script per Stage 3 if needed, give it back with recording tips, ask for the upload, then go to Stage 4.
- **Need video ideas and a script**: go to Stage 2.
Also ask the target length if they haven't said. The default is **about 60 s** (45-60 s); 20-30 s is allowed for simple single-moment stories.

## Stage 2: 10 inventor / invention ideas
Give exactly 10 ideas in one reply, numbered, and ask the user to reply with a number (or "more"). The focus is **how the invention or discovery was come up with**. Each idea gets:
- **Title** (5-8 words, curiosity-driven, e.g. "The Apple That Never Hit Newton").
- **Hook line**: the first spoken sentence, a paradox or surprising claim stated as fact ("Isaac Newton invented calculus while hiding from a plague.").
- **The eureka**: the exact moment or insight, in one line.
- **The ending**: the last beat of the video, and say which type it is. It does **not** have to be a plot twist. Pick whichever fits the story best:
  - *Twist*: an ironic or surprising reveal (the consequence nobody expected, the rivalry, the myth-vs-reality reveal).
  - *Moral*: a short lesson or value the story shows ("Sometimes the best defense is letting your enemy scare himself.").
  - *Engagement*: a closing line that emphasizes the idea or the person and leaves the viewer impressed or curious (what it changed, why it still matters, a question back to the viewer).
- **Why it animates well**: the 2-3 big visual moments (the apple drop, the overflowing bath, equations appearing in the air).
- **Fact status**: *documented*, *anecdote* or *legend*, with one line saying where the story comes from.

What makes an idea "perfect" for this format:
- One inventor, one problem, one breakthrough, with a physical cause and effect you can show.
- Escalating struggle: failed attempts, doubters, obsession, a deadline or a rival, then the insight.
- A setting that can be built from simple 3D shapes plus cartoon cards (a garden, a bathhouse, a workshop, a lab, a study, a ship, a bridge, a palace).
- Mix the 10 across eras and fields: ancient, medieval, 1700s, 1800s, modern; physics, maths, medicine, engineering, everyday objects, accidents that became inventions. Include at most two ideas per inventor and keep at least two that are **not** physics or maths.
- Include a few abstract-idea stories (like calculus) only if there is a concrete visual way to show them: a falling object, a curve being sliced into strips, a moving cart, shapes stacking up. If it can't be shown, pick another.
- **Verify before offering.** Run a web search on the key facts of every idea (dates, places, names, who said what, where the anecdote first appears) before including it. Prefer primary or scholarly sources (museum and university pages, the inventor's own papers, encyclopaedias). Drop or relabel anything you can't confirm.
- No real living people as the butt of a joke, nothing graphic and nothing political.

## Stage 3: Script (after they pick)
Write the narration only (no stage directions in the spoken text), sized at about 3.7 words/s: 20 s ≈ 75 words, 30 s ≈ 110, 45 s ≈ 165, 60 s ≈ 220. Formula:
1. **Hook** (sentence 1, no setup): the surprising fact about the invention or inventor.
2. **Setting** in 1-2 lines: when, where, who, a concrete detail (the year, the place, what they were doing instead).
3. **The problem and the struggle**, 2-3 beats, each bigger: what nobody could explain or build, failed attempts, doubters, obsession. Use one exaggeration joke.
4. **The eureka** ("But then..." / "Then, one day..."): the moment of insight, with the real mechanism explained through an everyday analogy. Label it "the story goes" if it is an anecdote.
5. **Ending**: one or two short lines, and the last words of the video. Use one of the three ending types from Stage 2: a *twist* (what it changed, the rival who disputed it, the myth-vs-reality reveal), a *moral* (the lesson or value the story shows), or an *engagement* line (emphasizes the idea or the person, why it still matters, or a question to the viewer). A twist is optional: when the story already ends on a strong moment, a moral or an engagement line is often better than forcing a reveal. Whatever the type, keep the fact rules: a legend stays labelled as a legend.
Use plain spoken English, contractions, sentences around 8-15 words, and numbers written as words. Never describe what the viewer already sees. Explain a concept in one clear picture, not three.

Then reply with:
- The script in a copyable block, with the word count and estimated length.
- A short **fact note**: the sources you checked, and which lines are documented vs anecdote vs legend.
- A one-paragraph visual plan (the shots you'll animate), including how the eureka moment is staged (see 4.2).
- Recording tips: one steady, warm narrator voice; ElevenLabs works well (a deep narrator voice, speed about 1.05-1.1, stability about 45-55 %). Mp3 or wav is fine. Leave natural pauses at sentence ends. Export without music.
- The ask: **"Upload the voiceover when it's ready and I'll make the full video."**
Keep the final script text. It drives the timing in Stage 4, so no speech recognition is needed. If they recorded a changed version, ask for the final text.

## Stage 4: Build the video (after the voiceover is uploaded)
Do everything from here without stopping. Ask only if the timing cannot be resolved.

### 4.0 Get the kit
The code kit ships **inside this skill folder** at `kit/` (engine, tools, worked example, plus vendored three.js r160 and the `toon.ts` Pen library from github.com/mromidev/claude-animated-shorts, both MIT). Locate the folder with `find / -name SKILL.md -path "*cartoon-audio-short*" 2>/dev/null` and treat its `kit/` as read-only.

Then run `bash <skill>/kit/tools/setup.sh ~/shorts/<slug>`. It copies the engine and tools into the project, installs the vendored three.js, strips the types from `toon.ts` with Node 22 `module.stripTypeScriptTypes`, and links Playwright. No network is needed. If the vendored files are missing, it falls back to npm or a git clone.
- Requirements: Node 22.6+, Python 3 with numpy + Pillow, ffmpeg, and Playwright with Chromium (`npm i -g playwright && npx playwright install chromium` if missing).
- If package registries are blocked, git over GitHub usually works. Never disable TLS or route around the proxy.
- Chromium: use the pre-installed Playwright browser with `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`. That gives CPU WebGL at about 3-10 s per frame.

### 4.1 Timing
Run `python3 timing.py voice.mp3 script.txt --out work`.
- With whisper or faster-whisper installed, it uses word timestamps.
- Otherwise it aligns script phrases (split at punctuation) to silence-detected speech segments, with a DP that matches syllables to duration and penalises sentence ends inside a segment and long gaps inside a phrase.
- With no ASR and no script, ask for the script. Claude cannot hear audio.
- Check `work/phrases.json`: pauses should fall at sentence ends. Total frames = round(duration × 30).

### 4.2 Shot plan (`work/PLAN.md` before code)
Make one row per shot: frames, words, setting, light, camera move, characters/poses/expressions, effects and SFX cue.
- Frame 0 is already the hook image.
- Usually one shot per phrase. Merge tiny phrases into the next shot.
- Illustrate every sentence literally. Props carry the jokes.
- Vary shot sizes: hook MCU → wide reveal → two-shot → insert close-up on the key object → reaction close-up → environment move for the payoff.
- Use light for beats: day for normal, golden for decline or drama, night-blue for explanation or deep thought. A time jump gets a 6-frame white flash.
- **Stage the eureka moment as the centre of the video.** Build to it with a slow push-in on the inventor's face, then a 2-3 frame freeze/hold, a bright ping (glow or star burst effect card), the key object doing its thing (apple dropping, water spilling over the tub, numbers or curves drawing themselves), a quick reaction close-up, then a wide release. Sting + a rising SFX on the realisation.
- **Show the idea as a picture.** Use diegetic cards for the insight: a chalk or ink diagram, a notebook page, a curve cut into strips, orbits around a planet. Draw them correctly (not mirrored) and animate them appearing (0..1 progress).
- The ending shot matches the ending type. **Twist**: show the consequence or the myth being corrected; the twist line gets a sting (music stops, low hit, push-in with roll). **Moral**: a calm hero shot of the person (warm or golden light, a small gesture like a smile, nod or wink on the key word), then a release to a wide that shows the whole story place. **Engagement**: show the idea or invention at its biggest (the thing it became, the person with their creation, the world it changed). The last shot's physical payoff lands on the final word.
- **Keep the caption band clear.** Captions sit centred at y ≈ 1300 px (68 % of the height), about 1180-1420 px. Frame faces, eyes, the key object and diagram cards in the upper 60 % of the picture (y < 1150), so the caption never covers them. Busy, bright detail right behind the band makes captions harder to read: prefer ground, deck, water or a darker area there.

### 4.3 World (`web/main.js`)
Keep the engine sections: toon materials, ink contract, `add`/`tbox`, sky, lights, cards, render targets/post, `applyLight`, `drawActors`, `swapForNd`, `renderFrame`. Replace the example world between `// ---------- world ----------` and `// ---------- cards ----------`, plus the story parts of `worldState()`.
- Build from primitives with painted canvas textures (`paint.js`: planks, beams, rotten wood, stone, moss/ivy, grass, dirt, plaster, roof tiles, marble, banners, carved text). Write new painters in the same flat-with-dark-seams style (e.g. orchard grass and bark, tub tiles and water, parchment, chalkboard, workshop benches).
- Use `tbox` for constant texel density, a 2-step toon gradient, and fog = horizon colour.
- Background: hills (half-buried spheres), mountains (cones + snow caps), cypress/pine trees, distant houses, painted cloud billboards.
- Set pieces (collapses, falls, doors, water spills, dropping fruit) are pivoted groups driven by 0..1 progress from `worldAt(f)`, with eased and staggered parts.
- Curved diegetic text uses planar UVs. Check it isn't mirrored.

### 4.4 Cast (`web/roman.js` → `web/toon.js`)
- `romanFront(p, outfitKey, opts)` draws on a 600x1000 design canvas with soles at y=975. The card is 2.25 m tall, so 1 unit = 0.00225 m.
- Add outfits to `OUTFITS` (tunic/cape/armor/helmet/hair/cap/beard/apron/dress/toga) and new headgear and props in the same style. For inventor stories add period looks as needed: toga/towel for Archimedes, 17th-century coat and long wig or hair for Newton, apron and goggles for workshop inventors.
- Arm poses: hang, spear, point, up, wave, hip, belly, temple (+swirl), lift, reach (+lift), cheek, shield, cross, thumb.
- Expressions: the toon.ts FACE set plus snore, stubborn, squint. Extend FACE for more (e.g. **eureka**: wide eyes, open mouth; **ponder**: squint + brow raise).
- Rebuild after edits with `cat web/toonbase.js web/roman.js > web/toon.js`. Render a character test sheet before using new designs.
- Billboards turn on yaw only, get a contact blob and an alpha-tested shadow, and are never inked by the world pass.
- Build card keys from `q()`-rounded values (so the canvas redraws only on visible change).
- A detached part (e.g. a lifted helmet) is its own card, aligned with `headCenter(seed)`: y = DECK + (partY − hc) × 0.00225.

### 4.5 Motion: smooth and alive (`web/motion.js`)
- **Cameras**: `camFromKeys(keys, f, {kicks})`. Use smootherstep glides (18-45 f), `easeOut` for reveals and whips, and `path` via-points (Catmull-Rom) for curved moves. Every hold creeps and nothing is static for 4+ frames. Use 3-5° rolls on drama and 7-frame flip-shakes on impacts.
- **Continuity**: prefer continuous moves (pull back from a close-up into the wide, rack focus, crane through the deck, push into an object). Hard cut only on place or time jumps, with a flash.
- **Characters never freeze**: apply `idle(f, seed)` to every card, `blinkAt` blinks, and head bobs on stressed words. (The deliberate eureka hold is the only exception, and only for 2-3 frames.)
- **Actions**: anticipation → `back` overshoot → `spring` settle. A stamp is a 2-frame dip + dust puff + kick. Laughs are an alternating tilt + bob.
- **Secondary motion**: banner cloth waves, leaves/dust/drips/Zzz effect cards, flowing water. Something always moves.
- **Walks**: `walk()` gives distance + step phase. Feet planted, bob 3-7 %.
- **Lens**: DOF on close-ups and mediums (cInf 8-14 px), focus on the eyes. Wides are sharp. Racks take ~14 f.

### 4.6 Look check (before the full render)
Render stills at each shot's middle plus the transitions and key actions: `node render.mjs stills/a "5,40,..."` then `python3 sheet.py stills/a stills/sheet_a.jpg`. Look at the sheet and fix these traps:
- **Narrow vertical frame**: horizontal half-width = d·tan(hfov/2), with hfov = 2·atan(tan(vfov/2)·0.5625). At 4 m and fov 40 that is ±0.8 m, so stage characters in depth.
- Railings or posts across faces (camera inside the rail or ~2.5 m up). The camera path through houses, roofs or bushes. Foreground props under ~2 m away. The hero hidden behind a pillar.
- Mirrored text. A detached-part card offset the wrong way. A diagram or equation card that is unreadable at phone size.
- Extrude material groups: 0 = caps, 1 = sides+top.
- Missing ink: debug the edge-only output. Ink radius ~2.5 px at 1080. The sky counts as far depth, not a card.
- A face, the key object or a diagram card inside the caption band (y ≈ 1180-1420 px). Move the character or the camera up.
Send the sheet to the user with a one-line shot summary, then start the full render.

### 4.7 Sound (`audio.py` → stems → `mix.py`)
Rewrite the cue table for the story; the synths stay. `audio.py` writes only stems (`music.wav`, `sfx.wav`).
- Music: a short curious, light loop suited to the era (plucked bass, soft kick/snare, pad or light brass). A rising shimmer leads into the eureka. For a *twist* ending the music stops at the twist line and a low drone continues. For a *moral* or *engagement* ending, keep the music (or let a short tension drop resolve back into it) and end on a warm resolving chord on the final word.
- SFX on events (in frames/30): whooshes on big moves, thunk on drops and stamps, splash and slosh for water, rumble+crash on collapses, scrape on metal, **ting/sparkle on the eureka**, sting on the twist (if there is one), a soft resolving hit on the last word for moral/engagement endings, creaks, snap, snore, leaves, scribble/chalk for diagrams, water ambience.
- Mix with `python3 mix.py voice.mp3 music.wav sfx.wav`. It sets music to exactly 50 % of the voice's gated RMS (−6 dB) and SFX to 50 % with peaks capped at 0.7× the voice peak. It prints the measured levels: confirm music shows −6.0 dB vs voice and SFX is at or below that.
- Lock picture timing before making sound. Any timing change means re-running audio.py and mix.py.

### 4.8 Render + finish
- Run `node render.mjs frames "0-<N-1>"` with Bash `run_in_background`, watched by a Monitor loop that reports progress and catches errors or process exit. `RESUME=1` continues after an interruption. Don't run heavy Python at the same time on small machines.
- Run `bash finish.sh "<slug>"` (the project copy from `templates/finish.sh`, not the kit's). It builds and burns in the captions (4.9), applies one linear gain to about −14 LUFS plus a −1 dBFS peak limiter, encodes H.264 CRF 17 + AAC, runs freeze/black and loudness QA, prints `captions: ON (N events)`, and writes `out/qa_sheet.jpg`. Look at the sheet. Frozen spans ≥0.4 s, black frames, or `captions: OFF` need a fix.
- Deliver the MP4 and a few lines on what each shot shows, then the YouTube title and description (4.10). Offer tweaks or the next idea from the list.

### 4.9 Captions (always on)
- Source: `work/words.json` from `timing.py` (word start/end times) plus `script.txt` for exact spelling. If the word counts match, the script's spelling is used; otherwise the timing file's. Never edit the voice to fit captions.
- `finish.sh` runs `scripts/captions.py`, which writes `work/captions.ass` and burns it in with the bundled font `assets/fonts/LuckiestGuy-Regular.ttf` (Apache 2.0).
- Style: upper case, white with a thick dark outline and soft shadow. The word being spoken is warm yellow. Chunks of 1-3 words, split at punctuation and balanced (4 words → 2 + 2), so no word hangs alone unless its phrase is one word. Each chunk pops in (86 → 104 → 100 % in about 0.16 s). Soft punctuation (`. , ; :`) is dropped and `? !` are kept.
- Position: centred at x = 540, y = 1300. Options: `--y` (move the band), `--size` (default 104), `--words` (default 3), `--chars` (default 18). If a shot can't avoid the band, move the captions for the whole video rather than per shot, so they don't jump around.
- Check: grab a frame from the middle of a sentence (`ffmpeg -ss <t> -i out/<slug>.mp4 -frames:v 1 check.jpg`) and look at it. The highlighted word must match what is being said at that moment. If the captions drift, fix `work/words.json` (or install faster-whisper and re-run `timing.py`); never shift the audio.
- `CAPTIONS=0 bash finish.sh <slug>` turns captions off. Only use it if the user explicitly asks for a version without captions.

### 4.10 YouTube title + description (after every finished video)
Once the MP4 is rendered and checked, write `projects/<slug>/youtube.md` and show it in chat, ready to copy-paste:
- **5 title options**, under 70 characters, with one marked **Recommended**. Lead with the paradox or the most surprising fact, not the name (e.g. "He Opened the Gates for 150,000 Enemies"). Vary the angles: paradox, number vs number, "most famous / craziest", a "why" question, name + hook. No clickbait that the video doesn't pay off, and never present a legend as fact in the title.
- **Description** (copy-paste block):
  1. A one-line hook (the problem in a few words, with an emoji or two).
  2. Two or three sentences on the story: who, when and the eureka, plus why it matters.
  3. A **📜 Fact check** line with the fact status from the idea list (documented / anecdote / legend) and where the story comes from.
  4. A question to the viewer that invites comments.
  5. 6-10 hashtags, starting with `#shorts`: the person, the field, the era, the place.
- **Pinned comment**: one extra true fact that didn't fit in the script (a good place for a twist that was cut).
- **Notes**: search tags, and any required voice credit (ElevenLabs free-plan audio needs an attribution line; check their current terms).
Keep the tone the same as the script: curious, light and factual.

## Engine gotchas (kept in the kit; keep them if rebuilding)
- `#include <fog_vertex>` / `<fog_fragment>` go on their own lines.
- The final pass writes `linearToOutputTexel(...)` (render targets are linear HalfFloat).
- The normal+depth pass swaps materials per mesh: world → normal/depth, cards → alpha-tested mask (rgb 0, a = depth), blobs/clouds/sky hidden, water → flat normal. Fog and shadows are off during it.
- Ink goes on the near side of depth jumps only. Creases come from the normal dot. Card neighbours are skipped. Ink fades at ~140-520 m.
- DOF: 48 taps with a per-sample CoC test (no foreground bleed).
- The sun comes from az/el per light preset. The shadow camera is centred on each shot's action.

## Architecture (reference for editing the kit)
- `web/index.html` loads `main.js` (ES module) over a local HTTP server.
- `main.js`: renderer, toon materials, world, cards (1200x2000 CanvasTexture planes, origin at soles), passes colour (RT samples 4) → normal/depth → ink+grade (saturation, gain/lift, vignette, flash) → DOF to screen. It exposes `window.renderFrame(f)` and `window.ready`.
- `story.js` exports SHOTS, `shotAt`, `camAt`, `dofAt`, LIGHTS/`lightFor`, `worldAt`, `actorsAt(f, T)`, `fxAt(f, T)`. All are pure functions of the frame.
- `render.mjs`: Playwright → `renderFrame(f)` → `toDataURL('image/jpeg', .95)` → `frames/f0000.jpg`.
- `mix.py`: gated-RMS level lock (music and SFX at 50 % of the voice). `finish.sh`: linear loudness gain, limiter, encode, QA.
- Characters: the Pen API from mromidev/claude-animated-shorts `templates/bridge/toon.ts`, extended in the same module scope by the cast file.
