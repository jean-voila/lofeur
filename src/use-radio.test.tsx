// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRadio } from "./use-radio";
import type { Station } from "./lib";
import defaults from "./catalog";

const fake = vi.hoisted(() => ({ destroy: vi.fn(), loader: vi.fn() }));
vi.mock("./youtube", () => ({
  youtube: async () => {
    fake.loader();
    return {
      Player: class {
        frame: HTMLIFrameElement;
        constructor(
          element: HTMLElement,
          options: {
            events: {
              onReady(event: unknown): void;
              onStateChange(event: unknown): void;
            };
          },
        ) {
          this.frame = document.createElement("iframe");
          this.frame.srcdoc = "<p>Test player</p>";
          element.replaceWith(this.frame);
          queueMicrotask(() => {
            options.events.onReady({ target: this });
            options.events.onStateChange({ data: 1, target: this });
          });
        }
        playVideo() {}
        setVolume() {}
        mute() {}
        unMute() {}
        getVideoData() {
          return { title: "Test station" };
        }
        destroy() {
          this.frame.remove();
          fake.destroy();
        }
      },
    };
  },
}));
let controls: ReturnType<typeof useRadio>;
let root: Root, container: HTMLDivElement;
let played: HTMLMediaElement[];
function Harness({
  video,
  station = defaults[0],
}: {
  video: boolean;
  station?: Station;
}) {
  controls = useRadio(station, video, true, 50, false);
  return <div ref={controls.host} />;
}
beforeEach(() => {
  // React's act flag is a test-environment setting, never shipped to the app.
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  played = [];
  fake.destroy.mockReset();
  fake.loader.mockReset();
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    played.push(this);
    this.dispatchEvent(new Event("playing"));
    return Promise.resolve();
  });
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});
async function render(video: boolean, station: Station = defaults[0]) {
  await act(async () => {
    root.render(<Harness video={video} station={station} />);
  });
}
describe("media resource lifecycle", () => {
  it("does not load any player before an explicit play action", async () => {
    await render(false);
    expect(played).toHaveLength(0);
    expect(fake.loader).not.toHaveBeenCalled();
    expect(document.querySelector("iframe")).toBeNull();
  });
  it("streams audio without importing or creating a YouTube player", async () => {
    await render(false);
    await act(async () => controls.play());
    expect(played).toHaveLength(1);
    expect(controls.playing).toBe(true);
    expect(fake.loader).not.toHaveBeenCalled();
    expect(document.querySelector("iframe")).toBeNull();
  });
  it("destroys the iframe and releases the old source on each mode transition", async () => {
    await render(false);
    await act(async () => controls.play());
    const audio = played[0];
    await render(true);
    expect(audio.hasAttribute("src")).toBe(false);
    expect(audio.load).toHaveBeenCalled();
    expect(document.querySelectorAll("iframe")).toHaveLength(1);
    await render(false);
    expect(fake.destroy).toHaveBeenCalledOnce();
    expect(document.querySelector("iframe")).toBeNull();
    expect(played).toHaveLength(2);
    expect(controls.playing).toBe(true);
    await act(async () => controls.pause());
    expect(played[1].hasAttribute("src")).toBe(false);
  });
  it("reports source failures without confusing autoplay restrictions", async () => {
    await render(false);
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(
      new DOMException("Bad media", "NotSupportedError"),
    );
    await act(async () => controls.play());
    expect(controls.unavailable).toBe(true);
    await act(async () => controls.pause());
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(
      new DOMException("Gesture needed", "NotAllowedError"),
    );
    await act(async () => controls.play());
    expect(controls.unavailable).toBe(false);
  });
  it("shows an actionable error for a custom YouTube URL without an audio stream", async () => {
    const station = {
      ...defaults[0],
      id: "custom",
      url: defaults[1].url,
      audioUrl: "",
    };
    await render(false, station);
    await act(async () => controls.play());
    expect(controls.error).toContain("flux audio direct");
    expect(played).toHaveLength(0);
    expect(fake.loader).not.toHaveBeenCalled();
  });
});
