import { useRef, useState } from "react";
import { rawNotes, type Track } from "./groove";
import {
  editTrack,
  removeTrackNote,
  addTrackNote,
  trackPitches,
  lockedNote,
  type PitchedTrack,
} from "./tracks";
import { noteName, type Progression } from "./harmony";
import { translate, type Locale } from "./i18n";
import { progressionBeats } from "./timing";

export default function TrackEditor({
  progression: p,
  track,
  locale,
  onChange,
  cursor,
  onCursor,
  position,
}: {
  progression: Progression;
  track: PitchedTrack;
  locale: Locale;
  onChange: (p: Progression) => void;
  cursor: number;
  onCursor: (beat: number) => void;
  position: number | null;
}) {
  const t = translate.bind(null, locale),
    [selected, setSelected] = useState(0),
    [notice, setNotice] = useState(false),
    [grid, setGrid] = useState(0.25),
    [preview, setPreview] = useState<Progression | null>(null);
  const drag = useRef<{
    id: number;
    index: number;
    x: number;
    y: number;
    width: number;
    original: Progression;
    next: Progression;
    resize: boolean;
    moved: boolean;
  } | null>(null);
  const roll = useRef<HTMLDivElement>(null),
    notes = rawNotes(preview ?? p, track),
    beats = progressionBeats(p),
    pitches = trackPitches(p, track);
  const low =
    track === "bass"
      ? 26
      : track === "melody"
        ? Math.min(...pitches) - 2
        : Math.max(0, Math.min(48, ...notes.map((n) => n.midi)) - 1);
  const high =
    track === "bass"
      ? 54
      : track === "melody"
        ? Math.max(...pitches) + 2
        : Math.min(127, Math.max(72, ...notes.map((n) => n.midi)) + 1);
  const index = Math.min(selected, notes.length - 1),
    note = notes[index],
    locked = !!note && lockedNote(p, track, note);
  const cancel = () => {
    drag.current = null;
    setPreview(null);
  };
  const names: Record<Track, "Akkordok" | "Basszus" | "Dallam" | "Dobok"> = {
    chords: "Akkordok",
    bass: "Basszus",
    melody: "Dallam",
    drums: "Dobok",
  };
  return (
    <section
      className="track-editor"
      aria-label={t("Szólam szerkesztése") + ": " + t(names[track])}
    >
      <div className="bass-controls">
        <strong>{t(names[track])}</strong>
        <label>
          {t("Rács")}
          <select
            value={grid}
            onChange={(e) => setGrid(Number(e.target.value))}
          >
            <option value="0.25">1/16</option>
            <option value="0.5">1/8</option>
            <option value="1">1/4</option>
          </select>
        </label>
        <button
          className="secondary"
          onClick={() => {
            const next = addTrackNote(
              p,
              track,
              cursor,
              note?.midi ?? (track === "bass" ? 36 : 69),
            );
            if (next !== p) {
              setNotice(false);
              setSelected(rawNotes(p, track).length);
              onChange(next);
            } else setNotice(true);
          }}
        >
          {t("Hang hozzáadása")}
        </button>
        <button
          className="secondary"
          disabled={!note || locked}
          onClick={() => onChange(removeTrackNote(p, track, index))}
        >
          {t("Hang törlése")}
        </button>
        <button
          className="secondary"
          disabled={
            !(track === "chords"
              ? p.chordNotes
              : track === "bass"
                ? p.bass?.manualNotes
                : p.melody?.manualNotes)
          }
          onClick={() => {
            onChange(
              track === "chords"
                ? { ...p, chordNotes: undefined, chordNotesBeats: undefined }
                : track === "bass"
                  ? {
                      ...p,
                      bass: {
                        ...p.bass!,
                        manualNotes: undefined,
                        manualBeats: undefined,
                      },
                    }
                  : {
                      ...p,
                      melody: {
                        ...p.melody!,
                        manualNotes: undefined,
                        manualBeats: undefined,
                      },
                    },
            );
          }}
        >
          {t("Generált hangok visszaállítása")}
        </button>
      </div>
      <details className="editor-help">
        <summary>{t("Szerkesztési tippek")}</summary>
        <p className="bass-hint">
          {t(
            "Kattints a rácsra az indítási pont kijelöléséhez; dupla kattintással hangot adhatsz hozzá. A hang jobb szélét húzva a hosszát állítod. Nyilak: mozgatás, Delete: törlés, Escape: megszakítás.",
          )}
        </p>
      </details>
      {notice ? (
        <p role="status" className="bass-hint">
          {t(
            "Itt nincs szabad hely a hangnak, vagy az akkord rögzítve van. Válassz másik indítási pontot, vagy rövidítsd a meglévő hangot.",
          )}
        </p>
      ) : null}
      <div className="bass-roll-scroll">
        <div
          className="melody-roll"
          ref={roll}
          role="group"
          aria-label={t("Közös piano roll")}
          style={{
            minWidth: Math.max(540, beats * 35),
            height: 24 + (high - low + 1) * 12,
          }}
          onClick={(e) => {
            if (e.target !== e.currentTarget) return;
            const r = e.currentTarget.getBoundingClientRect();
            onCursor(
              Math.min(
                beats - grid,
                Math.max(
                  0,
                  Math.round(
                    (((e.clientX - r.left) / r.width) * beats) / grid,
                  ) * grid,
                ),
              ),
            );
          }}
          onDoubleClick={(e) => {
            if (e.target !== e.currentTarget) return;
            const r = e.currentTarget.getBoundingClientRect();
            const next = addTrackNote(
              p,
              track,
              ((e.clientX - r.left) / r.width) * beats,
              high - Math.floor((e.clientY - r.top - 24) / 12),
            );
            if (next !== p) {
              setSelected(rawNotes(p, track).length);
              onChange(next);
            }
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d || d.id !== e.pointerId) return;
            if (
              !d.moved &&
              Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) < 3
            )
              return;
            d.moved = true;
            const n = rawNotes(d.original, track)[d.index],
              delta = ((e.clientX - d.x) / d.width) * beats;
            d.next = editTrack(
              d.original,
              track,
              d.index,
              d.resize
                ? {
                    durationBeats: Math.max(
                      grid,
                      Math.round((n.durationBeats + delta) / grid) * grid,
                    ),
                  }
                : {
                    midi: n.midi + Math.round((d.y - e.clientY) / 12),
                    ...(Math.abs(e.clientX - d.x) > 4
                      ? { startBeat: n.startBeat + delta }
                      : {}),
                  },
              grid,
            );
            setPreview(d.next);
          }}
          onPointerUp={(e) => {
            const d = drag.current;
            if (!d || d.id !== e.pointerId) return;
            cancel();
            if (e.currentTarget.hasPointerCapture(e.pointerId))
              e.currentTarget.releasePointerCapture(e.pointerId);
            if (d.moved) onChange(d.next);
          }}
          onPointerCancel={cancel}
          onLostPointerCapture={cancel}
        >
          {Array.from({ length: high - low + 1 }, (_, i) => (
            <div key={i} className="melody-row" style={{ top: 24 + i * 12 }}>
              <span>{noteName(high - i)}</span>
            </div>
          ))}
          {Array.from({ length: Math.ceil(beats) }, (_, i) => (
            <div
              key={i}
              className={`melody-beat ${i % 4 === 0 ? "bar" : ""}`}
              style={{ left: `${(i / beats) * 100}%` }}
            >
              {i % 4 === 0 ? (
                <span>{t("{n}. ütem", { n: i / 4 + 1 })}</span>
              ) : null}
            </div>
          ))}
          <div
            className="roll-cursor"
            style={{ left: `${((position ?? cursor) / beats) * 100}%` }}
          />
          {notes.map((n, i) => (
            <button
              key={i}
              className={`melody-note ${index === i ? "active" : ""} ${position !== null && position >= n.startBeat && position < n.startBeat + n.durationBeats ? "sounding" : ""}`}
              style={{
                left: `${(n.startBeat / beats) * 100}%`,
                width: `${(n.durationBeats / beats) * 100}%`,
                top: 24 + (high - n.midi) * 12,
              }}
              aria-label={t("Hang {n}: {note}", {
                n: i + 1,
                note: noteName(n.midi),
              })}
              aria-pressed={index === i}
              onClick={() => setSelected(i)}
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                setSelected(i);
                e.currentTarget.focus();
                if (lockedNote(p, track, n)) return;
                const r = e.currentTarget.getBoundingClientRect();
                roll.current?.setPointerCapture(e.pointerId);
                drag.current = {
                  id: e.pointerId,
                  index: i,
                  x: e.clientX,
                  y: e.clientY,
                  width: roll.current!.getBoundingClientRect().width,
                  original: p,
                  next: p,
                  resize: e.clientX >= r.right - 7,
                  moved: false,
                };
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  cancel();
                  return;
                }
                if (e.key === "Delete" || e.key === "Backspace") {
                  e.preventDefault();
                  onChange(removeTrackNote(p, track, i));
                  return;
                }
                if (
                  !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
                    e.key,
                  )
                )
                  return;
                e.preventDefault();
                const j = pitches.indexOf(n.midi);
                onChange(
                  editTrack(
                    p,
                    track,
                    i,
                    e.shiftKey
                      ? {
                          durationBeats:
                            n.durationBeats +
                            (e.key === "ArrowRight" || e.key === "ArrowUp"
                              ? grid
                              : -grid),
                        }
                      : e.key === "ArrowUp" || e.key === "ArrowDown"
                        ? {
                            midi: pitches[
                              Math.max(
                                0,
                                Math.min(
                                  pitches.length - 1,
                                  j + (e.key === "ArrowUp" ? 1 : -1),
                                ),
                              )
                            ],
                          }
                        : {
                            startBeat:
                              n.startBeat +
                              (e.key === "ArrowRight" ? grid : -grid),
                          },
                    grid,
                  ),
                );
              }}
            >
              {noteName(n.midi)}
              <span className="resize-handle" />
            </button>
          ))}
        </div>
      </div>
      {note ? (
        <div className="bass-controls">
          <strong>
            {t("Kijelölt hang")}: {noteName(note.midi)}
          </strong>
          <label>
            {t("Hangmagasság")}
            <select
              disabled={locked}
              value={note.midi}
              onChange={(e) =>
                onChange(
                  editTrack(
                    p,
                    track,
                    index,
                    { midi: Number(e.target.value) },
                    grid,
                  ),
                )
              }
            >
              {pitches.map((n) => (
                <option key={n} value={n}>
                  {noteName(n)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("Kezdés · negyed")}
            <select
              disabled={locked}
              value={note.startBeat}
              onChange={(e) =>
                onChange(
                  editTrack(
                    p,
                    track,
                    index,
                    { startBeat: Number(e.target.value) },
                    grid,
                  ),
                )
              }
            >
              {[
                ...new Set([
                  note.startBeat,
                  ...Array.from(
                    { length: Math.ceil(beats / grid) },
                    (_, i) => i * grid,
                  ),
                ]),
              ]
                .sort((a, b) => a - b)
                .map((n) => (
                  <option key={n} value={n}>
                    {new Intl.NumberFormat(locale, {
                      maximumFractionDigits: 3,
                    }).format(n + 1)}
                  </option>
                ))}
            </select>
          </label>
          <label>
            {t("Hossz · negyed")}
            <select
              disabled={locked}
              value={note.durationBeats}
              onChange={(e) =>
                onChange(
                  editTrack(
                    p,
                    track,
                    index,
                    { durationBeats: Number(e.target.value) },
                    grid,
                  ),
                )
              }
            >
              {[
                ...new Set([
                  note.durationBeats,
                  0.25,
                  0.5,
                  0.75,
                  1,
                  1.5,
                  2,
                  3,
                  4,
                  8,
                ]),
              ]
                .sort((a, b) => a - b)
                .map((n) => (
                  <option key={n} value={n}>
                    {new Intl.NumberFormat(locale, {
                      maximumFractionDigits: 3,
                    }).format(n)}
                  </option>
                ))}
            </select>
          </label>
        </div>
      ) : (
        <p>{t("Üres szólam. Jelölj ki egy pontot, majd adj hozzá hangot.")}</p>
      )}
    </section>
  );
}
