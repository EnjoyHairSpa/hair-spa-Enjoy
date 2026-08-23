// =========================================================
// SLOT MACHINE PREMI - Motore (calcolo esito + animazione rulli)
// =========================================================

// --- CALCOLO ESITO (pesato, su base 1000) ---
// Riceve l'array premi del paniere [{ servizio_id, valore_buono, peso }, ...]
// La somma dei pesi è già garantita uguale alla soglia_max_peso (validato al
// salvataggio nel form desktop). Lo spazio rimanente fino a 1000 = nessun premio.
// Ritorna il premio vinto, oppure null se il giro non vince nulla.
function calcolaEsitoSlot(premi) {
    const estrazione = Math.floor(Math.random() * 1000) + 1; // 1..1000
    let cumulato = 0;

    for (const premio of premi) {
        cumulato += premio.peso;
        if (estrazione <= cumulato) return premio;
    }

    return null; // rientra nella fascia "nessun premio"
}

// --- ANIMAZIONE DI UN SINGOLO RULLO ---
// elementoRullo: il div dove disegnare il badge (dentro .slot-rullo-finestra)
// iconaFinale: stringa SVG su cui il rullo deve fermarsi
// durataMs: dopo quanto tempo si ferma questo rullo
// setIconeCasuali: array di icone SVG da mostrare casualmente durante la rotazione
function avviaRullo(elementoRullo, iconaFinale, durataMs, setIconeCasuali, callback) {
    const tempoInizio = Date.now();
    let velocitaAttuale = 60; // ms tra un cambio icona e l'altro, veloce all'inizio

    function tick() {
        const trascorso = Date.now() - tempoInizio;

        if (trascorso >= durataMs) {
            elementoRullo.innerHTML = creaBadgeSlot(iconaFinale, 100);
            if (callback) callback();
            return;
        }

        const iconaCasuale = setIconeCasuali[Math.floor(Math.random() * setIconeCasuali.length)];
        elementoRullo.innerHTML = creaBadgeSlot(iconaCasuale, 100);

        // Rallenta progressivamente man mano che si avvicina alla fine (effetto "frenata")
        const frazioneCompletata = trascorso / durataMs;
        velocitaAttuale = 60 + frazioneCompletata * 180;

        setTimeout(tick, velocitaAttuale);
    }

    tick();
}

// --- ORCHESTRAZIONE DEI 3 RULLI ---
// premi: array premi del paniere
// elementiRulli: array dei 3 elementi DOM [rullo1, rullo2, rullo3]
// mappaServizi: Dictionary { servizio_id: nome_servizio } per risalire al nome
// callbackFine: chiamata quando tutti e 3 i rulli si sono fermati, con l'esito
function eseguiSlot(premi, elementiRulli, mappaServizi, callbackFine) {
    const premioVinto = calcolaEsitoSlot(premi);

    // Tutte le icone possibili del set, usate per l'effetto di rotazione casuale
    const iconeCasuali = Object.values(SLOT_ICONE_RICCO);

    // Icona su cui i 3 rulli devono ATTERRARE (tutte e 3 uguali per l'effetto "combo")
    let iconaFinale;
    if (premioVinto) {
        const nomeServizio = mappaServizi[premioVinto.servizio_id] || '';
        iconaFinale = getIconSvgPerServizioRicco(nomeServizio);
    } else {
        iconaFinale = SLOT_ICONE_RICCO.niente;
    }

    // Durate sfalsate per un effetto naturale (non tutti i rulli si fermano insieme)
    const durate = [1300, 1800, 2400];
    let rulliCompletati = 0;

    elementiRulli.forEach((elemento, indice) => {
        avviaRullo(elemento, iconaFinale, durate[indice], iconeCasuali, () => {
            rulliCompletati++;
            if (rulliCompletati === elementiRulli.length && callbackFine) {
                const esito = premioVinto
                    ? {
                        vinto: true,
                        servizio_id: premioVinto.servizio_id,
                        nome_servizio: mappaServizi[premioVinto.servizio_id] || '(servizio)',
                        valore_buono: premioVinto.valore_buono
                    }
                    : { vinto: false };

                callbackFine(esito);
            }
        });
    });
}

// Stessa logica di riconoscimento categoria già vista in slot-icone.js,
// ma ritorna l'icona dal set RICCO invece che dal set base.
function getIconSvgPerServizioRicco(nomeServizio) {
    const nomeLower = (nomeServizio || '').toLowerCase();

    const match = MAPPA_CATEGORIE_ICONE.find(cat =>
        cat.chiavi.some(chiave => nomeLower.includes(chiave))
    );

    return match ? SLOT_ICONE_RICCO[match.icona] : SLOT_ICONE_RICCO.genericoRegalo;
}
