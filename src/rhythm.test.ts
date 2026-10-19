import { describe, expect, it } from "vitest";
import { Midi } from "@tonejs/midi";
import {
  availableColors,
  chordName,
  generate,
  makeChord,
  moods,
  notesOf,
  scale,
  type Key,
  type Progression,
} from "./harmony";
import { rhythmHits, rhythms } from "./rhythm";
import { exportMidi } from "./midi";

describe("expanded harmony and rhythm", () => {
  it("labels sevenths, dominant ninths, suspensions and added tones accurately", () => {
    const key: Key = { root: 0, mode: "major" };
    expect(chordName(key, 4, "lush", "ninth")).toBe("G9");
    expect(chordName(key, 0, "lush", "ninth")).toBe("Cmaj9");
    expect(chordName(key, 1, "triad", "seventh")).toBe("Dm7");
    expect(chordName(key, 6, "triad", "seventh")).toBe("Bø7");
    expect(chordName(key, 0, "triad", "sus2")).toBe("Csus2");
    expect(chordName(key, 0, "triad", "sus4")).toBe("Csus4");
    expect(chordName(key, 0, "triad", "sixth")).toBe("C6");
    expect(chordName(key, 1, "triad", "add9")).toBe("Dmadd9");
    expect(makeChord(key, 0, 0, 0, 0, "triad", "sus2").notes).toEqual([
      48, 50, 55,
    ]);
    expect(makeChord(key, 0, 0, 0, 0, "triad", "sixth").notes).toEqual([
      48, 52, 55, 57,
    ]);
    expect(makeChord(key, 0, 0, 1, 0, "lush", "seventh").notes[0] % 12).toBe(4);
    expect(makeChord(key, 0, 0, 2, 0, "lush", "seventh").notes[0] % 12).toBe(7);
  });
  it("keeps every supported chord color and inversion diatonic in all 24 keys", () => {
    for (let root = 0; root < 12; root++)
      for (const mode of ["major", "minor"] as const) {
        const key = { root, mode };
        for (let degree = 0; degree < 7; degree++)
          for (const color of availableColors(key, degree))
            for (const inversion of [0, 1, 2]) {
              const chord = makeChord(
                key,
                degree,
                0,
                inversion,
                0,
                "lush",
                color,
              );
              expect(chord.color).toBe(color);
              expect(new Set(chord.notes).size).toBe(chord.notes.length);
              for (const note of chord.notes)
                expect(scale(key)).toContain((note - root + 120) % 12);
            }
      }
  });
  it("gives each mood its own harmonic paths, chord palette and automatic grooves", () => {
    for (let seed = 0; seed < 40; seed++) {
      const seen = new Map<string, string>();
      for (const mood of moods) {
        const ideas = generate(
          { root: 9, mode: "minor" },
          mood.id,
          seed,
          "lush",
          "auto",
        );
        expect(new Set(ideas.map((p) => p.rhythm)).size).toBeGreaterThanOrEqual(
          2,
        );
        for (const idea of ideas) {
          if (mood.id !== "dark")
            for (const chord of idea.chords) {
              expect(
                chordName(idea.key, chord.degree, idea.voicing, chord.color),
              ).not.toContain("♭9");
            }
          const signature = idea.chords.map((c) => c.degree).join(",");
          expect(seen.get(signature)).toBeUndefined();
          seen.set(signature, mood.id);
        }
      }
    }
    const colors = new Set(
      moods.flatMap((m) =>
        Array.from({ length: 20 }, (_, seed) =>
          generate({ root: 9, mode: "minor" }, m.id, seed, "lush"),
        ).flatMap((ps) => ps.flatMap((p) => p.chords.map((c) => c.color))),
      ),
    );
    expect(colors.size).toBe(7);
  });
  it("exports every rhythmic hit, duration, rest and accent using the edited pitches", () => {
    const base = generate({ root: 9, mode: "minor" }, "relaxed", 19, "lush")[0];
    for (const rhythm of rhythms) {
      const p: Progression = { ...base, rhythm: rhythm.id };
      const events = notesOf(p);
      expect(events).toHaveLength(
        p.chords.reduce((sum, c) => sum + c.notes.length, 0) *
          rhythmHits(rhythm.id).length,
      );
      expect(new Set(events.map((n) => n.startBeat))).toEqual(
        new Set(
          p.chords.flatMap((c) =>
            rhythmHits(rhythm.id).map((hit) => c.startBeat + hit.offset),
          ),
        ),
      );
      for (const event of events) {
        expect(event.durationBeats).toBeGreaterThan(0);
        expect(event.startBeat + event.durationBeats).toBeLessThanOrEqual(16);
      }
      const midi = new Midi(exportMidi(p, 137, "en"));
      expect(midi.tracks[0].endOfTrackTicks).toBe(16 * midi.header.ppq);
      const expected = events
        .map((n) => [
          n.midi,
          Math.round(n.startBeat * midi.header.ppq),
          Math.round(n.durationBeats * midi.header.ppq),
        ])
        .sort();
      expect(
        midi.tracks[0].notes
          .map((n) => [n.midi, n.ticks, n.durationTicks])
          .sort(),
      ).toEqual(expected);
      expect(midi.tracks[0].notes[0].velocity).toBeCloseTo(
        events[0].velocity,
        1,
      );
    }
  });
  it("keeps legacy projects sustained when no rhythm is specified", () => {
    const p = generate({ root: 0, mode: "major" }, "airy", 42)[0];
    delete p.rhythm;
    expect([...new Set(notesOf(p).map((n) => n.startBeat))]).toEqual([
      0, 4, 8, 12,
    ]);
    expect(notesOf(p).every((n) => n.durationBeats === 4)).toBe(true);
  });
});
