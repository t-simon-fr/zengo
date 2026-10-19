import { describe, expect, it } from "vitest";
import { Midi } from "@tonejs/midi";
import { english, translate } from "./i18n";
import { generate, keyName, moods } from "./harmony";
import { exportMidi } from "./midi";

describe("localization", () => {
  it("covers the catalog and preserves every interpolation in English", () => {
    for (const [source, translated] of Object.entries(english)) {
      expect(translated.trim().length).toBeGreaterThan(0);
      expect(translated.match(/\{\w+\}/g)?.sort() ?? []).toEqual(
        source.match(/\{\w+\}/g)?.sort() ?? [],
      );
    }
    for (const mood of moods) {
      expect(translate("en", mood.name)).not.toBe(mood.name);
      expect(translate("en", mood.hint)).not.toBe(mood.hint);
    }
    expect(translate("hu", "{n}. ütem", { n: 2 })).toBe("2. ütem");
    expect(translate("en", "{n}. ütem", { n: 2 })).toBe("Bar 2");
    expect(
      translate("en", "{note} feljebb egy skálahanggal", { note: "C4" }),
    ).toBe("Move C4 up one scale step");
  });
  it("uses musical terminology and locale-specific key names", () => {
    expect(translate("en", "Fordítás")).toBe("Inversion");
    expect(translate("en", "Alapállás")).toBe("Root position");
    expect(translate("en", "Hangfekvés")).toBe("Register");
    expect(keyName({ root: 9, mode: "minor" }, "en")).toBe("A minor");
    expect(keyName({ root: 0, mode: "major" }, "en")).toBe("C major");
    expect(keyName({ root: 9, mode: "minor" }, "hu")).toBe("A moll");
  });
  it("localizes MIDI track metadata without altering notes or timing", () => {
    const progression = generate(
      { root: 9, mode: "minor" },
      "dark",
      99,
      "lush",
    )[0];
    const hu = new Midi(exportMidi(progression, 110, "hu"));
    const en = new Midi(exportMidi(progression, 110, "en"));
    expect(en.tracks[0].name).toBe("Zengo - Chords");
    expect(
      en.tracks[0].notes.map((n) => [n.midi, n.ticks, n.durationTicks]),
    ).toEqual(
      hu.tracks[0].notes.map((n) => [n.midi, n.ticks, n.durationTicks]),
    );
    expect(en.header.tempos).toEqual(hu.header.tempos);
  });
});
