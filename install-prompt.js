// install-prompt.js
// Popup modale che invita all'installazione dell'app, mostrato solo su index.
// Sparisce da solo se l'app è già installata. File isolato, non tocca altro codice.

(function () {
    // Mostriamo il popup solo sulla pagina index
    const paginaCorrente = window.location.pathname.split('/').pop() || 'index.html';
    const eIndex = paginaCorrente === 'index.html' || paginaCorrente === '';
    if (!eIndex) {
        return;
    }

    // Se è già installata (aperta come app standalone), non mostriamo nulla
    const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true; // Safari iOS

    if (isStandalone) {
        return;
    }

    // Registriamo il service worker (serve per abilitare il prompt di installazione)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch((err) => {
            console.error('Errore registrazione service worker:', err);
        });
    }

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

    // Se il popup era stato chiuso in questa sessione del browser, non lo rimostriamo
    if (sessionStorage.getItem('installPopupChiuso') === '1') {
        return;
    }

    let deferredPrompt = null;
    let overlay = null;
    let utenteHaCliccatoInstalla = false;

    function creaPopup(corpoHtml, testoBottoneSi, alClickSi) {
        overlay = document.createElement('div');
        overlay.id = 'install-app-overlay';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99998;
            padding: 20px;
            box-sizing: border-box;
        `;

        const box = document.createElement('div');
        box.style.cssText = `
            background: linear-gradient(145deg, #1a1a1a, #0d0d0d);
            border: 1px solid #c5a059;
            border-radius: 20px;
            padding: 35px 25px;
            max-width: 340px;
            width: 100%;
            text-align: center;
            box-shadow: 0 0 40px rgba(212, 175, 55, 0.15);
        `;

        box.innerHTML = `
<img src="icon-192.png" alt="Enjoy Bio Hair Spa" style="width:60px; height:60px; margin-bottom:14px; border-radius:14px;">            <div style="color:#c5a059; font-size:1.05rem; letter-spacing:1px; margin-bottom:14px; font-weight:500;">
                Installa l'app
            </div>
            <div style="color:#ccc; font-size:0.85rem; line-height:1.6; margin-bottom:26px;">
                ${corpoHtml}
            </div>
        `;

        const pulsanti = document.createElement('div');
        pulsanti.style.cssText = 'display:flex; flex-direction:column; gap:12px;';

        const btnSi = document.createElement('button');
        btnSi.innerText = testoBottoneSi;
        btnSi.style.cssText = `
            padding: 15px;
            border-radius: 10px;
            border: 1px solid #c5a059;
            background: #c5a059;
            color: #0d0d0d;
            font-weight: bold;
            letter-spacing: 1px;
            text-transform: uppercase;
            font-size: 0.8rem;
            cursor: pointer;
        `;
        btnSi.onclick = alClickSi;

        const btnNo = document.createElement('button');
        btnNo.innerText = 'No, grazie';
        btnNo.style.cssText = `
            padding: 15px;
            border-radius: 10px;
            border: 1px solid #c5a059;
            background: transparent;
            color: #c5a059;
            letter-spacing: 1px;
            text-transform: uppercase;
            font-size: 0.8rem;
            cursor: pointer;
        `;
        btnNo.onclick = () => {
            chiudiPopup();
            sessionStorage.setItem('installPopupChiuso', '1');
        };

        pulsanti.appendChild(btnSi);
        pulsanti.appendChild(btnNo);
        box.appendChild(pulsanti);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }

    function chiudiPopup() {
        if (overlay) {
            overlay.remove();
            overlay = null;
        }
    }

    function mostraConfermaInstallata() {
        creaPopup(
            '✓ App installata!<br>Trovi l\'icona nella tua schermata Home.',
            'OK'
        );
        const box = overlay.querySelector('button');
        // Rimuoviamo il pulsante "No, grazie" in questo popup di sola conferma
        const pulsantiWrap = overlay.querySelector('div[style*="flex-direction:column"]');
        if (pulsantiWrap && pulsantiWrap.children[1]) {
            pulsantiWrap.children[1].remove();
        }
        box.onclick = chiudiPopup;
    }

    if (isIOS) {
        creaPopup(
            'Per un\'esperienza più comoda, ti consigliamo di installare l\'app sul tuo telefono.<br><br>' +
            '<span style="font-size:0.75rem; color:#999;">Tocca Condividi (⬆️) e poi "Aggiungi a Home"</span>',
            'HO CAPITO'
        );
        overlay.querySelector('button').onclick = () => {
            chiudiPopup();
            sessionStorage.setItem('installPopupChiuso', '1');
        };
        return;
    }

    // Android/Chrome/Edge: catturiamo l'evento nativo, ma mostriamo il popup subito
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        // Se la cliente aveva già cliccato "SÌ, INSTALLA" prima che l'evento arrivasse,
        // lanciamo subito l'installazione adesso che è disponibile
        if (utenteHaCliccatoInstalla && overlay) {
            utenteHaCliccatoInstalla = false;
            chiudiPopup();
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(({ outcome }) => {
                deferredPrompt = null;
                if (outcome === 'accepted') {
                    sessionStorage.setItem('installPopupChiuso', '1');
                }
            });
        }
    });

    creaPopup(
        'Per un\'esperienza più comoda, ti consigliamo di installare l\'app sul tuo telefono.',
        'SÌ, INSTALLA'
    );

    overlay.querySelector('button').onclick = async () => {
        if (!deferredPrompt) {
            // L'evento non è ancora arrivato da Chrome: mostriamo attesa,
            // l'installazione partirà da sola appena l'evento arriva (vedi sopra)
            utenteHaCliccatoInstalla = true;
            const btn = overlay.querySelector('button');
            btn.innerText = 'UN ATTIMO...';
            btn.disabled = true;
            return;
        }
        chiudiPopup();
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        if (outcome === 'accepted') {
            sessionStorage.setItem('installPopupChiuso', '1');
        }
    };

    // Se l'utente installa l'app, mostriamo conferma
    window.addEventListener('appinstalled', () => {
        chiudiPopup();
        mostraConfermaInstallata();
    });
})();