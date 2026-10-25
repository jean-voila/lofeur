import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { auditCatalog, videoId } from "../maintenance/catalog-health.mjs";
const root = new URL("../", import.meta.url);
const source = new URL("src/stations.json", root);
let stations = JSON.parse(await readFile(source, "utf8"));
const extract = (url) =>
  JSON.parse(
    execFileSync(
      "yt-dlp",
      ["--flat-playlist", "--dump-single-json", "--no-warnings", url],
      { encoding: "utf8", maxBuffer: 15_000_000, timeout: 90000 },
    ),
  );
const channel = "UCSJ4gkVC6NrvII8umztf0Ow";
const playlist = extract(
  "https://www.youtube.com/playlist?list=PL6NdkXsPL07KN01gH2vucrHCEyyNmVEx4",
);
if (playlist.channel_id !== channel)
  throw new Error("Unexpected playlist owner; catalog left untouched.");
const ids = new Set(stations.map((s) => videoId(s.url)));
for (const item of playlist.entries || []) {
  if (
    !/^[\w-]{11}$/.test(item.id) ||
    ids.has(item.id) ||
    ["is_live", "is_upcoming"].includes(item.live_status)
  )
    continue;
  stations.push({
    id: `mix-${item.id}`,
    name: item.title,
    url: `https://www.youtube.com/watch?v=${item.id}`,
    description: "Lofi Girl · Compilations & Mixes",
    cover: `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`,
    kind: "video",
    duration: Math.max(0, Number(item.duration) || 0),
    playlist: playlist.id,
  });
  ids.add(item.id);
}
if (stations.length > 250)
  throw new Error("Catalog exceeded the explicit 250-entry limit.");
let previous = {};
try {
  previous = JSON.parse(
    await readFile(new URL("public/station-health.json", root), "utf8"),
  ).entries;
} catch {}
let health = await auditCatalog(stations, previous);
const radios = extract("https://www.youtube.com/@LofiGirl/streams");
if (radios.channel_id !== channel)
  throw new Error("Unexpected channel owner; catalog left untouched.");
const matchers = {
  lofi: /^lofi hip hop radio 📚/i,
  synthwave: /^synthwave radio/i,
  "halloween-lofi": /^24\/7 halloween ambience/i,
  "lofi-sleep": /^sleep lofi radio/i,
  "jazz-lofi": /^jazz lofi radio/i,
  "lofi-girl": /^asian lofi radio/i,
  "dark-ambient": /^dark ambient radio/i,
  "sleep-ambient": /^24\/7 deep sleep music/i,
  "peaceful-piano": /^relaxing piano radio/i,
  medieval: /^medieval lofi radio/i,
  "summer-restful-holidays": /^summer lofi radio/i,
  "relaxing-jazz": /^relaxing jazz music/i,
  "classical-lofi": /^classical music radio/i,
  "synth-ambient": /^synth ambient radio/i,
  "chill-guitar": /^chill guitar radio/i,
  "bossa-lofi": /^bossa lofi radio/i,
  "sad-lofi": /^sad lofi radio/i,
  "christmas-lofi": /^christmas lofi music/i,
};
let repairs = {};
try {
  repairs = JSON.parse(
    await readFile(new URL("src/catalog-repairs.json", root), "utf8"),
  );
} catch {}
for (const s of stations) {
  if (
    s.kind !== "live" ||
    health.entries[videoId(s.url)]?.youtube.available !== false ||
    !matchers[s.id]
  )
    continue;
  const matches = (radios.entries || []).filter(
    (r) => r.live_status === "is_live" && matchers[s.id].test(r.title || ""),
  );
  if (matches.length !== 1) continue;
  const replacement = {
    ...s,
    url: `https://www.youtube.com/watch?v=${matches[0].id}`,
  };
  const verified = await auditCatalog([replacement]);
  if (
    verified.entries[matches[0].id]?.youtube.available === true &&
    verified.entries[matches[0].id]?.youtube.live === true
  ) {
    repairs[s.url] = { stationId: s.id, url: replacement.url };
    s.url = replacement.url;
    Object.assign(health.entries, verified.entries);
  }
}
await writeFile(source, JSON.stringify(stations, null, 2) + "\n");
await writeFile(
  new URL("src/catalog-repairs.json", root),
  JSON.stringify(repairs, null, 2) + "\n",
);
health.checkedAt = Date.now();
await writeFile(
  new URL("public/station-health.json", root),
  JSON.stringify(health, null, 2) + "\n",
);
console.log(
  `${stations.length} sources audited; ${Object.keys(repairs).length} known repairs.`,
);
