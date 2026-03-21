import React from 'react';
import { Bold, Italic, Link, Quote, List, Type, BookOpen } from 'lucide-react';

export const EditorToolbar = ({ onAction }) => {
    const buttons = [
        { id: 'bold', icon: Bold, label: 'Negrito (Ctrl+B)', syntax: '**' },
        { id: 'italic', icon: Italic, label: 'Itálico (Ctrl+I)', syntax: '*' },
        { id: 'quote', icon: Quote, label: 'Citação Longa', isBlock: true, prefix: '[CITAÇÃO]: ' },
        { id: 'ref', icon: BookOpen, label: 'Gerador de Referência', action: 'open_ref_modal' },
    ];

    return (
        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded-lg shadow-sm mb-2 w-fit">
            {buttons.map(btn => (
                <button
                    key={btn.id}
                    onClick={(e) => { e.preventDefault(); onAction(btn); }}
                    title={btn.label}
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                >
                    <btn.icon size={16} />
                </button>
            ))}
        </div>
    );
};