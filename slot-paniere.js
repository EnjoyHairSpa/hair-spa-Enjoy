// =========================================================
// SLOT MACHINE PREMI - Riconoscimento Paniere Candidato
// =========================================================
// Funzione isolata, non ancora agganciata al flusso di invio prenotazione.
// Dato l'elenco degli ID servizio selezionati dalla cliente, cerca tra i
// panieri ATTIVI quello il cui set di Servizi Trigger (Griglia 1) è
// interamente contenuto nella selezione. Come da regola di dominio, non
// possono esserci panieri ambigui/in conflitto, quindi il primo trovato
// che soddisfa la condizione è quello giusto.
//
// Ritorna null se nessun paniere è candidato, altrimenti un oggetto:
// {
//   paniere: { id, nome, numero_giri, soglia_max_peso },
//   premi: [ { servizio_id, valore_buono, peso }, ... ]
// }

async function trovaPaniereCandidato(supabase, idsServiziSelezionati) {
    // 1. Recupera tutti i panieri attivi
    const { data: panieri, error: errorPanieri } = await supabase
        .from('panieri')
        .select('id, nome, numero_giri, soglia_max_peso')
        .eq('attivo', true);

    if (errorPanieri) {
        console.error("Errore caricamento panieri:", errorPanieri.message);
        return null;
    }

    if (!panieri || panieri.length === 0) return null;

    // 2. Recupera tutti i trigger di quei panieri in un'unica query
    const idPanieri = panieri.map(p => p.id);
    const { data: trigger, error: errorTrigger } = await supabase
        .from('panieri_servizi_trigger')
        .select('paniere_id, servizio_id')
        .in('paniere_id', idPanieri);

    if (errorTrigger) {
        console.error("Errore caricamento trigger panieri:", errorTrigger.message);
        return null;
    }

    // 3. Raggruppa i trigger per paniere_id
    const triggerPerPaniere = {};
    (trigger || []).forEach(t => {
        if (!triggerPerPaniere[t.paniere_id]) triggerPerPaniere[t.paniere_id] = [];
        triggerPerPaniere[t.paniere_id].push(t.servizio_id);
    });

    // 4. Cerca il primo paniere il cui set trigger è sottoinsieme della selezione
    const selezioneSet = new Set(idsServiziSelezionati);

    const paniereTrovato = panieri.find(p => {
        const trig = triggerPerPaniere[p.id];
        if (!trig || trig.length === 0) return false; // paniere senza trigger configurati, salta
        return trig.every(servizioId => selezioneSet.has(servizioId));
    });

    if (!paniereTrovato) return null;

    // 5. Recupera i premi (Griglia 2) del paniere trovato
    const { data: premi, error: errorPremi } = await supabase
        .from('panieri_servizi_vincibili')
        .select('servizio_id, valore_buono, peso')
        .eq('paniere_id', paniereTrovato.id);

    if (errorPremi) {
        console.error("Errore caricamento premi paniere:", errorPremi.message);
        return null;
    }

    return {
        paniere: paniereTrovato,
        premi: premi || []
    };
}