class StatistichePage {
    constructor() {
        this.init();
    }

    init() {
        this.setupData();
        this.setupAutoRefresh();
    }

    setupData() {
        // I dati vengono passati da EJS tramite window.statisticheData
        // Questa funzione è chiamata dopo che StatisticheManager ha inizializzato i grafici
        console.log('StatistichePage: Dati inizializzati');
    }

    setupAutoRefresh() {
        // Auto-refresh ogni 5 minuti (gestito da StatisticheManager)
        console.log('StatistichePage: Auto-refresh configurato');
    }

    // Metodo per aggiornare manualmente le statistiche
    refreshStats() {
        if (window.statisticheManager) {
            window.statisticheManager.refreshData();
        }
    }

    // Metodo per esportare i dati
    exportData() {
        if (window.statisticheManager) {
            window.statisticheManager.exportData();
        }
    }
}

// Istanza globale
const statistichePage = new StatistichePage();