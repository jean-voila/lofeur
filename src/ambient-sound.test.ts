import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AmbientSound } from "./ambient-sound";
import { sounds, reference } from "./lib";

class Voice extends EventTarget {
  static instances: Voice[] = [];
  duration = 15;
  currentTime = 0;
  readyState = 4;
  volume = 1;
  loop = false;
  preload = "";
  play = vi.fn(() => Promise.resolve());
  pause = vi.fn();
  load = vi.fn();
  removeAttribute = vi.fn();
  constructor(public src: string) {
    super();
    Voice.instances.push(this);
  }
}

let sound: AmbientSound;
let failure: ReturnType<typeof vi.fn<() => void>>;
const update = async (voice: Voice, time: number) => {
  voice.currentTime = time;
  voice.dispatchEvent(new Event("timeupdate"));
  await Promise.resolve();
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("Audio", Voice);
  Voice.instances = [];
  failure = vi.fn();
});
afterEach(() => {
  sound?.stop();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("continuous ambient playback", () => {
  it.each(sounds)("preloads and overlaps %s before the recording ends", async (_id, _label, file) => {
    const url = `${reference}/sounds/soundscapes/${file}.wav`;
    sound = new AmbientSound(url, failure);
    sound.volume = 0.6;
    const [first, second] = Voice.instances;
    const started = sound.play();
    // Both play calls happen synchronously within the original click.
    expect(first.play).toHaveBeenCalledOnce();
    expect(second.play).toHaveBeenCalledOnce();
    await started;
    expect(Voice.instances.every((v) => v.src === url && v.preload === "auto")).toBe(true);
    expect(first.volume).toBe(0.6);
    expect(second.volume).toBe(0);
    expect(second.pause).toHaveBeenCalledOnce();

    await update(first, 13.5);
    expect(second.play).toHaveBeenCalledTimes(2);
    await update(second, 0.7);
    expect(first.volume).toBeCloseTo(0.6 / Math.sqrt(2));
    expect(second.volume).toBeCloseTo(0.6 / Math.sqrt(2));
    expect(first.volume ** 2 + second.volume ** 2).toBeCloseTo(0.6 ** 2);
    await update(second, 1.4);
    expect(first.pause).toHaveBeenCalledOnce();
    expect(first.currentTime).toBe(0);
    expect(first.volume).toBe(0);
    expect(second.volume).toBe(0.6);

    // The standby voice is reused on the next pass, without a new download.
    await update(second, 13.5);
    await update(first, 1.4);
    expect(first.volume).toBe(0.6);
    expect(second.volume).toBe(0);
    expect(Voice.instances).toHaveLength(2);
  });

  it("preserves the fade when the mixer volume changes, including mute", async () => {
    sound = new AmbientSound("test.wav", failure);
    await sound.play();
    const [first, second] = Voice.instances;
    await update(first, 13.5);
    await update(second, 0.7);
    sound.volume = 0.4;
    expect(first.volume ** 2 + second.volume ** 2).toBeCloseTo(0.16);
    sound.volume = 0;
    expect(first.volume + second.volume).toBe(0);
  });

  it("uses playback time after a delayed callback rather than stretching the fade", async () => {
    sound = new AmbientSound("test.wav", failure);
    sound.volume = 0.5;
    await sound.play();
    const [first, second] = Voice.instances;
    // Even a callback arriving one second late starts before the end.
    first.currentTime = 14.5;
    await vi.advanceTimersByTimeAsync(50);
    expect(second.play).toHaveBeenCalledTimes(2);
    await update(second, 0.4);
    expect(first.volume).toBe(0);
    expect(second.volume).toBe(0.5);
  });

  it("waits for a buffered standby and handles unknown and short durations", async () => {
    sound = new AmbientSound("test.wav", failure);
    await sound.play();
    const [first, second] = Voice.instances;
    first.duration = NaN;
    await update(first, 1);
    expect(second.play).toHaveBeenCalledOnce();
    first.duration = 2;
    second.readyState = 2;
    await update(first, 1.5);
    expect(second.play).toHaveBeenCalledOnce();
    second.readyState = 4;
    await update(first, 1.5);
    expect(second.play).toHaveBeenCalledTimes(2);
    await update(second, 0.4);
    expect(first.pause).toHaveBeenCalledOnce();
  });

  it("releases both sources and timers even when stopped during startup", async () => {
    sound = new AmbientSound("test.wav", failure);
    let resolve!: () => void;
    Voice.instances[0].play.mockReturnValue(new Promise<void>((done) => { resolve = done; }));
    const started = sound.play();
    sound.stop();
    resolve();
    expect(await started).toBe(false);
    sound.stop();
    expect(vi.getTimerCount()).toBe(0);
    for (const voice of Voice.instances) {
      expect(voice.pause).toHaveBeenCalledOnce();
      expect(voice.removeAttribute).toHaveBeenCalledWith("src");
      expect(voice.load).toHaveBeenCalledOnce();
    }
    expect(failure).not.toHaveBeenCalled();
  });

  it("cleans up a rejected handoff and reports the error once", async () => {
    sound = new AmbientSound("test.wav", failure);
    await sound.play();
    const [first, second] = Voice.instances;
    second.play.mockRejectedValueOnce(new Error("Playback failed"));
    await update(first, 13.5);
    await Promise.resolve();
    expect(failure).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
    first.dispatchEvent(new Event("error"));
    expect(failure).toHaveBeenCalledOnce();
    expect(first.removeAttribute).toHaveBeenCalledWith("src");
    expect(second.removeAttribute).toHaveBeenCalledWith("src");
  });
});
