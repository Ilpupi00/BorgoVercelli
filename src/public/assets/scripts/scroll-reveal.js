/**
 * ============================================================
 * SCROLL REVEAL - Intersection Observer Controller
 * ============================================================
 * Script vanilla ES6+ per gestire animazioni scroll-triggered.
 * Zero dipendenze, massime performance.
 * 
 * CONFIGURAZIONE:
 * - threshold: 0.15 → l'elemento è "visibile" quando il 15% è nel viewport
 * - rootMargin: '0px 0px -50px 0px' → trigger leggermente anticipato
 * 
 * UTILIZZO:
 * 1. Includi scroll-animations.css
 * 2. Aggiungi questo script prima di </body>
 * 3. Aggiungi classi .reveal + .reveal--[effetto] agli elementi HTML
 * 
 * ATTRIBUTI DATA- OPZIONALI:
 * - data-reveal-threshold="0.3" → override del threshold per elemento
 * - data-reveal-once="false"    → l'animazione si ripete ad ogni scroll
 */

(function () {
    'use strict';

    // Segnala che lo script per le reveal è presente
    try {
        document.documentElement.classList.add('has-reveal-js');
    } catch (e) {
        // ignora in ambienti non DOM
    }

    // ============================================================
    // CONFIGURAZIONE
    // ============================================================
    const CONFIG = {
        // Selettore per trovare gli elementi da animare
        selector: '.reveal',
        
        // Classe aggiunta quando l'elemento è visibile
        visibleClass: 'is-visible',
        
        // Percentuale dell'elemento che deve essere visibile (0.0 - 1.0)
        threshold: 0.15,
        
        // Margine del root (viewport) - valori negativi = trigger anticipato
        rootMargin: '0px 0px -50px 0px',
        
        // Se true, l'animazione avviene una sola volta
        once: true,
        
        // Debug mode (logga nel console)
        debug: true
    };

    // ============================================================
    // TRACCIAMENTO ELEMENTI GIÀ OSSERVATI
    // ============================================================
    const observedElements = new WeakSet();

    const STATE = {
        retries: 0,
        maxRetries: 12,
        retryDelay: 200
    };

    // ============================================================
    // INTERSECTION OBSERVER CALLBACK
    // ============================================================
    function handleIntersection(entries, observer) {
        entries.forEach(entry => {
            const element = entry.target;
            
            // Controlla se l'elemento ha override per "once"
            const animateOnce = element.dataset.revealOnce !== 'false';
            
            if (entry.isIntersecting) {
                // Elemento entrato nel viewport → aggiungi classe
                element.classList.add(CONFIG.visibleClass);
                
                if (CONFIG.debug) {
                    console.log('[ScrollReveal] Visible:', element);
                }
                
                // Se animazione one-shot, smetti di osservare
                if (animateOnce && CONFIG.once) {
                    observer.unobserve(element);
                }
            } else {
                // Elemento uscito dal viewport → rimuovi classe (se repeat)
                if (!animateOnce || !CONFIG.once) {
                    element.classList.remove(CONFIG.visibleClass);
                }
            }
        });
    }

    // ============================================================
    // AUTO-TAG HEADINGS
    // ============================================================
    function applyAnimationsToHeadings() {
        // Seleziona tutti i titoli h1-h5
        // include anche titoli annidati in header/hero/page-header
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, .page-header h1, .hero-section h1');
        headings.forEach(heading => {
            // Se l'elemento non ha già la classe reveal, aggiungila
            if (heading && !heading.classList.contains('reveal')) {
                heading.classList.add('reveal', 'reveal--fade-up');
            }
        });
    }

    // ============================================================
    // AUTO-TAG COMMON COMPONENTS + STAGGER
    // ============================================================
    function applyAnimationsToComponents() {
        try {
            // Mapping selector -> default effect
            const mapping = {
                '.card': 'reveal--fade-up-subtle',
                '.feature-card': 'reveal--fade-up-subtle',
                '.stat-card': 'reveal--scale-up',
                '.section-title': 'reveal--text-mask',
                '.news-item': 'reveal--fade-up',
                '.notizia-card': 'reveal--fade-up',
                '.news-card': 'reveal--fade-up',
                '.event-card': 'reveal--fade-up',
                '.eventi-card': 'reveal--fade-up',
                '.gallery-item': 'reveal--zoom-out-subtle',
                '.gallery-photo': 'reveal--zoom-out-subtle',
                '.profile-info': 'reveal--fade-up-subtle',
                '.member-card': 'reveal--fade-up-subtle',
                '.review-card': 'reveal--fade-up',
                '.recensione-card': 'reveal--fade-up',
                '.enti-card': 'reveal--fade-up',
                '.entity-card': 'reveal--fade-up',
                '.page-header': 'reveal--text-mask',
                '.hero-section': 'reveal--zoom-out'
            };

            Object.keys(mapping).forEach(selector => {
                const nodes = document.querySelectorAll(selector);
                nodes.forEach((node, idx) => {
                    // skip if already has reveal
                    if (node.classList && node.classList.contains('reveal')) return;

                    // apply base class + effect
                    if (node.classList) {
                        node.classList.add('reveal', mapping[selector]);

                        // stagger: small delay based on index for visual rhythm
                        const delay = Math.min(600, idx * 80); // cap delay
                        try { node.style.transitionDelay = delay + 'ms'; } catch (e) {}
                        try { node.style.animationDelay = delay + 'ms'; } catch (e) {}
                    }
                });
            });

            // Special: headings inside lists/cards should use text-mask
            const cardHeadings = document.querySelectorAll('.card h1, .card h2, .news-item h2, .notizia-card h2');
            cardHeadings.forEach(h => {
                if (!h.classList.contains('reveal')) {
                    h.classList.add('reveal', 'reveal--text-mask');
                }
            });
        } catch (e) {
            if (CONFIG.debug) console.warn('[ScrollReveal] applyAnimationsToComponents failed', e);
        }
    }

    // ============================================================
    // INITIAL VISIBILITY CHECK (fallback)
    // ============================================================
    // Some pages may render headings before the observer attaches and
    // race conditions can leave elements hidden. This function forces
    // elements that are currently in the viewport to receive the
    // visible class immediately as a safe fallback.
    function applyInitialVisibilityCheck() {
        try {
            const elements = document.querySelectorAll(CONFIG.selector);
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            elements.forEach(el => {
                const rect = el.getBoundingClientRect();
                // consider visible if any part is within viewport (a small margin)
                if (rect.top < viewportHeight && rect.bottom > 0) {
                    el.classList.add(CONFIG.visibleClass);
                }
            });
        } catch (e) {
            if (CONFIG.debug) console.warn('[ScrollReveal] initial visibility check failed', e);
        }
    }

    // ============================================================
    // INIZIALIZZAZIONE
    // ============================================================
    function init() {
        // Applica animazioni ai titoli automaticamente
        applyAnimationsToHeadings();
        // Controllo iniziale: mostra immediatamente gli elementi già visibili
        applyInitialVisibilityCheck();
        // Applica animazioni ai componenti più comuni (cards, gallery, news)
        applyAnimationsToComponents();

        // Verifica supporto Intersection Observer
        if (!('IntersectionObserver' in window)) {
            console.warn('[ScrollReveal] IntersectionObserver non supportato. Fallback: elementi visibili.');
            // Fallback: rendi tutti gli elementi visibili
            document.querySelectorAll(CONFIG.selector).forEach(el => {
                el.classList.add(CONFIG.visibleClass);
            });
            return;
        }

        // Rispetta preferenze utente per movimento ridotto
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            if (CONFIG.debug) {
                console.log('[ScrollReveal] Reduced motion preferito. Animazioni disabilitate.');
            }
            // Rendi subito visibili senza animazione
            document.querySelectorAll(CONFIG.selector).forEach(el => {
                el.classList.add(CONFIG.visibleClass);
            });
            return;
        }

        // Trova tutti gli elementi da animare
        const elements = document.querySelectorAll(CONFIG.selector);
        
        if (elements.length === 0) {
            if (CONFIG.debug) {
                console.log('[ScrollReveal] Nessun elemento trovato con selettore:', CONFIG.selector);
                const candidates = document.querySelectorAll('[class*="reveal"]');
                console.log('[ScrollReveal] Elementi che contengono "reveal" nella class list:', candidates.length);
                if (candidates.length > 0) {
                    console.log('[ScrollReveal] Esempio elemento:', candidates[0]);
                }
            }

            if (STATE.retries < STATE.maxRetries) {
                STATE.retries += 1;
                if (CONFIG.debug) {
                    console.log('[ScrollReveal] Riprovo inizializzazione (#' + STATE.retries + ') tra ' + STATE.retryDelay + 'ms');
                }
                window.setTimeout(init, STATE.retryDelay);
            } else {
                if (CONFIG.debug) {
                    console.warn('[ScrollReveal] Impossibile localizzare elementi .reveal dopo diversi tentativi. Rendo visibili tutti gli elementi come fallback.');
                }
                document.querySelectorAll(CONFIG.selector).forEach(el => {
                    el.classList.add(CONFIG.visibleClass);
                });
            }
            return;
        }

        if (CONFIG.debug) {
            console.log(`[ScrollReveal] Inizializzato. ${elements.length} elementi trovati.`);
        }

        // reset retry counter una volta trovati elementi
        STATE.retries = 0;

        // Crea l'observer
        const observer = new IntersectionObserver(handleIntersection, {
            root: null, // viewport
            rootMargin: CONFIG.rootMargin,
            threshold: CONFIG.threshold
        });

        // Osserva ogni elemento (solo se non già osservato)
        elements.forEach(element => {
            // Salta se già osservato
            if (observedElements.has(element)) {
                return;
            }

            // Segna come osservato
            observedElements.add(element);

            // Check per threshold personalizzato
            const customThreshold = element.dataset.revealThreshold;
            
            if (customThreshold) {
                // Crea un observer dedicato per questo elemento
                const customObserver = new IntersectionObserver(handleIntersection, {
                    root: null,
                    rootMargin: CONFIG.rootMargin,
                    threshold: parseFloat(customThreshold)
                });
                customObserver.observe(element);
            } else {
                observer.observe(element);
            }
        });
    }

    // ============================================================
    // MUTATION OBSERVER (per elementi aggiunti dinamicamente)
    // ============================================================
    let mutationObserver = null;

    function observeDOM() {
        if (!('MutationObserver' in window)) return;

        mutationObserver = new MutationObserver((mutations) => {
            let hasNewElements = false;
            
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        // If any element is added, trigger component tagging
                        hasNewElements = true;
                    }
                });
            });

            if (hasNewElements) {
                if (CONFIG.debug) {
                    console.log('[ScrollReveal] Nuovi elementi rilevati, reinizializzo...');
                }
                // Ensure new components get tagged before init attaches observers
                applyAnimationsToHeadings();
                applyAnimationsToComponents();
                init();
            }
        });

        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // ============================================================
    // AVVIO
    // ============================================================
    // Aspetta che il DOM sia pronto
    const onDomReady = () => {
        init();
        observeDOM();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onDomReady, { once: true });
    } else {
        onDomReady();
    }

    window.addEventListener('load', () => {
        STATE.retries = 0;
        init();
    });

    // Esponi API globale per controllo manuale (opzionale)
    window.ScrollReveal = {
        // Rianima un elemento specifico
        refresh: function(selector) {
            const elements = document.querySelectorAll(selector || CONFIG.selector);
            elements.forEach(el => {
                el.classList.remove(CONFIG.visibleClass);
                // Force reflow
                void el.offsetWidth;
            });
            init();
        },
        
        // Forza visibilità immediata
        show: function(selector) {
            const elements = document.querySelectorAll(selector || CONFIG.selector);
            elements.forEach(el => el.classList.add(CONFIG.visibleClass));
        },
        
        // Nascondi elementi
        hide: function(selector) {
            const elements = document.querySelectorAll(selector || CONFIG.selector);
            elements.forEach(el => el.classList.remove(CONFIG.visibleClass));
        }
    };

})();
