# Mappa degli endpoint

Endpoint del backend Node usati dall'MVP della 2.0, con payload, risposta e chiamata legacy corrispondente.

- **Fonte**: codice di `../epicentric-be/epicentric-node-backend/src/routes/api/**` e `../epicentric-fe/src/api/*.js`, letti il 9 ott 2026.
- **Verifica dal vivo** (9 ott 2026, backend locale, account di prova, solo chiamate che non modificano dati): confermati envelope, status HTTP (200 sui `KO`, 400 su `links/savemany`, 401 senza token, 403 con l'id di un altro utente), `items/load`, `GET items/:itemid`, `links/save`, `maps/key/…/loadchildren`, `maps/key/search`, `application/storage`, `application/languages`, `users/current/playlist`, e il 404 delle rotte legacy assenti. Il resto è ricavato dal codice: le forme vanno confermate quando si scrive il modulo `services/api` corrispondente (regola di lavoro 1).
- `documents/routes_usage/epicentric_node_be_routes.md` è in parte superato: dove differisce dal codice vale questo documento (vedi "Differenze dalla guida del backend").
- I problemi del backend citati qui sono descritti in `richieste-be.md` con la sigla indicata.

## Convenzioni

| Tema                   | Regola                                                                                                                                                                                                                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base                   | `NUXT_PUBLIC_API_BASE`, in locale `http://127.0.0.1:21001/api/`                                                                                                                                                                                                                                                                 |
| Envelope               | `{ Success, Result: "OK"\|"KO", ResultText, Data }`. Nei `KO` manca `Data` e `ResultText` contiene l'errore                                                                                                                                                                                                                     |
| Status HTTP            | Gli errori applicativi escono quasi sempre con **HTTP 200**. Eccezioni: 401 (token), 403 (`KO_ACCESS_DENIED`, id utente nel percorso diverso dal token), 400/403 su `items/save`, `items/savemany`, `links/savemany`, `links/paste`, `links/freeze`, 404 su miniatura mancante, 409 su upload fallito, 207 su successo parziale |
| Codici d'errore        | Solo l'area utenti usa codici stabili (`KO_…`). Item, Link ed Epikey rispondono con **frasi libere in inglese o italiano** (es. `"Key does not exist or is not owned by user."`): non sono mappabili su chiavi i18n. Il client mostra un messaggio generico per dominio (A12)                                                   |
| Autenticazione         | `Authorization: Bearer <token>`; in alternativa `?token=` e, per ultimo, cookie `auth`. Token mancante, non valido o revocato → 401 `KO_INVALID_OR_MISSING_TOKEN`; scaduto → 401 `KO_JWT_TOKEN_EXPIRED`                                                                                                                         |
| Media nativi           | `<audio>`, `<img>`, `<video>` e download non inviano header: l'URL porta `?token=<jwt>`. Tutte le rotte di file e miniature richiedono il token                                                                                                                                                                                 |
| Id utente nel percorso | Molte rotte di file hanno `:userid` nel percorso e rispondono 403 se non coincide con l'utente del token. L'id si prende da `useSession()`                                                                                                                                                                                      |
| Nomi dei campi         | PascalCase, con eccezioni: `streaming/position` (`position`, `index`, `type`), `links/savemany` in aggiornamento (`id` minuscolo), `links/deletemany` (`userId`)                                                                                                                                                                |
| Tipi di media          | `MediaType`: `Audio` 0, `Video` 1, `File` 2, `Bookmark` 3. `MediaSubType` (per `Video`): `Image` 0, `Video` 1, `Embed` 2. Nelle richieste il tipo è la stringa, nei dati il numero                                                                                                                                              |
| Sezioni del Catalog    | Audio → `Audio`; Visual → `Video` (immagini, MP4, embed); Other files → `File`; Bookmarks → `Bookmark`                                                                                                                                                                                                                          |
| Cancellazione          | Sempre logica (`deleted_at`). Il backend filtra in memoria                                                                                                                                                                                                                                                                      |

## Accesso e sessione

Già implementati nella 2.0 (`services/api/users.js`). Dettagli in `CLAUDE.md`, "Fatti verificati sul backend".

| Endpoint                           | Payload                                                              | Risposta (`Data`)                                               | Errori                                                                                | Legacy (`api/user.js`)                                                                     | Stato 2.0 |
| ---------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------- |
| `POST users/login`                 | `{ Email, Password }`                                                | `{ Auth, User, InstanceState, License, Operations, Processes }` | `KO_INVALID_LOGIN`, `KO_PASSWORD_INVALID`, `KO_LOCKED`, `KO_NOT_FOUND_DELETE_PENDING` | `setLogin`                                                                                 | Fatto     |
| `POST users/logout`                | —                                                                    | `"OK_LOGOUT_SUCCESS"`                                           | —                                                                                     | `logOutUser`                                                                               | Fatto     |
| `POST users/signup`                | `{ Email, Password, Language, Birthday, Campaign, SharedSpaceCode }` | `"OK_USER_CREATED"`                                             | `KO_NO_DATA`, `KO_INVALID_EMAIL`, `KO_EMAIL_ALREADY_USED`                             | `setSignUp`                                                                                | Fatto     |
| `GET users/email/confirm/:code`    | —                                                                    | `{ confirmed: true }`                                           | `KO_NOT_FOUND`                                                                        | `setVerifyCode` (la legacy usa `POST` con `{ ReferenceCode }`, che il backend Node non ha) | Fatto     |
| `POST users/password/recover`      | `{ Email }`                                                          | `"OK"`                                                          | `KO_MISSING_PSW`, `KO_USER_NOT_FOUND`                                                 | `setRecoverPwd`                                                                            | Fatto     |
| `POST users/password/reset/:token` | `{ NewPassword }`                                                    | `"OK"`, oppure successo con `"KO_INVALID_TOKEN"`                | `KO_PSW_MUST_BE_DIFFERENT`, `KO_FAILED_CHANGE_PSW`                                    | `setResetPwd`                                                                              | Fatto     |
| `GET users/current/details`        | —                                                                    | record utente completo                                          | `KO_USER_NOT_FOUND`                                                                   | `getUserDetails`                                                                           | Fatto     |

## Catalog e contenuti (2.1, 2.2, 2.9)

### `POST items/load` — lista di una sezione

Legacy: `getAllMusic`, `getAllPictures`, `getAllFiles`, `getAllBookmarks` (`api/items.js`), tutte sulla stessa rotta con `Type` diverso.

```json
{ "Type": "Audio", "Search": "*", "Order": "ItemName asc", "Group": "", "Page": 0, "PageSize": 50 }
```

- `Type` obbligatorio (`Audio`, `Video`, `File`, `Bookmark`); altro valore → `KO` con `"INVALID MEDIATYPE"`.
- `Search`: `"*"` = nessun filtro. Più parole sono in **OR**, cercate in `ItemName`, `FileName`, `Collection`, `Artist`, senza distinzione di maiuscole.
- `Order`: campi separati da virgola, suffisso ` desc`; `"*"` = nessun ordine. `Group`: campo di raggruppamento, vuoto = un solo gruppo.
- `Page` parte da 0. La legacy chiede `PageSize: 1000`.

Risposta:

```json
{
  "Items": [{ "Name": "All", "IsLeaf": true, "Order": 1, "Items": [{ "Id": "…", "ItemName": "…" }] }],
  "Tags": [],
  "Count": 123,
  "More": true
}
```

`Items` è sempre un elenco di **gruppi**; gli item sono in `Items[n].Items`. Con una sezione vuota `Items` è `[]`: i gruppi senza item vengono tolti. `Count` è il totale dopo ricerca, `More` indica altre pagine.

Campi di ogni item: `Id`, `UserId`, `MediaType`, `MediaSubType`, `ItemName`, `FileName`, `FileExtension`, `Title`, `Collection`, `Artist`, `Duration`, `Gain`, `Start`, `End`, `FadeIn`, `FadeInChanged`, `FadeOut`, `FadeOutChanged`, `EqualizerId`, `Year`, `Size`, `CoverImage`, `CoverImagePersonalized`, `OnDefaultCatalog`, `Notes`, `Mbid`, `Number`, `Type`, `LinksCount`, `IsFreezed`, `ImportDate`, `Source`, `LastListen`, `ListenCount`, `Listened`, `Tags`, `LastUpdate`, `Created`, `ThumbnailProcessingState`, `Signature`, `Parsed`, `IsTemplate`, `Genres`, `SourceMediaItemId`, `Effects`.

Limiti da conoscere:

- Non esiste una lista "Tutto": la tab **Tutto** del canvas richiede 4 chiamate, oppure una richiesta al backend (A13).
- Nessun filtro lato server per **Senza Link**, **Frozen** o **per Epikey**: i primi due si ricavano da `LinksCount` e `IsFreezed` solo sulle pagine già caricate; il terzo non è ricavabile (A13).
- Il backend carica in memoria tutti gli item del tipo a ogni pagina (A14): servono debounce sulla ricerca e cache nel composable.

### Altri endpoint

| Endpoint                                                   | Payload                       | Risposta (`Data`)                                | Errori                                                                             | Legacy                          | Note                                                                                                                                           |
| ---------------------------------------------------------- | ----------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET items/:itemid`                                        | —                             | item (stessi campi della lista)                  | `KO_NOT_FOUND`                                                                     | `itemById`                      | Per `/app/items/:itemId`                                                                                                                       |
| `POST items/save`                                          | `{ Item: { Id, …campi } }`    | `[item]` (array di un elemento)                  | 400 senza `Item.Id`, item inesistente o campi non validi; 403 se non è dell'utente | `saveItem`                      | La legacy invia anche `PropagateCoverImage`, che il backend ignora. Cambiare `Notes` aggiorna le note dei Link che non le hanno personalizzate |
| `POST items/savemany`                                      | array diretto `[ { Id, … } ]` | `[item…]`                                        | 400 se anche un solo item fallisce: nessun successo parziale                       | `saveMultipleItems`             | Usato per il Freeze multiplo dei contenuti (`IsFreezed`)                                                                                       |
| `DELETE items/delete/:userId/:itemId`                      | —                             | `{ Result: "OK", details: [{ type, success }] }` | `"Media item not found"`, 403                                                      | `deleteItem`                    | Cancella anche i Link del contenuto                                                                                                            |
| `DELETE items/deletemany/:userId`                          | `{ Items: [id…] }`            | `{ Result: "OK" }`                               | 403                                                                                | `deleteManyItems`               | Body in una `DELETE`: con `$fetch` va passato esplicitamente                                                                                   |
| `POST items/:itemid/listened`                              | —                             | item aggiornato                                  | `KO_NOT_FOUND`                                                                     | `setListenItem`                 | Segna il contenuto come ascoltato                                                                                                              |
| `GET items/soundwave/:itemid?samples=200`                  | —                             | array di interi 0–100                            | `KO_NOT_FOUND`, `KO_NO_DATA`                                                       | `waveDetection`                 | `samples` tra 16 e 1000. Alla prima richiesta la waveform viene generata: può essere lenta                                                     |
| `GET maps/key/:itemid/linked`                              | —                             | `[key…]`                                         | —                                                                                  | `getLinkedKeys` (`api/keys.js`) | "Vive in N Epikey". Restituisce gli Epikey, **non i Link**: per regole e Play del Link serve altro (A15)                                       |
| `GET items/crop/:userid/:itemid/:x1/:x2/:y1/:y2?withCopy=` | —                             | `{ item }`                                       | frasi libere, 403                                                                  | `cropItem`                      | Non distruttivo, salvato in `Effects`. `withCopy=true` crea una copia. È una `GET` che modifica dati (A16)                                     |
| `GET items/rotate/:userid/:itemid/:rotation?withCopy=`     | —                             | `{ item }`                                       | idem                                                                               | `rotateItem`                    | `rotation`: 0, 90, 180, 270                                                                                                                    |

### File e miniature (URL per elementi nativi, con `?token=`)

| Endpoint                                                  | Contenuto                                        | Legacy (`store/modules/user/index.js`) |
| --------------------------------------------------------- | ------------------------------------------------ | -------------------------------------- |
| `GET items/thumb/:userid/:itemid?variant=`                | JPEG; 404 con `KO_THUMBNAIL_NOT_FOUND` se manca  | `thumbSrcBaseUrl`                      |
| `GET items/src/:userid/:itemid?variant=`                  | immagine in linea                                | `imageSrcBaseUrl`                      |
| `GET items/src/:userid/:itemid/:width/:height?variant=`   | immagine ridimensionata                          | idem                                   |
| `GET items/srcdata/:userid/:itemid`                       | immagine, oppure MP4 con richieste `Range` (206) | `streamSrcBaseUrl`                     |
| `GET items/download/:userid/:itemid?variant=`             | file come allegato                               | `downloadSrcBaseUrl`                   |
| `GET links/thumb/:userid/:linkid?variant=`                | miniatura con gli `Effects` del Link             | `linkThumbSrcBaseUrl`                  |
| `GET links/src/:userid/:linkid[/:width/:height]?variant=` | immagine con gli `Effects` del Link              | —                                      |

`variant`: `current` (predefinito, applica crop e rotazione) oppure `original`.

Con `@nuxt/image`: le miniature hanno dimensione fissa e l'URL porta il token, quindi vanno servite così come sono, senza passare da un provider di ottimizzazione che metterebbe il token in cache.

## Acquisizione (2.3)

| Endpoint                  | Payload                                                                                         | Risposta                                                                                            | Errori                                                                                                                                                                                                                                                                  | Legacy                                                                             | Note                                                                                                                                                                                                                                                  |
| ------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST items/upload`       | `multipart/form-data`, campo **`fileUpload`**, massimo **4 file per richiesta**, 5 GiB per file | **Array JSON grezzo, senza envelope**: `[ { mediaItem } ]`, un elemento per file                    | Senza file: `KO_MISSING_File`. Errore di pubblicazione: **409** con il messaggio come stringa JSON (quota: `"QUOTA_EXCEEDED"`). File già presente (stessa firma): **409 con corpo vuoto**, perché il backend lancia un oggetto con `Message` e ne legge `message` (A17) | Dropzone in `ec-items-upload.vue`, `ec-items-uploader.vue` (`url: 'items/upload'`) | Il client API deve accettare una risposta senza envelope (A17). Se uno dei file fallisce, fallisce l'intera richiesta: per avere progresso e retry per file la coda invia **un file per richiesta**. Il backend legge il file intero in memoria (A18) |
| `POST items/addfromurl`   | `{ Item: url, Embed: false, Title? }`                                                           | esito della pubblicazione                                                                           | frase libera                                                                                                                                                                                                                                                            | `uploadEmbed` con `isEmbedVideo` falso                                             | "Da URL": il backend scarica **in modo sincrono un file diretto** (`fetch(url)`). Non è un download da piattaforme video. Senza `https` il prefisso viene aggiunto                                                                                    |
| `POST items/addfromurl`   | `{ Item: url, Embed: true, Title }`                                                             | `{ Date, Type: "Ok", ItemId }`                                                                      | frase libera                                                                                                                                                                                                                                                            | `uploadEmbed` con `isEmbedVideo` vero                                              | Crea un item `Video`/`Embed`; l'URL non viene analizzato                                                                                                                                                                                              |
| `POST items/addbookmark`  | `{ Item: url, Title? }`                                                                         | **Senza envelope**: `{ date, type: "Ok", itemId }`                                                  | `KO_DUPLICATED`, `"Fail creating bookmark"`                                                                                                                                                                                                                             | `uploadBookmark`                                                                   | Titolo e note ricavati dai meta tag della pagina                                                                                                                                                                                                      |
| `GET application/storage` | —                                                                                               | `{ Size: { Value, UserValue }, Used: { Value, UserValue }, Details: [{ Type, Value, UserValue }] }` | frasi libere                                                                                                                                                                                                                                                            | `getStorageState`                                                                  | Spazio del piano e spazio usato. Il calcolo dello spazio usato è da verificare (A19)                                                                                                                                                                  |

## Task asincroni (2.4)

Il backend Node non espone task asincroni legati ai contenuti:

- upload, "Da URL", embed e bookmark sono **sincroni**: la risposta arriva a lavoro finito;
- il task manager Go gestisce solo `COMPLETE_USER_SIGNUP`, `APPLY_FREE_PLAN` e la pulizia periodica;
- la rotta legacy `items/queue/download` (coda di download) non esiste nel backend Node;
- la legacy interroga `state/current` ogni 150 secondi per le notifiche: la rotta non esiste nel backend Node.

L'unico stato che cambia dopo la risposta è `ThumbnailProcessingState` degli item. `GET application/state` restituisce `{ Processes, Operations }` (`ApplicationProcess`: `Type`, `Target`, `State`, `Count`, `Max`), ma nessuna rotta dell'MVP li crea.

Conseguenza: la voce 2.4 va ridotta alle notifiche in app (toast) e, se serve, al ricaricamento delle miniature in elaborazione. Vedi l'inventario, "Decisioni da prendere".

## Epikey e Map (2.5)

| Endpoint                              | Payload                                 | Risposta (`Data`)                              | Errori                                                                | Legacy (`api/keys.js`, `api/maps.js`)                                                     | Note                                                                                                                                                                                                                                                                                 |
| ------------------------------------- | --------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET maps/load`                       | —                                       | `[key…]` con `IsRoot: true`                    | —                                                                     | `getMaps`                                                                                 | Le Map sono Epikey radice. Se l'utente non ne ha, il backend **crea** "My first map"                                                                                                                                                                                                 |
| `GET maps/key/:keyid/loadrecursive`   | —                                       | Epikey con tutto il sottoalbero                | `"Access denied"`, `"No keys available for this user"`                | `getKeysByMap`                                                                            | Se l'id non è accessibile restituisce la prima Map dell'utente. Base per la lista gerarchica                                                                                                                                                                                         |
| `GET maps/key/:keyid/load`            | —                                       | Epikey                                         | frase libera                                                          | `getEpikeyById`                                                                           | Per `/app/keys/:keyId`                                                                                                                                                                                                                                                               |
| `GET maps/key/:parentid/loadchildren` | —                                       | `[key…]` ordinati per `Order`                  | frase libera                                                          | `getKeysChildrenById`, che chiama **`loadchilds`**: percorso inesistente nel backend Node | Usare `loadchildren`                                                                                                                                                                                                                                                                 |
| `GET maps/key/:itemid/root`           | —                                       | Epikey radice                                  | frasi libere                                                          | `getRootFromEpikey`                                                                       | Per il breadcrumb Map › Epikey. Il parametro è l'id di un Epikey                                                                                                                                                                                                                     |
| `POST maps/key/save`                  | oggetto `Key` diretto                   | Epikey salvato                                 | `"Key has not parent id and is not a root."`, `"Key does not exist."` | `saveKey`, `createMap`                                                                    | Senza `Id` crea (serve `ParentId` oppure `IsRoot`), con `Id` aggiorna. Il salvataggio propaga ai discendenti `Gain`, `Opacity`, `Color`, `LineColor`, `EqualizerId` e lo sfondo, dove il figlio non li ha personalizzati. In aggiornamento manca il controllo del proprietario (S10) |
| `DELETE maps/key/:keyid/delete`       | —                                       | Epikey cancellato                              | frasi libere                                                          | `deleteKeys`, `deleteMap`                                                                 | Ricorsivo: discendenti e loro Link                                                                                                                                                                                                                                                   |
| `POST maps/key/move`                  | `{ Item: { SourceId, DestinationId } }` | `{ Result: true }`                             | frasi libere                                                          | `moveKey`                                                                                 | Rifiuta lo spostamento su sé stesso o su un discendente                                                                                                                                                                                                                              |
| `POST maps/key/setorder`              | `{ Items: [keyId…] }`                   | `{ Result: true, UpdatedCount }`               | frase libera                                                          | `orderEpikey`                                                                             | Ordine = posizione nell'array                                                                                                                                                                                                                                                        |
| `POST maps/key/copy`                  | `{ Item: keyId }`                       | `{ Result: true }`                             | frasi libere                                                          | `copyEpikey`                                                                              | Copia in un buffer in memoria del backend                                                                                                                                                                                                                                            |
| `POST maps/key/paste`                 | `{ Item: parentKeyId }`                 | nuovo Epikey                                   | `"Copy not initialized."` e altre                                     | `pasteEpikey`                                                                             | Il buffer si perde al riavvio del backend                                                                                                                                                                                                                                            |
| `POST maps/key/search`                | `{ Item: testo }`                       | `[key + RootKey]`                              | `"Search text is required"`                                           | `searchKeys`                                                                              | Parole in OR sul solo `Text`                                                                                                                                                                                                                                                         |
| `POST maps/key/:keyid/select`         | —                                       | stringa                                        | frase libera                                                          | `selectKeys`                                                                              | Segna l'Epikey selezionato lato server. Nella 2.0 la selezione è l'URL: non serve                                                                                                                                                                                                    |
| `GET maps/templates`                  | —                                       | `[MapTemplateData…]` per la lingua dell'utente | `KO_USER_NOT_FOUND`                                                   | `getTemplates`                                                                            | Template di Map                                                                                                                                                                                                                                                                      |
| `POST maps/templates/import`          | `{ Item: { Id }, ImportMedia: true }`   | nuova Map                                      | frasi libere                                                          | `importTemplateMap`                                                                       |                                                                                                                                                                                                                                                                                      |
| `POST maps/key/template/add`          | `{ ParentId, Item: templateKeyId }`     | nuovo Epikey                                   | frasi libere                                                          | `addKeyTemplate`                                                                          | Aggiunge un template sotto un Epikey                                                                                                                                                                                                                                                 |

Campi dell'Epikey usati dall'MVP: `Id`, `Text`, `Description`, `Notes`, `ParentId`, `IsRoot`, `Order`, `Color`, `LinksCount`, `Gain`, `GainChanged`, `EqualizerId`, `PlayFirstId`, e le opzioni del Playlist Engine (sotto). `Color` è una stringa libera: la corrispondenza con i 10 colori di `utils/epikeyPalette.js` va definita (vedi inventario).

## Link (2.6)

| Endpoint                                         | Payload                                                         | Risposta (`Data`)           | Errori                                                                                               | Legacy (`api/links.js`)                                                                       | Note                                                                                                                                                                                                                                                 |
| ------------------------------------------------ | --------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET links/:keyid/:type`                         | —                                                               | `[link + Item]`             | `"Error loading link for key"`                                                                       | `getMusicLinksByKey`, `getPicturesLinksByKey`, `getFilesLinksByKey`, `getBookmarksLinksByKey` | `type`: `Audio`, `Video`, `File`, `Bookmark`. Una chiamata per tipo; la lista non è paginata e fa una query per Link                                                                                                                                 |
| `POST links/savemany`                            | `{ Items: [ { ParentId, MediaItemId, …campi } ] }`              | `[link + Item]`             | 400 se falliscono tutti; **207** con `Result: "PARTIAL_SUCCESS"` e `Errors` se ne fallisce una parte | `addLinks`                                                                                    | Creazione dei Link (matrice contenuti × Epikey). Per aggiornare, l'id va in **`id` minuscolo**                                                                                                                                                       |
| `POST links/save`                                | Link diretto, con `ParentId` e `MediaItemId` sempre obbligatori | `{ …link, Items: [link] }`  | frasi libere                                                                                         | `saveLinks`                                                                                   | Con `Id` aggiorna. Sullo stesso percorso è montato anche un gestore vuoto che non risponde (A20). In locale risponde quello vero, ma l'ordine dipende dal file system del server: finché non è chiarito, la 2.0 aggiorna i Link con `links/savemany` |
| `DELETE links/deletemany`                        | `{ userId, Items: [linkId…] }`                                  | `{ Result: "OK" }`          | frase libera                                                                                         | `deleteLinks`, che invia solo `Items`                                                         | Il backend usa `userId` del corpo senza confrontarlo con il token (S9). La 2.0 invia sempre l'id della sessione                                                                                                                                      |
| `POST links/freeze` · `POST links/unfreeze`      | `{ Items: [linkId…] }`                                          | `{ Result: "OK", Updated }` | 400                                                                                                  | `setFreezeLinks`, `setUnFreezeLinks`                                                          |                                                                                                                                                                                                                                                      |
| `POST links/copy`                                | `{ Items: [linkId…] }`                                          | `{ Result: true }`          | frasi libere                                                                                         | `copyLinks`                                                                                   | Buffer in memoria; non serve a `paste`, che riceve gli id                                                                                                                                                                                            |
| `POST links/paste`                               | `{ EpikeyId, Links: [linkId…] }`                                | `[nuovi link]`              | 400, 207                                                                                             | `pasteLinks`                                                                                  | Duplica i Link in un altro Epikey con le loro impostazioni                                                                                                                                                                                           |
| `POST links/:id/listened`                        | —                                                               | Link aggiornato             | frasi libere                                                                                         | `setListenLink`                                                                               |                                                                                                                                                                                                                                                      |
| `GET links/crop/:userid/:linkid/:x1/:x2/:y1/:y2` | —                                                               | `{ Effects }`               | frasi libere                                                                                         | `cropLink`                                                                                    | Senza `withCopy`                                                                                                                                                                                                                                     |
| `GET links/rotate/:userid/:linkid/:rotation`     | —                                                               | `{ Effects }`               | frasi libere                                                                                         | `rotateLink`                                                                                  |                                                                                                                                                                                                                                                      |

Campi del Link: `Id`, `ParentId` (Epikey), `MediaItemId`, `Name`, `NameChanged`, `Description`, `Notes`, `NotesChanged`, `Start`, `End`, `FadeIn`, `FadeInChanged`, `FadeOut`, `FadeOutChanged`, `Gain`, `GainChanged`, `PlaybackFrequence`, `AutoPlaybackFrequence`, `PlaybackFrequenceCounter`, `IsFreezed`, `LinkAfterId`, `Number`, `RandomOrder`, `PlayTimeOrder`, `PlaybackCounter`, `Listened`, `LastListen`, `Effects`, `Item`. Il Link **non ha `EqualizerId`** nello schema: il "Link Equalizer" del canvas non ha un campo dove essere salvato (A21).

Manca una rotta per leggere **un singolo Link** (`getLinkById` della legacy chiama `GET links/:id`, che non esiste): un Link si ottiene solo dalla lista del suo Epikey (A15).

## Playlist e riproduzione (2.7)

### Creazione della playlist

Ogni utente ha **una sola** playlist, con `Id` uguale al suo id: ogni chiamata la sovrascrive.

| Endpoint                     | Payload                | Legacy                            | Uso                                                                                             |
| ---------------------------- | ---------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------- |
| `POST maps/key/playlist`     | `{ Item: keyId }`      | `createPlaylist` (`api/keys.js`)  | Play di un Epikey o di una Map                                                                  |
| `POST links/playlist`        | `{ Items: [linkId…] }` | `createPlaylist` (`api/links.js`) | Play di uno o più Link                                                                          |
| `POST items/playlist`        | `{ Items: [itemId…] }` | `createPlaylist` (`api/items.js`) | Play dal Catalog                                                                                |
| `GET users/current/playlist` | —                      | `getSavedPlaylist`                | Risponde solo `"OK"` oppure `"KO_USER_PLAYLIST_MISSING"`: **non restituisce la playlist** (A22) |

Risposta delle tre `POST`: la playlist, con `AudioTracks`, `VideoTracks`, `BookmarksTracks`, `FilesTracks` e le posizioni. Ogni traccia audio:

```json
{
  "Id": "k3x9a",
  "Seed": 0,
  "Position": 0,
  "PlayIndex": 0,
  "SkipTo": 42,
  "PlayDuration": 76,
  "Gain": 100,
  "FadeIn": 0,
  "FadeOut": 0,
  "FadeOutStart": 0,
  "Item": {
    "Id": "…",
    "ItemName": "…",
    "Title": "…",
    "Artist": "…",
    "Collection": "…",
    "CoverImage": "…",
    "Duration": 213,
    "Gain": 100,
    "Start": 0,
    "End": 0,
    "EqualizerId": null,
    "Effects": null
  },
  "Link": { "Id": "…", "Name": "…", "Description": "…", "Start": 42, "End": 118, "Effects": null },
  "Key": {
    "Id": "…",
    "Text": "Joy",
    "Gain": 100,
    "EqualizerId": "rock",
    "MaxPlaybackLength": 0,
    "ExhaustLinks": false,
    "ManualSkipPlaylist": false,
    "TimedSkipPlaylist": false,
    "TimedEpikeyPlaylist": false,
    "OrderedChildsPlayback": false
  }
}
```

`maps/key/playlist` non controlla che l'Epikey sia dell'utente (S11). `maps/key/playlist/path` (con `/next`, `/prev`) serve alla modalità Playlist Path, fuori dall'MVP; la legacy invia le opzioni al primo livello del corpo, il backend le legge in `Options`.

### Streaming audio

`GET streaming/:userId/audio/:position/:trackId?token=` — legacy: `store/modules/playback/mutations.js`.

- Restituisce **una traccia** della playlist salvata, transcodificata in MP3 al bitrate del piano (128 kbps di base), come flusso continuo `audio/mpeg`.
- **Niente `Range`**: non si può cercare dentro il flusso. Per spostarsi si assegna all'elemento `<audio>` un nuovo URL con un'altra `:position`. Con `0` il flusso parte dall'inizio della finestra (`SkipTo`); un valore maggiore di 0 viene passato a ffmpeg come punto di partenza. Se quel valore sia relativo al file o alla finestra va misurato dal vivo nel prototipo del player (1.11): la legacy usa entrambe le forme.
- L'audiocrop è **applicato dal server**: il flusso parte da `SkipTo` e si ferma a `End`. `currentTime` dell'elemento parte da 0 e la durata non è nota al browser: per barra e tempi si usa `PlayDuration`.
- `:trackId` è l'`Id` della traccia nella playlist, non l'id del contenuto. La playlist va creata prima dello streaming.
- Volume, EQ e fade **non** sono applicati dal server.

`POST streaming/position` con `{ position, index, type: "audio" | "video" }` → `"ok"`. La legacy invia `{ ParentId, Item: { Position, Index } }`, che il backend Node non legge: oggi il salvataggio della posizione dalla legacy non ha effetto.

### Precedenza dei parametri (punto aperto chiuso)

| Parametro                     | Chi lo risolve                                                   | Regola nel codice                                                                                                                          |
| ----------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Audiocrop                     | **Backend** (`engine/logic/track.js`, applicato dallo streaming) | Link se definisce un taglio, altrimenti contenuto. Risultato in `SkipTo` e `PlayDuration`                                                  |
| Volume                        | **Backend** (`helpers/AudioGain.js`), ma da applicare nel client | `track.Gain` = Link se `GainChanged` → Epikey se `GainChanged` → `Link.Gain` se diverso da 0 → contenuto → 100. Scala 0–150                |
| Epikey figlio su Epikey padre | **Backend, al salvataggio**                                      | Il padre copia `Gain`, `EqualizerId`, colori e sfondo nei figli che non li hanno personalizzati: la traccia vede già il valore del figlio  |
| EQ                            | **Client**                                                       | La traccia porta `Key.EqualizerId` e `Item.EqualizerId`, non un valore risolto. Il Link non ha EQ (A21). La 2.0 applica Epikey → contenuto |
| Fade                          | **Nessuno**                                                      | `FadeIn`, `FadeOut` e `FadeOutStart` della traccia sono sempre 0, e la traccia non porta i fade del Link (A23)                             |

Per applicare l'EQ servono i preset (`Equalizer`: `Id`, `Name`, `Order`, `Values[]`), ma la rotta legacy `maps/key/equalizers` **non esiste** nel backend Node (A24). Nella legacy non ho trovato codice che applichi volume o EQ durante la riproduzione: il player usa il volume solo per le dissolvenze.

## Playlist Engine (2.8)

Nessun endpoint dedicato: le opzioni sono campi dell'Epikey e del Link.

| Funzione                                  | Dove si salva                                                                                                                   | Endpoint                                                                                                                                                                                                                                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intelligent Random (predefinito) / ordine | `Key.SequentialPlayback`, `Key.OrderedChildsPlayback`, `Key.OverrideSequences`, `Key.ExhaustLinks`, `Key.AutoReplay`            | `maps/key/save`                                                                                                                                                                                                                                                                        |
| Play first                                | `Key.PlayFirstId` (id di un Link)                                                                                               | `maps/key/save`                                                                                                                                                                                                                                                                        |
| Frequence ±2                              | `Link.PlaybackFrequence`, `Link.AutoPlaybackFrequence`                                                                          | `links/savemany`                                                                                                                                                                                                                                                                       |
| Freeze contenuto                          | `MediaItem.IsFreezed`                                                                                                           | `items/save`, `items/savemany`                                                                                                                                                                                                                                                         |
| Freeze Link                               | `Link.IsFreezed`                                                                                                                | `links/freeze`, `links/unfreeze`                                                                                                                                                                                                                                                       |
| Chain Link                                | Sequenze dell'Epikey                                                                                                            | `GET maps/key/:keyid/audio/sequences` → `{ Id, Items: [sequenza…] }`; `POST maps/key/audio/sequences` con `{ ParentId, Item: [ { Id, Name, Order, PlaybackFrequence, Links: [{ LinkId, Order }], Ordered, IsFreezed } ] }`. Legacy: `api/sequence.js`. Esiste anche `Link.LinkAfterId` |
| Durata massima e skip a tempo             | `Key.MaxPlaybackLength`, `Key.MaxPlaybackFadeOut`, `Key.TimedEpikeyPlaylist`, `Key.TimedSkipPlaylist`, `Key.ManualSkipPlaylist` | `maps/key/save` (modalità Path: fuori dall'MVP)                                                                                                                                                                                                                                        |

Il significato esatto di ogni opzione e l'"anteprima della prossima playlist" del canvas vanno letti in `shared/engine/` prima di sviluppare la 2.8: non esiste un endpoint di anteprima che non sovrascriva la playlist dell'utente (A25).

## Account e impostazioni

| Endpoint                                   | Payload                       | Risposta (`Data`)          | Legacy            | Note                                                                           |
| ------------------------------------------ | ----------------------------- | -------------------------- | ----------------- | ------------------------------------------------------------------------------ |
| `POST users/current/details/save`          | sottoinsieme dei campi utente | utente aggiornato          | `saveUserDetails` | Il backend accetta qualsiasi campo (S12): la 2.0 invia solo quelli del profilo |
| `POST users/current/details/settings/save` | `{ Settings: {…} }`           | `"OK_USER_SETIINGS_SAVED"` | `saveSettings`    | Preferenze dell'interfaccia, salvate come stringa JSON                         |
| `POST users/current/operations/save`       | `UserOperations` parziale     | operazioni salvate         | `saveOperations`  | Passi di onboarding (`AtLeastOneItem`, `TutorialPosition`…)                    |
| `GET application/languages`                | —                             | `[language…]`              | `getLanguages`    |                                                                                |
| `GET application/countries`                | —                             | `[country…]`               | `getCountries`    | Pubblica                                                                       |
| `DELETE users/delete`                      | `{ Item: { Id } }`            | utente                     | `deleteUser`      | **Non usare** finché S8 non è corretto                                         |

## Ricerca globale (2.10)

Non esiste una ricerca unica. Si compone con `items/load` (una chiamata per sezione, `Search`) e `maps/key/search`. Non c'è ricerca sui Link.

## Endpoint della legacy assenti nel backend Node

In produzione le richieste non gestite vengono inoltrate a un vecchio backend; in locale rispondono 404. Nessuno fa parte dell'MVP, salvo dove indicato.

| Legacy                                                                                           | Funzione                                                | Per la 2.0                                                    |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------- |
| `items/recognize/:id`, `items/lyrics/:id`, `items/coverart`                                      | Riconoscimento del brano, testo, scelta della copertina | Scartate dall'MVP                                             |
| `items/comment`, `items/:id/comments`, `links/comment`, `links/:id/comments`, `maps/key/comment` | Commenti                                                | Fuori MVP                                                     |
| `items/queue/download`                                                                           | Download multiplo in coda                               | Sostituito dal download diretto di un file (`items/download`) |
| `GET links/:id`                                                                                  | Singolo Link                                            | **Serve** (A15)                                               |
| `maps/key/equalizers`                                                                            | Preset EQ                                               | **Serve** (A24)                                               |
| `maps/key/templates`                                                                             | Template di Epikey                                      | Usare `maps/templates`                                        |
| `maps/key/playlist/save`                                                                         | "Scarica playlist"                                      | Scartata                                                      |
| `maps/key/:id/loadchilds`                                                                        | Figli di un Epikey                                      | Usare `loadchildren`                                          |
| `state/current`                                                                                  | Stato e notifiche, interrogato ogni 150 s               | Sostituito da `users/current/details` e `application/state`   |
| `application/feedback`, `application/events/add`                                                 | Supporto tecnico, eventi                                | Da decidere (vedi inventario)                                 |
| `subscriptionplans/load`, `/cardrequired`, `/paymentsession`                                     | Piani e Stripe                                          | Fuori MVP                                                     |
| `notifications/*`, `social/*`, `sharingspaces/*`                                                 | Notifiche, amici, sharing spaces                        | Fuori MVP                                                     |

## Endpoint del backend Node non usati dall'MVP

`maps/key/:keyid/comments` (+ `delete`), `maps/key/video/sequences`, `maps/key/playlist/path` (+ `next`, `prev`), `POST users/current/playlist`, `users/getById/:userId`, `subscriptionplans/key`, `subscriptionplans/change`, `maintenance`, `application/ping`.

## Differenze dalla guida del backend

`documents/routes_usage/epicentric_node_be_routes.md` è stato scritto prima di alcune modifiche. Nel codice attuale:

- tutte le rotte `items/*` di file e miniature, `items/delete` e `items/deletemany` richiedono il token e controllano l'id utente nel percorso (la guida le dà come pubbliche);
- gli errori escono con HTTP 200, non 400/404, salvo le eccezioni elencate sopra;
- i codici d'errore hanno il prefisso `KO_` (`KO_PASSWORD_INVALID`, non `PasswordInvalid`);
- esistono `GET items/:itemid`, `POST items/:itemid/listened`, `GET items/soundwave/:itemid`, `links/thumb`, `links/src`, non documentate;
- le immagini sono `MediaType` `Video` con `MediaSubType` `Image`, non `File`;
- il token è accettato anche come `?token=`.
