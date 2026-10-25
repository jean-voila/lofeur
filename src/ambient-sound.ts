/** Two preloaded voices overlap at every seam; native media looping alone can gap. */
export class AmbientSound {
  private readonly voices: HTMLAudioElement[];
  private active = 0;
  private level = 0;
  private stopped = false;
  private ready = false;
  private timer?: ReturnType<typeof setInterval>;
  private fade?: { incoming: number; seconds: number; playing: boolean };

  constructor(
    url: string,
    private readonly onError: () => void,
  ) {
    this.voices = [new Audio(url), new Audio(url)];
    for (const voice of this.voices) {
      voice.preload = "auto";
      // Safety net if the browser suspends JavaScript across a seam.
      voice.loop = true;
      voice.volume = 0;
      voice.addEventListener("timeupdate", this.tick);
      voice.addEventListener("error", this.fail);
    }
  }

  set volume(value: number) {
    this.level = Math.max(0, Math.min(1, value));
    this.applyVolumes();
  }

  async play(): Promise<boolean> {
    if (this.stopped) return false;
    this.applyVolumes();
    // Unlock BOTH elements within the user gesture, including on mobile Safari.
    await Promise.all(this.voices.map((voice) => voice.play()));
    if (this.stopped) return false;
    this.voices[1].pause();
    this.voices[1].currentTime = 0;
    this.ready = true;
    this.timer = setInterval(this.tick, 50);
    return true;
  }

  stop() {
    if (this.stopped) return;
    this.stopped = true;
    clearInterval(this.timer);
    for (const voice of this.voices) {
      voice.removeEventListener("timeupdate", this.tick);
      voice.removeEventListener("error", this.fail);
      voice.pause();
      voice.removeAttribute("src");
      voice.load();
    }
    this.fade = undefined;
  }

  private fail = () => {
    if (this.stopped) return;
    this.stop();
    this.onError();
  };

  private applyVolumes() {
    const fade = this.fade;
    if (!fade?.playing) {
      this.voices[this.active].volume = this.level;
      this.voices[1 - this.active].volume = 0;
      return;
    }
    // Audio time, rather than elapsed wall time, also handles buffering and
    // delayed callbacks. Equal-power curves keep noise textures at a steady level.
    const progress = Math.min(
      1,
      this.voices[fade.incoming].currentTime / fade.seconds,
    );
    this.voices[this.active].volume =
      this.level * Math.cos((progress * Math.PI) / 2);
    this.voices[fade.incoming].volume =
      this.level * Math.sin((progress * Math.PI) / 2);
  }

  private tick = () => {
    if (this.stopped || !this.ready) return;
    const outgoing = this.voices[this.active];
    if (this.fade) {
      this.applyVolumes();
      if (
        this.fade.playing &&
        this.voices[this.fade.incoming].currentTime >= this.fade.seconds
      ) {
        outgoing.pause();
        outgoing.currentTime = 0;
        this.active = this.fade.incoming;
        this.fade = undefined;
        this.applyVolumes();
      }
      return;
    }
    const duration = outgoing.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;
    const overlap = Math.min(1.5, duration / 4);
    const remaining = duration - outgoing.currentTime;
    const incoming = this.voices[1 - this.active];
    if (remaining > overlap || remaining <= 0 || incoming.readyState < 3) return;
    incoming.currentTime = 0;
    incoming.volume = 0;
    const fade = {
      incoming: 1 - this.active,
      seconds: Math.max(0.05, remaining - 0.1),
      playing: false,
    };
    this.fade = fade;
    void incoming.play()
      .then(() => {
        if (this.stopped) return;
        fade.playing = true;
        this.tick();
      })
      .catch(this.fail);
  };
}
