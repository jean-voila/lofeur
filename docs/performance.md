# Browser resource budget

The default is native audio plus a procedural background. YouTube is not loaded
until the user enables video and starts playback. Switching back destroys the
iframe and releases the media source; CSS hiding is not used as a substitute.

The main RGBA canvas is capped at 480 pixels on its longest edge in economy
mode (12 fps), and 720 in normal mode (20 fps). Even on a square viewport its
main pixel buffer represents at most 921,600 bytes in economy mode. This is a
buffer-size bound, **not** a claim about the browser's total resident memory;
compositing, media buffering, font/image decoding and the browser add overhead.
The fireplace uses a fixed small noise field and image buffer, reused each frame.
There are no particle-object lists, per-frame ImageData allocations or WebGL.

Animations cancel their frame callback when hidden or when reduced motion is
requested. Speed zero renders a still frame. Resize and visibility listeners are
removed on teardown. Canvas is memoized independently of the timer's updates.
Inactive soundscape elements clear their `src`, call `load()`, and leave the map.
Only 24 station rows render initially, with more available on request. Artwork
uses lazy decoding/loading. The full playlist does not preload 74 players.

Public availability checks run in the scheduled GitHub catalog worker, not
inside hidden browser players or an application server. The worker uses two
metadata requests at a time, caps HTML reads at 3 MB, and releases audio probe
bodies immediately. The browser only fetches the published static health JSON.
Metadata and large song artwork are deferred until listening starts. A small
first-party brand icon is shown before playback. The body font is preloaded,
fonts are fingerprinted, and the small critical stylesheet is inlined.

Verification includes media lifecycle tests (including iframe destruction and
source release), canvas allocation bounds, hidden-tab code paths, translation
coverage, sorting, migrations and playability parsing. A fresh isolated Chromium
capture (`ev_f73679928fe7ea8fc4b759dad09221c739cbfe8dfe66f3231475c9f3d7eab484`)
reported **zero YouTube/googlevideo requests** in audio-only mode and no page
errors. This capture covers initial load, not a long-duration RAM benchmark.

The subsequent static migration measured 99/100 performance in a local mobile
Lighthouse run; see `seo.md` and `lighthouse-summary.json` for scope and metrics.
