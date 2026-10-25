import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { save } from "./lib";
import { translations } from "./translations";
import { locales, isLocale, type Locale } from "./locales";
import { localeFromPath, localePath } from "./locale-routing";
export { locales, isLocale } from "./locales";
export type { Locale } from "./locales";
export function translate(
  locale: Locale,
  source: string,
  values: Record<string, string | number> = {},
) {
  const index = ["en", "es", "zh", "hi"].indexOf(locale);
  const text = index < 0 ? source : translations[source]?.[index] || source;
  return text.replace(/\{(\w+)\}/g, (match, key) =>
    String(values[key] ?? match),
  );
}
const Context = createContext<{
  locale: Locale;
  setLocale(locale: Locale): void;
  t: (source: string, values?: Record<string, string | number>) => string;
} | null>(null);
export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, updateLocale] = useState<Locale>(
    initialLocale ||
      (typeof location !== "undefined"
        ? localeFromPath(location.pathname)
        : "fr"),
  );
  const setLocale = useCallback((next: Locale) => {
    if (!isLocale(next)) return;
    updateLocale(next);
    if (typeof window !== "undefined" && location.pathname !== localePath(next))
      window.history.pushState(null, "", localePath(next));
  }, []);
  useEffect(() => {
    const pop = () => updateLocale(localeFromPath(location.pathname));
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  useEffect(() => {
    save("language", locale);
    document.documentElement.lang = locale === "zh" ? "zh-Hans" : locale;
    document.documentElement.dataset.locale = locale;
  }, [locale]);
  const t = useCallback(
    (source: string, values?: Record<string, string | number>) =>
      translate(locale, source, values),
    [locale],
  );
  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useI18n() {
  const value = useContext(Context);
  if (!value) throw new Error("Missing LanguageProvider");
  return value;
}
