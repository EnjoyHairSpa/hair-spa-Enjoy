/* --- 1. CONFIGURAZIONE SUPABASE --- */
const supabaseUrl = https://ashctxmmjrjgmakuzpjy.supabase.co;
const supabaseKey = sb_publishable_eSsDyQAkrJZ_kiKnY27Idw_Fn6uQt2t;
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

console.log("Sistema Luxury: Connessione stabilita!");

document.addEventListener("DOMContentLoaded", () => {

    /* --- 2. LOGICA MODALE LOGIN (Area Riservata) --- */
    const authModal = document.getElementById('authModal');
    const openAuthBtn = document.getElementById('openAuth');
    const closeAuthBtn = document.getElementById('closeAuth');

    // Apre il login
    if (openAuthBtn) {
        openAuthBtn.addEventListener('click', () => {
            authModal.style.display = 'flex';
        });
    }

    // Chiude il login cliccando la X
    if (closeAuthBtn) {
        closeAuthBtn.addEventListener('click', () => {
            authModal.style.display = 'none';
        });
    }

    // Chiude il login cliccando fuori dalla card
    window.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.style.display = 'none';
        }
    });

    /* --- 3. REGISTRAZIONE E LOGIN SU SUPABASE --- */
    const btnRegister = document.getElementById('btnRegister');
    const btnLogin = document.getElementById('btnLogin');
    const authMessage = document.getElementById('authMessage');

    // Funzione Registrazione
    if (btnRegister) {
        btnRegister.addEventListener('click', async () => {
            const email = document.getElementById('authEmail').value;
            const password = document.getElementById('authPassword').value;

            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
            });

            if (error) {
                authMessage.innerText = "Errore: " + error.message;
                authMessage.style.color = "#ff4d4d";
            } else {
                authMessage.innerText = "Controlla la tua email per confermare!";
                authMessage.style.color = "#c5a059";
            }
        });
    }

    // Funzione Login
    if (btnLogin) {
        btnLogin.addEventListener('click', async () => {
            const email = document.getElementById('authEmail').value;
            const password = document.getElementById('authPassword').value;

            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                authMessage.innerText = "Accesso fallito: " + error.message;
                authMessage.style.color = "#ff4d4d";
            } else {
                authMessage.innerText = "Benvenuta, accesso eseguito!";
                authMessage.style.color = "#c5a059";
                setTimeout(() => authModal.style.display = 'none', 1500);
            }
        });
    }

    /* --- 4. LOGICA ACCESSIBILITÀ (Già esistente) --- */
    const viewBtn = document.getElementById('viewSettings');
    if (viewBtn) {
        if (localStorage.getItem('compactMode') === 'true') {
            document.body.classList.add('compact');
            viewBtn.innerText = "Display: Compact";
        }
        viewBtn.addEventListener('click', () => {
            document.body.classList.toggle('compact');
            const isCompact = document.body.classList.contains('compact');
            localStorage.setItem('compactMode', isCompact);
            viewBtn.innerText = isCompact ? "Display: Compact" : "Display: Relaxed";
        });
    }

    /* --- 5. GESTIONE FORM & WHATSAPP (Già esistente) --- */
    const inputs = ['nome', 'cognome', 'telefono', 'email', 'data', 'orario', 'note'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            const savedValue = localStorage.getItem(id);
            if (savedValue) element.value = savedValue;
            element.addEventListener('input', () => {
                localStorage.setItem(id, element.value);
            });
        }
    });

    ['prenotazioneForm', 'percorsiForm'].forEach(formId => {
        const form = document.getElementById(formId);
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const selezionati = Array.from(form.querySelectorAll('input[name="servizio"]:checked'))
                                         .map(checkbox => checkbox.value)
                                         .join(', ');

                const msg = `✨ *RICHIESTA HAIR SPA* ✨%0A%0A` +
                            `👤 *Nome:* ${document.getElementById('nome').value}%0A` +
                            `👤 *Cognome:* ${document.getElementById('cognome').value}%0A` +
                            `💇‍♀️ *Servizi:* ${selezionati || "Nessun servizio selezionato"}%0A` +
                            `📱 *Tel:* ${document.getElementById('telefono').value}%0A` +
                            `📅 *Data:* ${document.getElementById('data').value}%0A` +
                            `⌚ *Ora:* ${document.getElementById('orario').value}%0A` +
                            `📝 *Note:* ${document.getElementById('note').value}`;
                
                const phoneNumber = "393331234567"; // Modifica con il tuo numero reale
                window.open(`https://wa.me/${phoneNumber}?text=${msg}`, '_blank');
                
                form.reset();
            });
        }
    });
});