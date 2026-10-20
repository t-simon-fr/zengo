import { afterEach, describe, expect, it, vi } from "vitest";
import { generate, type Progression } from "./harmony";
import { melodyNotes } from "./melody";

const audio = vi.hoisted(() => ({
  load: vi.fn(),
  sampler: vi.fn(),
  hit: vi.fn(),
  dispose: vi.fn(),
  bassHit: vi.fn(),
  bassDispose: vi.fn(),
  leadHit: vi.fn(),
  leadDispose: vi.fn(),
  now: 0,
  kickHit: vi.fn(),
  noiseHit: vi.fn(),
  drumDispose: vi.fn(),
  gainSet: vi.fn(),
  gainRamp: vi.fn(),
  gainDispose: vi.fn(),
  gainCreated: vi.fn(),
}));
vi.mock("tone", () => ({
  start: async () => {},
  now: () => audio.now,
  MembraneSynth: class {
    connect() {
      return this;
    }
    toDestination() {
      return this;
    }
    triggerAttackRelease = audio.kickHit;
    dispose = audio.drumDispose;
  },
  NoiseSynth: class {
    connect() {
      return this;
    }
    triggerAttackRelease = audio.noiseHit;
    dispose = audio.drumDispose;
  },
  Filter: class {
    connect() {
      return this;
    }
    toDestination() {
      return this;
    }
    dispose = vi.fn();
  },
  ToneAudioBuffer: { load: audio.load },
  Gain: class {
    constructor() {
      audio.gainCreated();
    }
    connect() {
      return this;
    }
    gain = {
      setValueAtTime: audio.gainSet,
      linearRampToValueAtTime: audio.gainRamp,
    };
    toDestination() {
      return this;
    }
    dispose = audio.gainDispose;
  },
  Synth: class {
    connect() {
      return this;
    }
    toDestination() {
      return this;
    }
    triggerAttackRelease = audio.leadHit;
    dispose = audio.leadDispose;
  },
  MonoSynth: class {
    connect() {
      return this;
    }
    toDestination() {
      return this;
    }
    triggerAttackRelease = audio.bassHit;
    dispose = audio.bassDispose;
  },
  Sampler: class {
    constructor(options: unknown) {
      audio.sampler(options);
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
  Frequency: () => ({ toFrequency: () => 440 }),
}));
const progression = generate({ root: 9, mode: "minor" }, "dark", 42)[0];
afterEach(() => {
  audio.now = 0;
  vi.useRealTimers();
  vi.resetAllMocks();
  vi.resetModules();
});

describe("sampled piano playback", () => {
  it("keeps an identical initial synchronization from restarting pending playback", async () => {
    vi.useFakeTimers();
    let finish!: (value: object) => void;
    audio.load.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { Preview } = await import("./playback");
    const player = new Preview(),
      ready = vi.fn();
    const pending = player.play(progression, 120, "piano", vi.fn(), ready, {
      loop: true,
    });
    await vi.waitFor(() => expect(audio.load).toHaveBeenCalledTimes(30));
    await player.update(progression, 120, "piano", { loop: true });
    expect(ready).not.toHaveBeenCalled();
    finish({});
    await pending;
    expect(ready).toHaveBeenCalledTimes(1);
    expect(audio.sampler).toHaveBeenCalledTimes(1);
    player.stop();
  });
  it("recovers a throttled loop at its current phase and cancels pending edits on stop", async () => {
    vi.useFakeTimers();
    audio.load.mockResolvedValue({});
    const { Preview } = await import("./playback");
    const player = new Preview(),
      position = vi.fn(),
      ready = vi.fn();
    await player.play(progression, 120, "piano", vi.fn(), ready, {
      loop: true,
      onPosition: position,
    });
    const hits = audio.hit.mock.calls.length;
    audio.now = 25.2;
    vi.advanceTimersByTime(30);
    expect(audio.hit.mock.calls[hits][2]).toBeCloseTo(25.25);
    expect(position.mock.calls.at(-1)![0]).toBeCloseTo(2.3);
    let finish!: (value: object) => void;
    audio.load.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const edit = player.update(progression, 120, "violin", { loop: true });
    await vi.waitFor(() => expect(audio.load).toHaveBeenCalledTimes(45));
    player.stop();
    finish({});
    await edit;
    expect(audio.sampler).toHaveBeenCalledTimes(1);
    expect(ready).toHaveBeenCalledTimes(1);
    expect(player.position).toBe(0);
    expect(audio.gainDispose).toHaveBeenCalledTimes(
      audio.gainCreated.mock.calls.length,
    );
  });
  const withLead = (): Progression => ({
    ...progression,
    melody: {
      seed: 12,
      density: "balanced",
      range: "narrow",
      repetition: "high",
      ending: "loop",
      instrument: "lead",
      volume: 70,
      muted: false,
    },
  });
  it("swaps only an edited melody on the next beat, keeps accompaniment sounding and preserves loop phase", async () => {
    vi.useFakeTimers();
    audio.load.mockResolvedValue({});
    const { Preview } = await import("./playback");
    const player = new Preview(),
      ended = vi.fn(),
      position = vi.fn(),
      p = withLead();
    await player.play(p, 120, "piano", ended, vi.fn(), {
      loop: true,
      onPosition: position,
    });
    const chords = audio.hit.mock.calls.length,
      lead = audio.leadHit.mock.calls.length;
    audio.now = 1.1;
    await player.update(
      { ...p, melody: { ...p.melody!, seed: 99 } },
      120,
      "piano",
      { loop: true },
    );
    expect(audio.sampler).toHaveBeenCalledTimes(1);
    expect(audio.hit).toHaveBeenCalledTimes(chords);
    expect(audio.dispose).not.toHaveBeenCalled();
    expect(audio.leadHit.mock.calls[lead][2]).toBeCloseTo(1.55);
    expect(player.position).toBeCloseTo(2.1);
    vi.advanceTimersByTime(30);
    expect(position.mock.calls.at(-1)![0]).toBeCloseTo(2.1);
    audio.now = 1.6;
    vi.advanceTimersByTime(30);
    expect(position.mock.calls.at(-1)![0]).toBeCloseTo(3.1);
    audio.now = 7.95;
    vi.advanceTimersByTime(30);
    expect(
      audio.hit.mock.calls
        .slice(chords)
        .some((call) => Math.abs(call[2] - 8.05) < 1e-8),
    ).toBe(true);
    expect(
      audio.leadHit.mock.calls.some((call) => Math.abs(call[2] - 8.05) < 1e-8),
    ).toBe(true);
    audio.now = 8.2;
    vi.advanceTimersByTime(30);
    expect(player.position).toBeCloseTo(0.3);
    expect(ended).not.toHaveBeenCalled();
    player.stop();
    expect(audio.gainDispose).toHaveBeenCalledTimes(
      audio.gainCreated.mock.calls.length,
    );
  });
  it("keeps playing during sample loading and applies only the newest rapid instrument change", async () => {
    vi.useFakeTimers();
    audio.load.mockResolvedValue({});
    const { Preview } = await import("./playback");
    const player = new Preview(),
      p = withLead(),
      position = vi.fn();
    await player.play(p, 120, "piano", vi.fn(), vi.fn(), {
      loop: true,
      onPosition: position,
    });
    let finish!: (value: object) => void;
    audio.load.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    audio.now = 1.1;
    const first = player.update(
      { ...p, melody: { ...p.melody!, instrument: "flute" } },
      120,
      "piano",
      { loop: true },
    );
    await vi.waitFor(() => expect(audio.load).toHaveBeenCalledTimes(30 + 34));
    expect(audio.dispose).not.toHaveBeenCalled();
    expect(player.position).toBeCloseTo(2.1);
    audio.load.mockResolvedValue({});
    await player.update(
      { ...p, melody: { ...p.melody!, instrument: "trumpet" } },
      120,
      "piano",
      { loop: true },
    );
    finish({});
    await first;
    expect(audio.sampler).toHaveBeenCalledTimes(2);
    expect(player.position).toBeCloseTo(2.1);
    player.stop();
    expect(audio.gainDispose).toHaveBeenCalledTimes(
      audio.gainCreated.mock.calls.length,
    );
  });
  it("keeps the old version running if an edited instrument fails to load", async () => {
    vi.useFakeTimers();
    audio.load.mockResolvedValue({});
    const { Preview } = await import("./playback");
    const player = new Preview(),
      p = withLead(),
      ended = vi.fn();
    await player.play(p, 120, "piano", ended, vi.fn(), { loop: true });
    audio.now = 1.1;
    audio.load.mockRejectedValue(new Error("Missing sample"));
    await expect(
      player.update(
        { ...p, melody: { ...p.melody!, instrument: "violin" } },
        120,
        "piano",
        { loop: true },
      ),
    ).rejects.toThrow("Missing sample");
    expect(audio.dispose).not.toHaveBeenCalled();
    expect(ended).not.toHaveBeenCalled();
    expect(player.position).toBeCloseTo(2.1);
    player.stop();
  });
  it("retimes tempo and live seeks without resetting the playhead, then turns loop off cleanly", async () => {
    vi.useFakeTimers();
    audio.load.mockResolvedValue({});
    const { Preview } = await import("./playback");
    const player = new Preview(),
      ended = vi.fn(),
      p = withLead();
    await player.play(p, 120, "piano", ended, vi.fn(), { loop: true });
    audio.now = 1.1;
    await player.update(p, 100, "piano", { loop: true });
    expect(player.position).toBeCloseTo(2.1);
    audio.now = 2.15;
    vi.advanceTimersByTime(600);
    expect(player.position).toBeCloseTo(4);
    await player.seek(8);
    audio.now = 2.9;
    vi.advanceTimersByTime(600);
    expect(player.position).toBeCloseTo(8.25);
    await player.update(p, 100, "piano", { loop: false });
    vi.advanceTimersByTime(12000);
    expect(ended).toHaveBeenCalledTimes(1);
    expect(player.position).toBe(0);
  });
  it("loads independent acoustic parts, caches each instrument, and skips muted sample downloads", async () => {
    vi.useFakeTimers();
    audio.load.mockResolvedValue({});
    const { Preview } = await import("./playback");
    const player = new Preview();
    const p: Progression = {
      ...progression,
      melody: {
        seed: 1,
        density: "balanced",
        range: "narrow",
        repetition: "high",
        ending: "loop",
        instrument: "violin",
        volume: 70,
        muted: false,
      },
    };
    await player.play(p, 110, "guitar", vi.fn());
    expect(audio.load).toHaveBeenCalledTimes(37 + 15);
    expect(
      audio.load.mock.calls.some(([url]) => url.includes("/violin/")),
    ).toBe(true);
    expect(
      audio.load.mock.calls.some(([url]) => url.includes("/guitar/")),
    ).toBe(true);
    player.stop();
    await player.play(
      { ...p, melody: { ...p.melody!, instrument: "trumpet" } },
      110,
      "guitar",
      vi.fn(),
    );
    expect(audio.load).toHaveBeenCalledTimes(37 + 15 + 11);
    player.stop();
    await player.play(
      { ...p, melody: { ...p.melody!, instrument: "flute" } },
      110,
      "guitar",
      vi.fn(),
      vi.fn(),
      { startBeat: 1 },
    );
    expect(audio.load).toHaveBeenCalledTimes(37 + 15 + 11 + 34);
    expect(audio.load.mock.calls.some(([url]) => url.includes("/flute/"))).toBe(
      true,
    );
    expect(audio.gainSet.mock.calls.at(-1)![1]).toBe(0.05);
    expect(audio.gainRamp).toHaveBeenCalled();
    player.stop();
    expect(audio.gainDispose).toHaveBeenCalledTimes(
      audio.gainCreated.mock.calls.length,
    );
    await player.play(
      { ...p, chordsMuted: true, melody: { ...p.melody!, muted: true } },
      110,
      "piano",
      vi.fn(),
    );
    expect(audio.load).toHaveBeenCalledTimes(37 + 15 + 11 + 34);
    player.stop();
  });
  it("loops on the audio clock from a selected beat, reports position and cancels future cycles", async () => {
    vi.useFakeTimers();
    audio.load.mockResolvedValue({});
    const { Preview } = await import("./playback");
    const player = new Preview(),
      position = vi.fn(),
      ended = vi.fn();
    await player.play(progression, 120, "piano", ended, vi.fn(), {
      loop: true,
      startBeat: 8,
      onPosition: position,
    });
    const firstCount = audio.hit.mock.calls.length;
    expect(firstCount).toBeGreaterThan(0);
    expect(position).toHaveBeenLastCalledWith(8);
    audio.now = 3.95;
    vi.advanceTimersByTime(30);
    expect(audio.hit.mock.calls.length).toBeGreaterThan(firstCount);
    expect(audio.hit.mock.calls.slice(firstCount)[0][2]).toBe(4.05);
    audio.now = 4.1;
    vi.advanceTimersByTime(30);
    expect(position.mock.calls.at(-1)![0]).toBeCloseTo(0.1);
    expect(ended).not.toHaveBeenCalled();
    const calls = audio.hit.mock.calls.length;
    player.stop();
    audio.now = 20;
    vi.advanceTimersByTime(20000);
    expect(audio.hit).toHaveBeenCalledTimes(calls);
  });
  it("retriggers a held note at the seek point and disposes every drum voice", async () => {
    vi.useFakeTimers();
    audio.load.mockResolvedValue({});
    const { Preview } = await import("./playback");
    const player = new Preview(),
      ended = vi.fn();
    const p: Progression = {
      ...progression,
      drums: { style: "steady", seed: 5, muted: false, volume: 75 },
    };
    await player.play(p, 120, "piano", ended, vi.fn(), { startBeat: 1 });
    expect(audio.hit.mock.calls[0][1]).toBe(1.5);
    expect(audio.hit.mock.calls[0][2]).toBe(0.05);
    expect(audio.kickHit).toHaveBeenCalled();
    expect(audio.noiseHit).toHaveBeenCalled();
    vi.advanceTimersByTime(8600);
    expect(ended).toHaveBeenCalledTimes(1);
    expect(audio.drumDispose).toHaveBeenCalledTimes(3);
  });
  it("shares piano buffers with melody, schedules the lead and respects melody mute", async () => {
    vi.useFakeTimers();
    audio.load.mockResolvedValue({});
    const { Preview } = await import("./playback");
    const player = new Preview();
    const p: Progression = {
      ...progression,
      melody: {
        seed: 12,
        density: "balanced",
        range: "narrow",
        repetition: "high",
        ending: "loop",
        instrument: "piano",
        volume: 70,
        muted: false,
      },
    };
    await player.play(p, 120, "piano", vi.fn());
    expect(audio.load).toHaveBeenCalledTimes(30);
    expect(audio.sampler).toHaveBeenCalledTimes(2);
    player.stop();
    expect(audio.dispose).toHaveBeenCalledTimes(2);
    p.melody!.instrument = "lead";
    await player.play(p, 120, "piano", vi.fn());
    expect(audio.leadHit).toHaveBeenCalledTimes(melodyNotes(p).length);
    expect(audio.leadHit.mock.calls[0][2]).toBe(0.05);
    player.stop();
    expect(audio.leadDispose).toHaveBeenCalledTimes(1);
    audio.leadHit.mockClear();
    p.melody!.muted = true;
    await player.play(p, 120, "piano", vi.fn());
    expect(audio.leadHit).not.toHaveBeenCalled();
    player.stop();
  });
  it("schedules bass on the shared clock, honors track mutes and disposes both instruments", async () => {
    vi.useFakeTimers();
    audio.load.mockResolvedValue({});
    const { Preview } = await import("./playback");
    const player = new Preview();
    const p: Progression = {
      ...progression,
      bass: {
        style: "held",
        seed: 3,
        muted: false,
        volume: 80,
        instrument: "sub",
      },
    };
    await player.play(p, 120, "piano", vi.fn());
    expect(audio.bassHit).toHaveBeenCalledTimes(4);
    expect(audio.bassHit.mock.calls[0][2]).toBe(audio.hit.mock.calls[0][2]);
    expect(audio.bassHit.mock.calls[1][2]).toBe(2.05);
    player.stop();
    expect(audio.bassDispose).toHaveBeenCalledTimes(1);
    expect(audio.dispose).toHaveBeenCalledTimes(1);
    audio.hit.mockClear();
    audio.bassHit.mockClear();
    await player.play({ ...p, chordsMuted: true }, 120, "piano", vi.fn());
    expect(audio.hit).not.toHaveBeenCalled();
    expect(audio.bassHit).toHaveBeenCalledTimes(4);
    player.stop();
    audio.bassHit.mockClear();
    await player.play(
      { ...p, bass: { ...p.bass!, muted: true } },
      120,
      "piano",
      vi.fn(),
    );
    expect(audio.hit).toHaveBeenCalled();
    expect(audio.bassHit).not.toHaveBeenCalled();
    player.stop();
  });
  it("loads local samples once and reuses decoded audio after stopping", async () => {
    vi.useFakeTimers();
    audio.load.mockResolvedValue({});
    const { Preview } = await import("./playback");
    const player = new Preview();
    await player.play(progression, 110, "piano", vi.fn());
    expect(audio.load).toHaveBeenCalledTimes(30);
    expect(
      audio.load.mock.calls.every(([url]) => url.startsWith("/audio/piano/")),
    ).toBe(true);
    expect(audio.hit).toHaveBeenCalled();
    player.stop();
    await player.play(progression, 110, "piano", vi.fn());
    expect(audio.load).toHaveBeenCalledTimes(30);
    expect(audio.sampler).toHaveBeenCalledTimes(2);
    player.stop();
  });
  it("does not play a stopped preview when loading finishes", async () => {
    let finish!: (value: object) => void;
    const pending = new Promise((resolve) => {
      finish = resolve;
    });
    audio.load.mockReturnValue(pending);
    const { Preview } = await import("./playback");
    const player = new Preview();
    const ready = vi.fn();
    const playing = player.play(progression, 110, "piano", vi.fn(), ready);
    await vi.waitFor(() => expect(audio.load).toHaveBeenCalledTimes(30));
    player.stop();
    finish({});
    await playing;
    expect(audio.sampler).not.toHaveBeenCalled();
    expect(ready).not.toHaveBeenCalled();
  });
  it("allows a retry after a sample fails to load", async () => {
    vi.useFakeTimers();
    audio.load.mockRejectedValue(new Error("Missing sample"));
    const { Preview } = await import("./playback");
    const player = new Preview();
    await expect(
      player.play(progression, 110, "piano", vi.fn()),
    ).rejects.toThrow("Missing sample");
    audio.load.mockResolvedValue({});
    await player.play(progression, 110, "piano", vi.fn());
    expect(audio.load).toHaveBeenCalledTimes(60);
    expect(audio.sampler).toHaveBeenCalledTimes(1);
    player.stop();
  });
});
