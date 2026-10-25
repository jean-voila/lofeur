import assert from "node:assert/strict";
import { loadEnv } from "vite";
import { readFile, access, readdir } from "node:fs/promises";
import { siteConfig } from "../site.config.mjs";
const site = siteConfig({
  ...loadEnv("production", process.cwd(), ""),
  ...process.env,
});
const locales = [
  ["fr", "fr", ""],
  ["en", "en", "en/"],
  ["es", "es", "es/"],
  ["zh", "zh-Hans", "zh/"],
  ["hi", "hi", "hi/"],
];
let checked = 0;
for (const [locale, lang, path] of locales) {
  const html = await readFile(`dist/${path}index.html`, "utf8");
  const url = new URL(path, site.url).href;
  assert(html.includes(`<html lang="${lang}"`), `${locale}: language`);
  assert.equal(
    (html.match(/<title>/g) || []).length,
    1,
    `${locale}: one title`,
  );
  assert.equal(
    (html.match(/<h1\b/g) || []).length,
    1,
    `${locale}: one meaningful H1`,
  );
  assert(
    html.includes(`rel="canonical" href="${url}"`),
    `${locale}: canonical`,
  );
  assert(
    html.includes('data-prerendered="true"'),
    `${locale}: real static HTML`,
  );
  assert(
    html.includes('id="site-heading"'),
    `${locale}: guide content without JavaScript`,
  );
  assert(!html.includes("node:http"), `${locale}: no backend`);
  const alternates = [
    ...html.matchAll(
      /<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g,
    ),
  ];
  assert.equal(
    alternates.length,
    6,
    `${locale}: five language links plus x-default`,
  );
  assert.equal(new Set(alternates.map((x) => x[1])).size, 6);
  const schema = JSON.parse(
    html.match(
      /<script type="application\/ld\+json" id="site-schema">([\s\S]*?)<\/script>/,
    )[1],
  );
  assert.equal(
    schema["@graph"].find((x) => x["@type"] === "WebApplication").url,
    url,
  );
  assert(html.includes(new URL("social-preview.jpg", site.url).href));
  for (const match of html.matchAll(/(?:href|src)="(\/[^"?#]+)"/g)) {
    assert(
      match[1].startsWith(site.base),
      `${locale}: asset/link escaped ${site.base}: ${match[1]}`,
    );
    const local =
      "dist/" +
      match[1].slice(site.base.length) +
      (match[1].endsWith("/") ? "index.html" : "");
    await access(local);
    checked++;
  }
}
for (const file of await readdir("dist/assets")) {
  const content = await readFile(`dist/assets/${file}`);
  if (file.endsWith(".js"))
    assert(
      !content.includes(Buffer.from("/api/station-health")),
      "No runtime health API in client chunks",
    );
  if (file.endsWith(".css"))
    for (const m of content.toString().matchAll(/url\(([^)]+)\)/g)) {
      const path = m[1].replace(/^['"]|['"]$/g, "");
      if (path.startsWith("data:")) continue;
      assert(
        path.startsWith(site.base),
        `CSS asset is not base-aware: ${path}`,
      );
      await access("dist/" + path.slice(site.base.length));
    }
}
const sitemap = await readFile("dist/sitemap.xml", "utf8");
assert.equal((sitemap.match(/<loc>/g) || []).length, 5);
for (const [, , path] of locales)
  assert(sitemap.includes(new URL(path, site.url).href));
assert((await readFile("dist/404.html", "utf8")).includes("noindex,follow"));
await access("dist/.nojekyll");
await access("dist/station-health.json");
console.log(
  `Static checks passed: 5 localized HTML pages, ${checked} internal assets/links, sitemap, structured data, and no server API.`,
);
