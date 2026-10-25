import { build, loadEnv } from "vite";
import { readFile, writeFile, mkdir, rm, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { siteConfig } from "../site.config.mjs";
const publicEnv = {
  ...loadEnv("production", process.cwd(), ""),
  ...process.env,
};
const site = siteConfig(publicEnv);
const verification = publicEnv.GOOGLE_SITE_VERIFICATION || "";
if (verification && !/^[A-Za-z0-9_-]+$/.test(verification))
  throw new Error("Invalid Google Search Console verification token.");
const escape = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
await build();
let template = await readFile("dist/index.html", "utf8");
const files = await readdir("dist/assets");
const regularFont = files.find((file) =>
  /^gopher-regular-.*\.woff2$/.test(file),
);
// This stylesheet is small and the whole app is above the fold. Inlining removes
// a blocking request while all image/font URLs remain fingerprinted and cached.
for (const match of [
  ...template.matchAll(/<link rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/g),
]) {
  const css = await readFile(
    "dist/" + match[1].slice(site.base.length),
    "utf8",
  );
  template = template.replace(match[0], `<style>${css}</style>`);
}
if (regularFont)
  template = template.replace(
    "</head>",
    `<link rel="preload" as="font" type="font/woff2" crossorigin href="${site.base}assets/${regularFont}"></head>`,
  );
try {
  await build({
    build: {
      ssr: "src/prerender.tsx",
      outDir: ".prerender",
      emptyOutDir: true,
      manifest: false,
    },
  });
  const { render, seoData, locales } = await import(
    pathToFileURL(resolve(".prerender/prerender.js")).href
  );
  for (const locale of locales) {
    const data = seoData(locale.code, site.url);
    const head = `${verification ? `<meta name="google-site-verification" content="${verification}">` : ""}<title>${escape(data.title)}</title>
<meta name="description" content="${escape(data.description)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${escape(data.url)}">
${data.alternates.map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${escape(a.url)}">`).join("\n")}
<meta property="og:type" content="website"><meta property="og:site_name" content="lofeur">
<meta property="og:title" content="${escape(data.title)}"><meta property="og:description" content="${escape(data.description)}"><meta property="og:url" content="${escape(data.url)}">
<meta property="og:locale" content="${{ fr: "fr_FR", en: "en_US", es: "es_ES", zh: "zh_CN", hi: "hi_IN" }[locale.code]}">
<meta property="og:image" content="${escape(data.image)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="lofeur · tune in. slow down.">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(data.title)}"><meta name="twitter:description" content="${escape(data.description)}"><meta name="twitter:image" content="${escape(data.image)}">
<script type="application/ld+json" id="site-schema">${JSON.stringify(data.schema).replace(/</g, "\\u003c")}</script>`;
    const directory = locale.code === "fr" ? "dist" : `dist/${locale.code}`;
    await mkdir(directory, { recursive: true });
    let html = template
      .replace(
        '<html lang="fr">',
        `<html lang="${data.lang}" data-locale="${locale.code}">`,
      )
      .replace(/<title>[\s\S]*?<\/title>/, "")
      .replace(/<meta\s+name="description"[\s\S]*?\/>/, "")
      .replace("</head>", `${head}\n</head>`)
      .replace(
        '<div id="root"></div>',
        `<div id="root" data-prerendered="true">${render(locale.code)}</div>`,
      );
    await writeFile(`${directory}/index.html`, html);
  }
  const urls = locales.map((l) => seoData(l.code, site.url).url);
  await writeFile(
    "dist/sitemap.xml",
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${escape(url)}</loc></url>`).join("")}</urlset>\n`,
  );
  await writeFile(
    "dist/robots.txt",
    `User-agent: *\nAllow: /\nSitemap: ${site.url}sitemap.xml\n`,
  );
  await writeFile("dist/.nojekyll", "");
  await writeFile(
    "dist/404.html",
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex,follow"><title>Page not found · lofeur</title></head><body style="font-family:system-ui;background:#1d181a;color:#f4e6d2;padding:8vw"><h1>Page not found</h1><p><a style="color:inherit" href="${site.base}">Return to lofeur</a></p></body></html>`,
  );
  console.log(`Static site: ${urls.join(", ")}`);
} finally {
  await rm(".prerender", { recursive: true, force: true });
}
