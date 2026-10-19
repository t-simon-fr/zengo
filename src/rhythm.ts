export const rhythms = [
  { id: "sustain", name: "Kitartott", hint: "Hosszú, lebegő akkordok" },
  { id: "halves", name: "Félütemes", hint: "Két akkordütés ütemenként" },
  { id: "pulse", name: "Negyedes pulzus", hint: "Négy rövid akkordütés" },
  { id: "offbeat", name: "Offbeat", hint: "Akkordok a nyolcados felütéseken" },
  {
    id: "tresillo",
    name: "Tresillo · 3+3+2",
    hint: "Lüktető, háromütéses ritmus",
  },
  {
    id: "syncopated",
    name: "Szinkópált",
    hint: "Eltolt hangsúlyok és szünetek",
  },
] as const;
export type Rhythm = (typeof rhythms)[number]["id"];
export type RhythmChoice = Rhythm | "auto";
export interface RhythmHit {
  offset: number;
  duration: number;
  velocity: number;
}
const patterns: Record<Rhythm, RhythmHit[]> = {
  sustain: [{ offset: 0, duration: 4, velocity: 0.7 }],
  halves: [
    { offset: 0, duration: 1.8, velocity: 0.75 },
    { offset: 2, duration: 1.8, velocity: 0.64 },
  ],
  pulse: [0, 1, 2, 3].map((offset) => ({
    offset,
    duration: 0.65,
    velocity: offset % 2 === 0 ? 0.78 : 0.61,
  })),
  offbeat: [0.5, 1.5, 2.5, 3.5].map((offset, i) => ({
    offset,
    duration: 0.35,
    velocity: i % 2 === 0 ? 0.68 : 0.78,
  })),
  tresillo: [
    { offset: 0, duration: 1.25, velocity: 0.78 },
    { offset: 1.5, duration: 1.25, velocity: 0.68 },
    { offset: 3, duration: 0.75, velocity: 0.73 },
  ],
  syncopated: [
    { offset: 0, duration: 0.75, velocity: 0.78 },
    { offset: 1.5, duration: 0.35, velocity: 0.6 },
    { offset: 2.5, duration: 1.25, velocity: 0.72 },
  ],
};
export const rhythmHits = (rhythm: Rhythm = "sustain"): readonly RhythmHit[] =>
  patterns[rhythm];

// Keep grooves on the song's beat grid and cut/retrigger held hits at chord changes.
// Sustained chords span their full harmonic duration, including multiple bars.
export function chordHits(
  chord: { startBeat: number; durationBeats: number },
  rhythm: Rhythm = "sustain",
): RhythmHit[] {
  if (rhythm === "sustain")
    return [{ offset: 0, duration: chord.durationBeats, velocity: 0.7 }];
  const endBeat = chord.startBeat + chord.durationBeats;
  const hits: RhythmHit[] = [];
  for (let bar = Math.floor(chord.startBeat / 4) * 4; bar < endBeat; bar += 4) {
    for (const hit of rhythmHits(rhythm)) {
      const start = Math.max(chord.startBeat, bar + hit.offset);
      const end = Math.min(endBeat, bar + hit.offset + hit.duration);
      if (end > start)
        hits.push({
          offset: start - chord.startBeat,
          duration: end - start,
          velocity: hit.velocity,
        });
    }
  }
  return hits;
}
