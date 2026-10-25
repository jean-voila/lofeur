export function videoId(url) {
  try {
    const u = new URL(url);
    return u.hostname === "youtu.be"
      ? u.pathname.slice(1)
      : u.searchParams.get("v") || u.pathname.split("/")[2];
  } catch {
    return null;
  }
}
export function parsePlayer(html) {
  const match = /ytInitialPlayerResponse\s*=\s*/.exec(html);
  if (!match) return null;
  let depth = 0,
    quote = false,
    escaped = false,
    start = match.index + match[0].length;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') quote = false;
    } else if (c === '"') quote = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) {
      try {
        return JSON.parse(html.slice(start, i + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
}
export function playerHealth(player) {
  const status = player?.playabilityStatus;
  if (!status) return { available: null, live: null, reason: "unknown" };
  const reason = status.reason || "";
  if (status.status === "OK" && status.playableInEmbed !== false)
    return {
      available: true,
      live:
        player.microformat?.playerMicroformatRenderer?.liveBroadcastDetails
          ?.isLiveNow === true,
      reason: "",
    };
  if (status.playableInEmbed === false)
    return { available: false, live: false, reason: "embedding-disabled" };
  if (["UNPLAYABLE", "ERROR", "LIVE_STREAM_OFFLINE"].includes(status.status))
    return { available: false, live: false, reason: "unavailable" };
  if (status.status === "LOGIN_REQUIRED" && /age|private/i.test(reason))
    return { available: false, live: false, reason: "restricted" };
  return { available: null, live: null, reason: "verification-blocked" };
}
async function limitedText(response) {
  if (!response.body) return "";
  const reader = response.body.getReader(),
    decoder = new TextDecoder();
  let text = "",
    bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > 3_000_000) break;
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  return text;
}
export async function probeStation(station) {
  let youtube = { available: null, live: null, reason: "network" };
  try {
    const response = await fetch(
      `https://www.youtube.com/watch?v=${videoId(station.url)}&hl=en`,
      {
        signal: AbortSignal.timeout(12000),
        headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "en" },
      },
    );
    if (response.ok)
      youtube = playerHealth(parsePlayer(await limitedText(response)));
  } catch {}
  let audio = { available: null, url: station.audioUrl || null };
  if (station.audioUrl?.startsWith("https://radio.lofigirl.com/listen/")) {
    try {
      const response = await fetch(station.audioUrl, {
        signal: AbortSignal.timeout(5000),
        headers: { Range: "bytes=0-0" },
      });
      audio.available = response.ok;
      await response.body?.cancel();
    } catch {}
  }
  return { youtube, audio, checkedAt: Date.now() };
}
export async function auditCatalog(stations, previous = {}) {
  const entries = { ...previous };
  let index = 0;
  // At most two small public metadata responses in memory. Never launch players.
  async function worker() {
    while (index < stations.length) {
      const station = stations[index++];
      const id = videoId(station.url);
      const next = await probeStation(station);
      const old = previous[id];
      if (
        next.youtube.available === null &&
        old?.youtube?.available !== undefined
      )
        next.youtube = { ...old.youtube, reason: "last-known" };
      if (next.audio.available === null && next.audio.url === old?.audio?.url)
        next.audio = { ...old.audio };
      entries[id] = next;
    }
  }
  await Promise.all([worker(), worker()]);
  return { version: 1, checkedAt: Date.now(), entries };
}
