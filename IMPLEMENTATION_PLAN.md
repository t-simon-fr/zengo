# ChordFlow — implementációs terv Codexhez / OpenCode-hoz

## Elfogadott MVP-pontosítások — 2026-10-17

Az alábbi döntések elsőbbséget élveznek a korábbi terv tágabb funkciólistájával szemben:

- Első verzió: akkordmenet-generálás → meghallgatás → akkordcsere/fordítás/rögzítés → MIDI-export. A dallam, basszus és ritmus későbbi fejlesztés.
- Egy generálási kör minden javaslata a kiválasztott hangnemben marad. Nincs automatikus hangnemváltás.
- Egyszerű kezdőnézet; a szerkesztő csak javaslatválasztás után nyílik meg.
- Először a teljes működő folyamat készüljön el, utána a generálási és vizuális finomítások.
- Hangnem/hangulat módosítása a következő generálás beállítása; meglévő szerkesztést nem ír felül. A kártyák jelzik saját hangnemüket.
- Rögzítés a teljes akkordot és hangfekvést védi a variálás és szerkesztés során. Teljes új generálás új kártyákat készít; a visszavonás visszaállíthatja a korábbiakat.
- Belső időegység: negyedhang; 4/4, akkordonként négy negyed. A lejátszás és a MIDI ugyanabból a hanglistából épül.
- A „Lush” voicing öt diatonikus hangból épül, több mint egy oktávos kiterjedéssel és a módhoz illő 9-es színezettel; választható marad mellette az egyszerű triád.
- A piano roll hangjai közvetlenül húzással, a billentyűzet fel/le nyilaival vagy a szerkesztő hanglistájának gombjaival mozgathatók egy skálahangnyi lépésben. Minden ilyen változás ugyanazt a kiválasztott menetet frissíti, amit a lejátszás és a MIDI-export is használ.
- A komplexitás/stílus csúszkák későbbi fejlesztés; a jelen MVP-ben a hangulat, hangnem és tempó kap tényleges jelentést.

Az aktuális futtatás és működési szabályok a README.md fájlban találhatók.

## 0. Cél és munkamód

Készíts egy működő, böngészőben futó ChordFlow alkalmazást: egy kezdőbarát zenei ötletalkotó eszközt, amely hangulat alapján akkordmeneteket ajánl, ezeket meghallgathatóvá és szerkeszthetővé teszi, majd MIDI-fájlként exportálja az FL Studio-ba.

A mellékelt `chordflow-ui-reference.png` a vizuális irány és a fő elrendezés referenciaképe. Kövesd a kompozíciót, de ne másold vakon az esetleges képgenerálási hibákat: a szövegek, akkordok, skálák, vezérlők és interakciók legyenek következetesek és működőképesek.

**Fontos munkaszabályok**

- Először vizsgáld meg a meglévő repositoryt, package.json-t, komponenseket és konvenciókat. Ha már van projekt, abba illeszkedj; ne írj felül működő megoldást indokolatlanul.
- Ha üres a repository, hozz létre Vite + TypeScript + React alkalmazást.
- Dolgozz kis, ellenőrizhető lépésekben. Minden fázis végén futtasd a releváns lint/typecheck/build parancsokat, amennyiben vannak.
- Ne csak látványos mockupot készíts: minden látható vezérlő működjön, vagy legyen egyértelműen megjelölve, hogy későbbi fázisban készül el.
- Ne használj hálózati AI/API-t az MVP-hez. A generálás legyen determinisztikus, lokális, tesztelhető zeneelméleti algoritmusokra építve.
- Ne állítsd, hogy a böngészős alkalmazás natív VST3 plugin. Az MVP webalkalmazás; később külön projektben lehet natív plugin.
- Ha döntés szükséges, válassz egyszerű, karbantartható megoldást, és dokumentáld röviden.

## 1. Javasolt technológiai stack

- Vite
- React
- TypeScript strict módban
- CSS Modules vagy jól strukturált globális CSS; a meglévő projekt konvencióit részesítsd előnyben
- Tone.js a böngészős hangelőnézethez
- `@tonejs/midi` MIDI-exporthoz (és később MIDI-importhoz)
- Vitest a zeneelméleti motor egységtesztjeihez
- Lucide React ikonokhoz, ha nincs már ikonkönyvtár a projektben

Ne adj hozzá nehéz állapotkezelő könyvtárat, amíg a React state/context elegendő. A zeneelméleti logika maradjon UI-tól független, tiszta TypeScript modulokban.

## 2. Termék- és UX-alapelvek

A felhasználó nem feltétlenül ismeri a zeneelméletet. A felület ezért hangulatból és hallható eredményből induljon ki, ne szakkifejezésekből.

- Elsődleges útvonal: **Hangulat kiválasztása → Akkordmenetek meghallgatása → Egyik kiválasztása → Akkordok szerkesztése → MIDI export**.
- Az alapértelmezett nézet legyen egyszerű mód. A haladó beállítások összecsukható panelbe kerüljenek.
- Ne jelenjen meg egyszerre túl sok szerkesztési eszköz. Az alsó szerkesztő fülei: Akkordok, Dallam, Basszus, Ritmus.
- Az aktív szerkesztési mód színe egyezzen a hozzá tartozó modullal.
- A generálás ne veszítse el a felhasználó választásait véletlenül. Legyen egyértelmű, mikor történik újragenerálás, és mikor módosul csak egy akkord.
- A hangulat-címkék kreatív kiindulópontok, nem merev zeneelméleti szabályok.
- Legyen használható kisebb képernyőn is: oldalsáv összehúzható, a panelek törjenek egymás alá, vízszintes túlcsordulás ne legyen az egész oldalon.

## 3. Vizuális irány

A referenciakép alapján:

- sötét, prémium DAW-szerű felület;
- grafitszürke/kékes-fekete panelek;
- lila kiemelés az elsődleges műveletekhez és aktív elemekhez;
- letisztult, jól olvasható tipográfia;
- finom szegélyek és mérsékelt lekerekítés, kerülve a túl sok ragyogást;
- jól elkülönített munkafolyamat-lépések a bal oldali navigációban;
- akkordmenet-javaslatok kártyákon, lejátszásgombbal és egyértelmű kiválasztási állapottal;
- alul egy piano-roll jellegű szerkesztő, ahol a hangok és akkordok ténylegesen módosíthatók.

Ne zsúfold tele a kezdőnézetet. A képen szereplő funkciók közül az MVP-ben az akkordmenet-készítés legyen a fő fókusz, a dallam/basszus/ritmus modulok pedig lehetnek kezdetben egyszerű, működő alapverziók vagy világosan megjelölt későbbi fejlesztések.

## 4. Javasolt felépítés

A projekt jelenlegi szerkezetéhez igazítsd, de a logikai határokat tartsd meg. Például:

```text
src/
  app/
    App.tsx
  components/
    AppHeader.tsx
    WorkflowSidebar.tsx
    MoodSelector.tsx
    AdvancedSettings.tsx
    ProgressionControls.tsx
    ProgressionCard.tsx
    ProgressionResults.tsx
    PianoRoll/
      PianoRoll.tsx
      PianoRollGrid.tsx
      PianoRollNote.tsx
    TrackTabs.tsx
    ExportPanel.tsx
  features/
    harmony/
      chordTypes.ts
      noteUtils.ts
      scales.ts
      chordBuilder.ts
      progressionGenerator.ts
      progressionScorer.ts
      voicing.ts
    playback/
      preview.ts
    midi/
      exportMidi.ts
  state/
    projectState.ts
  styles/
    tokens.css
    global.css
  test/
    harmony/
```

Ne hozz létre üres vagy felesleges komponenseket pusztán a fenti struktúra kedvéért. A komponensek felosztását a meglévő kódbázishoz igazítsd.

## 5. Adatmodell és zeneelméleti alapok

A zeneelméleti motor legyen független a Reacttől. A hangmagasságokat belsőleg MIDI-számokkal vagy egyértelmű pitch-class reprezentációval kezeld; a hangneveket csak megjelenítéskor formázd.

Szükséges alaptípusok:

- `Note`: pitch/MIDI number, start beat, duration beats, velocity.
- `Chord`: root pitch class, chord quality, notes, display name.
- `ChordEvent`: chord + start beat + duration.
- `Progression`: id, key, scale, style/mood tags, chord events, metadata.
- `Project`: tempo, meter, selected progression, tracks, selected editor tab, preferences.
- `MoodProfile`: hangulati címkék és generálási súlyok.

Első körben támogatandó hangnemek: legalább C, D, E, F, G, A, B dúr és természetes moll; enharmonikus hangnevek megjelenítésére legyen egységes szabály. A UI-ban a hangnemválasztó kínáljon gyakori dúr/moll hangnemeket, és legyen „Válasszon a plugin” opció.

Akkordtípusok MVP-ben:

- dúr hármashangzat;
- moll hármashangzat;
- szűkített hármashangzat;
- sus2 és sus4, ha könnyen integrálható;
- később maj7, m7, 7, add9.

Ne címkézz egy akkordot olyan római számmal, amelyet a motor nem a kiválasztott skálából számított ki. A római fokszám lehet másodlagos információ, az akkordnév legyen az elsődleges.

## 6. Akkordmenet-generálás

Az MVP-generátor ne pusztán véletlenszerű akkordokat válasszon.

Javasolt működés:

1. A kiválasztott hangnem és skála alapján állítsd elő a diatonikus akkordokat.
2. Készíts több jelölt, 4 akkordos menetet.
3. Pontozd a jelölteket egyszerű, tesztelhető szabályokkal: hangnemi illeszkedés, akkordismétlés büntetése, kezdő/végző akkord karaktere, gyakori funkcionális kapcsolatok és hangulatprofil.
4. A hangulatprofil módosítsa a jelöltek súlyozását, de ne állítsd, hogy egy akkord objektíven „sötét” vagy „vidám”.
5. Adj 3–4 eltérő javaslatot, ne csupán ugyanannak a menetnek permutációit.
6. Engedd egyenként lecserélni az akkordokat úgy, hogy a többi akkord megmaradjon.
7. Legyen „Rögzítés” vagy lock funkció a megtartani kívánt akkordokhoz.
8. Újragenerálásnál legyen lehetőség változatos eredményre; a tesztekhez a random seed legyen megadható.

A generálási algoritmus legyen egyértelműen elkülönítve a UI-tól, és írj hozzá egységteszteket.

## 7. Hangelőnézet

Tone.js segítségével:

- legyen lejátszás/megállítás az egyes akkordmenet-kártyákon;
- az akkordok időben egymás után szólaljanak meg;
- legyen alapértelmezett egyszerű zongora- vagy szintiszerű hangszín;
- a felhasználó által kiválasztott tempót tartsd be;
- a lejátszás leálljon új előnézet indításakor és komponensváltáskor;
- a hangindítás böngészős felhasználói interakcióból történjen, kezelve az AudioContext engedélyezési korlátait;
- a Tone.js ütemezését és erőforrásait megfelelően takarítsd el.

Ne ígérj valódi akusztikus zongorahangot, ha csak szintetizált hangot használsz. Az előnézet elsődleges célja az akkordmenet összehasonlítása.

## 8. Piano roll / akkordszerkesztő

Az MVP-ben legalább az akkordok szerkesztése működjön:

- idővonal és ütemvonalak;
- függőleges billentyűsáv hangnevekkel;
- az akkordokhoz tartozó hangok vízszintes blokkokként;
- az akkordblokkok kijelölése;
- akkord cseréje a szerkesztőpanelen;
- alap akkordfordítás vagy hangfekvés-váltás;
- a változás azonnal frissítse a kiválasztott menetet és a MIDI-exportot.

A drag-and-drop hangmagasság-/hosszállítás megvalósítható külön fázisban, de ne mutass nem működő interakciót. Ha a teljes piano roll túl nagy az MVP-hez, először készíts egy jól működő akkordsávot és alapvető hangblokk-szerkesztést, majd bővítsd.

A generátor-kártya és a piano roll kapcsolata legyen egyértelmű: a kiválasztott akkordmenet jelenjen meg a szerkesztőben, és az aktív fül vizuálisan is látszódjon.

## 9. MIDI-export

`@tonejs/midi` használatával exportálj szabványos MIDI-fájlt.

- A tempó kerüljön a fájlba.
- Minden akkord a megfelelő ütemre és időtartamra kerüljön.
- Az akkordhangok külön MIDI note eseményekként jelenjenek meg.
- A fájlnév legyen beszédes, például `chordflow-c-minor-progression.mid`.
- A böngészőből letölthető legyen a fájl.
- Az export a ténylegesen szerkesztett állapotot tükrözze.
- Később külön MIDI trackre kerülhet a dallam, basszus és ritmus; az első MVP-ben legalább az akkordmenet exportja legyen hibátlan.

Teszteld az exportot az FL Studio-ban, amint lehetséges. Dokumentáld az importálás lépéseit.

## 10. Állapotkezelés és adatvesztés megelőzése

- A kiválasztott hangnem, tempó, hangulat, akkordmenetek és szerkesztések maradjanak konzisztens állapotban.
- A „Mentés” gomb az MVP-ben exportálhat projekt-JSON-t vagy menthet helyi projektet; ne jeleníts meg sikerüzenetet, ha nem történt tényleges mentés.
- A projekt-JSON import/export opcionális, de jó következő lépés.
- LocalStorage használható egyszerű preferenciákhoz, de a teljes projekt mentési viselkedése legyen világos.
- Legyen üres állapot, hibaállapot és töltési állapot ott, ahol szükséges.

## 11. Hozzáférhetőség és reszponzivitás

- A gomboknak legyen látható fókuszállapotuk és egyértelmű címkéjük.
- Ne csak szín jelezze a kiválasztást; használj szöveget/ikont is.
- Biztosíts megfelelő kontrasztot a másodlagos szövegekhez.
- A hangulatkártyák billentyűzettel is kiválaszthatók legyenek.
- A csúszkákhoz legyen felirat és aktuális érték.
- Mobilon a bal oldali munkafolyamat váljon összecsukhatóvá, a generátorkártyák pedig kerüljenek egymás alá.

## 12. Fejlesztési fázisok és elfogadási feltételek

### Fázis 0 — Repository-felmérés

- Olvasd el a meglévő dokumentációt és package.json-t.
- Azonosítsd a futtatási, lint, teszt és build parancsokat.
- Röviden foglald össze a meglévő állapotot, majd kezdj el dolgozni; ne állj meg pusztán tervkészítésnél.

### Fázis 1 — Alapfelület

- Készítsd el a referenciakép szerinti sötét, reszponzív layoutot.
- Legyen munkafolyamat-navigáció, hangulatválasztó, egyszerű/haladó mód, akkordmenet-vezérlők és eredménykártyák.
- Használj valódi React state-et; a gombok ne legyenek puszta dekorációk.
- Elfogadás: az oldal hibamentesen buildel, és a fő vezérlők működnek.

### Fázis 2 — Zeneelméleti motor

- Hangnemek, skálák, akkordépítés és akkordmenet-javaslatok.
- Egységtesztek az akkordok hangjaira, a skálákra és a generálás invariánsaira.
- Elfogadás: az akkordok hangjai helyesek, és minden generált akkordmenet belsőleg konzisztens.

### Fázis 3 — Előnézet

- Tone.js lejátszás, leállítás, tempó és akkordváltások.
- Elfogadás: a kártyák előnézetei külön-külön lejátszhatók, és nem szól több lejátszás egymásra véletlenül.

### Fázis 4 — Akkordszerkesztő

- A kiválasztott akkordmenet megjelenítése az alsó szerkesztőben.
- Akkordcsere és alap hangfekvés-/fordításkezelés.
- Elfogadás: a szerkesztő módosításai a kártyákon és az exportban is megjelennek.

### Fázis 5 — MIDI-export

- Valódi `.mid` fájl letöltése.
- Elfogadás: a fájl megnyitható az FL Studio-ban, a hangok és az időzítés helyes.

### Fázis 6 — Dallam, basszus, ritmus

- A már meglévő akkordmenet alapján egyszerű dallam- és basszusgenerálás.
- Először szabályalapú megoldás; a hangsúlyos ütemrészeken gyakrabban használj akkordhangokat, a köztes hangoknál használhatsz skálahangokat.
- Elfogadás: a generált track szerkeszthető, meghallgatható és külön MIDI-trackként exportálható.

### Fázis 7 — Finomítás

- Project JSON mentés/betöltés, több preset, jobb reszponzivitás, billentyűzetes használat, hibaállapotok.
- A natív VST3-verzió nem része ennek a munkának.

## 13. Kötelező tesztelési ellenőrzőlista

- [ ] `npm run build` sikeres.
- [ ] `npm run test` vagy a megfelelő tesztparancs sikeres, ha tesztek vannak.
- [ ] Nincs TypeScript hiba.
- [ ] A hangnem- és komplexitásválasztó frissíti a generálást.
- [ ] A kiválasztott akkordmenet megjelenik a szerkesztőben.
- [ ] Egy akkord cseréje nem módosítja véletlenül a többit.
- [ ] Az előnézet leállítható, és nem halmozódnak a lejátszások.
- [ ] A MIDI-fájl ténylegesen letölthető és tartalmazza a kiválasztott akkordokat.
- [ ] Keskeny nézetben sincs oldalirányú túlcsordulás.
- [ ] Nincs olyan látható gomb, amely semmit sem csinál.

## 14. Végső jelentés

A munka végén írd le:

1. Mit valósítottál meg.
2. Milyen fájlok változtak.
3. Milyen teszteket és build parancsokat futtattál, és azok eredményét.
4. Hogyan indítható az alkalmazás.
5. Mi maradt hátra.
6. Hogyan importálható az exportált MIDI az FL Studio-ba.

**Most kezdd a repository felmérésével, majd implementáld a legkisebb teljes, működő vertikális szeletet: akkordmenet kiválasztása → meghallgatás → szerkesztés → MIDI-export.** Ne állj meg egy statikus UI-mockupnál.
