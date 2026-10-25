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
