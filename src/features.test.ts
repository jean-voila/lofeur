import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { audioSource, isStations, validAudioUrl } from "./lib";
import defaults from "./catalog";
import { canvasBudget, initialScene, validScene } from "./ProceduralScene";
import { isLocale, locales, translate } from "./i18n";
import { translations } from "./translations";

describe("audio-only station routing", () => {
  it("provides official direct streams for all 18 public stations and old saved catalogs", () => {
    for (const station of defaults.filter((s) => s.kind === "live")) {
      expect(audioSource(station)).toMatch(
        /^https:\/\/radio\.lofigirl\.com\/listen\//,
      );
      const { audioUrl, ...old } = station;
      expect(audioSource(old)).toBe(audioUrl);
    }
    expect(audioSource(defaults.find((s) => s.id === "lofi-girl")!)).toContain(
      "/asian-lofi/",
    );
  });
  it("never pairs a changed YouTube URL with an unrelated default stream", () => {
    const { audioUrl, ...station } = defaults[0];
    expect(audioSource({ ...station, url: defaults[1].url })).toBeNull();
    expect(audioSource({ ...station, id: "personal" })).toBeNull();
  });
  it("accepts an explicit personal HTTPS stream and validates imports", () => {
    const station = {
      ...defaults[0],
      id: "personal",
      audioUrl: "https://radio.example.org/live.mp3",
    };
    expect(audioSource(station)).toBe(station.audioUrl);
    expect(isStations([station])).toBe(true);
    for (const audioUrl of [
      "javascript:alert(1)",
      "http://radio.example.org/live",
      "https://user:secret@radio.example.org/live",
      "not a URL",
    ]) {
      expect(validAudioUrl(audioUrl)).toBe(false);
      expect(isStations([{ ...station, audioUrl }])).toBe(false);
    }
  });
});
describe("procedural background bounds", () => {
  it.each([
    [3840, 2160],
    [7680, 4320],
    [390, 844],
    [1, 1],
  ])("caps the framebuffer at %s × %s", (w, h) => {
    const size = canvasBudget(w, h, true);
    expect(Math.max(size.width, size.height)).toBeLessThanOrEqual(480);
    expect(size.width * size.height * 4).toBeLessThanOrEqual(921600);
    expect(size.fps).toBe(12);
    expect(canvasBudget(w, h, false).fps).toBe(20);
  });
  it("rejects corrupted persisted settings and accepts a static scene", () => {
    expect(validScene(initialScene)).toBe(true);
    expect(validScene({ ...initialScene, speed: 0 })).toBe(true);
    for (const scene of [
      null,
      {},
      { ...initialScene, speed: Infinity },
      { ...initialScene, pixelSize: 0 },
      { ...initialScene, color: "javascript:bad" },
      { ...initialScene, style: "unknown" },
    ])
      expect(validScene(scene)).toBe(false);
  });
});
describe("five-language interface", () => {
  it("offers exactly five requested languages including French", () => {
    expect(locales.map((l) => l.code)).toEqual(["fr", "en", "zh", "hi", "es"]);
    expect(isLocale("xx")).toBe(false);
  });
  it("has complete translations and preserves every interpolation parameter", () => {
    for (const [source, values] of Object.entries(translations)) {
      expect(values).toHaveLength(4);
      for (const value of values) {
        expect(value.trim().length).toBeGreaterThan(0);
        expect([...value.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort()).toEqual(
          [...source.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort(),
        );
      }
    }
    expect(translate("es", "Écouter {name}", { name: "Mi radio" })).toBe(
      "Escuchar Mi radio",
    );
    expect(translate("fr", "Phase {phase} sur 8", { phase: 2 })).toBe(
      "Phase 2 sur 8",
    );
  });
  it("covers all literal translation keys and all radio playback errors", () => {
    for (const file of ["App.tsx", "SceneSettings.tsx", "use-radio.ts"]) {
      const source = ts.createSourceFile(
        file,
        readFileSync(new URL(file, import.meta.url), "utf8"),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      function visit(node: ts.Node) {
        if (
          ts.isCallExpression(node) &&
          node.expression.getText(source) === "t" &&
          node.arguments[0] &&
          ts.isStringLiteral(node.arguments[0])
        )
          expect(
            translations[node.arguments[0].text],
            node.arguments[0].text,
          ).toBeDefined();
        if (
          file === "use-radio.ts" &&
          ts.isStringLiteral(node) &&
          /[À-ÿ’]/.test(node.text)
        )
          expect(translations[node.text], node.text).toBeDefined();
        ts.forEachChild(node, visit);
      }
      visit(source);
    }
  });
});
