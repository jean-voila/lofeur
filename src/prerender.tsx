import { renderToString } from "react-dom/server";
import Site from "./DesktopSite";
import { LanguageProvider } from "./i18n";
import type { Locale } from "./locales";
export { seoData } from "./seo";
export { locales } from "./locales";
export function render(locale: Locale) {
  return renderToString(
    <LanguageProvider initialLocale={locale}>
      <Site />
    </LanguageProvider>,
  );
}
