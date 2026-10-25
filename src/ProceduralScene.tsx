import { memo, useEffect, useRef } from "react";
import { createFireplace } from "./fireplace";
export type SceneOptions = {
  style: "aurora" | "gradient" | "pixels" | "fireplace";
  color: string;
  secondary: string;
  background: string;
  speed: number;
  grain: number;
  blend: number;
  pixelSize: number;
  texture: "none" | "paper" | "linen";
  eco: boolean;
};
export const initialScene: SceneOptions = {
  style: "aurora",
  color: "#315d54",
  secondary: "#af775e",
  background: "#111b20",
  speed: 35,
  grain: 12,
  blend: 70,
  pixelSize: 14,
  texture: "paper",
  eco: true,
};
export function validScene(x: unknown): x is SceneOptions {
  const v = x as SceneOptions;
  return (
    !!v &&
    ["aurora", "gradient", "pixels", "fireplace"].includes(v.style) &&
    [v.color, v.secondary, v.background].every(
      (c) => typeof c === "string" && /^#[\da-f]{6}$/i.test(c),
    ) &&
    [v.speed, v.grain, v.blend].every(
      (n) => typeof n === "number" && n >= 0 && n <= 100,
    ) &&
    Number.isInteger(v.pixelSize) &&
    v.pixelSize >= 4 &&
    v.pixelSize <= 48 &&
    ["none", "paper", "linen"].includes(v.texture) &&
    typeof v.eco === "boolean"
  );
}
export function canvasBudget(width: number, height: number, eco: boolean) {
  const max = eco ? 480 : 720;
  const scale = Math.min(1, max / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    fps: eco ? 12 : 20,
  };
}
const hex = (c: string) => [
  parseInt(c.slice(1, 3), 16),
  parseInt(c.slice(3, 5), 16),
  parseInt(c.slice(5, 7), 16),
];
export default memo(function ProceduralScene({
  options,
}: {
  options: SceneOptions;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current!;
    const ctx = el.getContext("2d", { alpha: false });
    if (!ctx) return;
    let frame = 0,
      previous = 0,
      time = 0,
      last = 0;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const tile = document.createElement("canvas");
    tile.width = tile.height = 64;
    const noise = tile.getContext("2d")!;
    const pixels = noise.createImageData(64, 64);
    let seed = 7183;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < pixels.data.length; i += 4) {
      const light = random() > 0.5 ? 255 : 0;
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = light;
      pixels.data[i + 3] = Math.round(random() * options.grain * 1.3);
    }
    noise.putImageData(pixels, 0, 0);
    if (options.texture === "linen") {
      noise.strokeStyle = "#ffffff15";
      for (let i = 0; i < 64; i += 4) {
        noise.beginPath();
        noise.moveTo(i, 0);
        noise.lineTo(i, 64);
        noise.moveTo(0, i);
        noise.lineTo(64, i);
        noise.stroke();
      }
    }
    const pattern = ctx.createPattern(tile, "repeat");
    const fire =
      options.style === "fireplace"
        ? createFireplace(options.color, options.secondary)
        : null;
    const c1 = hex(options.color),
      bg = hex(options.background);
    function draw() {
      const w = el.width,
        h = el.height,
        t = time;
      ctx!.globalAlpha = 1;
      ctx!.fillStyle = options.background;
      ctx!.fillRect(0, 0, w, h);
      if (options.style === "fireplace") {
        fire?.render(ctx!, w, h, t, options.blend);
      } else if (options.style === "pixels") {
        const step = options.pixelSize;
        for (let y = 0; y < h; y += step)
          for (let x = 0; x < w; x += step) {
            const v =
              (Math.sin((x / w) * 5 + t) +
                Math.cos((y / h) * 4 - t * 0.6) +
                2) /
              4;
            const mix = Math.min(1, (v * options.blend) / 65);
            ctx!.fillStyle = `rgb(${Math.round(bg[0] + (c1[0] - bg[0]) * mix)} ${Math.round(bg[1] + (c1[1] - bg[1]) * mix)} ${Math.round(bg[2] + (c1[2] - bg[2]) * mix)})`;
            ctx!.fillRect(x, y, step - 1, step - 1);
          }
      } else {
        const gradient = ctx!.createLinearGradient(0, h, w, 0);
        gradient.addColorStop(0, options.background);
        gradient.addColorStop(0.5, options.color);
        gradient.addColorStop(1, options.secondary);
        ctx!.globalAlpha = 0.25 + options.blend / 140;
        ctx!.fillStyle = gradient;
        ctx!.fillRect(0, 0, w, h);
        const count = options.style === "aurora" ? 3 : 1;
        for (let i = 0; i < count; i++) {
          const x = w * (0.5 + 0.4 * Math.sin(t * 0.18 + i * 2.1)),
            y = h * (0.5 + 0.4 * Math.cos(t * 0.16 + i * 1.8));
          const glow = ctx!.createRadialGradient(
            x,
            y,
            0,
            x,
            y,
            Math.max(w, h) * 0.7,
          );
          glow.addColorStop(0, i % 2 ? options.secondary : options.color);
          glow.addColorStop(1, "transparent");
          ctx!.globalAlpha = options.blend / 120;
          ctx!.fillStyle = glow;
          ctx!.fillRect(0, 0, w, h);
        }
      }
      if (pattern && (options.grain > 0 || options.texture === "linen")) {
        ctx!.globalAlpha = options.texture === "none" ? 0.45 : 1;
        ctx!.fillStyle = pattern;
        ctx!.fillRect(0, 0, w, h);
      }
      ctx!.globalAlpha = 1;
    }
    function resize() {
      const size = canvasBudget(innerWidth, innerHeight, options.eco);
      el.width = size.width;
      el.height = size.height;
      el.dataset.fps = String(size.fps);
      draw();
    }
    function animate(now: number) {
      if (document.hidden || motion.matches || options.speed === 0) return;
      frame = requestAnimationFrame(animate);
      const interval = 1000 / (options.eco ? 12 : 20);
      if (now - previous < interval) return;
      time += (Math.min(now - last, 150) * options.speed) / 50000;
      last = now;
      previous = now;
      draw();
    }
    function resume() {
      cancelAnimationFrame(frame);
      last = performance.now();
      previous = 0;
      if (!document.hidden && !motion.matches && options.speed > 0)
        frame = requestAnimationFrame(animate);
      else draw();
    }
    resize();
    resume();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", resume);
    motion.addEventListener("change", resume);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", resume);
      motion.removeEventListener("change", resume);
      el.width = el.height = 1;
      tile.width = tile.height = 1;
      fire?.dispose();
    };
  }, [options]);
  return (
    <canvas ref={canvas} className="procedural-scene" aria-hidden="true" />
  );
});
