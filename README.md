# Epicentric 2.0 — Frontend PWA

Nuovo frontend di Epicentric: PWA in Nuxt 4 collegata al backend Node.js esistente. Sostituisce la beta in Vue 2.

Stato: fondamenta. Sono pronti la struttura del progetto, il design system base con i temi, la shell dell'app, il client API e l'accesso con sessione (login, logout, protezione delle rotte). Il piano completo e le regole di lavoro sono in [`CLAUDE.md`](./CLAUDE.md).

## Requisiti

- Node `^22.21` oppure `^24.11` (`.nvmrc` indica la 24)
- pnpm 10
- Il backend Epicentric in esecuzione, per le funzioni che chiamano le API

## Avvio

```bash
pnpm install
cp .env.example .env
pnpm dev
```

L'app risponde su http://localhost:8082.

| Indirizzo               | Cosa                                                       |
| ----------------------- | ---------------------------------------------------------- |
| `/login`                | Accesso                                                    |
| `/signup`               | Registrazione                                              |
| `/confirm/:code`        | Conferma dell'indirizzo email dal link ricevuto            |
| `/forgot-password`      | Richiesta del link per reimpostare la password             |
| `/reset-password/:code` | Scelta della nuova password dal link ricevuto              |
| `/app/catalog`          | Catalog (segnaposto)                                       |
| `/app/keys`             | Epikey (segnaposto)                                        |
| `/progress`             | Pagina provvisoria con lo stato dei lavori (solo italiano) |
| `/dev/ui`               | Galleria dei componenti, solo in sviluppo                  |

## Comandi

```bash
pnpm dev          # server di sviluppo
pnpm build        # build di produzione (Nitro node-server)
pnpm preview      # anteprima della build
pnpm lint         # ESLint + Stylelint
pnpm lint:fix     # correzione automatica
pnpm format       # Prettier
pnpm test         # Vitest (unit)
pnpm test:e2e     # Playwright sul Chrome installato; serve il backend avviato
```

## Configurazione

Variabili in `.env` (non versionato); l'elenco è in `.env.example`.

| Variabile                   | Default                      | Significato                                                                   |
| --------------------------- | ---------------------------- | ----------------------------------------------------------------------------- |
| `NUXT_PUBLIC_API_BASE`      | `http://localhost:3001/api/` | Indirizzo delle API del backend                                               |
| `NUXT_PUBLIC_THEME`         | `epicentric`                 | Tema grafico: nome di una cartella in `app/assets/themes`                     |
| `E2E_EMAIL`, `E2E_PASSWORD` | vuote                        | Account di prova per `pnpm test:e2e`; senza, i test con login vengono saltati |

## Stack

- Nuxt 4, Vue 3 con `<script setup>`, **JavaScript** (niente TypeScript)
- Rendering ibrido: pagine pubbliche in SSR, app autenticata (`/app/**`) come SPA
- Stato con `useState` e composable per dominio, senza Pinia
- `@nuxtjs/i18n`: inglese (default) e italiano
- ESLint, Stylelint, Prettier, Vitest con `@nuxt/test-utils`

## Struttura

```
app/
  assets/themes/   veste grafica, un tema per cartella
  assets/css/      reset, struttura e contratto dei token per componente
  components/      ui/ (design system), app/ (shell), epikey/
  layouts/         auth, app
  pages/           rotte
  composables/     useSession, useAuth, useApi
  services/api/    client HTTP e un modulo per dominio
  schemas/         schemi Zod delle risposte
  middleware/  plugins/  utils/
i18n/locales/      en.json, it.json
tests/unit/        test Vitest
tests/e2e/         test Playwright
docs/              richieste al backend
```

## Veste grafica e temi

La veste è separata dai componenti, così si può sostituire o togliere senza toccarli.

- I componenti contengono struttura e comportamento e leggono l'aspetto da variabili CSS.
- Ogni tema è una cartella in `app/assets/themes/`. `epicentric` è la veste di progetto; `bare` è un tema neutro che serve a verificare che l'app regga senza la veste.
- `pnpm lint` blocca colori, raggi, font e ombre scritti a mano fuori dai temi.
- `pnpm test` verifica che tutti i temi definiscano gli stessi token.

Per vedere il tema neutro:

```bash
NUXT_PUBLIC_THEME=bare pnpm dev
```

oppure, dalla galleria `/dev/ui`, con l'interruttore in alto a destra.

Come creare un tema nuovo: [`app/assets/themes/README.md`](./app/assets/themes/README.md).
