# Public release verification — 25 October 2026

Production: https://jean-voila.github.io/lofeur/
Repository: https://github.com/jean-voila/lofeur (public)

## Automated checks

- 59 tests pass, including source migration, station ordering, unavailable
  stations, translations, prerendering and media resource cleanup.
- Production build and static checks pass: five localized HTML documents,
  60 internal links/assets, canonical URLs, reciprocal language links,
  structured data, sitemap and no application-server health endpoint.
- Public HTTPS checks pass for French, English, Spanish, Simplified Chinese and
  Hindi, the first-party assets, health snapshot, social image and sitemap.
  A missing page returns an actual HTTP 404 with `noindex`.
- Production dependency audit reports zero known vulnerabilities.
- Mobile Lighthouse on the public site: 99 performance, 100 accessibility,
  100 best practices, 100 SEO. FCP 1.5 s, LCP 1.6 s, blocking time 0 ms.
  See `lighthouse-public-summary.json` for measurement scope and exact values.
- The audit transferred approximately 187 KB before listening, using only
  first-party resources; no YouTube player or song artwork was downloaded.
  This transfer measurement is not a browser RAM measurement.

## Browser checks on the public origin

- Live radio starts in audio-only mode; enabling video starts YouTube.
- Disabling video removes the iframe entirely and restores direct audio.
- Rain starts and stops; stopping all ambiences clears the selection.
- Changing French to English updates the URL and metadata while audio continues.
- Pomodoro starts, updates the document title and resets to 25:00.
- The station list puts live stations before recordings and shows a live marker
  only for live entries. A recording without a direct audio source explains how
  to enable video, instead of pretending to supply audio-only YouTube playback.
- Testing a recording exposed a long-advert startup edge case. A responsive
  YouTube iframe no longer hits the connection timeout while an advert plays;
  unresponsive iframes still produce a retry message. Two regression tests cover
  these cases. YouTube controls remain visible while content is starting.

## Release and maintenance evidence

- Initial public CI and Pages release both succeeded at commit `493271c`.
- CI and Pages including the public HTTP verification succeeded at `2e3f0a2`:
  https://github.com/jean-voila/lofeur/actions/runs/40228783303
- A manual run of the six-hour catalog maintenance succeeded:
  https://github.com/jean-voila/lofeur/actions/runs/40228796428
  It checked 92 sources: 92 available, zero unavailable or unknown at that time.
- Its bot commit `fd34814` automatically triggered a successful Pages rebuild:
  https://github.com/jean-voila/lofeur/actions/runs/40228896440
- Every deployment now runs `npm run check:deployment` against the public origin.
- The pre-migration checkpoint remains available as commit `6c7d34f`.

Media availability can change and vary by region or browser. The browser handles
actual playback errors; the scheduled audit refreshes public snapshots without
requiring an application server. Audit time is not a permanent availability claim.

## Google indexing

Technical SEO is published. Search Console was not signed in during verification,
so ownership verification and sitemap submission have not been claimed as done.
The optional `GOOGLE_SITE_VERIFICATION` repository variable supports Google's
HTML-tag method. Follow `seo.md` to submit the sitemap from the owner's account.
Lighthouse SEO is a technical audit, not a Google ranking or indexing guarantee.
