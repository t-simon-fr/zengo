import type { Progression } from "./harmony";

export const timings = [
  {
    id: "bar",
    name: "Ütemenként",
    hint: "Négy akkord, négy ütem",
    durations: [4, 4, 4, 4],
  },
  {
    id: "half",
    name: "Félütemenként",
    hint: "Négy akkord, két ütem",
    durations: [2, 2, 2, 2],
  },
  {
    id: "double",
    name: "Kétütemenként",
    hint: "Négy akkord, nyolc ütem",
    durations: [8, 8, 8, 8],
  },
  {
    id: "anticipated",
    name: "Előrehozott váltások",
    hint: "A következő akkord fél negyeddel az ütemvonal előtt érkezik",
    durations: [3.5, 4, 4, 4.5],
  },
  {
    id: "mixed",
    name: "Változó hosszúság",
    hint: "Félütemes indulás, majd egy- és kétütemes kitartás",
    durations: [2, 2, 4, 8],
  },
] as const;
export type Timing = (typeof timings)[number]["id"];
export const timingDurations = (timing: Timing = "bar"): readonly number[] =>
  timings.find((item) => item.id === timing)!.durations;
export const progressionBeats = (p: Progression): number =>
  Math.max(0, ...p.chords.map((c) => c.startBeat + c.durationBeats));
export function applyTiming(p: Progression, timing: Timing): Progression {
  const durations = timingDurations(timing);
  let startBeat = 0;
  return {
    ...p,
    timing,
    chords: p.chords.map((chord, i) => {
      const next = { ...chord, startBeat, durationBeats: durations[i] };
      startBeat += durations[i];
      return next;
    }),
  };
}
