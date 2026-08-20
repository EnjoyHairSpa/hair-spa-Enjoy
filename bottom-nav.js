// bottom-nav.js
// Richiede: config.js e supabase-js già caricati PRIMA di questo script

(function () {

  const NAV_ITEMS = [
    { label: "Il Percorso", icon: "✨", href: "percorsi.html" },
    { label: "Prenota",     icon: "➕", href: "prenotazione.html" },
    { label: "Home",        icon: "🏠", href: "area-riservata.html" }
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
      return `
        <a href="${item.href}" class="bn-item ${isActive ? "bn-active" : ""}">
          <span class="bn-icon">${item.icon}</span>
          <span class="bn-label">${item.label}</span>
        </a>
      `;
    }).join("");

    document.body.appendChild(nav);
    document.body.classList.add("has-bottom-nav");
  }

  async function initBottomNav() {
    try {
      const { data: { user } } = await _supabase.auth.getUser();
      if (user) {
        buildNav();
      }
    } catch (err) {
      console.error("Errore verifica sessione per bottom-nav:", err);
    }
  }

  document.addEventListener("DOMContentLoaded", initBottomNav);

})();