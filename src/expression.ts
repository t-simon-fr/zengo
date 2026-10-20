import type { Note } from "./harmony";
import type { MelodyInstrument } from "./instruments";

export interface ExpressionEvent {
  beat: number;
  controller: 1 | 2 | 11;
  value: number;
}
export function hasExpression(instrument: MelodyInstrument) {
  return (
    instrument === "flute" ||
    instrument === "trumpet" ||
    instrument === "violin"
  );
}

// Shared expression data for the preview and MIDI. CC11 shapes loudness;
// wind libraries may also map CC2 to breath and CC1 to vibrato intensity.
export function expressionEvents(
  notes: Note[],
  instrument: MelodyInstrument,
  tempo: number,
): ExpressionEvent[] {
  if (!hasExpression(instrument) || !notes.length) return [];
  const wind = instrument !== "violin";
  const events: ExpressionEvent[] = [];
  const push = (
    beat: number,
    controller: ExpressionEvent["controller"],
    value: number,
  ) =>
    events.push({ beat, controller, value: Math.max(0, Math.min(1, value)) });
  for (const [i, note] of notes.entries()) {
    const { startBeat: start, durationBeats: duration, velocity } = note;
    const previous = notes[i - 1];
    const newPhrase =
      !previous || start - previous.startBeat - previous.durationBeats > 0.3;
    const end = start + duration;
    const strength = Math.min(0.96, 0.7 + velocity * 0.25);
    const points = [
      [start, strength * (newPhrase ? 0.73 : 0.88)],
      [start + duration * 0.3, strength],
      [start + duration * 0.75, strength * 0.93],
      [end, strength * 0.72],
    ];
    for (const [beat, value] of points) {
      push(beat, 11, value);
      if (wind) push(beat, 2, value);
    }
    push(start, 1, 0);
    // Delay vibrato on held notes; short passing notes remain clean.
    const delayBeats = (tempo * 0.35) / 60;
    if (duration > delayBeats * 2) {
      push(start + delayBeats, 1, 0);
      push(start + duration * 0.75, 1, instrument === "trumpet" ? 0.04 : 0.08);
    }
    push(end, 1, 0);
  }
  return events.sort((a, b) => a.beat - b.beat || a.controller - b.controller);
}

export function expressionAt(events: ExpressionEvent[], beat: number): number {
  const values = events.filter((e) => e.controller === 11);
  let previous: ExpressionEvent | undefined;
  for (const event of values) {
    if (event.beat > beat) {
      if (!previous) return event.value;
      const ratio = (beat - previous.beat) / (event.beat - previous.beat);
      return previous.value + (event.value - previous.value) * ratio;
    }
    previous = event;
  }
  return previous?.value ?? 1;
}
