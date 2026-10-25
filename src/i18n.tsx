import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { load, save } from "./lib";
import { translations } from "./translations";
export const locales = [
  { code: "fr", name: "Français" },
  { code: "en", name: "English" },
  { code: "zh", name: "中文" },
  { code: "hi", name: "हिन्दी" },
  { code: "es", name: "Español" },
] as const;
export type Locale = (typeof locales)[number]["code"];
export const isLocale = (value: unknown): value is Locale =>
  locales.some((l) => l.code === value);
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
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() =>
    load(
      "language",
      isLocale(navigator.language.slice(0, 2))
        ? (navigator.language.slice(0, 2) as Locale)
        : "en",
      isLocale,
    ),
  );
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
