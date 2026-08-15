# Hero frames

The landing page's hero is a river of video frames drifting along a diagonal.
The ones on the left are desaturated, torn by dropped-frame bars and labelled
"can't open"; the ones on the right have their colour back, a play glyph and a
progress bar. It is the product's argument told without a word of copy.

**These are placeholders.** They are generated gradients, and they look it.
Replace them with real frames from real videos — ideally the kind of footage the
project exists for: a clip off a phone, handheld, badly lit, nothing staged.

## What to drop in

- Exactly **11 files**, named `f01.jpg` through `f11.jpg`.
- **16:9**, around **960×540**. Anything larger is wasted — the widest card on
  screen is 168px.
- Keep each one under ~40 KB. They all load at once, so the whole set should
  come in under half a megabyte.

Nothing else needs changing. The hero reads the count from the directory
listing in `src/components/landing/hero-river.tsx`, and the grading, blur and
tearing are applied per card at render time.

## Pulling frames out of a video you already have

`ffprobe` and `ffmpeg` are already a dependency of this project:

```bash
ffmpeg -i clip.mov -vf "fps=1/4,scale=960:-2" -frames:v 11 -q:v 6 f%02d.jpg
```

That takes one frame every four seconds, at most eleven of them. Drop the
results in this folder and reload.

## Why they are so small

The cards are 62px, 104px and 168px wide, and the two furthest bands are behind
a 6px and a 2px blur. Anything sharper than 960px is thrown away by the
compositor before it reaches a pixel.
