/**
 * Calendario Prenotazioni - Client-side Logic
 * Handles calendar rendering, navigation, filtering, and interactions
 */

(function() {
    'use strict';

    // State Management
    let state = {
        currentDate: new Date(),
        prenotazioni: [],
        campi: [],
        filters: {
            campo: '',
            stato: ''
        }
    };

    // DOM Elements
    const elements = {
        calendarDays: null,
        currentMonth: null,
        prevMonth: null,
        nextMonth: null,
        todayBtn: null,
        campoFilter: null,
        statoFilter: null,
        dayModal: null,
        modalTitle: null,
        modalBody: null,
        closeModal: null,
        themeToggle: null
    };

    // Initialize
    function init() {
        // Get data from window
        state.prenotazioni = window.prenotazioniData || [];
        state.campi = window.campiData || [];

        // Get DOM elements
        elements.calendarDays = document.getElementById('calendarDays');
        elements.currentMonth = document.getElementById('currentMonth');
        elements.prevMonth = document.getElementById('prevMonth');
        elements.nextMonth = document.getElementById('nextMonth');
        elements.todayBtn = document.getElementById('todayBtn');
        elements.campoFilter = document.getElementById('campoFilter');
        elements.statoFilter = document.getElementById('statoFilter');
        elements.dayModal = document.getElementById('dayModal');
        elements.modalTitle = document.getElementById('modalTitle');
        elements.modalBody = document.getElementById('modalBody');
        elements.closeModal = document.getElementById('closeModal');
        elements.themeToggle = document.getElementById('themeToggle');

        // Attach event listeners
        attachEventListeners();

        // Initial render
        renderCalendar();
    }

    // Attach Event Listeners
    function attachEventListeners() {
        if (elements.prevMonth) {
            elements.prevMonth.addEventListener('click', () => {
                state.currentDate.setMonth(state.currentDate.getMonth() - 1);
                renderCalendar();
            });
        }

        if (elements.nextMonth) {
            elements.nextMonth.addEventListener('click', () => {
                state.currentDate.setMonth(state.currentDate.getMonth() + 1);
                renderCalendar();
            });
        }

        if (elements.todayBtn) {
            elements.todayBtn.addEventListener('click', () => {
                state.currentDate = new Date();
                renderCalendar();
            });
        }

        if (elements.campoFilter) {
            elements.campoFilter.addEventListener('change', (e) => {
                state.filters.campo = e.target.value;
                renderCalendar();
            });
        }

        if (elements.statoFilter) {
            elements.statoFilter.addEventListener('change', (e) => {
                state.filters.stato = e.target.value;
                renderCalendar();
            });
        }

        if (elements.closeModal) {
            elements.closeModal.addEventListener('click', closeModal);
        }

        if (elements.dayModal) {
            elements.dayModal.addEventListener('click', (e) => {
                if (e.target === elements.dayModal) {
                    closeModal();
                }
            });
        }

        // Export modal
        const exportBtn = document.getElementById('exportReportBtn');
        const exportModal = document.getElementById('exportModal');
        const closeExportModal = document.getElementById('closeExportModal');
        const exportForm = document.getElementById('exportForm');

        if (exportBtn) {
            exportBtn.addEventListener('click', openExportModal);
        }

        if (closeExportModal) {
            closeExportModal.addEventListener('click', () => {
                exportModal.style.display = 'none';
            });
        }

        if (exportModal) {
            exportModal.addEventListener('click', (e) => {
                if (e.target === exportModal) {
                    exportModal.style.display = 'none';
                }
            });
        }

        if (exportForm) {
            exportForm.addEventListener('submit', handleExportSubmit);
        }

        // Theme toggle
        if (elements.themeToggle) {
            elements.themeToggle.addEventListener('click', toggleTheme);
            updateThemeIcon();
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.dayModal.style.display !== 'none') {
                closeModal();
            }
        });
    }

    // Theme Management
    function toggleTheme() {
        const currentTheme = localStorage.getItem('site-theme-preference') || 'auto';
        let newTheme;

        if (currentTheme === 'light') {
            newTheme = 'dark';
        } else if (currentTheme === 'dark') {
            newTheme = 'auto';
        } else {
            newTheme = 'light';
        }

        localStorage.setItem('site-theme-preference', newTheme);
        
        const effectiveTheme = newTheme === 'auto'
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : newTheme;
        
        document.documentElement.setAttribute('data-theme', effectiveTheme);
        updateThemeIcon();
    }

    function updateThemeIcon() {
        if (!elements.themeToggle) return;
        
        const currentTheme = localStorage.getItem('site-theme-preference') || 'auto';
        const icon = elements.themeToggle.querySelector('i');
        
        if (icon) {
            if (currentTheme === 'dark') {
                icon.className = 'bi bi-sun-fill';
            } else if (currentTheme === 'light') {
                icon.className = 'bi bi-moon-stars-fill';
            } else {
                icon.className = 'bi bi-circle-half';
            }
        }
    }

    // Render Calendar
    function renderCalendar() {
        const year = state.currentDate.getFullYear();
        const month = state.currentDate.getMonth();

        // Update month title
        const monthNames = [
            'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
            'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
        ];
        if (elements.currentMonth) {
            elements.currentMonth.textContent = `${monthNames[month]} ${year}`;
        }

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Get day of week (Monday = 0, Sunday = 6)
        let startDayOfWeek = firstDay.getDay() - 1;
        if (startDayOfWeek === -1) startDayOfWeek = 6;

        // Get previous month days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        
        // Clear calendar
        if (elements.calendarDays) {
            elements.calendarDays.innerHTML = '';
        }

        // Add previous month days
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const day = prevMonthLastDay - i;
            const dayElement = createDayElement(day, year, month - 1, true);
            elements.calendarDays.appendChild(dayElement);
        }

        // Add current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = createDayElement(day, year, month, false);
            elements.calendarDays.appendChild(dayElement);
        }

        // Add next month days to fill grid
        const totalCells = elements.calendarDays.children.length;
        const remainingCells = (7 - (totalCells % 7)) % 7;
        for (let day = 1; day <= remainingCells; day++) {
            const dayElement = createDayElement(day, year, month + 1, true);
            elements.calendarDays.appendChild(dayElement);
        }
    }

    // Create Day Element
    function createDayElement(day, year, month, isOtherMonth) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const date = new Date(year, month, day);
        const dateStr = formatDate(date);
        
        // Check if today
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        if (isToday) {
            dayElement.classList.add('today');
        }

        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }

        // Day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);

        // Get bookings for this day
        const bookings = getBookingsForDate(dateStr);
        
        if (bookings.length > 0) {
            dayElement.classList.add('has-bookings');
            
            const bookingsContainer = document.createElement('div');
            bookingsContainer.className = 'day-bookings';
            
            // Show up to 3 booking dots
            const maxDots = 3;
            bookings.slice(0, maxDots).forEach(booking => {
                const dot = document.createElement('div');
                dot.className = `booking-dot ${booking.stato}`;
                bookingsContainer.appendChild(dot);
            });
            
            dayElement.appendChild(bookingsContainer);
        }

        // Click handler
        if (!isOtherMonth) {
            dayElement.addEventListener('click', () => {
                showDayModal(date, bookings);
            });
        }

        return dayElement;
    }

    // Get Bookings for Date
    function getBookingsForDate(dateStr) {
        return state.prenotazioni.filter(p => {
            const prenotazioneDate = formatDate(new Date(p.data_prenotazione));
            
            // Apply filters
            if (state.filters.campo && p.campo_id != state.filters.campo) {
                return false;
            }
            if (state.filters.stato && p.stato !== state.filters.stato) {
                return false;
            }
            
            return prenotazioneDate === dateStr;
        });
    }

    // Format Date
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Format Date Italian
    function formatDateItalian(date) {
        const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
        const months = [
            'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
            'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'
        ];
        
        const dayName = days[date.getDay()];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        
        return `${dayName}, ${day} ${month} ${year}`;
    }

    // Show Day Modal
    function showDayModal(date, bookings) {
        if (!elements.dayModal || !elements.modalTitle || !elements.modalBody) return;

        // Set title
        elements.modalTitle.textContent = formatDateItalian(date);

        // Render bookings
        if (bookings.length === 0) {
            elements.modalBody.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-calendar-x"></i>
                    <p>Nessuna prenotazione per questo giorno</p>
                </div>
            `;
        } else {
            elements.modalBody.innerHTML = bookings.map(booking => {
                const statoLabel = {
                    'confermata': 'Confermata',
                    'in_attesa': 'In Attesa',
                    'annullata': 'Annullata',
                    'scaduta': 'Scaduta'
                };

                return `
                    <div class="booking-card ${booking.stato}">
                        <div class="booking-header">
                            <div class="booking-campo">${booking.campo_nome || 'Campo ' + booking.campo_id}</div>
                            <span class="booking-status ${booking.stato}">${statoLabel[booking.stato] || booking.stato}</span>
                        </div>
                        <div class="booking-details">
                            <div class="booking-detail">
                                <i class="bi bi-clock"></i>
                                <span>${booking.ora_inizio} - ${booking.ora_fine}</span>
                            </div>
                            ${booking.utente_nome ? `
                                <div class="booking-detail">
                                    <i class="bi bi-person"></i>
                                    <span>${booking.utente_nome} ${booking.utente_cognome || ''}</span>
                                </div>
                            ` : ''}
                            ${booking.squadra_nome ? `
                                <div class="booking-detail">
                                    <i class="bi bi-people"></i>
                                    <span>${booking.squadra_nome}</span>
                                </div>
                            ` : ''}
                            ${booking.tipo_attivita ? `
                                <div class="booking-detail">
                                    <i class="bi bi-tag"></i>
                                    <span>${booking.tipo_attivita}</span>
                                </div>
                            ` : ''}
                            ${booking.note ? `
                                <div class="booking-detail">
                                    <i class="bi bi-chat-left-text"></i>
                                    <span>${booking.note}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Show modal
        elements.dayModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    // Close Modal
    function closeModal() {
        if (elements.dayModal) {
            elements.dayModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    // Export Modal Functions
    function openExportModal() {
        const exportModal = document.getElementById('exportModal');
        const dataInizio = document.getElementById('dataInizio');
        const dataFine = document.getElementById('dataFine');
        
        // Set default dates - current week
        const today = new Date();
        const monday = new Date(today);
        monday.setDate(today.getDate() - today.getDay() + 1);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        dataInizio.value = monday.toISOString().split('T')[0];
        dataFine.value = sunday.toISOString().split('T')[0];
        
        exportModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    async function handleExportSubmit(e) {
        e.preventDefault();
        
        const dataInizio = document.getElementById('dataInizio').value;
        const dataFine = document.getElementById('dataFine').value;
        const campo = document.getElementById('campoExport').value;
        const stato = document.getElementById('statoExport').value;
        
        if (!dataInizio || !dataFine) {
            alert('Inserisci data inizio e data fine');
            return;
        }
        
        if (new Date(dataInizio) > new Date(dataFine)) {
            alert('La data di inizio deve essere precedente alla data di fine');
            return;
        }
        
        try {
            // Build query params
            const params = new URLSearchParams({
                dataInizio,
                dataFine
            });
            
            if (campo) params.append('campo', campo);
            if (stato) params.append('stato', stato);
            
            // Show loading
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Generazione in corso...';
            
            // Download file
            const response = await fetch(`/prenotazione/export-report?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error('Errore durante la generazione del report');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Report_Prenotazioni_${dataInizio}_${dataFine}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            // Close modal
            document.getElementById('exportModal').style.display = 'none';
            document.body.style.overflow = '';
            
            // Reset button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            
        } catch (error) {
            console.error('Errore export:', error);
            alert('Errore durante la generazione del report: ' + error.message);
            
            // Reset button
            const submitBtn = e.target.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-download me-2"></i>Scarica Report Excel';
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
