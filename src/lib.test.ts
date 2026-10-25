import { describe, expect, it } from "vitest";
import { advanceTimer, duration, isStations, youtubeId } from "./lib";
import stations from "./catalog";
describe("YouTube URL handling", () => {
  it.each([
    "https://www.youtube.com/watch?v=rFZHOHl-L8A&list=test",
    "https://youtu.be/rFZHOHl-L8A?t=20",
    "https://youtube.com/live/rFZHOHl-L8A",
    "https://m.youtube.com/watch?v=rFZHOHl-L8A",
    "https://www.youtube-nocookie.com/embed/rFZHOHl-L8A",
    "rFZHOHl-L8A",
  ])("accepts %s", (url) => expect(youtubeId(url)).toBe("rFZHOHl-L8A"));
  it.each([
    "https://youtube.com.evil.test/watch?v=rFZHOHl-L8A",
    "javascript:alert(1)",
    "https://example.com/watch?v=rFZHOHl-L8A",
    "https://youtu.be/bad",
    "not a link",
    "https://youtube.com/@LofiGirl",
  ])("rejects %s", (url) => expect(youtubeId(url)).toBeNull());
});
describe("station imports", () => {
  it("accepts all default radios and mixes", () => {
    expect(stations.length).toBeGreaterThanOrEqual(92);
    expect(isStations(stations)).toBe(true);
  });
  it("rejects empty lists, duplicate IDs, invalid URLs and missing fields", () => {
    for (const value of [
      [],
      [stations[0], stations[0]],
      [{ ...stations[0], url: "https://evil.test" }],
      [{ ...stations[0], name: "  " }],
      [{ id: "x" }],
      null,
    ])
      expect(isStations(value)).toBe(false);
  });
});
describe("Pomodoro timekeeping", () => {
  it("uses short and long breaks at the right phases", () => {
    expect(duration(1, false)).toBe(1500);
    expect(duration(2, false)).toBe(300);
    expect(duration(8, false)).toBe(900);
    expect(duration(1, true)).toBe(3000);
    expect(duration(8, true)).toBe(1200);
  });
  it("catches up across multiple phases after an inactive tab wakes", () => {
    const now = 1_000_000;
    expect(advanceTimer(1, now - 301_000, now, false)).toEqual({
      phase: 3,
      deadline: now + 1_499_000,
      remaining: 1499,
      complete: false,
    });
  });
  it("handles an exact boundary and rounds up partial seconds", () => {
    expect(advanceTimer(1, 1000, 1000, false).phase).toBe(2);
    expect(advanceTimer(1, 2000, 1001, false).remaining).toBe(1);
  });
  it("finishes the eighth phase without restarting another session", () =>
    expect(advanceTimer(8, 1000, 5000, false)).toEqual({
      phase: 1,
      deadline: null,
      remaining: 1500,
      complete: true,
    }));
});
