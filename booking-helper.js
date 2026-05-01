// booking-helper.js - Il "motore" delle tue prenotazioni
export const BookingHelper = {
    
    /**
     * Formatta il messaggio WhatsApp in stile Luxury
     */
    formatWA(data) {
        const { nome, cognome, email, servizi, dataVal, oraVal, note } = data;
        
        // Costruiamo il testo con i ritorni a capo (\n)
        const testo = `✨ *NUOVA PRENOTAZIONE ENJOY* ✨\n\n` +
                      `👤 *Cliente:* ${nome} ${cognome}\n` +
                      `📧 *Email:* ${email}\n\n` +
                      `📅 *Data:* ${dataVal}\n` +
                      `⏰ *Ora:* ${oraVal}\n` +
                      `💇‍♂️ *Servizi:* ${servizi}\n` +
                      (note ? `📝 *Note:* _${note}_\n` : "") +
                      `\n_Inviato con eleganza dall'App Luxury_`;

        // encodeURIComponent trasforma il testo in un link valido per il browser
        return encodeURIComponent(testo);
    },

    /**
     * Esegue il salvataggio su Supabase e apre WhatsApp
     */
    async invia(supabase, { session, profilo, righe, numeroWA, dataVal, oraVal, noteVal, nomiServizi }) {
        
        // --- DEBUG: CONTROLLO DATI PRIMA DELL'INVIO ---
        // Se guid_locale è vuoto nella console, il problema è dove componi l'array 'righe'
        console.log("Dati in invio a Supabase (Tabella bookings):");
        console.table(righe); 
        // ----------------------------------------------

        // 1. Inserimento nel Database (Tabella bookings)
        const { error } = await supabase.from('bookings').insert(righe);
        
        if (error) {
            console.error("Errore Database Supabase:", error);
            throw new Error("Impossibile salvare nel database: " + error.message);
        }

        // 2. Preparazione dati per il messaggio WhatsApp
        const messaggio = this.formatWA({
            nome: profilo.nome || "Cliente",
            cognome: profilo.cognome || "",
            email: session.user.email,
            servizi: nomiServizi || "Consulenza",
            dataVal,
            oraVal,
            note: noteVal
        });

        // 3. Apertura di WhatsApp in una nuova scheda
        window.open(`https://wa.me/${numeroWA}?text=${messaggio}`, '_blank');
        
        return true;
    }
};