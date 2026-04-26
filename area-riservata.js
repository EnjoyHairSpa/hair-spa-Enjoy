const SUPABASE_URL = "https://ashctxmmjrjgmakuzpjy.supabase.co";
const SUPABASE_KEY = "sb_publishable_eSsDyQAkrJZ_kiKnY27Idw_Fn6uQt2t";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) {
        window.location.href = "index.html";
        return;
    }
    caricaPrenotazioni(user.id);
});

async function caricaPrenotazioni(userId) {
    const oraAttuale = new Date().toISOString();

    // Recuperiamo tutte le prenotazioni del cliente
    const { data: tutte, error } = await _supabase
        .from('bookings')
        .select(`
            *,
            services (nome_servizio)
        `)
        .eq('cliente_id', userId)
        .order('data_ora', { ascending: true });

    if (error) {
        console.error("Errore caricamento:", error);
        return;
    }

    // --- LOGICA DI RAGGRUPPAMENTO ---
    // Creiamo un oggetto dove la chiave è la data_ora (es. "2023-10-25 15:00")
    const raggruppate = tutte.reduce((acc, b) => {
        const chiave = b.data_ora;
        if (!acc[chiave]) {
            acc[chiave] = {
                ...b,
                servizi: [] // Array per contenere tutti i nomi dei servizi
            };
        }
        if (b.services?.nome_servizio) {
            acc[chiave].servizi.push(b.services.nome_servizio);
        }
        return acc;
    }, {});

    // Trasformiamo l'oggetto in un array
    const listaRaggruppata = Object.values(raggruppate);

    // Dividiamo in Future e Passate
    const future = listaRaggruppata.filter(b => b.data_ora >= oraAttuale && (b.stato === 'in_attesa' || b.stato === 'confermata'));
    const passate = listaRaggruppata.filter(b => b.data_ora < oraAttuale && b.stato === 'confermata').slice(0, 3);

    renderizzaLista(future, 'container-future', 'Nessun rituale in programma. Prenota il tuo prossimo momento di relax.');
    renderizzaLista(passate, 'container-past', 'Il tuo storico apparirà dopo la tua prima visita.');
}

function renderizzaLista(lista, elementId, messaggioVuoto) {
    const container = document.getElementById(elementId);
    if (!container) return;

    if (!lista || lista.length === 0) {
        container.innerHTML = `<div class="empty-state" style="opacity:0.5; font-style:italic; font-size:0.8rem; margin-top:20px;">${messaggioVuoto}</div>`;
        return;
    }

    container.innerHTML = lista.map(b => {
        const isConfermata = b.stato === 'confermata';
        const icona = isConfermata ? '✓' : '⌛';
        const testoStato = isConfermata ? 'Confermato' : 'In attesa di conferma';
        
        // Uniamo i servizi con un "+" o una virgola
        const nomiServizi = b.servizi.length > 0 ? b.servizi.join(' + ') : 'Servizio personalizzato';

        return `
            <div class="booking-card" style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; margin-bottom: 15px; border-left: 2px solid ${isConfermata ? 'var(--gold)' : '#555'}; ${!isConfermata ? 'opacity: 0.8;' : ''}">
                <span class="status-badge" style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: ${isConfermata ? 'var(--gold)' : '#a6a6a6'}">
                    ${icona} ${testoStato}
                </span>
                <div class="booking-date" style="font-size: 1.1rem; margin: 10px 0; font-weight: 300;">
                    ${formattaDataOra(b.data_ora)}
                </div>
                <div class="booking-service" style="color: var(--gold); letter-spacing: 1px; font-size: 0.9rem; line-height: 1.4;">
                    ${nomiServizi}
                </div>
                ${b.note ? `<div class="booking-notes" style="font-size: 0.75rem; margin-top: 10px; opacity: 0.6;">"${b.note}"</div>` : ''}
            </div>
        `;
    }).join('');
}

function formattaDataOra(stringaData) {
    const d = new Date(stringaData);
    const dataLeggibile = d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
    const oraLeggibile = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    return `${dataLeggibile} — ore ${oraLeggibile}`;
}