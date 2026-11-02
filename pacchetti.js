// --- IMPOSTAZIONI ---
const NUMERO_WA = "390952165888";
// true = dopo l'attivazione si apre WhatsApp con il riepilogo (come per i percorsi).
// false = nessun avviso WhatsApp, la richiesta arriva solo nel gestionale.
const AVVISA_SU_WHATSAPP = true;

const formatoEuro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

// --- HELPER DOM (testo sempre inserito come testo, mai come HTML) ---
function el(tag, className, testo) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (testo !== undefined) e.textContent = testo;
    return e;
}

// --- MESSAGGIO WHATSAPP ---
function formatWAPacchetto({ nome, cognome, email, telefono, pacchetto, dataVal, oraVal, note, codice }) {
    const listaServizi = pacchetto.servizi
        .map(s => `  • ${s.quantita}x ${s.nome_servizio.trim()}`)
        .join('\n');

    const testo = `🎁 *ATTIVAZIONE PACCHETTO ENJOY* 🎁\n\n` +
                  `👤 *Cliente:* ${nome} ${cognome}\n` +
                  `📞 *Tel. Registrato:* ${telefono || 'Non indicato'}\n` +
                  `📧 *Email:* ${email}\n\n` +
                  `📦 *Pacchetto:* ${pacchetto.nome_pacchetto}\n` +
                  `💶 *Prezzo:* ${formatoEuro.format(pacchetto.prezzo)}\n` +
                  `🔖 *Codice:* ${codice}\n\n` +
                  `📅 *Data per l'attivazione:* ${dataVal}\n` +
                  `⏰ *Ora:* ${oraVal}\n\n` +
                  `💇‍♀️ *Servizi inclusi:*\n${listaServizi}\n\n` +
                  (note ? `📝 *Note:* _${note}_\n` : "") +
                  `\n_Richiesta inviata dall'App Enjoy_`;

    return encodeURIComponent(testo);
}

document.addEventListener('DOMContentLoaded', async () => {
    const vistaLista = document.getElementById('vista-lista');
    const vistaDettaglio = document.getElementById('vista-dettaglio');
    const elenco = document.getElementById('elenco-pacchetti');
    const welcomeTop = document.getElementById('welcome-user-top');
    const form = document.getElementById('pacchettoForm');
    const btnAttiva = document.getElementById('btnAttiva');
    const msg = document.getElementById('pacchettoMessage');
    const inputData = document.getElementById('data');

    let pacchettoScelto = null;

    // --- CONTROLLO LOGIN ---
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) {
        window.location.href = "index.html?auth=required";
        return;
    }

    // --- PROFILO (serve per il messaggio WhatsApp) ---
    const { data: profilo } = await _supabase
        .from('profiles')
        .select('nome, cognome, email, telefono')
        .eq('id', session.user.id)
        .single();

    if (profilo && welcomeTop) welcomeTop.innerText = profilo.nome;

    // --- Data minima = oggi (ora locale) ---
    const adesso = new Date();
    inputData.min = new Date(adesso.getTime() - adesso.getTimezoneOffset() * 60000)
        .toISOString().slice(0, 10);

    // --- CARICAMENTO PACCHETTI ATTIVI ---
    const { data: righe, error } = await _supabase
        .from('pacchetti_preimpostati')
        .select('id, nome_pacchetto, descrizione, prezzo, validita_giorni, immagine_url, ordine, pacchetti_preimpostati_servizi(nome_servizio, servizio_id, quantita)')
        .eq('attivo', true)
        .order('ordine', { ascending: true });

    elenco.innerHTML = "";

    if (error) {
        console.error(error);
        elenco.appendChild(el('p', null, "Non riesco a caricare i pacchetti. Riprova tra poco."))
            .style.cssText = "color:#ff4444; text-align:center; font-size:0.85rem;";
        return;
    }

    const pacchetti = (righe || [])
        .map(p => ({ ...p, servizi: p.pacchetti_preimpostati_servizi || [] }))
        .filter(p => p.servizi.length > 0);

    if (pacchetti.length === 0) {
        elenco.appendChild(el('p', null, "Al momento non ci sono pacchetti disponibili."))
            .style.cssText = "color:#aaa; text-align:center; font-size:0.9rem;";
        return;
    }

    // --- CARD ELENCO ---
    pacchetti.forEach(p => {
        const card = el('div', 'pack-card');

        if (p.immagine_url) {
            const img = el('img', 'pack-img');
            img.src = p.immagine_url;
            img.alt = p.nome_pacchetto;
            img.loading = 'lazy';
            card.appendChild(img);
        } else {
            card.appendChild(el('div', 'pack-img-placeholder', '✦'));
        }

        const body = el('div', 'pack-body');
        body.appendChild(el('h3', 'pack-name', p.nome_pacchetto));

        const riga = el('div');
        riga.appendChild(el('span', 'pack-price', formatoEuro.format(p.prezzo)));
const sedute = p.servizi
    .filter(s => /piega/i.test(s.nome_servizio))
    .reduce((t, s) => t + s.quantita, 0);
if (sedute > 0) {
    riga.appendChild(el('span', 'pack-sessions', sedute + (sedute === 1 ? ' seduta' : ' sedute')));
}        body.appendChild(riga);

        card.appendChild(body);
        card.addEventListener('click', () => apriDettaglio(p));
        elenco.appendChild(card);
    });

    // --- DETTAGLIO ---
    function apriDettaglio(p) {
        pacchettoScelto = p;

        document.getElementById('det-nome').textContent = p.nome_pacchetto;
        document.getElementById('det-prezzo').textContent = formatoEuro.format(p.prezzo);
        document.getElementById('det-descrizione').textContent = p.descrizione || "";

        const contenitore = document.getElementById('det-servizi');
        contenitore.innerHTML = "";
        p.servizi.forEach(s => {
            const riga = el('div', 'service-row');
            riga.appendChild(el('span', null, s.nome_servizio.trim()));
            riga.appendChild(el('span', 'service-qty', s.quantita + 'x'));
            contenitore.appendChild(riga);
        });

        msg.innerText = "";
        btnAttiva.disabled = false;
        btnAttiva.innerText = "ATTIVA PACCHETTO";
        form.reset();

        vistaLista.classList.add('hidden');
        vistaDettaglio.classList.remove('hidden');
        window.scrollTo(0, 0);
    }

    document.getElementById('btnTornaElenco').addEventListener('click', () => {
        vistaDettaglio.classList.add('hidden');
        vistaLista.classList.remove('hidden');
        pacchettoScelto = null;
        window.scrollTo(0, 0);
    });

        // --- APERTURA DIRETTA DAL LINK (?id=...) ---
    const idRichiesto = new URLSearchParams(window.location.search).get('id');
    if (idRichiesto) {
        const trovato = pacchetti.find(p => p.id === idRichiesto);
        if (trovato) apriDettaglio(trovato);
    }

    // --- ATTIVAZIONE ---
    form.onsubmit = async (e) => {
        e.preventDefault();
        if (!pacchettoScelto) return;

        btnAttiva.disabled = true;
        btnAttiva.innerText = "REGISTRAZIONE...";

        const dataVal = document.getElementById('data').value;
        const oraVal = document.getElementById('orario').value;
        const noteVal = document.getElementById('note').value.trim();

        try {
            // Prezzo e servizi li legge il database, dal browser passano solo id, data, ora e note
            const { data: codice, error: errRpc } = await _supabase.rpc('attiva_pacchetto_preimpostato', {
                p_pacchetto_id: pacchettoScelto.id,
                p_data_inizio: dataVal,
                p_ora_inizio: oraVal,
                p_note: noteVal || null
            });

            if (errRpc) throw errRpc;

            if (AVVISA_SU_WHATSAPP) {
                const p = profilo || { nome: "Cliente", cognome: "", email: session.user.email, telefono: "" };
                const messaggio = formatWAPacchetto({
                    nome: p.nome || "Cliente",
                    cognome: p.cognome || "",
                    email: p.email || session.user.email,
                    telefono: p.telefono || "",
                    pacchetto: pacchettoScelto,
                    dataVal,
                    oraVal,
                    note: noteVal,
                    codice
                });
                window.open(`https://wa.me/${NUMERO_WA}?text=${messaggio}`, '_blank');
            }

            msg.innerText = "PACCHETTO RICHIESTO! TI CONTATTEREMO.";
            msg.style.color = "var(--gold)";

            setTimeout(() => { window.location.href = "index.html"; }, 2500);

        } catch (err) {
            console.error(err);
            const nota = err && err.message ? err.message : "";
            if (nota.includes("già richiesto")) {
                msg.innerText = "HAI GIÀ RICHIESTO QUESTO PACCHETTO";
            } else if (nota.includes("Data non valida")) {
                msg.innerText = "SCEGLI UNA DATA NON PASSATA";
            } else if (nota.includes("non disponibile")) {
                msg.innerText = "PACCHETTO NON PIÙ DISPONIBILE";
            } else {
                msg.innerText = "ERRORE DURANTE L'INVIO";
            }
            msg.style.color = "#ff4444";
            btnAttiva.disabled = false;
            btnAttiva.innerText = "ATTIVA PACCHETTO";
        }
    };
});