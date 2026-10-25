export type Player = {
  playVideo(): void;
  pauseVideo(): void;
  loadVideoById(id: string): void;
  cueVideoById(id: string): void;
  setVolume(volume: number): void;
  mute(): void;
  unMute(): void;
  destroy(): void;
  getVideoData(): { title?: string; author?: string };
};
type Options = {
  videoId: string;
  playerVars: Record<string, string | number>;
  events: {
    onReady(e: { target: Player }): void;
    onStateChange(e: { data: number; target: Player }): void;
    onError(e: { data: number }): void;
    onAutoplayBlocked(): void;
  };
};
declare global {
  interface Window {
    YT?: { Player: new (element: HTMLElement, options: Options) => Player };
    onYouTubeIframeAPIReady?: () => void;
  }
}
let promise: Promise<NonNullable<Window["YT"]>> | null = null;
export function youtube() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (promise) return promise;
  promise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const fail = () => {
      clearTimeout(timeout);
      script.remove();
      promise = null;
      reject(
        new Error(
          "Le lecteur YouTube est indisponible. Vérifiez votre connexion ou votre bloqueur de contenu.",
        ),
      );
    };
    const timeout = setTimeout(fail, 15000);
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timeout);
      if (window.YT) resolve(window.YT);
      else fail();
    };
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = fail;
    document.head.append(script);
  });
  return promise;
}
