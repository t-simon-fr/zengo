# Zengo

Magyar és angol felületű, böngészőben futó akkordmenet-műhely. A generálás, a választható szintetizátor-, zongora-, gitár-, hegedű-, trombita- és fuvola-előnézet, valamint a MIDI-export helyben működik; nincs szükség fiókra vagy API-kulcsra.

A zongora a Salamander Grand Piano Yamaha C5 hangmintáit használja (Alexander Holm, CC BY 3.0). A 30 MP3 fájl az alkalmazással együtt kerül kiszolgálásra, összesen kb. 2 MB; lejátszáskor nincs külső CDN-kérés. Első indításkor a felület jelzi a minták betöltését, utána a dekódolt hangokat újra felhasználja. A kiválasztott hangszer a projekt részeként menthető. Forrás és licenc: [public/audio/piano/CREDITS.md](public/audio/piano/CREDITS.md).

Az akusztikus gitár 37, a hegedű 15, a trombita 11 MP3 felvételt használ a N. P. Brosowsky-féle tonejs-instruments könyvtárból (CC BY 3.0). Források és licenc: [public/audio/INSTRUMENT-CREDITS.txt](public/audio/INSTRUMENT-CREDITS.txt). A fuvola külön VSCO 2 CE felvételekből épül: 34 PCM WAV, két dinamikai réteg, kitartott és kétféle váltakozó staccato indítás. A konverzió megőrzi az eredeti mintavételt, 16 bites mono WAV-ot készít, és illeszti a felvételek hangerejét. Kredit: Versilian Studios / Ivy Audio (CC0), részletek: [public/audio/flute/CREDITS.txt](public/audio/flute/CREDITS.txt). A hangszerek csak használatkor töltődnek be, a némított szólamokhoz nem töltünk mintákat. A fuvolakészlet kb. 13 MB, a teljes mintakészlet kb. 28 MB.

A dallam hangszíne a generálást is befolyásolja: a gitár akkordhangokra épülő pengetett motívumokat, a hegedű éneklő, többnyire lépésenként haladó dallamot, a trombita és a fuvola levegővételi szünetekkel tagolt frázisokat kap. A fuvola MIDI-jében finomabb dinamikai ívek is vannak. Kézi szerkesztés után a hangszínváltás megőrzi a ritmust, és az új hangszer tartományába illeszti a hangokat. A piano roll ugyanazokat a hanghatárokat használja, mint a generátor és a projektellenőrzés.

A MIDI General MIDI hangszerprogramot is tartalmaz (gitár 24, hegedű 40, trombita 56, fuvola 73, nullától számozva). A hegedű és a fúvósok CC11 dinamikagörbét és visszafogott, késleltetett CC1 vibratóvezérlést kapnak, a fúvósok CC2 légzésvezérlést is. A fogadó hangszerben ezek megfeleltetése könyvtárfüggő; nincs beégetett keyswitch vagy MPE-követelmény. A böngészős előnézet a CC11 hangerőgörbét követi. A fuvola rövid hangjai valódi staccato felvételekből szólalnak meg; hosszabb hangjai kitartott mintákból. Ezek rögzített hosszúságú minták, valódi legato átmenetfelvételek és folyamatos dinamikai rétegkeverés nélkül; a rendszer nem helyettesít egy teljes hangszerkönyvtárat.

A mintaforrások rögzített Git-revízióból reprodukálhatók: `node scripts/fetch-instruments.mjs` és `node scripts/fetch-flute.mjs`. Fejlesztéskor a `/scripts/audio-qa.html` oldal a böngésző natív dekóderével ellenőrzi az összes hangminta meglétét, dekódolhatóságát és jelszintjét.

## Indítás

Node.js 22.12+ szükséges.

```powershell
npm install
npm run dev
```

A terminálban megjelenő helyi címet nyisd meg (alapértelmezés: http://127.0.0.1:5173).

Ha ezen a gépen az npm-indító `MODULE_NOT_FOUND` hibával leáll, a működő npm közvetlenül is elérhető:

```powershell
node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' install --cache .npm-cache
node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' run dev
```

## GitHub Pages

The `.github/workflows/pages.yml` workflow builds and deploys Zengo whenever `main` is updated. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**. Project repositories are built with their repository path as Vite's base URL; a `<user>.github.io` repository uses the root path. Piano samples use the same base path.

## Zengo project format

Browser saves use the `zengo-studio-v1` local-storage key. Downloaded projects use the `.zengo.json` extension and schema version 1. MIDI exports and their track names are branded Zengo as well.

## Stúdió: lejátszás, szerkesztés és projektfájl

A kiválasztott menet szerkesztőjében négy fül található: **Akkordok, Basszus, Dallam, Dobok**. A basszus és a dallam hozzáadása a saját fülükön történik; a beállítások és kézi hangok a fülek váltásakor megmaradnak. Minden szólam külön némítható, hangerővel szabályozható.

A közös **Lejátszó** a kijelölt indítási ponttól indul. A pozíció a rácsra kattintással, a pozíciós csúszkával vagy a választóval állítható. Az **Ismétlés** bekapcsolásakor a klip vége után a teljes menet elejére tér vissza. A lejátszófej és a szóló hangok kiemelése a hangmotor óráját követi. Szerkesztés vagy tempóváltás leállítja az előnézetet; a következő indítás a módosított hangokat használja.

A három dallamos szólam ugyanazt a piano rollt használja: rácsválasztás (1/16, 1/8, 1/4), skálára illesztett mozgatás, hang jobb szélének húzásával hosszállítás, hozzáadás, törlés. Üres helyre dupla kattintással is hozzáadható hang. Nyilak mozgatnak, Shift+nyilak hosszúságot változtatnak, Delete töröl, Escape megszakítja a húzást. A basszus és dallam monofonikus; az akkordoknál eltérő hangmagasságú hangok átfedhetik egymást. Rögzített akkord időtartományában hang nem módosítható. Az akkordpreset vagy ritmika megváltoztatása visszaállítja a generált akkordhangokat; minden szerkesztés visszavonható.

A **Dobok** fülön három, együtemes és ismétlődő minta használható: egyenes, féltempós és tört groove. A lábdob/pergő/lábcin 16 lépése gombokkal kapcsolható. A **Basszus a lábdobhoz** a basszus belépéseit a lábdobhoz igazítja, az aktuális akkord alaphangján; kézi basszushang-szerkesztés kikapcsolja ezt a követést. A dobszett helyben szintetizált.

A közös **Swing** a nyolcados felütéseket késlelteti; a **Finom időzítési eltérés** legfeljebb 30 ms seedelt eltérést ad. A groove a lejátszás és a MIDI azonos hanglistáira hat, a szerkesztőrács az eredeti hanghelyeket mutatja. A hangok nem lógnak a klip végén túl. Négysávos exportban az akkord/basszus/dallam a MIDI 1/2/3., a dobok a GM 10. csatornán vannak.

A fejléc **Projektfájl** gombja az összes ötletet, hangot, hangszínt, némítást, keverést, dobmintát és groove-ot `.zengo.json` fájlba menti. A **Megnyitás** ezt másik böngészőben is betölti. Érvénytelen vagy 2 MB-nál nagyobb fájl nem módosítja az aktuális projektet. A **Projekt mentése** ettől külön a böngésző helyi tárolójába ment. A lejátszási pozíció és loop kapcsoló munkameneti vezérlő.

## Használat

A fejléc Magyar / English választójával bármikor válthatsz nyelvet, a szerkesztés elvesztése nélkül. A választást a böngésző megjegyzi; az alapértelmezett nyelv magyar. A feliratok, súgók, visszajelzések, akadálymentes címkék, hangnemnevek és MIDI-sávnevek is a választott nyelvet követik. Fordítási elvek: `docs/LOCALIZATION.md`.

1. Válassz hangulatot, hangnemet, tempót, hangfekvést, ritmikát és akkordváltást, majd generálj négy ötletet. A hat hangulat saját, tíz-tíz menetmintából és eltérő akkordtípusokból választ. A Lush profil tág, több oktávra elosztott, a Kompakt közeli hangfekvést ad.
2. A kártyák lejátszásgombjával hallgasd meg a meneteket. A négyakkordos előnézet 4/4-es, a választott akkordváltás szerint 2, 4 vagy 8 ütem hosszú. A ritmika több rövid megszólalást és szünetet is adhat egy akkordon belül. A „Hangulathoz illő” beállítás hangulatspecifikus ritmusokat oszt a négy javaslathoz.
3. Válassz egy ötletet. Az alatta megnyíló hangnézetben kattints egy ütemre, az akkordot pedig az akkord-, fordítás- és hangfekvés-választóval szerkesztheted. Mozgass egyes hangokat közvetlenül a piano rollon: húzd fel vagy le, használd a fel/le nyílbillentyűt, vagy kattints a hanglista nyilaival. Húzás közben az új hangmagasság látszik, a hangok a kiválasztott skálára illeszkednek. Az elengedés egy visszavonható lépést ment, az Escape megszakítja a húzást. A rögzített akkordokat előbb oldd fel.
4. A lakat a teljes akkordot védi. Az „Új variáció” csak a feloldott akkordokat cseréli le. A felső „Új ötletek generálása” teljesen új kártyákat készít.
5. A visszavonás legfeljebb 30 szerkesztési/generálási lépést őriz a munkameneten belül.
6. A „Projekt mentése” gomb a jelenlegi projektet e böngésző helyi tárolójába menti. A következő megnyitáskor visszatöltődik. A mentés kézi; a böngészőadatok törlése törli a mentést is.
7. A „MIDI export” a kiválasztott, ténylegesen szerkesztett menetet tölti le a jelenlegi tempóval.
8. A Basszus fülön a „Basszus hozzáadása” gombbal készíts basszusszólamot. Kitartott, pulzáló és mozgó karakter, lágy sub vagy pengetett szintihang választható. Az „Új basszusvariáció” csak a basszust változtatja; az akkordok megmaradnak. A közös lejátszás a két szólamot együtt szólaltatja meg, külön hangerővel és némítással. A basszus hangjai a közös piano rollon kézzel is szerkeszthetők.
9. A Dallam fülön a „Dallam hozzáadása” motívumokra épülő dallamot készít. Állítható a sűrűség, egy- vagy kétoktávos hangterjedelem, motívumismétlés és a lezárás. A visszavezető vég a loop első hangja felé vezet, a megnyugvó vég az utolsó akkord egyik hangján áll meg. Akusztikus zongora vagy lágy szintidallam, külön hangerő és némítás választható; a „Teljes menet meghallgatása” együtt indítja a szólamokat.

A dallam az aktuális akkordok hangjaira támaszkodik, közöttük skálahangokkal és szünetekkel; hangfekvése C4–C5 vagy C4–C6, a basszus fölött. A generált dallam követi az akkordok és időzítés változásait. A piano rollon húzd fel/le a hangokat skálán belül, balra/jobbra nyolcados rácson. A nyílbillentyűk ugyanezt teszik, Escape megszakítja a húzást. Az alsó mezőkben a kijelölt hang magassága, kezdése és hossza is állítható; az egymást átfedő hangokat a szerkesztő nem engedi. A generált ritmus negyednyi és háromnegyednyi beat-eltolásokat is tartalmazhat, a kézi kezdésválasztó nyolcados rácsot használ.

Az „Új dallamvariáció” és a négy generálási vezérlő új dallamot készít, felülírva a kézi hangmódosításokat; ez visszavonható. A kézzel szerkesztett dallam hangjai megmaradnak akkordcserekor, időzítésváltáskor pedig a teljes kliphosszhoz arányosan méreteződnek. A közös szerkesztő kézi hanghozzáadást és törlést is támogat.

A basszus minden akkord kezdetén az akkordfokhoz tartozó alaphangon indul; a fordítás és az akkordhangok kézi szerkesztése ezt nem változtatja meg. A mozgó karakter diatonikus kvintet és a következő akkord felé vezető skálahangokat használ. Az akkordok változtatásakor és átidőzítésekor a basszus automatikusan követi a menetet. A basszusbeállítások visszavonhatók és a projekttel együtt menthetők.

Basszussal a MIDI-export két sávot tartalmaz, külön csatornákon (akkordok: 1, basszus: 2). Mindkét sáv a teljes menet hosszát őrzi. A némítás és a hangerő kizárólag az előnézetre hat: az export minden szólam hangjait tartalmazza. Basszus nélkül megmarad az eredeti egysávos export.

Dallammal a MIDI egy további sávot tartalmaz a 3. csatornán; basszus nélkül is használható. A kézi dallamhangok magassága, kezdése és hossza pontosan megjelenik az exportban. Minden sáv azonos kliphosszú.

A szerkesztő **Akkordtípus** mezőjében hármashangzat, szeptim, kilenced, hatos, sus2, sus4 és add9 választható. Csak a kiválasztott skálában megvalósítható típusok jelennek meg. Az akkordszimbólumok különbséget tesznek például G9 és Cmaj9 között. A Lush/Kompakt beállítás a hangok elrendezését, az akkordtípus az összetételüket határozza meg.

A szerkesztő felső **Ritmika** mezője azonnal módosítja a kiválasztott menetet, újragenerálás nélkül. Hat minta használható: kitartott, félütemes, negyedes pulzus, offbeat, tresillo (3+3+2 nyolcad) és szinkópált. A piano roll az egyes ritmikus hangblokkokat mutatja, a lejátszás és az export ugyanazt az időzítést és hangsúlyozást használja. A közös piano roll egy hangblokkot önálló hangeseményként szerkeszt. Az oldalsó akkordhanglista módosítása újraépíti a teljes akkord ritmikus megszólalásait. Az akkord rögzítése a hangokat és a voicingot védi; a közös ritmika a rögzített akkordokra is vonatkozik.

Az **Akkordváltás** mező generáláskor és a szerkesztőben is elérhető. Ütemenkénti váltásnál a menet 4 ütemes, félütemenkéntinél 2, kétütemenkéntinél 8. Az előrehozott váltások a 3,5 / 7,5 / 11,5. negyednél hozzák be a következő akkordot. A változó hosszúság 2 / 2 / 4 / 8 negyedre osztja a négy akkordot, összesen 4 ütemben. A piano roll arányosan mutatja a hosszakat, külön ütemvonalzóval. Akkordcsere, fordítás, variáció és hangmozgatás megőrzi az időzítést. A rögzítés a hangokat és a voicingot védi; az egész menetre alkalmazott időzítés ezeket az akkordokat is áthelyezi.

A ritmus a teljes menet közös negyedrácsát követi. Kétütemes akkordon a rövid ritmusminta mindkét ütemben ismétlődik, a kitartott hangzás viszont végig szól. Akkordhatárnál a hangok az előző akkordból nem lógnak át; az új akkord szükség szerint újraindítja az éppen szóló hangütést. A lejátszás és a MIDI-klip vége a menet tényleges hosszát követi.

A **BPM-mező** gépelés közben szabadon szerkeszthető, kiüríthető. Enter vagy a mező elhagyása véglegesíti az értéket: egész BPM-re kerekít és 40–220 közé szorít. Üres/érvénytelen értéknél az utolsó érvényes tempó áll vissza; Escape visszaállítja azt gépelés közben is. A Mentés vagy MIDI-export gombra kattintás is véglegesíti a beírt értéket.

A korábbi projektmentések hangjai, szerkesztései, rögzítései, ritmusai és időzítései megmaradnak. Az új, 8-as mentési formátum a hangszert, basszus- és dallambeállításokat, kézi dallamhangokat és előnézeti keverést is megőrzi; az 1–7. verziójú mentések továbbra is betölthetők.

Hangnem-, hangulat- vagy akkordhangzás-választás a következő generálásra hat; a meglévő kártyák a saját hangnemüket és voicingjukat mutatják. A hangmozgatás a projekt hangnemének dúr vagy természetes moll skáláján belül marad. A tempóváltoztatás megállítja az előnézetet, és a következő lejátszás/export már az új tempót használja. A javaslatok közötti választás megőrzi azok szerkesztéseit.

## MIDI az FL Studio-ban

1. Töltsd le a `.mid` fájlt.
2. Nyiss egy hangszer-csatornát és annak piano rollját az FL Studio-ban.
3. Húzd be a MIDI-fájlt a piano rollba, vagy használd annak MIDI-importálását.
4. A projekt tempóját állítsd a fájlnévben is szereplő BPM-re, ha a használt importálási mód nem veszi át a fájl tempóadatát.
5. Ellenőrizd a négy akkordot és a választott akkordváltás szerinti 2/4/8 ütemes kliphosszt. A hangszínt az FL Studio hangszere adja.

Az export fájlformátumát automatikus visszaolvasási teszt ellenőrzi; az FL Studio-ban való kézi ellenőrzés külön feladat.

## Fejlesztés

```powershell
npm run typecheck
npm run test
npm run build
npm run preview
```

- `src/harmony.ts`: skálák, diatonikus akkordok, seedelt jelöltválasztás, egyszerű szólamvezetés, akkordcsere és variációk.
- `src/playback.ts`: megszakítható Tone.js előnézet; új előnézet vagy állapotmódosítás leállítja az előzőt.
- `src/midi.ts`: közös hanglistából képzett MIDI-export, tempóval és 4/4-es ütemmutatóval.
- `src/App.tsx`, `src/TrackEditor.tsx`, `src/TransportBar.tsx`, `src/styles.css`: felület, közös piano roll, lejátszó, állapot és akkordszerkesztő.
- `src/tracks.ts`, `src/note-data.ts`: közös hangmódosítás, rögzítés és ütközéskezelés.
- `src/project.ts`: verziózott projektfájl és böngészős mentés ellenőrzése, korábbi formátumok betöltése.
- `src/drums.ts`, `src/groove.ts`, `src/DrumPanel.tsx`: dobgenerálás és lépésszerkesztő, közös swing/humanizálás.
- `src/studio.test.ts`, `src/playback.test.ts`: négy szólam, projektfájl, MIDI, loop, seek és hangmotor-életciklus.
- `src/harmony.test.ts`: hangnemi invariánsok, reprodukálhatóság, rögzítés és MIDI-visszaolvasás.
- `src/i18n.ts`: közös, típusellenőrzött magyar/angol fordításkatalógus és nyelvválasztás.
- `src/i18n.test.ts`, `src/note-drag.test.ts`: fordítási változók, zenei terminológia, MIDI-metaadatok és a húzás hangnemi/rögzítési korlátai.
- `src/rhythm.ts`, `src/rhythm.test.ts`: hat ritmusminta, hangsúlyok és szünetek; akkordtípusok, hangulati különbségek és a ritmikus MIDI-visszaolvasás tesztjei.
- `src/timing.ts`, `src/timing.test.ts`: öt akkordváltási minta, időzítésmegőrző szerkesztés és mind a 30 időzítés/ritmus kombináció MIDI-visszaolvasása.

## Tudatos MVP-határok

12 alaphang, dúr és természetes moll; diatonikus hármashangzatok és bővített akkordok; négy akkord és 2/4/8 ütemes, előre definiált időzítések. A hangulat kreatív súlyozás, nem objektív zeneelméleti állítás. A hangnevek következetes, egyszerű enharmonikus jelölést kapnak (nem teljes kottázási írásmódot).

A piano roll a tényleges hangokat és ritmikát mutatja, akkordkijelölésre és skálához illesztett függőleges hanghúzásra is használható. Kromatikus hanghúzás, szabad akkordhatárok, 11/13-as akkordok, saját dobminták importja és VST3 későbbi fejlesztés.
