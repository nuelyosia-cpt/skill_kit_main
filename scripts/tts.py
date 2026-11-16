#!/usr/bin/env python3
"""Make voice.mp3 from script.txt with the ElevenLabs API.

    python scripts/tts.py projects/<slug>

Needs ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in the environment (set them as secrets
in the Claude Code cloud environment; never paste the key into chat or commit it).
Optional: ELEVENLABS_MODEL (default eleven_multilingual_v2), ELEVENLABS_SPEED (default 1.05),
ELEVENLABS_STABILITY (default 0.5).
Reads the script exactly as written. Writes <project>/voice.mp3 and prints its length.
"""
import json, os, subprocess, sys, urllib.request, urllib.error

def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    proj = sys.argv[1]
    key = os.environ.get("ELEVENLABS_API_KEY")
    voice = os.environ.get("ELEVENLABS_VOICE_ID")
    if not key or not voice:
        sys.exit("ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID must be set. Ask the user to record voice.mp3 instead.")
    text = open(os.path.join(proj, "script.txt"), encoding="utf-8").read().strip()
    body = {
        "text": text,
        "model_id": os.environ.get("ELEVENLABS_MODEL", "eleven_multilingual_v2"),
        "voice_settings": {
            "stability": float(os.environ.get("ELEVENLABS_STABILITY", "0.5")),
            "similarity_boost": 0.75,
            "speed": float(os.environ.get("ELEVENLABS_SPEED", "1.05")),
        },
    }
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128",
        data=json.dumps(body).encode(), method="POST",
        headers={"xi-api-key": key, "Content-Type": "application/json", "Accept": "audio/mpeg"})
    try:
        audio = urllib.request.urlopen(req, timeout=300).read()
    except urllib.error.HTTPError as e:
        sys.exit(f"ElevenLabs error {e.code}: {e.read()[:300].decode(errors='replace')}")
    except urllib.error.URLError as e:
        sys.exit(f"Cannot reach api.elevenlabs.io ({e.reason}). In the cloud environment, allow that domain in network access.")
    out = os.path.join(proj, "voice.mp3")
    open(out, "wb").write(audio)
    dur = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out],
                         capture_output=True, text=True).stdout.strip()
    words = len(text.split())
    print(f"wrote {out}: {dur} s, {words} words")

if __name__ == "__main__":
    main()
