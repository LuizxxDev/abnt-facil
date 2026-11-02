import React from 'react';
import { Bold, Italic, Quote, BookOpen, Superscript, Sigma, ListOrdered } from 'lucide-react';

export const EditorToolbar = ({ onAction }) => {
    const buttons = [
        { id: 'bold', icon: Bold, label: 'Negrito', syntax: '**' },
        { id: 'italic', icon: Italic, label: 'Itálico', syntax: '*' },
        { id: 'quote', icon: Quote, label: 'Citação longa', isBlock: true, prefix: '[CITAÇÃO]: ' },
        { id: 'note', icon: Superscript, label: 'Nota de rodapé (palavra^[texto da nota])', wrap: ['^[', ']'] },
        { id: 'list', icon: ListOrdered, label: 'Alíneas (a) item; b) item; - subalínea)', isBlock: true, prefix: 'a) ' },
        { id: 'equation', icon: Sigma, label: 'Equação numerada em LaTeX', isBlock: true, prefix: '[EQUAÇÃO]: ' },
        { id: 'ref', icon: BookOpen, label: 'Gerar referência', action: 'open_ref_modal' },
    ];

    return (
        <div role="toolbar" aria-label="Formatação" className="-ml-1.5 flex flex-wrap items-center gap-0.5">
            {buttons.map(btn => (
                <button
                    key={btn.id}
                    type="button"
                    // onMouseDown (e não onClick) para o campo de texto não perder a seleção; o teclado usa onClick
                    onMouseDown={(e) => { e.preventDefault(); onAction(btn); }}
                    onClick={(e) => { if (e.detail === 0) onAction(btn); }}
                    title={btn.label}
                    aria-label={btn.label}
                    className="flex size-8 items-center justify-center rounded-[var(--radius-control)] text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink pointer-coarse:size-10"
                >
                    <btn.icon size={16} aria-hidden="true" />
                </button>
            ))}
        </div>
    );
};
