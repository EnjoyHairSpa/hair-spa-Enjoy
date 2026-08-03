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

// Punto di ingresso: da chiamare dopo che sappiamo che l'utente è loggato
async function inizializzaPushNotifiche(supabaseClient, profileId) {
    // Se il browser non supporta le notifiche push, usciamo silenziosamente
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push non supportate su questo browser.');
        return;
    }

    try {
        const registration = await navigator.serviceWorker.register('sw.js');

        // Se il permesso è già stato negato in passato, non richiediamolo di nuovo
        if (Notification.permission === 'denied') {
            console.log('Notifiche negate dall\'utente in precedenza.');
            return;
        }

        // Chiede il permesso (mostra il popup nativo del browser/telefono)
        const permesso = await Notification.requestPermission();
        if (permesso !== 'granted') {
            console.log('Permesso notifiche non concesso.');
            return;
        }

        // Controlla se esiste già una subscription attiva per questo dispositivo
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
        }

        await salvaSubscriptionSuSupabase(supabaseClient, profileId, subscription);

    } catch (err) {
        console.error('Errore inizializzazione push:', err);
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
