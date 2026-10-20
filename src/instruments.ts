import sampleManifest from "./sample-manifest.json";
import fluteManifest from "./flute-manifest.json";

export const sampledInstruments = [
  "piano",
  "guitar",
  "violin",
  "trumpet",
  "flute",
] as const;
export type SampledInstrument = (typeof sampledInstruments)[number];
export type Instrument = SampledInstrument | "synth";
export type MelodyInstrument = SampledInstrument | "lead";
export const instrumentNames = {
  piano: "Akusztikus zongora",
  guitar: "Akusztikus gitár",
  violin: "Hegedű",
  trumpet: "Trombita",
  flute: "Fuvola",
} as const;
export function isSampled(
  value: string | undefined,
): value is SampledInstrument {
  return sampledInstruments.some((id) => id === value);
}
export const sampleNotes: Record<SampledInstrument, string[]> = {
  piano: [
    "A0",
    ...Array.from({ length: 7 }, (_, i) => i + 1).flatMap((o) => [
      `C${o}`,
      `D#${o}`,
      `F#${o}`,
      `A${o}`,
    ]),
    "C8",
  ],
  ...sampleManifest,
  flute: fluteManifest.map((zone) => zone.file.replace(".wav", "")),
};
export const sampleSettings = {
  piano: { attack: 0, release: 0.8, gain: -8 },
  guitar: { attack: 0, release: 0.3, gain: -10 },
  violin: { attack: 0.035, release: 0.18, gain: -14 },
  trumpet: { attack: 0.012, release: 0.12, gain: -16 },
  flute: { attack: 0.025, release: 0.16, gain: -11 },
};
export const midiPrograms: Record<Instrument | MelodyInstrument, number> = {
  piano: 0,
  guitar: 24,
  violin: 40,
  trumpet: 56,
  flute: 73,
  synth: 80,
  lead: 80,
};
const keyboard = {
  low: 60,
  high: 84,
  narrow: 60,
  leap: 5,
  gate: 0.74,
  rhythms: {
    sparse: [0, 1.5, 3],
    balanced: [0, 0.75, 1.5, 2.5, 3.5],
    busy: [0, 0.5, 1, 1.5, 2, 2.75, 3.5],
  },
  hint: "Visszatérő motívumok, válaszok és szünetek a harmóniára építve." as const,
};
export const melodyProfiles = {
  piano: keyboard,
  lead: keyboard,
  guitar: {
    low: 52,
    high: 76,
    narrow: 55,
    leap: 7,
    gate: 0.8,
    rhythms: {
      sparse: [0, 1.5, 3],
      balanced: [0, 0.5, 1.5, 2, 3, 3.5],
      busy: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5],
    },
    hint: "Gitár: pengetett akkordhangok, arpeggiók és kényelmes középfekvés." as const,
  },
  violin: {
    low: 60,
    high: 84,
    narrow: 67,
    leap: 3,
    gate: 0.96,
    rhythms: {
      sparse: [0, 2.5],
      balanced: [0, 1.5, 2.5],
      busy: [0, 0.5, 1.5, 2, 3, 3.5],
    },
    hint: "Hegedű: éneklő frázisok, hosszabb hangok és kis dallamlépések." as const,
  },
  trumpet: {
    low: 55,
    high: 79,
    narrow: 60,
    leap: 5,
    gate: 0.7,
    rhythms: {
      sparse: [0, 2],
      balanced: [0, 1, 2.5],
      busy: [0, 0.5, 1, 2, 2.5, 3],
    },
    hint: "Trombita: hangsúlyos belépések, rövid válaszok és levegővételi szünetek." as const,
  },
  flute: {
    low: 60,
    high: 84,
    narrow: 67,
    leap: 4,
    gate: 0.94,
    rhythms: {
      sparse: [0, 2],
      balanced: [0, 0.5, 1.5, 2.5],
      busy: [0, 0.5, 1, 1.5, 2.5, 3, 3.5],
    },
    hint: "Fuvola: áramló dallamívek, lágy indítások, dinamikai hullámok és lélegző frázisok." as const,
  },
};

export function breathProfile(instrument: MelodyInstrument) {
  return instrument === "flute"
    ? { every: 8, rest: 0.75, maxNote: 2.5 }
    : instrument === "trumpet"
      ? { every: 8, rest: 1, maxNote: 2 }
      : undefined;
}
