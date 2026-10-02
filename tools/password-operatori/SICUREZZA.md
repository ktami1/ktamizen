# Password Operatori · Scheda di sicurezza

Documento per i clienti e per i loro responsabili IT. Descrive cosa fa il programma sul server
del punto vendita e, soprattutto, cosa **non** fa.

## In sintesi

| | |
|---|---|
| File del gestionale | Aperto **solo in lettura** (`FileAccess.Read`). Il programma non modifica, non blocca e non cancella `M_CTL999.DAT`. |
| Altri file scritti | Solo due file in `%ProgramData%\PasswordOperatori`: `users.dat` (utenti) e `audit.log` (registro). Nient'altro, nessuna chiave di registro di sistema. |
| Rete | **Nessuna connessione.** Il codice non contiene alcuna funzione di rete: niente Internet, niente telemetria, niente aggiornamenti automatici. |
| Installazione | Nessuna. Un solo `.exe`; per rimuoverlo basta cancellarlo (e, se si vuole, la cartella dati). |
| Privilegi | L'uso quotidiano **non** richiede l'amministratore. Servono i privilegi di amministratore di Windows solo per la prima configurazione e per gestire gli utenti. |
| Codice sorgente | Disponibile e leggibile (3 file C#). L'exe si può ricompilare sul server con `build.bat`, usando il compilatore già presente in Windows. |

## Chi può accedere

- **Utenti personali.** Non esistono credenziali predefinite: alla prima esecuzione
  l'amministratore crea il proprio account, poi un utente per ogni responsabile di cassa.
- **Due ruoli.** *Responsabile*: cerca gli operatori e vede le password. *Amministratore*: in più
  gestisce gli utenti e consulta il registro.
- **Password robuste.** Almeno 10 caratteri, con lettere e numeri, diverse dal nome utente.
- **Password salvate in modo sicuro.** Solo come hash PBKDF2-HMAC-SHA256 con 200.000 iterazioni e
  sale casuale: nemmeno chi legge `users.dat` può risalire alle password.
- **Blocco dei tentativi.** Dopo 5 accessi errati in 15 minuti l'accesso si blocca per 5 minuti
  (il blocco si allunga se gli errori continuano). Il conteggio si basa sul registro, che non può
  essere cancellato da un utente normale.

## Durante l'uso

- **Password nascosta.** La password di un operatore compare solo dopo un clic su "Mostra"
  e resta visibile per 30 secondi.
- **Ogni visualizzazione è registrata.** Se il registro non è scrivibile, la password non viene
  mostrata.
- **Appunti ripuliti.** Una password copiata viene tolta dagli appunti quando si nasconde.
- **Blocco automatico.** Dopo 3 minuti di inattività la sessione si blocca e serve di nuovo la password.
  Si può anche bloccare a mano dal menu utente.
- **Solo file `M_CTL*.DAT`.** Il programma rifiuta qualsiasi altro file e i file sopra 10 MB.

## Registro accessi

Ogni evento diventa una riga di `audit.log`:

```
data e ora | computer | utente Windows | utente del programma | evento | dettagli | hash
```

Eventi registrati: configurazione iniziale, accesso riuscito o fallito, blocco e sblocco,
uscita, visualizzazione e copia di una password (con codice operatore), cambio del file,
creazione ed eliminazione di utenti, cambio password, consultazione del registro.
**Le password degli operatori non vengono mai scritte nel registro.**

Il registro è protetto in due modi:

1. **Permessi di Windows (NTFS).** Alla prima configurazione la cartella dati riceve permessi
   dedicati: gli utenti normali possono solo *leggere* e *aggiungere righe* al registro,
   non modificarlo né cancellarlo. Solo amministratori e SYSTEM hanno il controllo completo.
2. **Catena di hash.** Ogni riga contiene l'impronta SHA-256 della riga precedente. Se qualcuno
   modifica o cancella una riga, la finestra "Registro accessi" lo segnala indicando il numero
   della riga.

Limite da conoscere: un amministratore di Windows può comunque cancellare l'intero registro.
Il registro protegge dagli utenti normali e rende evidenti le manomissioni, ma non sostituisce
un archivio centralizzato (vedi sotto).

## Verificare che l'exe sia quello originale

Ogni versione viene distribuita con la sua impronta SHA-256. Sul server:

```
certutil -hashfile PasswordOperatori.exe SHA256
```

Il valore deve coincidere con quello comunicato. Lo stesso valore è visibile nel programma,
in *menu utente → Informazioni e sicurezza*.

## Prima installazione consigliata

1. Copiare `PasswordOperatori.exe` in una cartella non scrivibile dagli utenti, ad esempio
   `C:\Program Files\PasswordOperatori\`.
2. Avviarlo con *tasto destro → Esegui come amministratore* e creare l'amministratore.
3. Dal menu utente → *Gestione utenti*, creare un utente per ogni responsabile.
4. Creare il collegamento sul desktop delle responsabili.

## Possibili sviluppi

- **Firma digitale dell'exe** (Authenticode) con un certificato di firma del codice aziendale:
  Windows mostrerebbe il nome dell'azienda invece di "autore sconosciuto".
- **Copia del registro nel Registro eventi di Windows** o verso un server centrale (SIEM),
  così che nemmeno un amministratore locale possa cancellare le tracce.
- **Accesso legato agli utenti Windows o di dominio** (gruppo dedicato), senza password aggiuntive.
