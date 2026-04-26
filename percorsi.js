const SUPABASE_URL = 'https://ashctxmmjrjgmakuzpjy.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_eSsDyQAkrJZ_kiKnY27Idw_Fn6uQt2t';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('percorsiForm');
    const welcomeUser = document.getElementById('welcome-user');
    const extraContainer = document.getElementById('servizi-extra-container');
    const msg = document.getElementById('percorsoMessage');
    const btnRichiedi = document.getElementById('btnRichiedi');

    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) { window.location.href = "index.html"; return; }

    btnRichiedi.disabled = true;
    btnRichiedi.style.opacity = "0.5";

    const { data: profilo } = await _supabase.from('profiles').select('nome').eq('id', session.user.id).single();
    if (profilo) welcomeUser.innerText = `Benvenuta, ${profilo.nome}`;

    const { data: servizi } = await _supabase.from('services').select('*').order('categoria');
    
    if (servizi) {
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
                title.style.color = isHidden ? "var(--gold)" : "white";
            };

            catWrapper.appendChild(title);
            catWrapper.appendChild(content);
            extraContainer.appendChild(catWrapper);
        });
    }

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

    form.onsubmit = async (e) => {
        e.preventDefault();
        btnRichiedi.disabled = true;
        msg.innerText = "ATTENDI...";

        const selezioni = [];
        document.querySelectorAll('input[name="servizio-qty"]').forEach(input => {
            if (parseInt(input.value) > 0) selezioni.push({ servizio: input.dataset.nome, qty: input.value });
        });

        // Se la consulenza è attiva, la aggiungiamo alla lista servizi
        if (document.getElementById('consulenza').checked) {
            selezioni.unshift({ servizio: "Consulenza Sensoriale", qty: 1 });
        }

        const { error } = await _supabase.from('richieste_percorsi').insert([{
            cliente_id: session.user.id,
            dettagli_percorso: {
                servizi: selezioni,
                data_inizio: document.getElementById('data').value,
                ora_inizio: document.getElementById('orario').value
            },
            note: document.getElementById('note').value
        }]);

        if (error) {
            msg.innerText = "ERRORE!";
            btnRichiedi.disabled = false;
        } else {
            msg.innerText = "RITUALE RICHIESTO! TI CONTATTEREMO.";
            setTimeout(() => window.location.href = "index.html", 2500);
        }
    };
});