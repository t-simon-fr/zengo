import type { Note, Progression } from "./harmony";
import { progressionBeats } from "./timing";
export type DrumLane = "kick" | "snare" | "hat";
export const drumLanes: DrumLane[] = ["kick", "snare", "hat"];
export const drumMidi = { kick: 36, snare: 38, hat: 42 };
export interface DrumPart {
  style: "steady" | "half" | "broken";
  seed: number;
  muted: boolean;
  volume: number;
  steps?: Record<DrumLane, boolean[]>;
}
export function validDrums(p: DrumPart) {
  return (
    !!p &&
    ["steady", "half", "broken"].includes(p.style) &&
    Number.isInteger(p.seed) &&
    p.seed >= 0 &&
    p.seed <= 0xffffffff &&
    typeof p.muted === "boolean" &&
    Number.isFinite(p.volume) &&
    p.volume >= 0 &&
    p.volume <= 100 &&
    (p.steps === undefined ||
      (p.steps &&
        drumLanes.every(
          (l) =>
            Array.isArray(p.steps![l]) &&
            p.steps![l].length === 16 &&
            p.steps![l].every((v) => typeof v === "boolean"),
        )))
  );
}
export function drumSteps(p: DrumPart): Record<DrumLane, boolean[]> {
  if (p.steps) return p.steps;
  const kick =
    p.style === "steady"
      ? [0, 4, 8, 12]
      : p.style === "half"
        ? [0, 7, 10]
        : [0, 6, 8, 11];
  const snare = p.style === "half" ? [8] : [4, 12];
  const extra = (p.seed % 3) * 2 + 9;
  return {
    kick: Array.from({ length: 16 }, (_, i) => kick.includes(i) || i === extra),
    snare: Array.from({ length: 16 }, (_, i) => snare.includes(i)),
    hat: Array.from(
      { length: 16 },
      (_, i) =>
        i % 2 === 0 || (p.style === "broken" && i === (p.seed % 4) * 4 + 3),
    ),
  };
}
export function drumNotes(p: Progression): Note[] {
  if (!p.drums) return [];
  const steps = drumSteps(p.drums),
    beats = progressionBeats(p);
  return Array.from({ length: beats * 4 }, (_, i) => i).flatMap((i) =>
    drumLanes
      .filter((l) => steps[l][i % 16])
      .map((l) => ({
        midi: drumMidi[l],
        startBeat: i / 4,
        durationBeats: l === "hat" ? 0.08 : 0.15,
        velocity:
          l === "kick" ? 0.9 : l === "snare" ? 0.82 : i % 4 === 0 ? 0.65 : 0.48,
      })),
  );
}
