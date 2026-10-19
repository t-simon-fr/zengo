import { scale, type Note, type Progression } from "./harmony";
import { fitNotes, validNotes } from "./note-data";
import { drumNotes } from "./drums";
import { progressionBeats } from "./timing";

export const bassStyles = [
  { id: "held", name: "Kitartott basszus" },
  { id: "pulse", name: "Pulzáló basszus" },
  { id: "moving", name: "Mozgó basszus" },
] as const;
export type BassStyle = (typeof bassStyles)[number]["id"];
export interface BassPart {
  style: BassStyle;
  seed: number;
  muted: boolean;
  volume: number;
  instrument: "sub" | "pluck";
  followDrums?: boolean;
  manualNotes?: Note[];
  manualBeats?: number;
}
export function validBass(value: BassPart): boolean {
  return (
    value !== null &&
    typeof value === "object" &&
    bassStyles.some((style) => style.id === value.style) &&
    Number.isInteger(value.seed) &&
    value.seed >= 0 &&
    value.seed <= 0xffffffff &&
    typeof value.muted === "boolean" &&
    Number.isFinite(value.volume) &&
    value.volume >= 0 &&
    value.volume <= 100 &&
    ["sub", "pluck"].includes(value.instrument) &&
    (value.followDrums === undefined ||
      typeof value.followDrums === "boolean") &&
    (value.manualNotes === undefined
      ? value.manualBeats === undefined
      : validNotes(value.manualNotes, value.manualBeats, 28, 52, true))
  );
}

// Derive roots from scale degrees, independently of chord inversions and edits.
export function bassNotes(progression: Progression): Note[] {
  const part = progression.bass;
  if (!part) return [];
  const degrees = scale(progression.key);
  const rootAt = (degree: number) =>
    36 + ((progression.key.root + degrees[degree]) % 12);
  if (part.manualNotes && part.manualBeats)
    return fitNotes(
      part.manualNotes,
      part.manualBeats,
      progressionBeats(progression),
      Array.from({ length: 25 }, (_, i) => i + 28).filter((n) =>
        degrees.includes((n - progression.key.root + 120) % 12),
      ),
    );
  if (part.followDrums && progression.drums)
    return drumNotes(progression)
      .filter((n) => n.midi === 36)
      .map((n, i, all) => {
        const chord = progression.chords.find(
          (c) =>
            n.startBeat >= c.startBeat &&
            n.startBeat < c.startBeat + c.durationBeats,
        )!;
        return {
          ...n,
          midi: rootAt(chord.degree),
          durationBeats:
            Math.min(
              0.4,
              (all[i + 1]?.startBeat ?? progressionBeats(progression)) -
                n.startBeat,
              chord.startBeat + chord.durationBeats - n.startBeat,
            ) * 0.9,
        };
      });
  let state = part.seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  const motif = random() < 0.5 ? [0, 1, 2, 3.5] : [0, 0.75, 2, 2.75, 3.5];
  const allowed = Array.from({ length: 25 }, (_, i) => i + 28).filter((pitch) =>
    degrees.includes((pitch - progression.key.root + 120) % 12),
  );
  return progression.chords.flatMap((chord, chordIndex) => {
    const root = rootAt(chord.degree);
    if (part.style === "held")
      return [
        {
          midi: root,
          startBeat: chord.startBeat,
          durationBeats: chord.durationBeats * 0.96,
          velocity: 0.78 + random() * 0.08,
        },
      ];
    const offsets: number[] = [];
    for (let bar = 0; bar < chord.durationBeats; bar += 4)
      for (const offset of motif)
        if (bar + offset < chord.durationBeats) offsets.push(bar + offset);
    return offsets.map((offset, index) => {
      const remaining = chord.durationBeats - offset;
      let pitch = root;
      if (part.style === "pulse" && index > 0 && random() > 0.65)
        pitch = root + (root <= 40 ? 12 : -12);
      if (part.style === "moving" && index > 0) {
        const fifthClass =
          (progression.key.root + degrees[(chord.degree + 4) % 7]) % 12;
        const fifth = allowed
          .filter((n) => n % 12 === fifthClass)
          .sort((a, b) => Math.abs(a - root) - Math.abs(b - root))[0];
        pitch = random() < 0.5 ? root : fifth;
        if (remaining <= 0.5) {
          const next = rootAt(
            progression.chords[(chordIndex + 1) % progression.chords.length]
              .degree,
          );
          const neighbors = allowed.filter(
            (n) => n !== next && Math.abs(n - next) <= 2,
          );
          neighbors.sort((a, b) => Math.abs(a - root) - Math.abs(b - root));
          pitch =
            neighbors[Math.floor(random() * Math.min(2, neighbors.length))] ??
            root;
        }
      }
      const gap = (offsets[index + 1] ?? chord.durationBeats) - offset;
      return {
        midi: pitch,
        startBeat: chord.startBeat + offset,
        durationBeats: Math.min(
          gap * 0.8,
          part.style === "pulse" ? 0.45 : 0.85,
        ),
        velocity: index === 0 ? 0.88 : 0.64 + random() * 0.16,
      };
    });
  });
}
