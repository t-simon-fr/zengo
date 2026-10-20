import * as Tone from "tone";
import { type Progression } from "./harmony";
import { progressionBeats } from "./timing";
import { grooveNotes, clipNotes, type Track } from "./groove";
import {
  isSampled,
  sampleNotes,
  sampleSettings,
  type SampledInstrument,
  type Instrument,
} from "./instruments";
export type { Instrument } from "./instruments";
import { expressionEvents, expressionAt, hasExpression } from "./expression";
import { FluteVoice } from "./flute-voice";

const sampleCache = new Map<
  SampledInstrument,
  Promise<Record<string, AudioBuffer>>
>();
function loadSamples(instrument: SampledInstrument) {
  const cached = sampleCache.get(instrument);
  if (cached) return cached;
  const pending = Promise.all(
    sampleNotes[instrument].map(
      async (note) =>
        [
          note,
          await Tone.ToneAudioBuffer.load(
            `${import.meta.env.BASE_URL}audio/${instrument}/${note.replace("#", "s")}.${instrument === "flute" ? "wav" : "mp3"}`,
          ),
        ] as const,
    ),
  )
    .then(Object.fromEntries)
    .catch((error: unknown) => {
      sampleCache.delete(instrument);
      throw error;
    });
  sampleCache.set(instrument, pending);
  return pending;
}

function sampledVoice(
  instrument: SampledInstrument,
  buffers: Record<string, AudioBuffer>,
  volume: number,
) {
  return instrument === "flute"
    ? new FluteVoice(buffers, volume)
    : new Tone.Sampler({
        urls: buffers,
        attack: sampleSettings[instrument].attack,
        release: sampleSettings[instrument].release,
        volume,
      });
}

export interface PlaybackOptions {
  loop?: boolean;
  startBeat?: number;
  onPosition?: (beat: number) => void;
}
export class Preview {
  private synth: Tone.PolySynth | Tone.Sampler | FluteVoice | undefined;
  private bass: Tone.MonoSynth | undefined;
  private melody: Tone.Sampler | Tone.Synth | FluteVoice | undefined;
  private expression: Tone.Gain | undefined;
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
    this.expression?.dispose();
    this.expression = undefined;
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
    const melodyPart = progression.melody;
    const needed = new Set<SampledInstrument>();
    if (
      isSampled(instrument) &&
      !progression.chordsMuted &&
      progression.chordVolume !== 0
    )
      needed.add(instrument);
    if (
      melodyPart &&
      isSampled(melodyPart.instrument) &&
      !melodyPart.muted &&
      melodyPart.volume > 0
    )
      needed.add(melodyPart.instrument);
    let buffers: Partial<
      Record<SampledInstrument, Record<string, AudioBuffer>>
    >;
    try {
      buffers = Object.fromEntries(
        await Promise.all(
          [...needed].map(async (id) => [id, await loadSamples(id)]),
        ),
      );
    } catch (error) {
      if (generation !== this.generation) return;
      throw error;
    }
    if (generation !== this.generation) return;
    this.synth = isSampled(instrument)
      ? buffers[instrument]
        ? sampledVoice(
            instrument,
            buffers[instrument]!,
            sampleSettings[instrument].gain +
              20 *
                Math.log10(
                  Math.max(0.001, (progression.chordVolume ?? 80) / 80),
                ),
          ).toDestination()
        : undefined
      : new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: "triangle" },
          envelope: { attack: 0.02, decay: 0.3, sustain: 0.3, release: 0.35 },
          volume:
            -14 +
            20 *
              Math.log10(Math.max(0.001, (progression.chordVolume ?? 80) / 80)),
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
      this.melody = isSampled(melody.instrument)
        ? sampledVoice(
            melody.instrument,
            buffers[melody.instrument]!,
            volume + sampleSettings[melody.instrument].gain + 8,
          )
        : new Tone.Synth({
            oscillator: { type: "triangle" },
            envelope: {
              attack: 0.015,
              decay: 0.15,
              sustain: 0.25,
              release: 0.3,
            },
            volume: volume - 8,
          });
      if (hasExpression(melody.instrument)) {
        this.expression = new Tone.Gain(1).toDestination();
        this.melody.connect(this.expression);
      } else this.melody.toDestination();
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
    const expression = melody
      ? expressionEvents(events.melody, melody.instrument, tempo)
      : [];
    const schedule = (audioStart: number, fromBeat: number) => {
      if (this.expression) {
        this.expression.gain.setValueAtTime(
          expressionAt(expression, fromBeat),
          audioStart,
        );
        for (const event of expression)
          if (
            event.controller === 11 &&
            event.beat > fromBeat &&
            event.beat <= beats
          )
            this.expression.gain.linearRampToValueAtTime(
              event.value,
              audioStart + (event.beat - fromBeat) * secondsPerBeat,
            );
      }
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
