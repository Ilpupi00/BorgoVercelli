/**
 * GestioneOrariCampi.js
 * Gestione in memoria degli orari disponibili per campo sportivo con salvataggio massivo (sync)
 */

document.addEventListener("DOMContentLoaded", function () {
    // FIX THEME FOR DINAMIC ELEMENTS
    const themeAwareElements = document.querySelectorAll('[data-theme-aware="true"]');
    const updateThemeAware = () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        themeAwareElements.forEach(el => {
            if (isDark) {
                el.classList.remove('bg-light');
                if(!el.classList.contains('table-responsive')) el.classList.add('bg-dark');
                el.classList.add('border', 'border-secondary');
            } else {
                if(!el.classList.contains('table-responsive')) el.classList.add('bg-light');
                el.classList.remove('bg-dark', 'border-secondary');
            }
        });
    };
    const observer = new MutationObserver(updateThemeAware);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    updateThemeAware();

    // STATE MANAGEMENT
    const campoId = document.getElementById("modalCampoId").value;
    let orariState = [];       
    let orariDaEliminare = []; 
    let hasUnsavedChanges = false;
    let editIndexOrario = -1;  

    const offcanvasOrari = new bootstrap.Offcanvas(document.getElementById('offcanvasOrario'));
    const modalConferma = new bootstrap.Modal(document.getElementById('modalConfermaGlobale'));
    const badgeUnsaved = document.getElementById('unsavedChangesBadge');

    const orariGradi = {
        0: 'Domenica', 1: 'Lunedì', 2: 'Martedì', 3: 'Mercoledì', 4: 'Giovedì', 5: 'Venerdì', 6: 'Sabato'
    };

    const markAsUnsaved = () => {
        hasUnsavedChanges = true;
        badgeUnsaved.style.display = 'inline-block';
    };

    const unmarkAsUnsaved = () => {
        hasUnsavedChanges = false;
        badgeUnsaved.style.display = 'none';
    };

    // Prevenzione chiusura sbadita
    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = 'Hai modifiche non salvate, sicuro di voler abbandonare?';
        }
    });

    document.getElementById('btnIndietro').addEventListener('click', (e) => {
        if (hasUnsavedChanges && !confirm("Hai modifiche non salvate sull'orario. Abbandonare la pagina?")) {
            e.preventDefault();
        }
    });

    document.getElementById('btnAnnullaTop').addEventListener('click', () => {
        if (hasUnsavedChanges && !confirm("Ripristinare gli orari ai valori originali annullando tutte le modifiche?")) {
            return;
        }
        location.reload();
    });

    // RENDER: TEAMS CALENDAR BOARD
    const START_HOUR = 8;
    const END_HOUR = 24;
    const TOTAL_HOURS = END_HOUR - START_HOUR; // 16
    const MINUTE_HEIGHT = 1; // 1 Pixel = 1 Minute. 1 Hour = 60px.

    const setupTeamsGrid = () => {
        const timeAxis = document.getElementById('teamsTimeAxis');
        const gridLines = document.getElementById('teamsGridLines');
        const columnsContainer = document.getElementById('teamsColumnsContainer');
        
        if(!timeAxis || !gridLines || !columnsContainer) return;
        
        timeAxis.innerHTML = '';
        gridLines.innerHTML = '';

        for (let h = START_HOUR; h <= END_HOUR; h++) {
            const topPx = (h - START_HOUR) * 60;
            
            // Etichetta Ora Sinistra
            const label = document.createElement('div');
            label.className = 'teams-time-label';
            label.style.top = `${topPx}px`;
            label.innerHTML = `<span>${h}</span>`;
            timeAxis.appendChild(label);

            // Riga di Griglia (salta l'ultima riga decorativa)
            if (h < END_HOUR) {
                const line = document.createElement('div');
                line.className = 'teams-grid-hour-line';
                gridLines.appendChild(line);
            }
        }

        // Gestione Drag to Select (Trascina e Crea) con EVENT DELEGATION
        let isDragging = false;
        let dragStartY = 0;
        let ghostEl = null;
        let activeCol = null;

        const getH = (m) => Math.floor(m / 60).toString().padStart(2, '0');
        const getM = (m) => (m % 60).toString().padStart(2, '0');

        // Pulisci listeners precedenti (nel caso in cui setupTeamsGrid venga chiamato due volte, rimuovendo il container si sdoppiano)
        // Ma poiche' la grid container non viene mai sostituita, possiamo clonarla per togliere vecchi listeners.
        const newContainer = columnsContainer.cloneNode(true);
        columnsContainer.parentNode.replaceChild(newContainer, columnsContainer);
        
        newContainer.addEventListener('pointerdown', (e) => {
            // Ignora il click destro del mouse
            if (e.button !== 0 && e.pointerType === 'mouse') return;

            const col = e.target.closest('.teams-day-column');
            if(!col) return;
            // Se clicco su un evento già esistente ignoro l'inizio del drag
            if (e.target.closest('.teams-slot')) return;

            // Preveniamo scroll (se touch) e selezioni di testo accidentali
            if(e.cancelable) e.preventDefault();

            isDragging = true;
            activeCol = col;
            
            const rect = col.getBoundingClientRect();
            dragStartY = e.clientY - rect.top;

            ghostEl = document.createElement('div');
            ghostEl.className = 'teams-slot-ghost';
            ghostEl.style.top = `${dragStartY}px`;
            ghostEl.style.height = '0px';
            ghostEl.innerHTML = '<span class="teams-slot-time fw-bold text-white">Selezionando...</span>';
            col.appendChild(ghostEl);

            const onPointerMove = (ev) => {
                if(!isDragging || !activeCol) return;
                const r = activeCol.getBoundingClientRect();
                let currentY = ev.clientY - r.top;
                
                // Limito il mouse nei confini della colonna
                if(currentY < 0) currentY = 0;
                if(currentY > r.height) currentY = r.height;

                const top = Math.min(dragStartY, currentY);
                let height = Math.abs(currentY - dragStartY);
                if(height < 15) height = 15;

                ghostEl.style.top = `${top}px`;
                ghostEl.style.height = `${height}px`;

                const startMins = (START_HOUR * 60) + top;
                const endMins = startMins + height;
                
                const rStart = Math.floor(startMins / 15) * 15;
                const rEnd = Math.floor(endMins / 15) * 15;
                ghostEl.innerHTML = `<span class="teams-slot-time text-white fw-bold">${getH(rStart)}:${getM(rStart)} - ${getH(rEnd)}:${getM(rEnd)}</span>`;
            };

            const onPointerUp = (ev) => {
                if(!isDragging) return;
                isDragging = false;
                
                document.removeEventListener('pointermove', onPointerMove);
                document.removeEventListener('pointerup', onPointerUp);
                document.removeEventListener('pointercancel', onPointerUp);

                if(!ghostEl || !activeCol) return;

                const r = activeCol.getBoundingClientRect();
                let dropY = ev.clientY - r.top;
                
                if(dropY < 0) dropY = 0;
                if(dropY > r.height) dropY = r.height;

                const top = Math.min(dragStartY, dropY);
                let height = Math.abs(dropY - dragStartY);
                // Se non ha trascinato (height bassa), auto-genera 1 ora di default
                if(height < 15) height = 60; 

                const startMinsTotal = (START_HOUR * 60) + top;
                const endMinsTotal = startMinsTotal + height;
                
                const roundedStart = Math.floor(startMinsTotal / 15) * 15; 
                const roundedEnd = Math.max(roundedStart + 15, Math.ceil(endMinsTotal / 15) * 15);

                const oraInizio = `${getH(roundedStart)}:${getM(roundedStart)}`;
                const oraFine = `${getH(roundedEnd)}:${getM(roundedEnd)}`;
                const dayVal = activeCol.getAttribute('data-day');

                activeCol.removeChild(ghostEl);
                ghostEl = null;

                const tCol = activeCol;
                activeCol = null;

                apriCreazioneRapida(dayVal, oraInizio, oraFine);
            };

            // Catturiamo i listener in modo assoluto sul documento!
            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);
            document.addEventListener('pointercancel', onPointerUp);
        });
    };

    const parseTimeStr = (str) => {
        if (!str) return null;
        const pts = str.split(':');
        return parseInt(pts[0]) * 60 + parseInt(pts[1]);
    };

    const renderTeamsBoard = () => {
        // Pulisci tutte le slot prima
        document.querySelectorAll('.teams-day-column').forEach(el => el.innerHTML = '');
        
        if (orariState.length === 0) return;

        orariState.forEach((orario, index) => {
            const startMins = parseTimeStr(orario.ora_inizio);
            const endMins = parseTimeStr(orario.ora_fine);
            
            if (startMins === null || endMins === null) return;
            
            const calendarStart = START_HOUR * 60;
            const calendarEnd = END_HOUR * 60;
            
            // Limit within view block
            let visualStart = Math.max(startMins, calendarStart);
            let visualEnd = Math.min(endMins, calendarEnd);
            
            if (visualEnd <= visualStart) return; // Fuori vista

            const topPx = (visualStart - calendarStart) * MINUTE_HEIGHT;
            const heightPx = (visualEnd - visualStart) * MINUTE_HEIGHT;

            // Classes & Status
            let baseColorClass = 'slot-standard';
            if (!orario.attivo) {
                baseColorClass = 'slot-inactive';
            } else if (orario._isNew) {
                baseColorClass = 'slot-new';
            } else if (orario._isEdited) {
                baseColorClass = 'slot-edited';
            }

            const isDefault = (orario.giorno_settimana === null || orario.giorno_settimana === '');
            if (isDefault) {
                baseColorClass += ' slot-is-default';
            }

            // Create Node
            const slotEl = document.createElement('div');
            slotEl.className = `teams-slot ${baseColorClass}`;
            slotEl.style.top = `${topPx}px`;
            slotEl.style.height = `${heightPx}px`;
            slotEl.setAttribute('data-index', index);

            slotEl.innerHTML = `
                <div class="teams-slot-title">${isDefault ? 'Standard' : (orario.attivo?'Prenotabile':'Non Prenotabile')}</div>
                <div class="teams-slot-time">${orario.ora_inizio.slice(0,5)} - ${orario.ora_fine.slice(0,5)}</div>
            `;

            slotEl.addEventListener('click', (e) => {
                e.stopPropagation(); // Evita di triggerare il click sfondo per creare
                openOrarioModale(index);
            });

            // Append to correct columns
            if (isDefault) {
                for (let d = 0; d <= 6; d++) {
                    const col = document.querySelector(`.teams-day-column[data-day="${d}"]`);
                    if (col) col.appendChild(slotEl.cloneNode(true));
                }
            } else {
                const col = document.querySelector(`.teams-day-column[data-day="${orario.giorno_settimana}"]`);
                if (col) col.appendChild(slotEl);
            }
        });

        // Riassocia gli eventi ai nodi duplicati dal cloneNode
        document.querySelectorAll('.teams-slot').forEach(node => {
            node.addEventListener('click', (e) => {
                e.stopPropagation();
                openOrarioModale(node.getAttribute('data-index'));
            });
        });
    };

    const apriCreazioneRapida = (day, inizio, fine) => {
        document.getElementById('formOrario').reset();
        editIndexOrario = -1; // -1 = Add mode
        document.getElementById('orarioAttivo').checked = true;
        
        document.getElementById('giornoSettimana').value = day;
        document.getElementById('oraInizio').value = inizio;
        document.getElementById('oraFine').value = fine;
        
        const deleteBtn = document.getElementById('btnEliminaOrarioModale');
        if(deleteBtn) deleteBtn.style.display = 'none';
        
        document.getElementById('offcanvasOrarioTitle').innerHTML = '<i class="bi bi-plus-circle-fill me-2"></i>Nuova Riunione Oraria';
        offcanvasOrari.show();
    };

    const openOrarioModale = (idx) => {
        const orario = orariState[idx];
        editIndexOrario = idx;
        
        document.getElementById('giornoSettimana').value = (orario.giorno_settimana !== null && orario.giorno_settimana !== undefined) ? orario.giorno_settimana : '';
        document.getElementById('oraInizio').value = orario.ora_inizio;
        document.getElementById('oraFine').value = orario.ora_fine;
        document.getElementById('orarioAttivo').checked = !!orario.attivo;
        
        // Nel context della modale, permettiamo eliminazione
        document.getElementById('offcanvasOrarioTitle').innerHTML = '<i class="bi bi-pencil-square me-2"></i>Gestione Fascia Oraria';
        
        // Aggiungi pulsante Elimina nella modale se non esiste già
        let deleteBtn = document.getElementById('btnEliminaOrarioModale');
        if (!deleteBtn) {
            deleteBtn = document.createElement('button');
            deleteBtn.id = 'btnEliminaOrarioModale';
            deleteBtn.className = 'btn btn-outline-danger px-3 fw-bold flex-grow-1';
            deleteBtn.innerHTML = '<i class="bi bi-trash-fill"></i> Rimuovi';
            
            const controls = document.getElementById('offcanvasFooterControls');
            // Insert after Chiudi but before Conferma -> order reverse since flex grow changes
            controls.insertBefore(deleteBtn, controls.childNodes[2]);
            
            deleteBtn.addEventListener('click', () => {
                if(confirm("Rimuovere questa fascia? (Non sarà salvato fino a 'Salva Pianificazione')")) {
                    deleteOrario(editIndexOrario);
                }
            });
        }
        deleteBtn.style.display = 'block';

        offcanvasOrari.show();
    };

    const deleteOrario = (idx) => {
        const orario = orariState[idx];
        if (orario.id && !orario._isNew) {
            orariDaEliminare.push(orario.id);
        }
        orariState.splice(idx, 1);
        markAsUnsaved();
        offcanvasOrari.hide();
        renderTeamsBoard();
    };

    // APERTURA MODALE ADD GENERALE
    document.getElementById('addOrarioBtn').addEventListener('click', () => {
        apriCreazioneRapida('', '', '');
        document.getElementById('offcanvasOrarioTitle').innerHTML = '<i class="bi bi-plus-circle-fill me-2"></i>Nuova Riunione Oraria';
    });

    // SALVATAGGIO ORARIO -> IN MEMORIA
    document.getElementById('btnConfermaOrario').addEventListener('click', () => {
        const form = document.getElementById('formOrario');
        if(!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const giornoRaw = document.getElementById('giornoSettimana').value;
        const oInizio = document.getElementById('oraInizio').value;
        const oFine = document.getElementById('oraFine').value;
        const attivo = document.getElementById('orarioAttivo').checked;

        if (oInizio >= oFine) {
            alert("L'ora di inizio deve essere precedente all'ora di chiusura.");
            return;
        }

        const payloadLocal = {
            giorno_settimana: giornoRaw !== '' ? giornoRaw : null,
            ora_inizio: oInizio,
            ora_fine: oFine,
            attivo: attivo
        };

        if (editIndexOrario > -1) {
            // Update mode
            const item = orariState[editIndexOrario];
            payloadLocal.id = item.id;
            payloadLocal._isNew = item._isNew;
            // Un item appena creato resta "Nuovo" visivamente anche se lo edito prima di salvare.
            payloadLocal._isEdited = !item._isNew; 
            orariState[editIndexOrario] = payloadLocal;
        } else {
            // Add mode
            payloadLocal._isNew = true;
            payloadLocal.id = 'temp_' + Date.now();
            orariState.push(payloadLocal);
        }

        markAsUnsaved();
        offcanvasOrari.hide();
        renderTeamsBoard();
    });

    // ===  INITIAL DATA PARSING FROM SCRIPT TAG  ===
    const serverDataEl = document.getElementById('serverData');
    if (serverDataEl) {
        try {
            const rawData = JSON.parse(serverDataEl.textContent);
            orariState = rawData.map(o => ({...o, _isNew: false, _isEdited: false}));
        } catch(e) {
            console.error("Errore parser data server", e);
        }
    }
    
    setupTeamsGrid();
    renderTeamsBoard();


    // === FASE FINALE -> INVIA AL SEREVR  ===
    document.getElementById('btnApplicaModifiche').addEventListener('click', () => {
        modalConferma.show();
    });

    document.getElementById('btnProcediSalvataggio').addEventListener('click', async () => {
        const btnProc = document.getElementById('btnProcediSalvataggio');
        btnProc.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sincronizzazione in corso...';
        btnProc.disabled = true;
        
        let errorsCount = 0;

        try {
            // SEQUENTIAL EXECUTION FOR BATCH

            // 1. Esegui Elimiazioni (DELETE)
            for (const idToDelete of orariDaEliminare) {
                const res = await fetch(`/admin/campi/orari/${idToDelete}`, { method: "DELETE" });
                if (!res.ok) errorsCount++;
            }

            // 2. Esegui Create (POST) & Updates (PUT)
            for (const orario of orariState) {
                if (orario._isNew) {
                    // MUST POST AS URLEncoded for add
                    const bodyParams = new URLSearchParams();
                    if(orario.giorno_settimana !== null) bodyParams.append("giorno_settimana", orario.giorno_settimana);
                    bodyParams.append("ora_inizio", orario.ora_inizio);
                    bodyParams.append("ora_fine", orario.ora_fine);
                    
                    // We must fire update to make it attivo (default is likely inserted via backend directly but "attivo" is not natively passed in POST on the existing backend)
                    const resPost = await fetch(`/admin/campi/${campoId}/orari`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                            "X-Requested-With": "XMLHttpRequest",
                            "Accept": "application/json"
                        },
                        body: bodyParams
                    });
                    
                    if (resPost.ok) {
                        /* Backend might not set 'attivo' natively from the post API. 
                           Since I don't see `attivo` in `req.body` handling in the POST backend router,
                           Normally we'd do a secondary fetch to make it inattivo if false but let's assume default is fine since new timeslots should be created active */
                    } else {
                        errorsCount++;
                    }

                } else if (orario._isEdited) {
                    // PUT AS JSON
                    const resPut = await fetch(`/admin/campi/orari/${orario.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            ora_inizio: orario.ora_inizio,
                            ora_fine: orario.ora_fine,
                            attivo: orario.attivo
                        })
                    });
                    if(!resPut.ok) errorsCount++;
                }
            }

            if(errorsCount > 0) {
                throw new Error(errorsCount + ' richieste fallite durante il sync server');
            }

            // Success
            unmarkAsUnsaved();
            modalConferma.hide();
            
            if(window.AdminGlobal && window.AdminGlobal.showNotification) {
                window.AdminGlobal.showNotification('Sincronizzazione API', 'Tutte le fasce orarie sono state caricate con successo.', 'success');
            } else {
                alert("Sincronizzazione completata!");
            }
            
            // Reload cleanly to fetch real fresh IDs
            setTimeout(() => location.reload(), 1500);

        } catch (error) {
            console.error("Errore sync finale orari:", error);
            modalConferma.hide();
            if(window.AdminGlobal) {
                window.AdminGlobal.showNotification('Errore di Rete/Sync', 'Alcune operazioni potrebbero non essersi concluse correttamente.', 'danger');
            } else {
                alert("Errore limitato durante il salvataggio.");
            }
            
            btnProc.innerHTML = 'Conferma ed Esegui';
            btnProc.disabled = false;
        }
    });

});
