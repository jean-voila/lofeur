# Contributing to lofeur

Small, thoughtful improvements are welcome. Keep the experience calm and the
app easy to run: no account system, analytics SDK, paid station gates, or server
requirement.

1. Install Node.js 22.12+ (or 24+) and run `npm ci`.
2. Run `npm run dev`.
3. Make your change and check desktop and narrow mobile layouts.
4. Run `npm test` and `npm run build`.
5. Describe the behavior you changed and include a screenshot for visual work.

Station defaults live in `src/stations.json`. A changed live URL should point
to a public YouTube video or livestream. Do not add extracted audio, copyrighted
music files, access credentials, or private/unlisted streams to the defaults.

For bugs, include your browser, screen size and reproduction steps. Your browser's
locally saved station list is personal: share only what is needed to reproduce.
