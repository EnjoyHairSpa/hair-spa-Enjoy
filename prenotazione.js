const SUPABASE_URL = 'https://ashctxmmjrjgmakuzpjy.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_eSsDyQAkrJZ_kiKnY27Idw_Fn6uQt2t'; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- CONFIGURAZIONE WHATSAPP ---
const IL_TUO_NUMERO = "393XXXXXXXXX"; // <-- INSERISCI IL TUO NUMERO TRA LE VIRGOLETTE

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('servizi-dinamici');
    const form = document.getElementById('prenotazioneForm');
    const msg = document.getElementById('bookingMessage');

    // 1. Controllo Sessione
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) {
        window.location.href = "index.html";
        return;
    }

    // 2. Caricamento Servizi dal Database
    const { data: servizi, error: errServizi } = await _supabase
        .from('services')
        .select('*')
        .order('categoria', { ascending: true });

    if (errServizi) {
        container.innerHTML = `<p style="color:red;">Errore: ${errServizi.message}</p>`;
        return;
    }

    if (servizi) {
        container.innerHTML = ""; 
        const categorie = [...new Set(servizi.map(s => s.categoria))];

        categorie.forEach(cat => {
            const wrapper = document.createElement('div');
            wrapper.className = 'accordion-item';
            
            const title = document.createElement('div');
            title.className = 'cat-title';
            title.innerHTML = `
                <span style="font-size:0.8rem; letter-spacing:1px; color:white; text-transform:uppercase;">${cat}</span> 
                <span class="arrow">▼</span>
            `;

            const content = document.createElement('div');
            content.style.display = "none";
            content.style.padding = "0 15px 15px";

            servizi.filter(s => s.categoria === cat).forEach(s => {
                const label = document.createElement('label');
                label.className = 'radio-item';
                label.innerHTML = `
                    <span style="color:#ccc; font-size:0.9rem;">${s.nome_servizio}</span>
                    <input type="radio" name="${cat}" value="${s.nome_servizio}">
                `;
                content.appendChild(label);
            });

            title.onclick = () => {
                const isHidden = content.style.display === "none";
                content.style.display = isHidden ? "block" : "none";
                title.querySelector('.arrow').style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
            };

            wrapper.appendChild(title);
            wrapper.appendChild(content);
            container.appendChild(wrapper);
        });
    }

    // 3. Gestione Invio Prenotazione
    form.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnPrenota');
        btn.disabled = true;
        msg.innerText = "Sincronizzazione Rituale...";
        msg.style.color = "var(--gold)";

        const scelti = [];
        document.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
            scelti.push(radio.value); // Prendiamo solo il nome del servizio per il messaggio
        });

        const consulenzaCheck = document.getElementById('consulenza').checked;
        const dataVal = document.getElementById('data').value;
        const oraVal = document.getElementById('orario').value;
        const noteVal = document.getElementById('note').value || "Nessuna nota particolare";
        
        if (scelti.length === 0 && !consulenzaCheck) {
            msg.innerText = "SELEZIONA ALMENO UN SERVIZIO";
            msg.style.color = "#ff4444";
            btn.disabled = false;
            return;
        }

        // 4. Salva su Supabase
        const payload = {
            cliente_id: session.user.id,
            servizi_scelti: scelti,
            consulenza: consulenzaCheck,
            data_appuntamento: dataVal,
            ora_appuntamento: oraVal,
            note: noteVal,
            tipo_prenotazione: 'singola'
        };

        const { error } = await _supabase.from('prenotazioni').insert([payload]);

        if (error) {
            msg.innerText = "ERRORE: " + error.message;
            msg.style.color = "#ff4444";
            btn.disabled = false;
        } else {
            msg.innerText = "RITUALE SALVATO! Apertura WhatsApp...";
            
            // 5. Generazione Messaggio WhatsApp
            const listaServizi = scelti.join(', ') || "Nessuno (Solo consulenza)";
            const testoWA = `✨ *NUOVA PRENOTAZIONE HAIR SPA* ✨%0A%0A` +
                            `👤 *Cliente:* ${session.user.email}%0A` +
                            `💇‍♂️ *Servizi:* ${listaServizi}%0A` +
                            `🧪 *Consulenza:* ${consulenzaCheck ? "Sì" : "No"}%0A%0A` +
                            `📅 *Data:* ${dataVal}%0A` +
                            `⏰ *Ora:* ${oraVal}%0A%0A` +
                            `📝 *Note:* _${noteVal}_%0A%0A` +
                            `_Inviato dal portale Luxury Hair_`;

            const linkWA = `https://wa.me/${IL_TUO_NUMERO}?text=${testoWA}`;

            // Reindirizzamento doppio (Apre WA e torna alla Home)
            setTimeout(() => {
                window.open(linkWA, '_blank');
                window.location.href = "index.html";
            }, 1500);
        }
    };
});