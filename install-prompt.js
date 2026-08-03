// install-prompt.js
// Banner fisso in basso a sinistra che invita all'installazione dell'app.
// Sparisce da solo se l'app è già installata. File isolato, non tocca altro codice.

(function () {
    // Se è già installata (aperta come app standalone), non mostriamo nulla
    const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true; // Safari iOS

    if (isStandalone) {
        return;
    }

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

    // Se il banner era stato chiuso in questa sessione del browser, non lo rimostriamo
    if (sessionStorage.getItem('installBannerChiuso') === '1') {
        return;
    }

    let deferredPrompt = null;

    function creaBanner(testoBottone, alClick) {
        const banner = document.createElement('div');
        banner.id = 'install-app-banner';
        banner.style.cssText = `
            position: fixed;
            bottom: 16px;
            left: 16px;
            z-index: 9999;
            background: #0a0a0a;
            border: 1px solid #c5a059;
            color: #fff;
            padding: 12px 16px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 12px;
            max-width: 280px;
            font-size: 0.8rem;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        `;

        const testo = document.createElement('span');
        testo.innerText = testoBottone;
        testo.style.cssText = 'flex:1; line-height:1.3; cursor:pointer;';
        testo.onclick = alClick;

        const chiudi = document.createElement('span');
        chiudi.innerText = '✕';
        chiudi.style.cssText = 'cursor:pointer; opacity:0.5; font-size:0.9rem; padding:4px;';
        chiudi.onclick = () => {
            banner.remove();
            sessionStorage.setItem('installBannerChiuso', '1');
        };

        banner.appendChild(testo);
        banner.appendChild(chiudi);
        document.body.appendChild(banner);
        return banner;
    }

    if (isIOS) {
        // iPhone: nessuna API automatica, mostriamo istruzioni manuali
        creaBanner(
            '📲 Aggiungi l\'app alla Home: tocca Condividi (⬆️) e poi "Aggiungi a Home"',
            () => {} // nessuna azione al click sul testo, è solo istruzione
        );
        return;
    }

    // Android/Chrome/Edge: catturiamo l'evento nativo di installazione
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        const banner = creaBanner('📲 Installa l\'app sulla tua Home per un accesso più veloce', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null;
            if (outcome === 'accepted') {
                banner.remove();
            }
        });
    });

    // Se l'utente installa l'app, nascondiamo subito il banner
    window.addEventListener('appinstalled', () => {
        const banner = document.getElementById('install-app-banner');
        if (banner) banner.remove();
    });
})();
