# Static GitHub Pages deployment

The application is now entirely static. GitHub Pages serves files; no Node
application, runtime API, database, proxy, or API key is needed by visitors.
Node is a development/build tool only. The radio, YouTube player, procedural
backgrounds, Pomodoro and preferences run in the visitor's browser.

The previous working version is saved in commit `6c7d34f`.

## Build and inspect

```bash
npm ci
npm test
npm run build
npm run check:static
npm run preview
```

Open `http://127.0.0.1:4173/lofeur/`. The exact contents of `dist/` are the
production website, including five localized HTML pages. Preview is only a local
file server, not a production application server.

The canonical deployment address is `https://jean-voila.github.io/lofeur/`.
`site.config.mjs` owns this default. Build-time `SITE_URL` can change both the
canonical address and asset base together if a custom domain is chosen later.
The `.env.example` file documents the public build configuration.

## Publication configuration

The user authorized public publication on 25 October 2026. The repository is public,
GitHub Pages uses Actions, and `PAGES_ENABLED=true` enables the deploy job.
The public address is https://jean-voila.github.io/lofeur/.
The previous private/server-backed version is retained in Git history.

1. In the repository's **Settings → Pages**, choose **GitHub Actions** as the
   source. Pages from a private repository requires an eligible GitHub plan;
   GitHub Free supports Pages from public repositories.
2. Create the repository Actions variable **`PAGES_ENABLED`** with value **`true`**.
3. Run the **GitHub Pages** workflow, or push to `main`.

The workflow builds and validates an artifact before deployment. The deploy job
requires `PAGES_ENABLED=true`; setting it to false stops future deployments, but
does not remove an already published site. Repository privacy and website access
are separate concerns.

Official instructions:
https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## Availability without an application server

YouTube's public playability metadata cannot reliably be inspected from a
visitor's browser because of cross-origin restrictions. The six-hour **Refresh
station catalog** workflow therefore performs those checks in GitHub Actions and
commits the verified static snapshot. It can also sync the official playlist and
repair known default live sources. It never runs inside a visitor's tab.

A successful maintenance workflow triggers the Pages workflow through
`workflow_run`; this is intentional because commits made with `GITHUB_TOKEN` do
not trigger ordinary push workflows. The deploy job still requires
`PAGES_ENABLED=true`.

Visitors fetch `station-health.json` from the same static site every five minutes
while the tab is visible. There is no `/api/station-health` request. The refresh
button rereads the published snapshot; it cannot start a new YouTube audit.
Actual player failures still grey the affected source immediately, independently
of the scheduled snapshot. Temporary errors can expire and be retried.

When Pages is not yet enabled, snapshots still update in the repository. They
reach a deployed site only through a subsequent successful build/deployment.
External availability and country-specific playback restrictions can change
between audits; a static site cannot promise otherwise.

## Browser-only behavior and privacy

Settings and station edits stay in localStorage on the visitor's device. No
login or synchronization service has been added. Language changes update a real
localized URL without restarting playback. Direct radio audio still comes from
Lofi Girl's public streams; recorded YouTube mixes still need the official video
player unless a separate direct audio stream is supplied.
