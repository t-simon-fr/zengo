import { describe, expect, it } from "vitest";
import { Midi } from "@tonejs/midi";
import { expressionEvents, expressionAt } from "./expression";
import { generate } from "./harmony";
import { melodyNotes, editMelody } from "./melody";
import { exportMidi } from "./midi";
import { grooveNotes } from "./groove";
import { progressionBeats } from "./timing";

describe("expressive acoustic melody", () => {
  const base = generate({ root: 2, mode: "major" }, "airy", 815)[0];
  const flute = {
    ...base,
    melody: {
      instrument: "flute" as const,
      density: "balanced" as const,
      range: "wide" as const,
      repetition: "high" as const,
      ending: "resolved" as const,
      seed: 319,
      volume: 70,
      muted: false,
    },
  };
  it("exports breath, expression and delayed vibrato on the flute channel without changing pitches or timing", () => {
    const p = { ...flute, groove: { seed: 3, swing: 20, humanize: 5 } };
    const notes = grooveNotes(p, "melody", 110);
    const events = expressionEvents(notes, "flute", 110);
    const midi = new Midi(exportMidi(p, 110, "en"));
    const track = midi.tracks.find((t) => t.channel === 2)!;
    expect(track.instrument.number).toBe(73);
    expect(track.notes.map((n) => n.midi)).toEqual(notes.map((n) => n.midi));
    for (const controller of [1, 2, 11] as const) {
      const source = events.filter((e) => e.controller === controller);
      const exported = track.controlChanges[controller];
      expect(exported.map((e) => e.ticks)).toEqual(
        source.map((e) => Math.round(e.beat * midi.header.ppq)),
      );
      exported.forEach((event, i) =>
        expect(Math.abs(event.value - source[i].value)).toBeLessThan(1 / 127),
      );
    }
    expect(events.some((e) => e.controller === 1 && e.value > 0)).toBe(true);
    expect(track.controlChanges[1].at(-1)!.value).toBe(0);
    expect(track.endOfTrackTicks).toBe(progressionBeats(p) * midi.header.ppq);
    expect(midi.tracks[0].controlChanges[11]).toBeUndefined();
  });
  it("keeps manual notes while shaping expression, and restores the dynamic level when playback resumes", () => {
    const p = editMelody(flute, 0, { midi: 74, durationBeats: 0.4 });
    const notes = melodyNotes(p);
    const events = expressionEvents(notes, "flute", 100);
    expect(notes[0].midi).toBe(74);
    expect(expressionAt(events, notes[0].startBeat)).toBeGreaterThan(0);
    const shape = events.filter((e) => e.controller === 11);
    const a = shape[0],
      b = shape[1];
    expect(expressionAt(events, (a.beat + b.beat) / 2)).toBeCloseTo(
      (a.value + b.value) / 2,
    );
    expect(expressionEvents([], "flute", 110)).toEqual([]);
    expect(expressionEvents(notes, "piano", 110)).toEqual([]);
    expect(expressionEvents(notes, "guitar", 110)).toEqual([]);
    expect(
      expressionEvents(notes, "violin", 110).some((e) => e.controller === 2),
    ).toBe(false);
  });
});
