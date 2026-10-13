// il-mio-percorso.js
// Mostra alla cliente la proposta in attesa di risposta (se c'è) e lo storico delle richieste.

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) {
        window.location.href = "index.html?auth=required";
        return;
    }

    await caricaRichieste(session.user.id);
    const scaduti = await caricaPercorsoAttivo(session.user.id);
    await caricaStoricoPercorsi(session.user.id, scaduti);
});
async function caricaRichieste(userId) {
    const { data: richieste, error } = await _supabase
        .from('richieste_percorsi')
        .select('*')
        .eq('cliente_id', userId)
        .order('data_richiesta', { ascending: false });

    if (error) {
        console.error('Errore caricamento richieste:', error);
        document.getElementById('storico-container').innerHTML =
            '<div class="empty-state" style="text-align:center; opacity:0.5;">Impossibile caricare i dati al momento.</div>';
        return;
    }

    renderizzaProposta(richieste, userId);
    renderizzaStorico(richieste);
}

function renderizzaProposta(richieste, userId) {
    const container = document.getElementById('proposta-container');
    const proposta = richieste.find(r => r.stato === 'proposta_inviata');

    if (!proposta) {
        container.innerHTML = '';
        return;
    }

    const servizi = proposta.dettagli_percorso?.servizi || [];
    const listaServizi = servizi.map(s => `<li>${s.qty}x ${s.servizio}</li>`).join('');
    const prezzo = proposta.prezzo_totale != null
        ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(proposta.prezzo_totale)
        : '-';

    container.innerHTML = `
        <div class="proposta-card">
            <span class="proposta-titolo">La tua proposta è pronta</span>
            <div class="proposta-prezzo">${prezzo}</div>
            <ul class="proposta-servizi">${listaServizi}</ul>
            ${proposta.note ? `<p style="color:#888; font-size:0.8rem; font-style:italic;">"${proposta.note}"</p>` : ''}
            <div class="proposta-azioni">
                <button class="btn-accetta" id="btnAccetta">Accetta</button>
                <button class="btn-rifiuta" id="btnRifiuta">Rifiuta</button>
            </div>
        </div>
    `;

    document.getElementById('btnAccetta').addEventListener('click', () => rispondiProposta(proposta.id, 'accettato', userId));
    document.getElementById('btnRifiuta').addEventListener('click', () => rispondiProposta(proposta.id, 'rifiutato', userId));
}

async function rispondiProposta(richiestaId, nuovoStato, userId) {
    if (nuovoStato === 'rifiutato') {
        const conferma = confirm('Sei sicura di voler rifiutare questa proposta?');
        if (!conferma) return;
    }

    const { error } = await _supabase
        .from('richieste_percorsi')
        .update({ stato: nuovoStato })
        .eq('id', richiestaId);

    if (error) {
        alert('Si è verificato un errore, riprova.');
        console.error(error);
        return;
    }

    await caricaRichieste(userId);
}

function renderizzaStorico(richieste) {
    const container = document.getElementById('storico-container');

    if (!richieste || richieste.length === 0) {
        container.innerHTML = '<div class="empty-state" style="text-align:center; opacity:0.5; font-style:italic;">Nessuna richiesta ancora inviata.</div>';
        return;
    }

    const etichette = {
        'in_attesa': 'In attesa di valutazione',
        'proposta_inviata': 'Proposta ricevuta',
        'accettato': 'Accettato',
        'rifiutato': 'Rifiutato'
    };

    container.innerHTML = richieste.map(r => {
        const servizi = r.dettagli_percorso?.servizi || [];
        const nomiServizi = servizi.map(s => `${s.qty}x ${s.servizio}`).join(', ');
        const data = r.data_richiesta ? new Date(r.data_richiesta).toLocaleDateString('it-IT') : '';
        const stato = etichette[r.stato] || r.stato;

        return `
            <div class="storico-card stato-${r.stato}">
                <div class="storico-data">${data}</div>
                <span class="storico-stato">${stato}</span>
                <div style="color:#ddd; font-size:0.85rem; margin-top:8px;">${nomiServizi}</div>
            </div>
        `;
    }).join('');
    }
// Stato reale del percorso: se è ancora 'attivo' ma la data è passata, lo trattiamo come
// chiuso (completato se tutto usato, altrimenti scaduto), come farà il gestionale
function statoEffettivo(percorso, oggi) {
    if (percorso.stato !== 'attivo') return percorso.stato;

    const fine = percorso.data_scadenza ? new Date(percorso.data_scadenza) : null;
    if (!fine || fine >= oggi) return 'attivo';

    const servizi = percorso.percorsi_servizi || [];
    const tuttoUsato = servizi.length > 0 &&
        servizi.every(s => s.quantita_usata >= s.quantita_totale);
    return tuttoUsato ? 'completato' : 'scaduto';
}

async function caricaPercorsoAttivo(userId) {
    const { data: percorsi, error } = await _supabase
        .from('percorsi')
        .select('*, percorsi_servizi(*)')
        .eq('cliente_id', userId)
        .in('stato', ['attivo', 'completato', 'scaduto'])
        .order('data_inizio', { ascending: false });

    if (error) {
        console.error('Errore caricamento percorso attivo:', error);
        return [];
    }

    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);

    const conStato = (percorsi || []).map(p => ({ p, stato: statoEffettivo(p, oggi) }));

    // In alto: il percorso più recente attivo o completato
    const inCard = conStato.find(x => x.stato === 'attivo' || x.stato === 'completato');
    renderizzaPercorsoAttivo(inCard ? { ...inCard.p, stato: inCard.stato } : null);

    // In basso: gli scaduti, che passiamo allo storico
    return conStato.filter(x => x.stato === 'scaduto').map(x => x.p);
}
async function caricaStoricoPercorsi(userId, percorsiScaduti = []) {
    const { data: storico, error } = await _supabase
        .from('storico_percorsi')
        .select('*')
        .eq('cliente_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        // Non usciamo: mostriamo comunque gli scaduti letti da 'percorsi'
        console.error('Errore caricamento storico percorsi:', error);
    }

    renderizzaStoricoPercorsi(storico || [], percorsiScaduti);
}

function renderizzaStoricoPercorsi(storico, percorsiScaduti = []) {
    const container = document.getElementById('storico-percorsi-container');

    const giorno = d => (d ? String(d).slice(0, 10) : '');

    // Gli scaduti letti da 'percorsi' si mostrano come righe di storico,
    // salvo che esista già la riga vera nello storico (stessa data di inizio)
    const iniziGiaInStorico = new Set(storico.map(s => giorno(s.data_inizio)));

    const daPercorsi = percorsiScaduti
        .filter(p => !iniziGiaInStorico.has(giorno(p.data_inizio)))
        .map(p => ({
            data_inizio: p.data_inizio,
            data_fine: p.data_scadenza,
            esito: 'scaduto',
            riepilogo_servizi: (p.percorsi_servizi || [])
                .map(s => `${s.nome_servizio}: ${s.quantita_usata}/${s.quantita_totale}`)
                .join(', ')
        }));

    const righe = [...daPercorsi, ...storico];

    if (righe.length === 0) {
        container.innerHTML = '<div class="empty-state" style="text-align:center; opacity:0.5; font-style:italic; padding: 20px 0;">Nessun percorso concluso.</div>';
        return;
    }

    const etichette = {
        'scaduto': 'Scaduto',
        'completato': 'Completato'
    };

    container.innerHTML = righe.map(p => {
        const dataInizio = p.data_inizio ? new Date(p.data_inizio).toLocaleDateString('it-IT') : '-';
        const dataFine = p.data_fine ? new Date(p.data_fine).toLocaleDateString('it-IT') : '-';
        const esito = etichette[p.esito] || p.esito;
        const coloreEsito = p.esito === 'completato' ? '#4caf50' : '#ff4444';

        return `
            <div class="storico-card" style="border-left-color:${coloreEsito};">
                <div class="storico-data">${dataInizio} - ${dataFine}</div>
                <span class="storico-stato" style="color:${coloreEsito};">${esito}</span>
                <div style="color:#ddd; font-size:0.85rem; margin-top:8px;">${p.riepilogo_servizi ?? ''}</div>
            </div>
        `;
    }).join('');
}


function renderizzaPercorsoAttivo(percorso) {
    const container = document.getElementById('percorso-attivo-container');

    if (!percorso) {
        container.innerHTML = '';
        return;
    }

    const servizi = percorso.percorsi_servizi || [];
    const tuttoPrenotato = servizi.length > 0 &&
        servizi.every(s => s.quantita_usata >= s.quantita_totale);

    // Il gestionale chiude i percorsi solo quando viene aperto: se la data è già passata
    // ma lo stato è ancora 'attivo', la card si comporta come se fosse già chiuso
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    const fineValidita = percorso.data_scadenza ? new Date(percorso.data_scadenza) : null;
    const scadutoPerData = percorso.stato === 'attivo' && fineValidita && fineValidita < oggi;

    const scaduto = percorso.stato === 'scaduto' || (scadutoPerData && !tuttoPrenotato);
    const completato = percorso.stato === 'completato' || (scadutoPerData && tuttoPrenotato);
    const sedutePrenotate = percorso.stato === 'attivo' && !scadutoPerData && tuttoPrenotato;

    let colore = '';   // vuoto = colore standard (oro)
    let titolo = 'Il Tuo Percorso Attivo';
    if (scaduto)              { colore = '#ff4444'; titolo = 'Percorso Scaduto'; }
    else if (completato)      { colore = '#4caf50'; titolo = 'Percorso Completato'; }
    else if (sedutePrenotate) { colore = '#4caf50'; titolo = 'Tutte le sedute prenotate'; }

    const dataScadenza = percorso.data_scadenza
        ? new Date(percorso.data_scadenza).toLocaleDateString('it-IT')
        : '-';

    const listaServizi = servizi.map(s => {
        const disponibili = s.quantita_totale - s.quantita_usata;
        return `
            <li>
                <span>${s.nome_servizio}</span>
                <span style="color:${colore || 'var(--gold)'};">${disponibili} disponibili su ${s.quantita_totale}</span>
            </li>
        `;
    }).join('');

    container.innerHTML = `
        <div class="proposta-card" style="${colore ? `border-color:${colore};` : ''}">
            <span class="proposta-titolo" style="${colore ? `color:${colore};` : ''}">${titolo}</span>
            <p style="color:#888; font-size:0.8rem; margin-bottom:15px;">Scadenza: ${dataScadenza}</p>
            <ul class="proposta-servizi" style="list-style:none; padding:0;">
                ${listaServizi}
            </ul>
        </div>
    `;
}