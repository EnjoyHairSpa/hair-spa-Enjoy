const SUPABASE_URL = 'https://ashctxmmjrjgmakuzpjy.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_eSsDyQAkrJZ_kiKnY27Idw_Fn6uQt2t'; // Assicurati sia corretta
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
        container.innerHTML = `<p style="color:red;">Errore nel caricamento: ${errServizi.message}</p>`;
        return;
    }

    if (servizi) {
        container.innerHTML = ""; // Pulizia caricamento
        const categorie = [...new Set(servizi.map(s => s.categoria))];

        categorie.forEach(cat => {
            // Creazione Accordion Item
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

            // Filtraggio servizi per questa categoria
            servizi.filter(s => s.categoria === cat).forEach(s => {
                const label = document.createElement('label');
                label.className = 'radio-item';
                // Il trucco: 'name' è uguale alla categoria per rendere la scelta esclusiva
                label.innerHTML = `
                    <span style="color:#ccc; font-size:0.9rem;">${s.nome_servizio}</span>
                    <input type="radio" name="${cat}" value="${s.nome_servizio}" data-id="${s.id}">
                `;
                content.appendChild(label);
            });

            // Logica apertura/chiusura
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
        msg.innerText = "ELABORAZIONE RITUALE...";
        msg.style.color = "var(--gold)";

        const scelti = [];
        
        // Raccogliamo i radio button selezionati (uno per categoria)
        document.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
            scelti.push({ 
                categoria: radio.name, 
                servizio: radio.value 
            });
        });

        // Aggiungiamo la consulenza se selezionata
        const consulenzaCheck = document.getElementById('consulenza').checked;
        
        if (scelti.length === 0 && !consulenzaCheck) {
            msg.innerText = "SELEZIONA ALMENO UN SERVIZIO O LA CONSULENZA";
            msg.style.color = "#ff4444";
            btn.disabled = false;
            return;
        }

        // Preparazione dati per Supabase
        const payload = {
            cliente_id: session.user.id,
            servizi_scelti: scelti,
            consulenza: consulenzaCheck,
            data_appuntamento: document.getElementById('data').value,
            ora_appuntamento: document.getElementById('orario').value,
            note: document.getElementById('note').value,
            tipo_prenotazione: 'singola'
        };

        const { error } = await _supabase.from('prenotazioni').insert([payload]);

        if (error) {
            msg.innerText = "ERRORE: " + error.message;
            msg.style.color = "#ff4444";
            btn.disabled = false;
        } else {
            msg.innerText = "RITUALE PRENOTATO CON SUCCESSO!";
            msg.style.color = "var(--gold)";
            setTimeout(() => {
                window.location.href = "index.html";
            }, 2500);
        }
    };
});