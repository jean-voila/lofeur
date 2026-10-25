export const siteUrl =
  import.meta.env.VITE_SITE_URL || "https://jean-voila.github.io/lofeur/";
export const siteBase = import.meta.env.BASE_URL || "/";
export const assetUrl = (path: string) =>
  `${siteBase}${path.replace(/^\/+/, "")}`;
