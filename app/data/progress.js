// Content of the provisional /progress page. Italian only on purpose: the page is a
// temporary status report for the project team, not part of the product (see CLAUDE.md).

export const PROGRESS_UPDATED = '7 ottobre 2026'

/** @type {{ title: string, intro?: string, items: { title: string, detail: string }[] }[]} */
export const PROGRESS_DONE = [
  {
    title: 'Fondamenta del progetto',
    intro: 'La base tecnica su cui poggia tutto il resto.',
    items: [
      {
        title: 'Progetto Nuxt 4',
        detail: 'Nuovo frontend in Nuxt 4 e Vue 3, scritto in JavaScript, gestito con pnpm.',
      },
      {
        title: 'Rendering ibrido',
        detail:
          'Le pagine pubbliche (accesso, registrazione, recupero password) sono generate dal server per caricarsi subito; l’app dopo il login gira interamente nel browser.',
      },
      {
        title: 'Struttura a livelli',
        detail:
          'Pagine, componenti, logica di stato e chiamate al backend sono separati: i componenti non parlano mai direttamente con il backend.',
      },
      {
        title: 'Indirizzi della versione precedente',
        detail: 'I vecchi percorsi e quelli contenuti nelle email reindirizzano alle nuove pagine.',
      },
    ],
  },
  {
    title: 'Veste grafica separabile',
    intro: 'L’aspetto dell’app si può sostituire o togliere senza toccare i componenti.',
    items: [
      {
        title: 'Tema Epicentric',
        detail:
          'Colori, tipografia, raggi, spazi e forma esagonale degli Epikey presi dal canvas di design. Il font Titillium Web è servito dall’app, senza richieste a servizi esterni.',
      },
      {
        title: 'Tema neutro di controllo',
        detail:
          'Un secondo tema senza stile (grigi, angoli vivi, font di sistema) dimostra che l’app funziona anche “svestita”.',
      },
      {
        title: 'Due superfici',
        detail:
          'Fondo petrolio scuro per l’app e carta crema per pannelli e moduli: i componenti si adattano da soli.',
      },
      {
        title: 'Controlli automatici sullo stile',
        detail:
          'Un controllo blocca colori, raggi, font e ombre scritti a mano fuori dal tema; un altro verifica che ogni tema definisca le stesse variabili.',
      },
      {
        title: 'Galleria dei componenti',
        detail: 'Pagina interna di sviluppo che mostra tutti i componenti con entrambi i temi.',
      },
    ],
  },
  {
    title: 'Componenti dell’interfaccia',
    items: [
      {
        title: 'Pulsante',
        detail: 'Varianti primaria, secondaria e neutra; funziona anche come collegamento.',
      },
      {
        title: 'Campo di testo',
        detail:
          'Con etichetta, testo di aiuto e, per le password, il pulsante con l’occhio per mostrarle o nasconderle.',
      },
      { title: 'Casella di spunta', detail: 'Compatta, con testo e collegamenti nell’etichetta.' },
      {
        title: 'Selettore a segmenti',
        detail: 'Usato per le sezioni del Catalog e per la lingua; si usa anche da tastiera.',
      },
      {
        title: 'Interruttore, etichetta, scheda, messaggio',
        detail: 'Elementi di base per impostazioni, filtri, contenitori ed esiti.',
      },
      {
        title: 'Esagono Epikey',
        detail: 'Con i 10 colori della palette, dimensione variabile e stato selezionato.',
      },
      { title: 'Icone', detail: 'Icone vettoriali a tratto incluse nell’app.' },
    ],
  },
  {
    title: 'Struttura dell’app e lingue',
    items: [
      {
        title: 'Barra laterale su desktop',
        detail: 'Logo, navigazione tra Catalog ed Epikey, utente collegato e uscita.',
      },
      {
        title: 'Barra in basso su telefono',
        detail: 'Sotto gli 800 px la navigazione passa in fondo allo schermo.',
      },
      {
        title: 'Pagine Catalog ed Epikey',
        detail: 'Presenti come segnaposto, con le sezioni Audio, Visual, Other Files e Bookmarks.',
      },
      {
        title: 'Italiano e inglese',
        detail:
          'Tutti i testi sono in entrambe le lingue; la scelta viene ricordata. I nomi dei concetti (Epikey, Catalog, Link) non si traducono.',
      },
    ],
  },
  {
    title: 'Collegamento al backend e sessione',
    items: [
      {
        title: 'Client unico per le API',
        detail:
          'Un solo punto gestisce le chiamate, interpreta le risposte del backend e trasforma gli errori in messaggi comprensibili.',
      },
      {
        title: 'Controllo dei dati ricevuti',
        detail: 'Le risposte vengono verificate; dei dati dell’utente si tengono solo i campi necessari.',
      },
      {
        title: 'Sessione di 30 giorni',
        detail: 'Dopo l’accesso la sessione resta attiva anche chiudendo o ricaricando la pagina.',
      },
      {
        title: 'Protezione delle pagine',
        detail:
          'Senza accesso l’app non è raggiungibile; dopo il login si torna alla pagina richiesta. Chi è già collegato non rivede la pagina di accesso.',
      },
      {
        title: 'Sessione scaduta',
        detail: 'Se il backend non riconosce più la sessione, l’app riporta all’accesso.',
      },
    ],
  },
  {
    title: 'Accesso',
    items: [
      { title: 'Login con email e password', detail: 'Collegato al backend esistente.' },
      {
        title: 'Messaggi dedicati',
        detail: 'Credenziali errate, account bloccato, account in cancellazione, server non raggiungibile.',
      },
      { title: 'Uscita', detail: 'Chiude la sessione sul dispositivo e la invalida sul backend.' },
    ],
  },
  {
    title: 'Registrazione',
    items: [
      { title: 'Modulo di registrazione', detail: 'Email, password con ripetizione, data di nascita.' },
      {
        title: 'Tre caselle come nella versione precedente',
        detail:
          'Accettazione di termini d’uso e privacy, aggiornamenti sul prodotto (facoltativa), dichiarazione di maggiore età.',
      },
      {
        title: 'Pulsante attivo solo a modulo completo',
        detail:
          'Si abilita quando i campi sono compilati, le caselle obbligatorie spuntate e l’età è di almeno 18 anni.',
      },
      {
        title: 'Controlli',
        detail: 'Password di almeno 8 caratteri, password coincidenti, email valida, email già registrata.',
      },
      { title: 'Ingresso immediato', detail: 'A registrazione riuscita si entra direttamente nell’app.' },
      {
        title: 'Lingua e campagna',
        detail:
          'L’account nasce con la lingua dell’interfaccia; l’eventuale codice campagna nell’indirizzo viene conservato.',
      },
    ],
  },
  {
    title: 'Conferma dell’indirizzo email',
    items: [
      {
        title: 'Pagina di conferma',
        detail: 'Aperta dal link nell’email: conferma l’indirizzo e mostra l’esito.',
      },
      {
        title: 'Link non più valido',
        detail: 'Se il link è già stato usato o non esiste, la pagina lo spiega.',
      },
    ],
  },
  {
    title: 'Recupero della password',
    items: [
      {
        title: 'Richiesta del link',
        detail: 'Dal login, “Hai dimenticato la password?”: si inserisce l’email e si riceve un link.',
      },
      {
        title: 'Riservatezza',
        detail:
          'La risposta è identica sia per un’email registrata sia per una sconosciuta, così non si scopre chi ha un account.',
      },
      {
        title: 'Scelta della nuova password',
        detail: 'Dal link ricevuto, con ripetizione e pulsante per vederla.',
      },
      {
        title: 'Casi gestiti',
        detail:
          'Link scaduto o già usato (con richiesta di uno nuovo), password uguale alla precedente, password non coincidenti.',
      },
    ],
  },
  {
    title: 'Solidità dei moduli',
    items: [
      {
        title: 'Niente dati persi durante il caricamento',
        detail: 'Testo e spunte inseriti mentre la pagina sta ancora caricando vengono conservati.',
      },
      {
        title: 'Invio protetto',
        detail:
          'I pulsanti si attivano solo a pagina pronta; le credenziali non possono finire nell’indirizzo.',
      },
      {
        title: 'Accessibilità di base',
        detail:
          'Elementi nativi, etichette per i lettori di schermo, uso da tastiera, rispetto di “riduci movimento”.',
      },
    ],
  },
  {
    title: 'Qualità e pubblicazione',
    items: [
      {
        title: '26 test automatici sulla logica',
        detail: 'Client API, chiamate utente, calcolo dell’età, coerenza dei temi, componenti.',
      },
      {
        title: '10 test automatici nel browser',
        detail:
          'Accesso, uscita, protezione delle pagine, registrazione, recupero password completo con lettura dell’email.',
      },
      { title: 'Controlli sul codice', detail: 'Analisi statica e formattazione uniforme a ogni modifica.' },
      { title: 'Pubblicazione automatica', detail: 'Ogni aggiornamento viene pubblicato su Vercel.' },
      { title: 'Documentazione', detail: 'Guida di progetto, istruzioni di avvio e guida ai temi.' },
    ],
  },
]

/** @type {{ title: string, items: string[] }[]} */
export const PROGRESS_NEXT = [
  {
    title: 'Per completare le fondamenta',
    items: [
      'Registrazione su invito',
      'App installabile (PWA): icone, funzionamento senza rete, avviso di nuova versione',
      'Prototipo del player audio provato su telefoni reali',
      'Controlli automatici a ogni modifica sul repository (CI) e monitoraggio degli errori',
      'Componenti mancanti: finestra di dialogo, pannello dal basso, notifiche, cursore',
    ],
  },
  {
    title: 'Funzioni dell’MVP',
    items: [
      'Catalog: elenchi, filtri, miniature, dettaglio e visualizzatori dei contenuti',
      'Acquisizione: caricamento di più file, download dal web, video incorporati, bookmark',
      'Epikey: elenchi gerarchici, creazione, modelli',
      'Link: collegamento tra contenuti ed Epikey, riproduzione da Link, Freeze',
      'Player: playlist generate dal backend, versioni desktop e mobile, forma d’onda',
      'Impostazioni del Playlist Engine e personalizzazione (volume, equalizzatore, ritaglio)',
      'Ricerca globale e notifiche',
    ],
  },
]
