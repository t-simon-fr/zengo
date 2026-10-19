import type { Note } from "./harmony";

export function validNotes(
  notes: Note[],
  beats: number | undefined,
  low: number,
  high: number,
  mono: boolean,
) {
  if (
    !Array.isArray(notes) ||
    notes.length > 512 ||
    ![8, 16, 32].includes(beats ?? 0)
  )
    return false;
  if (
    !notes.every(
      (n) =>
        n &&
        Number.isInteger(n.midi) &&
        n.midi >= low &&
        n.midi <= high &&
        Number.isFinite(n.startBeat) &&
        n.startBeat >= 0 &&
        Number.isFinite(n.durationBeats) &&
        n.durationBeats >= 0.01 &&
        n.startBeat + n.durationBeats <= beats! + 1e-8 &&
        Number.isFinite(n.velocity) &&
        n.velocity > 0 &&
        n.velocity <= 1,
    )
  )
    return false;
  return notes.every(
    (n, i) =>
      !notes
        .slice(i + 1)
        .some(
          (other) =>
            (mono || n.midi === other.midi) &&
            n.startBeat < other.startBeat + other.durationBeats - 1e-8 &&
            other.startBeat < n.startBeat + n.durationBeats - 1e-8,
        ),
  );
}
export function fitNotes(
  notes: Note[],
  sourceBeats: number,
  beats: number,
  allowed: number[],
): Note[] {
  return notes.map((n) => ({
    ...n,
    midi: [...allowed].sort(
      (a, b) => Math.abs(a - n.midi) - Math.abs(b - n.midi),
    )[0],
    startBeat: (n.startBeat * beats) / sourceBeats,
    durationBeats: (n.durationBeats * beats) / sourceBeats,
  }));
}
