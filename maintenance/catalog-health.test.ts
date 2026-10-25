import { describe, expect, it } from "vitest";
import { parsePlayer, playerHealth } from "./catalog-health.mjs";
describe("public YouTube playability checks", () => {
  it("detects an ended and unavailable stream even when its oEmbed still exists", () => {
    expect(
      playerHealth({
        playabilityStatus: {
          status: "UNPLAYABLE",
          reason: "This live stream recording is not available.",
          playableInEmbed: true,
        },
      }).available,
    ).toBe(false);
  });
  it("separates an active live from a playable recording", () => {
    const ok = { playabilityStatus: { status: "OK", playableInEmbed: true } };
    expect(playerHealth(ok)).toMatchObject({ available: true, live: false });
    expect(
      playerHealth({
        ...ok,
        microformat: {
          playerMicroformatRenderer: {
            liveBroadcastDetails: { isLiveNow: true },
          },
        },
      }),
    ).toMatchObject({ available: true, live: true });
  });
  it("does not grey every station when YouTube blocks a verification request", () => {
    expect(
      playerHealth({
        playabilityStatus: {
          status: "LOGIN_REQUIRED",
          reason: "Sign in to confirm you're not a bot",
        },
      }).available,
    ).toBeNull();
    expect(playerHealth(null).available).toBeNull();
  });
  it("rejects embedding restrictions and upcoming or offline lives", () => {
    expect(
      playerHealth({
        playabilityStatus: { status: "OK", playableInEmbed: false },
      }).available,
    ).toBe(false);
    expect(
      playerHealth({ playabilityStatus: { status: "LIVE_STREAM_OFFLINE" } })
        .available,
    ).toBe(false);
  });
  it("parses braces and escaped quotes inside player metadata without executing scripts", () => {
    const data = {
      playabilityStatus: { status: "OK" },
      videoDetails: { title: 'a { title } "test"' },
    };
    expect(
      parsePlayer(
        "<script>var ytInitialPlayerResponse = " +
          JSON.stringify(data) +
          ";doNotExecute()</script>",
      ),
    ).toEqual(data);
    expect(parsePlayer("not a player")).toBeNull();
  });
});
