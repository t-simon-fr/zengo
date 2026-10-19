# Magyar / English lokalizáció

A teljes `src/i18n.ts` katalógus nyelvi és zenei szempontú átnézést kapott. Az angol szöveg a felület tényleges működését írja le; az inspirációs szövegek szabadabb angol megfogalmazást kaptak. Az alkalmazás alapértelmezése magyar, a fejlécben választott nyelvet külön böngészőbeállítás tárolja, így a projektformátum nem változik.

| Magyar fogalom | Angol felirat | Megfontolás |
| --- | --- | --- |
| Akkordmenet | Chord progression / progression | Zenei szakszó; szűk helyen a rövid alak elég. |
| Hangzás | Voicing | Itt az akkordhangok elrendezéséről van szó; a sound inkább hangszínt jelentene. |
| Fordítás | Inversion | Zeneelméleti fogalom. |
| Alapállás | Root position | A szokásos angol elnevezés. |
| Hangfekvés | Register | A mélyebb/középső/magasabb fekvést jelöli. |
| Ütem | Bar | Az ütem időegysége; a beat egy negyednyi lüktetés ebben a 4/4-es projektben. |
| Skálahangonként | By scale steps | Diatonikus léptetés, nem félhangonkénti transzponálás. |
| Meghallgatás | Preview | Rövid zenei előnézet indítása. |
| Rögzítés | Lock chord | Megőrzi az akkordot és a voicingot szerkesztés és variálás közben. |
| Laza | Laid-back | Természetes zenei hangulatjelző. |
| MIDI letöltése | Download MIDI | A művelet eredményét nevezi meg. |

Az angol felület a dúr/moll helyett major/minor hangnemneveket használ. Az akkordszimbólumok, fokszámok, hangmagasságok, BPM és MIDI-adatok nyelvfüggetlenek. A MIDI-sávnév ASCII-kompatibilis kötőjelet használ, mert az exportkönyvtár a gondolatjelet hibás karakterré kódolja.

A katalógus típusellenőrzött, minden interpoláció mindkét nyelven megmarad. A tesztek ellenőrzik az összes fordítás meglétét és a változókat, a zenei szakkifejezéseket, a hangnemneveket és azt, hogy az angol MIDI-metaadatok nem változtatják meg a hangokat vagy időzítésüket. A természetes nyelvezet ellenőrzése kézi szerkesztői átnézés; ezt az automatikus tesztek nem helyettesítik.
