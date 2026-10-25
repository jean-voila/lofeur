import { readFile, writeFile } from "node:fs/promises";
import { auditCatalog } from "../server/catalog-health.mjs";
const root = new URL("../", import.meta.url);
const stations = JSON.parse(
  await readFile(new URL("src/stations.json", root), "utf8"),
);
const result = await auditCatalog(stations);
await writeFile(
  new URL("public/station-health.json", root),
  JSON.stringify(result, null, 2) + "\n",
);
for (const station of stations) {
  const h = result.entries[new URL(station.url).searchParams.get("v")];
  console.log(
    `${h.youtube.available === true ? "OK" : h.youtube.available === false ? "UNAVAILABLE" : "UNKNOWN"} ${station.name}`,
  );
}
