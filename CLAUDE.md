# Epicentric 2.0 — Frontend PWA (Nuxt)

Nuovo frontend di Epicentric come PWA Nuxt, collegato al backend Node.js esistente. Questo file è la guida di lavoro: perimetro, regole, fasi. Fonte: documento "Epicentric 2.0 — Progetto di implementazione Frontend (PWA Nuxt) — MVP" (29 set 2026).

## Perimetro

- **In scope**: app autenticata (`play.epicentric.world`), flussi di accesso, player audio, gestione contenuti, Epikeys, PWA installabile.
- **Fuori scope**: modifiche al backend, sito vetrina (`www`), wiki, app native.
- **Il backend non si tocca.** Ogni necessità non coperta dalle API diventa una voce in `docs/richieste-be.md`, mai un workaround nel client.
- **La legacy (Vue 2) è un riferimento funzionale, non una specifica.** Ogni funzione legacy va classificata (tieni / ripensa / scarta) in `docs/inventario-funzioni.md` prima di essere sviluppata. Non si porta codice legacy per copia.

## Repository collegati (sola lettura)

| Percorso | Cosa |
|---|---|
| `../epicentric-be/epicentric-node-backend` | Backend Node (Express + Prisma/MongoDB). Rotte in `src/routes/api/**/index.js`, schema in `src/shared/prisma/schema.prisma` |
| `../epicentric-be/documents` | `DOCS.md`, `routes_usage/epicentric_node_be_routes.md`, `wiki_engine.md`, `Epicentric - LONG WIKI.md`, `engine/` |
| `../epicentric-be/epicentric-tasks-manager` | Task manager Go (HTTP + WebSocket, porta 10000) |
| `../epicentric-fe` | Frontend legacy Vue 2.7: `src/api/*.js` (chiamate), `src/store/modules/*` (stato), `src/locales/{en,it}.json` |
| `../AMBIENTE_LOCALE_MAC.md` | Come avviare backend, DB e Mailpit in locale |
| `../_materiale/epicentric-handoff` | Canvas di design: `docs/design-spec.md` (linguaggio visivo, componenti, schermate), `design/tokens.css`, `design/screens/*.dc.html` (prototipi: riferimento visivo e di comportamento, non codice da copiare) |

Non modificare file in questi repository. Non stampare né copiare valori dai file `.env*` del backend: contengono credenziali reali.

## Ambiente locale

- Backend: da `../epicentric-be`, `./run_local_mac.sh`. API su `http://localhost:3001/api/`, email catturate su `http://localhost:8025`.
- **Porta di sviluppo: 8082.** La 3000 è occupata da un altro progetto, la 8080/8081 dal frontend legacy. `localhost:8082` è già tra le origini CORS del backend locale.
- Node 24 (`.nvmrc`), package manager **pnpm**. Niente npm o yarn. Nuxt 4.6 chiede Node `^22.21` o `^24.11`: con la 24.3.0 funziona ma avvisa, aggiornare con `nvm install 24`.
- I link nelle email locali puntano a `localhost:8081` (`FRONTEND_URL` del backend): durante i test cambiare la porta a mano.
- Lo storage locale è vuoto: i media del dump non si caricano. Per provare player e viewer servono contenuti caricati dal nuovo frontend.
- Il DB locale contiene dati reali di produzione: non creare, modificare o cancellare utenti esistenti; usare account di test nuovi.

Comandi:

```bash
pnpm dev            # http://localhost:8082
pnpm lint           # ESLint + Stylelint (guardia sui token)
pnpm lint:fix       # correzione automatica
pnpm format         # Prettier
pnpm test           # Vitest (unit)
pnpm test:e2e       # Playwright, con il Chrome installato; serve il backend avviato
pnpm build          # build Nitro node-server
```

I test end-to-end non devono accumulare dati: la creazione dell'account è simulata con una risposta finta, tutto il resto è reale. Usano un account di prova dedicato del backend locale, con credenziali in `.env` (`E2E_EMAIL`, `E2E_PASSWORD`); senza, i test che richiedono il login vengono saltati. Non usare mai account reali del dump.

Variabili: `NUXT_PUBLIC_API_BASE` (default locale `http://localhost:3001/api/`), `NUXT_PUBLIC_THEME` (default `epicentric`); in arrivo `NUXT_PUBLIC_TASKS_WS_URL`, `NUXT_PUBLIC_SENTRY_DSN`. Valori locali in `.env` (gitignored), elenco in `.env.example`.

## Stack (decisioni prese)

| Area | Scelta |
|---|---|
| Framework | Nuxt 4, Vue 3 Composition API (`<script setup>`), **JavaScript — niente TypeScript**, Vite |
| Rendering | Ibrido: SSR per le pagine pubbliche, SPA sotto `/app/**` |
| Stato | `useState` + composable per dominio. **Niente Pinia** |
| HTTP | `$fetch` / `useFetch` con un unico client API. Niente Axios |
| Audio | Un solo `<audio>` HTML5 + Web Audio API (GainNode, BiquadFilter, crop via offset) + Media Session API |
| Realtime | WebSocket nativo verso il task manager, in un composable, con fallback a polling |
| PWA | `@vite-pwa/nuxt` (Workbox) |
| i18n | `@nuxtjs/i18n`, EN default + IT |
| UI | Design system proprio su CSS custom properties, veste grafica in temi sostituibili (vedi "Veste grafica"), icone SVG a tratto. Base headless: da decidere (vedi punti aperti) |
| Utility | VueUse, `@nuxt/image` per le miniature |
| Tipi e validazione | Schemi Zod ai confini (risposte API) + JSDoc per l'autocompletamento |
| Qualità | `@nuxt/eslint`, Stylelint, Prettier, Husky + lint-staged, Vitest + `@nuxt/test-utils`, Playwright |
| Monitoraggio | Sentry con source map caricate e non pubblicate |

```ts
routeRules: {
  '/app/**': { ssr: false },
  '/login': { ssr: true },
  '/signup': { ssr: true },
  '/invite/**': { ssr: true },
  '/reset-password/**': { ssr: true },
  '/confirm/**': { ssr: true },
}
```

## Architettura

```
app/
  assets/themes/  veste grafica: un tema per cartella (epicentric, bare)
  assets/css/     base.css (reset, struttura), component-tokens.css (contratto)
  pages/          rotte (auth, catalog, items, keys; dev/ui solo in sviluppo)
  layouts/        auth, app (shell con player persistente)
  components/     ui/ (design system) + <dominio>/ (app, epikey…)
  composables/    useAuth, useItems, useKeys, useLinks, usePlayer, useTasks…
  services/api/   client $fetch + un modulo per dominio
                  (users, items, links, maps, streaming, application)
  schemas/        schemi Zod allineati ai modelli Prisma
  utils/          funzioni pure (auto-importate)
  middleware/     auth.global.ts
  plugins/        api, realtime, sentry
i18n/locales/     en.json, it.json
docs/             inventario funzioni, mappa endpoint, richieste al BE
tests/            unit/ (Vitest), e2e/ (Playwright)
```

Regole di architettura:

1. **I componenti non chiamano mai le API.** Componente → composable → `services/api`.
2. **Una rotta per ogni vista.** Pubbliche alla radice: `/login`, `/signup`, `/invite/:code`, `/forgot-password`, `/reset-password/:code`, `/confirm/:code`. I percorsi della legacy e delle email del backend (`/recover-password`, `/confirm-account/:code`) reindirizzano ai nuovi. App sotto `/app`: `/app/catalog/:section?`, `/app/items/:itemId`, `/app/keys/:keyId`. La sezione si chiama **Catalog** come nel canvas (non "library").
3. **Le modali solo per azioni brevi** (conferme, creazione rapida). Upload, guida e account sono pagine o drawer con URL proprio.
4. **Il player vive nel layout `app`** e sopravvive ai cambi di rotta. Due componenti (desktop, mobile), un solo `usePlayer`, un solo motore audio.
5. **Stato**: `useState` con chiavi per dominio (`session`, `items`, `keys`, `player`…), esposto solo tramite composable che incapsulano fetch, cache e mutazioni.
6. **Dati**: niente TypeScript. La forma dei dati è definita da schemi Zod scritti a mano dallo schema Prisma e dalle risposte reali, applicati nel layer API; JSDoc (`@typedef`, `@param`) dove aiuta l'editor. Non esiste uno schema OpenAPI.

## Veste grafica

Il progetto deve restare **svestibile**: tutta la veste sta in `app/assets/themes/`, i componenti contengono solo struttura e comportamento. Dettagli in `app/assets/themes/README.md`.

- **Tema = cartella.** `epicentric` è la veste del canvas (`tokens.css` è il file dell'handoff, con i font in locale al posto di Google Fonts). `bare` è un tema neutro di controllo: se l'app regge con `bare`, la veste è davvero separata.
- **Due livelli di token.** Generali del tema (`--primary`, `--surface-1`, `--r-md`…) e per componente (`--btn-radius`, `--card-bg`, `--nav-active-bg`…), questi ultimi in `app/assets/css/component-tokens.css`. Un componente nuovo dichiara lì i propri token.
- **Due superfici.** Fondo scuro (predefinito) e carta crema: si cambia contesto con `data-surface="paper"` su un contenitore; i componenti dentro si adattano da soli.
- **Vietato fuori dai temi**: colori scritti a mano (hex, `rgb()`, nomi), `border-radius` numerici, `font-family`, ombre in px. Lo blocca `pnpm lint`.
- **Un token nuovo va in tutti i temi**; ogni `var(--x)` usata deve esistere nel contratto. Lo verifica `pnpm test` (`tests/unit/themes.test.js`).
- **Colore Epikey**: scelto dall'utente tra 10 (`utils/epikeyPalette.js` → `--epikey-<id>`), uguale in ogni tema; il testo sopra è sempre `--ink`.
- **Galleria**: `/dev/ui` mostra i componenti sulle due superfici con l'interruttore del tema. Ogni componente `ui/` nuovo va aggiunto lì e provato con entrambi i temi. La pagina è esclusa dalla build di produzione.
- Regole del canvas da rispettare: una sola azione primaria per vista, target ≥ 44 px, elementi nativi (`button`, `a`, `input`) con `aria-*` sui controlli custom, niente emoji, i nomi dei concetti (Catalog, Epikey, Link, Map, Chain Link, Play first, Frequence, Freeze) non si traducono, `prefers-reduced-motion` rispettato.

## Fatti verificati sul backend

Letti nel codice il 7 ott 2026; ricontrollare se il backend cambia.

- **Envelope delle risposte**: `{ Success, Result: "OK"|"KO", ResultText, Data }`. Gli errori applicativi escono con `Result: "KO"` e il codice in `ResultText`, e di default con **HTTP 200**: il client API deve aprire l'envelope e trasformare i `KO` in errori tipizzati, non fidarsi dello status HTTP.
- **Campi in PascalCase** (`Email`, `Password`, `MediaItemId`…). I DTO mantengono i nomi del backend.
- **Autenticazione** (`src/shared/middlewares/RouteAuthorize.js`): il token si legge nell'ordine da `Authorization: Bearer`, parametro di query `?token=`, cookie `auth`. Token mancante, non valido, scaduto o revocato → **HTTP 401** con `ResultText` `KO_INVALID_OR_MISSING_TOKEN` o `KO_JWT_TOKEN_EXPIRED`.
- **Media nativi** (`<audio>`, `<img>`, download): non possono inviare l'header Bearer, quindi il token va passato come `?token=`. Il cookie `auth` del backend non si usa: il client chiama le API senza credenziali e il browser non lo salva.
- **Login** `POST users/login` con `{ Email, Password }` → `Data: { Auth, User, InstanceState, License, Operations, Processes }`. Credenziali errate o utente inesistente: HTTP 200 con `KO_PASSWORD_INVALID`. Altri esiti: `KO_INVALID_LOGIN` (campi mancanti), `KO_LOCKED`, `KO_NOT_FOUND_DELETE_PENDING`. `User` è l'intero record del DB, hash della password compreso: lo schema Zod tiene solo i campi utili.
- **Registrazione** `POST users/signup` con `{ Email, Password, Language, Birthday, Campaign, SharedSpaceCode }` → `Data: "OK_USER_CREATED"`; errori `KO_NO_DATA`, `KO_INVALID_EMAIL`, `KO_EMAIL_ALREADY_USED`. `Language` è un id della collezione `Language`: `english` o `italiano`. L'account è subito utilizzabile: il login non richiede la conferma dell'email. La legacy raccoglie la data di nascita solo per il controllo dei 18 anni e non la invia; la 2.0 la invia come `AAAA-MM-GG`. Il form ha tre caselle come nella legacy: termini e privacy (obbligatoria), newsletter (facoltativa; il backend non ha un campo, quindi non viene inviata), dichiarazione di maggiore età (obbligatoria). Il pulsante resta disabilitato finché non sono compilati email e password, spuntate le due caselle obbligatorie e la data di nascita indica almeno 18 anni.
- **Conferma email** `GET users/email/confirm/:code` → `Data: { confirmed: true }`, codice sconosciuto → `KO_NOT_FOUND`; il codice vale una volta. Il link nelle email è `FRONTEND_URL/confirm-account/<code>`. Oggi il backend non genera il codice alla registrazione (vedi `docs/richieste-be.md`, A7).
- **Recupero password** `POST users/password/recover` con `{ Email }` (ricerca sensibile alle maiuscole: inviare in minuscolo); email non registrata → `KO_USER_NOT_FOUND`, che l'interfaccia non deve mai rivelare. L'email contiene `FRONTEND_URL/reset-password/<token>`, valido un'ora.
- **Reset password** `POST users/password/reset/:token` con `{ NewPassword }`. Token non valido o scaduto → envelope di *successo* con `Data: "KO_INVALID_TOKEN"`; stessa password di prima → `KO_PSW_MUST_BE_DIFFERENT`. Non esiste un endpoint per verificare il token prima dell'invio.
- **Utente corrente** `GET users/current/details`; **logout** `POST users/logout` (revoca il token inviato come Bearer).
- **Playlist Engine nel backend**: `src/shared/engine/` (Intelligent Random, Play first, sequenze, path). Il frontend **non** reimplementa la generazione: chiede la playlist (`/api/maps/key/playlist`, `/api/maps/key/playlist/path`, `/api/links/playlist`, `/api/items/playlist`, `/api/users/current/playlist`) e la riproduce.
- **Tracce della playlist**: ogni traccia porta `Gain`, `FadeIn`, `FadeOut`, `FadeOutStart`, `SkipTo`, `PlayDuration` più `Item`, `Link`, `Key` annidati (l'EQ arriva come `EqualizerId`). Resta da verificare se la precedenza Link > Epikey figlio > Epikey padre > contenuto è già risolta nei valori di traccia.
- **Streaming**: `/api/streaming` (GET con range) e `POST /api/streaming/position` per salvare la posizione.
- **Upload**: `/api/items/upload`, Multer, limite 5 GiB per file.
- **Task asincroni**: la legacy non usa WebSocket, fa polling. Il Caddy di produzione espone solo `/api/*` dell'API Node: il WebSocket del task manager non è raggiungibile dal browser finché il backend non lo espone.
- **Rotte non presenti nel backend Node**: commenti sui Link, sharing spaces, social, notifiche. In produzione le richieste non gestite vengono inoltrate a un vecchio backend; in locale non esistono. Sono fuori dall'MVP.
- **Deploy attuale**: `play.epicentric.world` è servito da Caddy come file statici. La 2.0 richiede un upstream Node (Nitro).

## Client API e sessione

- `services/api/client.js`: unico client. Apre l'envelope, restituisce `Data`, lancia `ApiError` con `code` uguale al `ResultText` del backend (oppure `NETWORK_ERROR`, `INVALID_RESPONSE`). Con `schema` valida la risposta con Zod.
- `services/api/<dominio>.js`: una funzione `create<Dominio>Api(api)` per dominio, registrata in `plugins/api.js` ed esposta da `useApi()`. Usa i nomi di campo del backend; gli argomenti delle funzioni sono in camelCase.
- `useSession()`: token nel cookie `ec_token` (30 giorni, SameSite=Lax, Secure fuori dallo sviluppo) e utente in `useState`. `useAuth()`: `login`, `logout`, `ensureUser`.
- `middleware/auth.global.js`: senza token `/app/**` porta a `/login?redirect=…`; con il token `/login` e `/signup` portano a `/app` già lato server. Entrando nell'app il token viene verificato caricando l'utente.
- Qualsiasi 401 azzera la sessione e riporta a `/login`.
- I messaggi d'errore si ricavano dal `code` con una mappa verso chiavi i18n (esempio: `utils/authErrors.js`), sempre con un messaggio generico di riserva.
- **Pagine SSR con form**: il pulsante di invio resta disabilitato fino all'idratazione e il form ha `method="post"`, così un invio nativo non mette mai le credenziali nell'URL. `UiField` e `UiCheckbox` conservano quanto inserito prima dell'idratazione; un nuovo controllo di form deve fare lo stesso.

## Modello di dominio

Epicentric non è un file manager: genera playlist da concetti e personalizza la riproduzione senza toccare i file. La UX deve mettere questo al centro.

- **Catalogo**: tutti i contenuti in 4 sezioni — Audio (MP3, M4A, WAV, FLAC), Visual (JPG, PNG, BMP, MP4, video embedded), Altri file, Bookmark. Si alimenta con upload, download dal web, embed video, bookmark.
- **Epikey**: "cartella virtuale" per emozioni, artisti, luoghi, persone, attività. È l'oggetto principale della navigazione. Modello `Key` nel backend.
- **Link**: collegamento tra un contenuto e un Epikey, con impostazioni proprie (gain, fade, crop audio `Start`/`End`, frequenza, freeze). Un contenuto può avere molti Link. È un'entità con UI dedicata.
- **Mappa**: disposizione di Epikeys in alberi, percorsi, sequenze.
- **Accesso alla riproduzione**: dal catalogo, da un Link, da un Epikey o ramo di Mappa. Ogni vista ha un'azione "play" coerente.
- **Playlist Engine** (per Epikey): Intelligent Random, Chain Link, Play first, Frequenza ±2, Freeze contenuto, Freeze Link.
- **Modalità Mappa**: Single Playlist oppure Playlist Path (Epikeys numerati, skip manuale, a tempo o a fine audio).
- **Precedenza dei parametri**: Link > Epikey figlio > Epikey padre > contenuto.

## Fasi

Si lavora una fase alla volta, nell'ordine. Una fase è chiusa solo quando il suo criterio di uscita è soddisfatto e verificato. Spuntare le voci completate in questo file.

### Fase 0 — Discovery (1 settimana)

Nessun codice applicativo: solo documenti in `docs/`.

- [ ] `docs/inventario-funzioni.md`: ogni funzione legacy (pannelli, 50 modali, 11 moduli Vuex) classificata tieni / ripensa / scarta, con la rotta 2.0 di destinazione
- [ ] `docs/mappa-endpoint.md`: per ogni endpoint usato nell'MVP metodo, path, payload, risposta reale, chiamata legacy corrispondente (`../epicentric-fe/src/api/*.js`)
- [ ] `docs/richieste-be.md`: avviato (sicurezza, configurazione, coerenza delle API); da completare con la mappa degli endpoint
- [ ] Risposta ai punti aperti verificabili sul codice: precedenza parametri, cookie per i media, codici di stato su token scaduto
- [ ] `docs/ux-flows.md`: flussi di accesso, catalogo → Epikey → Link → play, upload
- [ ] Verifica dei link nelle email del backend: la legacy usa `/confirm-account/:code`, `/invite-signup`, `/recover-password`; prevedere redirect verso le nuove rotte

**Uscita**: inventario approvato da Stefano, elenco richieste al backend consegnato.

### Fase 1 — Fondamenta (2 settimane)

- [x] 1.1 Setup: Nuxt 4 in JavaScript, pnpm, `.nvmrc`, struttura cartelle, `routeRules`, porta 8082, `.env.example`
- [ ] 1.2 Qualità: ~~ESLint, Stylelint, Prettier, Vitest, Playwright, script~~ fatti; manca Husky + lint-staged
- [ ] 1.3 CI: GitHub Actions lint → test → build; anteprima per PR; deploy staging su `main`, produzione su tag
- [ ] 1.4 Design system base: ~~temi `epicentric` e `bare`, contratto dei token, Button, Chip, Segmented, Switch, Field, Card, Icon, EpikeyHex, galleria `/dev/ui`~~ fatti; mancano Dialog, BottomSheet/Drawer, Toast, Slider
- [x] 1.5 Client API: plugin `api`, apertura envelope, errori tipizzati, header Bearer, gestione 401 (azzera stato → `/login`), primi schemi Zod
- [x] 1.6 Auth: `useAuth`, token in cookie con `useCookie` (Secure, SameSite=Lax), `middleware/auth.global.ts`, redirect lato server di chi è già loggato
- [ ] 1.7 Pagine pubbliche: ~~login, signup, conferma account (`/confirm/:code`), recupero password (`/forgot-password`), reset password (`/reset-password/:code`)~~ fatti; manca signup su invito
- [x] 1.8 Layout: `auth` e `app` (shell con sidebar su desktop e tab bar sotto gli 800 px, slot per il player)
- [x] 1.9 i18n: `@nuxtjs/i18n` EN + IT senza prefisso nell'URL, lingua in cookie `ec-locale`, solo le chiavi effettivamente usate
- [ ] 1.10 PWA base: manifest standalone, icone maskable, service worker in modalità prompt, pagina offline
- [ ] 1.11 Prototipo del player: `<audio>` + Web Audio (gain, EQ, crop) + Media Session, provato su iPhone e Android reali a schermo bloccato
- [ ] 1.12 Sentry e Dockerfile (preset Nitro `node-server`)

**Uscita**: login funzionante in staging con pipeline verde.

### Fase 2 — MVP (5 settimane)

Ordine pensato per avere presto il ciclo completo catalogo → Epikey → Link → playlist.

- [ ] 2.1 Catalog: `/app/catalog/:section?` per le 4 sezioni, liste paginate e virtualizzate, filtri, miniature
- [ ] 2.2 Dettaglio contenuto: `/app/items/:itemId`, metadati, viewer integrati (audio, immagini, video MP4 ed embed, PDF, bookmark)
- [ ] 2.3 Acquisizione: upload multiplo con coda, progresso e retry; download dal web; embed video; bookmark
- [ ] 2.4 Task asincroni: `useTasks` con polling, WebSocket quando il backend lo espone; notifiche in-app
- [ ] 2.5 Epikeys: `/app/keys/:keyId`, liste gerarchiche, creazione, template
- [ ] 2.6 Link: collegamento contenuti ↔ Epikey, lista dei Link di un Epikey, play da Link, freeze / unfreeze
- [ ] 2.7 Player: `usePlayer`, coda da playlist del backend, componenti desktop e mobile, waveform, salvataggio posizione, Media Session
- [ ] 2.8 Playlist Engine: pannello impostazioni per Epikey e per Link (Intelligent Random, Chain Link, Play first, Frequenza, Freeze)
- [ ] 2.9 Personalizzazione: volume, EQ, audio crop a livello contenuto e Link; rotazione e crop immagini
- [ ] 2.10 Ricerca globale
- [ ] 2.11 PWA completa: prompt di installazione in app, splash iOS, cache (`NetworkFirst` per le API, `CacheFirst` con scadenza per le miniature, audio mai in cache), banner "nuova versione"
- [ ] 2.12 Rifinitura: accessibilità WCAG 2.1 AA, budget di performance, E2E sui flussi critici, Lighthouse CI

**Uscita**: beta chiusa con utenti della legacy, su dominio separato (es. `beta.play.epicentric.world`), stesso backend.

### Fuori dall'MVP

Editor visuale di Map e modalità Playlist Path (schermata 05 del canvas), pagina "Risoluzione parametri" (08), landing pubblica (01, fa parte del sito vetrina), sharing spaces, social, commenti, abbonamenti Stripe, manutenzione/admin. Non svilupparli senza una decisione esplicita.

## Obiettivi di qualità

- Copertura unit ≥ 70% su `composables/` e `services/`.
- E2E Playwright su: login, upload, assegnazione Epikey, riproduzione.
- LCP < 2,5 s su 4G; bundle iniziale < 200 KB gzip; liste lunghe virtualizzate; rotte caricate a richiesta.
- WCAG 2.1 AA; player e liste navigabili da tastiera.
- Il backend non ha rate limiting né cache: debounce sulle ricerche, cache lato client nei composable, nessuna chiamata duplicata al mount.

## Regole di lavoro

1. Prima di scrivere una chiamata API, leggere la rotta nel backend e la chiamata legacy corrispondente. Non dedurre i payload.
2. Ogni composable e ogni modulo `services/api` nasce con i suoi test Vitest.
3. Solo JavaScript: nessun file `.ts`, nessun `lang="ts"`. I file `.nuxt/*.d.ts` generati da Nuxt servono all'editor e non si toccano.
4. Tutti i testi visibili passano da i18n, in EN e IT. Unica eccezione: la pagina provvisoria `/progress` (stato dei lavori per il team), solo in italiano, con i contenuti in `app/data/progress.js`. Va aggiornata quando si completa una funzione e rimossa al lancio; non deve mai citare problemi di sicurezza del backend.
5. Nessun colore, raggio, ombra o font fuori dai temi; i componenti leggono solo token (vedi "Veste grafica").
6. Prima di dichiarare chiuso un task: `pnpm lint && pnpm test` verdi, e la funzione provata nel browser contro il backend locale, con entrambi i temi se tocca l'interfaccia.
7. Commit piccoli e descrittivi; non fare push né aprire PR senza richiesta esplicita.
8. Una lacuna del backend si scrive in `docs/richieste-be.md` e si segnala; non si aggira nel client.
9. Dipendenze nuove solo se necessarie e motivate; preferire VueUse e le API del browser.

## Prerequisiti lato backend (da chiedere)

- Aggiungere la nuova origine (staging, beta, produzione) a `CLIENTS_URL`.
- Esporre il WebSocket del task manager tramite Caddy e confermarne l'URL.
- Confermare i limiti di upload in Caddy (Multer: 5 GiB).
- Aggiornare `FRONTEND_URL` e i percorsi dei link nelle email per la 2.0.
- Sostituire in Caddy i file statici di `play.epicentric.world` con l'upstream Node.
- Da discutere: logout lato server e scadenza JWT più breve; rate limiting e cache.

## Punti aperti

| Punto | Stato |
|---|---|
| Playlist Engine: backend o client? | **Chiuso**: backend (`src/shared/engine/`) |
| Schema OpenAPI o collezione Postman? | **Chiuso**: non esiste; c'è `documents/routes_usage/epicentric_node_be_routes.md` |
| WebSocket del task manager tramite Caddy? | Aperto: oggi non esposto. Si parte con il polling |
| Precedenza parametri già risolta dal backend? | Da verificare in Fase 0 |
| Autenticazione delle richieste native (`<audio>`, `<img>`) | **Chiuso**: il backend accetta il token come `?token=` |
| Design system da zero o su Nuxt UI / Reka UI? | Aperto. I primi componenti sono scritti a mano; proposta: Reka UI come base headless per Dialog, BottomSheet e Slider, stile interamente nostro |
| Upload: Uppy o implementazione propria? | Aperto. Proposta: implementazione propria su `XMLHttpRequest` (`fetch` non espone il progresso di upload) |
| Analytics: GA4 o soluzione cookieless? | Aperto, decisione di prodotto |
