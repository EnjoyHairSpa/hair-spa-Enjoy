// =========================================================
// SLOT MACHINE PREMI - Libreria Icone per i rulli
// =========================================================
// Icone SVG stile "linea sottile oro" (stroke, no fill), coerenti con
// dark-luxury.css. Ogni icona è pensata per una CATEGORIA di servizio,
// non per il singolo servizio esatto (altrimenti sarebbero troppe).
//
// Uso: getIconSvgPerServizio("Ricostruzione Molecolare") -> stringa SVG

const SLOT_ICONE = {
    taglio: `<svg viewBox="0 0 48 48" fill="none" stroke="var(--gold)" stroke-width="1.5">
        <circle cx="10" cy="14" r="4"/><circle cx="10" cy="34" r="4"/>
        <path d="M14 16 L38 40 M14 32 L38 8"/>
    </svg>`,

    piega: `<svg viewBox="0 0 48 48" fill="none" stroke="var(--gold)" stroke-width="1.5">
        <path d="M10 12 h14 a10 10 0 0 1 10 10 v4"/>
        <path d="M30 30 l6 6 l6 -6" fill="none"/>
        <path d="M10 12 v-4" stroke-linecap="round"/>
    </svg>`,

    shampoo: `<svg viewBox="0 0 48 48" fill="none" stroke="var(--gold)" stroke-width="1.5">
        <path d="M24 6 c6 8 10 14 10 20 a10 10 0 0 1 -20 0 c0 -6 4 -12 10 -20 Z"/>
    </svg>`,

    colore: `<svg viewBox="0 0 48 48" fill="none" stroke="var(--gold)" stroke-width="1.5">
        <path d="M24 6 C12 6 6 16 6 24 a10 8 0 0 0 10 8 h2 a4 4 0 0 1 4 4 v2 a6 6 0 0 0 12 0 c8 -2 14 -10 14 -18 C48 12 36 6 24 6 Z"/>
        <circle cx="16" cy="20" r="1.6" fill="var(--gold)" stroke="none"/>
        <circle cx="26" cy="14" r="1.6" fill="var(--gold)" stroke="none"/>
        <circle cx="34" cy="22" r="1.6" fill="var(--gold)" stroke="none"/>
    </svg>`,

    trattamento: `<svg viewBox="0 0 48 48" fill="none" stroke="var(--gold)" stroke-width="1.5">
        <path d="M24 6 C14 16 10 24 10 30 a14 14 0 0 0 28 0 c0 -6 -4 -14 -14 -24 Z"/>
        <path d="M24 18 v20" stroke-dasharray="2 3"/>
    </svg>`,

    ricostruzione: `<svg viewBox="0 0 48 48" fill="none" stroke="var(--gold)" stroke-width="1.5">
        <circle cx="24" cy="24" r="3"/>
        <circle cx="10" cy="14" r="2.5"/><circle cx="38" cy="14" r="2.5"/>
        <circle cx="10" cy="34" r="2.5"/><circle cx="38" cy="34" r="2.5"/>
        <path d="M24 24 L10 14 M24 24 L38 14 M24 24 L10 34 M24 24 L38 34"/>
    </svg>`,

    effettiLuce: `<svg viewBox="0 0 48 48" fill="none" stroke="var(--gold)" stroke-width="1.5">
        <circle cx="24" cy="24" r="7"/>
        <path d="M24 4 v6 M24 38 v6 M4 24 h6 M38 24 h6
                  M10 10 l4 4 M34 34 l4 4 M38 10 l-4 4 M14 34 l-4 4"/>
    </svg>`,

    laminazione: `<svg viewBox="0 0 48 48" fill="none" stroke="var(--gold)" stroke-width="1.5">
        <path d="M8 30 C14 12 34 12 40 30" />
        <path d="M8 30 h32" stroke-dasharray="1 4"/>
        <path d="M16 22 l2 -3 M24 20 l2 -4 M32 22 l2 -3"/>
    </svg>`,

    scrub: `<svg viewBox="0 0 48 48" fill="none" stroke="var(--gold)" stroke-width="1.5">
        <circle cx="16" cy="18" r="4"/><circle cx="30" cy="14" r="3"/>
        <circle cx="34" cy="28" r="4.5"/><circle cx="16" cy="32" r="3"/>
    </svg>`,

    // Fallback generico per servizi non riconosciuti da nessuna categoria
    genericoRegalo: `<svg viewBox="0 0 48 48" fill="none" stroke="var(--gold)" stroke-width="1.5">
        <rect x="8" y="20" width="32" height="20" rx="1"/>
        <path d="M8 20 h32 M24 20 v20"/>
        <path d="M24 20 c-6 -10 -16 -6 -14 0 c2 4 10 4 14 0
                  c4 4 12 4 14 0 c2 -6 -8 -10 -14 0 Z"/>
    </svg>`,

    // Simbolo per "niente vinto" - elegante, non deludente
    niente: `<svg viewBox="0 0 48 48" fill="none" stroke="var(--gold)" stroke-width="1.5" opacity="0.6">
        <path d="M24 8 l3 8 l8 1 l-6 6 l1 8 l-6 -4 l-6 4 l1 -8 l-6 -6 l8 -1 Z"/>
    </svg>`
};

// --- RICONOSCIMENTO CATEGORIA DAL NOME SERVIZIO ---
// Confronto per parole chiave (case-insensitive). Basta che il nome del
// servizio CONTENGA la parola chiave. Non serve mappare ogni singolo
// servizio del catalogo, solo le categorie principali.
const MAPPA_CATEGORIE_ICONE = [
    { chiavi: ['taglio'], icona: 'taglio' },
    { chiavi: ['piega', 'wellness'], icona: 'piega' },
    { chiavi: ['shampoo', 'sh '], icona: 'shampoo' },
    { chiavi: ['colore', 'colorazione', 'tinta'], icona: 'colore' },
    { chiavi: ['trattamento', 'maschera', 'post colore'], icona: 'trattamento' },
    { chiavi: ['ricostruzione', 'molecolare'], icona: 'ricostruzione' },
    { chiavi: ['effetti luce', 'meches', 'schiariture', 'balayage'], icona: 'effettiLuce' },
    { chiavi: ['laminazione', 'lucidatura'], icona: 'laminazione' },
    { chiavi: ['scrub', 'argilla', 'cute'], icona: 'scrub' }
];

function getIconSvgPerServizio(nomeServizio) {
    const nomeLower = (nomeServizio || '').toLowerCase();

    const match = MAPPA_CATEGORIE_ICONE.find(cat =>
        cat.chiavi.some(chiave => nomeLower.includes(chiave))
    );

    return match ? SLOT_ICONE[match.icona] : SLOT_ICONE.genericoRegalo;
}

function getIconSvgNiente() {
    return SLOT_ICONE.niente;
}
