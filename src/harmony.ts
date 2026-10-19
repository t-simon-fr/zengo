import type { Locale } from "./i18n";
import type { BassPart } from "./bass";
import type { MelodyPart } from "./melody";
import type { DrumPart } from "./drums";
import type { Groove } from "./groove";
import { fitNotes } from "./note-data";
import { chordHits, type Rhythm, type RhythmChoice } from "./rhythm";
import { applyTiming, type Timing } from "./timing";
export type Mode = "minor" | "major";
export type Mood =
  "dark" | "melancholic" | "cinematic" | "airy" | "energetic" | "relaxed";
export type Voicing = "triad" | "lush";
export const chordColors = [
  "triad",
  "seventh",
  "ninth",
  "sixth",
  "sus2",
  "sus4",
  "add9",
] as const;
export type ChordColor = (typeof chordColors)[number];
export const colorLabels = {
  triad: "Hármashangzat",
  seventh: "Szeptim",
  ninth: "Kilenced",
  sixth: "Hatos",
  sus2: "Sus2",
  sus4: "Sus4",
  add9: "Add9",
} as const;
export interface Key {
  root: number;
  mode: Mode;
}
export interface ChordEvent {
  degree: number;
  color?: ChordColor;
  notes: number[];
  inversion: number;
  octave: number;
  locked: boolean;
  startBeat: number;
  durationBeats: number;
}
export interface Progression {
  id: string;
  key: Key;
  mood: Mood;
  voicing: Voicing;
  rhythm?: Rhythm;
  timing?: Timing;
  chords: ChordEvent[];
  bass?: BassPart;
  melody?: MelodyPart;
  drums?: DrumPart;
  groove?: Groove;
  chordNotes?: Note[];
  chordNotesBeats?: number;
  chordsMuted?: boolean;
  chordVolume?: number;
}
export interface Note {
  midi: number;
  startBeat: number;
  durationBeats: number;
  velocity: number;
}
export const pitchNames = [
  "C",
  "C♯",
  "D",
  "E♭",
  "E",
  "F",
  "F♯",
  "G",
  "A♭",
  "A",
  "B♭",
  "B",
];
export const moods = [
  { id: "dark", name: "Sötét", hint: "Mély · titokzatos", symbol: "☾" },
  {
    id: "melancholic",
    name: "Melankolikus",
    hint: "Lágy · érzelmes",
    symbol: "☂",
  },
  { id: "cinematic", name: "Filmszerű", hint: "Tágas · drámai", symbol: "✧" },
  { id: "airy", name: "Levegős", hint: "Fényes · lebegő", symbol: "☁" },
  {
    id: "energetic",
    name: "Energikus",
    hint: "Lendületes · élénk",
    symbol: "ϟ",
  },
  { id: "relaxed", name: "Laza", hint: "Nyugodt · könnyed", symbol: "≈" },
] as const satisfies readonly {
  id: Mood;
  name: string;
  hint: string;
  symbol: string;
}[];
export const scale = (key: Key) =>
  key.mode === "major" ? [0, 2, 4, 5, 7, 9, 11] : [0, 2, 3, 5, 7, 8, 10];
export const keyName = (key: Key, locale: Locale = "hu") =>
  `${pitchNames[key.root]} ${locale === "en" ? key.mode : key.mode === "minor" ? "moll" : "dúr"}`;
export const noteName = (midi: number) =>
  `${pitchNames[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
export function chordInfo(key: Key, degree: number) {
  const s = scale(key);
  const root = s[degree];
  const third = (s[(degree + 2) % 7] - root + 12) % 12;
  const fifth = (s[(degree + 4) % 7] - root + 12) % 12;
  const quality = fifth === 6 ? "dim" : third === 3 ? "minor" : "major";
  const numeral = ["I", "II", "III", "IV", "V", "VI", "VII"][degree];
  return {
    name:
      pitchNames[(key.root + root) % 12] +
      (quality === "minor" ? "m" : quality === "dim" ? "°" : ""),
    roman:
      (quality === "major" ? numeral : numeral.toLowerCase()) +
      (quality === "dim" ? "°" : ""),
    quality,
  };
}
export function availableColors(key: Key, degree: number): ChordColor[] {
  const s = scale(key);
  const interval = (step: number) =>
    (s[(degree + step) % 7] - s[degree] + 12) % 12;
  return chordColors.filter((color) => {
    if (color === "sus2" || color === "add9")
      return interval(1) === 2 && interval(4) === 7;
    if (color === "sus4") return interval(3) === 5 && interval(4) === 7;
    if (color === "sixth") return interval(5) === 9 && interval(4) === 7;
    return true;
  });
}
export function chordName(
  key: Key,
  degree: number,
  voicing: Voicing,
  color: ChordColor = voicing === "lush" ? "ninth" : "triad",
): string {
  const info = chordInfo(key, degree);
  if (color === "triad") return info.name;
  const rootName = pitchNames[(key.root + scale(key)[degree]) % 12];
  if (color === "sus2" || color === "sus4") return rootName + color;
  if (color === "add9") return info.name + "add9";
  if (color === "sixth") return info.name + "6";
  const degrees = scale(key);
  const root = degrees[degree];
  const seventh = (degrees[(degree + 6) % 7] - root + 12) % 12;
  const flat9 = (degrees[(degree + 1) % 7] - root + 12) % 12 === 1;
  const suffix = color === "seventh" || flat9 ? "7" : "9";
  const name =
    info.quality === "dim"
      ? `${rootName}ø${suffix}`
      : `${info.name}${seventh === 11 ? "maj" : ""}${suffix}`;
  return name + (color === "ninth" && flat9 ? "♭9" : "");
}
export function makeChord(
  key: Key,
  degree: number,
  index: number,
  inversion = 0,
  octave = 0,
  voicing: Voicing = "triad",
  color: ChordColor = voicing === "lush" ? "ninth" : "triad",
): ChordEvent {
  const s = scale(key);
  const resolved = availableColors(key, degree).includes(color)
    ? color
    : "triad";
  const steps: Record<ChordColor, number[]> = {
    triad: [0, 2, 4],
    seventh: [0, 2, 4, 6],
    ninth: [0, 2, 4, 6, 8],
    sixth: [0, 2, 4, 5],
    sus2: [0, 1, 4],
    sus4: [0, 3, 4],
    add9: [0, 2, 4, 8],
  };
  const chordDegrees = steps[resolved].map((step) => degree + step);
  const notes = chordDegrees.map(
    (d) => 48 + key.root + s[d % 7] + 12 * Math.floor(d / 7),
  );
  for (let i = 0; i < inversion; i++) notes.push(notes.shift()! + 12);
  notes.sort((a, b) => a - b);
  return {
    degree,
    color: resolved,
    notes: notes.map(
      (n, i) => n + octave * 12 + (voicing === "lush" && i > 0 ? 12 : 0),
    ),
    inversion,
    octave,
    locked: false,
    startBeat: index * 4,
    durationBeats: 4,
  };
}
function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
// Separate harmonic paths and color palettes make mood a musical choice,
// rather than a small ranking change over the same shared progression list.
const moodProfiles: Record<
  Mood,
  { patterns: number[][]; colors: ChordColor[]; rhythms: Rhythm[] }
> = {
  dark: {
    patterns: [
      [0, 1, 5, 4],
      [0, 6, 5, 4],
      [0, 5, 1, 4],
      [0, 3, 1, 0],
      [0, 1, 4, 0],
      [5, 1, 0, 4],
      [0, 6, 3, 1],
      [1, 5, 4, 0],
      [0, 4, 1, 6],
      [5, 0, 1, 3],
    ],
    colors: ["seventh", "ninth", "triad"],
    rhythms: ["sustain", "syncopated", "halves"],
  },
  melancholic: {
    patterns: [
      [0, 5, 2, 6],
      [0, 3, 5, 6],
      [5, 3, 0, 4],
      [0, 2, 5, 3],
      [3, 5, 0, 6],
      [0, 5, 3, 0],
      [2, 3, 0, 5],
      [5, 2, 6, 0],
      [0, 3, 2, 4],
      [3, 0, 5, 2],
    ],
    colors: ["ninth", "seventh", "add9"],
    rhythms: ["halves", "sustain", "syncopated"],
  },
  cinematic: {
    patterns: [
      [5, 6, 0, 3],
      [3, 0, 5, 6],
      [0, 3, 6, 2],
      [5, 3, 6, 4],
      [3, 5, 2, 6],
      [0, 5, 4, 3],
      [5, 6, 2, 0],
      [3, 6, 0, 4],
      [0, 2, 6, 4],
      [5, 0, 3, 2],
    ],
    colors: ["sus2", "sus4", "add9", "ninth"],
    rhythms: ["sustain", "tresillo", "halves"],
  },
  airy: {
    patterns: [
      [2, 3, 0, 6],
      [0, 3, 2, 6],
      [3, 2, 5, 0],
      [2, 6, 3, 5],
      [0, 2, 3, 0],
      [3, 0, 2, 4],
      [2, 5, 6, 3],
      [0, 6, 2, 5],
      [3, 2, 4, 0],
      [2, 0, 3, 5],
    ],
    colors: ["sus2", "add9", "sixth", "ninth"],
    rhythms: ["offbeat", "sustain", "halves"],
  },
  energetic: {
    patterns: [
      [0, 4, 5, 3],
      [0, 6, 3, 4],
      [0, 4, 0, 6],
      [3, 4, 0, 5],
      [0, 3, 4, 0],
      [5, 4, 3, 0],
      [0, 4, 2, 6],
      [6, 4, 0, 3],
      [0, 6, 4, 5],
      [3, 0, 4, 2],
    ],
    colors: ["triad", "sus4", "seventh"],
    rhythms: ["pulse", "offbeat", "tresillo"],
  },
  relaxed: {
    patterns: [
      [0, 3, 2, 5],
      [3, 2, 0, 5],
      [0, 5, 3, 2],
      [2, 4, 0, 3],
      [0, 3, 0, 2],
      [5, 2, 3, 4],
      [3, 5, 4, 2],
      [0, 2, 4, 5],
      [2, 0, 5, 4],
      [5, 3, 2, 6],
    ],
    colors: ["sixth", "seventh", "ninth"],
    rhythms: ["syncopated", "offbeat", "tresillo"],
  },
};
function chooseColor(
  key: Key,
  degree: number,
  mood: Mood,
  rng: () => number,
): ChordColor {
  const colors = moodProfiles[mood].colors.filter(
    (c) =>
      availableColors(key, degree).includes(c) &&
      (c !== "ninth" ||
        mood === "dark" ||
        (scale(key)[(degree + 1) % 7] - scale(key)[degree] + 12) % 12 === 2),
  );
  return (
    colors[Math.floor(rng() * colors.length)] ??
    (mood === "airy" ? "triad" : "seventh")
  );
}
export function generate(
  key: Key,
  mood: Mood,
  seed: number,
  voicing: Voicing = "triad",
  rhythm: RhythmChoice = "sustain",
  timing: Timing = "bar",
): Progression[] {
  const rng = random(seed);
  const profile = moodProfiles[mood];
  const ranked = profile.patterns
    .map((degrees) => ({ degrees, score: rng() }))
    .sort((a, b) => b.score - a.score);
  const chosen: number[][] = [];
  for (const { degrees } of ranked) {
    if (
      chosen.every(
        (other) =>
          other.filter((d, i) => d !== degrees[i]).length >= 2 &&
          [...other].sort().join(",") !== [...degrees].sort().join(","),
      )
    )
      chosen.push(degrees);
    if (chosen.length === 4) break;
  }
  return chosen.map((degrees, p) => {
    let previous: number[] | undefined;
    const chords = degrees.map((d, i) => {
      const color = chooseColor(key, d, mood, rng);
      const candidates = [0, 1, 2].flatMap((inv) =>
        [-1, 0].map((oct) => makeChord(key, d, i, inv, oct, voicing, color)),
      );
      const score = (c: ChordEvent) =>
        c.notes.reduce(
          (sum, n, j) =>
            sum +
            Math.abs(
              n -
                (previous?.[j] ??
                  (voicing === "lush" ? [36, 51, 55, 58, 62] : [48, 52, 55])[
                    j
                  ] + key.root),
            ),
          0,
        );
      const chord = candidates.sort((a, b) => score(a) - score(b))[0];
      previous = [...chord.notes].sort((a, b) => a - b);
      return chord;
    });
    return applyTiming(
      {
        id: `${seed}-${p}`,
        key: { ...key },
        mood,
        voicing,
        rhythm:
          rhythm === "auto"
            ? profile.rhythms[p % profile.rhythms.length]
            : rhythm,
        chords,
      },
      timing,
    );
  });
}
export function replaceChord(
  progression: Progression,
  index: number,
  degree: number,
  inversion = 0,
  octave = 0,
  voicing: Voicing = progression.voicing,
  color: ChordColor = progression.chords[index]?.color ??
    (voicing === "lush" ? "ninth" : "triad"),
): Progression {
  return {
    ...progression,
    chords: progression.chords.map((c, i) =>
      i === index && !c.locked
        ? {
            ...makeChord(
              progression.key,
              degree,
              i,
              inversion,
              octave,
              voicing,
              color,
            ),
            startBeat: c.startBeat,
            durationBeats: c.durationBeats,
          }
        : c,
    ),
  };
}
export function vary(progression: Progression, seed: number): Progression {
  const rng = random(seed);
  return {
    ...progression,
    chords: progression.chords.map((c, i) => {
      if (c.locked) return c;
      const degree = (c.degree + 1 + Math.floor(rng() * 6)) % 7;
      return {
        ...makeChord(
          progression.key,
          degree,
          i,
          c.inversion,
          c.octave,
          progression.voicing,
          chooseColor(progression.key, degree, progression.mood, rng),
        ),
        startBeat: c.startBeat,
        durationBeats: c.durationBeats,
      };
    }),
  };
}
export function moveNoteInScale(
  progression: Progression,
  chordIndex: number,
  noteIndex: number,
  direction: -1 | 1,
): Progression {
  const chord = progression.chords[chordIndex];
  if (!chord || chord.locked || chord.notes[noteIndex] === undefined)
    return progression;
  const allowed = new Set(scale(progression.key));
  let pitch = chord.notes[noteIndex];
  for (let distance = 1; distance <= 12; distance++) {
    const candidate = chord.notes[noteIndex] + direction * distance;
    if (chord.notes.some((note, i) => i !== noteIndex && note === candidate))
      continue;
    const pitchClass = (((candidate - progression.key.root) % 12) + 12) % 12;
    if (allowed.has(pitchClass)) {
      pitch = candidate;
      break;
    }
  }
  return {
    ...progression,
    chords: progression.chords.map((c, i) =>
      i === chordIndex
        ? { ...c, notes: c.notes.map((n, j) => (j === noteIndex ? pitch : n)) }
        : c,
    ),
  };
}
// Snap a dragged pitch to the nearest unoccupied note in the selected scale.
export function moveNoteToPitchInScale(
  progression: Progression,
  chordIndex: number,
  noteIndex: number,
  target: number,
): Progression {
  const chord = progression.chords[chordIndex];
  if (
    !chord ||
    chord.locked ||
    chord.notes[noteIndex] === undefined ||
    !Number.isFinite(target)
  )
    return progression;
  const allowed = new Set(scale(progression.key));
  const candidates = Array.from({ length: 128 }, (_, pitch) => pitch).filter(
    (pitch) =>
      allowed.has((((pitch - progression.key.root) % 12) + 12) % 12) &&
      !chord.notes.some((note, i) => i !== noteIndex && note === pitch),
  );
  const direction = Math.sign(target - chord.notes[noteIndex]);
  const pitch = candidates.sort(
    (a, b) =>
      Math.abs(a - target) - Math.abs(b - target) || direction * (b - a),
  )[0];
  if (pitch === chord.notes[noteIndex]) return progression;
  return {
    ...progression,
    chords: progression.chords.map((c, i) =>
      i === chordIndex
        ? {
            ...c,
            notes: c.notes.map((note, j) => (j === noteIndex ? pitch : note)),
          }
        : c,
    ),
  };
}
export const notesOf = (progression: Progression): Note[] =>
  progression.chordNotes && progression.chordNotesBeats
    ? fitNotes(
        progression.chordNotes,
        progression.chordNotesBeats,
        Math.max(
          ...progression.chords.map((c) => c.startBeat + c.durationBeats),
        ),
        Array.from({ length: 128 }, (_, i) => i).filter((n) =>
          scale(progression.key).includes(
            (n - progression.key.root + 120) % 12,
          ),
        ),
      )
    : progression.chords.flatMap((c) =>
        chordHits(c, progression.rhythm).flatMap((hit) =>
          c.notes.map((midi) => ({
            midi,
            startBeat: c.startBeat + hit.offset,
            durationBeats: Math.min(hit.duration, c.durationBeats - hit.offset),
            velocity: hit.velocity,
          })),
        ),
      );
