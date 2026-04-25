const SUPABASE_URL = 'https://ashctxmmjrjgmakuzpjy.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_eSsDyQAkrJZ_kiKnY27Idw_Fn6uQt2t'; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const IL_TUO_NUMERO = "390952165888"; 

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('servizi-dinamici');
    const form = document.getElementById('prenotazioneForm');
    const msg = document.getElementById('bookingMessage');

    // 1. Controllo Sessione (Se è loggato)
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) { window.location.href = "index.html"; return; }

    // --- NUOVO: Recupero Nome e Cognome dal profilo ---
    let nomeCliente = "";
    let cognomeCliente = "";
    const { data: profilo } = await _supabase
        .from('profiles')
        .select('nome, cognome')
        .eq('id', session.user.id)
        .single();

    if (profilo) {
        nomeCliente = profilo.nome;
        cognomeCliente = profilo.cognome;
    } else {
        // Fallback se il profilo non esiste ancora
        nomeCliente = session.user.email; 
    }

    // 2. Caricamento Servizi Dinamici
    const { data: servizi, error: errServizi } = await _supabase
        .from('services')
        .select('*')
        .order('categoria', { ascending: true });

    if (servizi) {
        container.innerHTML = ""; 
        const categorie = [...new Set(servizi.map(s => s.categoria))];
        categorie.forEach(cat => {
            const wrapper = document.createElement('div');
            wrapper.className = 'accordion-item';
            const title = document.createElement('div');
            title.className = 'cat-title';
            title.innerHTML = `<span>${cat}</span> <span class="arrow">▼</span>`;
            const content = document.createElement('div');
            content.style.display = "none";
            content.style.padding = "0 15px 15px";

            servizi.filter(s => s.categoria === cat).forEach(s => {
                const label = document.createElement('label');
                label.className = 'radio-item';
                label.innerHTML = `
                    <span style="color:#ccc;">${s.nome_servizio}</span>
                    <input type="radio" name="${cat}" value="${s.nome_servizio}" data-id="${s.id}">
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

    // 3. Gestione Invio
    form.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnPrenota');
        btn.disabled = true;

        try {
            const dataVal = document.getElementById('data').value;
            const oraVal = document.getElementById('orario').value;
            const noteVal = document.getElementById('note').value || "";
            const consulenzaCheck = document.getElementById('consulenza').checked;
            const radioScelti = document.querySelectorAll('input[type="radio"]:checked');
            
            const dataOraDatabase = `${dataVal} ${oraVal}:00`;
            let righeDaSalvare = [];

            radioScelti.forEach(radio => {
                const idServizio = radio.getAttribute('data-id');
                if (idServizio) {
                    righeDaSalvare.push({
                        cliente_id: session.user.id,
                        servizio_id: parseInt(idServizio),
                        data_ora: dataOraDatabase,
                        note: noteVal + (consulenzaCheck ? " [Consulenza]" : ""),
                        stato: 'in_attesa'
                    });
                }
            });

            if (righeDaSalvare.length === 0 && consulenzaCheck) {
                righeDaSalvare.push({
                    cliente_id: session.user.id,
                    servizio_id: servizi[0].id, 
                    data_ora: dataOraDatabase,
                    note: "[SOLO CONSULENZA] " + noteVal,
                    stato: 'in_attesa'
                });
            }

            if (righeDaSalvare.length === 0) {
                alert("Seleziona un servizio!");
                btn.disabled = false;
                return;
            }

            // Invio al Database
            const { error: dbError } = await _supabase.from('bookings').insert(righeDaSalvare);

            if (dbError) {
                alert("Errore Database: " + dbError.message);
                btn.disabled = false;
            } else {
                msg.innerText = "SALVATO!";
                
                // Preparazione Messaggio WhatsApp con Nome e Cognome
                const nomiServizi = Array.from(radioScelti).map(r => r.value).join(", ");
                const testoWA = `✨ *NUOVA PRENOTAZIONE* ✨%0A%0A` +
                                `👤 *Cliente:* ${nomeCliente} ${cognomeCliente}%0A` +
                                `📧 *Email:* ${session.user.email}%0A` +
                                `💇‍♂️ *Servizi:* ${nomiServizi || "Consulenza"}%0A` +
                                `📅 *Data:* ${dataVal}%0A` +
                                `⏰ *Ora:* ${oraVal}`;

                window.open(`https://wa.me/${IL_TUO_NUMERO}?text=${testoWA}`, '_blank');
                window.location.href = "index.html";
            }
        } catch (err) {
            alert("Errore Script: " + err.message);
            btn.disabled = false;
        }
    };
});