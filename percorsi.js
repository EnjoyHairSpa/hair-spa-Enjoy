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

// --- HELPER PER WHATSAPP ---
const PercorsiHelper = {
    formatWA(data) {
        const { nome, cognome, email, telefono, selezioni, dataVal, oraVal, note } = data;
        
        const listaServizi = selezioni
            .map(s => `  • ${s.qty}x ${s.servizio}`)
            .join('\n');

        const testo = `✨ *NUOVA RICHIESTA PERCORSO ENJOY* ✨\n\n` +
                      `👤 *Cliente:* ${nome} ${cognome}\n` +
                      `📞 *Tel. Registrato:* ${telefono || 'Non indicato'}\n` +
                      `📧 *Email:* ${email}\n\n` +
                      `📅 *Data inizio desiderata:* ${dataVal}\n` +
                      `⏰ *Ora:* ${oraVal}\n\n` +
                      `💇‍♀️ *Servizi nel Percorso:*\n${listaServizi}\n\n` +
                      (note ? `📝 *Note:* _${note}_\n` : "") +
                      `\n_Richiesta inviata con eleganza dall'App Luxury_`;

        return encodeURIComponent(testo);
    },

    async invia(supabase, { session, profilo, record, numeroWA, dataVal, oraVal, noteVal, selezioni }) {
        // 1. Salva su Supabase
        const { error } = await supabase.from('richieste_percorsi').insert([record]);
        if (error) throw new Error("Errore database: " + error.message);

        // 2. Prepara messaggio WhatsApp
        const messaggio = this.formatWA({
            nome: profilo.nome || "Cliente",
            cognome: profilo.cognome || "",
            email: profilo.email || session.user.email,
            telefono: profilo.telefono || "", // Telefono aggiunto qui
            selezioni: selezioni,
            dataVal,
            oraVal,
            note: noteVal
        });

        // 3. Apri WhatsApp
        window.open(`https://wa.me/${numeroWA}?text=${messaggio}`, '_blank');
        return true;
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('percorsiForm');
    const welcomeUser = document.getElementById('welcome-user');
    const extraContainer = document.getElementById('servizi-extra-container');
    const msg = document.getElementById('percorsoMessage');
    const btnRichiedi = document.getElementById('btnRichiedi');

    // --- CONTROLLO LOGIN ---
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) { 
        window.location.href = "index.html?auth=required";
        return; 
    }

    btnRichiedi.disabled = true;
    btnRichiedi.style.opacity = "0.5";

    // --- RECUPERO PROFILO (con Telefono) ---
    const { data: profilo } = await _supabase
        .from('profiles')
        .select('nome, cognome, email, telefono')
        .eq('id', session.user.id)
        .single();

    if (profilo && welcomeUser) welcomeUser.innerText = `Benvenuta, ${profilo.nome}`;

    // --- CARICAMENTO SERVIZI ---
    const { data: servizi } = await _supabase.from('services').select('*').order('categoria');
    
    if (servizi && extraContainer) {
        extraContainer.innerHTML = "";
        const categorie = [...new Set(servizi.map(s => s.categoria))];

        categorie.forEach(cat => {
            const catWrapper = document.createElement('div');
            catWrapper.className = 'accordion-item';

            const title = document.createElement('div');
            title.className = 'cat-title';
            title.innerHTML = `<span style="font-size:0.85rem; letter-spacing:2px;">${cat}</span> <span class="arrow">▼</span>`;

            const content = document.createElement('div');
            content.className = 'cat-content';
            content.style.display = "none";
            content.style.padding = "0 15px 15px 15px";

            servizi.filter(s => s.categoria === cat).forEach(s => {
                const item = document.createElement('div');
                item.style = "display:flex; justify-content:space-between; align-items:center; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05);";
                const isPiega = s.categoria.toLowerCase().includes('piega');
                
                item.innerHTML = `
                    <span style="color:#eee; font-size:0.95rem;">${s.nome_servizio}</span>
                    <input type="number" name="servizio-qty" 
                           class="${isPiega ? 'qty-input qty-piega' : 'qty-input'}"
                           data-nome="${s.nome_servizio}" value="0" min="0" 
                           style="width:55px; background:#000; border:1px solid #444; color:var(--gold); text-align:center; padding:5px;">
                `;
                content.appendChild(item);
            });

            title.onclick = () => {
                const isHidden = content.style.display === "none";
                content.style.display = isHidden ? "block" : "none";
                title.querySelector('.arrow').style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
            };

            catWrapper.appendChild(title);
            catWrapper.appendChild(content);
            extraContainer.appendChild(catWrapper);
        });
    }

    // --- LOGICA VALIDAZIONE ---
    const validaPercorso = () => {
        let totalePieghe = 0;
        document.querySelectorAll('.qty-piega').forEach(input => totalePieghe += parseInt(input.value) || 0);

        if (totalePieghe >= 3) {
            btnRichiedi.disabled = false;
            btnRichiedi.style.opacity = "1";
            msg.innerText = "✓ SOGLIA RAGGIUNTA";
            msg.style.color = "var(--gold)";
        } else {
            btnRichiedi.disabled = true;
            btnRichiedi.style.opacity = "0.5";
            msg.innerText = totalePieghe > 0 ? `MANCANO ${3 - totalePieghe} PIEGHE` : "";
            msg.style.color = "#ff4444";
        }
    };

    extraContainer.addEventListener('input', validaPercorso);

    // --- INVIO FORM ---
    form.onsubmit = async (e) => {
        e.preventDefault();
        
        btnRichiedi.disabled = true;
        btnRichiedi.innerText = "REGISTRAZIONE...";

        const selezioni = [];
        document.querySelectorAll('input[name="servizio-qty"]').forEach(input => {
            if (parseInt(input.value) > 0) {
                selezioni.push({ servizio: input.dataset.nome, qty: input.value });
            }
        });

        if (document.getElementById('consulenza').checked) {
            selezioni.unshift({ servizio: "Consulenza Sensoriale", qty: 1 });
        }

        const dataVal = document.getElementById('data').value;
        const oraVal = document.getElementById('orario').value;
        const noteVal = document.getElementById('note').value;

        try {
            const codiceUnivoco = generaCodiceCloud(); 
            
            const record = {
                cliente_id: session.user.id,
                dettagli_percorso: {
                    servizi: selezioni,
                    data_inizio: dataVal,
                    ora_inizio: oraVal
                },
                note: noteVal,
                cloud_request_id: codiceUnivoco // Salvataggio codice univoco
            };

            await PercorsiHelper.invia(_supabase, {
                session,
                profilo: profilo || { nome: "Cliente", email: session.user.email, telefono: "" },
                record,
                numeroWA: "390952165888",
                dataVal,
                oraVal,
                note: noteVal,
                selezioni
            });

            msg.innerText = "RITUALE RICHIESTO! TI CONTATTEREMO.";
            msg.style.color = "var(--gold)";
            
            setTimeout(() => { window.location.href = "index.html"; }, 2500);

        } catch (error) {
            console.error(error);
            msg.innerText = "ERRORE DURANTE L'INVIO";
            btnRichiedi.disabled = false;
            btnRichiedi.innerText = "CONFERMA PERCORSO";
        }
    };
});