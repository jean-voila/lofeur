import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
// @ts-expect-error Shared build configuration is native ESM, without client dependencies.
import { siteConfig } from "./site.config.mjs";
export default defineConfig(({ command, isPreview, mode }) => {
  const site = siteConfig({
    ...loadEnv(mode, process.cwd(), ""),
    ...process.env,
  });
  return {
    plugins: [react()],
    base: command === "serve" && !isPreview ? "/" : site.base,
    define: { "import.meta.env.VITE_SITE_URL": JSON.stringify(site.url) },
    build: { manifest: true },
  };
});
