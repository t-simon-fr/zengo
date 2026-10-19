import { useRef, useState } from "react";
import {
  chordName,
  moveNoteInScale,
  moveNoteToPitchInScale,
  noteName,
  type Progression,
} from "./harmony";
import { translate, type Locale } from "./i18n";
import { chordHits } from "./rhythm";
import { progressionBeats } from "./timing";
export default function PianoRoll({
  locale,
  progression,
  active,
  onSelect,
  onMove,
}: {
  locale: Locale;
  progression: Progression;
  active: number;
  onSelect: (index: number) => void;
  onMove: (progression: Progression) => void;
}) {
  const t = translate.bind(null, locale);
  const roll = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    pointerId: number;
    chordIndex: number;
    noteIndex: number;
    startY: number;
    pitch: number;
    rowHeight: number;
    original: Progression;
    next: Progression;
  } | null>(null);
  const [dragPreview, setDragPreview] = useState<{
    progression: Progression;
    chordIndex: number;
    noteIndex: number;
  } | null>(null);
  const shown = dragPreview?.progression ?? progression;
  const bars = Math.ceil(progressionBeats(progression) / 4);
  const gridTemplateColumns = `44px ${progression.chords.map((c) => `minmax(0, ${c.durationBeats}fr)`).join(" ")}`;
  const low = Math.min(45, ...progression.chords.flatMap((c) => c.notes)) - 1;
  const high = Math.max(67, ...progression.chords.flatMap((c) => c.notes)) + 1;
  const pitches = Array.from({ length: high - low + 1 }, (_, i) => high - i);
  return (
    <div className="roll-scroll">
      <div
        className="piano-roll"
        style={{ minWidth: Math.max(470, 44 + bars * 110) }}
        ref={roll}
        tabIndex={-1}
        role="group"
        aria-label={t("Idővonal, {n} ütem", { n: bars })}
        onPointerMove={(e) => {
          const current = drag.current;
          if (!current || current.pointerId !== e.pointerId) return;
          const target = Math.max(
            low,
            Math.min(
              high,
              current.pitch +
                Math.round((current.startY - e.clientY) / current.rowHeight),
            ),
          );
          current.next = moveNoteToPitchInScale(
            current.original,
            current.chordIndex,
            current.noteIndex,
            target,
          );
          setDragPreview({
            progression: current.next,
            chordIndex: current.chordIndex,
            noteIndex: current.noteIndex,
          });
        }}
        onPointerUp={(e) => {
          const current = drag.current;
          if (!current || current.pointerId !== e.pointerId) return;
          drag.current = null;
          setDragPreview(null);
          if (e.currentTarget.hasPointerCapture(e.pointerId))
            e.currentTarget.releasePointerCapture(e.pointerId);
          if (current.next !== current.original) onMove(current.next);
        }}
        onPointerCancel={() => {
          drag.current = null;
          setDragPreview(null);
        }}
        onLostPointerCapture={() => {
          drag.current = null;
          setDragPreview(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape" && drag.current) {
            const pointerId = drag.current.pointerId;
            drag.current = null;
            setDragPreview(null);
            if (e.currentTarget.hasPointerCapture(pointerId))
              e.currentTarget.releasePointerCapture(pointerId);
          }
        }}
      >
        <div
          className="roll-ruler"
          style={{
            gridTemplateColumns: `44px repeat(${bars}, minmax(0, 1fr))`,
          }}
        >
          <span>4/4</span>
          {Array.from({ length: bars }, (_, i) => (
            <span key={i}>{t("{n}. ütem", { n: i + 1 })}</span>
          ))}
        </div>
        <div className="roll-head" style={{ gridTemplateColumns }}>
          <span>4/4</span>
          {progression.chords.map((c, i) => (
            <button
              key={i}
              onClick={() => onSelect(i)}
              aria-pressed={active === i}
              className={active === i ? "active" : ""}
            >
              <small>
                {t("{n}. akkord", { n: i + 1 })} ·{" "}
                {t("{n} negyed", {
                  n: new Intl.NumberFormat(locale).format(c.durationBeats),
                })}
              </small>
              {chordName(
                progression.key,
                c.degree,
                progression.voicing,
                c.color,
              )}
            </button>
          ))}
        </div>
        {pitches.map((pitch) => (
          <div
            className={`roll-row ${[1, 3, 6, 8, 10].includes(pitch % 12) ? "black-key" : ""}`}
            key={pitch}
            style={{ gridTemplateColumns }}
          >
            <span className="key-label">{noteName(pitch)}</span>
            {shown.chords.map((c, i) => (
              <div
                className={`roll-cell ${active === i ? "selected-cell" : ""}`}
                key={i}
                style={{ backgroundImage: "none" }}
              >
                {Array.from(
                  {
                    length:
                      Math.ceil(c.startBeat + c.durationBeats) -
                      Math.ceil(c.startBeat),
                  },
                  (_, beatIndex) => {
                    const beat = Math.ceil(c.startBeat) + beatIndex;
                    return (
                      <i
                        aria-hidden="true"
                        key={`beat-${beat}`}
                        className={`roll-guide ${beat % 4 === 0 ? "bar-guide" : ""}`}
                        style={{
                          left: `${((beat - c.startBeat) / c.durationBeats) * 100}%`,
                        }}
                      />
                    );
                  },
                )}
                {c.notes.flatMap((note, noteIndex) =>
                  note === pitch
                    ? chordHits(c, shown.rhythm).map((hit, hitIndex) => (
                        <button
                          key={`${noteIndex}-${hitIndex}`}
                          style={{
                            left: `calc(${(hit.offset / c.durationBeats) * 100}% + 1px)`,
                            width: `max(2px, calc(${(hit.duration / c.durationBeats) * 100}% - 2px))`,
                            right: "auto",
                          }}
                          className={`note ${dragPreview?.chordIndex === i && dragPreview?.noteIndex === noteIndex ? "is-dragging" : ""}`}
                          disabled={c.locked}
                          onClick={() => onSelect(i)}
                          onPointerDown={(e) => {
                            if (e.button !== 0 || !e.isPrimary || drag.current)
                              return;
                            e.preventDefault();
                            onSelect(i);
                            roll.current?.focus({ preventScroll: true });
                            drag.current = {
                              pointerId: e.pointerId,
                              chordIndex: i,
                              noteIndex,
                              startY: e.clientY,
                              pitch: note,
                              rowHeight:
                                e.currentTarget
                                  .closest(".roll-row")
                                  ?.getBoundingClientRect().height ?? 10,
                              original: progression,
                              next: progression,
                            };
                            roll.current?.setPointerCapture(e.pointerId);
                            setDragPreview({
                              progression,
                              chordIndex: i,
                              noteIndex,
                            });
                          }}
                          onKeyDown={(e) => {
                            if (e.key !== "ArrowUp" && e.key !== "ArrowDown")
                              return;
                            e.preventDefault();
                            e.stopPropagation();
                            onMove(
                              moveNoteInScale(
                                progression,
                                i,
                                noteIndex,
                                e.key === "ArrowUp" ? 1 : -1,
                              ),
                            );
                          }}
                          aria-label={t(
                            "{n}. akkord: {note}, kezdet: {beat}. negyed",
                            {
                              n: i + 1,
                              note: noteName(pitch),
                              beat: new Intl.NumberFormat(locale).format(
                                c.startBeat + hit.offset + 1,
                              ),
                            },
                          )}
                          title={t(
                            "Húzd fel vagy le. Nyílbillentyűkkel skálahangonként mozgatható.",
                          )}
                        />
                      ))
                    : [],
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
