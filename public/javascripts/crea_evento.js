// crea_evento.js - Gestione della pagina di creazione/modifica eventi

document.addEventListener('DOMContentLoaded', function() {
    initializeFormValidation();
    initializeDateValidation();
});

function initializeFormValidation() {
    const form = document.getElementById('eventoForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleFormSubmit(e);
    });
}

async function handleFormSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
        return false;
    }

    // Trasferisci il contenuto di Quill al textarea
    submitQuillContent();

    const form = document.getElementById('eventoForm');
    const formData = new FormData(form);
    const method = formData.get('_method') || 'POST';

    // Determina l'URL
    let url = '/evento/nuovo';
    if (method === 'PUT') {
        const eventoId = form.getAttribute('data-evento-id');
        url = `/evento/${eventoId}`;
    }

    try {
        const response = await fetch(url, {
            method: method,
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        const result = await response.json();

        if (result.success) {
            // Mostra messaggio di successo
            showSuccessMessage(result.message);
            // Reindirizza dopo un breve delay
            setTimeout(() => {
                window.location.href = '/admin/eventi';
            }, 1500);
        } else {
            showErrors([result.error || 'Errore durante il salvataggio']);
        }
    } catch (error) {
        console.error('Errore:', error);
        showErrors(['Errore di connessione. Riprova più tardi.']);
    }

    return false;
}

function validateForm() {
    let isValid = true;
    const errors = [];

    // Validazione titolo
    const titolo = document.getElementById('titolo').value.trim();
    if (!titolo) {
        errors.push('Il titolo è obbligatorio');
        highlightField('titolo');
        isValid = false;
    } else {
        clearFieldHighlight('titolo');
    }

    // Validazione data inizio
    const dataInizio = document.getElementById('data_inizio').value;
    if (!dataInizio) {
        errors.push('La data e ora di inizio sono obbligatorie');
        highlightField('data_inizio');
        isValid = false;
    } else {
        clearFieldHighlight('data_inizio');
    }

    // Validazione data fine (se presente)
    const dataFine = document.getElementById('data_fine').value;
    if (dataFine && new Date(dataFine) <= new Date(dataInizio)) {
        errors.push('La data di fine deve essere successiva alla data di inizio');
        highlightField('data_fine');
        isValid = false;
    } else if (dataFine) {
        clearFieldHighlight('data_fine');
    }

    // Validazione luogo
    const luogo = document.getElementById('luogo').value.trim();
    if (!luogo) {
        errors.push('Il luogo è obbligatorio');
        highlightField('luogo');
        isValid = false;
    } else {
        clearFieldHighlight('luogo');
    }

    // Validazione max partecipanti
    const maxPartecipanti = document.getElementById('max_partecipanti').value;
    if (maxPartecipanti && (isNaN(maxPartecipanti) || parseInt(maxPartecipanti) < 0)) {
        errors.push('Il numero massimo di partecipanti deve essere un numero positivo');
        highlightField('max_partecipanti');
        isValid = false;
    } else if (maxPartecipanti) {
        clearFieldHighlight('max_partecipanti');
    }

    // Mostra errori
    if (!isValid) {
        showErrors(errors);
    } else {
        hideErrors();
    }

    return isValid;
}

function initializeDateValidation() {
    const dataInizioInput = document.getElementById('data_inizio');
    const dataFineInput = document.getElementById('data_fine');

    if (dataInizioInput && dataFineInput) {
        dataInizioInput.addEventListener('change', function() {
            const dataInizio = new Date(this.value);
            const dataFine = new Date(dataFineInput.value);

            if (dataFine && dataFine <= dataInizio) {
                dataFineInput.min = this.value;
                if (new Date(dataFineInput.value) <= dataInizio) {
                    dataFineInput.value = '';
                }
            }
        });
    }
}

function highlightField(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.classList.add('is-invalid');
    }
}

function clearFieldHighlight(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.classList.remove('is-invalid');
    }
}

function showErrors(errors) {
    hideErrors();

    const form = document.querySelector('form');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger animate__animated animate__shakeX';
    errorDiv.innerHTML = '<i class="bi bi-exclamation-triangle me-2"></i>' + errors.join('<br>');

    form.insertBefore(errorDiv, form.firstChild);
}

function hideErrors() {
    const existingErrors = document.querySelectorAll('.alert-danger');
    existingErrors.forEach(error => error.remove());
}

function showSuccessMessage(message) {
    hideErrors();

    const form = document.getElementById('eventoForm');
    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success animate__animated animate__fadeIn';
    successDiv.innerHTML = '<i class="bi bi-check-circle me-2"></i>' + message;

    form.insertBefore(successDiv, form.firstChild);

    // Rimuovi il messaggio dopo 3 secondi
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// Funzione globale per submit del form (chiamata dall'HTML)
function submitQuillContent() {
    const descrizioneTextarea = document.getElementById('descrizione');
    if (descrizioneTextarea && typeof quill !== 'undefined') {
        descrizioneTextarea.value = quill.root.innerHTML;
        return true;
    }
    return false;
}