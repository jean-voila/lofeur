# Reproducible lofeur identity

The original illustrated banner contained generated lettering. That lettering
has been replaced throughout the interface and final banner with **Fredoka**, a
real open-source typeface by The Fredoka Project Authors.

- Font source: https://fonts.google.com/specimen/Fredoka
- Complete variable TTF: `branding/Fredoka-Variable.ttf`
- License: `branding/OFL.txt`, SIL Open Font License 1.1
- Logo settings: weight 700, width 110, tracking -22 font units
- Interface logo: `../public/logo.svg`, outlined directly from those font glyphs
- Banner: `assets/banner.webp`, same outlined glyphs; tagline uses weight 400
- `scripts/build-wordmark.py` rebuilds the SVG using FontTools.
- `scripts/build-banner.py` creates the editable vector banner composition;
  export its SVG with an SVG renderer such as Sharp to regenerate the PNG/WebP.

The interface does not need to decode an AI-generated raster logo or load the
full brand font. The SVG paths remain crisp and reproducible. The complete TTF
is available for editing and future brand work.

The original cozy-attic illustration was created with the built-in image tool.
A second edit removed all generated typography while preserving the scene.
The final illustration-only source is `branding/banner-background.jpg`.
Typesetting was then performed with the actual licensed font.

## Illustration edit prompt

> Remove all typography, including the large wordmark and small slogan. Preserve
> the original warm attic, wood, plants, sleeping orange cat, desk, turntable,
> window, rooftops, lighting and composition. Leave dark negative space on the
> left. No text or new objects.
