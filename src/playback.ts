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
  onUpdating?: () => void;
}
const tracks: Track[] = ["chords", "bass", "melody", "drums"];
interface RunOptions extends PlaybackOptions {
  tracks?: Track[];
  synchronize?: () => { at: number; beat: number };
}
class PlaybackRun {
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
  private outputs = new Map<Track, Tone.Gain>();
  readonly liveTracks = new Set<Track>();
  private timeline?: {
    beats: number;
    from: number;
    at: number;
    secondsPerBeat: number;
    loop: boolean;
  };
  get startTime() {
    return this.timeline?.at ?? Tone.now();
  }
  get initialized() {
    return !!this.timeline;
  }
  positionAt(time = Tone.now()) {
    const t = this.timeline;
    if (!t) return 0;
    const beat = t.from + Math.max(0, time - t.at) / t.secondsPerBeat;
    return t.loop ? beat % t.beats : Math.min(t.beats, beat);
  }
  nextBoundary() {
    const t = this.timeline;
    if (!t) return Tone.now() + 0.05;
    const beat = t.from + (Tone.now() + 0.12 - t.at) / t.secondsPerBeat;
    const at = t.at + (Math.ceil(beat - 1e-8) - t.from) * t.secondsPerBeat;
    // A finite clip still ends at its existing endpoint when edited near its end.
    return t.loop
      ? at
      : Math.max(
          Tone.now() + 0.02,
          Math.min(at, t.at + (t.beats - t.from) * t.secondsPerBeat),
        );
  }
  fadeTracks(changed: Track[], at: number) {
    for (const track of changed) {
      if (!this.liveTracks.delete(track)) continue;
      const gain = this.outputs.get(track)?.gain;
      gain?.setValueAtTime(1, Math.max(Tone.now(), at - 0.005));
      gain?.linearRampToValueAtTime(0, at);
    }
  }
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
    this.outputs.forEach((output) => output.dispose());
    this.outputs.clear();
    this.liveTracks.clear();
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
    options: RunOptions = {},
  ) {
    this.stop();
    const generation = this.generation;
    await Tone.start();
    if (generation !== this.generation) return;
    const activeTracks = options.tracks ?? tracks;
    const melodyPart = progression.melody;
    const needed = new Set<SampledInstrument>();
    if (
      isSampled(instrument) &&
      activeTracks.includes("chords") &&
      !progression.chordsMuted &&
      progression.chordVolume !== 0
    )
      needed.add(instrument);
    if (
      melodyPart &&
      activeTracks.includes("melody") &&
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
    for (const track of activeTracks) {
      this.liveTracks.add(track);
      this.outputs.set(track, new Tone.Gain(1).toDestination());
    }
    const output = (track: Track) => this.outputs.get(track)!;
    this.synth = !activeTracks.includes("chords")
      ? undefined
      : isSampled(instrument)
        ? buffers[instrument]
          ? sampledVoice(
              instrument,
              buffers[instrument]!,
              sampleSettings[instrument].gain +
                20 *
                  Math.log10(
                    Math.max(0.001, (progression.chordVolume ?? 80) / 80),
                  ),
            ).connect(output("chords"))
          : undefined
        : new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: { attack: 0.02, decay: 0.3, sustain: 0.3, release: 0.35 },
            volume:
              -14 +
              20 *
                Math.log10(
                  Math.max(0.001, (progression.chordVolume ?? 80) / 80),
                ),
          }).connect(output("chords"));
    if (
      progression.bass &&
      activeTracks.includes("bass") &&
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
      }).connect(output("bass"));
    }
    const melody = progression.melody;
    if (
      melody &&
      activeTracks.includes("melody") &&
      !melody.muted &&
      melody.volume > 0
    ) {
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
        this.expression = new Tone.Gain(1).connect(output("melody"));
        this.melody.connect(this.expression);
      } else this.melody.connect(output("melody"));
    }
    if (
      progression.drums &&
      activeTracks.includes("drums") &&
      !progression.drums.muted &&
      progression.drums.volume > 0
    ) {
      const volume = 20 * Math.log10(progression.drums.volume / 100);
      this.kick = new Tone.MembraneSynth({
        pitchDecay: 0.035,
        octaves: 5,
        envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.1 },
        volume: volume - 8,
      }).connect(output("drums"));
      const snareFilter = new Tone.Filter(1000, "highpass").connect(
          output("drums"),
        ),
        hatFilter = new Tone.Filter(7000, "highpass").connect(output("drums"));
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
    const sync = options.synchronize?.();
    const requested = sync?.beat ?? options.startBeat ?? 0;
    const from = options.loop
      ? ((requested % beats) + beats) % beats
      : Math.max(0, Math.min(beats, requested));
    const now = sync?.at ?? Tone.now() + 0.05;
    this.timeline = {
      beats,
      from,
      at: now,
      secondsPerBeat,
      loop: !!options.loop,
    };
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
          !this.liveTracks.has(track) ||
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
    if (!sync) options.onPosition?.(from);
    this.clock = setInterval(() => {
      if (generation !== this.generation) return;
      const current = Tone.now();
      if (current < now) return;
      const lookahead = Math.min(2, (beats * secondsPerBeat) / 2);
      if (options.loop && current + lookahead >= nextCycle) {
        // Recover in phase after a suspended/throttled tab instead of dropping
        // an entire cycle. Ordinary boundaries are scheduled well ahead.
        if (nextCycle < current + 0.01) {
          const restart = current + 0.05;
          const missed = (restart - nextCycle) / secondsPerBeat;
          schedule(restart, missed % beats);
          nextCycle +=
            (Math.floor(missed / beats) + 1) * beats * secondsPerBeat;
        }
        while (current + lookahead >= nextCycle) {
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
        (Math.max(0, now - Tone.now()) + (beats - from) * secondsPerBeat + 1) *
          1000,
      );
  }
}

interface PlaybackSettings {
  progression: Progression;
  tempo: number;
  instrument: Instrument;
  options: PlaybackOptions;
}
function trackSignatures(settings: PlaybackSettings): Record<Track, string> {
  const { progression: p, tempo, instrument } = settings;
  return Object.fromEntries(
    tracks.map((track) => [
      track,
      JSON.stringify([
        grooveNotes(p, track, tempo),
        track === "chords"
          ? [instrument, p.chordsMuted, p.chordVolume]
          : track === "drums"
            ? [p.drums?.muted, p.drums?.volume]
            : [p[track]?.instrument, p[track]?.muted, p[track]?.volume],
      ]),
    ]),
  ) as Record<Track, string>;
}

// Runs share an audio-clock phase. Replacing a part mutes only that old part
// at a quantized boundary; its accompaniment and already-sounding notes continue.
export class Preview {
  private current?: PlaybackRun;
  private pending?: PlaybackRun;
  private runs = new Set<PlaybackRun>();
  private retirements = new Set<ReturnType<typeof setTimeout>>();
  private revision = 0;
  private settings?: PlaybackSettings;
  private desired?: PlaybackSettings;
  private ended: () => void = () => {};
  private ready: () => void = () => {};
  private phaseRun() {
    const now = Tone.now();
    let phase: PlaybackRun | undefined;
    for (const run of this.runs) {
      if (
        run.initialized &&
        run.startTime <= now &&
        (!phase || run.startTime >= phase.startTime)
      )
        phase = run;
    }
    return phase ?? this.current;
  }
  get position() {
    return this.phaseRun()?.positionAt() ?? 0;
  }
  stop() {
    this.revision++;
    this.pending?.stop();
    this.pending = undefined;
    this.runs.forEach((run) => run.stop());
    this.runs.clear();
    this.retirements.forEach(clearTimeout);
    this.retirements.clear();
    this.current = undefined;
    this.settings = undefined;
    this.desired = undefined;
  }
  private finished(run: PlaybackRun) {
    if (this.current !== run) return;
    const ended = this.ended;
    this.stop();
    ended();
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
    const ticket = this.revision;
    this.ended = ended;
    this.ready = ready;
    this.settings = this.desired = { progression, tempo, instrument, options };
    const run = new PlaybackRun();
    this.current = run;
    this.runs.add(run);
    try {
      await run.play(
        progression,
        tempo,
        instrument,
        () => this.finished(run),
        () => {
          if (ticket === this.revision) ready();
        },
        {
          ...options,
          onPosition: (beat) => {
            if (this.phaseRun() === run) options.onPosition?.(beat);
          },
        },
      );
    } catch (error) {
      if (ticket !== this.revision) return;
      this.stop();
      throw error;
    }
  }
  async update(
    progression: Progression,
    tempo: number,
    instrument: Instrument,
    options: Pick<PlaybackOptions, "loop" | "startBeat"> = {},
  ) {
    if (!this.current || !this.settings) return;
    const previous = this.settings;
    const next: PlaybackSettings = {
      progression,
      tempo,
      instrument,
      options: { ...previous.options, ...options },
    };
    this.desired = next;
    const before = trackSignatures(previous),
      after = trackSignatures(next);
    const different = tracks.filter((track) => before[track] !== after[track]);
    const all =
      (!this.current.initialized && different.length > 0) ||
      tempo !== previous.tempo ||
      !!next.options.loop !== !!previous.options.loop ||
      progressionBeats(progression) !==
        progressionBeats(previous.progression) ||
      options.startBeat !== undefined;
    const changed = all ? tracks : different;
    // React may synchronize identical state while the initial audio is loading.
    // Leave that start request and its ready callback intact.
    if (!changed.length && !this.pending) {
      this.settings = next;
      return;
    }
    const ticket = ++this.revision;
    this.pending?.stop();
    this.pending = undefined;
    if (!changed.length) {
      this.settings = next;
      this.ready();
      return;
    }
    next.options.onUpdating?.();
    const run = new PlaybackRun();
    this.pending = run;
    try {
      await run.play(
        progression,
        tempo,
        instrument,
        () => this.finished(run),
        () => {},
        {
          ...next.options,
          tracks: changed,
          onPosition: (beat) => {
            if (this.phaseRun() === run) next.options.onPosition?.(beat);
          },
          synchronize: () => {
            const at = this.current!.nextBoundary();
            return {
              at,
              beat: options.startBeat ?? this.current!.positionAt(at),
            };
          },
        },
      );
    } catch (error) {
      run.stop();
      if (ticket !== this.revision) return;
      this.pending = undefined;
      this.ready();
      throw error;
    }
    if (ticket !== this.revision || !this.current) {
      run.stop();
      return;
    }
    for (const old of this.runs) {
      old.fadeTracks(changed, run.startTime);
      if (!old.liveTracks.size) {
        const retirement = setTimeout(
          () => {
            old.stop();
            this.runs.delete(old);
            this.retirements.delete(retirement);
          },
          Math.max(0, run.startTime - Tone.now() + 0.05) * 1000,
        );
        this.retirements.add(retirement);
      }
    }
    this.runs.add(run);
    this.current = run;
    this.pending = undefined;
    this.settings = next;
    this.ready();
  }
  async seek(beat: number) {
    const desired = this.desired;
    if (desired)
      await this.update(
        desired.progression,
        desired.tempo,
        desired.instrument,
        { loop: desired.options.loop, startBeat: beat },
      );
  }
}
