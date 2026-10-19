import { scale, type Note, type Progression } from "./harmony";
import { rawNotes, type Track } from "./groove";
import { progressionBeats } from "./timing";
export type PitchedTrack = Exclude<Track, "drums">;
export function trackPitches(p: Progression, track: PitchedTrack) {
  const low = track === "bass" ? 28 : track === "melody" ? 60 : 0;
  const high =
    track === "bass"
      ? 52
      : track === "melody"
        ? p.melody?.range === "wide"
          ? 84
          : 72
        : 127;
  return Array.from({ length: high - low + 1 }, (_, i) => low + i).filter((n) =>
    scale(p.key).includes((n - p.key.root + 120) % 12),
  );
}
export function lockedNote(p: Progression, track: PitchedTrack, n: Note) {
  return (
    track === "chords" &&
    p.chords.some(
      (c) =>
        c.locked &&
        n.startBeat < c.startBeat + c.durationBeats - 1e-8 &&
        n.startBeat + n.durationBeats > c.startBeat + 1e-8,
    )
  );
}
function store(
  p: Progression,
  track: PitchedTrack,
  notes: Note[],
): Progression {
  const beats = progressionBeats(p);
  if (track === "chords")
    return { ...p, chordNotes: notes, chordNotesBeats: beats };
  if (track === "bass" && p.bass)
    return {
      ...p,
      bass: {
        ...p.bass,
        followDrums: false,
        manualNotes: notes,
        manualBeats: beats,
      },
    };
  if (track === "melody" && p.melody)
    return {
      ...p,
      melody: { ...p.melody, manualNotes: notes, manualBeats: beats },
    };
  return p;
}
const overlap = (a: Note, b: Note) =>
  a.startBeat < b.startBeat + b.durationBeats - 1e-8 &&
  b.startBeat < a.startBeat + a.durationBeats - 1e-8;
export function editTrack(
  p: Progression,
  track: PitchedTrack,
  index: number,
  patch: Partial<Note>,
  grid = 0.25,
): Progression {
  const notes = rawNotes(p, track),
    current = notes[index];
  if (!current || lockedNote(p, track, current)) return p;
  const allowed = trackPitches(p, track),
    next = { ...current };
  if (patch.midi !== undefined)
    next.midi = [...allowed].sort(
      (a, b) => Math.abs(a - patch.midi!) - Math.abs(b - patch.midi!),
    )[0];
  if (patch.startBeat !== undefined)
    next.startBeat = Math.max(
      0,
      Math.min(
        progressionBeats(p) - next.durationBeats,
        Math.round(patch.startBeat / grid) * grid,
      ),
    );
  if (patch.durationBeats !== undefined) {
    const nextStart = Math.min(
      progressionBeats(p),
      ...notes
        .filter(
          (n, i) =>
            i !== index &&
            (track !== "chords" || n.midi === next.midi) &&
            n.startBeat >= next.startBeat + 1e-8,
        )
        .map((n) => n.startBeat),
    );
    next.durationBeats = Math.max(
      0.01,
      Math.min(patch.durationBeats, nextStart - next.startBeat),
    );
  }
  if (patch.velocity !== undefined)
    next.velocity = Math.max(0.1, Math.min(1, patch.velocity));
  if (
    lockedNote(p, track, next) ||
    notes.some(
      (n, i) =>
        i !== index &&
        (track !== "chords" || n.midi === next.midi) &&
        overlap(n, next),
    )
  )
    return p;
  notes[index] = next;
  return store(p, track, notes);
}
export function removeTrackNote(
  p: Progression,
  track: PitchedTrack,
  index: number,
) {
  const notes = rawNotes(p, track);
  if (!notes[index] || lockedNote(p, track, notes[index])) return p;
  return store(
    p,
    track,
    notes.filter((_, i) => i !== index),
  );
}
export function addTrackNote(
  p: Progression,
  track: PitchedTrack,
  startBeat: number,
  midi: number,
): Progression {
  const notes = rawNotes(p, track),
    end = progressionBeats(p);
  if (notes.length >= 256) return p;
  const allowed = trackPitches(p, track),
    pitch = [...allowed].sort(
      (a, b) => Math.abs(a - midi) - Math.abs(b - midi),
    )[0];
  const start = Math.max(
    0,
    Math.min(end - 0.25, Math.round(startBeat * 4) / 4),
  );
  const nextStart = Math.min(
    end,
    ...notes
      .filter(
        (n) => (track !== "chords" || n.midi === pitch) && n.startBeat > start,
      )
      .map((n) => n.startBeat),
  );
  const note = {
    midi: pitch,
    startBeat: start,
    durationBeats: Math.min(0.5, nextStart - start),
    velocity: 0.8,
  };
  if (
    note.durationBeats < 0.01 ||
    lockedNote(p, track, note) ||
    notes.some(
      (n) => (track !== "chords" || n.midi === pitch) && overlap(n, note),
    )
  )
    return p;
  return store(p, track, [...notes, note]);
}
