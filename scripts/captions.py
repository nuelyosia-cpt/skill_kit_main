#!/usr/bin/env python3
"""Burned-in captions that follow the voice, word by word.

    python scripts/captions.py projects/<slug>        ->  projects/<slug>/work/captions.ass

Reads work/words.json (word timings from timing.py) and script.txt (exact spelling and
punctuation). Writes an ASS subtitle file that finish.sh burns into the video:
- short chunks of 1-3 words, broken at punctuation, so they are readable on a phone
- the word being spoken is highlighted; each chunk pops in slightly
- placed in the caption band (centre at 68 % of the height), above the Shorts UI at the bottom
- font: assets/fonts/LuckiestGuy-Regular.ttf (Apache 2.0), copied into the project as fonts/

Options: --words N (max words per chunk, default 3), --chars N (max characters, default 18),
--y N (vertical centre in px, default 1300), --size N (font size, default 104).
Never changes the voice or its timing: captions follow words.json exactly.
"""
import argparse, json, os, re, sys

PUNCT_BREAK = re.compile(r"[.,!?;:—–-]$|\"$")


def tokens_from(project):
    words = json.load(open(os.path.join(project, "work", "words.json"), encoding="utf-8"))
    script_path = os.path.join(project, "script.txt")
    script = open(script_path, encoding="utf-8").read().split() if os.path.exists(script_path) else []
    if script and len(script) == len(words):
        # timing.py aligned the script itself (or whisper heard every word): keep the script's spelling
        return [(script[i], w["s"], w["e"]) for i, w in enumerate(words)]
    if script:
        print(f"note: script has {len(script)} words, words.json has {len(words)}; using words.json spelling",
              file=sys.stderr)
    return [(w["w"], w["s"], w["e"]) for w in words]


def chunks(tokens, max_words, max_chars):
    """Split at punctuation into phrases, then split each phrase into evenly sized chunks
    (4 words -> 2+2, 5 -> 3+2), so no single word is left alone unless the phrase is one word."""
    phrases, cur = [], []
    for tok in tokens:
        cur.append(tok)
        if PUNCT_BREAK.search(tok[0]):
            phrases.append(cur); cur = []
    if cur:
        phrases.append(cur)
    out = []
    for ph in phrases:
        n = len(ph); k = -(-n // max_words)
        while True:   # add chunks until every chunk fits the character limit
            size = -(-n // k)
            parts = [ph[i:i + size] for i in range(0, n, size)]
            if all(len(" ".join(t[0] for t in p)) <= max_chars for p in parts) or size == 1:
                break
            k += 1
        out.extend(parts)
    return out


def clean(word):
    w = word.replace("{", "").replace("}", "").replace("\\", "")
    w = re.sub(r"[.,;:]+$", "", w)          # drop soft punctuation, keep ? and !
    return w.upper()


def ts(t):
    t = max(0.0, t)
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    ap.add_argument("--words", type=int, default=3)
    ap.add_argument("--chars", type=int, default=18)
    ap.add_argument("--y", type=int, default=1300)
    ap.add_argument("--size", type=int, default=104)
    a = ap.parse_args()

    toks = tokens_from(a.project)
    groups = chunks(toks, a.words, a.chars)
    WHITE, HILITE = "&H00FFFFFF&", "&H0033D7FF&"     # ASS colours are &HAABBGGRR&: highlight = warm yellow
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Luckiest Guy,{a.size},{WHITE},{WHITE},&H00201018&,&H80000000&,0,0,0,0,100,100,2,0,1,7,4,5,60,60,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = []
    for gi, g in enumerate(groups):
        start = g[0][1]
        nxt = groups[gi + 1][0][1] if gi + 1 < len(groups) else g[-1][2] + 0.6
        end = min(nxt, g[-1][2] + 0.45) if gi + 1 < len(groups) else nxt
        end = max(end, start + 0.25)
        words = [clean(t[0]) for t in g]
        for wi, t in enumerate(g):
            ws = start if wi == 0 else t[1]
            we = g[wi + 1][1] if wi + 1 < len(g) else end
            if we <= ws:
                continue
            parts = [(f"{{\\c{HILITE}}}{w}{{\\c{WHITE}}}" if k == wi else w) for k, w in enumerate(words)]
            pop = "\\fscx86\\fscy86\\t(0,90,\\fscx104\\fscy104)\\t(90,160,\\fscx100\\fscy100)" if wi == 0 else ""
            lines.append(f"Dialogue: 0,{ts(ws)},{ts(we)},Cap,,0,0,0,,{{\\pos(540,{a.y}){pop}}}" + " ".join(parts))
    out = os.path.join(a.project, "work", "captions.ass")
    open(out, "w", encoding="utf-8").write(head + "\n".join(lines) + "\n")
    print(f"wrote {out}: {len(groups)} caption chunks, {len(toks)} words, {toks[0][1]:.2f}-{toks[-1][2]:.2f} s")


if __name__ == "__main__":
    main()
