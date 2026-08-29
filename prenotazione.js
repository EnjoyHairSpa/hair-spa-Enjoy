// --- GENERATORE CODICE UNIVOCO ---
function generaCodiceCloud() {
    const caratteri = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let risultato = '';
    for (let i = 0; i < 6; i++) {
        risultato += caratteri.charAt(Math.floor(Math.random() * caratteri.length));
    }
    return `NS-${risultato}`;
}

// --- HELPER PER INVIO E WHATSAPP ---
window.BookingHelper = window.BookingHelper || {
    formatWA(data) {
        const { nome, cognome, email, telefono, servizi, dataVal, oraVal, note, premioVintoTesto } = data;

        const listaServizi = servizi.split(',')
            .map(s => `  • ${s.trim()}`)
            .join('\n');

        const testo = `✨ *NUOVA PRENOTAZIONE ENJOY* ✨\n\n` +
                    `👤 *Cliente:* ${nome} ${cognome}\n` +
                    `📞 *Tel. Registrato:* ${telefono || 'Non indicato'}\n` +
                    `📧 *Email:* ${email}\n\n` +
                    `📅 *Data:* ${dataVal}\n` +
                    `⏰ *Ora:* ${oraVal}\n\n` +
                    `💇‍♂️ *Servizi richiesti:*\n${listaServizi}\n\n` +
                    (premioVintoTesto ? `🎁 *${premioVintoTesto}*\n\n` : "") +
                    (note ? `📝 *Note:* _${note}_\n` : "") +
                    `\n_Inviato dall'App Enjoy_`;

        return encodeURIComponent(testo);
    },

    // Salva SOLO nel database (nessuna apertura WhatsApp). Usata quando serve
    // garantire il salvataggio immediato prima di far girare la slot.
    async inserisciPrenotazione(supabase, righe) {
        const { error } = await supabase.from('bookings').insert(righe);
        if (error) throw new Error("Errore database: " + error.message);
        return true;
    },

    // Apre SOLO WhatsApp (nessun salvataggio). Usata quando il salvataggio
    // è già avvenuto prima e vogliamo solo notificare il salone, eventualmente
    // dopo aver saputo l'esito della slot.
    apriWhatsApp({ session, profilo, numeroWA, dataVal, oraVal, noteVal, nomiServizi, premioVintoTesto }) {
        const messaggio = this.formatWA({
            nome: profilo.nome || "Cliente",
            cognome: profilo.cognome || "",
            email: profilo.email || session.user.email,
            telefono: profilo.telefono || "",
            servizi: nomiServizi,
            dataVal,
            oraVal,
            note: noteVal,
            premioVintoTesto
        });

        window.open(`https://wa.me/${numeroWA}?text=${messaggio}`, '_blank');
    },

    // Comodo wrapper per il caso SENZA slot: salva e apre WhatsApp insieme,
    // come si faceva prima dell'introduzione della slot machine.
    async invia(supabase, ctx) {
        await this.inserisciPrenotazione(supabase, ctx.righe);
        this.apriWhatsApp(ctx);
        return true;
    }
};

window.BookingHelper = window.BookingHelper || BookingHelper;

// 3. LOGICA DELLA PAGINA
document.addEventListener('DOMContentLoaded', async () => {

    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) {
        window.location.href = "index.html?auth=required";
        return;
    }

    const { data: profilo } = await _supabase
        .from('profiles')
        .select('nome, cognome, email, telefono')
        .eq('id', session.user.id)
        .single();

    if (profilo && document.getElementById('welcome-user')) {
        document.getElementById('welcome-user').innerText = `Benvenuta, ${profilo.nome}`;
    }

    // --- CARICAMENTO SERVIZI DINAMICI ---
    const container = document.getElementById('servizi-dinamici');
    const { data: servizi } = await _supabase.from('services').select('*').order('categoria');

    // Mappa id -> nome_servizio, usata dalla slot per riconoscere l'icona e mostrare il nome vinto
    const mappaServizi = {};
    (servizi || []).forEach(s => { mappaServizi[s.id] = s.nome_servizio; });

    if (servizi && container) {
        container.innerHTML = "";
        const categorie = [...new Set(servizi.map(s => s.categoria))];

        categorie.forEach(cat => {
            const wrapper = document.createElement('div');
            wrapper.className = 'accordion-item';
            wrapper.innerHTML = `
                <div class="cat-title">
                    <span>${cat}</span> <span class="arrow">▼</span>
                </div>
                <div class="cat-content" style="display:none; padding:15px;"></div>
            `;
            const content = wrapper.querySelector('.cat-content');

            servizi.filter(s => s.categoria === cat).forEach(s => {
                content.innerHTML += `
                    <label class="radio-item">
                        <span>${s.nome_servizio}</span>
                        <input type="radio" name="${cat}" value="${s.nome_servizio}"
                               data-id="${s.id}"
                               data-guid="${s.guid_locale || ''}">
                    </label>`;
            });

            wrapper.querySelector('.cat-title').onclick = () => {
                const isHidden = content.style.display === "none";
                content.style.display = isHidden ? "block" : "none";
                wrapper.querySelector('.arrow').style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
            };

            content.querySelectorAll('input[type="radio"]').forEach(radio => {
                radio.addEventListener('click', function() {
                    if (this._eraSelezionato) {
                        this.checked = false;
                    }
                });
                radio.addEventListener('change', function() {
                    content.querySelectorAll(`input[name="${this.name}"]`).forEach(r => {
                        r._eraSelezionato = false;
                    });
                    this._eraSelezionato = this.checked;
                });
            });

            container.appendChild(wrapper);
        });
    }

    // --- GESTIONE INVIO FORM ---
    const form = document.getElementById('prenotazioneForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = document.getElementById('btnPrenota');
            const selectedRadios = document.querySelectorAll('input[type="radio"]:checked');
            const dataVal = document.getElementById('data').value;
            const oraVal = document.getElementById('orario').value;
            const noteVal = document.getElementById('note').value;

            if (selectedRadios.length === 0) {
                alert("Seleziona almeno un servizio!");
                return;
            }

            btn.disabled = true;
            btn.innerText = "REGISTRAZIONE...";

            try {
                const dataOraISO = `${dataVal}T${oraVal}:00`;
                const codiceUnivoco = generaCodiceCloud();

                const righe = Array.from(selectedRadios).map(radio => ({
                    cliente_id: session.user.id,
                    servizio_id: parseInt(radio.dataset.id),
                    guid_locale: radio.dataset.guid,
                    data_ora: dataOraISO,
                    note: noteVal,
                    cloud_request_id: codiceUnivoco
                }));

                const idsSelezionati = Array.from(selectedRadios).map(r => parseInt(r.dataset.id));

                const bookingDataBase = {
                    session,
                    profilo: profilo || { nome: "Cliente", email: session.user.email, telefono: "" },
                    numeroWA: "390952165888",
                    dataVal,
                    oraVal,
                    noteVal
                };

                // --- CONTROLLO PANIERE SLOT (invito manuale ha precedenza, poi trigger normali) ---
                const risultatoPaniere = await trovaPaniereOInvito(_supabase, session.user.id, idsSelezionati);

                if (risultatoPaniere) {
                    // IMPORTANTE: salviamo SUBITO la prenotazione nel database (senza
                    // aprire WhatsApp) PRIMA di far girare la slot. Così la prenotazione
                    // è già al sicuro qualsiasi cosa faccia la cliente durante lo spin.
                    // WhatsApp si apre solo alla fine, DOPO l'esito della slot, per non
                    // rubare l'attenzione dalla pagina prima che la cliente veda il popup
                    // — e così il messaggio può includere anche l'eventuale premio vinto.
                    await window.BookingHelper.inserisciPrenotazione(_supabase, righe);

                    const datiPerWhatsApp = {
                        ...bookingDataBase,
                        nomiServizi: Array.from(selectedRadios).map(r => r.value).join(", ")
                    };

                    apriPopupSlot({
                        risultatoPaniere,
                        mappaServizi,
                        session,
                        codiceUnivoco,
                        dataOraISO,
                        datiPerWhatsApp,
                        onCompletato: () => {
                            btn.innerText = "INVIATO!";
                            setTimeout(() => { window.location.href = "index.html"; }, 1500);
                        },
                        onErrore: (error) => {
                            // La prenotazione base è comunque già andata a buon fine:
                            // qui segnaliamo solo che il bonus slot non si è salvato bene.
                            console.error(error);
                            alert("La prenotazione è stata inviata correttamente. " +
                                  "C'è stato un problema nel salvare il premio della slot: " + error.message);
                            btn.innerText = "INVIATO!";
                            setTimeout(() => { window.location.href = "index.html"; }, 1500);
                        }
                    });
                    return;
                }

                // --- NESSUN PANIERE: INVIO NORMALE (comportamento invariato) ---
                const bookingData = {
                    ...bookingDataBase,
                    righe,
                    nomiServizi: Array.from(selectedRadios).map(r => r.value).join(", ")
                };

                await window.BookingHelper.invia(_supabase, bookingData);

                btn.innerText = "INVIATO!";
                setTimeout(() => { window.location.href = "index.html"; }, 2000);

            } catch (error) {
                console.error(error);
                alert("Errore durante la prenotazione: " + error.message);
                btn.disabled = false;
                btn.innerText = "CONFERMA PRENOTAZIONE";
            }
        });
    }
});