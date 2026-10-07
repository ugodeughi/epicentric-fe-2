# Temi

La veste grafica dell'app vive solo qui. I componenti in `app/components` contengono
struttura e comportamento e leggono l'aspetto da variabili CSS.

## Come è fatto un tema

| File                    | Contenuto                                                                  |
| ----------------------- | -------------------------------------------------------------------------- |
| `<tema>/tokens.css`     | Token generali: colori, tipografia, raggi, spazi, ombre, forma dell'Epikey |
| `<tema>/fonts.css`      | Font del tema (facoltativo)                                                |
| `<tema>/components.css` | Correzioni ai token per componente (facoltativo)                           |
| `<tema>/index.css`      | Importa i file sopra                                                       |

I token per componente (`--btn-radius`, `--card-bg`, `--nav-active-bg`…) sono definiti una
volta in `app/assets/css/component-tokens.css` e puntano ai token generali. Un tema li
ridefinisce solo dove vuole un comportamento diverso.

## Temi presenti

- `epicentric`: la veste del canvas di design. `tokens.css` è il file del pacchetto di
  handoff, senza l'import dei font da Google (sostituito da `fonts.css`, font in locale).
- `bare`: tema neutro di controllo. Serve a verificare che l'app regga senza la veste.

## Cambiare o togliere la veste

1. Creare `app/assets/themes/<nome>/` con un `tokens.css` che definisce **gli stessi nomi**
   di `epicentric/tokens.css`. Per un tema alternativo usare il selettore
   `:root[data-theme='<nome>']`; il tema predefinito usa `:root`.
2. Importarlo in `app/assets/themes/index.css`.
3. Attivarlo con `NUXT_PUBLIC_THEME=<nome>`.

Per provarlo al volo: pagina `/dev/ui` (solo in sviluppo).

## Regole

- Fuori da questa cartella sono vietati colori scritti a mano, `border-radius` numerici,
  `font-family` e ombre: lo controlla `pnpm lint` (stylelint).
- Un token nuovo va aggiunto a tutti i temi: lo controlla `pnpm test`.
- La palette `--epikey-*` è un dato scelto dall'utente: ha gli stessi valori in ogni tema.
