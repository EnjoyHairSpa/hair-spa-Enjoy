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
  // Prende l'ultima visita già passata della cliente loggata (le righe di bookings con lo
  // stesso cloud_request_id sono la stessa visita) e propone gli stessi servizi.
  // Metti false per provare anche con visite future (utile solo nei test).
  const SOLO_VISITE_PASSATE = true;

  async function provaCaricaUltimoAppuntamento(user) {
    try {
      let query = _supabase
        .from('bookings')
        .select('cloud_request_id, data_ora, servizio_id')
        .eq('cliente_id', user.id)
        .order('data_ora', { ascending: false })
        .limit(40);

      if (SOLO_VISITE_PASSATE) query = query.lte('data_ora', new Date().toISOString());

      const { data: righe, error } = await query;
      if (error) throw error;
      if (!righe || righe.length === 0) return null;

      // Righe della stessa visita: stesso codice (o, se manca, stessa data e ora)
      const chiave = r => r.cloud_request_id || r.data_ora;
      const chiaveUltima = chiave(righe[0]);
      const visita = righe.filter(r => chiave(r) === chiaveUltima);
      const idsVisita = [...new Set(visita.map(r => r.servizio_id))];

      const { data: servizi, error: errServizi } = await _supabase
        .from('services')
        .select('id, nome_servizio, categoria, visibile')
        .in('id', idsVisita);
      if (errServizi) throw errServizi;

      // Come nella pagina prenotazione: niente "Detersione" (lo shampoo si aggiunge da solo con la piega),
      // solo servizi ancora visibili e un solo servizio per categoria (un radio per categoria).
      const perId = new Map((servizi || []).map(s => [s.id, s]));
      const categorieUsate = new Set();
      const scelti = [];
      idsVisita.forEach(id => {
        const s = perId.get(id);
        if (!s || s.visibile !== true || s.categoria === 'Detersione') return;
        if (categorieUsate.has(s.categoria)) return;
        categorieUsate.add(s.categoria);
        scelti.push(s);
      });

      if (scelti.length === 0) return null;

      return {
        data: visita[0].data_ora,
        ids: scelti.map(s => s.id),
        nomi: scelti.map(s => s.nome_servizio)
      };
    } catch (err) {
      console.error('Errore caricamento ultimo appuntamento:', err);
      return null;
    }
  }

  function mostraSezioneRiprenota(ultimo) {
    const section = document.getElementById('rebookSection');
    const etichetta = document.getElementById('rebookLabel');
    const testo = document.getElementById('rebookServices');
    const link = document.getElementById('rebookLink');
    if (!section || !testo || !link || !ultimo) return;

    const giorno = new Date(ultimo.data).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
    if (etichetta) etichetta.textContent = 'La tua ultima volta \u00b7 ' + giorno;
    testo.textContent = ultimo.nomi.join(' \u00b7 ');
    link.href = 'prenotazione.html?servizi=' + ultimo.ids.join(',');
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

  // ---------- Prenotazione rapida: preselezioni create dal gestionale ----------
  // Mostra le prenotazioni preimpostate attive in cui tutti i servizi esistono e sono visibili.
  // Il tap apre prenotazione.html?servizi=id1,id2 (la pagina deve leggere il parametro).
  async function caricaPreselezioni() {
    const sezione = document.getElementById('quickBookSection');
    const griglia = document.getElementById('quickGrid');
    if (!sezione || !griglia) return;

    try {
      const { data, error } = await _supabase
        .from('prenotazioni_preimpostate')
        .select('id, nome_prenotazione, ordine, prenotazioni_preimpostate_servizi(servizio_id, services(id, nome_servizio, visibile))')
        .eq('attivo', true)
        .order('ordine', { ascending: true });

      if (error) throw error;

      const preselezioni = (data || [])
        .map(p => ({
          ...p,
          servizi: (p.prenotazioni_preimpostate_servizi || []).map(c => c.services)
        }))
        .filter(p => p.servizi.length > 0 && p.servizi.every(s => s && s.visibile === true));

      if (preselezioni.length === 0) return;

      griglia.innerHTML = '';
      preselezioni.forEach(p => {
        const tile = document.createElement('a');
        tile.className = 'dash-tile';
        tile.href = 'prenotazione.html?servizi=' + p.servizi.map(s => s.id).join(',');

        const nome = document.createElement('span');
        nome.className = 'dash-tile-name';
        nome.textContent = p.nome_prenotazione;
        tile.appendChild(nome);

        const dettaglio = document.createElement('span');
        dettaglio.className = 'dash-tile-sub';
        dettaglio.textContent = p.servizi.map(s => s.nome_servizio).join(' \u00b7 ');
        tile.appendChild(dettaglio);

        griglia.appendChild(tile);
      });

      sezione.style.display = 'block';
    } catch (err) {
      console.error('Errore caricamento prenotazioni preimpostate:', err);
    }
  }

  caricaPreselezioni();

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