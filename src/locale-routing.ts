import { isLocale, type Locale } from "./locales";
import { siteBase, siteUrl } from "./site";
export const localePath = (locale: Locale, base = siteBase) =>
  `${base}${locale === "fr" ? "" : `${locale}/`}`;
export const canonicalUrl = (locale: Locale, url = siteUrl) =>
  new URL(locale === "fr" ? "" : `${locale}/`, url).href;
export function localeFromPath(path: string, base = siteBase): Locale {
  const relative = path.startsWith(base)
    ? path.slice(base.length)
    : path.replace(/^\//, "");
  const first = relative.split("/")[0];
  return isLocale(first) ? first : "fr";
}
