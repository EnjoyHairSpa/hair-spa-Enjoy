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

    async invia(supabase, { session, profilo, righe, numeroWA, dataVal, oraVal, noteVal, nomiServizi, premioVintoTesto }) {
        const { error } = await supabase.from('bookings').insert(righe);
        if (error) throw new Error("Errore database: " + error.message);

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

                // --- CONTROLLO PANIERE SLOT ---
                const risultatoPaniere = await trovaPaniereCandidato(_supabase, idsSelezionati);

                if (risultatoPaniere) {
                    // C'è un paniere candidato: apriamo il popup slot e sospendiamo l'invio
                    // fino a quando la cliente non decide (SI / NO / nessuna vincita).
                    apriPopupSlot({
                        risultatoPaniere,
                        mappaServizi,
                        session,
                        profilo,
                        righe,
                        codiceUnivoco,
                        dataOraISO,
                        bookingDataBase,
                        nomiServiziBase: Array.from(selectedRadios).map(r => r.value).join(", "),
                        onCompletato: () => {
                            btn.innerText = "INVIATO!";
                            setTimeout(() => { window.location.href = "index.html"; }, 2000);
                        },
                        onErrore: (error) => {
                            console.error(error);
                            alert("Errore durante la prenotazione: " + error.message);
                            btn.disabled = false;
                            btn.innerText = "CONFERMA PRENOTAZIONE";
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