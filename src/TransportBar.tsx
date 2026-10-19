import type { Progression } from "./harmony";
import { progressionBeats } from "./timing";
import { translate, type Locale } from "./i18n";
export default function TransportBar({
  progression: p,
  locale,
  playing,
  position,
  cursor,
  loop,
  onLoop,
  onCursor,
  onPlay,
  onChange,
  loading,
}: {
  progression: Progression;
  locale: Locale;
  playing: boolean;
  position: number | null;
  cursor: number;
  loop: boolean;
  onLoop: (v: boolean) => void;
  onCursor: (v: number) => void;
  onPlay: () => void;
  onChange: (p: Progression) => void;
  loading: boolean;
}) {
  const t = translate.bind(null, locale),
    beats = progressionBeats(p),
    current = Math.min(
      beats - 0.001,
      position ?? Math.min(cursor, beats - 0.25),
    );
  return (
    <section className="transport" aria-label={t("Lejátszó")}>
      <div className="bass-controls">
        <button className="primary" onClick={onPlay}>
          {playing ? t("Leállítás") : t("Lejátszás innen")}
        </button>
        <label className="inline-check">
          <input
            type="checkbox"
            checked={loop}
            onChange={(e) => onLoop(e.target.checked)}
          />
          {t("Ismétlés")}
        </label>
        <label>
          {t("Indítási pont")}
          <select
            value={Math.min(cursor, beats - 0.25)}
            onChange={(e) => onCursor(Number(e.target.value))}
          >
            {Array.from({ length: beats * 4 }, (_, i) => i / 4).map((n) => (
              <option key={n} value={n}>
                {t("{bar}. ütem · {beat}. negyed", {
                  bar: Math.floor(n / 4) + 1,
                  beat: new Intl.NumberFormat(locale).format((n % 4) + 1),
                })}
              </option>
            ))}
          </select>
        </label>
        <output aria-live="off">
          {loading
            ? t("Zongorahang betöltése…")
            : t("{bar}. ütem · {beat}. negyed", {
                bar: Math.floor(current / 4) + 1,
                beat: new Intl.NumberFormat(locale, {
                  maximumFractionDigits: 1,
                }).format(Math.floor(((current % 4) + 1) * 10) / 10),
              })}
        </output>
      </div>
      <input
        aria-label={t("Lejátszási pozíció")}
        className="position-slider"
        type="range"
        min="0"
        max={beats - 0.25}
        step="0.25"
        value={Math.min(beats - 0.25, position ?? cursor)}
        onChange={(e) => onCursor(Number(e.target.value))}
      />
      <details className="groove-details">
        <summary>
          Groove{" "}
          <span>
            Swing · {p.groove?.swing ?? 0}% / {p.groove?.humanize ?? 0} ms
          </span>
        </summary>
        <div className="bass-controls">
          <label>
            Swing · {p.groove?.swing ?? 0}%
            <input
              aria-label="Swing"
              type="range"
              min="0"
              max="60"
              value={p.groove?.swing ?? 0}
              onChange={(e) =>
                onChange({
                  ...p,
                  groove: {
                    swing: Number(e.target.value),
                    humanize: p.groove?.humanize ?? 0,
                    seed: p.groove?.seed ?? 42,
                  },
                })
              }
            />
          </label>
          <label>
            {t("Finom időzítési eltérés")} · {p.groove?.humanize ?? 0} ms
            <input
              aria-label={t("Finom időzítési eltérés")}
              type="range"
              min="0"
              max="30"
              value={p.groove?.humanize ?? 0}
              onChange={(e) =>
                onChange({
                  ...p,
                  groove: {
                    swing: p.groove?.swing ?? 0,
                    humanize: Number(e.target.value),
                    seed: p.groove?.seed ?? 42,
                  },
                })
              }
            />
          </label>
          <small>
            {t(
              "A groove a lejátszásban és a MIDI-ben is hallható. A rács az eredeti hanghelyeket mutatja.",
            )}
          </small>
        </div>
      </details>
    </section>
  );
}
