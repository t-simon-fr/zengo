import { describe, expect, it } from "vitest";
import { Midi } from "@tonejs/midi";
import { generate, scale, type Progression } from "./harmony";
import { melodyNotes, editMelody, validMelody } from "./melody";
import { bassNotes } from "./bass";
import { applyTiming, progressionBeats, timings } from "./timing";
import { exportMidi } from "./midi";
function arrangement(root = 9, mode: "major" | "minor" = "minor"): Progression {
  return {
    ...generate({ root, mode }, "airy", 71, "lush")[0],
    bass: {
      style: "moving",
      seed: 42,
      instrument: "sub",
      muted: false,
      volume: 80,
    },
    melody: {
      seed: 42,
      density: "balanced",
      range: "narrow",
      repetition: "high",
      ending: "loop",
      instrument: "piano",
      muted: false,
      volume: 70,
    },
  };
}
describe("motif melody", () => {
  it("stays diatonic and monophonic, above the bass, across keys, timing and density", () => {
    for (const mode of ["major", "minor"] as const)
      for (let root = 0; root < 12; root++)
        for (const timing of timings)
          for (const density of ["sparse", "balanced", "busy"] as const)
            for (const range of ["narrow", "wide"] as const) {
              const p = applyTiming(arrangement(root, mode), timing.id);
              p.melody = { ...p.melody!, density, range };
              const notes = melodyNotes(p);
              expect(notes.length).toBeGreaterThan(3);
              notes.forEach((n, i) => {
                expect(n.midi).toBeGreaterThan(
                  Math.max(...bassNotes(p).map((n) => n.midi)),
                );
                expect(n.midi).toBeLessThanOrEqual(
                  range === "narrow" ? 72 : 84,
                );
                expect(scale(p.key)).toContain((n.midi - root + 120) % 12);
                expect(n.durationBeats).toBeGreaterThan(0);
                expect(n.startBeat + n.durationBeats).toBeLessThanOrEqual(
                  progressionBeats(p),
                );
                if (i > 0)
                  expect(
                    notes[i - 1].startBeat + notes[i - 1].durationBeats,
                  ).toBeLessThanOrEqual(n.startBeat);
                if (
                  (n.startBeat % 2 === 0 ||
                    p.chords.some((c) => c.startBeat === n.startBeat)) &&
                  i < notes.length - 1
                ) {
                  const chord = p.chords.find(
                    (c) =>
                      n.startBeat >= c.startBeat &&
                      n.startBeat < c.startBeat + c.durationBeats,
                  )!;
                  expect(chord.notes.map((pitch) => pitch % 12)).toContain(
                    n.midi % 12,
                  );
                }
              });
            }
  });
  it("is reproducible and responds to seed, density, repetition and ending", () => {
    const p = arrangement();
    const notes = melodyNotes(p);
    expect(melodyNotes(p)).toEqual(notes);
    expect(
      melodyNotes({ ...p, melody: { ...p.melody!, seed: 123 } }),
    ).not.toEqual(notes);
    expect(
      melodyNotes({ ...p, melody: { ...p.melody!, repetition: "low" } }),
    ).not.toEqual(notes);
    expect(
      melodyNotes({ ...p, melody: { ...p.melody!, density: "sparse" } }).length,
    ).toBeLessThan(
      melodyNotes({ ...p, melody: { ...p.melody!, density: "busy" } }).length,
    );
    const resolved = melodyNotes({
      ...p,
      melody: { ...p.melody!, ending: "resolved" },
    });
    expect(p.chords[3].notes.map((n) => n % 12)).toContain(
      resolved.at(-1)!.midi % 12,
    );
    expect(resolved.at(-1)!.durationBeats).toBeGreaterThan(
      notes.at(-1)!.durationBeats,
    );
  });
  it("keeps edits in scale, bounds and order and rescales them with clip timing", () => {
    const p = arrangement();
    const edited = editMelody(p, 0, {
      midi: 61,
      startBeat: 99,
      durationBeats: 99,
    });
    expect(validMelody(edited.melody!)).toBe(true);
    expect(scale(p.key)).toContain(
      (melodyNotes(edited)[0].midi - p.key.root + 120) % 12,
    );
    const doubled = applyTiming(edited, "double");
    expect(melodyNotes(doubled)[0].durationBeats).toBe(
      melodyNotes(edited)[0].durationBeats * 2,
    );
    expect(melodyNotes(doubled).at(-1)!.startBeat).toBe(
      melodyNotes(edited).at(-1)!.startBeat * 2,
    );
    const moved = editMelody(edited, 1, { startBeat: -5, durationBeats: -5 });
    expect(validMelody(moved.melody!)).toBe(true);
    expect(moved.bass).toEqual(p.bass);
    expect(moved.chords).toEqual(p.chords);
  });
  it("exports three channels with exact melody edits and shared full length even when muted", () => {
    const p = editMelody(applyTiming(arrangement(), "anticipated"), 2, {
      midi: 72,
    });
    p.melody!.muted = true;
    p.bass!.muted = true;
    p.chordsMuted = true;
    const midi = new Midi(exportMidi(p, 123, "en"));
    expect(midi.tracks.map((t) => t.channel)).toEqual([0, 1, 2]);
    expect(midi.tracks[2].name).toBe("Zengo - Melody");
    expect(
      midi.tracks[2].notes.map((n) => [n.midi, n.ticks, n.durationTicks]),
    ).toEqual(
      melodyNotes(p).map((n) => [
        n.midi,
        Math.round(n.startBeat * midi.header.ppq),
        Math.round(n.durationBeats * midi.header.ppq),
      ]),
    );
    midi.tracks.forEach((t) =>
      expect(t.endOfTrackTicks).toBe(16 * midi.header.ppq),
    );
    expect(
      new Midi(exportMidi({ ...p, bass: undefined }, 123)).tracks.map(
        (t) => t.channel,
      ),
    ).toEqual([0, 2]);
    expect(validMelody({ ...p.melody!, volume: 200 })).toBe(false);
    expect(
      validMelody({
        ...p.melody!,
        manualNotes: [
          { midi: 65, startBeat: 0, durationBeats: 99, velocity: 0.8 },
        ],
      }),
    ).toBe(false);
  });
});
