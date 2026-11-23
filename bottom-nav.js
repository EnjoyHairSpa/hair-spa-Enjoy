
// bottom-nav.js
// Richiede config.js e Supabase già caricati.

(function () {

  const NAV_ITEMS = [
    {
      label: "Crea Percorso",
      href: "percorsi.html",
      icon: `
        <svg viewBox="0 0 24 24" width="23" height="23"
             fill="none" stroke="currentColor" stroke-width="1.6"
             stroke-linecap="round" stroke-linejoin="round"
             aria-hidden="true">
          <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/>
          <path d="m19 14 1 2.5 2.5 1-2.5 1L19 21l-1-2.5-2.5-1 2.5-1L19 14Z"/>
        </svg>
      `
    },
    {
      label: "Prenota",
      href: "prenotazione.html",
      icon: `
        <svg viewBox="0 0 24 24" width="23" height="23"
             fill="none" stroke="currentColor" stroke-width="1.6"
             stroke-linecap="round" stroke-linejoin="round"
             aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2"/>
          <path d="M16 3v4M8 3v4M3 11h18"/>
          <path d="M8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h.01"/>
        </svg>
      `
    },
    {
      label: "Notifiche",
      href: "notifiche.html",
      badge: true,
      icon: `
        <svg viewBox="0 0 24 24" width="23" height="23"
             fill="none" stroke="currentColor" stroke-width="1.6"
             stroke-linecap="round" stroke-linejoin="round"
             aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/>
          <path d="M10 21h4"/>
        </svg>
      `
    },
    {
      label: "Home",
      href: "area-riservata.html",
      icon: `
        <svg viewBox="0 0 24 24" width="23" height="23"
             fill="none" stroke="currentColor" stroke-width="1.6"
             stroke-linecap="round" stroke-linejoin="round"
             aria-hidden="true">
          <path d="m3 10 9-7 9 7"/>
          <path d="M5 9v11h14V9"/>
          <path d="M9 20v-6h6v6"/>
        </svg>
      `
    }
  ];

  function currentPage() {
    return window.location.pathname.split("/").pop();
  }

  function buildNav() {
    if (document.getElementById("bottom-nav")) return;

    const nav = document.createElement("nav");
    nav.id = "bottom-nav";
    nav.setAttribute("aria-label", "Navigazione principale");

    const page = currentPage();

    nav.innerHTML = NAV_ITEMS.map(item => {
      const isActive = item.href === page;

      const badgeHtml = item.badge
        ? `<span class="bn-badge" id="bnBadgeNotifiche" style="display:none;"></span>`
        : "";

      return `
        <a href="${item.href}"
           class="bn-item ${isActive ? "bn-active" : ""}"
           ${isActive ? 'aria-current="page"' : ""}>

          <span class="bn-icon">
            ${item.icon}
            ${badgeHtml}
          </span>

          <span class="bn-label">${item.label}</span>

          <span class="bn-indicator"></span>
        </a>
      `;
    }).join("");

    document.body.appendChild(nav);
    document.body.classList.add("has-bottom-nav");
  }

  async function aggiornaBadgeNotifiche() {
    const badge = document.getElementById("bnBadgeNotifiche");
    if (!badge) return;

    try {
      const { count, error } = await _supabase
        .from("notifiche_push")
        .select("id", { count: "exact", head: true })
        .eq("letta", false);

      if (error) {
        console.error("Errore conteggio notifiche:", error);
        return;
      }

      badge.style.display = Number(count) > 0 ? "block" : "none";

    } catch (err) {
      console.error("Errore notifiche:", err);
    }
  }

  async function initBottomNav() {
    try {
      const { data: { user } } = await _supabase.auth.getUser();

      if (user) {
        buildNav();
        aggiornaBadgeNotifiche();
      }

    } catch (err) {
      console.error("Errore navigazione:", err);
    }
  }

  document.addEventListener("DOMContentLoaded", initBottomNav);

})();
