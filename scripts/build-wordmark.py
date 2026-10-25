#!/usr/bin/env python3
"""Rebuild the brand from its real OFL font. Requires fonttools>=4.63.
Run: python3 scripts/build-wordmark.py
No image generator, tracing, external service or browser dependency.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

root = Path(__file__).resolve().parent.parent
font = instantiateVariableFont(TTFont(root / 'docs/branding/Fredoka-Variable.ttf'), {'wght': 700, 'wdth': 110}, inplace=False)
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
paths = []
x = 0
min_y, max_y = 0, 0
for letter in 'lofeur':
    glyph_name = cmap[ord(letter)]
    glyph = glyphs[glyph_name]
    pen = SVGPathPen(glyphs)
    glyph.draw(pen)
    bounds = BoundsPen(glyphs)
    glyph.draw(bounds)
    if bounds.bounds:
        min_y = min(min_y, bounds.bounds[1])
        max_y = max(max_y, bounds.bounds[3])
    paths.append(f'<path transform="translate({x:.2f} 0)" d="{pen.getCommands()}"/>')
    x += glyph.width - 22
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 {-max_y-8} {x+16:.2f} {max_y-min_y+16:.2f}" role="img" aria-label="lofeur"><title>lofeur</title><desc>Fredoka Bold 700, width 110. SIL Open Font License 1.1. See docs/branding/OFL.txt.</desc><g fill="#f4e6d2" transform="scale(1 -1)">{''.join(paths)}</g></svg>'''
(root / 'public/logo.svg').write_text(svg)
print('public/logo.svg rebuilt from Fredoka Bold (700, width 110)')
