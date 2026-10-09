# Flussi UX

I flussi dell'MVP passo per passo: rotta, chiamate, stati. Le chiamate sono descritte in `mappa-endpoint.md`, le scelte di perimetro in `inventario-funzioni.md` (decisioni D1–D15, accolte il 9 ott 2026). L'aspetto delle schermate è nel canvas (`../_materiale/epicentric-handoff/docs/design-spec.md`).

## Regole comuni

- **Una sola azione primaria per vista.** Le altre sono secondarie o nel menu della riga.
- **Esito delle operazioni**: toast per i successi e per gli errori recuperabili; dialogo solo per confermare un'azione distruttiva. Nessuna modale di "operazione riuscita".
- **Errori**: l'area utenti ha messaggi dedicati per codice. Contenuti, Link ed Epikey hanno un messaggio generico per operazione ("Non è stato possibile salvare il Link"), perché il backend risponde con frasi libere (A12).
- **Sessione scaduta**: qualsiasi 401 azzera la sessione e porta a `/login?redirect=<rotta>`; dopo il login si torna dove si era.
- **Caricamento**: scheletri al posto delle liste, mai una rotella a tutta pagina. Le azioni ottimistiche (Freeze, riordino, Frequence) cambiano subito l'interfaccia e tornano indietro con un toast se la chiamata fallisce.
- **Stati vuoti**: ogni lista vuota dice qual è il passo successivo e lo offre come azione primaria. Sostituiscono il tutorial della legacy (D6).
- **Conferme distruttive**: dicono che cosa si perde, con i numeri ("Cancelli 3 contenuti e i loro 7 Link").

## 1. Accesso

Già sviluppato, tranne dove indicato.

| Flusso               | Passi                                                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Login                | `/login` → email e password → `/app` (oppure la rotta in `redirect`). Chi ha già una sessione viene portato a `/app` dal server        |
| Registrazione        | `/signup` → email, password, data di nascita, caselle → account creato → login automatico → `/app`                                     |
| Conferma dell'email  | Link nell'email → `/confirm-account/:code` → redirect a `/confirm/:code` → esito. Non blocca l'uso dell'app                            |
| Password dimenticata | `/forgot-password` → email → stesso messaggio in ogni caso → link nell'email → `/reset-password/:code` → nuova password → `/login`     |
| Invito               | `/invite-signup?code=…&campaign=…` → redirect a `/signup` con gli stessi parametri (D4). Il codice dello sharing space non viene usato |
| Uscita               | Voce nella pagina account → sessione chiusa → `/login`                                                                                 |

## 2. Primo ingresso

1. `/app` porta a `/app/keys` (D1).
2. `GET maps/load`: se l'utente non ha Map, il backend crea "My first map". L'albero ha quindi sempre almeno una radice.
3. Con la Map vuota e il Catalog vuoto, la pagina mostra i due passi: **Aggiungi contenuti** (primaria, → `/app/catalog/add`) e "Crea il primo Epikey".
4. Con contenuti ma senza Link, l'azione primaria diventa **Crea Link**.

## 3. Aggiungere contenuti

Rotta: `/app/catalog/add`. Si arriva dalle 4 tile del Catalog; la tile scelta apre la scheda corrispondente.

### Upload

1. Scelta dei file o trascinamento sulla finestra, da qualsiasi pagina del Catalog.
2. Prima di partire: `GET application/storage`. Se i file superano lo spazio libero, avviso con lo spazio mancante; i file che ci stanno partono comunque.
3. Coda: **un file per richiesta**, due in parallelo. Ogni riga ha nome, dimensione, barra di avanzamento, annulla.
4. Esiti per riga: caricato (con link al dettaglio), già presente (409 senza corpo), spazio esaurito (`QUOTA_EXCEEDED`), errore (con "Riprova").
5. La coda sopravvive al cambio di pagina dentro l'app: un indicatore nella barra di navigazione mostra quanti file mancano. Chiudere la scheda del browser con upload in corso chiede conferma.
6. A coda finita: toast con il totale e l'azione **Crea Link con questi contenuti** (→ flusso 5 con i contenuti già scelti).

### Da URL, video incorporato, bookmark

1. Un campo URL (per il video incorporato anche il titolo) e l'azione primaria.
2. La chiamata è sincrona: il pulsante resta in attesa fino alla risposta. "Da URL" scarica un file e può durare: il testo lo dice.
3. Esito: toast con link al contenuto, oppure errore accanto al campo. Bookmark già presente: "È già nel Catalog".

## 4. Catalog e dettaglio del contenuto

### Catalog — `/app/catalog/:section?`

1. Sezione predefinita `audio`. Il cambio di sezione cambia l'URL; ricerca e ordinamento stanno nella query (`?q=`, `?sort=`), così la vista si può ricaricare e condividere.
2. `POST items/load` con pagine da 50; scorrimento infinito, lista virtualizzata. La ricerca parte 300 ms dopo l'ultimo tasto.
3. Filtri a chip **Senza Link** e **Frozen**, calcolati sull'elenco caricato (D14).
4. Sulla card: Play, Freeze, menu (apri, crea Link, cancella). Il clic sulla card apre il dettaglio.
5. Selezione multipla: tocco prolungato su mobile, casella al passaggio del mouse su desktop. Compare la barra flottante con **Crea Link** (primaria), Play, Freeze, Cancella.

### Dettaglio — `/app/items/:itemId`

1. `GET items/:itemid`. Contenuto inesistente o di un altro utente: pagina "Contenuto non trovato" con ritorno al Catalog.
2. In alto: miniatura, formato, titolo modificabile, Freeze, **Play** (primaria, `POST items/playlist`).
3. Viewer secondo il tipo: waveform per l'audio, immagine, video, PDF, anteprima del bookmark.
4. Impostazioni del contenuto ("Livello 4 · base"): volume, audiocrop sulla waveform, preset EQ quando disponibile (D7); per le immagini rotazione e ritaglio. Salvataggio automatico alla fine di ogni modifica, con indicatore "Salvato".
5. "Vive in N Epikey": gli Epikey collegati (`GET maps/key/:itemid/linked`), ognuno porta alla sua pagina con il Link aperto. "+ Nuovo Link" → flusso 5.
6. Menu: scarica, cancella (con il numero di Link che si perdono).

## 5. Creare Link

Rotta: `/app/links/new`, con `?items=<id,…>` e/o `?key=<id>` secondo il punto di partenza. È una pagina a passi e non una modale, perché non è un'azione breve.

Punti di ingresso: selezione nel Catalog, dettaglio del contenuto, "+ Collega" nella pagina dell'Epikey, fine di un upload.

1. **Contenuti.** Già scelti se si arriva dal Catalog; altrimenti ricerca e scelta dal Catalog.
2. **Epikey.** Albero con ricerca; scelta multipla. Già scelto se si arriva da un Epikey. "Nuovo Epikey" crea senza uscire dal flusso.
3. **Riepilogo.** Matrice contenuti × Epikey: le coppie già esistenti sono segnate e non contano. Il pulsante dice quanti Link nuovi nascono ("Crea 6 Link").
4. `POST links/savemany` con tutte le coppie nuove.
5. Esito: tutti creati → ritorno al punto di partenza con un toast; successo parziale (207) → elenco dei Link non creati con "Riprova".

Le impostazioni del Link non fanno parte della creazione: si regolano dopo, dal drawer del Link. Un Link nasce con i valori del contenuto.

## 6. Epikey

### Indice — `/app/keys`

1. `GET maps/load`, poi `GET maps/key/:id/loadrecursive` per la Map aperta. L'ultima Map aperta si ricorda sul dispositivo.
2. Albero con colore, nome e numero di Link per ogni Epikey. Le Map sono le radici; il cambio di Map è in testa all'albero.
3. Azione primaria: **Nuovo Epikey** (dialogo: nome, colore dalla palette, padre). Secondaria: Nuova Map (vuota o da template).
4. Sulla riga: Play, menu (rinomina, sposta in…, cancella). Riordino tra fratelli per trascinamento (`POST maps/key/setorder`).

### Pagina dell'Epikey — `/app/keys/:keyId`

1. `GET maps/key/:keyid/load` e `GET links/:keyid/Audio`; le altre sezioni dei Link si caricano quando si aprono.
2. Intestazione del colore dell'Epikey: percorso (Map › padre), nome modificabile, numero di Link, "+ Collega" (→ flusso 5), **Play** (primaria, `POST maps/key/playlist`).
3. Lista dei Link: Play, Frequence, Freeze e Play first direttamente nella riga; filtro di testo sulla lista caricata.
4. Il clic su una riga apre il **drawer del Link** (`?link=<id>`): nome, note, volume, audiocrop, ritaglio per le immagini, "Duplica in un altro Epikey", cancella. Ogni valore dice se è del Link o ereditato.
5. A lato: Playlist Engine (modalità e opzioni) e Impostazioni dell'Epikey (volume, preset EQ, colore). Se un valore arriva dal padre, lo si vede.
6. Sotto la lista: gli Epikey figli, con "Nuovo Epikey qui".
7. Cancellare l'Epikey chiede conferma con il numero di Epikey figli e di Link coinvolti, poi porta al padre.

## 7. Riproduzione

### Avvio

Il Play è lo stesso gesto ovunque; cambia la chiamata che genera la playlist.

| Da dove                           | Chiamata                 |
| --------------------------------- | ------------------------ |
| Contenuto o selezione nel Catalog | `POST items/playlist`    |
| Link o selezione di Link          | `POST links/playlist`    |
| Epikey o Map                      | `POST maps/key/playlist` |

1. Il Play mostra subito lo stato "in preparazione" sul pulsante premuto.
2. Arriva la playlist: il player prende la prima traccia audio e avvia lo streaming. L'avvio dell'audio deve partire dal gesto dell'utente, altrimenti i browser mobili lo bloccano.
3. Una nuova playlist sostituisce quella in corso senza chiedere conferma: l'utente ha un'unica playlist anche nel backend.
4. Playlist vuota (Epikey senza Link audio, tutto Frozen): toast che lo spiega, il player resta com'era.

### Player

1. Barra persistente nel layout `app`: copertina, titolo, Epikey di provenienza, play/pausa, successivo, avanzamento. Su mobile sta sopra la tab bar.
2. Il clic sulla barra apre `/app/player`: player esteso e coda. Indietro lo richiude senza fermare l'audio.
3. Spostamento nella traccia: al rilascio del cursore il player chiede un nuovo flusso da quella posizione; durante il trascinamento cambia solo il tempo mostrato.
4. Fine traccia: si passa alla successiva e si segna il Link come ascoltato. Fine playlist: con la ripetizione attiva si rigenera la playlist dalla stessa origine, altrimenti il player si ferma.
5. La posizione si salva ogni 10 secondi e alla pausa (`POST streaming/position`).
6. Schermo bloccato e cuffie: titolo, copertina e comandi tramite Media Session.
7. "Perché suona così?": volume, EQ e audiocrop attivi, ognuno con il livello da cui arriva.
8. Errore di streaming: un tentativo automatico sulla stessa traccia, poi si passa alla successiva con un toast. Tre errori di fila fermano il player.

Al ricaricamento della pagina il player riparte vuoto: la playlist salvata non si può rileggere (A22).

## 8. Ricerca e account

- **Ricerca** — `/app/search?q=`: campo nella barra di navigazione. Risultati raggruppati in Epikey (`POST maps/key/search`) e nelle 4 sezioni del Catalog (`POST items/load`, 5 risultati per sezione con "Vedi tutti" verso il Catalog già filtrato).
- **Account** — `/app/account`: nome e nickname, lingua, piano e spazio usato in sola lettura, link al supporto, uscita. Il cambio password rimanda al flusso della password dimenticata.

## Da decidere quando si sviluppa

| Punto                                                                              | Quando                                |
| ---------------------------------------------------------------------------------- | ------------------------------------- |
| Chain Link: come si creano e si mostrano le sequenze nella lista dei Link          | 2.8, dopo aver letto `shared/engine/` |
| Opzioni del Playlist Engine: nomi e raggruppamento                                 | 2.8                                   |
| Semantica di `:position` nello streaming e comportamento su iOS a schermo bloccato | 1.11                                  |
| Testo sul copyright nella pagina di aggiunta                                       | 2.3, con chi segue la parte legale    |
