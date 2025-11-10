/**
 * Statistiche.js
 * Gestione dashboard statistiche con Chart.js - Dati Reali dal Database
 */

class StatisticheManager {
    constructor() {
        this.stats = window.statisticheData || {};
        this.colors = {
            primary: 'rgba(37, 99, 235, 0.8)',
            success: 'rgba(16, 185, 129, 0.8)',
            warning: 'rgba(245, 158, 11, 0.8)',
            info: 'rgba(59, 130, 246, 0.8)',
            danger: 'rgba(239, 68, 68, 0.8)',
            secondary: 'rgba(107, 114, 128, 0.8)',
        };
        this.init();
    }

    init() {
        if (!this.stats || Object.keys(this.stats).length === 0) {
            console.warn('Dati statistiche non disponibili');
            this.showErrorMessage();
            return;
        }

        // Configurazione globale Chart.js
        Chart.defaults.font.family = "'Inter', 'Segoe UI', sans-serif";
        Chart.defaults.plugins.legend.position = 'bottom';
        Chart.defaults.plugins.legend.labels.usePointStyle = true;
        Chart.defaults.plugins.legend.labels.padding = 15;

        // Inizializza grafici con dati reali
        this.initActivityChart();
        this.initUserDistributionChart();
        this.initTrendsChart();
    }

    showErrorMessage() {
        const containers = ['activityChart', 'userDistributionChart', 'trendsChart'];
        containers.forEach(id => {
            const ctx = document.getElementById(id);
            if (ctx) {
                ctx.parentElement.innerHTML = '<div class="alert alert-warning text-center">Dati non disponibili</div>';
            }
        });
    }

    initActivityChart() {
        const ctx = document.getElementById('activityChart');
        if (!ctx) return;

        // Prepara dati attività recenti dalla risposta del server
        const attivita = this.stats.attivitaRecenti || [];
        const giorni = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
        
        // Conta per tipo di attività
        const prenotazioniData = new Array(7).fill(0);
        const eventiData = new Array(7).fill(0);
        const notizieData = new Array(7).fill(0);

        attivita.forEach(item => {
            const dayIndex = new Date().getDay(); // Semplificato, da migliorare con data reale
            if (item.tipo === 'prenotazione') prenotazioniData[dayIndex] = item.count;
            if (item.tipo === 'evento') eventiData[dayIndex] = item.count;
            if (item.tipo === 'notizia') notizieData[dayIndex] = item.count;
        });

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: giorni,
                datasets: [{
                    label: 'Prenotazioni',
                    data: prenotazioniData,
                    backgroundColor: this.colors.primary,
                    borderColor: this.colors.primary.replace('0.8', '1'),
                    borderWidth: 2,
                    borderRadius: 8,
                }, {
                    label: 'Eventi',
                    data: eventiData,
                    backgroundColor: this.colors.warning,
                    borderColor: this.colors.warning.replace('0.8', '1'),
                    borderWidth: 2,
                    borderRadius: 8,
                }, {
                    label: 'Notizie',
                    data: notizieData,
                    backgroundColor: this.colors.success,
                    borderColor: this.colors.success.replace('0.8', '1'),
                    borderWidth: 2,
                    borderRadius: 8,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: true },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0, 0, 0, 0.05)' }
                    },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    initUserDistributionChart() {
        const ctx = document.getElementById('userDistributionChart');
        if (!ctx) return;

        const distribuzione = this.stats.distribuzioneUtenti || [];
        const labels = distribuzione.map(item => item.tipo || 'Sconosciuto');
        const data = distribuzione.map(item => item.count || 0);
        const colors = [
            this.colors.primary,
            this.colors.success,
            this.colors.danger,
            this.colors.secondary,
            this.colors.warning,
            this.colors.info
        ];

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderColor: '#fff',
                    borderWidth: 3,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: true },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    initTrendsChart() {
        const ctx = document.getElementById('trendsChart');
        if (!ctx) return;

        const tendenze = this.stats.tendenzeMensili || [];
        const labels = tendenze.map(item => item.mese || '');
        const utentiData = tendenze.map(item => item.nuovi_utenti || 0);
        const prenotazioniData = tendenze.map(item => item.prenotazioni || 0);

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Nuovi Utenti',
                    data: utentiData,
                    borderColor: this.colors.primary.replace('0.8', '1'),
                    backgroundColor: this.colors.primary.replace('0.8', '0.1'),
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#fff',
                    pointBorderWidth: 2,
                }, {
                    label: 'Prenotazioni',
                    data: prenotazioniData,
                    borderColor: this.colors.success.replace('0.8', '1'),
                    backgroundColor: this.colors.success.replace('0.8', '0.1'),
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#fff',
                    pointBorderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: true },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        mode: 'index',
                        intersect: false,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0, 0, 0, 0.05)' }
                    },
                    x: { grid: { display: false } }
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    new StatisticheManager();
});

function initActivityChart() {
    const ctx = document.getElementById('activityChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'],
            datasets: [{
                label: 'Prenotazioni',
                data: [12, 19, 15, 25, 22, 30, 28],
                backgroundColor: 'rgba(13, 110, 253, 0.8)',
                borderColor: 'rgba(13, 110, 253, 1)',
                borderWidth: 2,
                borderRadius: 8,
            }, {
                label: 'Eventi',
                data: [5, 8, 6, 10, 7, 12, 9],
                backgroundColor: 'rgba(255, 193, 7, 0.8)',
                borderColor: 'rgba(255, 193, 7, 1)',
                borderWidth: 2,
                borderRadius: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    cornerRadius: 8,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function initUserDistributionChart() {
    const ctx = document.getElementById('userDistributionChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Giocatori', 'Dirigenti', 'Amministratori', 'Ospiti'],
            datasets: [{
                data: [45, 25, 5, 25],
                backgroundColor: [
                    'rgba(13, 110, 253, 0.8)',
                    'rgba(25, 135, 84, 0.8)',
                    'rgba(220, 53, 69, 0.8)',
                    'rgba(108, 117, 125, 0.8)',
                ],
                borderColor: '#fff',
                borderWidth: 3,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function initTrendsChart() {
    const ctx = document.getElementById('trendsChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
            datasets: [{
                label: 'Utenti Registrati',
                data: [50, 60, 75, 90, 110, 135, 150, 175, 195, 220, 250, 280],
                borderColor: 'rgba(13, 110, 253, 1)',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: '#fff',
                pointBorderWidth: 2,
            }, {
                label: 'Prenotazioni',
                data: [30, 45, 60, 80, 95, 120, 140, 160, 180, 205, 230, 260],
                borderColor: 'rgba(25, 135, 84, 1)',
                backgroundColor: 'rgba(25, 135, 84, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: '#fff',
                pointBorderWidth: 2,
            }, {
                label: 'Eventi',
                data: [10, 15, 20, 25, 32, 40, 48, 55, 60, 68, 75, 85],
                borderColor: 'rgba(255, 193, 7, 1)',
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: '#fff',
                pointBorderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    cornerRadius: 8,
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}
