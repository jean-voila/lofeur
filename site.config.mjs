export const DEFAULT_SITE_URL = "https://jean-voila.github.io/lofeur/";
export function siteConfig(env = process.env) {
  const url = new URL(env.SITE_URL || DEFAULT_SITE_URL);
  if (
    url.protocol !== "https:" ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  )
    throw new Error(
      "SITE_URL must be a public HTTPS URL without query, fragment or credentials.",
    );
  if (!url.pathname.endsWith("/")) url.pathname += "/";
  return { url: url.href, base: url.pathname };
}
