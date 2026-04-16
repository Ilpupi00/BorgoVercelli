/**
 * Calendario Prenotazioni — Mese / Settimana / Giorno
 * Teams-inspired week grid with drag-to-detail, day timeline
 */
(function () {
  "use strict";

  // ============= CONSTANTS =============
  const MONTHS = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
  const DAYS_LONG  = ["Domenica","Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"];
  const DAYS_SHORT = ["Dom","Lun","Mar","Mer","Gio","Ven","Sab"];
  const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon→Sun
  const START_HOUR = 7;
  const END_HOUR   = 23;

  const STATUS_LABEL = { confermata:"Confermata", in_attesa:"In Attesa", annullata:"Annullata", scaduta:"Scaduta" };
  const STATUS_COLOR = { confermata:"#10b981", in_attesa:"#f59e0b", annullata:"#ef4444", scaduta:"#6b7280" };

  // ============= STATE =============
  let state = {
    view: "month",          // "month" | "week" | "day"
    currentDate: new Date(),
    prenotazioni: [],
    campi: [],
    filters: { campo: "", stato: "" },
  };

  // ============= HELPERS =============
  const isoDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2,"0");
    const dd = String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${dd}`;
  };

  const getBookings = (dateStr) =>
    state.prenotazioni.filter(p => {
      const pd = isoDate(new Date(p.data_prenotazione));
      if (state.filters.campo && p.campo_id != state.filters.campo) return false;
      if (state.filters.stato && p.stato !== state.filters.stato) return false;
      return pd === dateStr;
    });

  const parseTime = (str) => {
    if (!str) return 0;
    const [h, m] = str.split(":").map(Number);
    return h * 60 + (m || 0);
  };

  // ============= NAVIGATION LABEL =============
  function updateNavLabel() {
    const el = document.getElementById("currentPeriod");
    if (!el) return;
    const d = state.currentDate;
    if (state.view === "month") {
      el.textContent = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    } else if (state.view === "week") {
      const mon = getMonday(d);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      el.textContent = `${mon.getDate()} – ${sun.getDate()} ${MONTHS[sun.getMonth()]} ${sun.getFullYear()}`;
    } else {
      el.textContent = `${DAYS_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    }
  }

  function getMonday(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = (day === 0) ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    return date;
  }

  // ============= NAVIGATE =============
  function navigate(dir) {
    const d = state.currentDate;
    if (state.view === "month") {
      d.setMonth(d.getMonth() + dir);
    } else if (state.view === "week") {
      d.setDate(d.getDate() + dir * 7);
    } else {
      d.setDate(d.getDate() + dir);
    }
    render();
  }

  // ============= RENDER DISPATCH =============
  function render() {
    updateNavLabel();
    const container = document.getElementById("calViewContainer");
    if (!container) return;
    container.innerHTML = "";
    if (state.view === "month")  renderMonth(container);
    if (state.view === "week")   renderWeek(container);
    if (state.view === "day")    renderDay(container);
  }

  // ============= MONTH VIEW =============
  function renderMonth(container) {
    // Header giorni
    const headerDays = document.createElement("div");
    headerDays.className = "cal-month-header";
    WEEK_ORDER.forEach(d => {
      const h = document.createElement("div");
      h.className = "cal-month-dayname";
      h.textContent = DAYS_SHORT[d];
      headerDays.appendChild(h);
    });
    container.appendChild(headerDays);

    const grid = document.createElement("div");
    grid.className = "cal-month-grid";

    const d = state.currentDate;
    const year  = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Offset: Mon=0
    let offset = firstDay.getDay() - 1;
    if (offset < 0) offset = 6;

    // Prev month padding
    const prevLast = new Date(year, month, 0).getDate();
    for (let i = offset - 1; i >= 0; i--) {
      grid.appendChild(createMonthCell(prevLast - i, year, month - 1, true));
    }
    // Current month
    for (let day = 1; day <= daysInMonth; day++) {
      grid.appendChild(createMonthCell(day, year, month, false));
    }
    // Next month fill
    const totalCells = grid.children.length;
    const remaining  = (7 - (totalCells % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      grid.appendChild(createMonthCell(day, year, month + 1, true));
    }

    container.appendChild(grid);
  }

  function createMonthCell(day, year, month, isOther) {
    const cell = document.createElement("div");
    cell.className = "cal-month-cell" + (isOther ? " other-month" : "");

    const date    = new Date(year, month, day);
    const dateStr = isoDate(date);
    const today   = new Date();
    if (date.toDateString() === today.toDateString()) cell.classList.add("today");

    const num = document.createElement("div");
    num.className = "cal-day-num";
    num.textContent = day;
    cell.appendChild(num);

    if (!isOther) {
      const bookings = getBookings(dateStr);
      if (bookings.length > 0) {
        cell.classList.add("has-bookings");
        const dots = document.createElement("div");
        dots.className = "cal-month-dots";
        bookings.slice(0, 3).forEach(b => {
          const dot = document.createElement("span");
          dot.className = `cal-dot cal-dot-${b.stato}`;
          dots.appendChild(dot);
        });
        if (bookings.length > 3) {
          const more = document.createElement("span");
          more.className = "cal-dot-more";
          more.textContent = `+${bookings.length - 3}`;
          dots.appendChild(more);
        }
        cell.appendChild(dots);
      }
      cell.addEventListener("click", () => showDayModal(date, getBookings(dateStr)));
    }

    return cell;
  }

  // ============= WEEK VIEW (Teams-style grid) =============
  function renderWeek(container) {
    const mon    = getMonday(state.currentDate);
    const today  = new Date();
    const calStart = START_HOUR * 60;
    const calEnd   = END_HOUR   * 60;
    const totalMin = calEnd - calStart;

    const wrapper = document.createElement("div");
    wrapper.className = "cal-week-wrapper";

    // ---- Time axis ----
    const timeAxis = document.createElement("div");
    timeAxis.className = "cal-week-timeaxis";
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      const lbl = document.createElement("div");
      lbl.className = "cal-week-timelabel";
      lbl.textContent = `${String(h).padStart(2,"0")}:00`;
      timeAxis.appendChild(lbl);
    }

    // ---- Columns wrapper ----
    const colsWrapper = document.createElement("div");
    colsWrapper.className = "cal-week-cols";

    // ---- Grid lines overlay ----
    const gridLines = document.createElement("div");
    gridLines.className = "cal-week-gridlines";
    for (let h = START_HOUR; h < END_HOUR; h++) {
      const ln = document.createElement("div");
      ln.className = "cal-week-hourline";
      gridLines.appendChild(ln);
    }
    colsWrapper.appendChild(gridLines);

    // ---- Headers bar ----
    const headersBar = document.createElement("div");
    headersBar.className = "cal-week-headers";
    const headerSpacer = document.createElement("div");
    headerSpacer.className = "cal-week-header-spacer";
    headersBar.appendChild(headerSpacer);

    // ---- Day columns ----
    for (let i = 0; i < 7; i++) {
      const day = new Date(mon);
      day.setDate(mon.getDate() + i);
      const dateStr = isoDate(day);
      const isToday  = day.toDateString() === today.toDateString();

      // Header
      const hdr = document.createElement("div");
      hdr.className = "cal-week-col-header" + (isToday ? " today" : "");
      hdr.innerHTML = `<span class="cal-week-dayname">${DAYS_SHORT[WEEK_ORDER[i]]}</span><span class="cal-week-daynum${isToday ? " today-num" : ""}">${day.getDate()}</span>`;
      headersBar.appendChild(hdr);

      // Column
      const col = document.createElement("div");
      col.className = "cal-week-col";
      col.style.height = `${totalMin}px`;

      // Bookings in column
      getBookings(dateStr).forEach(b => {
        const startM = parseTime(b.ora_inizio) - calStart;
        const endM   = parseTime(b.ora_fine)   - calStart;
        const top    = Math.max(startM, 0);
        const height = Math.max(endM - startM, 20);

        const slot = document.createElement("div");
        slot.className = `cal-week-slot cal-slot-${b.stato}`;
        slot.style.top    = `${top}px`;
        slot.style.height = `${height}px`;
        slot.innerHTML = `
          <div class="cal-slot-title">${b.campo_nome || "Campo " + b.campo_id}</div>
          <div class="cal-slot-time">${(b.ora_inizio||"").slice(0,5)} – ${(b.ora_fine||"").slice(0,5)}</div>
          ${b.utente_nome ? `<div class="cal-slot-user">${b.utente_nome} ${b.utente_cognome||""}</div>` : ""}
        `;
        slot.addEventListener("click", () => showBookingModal(b));
        col.appendChild(slot);
      });

      // Current time indicator
      if (isToday) {
        const now = new Date();
        const nowMin = now.getHours() * 60 + now.getMinutes() - calStart;
        if (nowMin >= 0 && nowMin <= totalMin) {
          const indicator = document.createElement("div");
          indicator.className = "cal-week-now";
          indicator.style.top = `${nowMin}px`;
          col.appendChild(indicator);
        }
      }

      colsWrapper.appendChild(col);
    }

    // Assemble
    const innerRow = document.createElement("div");
    innerRow.className = "cal-week-inner";
    innerRow.appendChild(timeAxis);
    innerRow.appendChild(colsWrapper);

    wrapper.appendChild(headersBar);
    wrapper.appendChild(innerRow);
    container.appendChild(wrapper);

    // Scroll to 08:00
    requestAnimationFrame(() => {
      const scrollTarget = (8 - START_HOUR) * 60 - 30;
      innerRow.scrollTop = Math.max(scrollTarget, 0);
    });
  }

  // ============= DAY VIEW =============
  function renderDay(container) {
    const d      = state.currentDate;
    const dateStr = isoDate(d);
    const bookings = getBookings(dateStr);
    const calStart = START_HOUR * 60;
    const calEnd   = END_HOUR   * 60;
    const totalMin = calEnd - calStart;

    const wrapper = document.createElement("div");
    wrapper.className = "cal-day-wrapper";

    // ---- Header del giorno ----
    const dayHeader = document.createElement("div");
    dayHeader.className = "cal-day-header";
    dayHeader.innerHTML = `
      <span class="cal-day-name">${DAYS_LONG[d.getDay()]}</span>
      <span class="cal-day-date">${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}</span>
      <span class="cal-day-count">${bookings.length} prenotazion${bookings.length === 1 ? "e" : "i"}</span>
    `;
    wrapper.appendChild(dayHeader);

    // ---- Timeline ----
    const timeline = document.createElement("div");
    timeline.className = "cal-day-timeline";

    const timeAxis = document.createElement("div");
    timeAxis.className = "cal-day-timeaxis";
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      const lbl = document.createElement("div");
      lbl.className = "cal-day-timelabel";
      lbl.textContent = `${String(h).padStart(2,"0")}:00`;
      timeAxis.appendChild(lbl);
    }

    const eventsCol = document.createElement("div");
    eventsCol.className = "cal-day-events";
    eventsCol.style.height = `${totalMin}px`;

    // Grid lines
    for (let h = START_HOUR; h < END_HOUR; h++) {
      const ln = document.createElement("div");
      ln.className = "cal-day-hourline";
      ln.style.top = `${(h - START_HOUR) * 60}px`;
      eventsCol.appendChild(ln);
    }

    // Current time
    const now = new Date();
    if (isoDate(now) === dateStr) {
      const nowMin = now.getHours() * 60 + now.getMinutes() - calStart;
      if (nowMin >= 0 && nowMin <= totalMin) {
        const indicator = document.createElement("div");
        indicator.className = "cal-day-now";
        indicator.style.top = `${nowMin}px`;
        eventsCol.appendChild(indicator);
      }
    }

    if (bookings.length === 0) {
      const empty = document.createElement("div");
      empty.className = "cal-day-empty";
      empty.innerHTML = `<i class="bi bi-calendar-x"></i><p>Nessuna prenotazione per oggi</p>`;
      eventsCol.appendChild(empty);
    } else {
      bookings.forEach(b => {
        const startM = parseTime(b.ora_inizio) - calStart;
        const endM   = parseTime(b.ora_fine)   - calStart;
        const top    = Math.max(startM, 0);
        const height = Math.max(endM - startM, 30);

        const slot = document.createElement("div");
        slot.className = `cal-day-slot cal-slot-${b.stato}`;
        slot.style.top    = `${top}px`;
        slot.style.height = `${height}px`;
        slot.innerHTML = `
          <div class="cal-day-slot-header">
            <span class="cal-day-slot-campo">${b.campo_nome || "Campo " + b.campo_id}</span>
            <span class="cal-day-slot-status cal-slot-${b.stato}">${STATUS_LABEL[b.stato] || b.stato}</span>
          </div>
          <div class="cal-day-slot-time"><i class="bi bi-clock"></i> ${(b.ora_inizio||"").slice(0,5)} – ${(b.ora_fine||"").slice(0,5)}</div>
          ${b.utente_nome ? `<div class="cal-day-slot-user"><i class="bi bi-person"></i> ${b.utente_nome} ${b.utente_cognome||""}</div>` : ""}
          ${b.squadra_nome ? `<div class="cal-day-slot-user"><i class="bi bi-people"></i> ${b.squadra_nome}</div>` : ""}
          ${b.tipo_attivita ? `<div class="cal-day-slot-user"><i class="bi bi-tag"></i> ${b.tipo_attivita}</div>` : ""}
        `;
        slot.addEventListener("click", () => showBookingModal(b));
        eventsCol.appendChild(slot);
      });
    }

    timeline.appendChild(timeAxis);
    timeline.appendChild(eventsCol);
    wrapper.appendChild(timeline);
    container.appendChild(wrapper);

    // Scroll to 08:00
    requestAnimationFrame(() => {
      timeline.scrollTop = Math.max((8 - START_HOUR) * 60 - 30, 0);
    });
  }

  // ============= MODALS =============
  function showDayModal(date, bookings) {
    const modal = document.getElementById("dayModal");
    const title = document.getElementById("modalTitle");
    const body  = document.getElementById("modalBody");
    if (!modal || !title || !body) return;

    title.textContent = `${DAYS_LONG[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    body.innerHTML    = bookings.length === 0
      ? `<div class="empty-state"><i class="bi bi-calendar-x"></i><p>Nessuna prenotazione per questo giorno</p></div>`
      : bookings.map(b => buildBookingCard(b)).join("");

    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function showBookingModal(b) {
    const modal = document.getElementById("dayModal");
    const title = document.getElementById("modalTitle");
    const body  = document.getElementById("modalBody");
    if (!modal || !title || !body) return;

    title.innerHTML = `<i class="bi bi-calendar-check me-2"></i>Dettaglio Prenotazione`;
    body.innerHTML  = buildBookingCard(b);

    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function buildBookingCard(b) {
    return `
      <div class="booking-card ${b.stato}">
        <div class="booking-header">
          <div class="booking-campo">${b.campo_nome || "Campo " + b.campo_id}</div>
          <span class="booking-status ${b.stato}">${STATUS_LABEL[b.stato] || b.stato}</span>
        </div>
        <div class="booking-details">
          <div class="booking-detail"><i class="bi bi-clock"></i><span>${(b.ora_inizio||"").slice(0,5)} – ${(b.ora_fine||"").slice(0,5)}</span></div>
          ${b.utente_nome ? `<div class="booking-detail"><i class="bi bi-person"></i><span>${b.utente_nome} ${b.utente_cognome||""}</span></div>` : ""}
          ${b.squadra_nome ? `<div class="booking-detail"><i class="bi bi-people"></i><span>${b.squadra_nome}</span></div>` : ""}
          ${b.tipo_attivita ? `<div class="booking-detail"><i class="bi bi-tag"></i><span>${b.tipo_attivita}</span></div>` : ""}
          ${b.note ? `<div class="booking-detail"><i class="bi bi-chat-left-text"></i><span>${b.note}</span></div>` : ""}
        </div>
      </div>`;
  }

  function closeModal() {
    const modal = document.getElementById("dayModal");
    if (modal) { modal.style.display = "none"; document.body.style.overflow = ""; }
  }

  // ============= EXPORT =============

  // Internal state for export period navigation
  const exportState = {
    type: "mensile",          // mensile | settimanale | giornaliero | custom
    ref: new Date(),          // reference date
  };

  function getExportDates() {
    const d = new Date(exportState.ref);
    if (exportState.type === "mensile") {
      const first = new Date(d.getFullYear(), d.getMonth(), 1);
      const last  = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      return { start: isoDate(first), end: isoDate(last) };
    }
    if (exportState.type === "settimanale") {
      const mon = getMonday(d);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      return { start: isoDate(mon), end: isoDate(sun) };
    }
    if (exportState.type === "giornaliero") {
      return { start: isoDate(d), end: isoDate(d) };
    }
    // custom: letti dai campi input
    return {
      start: document.getElementById("dataInizio")?.value || isoDate(d),
      end:   document.getElementById("dataFine")?.value   || isoDate(d),
    };
  }

  function updateExportLabels() {
    const d = new Date(exportState.ref);
    const { start, end } = getExportDates();

    // Mese label
    const meseEl = document.getElementById("meseLabel");
    if (meseEl) meseEl.textContent = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

    // Settimana label
    const settEl = document.getElementById("settLabel");
    if (settEl) {
      const mon = getMonday(d);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      settEl.textContent = `${mon.getDate()} – ${sun.getDate()} ${MONTHS[sun.getMonth()]} ${sun.getFullYear()}`;
    }

    // Giorno label
    const giornoEl = document.getElementById("giornoLabel");
    if (giornoEl) {
      giornoEl.textContent = `${DAYS_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    }

    // Summary
    const summaryEl = document.getElementById("exportSummaryText");
    if (summaryEl) {
      const labels = { mensile: "Mensile", settimanale: "Settimanale", giornaliero: "Giornaliero", custom: "Personalizzato" };
      const fmtDate = (s) => new Date(s + "T00:00:00").toLocaleDateString("it-IT");
      const periodStr = start === end ? fmtDate(start) : `${fmtDate(start)} → ${fmtDate(end)}`;
      summaryEl.textContent = `${labels[exportState.type]}: ${periodStr}`;
    }
  }

  function showExportPeriodUI() {
    const ids = ["periodMensile","periodSettimanale","periodGiornaliero","periodCustom"];
    const map = { mensile:"periodMensile", settimanale:"periodSettimanale", giornaliero:"periodGiornaliero", custom:"periodCustom" };
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });
    const active = document.getElementById(map[exportState.type]);
    if (active) active.style.display = "block";
  }

  function openExportModal() {
    // Sync ref with current calendar date
    exportState.ref  = new Date(state.currentDate);
    exportState.type = state.view === "day" ? "giornaliero" : state.view === "week" ? "settimanale" : "mensile";

    const exportModal = document.getElementById("exportModal");
    if (!exportModal) return;

    // Sync active button
    document.querySelectorAll(".export-type-btn").forEach(b => {
      b.classList.toggle("active", b.getAttribute("data-type") === exportState.type);
    });

    showExportPeriodUI();
    updateExportLabels();

    exportModal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  async function handleExportSubmit(e) {
    e.preventDefault();
    const { start: dataInizio, end: dataFine } = getExportDates();
    const campo = document.getElementById("campoExport").value;
    const stato = document.getElementById("statoExport").value;
    if (!dataInizio || !dataFine) { alert("Periodo non valido"); return; }
    if (new Date(dataInizio) > new Date(dataFine)) { alert("La data di inizio deve essere precedente alla data di fine"); return; }
    const btn = document.getElementById("exportSubmitBtn");
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Generazione in corso...';
    try {
      const params = new URLSearchParams({ dataInizio, dataFine });
      if (campo) params.append("campo", campo);
      if (stato) params.append("stato", stato);
      const res = await fetch(`/prenotazione/export-report?${params}`);
      if (!res.ok) throw new Error("Errore durante la generazione del report");
      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      const typeSuffix = { mensile:"Mensile", settimanale:"Settimanale", giornaliero:"Giornaliero", custom:"Custom" }[exportState.type] || "";
      a.href = url;
      a.download = `Report_Prenotazioni_${typeSuffix}_${dataInizio}${dataInizio !== dataFine ? "_" + dataFine : ""}.xlsx`;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
      document.getElementById("exportModal").style.display = "none";
      document.body.style.overflow = "";
    } catch (err) {
      alert("Errore: " + err.message);
    } finally {
      btn.disabled = false; btn.innerHTML = orig;
    }
  }


  // ============= INIT =============
  function init() {
    state.prenotazioni = window.prenotazioniData || [];
    state.campi        = window.campiData        || [];

    // View switcher buttons
    document.querySelectorAll(".cal-view-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        state.view = btn.getAttribute("data-view");
        document.querySelectorAll(".cal-view-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        render();
      });
    });

    // Navigation
    const prev = document.getElementById("prevPeriod");
    const next = document.getElementById("nextPeriod");
    if (prev) prev.addEventListener("click", () => navigate(-1));
    if (next) next.addEventListener("click", () => navigate(+1));

    // Today
    const todayBtn = document.getElementById("todayBtn");
    if (todayBtn) todayBtn.addEventListener("click", () => {
      state.currentDate = new Date();
      render();
    });

    // Filters
    const cf = document.getElementById("campoFilter");
    const sf = document.getElementById("statoFilter");
    if (cf) cf.addEventListener("change", e => { state.filters.campo = e.target.value; render(); });
    if (sf) sf.addEventListener("change", e => { state.filters.stato = e.target.value; render(); });

    // Modal close
    const closeBtn   = document.getElementById("closeModal");
    const dayModal   = document.getElementById("dayModal");
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (dayModal)  dayModal.addEventListener("click", e => { if (e.target === dayModal) closeModal(); });

    // Export modal — type selector buttons
    document.querySelectorAll(".export-type-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        exportState.type = btn.getAttribute("data-type");
        document.querySelectorAll(".export-type-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        showExportPeriodUI();
        updateExportLabels();
      });
    });

    // Export modal — period navigation
    [
      { prevId:"prevMese",   nextId:"nextMese",   step:(d,dir)=>d.setMonth(d.getMonth()+dir) },
      { prevId:"prevSett",   nextId:"nextSett",   step:(d,dir)=>d.setDate(d.getDate()+dir*7) },
      { prevId:"prevGiorno", nextId:"nextGiorno", step:(d,dir)=>d.setDate(d.getDate()+dir) },
    ].forEach(({ prevId, nextId, step }) => {
      const p = document.getElementById(prevId);
      const n = document.getElementById(nextId);
      if (p) p.addEventListener("click", () => { step(exportState.ref, -1); updateExportLabels(); });
      if (n) n.addEventListener("click", () => { step(exportState.ref, +1); updateExportLabels(); });
    });

    // Custom date fields → update summary live
    ["dataInizio","dataFine"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("change", updateExportLabels);
    });

    // Export open/close
    const exportBtn   = document.getElementById("exportReportBtn");
    const closeExport = document.getElementById("closeExportModal");
    const exportModal = document.getElementById("exportModal");
    const exportForm  = document.getElementById("exportForm");
    if (exportBtn)   exportBtn.addEventListener("click", openExportModal);
    if (closeExport) closeExport.addEventListener("click", () => { exportModal.style.display = "none"; document.body.style.overflow = ""; });
    if (exportModal) exportModal.addEventListener("click", e => { if (e.target === exportModal) { exportModal.style.display = "none"; document.body.style.overflow = ""; }});
    if (exportForm)  exportForm.addEventListener("submit", handleExportSubmit);


    // Keyboard
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft")  navigate(-1);
      if (e.key === "ArrowRight") navigate(+1);
    });

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
