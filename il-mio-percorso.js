// il-mio-percorso.js
// Mostra alla cliente la proposta in attesa di risposta (se c'è) e lo storico delle richieste.

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) {
        window.location.href = "index.html?auth=required";
        return;
    }

    await caricaRichieste(session.user.id);
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
