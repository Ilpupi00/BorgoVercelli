/**
 * GestioneOrariCampi.js
 * Planning board orari campo sportivo — drag-to-select con Pointer Events
 */

document.addEventListener("DOMContentLoaded", function () {

    // =========== STATE ===========
    const campoId = document.getElementById("modalCampoId").value;
    let orariState = [];
    let orariDaEliminare = [];
    let hasUnsavedChanges = false;
    let editIndexOrario = -1;

    const offcanvasOrari = new bootstrap.Offcanvas(document.getElementById('offcanvasOrario'));
    const modalConferma  = new bootstrap.Modal(document.getElementById('modalConfermaGlobale'));
    const badgeUnsaved   = document.getElementById('unsavedChangesBadge');

    const markAsUnsaved   = () => { hasUnsavedChanges = true;  badgeUnsaved.style.display = 'inline-block'; };
    const unmarkAsUnsaved = () => { hasUnsavedChanges = false; badgeUnsaved.style.display = 'none'; };

    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedChanges) { e.preventDefault(); e.returnValue = ''; }
    });
    document.getElementById('btnIndietro').addEventListener('click', (e) => {
        if (hasUnsavedChanges && !confirm("Hai modifiche non salvate. Abbandonare?")) e.preventDefault();
    });
    document.getElementById('btnAnnullaTop').addEventListener('click', () => {
        if (hasUnsavedChanges && !confirm("Ripristinare gli orari originali? Tutte le modifiche andranno perse.")) return;
        location.reload();
    });

    // =========== COSTANTI ===========
    const START_HOUR = 8;
    const END_HOUR   = 24;
    const getH = (m) => Math.floor(m / 60).toString().padStart(2, '0');
    const getM = (m) => (m % 60).toString().padStart(2, '0');

    // =========== SETUP GRIGLIA (eseguito ONCE) ===========
    const setupTeamsGrid = () => {
        const timeAxis  = document.getElementById('teamsTimeAxis');
        const gridLines = document.getElementById('teamsGridLines');
        if (!timeAxis || !gridLines) return;

        timeAxis.innerHTML  = '';
        gridLines.innerHTML = '';

        for (let h = START_HOUR; h <= END_HOUR; h++) {
            const topPx = (h - START_HOUR) * 60;

            // Label ora
            const label = document.createElement('div');
            label.className = 'teams-time-label';
            label.style.top = `${topPx}px`;
            label.innerHTML = `<span>${String(h).padStart(2,'0')}:00</span>`;
            timeAxis.appendChild(label);

            // Linea griglia
            if (h < END_HOUR) {
                const line = document.createElement('div');
                line.className = 'teams-grid-hour-line';
                gridLines.appendChild(line);
            }
        }

        // ===== DRAG-TO-SELECT =====
        // IMPORTANTE: attacchiamo i listener sul teamsColumnsContainer  che NON viene mai
        // distrutto/ricreato. renderTeamsBoard() svuota solo l'INTERNO delle colonne (.innerHTML='').
        // Usiamo event delegation: un unico pointerdown sul container cattura tutti i click sulle colonne.
        const container = document.getElementById('teamsColumnsContainer');
        if (!container) return;

        let isDragging      = false;  // drag su area vuota (crea)
        let isMovingSlot    = false;  // drag su slot esistente (sposta)
        let dragStartY      = 0;
        let slotDragOffsetY = 0;      // distanza click dall'inizio dello slot
        let movingIndex     = -1;     // indice in orariState dello slot che sto spostando
        let ghostEl         = null;
        let activeCol       = null;
        let capturedPointerId = null;

        container.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;

            const col  = e.target.closest('.teams-day-column');
            if (!col) return;

            const slot = e.target.closest('.teams-slot');

            e.preventDefault();
            capturedPointerId = e.pointerId;
            try { container.setPointerCapture(e.pointerId); } catch(_) {}

            const colRect = col.getBoundingClientRect();

            if (slot) {
                // ===== MODALITÀ SPOSTA SLOT ESISTENTE =====
                isMovingSlot = true;
                activeCol    = col;
                movingIndex  = parseInt(slot.getAttribute('data-index'));

                const slotRect     = slot.getBoundingClientRect();
                const slotTopInCol = slotRect.top - colRect.top;
                slotDragOffsetY    = e.clientY - slotRect.top; // offset dal top dello slot

                const orario     = orariState[movingIndex];
                const startMins  = parseTimeStr(orario.ora_inizio);
                const endMins    = parseTimeStr(orario.ora_fine);
                const slotHeight = Math.max((endMins - startMins), 20);

                // Crea ghost della stessa dimensione dello slot
                ghostEl = document.createElement('div');
                ghostEl.className  = 'teams-slot-ghost';
                ghostEl.style.top    = `${slotTopInCol}px`;
                ghostEl.style.height = `${slotHeight}px`;
                ghostEl.innerHTML  = `<span class="ghost-time">${(orario.ora_inizio||'').slice(0,5)} – ${(orario.ora_fine||'').slice(0,5)}</span>`;
                col.appendChild(ghostEl);

                // Rendi lo slot originale semitrasparente
                slot.style.opacity = '0.3';

            } else {
                // ===== MODALITÀ CREA NUOVO SLOT =====
                isDragging = true;
                activeCol  = col;
                dragStartY = e.clientY - colRect.top;
                if (dragStartY < 0) dragStartY = 0;

                ghostEl = document.createElement('div');
                ghostEl.className    = 'teams-slot-ghost';
                ghostEl.style.top    = `${dragStartY}px`;
                ghostEl.style.height = '4px';
                ghostEl.innerHTML    = `<span class="ghost-time">Selezionando...</span>`;
                col.appendChild(ghostEl);
            }
        });

        container.addEventListener('pointermove', (e) => {
            if (!ghostEl || !activeCol) return;
            if (e.pointerId !== capturedPointerId) return;

            const colRect = activeCol.getBoundingClientRect();

            if (isMovingSlot && movingIndex > -1) {
                // ===== MOVE: sposta il ghost mantenendo la stessa altezza =====
                const orario     = orariState[movingIndex];
                const startMins  = parseTimeStr(orario.ora_inizio);
                const endMins    = parseTimeStr(orario.ora_fine);
                const slotHeight = Math.max((endMins - startMins), 20);

                let newTopY = (e.clientY - colRect.top) - slotDragOffsetY;
                if (newTopY < 0) newTopY = 0;
                if (newTopY + slotHeight > colRect.height) newTopY = colRect.height - slotHeight;

                ghostEl.style.top    = `${newTopY}px`;
                ghostEl.style.height = `${slotHeight}px`;

                const newStartMins = (START_HOUR * 60) + newTopY;
                const newEndMins   = newStartMins + slotHeight;
                const rStart = Math.round(newStartMins / 15) * 15;
                const rEnd   = rStart + (endMins - startMins);
                ghostEl.innerHTML = `<span class="ghost-time">${getH(rStart)}:${getM(rStart)} – ${getH(rEnd)}:${getM(rEnd)}</span>`;

            } else if (isDragging) {
                // ===== CREATE: ridimensiona il ghost =====
                let currentY = e.clientY - colRect.top;
                if (currentY < 0) currentY = 0;
                if (currentY > colRect.height) currentY = colRect.height;

                const top    = Math.min(dragStartY, currentY);
                const height = Math.max(Math.abs(currentY - dragStartY), 4);

                ghostEl.style.top    = `${top}px`;
                ghostEl.style.height = `${height}px`;

                const startMins = (START_HOUR * 60) + top;
                const endMins   = startMins + height;
                const rStart    = Math.floor(startMins / 15) * 15;
                const rEnd      = Math.ceil(endMins   / 15) * 15;
                ghostEl.innerHTML = `<span class="ghost-time">${getH(rStart)}:${getM(rStart)} – ${getH(rEnd)}:${getM(rEnd)}</span>`;
            }
        });

        const resetDrag = () => {
            isDragging = false; isMovingSlot = false;
            movingIndex = -1;   capturedPointerId = null;
            if (ghostEl) { ghostEl.remove(); ghostEl = null; }
            // Ripristina opacità slot
            document.querySelectorAll('.teams-slot').forEach(s => s.style.opacity = '');
            activeCol = null;
        };

        const endDrag = (e) => {
            if (!isDragging && !isMovingSlot) return;
            if (e.pointerId !== capturedPointerId) return;

            try { container.releasePointerCapture(e.pointerId); } catch(_) {}

            const colRect = activeCol.getBoundingClientRect();

            if (isMovingSlot && movingIndex > -1) {
                // ===== FINE MOVE: aggiorna l'orariState =====
                const orario    = orariState[movingIndex];
                const startMins = parseTimeStr(orario.ora_inizio);
                const endMins   = parseTimeStr(orario.ora_fine);
                const duration  = endMins - startMins;

                let newTopY = (e.clientY - colRect.top) - slotDragOffsetY;
                if (newTopY < 0) newTopY = 0;

                const newStartMinsRaw = (START_HOUR * 60) + newTopY;
                const roundedStart    = Math.round(newStartMinsRaw / 15) * 15;
                const roundedEnd      = roundedStart + duration;

                // Aggiorna lo stato in memoria
                orariState[movingIndex] = {
                    ...orario,
                    ora_inizio: `${getH(roundedStart)}:${getM(roundedStart)}`,
                    ora_fine:   `${getH(roundedEnd)}:${getM(roundedEnd)}`,
                    _isEdited:  !orario._isNew
                };

                markAsUnsaved();
                resetDrag();
                renderTeamsBoard();

            } else if (isDragging) {
                // ===== FINE CREATE =====
                let dropY  = e.clientY - colRect.top;
                if (dropY < 0) dropY = 0;
                if (dropY > colRect.height) dropY = colRect.height;

                const top    = Math.min(dragStartY, dropY);
                let   height = Math.abs(dropY - dragStartY);
                if (height < 15) height = 60;

                const startMinsTotal = (START_HOUR * 60) + top;
                const endMinsTotal   = startMinsTotal + height;
                const roundedStart   = Math.floor(startMinsTotal / 15) * 15;
                const roundedEnd     = Math.max(roundedStart + 15, Math.ceil(endMinsTotal / 15) * 15);

                const oraInizio = `${getH(roundedStart)}:${getM(roundedStart)}`;
                const oraFine   = `${getH(roundedEnd)}:${getM(roundedEnd)}`;
                const dayVal    = activeCol.getAttribute('data-day');

                resetDrag();
                apriCreazioneRapida(dayVal, oraInizio, oraFine);
            } else {
                resetDrag();
            }
        };

        container.addEventListener('pointerup',     endDrag);
        container.addEventListener('pointercancel', resetDrag);

        // Fix per prevent-default su touchmove (blocca scroll)
        container.addEventListener('touchmove', (e) => { if (isDragging) e.preventDefault(); }, { passive: false });
    };

    // =========== RENDER BOARD ===========
    const parseTimeStr = (str) => {
        if (!str) return null;
        const pts = str.split(':');
        return parseInt(pts[0]) * 60 + parseInt(pts[1]);
    };

    const renderTeamsBoard = () => {
        document.querySelectorAll('.teams-day-column').forEach(el => el.innerHTML = '');
        if (orariState.length === 0) return;

        orariState.forEach((orario, index) => {
            const startMins = parseTimeStr(orario.ora_inizio);
            const endMins   = parseTimeStr(orario.ora_fine);
            if (startMins === null || endMins === null) return;

            const calStart = START_HOUR * 60;
            const calEnd   = END_HOUR   * 60;
            const visStart = Math.max(startMins, calStart);
            const visEnd   = Math.min(endMins,   calEnd);
            if (visEnd <= visStart) return;

            const topPx    = visStart - calStart;
            const heightPx = Math.max(visEnd - visStart, 20);

            let colorClass = 'slot-standard';
            if (!orario.attivo)      colorClass = 'slot-inactive';
            else if (orario._isNew)  colorClass = 'slot-new';
            else if (orario._isEdited) colorClass = 'slot-edited';

            const isDefault  = (orario.giorno_settimana === null || orario.giorno_settimana === '');
            const slotTitle  = isDefault ? 'Tutti i giorni' : (orario.attivo ? 'Prenotabile' : 'Non Disponibile');
            const timeLabel  = `${(orario.ora_inizio||'').slice(0,5)} – ${(orario.ora_fine||'').slice(0,5)}`;

            const makeSlot = (idx) => {
                const el = document.createElement('div');
                el.className = `teams-slot ${colorClass}`;
                el.style.top    = `${topPx}px`;
                el.style.height = `${heightPx}px`;
                el.setAttribute('data-index', idx);
                el.innerHTML = `<div class="slot-title">${slotTitle}</div><div class="slot-time">${timeLabel}</div>`;
                el.addEventListener('click', (ev) => { ev.stopPropagation(); openOrarioModale(idx); });
                return el;
            };

            if (isDefault) {
                for (let d = 0; d <= 6; d++) {
                    const col = document.querySelector(`.teams-day-column[data-day="${d}"]`);
                    if (col) col.appendChild(makeSlot(index));
                }
            } else {
                const col = document.querySelector(`.teams-day-column[data-day="${orario.giorno_settimana}"]`);
                if (col) col.appendChild(makeSlot(index));
            }
        });
    };

    // =========== OFFCANVAS ===========
    const apriCreazioneRapida = (day, inizio, fine) => {
        document.getElementById('formOrario').reset();
        editIndexOrario = -1;
        document.getElementById('orarioAttivo').checked = true;
        document.getElementById('giornoSettimana').value = (day !== null && day !== undefined) ? day : '';
        document.getElementById('oraInizio').value = inizio;
        document.getElementById('oraFine').value   = fine;
        const deleteBtn = document.getElementById('btnEliminaOrarioModale');
        if (deleteBtn) deleteBtn.style.display = 'none';
        document.getElementById('offcanvasOrarioTitle').innerHTML = '<i class="bi bi-plus-circle-fill me-2"></i>Nuova Fascia Oraria';
        offcanvasOrari.show();
    };

    const openOrarioModale = (idx) => {
        const orario = orariState[parseInt(idx)];
        editIndexOrario = parseInt(idx);
        document.getElementById('giornoSettimana').value = (orario.giorno_settimana !== null && orario.giorno_settimana !== undefined) ? orario.giorno_settimana : '';
        document.getElementById('oraInizio').value       = (orario.ora_inizio || '').slice(0, 5);
        document.getElementById('oraFine').value         = (orario.ora_fine   || '').slice(0, 5);
        document.getElementById('orarioAttivo').checked  = !!orario.attivo;
        document.getElementById('offcanvasOrarioTitle').innerHTML = '<i class="bi bi-pencil-square me-2"></i>Modifica Fascia';

        let deleteBtn = document.getElementById('btnEliminaOrarioModale');
        if (!deleteBtn) {
            deleteBtn = document.createElement('button');
            deleteBtn.id        = 'btnEliminaOrarioModale';
            deleteBtn.className = 'btn btn-outline-danger px-3 fw-bold flex-grow-1';
            deleteBtn.innerHTML = '<i class="bi bi-trash-fill"></i> Rimuovi';
            document.getElementById('offcanvasFooterControls').insertBefore(deleteBtn, document.getElementById('offcanvasFooterControls').firstChild);
            deleteBtn.addEventListener('click', () => {
                if (confirm("Rimuovere questa fascia? Sarà definitivo solo al salvataggio.")) deleteOrario(editIndexOrario);
            });
        }
        deleteBtn.style.display = 'block';
        offcanvasOrari.show();
    };

    const deleteOrario = (idx) => {
        const orario = orariState[idx];
        if (orario.id && !orario._isNew) orariDaEliminare.push(orario.id);
        orariState.splice(idx, 1);
        markAsUnsaved();
        offcanvasOrari.hide();
        renderTeamsBoard();
    };

    document.getElementById('addOrarioBtn').addEventListener('click', () => apriCreazioneRapida('', '', ''));

    document.getElementById('btnConfermaOrario').addEventListener('click', () => {
        const form = document.getElementById('formOrario');
        if (!form.checkValidity()) { form.reportValidity(); return; }

        const giornoRaw = document.getElementById('giornoSettimana').value;
        const oInizio   = document.getElementById('oraInizio').value;
        const oFine     = document.getElementById('oraFine').value;
        const attivo    = document.getElementById('orarioAttivo').checked;

        if (oInizio >= oFine) { alert("L'ora di inizio deve essere precedente all'ora di chiusura."); return; }

        const payload = {
            giorno_settimana: giornoRaw !== '' ? giornoRaw : null,
            ora_inizio: oInizio, ora_fine: oFine, attivo
        };

        if (editIndexOrario > -1) {
            const item = orariState[editIndexOrario];
            payload.id = item.id;
            payload._isNew    = item._isNew;
            payload._isEdited = !item._isNew;
            orariState[editIndexOrario] = payload;
        } else {
            payload._isNew = true;
            payload.id     = 'temp_' + Date.now();
            orariState.push(payload);
        }

        markAsUnsaved();
        offcanvasOrari.hide();
        renderTeamsBoard();
    });

    // =========== CARICAMENTO DATI ===========
    const serverDataEl = document.getElementById('serverData');
    if (serverDataEl) {
        try {
            orariState = JSON.parse(serverDataEl.textContent).map(o => ({ ...o, _isNew: false, _isEdited: false }));
        } catch(e) { console.error("Errore parse serverData", e); }
    }

    setupTeamsGrid();
    renderTeamsBoard();

    // =========== SALVATAGGIO FINALE ===========
    document.getElementById('btnApplicaModifiche').addEventListener('click', () => modalConferma.show());

    document.getElementById('btnProcediSalvataggio').addEventListener('click', async () => {
        const btn = document.getElementById('btnProcediSalvataggio');
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sincronizzazione...';
        btn.disabled = true;

        let errors = 0;
        try {
            for (const id of orariDaEliminare) {
                const r = await fetch(`/admin/campi/orari/${id}`, { method: 'DELETE' });
                if (!r.ok) errors++;
            }
            for (const o of orariState) {
                if (o._isNew) {
                    const body = new URLSearchParams();
                    if (o.giorno_settimana !== null) body.append('giorno_settimana', o.giorno_settimana);
                    body.append('ora_inizio', o.ora_inizio);
                    body.append('ora_fine',   o.ora_fine);
                    const r = await fetch(`/admin/campi/${campoId}/orari`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' },
                        body
                    });
                    if (!r.ok) errors++;
                } else if (o._isEdited) {
                    const r = await fetch(`/admin/campi/orari/${o.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ora_inizio: o.ora_inizio, ora_fine: o.ora_fine, attivo: o.attivo })
                    });
                    if (!r.ok) errors++;
                }
            }
            if (errors > 0) throw new Error(`${errors} richieste fallite`);

            unmarkAsUnsaved();
            modalConferma.hide();
            if (window.AdminGlobal?.showNotification) {
                AdminGlobal.showNotification('Salvato!', 'Tutte le fasce orarie salvate con successo.', 'success');
            }
            setTimeout(() => location.reload(), 1500);
        } catch(err) {
            console.error(err);
            modalConferma.hide();
            if (window.AdminGlobal?.showNotification) {
                AdminGlobal.showNotification('Errore', 'Alcune operazioni non completate.', 'danger');
            }
            btn.innerHTML = 'Conferma ed Esegui';
            btn.disabled  = false;
        }
    });
});
