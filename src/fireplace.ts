// CPU-only, fixed-size flame field. No WebGL context, particle allocations,
// video, image assets, or per-frame ImageData allocations.
export function createFireplace(color: string, secondary: string) {
  const width = 224,
    height = 156;
  const surface = document.createElement("canvas");
  surface.width = width;
  surface.height = height;
  const sc = surface.getContext("2d")!;
  const image = sc.createImageData(width, height);
  const output = new Uint32Array(image.data.buffer);
  const field = new Float32Array(64 * 64);
  let seed = 37;
  for (let i = 0; i < field.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    field[i] = seed / 4294967296;
  }
  const rgb = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const warm = rgb(color),
    hot = rgb(secondary);
  const palette = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    const t = i / 255,
      glow = Math.max(0, (t - 0.3) / 0.7);
    const r = Math.round(warm[0] * Math.min(1, t * 3) + (255 - warm[0]) * glow);
    const g = Math.round(
      warm[1] * Math.min(1, t * 2) + (hot[1] - warm[1]) * glow,
    );
    const b = Math.round(
      warm[2] * Math.min(1, t * 2) + (hot[2] - warm[2]) * glow,
    );
    const alpha = Math.min(255, Math.round(t * 650));
    palette[i] = (alpha << 24) | (b << 16) | (g << 8) | r;
  }
  function noise(x: number, y: number) {
    const ix = Math.floor(x),
      iy = Math.floor(y);
    let fx = x - ix,
      fy = y - iy;
    fx = fx * fx * (3 - 2 * fx);
    fy = fy * fy * (3 - 2 * fy);
    const a = field[(iy & 63) * 64 + (ix & 63)],
      b = field[(iy & 63) * 64 + ((ix + 1) & 63)];
    const c = field[((iy + 1) & 63) * 64 + (ix & 63)],
      d = field[((iy + 1) & 63) * 64 + ((ix + 1) & 63)];
    return a + (b - a) * fx + (c - a + (a - b - c + d) * fx) * fy;
  }
  function render(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    time: number,
    intensity: number,
  ) {
    // The hearth and soot-darkened firebox stay quiet around the moving flame.
    const cx = w * 0.5,
      floor = h * 0.84;
    const glow = ctx.createRadialGradient(cx, floor, 0, cx, h * 0.6, w * 0.62);
    glow.addColorStop(0, "#783011");
    glow.addColorStop(0.38, "#311b12");
    glow.addColorStop(1, "#080909");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    const boxW = w * 0.8,
      boxX = w * 0.1,
      boxY = h * 0.16;
    ctx.fillStyle = "#151110";
    ctx.fillRect(boxX, boxY, boxW, h * 0.69);
    // Mortar joints and varied brick faces, shaded by a warm central glow.
    for (let row = 0; row < 6; row++)
      for (let col = 0; col < 9; col++) {
        const x = boxX + (col * boxW) / 8 - ((row % 2) * boxW) / 16,
          y = boxY + row * h * 0.105;
        if (x < boxX || x + boxW / 8 > boxX + boxW) continue;
        const lit =
          Math.max(0, 1 - Math.abs(x + w * 0.05 - cx) / (w * 0.4)) * (row / 7);
        ctx.fillStyle = `rgb(${Math.round(24 + lit * 22)} ${Math.round(18 + lit * 10)} ${Math.round(16 + lit * 3)})`;
        ctx.fillRect(x + 1, y + 1, boxW / 8 - 2, h * 0.105 - 2);
      }
    const halo = ctx.createRadialGradient(
      cx,
      floor - h * 0.1,
      0,
      cx,
      floor - h * 0.1,
      w * 0.36,
    );
    halo.addColorStop(0, color + "55");
    halo.addColorStop(1, color + "00");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, h);
    const spread = 0.72 + intensity * 0.002;
    for (let py = 0; py < height; py++)
      for (let px = 0; px < width; px++) {
        const x = px / (width - 1),
          y = py / (height - 1),
          rise = 1 - y;
        const warp = noise(x * 3 + time * 0.35, y * 3 + time * 0.65) - 0.5;
        const n =
          noise(x * 6 + warp * 1.5, y * 4 + time * 2.5) * 0.57 +
          noise(x * 13 + warp, y * 9 + time * 5) * 0.29 +
          noise(x * 27, y * 17 + time * 8) * 0.14;
        const taper = Math.abs(x - 0.5) * 2;
        const base = (1 - taper * taper) * spread;
        const heat = base - rise * 1.12 + (n - 0.5) * (0.7 + rise * 0.7);
        const value = Math.max(
          0,
          Math.min(255, Math.round((heat - 0.22) * 350)),
        );
        output[py * width + px] = value > 0 ? palette[value] : 0;
      }
    sc.putImageData(image, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.drawImage(surface, w * 0.2, h * 0.19, w * 0.6, h * 0.63);
    ctx.restore();
    // Fixed embers glow and cool independently along the fuel bed.
    for (let i = 0; i < 33; i++) {
      const x = w * (0.25 + ((i * 0.6180339) % 1) * 0.5),
        y = floor + Math.sin(i * 8) * h * 0.017;
      ctx.globalAlpha = 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(time * 2 + i * 3));
      ctx.fillStyle = i % 3 ? color : secondary;
      ctx.beginPath();
      ctx.ellipse(x, y, w * 0.008, h * 0.005, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    function log(
      x: number,
      y: number,
      length: number,
      thick: number,
      angle: number,
    ) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      const wood = ctx.createLinearGradient(0, -thick, 0, thick);
      wood.addColorStop(0, "#291c16");
      wood.addColorStop(0.3, "#4a2c1b");
      wood.addColorStop(0.5, "#2c201a");
      wood.addColorStop(1, "#090909");
      ctx.fillStyle = wood;
      ctx.beginPath();
      ctx.roundRect(-length / 2, -thick / 2, length, thick, thick * 0.24);
      ctx.fill();
      for (let i = 0; i < 14; i++) {
        const xx = -length * 0.47 + (i * length) / 14;
        ctx.strokeStyle = i % 4 === 0 ? color + "aa" : "#0a0909bb";
        ctx.lineWidth = i % 4 === 0 ? 0.7 : 1.5;
        ctx.beginPath();
        ctx.moveTo(xx, -thick * 0.4);
        ctx.lineTo(xx + Math.sin(i * 12) * length * 0.04, thick * 0.25);
        ctx.stroke();
      }
      ctx.strokeStyle = color + "66";
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(-length * 0.45, -thick * 0.35);
      ctx.lineTo(length * 0.43, -thick * 0.38);
      ctx.stroke();
      ctx.fillStyle = "#221812";
      ctx.beginPath();
      ctx.ellipse(
        length * 0.48,
        0,
        thick * 0.24,
        thick * 0.45,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.strokeStyle = "#76513666";
      ctx.beginPath();
      ctx.ellipse(
        length * 0.48,
        0,
        thick * 0.12,
        thick * 0.28,
        0,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      ctx.restore();
    }
    log(w * 0.48, floor - h * 0.035, w * 0.39, h * 0.065, -0.19);
    log(w * 0.54, floor, w * 0.41, h * 0.08, 0.14);
    log(w * 0.4, floor + h * 0.02, w * 0.28, h * 0.06, -0.06);
    // Rare rising embers, each a deterministic cycle rather than a particle heap.
    for (let i = 0; i < 7; i++) {
      const life = (time * 0.2 + i * 0.143) % 1,
        x = w * (0.35 + i * 0.045 + Math.sin(time + i * 4) * 0.025),
        y = floor - life * h * 0.62;
      ctx.globalAlpha = (1 - life) * 0.65;
      ctx.fillStyle = secondary;
      ctx.fillRect(x, y, Math.max(0.5, w * 0.0014), h * 0.006 * (1 - life));
    }
    ctx.globalAlpha = 1;
    const vignette = ctx.createRadialGradient(
      cx,
      h * 0.55,
      h * 0.15,
      cx,
      h * 0.55,
      Math.max(w, h) * 0.65,
    );
    vignette.addColorStop(0, "#0000");
    vignette.addColorStop(1, "#000d");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }
  return {
    render,
    dispose: () => {
      surface.width = surface.height = 1;
    },
  };
}
