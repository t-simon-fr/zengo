import { drumSteps, drumLanes, type DrumPart } from "./drums";
import type { Progression } from "./harmony";
import { translate, type Locale } from "./i18n";
export default function DrumPanel({
  progression: p,
  locale,
  onChange,
  nextSeed,
  position,
}: {
  progression: Progression;
  locale: Locale;
  onChange: (p: Progression) => void;
  nextSeed: () => number;
  position: number | null;
}) {
  const t = translate.bind(null, locale),
    part = p.drums;
  const change = (patch: Partial<DrumPart>) => {
    if (part) onChange({ ...p, drums: { ...part, ...patch } });
  };
  const names = { kick: "Lábdob", snare: "Pergő", hat: "Lábcin" } as const;
  return (
    <section className="bass-panel" aria-label={t("Dobok")}>
      <div className="section-top">
        <h3>{t("Dobok")}</h3>
        {part ? (
          <button
            className="secondary"
            onClick={() => onChange({ ...p, drums: undefined })}
          >
            {t("Dobok eltávolítása")}
          </button>
        ) : (
          <button
            className="secondary"
            onClick={() =>
              onChange({
                ...p,
                drums: {
                  style: "steady",
                  seed: nextSeed(),
                  muted: false,
                  volume: 75,
                },
              })
            }
          >
            {t("Dobok hozzáadása")}
          </button>
        )}
      </div>
      {part ? (
        <>
          <div className="bass-controls">
            <label>
              {t("Dobminta")}
              <select
                value={part.style}
                onChange={(e) =>
                  change({
                    style: e.target.value as DrumPart["style"],
                    steps: undefined,
                  })
                }
              >
                <option value="steady">{t("Egyenes groove")}</option>
                <option value="half">{t("Féltempós groove")}</option>
                <option value="broken">{t("Tört groove")}</option>
              </select>
            </label>
            <button
              className="secondary"
              onClick={() => change({ seed: nextSeed(), steps: undefined })}
            >
              {t("Új dobvariáció")}
            </button>
            <button
              className="secondary"
              aria-pressed={part.muted}
              onClick={() => change({ muted: !part.muted })}
            >
              {part.muted ? t("Dobok visszakapcsolása") : t("Dobok némítása")}
            </button>
            <label>
              {t("Dobok hangereje")} · {part.volume}%
              <input
                type="range"
                min="0"
                max="100"
                value={part.volume}
                onChange={(e) => change({ volume: Number(e.target.value) })}
              />
            </label>
          </div>
          <p className="bass-hint">
            {t(
              "Egy ütemes, ismétlődő dobminta. Kapcsold a tizenhatodokat a gombokkal; a swing és a humanizálás minden szólamra hat.",
            )}
          </p>
          <div className="drum-scroll">
            <div className="drum-grid">
              <span />
              {Array.from({ length: 16 }, (_, i) => (
                <span key={i}>{i % 4 === 0 ? i / 4 + 1 : "·"}</span>
              ))}
              {drumLanes.map((l) => (
                <div className="drum-row" key={l}>
                  <strong>{t(names[l])}</strong>
                  {drumSteps(part)[l].map((enabled, i) => (
                    <button
                      key={i}
                      aria-label={t("{lane}, {n}. lépés", {
                        lane: t(names[l]),
                        n: i + 1,
                      })}
                      aria-pressed={enabled}
                      className={`${enabled ? "on" : ""} ${position !== null && Math.floor(position * 4) % 16 === i ? "current" : ""}`}
                      onClick={() =>
                        change({
                          steps: {
                            ...drumSteps(part),
                            [l]: drumSteps(part)[l].map((v, j) =>
                              i === j ? !v : v,
                            ),
                          },
                        })
                      }
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
