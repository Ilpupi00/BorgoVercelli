
# Sito Borgo Vercelli

Sito ufficiale per la società sportiva Borgo Vercelli, pensato per connettere atleti, appassionati, staff e la comunità locale.  
La piattaforma favorisce la collaborazione, la prenotazione di campi, la condivisione di eventi e notizie, e la crescita sportiva e sociale.

🌍 **Visione**  
"Collegare la comunità sportiva locale — democratizzando l’accesso a eventi, risorse e opportunità."

🚀 **Missione Principale**
- Connettere atleti, staff e tifosi
- Facilitare la prenotazione e la gestione degli spazi sportivi
- Promuovere eventi e iniziative
- Favorire la condivisione di esperienze e feedback

🎯 **Obiettivi Chiave**
- 🧑‍🤝‍🧑 Networking sportivo locale
	- Connessioni tra giocatori, squadre e società
	- Collaborazioni e iniziative condivise
- 📚 Strumenti collaborativi
	- Prenotazione campi online
	- Galleria fotografica e condivisione media
	- Sistema di recensioni e feedback
- 🧠 Condivisione di notizie e risorse
	- Pubblicazione di comunicati e aggiornamenti
	- Gestione eventi e calendario
- 🎓 Sviluppo sportivo e sociale
	- Profilazione utenti e squadre
	- Tracciamento attività e risultati

👥 **Destinatari**
| Tipo Utente   | Descrizione                        |
|---------------|------------------------------------|
| 🏃‍♂️ Atleti      | Giocatori di tutte le età           |
| 🧑‍💼 Staff       | Allenatori, dirigenti, organizzatori|
| 🏟️ Società      | Club sportivi, associazioni         |
| 👨‍👩‍👧‍👦 Comunità  | Tifosi, famiglie, volontari         |

🔧 **Funzionalità Principali**
- 👤 Profili utente e squadra
- 📅 Gestione eventi e prenotazioni
- 🖼️ Galleria immagini
- 📰 Feed notizie e comunicati
- 💬 Recensioni e feedback
- 🔔 Notifiche e raccomandazioni

🛠️ **Stack Tecnologico**
| Layer      | Stack                                 |
|------------|---------------------------------------|
| Frontend   | HTML, CSS, JavaScript, EJS            |
| Backend    | Node.js, Express.js                   |
| Database   | SQLite                                |
| Container  | Docker, Docker Compose                |
| Autenticazione | Middleware custom                  |
| Styling    | CSS, animazioni, responsive design    |

🧩 **Principi di Design**
- ♿ Accessibilità per tutti
- 📱 Mobile-first, responsive
- ⚡ Ottimizzazione delle performance
- 🧭 UX intuitiva e sportiva

🧬 **Valore Unico**
- Focus sulla comunità sportiva locale
- Strumenti integrati per la gestione eventi e prenotazioni
- Esperienza utente personalizzata per atleti e staff

🛠️ **Roadmap**
- ✅ Fase 1: Fondamenta (In corso)
	- Sistema utenti, prenotazioni, galleria, notizie
- 🔄 Fase 2: Espansione
	- Notifiche smart, statistiche, gestione avanzata squadre
- 🌍 Fase 3: Apertura
	- Multi-lingua, partnership con altre società
- 🧠 Fase 4: Innovazione
	- Integrazione AI per suggerimenti e analisi

📊 **Obiettivi di Impatto**
| Goal                | Metriche Esempio                |
|---------------------|---------------------------------|
| 🌱 Inclusione       | Accesso per tutti, eventi aperti |
| 🏆 Crescita sportiva| Nuovi iscritti, risultati squadre|
| 🌍 Comunità         | Partecipazione eventi, feedback  |

📄 **Licenza**  
MIT License © 2025 [Borgo Vercelli Team]


## API

L'applicazione espone alcune API REST per la gestione delle funzionalità principali:

- **Autenticazione**
	- `POST /login` — Login utente
	- `POST /register` — Registrazione nuovo utente
- **Prenotazioni**
	- `GET /prenotazione` — Elenco prenotazioni
	- `POST /prenotazione` — Nuova prenotazione
- **Eventi**
	- `GET /eventi` — Elenco eventi
	- `POST /eventi` — Creazione evento
- **Notizie**
	- `GET /notizie` — Elenco notizie
	- `POST /notizie` — Pubblicazione notizia
- **Recensioni**
	- `GET /recensioni` — Elenco recensioni
	- `POST /recensioni` — Nuova recensione

Per dettagli e parametri consulta la documentazione interna delle route.

## Credits

- Progetto sviluppato da **Ilpupi00** e collaboratori
- Ispirazione grafica e strutturale da progetti open source e community sportiva
- Ringraziamenti a tutti i membri della società Borgo Vercelli
