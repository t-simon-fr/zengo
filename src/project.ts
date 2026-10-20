import {
  moods,
  chordColors,
  type Key,
  type Mood,
  type Voicing,
} from "./harmony";
import type { Progression } from "./harmony";
import { rhythms, type RhythmChoice } from "./rhythm";
import { timings, timingDurations, type Timing } from "./timing";
import type { Instrument } from "./playback";
import { validBass } from "./bass";
import { validMelody } from "./melody";
import { validDrums } from "./drums";
import { validGroove } from "./groove";
import { validNotes } from "./note-data";
import { isSampled } from "./instruments";
export interface Session {
  progressions: Progression[];
  selected: string | null;
}
export interface Project {
  version: 1;
  key: Key;
  mood: Mood;
  voicing: Voicing;
  rhythm?: RhythmChoice;
  timing?: Timing;
  instrument?: Instrument;
  tempo: number;
  session: Session;
}
export const storageKey = "zengo-studio-v1";
export function parseProject(raw: string): Project | null {
  try {
    if (!raw || raw.length > 2_000_000) return null;
    const v = JSON.parse(raw) as Project;
    if (
      v.version !== 1 ||
      !Number.isInteger(v.key.root) ||
      v.key.root < 0 ||
      v.key.root > 11 ||
      !["minor", "major"].includes(v.key.mode) ||
      !moods.some((m) => m.id === v.mood) ||
      !["triad", "lush"].includes(v.voicing) ||
      (v.rhythm !== "auto" && !rhythms.some((r) => r.id === v.rhythm)) ||
      !timings.some((item) => item.id === v.timing) ||
      !(v.instrument === "synth" || isSampled(v.instrument)) ||
      !Number.isFinite(v.tempo) ||
      v.tempo < 40 ||
      v.tempo > 220 ||
      !Array.isArray(v.session.progressions) ||
      v.session.progressions.length > 4
    )
      return null;
    for (const p of v.session.progressions) {
      if (
        (p.bass !== undefined && !validBass(p.bass)) ||
        (p.drums !== undefined && !validDrums(p.drums)) ||
        (p.groove !== undefined && !validGroove(p.groove)) ||
        (p.chordNotes !== undefined &&
          !validNotes(p.chordNotes, p.chordNotesBeats, 0, 127, false)) ||
        (p.chordNotes === undefined && p.chordNotesBeats !== undefined) ||
        (p.melody !== undefined && !validMelody(p.melody)) ||
        (p.chordsMuted !== undefined && typeof p.chordsMuted !== "boolean") ||
        (p.chordVolume !== undefined &&
          (!Number.isFinite(p.chordVolume) ||
            p.chordVolume < 0 ||
            p.chordVolume > 100))
      )
        return null;
      if (
        typeof p.id !== "string" ||
        !Number.isInteger(p.key.root) ||
        p.key.root < 0 ||
        p.key.root > 11 ||
        !["minor", "major"].includes(p.key.mode) ||
        !moods.some((m) => m.id === p.mood) ||
        !["triad", "lush"].includes(p.voicing) ||
        !rhythms.some((r) => r.id === p.rhythm) ||
        !timings.some((item) => item.id === p.timing) ||
        !Array.isArray(p.chords) ||
        p.chords.length !== 4
      )
        return null;
      for (const [i, c] of p.chords.entries()) {
        if (
          !Number.isInteger(c.degree) ||
          c.degree < 0 ||
          c.degree > 6 ||
          !c.color ||
          !chordColors.includes(c.color) ||
          !Array.isArray(c.notes) ||
          c.notes.length < 3 ||
          c.notes.length > 5 ||
          c.notes.some((n) => !Number.isInteger(n) || n < 0 || n > 127) ||
          ![0, 1, 2].includes(c.inversion) ||
          ![-1, 0, 1].includes(c.octave) ||
          typeof c.locked !== "boolean" ||
          c.startBeat !==
            (i === 0
              ? 0
              : p.chords[i - 1].startBeat + p.chords[i - 1].durationBeats) ||
          c.durationBeats !== timingDurations(p.timing)[i]
        )
          return null;
      }
    }
    if (
      new Set(v.session.progressions.map((p) => p.id)).size !==
        v.session.progressions.length ||
      (v.session.selected !== null &&
        !v.session.progressions.some((p) => p.id === v.session.selected))
    )
      return null;
    return v;
  } catch {
    return null;
  }
}
