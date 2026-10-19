import { expect, it } from "vitest";
import { generate, moveNoteToPitchInScale, scale } from "./harmony";

it("snaps dragged notes to the scale without collisions, preserves other chords and respects locks", () => {
  for (let root = 0; root < 12; root++) {
    for (const mode of ["major", "minor"] as const) {
      const p = generate({ root, mode }, "dark", 42, "lush")[0];
      for (const target of [-10, 0, 36, 49, 60, 73, 127, 140]) {
        const result = moveNoteToPitchInScale(p, 0, 0, target);
        const notes = result.chords[0].notes;
        expect(notes[0]).toBeGreaterThanOrEqual(0);
        expect(notes[0]).toBeLessThanOrEqual(127);
        expect(scale(p.key)).toContain((((notes[0] - root) % 12) + 12) % 12);
        expect(new Set(notes).size).toBe(notes.length);
        expect(notes.slice(1)).toEqual(p.chords[0].notes.slice(1));
        expect(result.chords.slice(1)).toEqual(p.chords.slice(1));
      }
      expect(moveNoteToPitchInScale(p, 0, 0, p.chords[0].notes[0])).toBe(p);
      const locked = {
        ...p,
        chords: p.chords.map((c) => ({ ...c, locked: true })),
      };
      expect(moveNoteToPitchInScale(locked, 0, 0, 60)).toBe(locked);
    }
  }
});
