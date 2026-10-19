import * as Tone from "tone";
import { type Progression } from "./harmony";
import { progressionBeats } from "./timing";
import { grooveNotes, clipNotes, type Track } from "./groove";
export type Instrument = "synth" | "piano";

const pianoNotes = [
  "A0",
  ...Array.from({ length: 7 }, (_, i) => i + 1).flatMap((octave) => [
    `C${octave}`,
    `D#${octave}`,
    `F#${octave}`,
    `A${octave}`,
  ]),
  "C8",
];
let pianoBuffers: Promise<Record<string, AudioBuffer>> | undefined;
function loadPiano() {
  pianoBuffers ??= Promise.all(
    pianoNotes.map(
      async (note) =>
        [
          note,
          await Tone.ToneAudioBuffer.load(
            `${import.meta.env.BASE_URL}audio/piano/${note.replace("#", "s")}.mp3`,
          ),
        ] as const,
    ),
  )
    .then(Object.fromEntries)
    .catch((error: unknown) => {
      pianoBuffers = undefined;
      throw error;
    });
  return pianoBuffers;
}

export interface PlaybackOptions {
  loop?: boolean;
  startBeat?: number;
  onPosition?: (beat: number) => void;
}
export class Preview {
  private synth: Tone.PolySynth | Tone.Sampler | undefined;
  private bass: Tone.MonoSynth | undefined;
  private melody: Tone.Sampler | Tone.Synth | undefined;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private generation = 0;
  private clock: ReturnType<typeof setInterval> | undefined;
  private kick: Tone.MembraneSynth | undefined;
  private snare: Tone.NoiseSynth | undefined;
  private hat: Tone.NoiseSynth | undefined;
  private drumFilters: Tone.Filter[] = [];
  stop() {
    this.generation++;
    clearTimeout(this.timer);
    clearInterval(this.clock);
    this.kick?.dispose();
    this.snare?.dispose();
    this.hat?.dispose();
    this.kick = undefined;
    this.snare = undefined;
    this.hat = undefined;
    this.drumFilters.forEach((f) => f.dispose());
    this.drumFilters = [];
    this.bass?.dispose();
    this.bass = undefined;
    this.melody?.dispose();
    this.melody = undefined;
    if (this.synth) {
      this.synth.dispose();
      this.synth = undefined;
    }
  }
  async play(
    progression: Progression,
    tempo: number,
    instrument: Instrument,
    ended: () => void,
    ready: () => void = () => {},
    options: PlaybackOptions = {},
  ) {
    this.stop();
    const generation = this.generation;
    await Tone.start();
    if (generation !== this.generation) return;
    let buffers: Record<string, AudioBuffer> | undefined;
    if (
      instrument === "piano" ||
      (progression.melody?.instrument === "piano" &&
        !progression.melody.muted &&
        progression.melody.volume > 0)
    ) {
      try {
        buffers = await loadPiano();
      } catch (error) {
        if (generation !== this.generation) return;
        throw error;
      }
      if (generation !== this.generation) return;
    }
    this.synth =
      instrument === "piano"
        ? new Tone.Sampler({
            urls: buffers,
            attack: 0,
            release: 0.8,
            volume:
              -8 +
              20 *
                Math.log10(
                  Math.max(0.001, (progression.chordVolume ?? 80) / 80),
                ),
          }).toDestination()
        : new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: { attack: 0.02, decay: 0.3, sustain: 0.3, release: 0.35 },
            volume:
              -14 +
              20 *
                Math.log10(
                  Math.max(0.001, (progression.chordVolume ?? 80) / 80),
                ),
          }).toDestination();
    if (
      progression.bass &&
      !progression.bass.muted &&
      progression.bass.volume > 0
    ) {
      const pluck = progression.bass.instrument === "pluck";
      this.bass = new Tone.MonoSynth({
        oscillator: { type: pluck ? "triangle" : "sine" },
        envelope: {
          attack: 0.008,
          decay: pluck ? 0.25 : 0.15,
          sustain: pluck ? 0.15 : 0.75,
          release: 0.1,
        },
        filter: { type: "lowpass", rolloff: -24, Q: 1 },
        filterEnvelope: {
          attack: 0.002,
          decay: 0.25,
          sustain: 0.1,
          release: 0.1,
          baseFrequency: pluck ? 250 : 150,
          octaves: pluck ? 2 : 0.5,
        },
        volume: -10 + 20 * Math.log10(progression.bass.volume / 100),
      }).toDestination();
    }
    const melody = progression.melody;
    if (melody && !melody.muted && melody.volume > 0) {
      const volume = -5 + 20 * Math.log10(melody.volume / 100);
      this.melody =
        melody.instrument === "piano"
          ? new Tone.Sampler({
              urls: buffers,
              attack: 0,
              release: 0.5,
              volume,
            }).toDestination()
          : new Tone.Synth({
              oscillator: { type: "triangle" },
              envelope: {
                attack: 0.015,
                decay: 0.15,
                sustain: 0.25,
                release: 0.3,
              },
              volume: volume - 8,
            }).toDestination();
    }
    if (
      progression.drums &&
      !progression.drums.muted &&
      progression.drums.volume > 0
    ) {
      const volume = 20 * Math.log10(progression.drums.volume / 100);
      this.kick = new Tone.MembraneSynth({
        pitchDecay: 0.035,
        octaves: 5,
        envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.1 },
        volume: volume - 8,
      }).toDestination();
      const snareFilter = new Tone.Filter(1000, "highpass").toDestination(),
        hatFilter = new Tone.Filter(7000, "highpass").toDestination();
      this.drumFilters = [snareFilter, hatFilter];
      this.snare = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.14, sustain: 0, release: 0.03 },
        volume: volume - 13,
      }).connect(snareFilter);
      this.hat = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.045, sustain: 0, release: 0.01 },
        volume: volume - 20,
      }).connect(hatFilter);
    }
    const beats = progressionBeats(progression),
      secondsPerBeat = 60 / tempo;
    const from = Math.max(0, Math.min(beats - 0.25, options.startBeat ?? 0));
    const now = Tone.now() + 0.05;
    const tracks: Track[] = ["chords", "bass", "melody", "drums"];
    const events = Object.fromEntries(
      tracks.map((track) => [
        track,
        [...grooveNotes(progression, track, tempo)].sort(
          (a, b) => a.startBeat - b.startBeat,
        ),
      ]),
    ) as Record<Track, ReturnType<typeof grooveNotes>>;
    const schedule = (audioStart: number, fromBeat: number) => {
      for (const track of tracks) {
        if (
          (track === "chords" &&
            (progression.chordsMuted || progression.chordVolume === 0)) ||
          (track === "bass" && !this.bass) ||
          (track === "melody" && !this.melody) ||
          (track === "drums" && !this.kick)
        )
          continue;
        for (const n of clipNotes(events[track], fromBeat, beats)) {
          const time = audioStart + (n.startBeat - fromBeat) * secondsPerBeat,
            duration = n.durationBeats * secondsPerBeat;
          if (track === "drums") {
            if (n.midi === 36)
              this.kick!.triggerAttackRelease("C1", duration, time, n.velocity);
            else
              (n.midi === 38 ? this.snare! : this.hat!).triggerAttackRelease(
                duration,
                time,
                n.velocity,
              );
          } else {
            const voice =
              track === "chords"
                ? this.synth!
                : track === "bass"
                  ? this.bass!
                  : this.melody!;
            voice.triggerAttackRelease(
              Tone.Frequency(n.midi, "midi").toFrequency(),
              duration,
              time,
              n.velocity,
            );
          }
        }
      }
    };
    schedule(now, from);
    let nextCycle = now + (beats - from) * secondsPerBeat;
    ready();
    options.onPosition?.(from);
    this.clock = setInterval(() => {
      if (generation !== this.generation) return;
      const current = Tone.now();
      if (options.loop && current + 0.15 >= nextCycle) {
        // Keep loop boundaries on the audio clock, even if a UI timer runs late.
        while (nextCycle < current + 0.01) nextCycle += beats * secondsPerBeat;
        if (current + 0.15 >= nextCycle) {
          schedule(nextCycle, 0);
          nextCycle += beats * secondsPerBeat;
        }
      }
      const elapsed = from + Math.max(0, (current - now) / secondsPerBeat);
      options.onPosition?.(
        options.loop ? elapsed % beats : Math.min(beats, elapsed),
      );
    }, 30);
    if (!options.loop)
      this.timer = setTimeout(
        () => {
          if (generation === this.generation) {
            this.stop();
            ended();
          }
        },
        ((beats - from) * secondsPerBeat + 1) * 1000,
      );
  }
}
