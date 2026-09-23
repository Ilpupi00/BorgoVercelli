/**
 * @fileoverview Script per la pagina SecureGuard (Sicurezza Account)
 * @description Gestisce:
 * - Toggle sidebar su mobile
 * - Animazione anello score
 * - Smooth scroll per link sidebar
 * - Interazioni UI leggere
 */

"use strict";

document.addEventListener("DOMContentLoaded", function () {
  // ==================== SIDEBAR MOBILE TOGGLE ====================
  const sidebar = document.getElementById("sgSidebar");
  const toggleBtn = document.getElementById("sgSidebarToggle");
  const overlay = document.getElementById("sgSidebarOverlay");

  if (toggleBtn && sidebar && overlay) {
    toggleBtn.addEventListener("click", function () {
      sidebar.classList.toggle("sg-sidebar--open");
      overlay.classList.toggle("active");

      // Swap icon
      const icon = toggleBtn.querySelector("i");
      if (sidebar.classList.contains("sg-sidebar--open")) {
        icon.className = "bi bi-x-lg";
        document.body.style.overflow = "hidden";
      } else {
        icon.className = "bi bi-shield-shaded";
        document.body.style.overflow = "";
      }
    });

    overlay.addEventListener("click", function () {
      sidebar.classList.remove("sg-sidebar--open");
      overlay.classList.remove("active");
      const icon = toggleBtn.querySelector("i");
      icon.className = "bi bi-shield-shaded";
      document.body.style.overflow = "";
    });
  }

  // ==================== SCORE RING ANIMATION ====================
  const scoreRing = document.getElementById("sgScoreRing");
  const scoreValue = document.getElementById("sgScoreValue");

  if (scoreRing && scoreValue) {
    const targetPct = parseInt(scoreRing.style.getPropertyValue("--pct"), 10) || 0;

    // Start from 0 and animate to target
    scoreRing.style.setProperty("--pct", "0");

    // Small delay so the initial state renders
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        animateScore(scoreRing, scoreValue, targetPct);
      });
    });
  }

  /**
   * Animates the score ring from 0 to target value
   * @param {HTMLElement} ring - Score ring element
   * @param {HTMLElement} valueEl - Score value display element
   * @param {number} target - Target percentage
   */
  function animateScore(ring, valueEl, target) {
    const duration = 1200; // ms
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(eased * target);

      ring.style.setProperty("--pct", currentVal);
      valueEl.innerHTML = currentVal + "<small>%</small>";

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  // ==================== SMOOTH SCROLL FOR SIDEBAR LINKS ====================
  document.querySelectorAll('.sg-sidebar__nav-link[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (!targetId || targetId === "#") return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" });

        // Close mobile sidebar if open
        if (sidebar && sidebar.classList.contains("sg-sidebar--open")) {
          sidebar.classList.remove("sg-sidebar--open");
          overlay.classList.remove("active");
          const icon = toggleBtn.querySelector("i");
          if (icon) icon.className = "bi bi-shield-shaded";
          document.body.style.overflow = "";
        }
      }
    });
  });

  // ==================== ACTIVE SECTION HIGHLIGHTING ====================
  // Highlight sidebar link based on scroll position
  const sections = ["score-section", "password-section", "twofa-section", "activity-section", "sessions-section"];
  const navLinks = document.querySelectorAll(".sg-sidebar__nav-link");

  function updateActiveSection() {
    const scrollY = window.scrollY + 120; // offset for navbar

    for (let i = sections.length - 1; i >= 0; i--) {
      const section = document.getElementById(sections[i]);
      if (section && section.offsetTop <= scrollY) {
        navLinks.forEach(function (link) {
          const href = link.getAttribute("href");
          if (href === "#" + sections[i]) {
            link.classList.add("sg-sidebar__nav-link--active");
          } else if (href && href.startsWith("#")) {
            link.classList.remove("sg-sidebar__nav-link--active");
          }
        });
        break;
      }
    }
  }

  // Throttled scroll listener
  let scrollTicking = false;
  window.addEventListener("scroll", function () {
    if (!scrollTicking) {
      requestAnimationFrame(function () {
        updateActiveSection();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  });

  // ==================== SECURITY ACTIONS ====================

  // 1. Modifica Password
  const changePasswordForm = document.getElementById("changePasswordForm");
  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const msgDiv = document.getElementById("changePasswordMsg");
      const currentPassword = document.getElementById("currentPassword").value;
      const newPassword = document.getElementById("newPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;
      const btn = document.getElementById("changePasswordSubmitBtn");

      if (newPassword !== confirmPassword) {
        msgDiv.innerHTML = `<div class="alert alert-danger">Le nuove password non corrispondono.</div>`;
        return;
      }

      msgDiv.innerHTML = "";
      btn.disabled = true;

      try {
        const response = await fetch("/api/user/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        const data = await response.json();
        if (response.ok) {
          msgDiv.innerHTML = `<div class="alert alert-success">${data.message || "Password aggiornata."}</div>`;
          changePasswordForm.reset();
          setTimeout(() => {
            const modalEl = document.getElementById("changePasswordModal");
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
            window.location.reload();
          }, 1500);
        } else {
          msgDiv.innerHTML = `<div class="alert alert-danger">${data.error || "Errore."}</div>`;
        }
      } catch (err) {
        msgDiv.innerHTML = `<div class="alert alert-danger">Errore di rete. Riprova.</div>`;
      } finally {
        btn.disabled = false;
      }
    });
  }

  // 2. Toggle 2FA
  const btnToggle2FA = document.getElementById("btnToggle2FA");
  if (btnToggle2FA) {
    btnToggle2FA.addEventListener("click", async function () {
      const currentStatus = this.getAttribute("data-status") === "true";
      const newStatus = !currentStatus;
      
      this.disabled = true;
      try {
        const res = await fetch("/users/security/2fa/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        const data = await res.json();
        if (data.success) {
          window.location.reload();
        } else {
          alert(data.error || "Errore durante l'operazione.");
          this.disabled = false;
        }
      } catch (err) {
        alert("Errore di rete.");
        this.disabled = false;
      }
    });
  }

  // 3. Revoca Sessioni
  const btnRevokeSessions = document.getElementById("btnRevokeSessions");
  if (btnRevokeSessions) {
    btnRevokeSessions.addEventListener("click", async function () {
      this.disabled = true;
      try {
        const res = await fetch("/users/security/sessions/revoke", {
          method: "POST"
        });
        const data = await res.json();
        if (data.success) {
          alert(data.message);
          window.location.reload();
        } else {
          alert(data.error || "Errore durante l'operazione.");
          this.disabled = false;
        }
      } catch (err) {
        alert("Errore di rete.");
        this.disabled = false;
      }
    });
  }
});
