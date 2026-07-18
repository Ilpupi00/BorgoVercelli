/**
 * pops.js — Carica e mostra i POPS (popup periodici) dalla homepage
 * Funziona in parallelo con il sistema feste hardcodato (modalFeste.js)
 * I POPS vengono mostrati uno alla volta, con un delay tra uno e l'altro.
 * Usa localStorage per non mostrare lo stesso POP più di una volta per sessione
 * (chiave: pop_<id>_<anno>)
 */
(function () {
  "use strict";

  // Delay prima di mostrare il primo pop (ms)
  const INITIAL_DELAY_MS = 2000;
  // Delay tra un pop e il successivo (ms)
  const BETWEEN_DELAY_MS = 500;

  /**
   * Verifica se un POP è già stato mostrato quest'anno
   */
  function isPopGiaMostrato(id, anno) {
    const key = `pop_${id}_${anno}`;
    try {
      return localStorage.getItem(key) === "true";
    } catch (_) {
      return false;
    }
  }

  /**
   * Segna il POP come mostrato per quest'anno
   */
  function segnaPopMostrato(id, anno) {
    const key = `pop_${id}_${anno}`;
    try {
      localStorage.setItem(key, "true");
    } catch (_) {}
  }

  /**
   * Costruisce e mostra il modal Bootstrap per un POP
   */
  function mostraPop(pop) {
    return new Promise((resolve) => {
      const anno = new Date().getFullYear();

      if (isPopGiaMostrato(pop.id, anno)) {
        resolve();
        return;
      }

      const icona    = pop.icona    || "📢";
      const cp       = pop.colore_primario   || "#3b82f6";
      const cs       = pop.colore_secondario || "#1e40af";

      const modalId = `popModal_${pop.id}`;

      const html = `
        <div class="modal fade" id="${modalId}" tabindex="-1"
             aria-labelledby="${modalId}Label" aria-hidden="true"
             data-bs-backdrop="static">
          <div class="modal-dialog modal-dialog-centered" style="max-width:520px;">
            <div class="modal-content" style="border:none;border-radius:20px;overflow:hidden;
                 box-shadow:0 20px 60px rgba(0,0,0,0.25);">

              <!-- Header colorato -->
              <div class="modal-header border-0"
                   style="background:linear-gradient(135deg,${cp},${cs});
                          padding:1.75rem 2rem;position:relative;overflow:hidden;">
                <!-- Icona decorativa sfondo -->
                <span style="position:absolute;font-size:5rem;right:-0.5rem;top:-0.5rem;
                             opacity:0.1;transform:rotate(-10deg);">${icona}</span>
                <h5 class="modal-title text-white fw-bold" id="${modalId}Label"
                    style="font-size:1.4rem;z-index:1;text-shadow:0 2px 8px rgba(0,0,0,0.2);">
                  ${icona} ${escapeHtml(pop.titolo)}
                </h5>
                <button type="button" class="btn-close btn-close-white"
                        data-bs-dismiss="modal" aria-label="Chiudi"
                        style="z-index:1;"></button>
              </div>

              <!-- Body -->
              <div class="modal-body text-center"
                   style="padding:2.5rem 2rem;background:#fff;">
                <span style="font-size:3.5rem;display:block;margin-bottom:1.25rem;
                             animation:popIconPulse 2s ease-in-out infinite;">${icona}</span>
                <p style="font-size:1.1rem;line-height:1.8;color:#374151;margin-bottom:0;">
                  ${escapeHtml(pop.messaggio).replace(/\n/g,"<br>")}
                </p>
              </div>

              <!-- Footer -->
              <div class="modal-footer border-0 justify-content-center"
                   style="background:#f9fafb;padding:1.25rem 2rem;">
                <button type="button" class="btn text-white fw-semibold px-4"
                        data-bs-dismiss="modal"
                        style="background:linear-gradient(135deg,${cp},${cs});
                               border:none;border-radius:999px;
                               box-shadow:0 4px 14px rgba(0,0,0,0.18);
                               transition:all .25s;">
                  <i class="fas fa-check me-2"></i>Capito!
                </button>
              </div>

            </div>
          </div>
        </div>`;

      // Aggiunge lo stile per l'animazione (una sola volta)
      if (!document.getElementById("popKeyframesStyle")) {
        const style = document.createElement("style");
        style.id = "popKeyframesStyle";
        style.textContent = `
          @keyframes popIconPulse {
            0%,100% { transform: scale(1); }
            50%      { transform: scale(1.12); }
          }`;
        document.head.appendChild(style);
      }

      // Inietta nel DOM
      const wrapper = document.createElement("div");
      wrapper.innerHTML = html;
      document.body.appendChild(wrapper.firstElementChild);

      const modalEl = document.getElementById(modalId);
      const bsModal = new bootstrap.Modal(modalEl, {
        backdrop: "static",
        keyboard: true,
      });

      modalEl.addEventListener("hidden.bs.modal", function () {
        segnaPopMostrato(pop.id, anno);
        setTimeout(() => {
          modalEl.remove();
          resolve();
        }, 300);
      });

      bsModal.show();
    });
  }

  /**
   * Escape HTML per prevenire XSS
   */
  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /**
   * Carica i POPS attivi e li mostra in sequenza
   */
  async function caricaEMostraPops() {
    try {
      const res  = await fetch("/api/pops/attivi");
      if (!res.ok) return;
      const data = await res.json();
      const pops = data.pops || [];

      if (pops.length === 0) return;

      // Filtra quelli già mostrati
      const anno       = new Date().getFullYear();
      const daMostrare = pops.filter((p) => !isPopGiaMostrato(p.id, anno));

      if (daMostrare.length === 0) return;

      // Mostra il primo pop dopo il delay iniziale
      await new Promise((r) => setTimeout(r, INITIAL_DELAY_MS));

      for (let i = 0; i < daMostrare.length; i++) {
        if (i > 0) {
          await new Promise((r) => setTimeout(r, BETWEEN_DELAY_MS));
        }
        await mostraPop(daMostrare[i]);
      }
    } catch (err) {
      // Silenzioso: non bloccare la pagina per un errore di pops
      console.warn("[POPS] Errore nel caricamento:", err.message);
    }
  }

  /**
   * Init
   */
  function init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", caricaEMostraPops);
    } else {
      caricaEMostraPops();
    }
  }

  init();
})();
