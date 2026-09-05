// install-button-area.js
// Bottone di installazione app nell'area riservata, alternativa persistente al popup di index.
// File isolato, non tocca install-prompt.js né altro codice esistente.

(function () {
    const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;

    if (isStandalone) {
        return; // App già installata, non mostriamo nulla
    }

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    const card = document.getElementById('hubCardInstallApp');
    if (!card) return;

    let deferredPrompt = null;

    if (isIOS) {
        // iPhone: mostriamo la card, al click spieghiamo come fare manualmente
        card.style.display = 'flex';
        card.addEventListener('click', () => {
            alert('Per installare l\'app: tocca Condividi (⬆️) e poi "Aggiungi a Home"');
        });
        return;
    }

    // Android/Chrome/Edge
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        card.style.display = 'flex'; // mostriamo la card solo quando Chrome la rende disponibile
    });

    card.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        if (outcome === 'accepted') {
            card.style.display = 'none';
        }
    });

    window.addEventListener('appinstalled', () => {
        card.style.display = 'none';
    });
})();