import { useEffect, useState } from "react";
import defaults from "./catalog";
import type { Station } from "./lib";

type Song = { artist: string; title: string; art: string };
// Metadata is only requested for an unchanged public default. Personal URLs
// must never be paired with a default station's unrelated track information.
export function useNowPlaying(station: Station) {
  const [song, setSong] = useState<Song | null>(null);
  useEffect(() => {
    setSong(null);
    if (
      !defaults.some(
        (s) =>
          s.kind === "live" &&
          s.id === station.id &&
          s.url === station.url &&
          (!station.audioUrl || s.audioUrl === station.audioUrl),
      )
    )
      return;
    const controller = new AbortController();
    let inFlight = false;
    async function refresh() {
      if (document.visibilityState === "hidden" || inFlight) return;
      inFlight = true;
      try {
        for (const host of [
          "radio.lofigirl.com",
          "radio-backup.lofigirl.com",
        ]) {
          try {
            const response = await fetch(
              `https://${host}/api/nowplaying/${encodeURIComponent(station.id === "lofi-girl" ? "asian-lofi" : station.id)}`,
              {
                signal: AbortSignal.any([
                  controller.signal,
                  AbortSignal.timeout(10000),
                ]),
                credentials: "omit",
              },
            );
            if (!response.ok) continue;
            const data = await response.json();
            const next = data?.now_playing?.song;
            if (
              next &&
              typeof next.artist === "string" &&
              typeof next.title === "string" &&
              !controller.signal.aborted
            ) {
              const song = {
                artist: next.artist,
                title: next.title,
                art:
                  typeof next.art === "string" &&
                  next.art.startsWith("https://")
                    ? next.art
                    : "",
              };
              setSong((previous) =>
                previous?.artist === song.artist &&
                previous?.title === song.title &&
                previous?.art === song.art
                  ? previous
                  : song,
              );
              return;
            }
          } catch {
            if (controller.signal.aborted) return;
          }
        }
      } finally {
        inFlight = false;
      }
    }
    void refresh();
    const interval = setInterval(refresh, 30000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      controller.abort();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [station.id, station.url]);
  return song;
}
