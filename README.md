# Cartoon Shorts Studio

Turn "eureka" stories (how inventions and discoveries really happened) into finished 60-second vertical cartoon Shorts. You make about three small decisions per video. Claude and GitHub do the rest, and you can do all of it from your phone.

> Technical details (files, commands, the render workflow): [docs/TECHNICAL.md](docs/TECHNICAL.md). The rules Claude follows: [CLAUDE.md](CLAUDE.md) and [SKILL.md](SKILL.md).

---

## How a video gets made

```
 Monday morning           You (2 min)            You (0-5 min)          Claude (30-60 min)        GitHub (1-2 h)
┌──────────────┐   ┌───────────────────┐   ┌──────────────────┐   ┌───────────────────┐   ┌──────────────────┐
│ 10 new ideas │ → │ Pick one, read    │ → │ Voice: automatic,│ → │ Plans the shots,  │ → │ Renders, mixes,  │
│ appear       │   │ the script        │   │ or record+upload │   │ builds the scenes,│   │ checks, posts the│
│ (automatic)  │   │                   │   │                  │   │ checks stills     │   │ MP4 as a Release │
└──────────────┘   └───────────────────┘   └──────────────────┘   └───────────────────┘   └──────────────────┘
                                                                                                  ↓
                                                                               You: watch it, post it to YouTube
```

## What you do, step by step

### 1. Pick an idea (about 2 minutes)
Open the **Claude app → Code**, choose the `skill_kit_main` repo and type **`ideas`**.

Claude shows 10 numbered ideas, and one is marked **Recommended**. Each idea shows:
- **Hook**: the first line of the video.
- **Eureka**: the moment of insight.
- **Twist**: the ending.
- **Why it animates**: the big visual moments.
- **Fact status**: *documented*, *anecdote* or *legend*.

**What to think about:**
- Will the hook make someone stop scrolling? It should sound surprising on its own.
- Is the twist actually a payoff? The best ones correct a myth ("the apple never hit his head") or reveal an irony.
- Is it a legend? That's fine, but the video will say "the story goes". If you want stories that are fully documented, pick those.
- Variety: don't post three physics videos in a row.

Then reply **`make 4`**, or give your own topic: **`new video about the microwave oven`**.

### 2. Check the script (about 1 minute)
Claude writes a script of about 200-215 words (about 60 seconds) and shows it with a word count and a fact note.

**What to think about:**
- Read it out loud in your head. Does any sentence trip you up?
- Is the first sentence the hook, with no warm-up?
- Do you want a different ending, a joke cut, or a fact added? Just say so ("make the ending punchier"). It's cheap to change now and expensive later.

Reply **`ok`** when you're happy.

### 3. The voice (0-5 minutes)
- **If the ElevenLabs key is set up** (see one-time setup below), Claude makes the voice itself. You do nothing.
- **Otherwise** record the script in ElevenLabs, reading it exactly, with no music. Then either:
  - attach the mp3 in the chat, or
  - on your phone, go to github.com → this repo → `projects/<slug>/` → **Add file → Upload files**, name it `voice.mp3`, commit to the branch Claude tells you, and reply **`voice uploaded`**.

**What to think about:** the voice sets the timing of the whole video. Claude never edits or re-times it, so re-record anything you don't like *before* uploading.

### 4. Wait (Claude works, then GitHub renders)
Claude times every word, plans the shots, builds the scenes and characters, writes the music and sound cues, and renders a few test frames to look for problems. Then it starts the full render on GitHub. You can close the app at this point.

A 60-second video takes about **1-2 hours** to render. To check on it later, open the session and ask **`status?`**.

### 5. Watch and post
When it's done, Claude gives you a **Release link**. Open it on your phone and download `<slug>.mp4`.

**What to think about before you post:**
- Watch with sound. Is the music under the voice, never over it?
- Any frame that looks broken: a face hidden, text mirrored, a frozen moment? Tell Claude which second, e.g. "at 0:23 the inventor is behind the pillar". It fixes the shot and re-renders.
- Ask Claude for a **YouTube title, description and hashtags**. It can write those, but you upload the video yourself.

---

## What Claude can and can't do

| Claude can | Claude can't |
|---|---|
| Find and fact-check 10 ideas every week by itself | Hear audio: it reads timing from the script and the waveform |
| Write the script and label legends honestly | Upload to YouTube or post anywhere for you |
| Make the voiceover through ElevenLabs (with your key) | Use your own voice unless you record it or have an ElevenLabs voice of it |
| Plan shots, build sets, characters, cameras and effects | Copy real cartoons, brands or living people |
| Mix music and SFX at exactly half the voice level | Guarantee a legend is true: it marks it as a legend instead |
| Render on GitHub while your PC is off | Watch the render live: it reads the results when you come back |
| Check stills and the QA sheet, fix and re-render | Change the kit's engine in `kit/` (read-only by design) |

You still decide:
- which story to tell
- whether the script is good
- whether the voice is good
- whether the video is ready to post

---

## One-time setup

You only do this once.

1. **Connect the repo to Claude Code on the web.** On [claude.ai/code](https://claude.ai/code) (or Claude app → Code), add `nuelyosia-cpt/skill_kit_main` and let the Claude GitHub app access it.
2. **Cloud environment.** In the environment settings for this repo:
   - Add the environment variables `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`. They're optional; skip them if you prefer to record the voice yourself.
   - Under network access, allow `api.elevenlabs.io` (needed only for the automatic voice).
   - The repo already contains a start-up script that installs ffmpeg and the renderer's tools in each cloud session. Nothing to do.
3. **Weekly ideas.** A scheduled routine posts 10 new ideas every Monday morning into `ideas/`. Type `/schedule` in Claude Code to view, pause or change it.
4. **GitHub Actions.** Nothing to do. If the first render fails with a "permission denied" message when pushing, open the repo **Settings → Actions → General → Workflow permissions** and choose **Read and write**.

Rendering on your own PC still works too. Open this folder in VS Code and say "new video". Finished files then go to `C:\Users\nuel.yosia\Downloads\shorts`.

---

## Costs and limits

- **GitHub Actions minutes:** one 60-second video uses about 3-5 runner hours, because the work is split over 6 machines in parallel. A **private** repo gets 2,000 free minutes a month, which is about 6-10 videos. A **public** repo has no limit.
- **Claude usage:** each video is one long session (ideas, script, build), which counts toward your Claude plan's usage.
- **ElevenLabs:** about 1,200 characters per video, from your ElevenLabs plan.
- **Time:** about 10 minutes of your attention per video, spread over the day.

## Quick commands

| Say this | What happens |
|---|---|
| `ideas` | Shows the newest idea list, minus the ideas already used |
| `make 4` or `new video about <topic>` | Writes the script for that idea |
| `ok` | Approves the script and moves on to the voice |
| `voice uploaded` | Claude pulls your mp3 and starts building |
| `status?` | Shows where the render is, with the Release link when it's done |
| `fix: at 0:23 ...` | Fixes that moment and re-renders |
| `youtube text` | Writes the title, description and hashtags |
