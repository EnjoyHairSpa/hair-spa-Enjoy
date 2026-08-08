// Service Worker - Enjoy Bio Hair Spa
// Step 2: abilita installabilità PWA + gestione notifiche push (attivate in Step 3)

const CACHE_NAME = 'enjoy-hair-spa-v1';

// Installazione: richiesto da Chrome per considerare il sito "installabile"
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Attivazione
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Gestione fetch: intercettiamo SOLO le richieste di lettura (GET).
// Le richieste che salvano dati (POST/PUT/DELETE, come le prenotazioni) passano dritte
// al browser senza passare da qui, per evitare che vengano eseguite due volte.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  event.respondWith(fetch(event.request));
});

// --- Da qui in poi: gestione notifiche push (pronta, si attiva da Step 3) ---

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Enjoy Bio Hair Spa', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Enjoy Bio Hair Spa';
  const options = {
    body: data.body || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    data: data.url || './area-riservata.html'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Click sulla notifica: apre l'area riservata
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data || './area-riservata.html';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('area-riservata.html') && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
