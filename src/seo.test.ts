import { describe, expect, it } from "vitest";
import { render } from "./prerender";
import { seoData } from "./seo";
import { seoCopy } from "./seo-content";
import { locales } from "./locales";
import { localePath, localeFromPath, canonicalUrl } from "./locale-routing";
describe("static multilingual SEO", () => {
  it.each(locales)(
    "renders the $name guide and app without a browser or server",
    ({ code }) => {
      const html = render(code);
      expect(html).toContain(seoCopy[code].heading);
      expect(html).toContain(seoCopy[code].howTitle);
      expect(html).not.toContain("<iframe");
      expect((html.match(/<h1\b/g) || []).length).toBe(1);
      expect(html).toContain("site-guide");
    },
  );
  it.each(locales)(
    "has reciprocal language URLs and truthful schema for $code",
    ({ code }) => {
      const seo = seoData(code);
      expect(seo.url).toBe(canonicalUrl(code));
      expect(seo.alternates.map((x) => x.lang)).toEqual([
        "fr",
        "en",
        "zh-Hans",
        "hi",
        "es",
        "x-default",
      ]);
      expect(seo.schema["@graph"][1]).toMatchObject({
        "@type": "WebApplication",
        url: seo.url,
        isAccessibleForFree: true,
      });
      expect(JSON.stringify(seo.schema)).not.toContain("aggregateRating");
      expect(seo.image).toBe(
        "https://jean-voila.github.io/lofeur/social-preview.jpg",
      );
    },
  );
  it("keeps project paths inside the GitHub Pages base", () => {
    expect(localePath("fr", "/lofeur/")).toBe("/lofeur/");
    expect(localePath("en", "/lofeur/")).toBe("/lofeur/en/");
    expect(localeFromPath("/lofeur/zh/", "/lofeur/")).toBe("zh");
    expect(localeFromPath("/lofeur/", "/lofeur/")).toBe("fr");
    expect(localeFromPath("/hi/", "/")).toBe("hi");
    expect(canonicalUrl("es", "https://example.org/")).toBe(
      "https://example.org/es/",
    );
  });
});
