/* ============ Artchel Events: script.js ============ */
(function () {
  "use strict";

  const WHATSAPP_NUMBER = "254726887680"; // +254 726 887 680 (no plus or spaces)

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- Footer year ---------- */
  $("#year").textContent = new Date().getFullYear();

  /* ---------- Mobile menu ---------- */
  const hamburger = $("#hamburger");
  const nav = $("#nav");

  function setMenu(open) {
    nav.classList.toggle("open", open);
    hamburger.classList.toggle("open", open);
    hamburger.setAttribute("aria-expanded", String(open));
  }
  hamburger.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
  // Close menu after tapping a link
  $$("a", nav).forEach((a) => a.addEventListener("click", () => setMenu(false)));

  /* ---------- Smooth scroll fallback (for older browsers) ---------- */
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      if (id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", id);
    });
  });

  /* ---------- Modal ---------- */
  const modal = $("#modal");
  const form = $("#booking-form");
  const dateInput = $("#eventDate");
  let lastFocused = null;

  // Prevent selecting past dates
  function setMinDate() {
    const t = new Date();
    t.setMinutes(t.getMinutes() - t.getTimezoneOffset());
    dateInput.min = t.toISOString().split("T")[0];
  }

  function openModal() {
    lastFocused = document.activeElement;
    setMinDate();
    setMenu(false);
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    $("#name").focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  $$("[data-open-modal]").forEach((b) => b.addEventListener("click", openModal));
  $$("[data-close-modal]").forEach((b) => b.addEventListener("click", closeModal));

  document.addEventListener("keydown", (e) => {
    if (modal.hidden) return;
    if (e.key === "Escape") return closeModal();

    // Simple focus trap
    if (e.key === "Tab") {
      const focusable = $$('button, input, select, textarea, a[href]', modal).filter((el) => !el.disabled && el.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  /* ---------- Form validation + WhatsApp redirect ---------- */
  function showError(name, message) {
    const el = $(`[data-error-for="${name}"]`);
    if (el) el.textContent = message || "";
    const field = form.elements[name];
    if (field && field.classList) field.classList.toggle("invalid", Boolean(message));
  }

  function formatDate(value) {
    // value is yyyy-mm-dd; build a local date to avoid timezone shifts
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = form.elements.name.value.trim();
    const eventType = form.elements.eventType.value;
    const eventDate = form.elements.eventDate.value;
    const location = form.elements.location.value.trim();
    const notes = form.elements.notes.value.trim();
    const services = $$('input[name="services"]:checked', form).map((c) => c.value);

    // Reset errors
    ["name", "eventType", "eventDate", "services"].forEach((f) => showError(f, ""));

    let valid = true;
    if (!name) { showError("name", "Please enter your name."); valid = false; }
    if (!eventType) { showError("eventType", "Select an event type."); valid = false; }
    if (!eventDate) {
      showError("eventDate", "Choose your event date."); valid = false;
    } else if (eventDate < dateInput.min) {
      showError("eventDate", "Date can't be in the past."); valid = false;
    }
    if (!services.length) { showError("services", "Select at least one service."); valid = false; }

    if (!valid) {
      const firstInvalid = $(".invalid", form) || $(".error:not(:empty)", form);
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const lines = [
      "Hello Artchel Events! I'd like to make a booking inquiry.",
      "",
      `*Name:* ${name}`,
      `*Event type:* ${eventType}`,
      `*Date:* ${formatDate(eventDate)}`,
      location ? `*Location:* ${location}` : null,
      `*Services needed:* ${services.join(", ")}`,
      notes ? `*Details:* ${notes}` : null,
      "",
      "Please share availability and a quote. Thank you!",
    ].filter((l) => l !== null);

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank", "noopener");
    form.reset();
    closeModal();
  });

  // Clear an error as soon as the user fixes the field
  form.addEventListener("input", (e) => {
    const t = e.target;
    if (t.name) showError(t.name, "");
  });
})();
