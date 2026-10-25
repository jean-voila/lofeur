import { useEffect, useRef, useState } from "react";
import { audioSource, youtubeId, type Station } from "./lib";
import type { Player } from "./youtube";

export function useRadio(
  station: Station,
  video: boolean,
  consent: boolean,
  volume: number,
  muted: boolean,
) {
  const [requested, setRequested] = useState(false);
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState({
    playing: false,
    loading: false,
    error: "",
    unavailable: false,
    title: "",
  });
  const host = useRef<HTMLDivElement>(null);
  const live = useRef({ volume, muted });
  live.current = { volume, muted };
  const media = useRef<HTMLAudioElement | Player | null>(null);
  const stream = audioSource(station);
  useEffect(() => {
    setState({
      playing: false,
      loading: requested,
      error: "",
      unavailable: false,
      title: "",
    });
    if (!requested || (video && !consent)) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    let disposed = false;
    let owned: HTMLAudioElement | Player | null = null;
    const pendingHost = host.current;
    let timeout: ReturnType<typeof setTimeout>;
    const update = (next: Partial<typeof state>) => {
      if (!disposed) setState((s) => ({ ...s, ...next }));
    };
    const fail = (message: string, unavailable = false) => {
      clearTimeout(timeout);
      update({ playing: false, loading: false, error: message, unavailable });
    };
    timeout = setTimeout(
      () =>
        fail(
          "Le lecteur ne répond pas. Réessayez ou ouvrez la station sur YouTube.",
        ),
      20000,
    );
    if (!video) {
      if (!stream)
        fail(
          "Ajoutez un flux audio direct à cette station ou activez la vidéo YouTube.",
        );
      else {
        const audio = new Audio();
        owned = audio;
        media.current = audio;
        audio.preload = "none";
        audio.volume = live.current.muted ? 0 : live.current.volume / 100;
        audio.onplaying = () => {
          clearTimeout(timeout);
          update({ playing: true, loading: false, error: "" });
        };
        audio.onwaiting = () => update({ loading: true });
        audio.onerror = () =>
          fail(
            "Le flux audio est indisponible. Réessayez ou activez la vidéo.",
            true,
          );
        audio.onended = () =>
          station.kind === "video"
            ? setRequested(false)
            : fail(
                "Le flux audio est indisponible. Réessayez ou activez la vidéo.",
                true,
              );
        audio.src = stream;
        void audio
          .play()
          .catch((error) =>
            fail(
              error?.name === "NotAllowedError"
                ? "La lecture a été bloquée. Réessayez avec le bouton lecture."
                : "Le flux audio est indisponible. Réessayez ou activez la vidéo.",
              error?.name !== "NotAllowedError",
            ),
          );
      }
    } else if (pendingHost) {
      const mount = document.createElement("div");
      pendingHost.replaceChildren(mount);
      // This module and the YouTube iframe are never loaded in audio-only mode.
      void import("./youtube")
        .then(({ youtube }) => youtube())
        .then((YT) => {
          if (disposed) return;
          owned = new YT.Player(mount, {
            videoId: youtubeId(station.url)!,
            playerVars: {
              origin: location.origin,
              playsinline: 1,
              controls: 0,
              rel: 0,
              autoplay: 1,
            },
            events: {
              onReady: (e) => {
                if (disposed) return;
                media.current = e.target;
                e.target.setVolume(live.current.volume);
                if (live.current.muted) e.target.mute();
                e.target.playVideo();
              },
              onStateChange: (e) => {
                if (disposed) return;
                if (e.data === 1) clearTimeout(timeout);
                update({
                  playing: e.data === 1,
                  loading: e.data === 3,
                  ...(e.data === 1
                    ? { error: "", title: e.target.getVideoData()?.title || "" }
                    : {}),
                });
              },
              onError: (event) =>
                fail(
                  "Cette station est indisponible. Son direct a peut-être changé : vous pouvez modifier son URL.",
                  [100, 101, 150].includes(event.data),
                ),
              onAutoplayBlocked: () =>
                fail(
                  "La lecture a été bloquée. Réessayez avec le bouton lecture.",
                ),
            },
          });
        })
        .catch(() =>
          fail(
            "Le lecteur YouTube est indisponible. Vérifiez votre connexion ou votre bloqueur de contenu.",
          ),
        );
    }
    return () => {
      disposed = true;
      clearTimeout(timeout);
      media.current = null;
      if (owned instanceof HTMLAudioElement) {
        owned.onplaying =
          owned.onwaiting =
          owned.onerror =
          owned.onended =
            null;
        owned.pause();
        owned.removeAttribute("src");
        owned.load();
      } else owned?.destroy();
      pendingHost?.replaceChildren();
    };
  }, [requested, video, consent, station.url, stream, retry]);
  useEffect(() => {
    const target = media.current;
    if (target instanceof HTMLAudioElement)
      target.volume = muted ? 0 : volume / 100;
    else if (target) {
      target.setVolume(volume);
      if (muted) target.mute();
      else target.unMute();
    }
  }, [volume, muted]);
  return {
    ...state,
    requested,
    host,
    stream,
    play: () => {
      setRetry((n) => n + 1);
      setRequested(true);
    },
    pause: () => setRequested(false),
  };
}
