# SEO implementation and publication checklist

The production address is `https://jean-voila.github.io/lofeur/`.
The French page is the project root. English, Spanish, Simplified Chinese and
Hindi have `/en/`, `/es/`, `/zh/` and `/hi/` directories.

## What is generated

- Real HTML for the app and a translated, user-accessible listening guide in all
  five languages. The guide uses a native disclosure and works without JavaScript;
  there is no bot-only copy, hidden keyword dump, or JavaScript-only placeholder.
- A unique title, description and canonical URL per language, reciprocal
  `hreflang` links and an `x-default` link.
- A five-page XML sitemap, robots file, real noindex 404 page and `.nojekyll`.
- Open Graph and Twitter cards, with a local 1200 × 630 JPEG preview.
- WebSite and WebApplication JSON-LD with accurate free-access information.
  No review scores, user counts or rich-result claims have been invented.
- Correct GitHub Pages project-path URLs for scripts, fonts, artwork and health
  snapshots. Direct requests to each language directory return its actual HTML.

The HTML is prerendered during the build, then hydrated in the browser. The first
render matches the static document; device-specific settings restore afterwards.
The large live song artwork and metadata load only once listening starts. A
small first-party brand icon is used before that. The small critical stylesheet
is inlined, one body font is preloaded, and font assets are fingerprinted.

## Measured result

See `lighthouse-summary.json` for the captured audit. A local mobile Lighthouse
run on the production build on 25 October 2026 reported:

| Category       | Score |
| -------------- | ----- |
| Performance    | 99    |
| Accessibility  | 100   |
| Best practices | 100   |
| SEO            | 100   |

Measured FCP: 1.5 s; LCP: 2.1 s; total blocking time: 0 ms; CLS: 0.003.
These are a local, simulated mobile lab run, not a guarantee of real-world Core
Web Vitals or Google rankings. Hosting, cache state, hardware and network conditions
will affect visitors' results. Lighthouse's SEO score is a technical checklist,
not a prediction of ranking.

## Public deployment and remaining external setup

1. Confirm the Pages URL serves the five pages and assets over HTTPS (included in the deployment verification).
2. Add the URL-prefix property `https://jean-voila.github.io/lofeur/` to Google
   Search Console and complete Google's ownership verification. If using the meta
   tag method, put Google's exact public token into the repository Actions variable
   `GOOGLE_SITE_VERIFICATION`, then redeploy. No token has been fabricated.
3. Submit `https://jean-voila.github.io/lofeur/sitemap.xml` in Search Console and
   inspect the homepage and alternate-language URLs.
4. Monitor indexing, search queries and field Core Web Vitals, then improve content
   using actual audience needs. Links and mentions from relevant sites remain
   outside what this repository can create by itself.

Important project-site detail: Google reads robots.txt at the origin root,
`https://jean-voila.github.io/robots.txt`, not the project's `/lofeur/robots.txt`.
This repository cannot control that origin-root file. The generated project file
is useful for a future root-domain deployment, while Search Console submission
is the reliable way to announce this project's sitemap. Do not assume project
robots.txt changes override the origin owner's crawl rules.

Google does not guarantee indexing or any particular position. The work here
improves crawlability, content clarity and performance; it does not claim a ranking.

Primary references:

- https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://developers.google.com/search/docs/specialty/international/localized-versions
