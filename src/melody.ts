import { scale, type Note, type Progression } from "./harmony";
import { progressionBeats } from "./timing";
import { validNotes } from "./note-data";

export interface MelodyPart {
  seed: number;
  density: "sparse" | "balanced" | "busy";
  range: "narrow" | "wide";
  repetition: "high" | "low";
  ending: "loop" | "resolved";
  instrument: "piano" | "lead";
  volume: number;
  muted: boolean;
  manualNotes?: Note[];
  manualBeats?: number;
}
export function validMelody(p: MelodyPart): boolean {
  if (
    !p ||
    typeof p !== "object" ||
    !Number.isInteger(p.seed) ||
    p.seed < 0 ||
    p.seed > 0xffffffff ||
    !["sparse", "balanced", "busy"].includes(p.density) ||
    !["narrow", "wide"].includes(p.range) ||
    !["high", "low"].includes(p.repetition) ||
    !["loop", "resolved"].includes(p.ending) ||
    !["piano", "lead"].includes(p.instrument) ||
    typeof p.muted !== "boolean" ||
    !Number.isFinite(p.volume) ||
    p.volume < 0 ||
    p.volume > 100
  )
    return false;
  if (p.manualNotes === undefined) return p.manualBeats === undefined;
  return validNotes(p.manualNotes, p.manualBeats, 60, 84, true);
}
export function melodyPitches(p: Progression) {
  const degrees = scale(p.key);
  return Array.from(
    { length: p.melody?.range === "wide" ? 25 : 13 },
    (_, i) => 60 + i,
  ).filter((n) => degrees.includes((n - p.key.root + 120) % 12));
}
export function melodyNotes(p: Progression): Note[] {
  const part = p.melody;
  if (!part) return [];
  const beats = progressionBeats(p);
  const allowed = melodyPitches(p);
  const closest = (target: number, candidates = allowed) =>
    [...candidates].sort(
      (a, b) => Math.abs(a - target) - Math.abs(b - target),
    )[0];
  if (part.manualNotes && part.manualBeats)
    return part.manualNotes.map((n) => ({
      ...n,
      midi: closest(n.midi),
      startBeat: (n.startBeat * beats) / part.manualBeats!,
      durationBeats: (n.durationBeats * beats) / part.manualBeats!,
    }));
  let state = part.seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  const rhythms = {
    sparse: [0, 1.5, 3],
    balanced: [0, 0.75, 1.5, 2.5, 3.5],
    busy: [0, 0.5, 1, 1.5, 2, 2.75, 3.5],
  };
  // One seed defines a short contour. Repetition reuses that contour; answers vary it.
  const contour = Array.from({ length: 7 }, () => Math.floor(random() * 5) - 2);
  const anchor = allowed[Math.floor(allowed.length / 2)];
  const offsetSet = new Set(p.chords.map((c) => c.startBeat));
  for (let bar = 0; bar < beats / 4; bar++) {
    const pattern = rhythms[part.density];
    pattern.forEach((offset, i) => {
      if (i > 0 && part.repetition === "low" && random() < 0.22) return;
      // The answer leaves a short breath at the end of every second bar.
      if (bar % 2 === 1 && offset >= 3.5 && part.density !== "busy") return;
      offsetSet.add(bar * 4 + offset);
    });
  }
  const offsets = [...offsetSet].filter((n) => n < beats).sort((a, b) => a - b);
  let previous = anchor;
  const notes = offsets.map((start, index) => {
    const chord = p.chords.find(
      (c) => start >= c.startBeat && start < c.startBeat + c.durationBeats,
    )!;
    const chordTones = allowed.filter((n) =>
      chord.notes.some((c) => c % 12 === n % 12),
    );
    const strong = start === chord.startBeat || start % 2 === 0;
    const local = start % 4;
    const motifIndex = rhythms[part.density].indexOf(local);
    const variation =
      part.repetition === "low" ? Math.floor(random() * 5) - 2 : 0;
    const baseIndex = allowed.indexOf(closest(anchor));
    const target =
      allowed[
        Math.max(
          0,
          Math.min(
            allowed.length - 1,
            baseIndex + contour[Math.max(0, motifIndex)] + variation,
          ),
        )
      ];
    const choices = strong && chordTones.length ? chordTones : allowed;
    // Prefer the motif target but penalize unnecessarily large melodic leaps.
    const midi = [...choices].sort(
      (a, b) =>
        Math.abs(a - target) +
        Math.max(0, Math.abs(a - previous) - 5) * 1.5 -
        (Math.abs(b - target) + Math.max(0, Math.abs(b - previous) - 5) * 1.5),
    )[0];
    previous = midi;
    const gap =
      Math.min(
        offsets[index + 1] ?? beats,
        chord.startBeat + chord.durationBeats,
      ) - start;
    return {
      midi,
      startBeat: start,
      durationBeats: gap * (part.density === "sparse" ? 0.82 : 0.74),
      velocity: strong ? 0.82 : 0.65 + random() * 0.1,
    };
  });
  const last = notes[notes.length - 1];
  const finalChord = p.chords[p.chords.length - 1];
  if (part.ending === "resolved") {
    last.midi = closest(
      last.midi,
      allowed.filter((n) => finalChord.notes.some((c) => c % 12 === n % 12)),
    );
    last.durationBeats = (beats - last.startBeat) * 0.95;
  } else {
    const first = notes[0].midi;
    const neighbors = allowed.filter(
      (n) => n !== first && Math.abs(n - first) <= 2,
    );
    if (neighbors.length) last.midi = closest(last.midi, neighbors);
  }
  return notes;
}

// Keep manual edits monophonic and within the current clip and scale.
export function editMelody(
  p: Progression,
  index: number,
  patch: Partial<Pick<Note, "midi" | "startBeat" | "durationBeats">>,
): Progression {
  if (!p.melody) return p;
  const notes = melodyNotes(p);
  const current = notes[index];
  if (!current) return p;
  const allowed = melodyPitches(p);
  const next = { ...current };
  if (patch.midi !== undefined)
    next.midi = [...allowed].sort(
      (a, b) => Math.abs(a - patch.midi!) - Math.abs(b - patch.midi!),
    )[0];
  const previousEnd =
    index === 0
      ? 0
      : notes[index - 1].startBeat + notes[index - 1].durationBeats;
  const nextStart = notes[index + 1]?.startBeat ?? progressionBeats(p);
  if (patch.startBeat !== undefined) {
    const min = Math.ceil((previousEnd - 1e-8) * 2) / 2;
    const max = Math.floor((nextStart - current.durationBeats + 1e-8) * 2) / 2;
    if (max >= min)
      next.startBeat = Math.max(
        min,
        Math.min(max, Math.round(patch.startBeat * 2) / 2),
      );
  }
  if (patch.durationBeats !== undefined)
    next.durationBeats = Math.max(
      0.0625,
      Math.min(nextStart - next.startBeat, patch.durationBeats),
    );
  notes[index] = next;
  return {
    ...p,
    melody: {
      ...p.melody,
      manualNotes: notes,
      manualBeats: progressionBeats(p),
    },
  };
}
