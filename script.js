// 1. CONFIGURAZIONE SUPABASE
const SUPABASE_URL = 'https://ashctxmmjrjgmakuzpjy.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_eSsDyQAkrJZ_kiKnY27Idw_Fn6uQt2t';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. AVVIO LOGICA AL CARICAMENTO DELLA PAGINA
document.addEventListener('DOMContentLoaded', () => {
    
    // Riferimenti Elementi DOM
    const openAuth = document.getElementById('openAuth');
    const closeAuth = document.getElementById('closeAuth');
    const authModal = document.getElementById('authModal');
    const mainAuthBtn = document.getElementById('mainAuthBtn');
    const toggleAuthMode = document.getElementById('toggleAuthMode');
    const registerFields = document.getElementById('registerFields');
    const authMessage = document.getElementById('authMessage');
    const modalTitle = document.getElementById('modalTitle');

    let isRegistrationMode = false;

    // --- GESTIONE APERTURA/CHIUSURA MODALE ---
    if (openAuth) {
        openAuth.addEventListener('click', () => {
            authModal.style.display = 'flex';
            console.log("Modale aperta");
        });
    }

    if (closeAuth) {
        closeAuth.addEventListener('click', () => {
            authModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === authModal) {
            authModal.style.display = 'none';
        }
    });

    // --- CAMBIO LOGIN / REGISTRAZIONE ---
    if (toggleAuthMode) {
        toggleAuthMode.addEventListener('click', () => {
            isRegistrationMode = !isRegistrationMode;
            authMessage.innerText = ""; 
            
            if (isRegistrationMode) {
                modalTitle.innerText = "Registrazione";
                registerFields.style.display = 'block';
                mainAuthBtn.innerText = "Registrati";
                toggleAuthMode.innerText = "Hai già un account? Accedi";
            } else {
                modalTitle.innerText = "Benvenuta";
                registerFields.style.display = 'none';
                mainAuthBtn.innerText = "Accedi";
                toggleAuthMode.innerText = "Non hai un account? Registrati";
            }
        });
    }

    // --- LOGICA DI AUTENTICAZIONE (Sistemata) ---
    if (mainAuthBtn) {
        mainAuthBtn.onclick = async () => {
            const email = document.getElementById('authEmail').value;
            const password = document.getElementById('authPassword').value;

            if (!email || !password) {
                authMessage.innerText = "Inserisci email e password.";
                return;
            }

            authMessage.innerText = "Elaborazione in corso...";

            if (isRegistrationMode) {
                // --- REGISTRAZIONE ---
                const nome = document.getElementById('authNome').value;
                const cognome = document.getElementById('authCognome').value;
                const telefono = document.getElementById('authTelefono').value;

                if (!nome || !cognome || !telefono) {
                    authMessage.innerText = "Tutti i campi sono obbligatori!";
                    return;
                }

                const { data, error } = await _supabase.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            nome: nome,
                            cognome: cognome,
                            telefono: telefono
                        }
                    }
                });

                if (error) {
                    authMessage.innerText = "Errore: " + error.message;
                } else {
                    authMessage.innerText = "Registrazione completata! Controlla la tua email.";
                }

            } else {
                // --- LOGIN ---
                const { data, error } = await _supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (error) {
                    authMessage.innerText = "Accesso negato. Riprova.";
                } else {
                    authMessage.style.color = "var(--gold)";
                    authMessage.innerText = "Accesso effettuato!";
                    
                    setTimeout(() => {
                        authModal.style.display = 'none';
                        window.location.reload(); 
                    }, 1000);
                }
            }
        };
    }
});