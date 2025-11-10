// crea_evento.js - Gestione della pagina di creazione/modifica eventi

document.addEventListener('DOMContentLoaded', function() {
    initializeFormValidation();
    initializeDateValidation();
    initializeQuill();
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

    // Converti FormData in oggetto
    const data = {};
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(data)
        });

        // Try to parse JSON, but be defensive in case server returned HTML
        let result = null;
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            result = await response.json();
        } else {
            // If not JSON, try to read text for debugging
            const text = await response.text();
            console.warn('Server returned non-JSON response:', text);
        }

        if (result && result.success) {
            // Mostra messaggio di successo
            showSuccessMessage(result.message || 'Salvataggio avvenuto con successo');
            // Reindirizza dopo un breve delay
            setTimeout(() => {
                window.location.href = result.redirectUrl || '/admin/eventi';
            }, 1500);
        } else if (result && !result.success) {
            showErrors([result.error || 'Errore durante il salvataggio']);
        } else if (response.redirected) {
            // In some environments redirect may be followed; ensure navigation
            window.location.href = response.url;
        } else {
            // No JSON and no redirect — show a generic success and suggest reload
            showSuccessMessage('Salvataggio completato.');
            setTimeout(() => {
                window.location.reload();
            }, 1500);
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

function initializeQuill() {
    // Primary editor
    const editorContainer = document.getElementById('editor-container');
    if (editorContainer && typeof Quill !== 'undefined') {
        window.quill1 = new Quill('#editor-container', {
            theme: 'snow',
            placeholder: 'Descrivi l\'evento...',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link'],
                    ['clean']
                ]
            }
        });

        // Set initial content
        const initialContent = editorContainer.getAttribute('data-initial-content');
        if (initialContent) {
            window.quill1.root.innerHTML = initialContent;
        }
    }

    // Secondary (brief) editor
    const editorContainer2 = document.getElementById('editor-container-2');
    if (editorContainer2 && typeof Quill !== 'undefined') {
        window.quill2 = new Quill('#editor-container-2', {
            theme: 'snow',
            placeholder: 'Breve descrizione...',
            modules: {
                toolbar: [
                    ['bold', 'italic'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link'],
                    ['clean']
                ]
            }
        });

        const initialContent2 = editorContainer2.getAttribute('data-initial-content');
        if (initialContent2) {
            window.quill2.root.innerHTML = initialContent2;
        }
    }
}

// Funzione globale per submit del form (chiamata dall'HTML)
function submitQuillContent() {
    let submitted = false;

    const descrizioneTextarea = document.getElementById('descrizione');
    if (descrizioneTextarea && typeof window.quill1 !== 'undefined') {
        descrizioneTextarea.value = window.quill1.root.innerHTML;
        submitted = true;
    }

    const descrizioneBreveTextarea = document.getElementById('descrizione_breve');
    if (descrizioneBreveTextarea && typeof window.quill2 !== 'undefined') {
        descrizioneBreveTextarea.value = window.quill2.root.innerHTML;
        submitted = true;
    }

    return submitted;
}