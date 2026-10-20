// Both locales use the same typed message keys. Musical data is locale-independent.
export type Locale = "hu" | "en";
export const english = {
  "Formáld az ötletedet: szerkeszd az akkordokat, és adj hozzá basszust, dallamot vagy dobokat.":
    "Make it yours: shape the chords, then build on them with bass, melody and drums.",
  "Szerkesztési tippek": "Editing tips",
  "Hangzás és ritmika": "Sound & rhythm",
  "A basszus a lábdob ritmusát követi. Saját basszusritmushoz kapcsold ki a követést.":
    "The bass follows the kick pattern. Turn off Follow the kick to use an independent bass rhythm.",
  "Itt nincs szabad hely a hangnak, vagy az akkord rögzítve van. Válassz másik indítási pontot, vagy rövidítsd a meglévő hangot.":
    "There is no room for a note here, or the chord is locked. Choose another start position or shorten an existing note.",
  "Szólam szerkesztése": "Edit part",
  Rács: "Grid",
  "Hang hozzáadása": "Add note",
  "Hang törlése": "Delete note",
  "Generált hangok visszaállítása": "Restore generated notes",
  "Kattints a rácsra az indítási pont kijelöléséhez; dupla kattintással hangot adhatsz hozzá. A hang jobb szélét húzva a hosszát állítod. Nyilak: mozgatás, Delete: törlés, Escape: megszakítás.":
    "Click the grid to set the start position; double-click to add a note. Drag a note’s right edge to resize it. Arrow keys move notes, Delete removes them, and Escape cancels a drag.",
  "Közös piano roll": "Part piano roll",
  "Hang {n}: {note}": "Note {n}: {note}",
  "Üres szólam. Jelölj ki egy pontot, majd adj hozzá hangot.":
    "This part is empty. Choose a position and add a note.",
  "Basszus a lábdobhoz": "Follow the kick",
  Lábdob: "Kick",
  Pergő: "Snare",
  Lábcin: "Hi-hat",
  "Dobok eltávolítása": "Remove drums",
  "Dobok hozzáadása": "Add drums",
  Dobminta: "Drum pattern",
  "Egyenes groove": "Four on the floor",
  "Féltempós groove": "Half-time",
  "Tört groove": "Broken beat",
  "Új dobvariáció": "New drum variation",
  "Dobok visszakapcsolása": "Unmute drums",
  "Dobok némítása": "Mute drums",
  "Dobok hangereje": "Drum volume",
  "Egy ütemes, ismétlődő dobminta. Kapcsold a tizenhatodokat a gombokkal; a swing és a humanizálás minden szólamra hat.":
    "A one-bar drum pattern that repeats across the clip. Toggle the sixteenth-note steps below. Swing and timing variation apply to all parts.",
  "{lane}, {n}. lépés": "{lane}, step {n}",
  "Zengo - Dobok": "Zengo - Drums",
  Lejátszó: "Transport",
  "A lejátszás frissítése nem sikerült. A korábbi változat tovább szól.":
    "Couldn't apply the playback update. The previous version is still playing.",
  Gyorsbillentyűk: "Keyboard shortcuts",
  Elejére: "Return to start",
  "Indítás / leállítás": "Play / stop",
  "Folytatás a megállítás helyéről": "Resume from the stop position",
  "Ugrás a klip elejére": "Jump to the start of the clip",
  "Ismétlés be / ki": "Toggle loop",
  "Azonnali leállítás": "Stop immediately",
  "A módosítások a következő negyeden lépnek életbe. A többi szólam közben folyamatosan szól.":
    "Changes take effect on the next beat. Other parts keep playing uninterrupted.",
  "Gépelés és mezőszerkesztés közben a gyorsbillentyűk nem aktívak.":
    "Shortcuts are disabled while typing or editing a field.",
  "Lejátszás innen": "Play from here",
  Ismétlés: "Loop",
  "Indítási pont": "Start position",
  "{bar}. ütem · {beat}. negyed": "Bar {bar} · beat {beat}",
  "Lejátszási pozíció": "Playback position",
  "Finom időzítési eltérés": "Timing variation",
  "A groove a lejátszásban és a MIDI-ben is hallható. A rács az eredeti hanghelyeket mutatja.":
    "Groove affects playback and MIDI. The grid shows the original note positions.",
  "A projektfájl elkészült. Másik böngészőben is megnyithatod.":
    "Project file downloaded. You can open it in another browser.",
  "Projektfájl megnyitva. A böngészős mentéshez használd a Projekt mentése gombot.":
    "Project file opened. Choose Save project to keep it in this browser.",
  "Nem érvényes Zengo-projektfájl, vagy túl nagy (legfeljebb 2 MB). A jelenlegi projekt megmaradt.":
    "This is not a valid Zengo project, or it exceeds 2 MB. Your current project is unchanged.",
  "Projektfájl kiválasztása": "Choose a project file",
  "Projektfájl megnyitása": "Open project file",
  Megnyitás: "Open",
  "Projektfájl letöltése": "Download project file",
  Projektfájl: "Project file",
  Szólamok: "Parts",
  "Az akkordbeállítások vagy a ritmika módosítása visszaállítja a generált akkordhangokat. A kézi szerkesztés visszavonható.":
    "Changing chord settings or rhythm restores generated chord notes. Manual edits can be undone.",
  "Visszatérő motívumok, válaszok és szünetek a harmóniára építve.":
    "Build a melody with recurring motifs, answering phrases and space to breathe.",
  "Dallam hozzáadása": "Add melody",
  "Dallam eltávolítása": "Remove melody",
  Dallamsűrűség: "Note density",
  Ritka: "Sparse",
  Közepes: "Balanced",
  Mozgalmas: "Busy",
  Hangterjedelem: "Pitch range",
  "Egy oktáv": "One octave",
  "Két oktáv": "Two octaves",
  Motívumismétlés: "Motif repetition",
  Visszatérő: "Recurring",
  Változatos: "Varied",
  Lezárás: "Phrase ending",
  Visszavezető: "Lead into the loop",
  Megnyugvó: "Settle on a chord tone",
  "Új dallamvariáció": "New melody variation",
  "Dallam hangszíne": "Melody sound",
  "Lágy szintidallam": "Soft synth lead",
  "Dallam visszakapcsolása": "Unmute melody",
  "Dallam némítása": "Mute melody",
  "Dallam hangereje": "Melody volume",
  "Teljes menet meghallgatása": "Preview all parts",
  "Húzd a hangokat: függőlegesen skálahangot, vízszintesen nyolcados kezdést állíthatsz. A kijelölt hang hosszát lent szerkesztheted. Escape megszakítja a húzást.":
    "Drag notes up or down within the scale, or left and right on an eighth-note grid. Edit the selected note’s length below. Press Escape to cancel a drag.",
  "Dallam hangnézet": "Melody piano roll",
  "Dallamhang {n}: {note}": "Melody note {n}: {note}",
  "Kijelölt hang": "Selected note",
  Hangmagasság: "Pitch",
  "Kezdés · negyed": "Start beat",
  "Hossz · negyed": "Length in beats",
  "A generálási vezérlők új dallamot készítenek, felülírva a kézi hangmódosításokat. Az időzítésváltás arányosan átméretezi a kézzel szerkesztett dallamot. A némítás és hangerő csak az előnézetre hat.":
    "Generator controls replace manual note edits with a new melody. Changing chord timing scales a manually edited melody to fit. Mute and volume only affect the preview.",
  "Zengo - Dallam": "Zengo - Melody",
  "Kitartott basszus": "Sustained bass",
  "Pulzáló basszus": "Pulsing bass",
  "Mozgó basszus": "Moving bass",
  "Az akkordokhoz illő mély szólam. Az akkordváltásokat automatikusan követi.":
    "Build a bass part that follows your chord changes automatically.",
  "Basszus hozzáadása": "Add bass",
  "Basszus eltávolítása": "Remove bass",
  Basszuskarakter: "Bass style",
  "Basszus hangszíne": "Bass sound",
  "Lágy sub basszus": "Soft sub bass",
  "Pengetett szintibasszus": "Plucked synth bass",
  "Új basszusvariáció": "New bass variation",
  "Akkordok visszakapcsolása": "Unmute chords",
  "Akkordok némítása": "Mute chords",
  "Akkordok hangereje": "Chord volume",
  "Basszus visszakapcsolása": "Unmute bass",
  "Basszus némítása": "Mute bass",
  "Basszus hangereje": "Bass volume",
  "Basszus hangnézet": "Bass piano roll",
  "Basszus az akkordszerkesztőben": "Bass in the chord editor",
  "Zengo - Basszus": "Zengo - Bass",
  "A közös lejátszás az akkordokat és a basszust együtt szólaltatja meg. A MIDI külön sávokra exportálja őket; a némítás és hangerő az előnézetet szabályozza.":
    "Preview plays chords and bass together. MIDI exports them as separate tracks; mute and volume only affect the preview.",
  Akkordváltás: "Chord changes",
  "Akkordváltások időzítése": "Chord change timing",
  Ütemenként: "Every bar",
  Félütemenként: "Every half bar",
  Kétütemenként: "Every two bars",
  "Előrehozott váltások": "Anticipated changes",
  "Változó hosszúság": "Mixed lengths",
  "Négy akkord, négy ütem": "Four chords across four bars",
  "Négy akkord, két ütem": "Four chords across two bars",
  "Négy akkord, nyolc ütem": "Four chords across eight bars",
  "A következő akkord fél negyeddel az ütemvonal előtt érkezik":
    "The next chord arrives an eighth note before the bar line",
  "Félütemes indulás, majd egy- és kétütemes kitartás":
    "Half-bar changes followed by one- and two-bar holds",
  "{n} ütem": "{n} bars",
  "{n} negyed": "{n} beats",
  "{n}. akkord": "Chord {n}",
  "Idővonal, {n} ütem": "Timeline: {n} bars",
  "{n}. akkord: {note}, kezdet: {beat}. negyed":
    "Chord {n}: {note}, starts on beat {beat}",
  "40–220 BPM. A gépelt értéket Enterrel vagy a mező elhagyásával véglegesítheted.":
    "40–220 BPM. Press Enter or leave the field to apply the value.",
  "A hangulat saját akkordmeneteket és akkordszíneket választ. A Lush tág, a Kompakt közeli hangfekvést ad. Az akkordváltás az akkordok hosszát és kezdését, a ritmika az egyes hangütéseket és szüneteket határozza meg. Minden hang a kiválasztott skálán belül marad.":
    "Each mood has its own progressions and chord colors. Lush spreads the notes out; Compact keeps them close. Chord changes set when each chord starts and how long it lasts; rhythm shapes the hits and rests. All notes stay in the selected scale.",
  "A generálási beállítások a következő ötletekre vonatkoznak. A meglévő menetek időzítését és ritmikáját a szerkesztőben is módosíthatod.":
    "Generator settings apply to new ideas. You can also change the timing and rhythm of an existing progression in the editor.",
  Ritmika: "Rhythm",
  "Lejátszás hangszíne": "Playback sound",
  Szintetizátor: "Synth",
  "Modellezett zongora": "Modeled piano",
  "Akusztikus zongora": "Acoustic piano",
  "Akusztikus gitár": "Acoustic guitar",
  Hegedű: "Violin",
  Trombita: "Trumpet",
  Fuvola: "Flute",
  Fuvolahangminták: "Flute samples",
  "Fuvola: áramló dallamívek, lágy indítások, dinamikai hullámok és lélegző frázisok.":
    "Flute: flowing melodic lines, gentle entrances, expressive swells and breathing space.",
  "Gitár-, hegedű-, trombita- és fuvolahangminták":
    "Guitar, violin, trumpet and flute samples",
  "A MIDI-export dinamikagörbét és finom vibratóvezérlést is tartalmaz; fúvósoknál légzésvezérlést is. A megszólalás a fogadó hangszer beállításaitól függ.":
    "MIDI export includes expression curves and subtle vibrato control, plus breath control for wind instruments. The result depends on your virtual instrument's controller settings.",
  "Hangminták betöltése…": "Loading instrument samples…",
  "Gitár-, hegedű- és trombitahangminták": "Guitar, violin and trumpet samples",
  "Források és licenc": "Sources and license",
  "A hangminták betöltése vagy indítása nem sikerült. Próbáld újra, vagy válassz szintetizátort az érintett szólamhoz.":
    "Couldn't load or play the instrument samples. Try again, or choose a synth sound for the affected part.",
  "Gitár: pengetett akkordhangok, arpeggiók és kényelmes középfekvés.":
    "Guitar: picked chord tones and arpeggios in a comfortable midrange.",
  "Hegedű: éneklő frázisok, hosszabb hangok és kis dallamlépések.":
    "Violin: lyrical phrases, longer notes and mostly stepwise motion.",
  "Trombita: hangsúlyos belépések, rövid válaszok és levegővételi szünetek.":
    "Trumpet: accented entrances, short answering phrases and room to breathe.",
  "A hangszínváltás a generált dallamot a hangszerhez igazítja. A kézi szerkesztés ritmusát megőrzi, hangjait az új hangterjedelembe illeszti.":
    "Changing the sound adapts generated melodies to the instrument. Hand-edited parts keep their rhythm, with pitches fitted to the new range.",
  "Zongorahang betöltése…": "Loading piano samples…",
  Zongorahangminták: "Piano samples",
  "A zongorahang betöltése vagy indítása nem sikerült. Próbáld újra, vagy válaszd a szintetizátort.":
    "Could not load or start the piano. Try again or switch to Synth.",
  "Hangulathoz illő": "Match the mood",
  "Akkordmenet ritmikája": "Progression rhythm",
  Kitartott: "Sustained",
  "Hosszú, lebegő akkordok": "Long, floating chords",
  Félütemes: "Half-bar chords",
  "Két akkordütés ütemenként": "Two chord hits per bar",
  "Negyedes pulzus": "Quarter-note pulse",
  "Négy rövid akkordütés": "Four short chord hits per bar",
  Offbeat: "Offbeat",
  "Akkordok a nyolcados felütéseken": "Chords on the eighth-note upbeats",
  "Tresillo · 3+3+2": "Tresillo · 3+3+2",
  "Lüktető, háromütéses ritmus": "A three-hit groove grouped 3+3+2",
  Szinkópált: "Syncopated",
  "Eltolt hangsúlyok és szünetek": "Offbeat accents and rests",
  "Lush · tág": "Lush · spread",
  "Kompakt · közeli": "Compact · close",
  Kompakt: "Compact",
  Akkordtípus: "Chord type",
  Hármashangzat: "Triad",
  Szeptim: "Seventh",
  Kilenced: "Ninth",
  Hatos: "Sixth",
  Sus2: "Sus2",
  Sus4: "Sus4",
  Add9: "Add9",
  "{n}. akkord: {note}, {beat}. negyed": "Chord {n}: {note}, beat {beat}",
  "A hangulat saját akkordmeneteket és akkordszíneket választ. A Lush tág, a Kompakt közeli hangfekvést ad. Az akkordok ütemenként váltanak, a ritmika az ütemen belüli megszólalásokat alakítja. Minden hang a kiválasztott skálán belül marad. A hangszín szintetizált.":
    "Each mood has its own progression library and chord colors. Lush spreads notes across octaves; Compact keeps them close together. Chords change once per bar, while the rhythm controls the hits and rests within each bar. All notes stay in the selected scale. Playback uses a synth sound.",
  "A hangulat, hangnem, hangfekvés és ritmika beállításai a következő generálásra vonatkoznak. A meglévő ötleteid megmaradtak.":
    "Mood, key, voicing and rhythm settings apply the next time you generate ideas. Your current progressions are unchanged.",
  "A legutóbb mentett projekt betöltve.":
    "Your saved project has been restored.",
  "Négy új ötlet elkészült. Hallgasd meg, majd válassz egyet.":
    "Four fresh ideas are ready. Preview them, then choose one to edit.",
  "Nem sikerült elindítani a hangot. Ellenőrizd a böngésző hangengedélyét, majd próbáld újra.":
    "Audio could not start. Check your browser’s audio permissions and try again.",
  "Az utolsó változtatás visszavonva.": "Last change undone.",
  "Projekt mentve ebben a böngészőben. A következő megnyitáskor visszatöltjük.":
    "Project saved in this browser. It will be restored the next time you open Zengo.",
  "A böngésző nem engedélyezte a helyi mentést. A MIDI-export továbbra is használható.":
    "Your browser blocked local storage. You can still export your progression as MIDI.",
  "A MIDI-fájl elkészült. Az FL Studio piano rolljába importálhatod.":
    "Your MIDI file is ready. Import it into the Piano roll in FL Studio.",
  "A MIDI-export nem sikerült. Próbáld újra.":
    "MIDI export failed. Please try again.",
  "ÖTLETBŐL ZENE.": "TURN IDEAS INTO MUSIC.",
  "Helyben működik": "Runs locally",
  Akkordműhely: "Chord studio",
  "Projekt mentése": "Save project",
  "MIDI export": "Export MIDI",
  ALKOTÓTÉR: "WORKSPACE",
  Akkordok: "Chords",
  "Az ötlet itt kezdődik": "Start with a progression",
  HAMAROSAN: "COMING SOON",
  Dallam: "Melody",
  Basszus: "Bass",
  Ritmus: "Rhythm",
  Dobok: "Drums",
  "Egy kis inspiráció": "Try a different tempo",
  "Ugyanaz az akkordmenet más tempóban egészen új történetet mesélhet.":
    "A change of tempo can give the same progression a whole new feel.",
  "Saját ötletek. Saját hangzás.": "Your ideas. Your sound.",
  "A KÖVETKEZŐ ÖTLETED ITT KEZDŐDIK": "YOUR NEXT TRACK STARTS HERE",
  "Adj hangot a hangulatodnak": "Find the chords for your mood",
  "Válassz egy érzést. Találj egy akkordmenetet. Tedd a sajátoddá.":
    "Pick a mood. Find a progression. Make it your own.",
  "Akkordmenet készítése": "Create a progression",
  "Milyen legyen a hangulat?": "Set the mood",
  "Egy kiindulópont a zenédhez. Nincsenek rossz válaszok.":
    "Choose a starting point and see where it takes you.",
  "01 / HANGULAT": "01 / MOOD",
  Sötét: "Dark",
  "Mély · titokzatos": "Deep · mysterious",
  Melankolikus: "Melancholic",
  "Lágy · érzelmes": "Soft · emotive",
  Filmszerű: "Cinematic",
  "Tágas · drámai": "Expansive · dramatic",
  Levegős: "Airy",
  "Fényes · lebegő": "Bright · floating",
  Energikus: "Energetic",
  "Lendületes · élénk": "Driving · vibrant",
  Laza: "Laid-back",
  "Nyugodt · könnyed": "Calm · easygoing",
  Hangnem: "Key",
  "Moll hangnemek": "Minor keys",
  "Dúr hangnemek": "Major keys",
  Tempó: "Tempo",
  Hangzás: "Voicing",
  "Akkordok hangzása": "Chord voicing",
  "Lush · 9-es, tág": "Lush · extended",
  "Triád · egyszerű": "Triads · simple",
  "4 akkord": "4 chords",
  "4 ütem · 4/4": "4 bars · 4/4",
  Részletek: "How it works",
  "Új ötletek generálása": "Generate new ideas",
  "Akkordmenetek generálása": "Generate progressions",
  "Minden akkord egy teljes ütemig szól. A dúr és természetes moll skálákból épülő Lush hangzás 9-es színeket és többoktávos hangfekvést használ; a Triád hangzás egyszerű hármashangzat. A hangulat a javaslatokat súlyozza. A hangszín szintetizált.":
    "Each chord lasts one bar. All notes come from the selected major or natural minor scale. Lush voicings add ninths and spread the notes across several octaves; Triads use three-note chords. Your mood influences which progressions are suggested. Playback uses a synth sound.",
  "A hangulat, hangnem és akkordhangzás beállításai a következő generálásra vonatkoznak. A meglévő ötleteid megmaradtak.":
    "Mood, key and voicing changes apply the next time you generate ideas. Your current progressions are unchanged.",
  "Találd meg a neked valót": "Find your starting point",
  "A következő dallamod alapja": "Give your next track a foundation",
  "Hallgasd meg az ötleteket, majd válassz egyet a szerkesztéshez.":
    "Preview the progressions, then choose one to make your own.",
  "Néhány akkord is elég lehet egy új történethez.":
    "A few chords could spark your next track.",
  Visszavonás: "Undo",
  "ÖTLET {n}": "IDEA {n}",
  Kiválasztva: "Selected",
  Leállítás: "Stop",
  Meghallgatás: "Preview",
  "{action}: {n}. ötlet": "{action} idea {n}",
  Szerkesztés: "Edit",
  Kiválasztás: "Select",
  Triád: "Triads",
  "Itt kapnak formát az ötleteid": "Start something new",
  "Válassz fent egy hangulatot, majd generálj négy meghallgatható akkordmenetet.":
    "Choose a mood above to generate four chord progressions you can preview and edit.",
  "01 Hangulat": "01 Pick a mood",
  "02 Akkordok": "02 Find your chords",
  "03 Saját zene": "03 Make it yours",
  "A te akkordmeneted": "Your progression",
  "Válassz egy ütemet, és alakítsd a hangzást.":
    "Select a bar to edit its chord and voicing.",
  "{n}. AKKORD": "CHORD {n}",
  "Akkord feloldása": "Unlock chord",
  "Akkord rögzítése": "Lock chord",
  "A rögzítés a teljes akkordot és hangfekvést védi":
    "Lock to keep this chord and its voicing unchanged",
  Akkord: "Chord",
  Fordítás: "Inversion",
  Alapállás: "Root position",
  "Első fordítás": "First inversion",
  "Második fordítás": "Second inversion",
  Hangfekvés: "Register",
  Mélyebb: "Lower",
  Középső: "Middle",
  Magasabb: "Higher",
  "Hangok mozgatása a skálán belül": "Move notes within the scale",
  "HANGOK · SKÁLAN BELÜL": "NOTES · IN SCALE",
  "{note} feljebb egy skálahanggal": "Move {note} up one scale step",
  "{note} lejjebb egy skálahanggal": "Move {note} down one scale step",
  "Feljebb egy skálahanggal": "Move up one scale step",
  "Lejjebb egy skálahanggal": "Move down one scale step",
  "Rögzítve. A szerkesztéshez oldd fel.":
    "This chord is locked. Unlock it to make changes.",
  "Új variáció": "New variation",
  "A rögzített akkordok megmaradnak.": "Locked chords stay unchanged.",
  "4 ütem": "4 bars",
  "MIDI letöltése": "Download MIDI",
  Bezárás: "Dismiss",
  "Kevesebb keresgélés. Több alkotás.": "Less searching. More music.",
  "Helyi generálás": "Generated locally",
  "Fiók nélkül": "No account needed",
  "Akkordok hangnézete, négy ütem": "Piano roll: four-bar chord progression",
  "{n}. ütem": "Bar {n}",
  "{n}. akkord: {note}": "Chord {n}: {note}",
  "Húzd fel vagy le. Nyílbillentyűkkel skálahangonként mozgatható.":
    "Drag up or down, or use the up and down arrow keys to move by scale steps.",
  Nyelv: "Language",
  "Húzd a hangokat fel vagy le a skálán belül. A lakattal rögzített akkordokat előbb oldd fel.":
    "Drag notes up or down to move within the scale. Unlock a chord before editing its notes.",
  "Zengo — Ötletből zene": "Zengo — Turn ideas into music",
  "Hangulatból akkordmenet. Helyben működő zenei ötletalkotó, szerkesztő és MIDI-export.":
    "Find chord progressions to match your mood. Generate ideas, shape your voicings and export MIDI, all in your browser.",
  "Zengo - Akkordok": "Zengo - Chords",
} as const;
export type MessageKey = keyof typeof english;
export function translate(
  locale: Locale,
  key: MessageKey,
  values: Record<string, string | number> = {},
): string {
  // Fall back during live module updates, when a component may refresh before its catalog.
  const text = locale === "en" ? (english[key] ?? key) : key;
  return text.replace(/\{(\w+)\}/g, (token, name: string) =>
    String(values[name] ?? token),
  );
}
export function readLocale(): Locale {
  try {
    return localStorage.getItem("zengo-locale") === "en" ? "en" : "hu";
  } catch {
    return "hu";
  }
}
