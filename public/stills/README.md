# Hero frames

The landing page's hero is a river of video frames drifting along a diagonal.
The ones on the left are desaturated, torn by dropped-frame bars and labelled
"can't open"; the ones on the right have their colour back, a play glyph and a
progress bar. It is the product's argument told without a word of copy.

These are real photographs, not renders — which is the point. The whole product
exists because a video shot on a phone would not open on another phone, so the
artwork is footage of the kind people actually send each other.

`f06.jpg` does double duty: it is also the frame shown playing on all three
devices in the "Locked down by default" section, because it is meant to read as
the same video on three screens.

## Replacing them

- Exactly **11 files**, `f01.jpg` through `f11.jpg`.
- **16:9**, **640×360**. The widest card on screen is 168px and the two furthest
  bands sit behind a 6px and a 2px blur, so anything sharper is thrown away by
  the compositor before it reaches a pixel.
- Keep each one under ~60 KB. They all load at once.

Nothing else needs changing. `src/components/landing/hero-river.tsx` builds the
list from the count, and the grading, blur and tearing are applied per card at
render time.

## Pulling frames out of a video

`ffprobe` and `ffmpeg` are already dependencies of this project:

```bash
ffmpeg -i clip.mov -vf "fps=1/4,crop=ih*16/9:ih,scale=640:360" -frames:v 11 -q:v 6 f%02d.jpg
```

One frame every four seconds, at most eleven, centre-cropped to 16:9.

## Before you commit one

These ship in a public repository and load on every visit. Check each frame for
a face you did not ask, a readable number plate, a house number, or anything
else you would not put on a CV.
