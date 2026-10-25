import { seoCopy } from "./seo-content";
import { canonicalUrl } from "./locale-routing";
import { locales, type Locale } from "./locales";
import { siteUrl } from "./site";
export function seoData(locale: Locale, origin = siteUrl) {
  const copy = seoCopy[locale],
    url = canonicalUrl(locale, origin),
    lang = locale === "zh" ? "zh-Hans" : locale;
  return {
    ...copy,
    url,
    lang,
    image: new URL("social-preview.jpg", origin).href,
    alternates: [
      ...locales.map((l) => ({
        lang: l.code === "zh" ? "zh-Hans" : l.code,
        url: canonicalUrl(l.code, origin),
      })),
      { lang: "x-default", url: canonicalUrl("fr", origin) },
    ],
    schema: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": `${origin}#website`,
          url: origin,
          name: "lofeur",
          inLanguage: locales.map((l) =>
            l.code === "zh" ? "zh-Hans" : l.code,
          ),
        },
        {
          "@type": "WebApplication",
          "@id": `${url}#app`,
          url,
          name: "lofeur",
          description: copy.description,
          inLanguage: lang,
          applicationCategory: "MultimediaApplication",
          operatingSystem: "Any",
          isAccessibleForFree: true,
          offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
          image: new URL("social-preview.jpg", origin).href,
          isPartOf: { "@id": `${origin}#website` },
        },
      ],
    },
  };
}
export function applySeo(locale: Locale) {
  const data = seoData(locale);
  document.documentElement.lang = data.lang;
  document.title = data.title;
  const meta = (selector: string, value: string) => {
    document.head.querySelector(selector)?.setAttribute("content", value);
  };
  meta('meta[name="description"]', data.description);
  meta('meta[property="og:title"]', data.title);
  meta('meta[property="og:description"]', data.description);
  meta('meta[property="og:url"]', data.url);
  meta(
    'meta[property="og:locale"]',
    locale === "zh"
      ? "zh_CN"
      : (
          { fr: "fr_FR", en: "en_US", es: "es_ES", hi: "hi_IN" } as Record<
            string,
            string
          >
        )[locale],
  );
  meta('meta[name="twitter:title"]', data.title);
  meta('meta[name="twitter:description"]', data.description);
  document.head
    .querySelector('link[rel="canonical"]')
    ?.setAttribute("href", data.url);
  const schema = document.getElementById("site-schema");
  if (schema) schema.textContent = JSON.stringify(data.schema);
}
