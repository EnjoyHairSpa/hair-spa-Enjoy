// =========================================================
// SLOT MACHINE PREMI - Integrazione con il flusso reale di prenotazione
// =========================================================
// IMPORTANTE: in questa versione la prenotazione BASE viene già inviata
// (bookings + WhatsApp) PRIMA di chiamare questa funzione, in prenotazione.js.
// Questo popup gestisce SOLO l'eventuale aggiunta del premio vinto come
// riga extra, così la prenotazione è sempre al sicuro qualsiasi cosa
// faccia la cliente durante lo spin (chiusura pagina compresa).

async function apriPopupSlot(ctx) {
    const {
        risultatoPaniere, mappaServizi, session,
        codiceUnivoco, dataOraISO, datiPerWhatsApp, onCompletato, onErrore
    } = ctx;

    const overlay = document.getElementById('slotOverlay');
    const rulli = [
        document.getElementById('rullo1'),
        document.getElementById('rullo2'),
        document.getElementById('rullo3')
    ];
    const risultatoEl = document.getElementById('slotRisultato');
    const confermaEl = document.getElementById('slotConferma');
    const pulsantiIniziali = overlay.querySelector('.slot-pulsanti');

    // Reset stato visivo del popup
    risultatoEl.classList.add('nascosto');
    confermaEl.classList.add('nascosto');
    confermaEl.innerHTML = '';
    pulsantiIniziali.classList.remove('nascosto');
    rulli.forEach(r => r.innerHTML = creaBadgeSlot(SLOT_ICONE_RICCO.genericoRegalo, 100));

    overlay.classList.remove('nascosto');

    const audioGiro = new Audio('slot.mp3');
    audioGiro.loop = true;
    const audioVincita = new Audio('win.mp3');

    const btnGira = document.getElementById('btnGira');
    btnGira.disabled = false;
    btnGira.innerText = "GIRA";

    // Rimuoviamo eventuali listener precedenti clonando il pulsante
    const btnGiraNuovo = btnGira.cloneNode(true);
    btnGira.parentNode.replaceChild(btnGiraNuovo, btnGira);

    btnGiraNuovo.addEventListener('click', () => {
        btnGiraNuovo.disabled = true;
        btnGiraNuovo.innerText = "STA GIRANDO...";

        audioGiro.currentTime = 0;
        audioGiro.play();

        eseguiSlot(risultatoPaniere.premi, rulli, mappaServizi, async (esito) => {
            audioGiro.pause();
            audioGiro.currentTime = 0;

            if (esito.vinto) {
                audioVincita.currentTime = 0;
                audioVincita.play();
            }

            await gestisciEsitoSlot(esito);
        });
    });

    // --- GESTIONE ESITO: mostra testo + pulsanti giusti ---
    async function gestisciEsitoSlot(esito) {
        pulsantiIniziali.classList.add('nascosto');

        if (esito.vinto) {
            risultatoEl.innerHTML =
                `🎁 <strong>Hai vinto: ${esito.nome_servizio}</strong><br>` +
                `Buono € ${esito.valore_buono.toFixed(2)}<br>` +
                `<span style="font-size:0.75rem; color:#999;">Valido solo per questo appuntamento</span>`;

            confermaEl.innerHTML = `
                <p class="slot-risultato">Sei sicura di voler aggiungere questo premio alla prenotazione?</p>
                <div class="slot-pulsanti">
                    <button class="slot-btn slot-btn-principale" id="btnConfermaSi">SÌ, AGGIUNGI</button>
                    <button class="slot-btn" id="btnConfermaNo">NO, GRAZIE</button>
                </div>
            `;

            document.getElementById('btnConfermaSi').addEventListener('click', () =>
                completaConEsito(esito, true));
            document.getElementById('btnConfermaNo').addEventListener('click', () =>
                completaConEsito(esito, false));

            risultatoEl.classList.remove('nascosto');
            confermaEl.classList.remove('nascosto');

        } else {
            // La prenotazione è già stata inviata prima dello spin: qui non c'è
            // più nulla di cui preoccuparsi, apriamo WhatsApp (senza premio) e chiudiamo.
            risultatoEl.innerHTML =
                `Ci sei andata vicino!<br>Al prossimo appuntamento sarai più fortunata.`;
            risultatoEl.classList.remove('nascosto');

            setTimeout(async () => {
                if (risultatoPaniere.invitoId) {
                    await _supabase.rpc('consuma_invito_slot', { invito_id: risultatoPaniere.invitoId });
                }
                window.BookingHelper.apriWhatsApp(datiPerWhatsApp);
                overlay.classList.add('nascosto');
                onCompletato();
            }, 2500);
        }
    }

    // --- COMPLETAMENTO: salva vincita + eventuale riga extra (prenotazione base già inviata) ---
    async function completaConEsito(esito, accettato) {
        try {
            // Salva sempre la vincita, accettata o rifiutata (rete di sicurezza)
            const { error: errorVincita } = await _supabase.from('vincite_clienti').insert({
                cliente_id: session.user.id,
                cloud_request_id: codiceUnivoco,
                paniere_id: risultatoPaniere.paniere.id,
                servizio_id: esito.servizio_id,
                valore_buono: esito.valore_buono,
                stato: accettato ? 'vinto' : 'rifiutato'
            });

            if (errorVincita) throw new Error("Errore salvataggio vincita: " + errorVincita.message);

            if (accettato) {
                // Aggiunge il servizio vinto come riga extra alla prenotazione già esistente
                const { error: errorRiga } = await _supabase.from('bookings').insert({
                    cliente_id: session.user.id,
                    servizio_id: esito.servizio_id,
                    guid_locale: '',
                    data_ora: dataOraISO,
                    note: `PREMIO SLOT - Buono € ${esito.valore_buono.toFixed(2)}`,
                    cloud_request_id: codiceUnivoco
                });

                if (errorRiga) throw new Error("Errore aggiunta servizio vinto: " + errorRiga.message);
            }

            const premioVintoTesto = accettato
                ? `HA VINTO: ${esito.nome_servizio} — Buono € ${esito.valore_buono.toFixed(2)}`
                : null;

            if (risultatoPaniere.invitoId) {
                await _supabase.rpc('consuma_invito_slot', { invito_id: risultatoPaniere.invitoId });
            }

            window.BookingHelper.apriWhatsApp({ ...datiPerWhatsApp, premioVintoTesto });

            overlay.classList.add('nascosto');
            onCompletato();

        } catch (error) {
            overlay.classList.add('nascosto');
            onErrore(error);
        }
    }
}