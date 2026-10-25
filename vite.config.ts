import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// @ts-expect-error Node-only middleware is deliberately kept outside the client bundle.
import { healthEndpoint } from "./server/catalog-health.mjs";
export default defineConfig({
  plugins: [
    react(),
    {
      name: "station-health",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!(await healthEndpoint(req, res))) next();
        });
      },
    },
  ],
  base: "./",
});
