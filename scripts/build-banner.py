#!/usr/bin/env python3
"""Typeset the README banner with real, outlined Fredoka glyphs.
Run: python3 scripts/build-banner.py
Export the resulting SVG to PNG with an SVG renderer (for example Sharp).
The illustration is a separate asset; both lines of typography come from the
licensed TTF in this repository, and never from an image generator.
"""
import base64
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

root = Path(__file__).resolve().parent.parent

def outlines(text, weight):
    font = instantiateVariableFont(TTFont(root / 'docs/branding/Fredoka-Variable.ttf'), {'wght': weight, 'wdth': 110}, inplace=False)
    glyphs, cmap, x, paths, top = font.getGlyphSet(), font.getBestCmap(), 0, [], 0
    for char in text:
        glyph = glyphs[cmap[ord(char)]]
        pen, bounds = SVGPathPen(glyphs), BoundsPen(glyphs)
        glyph.draw(pen); glyph.draw(bounds)
        if bounds.bounds:
            top = max(top, bounds.bounds[3])
        paths.append(f'<path transform="translate({x:.2f} 0)" d="{pen.getCommands()}"/>')
        x += glyph.width - (22 if weight == 700 else -20)
    return ''.join(paths), x, top

word, width, top = outlines('lofeur', 700)
tag, tag_width, tag_top = outlines('tune in. slow down.', 400)
image = base64.b64encode((root / 'docs/branding/banner-background.jpg').read_bytes()).decode()
scale = 670 / width
small = 415 / tag_width
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="2172" height="724" viewBox="0 0 2172 724"><image width="2172" height="724" href="data:image/jpeg;base64,{image}"/><g fill="#f4e6d2" transform="translate(145 {250+top*scale:.2f}) scale({scale:.8f} {-scale:.8f})">{word}</g><g fill="#f4e6d2" transform="translate(275 {440+tag_top*small:.2f}) scale({small:.8f} {-small:.8f})">{tag}</g></svg>'''
(root / 'docs/branding/banner.svg').write_text(svg)
print('docs/branding/banner.svg typeset with Fredoka Bold / Regular')
