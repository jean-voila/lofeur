import assert from "node:assert/strict";
import { siteConfig } from "../site.config.mjs";
const site = siteConfig();
const variants = [
  ["", "fr"],
  ["en/", "en"],
  ["es/", "es"],
  ["zh/", "zh-Hans"],
  ["hi/", "hi"],
];
const assets = new Set();
const fetchChecked = async (url) => {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(20000),
    headers: { "Cache-Control": "no-cache" },
  });
  assert.equal(response.status, 200, `${url}: HTTP ${response.status}`);
  return response;
};
for (const [path, lang] of variants) {
  const url = new URL(path, site.url).href,
    response = await fetchChecked(url),
    html = await response.text();
  assert(html.includes(`<html lang="${lang}"`), `${url}: wrong language`);
  assert(
    html.includes(`rel="canonical" href="${url}"`),
    `${url}: wrong canonical`,
  );
  assert(
    html.includes('data-prerendered="true"'),
    `${url}: missing static HTML`,
  );
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.equal((html.match(/hreflang=/g) || []).length, 6);
  assert(html.includes('id="site-schema"'));
  for (const m of html.matchAll(/(?:src|href)="(\/[^"?#]+)"/g))
    if (!m[1].endsWith("/")) assets.add(new URL(m[1], site.url).href);
  for (const m of html.matchAll(/url\((\/[^)]+)\)/g))
    assets.add(new URL(m[1], site.url).href);
  console.log(`OK ${url} (${lang})`);
}
const queue = [...assets];
let index = 0;
async function worker() {
  while (index < queue.length) {
    const response = await fetchChecked(queue[index++]);
    await response.body?.cancel();
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);
const health = await (
  await fetchChecked(new URL("station-health.json", site.url))
).json();
assert.equal(health.version, 1);
assert(
  Object.keys(health.entries).length > 0,
  "Health snapshot must not be empty",
);
const sitemap = await (
  await fetchChecked(new URL("sitemap.xml", site.url))
).text();
assert.equal((sitemap.match(/<loc>/g) || []).length, 5);
const robots = await (
  await fetchChecked(new URL("robots.txt", site.url))
).text();
assert(robots.includes(`${site.url}sitemap.xml`));
const image = await fetchChecked(new URL("social-preview.jpg", site.url));
assert(image.headers.get("content-type")?.includes("image/jpeg"));
await image.body?.cancel();
const missing = await fetch(new URL("missing-verification-page/", site.url));
assert.equal(missing.status, 404);
assert((await missing.text()).includes("noindex,follow"));
console.log(
  `Public deployment verified: 5 pages, ${assets.size} first-party assets, ${Object.keys(health.entries).length} health records, sitemap, preview and real 404.`,
);
