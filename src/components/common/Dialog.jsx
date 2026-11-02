import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { iconBtn, btnGhost, btnDanger, btnPrimary } from './ui';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Diálogo único do app: role="dialog", Esc fecha, o foco fica preso dentro e volta
 * ao botão que abriu. O primeiro elemento com data-autofocus recebe o foco inicial.
 */
export default function Dialog({ open, onClose, title, description, children, footer, size = 'md' }) {
    const panelRef = useRef(null);
    const titleId = useId();
    const descId = useId();
    // onClose costuma ser uma função nova a cada render: guardada em ref para não reiniciar o foco
    const closeRef = useRef(onClose);
    useEffect(() => { closeRef.current = onClose; });

    useEffect(() => {
        if (!open) return;
        const opener = document.activeElement;
        const panel = panelRef.current;
        const first = panel.querySelector('[data-autofocus]') || panel.querySelector(FOCUSABLE) || panel;
        // Só no desktop: no celular o foco automático abre o teclado por cima do diálogo
        if (window.matchMedia('(pointer: fine)').matches || !first.matches('input, textarea')) first.focus();
        else panel.focus();

        const onKey = (e) => {
            if (e.key === 'Escape') { e.stopPropagation(); closeRef.current(); return; }
            if (e.key !== 'Tab') return;
            const items = [...panel.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null);
            if (!items.length) return;
            const [head, tail] = [items[0], items[items.length - 1]];
            if (e.shiftKey && document.activeElement === head) { e.preventDefault(); tail.focus(); }
            else if (!e.shiftKey && document.activeElement === tail) { e.preventDefault(); head.focus(); }
        };
        document.addEventListener('keydown', onKey, true);
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey, true);
            document.body.style.overflow = overflow;
            if (opener && typeof opener.focus === 'function') opener.focus();
        };
    }, [open]);

    if (!open) return null;

    const width = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' }[size];

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
            <div className="dialog-backdrop absolute inset-0 bg-slate-950/50" onClick={onClose} aria-hidden="true" />
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={description ? descId : undefined}
                tabIndex={-1}
                className={`dialog-panel relative flex w-full ${width} max-h-[92dvh] flex-col rounded-t-[var(--radius-panel)] sm:rounded-[var(--radius-panel)] bg-surface text-ink shadow-[var(--shadow-float)] outline-none`}
            >
                <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3 sm:px-6">
                    <div className="min-w-0">
                        <h2 id={titleId} className="text-xl font-bold tracking-[-0.01em]">{title}</h2>
                        {description && <p id={descId} className="mt-1 text-sm text-ink-2">{description}</p>}
                    </div>
                    <button type="button" onClick={onClose} aria-label="Fechar" className={`${iconBtn} -mr-2 -mt-1`}><X size={18} /></button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6">{children}</div>
                {footer && <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:flex-row sm:justify-end sm:px-6 sm:pb-4">{footer}</div>}
            </div>
        </div>
    );
}

// Confirmação para ações que não podem ser desfeitas
export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel, danger = true }) {
    return (
        <Dialog open={open} onClose={onClose} title={title} description={description} size="sm"
            footer={<>
                <button type="button" onClick={onClose} className={btnGhost} data-autofocus>Cancelar</button>
                <button type="button" onClick={() => { onConfirm(); onClose(); }} className={danger ? btnDanger : btnPrimary}>{confirmLabel}</button>
            </>}
        />
    );
}
