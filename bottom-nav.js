// bottom-nav.js
// Richiede: config.js e supabase-js già caricati PRIMA di questo script

(function () {

  const NAV_ITEMS = [
    { label: "Crea Percorso", icon: "✨", href: "percorsi.html" },
    { label: "Prenota",       icon: "➕", href: "prenotazione.html" },
    { label: "Notifiche",     icon: "🔔", href: "notifiche.html", badge: true },
    { label: "Home",          icon: "🏠", href: "area-riservata.html" }
  ];

  function currentPage() {
    return window.location.pathname.split("/").pop();
  }

  function buildNav() {
    const nav = document.createElement("nav");
    nav.id = "bottom-nav";

    const page = currentPage();

    nav.innerHTML = NAV_ITEMS.map(item => {
      const isActive = item.href === page;
      const badgeHtml = item.badge
        ? `<span class="bn-badge" id="bnBadgeNotifiche" style="display:none;"></span>`
        : "";

      return `
        <a href="${item.href}" class="bn-item ${isActive ? "bn-active" : ""}">
          <span class="bn-icon" style="position: relative; display: inline-block;">
            ${item.icon}
            ${badgeHtml}
          </span>
          <span class="bn-label">${item.label}</span>
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
        console.error("Errore conteggio notifiche non lette:", error);
        return;
      }

      badge.style.display = (count && count > 0) ? "block" : "none";
    } catch (err) {
      console.error("Errore imprevisto conteggio notifiche:", err);
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
      console.error("Errore verifica sessione per bottom-nav:", err);
    }
  }

  document.addEventListener("DOMContentLoaded", initBottomNav);

})();