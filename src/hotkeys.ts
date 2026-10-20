export type Shortcut =
  "toggle" | "resume" | "rewind" | "stop" | "loop" | "save" | "undo";
export function shortcutFor(
  event: Pick<
    KeyboardEvent,
    | "key"
    | "code"
    | "ctrlKey"
    | "metaKey"
    | "altKey"
    | "shiftKey"
    | "repeat"
    | "isComposing"
    | "defaultPrevented"
  >,
  editing: boolean,
): Shortcut | undefined {
  if (
    editing ||
    event.defaultPrevented ||
    event.repeat ||
    event.isComposing ||
    event.altKey
  )
    return;
  const modifier = event.ctrlKey || event.metaKey;
  if (event.code === "Space")
    return event.shiftKey || modifier ? "resume" : "toggle";
  if (modifier) {
    if (event.shiftKey) return;
    if (event.key.toLowerCase() === "l") return "loop";
    if (event.key.toLowerCase() === "s") return "save";
    if (event.key.toLowerCase() === "z") return "undo";
    return;
  }
  if (event.shiftKey) return;
  if (event.key === "Home") return "rewind";
  if (event.key === "Escape") return "stop";
}
