#!/usr/bin/env python3
"""Thumbnail maker for the cartoon shorts.

    python3 thumbnail.py frames/f0123.jpg "HE SAID HIS NAME WAS *NOBODY*" out/thumb
        [--circle 540,700,170] [--focus 0.4] [--font fonts/LuckiestGuy-Regular.ttf]

Writes <out>_9x16.jpg (1080x1920, the Shorts thumbnail) and <out>_16x9.jpg (1280x720,
for the channel page / long-form use). The frame must be a caption-free render frame
(frames/ or stills/), never a frame grabbed from the final MP4.

Text: 2-6 words, upper case, big. Wrap words in *stars* to colour them yellow.
--top 0.36      caption box bottom (fraction of the height); lower it if the caption covers a face.
--circle x,y,r  draws a red highlight ring around the key object (1080x1920 coordinates).
--focus 0..1    vertical centre of the interesting part (for the 16:9 crop), default 0.4.
"""
import argparse, os, re
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageFont

INK, WHITE, YELLOW, RED = (36, 23, 38), (255, 255, 255), (255, 210, 58), (230, 40, 40)
HERE = os.path.dirname(os.path.abspath(__file__))

def find_font(path):
    for p in [path, os.path.join(HERE, "fonts/LuckiestGuy-Regular.ttf"), os.path.join(HERE, "../assets/fonts/LuckiestGuy-Regular.ttf"), "fonts/LuckiestGuy-Regular.ttf"]:
        if p and os.path.exists(p): return p
    raise SystemExit("font not found: pass --font")

def tokens(text):  # [(word, accent)]
    out = []
    for w in text.upper().split():
        acc = w.startswith("*") or w.endswith("*") or w.endswith("*?") or w.endswith("*!")
        out.append((w.replace("*", ""), acc))
    return out

def layout(words, font_path, max_w, max_lines, size0):
    for size in range(size0, 40, -4):
        f = ImageFont.truetype(font_path, size); sp = f.getlength(" ")
        lines, cur, w = [], [], 0
        for word, acc in words:
            ww = f.getlength(word)
            if cur and w + sp + ww > max_w: lines.append(cur); cur, w = [], 0
            cur.append((word, acc)); w += (sp if len(cur) > 1 else 0) + ww
        if cur: lines.append(cur)
        if len(lines) <= max_lines and all(sum(f.getlength(x) for x, _ in L) + sp * (len(L) - 1) <= max_w for L in lines):
            return f, lines
    return ImageFont.truetype(font_path, 40), [words]

def draw_text(img, text, font_path, box, max_lines, size0, align="center"):
    x0, y0, x1, y1 = box
    f, lines = layout(tokens(text), font_path, x1 - x0, max_lines, size0)
    d = ImageDraw.Draw(img); asc, desc = f.getmetrics(); lh = int((asc + desc) * 1.02)
    total = lh * len(lines); y = y0 + max(0, (y1 - y0 - total) // 2)
    stroke = max(6, f.size // 9); sp = f.getlength(" ")
    for L in lines:
        lw = sum(f.getlength(w) for w, _ in L) + sp * (len(L) - 1)
        x = x0 + ((x1 - x0 - lw) / 2 if align == "center" else 0)
        for w, acc in L:   # soft drop shadow, then outlined word
            d.text((x + stroke * 0.6, y + stroke * 0.9), w, font=f, fill=(0, 0, 0), stroke_width=stroke, stroke_fill=(0, 0, 0))
            d.text((x, y), w, font=f, fill=YELLOW if acc else WHITE, stroke_width=stroke, stroke_fill=INK)
            x += f.getlength(w) + sp
        y += lh

def grade(im):
    im = ImageEnhance.Color(im).enhance(1.18); im = ImageEnhance.Contrast(im).enhance(1.08)
    return ImageEnhance.Brightness(im).enhance(1.04)

def top_shade(im, h, a=150):
    sh = Image.new("L", (1, h)); [sh.putpixel((0, y), int(a * (1 - y / h) ** 1.4)) for y in range(h)]
    dark = Image.new("RGB", im.size, (10, 6, 14)); mask = Image.new("L", im.size, 0); mask.paste(sh.resize((im.width, h)), (0, 0))
    return Image.composite(dark, im, mask)

def ring(img, cx, cy, r, scale=1.0):
    d = ImageDraw.Draw(img); w = int(14 * scale)
    d.ellipse([cx - r - w, cy - r - w, cx + r + w, cy + r + w], outline=WHITE, width=w // 2)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=RED, width=w)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("frame"); ap.add_argument("text"); ap.add_argument("out")
    ap.add_argument("--circle", default=None); ap.add_argument("--top", type=float, default=0.36, help="caption box bottom as a fraction of the height (9:16)"); ap.add_argument("--focus", type=float, default=0.4); ap.add_argument("--font", default=None)
    a = ap.parse_args(); font = find_font(a.font)
    src = grade(Image.open(a.frame).convert("RGB").resize((1080, 1920), Image.LANCZOS))
    circ = [int(v) for v in a.circle.split(",")] if a.circle else None
    # 9:16
    v = top_shade(src, int(1920 * a.top) + 60)
    if circ: ring(v, *circ)
    draw_text(v, a.text, font, (60, 90, 1020, int(1920 * a.top)), 3, 150)
    os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
    v.save(a.out + "_9x16.jpg", quality=92)
    # 16:9: blurred backdrop, the vertical frame on the right, text on the left
    bg = src.resize((1280, int(1920 * 1280 / 1080)), Image.LANCZOS)
    cy = int(bg.height * a.focus); top = max(0, min(bg.height - 720, cy - 360))
    bg = bg.crop((0, top, 1280, top + 720)).filter(ImageFilter.GaussianBlur(18)); bg = ImageEnhance.Brightness(bg).enhance(0.55)
    ch = 1350; ctop = max(0, min(1920 - ch, int(1920 * a.focus) - ch // 2))
    fg = src.crop((0, ctop, 1080, ctop + ch))
    if circ:
        fg = fg.copy(); ring(fg, circ[0], circ[1] - ctop, circ[2])
    fg = fg.resize((int(1080 * 720 / ch), 720), Image.LANCZOS)
    bg.paste(fg, (1280 - fg.width - 30, 0))
    ImageDraw.Draw(bg).rectangle([1280 - fg.width - 36, 0, 1280 - fg.width - 30, 720], fill=WHITE)
    draw_text(bg, a.text, font, (40, 40, 1280 - fg.width - 70, 680), 4, 110)
    bg.save(a.out + "_16x9.jpg", quality=92)
    print(f"wrote {a.out}_9x16.jpg and {a.out}_16x9.jpg")

if __name__ == "__main__":
    main()
