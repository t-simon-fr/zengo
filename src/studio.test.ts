import { describe, it, expect } from "vitest";
import { Midi } from "@tonejs/midi";
import { generate, notesOf, type Progression } from "./harmony";
import { melodyNotes } from "./melody";
import { bassNotes } from "./bass";
import { drumNotes, drumSteps } from "./drums";
import { grooveNotes, clipNotes } from "./groove";
import { addTrackNote, editTrack, removeTrackNote } from "./tracks";
import { parseProject, type Project } from "./project";
import { exportMidi } from "./midi";
import { applyTiming } from "./timing";
function studio(): Progression {
  return {
    ...generate({ root: 9, mode: "minor" }, "dark", 123)[0],
    bass: {
      seed: 3,
      style: "pulse",
      instrument: "sub",
      muted: false,
      volume: 80,
    },
    melody: {
      seed: 7,
      density: "balanced",
      range: "narrow",
      repetition: "high",
      ending: "loop",
      instrument: "piano",
      muted: false,
      volume: 70,
    },
    drums: { seed: 5, style: "steady", muted: false, volume: 75 },
    groove: { swing: 40, humanize: 15, seed: 12 },
  };
}
function project(p = studio()): Project {
  return {
    version: 1,
    key: p.key,
    mood: p.mood,
    voicing: p.voicing,
    rhythm: "auto",
    timing: "bar",
    instrument: "piano",
    tempo: 120,
    session: { selected: p.id, progressions: [p] },
  };
}
describe("studio integration", () => {
  it("supports deleting every pitched part, adding notes, scale snapping and clip rescaling", () => {
    let p = studio();
    for (const track of ["chords", "bass", "melody"] as const) {
      const get = () =>
        track === "chords"
          ? notesOf(p)
          : track === "bass"
            ? bassNotes(p)
            : melodyNotes(p);
      while (get().length) p = removeTrackNote(p, track, 0);
      expect(get()).toEqual([]);
      expect(parseProject(JSON.stringify(project(p)))).not.toBeNull();
      p = addTrackNote(p, track, 1, track === "bass" ? 37 : 61);
      expect(get()).toHaveLength(1);
      p = editTrack(p, track, 0, { durationBeats: 1, startBeat: 2 });
      expect(get()[0].startBeat).toBe(2);
      expect(get()[0].durationBeats).toBe(1);
    }
    const doubled = applyTiming(p, "double");
    expect(bassNotes(doubled)[0].startBeat).toBe(4);
    expect(melodyNotes(doubled)[0].durationBeats).toBe(2);
    expect(notesOf(doubled)[0].durationBeats).toBe(2);
  });
  it("respects chord locks and prevents overlapping monophonic edits", () => {
    const p = studio();
    p.chords[0].locked = true;
    expect(editTrack(p, "chords", 0, { midi: 72 })).toBe(p);
    expect(removeTrackNote(p, "chords", 0)).toBe(p);
    expect(addTrackNote(p, "chords", 0, 84)).toBe(p);
    const bass = bassNotes(p);
    expect(editTrack(p, "bass", 0, { startBeat: bass[1].startBeat })).toBe(p);
    const resized = editTrack(p, "bass", 0, { durationBeats: 99 });
    expect(bassNotes(resized)[0].durationBeats).toBe(bass[1].startBeat);
    const first = notesOf(p)[0];
    expect(clipNotes([first], 1, 16)[0]).toMatchObject({
      startBeat: 1,
      durationBeats: first.durationBeats - 1,
    });
  });
  it("links bass onsets to the kick and repeats custom drum steps across the full clip", () => {
    const p = studio();
    p.bass!.followDrums = true;
    const steps = drumSteps(p.drums!);
    steps.kick = steps.kick.map((_, i) => i === 0 || i === 6);
    p.drums!.steps = steps;
    expect(bassNotes(p).map((n) => n.startBeat)).toEqual(
      drumNotes(p)
        .filter((n) => n.midi === 36)
        .map((n) => n.startBeat),
    );
    expect(bassNotes(p)).toHaveLength(8);
    expect(new Set(drumNotes(p).map((n) => n.midi))).toEqual(
      new Set([36, 38, 42]),
    );
    expect(bassNotes(applyTiming(p, "double"))).toHaveLength(16);
  });
  it("uses deterministic groove with valid bounds and exports the same events on four channels", () => {
    const p = studio();
    expect(grooveNotes(p, "drums", 120)).toEqual(grooveNotes(p, "drums", 120));
    expect(
      grooveNotes(p, "drums", 120).some((n) => n.startBeat % 0.25 !== 0),
    ).toBe(true);
    const midi = new Midi(exportMidi(p, 120, "en"));
    expect(midi.tracks.map((t) => t.channel)).toEqual([0, 1, 2, 9]);
    for (const [i, track] of (
      ["chords", "bass", "melody", "drums"] as const
    ).entries()) {
      const expected = grooveNotes(p, track, 120);
      expected.forEach((n) => {
        expect(n.startBeat).toBeGreaterThanOrEqual(0);
        expect(n.durationBeats).toBeGreaterThan(0);
        expect(n.startBeat + n.durationBeats).toBeLessThanOrEqual(16);
      });
      expect(
        midi.tracks[i].notes
          .map((n) => [n.midi, n.ticks, n.durationTicks])
          .sort(),
      ).toEqual(
        expected
          .map((n) => [
            n.midi,
            Math.round(n.startBeat * midi.header.ppq),
            Math.max(1, Math.round(n.durationBeats * midi.header.ppq)),
          ])
          .sort(),
      );
      expect(midi.tracks[i].endOfTrackTicks).toBe(16 * midi.header.ppq);
    }
  });
  it("roundtrips the Zengo project format, validates it and rejects other schema versions", () => {
    let p = studio();
    p = editTrack(p, "bass", 0, { midi: 40 });
    p = editTrack(p, "melody", 0, { midi: 72 });
    p.drums!.steps = drumSteps(p.drums!);
    const data = project(p),
      text = JSON.stringify(data);
    expect(parseProject(text)).toEqual(data);
    expect(parseProject(JSON.stringify({ ...data, version: 8 }))).toBeNull();
    const bad = structuredClone(data);
    bad.session.progressions[0].bass!.manualNotes![0].durationBeats = 999;
    expect(parseProject(JSON.stringify(bad))).toBeNull();
    expect(parseProject(JSON.stringify({ ...data, version: 999 }))).toBeNull();
    expect(
      parseProject(
        JSON.stringify({
          ...data,
          session: { selected: p.id, progressions: [p, p] },
        }),
      ),
    ).toBeNull();
    expect(parseProject("{")).toBeNull();
    expect(parseProject("null")).toBeNull();
    expect(parseProject(" ".repeat(2_000_001))).toBeNull();
    expect(
      parseProject(
        JSON.stringify({
          ...data,
          session: {
            ...data.session,
            progressions: [
              { ...p, groove: { swing: 999, humanize: 0, seed: 1 } },
            ],
          },
        }),
      ),
    ).toBeNull();
  });
});
