const SUPABASE_URL = 'https://ashctxmmjrjgmakuzpjy.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_eSsDyQAkrJZ_kiKnY27Idw_Fn6uQt2t';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const IL_TUO_NUMERO = "390952165888";

// --- NOVITÀ: FUNZIONE DI SCAMBIO (Mettila qui, fuori dal DOMContentLoaded) ---
function toggleAuth(showRegister) {
    const loginSec = document.getElementById('loginSection');
    const registerSec = document.getElementById('registerSection');
    const message = document.getElementById('authMessage');

    if (message) message.textContent = ""; 

    if (showRegister) {
        loginSec.style.display = 'none';
        registerSec.style.display = 'block';
    } else {
        loginSec.style.display = 'block';
        registerSec.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const isPrenotazionePage = window.location.pathname.includes('prenotazione.html');
    const authModal = document.getElementById('authModal');
    const authMessage = document.getElementById('authMessage');
    
    // --- LOGICA A: CONTROLLO SESSIONE ---
    const { data: { session } } = await _supabase.auth.getSession();

    if (isPrenotazionePage) {
        if (!session) {
            window.location.replace("index.html?auth=required");
            return;
        }
        caricaServiziDinamici(session.user.id);
    } else {
        const params = new URLSearchParams(window.location.search);
        if (params.get('auth') === 'required' && authModal) {
            authModal.style.setProperty('display', 'flex', 'important');
            if (authMessage) authMessage.innerText = "Accesso richiesto per prenotare.";
        }
    }

    // --- LOGICA B: GESTIONE MODALE (APERTURA/CHIUSURA) ---
    const openAuth = document.getElementById('openAuth');
    const closeAuth = document.getElementById('closeAuth');

    if (openAuth) openAuth.onclick = () => authModal.style.setProperty('display', 'flex', 'important');
    if (closeAuth) closeAuth.onclick = () => authModal.style.display = 'none';

    // --- LOGICA C: LOGIN ---
    const btnLogin = document.getElementById('btnLogin');
    if (btnLogin) {
        btnLogin.onclick = async (e) => {
            e.preventDefault();
            const email = document.getElementById('authEmail').value;
            const password = document.getElementById('authPassword').value;

            const { data, error } = await _supabase.auth.signInWithPassword({ email, password });

            if (error) {
                alert("Errore: " + error.message);
            } else {
                const params = new URLSearchParams(window.location.search);
                if (params.get('auth') === 'required') {
                    window.location.href = "prenotazione.html";
                } else {
                    window.location.reload();
                }
            }
        };
    }

    // --- NOVITÀ: LOGICA D: REGISTRAZIONE (Inserita subito dopo il Login) ---
    const btnDoRegister = document.getElementById('btnDoRegister');
    if (btnDoRegister) {
        btnDoRegister.onclick = async (e) => {
            e.preventDefault();
            
            const nome = document.getElementById('regName').value;
            const cognome = document.getElementById('regSurname').value;
            const telefono = document.getElementById('regPhone').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const dataNascita = document.getElementById('regBirth').value;
            const privacyOk = document.getElementById('privacyCheck').checked;

            if (!nome || !cognome || !telefono || !email || !password || !privacyOk) {
                alert("Per favore, compila i campi obbligatori e accetta la privacy.");
                return;
            }

            const { data, error } = await _supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        nome: nome,
                        cognome: cognome,
                        telefono: telefono,
                        data_nascita: dataNascita || null
                    }
                }
            });
if (error) {
                alert("Errore: " + error.message);
            } else {
                alert("Benvenuta in Enjoy! Controlla la tua email per confermare l'account.");
                
                // 1. Puliamo i campi della registrazione per evitare sovrapposizioni
                document.getElementById('regName').value = "";
                document.getElementById('regSurname').value = "";
                document.getElementById('regPhone').value = "";
                document.getElementById('regEmail').value = "";
                document.getElementById('regPassword').value = "";

                // 2. Torniamo alla vista Login senza ricaricare la pagina
                toggleAuth(false); 

                // 3. Inseriamo l'email appena registrata nel campo login e mettiamo il focus sulla password
                document.getElementById('authEmail').value = email;
                document.getElementById('authPassword').value = "";
                document.getElementById('authPassword').focus();
            }
        };
    }

    // --- FUNZIONE CARICAMENTO SERVIZI ---
    async function caricaServiziDinamici(userId) {
        const container = document.getElementById('servizi-dinamici');
        if (!container) return;

        const { data: servizi } = await _supabase.from('services').select('*').order('categoria');

        if (servizi) {
            container.innerHTML = "";
            const categorie = [...new Set(servizi.map(s => s.categoria))];
            
            categorie.forEach(cat => {
                const wrapper = document.createElement('div');
                wrapper.className = 'accordion-item';
                wrapper.innerHTML = `
                    <div class="cat-title"><span>${cat}</span> <span>▼</span></div>
                    <div class="cat-content" style="display:none;"></div>
                `;
                
                const content = wrapper.querySelector('.cat-content');
                servizi.filter(s => s.categoria === cat).forEach(s => {
                    content.innerHTML += `
                        <label class="radio-item">
                            <input type="radio" name="${cat}" value="${s.nome_servizio}" data-id="${s.id}">
                            <span style="color:#ccc;">${s.nome_servizio}</span>
                        </label>`;
                });

                wrapper.querySelector('.cat-title').onclick = () => {
                    content.style.display = content.style.display === "none" ? "block" : "none";
                };
                container.appendChild(wrapper);
            });
        }
    }

    // --- LOGICA INVIO PRENOTAZIONE ---
    const form = document.getElementById('prenotazioneForm');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const radioScelti = document.querySelectorAll('input[type="radio"]:checked');
            if (radioScelti.length === 0) { alert("Scegli un servizio!"); return; }

            const dataVal = document.getElementById('data').value;
            const oraVal = document.getElementById('orario').value;

            const righe = Array.from(radioScelti).map(r => ({
                cliente_id: session.user.id,
                servizio_id: parseInt(r.getAttribute('data-id')),
                data_ora: `${dataVal} ${oraVal}:00`,
                stato: 'in_attesa'
            }));

            const { error: dbError } = await _supabase.from('bookings').insert(righe);
            if (!dbError) {
                const nomiS = Array.from(radioScelti).map(r => r.value).join(", ");
                const testoWA = `✨ *NUOVA PRENOTAZIONE* ✨%0A💇‍♂️ *Servizi:* ${nomiS}%0A📅 *Data:* ${dataVal}%0A⏰ *Ora:* ${oraVal}`;
                window.open(`https://wa.me/${IL_TUO_NUMERO}?text=${testoWA}`, '_blank');
                window.location.href = "index.html";
            }
        };
    }
});