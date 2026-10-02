# Password Operatori

Piccola app Windows **portatile** (un solo `.exe`, nessuna installazione) per le responsabili
di cassa: legge `M_CTL999.DAT` e mostra password, cassa e stato di un operatore.
Grafica secondo il design system Terya (fondo #F2F2F2, nero #020609, accento #EC6906, Roboto, forme pill).

![screenshot](screenshot.png)

![accesso](screenshot-login.png)

## Uso

1. Copiare `PasswordOperatori.exe` sul server del punto vendita.
2. Avviarlo e accedere con **admin / admin**.
3. Digitare il codice dell'operatore (es. `609`) o parte del nome.

Risultato, ad esempio:

> La password dell'operatore 609 è **09** — Risulta aperto in cassa 24

- LED **verde** aperto, **giallo-arancio** in pausa, **rosso** chiuso, grigio non ancora aperto.
- Cassa, data, ora di apertura e ora di chiusura.
- Clic sulla password per copiarla negli appunti.
- Filtri rapidi: Tutti, Aperti, In pausa, Chiusi (con il conteggio).
- Scorciatoie: `Ctrl+F` cerca, `F5` aggiorna, `Esc` svuota la ricerca, `Invio`/`↓` vanno all'elenco.
- Il file viene riletto automaticamente ogni 3 secondi.

Il file viene cercato in quest'ordine:
1. percorso passato da riga di comando (`PasswordOperatori.exe D:\altro\M_CTL999.DAT`);
2. `C:\Server\Data\M_CTL999.DAT`;
3. la cartella dell'exe;
4. il primo `M_CTL*.DAT` in una delle due cartelle.

Con "Cambia file" in basso si può scegliere un altro file. Il file è aperto in **sola lettura**.

## Formato del file

```
0609:CASSIERE 609 :06090609:0024:09:01:170303:1011:0000
cod  nome          chiave    cassa pw stato data  apert chius
```

| Campo  | Esempio  | Significato                              |
|--------|----------|------------------------------------------|
| cassa  | `0024`   | cassa su cui l'operatore è stato aperto  |
| pw     | `09`     | password operatore                       |
| stato  | `01`     | `01` aperto · `02` chiuso · `08` pausa · `00` mai aperto |
| data   | `170303` | AAMMGG → 03/03/2017                      |
| apert. | `1011`   | 10:11                                    |
| chius. | `0000`   | non ancora chiuso                        |

I campi sono letti partendo da destra, quindi spazi nel nome non creano problemi.

## Compilare

Requisito: .NET Framework 4.x (già incluso in Windows 8/10/11 e Server 2012+).

Fare doppio clic su `build.bat`: usa il `csc.exe` presente in
`C:\Windows\Microsoft.NET\Framework\v4.0.30319\` e genera `PasswordOperatori.exe`,
con il font Roboto (cartella `fonts`, licenza Apache 2.0) e l'icona incorporati.

Le credenziali (`admin`/`admin`), il percorso predefinito e l'intervallo di aggiornamento
sono in cima a `PasswordOperatori.cs`, nella classe `Config`.

In `esempio/M_CTL999.DAT` c'è un file di prova.
