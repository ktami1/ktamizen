# Welcome to your Lovable project

TODO: Document your project here

## 🎮 KTAMIZEN — Park Edition

Gioco endless runner pensato per bambini (5+), giocabile dal browser e ottimizzato per iPad.
Rotte: `/park` (o `/game`), oppure il pulsante colorato in home.

**Come si gioca**

- **SALTA** (freccia verde in basso a destra) — salta gli ostacoli del parco: cespugli, coni,
  panchine, cestini, castelli di sabbia, palloni, cagnolini, altalene, scivoli. Si può fare
  anche il doppio salto.
- **GIÙ** (freccia blu) — abbassati sotto rami, uccellini, aquiloni e palloncini.
- Si può toccare in qualsiasi punto dello schermo per saltare; da tastiera:
  `Spazio`/`↑` salta, `↓` si abbassa, `Esc`/`P` mette in pausa.
- Raccogli i **gelati** (5 punti + combo), la **stella** rende invincibili per qualche secondo
  e il **cuore** ridà una vita. Si hanno 3 vite.
- Ogni 220 punti si sale di livello: la corsa accelera e il parco cambia colori
  (mattina, tramonto, notte stellata…). Il record resta salvato sul dispositivo.

**Com'è fatto**

| File | Contenuto |
| --- | --- |
| `src/game/parkEngine.ts` | logica pura del gioco (fisica, spawn, collisioni, punteggio) — testata con Vitest |
| `src/game/parkRender.ts` | disegno del parco e del personaggio su canvas 2D |
| `src/game/parkAudio.ts` | effetti sonori e musichetta generati con WebAudio (niente file audio) |
| `src/game/park.css` | interfaccia animata (titolo arcobaleno, tasti, schermate) |
| `src/pages/ParkGame.tsx` | pagina React: canvas, HUD, comandi touch/tastiera |
| `src/assets/kid-face.png` | la faccia ritagliata dalla foto, usata come testa del personaggio |

Test della logica di gioco: `npm test`.
