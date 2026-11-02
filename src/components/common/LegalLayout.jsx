import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

// Moldura das páginas legais: leitura longa, sem distrações, no tema claro da landing
export default function LegalLayout({ title, updated, children }) {
    useEffect(() => {
        const previous = document.title;
        document.title = `${title} · ABNTFácil`;
        window.scrollTo(0, 0);
        return () => { document.title = previous; };
    }, [title]);

    return (
        <div className="theme-light min-h-dvh bg-paper font-sans text-ink">
            <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-[var(--radius-control)] focus:bg-surface focus:px-4 focus:py-2">Pular para o conteúdo</a>
            <header className="safe-top border-b border-line">
                <nav aria-label="Principal" className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 md:px-8">
                    <Link to="/" className="flex items-center gap-2.5 rounded-[var(--radius-control)] text-lg font-bold tracking-[-0.02em]">
                        <img src="/favicon.svg" alt="" width="28" height="28" className="size-7" />
                        ABNTFácil
                    </Link>
                    <Link to="/dashboard" className="text-[15px] font-semibold text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent">Abrir o editor</Link>
                </nav>
            </header>
            <main id="conteudo" className="mx-auto max-w-3xl px-4 pb-24 pt-12 md:px-8">
                <h1 className="text-[clamp(2rem,1.5rem+2vw,3rem)] font-bold leading-[1.05] tracking-[-0.03em]">{title}</h1>
                <p className="mt-3 text-sm text-ink-2">Última atualização: {updated}</p>
                <div className="legal mt-10 font-serif text-[1.0625rem] leading-[1.7] text-ink">{children}</div>
            </main>
            <footer className="border-t border-line">
                <div className="mx-auto flex max-w-3xl flex-wrap gap-x-6 gap-y-2 px-4 py-8 text-[15px] md:px-8">
                    <Link to="/privacidade" className="font-semibold underline decoration-line underline-offset-4 hover:text-accent">Privacidade</Link>
                    <Link to="/termos" className="font-semibold underline decoration-line underline-offset-4 hover:text-accent">Termos de uso</Link>
                    <Link to="/" className="font-semibold underline decoration-line underline-offset-4 hover:text-accent">Página inicial</Link>
                </div>
            </footer>
        </div>
    );
}
