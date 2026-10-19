import { bassStyles, type BassPart, type BassStyle } from "./bass";
import { type Progression } from "./harmony";
import { translate, type Locale } from "./i18n";

export default function BassPanel({
  progression,
  locale,
  onChange,
  nextSeed,
}: {
  progression: Progression;
  locale: Locale;
  onChange: (next: Progression) => void;
  nextSeed: () => number;
}) {
  const t = translate.bind(null, locale);
  const part = progression.bass;
  const change = (patch: Partial<BassPart>) => {
    if (part) onChange({ ...progression, bass: { ...part, ...patch } });
  };
  return (
    <section className="bass-panel" aria-label={t("Basszus")}>
      <div className="section-top">
        <div>
          <h3>{t("Basszus")}</h3>
          <p>
            {t(
              "Az akkordokhoz illő mély szólam. Az akkordváltásokat automatikusan követi.",
            )}
          </p>
        </div>
        {!part ? (
          <button
            className="secondary"
            onClick={() =>
              onChange({
                ...progression,
                bass: {
                  style: "held",
                  seed: nextSeed(),
                  muted: false,
                  volume: 80,
                  instrument: "sub",
                },
              })
            }
          >
            {t("Basszus hozzáadása")}
          </button>
        ) : (
          <button
            className="secondary"
            onClick={() =>
              onChange({
                ...progression,
                bass: undefined,
                ...(!progression.melody
                  ? { chordsMuted: false, chordVolume: undefined }
                  : {}),
              })
            }
          >
            {t("Basszus eltávolítása")}
          </button>
        )}
      </div>
      {part ? (
        <>
          <div className="bass-controls">
            {progression.drums ? (
              <label className="inline-check">
                <input
                  type="checkbox"
                  checked={!!part.followDrums}
                  onChange={(e) =>
                    change({
                      followDrums: e.target.checked,
                      manualNotes: undefined,
                      manualBeats: undefined,
                    })
                  }
                />
                {t("Basszus a lábdobhoz")}
              </label>
            ) : null}
            <label>
              {t("Basszuskarakter")}
              <select
                value={part.style}
                disabled={!!part.followDrums && !!progression.drums}
                onChange={(e) =>
                  change({
                    style: e.target.value as BassStyle,
                    manualNotes: undefined,
                    manualBeats: undefined,
                  })
                }
              >
                {bassStyles.map((s) => (
                  <option key={s.id} value={s.id}>
                    {t(s.name)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("Basszus hangszíne")}
              <select
                value={part.instrument}
                onChange={(e) =>
                  change({
                    instrument: e.target.value as BassPart["instrument"],
                  })
                }
              >
                <option value="sub">{t("Lágy sub basszus")}</option>
                <option value="pluck">{t("Pengetett szintibasszus")}</option>
              </select>
            </label>
            <button
              className="secondary"
              disabled={!!part.followDrums && !!progression.drums}
              onClick={() =>
                change({
                  seed: nextSeed(),
                  manualNotes: undefined,
                  manualBeats: undefined,
                })
              }
            >
              {t("Új basszusvariáció")}
            </button>
          </div>
          {part.followDrums && progression.drums ? (
            <p className="bass-hint">
              {t(
                "A basszus a lábdob ritmusát követi. Saját basszusritmushoz kapcsold ki a követést.",
              )}
            </p>
          ) : null}
          <div className="bass-mixer">
            <div>
              <button
                className="secondary"
                aria-pressed={!!progression.chordsMuted}
                onClick={() =>
                  onChange({
                    ...progression,
                    chordsMuted: !progression.chordsMuted,
                  })
                }
              >
                {progression.chordsMuted
                  ? t("Akkordok visszakapcsolása")
                  : t("Akkordok némítása")}
              </button>
              <label>
                {t("Akkordok hangereje")} · {progression.chordVolume ?? 80}%
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progression.chordVolume ?? 80}
                  onChange={(e) =>
                    onChange({
                      ...progression,
                      chordVolume: Number(e.target.value),
                    })
                  }
                />
              </label>
            </div>
            <div>
              <button
                className="secondary"
                aria-pressed={part.muted}
                onClick={() => change({ muted: !part.muted })}
              >
                {part.muted
                  ? t("Basszus visszakapcsolása")
                  : t("Basszus némítása")}
              </button>
              <label>
                {t("Basszus hangereje")} · {part.volume}%
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={part.volume}
                  onChange={(e) => change({ volume: Number(e.target.value) })}
                />
              </label>
            </div>
          </div>
          <p className="bass-hint">
            {t(
              "A közös lejátszás az akkordokat és a basszust együtt szólaltatja meg. A MIDI külön sávokra exportálja őket; a némítás és hangerő az előnézetet szabályozza.",
            )}
          </p>
        </>
      ) : null}
    </section>
  );
}
