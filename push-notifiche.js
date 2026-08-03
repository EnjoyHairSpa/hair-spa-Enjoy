// push-notifiche.js
// Step 3: registrazione service worker + richiesta permesso + salvataggio subscription su Supabase
// File isolato: non modifica la logica esistente di area-riservata.js

const VAPID_PUBLIC_KEY = "BIcokFW2Mbf6qB-CTgAgsR5Xnrgztt4mqd6WEkJQFCTI1hmTv0csZJ4ARCXlS0mopzbb1FDiOjIwu3XLTT-R8Xo";

// Converte la chiave pubblica VAPID (base64url) nel formato richiesto dal browser
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Da chiamare al caricamento pagina: registra il service worker (senza chiedere permessi)
// e decide se mostrare il bottone "Attiva notifiche", nasconderlo o disabilitarlo.
async function impostaPulsanteNotifiche(supabaseClient, profileId) {
    const btn = document.getElementById('btnAttivaNotifiche');
    if (!btn) return;

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push non supportate su questo browser.');
        btn.style.display = 'none';
        return;
    }

    try {
        const registration = await navigator.serviceWorker.register('sw.js');

        if (Notification.permission === 'denied') {
            btn.innerText = '🔕 Notifiche bloccate (abilita dalle impostazioni del browser)';
            btn.disabled = true;
            return;
        }

        if (Notification.permission === 'granted') {
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                // Già tutto attivo, nascondiamo il bottone
                btn.style.display = 'none';
                return;
            }
            // Permesso già concesso ma manca la subscription: può ripartire senza nuovo popup
            btn.innerText = '🔔 Attiva Notifiche';
            btn.addEventListener('click', () => avviaSottoscrizionePush(supabaseClient, profileId, registration));
            return;
        }

        // Notification.permission === 'default': serve il click dell'utente per chiedere il permesso
        btn.innerText = '🔔 Attiva Notifiche';
        btn.addEventListener('click', () => richiediPermessoEIscrivi(supabaseClient, profileId, registration));

    } catch (err) {
        console.error('Errore impostazione pulsante notifiche:', err);
    }
}

// Chiamata SOLO dal click del bottone: qui il permesso può essere richiesto
async function richiediPermessoEIscrivi(supabaseClient, profileId, registration) {
    try {
        const permesso = await Notification.requestPermission();
        if (permesso !== 'granted') {
            console.log('Permesso notifiche non concesso.');
            return;
        }
        await avviaSottoscrizionePush(supabaseClient, profileId, registration);
    } catch (err) {
        console.error('Errore richiesta permesso push:', err);
    }
}

async function avviaSottoscrizionePush(supabaseClient, profileId, registration) {
    try {
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
        }

        await salvaSubscriptionSuSupabase(supabaseClient, profileId, subscription);

        const btn = document.getElementById('btnAttivaNotifiche');
        if (btn) btn.style.display = 'none';

    } catch (err) {
        console.error('Errore sottoscrizione push:', err);
    }
}

// Salva (o aggiorna) la subscription nella tabella push_subscriptions
async function salvaSubscriptionSuSupabase(supabaseClient, profileId, subscription) {
    const subJson = subscription.toJSON();

    const { error } = await supabaseClient
        .from('push_subscriptions')
        .upsert({
            profile_id: profileId,
            endpoint: subJson.endpoint,
            p256dh: subJson.keys.p256dh,
            auth: subJson.keys.auth,
            user_agent: navigator.userAgent,
            attivo: true
        }, { onConflict: 'endpoint' });

    if (error) {
        console.error('Errore salvataggio subscription:', error);
    } else {
        console.log('Subscription push salvata correttamente.');
    }
}
