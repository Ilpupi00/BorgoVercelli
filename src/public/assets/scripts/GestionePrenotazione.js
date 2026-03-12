/**
 * GestionePrenotazione.js
 * Gestione funzionalità pagina Gestione Prenotazioni
 */

document.addEventListener("DOMContentLoaded", function () {
  // --- Pagination & filtering state ---
  const allRows = Array.from(document.querySelectorAll(".admin-table tbody tr"));
  let filteredRows = [...allRows];
  let currentPage = 1;
  let activeStatusFilter = null;

  const searchInput = document.getElementById("searchInput");
  const pageSizeSelect = document.getElementById("pageSizeSelect");
  const paginationEl = document.getElementById("pagination");
  const totalCountEl = document.getElementById("totalCount");
  const filteredCountEl = document.getElementById("filteredCount");

  function getPageSize() {
    return parseInt(pageSizeSelect?.value || "10", 10);
  }

  function applyFilters() {
    const searchTerm = (searchInput?.value || "").toLowerCase();

    filteredRows = allRows.filter((row) => {
      // Search filter
      const text = row.textContent.toLowerCase();
      if (searchTerm && !text.includes(searchTerm)) return false;

      // Status filter
      if (activeStatusFilter) {
        const badge = row.querySelector(".badge");
        if (!badge) return false;
        const badgeText = badge.textContent.trim().toLowerCase();
        if (!badgeText.includes(activeStatusFilter)) return false;
      }

      return true;
    });

    currentPage = 1;
    renderPage();
  }

  function renderPage() {
    const pageSize = getPageSize();
    const totalFiltered = filteredRows.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;

    // Hide all rows, then show only current page rows
    allRows.forEach((row) => (row.style.display = "none"));
    filteredRows.slice(start, end).forEach((row) => (row.style.display = ""));

    // Update counts
    if (totalCountEl) totalCountEl.textContent = allRows.length;
    if (filteredCountEl) filteredCountEl.textContent = `(${totalFiltered} filtrate)`;

    // Render pagination
    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    if (!paginationEl) return;
    paginationEl.innerHTML = "";

    // Prev button
    const prevLi = document.createElement("li");
    prevLi.className = "page-item" + (currentPage === 1 ? " disabled" : "");
    prevLi.innerHTML = '<a class="page-link" href="#">&laquo;</a>';
    prevLi.addEventListener("click", function (e) {
      e.preventDefault();
      if (currentPage > 1) { currentPage--; renderPage(); }
    });
    paginationEl.appendChild(prevLi);

    // Page numbers (show max 5 around current)
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

    for (let i = startPage; i <= endPage; i++) {
      const li = document.createElement("li");
      li.className = "page-item" + (i === currentPage ? " active" : "");
      li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
      li.addEventListener("click", function (e) {
        e.preventDefault();
        currentPage = i;
        renderPage();
      });
      paginationEl.appendChild(li);
    }

    // Next button
    const nextLi = document.createElement("li");
    nextLi.className = "page-item" + (currentPage === totalPages ? " disabled" : "");
    nextLi.innerHTML = '<a class="page-link" href="#">&raquo;</a>';
    nextLi.addEventListener("click", function (e) {
      e.preventDefault();
      if (currentPage < totalPages) { currentPage++; renderPage(); }
    });
    paginationEl.appendChild(nextLi);
  }

  // --- Event listeners ---

  // Ricerca prenotazioni
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      applyFilters();
    });
  }

  // Page size change
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener("change", function () {
      currentPage = 1;
      renderPage();
    });
  }

  // Filtri stato prenotazione
  const filterButtons = document.querySelectorAll(
    ".section-header .btn:not(#deleteScaduteBtn)"
  );
  filterButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const buttonText = this.textContent.trim().toLowerCase();
      const isActive = this.classList.contains("active");

      // Toggle: if already active, deactivate (show all)
      filterButtons.forEach((btn) => btn.classList.remove("active"));

      if (isActive) {
        activeStatusFilter = null;
      } else {
        this.classList.add("active");
        if (buttonText.includes("confermate")) activeStatusFilter = "confermata";
        else if (buttonText.includes("attesa")) activeStatusFilter = "attesa";
        else if (buttonText.includes("annullate")) activeStatusFilter = "annullata";
        else if (buttonText.includes("scadute")) activeStatusFilter = "scaduta";
        else activeStatusFilter = null;
      }

      applyFilters();
    });
  });

  // Initial render
  applyFilters();

  // Elimina prenotazioni scadute
  const deleteScaduteBtn = document.getElementById("deleteScaduteBtn");
  if (deleteScaduteBtn) {
    deleteScaduteBtn.addEventListener("click", async function () {
      const doDelete = async () => {
        try {
          const response = await fetch("/admin/prenotazioni/elimina-scadute", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          });

          const data = await response.json();

          if (response.ok) {
            // usa toast manager alias
            if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
              window.AdminGlobal.ToastManager.show(
                "Prenotazioni scadute eliminate con successo",
                "success"
              );
            }
            setTimeout(() => location.reload(), 1500);
          } else {
            if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
              window.AdminGlobal.ToastManager.show(
                data.error || "Errore durante l'eliminazione",
                "error"
              );
            }
          }
        } catch (error) {
          console.error("Errore:", error);
          if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
            window.AdminGlobal.ToastManager.show(
              "Errore di connessione",
              "error"
            );
          }
        }
      };

      if (window.AdminGlobal && window.AdminGlobal.modalManager) {
        window.AdminGlobal.modalManager.confirm({
          title: "Conferma eliminazione",
          message:
            "Sei sicuro di voler eliminare tutte le prenotazioni scadute?",
          confirmText: "Elimina",
          cancelText: "Annulla",
          type: "danger",
          onConfirm: doDelete,
        });
      } else {
        if (
          !confirm(
            "Sei sicuro di voler eliminare tutte le prenotazioni scadute?"
          )
        )
          return;
        await doDelete();
      }
    });
  }

  // Azioni tabella (visualizza, conferma, annulla, modifica, elimina)
  document.addEventListener("click", function (e) {
    const btn = e.target.closest(
      ".btn-outline-primary, .btn-outline-success, .btn-outline-danger, .btn-outline-warning"
    );
    if (!btn) return;

    const prenotazioneId = btn.dataset.id;
    if (!prenotazioneId) return;

    if (
      btn.classList.contains("btn-outline-primary") &&
      btn.title === "Visualizza"
    ) {
      visualizzaPrenotazione(prenotazioneId);
    } else if (
      btn.classList.contains("btn-outline-success") &&
      btn.title === "Conferma"
    ) {
      confermaPrenotazione(prenotazioneId);
    } else if (
      btn.classList.contains("btn-outline-danger") &&
      btn.title === "Annulla"
    ) {
      annullaPrenotazione(prenotazioneId);
    } else if (
      btn.classList.contains("btn-outline-warning") &&
      btn.title === "Modifica"
    ) {
      modificaPrenotazione(prenotazioneId);
    } else if (
      btn.classList.contains("btn-outline-danger") &&
      btn.title === "Elimina"
    ) {
      eliminaPrenotazione(prenotazioneId);
    } else if (
      btn.classList.contains("btn-outline-success") &&
      btn.title === "Riattiva"
    ) {
      riattivaPrenotazione(prenotazioneId);
    }
  });
});

// Helper: safe JSON parse that falls back to text on non-JSON responses
async function parseJsonSafe(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  // try parse anyway for ok responses, but return text if fails
  try {
    const text = await response.text();
    console.warn(
      "parseJsonSafe: expected JSON but got:",
      text && text.slice(0, 200)
    );
    return { __raw: text };
  } catch (e) {
    return { __raw: null };
  }
}

// Funzioni CRUD
async function visualizzaPrenotazione(id) {
  try {
    // Use public API route for JSON response
    const response = await fetch(`/prenotazione/prenotazioni/${id}`);
    const data = await parseJsonSafe(response);

    if (response.ok) {
      // Prepara documento identità
      let docIdentita = '<span class="text-muted">Non fornito</span>';
      if (data.tipo_documento === "CF" && data.codice_fiscale) {
        docIdentita = `<span class="badge bg-info">CF</span> ${data.codice_fiscale}`;
      } else if (data.tipo_documento === "ID" && data.numero_documento) {
        docIdentita = `<span class="badge bg-info">ID</span> ${data.numero_documento}`;
      }

      // Prepara badge stato
      let statoBadge = "";
      if (data.stato === "confermata")
        statoBadge = '<span class="badge bg-success">Confermata</span>';
      else if (data.stato === "in_attesa")
        statoBadge = '<span class="badge bg-warning">In Attesa</span>';
      else if (data.stato === "annullata")
        statoBadge = '<span class="badge bg-danger">Annullata</span>';
      else if (data.stato === "scaduta")
        statoBadge = '<span class="badge bg-secondary">Scaduta</span>';
      else if (data.stato === "completata")
        statoBadge = '<span class="badge bg-info">Completata</span>';
      else
        statoBadge = `<span class="badge bg-secondary">${
          data.stato || "-"
        }</span>`;

      // Info annullamento
      let annullataInfo = "";
      if (data.stato === "annullata" && data.annullata_da) {
        const annullataDa =
          data.annullata_da === "admin" ? "Amministratore" : "Utente";
        annullataInfo = `<p><strong>Annullata da:</strong> <span class="text-danger">${annullataDa}</span></p>`;
      }

      // Mostra modal con dettagli completi
      const modalHtml = `
                <div class="row">
                    <div class="col-md-6">
                        <h6 class="text-primary mb-3"><i class="bi bi-info-circle me-2"></i>Informazioni Prenotazione</h6>
                        <p><strong>ID:</strong> #${data.id}</p>
                        <p><strong>Campo:</strong> <span class="badge bg-primary">${
                          data.campo_nome || "Campo " + data.campo_id
                        }</span></p>
                        <p><strong>Data:</strong> ${
                          data.data_prenotazione
                            ? new Date(
                                data.data_prenotazione
                              ).toLocaleDateString("it-IT")
                            : "-"
                        }</p>
                        <p><strong>Orario:</strong> <i class="bi bi-clock me-1"></i>${
                          data.ora_inizio || "-"
                        } - ${data.ora_fine || "-"}</p>
                        <p><strong>Tipo Attività:</strong> ${
                          data.tipo_attivita ||
                          '<span class="text-muted">Non specificato</span>'
                        }</p>
                        <p><strong>Stato:</strong> ${statoBadge}</p>
                        ${annullataInfo}
                    </div>
                    <div class="col-md-6">
                        <h6 class="text-success mb-3"><i class="bi bi-person-circle me-2"></i>Dati Utente</h6>
                        <p><strong>Utente:</strong> ${data.utente_nome || ""} ${
        data.utente_cognome || '<span class="text-muted">N/A</span>'
      }</p>
                        <p><strong>Squadra:</strong> ${
                          data.squadra_nome ||
                          '<span class="text-muted">Nessuna</span>'
                        }</p>
                        <p><strong><i class="bi bi-telephone me-1"></i>Telefono:</strong> ${
                          data.telefono ||
                          '<span class="text-muted">Non fornito</span>'
                        }</p>
                        <p><strong><i class="bi bi-card-text me-1"></i>Documento:</strong> ${docIdentita}</p>
                    </div>
                </div>
                ${
                  data.note
                    ? `
                <div class="row mt-3">
                    <div class="col-12">
                        <h6 class="text-secondary mb-2"><i class="bi bi-chat-left-text me-2"></i>Note</h6>
                        <div class="alert alert-light mb-0">${data.note}</div>
                    </div>
                </div>
                `
                    : ""
                }
                <div class="row mt-3">
                    <div class="col-12">
                        <hr>
                        <small class="text-muted">
                            <i class="bi bi-clock-history me-1"></i>
                            Creata il: ${
                              data.created_at
                                ? new Date(data.created_at).toLocaleString(
                                    "it-IT"
                                  )
                                : "N/A"
                            }
                            ${
                              data.updated_at
                                ? ` | Aggiornata: ${new Date(
                                    data.updated_at
                                  ).toLocaleString("it-IT")}`
                                : ""
                            }
                        </small>
                    </div>
                </div>
            `;

      const bodyEl = document.getElementById("modalPrenotazioneBody");
      if (bodyEl) bodyEl.innerHTML = modalHtml;

      // Mostra il modal statico creato nella view
      if (window.AdminGlobal && window.AdminGlobal.modalManager) {
        window.AdminGlobal.modalManager.show("visualizzaPrenotazioneModal");
      } else if (typeof bootstrap !== "undefined") {
        const bs = new bootstrap.Modal(
          document.getElementById("visualizzaPrenotazioneModal")
        );
        bs.show();
      } else {
        alert(modalHtml.replace(/<[^>]+>/g, "\n"));
      }
    } else {
      window.AdminGlobal.ToastManager.show(
        data.error || "Errore caricamento dati",
        "error"
      );
    }
  } catch (error) {
    console.error("Errore:", error);
    window.AdminGlobal.ToastManager.show("Errore di connessione", "error");
  }
}

async function confermaPrenotazione(id) {
  const doConfirm = async () => {
    try {
      const response = await fetch(`/admin/prenotazioni/${id}/conferma`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok) {
        if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
          window.AdminGlobal.ToastManager.show(
            "Prenotazione confermata",
            "success"
          );
        }
        setTimeout(() => location.reload(), 1500);
      } else {
        if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
          window.AdminGlobal.ToastManager.show(
            data.error || "Errore durante la conferma",
            "error"
          );
        }
      }
    } catch (error) {
      console.error("Errore:", error);
      if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
        window.AdminGlobal.ToastManager.show("Errore di connessione", "error");
      }
    }
  };

  if (window.AdminGlobal && window.AdminGlobal.modalManager) {
    window.AdminGlobal.modalManager.confirm({
      title: "Conferma prenotazione",
      message: "Confermare questa prenotazione?",
      confirmText: "Conferma",
      cancelText: "Annulla",
      type: "success",
      onConfirm: doConfirm,
    });
  } else {
    if (!confirm("Confermare questa prenotazione?")) return;
    await doConfirm();
  }
}

async function annullaPrenotazione(id) {
  const doAnnul = async () => {
    try {
      const response = await fetch(`/admin/prenotazioni/${id}/annulla`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok) {
        if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
          window.AdminGlobal.ToastManager.show(
            "Prenotazione annullata",
            "success"
          );
        }
        setTimeout(() => location.reload(), 1500);
      } else {
        if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
          window.AdminGlobal.ToastManager.show(
            data.error || "Errore durante l'annullamento",
            "error"
          );
        }
      }
    } catch (error) {
      console.error("Errore:", error);
      if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
        window.AdminGlobal.ToastManager.show("Errore di connessione", "error");
      }
    }
  };

  if (window.AdminGlobal && window.AdminGlobal.modalManager) {
    window.AdminGlobal.modalManager.confirm({
      title: "Annulla prenotazione",
      message: "Annullare questa prenotazione?",
      confirmText: "Annulla",
      cancelText: "Indietro",
      type: "warning",
      onConfirm: doAnnul,
    });
  } else {
    if (!confirm("Annullare questa prenotazione?")) return;
    await doAnnul();
  }
}

async function modificaPrenotazione(id) {
  try {
    const loadingToast = window.AdminGlobal.ToastManager.show(
      "Caricamento dati...",
      "info"
    );

    // Fetch prenotazione data
    const response = await fetch(`/prenotazione/prenotazioni/${id}`);
    if (!response.ok) throw new Error("Errore nel recupero dei dati");
    const prenotazione = await response.json();

    // Fetch campi disponibili
    const campiResponse = await fetch("/prenotazione/campi");
    if (!campiResponse.ok) throw new Error("Errore nel recupero dei campi");
    const campi = await campiResponse.json();

    // Popola select campi
    const campoSelect = document.getElementById("modPrenCampo");
    campoSelect.innerHTML = campi
      .map(
        (campo) =>
          `<option value="${campo.id}" ${
            campo.id === prenotazione.campo_id ? "selected" : ""
          }>
                ${campo.nome}
            </option>`
      )
      .join("");

    // Popola form
    document.getElementById("modPrenId").value = prenotazione.id;
    document.getElementById("modPrenUtenteId").value = prenotazione.utente_id;
    // Formatta la data in formato YYYY-MM-DD per input type="date"
    const dataPrenotazione = prenotazione.data_prenotazione;
    if (dataPrenotazione) {
      const dataFormatted = new Date(dataPrenotazione)
        .toISOString()
        .split("T")[0];
      document.getElementById("modPrenData").value = dataFormatted;
    }
    document.getElementById("modPrenOraInizio").value = prenotazione.ora_inizio;
    document.getElementById("modPrenOraFine").value = prenotazione.ora_fine;
    document.getElementById("modPrenTelefono").value =
      prenotazione.telefono || "";
    document.getElementById("modPrenNote").value = prenotazione.note || "";

    // Gestisci tipo documento
    const tipoDocSelect = document.getElementById("modPrenTipoDoc");
    const cfContainer = document.getElementById("modPrenCFContainer");
    const idContainer = document.getElementById("modPrenIDContainer");
    const cfInput = document.getElementById("modPrenCodiceFiscale");
    const idInput = document.getElementById("modPrenNumeroDoc");

    if (prenotazione.tipo_documento === "CF") {
      tipoDocSelect.value = "CF";
      cfContainer.style.display = "block";
      idContainer.style.display = "none";
      cfInput.value = prenotazione.codice_fiscale || "";
      cfInput.required = true;
      idInput.required = false;
    } else if (prenotazione.tipo_documento === "ID") {
      tipoDocSelect.value = "ID";
      cfContainer.style.display = "none";
      idContainer.style.display = "block";
      idInput.value = prenotazione.numero_documento || "";
      cfInput.required = false;
      idInput.required = true;
    } else {
      tipoDocSelect.value = "";
      cfContainer.style.display = "none";
      idContainer.style.display = "none";
      cfInput.required = false;
      idInput.required = false;
    }

    // Mostra modal
    const modal = new bootstrap.Modal(
      document.getElementById("modificaPrenotazioneModal")
    );
    modal.show();

    loadingToast.hide();
  } catch (error) {
    console.error("Errore modifica prenotazione:", error);
    window.AdminGlobal.ToastManager.show(
      "Errore nel caricamento dei dati: " + error.message,
      "error"
    );
  }
}

async function salvaModificaPrenotazione() {
  try {
    const form = document.getElementById("modificaPrenotazioneForm");
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const id = document.getElementById("modPrenId").value;
    const telefono = document.getElementById("modPrenTelefono").value;
    const tipoDoc = document.getElementById("modPrenTipoDoc").value;

    // Validazione telefono
    const phonePattern = /^\+39\s?[0-9]{9,10}$/;
    if (!phonePattern.test(telefono)) {
      window.AdminGlobal.ToastManager.show(
        "Formato telefono non valido. Richiesto: +39 seguito da 9-10 cifre",
        "error"
      );
      return;
    }

    // Validazione documento se presente
    if (tipoDoc === "CF") {
      const cf = document.getElementById("modPrenCodiceFiscale").value;
      const cfPattern = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i;
      if (!cf || !cfPattern.test(cf)) {
        window.AdminGlobal.ToastManager.show(
          "Codice fiscale non valido",
          "error"
        );
        return;
      }
    } else if (tipoDoc === "ID") {
      const numDoc = document.getElementById("modPrenNumeroDoc").value;
      if (!numDoc || numDoc.length < 5) {
        window.AdminGlobal.ToastManager.show(
          "Numero documento deve essere di almeno 5 caratteri",
          "error"
        );
        return;
      }
    }

    // Normalizza telefono
    const telefonoNormalizzato = telefono.replace(/\s/g, "");

    // Validazione data
    const dataPrenotazione = document.getElementById("modPrenData").value;
    if (!dataPrenotazione || dataPrenotazione.trim() === "") {
      if (window.AdminGlobal?.ToastManager) {
        window.AdminGlobal.ToastManager.show("La data è obbligatoria", "error");
      } else {
        alert("La data è obbligatoria");
      }
      return;
    }

    // Prepara dati
    const dati = {
      campo_id: parseInt(document.getElementById("modPrenCampo").value),
      utente_id: parseInt(document.getElementById("modPrenUtenteId").value),
      squadra_id: null, // Admin può modificare solo campi base, non squadra
      data_prenotazione: dataPrenotazione,
      ora_inizio: document.getElementById("modPrenOraInizio").value,
      ora_fine: document.getElementById("modPrenOraFine").value,
      tipo_attivita: null,
      telefono: telefonoNormalizzato,
      tipo_documento: tipoDoc || null,
      codice_fiscale:
        tipoDoc === "CF"
          ? document.getElementById("modPrenCodiceFiscale").value.toUpperCase()
          : null,
      numero_documento:
        tipoDoc === "ID"
          ? document.getElementById("modPrenNumeroDoc").value.toUpperCase()
          : null,
      note: document.getElementById("modPrenNote").value || null,
      modified_by_admin: true,
    };

    console.log("[MODIFICA] Dati da inviare:", dati);

    const loadingToast = window.AdminGlobal?.ToastManager?.show(
      "Salvataggio in corso...",
      "info"
    );

    const response = await fetch(`/prenotazione/prenotazioni/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dati),
    });

    const result = await response.json();
    console.log("[MODIFICA] Risposta server:", response.status, result);

    if (loadingToast?.hide) loadingToast.hide();

    if (response.ok) {
      if (window.AdminGlobal?.ToastManager) {
        window.AdminGlobal.ToastManager.show(
          "Prenotazione modificata con successo",
          "success"
        );
      } else {
        alert("Prenotazione modificata con successo");
      }
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("modificaPrenotazioneModal")
      );
      if (modal) modal.hide();
      setTimeout(() => location.reload(), 1500);
    } else {
      const errorMsg =
        result.error || result.message || "Errore durante il salvataggio";
      console.error("[MODIFICA] Errore:", errorMsg);
      if (window.AdminGlobal?.ToastManager) {
        window.AdminGlobal.ToastManager.show(errorMsg, "error");
      } else {
        alert("Errore: " + errorMsg);
      }
    }
  } catch (error) {
    console.error("Errore salvataggio:", error);
    if (window.AdminGlobal?.ToastManager) {
      window.AdminGlobal.ToastManager.show(
        "Errore di connessione: " + error.message,
        "error"
      );
    } else {
      alert("Errore di connessione: " + error.message);
    }
  }
}

async function eliminaPrenotazione(id) {
  const doDelete = async () => {
    try {
      const response = await fetch(`/admin/prenotazioni/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok) {
        if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
          window.AdminGlobal.ToastManager.show(
            "Prenotazione eliminata",
            "success"
          );
        }
        setTimeout(() => location.reload(), 1500);
      } else {
        if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
          window.AdminGlobal.ToastManager.show(
            data.error || "Errore durante l'eliminazione",
            "error"
          );
        }
      }
    } catch (error) {
      console.error("Errore:", error);
      if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
        window.AdminGlobal.ToastManager.show("Errore di connessione", "error");
      }
    }
  };

  if (window.AdminGlobal && window.AdminGlobal.modalManager) {
    window.AdminGlobal.modalManager.confirm({
      title: "Elimina prenotazione",
      message: "Eliminare definitivamente questa prenotazione?",
      confirmText: "Elimina",
      cancelText: "Annulla",
      type: "danger",
      onConfirm: doDelete,
    });
  } else {
    if (!confirm("Eliminare definitivamente questa prenotazione?")) return;
    await doDelete();
  }
}

async function riattivaPrenotazione(id) {
  const doReactivate = async () => {
    try {
      const response = await fetch(`/admin/prenotazioni/${id}/riattiva`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok) {
        if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
          window.AdminGlobal.ToastManager.show(
            "Prenotazione riattivata",
            "success"
          );
        }
        setTimeout(() => location.reload(), 1500);
      } else {
        if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
          window.AdminGlobal.ToastManager.show(
            data.error || "Errore durante la riattivazione",
            "error"
          );
        }
      }
    } catch (error) {
      console.error("Errore:", error);
      if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
        window.AdminGlobal.ToastManager.show("Errore di connessione", "error");
      }
    }
  };

  if (window.AdminGlobal && window.AdminGlobal.modalManager) {
    window.AdminGlobal.modalManager.confirm({
      title: "Riattiva prenotazione",
      message: "Riattivare questa prenotazione?",
      confirmText: "Riattiva",
      cancelText: "Annulla",
      type: "success",
      onConfirm: doReactivate,
    });
  } else {
    if (!confirm("Riattivare questa prenotazione?")) return;
    await doReactivate();
  }
}
