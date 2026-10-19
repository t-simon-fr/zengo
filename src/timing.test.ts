import { describe, expect, it } from "vitest";
import { Midi } from "@tonejs/midi";
import { generate, notesOf, replaceChord, vary } from "./harmony";
import { exportMidi } from "./midi";
import { chordHits, rhythms } from "./rhythm";
import { applyTiming, progressionBeats, timings } from "./timing";

const base = () =>
  generate({ root: 9, mode: "minor" }, "cinematic", 42, "lush", "sustain")[0];
describe("harmonic rhythm", () => {
  it("places four chords at the selected harmonic durations", () => {
    const p = base();
    expect(
      applyTiming(p, "half").chords.map((c) => [c.startBeat, c.durationBeats]),
    ).toEqual([
      [0, 2],
      [2, 2],
      [4, 2],
      [6, 2],
    ]);
    expect(progressionBeats(applyTiming(p, "half"))).toBe(8);
    expect(
      applyTiming(p, "double").chords.map((c) => [
        c.startBeat,
        c.durationBeats,
      ]),
    ).toEqual([
      [0, 8],
      [8, 8],
      [16, 8],
      [24, 8],
    ]);
    expect(progressionBeats(applyTiming(p, "double"))).toBe(32);
    expect(
      applyTiming(p, "anticipated").chords.map((c) => [
        c.startBeat,
        c.durationBeats,
      ]),
    ).toEqual([
      [0, 3.5],
      [3.5, 4],
      [7.5, 4],
      [11.5, 4.5],
    ]);
    expect(
      applyTiming(p, "mixed").chords.map((c) => [c.startBeat, c.durationBeats]),
    ).toEqual([
      [0, 2],
      [2, 2],
      [4, 4],
      [8, 8],
    ]);
  });
  it("sustains long chords and repeats grooves throughout both bars", () => {
    const p = applyTiming(base(), "double");
    expect(notesOf(p).every((n) => n.durationBeats === 8)).toBe(true);
    expect(chordHits(p.chords[0], "pulse").map((h) => h.offset)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7,
    ]);
    expect(chordHits(p.chords[0], "offbeat").map((h) => h.offset)).toEqual([
      0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5,
    ]);
  });
  it("cuts and retriggers a held hit exactly at an anticipated chord change", () => {
    const p = applyTiming(base(), "anticipated");
    const before = chordHits(p.chords[0], "pulse");
    const after = chordHits(p.chords[1], "pulse");
    expect(before.at(-1)).toMatchObject({ offset: 3, duration: 0.5 });
    expect(after[0].offset).toBe(0);
    expect(after[0].duration).toBeCloseTo(0.15);
    expect(after[1].offset).toBe(0.5);
  });
  it("preserves harmonic timing when editing or varying chords", () => {
    const p = applyTiming(base(), "mixed");
    const edited = replaceChord(p, 3, 3, 1, -1, p.voicing, "seventh");
    const variation = vary(p, 199);
    for (const result of [edited, variation]) {
      expect(result.timing).toBe("mixed");
      expect(result.chords.map((c) => [c.startBeat, c.durationBeats])).toEqual(
        p.chords.map((c) => [c.startBeat, c.durationBeats]),
      );
    }
    const locked = {
      ...p,
      chords: p.chords.map((c) => ({ ...c, locked: true })),
    };
    const retimed = applyTiming(locked, "half");
    expect(retimed.chords.map((c) => c.notes)).toEqual(
      locked.chords.map((c) => c.notes),
    );
    expect(retimed.chords.every((c) => c.locked)).toBe(true);
  });
  it("exports every timing/groove combination with no negative, overlapping-boundary or truncated clip events", () => {
    for (const timing of timings)
      for (const rhythm of rhythms) {
        const p = { ...applyTiming(base(), timing.id), rhythm: rhythm.id };
        for (const chord of p.chords)
          for (const hit of chordHits(chord, p.rhythm)) {
            expect(hit.offset).toBeGreaterThanOrEqual(0);
            expect(hit.duration).toBeGreaterThan(0);
            expect(hit.offset + hit.duration).toBeLessThanOrEqual(
              chord.durationBeats + 1e-10,
            );
          }
        const midi = new Midi(exportMidi(p, 137));
        expect(midi.tracks[0].endOfTrackTicks).toBe(
          progressionBeats(p) * midi.header.ppq,
        );
        expect(
          midi.tracks[0].notes
            .map((n) => [n.midi, n.ticks, n.durationTicks])
            .sort(),
        ).toEqual(
          notesOf(p)
            .map((n) => [
              n.midi,
              Math.round(n.startBeat * midi.header.ppq),
              Math.round(n.durationBeats * midi.header.ppq),
            ])
            .sort(),
        );
      }
  });
  it("applies timing during generation and retains one-bar timing for legacy calls", () => {
    expect(
      generate(
        { root: 0, mode: "major" },
        "airy",
        99,
        "lush",
        "auto",
        "half",
      ).every((p) => p.timing === "half" && progressionBeats(p) === 8),
    ).toBe(true);
    expect(base().chords.map((c) => c.startBeat)).toEqual([0, 4, 8, 12]);
  });
});
