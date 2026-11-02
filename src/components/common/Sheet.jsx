import React from 'react';

// A folha A4 com as margens da ABNT (3 cm em cima e à esquerda, 2 cm embaixo e à direita):
// o motivo visual do produto. As linhas de texto ocupam a área útil conforme o progresso.
const LINES = 9;
const WIDTHS = [100, 92, 97, 88, 100, 95, 70, 100, 84];

export default function Sheet({ progress = 0, className = '', faded = false }) {
    const filled = Math.round((Math.min(100, Math.max(0, progress)) / 100) * LINES);
    return (
        <span aria-hidden="true" className={`relative block aspect-[210/297] shrink-0 rounded-[var(--radius-sheet)] bg-white shadow-[var(--shadow-sheet)] ring-1 ring-black/5 ${faded ? 'opacity-60' : ''} ${className}`}>
            <span className="absolute flex flex-col justify-start gap-[9%]" style={{ left: '14.3%', top: '10.1%', right: '9.5%', bottom: '6.7%' }}>
                {Array.from({ length: LINES }, (_, i) => (
                    <span key={i} className={`block h-[6%] min-h-px rounded-[1px] ${i < filled ? 'bg-slate-400' : 'bg-slate-100'}`} style={{ width: `${WIDTHS[i]}%` }} />
                ))}
            </span>
        </span>
    );
}
