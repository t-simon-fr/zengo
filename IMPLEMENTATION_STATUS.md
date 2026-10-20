# Zengo állapot — 2026-10-20

## Hangszerfüggő dallamok és akusztikus hangkönyvtár

- Zengo projektformátum: 1-es verzió, `.zengo.json`, `zengo-studio-v1` böngészős tárhely. A korábbi ChordFlow-sémák támogatása megszűnt; az alábbi régebbi naplóbejegyzések történeti állapotot írnak le.
- Zongora mellett mintavételezett gitár, hegedű, trombita és fuvola, külön dallamhangszín-választással. Hangszerfüggő ritmika, hangterjedelem, ugráskorlát és frázisformálás; a fúvósoknak levegővételi szünetek. A kézi dallam ritmusa és dinamikája hangszerváltáskor megmarad, hangjai az új hangszer tartományába kerülnek. A közös szerkesztő és a projektvalidáció is ugyanazokat a határokat használja.
- A fuvola 34 VSCO 2 CE felvételt használ, két dinamikai réteggel, kitartott és rövid artikulációval, kétféle váltakozó staccato indítással. Rögzített forrásrevízió, reprodukálható 16 bites mono WAV-konverzió, rétegenként illesztett jelszint, CC0 kredit. A többi három új akusztikus hangszer 63 MP3 felvétel a tonejs-instruments könyvtárból, CC BY 3.0 forrásmegjelöléssel.
- MIDI-ben hangszerprogram, hegedűnél/fúvósoknál CC11 expression és késleltetett, finom CC1 vibratóvezérlés; fúvósoknál CC2 breath is. A böngészős előnézet a CC11 görbét követi, seek és loop esetén is. A fogadó virtuális hangszer CC-hozzárendelése könyvtárfüggő; nincs könyvtárspecifikus keyswitch.
- 48 automatizált teszt sikeres; hangszerprofilok 24 hangnemben, szerkesztés/mentés, MIDI-programok és vezérlőgörbék, cache, némított szólamok, leállítás és hiba utáni újratöltés ellenőrizve. Mind a 127 helyi hangminta a böngésző natív dekóderével is ellenőrzött, hiányzó/néma/sérült fájl nélkül. A mintakészlet összesen kb. 28 MB, hangszerenként, igény szerint töltődik.

## Korábbi fejlesztési napló — 2026-10-17

## Loop, közös szerkesztő, projektfájl és dobok

- Audioórára épülő ismétlés, kiválasztott negyedpozíciótól indítás és hang közepén történő újraindítás; látható lejátszófej és szóló hangok/doblépések kiemelése. A loop az első részleges kör után a teljes menetet ismétli. Szerkesztés leállítja az előnézetet; a pozíció és loop kapcsoló munkameneti vezérlő.
- Akkordok/Basszus/Dallam/Dobok fülek. Három dallamos szólam közös piano rollal, hozzáadás/törlés (üres szólam is menthető), skálára illesztett húzás, rács, szélnél húzható hossz, billentyűk és mezők. Akkordrögzítés és mono ütközéskezelés; két azonos hangmagasságú akkordhang sem fedheti egymást. Az akkordpreset vagy ritmika lecserélése visszaállítja a generált akkordhangokat.
- 8-as projektformátum; teljes, letölthető `.chordflow.json`, ellenőrzött fájlmegnyitás (2 MB korlát, korábbi mentési verziók támogatása), érvénytelen fájlnál változatlan projekt. A böngészős mentés továbbra is külön, kézi művelet.
- Egyenes, féltempós és tört dobminta, ismétlődő 16 lépéses lábdob/pergő/lábcin szerkesztő, helyben szintetizált dobszett, külön keverés és variáció. Opcionális basszus–lábdob ritmuskövetés. A kézi basszusszerkesztés kikapcsolja a követést.
- Közös swing és legfeljebb 30 ms determinisztikus időzítési eltérés; ugyanazok a hanglisták a lejátszásban és MIDI-ben. Az export minden szólamot tartalmaz, a némítás/hangerő továbbra is előnézeti keverés.
- 41 sikeres teszt: korábbi invariánsok + loop/seek/megállítás, dobhangmotor-életciklus, hangok hozzáadása/törlése/átméretezése, rögzítés/ütközés, projekt-validáció és négysávos groove-os MIDI. TypeScript és production build ellenőrizve.
- Böngésző: basszushang hozzáadása, szélnél húzással 0,5→1 negyed hossz, törlés, lábdobkövetés; három dobszólam kapcsolása; ismétlés a klip végéről átfordulva, haladó lejátszófej és aktív hangjelzés. Friss betöltéskor az utolsó kódtisztításban keletkezett hiányzó import javítva.
- Teljes projekt export és visszanyitás sikeres (158 BPM, tört minta, egyedi pergőlépés, basszuskövetés, dallam, 60% swing/30 ms eltérés). Hibás projektfájl böngészőből is elutasítva, az aktuális projekt megmaradt. Az eredeti böngészős mentést nem írtam felül.
- Böngészőből letöltött MIDI külön visszaolvasva: 12 akkordhang + 20 basszushang + 18 dallamhang + 68 dobhang, 0/1/2/9 csatornák, minden sáv 7680 tick; a groove-os kezdések ellenőrizve. Előnézet: `docs/chordflow-studio.png`.

## Motívumalapú dallam

- Sűrűség, egy-/kétoktávos hangterjedelem, ismétlés és visszavezető/akkordhangon megálló lezárás. A generált dallam erős helyeken az aktuális akkord hangjait használja; köztük skálahangok, szünetek és visszatérő ritmikai kontúr. C4–C5/C6 tartomány, a basszus fölött.
- Akusztikus zongora a meglévő mintákkal vagy lágy szintidallam. Közös audioóra mindhárom szólamhoz; külön némítás és hangerő. Zongoraminták megosztva, egyszeri dekódolással.
- Interaktív dallam-piano roll: függőleges skálahanghúzás, vízszintes nyolcados mozgatás, nyilak, Escape megszakítás, kiválasztott hang kezdés/hossz/magasság mezői. Monofonikus korlát; kézi hozzáadás/törlés nincs. A generálási vezérlők új dallamot készítenek, a kézi módosításokat visszavonhatóan lecserélik.
- A 7-es mentés a dallambeállításokat és kézi hangokat is tárolja, korábbi projektek betölthetők. Kézi dallam akkordcserekor megmarad, teljes kliphossz-váltáskor arányosan méreteződik.
- 34 sikeres teszt, TypeScript és build sikeres. Dallam-invariánsok 24 hangnem × 5 időzítés × 3 sűrűség × 2 hangterjedelem kombináción; szerkesztés, újraméretezés, háromsávos MIDI, hangmintamegosztás, lead és némítás ellenőrizve.
- Böngészőben: közös lejátszás zongorás és szintidallammal, B4→A4 függőleges húzás, hanghossz 0,25 negyedre állítása és kezdés 0,5 negyeddel jobbra húzása. Külön localhost mentés után C6, 1,5. negyed kezdet, 0,25 negyed hossz, ritka/kétoktávos/megnyugvó/lead állapot visszatöltődött. Az eredeti mentést nem írtam felül.
- Böngészőből letöltött MIDI visszaolvasva: 53 akkordhang + 16 basszushang + 13 dallamhang, három csatorna, mindhárom sáv 7680 tick. A kézzel szerkesztett C6 dallamhang kezdése 240 tick, hossza 120 tick. Konzolhiba nincs. Előnézet: `docs/chordflow-melody.png`.

## Basszus első verzió

- Kitartott, pulzáló és mozgó basszus; a generátor skálafokból számol alaphangot, az akkordfordítástól és kézi hangfekvéstől függetlenül. Mono, skálán belüli hangok; változó és előrehozott akkordhosszokat is követ.
- Külön újragenerálás, két szintetizált basszushangszín, akkord/basszus némítás és hangerő, közös lejátszás és basszus-áttekintő. A kézi basszushúzás és dallam a következő fázis.
- A 6-os mentés a basszus stílusát, seedjét, hangszínét és keverését is tárolja; régi mentések betölthetők. A basszus állapota a munkamenet visszavonásának része.
- Kétsávos MIDI: külön akkord- és basszuscsatorna, azonos kliphossz. A preview-keverés nem töröl szólamokat az exportból.
- 29 sikeres teszt; TypeScript és build sikeres. Basszustesztek 24 hangnem × 5 időzítés × 3 karakter kombináción, reprodukálhatóság, fordításfüggetlenség, MIDI-csatornák és közös audioóra/némítás/megszakítás.
- Böngészőben mindkét basszushang és közös/önálló lejátszás indítása sikeres, konzolhibák nélkül. Külön localhost tárolón a pulzáló/pengetett/némított basszus és vegyes időzítés mentés–újratöltés után megmaradt. Az eredeti 127.0.0.1-es mentést nem írtam felül.
- Letöltött MIDI külön visszaolvasva: 53 akkordhang + 16 basszushang, 0/1 csatorna, 39-es basszusprogram, mindkét sáv 7680 tick / 16 negyed. Előnézet: `docs/chordflow-bass.png`.

## Akkordváltások időzítése és BPM-bevitel

- Öt akkordváltás: ütemenként, félütemenként, kétütemenként, előrehozott és vegyes hosszúság. A négy akkord 2/4/8 ütemet tölt ki; a generátorban és a szerkesztőben is választható.
- Arányos akkordhosszok a piano rollban, külön ütemvonalzóval és a globális negyedrácsra illeszkedő segédvonalakkal. Az előrehozott váltás kezdeteit a hangnézet is mutatja.
- A hat ritmus a teljes menetben ismétlődik; a kitartott akkord teljes hosszán szól. Akkordhatárnál a hangütések rövidülnek/újraindulnak, így nem szólnak át az előző harmónia hangjai. Lejátszási idő és MIDI-kliphossz a tényleges 8/16/32 negyedet követi.
- Akkordtípus-, fordítás- és hangfekvéscsere, variáció és egyedi hangmozgatás megőrzi a kezdést és hosszúságot. Az új 4-es projektformátum az időzítést is menti; 1/2/3-as verziók ütemenkénti időzítéssel betölthetők.
- BPM javítva: külön gépelési állapot, Enter/blur véglegesítés, 40–220-as tartomány, kerekítés, üres/érvénytelen mezőnél az előző tempó visszaállítása, Escape visszaállítás.
- 21 teszt sikeres; TypeScript és production build sikeres. Hat új teszt az időzítésekre, hosszú akkordokra, előrehozott váltásokra, szerkesztésre és mind a 30 időzítés/ritmus kombináció MIDI-exportjára.
- Böngésző: egyesével begépelt 1 → 137 nem ugrik 40-re; Enter után 137 BPM. Üres mező elhagyása után 137 marad, 999 véglegesítése 220-ra korlátoz. A beírt 149 a Mentésre kattintva, Enter nélkül is véglegesedik.
- Az előző 3-as formátumú mentés hangjai és szinkópált ritmusa betöltődött. Az új mentés újratöltésekor a 149 BPM, vegyes időzítés, szeptim akkordtípus és szinkópált ritmus megmaradt (külön localhost tárolón ellenőrizve).
- Böngészőből letöltött MIDI külön visszaolvasva: 53 hang, 149 BPM (MIDI-kerekítési pontossággal), 16 negyed / 7680 tick kliphossz. A két félütemes kezdőakkord ritmikus belépései ellenőrizve. A böngészőkonzol tiszta. Előnézet: `docs/chordflow-timing-editor.jpg`.

## Új akkordok és ritmikák

- A közös 16 minta helyett hat külön, tíz-tíz menetes hangulatkönyvtár, saját akkordtípus-palettákkal. A sötét profil feszültebb, a levegős sus/add9/hatos, az energikus határozottabb akkordokat részesít előnyben. A ♭9-es színezés az automatikus generálásban csak a sötét profilban szerepel.
- Szerkeszthető hármashangzat, szeptim, kilenced, hatos, sus2, sus4 és add9. A típusválasztó csak a skálába illő lehetőségeket kínálja. Javított domináns/maj7/maj9/ø7 címkék és valódi basszushangot váltó Lush fordítások.
- Lush = tág hangfekvés; Kompakt = közeli hangfekvés. Az akkordtípus ettől független.
- Hat ritmusminta: kitartott, félütemes, negyedes pulzus, offbeat, tresillo és szinkópált. Generáláskor automatikus hangulati ritmus, a szerkesztőben azonnali ritmuscsere és visszavonás.
- A piano roll a hangütések tényleges kezdetét és hosszát mutatja. Hanghúzáskor az adott akkordhang minden ismétlése együtt mozog. A lejátszás és az export ugyanazokból a ritmikus hangeseményekből dolgozik.
- A mentési formátum 3-as verziója az akkordtípust és a ritmust is tárolja. A korábbi mentések változatlan hangokkal és rögzítésekkel, kitartott ritmussal töltődnek be.
- Ellenőrzés: 15 sikeres teszt, minden támogatott akkordtípus és fordítás mind a 24 hangnemben; eltérő hangulati menetek; minden ritmus MIDI-visszaolvasása, hangsúlyok, szünetek és a teljes négyütemes kliphossz.
- Böngészőben: új generálás, akkordtípuscsere, ritmuscsere, lejátszás indítása, ritmikus hangblokkok húzása. A letöltött tresillo MIDI 42 hangot, 110 BPM körüli tempót (MIDI-időfelbontás), 480 PPQ-t, 7680 tick kliphosszt és a C4-ről D4-re húzott hang mindhárom ismétlését tartalmazta.
- A korábbi mentés betöltése ellenőrizve. Külön localhost tárolón mentés–újratöltés után a C6 akkordtípus, szinkópált ritmus és hangok megmaradtak. A felhasználó eredeti 127.0.0.1-es mentését a teszt nem írta felül.
- Magyar mobilnézet 390 px-en: 375 px dokumentum- és görgetési szélesség; a ritmusválasztó és hangblokkok elérhetők. Előnézet: `docs/chordflow-rhythm-editor.jpg`.

## Választható playback hangszer

Frissítés: a modellezett FM-zongorát valódi Yamaha C5 felvételekből szóló Tone.Sampler váltotta fel. 30 helyi Salamander MP3, kb. 2 MB, szerző- és licencfeltüntetéssel. Első betöltési jelzés, dekódolt minták újrafelhasználása, betöltés közbeni megszakítás és hibát követő újrapróbálás támogatott. 24 teszt és a production build sikeres. Az alábbi felsorolás a korábbi modellezett változatot dokumentálja.

- A lejátszás hangszíne a beállítások között választható: háromszög-hullámú szintetizátor vagy FM-szintézissel modellezett, zongoraszerű hang.
- A modellezett zongora azonnal, hálózat és külső hangminta nélkül működik. Nem akusztikus zongorafelvétel; később cserélhető mintavételezett zongorára.
- Az új, 5-ös mentési séma eltárolja a választást; a korábbi mentések szintetizátorral nyílnak meg.
- Magyar és természetes angol felirat készült.

## Korábbi MVP-ellenőrzések

Megvalósult az akkordmenet MVP: egyszerű kezdőnézet, hat hangulatprofil, 24 hangnem, négy seedelt javaslat, Lush/9-es és Triád voicingválasztás, szintetizált előnézet, akkordcsere és -fordítás, oktávváltás, egyes hangok skálalépéses mozgatása egérrel, billentyűzettel vagy gombokkal, rögzítés, variáció, visszavonás, böngészős projektmentés és MIDI-export. A régi mentési formátum automatikusan Triád voicinggá alakul.

## Ellenőrzések

- TypeScript strict ellenőrzés: sikeres.
- Production build: sikeres.
- Vitest: 10 teszt sikeres (az eredeti 6 harmónia/MIDI teszt mellett 3 lokalizációs és 1, mind a 24 hangnemet vizsgáló hanghúzási teszt).
- Böngészőben: generálás, külön kártyák lejátszásának indítása/váltása/leállítása, kiválasztás, első fordítás, rögzítés, variáció, visszavonás, mentés és újratöltés utáni visszaállítás ellenőrizve.
- MIDI-letöltés böngészőből ellenőrizve: `chordflow-A-moll-110bpm.mid`.
- A böngészőből letöltött fájl külön visszaolvasva: 1 track, 12 hang, 110 BPM, 4/4, 7680 tick / 480 PPQ = 16 negyed.
- Mobil elrendezés: 390 px-es viewportban a dokumentum szélessége és görgetési szélessége egyezett (375 px a görgetősáv mellett). A hangnézet saját vízszintes görgetést kap.
- A Lush MIDI-export visszaolvasva 20 hangot (akkordonként 5), 110 BPM-et, 4/4-et és a kézzel módosított F–G3 hangot tartalmazta.
- Új, tiszta böngészőlapban a konzol hibát és figyelmeztetést nem jelzett. A kezdeti ellenőrzésben észlelt hiányzó React-kulcsot javítottam.
- A kézi hangmozgatást külön is ellenőriztem: a zongoratekercsen az A2 fel nyílja a skálán következő B2-re lépett.
- Magyar / English nyelvválasztó elkészült, megőrzi a munkamenetet és böngészőben tárolja a nyelvet. A teljes fordításkatalógus nyelvi és zenei átnézést kapott; részletek: `docs/LOCALIZATION.md`.
- Angol böngészős ellenőrzés: feliratok, teljes súgó, hangnemek, szerkesztő, rögzítés/feloldás, visszajelzések, dokumentumnyelv és metaadatok. Nyelvváltáskor az akkordhangok változatlanok, újratöltéskor megmarad a nyelv.
- Valós egérhúzással C4 → D4, majd egyetlen Undo lépéssel C4-re visszaállítás ellenőrizve; Lush akkordnál ugyanez a húzás szintén működik. Mozgatás közben élő előnézet, skálára illesztés, foglalt hangmagasságok kihagyása és Escape megszakítás támogatott.
- Angol mobilnézet 390 px-en: 375 px dokumentumszélesség és görgetési szélesség; a nyelvválasztó és a logó nem fedik egymást. Az ellenőrzésnél talált fejléc-ütközés javítva.
- MIDI-sávnév lokalizálva; az exportkönyvtár gondolatjel-kódolási hibája miatt ASCII kötőjelet használ. A visszaolvasási teszt az angol sávnevet és az eredetivel azonos hangokat/időzítést ellenőrzi.
- A hangkimenet hallás utáni minősítését és az FL Studio-ban történő kézi importot még el kell végezni.

## Környezeti megjegyzés

A gép általános npm-indítója hiányzó Roaming npm-fájlra hivatkozik. A Node telepítés saját npm CLI-ja működik; a README tartalmazza a használható parancsot. A csomagtelepítés és az esbuild a Codex korlátozott környezetében jogosultsági hibát kapott; az engedélyezett futtatás sikerült.

## Következő fejlesztési kör

FL Studio-próba és felhasználói visszajelzés után: több és zeneileg karakteresebb minta; projektfájl mentés/betöltés; összetettebb akkordok. Dallam, basszus, ritmus és szabad hanghúzás külön fázisban.
