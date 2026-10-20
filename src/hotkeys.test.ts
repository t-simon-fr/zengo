import { describe, it, expect } from "vitest";
import { shortcutFor } from "./hotkeys";
const key = (patch: Partial<Parameters<typeof shortcutFor>[0]> = {}) => ({
  key: " ",
  code: "Space",
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  repeat: false,
  isComposing: false,
  defaultPrevented: false,
  ...patch,
});
describe("DAW transport shortcuts", () => {
  it("maps Space, Ableton resume, FL pause, rewind, loop, save and undo", () => {
    expect(shortcutFor(key(), false)).toBe("toggle");
    expect(shortcutFor(key({ shiftKey: true }), false)).toBe("resume");
    expect(shortcutFor(key({ ctrlKey: true }), false)).toBe("resume");
    expect(shortcutFor(key({ key: "Home", code: "Home" }), false)).toBe(
      "rewind",
    );
    expect(shortcutFor(key({ key: "Escape", code: "Escape" }), false)).toBe(
      "stop",
    );
    for (const modifier of ["ctrlKey", "metaKey"] as const) {
      expect(
        shortcutFor(key({ key: "l", code: "KeyL", [modifier]: true }), false),
      ).toBe("loop");
      expect(
        shortcutFor(key({ key: "s", code: "KeyS", [modifier]: true }), false),
      ).toBe("save");
      expect(
        shortcutFor(key({ key: "z", code: "KeyZ", [modifier]: true }), false),
      ).toBe("undo");
    }
  });
  it("does not hijack value editing, IME composition, held keys or local editor actions", () => {
    expect(shortcutFor(key(), true)).toBeUndefined();
    for (const patch of [
      { repeat: true },
      { isComposing: true },
      { defaultPrevented: true },
      { altKey: true },
    ])
      expect(shortcutFor(key(patch), false)).toBeUndefined();
    expect(
      shortcutFor(key({ key: "ArrowRight", code: "ArrowRight" }), false),
    ).toBeUndefined();
    expect(
      shortcutFor(key({ key: "Delete", code: "Delete" }), false),
    ).toBeUndefined();
  });
});
