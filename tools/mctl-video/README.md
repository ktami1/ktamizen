# Video MCTL Viewer (Remotion)

Video promozionale di 20 secondi (1920x1080, 30 fps) che spiega a cosa serve MCTL Viewer.
Usa lo stile Terya: sfondo #F2F2F2, nero #020609, accento arancione #EC6906, font Roboto.

- `src/timeline.json`: la timeline, condivisa da video e audio (120 BPM, un beat ogni 15 frame).
- `src/Promo.tsx`: tutte le scene (richieste dai negozi, procedura di oggi, il file M_CTL, l'app, payoff, chiusura).
- `scripts/sfx.mjs`: musica ed effetti sintetizzati in codice, scrive `public/music.wav`.

```bash
npm install
npm run studio     # anteprima
npm run render     # out/mctl-viewer.mp4
```

Per pubblicarlo: `ffmpeg -i out/mctl-viewer.mp4 -c:v copy -af loudnorm=I=-14:TP=-1 -c:a aac out/final.mp4`.

## Video 30 secondi: ticket SysAid → Password Operatori

Composizione `TicketPromo` (1920x1080, 30 fps, 900 frame): arrivano 10 ticket "richiesta password",
si apre il ticket #276084 "Richiesta password operatore 09", il vecchio metodo col file M_CTL, la ricerca in
Password Operatori, la risposta e la chiusura del ticket, tutti i ticket chiusi, la sicurezza e la chiusura.
Negozi, tecnici e ticket sono inventati; il layout riprende quello di SysAid.

- `src/ticket-timeline.json`: timeline condivisa da video e audio.
- `src/TicketPromo.tsx`: scene.
- `scripts/sfx-ticket.mjs`: musica ed effetti, scrive `public/ticket-music.wav`.

```bash
npm run render:ticket   # out/password-operatori-ticket.mp4
```
