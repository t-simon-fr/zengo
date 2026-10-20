import { describe, it, expect, vi } from "vitest";
const audio = vi.hoisted(() => ({
  settings: [] as Array<{ urls: Record<string, unknown> }>,
  hit: vi.fn(),
  dispose: vi.fn(),
}));
vi.mock("tone", () => ({
  Sampler: class {
    constructor(options: { urls: Record<string, unknown> }) {
      audio.settings.push(options);
    }
    toDestination() {
      return this;
    }
    connect() {
      return this;
    }
    triggerAttackRelease = audio.hit;
    dispose = audio.dispose;
  },
}));
import { FluteVoice, fluteBank } from "./flute-voice";
import zones from "./flute-manifest.json";

describe("multi-articulation flute", () => {
  it("chooses dynamic layers, alternates short attacks, and keeps low notes on the sustain recordings", () => {
    expect(fluteBank(1, 0.6, 72, 0)).toBe("sustain-soft");
    expect(fluteBank(1, 0.8, 72, 0)).toBe("sustain-loud");
    expect(fluteBank(0.2, 0.6, 72, 0)).toBe("staccato-soft-0");
    expect(fluteBank(0.2, 0.6, 72, 1)).toBe("staccato-soft-1");
    expect(fluteBank(0.2, 0.8, 60, 0)).toBe("sustain-loud");
  });
  it("maps all 34 recordings to valid pitch banks and disposes every sampler", () => {
    const buffers = Object.fromEntries(
      zones.map((z) => [z.file.replace(".wav", ""), {} as AudioBuffer]),
    );
    const flute = new FluteVoice(buffers, -10).toDestination();
    expect(audio.settings).toHaveLength(6);
    expect(
      audio.settings.reduce(
        (n, settings) => n + Object.keys(settings.urls).length,
        0,
      ),
    ).toBe(34);
    for (const settings of audio.settings) {
      expect(
        Object.keys(settings.urls).every((note) => /^[A-G][4-6]$/.test(note)),
      ).toBe(true);
      expect(Object.values(settings.urls).every(Boolean)).toBe(true);
    }
    flute.triggerAttackRelease(440, 0.2, 0.05, 0.6);
    flute.triggerAttackRelease(440, 1.5, 0.5, 0.8);
    expect(audio.hit).toHaveBeenCalledWith(440, 0.2, 0.05, 0.6);
    flute.dispose();
    expect(audio.dispose).toHaveBeenCalledTimes(6);
  });
});
