/* ==========================================================
   dashboard-preview.js
   Logica isolata per la nuova Dashboard.
   Si appoggia alla variabile globale _supabase già inizializzata
   in script.js (stesso pattern del resto del sito).
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ---------- Menu laterale ----------
  const btnMenu = document.getElementById('btnMenu');
  const btnCloseMenu = document.getElementById('btnCloseMenu');
  const sideMenu = document.getElementById('sideMenu');
  const menuOverlay = document.getElementById('menuOverlay');

  function openMenu() {
    sideMenu.classList.add('open');
    menuOverlay.classList.add('open');
  }
  function closeMenu() {
    sideMenu.classList.remove('open');
    menuOverlay.classList.remove('open');
  }

  if (btnMenu) btnMenu.addEventListener('click', openMenu);
  if (btnCloseMenu) btnCloseMenu.addEventListener('click', closeMenu);
  if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);

  // ---------- Logout ----------
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      await _supabase.auth.signOut();
      window.location.href = 'index.html';
    });
  }

  // ---------- Riprenota ultimi servizi ----------
  // TODO: questa è solo l'impalcatura. Vanno confermati i nomi
  // reali di tabelle/colonne prima di renderla definitiva:
  // - tabella prenotazioni lato Supabase
  // - campo che collega la prenotazione al cliente loggato
  // - campo/relazione per i servizi associati alla prenotazione
  // - campo data, per prendere la più recente
  async function provaCaricaUltimoAppuntamento(user) {
    try {
      // Finché non è confermato lo schema, la sezione resta nascosta.
      return null;
    } catch (err) {
      console.error('Errore caricamento ultimo appuntamento:', err);
      return null;
    }
  }

  function mostraSezioneRiprenota(elencoServizi) {
    const section = document.getElementById('rebookSection');
    const testo = document.getElementById('rebookServices');
    if (!section || !testo || !elencoServizi) return;
    testo.textContent = elencoServizi;
    section.style.display = 'block';
  }

  // ---------- Carosello pacchetti consigliati ----------
  // Stessa query e stesso filtro di pacchetti.js: solo pacchetti attivi
  // e con almeno un servizio. Se non ce n'è nessuno, la sezione resta nascosta.
  const formatoEuro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

  async function caricaPacchetti() {
    const sezione = document.getElementById('packagesSection');
    const contenitore = document.getElementById('packagesCarousel');
    if (!sezione || !contenitore) return;

    try {
      const { data, error } = await _supabase
        .from('pacchetti_preimpostati')
        .select('id, nome_pacchetto, prezzo, immagine_url, ordine, pacchetti_preimpostati_servizi(servizio_id)')
        .eq('attivo', true)
        .order('ordine', { ascending: true });

      if (error) throw error;

      const pacchetti = (data || []).filter(
        p => (p.pacchetti_preimpostati_servizi || []).length > 0
      );
      if (pacchetti.length === 0) return;

      contenitore.innerHTML = '';

      pacchetti.forEach(p => {
        const card = document.createElement('a');
        card.className = 'dash-card-package';
        card.href = 'pacchetti.html?id=' + encodeURIComponent(p.id);

        if (p.immagine_url) {
          const img = document.createElement('img');
          img.className = 'dash-pkg-photo';
          img.src = p.immagine_url;
          img.alt = p.nome_pacchetto;
          img.loading = 'lazy';
          card.appendChild(img);
        } else {
          const ph = document.createElement('div');
          ph.className = 'dash-pkg-img';
          ph.textContent = '✦';
          card.appendChild(ph);
        }

        const nome = document.createElement('span');
        nome.className = 'dash-pkg-name';
        nome.textContent = p.nome_pacchetto;
        card.appendChild(nome);

        const prezzo = document.createElement('span');
        prezzo.className = 'dash-pkg-price';
        prezzo.textContent = formatoEuro.format(p.prezzo);
        card.appendChild(prezzo);

        contenitore.appendChild(card);
      });

      sezione.style.display = 'block';
    } catch (err) {
      console.error('Errore caricamento pacchetti:', err);
    }
  }

  caricaPacchetti();

  // ---------- Stato utente (riuso logica già testata in index.html) ----------
  (async () => {
    const { data: { user } } = await _supabase.auth.getUser();
    const btnArea = document.getElementById('openAuth');

    if (user && btnArea) {
      btnArea.innerText = 'Il mio profilo';
      btnArea.onclick = function (e) {
        e.preventDefault();
        window.location.href = 'area-riservata.html';
      };

      const ultimo = await provaCaricaUltimoAppuntamento(user);
      if (ultimo) mostraSezioneRiprenota(ultimo);
    }
  })();

});