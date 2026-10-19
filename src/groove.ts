import { notesOf, type Note, type Progression } from "./harmony";
import { bassNotes } from "./bass";
import { melodyNotes } from "./melody";
import { drumNotes } from "./drums";
import { progressionBeats } from "./timing";
export type Track = "chords" | "bass" | "melody" | "drums";
export interface Groove {
  swing: number;
  humanize: number;
  seed: number;
}
export function validGroove(g: Groove) {
  return (
    !!g &&
    Number.isFinite(g.swing) &&
    g.swing >= 0 &&
    g.swing <= 60 &&
    Number.isFinite(g.humanize) &&
    g.humanize >= 0 &&
    g.humanize <= 30 &&
    Number.isInteger(g.seed) &&
    g.seed >= 0 &&
    g.seed <= 0xffffffff
  );
}
export function rawNotes(p: Progression, track: Track): Note[] {
  return track === "chords"
    ? notesOf(p)
    : track === "bass"
      ? bassNotes(p)
      : track === "melody"
        ? melodyNotes(p)
        : drumNotes(p);
}
export function grooveNotes(
  p: Progression,
  track: Track,
  tempo: number,
): Note[] {
  const notes = rawNotes(p, track),
    g = p.groove;
  if (!g || (!g.swing && !g.humanize)) return notes;
  const end = progressionBeats(p),
    mono = track === "bass" || track === "melody";
  const jitter = (start: number) => {
    let hash =
      (Math.round(start * 10000) ^
        g.seed ^
        ({ chords: 1, bass: 2, melody: 3, drums: 4 }[track] * 7919)) >>>
      0;
    hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
    hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
    return (
      (((((((hash ^ (hash >>> 16)) >>> 0) / 0xffffffff) * 2 - 1) * g.humanize) /
        1000) *
        tempo) /
      60
    );
  };
  const shifted = notes
    .map((n) => {
      const half = Math.round(n.startBeat * 2),
        offbeat = Math.abs(n.startBeat * 2 - half) < 1e-6 && half % 2 === 1;
      const startBeat = Math.max(
        0,
        Math.min(
          end - 0.0625,
          n.startBeat +
            (offbeat ? (g.swing / 100) * 0.25 : 0) +
            jitter(n.startBeat),
        ),
      );
      return {
        ...n,
        startBeat,
        durationBeats: Math.min(n.durationBeats, end - startBeat),
        velocity: Math.max(
          0.1,
          Math.min(1, n.velocity * (1 + jitter(n.startBeat) * 0.6)),
        ),
      };
    })
    .sort((a, b) => a.startBeat - b.startBeat);
  return shifted.map((n, i) => {
    const next = shifted
      .slice(i + 1)
      .find(
        (other) =>
          (mono || n.midi === other.midi) &&
          other.startBeat > n.startBeat + 1e-8,
      );
    return {
      ...n,
      durationBeats: Math.max(
        0.001,
        Math.min(
          n.durationBeats,
          next ? next.startBeat - n.startBeat : end - n.startBeat,
        ),
      ),
    };
  });
}
export function clipNotes(notes: Note[], from: number, end: number): Note[] {
  return notes
    .filter((n) => n.startBeat < end && n.startBeat + n.durationBeats > from)
    .map((n) => {
      const startBeat = Math.max(from, n.startBeat);
      return {
        ...n,
        startBeat,
        durationBeats: Math.min(end, n.startBeat + n.durationBeats) - startBeat,
      };
    });
}
