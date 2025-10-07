class StatisticheManager {
    constructor() {
        this.charts = {};
        this.init();
    }

    init() {
        this.loadChartJS().then(() => {
            this.createCharts();
            this.setupRefresh();
        });
    }

    async loadChartJS() {
        return new Promise((resolve) => {
            if (window.Chart) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }

    createCharts() {
        this.createUserDistributionChart();
        this.createActivityChart();
        this.createTrendsChart();
    }

    createUserDistributionChart() {
        const ctx = document.getElementById('userDistributionChart');
        if (!ctx) return;

        const distribuzione = window.statisticheData?.distribuzioneUtenti || [];

        const labels = distribuzione.map(item => item.tipo || 'Sconosciuto');
        const data = distribuzione.map(item => item.count);

        const colors = [
            '#007bff', '#28a745', '#ffc107', '#dc3545', '#6c757d',
            '#17a2b8', '#fd7e14', '#e83e8c', '#6f42c1', '#20c997'
        ];

        this.charts.userDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverBorderWidth: 3,
                    hoverBorderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12,
                                weight: '500'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true,
                    duration: 2000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    createActivityChart() {
        const ctx = document.getElementById('activityChart');
        if (!ctx) return;

        const attivita = window.statisticheData?.attivitaRecenti || [];

        // Raggruppa per mese e tipo
        const mesi = {};
        attivita.forEach(item => {
            if (!mesi[item.periodo]) {
                mesi[item.periodo] = { registrazione: 0, notizia: 0, evento: 0 };
            }
            mesi[item.periodo][item.tipo] = item.count;
        });

        const labels = Object.keys(mesi).sort().reverse();
        const registrazioni = labels.map(mese => mesi[mese].registrazione);
        const notizie = labels.map(mese => mesi[mese].notizia);
        const eventi = labels.map(mese => mesi[mese].evento);

        this.charts.activity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.map(label => {
                    const [year, month] = label.split('-');
                    return new Date(year, month - 1).toLocaleDateString('it-IT', { month: 'short', year: 'numeric' });
                }),
                datasets: [{
                    label: 'Registrazioni',
                    data: registrazioni,
                    backgroundColor: 'rgba(0, 123, 255, 0.8)',
                    borderColor: 'rgba(0, 123, 255, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                }, {
                    label: 'Notizie Pubblicate',
                    data: notizie,
                    backgroundColor: 'rgba(40, 167, 69, 0.8)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                }, {
                    label: 'Eventi',
                    data: eventi,
                    backgroundColor: 'rgba(255, 193, 7, 0.8)',
                    borderColor: 'rgba(255, 193, 7, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 11
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        },
                        ticks: {
                            precision: 0
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        cornerRadius: 8,
                        mode: 'index',
                        intersect: false
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeOutQuart',
                    delay: function(context) {
                        return context.dataIndex * 200;
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                }
            }
        });
    }

    createTrendsChart() {
        const ctx = document.getElementById('trendsChart');
        if (!ctx) return;

        const tendenze = window.statisticheData?.tendenzeMensili || [];

        const labels = tendenze.map(item => item.mese);
        const nuoviUtenti = tendenze.map(item => item.nuovi_utenti);
        const prenotazioni = tendenze.map(item => item.prenotazioni);

        this.charts.trends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Nuovi Utenti',
                    data: nuoviUtenti,
                    borderColor: 'rgba(0, 123, 255, 1)',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(0, 123, 255, 1)',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }, {
                    label: 'Prenotazioni',
                    data: prenotazioni,
                    borderColor: 'rgba(220, 53, 69, 1)',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(220, 53, 69, 1)',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        cornerRadius: 8,
                        mode: 'index',
                        intersect: false
                    }
                },
                animation: {
                    duration: 3000,
                    easing: 'easeOutQuart'
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                }
            }
        });
    }

    setupRefresh() {
        // Auto-refresh ogni 5 minuti
        setInterval(() => {
            this.refreshData();
        }, 300000);
    }

    async refreshData() {
        try {
            const response = await fetch('/admin/statistiche/data');
            if (!response.ok) throw new Error('Errore nel refresh');

            const newData = await response.json();
            window.statisticheData = newData;

            // Aggiorna i grafici
            Object.values(this.charts).forEach(chart => {
                chart.destroy();
            });

            this.createCharts();

            this.showNotification('Statistiche aggiornate', 'success');
        } catch (error) {
            console.error('Errore refresh statistiche:', error);
            this.showNotification('Errore nell\'aggiornamento delle statistiche', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Implementare notifica toast o modal
        console.log(`${type.toUpperCase()}: ${message}`);
    }

    exportData() {
        // Implementare esportazione dati
        const dataStr = JSON.stringify(window.statisticheData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = `statistiche_${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
}

// Istanza globale
const statisticheManager = new StatisticheManager();