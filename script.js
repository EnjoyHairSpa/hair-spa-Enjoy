// --- AGGIUNGI QUESTO IN CIMA ---
const supabaseUrl = https://ashctxmmjrjgmakuzpjy.supabase.co;
const supabaseKey = sb_publishable_eSsDyQAkrJZ_kiKnY27Idw_Fn6uQt2t ;
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

console.log("Connessione Luxury stabilita!");
// --- FINE AGGIUNTA ---document.addEventListener("DOMContentLoaded", () => {
    // 1. Logica Accessibilità (View Settings)
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

    // 2. Logica Form (Salvataggio & WhatsApp)
    // Persistenza per i campi di testo
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

    // 3. Gestione invio Form
    ['prenotazioneForm', 'percorsiForm'].forEach(formId => {
        const form = document.getElementById(formId);
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                // Recupera dinamicamente tutti i servizi checkbox selezionati
                const selezionati = Array.from(form.querySelectorAll('input[name="servizio"]:checked'))
                                         .map(checkbox => checkbox.value)
                                         .join(', ');

                // Costruzione messaggio
                const msg = `✨ *RICHIESTA HAIR SPA* ✨%0A%0A` +
                            `👤 *Nome:* ${document.getElementById('nome').value}%0A` +
                            `👤 *Cognome:* ${document.getElementById('cognome').value}%0A` +
                            `💇‍♀️ *Servizi:* ${selezionati || "Nessun servizio selezionato"}%0A` +
                            `📱 *Tel:* ${document.getElementById('telefono').value}%0A` +
                            `📅 *Data:* ${document.getElementById('data').value}%0A` +
                            `⌚ *Ora:* ${document.getElementById('orario').value}%0A` +
                            (formId === 'percorsiForm' && document.getElementById('consulenza') && document.getElementById('consulenza').checked ? `✨ *Consulenza:* Sì%0A` : "") +
                            `📝 *Note:* ${document.getElementById('note').value}`;
                
                // INSERISCI QUI IL TUO NUMERO (es. 393331234567)
                const phoneNumber = "393331234567"; 
                window.open(`https://wa.me/${phoneNumber}?text=${msg}`, '_blank');
                
                // Pulisce il form e la memoria
                localStorage.clear();
                form.reset();
            });
        }
    });
});