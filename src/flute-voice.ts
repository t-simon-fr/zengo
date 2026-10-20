import * as Tone from "tone";
import zones from "./flute-manifest.json";

export function fluteBank(
  durationSeconds: number,
  velocity: number,
  midi: number,
  repetition: number,
) {
  const layer = velocity < 0.72 ? "soft" : "loud";
  // Staccato recordings start at A4. Avoid large transpositions in the low octave.
  return durationSeconds < 0.3 && midi >= 67
    ? `staccato-${layer}-${repetition % 2}`
    : `sustain-${layer}`;
}

export class FluteVoice {
  private samplers = new Map<string, Tone.Sampler>();
  private repetition = 0;
  constructor(buffers: Record<string, AudioBuffer>, volume: number) {
    const banks = new Set(
      zones.map((zone) =>
        zone.articulation === "staccato"
          ? `${zone.articulation}-${zone.layer}-${zone.roundRobin}`
          : `sustain-${zone.layer}`,
      ),
    );
    for (const bank of banks) {
      const selected = zones.filter((zone) => zone.file.startsWith(bank + "-"));
      const urls = Object.fromEntries(
        selected.map((zone) => [
          zone.note,
          buffers[zone.file.replace(".wav", "")],
        ]),
      );
      this.samplers.set(
        bank,
        new Tone.Sampler({
          urls,
          attack: bank.startsWith("staccato") ? 0.003 : 0.012,
          release: bank.startsWith("staccato") ? 0.06 : 0.16,
          volume,
        }),
      );
    }
  }
  toDestination() {
    this.samplers.forEach((sampler) => sampler.toDestination());
    return this;
  }
  connect(destination: Tone.Gain) {
    this.samplers.forEach((sampler) => sampler.connect(destination));
    return this;
  }
  triggerAttackRelease(
    frequency: number,
    duration: number,
    time: number,
    velocity = 1,
  ) {
    const midi = 69 + 12 * Math.log2(frequency / 440);
    const bank = fluteBank(duration, velocity, midi, this.repetition++);
    this.samplers
      .get(bank)!
      .triggerAttackRelease(frequency, duration, time, velocity);
  }
  dispose() {
    this.samplers.forEach((sampler) => sampler.dispose());
    this.samplers.clear();
  }
}
