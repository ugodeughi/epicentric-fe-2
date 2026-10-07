# Richieste al backend

Lacune e problemi del backend emersi sviluppando il frontend 2.0. Il client non li aggira:
vanno risolti nel backend. Ogni voce indica dove si vede nel codice di `epicentric-be`.

## Sicurezza

| #   | Problema                                                                                                                                                                                                           | Dove                                                                                       | Richiesta                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| S1  | La risposta di login e di `users/current/details` contiene l'intero record utente, compresi l'hash della password (`Password`), `ThrowAwayCode`, `resetToken` e `resetTokenExpiry`                                 | `routes/api/users/login/index.js` (`...user`), `routes/api/users/current/details/index.js` | Restituire solo i campi necessari al client. Il frontend 2.0 li scarta comunque appena ricevuti |
| S2  | A ogni login il valore di `AUTH_SECRET` viene scritto nei log                                                                                                                                                      | `routes/api/users/login/index.js` (`Logger.log("ProcessEnvs.AUTH_SECRET: ", …)`)           | Rimuovere la riga; valutare la rotazione del segreto se i log sono stati condivisi              |
| S3  | Il controllo "email confermata" al login è disattivato                                                                                                                                                             | `routes/api/users/login/index.js` (blocco commentato "turned off for debug")               | Confermare se è voluto in produzione                                                            |
| S4  | La durata del JWT è `EXPIRE_TIME_JWT`, con default **300 giorni** se la variabile manca; il cookie `auth` dura 30 giorni                                                                                           | `shared/helpers/JWTTokenHelper.js`                                                         | Confermare il valore in produzione e allinearlo ai 30 giorni dichiarati                         |
| S5  | La revoca dei token al logout sta in memoria (`TokenBlacklist`): si perde al riavvio del servizio                                                                                                                  | `shared/helpers/TokenBlacklist.js`                                                         | Da valutare insieme a una scadenza più breve                                                    |
| S6  | Il recupero password risponde `KO_USER_NOT_FOUND` se l'email non è registrata: permette di scoprire chi ha un account. Il frontend 2.0 mostra lo stesso messaggio in entrambi i casi, ma l'API resta interrogabile | `routes/api/users/password/recover/index.js`                                               | Rispondere sempre `OK`                                                                          |
| S7  | Nessuna regola sulla password lato server (lunghezza minima, ecc.). Il frontend 2.0 chiede almeno 8 caratteri, ma è un controllo aggirabile                                                                        | `routes/api/users/password/reset/index.js`, `routes/api/users/signup/index.js`             | Definire la regola e applicarla nel backend                                                     |

## Configurazione per la 2.0

| #   | Richiesta                                                                                                             |
| --- | --------------------------------------------------------------------------------------------------------------------- |
| C1  | Aggiungere le origini del nuovo frontend (staging, beta, produzione, anteprime) a `CLIENTS_URL`                       |
| C2  | Aggiornare `FRONTEND_URL` e i percorsi dei link nelle email (conferma account, reset password) per le rotte della 2.0 |
| C3  | Esporre il WebSocket del task manager tramite Caddy e confermarne l'URL                                               |
| C4  | Confermare i limiti di upload in Caddy (Multer: 5 GiB per file)                                                       |
| C5  | Servire `play.epicentric.world` da un upstream Node (Nitro) al posto dei file statici                                 |

## Coerenza delle API

| #   | Osservazione                                                                                                                                                                     | Dove                                                                      |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| A1  | Gli errori applicativi rispondono con HTTP 200 e `Result: "KO"`; solo l'autenticazione usa il 401. Il client si basa sull'envelope                                               | `shared/classes/http/APIResponse.js`                                      |
| A2  | L'envelope non è uniforme: `application/ping` risponde `{ Result, UserQuery }` senza `Success` né `Data`                                                                         | `routes/api/application/ping/index.js`                                    |
| A3  | Il reset password con token sconosciuto o scaduto risponde con envelope di **successo** e `Data: "KO_INVALID_TOKEN"`. Il client lo tratta come errore                            | `routes/api/users/password/reset/index.js` (`Success(InvalidResetToken)`) |
| A4  | Il recupero password cerca l'email così com'è, mentre login e signup la portano in minuscolo: con maiuscole l'utente non viene trovato. Il client invia già l'email in minuscolo | `routes/api/users/password/recover/index.js`                              |
| A5  | Il link di reset scade dopo un'ora, ma il commento nel codice dice "1 giorno"                                                                                                    | `routes/api/users/password/recover/index.js`                              |
| A6  | Reset password senza `NewPassword` nel corpo: la richiesta va in errore non gestito                                                                                              | `routes/api/users/password/reset/index.js`                                |
