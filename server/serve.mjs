import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { healthEndpoint } from "./catalog-health.mjs";
const directory = resolve("dist");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".woff2": "font/woff2",
};
createServer(async (req, res) => {
  try {
    if (await healthEndpoint(req, res)) return;
    const path = resolve(
      directory,
      "." + decodeURIComponent(new URL(req.url, "http://local").pathname),
    );
    if (path !== directory && !path.startsWith(directory + sep)) {
      res.writeHead(403).end();
      return;
    }
    const file = (await stat(path)).isDirectory()
      ? resolve(path, "index.html")
      : path;
    const content = await readFile(file);
    res.writeHead(200, {
      "Content-Type": mime[extname(file)] || "application/octet-stream",
      "Cache-Control": file.includes("/assets/")
        ? "public,max-age=31536000,immutable"
        : "no-cache",
    });
    res.end(content);
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(
  Number(process.env.PORT || 4173),
  process.env.HOST || "127.0.0.1",
  () => console.log("lofeur: http://127.0.0.1:" + (process.env.PORT || 4173)),
);
