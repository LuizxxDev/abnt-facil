import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import usePageMeta from '../hooks/usePageMeta';

// Página 404: uma folha A4 com a margem tracejada e nada escrito dentro
export default function NotFoundPage() {
    usePageMeta(404);
    const block = 'label-mono inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] px-5 transition-[background-color,transform] duration-150 active:scale-[0.97]';

    return (
        <div className="theme-light dot-grid-ink flex min-h-dvh flex-col bg-paper font-sans text-ink">
            <header className="safe-top px-4 pt-4 md:px-8">
                <Link to="/" className="inline-flex items-center gap-2.5 rounded-[var(--radius-control)] text-lg font-bold tracking-[-0.02em]">
                    <img src="/favicon.svg" alt="" width="28" height="28" className="size-7" />
                    ABNTFácil
                </Link>
            </header>
            <main id="conteudo" className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-12 px-4 py-14 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] md:px-8">
                <div>
                    <p className="label-mono text-ink-2">Erro 404 · Página não encontrada</p>
                    <h1 className="mt-5 text-[clamp(2.5rem,1.4rem+4vw,4.5rem)] font-bold leading-[0.95] tracking-[-0.035em]">Esta página não está no sumário.</h1>
                    <p className="mt-6 max-w-md font-serif text-lg leading-relaxed">
                        O endereço pode ter mudado ou ter sido digitado com um erro. Os seus documentos continuam salvos: eles ficam no painel.
                    </p>
                    <div className="mt-9 flex flex-wrap gap-2">
                        <Link to="/dashboard" className={`${block} bg-accent-fill text-white hover:bg-accent-fill-hover`}>Abrir o editor <ArrowRight size={17} aria-hidden="true" /></Link>
                        <Link to="/" className={`${block} bg-surface-2 text-ink hover:bg-line`}>Voltar ao início</Link>
                    </div>
                </div>
                {/* A folha em branco: só a margem e o número da página */}
                <div className="relative mx-auto aspect-[210/297] w-full max-w-[300px] rounded-[var(--radius-sheet)] bg-white shadow-[var(--shadow-sheet)] ring-1 ring-black/5" aria-hidden="true">
                    <div className="absolute rounded-[1px] border border-dashed border-green-600/40" style={{ left: '14.3%', top: '10.1%', right: '9.5%', bottom: '6.7%' }} />
                    <span className="absolute right-[9.5%] top-[4%] font-mono text-[13px] text-slate-600">404</span>
                </div>
            </main>
        </div>
    );
}
