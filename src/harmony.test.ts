import { describe, expect, it } from "vitest";
import { Midi } from "@tonejs/midi";
import {
  chordInfo,
  chordName,
  generate,
  makeChord,
  moveNoteInScale,
  moods,
  notesOf,
  replaceChord,
  scale,
  vary,
  type Key,
} from "./harmony";
import { exportMidi } from "./midi";
describe("harmony", () => {
  it("builds correct minor triads and Roman degrees", () => {
    const key: Key = { root: 9, mode: "minor" };
    expect(makeChord(key, 0, 0).notes).toEqual([57, 60, 64]);
    expect(chordInfo(key, 0)).toMatchObject({ name: "Am", roman: "i" });
    expect(chordInfo(key, 1)).toMatchObject({ name: "B°", roman: "ii°" });
    expect(chordName(key, 0, "lush")).toBe("Am9");
    expect(chordName(key, 4, "lush")).toBe("Em7♭9");
  });
  it("is reproducible and produces four distinct, diatonic progressions in every key", () => {
    for (let root = 0; root < 12; root++)
      for (const mode of ["minor", "major"] as const) {
        const key = { root, mode };
        const results = generate(key, "dark", 12345);
        expect(results).toEqual(generate(key, "dark", 12345));
        expect(results).toHaveLength(4);
        expect(
          new Set(results.map((p) => p.chords.map((c) => c.degree).join(",")))
            .size,
        ).toBe(4);
        const allowed = scale(key).map((n) => (n + root) % 12);
        for (const p of results)
          for (const n of notesOf(p)) expect(allowed).toContain(n.midi % 12);
        const lush = generate(key, "dark", 12345, "lush");
        expect(lush).toHaveLength(4);
        for (const p of lush) {
          expect(notesOf(p).length).toBeGreaterThanOrEqual(12);
          expect(notesOf(p).length).toBeLessThanOrEqual(20);
          for (const n of notesOf(p)) expect(allowed).toContain(n.midi % 12);
        }
      }
  });
  it("replaces one chord and preserves locked chords during variations", () => {
    let p = generate({ root: 0, mode: "major" }, "airy", 42)[0];
    const changed = replaceChord(p, 1, 3, 1);
    expect(changed.chords[0]).toEqual(p.chords[0]);
    expect(changed.chords[2]).toEqual(p.chords[2]);
    expect(changed.chords[1].degree).toBe(3);
    p = {
      ...p,
      chords: p.chords.map((c, i) => (i === 1 ? { ...c, locked: true } : c)),
    };
    expect(vary(p, 43).chords[1]).toEqual(p.chords[1]);
    expect(replaceChord(p, 1, 6).chords[1]).toEqual(p.chords[1]);
  });
  it("offers four ideas with different chord collections for every mood", () => {
    for (const mood of moods)
      for (let seed = 0; seed < 100; seed++) {
        const results = generate({ root: 9, mode: "minor" }, mood.id, seed);
        expect(results).toHaveLength(4);
        expect(
          new Set(
            results.map((p) =>
              p.chords
                .map((c) => c.degree)
                .sort()
                .join(","),
            ),
          ).size,
        ).toBe(4);
      }
  });
  it("creates wide lush ninth voicings and moves individual notes by scale steps", () => {
    const key = { root: 9, mode: "minor" as const };
    const lush = makeChord(key, 0, 0, 0, -1, "lush");
    expect(lush.notes).toHaveLength(5);
    expect(
      Math.max(...lush.notes) - Math.min(...lush.notes),
    ).toBeGreaterThanOrEqual(24);
    let progression = generate(key, "dark", 7, "lush")[0];
    expect(progression.voicing).toBe("lush");
    const edited = moveNoteInScale(progression, 0, 1, 1);
    expect(edited.chords[0].notes[1]).toBe(progression.chords[0].notes[1] + 2);
    const pitchClass =
      (((edited.chords[0].notes[1] - key.root) % 12) + 12) % 12;
    expect(scale(key)).toContain(pitchClass);
    progression = {
      ...progression,
      chords: progression.chords.map((c, i) =>
        i === 0 ? { ...c, locked: true } : c,
      ),
    };
    expect(moveNoteInScale(progression, 0, 0, 1)).toEqual(progression);
  });
  it("exports the edited pitches and beat timing with tempo and 4/4 metadata", () => {
    const original = replaceChord(
      generate({ root: 9, mode: "minor" }, "relaxed", 17, "lush")[0],
      2,
      3,
      2,
      1,
    );
    const p = moveNoteInScale(original, 2, 0, 1);
    const midi = new Midi(exportMidi(p, 137));
    expect(midi.header.tempos[0].bpm).toBeCloseTo(137, 3);
    expect(midi.header.timeSignatures[0].timeSignature).toEqual([4, 4]);
    expect(midi.tracks[0].notes).toHaveLength(notesOf(p).length);
    const expected = notesOf(p)
      .map((n) => [
        n.midi,
        n.startBeat * midi.header.ppq,
        n.durationBeats * midi.header.ppq,
      ])
      .sort();
    const actual = midi.tracks[0].notes
      .map((n) => [n.midi, n.ticks, n.durationTicks])
      .sort();
    expect(actual).toEqual(expected);
  });
});
