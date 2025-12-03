import ShowModal from '../utils/showModal.js';

class ScriviRecensione {
    constructor(page) {
        this.page = page;
        this.rating = 0;
        this.init();
    }

    init() {
        document.title = "Scrivi Recensione - A.S.D. Borgo Vercelli 2022";
        this.setupRatingStars();
        this.setupFormValidation();
        this.setupCharCounter();
        this.setupFormSubmission();
    }

    setupRatingStars() {
        const stars = this.page.querySelectorAll('#ratingStars i');
        stars.forEach(star => {
            star.addEventListener('click', (e) => {
                const rating = parseInt(e.target.getAttribute('data-rating'));
                this.setRating(rating);
            });
            star.addEventListener('mouseover', (e) => {
                const rating = parseInt(e.target.getAttribute('data-rating'));
                this.highlightStars(rating);
            });
            star.addEventListener('mouseout', () => {
                this.highlightStars(this.rating);
            });
        });
    }

    setRating(rating) {
        this.rating = rating;
        this.page.querySelector('#valutazione').value = rating;
        this.highlightStars(rating);
        this.validateRating();
    }

    highlightStars(rating) {
        const stars = this.page.querySelectorAll('#ratingStars i');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.remove('far');
                star.classList.add('fas', 'active');
            } else {
                star.classList.remove('fas', 'active');
                star.classList.add('far');
            }
        });
    }

    validateRating() {
        const ratingInput = this.page.querySelector('#valutazione');
        const isValid = this.rating > 0;
        ratingInput.setCustomValidity(isValid ? '' : 'Seleziona una valutazione');
        return isValid;
    }

    setupFormValidation() {
        const form = this.page.querySelector('#reviewForm');
        const inputs = form.querySelectorAll('input, textarea');

        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            input.addEventListener('input', () => {
                if (input.classList.contains('is-invalid')) {
                    this.validateField(input);
                }
            });
        });
    }

    validateField(field) {
        let isValid = true;
        const value = field.value.trim();

        if (field.hasAttribute('required') && !value) {
            isValid = false;
        }

        if (field.id === 'titolo' && value.length > 100) {
            isValid = false;
        }

        if (field.id === 'contenuto' && value.length > 500) {
            isValid = false;
        }

        field.classList.toggle('is-invalid', !isValid);
        field.classList.toggle('is-valid', isValid && value);

        return isValid;
    }

    setupCharCounter() {
        const textarea = this.page.querySelector('#contenuto');
        const counter = this.page.querySelector('#charCount');

        textarea.addEventListener('input', () => {
            const length = textarea.value.length;
            counter.textContent = `${length}/500`;
            counter.classList.toggle('text-danger', length > 500);
            counter.classList.toggle('text-success', length <= 500 && length > 0);
        });
    }

    setupFormSubmission() {
        const form = this.page.querySelector('#reviewForm');
        const submitBtn = this.page.querySelector('#submitBtn');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!this.validateForm()) {
                return;
            }

            // Controllo checkbox privacy
            const privacyCheckbox = this.page.querySelector('#recensione_privacy_accept');
            const privacyError = this.page.querySelector('#privacy_error_recensione');
            
            if (!privacyCheckbox.checked) {
                if (privacyError) {
                    privacyError.style.display = 'block';
                }
                ShowModal.showModalError('Devi accettare la Privacy Policy per inviare la recensione.', 'Privacy Policy Richiesta');
                return;
            }
            
            if (privacyError) {
                privacyError.style.display = 'none';
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Invio in corso...';

            try {
                const formData = new FormData(form);
                const data = {
                    valutazione: parseInt(formData.get('valutazione')),
                    titolo: formData.get('titolo').trim(),
                    contenuto: formData.get('contenuto').trim(),
                    entita_tipo: 'societa', // Per ora fisso
                    entita_id: 1 // Per ora fisso
                };

                const response = await fetch('/recensione', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    ShowModal.showModalSuccess('Recensione inviata con successo!', 'Grazie per il tuo feedback, la tua recensione è stata salvata.');
                    form.reset();
                    this.setRating(0);
                    this.page.querySelector('#charCount').textContent = '0/500';
                } else {
                    ShowModal.showModalError(result.error || 'Errore nell\'invio della recensione');
                }
            } catch (error) {
                console.error('Errore invio recensione:', error);
                ShowModal.showModalError('Errore di rete. Riprova più tardi.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Invia Recensione';
            }
        });
    }

    validateForm() {
        const form = this.page.querySelector('#reviewForm');
        const inputs = form.querySelectorAll('input, textarea');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        if (!this.validateRating()) {
            isValid = false;
        }

        return isValid;
    }
}

export default ScriviRecensione;