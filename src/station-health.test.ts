import { describe, expect, it } from "vitest";
import {
  migrateCatalog,
  sortStations,
  stationState,
  type HealthMap,
} from "./station-health";
import catalog from "./catalog";
import type { Station } from "./lib";
const live = catalog.find((s) => s.id === "lofi")!;
const video = catalog.find((s) => s.kind === "video")!;
const dead: Station = {
  ...live,
  id: "dead",
  url: "https://www.youtube.com/watch?v=12345678901",
};
const health: HealthMap = {
  rFZHOHlL8AA: {
    youtube: { available: true, live: true },
    audio: { available: true, url: live.audioUrl },
    checkedAt: 1,
  },
  "12345678901": {
    youtube: { available: false, live: false },
    audio: { available: false, url: dead.audioUrl },
    checkedAt: 1,
  },
};
describe("station availability and order", () => {
  it("ranks live, recordings, then unavailable regardless of favorites", () => {
    expect(
      sortStations([dead, video, live], true, health, [dead.id, video.id]).map(
        (s) => s.id,
      ),
    ).toEqual([live.id, video.id, dead.id]);
  });
  it("treats audio and YouTube availability independently", () => {
    const h: HealthMap = { rFZHOHlL8AA: health.rFZHOHlL8AA };
    h["rFZHOHl-L8A"] = {
      youtube: { available: false, live: false },
      audio: { available: true, url: live.audioUrl },
      checkedAt: 1,
    };
    expect(stationState(live, true, h).unavailable).toBe(true);
    expect(stationState(live, false, h).unavailable).toBe(false);
  });
  it("does not call a playable recording unavailable just because video is off", () => {
    expect(stationState(video, false, {}).requiresVideo).toBe(true);
    expect(stationState(video, false, {}).unavailable).toBeFalsy();
    expect(stationState(video, false, {}).live).toBe(false);
  });
  it("moves a playback failure to the bottom without changing the catalog", () => {
    expect(
      sortStations([live, video], true, {}, [], (s) => s.id === live.id).map(
        (s) => s.id,
      ),
    ).toEqual([video.id, live.id]);
    expect(live.kind).toBe("live");
  });
  it("does not trust an old audio check for a different personal audio URL", () => {
    const s = { ...live, audioUrl: "https://example.org/personal.mp3" };
    const h: HealthMap = {
      "rFZHOHl-L8A": {
        youtube: { available: true },
        audio: { available: false, url: live.audioUrl },
        checkedAt: 1,
      },
    };
    expect(stationState(s, false, h).unavailable).toBeFalsy();
  });
  it("repairs only the recognized old Halloween URL and preserves user edits and deletions", () => {
    const halloween = {
      ...catalog.find((s) => s.id === "halloween-lofi")!,
      name: "My name",
      url: "https://www.youtube.com/watch?v=1-LpQekNa9g",
    };
    const custom = { ...halloween, id: "personal", url: video.url };
    const result = migrateCatalog([halloween, custom], catalog);
    expect(result[0].url).toContain("0sfDth4lMLc");
    expect(result[0].name).toBe("My name");
    expect(result[1]).toEqual(custom);
    expect(result.some((s) => s.id === "lofi")).toBe(false);
    expect(result.filter((s) => s.url === video.url)).toHaveLength(1);
    expect(migrateCatalog(result, catalog)).toEqual(result);
  });
  it("validates the full official playlist snapshot without duplicate IDs", () => {
    expect(catalog.filter((s) => s.kind === "live")).toHaveLength(18);
    expect(
      catalog.filter((s) => s.playlist === "PL6NdkXsPL07KN01gH2vucrHCEyyNmVEx4")
        .length,
    ).toBeGreaterThanOrEqual(74);
    expect(new Set(catalog.map((s) => s.id)).size).toBe(catalog.length);
  });
});
