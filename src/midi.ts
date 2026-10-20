import { Midi } from "@tonejs/midi";
import type { Progression } from "./harmony";
import { translate, type Locale } from "./i18n";
import { progressionBeats } from "./timing";
import { grooveNotes } from "./groove";
import { midiPrograms, type Instrument } from "./instruments";
import { expressionEvents } from "./expression";
export function exportMidi(
  progression: Progression,
  tempo: number,
  locale: Locale = "hu",
  instrument: Instrument = "piano",
): Uint8Array {
  const midi = new Midi();
  midi.header.setTempo(tempo);
  midi.header.timeSignatures = [{ ticks: 0, timeSignature: [4, 4] }];
  midi.header.update();
  const track = midi.addTrack();
  // MIDI text events use single-byte characters; keep metadata ASCII-compatible.
  track.name = translate(locale, "Zengo - Akkordok");
  track.instrument.number = midiPrograms[instrument];
  grooveNotes(progression, "chords", tempo).forEach((n) =>
    track.addNote({
      midi: n.midi,
      ticks: Math.round(n.startBeat * midi.header.ppq),
      durationTicks: Math.round(n.durationBeats * midi.header.ppq),
      velocity: n.velocity,
    }),
  );
  // Include any rest after the final hit in the exported clip length.
  track.addCC({
    number: 123,
    value: 0,
    ticks: Math.round(progressionBeats(progression) * midi.header.ppq),
  });
  if (progression.bass) {
    const bass = midi.addTrack();
    bass.name = translate(locale, "Zengo - Basszus");
    bass.channel = 1;
    bass.instrument.number = progression.bass.instrument === "sub" ? 38 : 39;
    for (const note of grooveNotes(progression, "bass", tempo))
      bass.addNote({
        midi: note.midi,
        ticks: Math.round(note.startBeat * midi.header.ppq),
        durationTicks: Math.max(
          1,
          Math.round(note.durationBeats * midi.header.ppq),
        ),
        velocity: note.velocity,
      });
    bass.addCC({
      number: 123,
      value: 0,
      ticks: Math.round(progressionBeats(progression) * midi.header.ppq),
    });
  }
  if (progression.melody) {
    const melody = midi.addTrack();
    melody.name = translate(locale, "Zengo - Dallam");
    melody.channel = 2;
    melody.instrument.number = midiPrograms[progression.melody.instrument];
    const notes = grooveNotes(progression, "melody", tempo);
    for (const n of notes)
      melody.addNote({
        midi: n.midi,
        ticks: Math.round(n.startBeat * midi.header.ppq),
        durationTicks: Math.max(
          1,
          Math.round(n.durationBeats * midi.header.ppq),
        ),
        velocity: n.velocity,
      });
    for (const event of expressionEvents(
      notes,
      progression.melody.instrument,
      tempo,
    ))
      melody.addCC({
        number: event.controller,
        value: event.value,
        ticks: Math.round(event.beat * midi.header.ppq),
      });
    melody.addCC({
      number: 123,
      value: 0,
      ticks: Math.round(progressionBeats(progression) * midi.header.ppq),
    });
  }
  if (progression.drums) {
    const drums = midi.addTrack();
    drums.name = translate(locale, "Zengo - Dobok");
    drums.channel = 9;
    for (const n of grooveNotes(progression, "drums", tempo))
      drums.addNote({
        midi: n.midi,
        ticks: Math.round(n.startBeat * midi.header.ppq),
        durationTicks: Math.max(
          1,
          Math.round(n.durationBeats * midi.header.ppq),
        ),
        velocity: n.velocity,
      });
    drums.addCC({
      number: 123,
      value: 0,
      ticks: Math.round(progressionBeats(progression) * midi.header.ppq),
    });
  }
  return midi.toArray();
}
export function download(data: BlobPart, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
