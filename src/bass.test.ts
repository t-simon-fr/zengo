import { describe, expect, it } from "vitest";
import { Midi } from "@tonejs/midi";
import { bassNotes, bassStyles, validBass } from "./bass";
import { generate, scale, replaceChord, type Progression } from "./harmony";
import { applyTiming, progressionBeats, timings } from "./timing";
import { exportMidi } from "./midi";

function withBass(progression: Progression): Progression {
  return {
    ...progression,
    bass: {
      style: "moving",
      seed: 123,
      muted: false,
      volume: 80,
      instrument: "sub",
    },
  };
}
describe("bass generation and MIDI", () => {
  it("keeps all styles diatonic, monophonic and inside every timing preset in 24 keys", () => {
    for (const mode of ["major", "minor"] as const)
      for (let root = 0; root < 12; root++) {
        const base = withBass(generate({ root, mode }, "dark", 31, "lush")[0]);
        for (const timing of timings)
          for (const style of bassStyles) {
            const p = applyTiming(
              { ...base, bass: { ...base.bass!, style: style.id } },
              timing.id,
            );
            const notes = bassNotes(p);
            expect(notes.length).toBeGreaterThanOrEqual(4);
            notes.forEach((note, index) => {
              expect(scale(p.key)).toContain((note.midi - root + 120) % 12);
              expect(note.midi).toBeGreaterThanOrEqual(28);
              expect(note.midi).toBeLessThanOrEqual(52);
              expect(note.durationBeats).toBeGreaterThan(0);
              expect(note.startBeat + note.durationBeats).toBeLessThanOrEqual(
                progressionBeats(p),
              );
              if (index > 0)
                expect(
                  notes[index - 1].startBeat + notes[index - 1].durationBeats,
                ).toBeLessThanOrEqual(note.startBeat);
            });
            p.chords.forEach((chord) => {
              const first = notes.find(
                (note) => note.startBeat === chord.startBeat,
              )!;
              expect(first.midi % 12).toBe(
                (root + scale(p.key)[chord.degree]) % 12,
              );
            });
          }
      }
  });
  it("is reproducible, varies with seed and is independent of inversion and manual voicing", () => {
    const p = withBass(generate({ root: 9, mode: "minor" }, "dark", 31)[0]);
    expect(bassNotes(p)).toEqual(bassNotes(p));
    expect(bassNotes({ ...p, bass: { ...p.bass!, seed: 124 } })).not.toEqual(
      bassNotes(p),
    );
    const inverted = replaceChord(p, 0, p.chords[0].degree, 1, -1, "lush");
    expect(bassNotes(inverted)).toEqual(bassNotes(p));
    expect(
      bassNotes({
        ...p,
        chords: p.chords.map((c) => ({
          ...c,
          notes: c.notes.map((n) => n + 12),
        })),
      }),
    ).toEqual(bassNotes(p));
  });
  it("exports separate channels and full-length tracks, including muted parts", () => {
    for (const timing of timings) {
      const p = applyTiming(
        withBass(generate({ root: 0, mode: "major" }, "airy", 12)[0]),
        timing.id,
      );
      p.bass!.muted = true;
      p.chordsMuted = true;
      const midi = new Midi(exportMidi(p, 137, "en"));
      expect(midi.tracks).toHaveLength(2);
      expect(midi.tracks[1].name).toBe("Zengo - Bass");
      expect(midi.tracks.map((t) => t.channel)).toEqual([0, 1]);
      expect(midi.tracks[1].notes.map((n) => n.midi)).toEqual(
        bassNotes(p).map((n) => n.midi),
      );
      for (const track of midi.tracks)
        expect(track.endOfTrackTicks).toBe(
          progressionBeats(p) * midi.header.ppq,
        );
    }
  });
  it("validates saved bass settings and leaves legacy chord exports as one track", () => {
    const p = withBass(generate({ root: 9, mode: "minor" }, "dark", 31)[0]);
    expect(validBass(p.bass!)).toBe(true);
    expect(validBass({ ...p.bass!, seed: NaN })).toBe(false);
    expect(validBass({ ...p.bass!, volume: 101 })).toBe(false);
    expect(validBass({ ...p.bass!, instrument: "unknown" } as never)).toBe(
      false,
    );
    expect(
      new Midi(exportMidi({ ...p, bass: undefined }, 110)).tracks,
    ).toHaveLength(1);
  });
});
