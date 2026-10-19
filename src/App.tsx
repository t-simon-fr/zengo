import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  AudioLines,
  Check,
  ChevronDown,
  CircleHelp,
  Layers3,
  LockKeyhole,
  Music2,
  Pause,
  Play,
  RefreshCw,
  Save,
  SlidersHorizontal,
  Sparkles,
  Undo2,
  UnlockKeyhole,
  FolderOpen,
  FileDown,
} from "lucide-react";
import {
  chordInfo,
  chordName,
  availableColors,
  colorLabels,
  generate,
  keyName,
  moods,
  moveNoteInScale,
  noteName,
  pitchNames,
  replaceChord,
  vary,
  type Key,
  type Mood,
  type Progression,
  type Voicing,
  type ChordColor,
} from "./harmony";
import { rhythms, type Rhythm, type RhythmChoice } from "./rhythm";
import {
  applyTiming,
  progressionBeats,
  timingDurations,
  timings,
  type Timing,
} from "./timing";
import BassPanel from "./BassPanel";
import MelodyPanel from "./MelodyPanel";
import DrumPanel from "./DrumPanel";
import TrackEditor from "./TrackEditor";
import TransportBar from "./TransportBar";
import type { Track } from "./groove";

import {
  parseProject,
  storageKey,
  type Project,
  type Session,
} from "./project";
import { Preview, type Instrument } from "./playback";
import { download, exportMidi } from "./midi";
import { readLocale, translate, type Locale, type MessageKey } from "./i18n";

function readSaved() {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? parseProject(raw) : null;
  } catch {
    return null;
  }
}
export default function App() {
  const [locale, setLocale] = useState(readLocale);
  const t = translate.bind(null, locale);
  const [saved] = useState(readSaved);
  const [key, setKey] = useState<Key>(saved?.key ?? { root: 9, mode: "minor" });
  const [mood, setMood] = useState<Mood>(saved?.mood ?? "dark");
  const [voicing, setVoicing] = useState<Voicing>(saved?.voicing ?? "lush");
  const [rhythm, setRhythm] = useState<RhythmChoice>(saved?.rhythm ?? "auto");
  const [timing, setTiming] = useState<Timing>(saved?.timing ?? "bar");
  const [instrument, setInstrument] = useState<Instrument>(
    saved?.instrument ?? "synth",
  );
  const [tempo, setTempo] = useState(saved?.tempo ?? 110);
  const [tempoDraft, setTempoDraft] = useState(String(saved?.tempo ?? 110));
  const [session, setSession] = useState<Session>(
    saved?.session ?? { progressions: [], selected: null },
  );
  const [history, setHistory] = useState<Session[]>([]);
  const [active, setActive] = useState(0);
  const [advanced, setAdvanced] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [loadingSound, setLoadingSound] = useState(false);
  const [track, setTrack] = useState<Track>("chords");
  const [loop, setLoop] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [position, setPosition] = useState<number | null>(null);
  const [readingFile, setReadingFile] = useState(false);
  const projectInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<MessageKey | "">(
    saved ? "A legutóbb mentett projekt betöltve." : "",
  );
  const [error, setError] = useState<MessageKey | "">("");
  const preview = useRef(new Preview());
  const seed = useRef(Date.now() >>> 0);
  const selected = session.progressions.find((p) => p.id === session.selected);
  const chord = selected?.chords[active];
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = translate(locale, "Zengo — Ötletből zene");
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        "content",
        translate(
          locale,
          "Hangulatból akkordmenet. Helyben működő zenei ötletalkotó, szerkesztő és MIDI-export.",
        ),
      );
  }, [locale]);
  function changeLocale(next: Locale) {
    setLocale(next);
    try {
      localStorage.setItem("zengo-locale", next);
    } catch {
      // Language switching still works when browser storage is unavailable.
    }
  }
  useEffect(() => {
    const player = preview.current;
    return () => player.stop();
  }, []);
  function stop() {
    preview.current.stop();
    setPlaying(null);
    setLoadingSound(false);
    setPosition(null);
  }
  function seek(beat: number) {
    stop();
    setCursor(beat);
  }
  function commitTempo() {
    const entered = tempoDraft.trim() === "" ? NaN : Number(tempoDraft);
    const next = Number.isFinite(entered)
      ? Math.max(40, Math.min(220, Math.round(entered)))
      : tempo;
    if (next !== tempo) stop();
    setTempo(next);
    setTempoDraft(String(next));
  }
  function commit(next: Session) {
    stop();
    setHistory((h) => [...h.slice(-29), session]);
    setSession(next);
    setMessage("");
  }
  function update(next: Progression) {
    const previous = session.progressions.find((p) => p.id === next.id);
    if (
      previous?.chordNotes &&
      next.chordNotes === previous.chordNotes &&
      (previous.rhythm !== next.rhythm ||
        JSON.stringify(
          previous.chords.map((c) => [c.degree, c.color, c.notes]),
        ) !==
          JSON.stringify(next.chords.map((c) => [c.degree, c.color, c.notes])))
    )
      next = { ...next, chordNotes: undefined, chordNotesBeats: undefined };
    commit({
      ...session,
      progressions: session.progressions.map((p) =>
        p.id === next.id ? next : p,
      ),
    });
  }
  function create() {
    commit({
      progressions: generate(
        key,
        mood,
        ++seed.current,
        voicing,
        rhythm,
        timing,
      ),
      selected: null,
    });
    setActive(0);
    setMessage("Négy új ötlet elkészült. Hallgasd meg, majd válassz egyet.");
  }
  async function play(p: Progression) {
    if (playing === p.id) {
      stop();
      return;
    }
    setError("");
    setPlaying(p.id);
    setLoadingSound(instrument === "piano" || p.melody?.instrument === "piano");
    try {
      await preview.current.play(
        p,
        tempo,
        instrument,
        () => {
          setPlaying(null);
          setPosition(null);
        },
        () => setLoadingSound(false),
        {
          loop,
          startBeat: p.id === session.selected ? cursor : 0,
          onPosition: setPosition,
        },
      );
    } catch {
      stop();
      setError(
        instrument === "piano" || p.melody?.instrument === "piano"
          ? "A zongorahang betöltése vagy indítása nem sikerült. Próbáld újra, vagy válaszd a szintetizátort."
          : "Nem sikerült elindítani a hangot. Ellenőrizd a böngésző hangengedélyét, majd próbáld újra.",
      );
    }
  }
  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    stop();
    setSession(previous);
    setHistory((h) => h.slice(0, -1));
    setMessage("Az utolsó változtatás visszavonva.");
  }
  function save() {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          version: 1,
          key,
          mood,
          voicing,
          rhythm,
          timing,
          instrument,
          tempo,
          session,
        } satisfies Project),
      );
      setMessage(
        "Projekt mentve ebben a böngészőben. A következő megnyitáskor visszatöltjük.",
      );
    } catch {
      setError(
        "A böngésző nem engedélyezte a helyi mentést. A MIDI-export továbbra is használható.",
      );
    }
  }
  function projectData(): Project {
    return {
      version: 1,
      key,
      mood,
      voicing,
      rhythm,
      timing,
      instrument,
      tempo,
      session,
    };
  }
  function exportProject() {
    download(
      JSON.stringify(projectData(), null, 2),
      "zengo-project.zengo.json",
      "application/json",
    );
    setMessage("A projektfájl elkészült. Másik böngészőben is megnyithatod.");
  }
  async function openProject(file: File) {
    setReadingFile(true);
    setError("");
    try {
      if (file.size > 2_000_000) throw new Error("size");
      const project = parseProject(await file.text());
      if (!project) throw new Error("invalid");
      stop();
      setKey(project.key);
      setMood(project.mood);
      setVoicing(project.voicing);
      setRhythm(project.rhythm ?? "auto");
      setTiming(project.timing ?? "bar");
      setInstrument(project.instrument ?? "synth");
      setTempo(project.tempo);
      setTempoDraft(String(project.tempo));
      setSession(project.session);
      setHistory([]);
      setActive(0);
      setCursor(0);
      setTrack("chords");
      setMessage(
        "Projektfájl megnyitva. A böngészős mentéshez használd a Projekt mentése gombot.",
      );
    } catch {
      setError(
        "Nem érvényes Zengo-projektfájl, vagy túl nagy (legfeljebb 2 MB). A jelenlegi projekt megmaradt.",
      );
    } finally {
      setReadingFile(false);
    }
  }
  function midi() {
    if (!selected) return;
    try {
      const bytes = exportMidi(selected, tempo, locale);
      download(
        bytes.slice().buffer,
        `zengo-${keyName(selected.key, locale).replaceAll(" ", "-")}-${tempo}bpm.mid`,
        "audio/midi",
      );
      setMessage(
        "A MIDI-fájl elkészült. Az FL Studio piano rolljába importálhatod.",
      );
    } catch {
      setError("A MIDI-export nem sikerült. Próbáld újra.");
    }
  }
  const settingsChanged =
    session.progressions.length > 0 &&
    (session.progressions[0].key.root !== key.root ||
      session.progressions[0].key.mode !== key.mode ||
      session.progressions[0].mood !== mood ||
      (session.progressions[0].timing ?? "bar") !== timing ||
      (rhythm !== "auto" && session.progressions[0].rhythm !== rhythm));
  const voicingChanged =
    session.progressions.length > 0 &&
    session.progressions[0].voicing !== voicing;
  return (
    <div className="app-shell">
      <div className="ambient-background" aria-hidden="true">
        <i />
        <i />
      </div>
      <header className="header">
        <a className="brand" href="#main">
          <span className="brand-icon">
            <AudioLines size={28} />
          </span>
          <span>
            <span className="brand-flow">Zengo</span>
            <small>{t("ÖTLETBŐL ZENE.")}</small>
          </span>
        </a>
        <div className="header-center">
          <span className="status-dot" /> {t("Helyben működik")}{" "}
          <span className="header-divider" /> {t("Akkordműhely")}
        </div>
        <div className="header-actions">
          <label className="language-select">
            <span className="sr-only">{t("Nyelv")}</span>
            <select
              aria-label={t("Nyelv")}
              value={locale}
              onChange={(e) => changeLocale(e.target.value as Locale)}
            >
              <option value="hu" lang="hu">
                Magyar
              </option>
              <option value="en" lang="en">
                English
              </option>
            </select>
          </label>
          <input
            ref={projectInput}
            type="file"
            className="sr-only"
            accept=".json,.zengo"
            aria-label={t("Projektfájl kiválasztása")}
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              e.currentTarget.value = "";
              if (file) void openProject(file);
            }}
          />
          <button
            className="secondary"
            disabled={readingFile}
            aria-label={t("Projektfájl megnyitása")}
            title={t("Projektfájl megnyitása")}
            onClick={() => projectInput.current?.click()}
          >
            <FolderOpen size={16} />
            <span>{t("Megnyitás")}</span>
          </button>
          <button
            className="secondary"
            aria-label={t("Projektfájl letöltése")}
            title={t("Projektfájl letöltése")}
            onClick={exportProject}
          >
            <FileDown size={16} />
            <span>{t("Projektfájl")}</span>
          </button>
          <button
            className="secondary"
            onClick={save}
            aria-label={t("Projekt mentése")}
            title={t("Projekt mentése")}
          >
            <Save size={16} />
            <span>{t("Projekt mentése")}</span>
          </button>
          <button
            className="primary"
            onClick={midi}
            disabled={!selected}
            aria-label={t("MIDI export")}
            title={t("MIDI export")}
          >
            <ArrowDownToLine size={16} />
            <span>{t("MIDI export")}</span>
          </button>
        </div>
      </header>
      <main id="main">
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              {t("A KÖVETKEZŐ ÖTLETED ITT KEZDŐDIK")}
            </div>
            <h1>
              {t("Adj hangot a hangulatodnak")}
              <span>.</span>
            </h1>
            <p>
              {t(
                "Válassz egy érzést. Találj egy akkordmenetet. Tedd a sajátoddá.",
              )}
            </p>
          </div>
          <div className="hero-sculpture" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="sound-ribbon">
              {Array.from({ length: 27 }, (_, i) => (
                <i
                  key={i}
                  style={{
                    height: `${28 + Math.sin(i * 0.53) ** 2 * 88}px`,
                    animationDelay: `${i * -0.12}s`,
                  }}
                />
              ))}
            </div>
            <span className="sculpture-caption">ZENGO / STUDIO</span>
          </div>
        </div>
        <section className="panel mood-panel" aria-labelledby="mood-heading">
          <div className="section-top">
            <div>
              <h2 id="mood-heading">{t("Milyen legyen a hangulat?")}</h2>
              <p>
                {t("Egy kiindulópont a zenédhez. Nincsenek rossz válaszok.")}
              </p>
            </div>
            <span className="subtle">{t("01 / HANGULAT")}</span>
          </div>
          <div className="mood-grid">
            {moods.map((m) => (
              <button
                key={m.id}
                aria-pressed={mood === m.id}
                className={`mood-card mood-${m.id} ${mood === m.id ? "is-selected" : ""}`}
                onClick={() => setMood(m.id)}
              >
                <span className="mood-art" aria-hidden="true">
                  <span>{m.symbol}</span>
                  <i />
                  <i />
                  <i />
                </span>
                <span className="mood-copy">
                  <strong>{t(m.name)}</strong>
                  <small>{t(m.hint)}</small>
                </span>
                {mood === m.id ? (
                  <span className="mood-check">
                    <Check size={12} />
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          <div className={`generation-bar ${advanced ? "expanded" : ""}`}>
            <label>
              {t("Hangnem")}
              <select
                value={`${key.root}-${key.mode}`}
                onChange={(e) => {
                  const [root, mode] = e.target.value.split("-");
                  setKey({ root: Number(root), mode: mode as Key["mode"] });
                }}
              >
                {(["minor", "major"] as const).map((mode) => (
                  <optgroup
                    key={mode}
                    label={
                      mode === "minor"
                        ? t("Moll hangnemek")
                        : t("Dúr hangnemek")
                    }
                  >
                    {pitchNames.map((_, root) => (
                      <option key={`${root}-${mode}`} value={`${root}-${mode}`}>
                        {keyName({ root, mode }, locale)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className="tempo-input">
              {t("Tempó")}{" "}
              <span className="input-wrap">
                <input
                  type="number"
                  aria-label={t("Tempó")}
                  min="40"
                  max="220"
                  value={tempoDraft}
                  inputMode="numeric"
                  step="1"
                  title={t(
                    "40–220 BPM. A gépelt értéket Enterrel vagy a mező elhagyásával véglegesítheted.",
                  )}
                  onChange={(e) => {
                    stop();
                    setTempoDraft(e.target.value);
                  }}
                  onBlur={commitTempo}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.currentTarget.blur();
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setTempoDraft(String(tempo));
                    }
                  }}
                />
                <span>BPM</span>
              </span>
            </label>
            <label className="instrument-input">
              {t("Lejátszás hangszíne")}
              <select
                value={instrument}
                onChange={(e) => {
                  stop();
                  setInstrument(e.target.value as Instrument);
                }}
                aria-label={t("Lejátszás hangszíne")}
              >
                <option value="synth">{t("Szintetizátor")}</option>
                <option value="piano">{t("Akusztikus zongora")}</option>
              </select>
            </label>
            <div className="length-badge">
              <Music2 size={16} />
              <span>
                {t("4 akkord")}
                <small>
                  {t("{n} ütem", {
                    n:
                      timingDurations(timing).reduce(
                        (sum, beats) => sum + beats,
                        0,
                      ) / 4,
                  })}{" "}
                  · 4/4
                </small>
              </span>
            </div>
            <button
              className="settings-button"
              aria-expanded={advanced}
              aria-controls="generation-options"
              onClick={() => setAdvanced(!advanced)}
            >
              <SlidersHorizontal size={17} />
              <span>{t("Hangzás és ritmika")}</span>
              <ChevronDown size={14} />
            </button>
            <button className="primary generate-button" onClick={create}>
              <Sparkles size={18} />
              {session.progressions.length
                ? t("Új ötletek generálása")
                : t("Akkordmenetek generálása")}
              <ArrowRight size={17} />
            </button>
          </div>
          {advanced ? (
            <div id="generation-options" className="generation-options">
              <div className="advanced-controls">
                {" "}
                <label className="voicing-input">
                  {t("Hangzás")}
                  <select
                    value={voicing}
                    onChange={(e) => setVoicing(e.target.value as Voicing)}
                    aria-label={t("Akkordok hangzása")}
                  >
                    <option value="lush">{t("Lush · tág")}</option>
                    <option value="triad">{t("Kompakt · közeli")}</option>
                  </select>
                </label>
                <label className="rhythm-input">
                  {t("Ritmika")}
                  <select
                    value={rhythm}
                    onChange={(e) => setRhythm(e.target.value as RhythmChoice)}
                  >
                    <option value="auto">{t("Hangulathoz illő")}</option>
                    {rhythms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {t(r.name)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="timing-input">
                  {t("Akkordváltás")}
                  <select
                    value={timing}
                    onChange={(e) => setTiming(e.target.value as Timing)}
                  >
                    {timings.map((item) => (
                      <option key={item.id} value={item.id}>
                        {t(item.name)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="advanced">
                <CircleHelp size={18} />
                <p>
                  {t(
                    "A hangulat saját akkordmeneteket és akkordszíneket választ. A Lush tág, a Kompakt közeli hangfekvést ad. Az akkordváltás az akkordok hosszát és kezdését, a ritmika az egyes hangütéseket és szüneteket határozza meg. Minden hang a kiválasztott skálán belül marad.",
                  )}
                </p>
              </div>
            </div>
          ) : null}
        </section>
        {settingsChanged || voicingChanged ? (
          <div className="notice">
            {t(
              "A generálási beállítások a következő ötletekre vonatkoznak. A meglévő menetek időzítését és ritmikáját a szerkesztőben is módosíthatod.",
            )}
          </div>
        ) : null}
        <section className="results-section" aria-labelledby="results-heading">
          <div className="section-top">
            <div>
              <h2 id="results-heading">
                {session.progressions.length
                  ? t("Találd meg a neked valót")
                  : t("A következő dallamod alapja")}
              </h2>
              <p>
                {session.progressions.length
                  ? t(
                      "Hallgasd meg az ötleteket, majd válassz egyet a szerkesztéshez.",
                    )
                  : t("Néhány akkord is elég lehet egy új történethez.")}
              </p>
            </div>
            <button
              className="text-button"
              disabled={!history.length}
              onClick={undo}
            >
              <Undo2 size={16} />
              {t("Visszavonás")}
            </button>
          </div>
          {session.progressions.length ? (
            <div className="results-grid">
              {session.progressions.map((p, i) => (
                <article
                  key={p.id}
                  className={`progression-card ${p.id === session.selected ? "chosen" : ""}`}
                >
                  <div className="card-top">
                    <span>
                      {t("ÖTLET {n}", { n: String(i + 1).padStart(2, "0") })}
                    </span>
                    {p.id === session.selected ? (
                      <span className="chosen-label">
                        <Check size={12} />
                        {t("Kiválasztva")}
                      </span>
                    ) : (
                      <span>{keyName(p.key, locale)}</span>
                    )}
                  </div>
                  <div className="chord-summary">
                    {p.chords.map((c, j) => (
                      <div key={j}>
                        <strong>
                          {chordName(p.key, c.degree, p.voicing, c.color)}
                        </strong>
                        <small>{chordInfo(p.key, c.degree).roman}</small>
                      </div>
                    ))}
                  </div>
                  <div className="card-bottom">
                    <button
                      className={`play-button ${playing === p.id ? "playing" : ""}`}
                      onClick={() => void play(p)}
                      aria-label={t("{action}: {n}. ötlet", {
                        action:
                          playing === p.id ? t("Leállítás") : t("Meghallgatás"),
                        n: i + 1,
                      })}
                    >
                      {playing === p.id ? (
                        <Pause size={16} />
                      ) : (
                        <Play size={16} />
                      )}
                    </button>
                    <div
                      className={`waveform ${playing === p.id ? "animating" : ""}`}
                      aria-hidden="true"
                    >
                      {Array.from({ length: 22 }, (_, j) => (
                        <i
                          key={j}
                          style={{ height: `${7 + ((j * 7 + i * 11) % 19)}px` }}
                        />
                      ))}
                    </div>
                    <button
                      className="select-button"
                      onClick={() => {
                        stop();
                        setSession({ ...session, selected: p.id });
                        setActive(0);
                        document.getElementById("studio")?.scrollIntoView({
                          behavior: window.matchMedia(
                            "(prefers-reduced-motion: reduce)",
                          ).matches
                            ? "instant"
                            : "smooth",
                          block: "start",
                        });
                      }}
                      aria-pressed={p.id === session.selected}
                    >
                      {p.id === session.selected
                        ? t("Szerkesztés")
                        : t("Kiválasztás")}
                      <ArrowRight size={13} />
                    </button>
                  </div>
                  <div className="card-caption">
                    {t(moods.find((m) => m.id === p.mood)!.name)} <span>·</span>{" "}
                    {keyName(p.key, locale)} <span>·</span>{" "}
                    {p.voicing === "lush" ? "Lush" : t("Kompakt")}{" "}
                    <span>·</span>{" "}
                    {t(
                      rhythms.find((r) => r.id === (p.rhythm ?? "sustain"))!
                        .name,
                    )}
                    <span>·</span>{" "}
                    {t("{n} ütem", { n: progressionBeats(p) / 4 })}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <Music2 size={27} />
                <span>✧</span>
              </div>
              <h3>{t("Itt kapnak formát az ötleteid")}</h3>
              <p>
                {t(
                  "Válassz fent egy hangulatot, majd generálj négy meghallgatható akkordmenetet.",
                )}
              </p>
              <div className="empty-steps">
                <span>{t("01 Hangulat")}</span>
                <ArrowRight size={13} />
                <span>{t("02 Akkordok")}</span>
                <ArrowRight size={13} />
                <span>{t("03 Saját zene")}</span>
              </div>
            </div>
          )}
        </section>
        {selected && chord ? (
          <section
            id="studio"
            className="panel editor"
            aria-labelledby="editor-heading"
          >
            <div className="section-top">
              <div>
                <h2 id="editor-heading">
                  <Layers3 size={18} /> {t("A te akkordmeneted")}{" "}
                  <span className="mini-badge">
                    {keyName(selected.key, locale)}
                  </span>
                </h2>
                <p>
                  {t(
                    "Formáld az ötletedet: szerkeszd az akkordokat, és adj hozzá basszust, dallamot vagy dobokat.",
                  )}
                </p>
              </div>
              {track === "chords" ? (
                <div className="editor-actions">
                  <label>
                    <span>{t("Akkordváltás")}</span>
                    <select
                      value={selected.timing ?? "bar"}
                      aria-label={t("Akkordváltások időzítése")}
                      title={t(
                        timings.find(
                          (item) => item.id === (selected.timing ?? "bar"),
                        )!.hint,
                      )}
                      onChange={(e) =>
                        update(applyTiming(selected, e.target.value as Timing))
                      }
                    >
                      {timings.map((item) => (
                        <option key={item.id} value={item.id}>
                          {t(item.name)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>{t("Ritmika")}</span>
                    <select
                      value={selected.rhythm ?? "sustain"}
                      aria-label={t("Akkordmenet ritmikája")}
                      title={t(
                        rhythms.find(
                          (r) => r.id === (selected.rhythm ?? "sustain"),
                        )!.hint,
                      )}
                      onChange={(e) =>
                        update({
                          ...selected,
                          rhythm: e.target.value as Rhythm,
                        })
                      }
                    >
                      {rhythms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {t(r.name)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}
            </div>
            <TransportBar
              progression={selected}
              locale={locale}
              playing={playing === selected.id}
              position={playing === selected.id ? position : null}
              cursor={cursor}
              loop={loop}
              onLoop={(v) => {
                stop();
                setLoop(v);
              }}
              onCursor={seek}
              onPlay={() => void play(selected)}
              onChange={update}
              loading={loadingSound}
            />
            <div
              role="tablist"
              aria-label={t("Szólamok")}
              className="track-tabs"
            >
              {(["chords", "bass", "melody", "drums"] as const).map((id, i) => (
                <button
                  key={id}
                  role="tab"
                  id={"track-tab-" + id}
                  aria-controls="track-panel"
                  aria-selected={track === id}
                  tabIndex={track === id ? 0 : -1}
                  onClick={() => setTrack(id)}
                  onKeyDown={(e) => {
                    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
                    e.preventDefault();
                    const j = (i + (e.key === "ArrowRight" ? 1 : 3)) % 4;
                    setTrack(
                      (["chords", "bass", "melody", "drums"] as const)[j],
                    );
                    (
                      e.currentTarget.parentElement?.querySelectorAll("button")[
                        j
                      ] as HTMLButtonElement
                    )?.focus();
                  }}
                >
                  {t(
                    (
                      {
                        chords: "Akkordok",
                        bass: "Basszus",
                        melody: "Dallam",
                        drums: "Dobok",
                      } as const
                    )[id],
                  )}
                </button>
              ))}
            </div>
            <div
              id="track-panel"
              role="tabpanel"
              aria-labelledby={"track-tab-" + track}
            >
              {track === "chords" ? (
                <>
                  <div className="bass-controls">
                    {selected.chords.map((c, i) => (
                      <button
                        key={i}
                        className="secondary"
                        aria-pressed={active === i}
                        onClick={() => setActive(i)}
                      >
                        {t("{n}. akkord", { n: i + 1 })} ·{" "}
                        {chordName(
                          selected.key,
                          c.degree,
                          selected.voicing,
                          c.color,
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="bass-hint">
                    {t(
                      "Az akkordbeállítások vagy a ritmika módosítása visszaállítja a generált akkordhangokat. A kézi szerkesztés visszavonható.",
                    )}
                  </p>
                  <div className="bass-controls">
                    <button
                      className="secondary"
                      aria-pressed={!!selected.chordsMuted}
                      onClick={() =>
                        update({
                          ...selected,
                          chordsMuted: !selected.chordsMuted,
                        })
                      }
                    >
                      {selected.chordsMuted
                        ? t("Akkordok visszakapcsolása")
                        : t("Akkordok némítása")}
                    </button>
                    <label>
                      {t("Akkordok hangereje")} · {selected.chordVolume ?? 80}%
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={selected.chordVolume ?? 80}
                        onChange={(e) =>
                          update({
                            ...selected,
                            chordVolume: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                  </div>
                  <div className="editor-layout">
                    <TrackEditor
                      key={selected.id + "-chords"}
                      progression={selected}
                      track="chords"
                      locale={locale}
                      onChange={update}
                      cursor={Math.min(
                        cursor,
                        progressionBeats(selected) - 0.25,
                      )}
                      onCursor={seek}
                      position={playing === selected.id ? position : null}
                    />
                    <div className="chord-editor">
                      <div className="editor-label">
                        {t("{n}. AKKORD", { n: active + 1 })}{" "}
                        <button
                          aria-label={
                            chord.locked
                              ? t("Akkord feloldása")
                              : t("Akkord rögzítése")
                          }
                          title={t(
                            "A rögzítés a teljes akkordot és hangfekvést védi",
                          )}
                          onClick={() =>
                            update({
                              ...selected,
                              chords: selected.chords.map((c, i) =>
                                i === active ? { ...c, locked: !c.locked } : c,
                              ),
                            })
                          }
                        >
                          {chord.locked ? (
                            <LockKeyhole size={16} />
                          ) : (
                            <UnlockKeyhole size={16} />
                          )}
                        </button>
                      </div>
                      <h3>
                        {chordName(
                          selected.key,
                          chord.degree,
                          selected.voicing,
                          chord.color,
                        )}
                        <small>{chord.notes.map(noteName).join(" · ")}</small>
                      </h3>
                      <label>
                        {t("Akkord")}
                        <select
                          disabled={chord.locked}
                          value={chord.degree}
                          aria-label={t("Akkord")}
                          onChange={(e) =>
                            update(
                              replaceChord(
                                selected,
                                active,
                                Number(e.target.value),
                                chord.inversion,
                                chord.octave,
                                selected.voicing,
                              ),
                            )
                          }
                        >
                          {Array.from({ length: 7 }, (_, d) => {
                            const c = chordInfo(selected.key, d);
                            return (
                              <option key={d} value={d}>
                                {c.name} · {c.roman}
                              </option>
                            );
                          })}
                        </select>
                      </label>
                      <label>
                        {t("Akkordtípus")}
                        <select
                          disabled={chord.locked}
                          value={
                            chord.color ??
                            (selected.voicing === "lush" ? "ninth" : "triad")
                          }
                          aria-label={t("Akkordtípus")}
                          onChange={(e) =>
                            update(
                              replaceChord(
                                selected,
                                active,
                                chord.degree,
                                chord.inversion,
                                chord.octave,
                                selected.voicing,
                                e.target.value as ChordColor,
                              ),
                            )
                          }
                        >
                          {availableColors(selected.key, chord.degree).map(
                            (color) => (
                              <option key={color} value={color}>
                                {t(colorLabels[color])} ·{" "}
                                {chordName(
                                  selected.key,
                                  chord.degree,
                                  selected.voicing,
                                  color,
                                )}
                              </option>
                            ),
                          )}
                        </select>
                      </label>
                      <label>
                        {t("Fordítás")}
                        <select
                          disabled={chord.locked}
                          value={chord.inversion}
                          aria-label={t("Fordítás")}
                          onChange={(e) =>
                            update(
                              replaceChord(
                                selected,
                                active,
                                chord.degree,
                                Number(e.target.value),
                                chord.octave,
                                selected.voicing,
                              ),
                            )
                          }
                        >
                          <option value="0">{t("Alapállás")}</option>
                          <option value="1">{t("Első fordítás")}</option>
                          <option value="2">{t("Második fordítás")}</option>
                        </select>
                      </label>
                      <label>
                        {t("Hangfekvés")}
                        <select
                          disabled={chord.locked}
                          value={chord.octave}
                          aria-label={t("Hangfekvés")}
                          onChange={(e) =>
                            update(
                              replaceChord(
                                selected,
                                active,
                                chord.degree,
                                chord.inversion,
                                Number(e.target.value),
                                selected.voicing,
                              ),
                            )
                          }
                        >
                          <option value="-1">{t("Mélyebb")}</option>
                          <option value="0">{t("Középső")}</option>
                          <option value="1">{t("Magasabb")}</option>
                        </select>
                      </label>
                      <div
                        className="tone-controls"
                        aria-label={t("Hangok mozgatása a skálán belül")}
                      >
                        <span>{t("HANGOK · SKÁLAN BELÜL")}</span>
                        {chord.notes.map((pitch, noteIndex) => (
                          <div className="tone-control" key={noteIndex}>
                            <span>{noteName(pitch)}</span>
                            <button
                              disabled={chord.locked}
                              aria-label={t("{note} feljebb egy skálahanggal", {
                                note: noteName(pitch),
                              })}
                              title={t("Feljebb egy skálahanggal")}
                              onClick={() =>
                                update(
                                  moveNoteInScale(
                                    selected,
                                    active,
                                    noteIndex,
                                    1,
                                  ),
                                )
                              }
                            >
                              ↑
                            </button>
                            <button
                              disabled={chord.locked}
                              aria-label={t("{note} lejjebb egy skálahanggal", {
                                note: noteName(pitch),
                              })}
                              title={t("Lejjebb egy skálahanggal")}
                              onClick={() =>
                                update(
                                  moveNoteInScale(
                                    selected,
                                    active,
                                    noteIndex,
                                    -1,
                                  ),
                                )
                              }
                            >
                              ↓
                            </button>
                          </div>
                        ))}
                      </div>
                      {chord.locked ? (
                        <p className="lock-hint">
                          {t("Rögzítve. A szerkesztéshez oldd fel.")}
                        </p>
                      ) : null}
                      <button
                        className="secondary variation-button"
                        disabled={selected.chords.every((c) => c.locked)}
                        onClick={() => update(vary(selected, ++seed.current))}
                      >
                        <RefreshCw size={15} /> {t("Új variáció")}
                      </button>
                      <small className="variation-hint">
                        {t("A rögzített akkordok megmaradnak.")}
                      </small>
                    </div>
                  </div>
                </>
              ) : null}
              {track === "bass" ? (
                <>
                  <BassPanel
                    progression={selected}
                    locale={locale}
                    onChange={update}
                    nextSeed={() => ++seed.current >>> 0}
                  />
                  {selected.bass ? (
                    <TrackEditor
                      key={selected.id + "-bass"}
                      progression={selected}
                      track="bass"
                      locale={locale}
                      onChange={update}
                      cursor={Math.min(
                        cursor,
                        progressionBeats(selected) - 0.25,
                      )}
                      onCursor={seek}
                      position={playing === selected.id ? position : null}
                    />
                  ) : null}
                </>
              ) : null}
              {track === "melody" ? (
                <>
                  <MelodyPanel
                    progression={selected}
                    locale={locale}
                    onChange={update}
                    nextSeed={() => ++seed.current >>> 0}
                    onPlay={() => void play(selected)}
                    playing={playing === selected.id}
                  />
                  {selected.melody ? (
                    <TrackEditor
                      key={selected.id + "-melody"}
                      progression={selected}
                      track="melody"
                      locale={locale}
                      onChange={update}
                      cursor={Math.min(
                        cursor,
                        progressionBeats(selected) - 0.25,
                      )}
                      onCursor={seek}
                      position={playing === selected.id ? position : null}
                    />
                  ) : null}
                </>
              ) : null}
              {track === "drums" ? (
                <DrumPanel
                  progression={selected}
                  locale={locale}
                  onChange={update}
                  nextSeed={() => ++seed.current >>> 0}
                  position={playing === selected.id ? position : null}
                />
              ) : null}
            </div>
            <div className="editor-footer">
              <span>
                <span className="status-dot" />{" "}
                {t("{n} ütem", { n: progressionBeats(selected) / 4 })} · {tempo}{" "}
                BPM · {keyName(selected.key, locale)}
              </span>
              <button className="primary" onClick={midi}>
                <ArrowDownToLine size={16} /> {t("MIDI letöltése")}
              </button>
            </div>
          </section>
        ) : null}
        <div className="feedback" role="status" aria-live="polite">
          {loadingSound
            ? t("Zongorahang betöltése…")
            : message
              ? t(message)
              : ""}
        </div>
        {error ? (
          <div className="error" role="alert">
            {t(error)}
            <button onClick={() => setError("")}>{t("Bezárás")}</button>
          </div>
        ) : null}
        <footer className="footer">
          <span>{t("Kevesebb keresgélés. Több alkotás.")}</span>
          <span>
            {t("Helyi generálás")} <i /> {t("Fiók nélkül")} <i />{" "}
            {t("MIDI export")}
          </span>
        </footer>
        <p className="sample-credits">
          {t("Zongorahangminták")}:{" "}
          <a
            href="https://github.com/Tonejs/audio/tree/master/salamander"
            target="_blank"
            rel="noreferrer"
          >
            Salamander Grand Piano · Alexander Holm
          </a>
          {" · "}
          <a
            href="https://creativecommons.org/licenses/by/3.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY 3.0
          </a>
        </p>
      </main>
    </div>
  );
}
