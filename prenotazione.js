// 1. CONFIGURAZIONE SUPABASE
const SUPABASE_URL = 'https://ashctxmmjrjgmakuzpjy.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_eSsDyQAkrJZ_kiKnY27Idw_Fn6uQt2t'; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
const BookingHelper = {
    formatWA(data) {
        const { nome, cognome, email, telefono, servizi, dataVal, oraVal, note } = data;
        
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
            telefono: profilo.telefono || "", // Recuperato dal profilo
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

// 3. LOGICA DELLA PAGINA (PULITA E UNITA)
document.addEventListener('DOMContentLoaded', async () => {
    
    // --- CONTROLLO LOGIN ---
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) {
        window.location.href = "index.html?auth=required";
        return; 
    }

    // --- RECUPERO PROFILO UTENTE (Incluso Telefono) ---
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
        </label>`;            });
            wrapper.querySelector('.cat-title').onclick = () => {
                const isHidden = content.style.display === "none";
                content.style.display = isHidden ? "block" : "none";
                wrapper.querySelector('.arrow').style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
            };
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
    guid_locale: radio.dataset.guid, // <--- AGGIUNGI QUESTA RIGA
    data_ora: dataOraISO,
    note: noteVal,
    cloud_request_id: codiceUnivoco 
}));                const bookingData = {
                    session,
                    profilo: profilo || { nome: "Cliente", email: session.user.email, telefono: "" },
                    righe,
                    numeroWA: "390952165888",
                    dataVal,
                    oraVal,
                    noteVal,
                    nomiServizi: Array.from(selectedRadios).map(r => r.value).join(", ")
                };

                await BookingHelper.invia(_supabase, bookingData);
                
                // Feedback successo
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