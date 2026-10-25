export type Station = {
  id: string;
  name: string;
  url: string;
  description: string;
  cover: string;
};
export function youtubeId(input: string): string | null {
  if (/^[\w-]{11}$/.test(input.trim())) return input.trim();
  try {
    const u = new URL(input.trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    const host = u.hostname
      .toLowerCase()
      .replace(/^www\./, "")
      .replace(/^m\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.split("/")[1];
    if (host === "youtube.com" || host === "youtube-nocookie.com")
      id =
        u.searchParams.get("v") ||
        (/^\/(live|embed|shorts)\//.test(u.pathname)
          ? u.pathname.split("/")[2]
          : null);
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
export function load<T>(
  key: string,
  fallback: T,
  valid?: (value: unknown) => boolean,
): T {
  try {
    const raw = localStorage.getItem(`lofeur:${key}`);
    if (!raw) return fallback;
    const value = JSON.parse(raw);
    return !valid || valid(value) ? (value as T) : fallback;
  } catch {
    return fallback;
  }
}
export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(`lofeur:${key}`, JSON.stringify(value));
  } catch {
    /* A private browser may disable storage. */
  }
}
export const isStations = (value: unknown): value is Station[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.length <= 100 &&
  new Set(value.map((s) => s?.id)).size === value.length &&
  value.every(
    (s) =>
      s &&
      typeof s.id === "string" &&
      typeof s.name === "string" &&
      s.name.trim().length > 0 &&
      typeof s.url === "string" &&
      youtubeId(s.url) &&
      typeof s.description === "string" &&
      typeof s.cover === "string",
  );
export const duration = (phase: number, deep: boolean) =>
  (phase % 2 === 1
    ? deep
      ? 50
      : 25
    : phase === 8
      ? deep
        ? 20
        : 15
      : deep
        ? 10
        : 5) * 60;
export function advanceTimer(
  phase: number,
  deadline: number,
  now: number,
  deep: boolean,
) {
  while (now >= deadline) {
    if (phase === 8)
      return {
        phase: 1,
        deadline: null,
        remaining: duration(1, deep),
        complete: true,
      };
    phase += 1;
    deadline += duration(phase, deep) * 1000;
  }
  return {
    phase,
    deadline,
    remaining: Math.ceil((deadline - now) / 1000),
    complete: false,
  };
}
export const sounds = [
  ["rain", "Pluie", "rain", "rain"],
  ["beach", "Plage", "beach", "beach"],
  ["city-day", "Ville · jour", "city_day", "city"],
  ["city-night", "Ville · nuit", "city_night", "city_night"],
  ["desert", "Désert", "desert", "desert"],
  ["forest", "Forêt", "forest", "forest"],
  ["fireplace", "Cheminée", "fireplace", "fireplace"],
  ["park", "Parc", "park", "park"],
  ["plane", "Avion", "plane", "plane"],
  ["bar", "Café", "bar", "bar"],
  ["purr", "Ronronnement", "purrr", "purr"],
  ["white-noise", "Bruit blanc", "white_noise", "white_noise"],
] as const;
export const reference = "https://desk.lofigirl.com";
export const backgrounds = {
  dark: `${reference}/_app/immutable/assets/lofigirl-night-1280.1DsqXEuV.webp`,
  light: `${reference}/_app/immutable/assets/lofigirl-1280.DrnULh5H.webp`,
};
