import { changeMelodyInstrument, type MelodyPart } from "./melody";
import {
  sampledInstruments,
  instrumentNames,
  melodyProfiles,
} from "./instruments";
import type { Progression } from "./harmony";
import { translate, type Locale } from "./i18n";
import { hasExpression } from "./expression";

export default function MelodyPanel({
  progression,
  locale,
  onChange,
  nextSeed,
  onPlay,
  playing,
}: {
  progression: Progression;
  locale: Locale;
  onChange: (p: Progression) => void;
  nextSeed: () => number;
  onPlay: () => void;
  playing: boolean;
}) {
  const t = translate.bind(null, locale);
  const part = progression.melody;
  const change = (patch: Partial<MelodyPart>, regenerate = false) => {
    if (part)
      onChange({
        ...progression,
        melody: {
          ...part,
          ...patch,
          ...(regenerate
            ? { manualNotes: undefined, manualBeats: undefined }
            : {}),
        },
      });
  };
  return (
    <section className="bass-panel melody-panel" aria-label={t("Dallam")}>
      <div className="section-top">
        <div>
          <h3>{t("Dallam")}</h3>
          <p>
            {t(
              "Visszatérő motívumok, válaszok és szünetek a harmóniára építve.",
            )}
          </p>
        </div>
        {!part ? (
          <button
            className="secondary"
            onClick={() =>
              onChange({
                ...progression,
                melody: {
                  seed: nextSeed(),
                  density: "balanced",
                  range: "narrow",
                  repetition: "high",
                  ending: "loop",
                  instrument: "piano",
                  volume: 70,
                  muted: false,
                },
              })
            }
          >
            {t("Dallam hozzáadása")}
          </button>
        ) : (
          <button
            className="secondary"
            onClick={() =>
              onChange({
                ...progression,
                melody: undefined,
                ...(!progression.bass
                  ? { chordsMuted: false, chordVolume: undefined }
                  : {}),
              })
            }
          >
            {t("Dallam eltávolítása")}
          </button>
        )}
      </div>
      {part ? (
        <>
          <div className="bass-controls">
            <label>
              {t("Dallamsűrűség")}
              <select
                value={part.density}
                onChange={(e) =>
                  change(
                    { density: e.target.value as MelodyPart["density"] },
                    true,
                  )
                }
              >
                <option value="sparse">{t("Ritka")}</option>
                <option value="balanced">{t("Közepes")}</option>
                <option value="busy">{t("Mozgalmas")}</option>
              </select>
            </label>
            <label>
              {t("Hangterjedelem")}
              <select
                value={part.range}
                onChange={(e) =>
                  change({ range: e.target.value as MelodyPart["range"] }, true)
                }
              >
                <option value="narrow">{t("Egy oktáv")}</option>
                <option value="wide">{t("Két oktáv")}</option>
              </select>
            </label>
            <label>
              {t("Motívumismétlés")}
              <select
                value={part.repetition}
                onChange={(e) =>
                  change(
                    { repetition: e.target.value as MelodyPart["repetition"] },
                    true,
                  )
                }
              >
                <option value="high">{t("Visszatérő")}</option>
                <option value="low">{t("Változatos")}</option>
              </select>
            </label>
            <label>
              {t("Lezárás")}
              <select
                value={part.ending}
                onChange={(e) =>
                  change(
                    { ending: e.target.value as MelodyPart["ending"] },
                    true,
                  )
                }
              >
                <option value="loop">{t("Visszavezető")}</option>
                <option value="resolved">{t("Megnyugvó")}</option>
              </select>
            </label>
            <button
              className="secondary"
              onClick={() => change({ seed: nextSeed() }, true)}
            >
              {t("Új dallamvariáció")}
            </button>
          </div>
          <div className="bass-controls">
            <label>
              {t("Dallam hangszíne")}
              <select
                value={part.instrument}
                onChange={(e) =>
                  onChange(
                    changeMelodyInstrument(
                      progression,
                      e.target.value as MelodyPart["instrument"],
                    ),
                  )
                }
              >
                {sampledInstruments.map((id) => (
                  <option key={id} value={id}>
                    {t(instrumentNames[id])}
                  </option>
                ))}
                <option value="lead">{t("Lágy szintidallam")}</option>
              </select>
            </label>
            <button
              className="secondary"
              aria-pressed={part.muted}
              onClick={() => change({ muted: !part.muted })}
            >
              {part.muted ? t("Dallam visszakapcsolása") : t("Dallam némítása")}
            </button>
            <label>
              {t("Dallam hangereje")} · {part.volume}%
              <input
                type="range"
                min="0"
                max="100"
                value={part.volume}
                onChange={(e) => change({ volume: Number(e.target.value) })}
              />
            </label>
            {!progression.bass ? (
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
            ) : null}
            <button className="secondary" onClick={onPlay}>
              {playing ? t("Leállítás") : t("Teljes menet meghallgatása")}
            </button>
          </div>
          <p className="bass-hint" aria-live="polite">
            {t(melodyProfiles[part.instrument].hint)}{" "}
            {t(
              "A hangszínváltás a generált dallamot a hangszerhez igazítja. A kézi szerkesztés ritmusát megőrzi, hangjait az új hangterjedelembe illeszti.",
            )}
          </p>
          {hasExpression(part.instrument) ? (
            <p className="bass-hint">
              {t(
                "A MIDI-export dinamikagörbét és finom vibratóvezérlést is tartalmaz; fúvósoknál légzésvezérlést is. A megszólalás a fogadó hangszer beállításaitól függ.",
              )}
            </p>
          ) : null}
          <p className="bass-hint">
            {t(
              "A generálási vezérlők új dallamot készítenek, felülírva a kézi hangmódosításokat. Az időzítésváltás arányosan átméretezi a kézzel szerkesztett dallamot. A némítás és hangerő csak az előnézetre hat.",
            )}
          </p>
        </>
      ) : null}
    </section>
  );
}
