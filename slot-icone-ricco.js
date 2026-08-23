// =========================================================
// SLOT MACHINE PREMI - Set Icone ARRICCHITO (via di mezzo)
// =========================================================
// Rispetto al set base, queste hanno qualche dettaglio/accento in più
// (piccoli elementi pieni, doppie linee) per un effetto più "pregiato",
// pensate per stare dentro la cornice circolare dorata doppia.

const SLOT_ICONE_RICCO = {
    taglio: `<svg viewBox="0 0 48 48" fill="none" stroke="var(--gold)" stroke-width="1.3">
        <circle cx="9" cy="13" r="3.5"/><circle cx="9" cy="33" r="3.5"/>
        <path d="M12 15 L36 40 M12 31 L36 6"/>
        <path d="M38 6 C34 8 32 12 33 16" stroke-width="1"/>
        <circle cx="9" cy="13" r="1" fill="var(--gold)" stroke="none"/>
        <circle cx="9" cy="33" r="1" fill="var(--gold)" stroke="none"/>
    </svg>`,

    piega: `<svg viewBox="0 0 48 48" fill="none" stroke="var(--gold)" stroke-width="1.3">
        <path d="M8 10 h12 a12 12 0 0 1 12 12 v6"/>
        <path d="M8 10 v-3" stroke-linecap="round"/>
        <path d="M28 30 l4 4 l4 -4 M28 34 l4 4 l4 -4" stroke-width="1"/>
        <circle cx="8" cy="10" r="1" fill="var(--gold)" stroke="none"/>
    </svg>`,

    shampoo: `<svg viewBox="0 0 48 48" fill="none" stroke="var(--gold)" stroke-width="1.3">
        <path d="M24 5 c6 8 11 15 11 21 a11 11 0 0 1 -22 0 c0 -6 5 -13 11 -21 Z"/>
        <path d="M18 26 C18 20 21 16 24 14" stroke-width="1" stroke-dasharray="1.5 2"/>
        <circle cx="24" cy="8" r="1" fill="var(--gold)" stroke="none"/>
    </svg>`,

    colore: `<svg viewBox="0 0 48 48" fill="none" stroke="var(--gold)" stroke-width="1.3">
        <path d="M24 6 C12 6 5 16 5 25 a9 7 0 0 0 9 7 h2 a3.5 3.5 0 0 1 3.5 3.5 v1.5
                  a5.5 5.5 0 0 0 11 0 c7 -2 12.5 -9 12.5 -17 C43 12 34 6 24 6 Z"/>
        <circle cx="15" cy="19" r="2" fill="var(--gold)" stroke="none"/>
        <circle cx="25" cy="13" r="2" fill="var(--gold)" stroke="none"/>
        <circle cx="33" cy="21" r="2" fill="var(--gold)" stroke="none"/>
        <circle cx="22" cy="26" r="2" fill="none" stroke="var(--gold)" stroke-width="1"/>
    </svg>`,

    trattamento: `<svg viewBox="0 0 48 48" fill="none" stroke="var(--gold)" stroke-width="1.3">
        <path d="M24 5 C13 15 8 24 8 30 a16 16 0 0 0 32 0 c0 -6 -5 -15 -16 -25 Z"/>
        <path d="M24 16 C20 22 20 30 24 38" stroke-width="1"/>
        <path d="M17 26 C19 24 22 24 24 26" stroke-width="1"/>
        <path d="M31 26 C29 24 26 24 24 26" stroke-width="1"/>
    </svg>`,

    ricostruzione: `<svg viewBox="0 0 48 48" fill="none" stroke="var(--gold)" stroke-width="1.3">
        <path d="M16 6 C16 14 32 14 32 22 C32 30 16 30 16 38" stroke-width="1.2"/>
        <path d="M32 6 C32 14 16 14 16 22 C16 30 32 30 32 38" stroke-width="1.2"/>
        <path d="M18 12 h12 M18 22 h12 M18 32 h12" stroke-width="0.9" stroke-dasharray="1 1.5"/>
        <circle cx="16" cy="6" r="1.3" fill="var(--gold)" stroke="none"/>
        <circle cx="32" cy="38" r="1.3" fill="var(--gold)" stroke="none"/>
    </svg>`,

    effettiLuce: `<svg viewBox="0 0 48 48" fill="none" stroke="var(--gold)" stroke-width="1.3">
        <path d="M24 14 C27 18 27 22 24 24 C21 22 21 18 24 14 Z"/>
        <path d="M32 18 C33 22 32 26 28 27 C27 24 28 20 32 18 Z"/>
        <path d="M16 18 C15 22 16 26 20 27 C21 24 20 20 16 18 Z"/>
        <path d="M24 26 C27 28 28 32 26 35 C23 34 21 30 24 26 Z"/>
        <path d="M24 26 C21 28 20 32 22 35 C25 34 27 30 24 26 Z"/>
        <circle cx="24" cy="25" r="1.6" fill="var(--gold)" stroke="none"/>
    </svg>`,

    laminazione: `<svg viewBox="0 0 48 48" fill="none" stroke="var(--gold)" stroke-width="1.3">
        <path d="M10 14 C16 10 20 16 18 22 C16 28 20 34 26 32 C32 30 30 24 26 22"/>
        <path d="M14 16 l1.5 -2.5 M22 24 l1.5 -2.5 M28 30 l1.5 -2.5" stroke-width="1"/>
        <circle cx="10" cy="14" r="1" fill="var(--gold)" stroke="none"/>
    </svg>`,

    scrub: `<svg viewBox="0 0 48 48" fill="none" stroke="var(--gold)" stroke-width="1.3">
        <circle cx="15" cy="17" r="4"/><circle cx="30" cy="13" r="3"/>
        <circle cx="34" cy="27" r="4.5"/><circle cx="15" cy="31" r="3"/>
        <circle cx="15" cy="17" r="1" fill="var(--gold)" stroke="none"/>
        <circle cx="34" cy="27" r="1.2" fill="var(--gold)" stroke="none"/>
    </svg>`,

    genericoRegalo: `<svg viewBox="0 0 48 48" fill="none" stroke="var(--gold)" stroke-width="1.3">
        <rect x="9" y="21" width="30" height="18" rx="1"/>
        <path d="M9 21 h30 M24 21 v18"/>
        <path d="M24 21 c-5 -9 -15 -5 -13 0.5 c1.5 3.5 9 3.5 13 0
                  c4 3.5 11.5 3.5 13 0 c2 -5.5 -8 -9.5 -13 -0.5 Z"/>
        <circle cx="24" cy="21" r="1.3" fill="var(--gold)" stroke="none"/>
    </svg>`,

    niente: `<svg viewBox="0 0 48 48" fill="none" stroke="var(--gold)" stroke-width="1.3" opacity="0.65">
        <path d="M24 8 l2.8 7.5 l7.8 0.8 l-5.8 5.4 l1.6 7.7 l-6.4 -4 l-6.4 4 l1.6 -7.7 l-5.8 -5.4 l7.8 -0.8 Z"/>
        <circle cx="24" cy="21" r="1" fill="var(--gold)" stroke="none"/>
    </svg>`
};

// --- CORNICE CIRCOLARE DORATA (via CSS, riutilizzabile) ---
// Genera l'HTML di un badge circolare con doppio anello dorato,
// contenente l'icona passata come parametro.
function creaBadgeSlot(iconSvg, dimensione = 100) {
    return `
        <div class="slot-badge" style="width:${dimensione}px; height:${dimensione}px;">
            <div class="slot-badge-anello-esterno">
                <div class="slot-badge-anello-interno">
                    <div class="slot-badge-icona">${iconSvg}</div>
                </div>
            </div>
        </div>
    `;
}
