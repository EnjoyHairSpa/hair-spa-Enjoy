// 1. CONFIGURAZIONE SUPABASE
const SUPABASE_URL = 'https://ashctxmmjrjgmakuzpjy.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_eSsDyQAkrJZ_kiKnY27Idw_Fn6uQt2t'; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. DEFINIZIONE HELPER (Incluso qui per evitare errori "not defined")
const BookingHelper = {
    formatWA(data) {
        const { nome, cognome, email, servizi, dataVal, oraVal, note } = data;
        const testo = `✨ *NUOVA PRENOTAZIONE ENJOY* ✨\n\n` +
                      `👤 *Cliente:* ${nome} ${cognome}\n` +
                      `📧 *Email:* ${email}\n\n` +
                      `📅 *Data:* ${dataVal}\n` +
                      `⏰ *Ora:* ${oraVal}\n` +
                      `💇‍♂️ *Servizi:* ${servizi}\n` +
                      (note ? `📝 *Note:* _${note}_\n` : "") +
                      `\n_Inviato con eleganza dall'App Luxury_`;
        return encodeURIComponent(testo);
    },

    async invia(supabase, { session, profilo, righe, numeroWA, dataVal, oraVal, noteVal, nomiServizi }) {
        // Salva su Supabase
        const { error } = await supabase.from('bookings').insert(righe);
        if (error) throw new Error("Errore database: " + error.message);

        // Prepara messaggio WhatsApp
        const messaggio = this.formatWA({
            nome: profilo.nome || "Cliente",
            cognome: profilo.cognome || "",
            email: profilo.email || session.user.email,
            servizi: nomiServizi,
            dataVal,
            oraVal,
            note: noteVal
        });

        // Apri WhatsApp
        window.open(`https://wa.me/${numeroWA}?text=${messaggio}`, '_blank');
        return true;
    }
};

// 3. LOGICA DELLA PAGINA
document.addEventListener('DOMContentLoaded', async () => {
    
    // --- CONTROLLO LOGIN ---
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) {
        window.location.href = "index.html?auth=required";
        return; 
    }

    // --- RECUPERO PROFILO UTENTE ---
    const { data: profilo } = await _supabase
        .from('profiles')
        .select('nome, cognome, email')
        .eq('id', session.user.id)
        .single();

    if (profilo) {
        document.getElementById('welcome-user').innerText = `Benvenuto, ${profilo.nome}`;
    }

    // --- CARICAMENTO SERVIZI ---
    const container = document.getElementById('servizi-dinamici');
    const { data: servizi } = await _supabase.from('services').select('*').order('categoria');
    
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
                        <input type="radio" name="${cat}" value="${s.nome_servizio}" data-id="${s.id}">
                    </label>`;
            });
            wrapper.querySelector('.cat-title').onclick = () => {
                content.style.display = content.style.display === "none" ? "block" : "none";
            };
            container.appendChild(wrapper);
        });
    }

    // --- GESTIONE INVIO PRENOTAZIONE ---
    const form = document.getElementById('prenotazioneForm');
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
            const righe = Array.from(selectedRadios).map(radio => ({
                cliente_id: session.user.id,
                servizio_id: parseInt(radio.dataset.id),
                data_ora: dataOraISO,
                note: noteVal
            }));

            const bookingData = {
                session,
                profilo: profilo || { nome: "Cliente", email: session.user.email },
                righe,
                numeroWA: "393208443534", // Sostituisci col tuo numero reale
                dataVal,
                oraVal,
                noteVal,
                nomiServizi: Array.from(selectedRadios).map(r => r.value).join(", ")
            };

            await BookingHelper.invia(_supabase, bookingData);
            alert("Prenotazione completata!");

        } catch (error) {
            console.error(error);
            alert("Errore durante la prenotazione: " + error.message);
        } finally {
            btn.disabled = false;
            btn.innerText = "CONFERMA PRENOTAZIONE";
        }
    });
});