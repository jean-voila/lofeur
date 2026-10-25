import repairs from "./catalog-repairs.json";
import { useCallback, useEffect, useState } from "react";
import { audioSource, youtubeId, type Station } from "./lib";
export type Probe = {
  available: boolean | null;
  live?: boolean | null;
  reason?: string;
  url?: string | null;
};
export type Health = { youtube: Probe; audio: Probe; checkedAt: number };
export type HealthMap = Record<string, Health>;
export function stationState(
  station: Station,
  video: boolean,
  health: HealthMap,
  failed = false,
) {
  const entry = health[youtubeId(station.url)!];
  const stream = audioSource(station);
  const audioMatches = stream && entry?.audio?.url === stream;
  const unavailable =
    failed ||
    (video
      ? entry?.youtube?.available === false
      : audioMatches
        ? entry.audio.available === false
        : !stream && entry?.youtube?.available === false);
  const live =
    video || !stream ? (entry?.youtube?.live ?? station.kind === "live") : true;
  return {
    unavailable,
    live,
    requiresVideo: !video && !stream && !unavailable,
  };
}
export function sortStations(
  stations: Station[],
  video: boolean,
  health: HealthMap,
  favorites: string[],
  failed: (station: Station) => boolean = () => false,
) {
  const rank = (s: Station) => {
    const state = stationState(s, video, health, failed(s));
    return state.unavailable ? 2 : state.live ? 0 : 1;
  };
  return [...stations].sort(
    (a, b) =>
      rank(a) - rank(b) ||
      Number(favorites.includes(b.id)) - Number(favorites.includes(a.id)),
  );
}
export function useStationHealth() {
  const [health, setHealth] = useState<HealthMap>({});
  const [failures, setFailures] = useState<Record<string, number>>({});
  const [revision, setRevision] = useState(0);
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let disposed = false;
    async function refresh() {
      if (disposed) return;
      if (document.hidden) {
        timer = setTimeout(refresh, 60000);
        return;
      }
      try {
        let response = await fetch(
          "/api/station-health" + (revision ? "?refresh=1" : ""),
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );
        // Static hosts still receive the last audited snapshot, never a fake green status.
        if (
          !response.ok ||
          !response.headers.get("content-type")?.includes("application/json")
        )
          response = await fetch("/station-health.json", {
            signal: controller.signal,
            cache: "no-store",
          });
        if (response.ok) {
          const data = await response.json();
          if (disposed) return;
          if (data.version === 1 && data.entries) {
            setHealth(data.entries);
            setChecking(!!data.checking);
            timer = setTimeout(refresh, data.checking ? 10000 : 60000);
            return;
          }
        }
      } catch {}
      if (!disposed) timer = setTimeout(refresh, 60000);
    }
    void refresh();
    return () => {
      disposed = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [revision]);
  // Failures expire so temporary outages can recover. A playback failure is scoped
  // to the exact URL and mode, not a station's editable name or a different source.
  const key = (s: Station, video: boolean) =>
    `${video ? "video" : "audio"}:${video ? s.url : audioSource(s) || s.url}`;
  const mark = useCallback(
    (s: Station, video: boolean, failed: boolean) =>
      setFailures((old) => {
        const id = key(s, video);
        if (!failed && !old[id]) return old;
        return { ...old, [id]: failed ? Date.now() : 0 };
      }),
    [],
  );
  const failed = (s: Station, video: boolean) =>
    Date.now() - (failures[key(s, video)] || 0) < 5 * 60 * 1000;
  return {
    health,
    checking,
    mark,
    failed,
    refresh: () => {
      setFailures({});
      setRevision((x) => x + 1);
    },
  };
}
export function migrateCatalog(saved: Station[], catalog: Station[]) {
  const aliases = repairs as Record<string, { stationId: string; url: string }>;
  const updated = saved.map((s) => {
    let url = s.url;
    const visited = new Set<string>();
    while (aliases[url]?.stationId === s.id && !visited.has(url)) {
      visited.add(url);
      url = aliases[url].url;
    }
    return url === s.url ? s : { ...s, url, kind: "live" as const };
  });
  const ids = new Set(updated.map((s) => youtubeId(s.url)));
  // Only append the newly requested playlist. Never restore a user-deleted radio
  // or overwrite custom names, sources, covers, or descriptions.
  for (const s of catalog)
    if (updated.length < 250 && s.playlist && !ids.has(youtubeId(s.url))) {
      updated.push(s);
      ids.add(youtubeId(s.url));
    }
  return updated.length === saved.length &&
    updated.every((s, i) => s === saved[i])
    ? saved
    : updated;
}
