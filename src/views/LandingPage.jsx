import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Copy, Check, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { DOCUMENT_TYPES } from '../utils/documentTypes';
import { EXAMPLE_ID } from '../utils/constants';
import { EXAMPLE_ARTICLE_ID } from '../utils/exampleArticle';

const FeedbackModal = lazy(() => import('../components/common/FeedbackModal').then(m => ({ default: m.FeedbackModal })));

const PIX_KEY = 'abntfacil9@gmail.com';

// Cada recurso aponta para a parte da folha que ele resolve (a folha ao lado acende essa parte)
const FEATURES = [
    { id: 'margens', title: 'Paginação real em A4', desc: 'O texto é distribuído em folhas de verdade: margens de 3 cm e 2 cm, parágrafos que continuam na folha seguinte e número da página no canto superior direito.' },
    { id: 'capa', title: 'Capa, sumário e listas automáticos', desc: 'Folha de rosto, folha de aprovação, sumário, listas de ilustrações e de tabelas são montados a partir do que você escreve, com os números de página certos.' },
    { id: 'referencias', title: 'Referências na NBR 6023:2018', desc: 'Preencha autor, título e ano: o gerador monta a referência com o destaque correto e a lista sai em ordem alfabética.' },
    { id: 'citacao', title: 'Assistente que confere as normas', desc: 'Avisa quando o resumo está fora do tamanho, quando um autor citado não está nas referências e quando a citação ainda está no formato antigo, como (SILVA, 2023).' },
    { id: 'dados', title: 'Seus dados ficam com você', desc: 'Sem login, os documentos ficam salvos no seu navegador. Com login Google, sincronizam na nuvem. Para gerar o PDF, o documento passa pelo nosso servidor e não é guardado lá.' },
];

const FAQ = [
    { q: 'Preciso pagar para usar?', a: 'Não. Todas as ferramentas de formatação e exportação são gratuitas. O projeto se mantém com doações voluntárias.' },
    { q: 'O PDF sai mesmo nas normas?', a: 'O editor aplica as regras principais da NBR 14724: A4, margens de 3 cm (superior e esquerda) e 2 cm (inferior e direita), Arial ou Times 12, espaçamento 1,5, recuo de 1,25 cm e paginação. A conferência automática não cobre todas as regras: revise o resultado e o manual da sua instituição antes de entregar.' },
    { q: 'Para onde vai o meu texto?', a: 'Sem login, o documento fica salvo no seu navegador. Com login, também fica guardado na sua conta, no Supabase. Ao baixar o PDF, o documento é enviado ao nosso servidor (Vercel) só para gerar o arquivo e não é armazenado. Detalhes na Política de Privacidade.' },
    { q: 'É um projeto oficial do IFPA ou da ABNT?', a: 'Não. É um projeto independente, criado por um estudante do IFPA Campus Belém, sem vínculo com o IFPA nem com a ABNT. As normas são aplicadas a partir dos textos publicados; o editor ajuda na formatação, mas não certifica o trabalho.' },
    { q: 'Como não perder meu trabalho?', a: 'Entre com sua conta Google para sincronizar na nuvem ou baixe uma cópia de segurança no painel com frequência.' },
    { q: 'Minha instituição tem regras próprias.', a: 'O manual da sua instituição prevalece sobre a ABNT. Os textos da folha de rosto, a fonte e as seções podem ser ajustados no editor.' },
];

// As abas da pilha de folhas: cada tipo monta a primeira folha de um jeito
const STACK = [
    { key: 'tcc', tab: 'TCC', layout: 'capa', tipo: '' },
    { key: 'artigo', tab: 'Artigo', layout: 'artigo' },
    { key: 'relatorio', tab: 'Relatório', layout: 'capa', tipo: 'RELATÓRIO TÉCNICO-CIENTÍFICO' },
    { key: 'projeto', tab: 'Projeto', layout: 'capa', tipo: 'PROJETO DE PESQUISA' },
];

const MARGIN = { left: '14.3%', top: '10.1%', right: '9.5%', bottom: '6.7%' }; // 30 e 20 mm sobre 210 × 297 mm

// Linhas de texto desenhadas (o corpo da folha)
const Lines = ({ n, last = 60, indent = true }) => (
    <span className="flex flex-col gap-[0.42em]" aria-hidden="true">
        {Array.from({ length: n }, (_, i) => (
            <span key={i} className="block h-[0.32em] rounded-[1px] bg-slate-300" style={{ width: i === n - 1 ? `${last}%` : indent && i === 0 ? '91%' : '100%', marginLeft: indent && i === 0 ? '9%' : 0 }} />
        ))}
    </span>
);

// A primeira folha do trabalho, montada com o título e o nome que a pessoa digita
const FrontSheet = ({ layout, tipo, titulo, autor }) => {
    const T = (titulo || 'Título do seu trabalho').toUpperCase();
    const A = (autor || 'Seu nome completo').toUpperCase();
    return (
        <div className="absolute flex flex-col text-[clamp(11px,2.4cqw,13px)] leading-[1.45] text-slate-950" style={MARGIN}>
            {layout === 'capa' && (
                <div className="flex h-full flex-col items-center text-center">
                    <p className="font-[Arial,sans-serif] font-bold">INSTITUTO FEDERAL DO PARÁ</p>
                    <p className="mt-[6%] font-[Arial,sans-serif]">{A}</p>
                    <div className="mt-auto">
                        <p className="font-[Arial,sans-serif] font-bold [overflow-wrap:anywhere]">{T}</p>
                        {tipo && <p className="mt-[0.6em] font-[Arial,sans-serif]">{tipo}</p>}
                    </div>
                    <div className="mt-auto font-[Arial,sans-serif]">
                        <p>BELÉM</p>
                        <p suppressHydrationWarning>{new Date().getFullYear()}</p>
                    </div>
                </div>
            )}
            {layout === 'artigo' && (
                <div className="flex h-full flex-col">
                    <p className="text-center font-[Arial,sans-serif] font-bold [overflow-wrap:anywhere]">{T}</p>
                    <p className="mt-[1em] text-right font-[Arial,sans-serif]">{autor || 'Seu nome completo'}</p>
                    <p className="mt-[1.4em] font-[Arial,sans-serif] text-[0.9em]"><span className="font-bold">Resumo:</span></p>
                    <div className="mt-[0.4em]"><Lines n={5} last={70} indent={false} /></div>
                    <p className="mt-[0.8em] font-[Arial,sans-serif] text-[0.9em]"><span className="font-bold">Palavras-chave:</span> ABNT; normas; formatação.</p>
                    <p className="mt-[1.6em] font-[Arial,sans-serif] font-bold">1 INTRODUÇÃO</p>
                    <div className="mt-[0.6em]"><Lines n={7} last={48} /></div>
                </div>
            )}
        </div>
    );
};

// Pilha de folhas com abas: o motivo da marca em escala grande
const SheetStack = ({ titulo, autor }) => {
    const [active, setActive] = useState('tcc');
    const current = STACK.find(s => s.key === active);
    const behind = STACK.filter(s => s.key !== active);

    return (
        <div className="mx-auto w-full max-w-[460px]">
            <div className="relative pt-[5.5rem] [container-type:inline-size]">
                {/* Folhas de trás: só a aba aparece; tocar numa delas a traz para a frente */}
                {behind.map((s, i) => (
                    <div key={s.key} className="absolute inset-x-0 top-0 aspect-[210/297] rounded-[var(--radius-sheet)] bg-white transition-transform duration-300 ease-[var(--ease-out-strong)]"
                        style={{ transform: `translateY(${i * 1.5}rem) scale(${0.94 + i * 0.02})`, zIndex: i, background: ['#e4efe8', '#eef6f1', '#ffffff'][i] }} aria-hidden="true" />
                ))}
                <div role="tablist" aria-label="Tipo de trabalho" className="absolute inset-x-0 top-0 z-10 flex h-[5.5rem] items-end gap-1.5 px-3">
                    {STACK.map(s => (
                        <button key={s.key} type="button" role="tab" aria-selected={active === s.key} onClick={() => setActive(s.key)}
                            className={`h-10 flex-1 rounded-t-[6px] px-2 text-sm font-semibold transition-[transform,background-color,color] duration-200 ease-[var(--ease-out-strong)] [clip-path:polygon(8%_0,92%_0,100%_100%,0_100%)] pointer-coarse:h-11 ${active === s.key ? 'translate-y-0 bg-white text-ink' : 'translate-y-2 bg-accent-fill text-white hover:translate-y-0.5'}`}>
                            {s.tab}
                        </button>
                    ))}
                </div>
                <div className="relative z-10 aspect-[210/297] w-full rounded-[var(--radius-sheet)] bg-white shadow-[var(--shadow-sheet)] ring-1 ring-black/5" data-ui>
                    {/* Área útil: as margens da ABNT, com as medidas */}
                    <div className="absolute rounded-[1px] border border-dashed border-green-600/40" style={MARGIN} aria-hidden="true" />
                    <span className="absolute left-[14.3%] top-[3.4%] -translate-x-1/2 text-[13px] font-medium text-green-700" aria-hidden="true">3 cm</span>
                    <span className="absolute left-[2%] top-[46%] -translate-x-1/4 -rotate-90 text-[13px] font-medium text-green-700" aria-hidden="true">3 cm</span>
                    <span className="absolute right-[0.5%] top-[46%] translate-x-1/4 rotate-90 text-[13px] font-medium text-green-700" aria-hidden="true">2 cm</span>
                    <span className="absolute bottom-[1.4%] left-[55%] text-[13px] font-medium text-green-700" aria-hidden="true">2 cm</span>
                    <div key={active} className="fade-in"><FrontSheet layout={current.layout} tipo={current.tipo} titulo={titulo} autor={autor} /></div>
                    <p className="sr-only" aria-live="polite">{`Folha de exemplo: ${current.tab}. Título: ${titulo || 'não preenchido'}. Autor: ${autor || 'não preenchido'}.`}</p>
                </div>
            </div>

        </div>
    );
};

// Folha anotada: acende a parte que cada recurso resolve
const AnatomySheet = ({ active }) => {
    const on = (id) => (active === id ? 'opacity-100' : 'opacity-0');
    return (
        <div className="relative mx-auto aspect-[210/297] w-full max-w-[380px] rounded-[var(--radius-sheet)] bg-white text-[clamp(11px,2.6cqw,12px)] shadow-[var(--shadow-sheet)] ring-1 ring-black/5 [container-type:inline-size]" data-ui aria-hidden="true">
            <span className="absolute right-[9.5%] top-[5.5%] font-[Arial,sans-serif] text-slate-600">11</span>
            <div className="absolute flex flex-col gap-[1.1em]" style={MARGIN}>
                <p className="font-[Arial,sans-serif] font-bold text-slate-950">2 REFERENCIAL TEÓRICO</p>
                <Lines n={5} last={70} />
                <div className="relative ml-[29%]">
                    <Lines n={3} last={55} indent={false} />
                    <span className="absolute bottom-[-1.7em] right-0 font-[Arial,sans-serif] text-[0.8em] text-slate-700">(Silva, 2023, p. 15)</span>
                </div>
                <Lines n={6} last={40} />
                <p className="mt-[0.4em] text-center font-[Arial,sans-serif] font-bold text-slate-950">REFERÊNCIAS</p>
                <div className="flex flex-col gap-[0.9em] font-[Arial,sans-serif] text-[0.85em] leading-snug text-slate-700">
                    <p>SILVA, A. <b>Escrita acadêmica</b>. Belém: EDUFPA, 2023.</p>
                    <p>SOUZA, M. <b>Normas na prática</b>. São Paulo: Atlas, 2021.</p>
                </div>
            </div>

            {/* Destaques, um por recurso (troca por opacidade) */}
            <div className={`absolute rounded-[2px] outline-2 outline-dashed outline-accent transition-opacity duration-[240ms] ${on('margens')}`} style={MARGIN} />
            <div className={`absolute left-[12%] right-[7%] top-[8.5%] h-[6%] rounded-[3px] bg-accent/15 ring-2 ring-accent transition-opacity duration-[240ms] ${on('capa')}`} />
            <div className={`absolute bottom-[5%] left-[12%] right-[7%] h-[24%] rounded-[3px] bg-accent/15 ring-2 ring-accent transition-opacity duration-[240ms] ${on('referencias')}`} />
            <div className={`absolute left-[40%] right-[7%] top-[33%] h-[16%] rounded-[3px] bg-accent/15 ring-2 ring-accent transition-opacity duration-[240ms] ${on('citacao')}`} />
            <div className={`absolute inset-0 flex items-end justify-center pb-[3%] transition-opacity duration-[240ms] ${on('dados')}`}>
                <span className="rounded-[var(--radius-control)] bg-accent-fill px-3 py-1.5 text-[13px] font-semibold text-white">Salvo neste navegador</span>
            </div>
        </div>
    );
};

// Seções entram uma vez ao aparecer na tela; sem script, tudo já fica visível
const useReveal = () => {
    useEffect(() => {
        const root = document.documentElement;
        if (!('IntersectionObserver' in window)) return;
        root.classList.add('js-reveal');
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
        }, { rootMargin: '0px 0px -12% 0px' });
        document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
        return () => { io.disconnect(); root.classList.remove('js-reveal'); };
    }, []);
};

const LandingPage = () => {
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [feature, setFeature] = useState('margens');
    const [titulo, setTitulo] = useState('');
    const [autor, setAutor] = useState('');
    useReveal();

    const copyPix = async () => {
        try {
            await navigator.clipboard.writeText(PIX_KEY);
            setCopied(true);
            toast.success('Chave PIX copiada');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Não foi possível copiar. Selecione a chave manualmente.');
        }
    };

    const delay = (ms) => ({ animationDelay: `${ms}ms` });
    const primary = 'inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-accent-fill px-6 text-base font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-accent-fill-hover';

    return (
        <div className="theme-light relative min-h-dvh bg-paper font-sans text-ink">
            <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-[var(--radius-control)] focus:bg-surface focus:px-4 focus:py-2 focus:shadow-[var(--shadow-float)]">Pular para o conteúdo</a>

            <header className="safe-top sticky top-0 z-50 bg-paper">
                <nav aria-label="Principal" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
                    <a href="/" className="flex items-center gap-2.5 rounded-[var(--radius-control)] text-lg font-bold tracking-[-0.02em]" aria-label="ABNTFácil, início">
                        <img src="/favicon.svg" alt="" width="28" height="28" className="size-7" />
                        ABNTFácil
                    </a>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <a href="#documentos" className="hidden rounded-[var(--radius-control)] px-3 py-2 text-base font-medium text-ink-2 transition-colors hover:text-ink md:block">Documentos</a>
                        <a href="#como-funciona" className="hidden rounded-[var(--radius-control)] px-3 py-2 text-base font-medium text-ink-2 transition-colors hover:text-ink md:block">Como funciona</a>
                        <a href="#perguntas" className="hidden rounded-[var(--radius-control)] px-3 py-2 text-base font-medium text-ink-2 transition-colors hover:text-ink md:block">Perguntas</a>
                        <Link to="/dashboard" className="ml-1 inline-flex h-10 items-center gap-2 rounded-[var(--radius-control)] bg-ink px-4 text-sm font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-accent-fill active:scale-[0.97]">
                            Abrir o editor <ArrowRight size={16} aria-hidden="true" />
                        </Link>
                    </div>
                </nav>
            </header>

            <main id="conteudo">
                {/* Hero: o título à esquerda, a pilha de folhas com a capa ao vivo à direita */}
                <section className="mx-auto max-w-6xl px-4 pb-24 pt-10 md:px-8 md:pt-16 lg:pb-32">
                    <h1 className="reveal text-[clamp(2.5rem,0.9rem+6.2vw,6rem)] font-bold leading-[0.95] tracking-[-0.035em]" style={delay(0)}>
                        <span className="md:block">Escreva o trabalho. </span><span className="md:block">A ABNT fica com a gente.</span>
                    </h1>
                    <div className="mt-12 grid gap-14 lg:grid-cols-12 lg:gap-8">
                    <div className="lg:col-span-6 lg:pt-6">
                        <p className="reveal max-w-[34rem] font-serif text-[clamp(1.125rem,1rem+0.5vw,1.375rem)] leading-[1.5] text-ink" style={delay(100)}>
                            TCC, artigo, relatório, projeto de pesquisa ou resenha: você cuida do conteúdo e o editor monta capa, sumário, referências e o PDF em A4.
                        </p>
                        <div className="reveal mt-9 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6" style={delay(160)}>
                            <Link to="/dashboard" className={`${primary} active:scale-[0.97]`}>
                                Começar a escrever <ArrowRight size={18} aria-hidden="true" />
                            </Link>
                            <Link to={`/editor/${EXAMPLE_ID}`} className="text-center text-base font-semibold text-accent underline decoration-accent/30 underline-offset-[0.3em] transition-colors hover:decoration-accent">
                                Ver um TCC de exemplo
                            </Link>
                            <Link to={`/editor/${EXAMPLE_ARTICLE_ID}`} className="text-center text-base font-semibold text-accent underline decoration-accent/30 underline-offset-[0.3em] transition-colors hover:decoration-accent">
                                ou um artigo
                            </Link>
                        </div>
                        <p className="reveal mt-8 text-base text-ink-2" style={delay(220)}>
                            Grátis e sem cadastro. Feito por um estudante do IFPA Belém.
                        </p>
                        <div className="reveal mt-14 max-w-[34rem] rounded-[var(--radius-panel)] bg-surface p-5" style={delay(260)}>
                            <p className="font-semibold">Experimente aqui</p>
                            <p className="mt-1 text-base text-ink-2">Digite o título e o seu nome e veja a capa se montar nas normas.</p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-ink">Título do trabalho</span>
                    <input value={titulo} onChange={e => setTitulo(e.target.value)} maxLength={140} autoComplete="off" placeholder="Ex.: Energia solar no Pará" className="h-11 w-full rounded-[var(--radius-control)] border border-line bg-surface px-3 text-base text-ink outline-none transition-[border-color,box-shadow] duration-150 focus:border-accent focus:ring-2 focus:ring-accent/20" />
                </label>
                <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-ink">Seu nome</span>
                    <input value={autor} onChange={e => setAutor(e.target.value)} maxLength={80} autoComplete="name" placeholder="Ex.: Ana Beatriz Souza" className="h-11 w-full rounded-[var(--radius-control)] border border-line bg-surface px-3 text-base text-ink outline-none transition-[border-color,box-shadow] duration-150 focus:border-accent focus:ring-2 focus:ring-accent/20" />
                </label>
            </div>
                        </div>
                    </div>
                    <div className="reveal lg:col-span-5 lg:col-start-8" style={delay(140)}>
                        <SheetStack titulo={titulo} autor={autor} />
                    </div>
                    </div>
                </section>

                {/* Documentos e normas */}
                <section id="documentos" data-reveal className="scroll-mt-16 bg-surface">
                    <div className="mx-auto max-w-6xl px-4 py-24 md:px-8 md:py-36">
                        <div className="rv grid gap-5 md:grid-cols-12 md:items-end">
                            <h2 className="text-[clamp(2.25rem,1.5rem+3vw,4rem)] font-bold leading-[1] tracking-[-0.03em] md:col-span-7">Do projeto de pesquisa à tese.</h2>
                            <p className="max-w-md text-lg leading-relaxed text-ink md:col-span-5">
                                Cada tipo de documento segue a norma que o rege: a estrutura, os elementos obrigatórios e a ordem das folhas mudam conforme o que você escolhe.
                            </p>
                        </div>
                        <ul className="rv mt-14 grid gap-x-10 sm:grid-cols-2">
                            {Object.entries(DOCUMENT_TYPES).map(([key, t]) => (
                                <li key={key}>
                                    <Link to="/dashboard" className="group flex items-start gap-4 rounded-[var(--radius-control)] py-5 transition-colors">
                                        <span className="mt-1 block aspect-[210/297] w-5 shrink-0 rounded-[1px] bg-paper ring-1 ring-line transition-colors group-hover:bg-accent-soft group-hover:ring-accent" aria-hidden="true" />
                                        <span className="min-w-0 flex-1">
                                            <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                                                <span className="text-lg font-semibold tracking-[-0.01em] transition-colors group-hover:text-accent">{t.label}</span>
                                                <span className="tabular text-sm text-ink-2">{t.norma}</span>
                                            </span>
                                            <span className="mt-1 block text-base leading-relaxed text-ink-2">{t.description}</span>
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* Como funciona: cada recurso acende a parte da folha que ele resolve */}
                <section id="como-funciona" data-reveal className="scroll-mt-16 mx-auto max-w-6xl px-4 py-24 md:px-8 md:py-36">
                    <h2 className="rv max-w-3xl text-[clamp(2.25rem,1.5rem+3vw,4rem)] font-bold leading-[1] tracking-[-0.03em]">O trabalho mecânico sai da sua frente.</h2>
                    <p className="rv mt-5 max-w-xl text-lg leading-relaxed text-ink">Nada de brigar com margens, quebras de página e numeração no Word às duas da manhã.</p>

                    <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-8">
                        <ul className="rv space-y-1 lg:col-span-6" aria-label="Recursos do editor">
                            {FEATURES.map((f) => (
                                <li key={f.id}>
                                    <button type="button" aria-pressed={feature === f.id} onClick={() => setFeature(f.id)} onMouseEnter={() => setFeature(f.id)} onFocus={() => setFeature(f.id)}
                                        className={`w-full rounded-[var(--radius-panel)] px-5 py-5 text-left transition-colors duration-200 ${feature === f.id ? 'bg-surface' : 'hover:bg-surface/60'}`}>
                                        <span className={`block text-xl font-bold tracking-[-0.015em] transition-colors duration-200 ${feature === f.id ? 'text-accent' : 'text-ink'}`}>{f.title}</span>
                                        <span className="mt-2 block text-base leading-relaxed text-ink">{f.desc}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className="rv lg:sticky lg:top-24 lg:col-span-5 lg:col-start-8 lg:self-start">
                            <AnatomySheet active={feature} />
                        </div>
                    </div>
                </section>

                {/* Quem fez + apoio */}
                <section data-reveal aria-labelledby="quem-fez" className="px-2 sm:px-5">
                    <div className="mx-auto max-w-[1240px] rounded-[var(--radius-panel)] bg-green-900 px-6 py-16 text-green-50 md:px-14 md:py-24">
                        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
                            <div className="rv lg:col-span-6">
                                <h2 id="quem-fez" className="sr-only">Quem fez o ABNTFácil</h2>
                                <blockquote className="text-[clamp(1.5rem,1.2rem+0.9vw,2.25rem)] font-bold leading-[1.2] tracking-[-0.02em] text-white">
                                    “Sei o que é passar a madrugada brigando com as margens do Word.”
                                </blockquote>
                                <p className="mt-6 max-w-lg font-serif text-lg leading-relaxed text-green-50">
                                    Sou o Luiz Felipe, estudante de Engenharia de Controle e Automação no IFPA, em Belém. Criei o ABNTFácil para que nenhum colega perca tempo com formatação quando deveria estar pensando na pesquisa.
                                </p>
                            </div>
                            <div className="rv flex flex-col gap-10 lg:col-span-5 lg:col-start-8 lg:pt-2">
                                <div>
                                    <h3 className="text-xl font-bold text-white">Ajude a manter o site no ar</h3>
                                    <p className="mt-2 text-base leading-relaxed text-green-50">
                                        Servidores e banco de dados têm custo. Se a ferramenta te poupou horas, um PIX de qualquer valor ajuda a mantê-la gratuita.
                                    </p>
                                    <p className="mb-2 mt-6 text-sm font-medium text-green-100" id="pix-label">Chave PIX</p>
                                    <div className="flex items-center gap-2 rounded-[var(--radius-control)] bg-green-950/60 p-1.5 pl-3">
                                        <span aria-labelledby="pix-label" className="min-w-0 flex-1 truncate text-base text-white">{PIX_KEY}</span>
                                        <button type="button" onClick={copyPix} aria-label="Copiar chave PIX" className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[var(--radius-control)] bg-white px-3 text-sm font-semibold text-green-900 transition-[background-color,transform] duration-150 hover:bg-green-100">
                                            {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                                            {copied ? 'Copiada' : 'Copiar'}
                                        </button>
                                    </div>
                                </div>
                                <p className="flex items-start gap-3 text-base leading-relaxed text-green-50">
                                    <AlertTriangle size={20} className="mt-1 shrink-0 text-[#e0b562]" aria-hidden="true" />
                                    <span><strong className="font-semibold text-white">Projeto independente, em evolução.</strong> Não é um projeto oficial do IFPA e é mantido por um único estudante. Guarde cópias do seu trabalho e confira o manual da sua instituição.</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Perguntas: todas visíveis, sem acordeão */}
                <section id="perguntas" data-reveal className="scroll-mt-16 mx-auto max-w-6xl px-4 py-24 md:px-8 md:py-36">
                    <h2 className="rv text-[clamp(2.25rem,1.5rem+3vw,4rem)] font-bold leading-[1] tracking-[-0.03em]">Perguntas frequentes</h2>
                    <dl className="rv mt-14 grid gap-x-14 gap-y-10 md:grid-cols-2">
                        {FAQ.map(item => (
                            <div key={item.q}>
                                <dt className="text-lg font-semibold tracking-[-0.01em]">{item.q}</dt>
                                <dd className="mt-2 text-base leading-relaxed text-ink">{item.a}</dd>
                            </div>
                        ))}
                    </dl>
                </section>

                {/* Chamada final: a faixa inteira é o link */}
                <section aria-label="Começar">
                    <Link to="/dashboard" className="group relative block min-h-[46svh] overflow-hidden bg-accent-fill px-4 pt-6 text-white transition-colors duration-0 hover:bg-ink focus-visible:bg-ink md:min-h-[60svh] md:px-8">
                        <span className="relative z-10 mx-auto flex max-w-6xl items-start justify-between gap-6">
                            <span className="max-w-xs text-lg leading-snug md:text-xl">Abra o editor e comece agora. Sem cadastro e sem custo.</span>
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true" className="size-8 shrink-0 transition-transform duration-200 group-hover:-translate-y-1 group-hover:translate-x-1 md:size-12"><path d="M12 36 36 12M16 12h20v20" stroke="currentColor" strokeWidth="3.5" strokeLinecap="square" /></svg>
                        </span>
                        <span className="absolute inset-x-0 bottom-[0.06em] block text-center text-[clamp(4.5rem,24vw,22rem)] font-bold leading-[0.8] tracking-[-0.05em]">Escrever</span>
                    </Link>
                </section>
            </main>

            <footer className="bg-paper">
                <p className="select-none overflow-hidden whitespace-nowrap px-2 pt-10 text-center text-[clamp(3rem,15.5vw,14rem)] font-bold leading-[0.85] tracking-[-0.05em] text-ink" aria-hidden="true">ABNTFácil</p>
                <div className="mx-auto max-w-6xl space-y-5 px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] pt-10 md:px-8">
                    <div className="flex flex-col gap-3 text-base text-ink-2 sm:flex-row sm:items-center sm:justify-between">
                        <p suppressHydrationWarning>© {new Date().getFullYear()} ABNTFácil · projeto independente</p>
                        <nav aria-label="Informações legais" className="flex flex-wrap gap-x-5 gap-y-2">
                            <Link to="/privacidade" className="font-semibold text-ink underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent">Privacidade</Link>
                            <Link to="/termos" className="font-semibold text-ink underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent">Termos de uso</Link>
                            <button type="button" onClick={() => setIsFeedbackModalOpen(true)} className="font-semibold text-ink underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent">
                                Relatar um problema
                            </button>
                        </nav>
                    </div>
                    <p className="max-w-2xl text-sm leading-relaxed text-ink-2">
                        O ABNTFácil não tem vínculo com a Associação Brasileira de Normas Técnicas (ABNT) nem com o IFPA. A ferramenta ajuda a formatar o trabalho, mas não garante aprovação nem substitui a revisão do texto e do manual da sua instituição.
                    </p>
                </div>
            </footer>

            {isFeedbackModalOpen && (
                <Suspense fallback={null}>
                    <FeedbackModal isOpen onClose={() => setIsFeedbackModalOpen(false)} />
                </Suspense>
            )}
        </div>
    );
};

export default LandingPage;
