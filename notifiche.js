// notifiche.js
// Richiede: config.js e supabase-js già caricati PRIMA di questo script

(function () {

  async function caricaNotifiche() {
    const container = document.getElementById("listaNotifiche");
    const statoVuoto = document.getElementById("statoVuoto");

    try {
      const { data: { user } } = await _supabase.auth.getUser();
      if (!user) return;

      const { data: notifiche, error } = await _supabase
        .from("notifiche_push")
        .select("id, titolo, corpo, letta, data_invio")
        .order("data_invio", { ascending: false });

      if (error) {
        console.error("Errore caricamento notifiche:", error);
        return;
      }

      if (!notifiche || notifiche.length === 0) {
        statoVuoto.style.display = "block";
        return;
      }

      container.innerHTML = notifiche.map(n => renderRiga(n)).join("");

      // Segna come lette tutte quelle non lette, ora che la cliente le sta vedendo
      const nonLette = notifiche.filter(n => !n.letta);
      for (const n of nonLette) {
        await _supabase.rpc("segna_notifica_letta", { p_notifica_id: n.id });
      }

    } catch (err) {
      console.error("Errore imprevisto nel caricamento notifiche:", err);
    }
  }

  function renderRiga(n) {
    const data = new Date(n.data_invio).toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short"
    });

    const classeStato = n.letta ? "letta" : "";

    return `
      <div class="notifica-row ${classeStato}">
        <div class="notifica-puntino"></div>
        <div class="notifica-corpo">
          <div class="notifica-titolo">${escapeHtml(n.titolo)}</div>
          <div class="notifica-testo">${escapeHtml(n.corpo)}</div>
          <div class="notifica-data">${data}</div>
        </div>
      </div>
    `;
  }

  // Evita che titolo/corpo possano rompere il markup se contengono caratteri speciali
  function escapeHtml(testo) {
    const div = document.createElement("div");
    div.textContent = testo;
    return div.innerHTML;
  }

  document.addEventListener("DOMContentLoaded", caricaNotifiche);

})();