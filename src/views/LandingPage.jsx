import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Copy, Check, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { DOCUMENT_TYPES } from '../utils/documentTypes';
import { EXAMPLE_ID, EXAMPLE_ARTICLE_ID } from '../utils/exampleIds';
import usePageMeta from '../hooks/usePageMeta';

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
        <div className="mx-auto w-full">
            <div className="relative pt-[5.5rem] [container-type:inline-size]">
                {/* Folhas de trás: só a aba aparece; tocar numa delas a traz para a frente */}
                {behind.map((s, i) => (
                    <div key={s.key} className="absolute inset-x-0 top-0 aspect-[210/297] rounded-[var(--radius-sheet)] bg-white transition-transform duration-300 ease-[var(--ease-out-strong)]"
                        style={{ transform: `translateY(${i * 1.5}rem) scale(${0.94 + i * 0.02})`, zIndex: i, background: ['#e4efe8', '#eef6f1', '#ffffff'][i] }} aria-hidden="true" />
                ))}
                <div role="tablist" aria-label="Tipo de trabalho" className="absolute inset-x-0 top-0 z-10 flex h-[5.5rem] items-end gap-1.5 px-3">
                    {STACK.map(s => (
                        <button key={s.key} type="button" role="tab" aria-selected={active === s.key} onClick={() => setActive(s.key)}
                            className={`label-mono h-10 flex-1 rounded-t-[6px] px-1 text-[12px] transition-[transform,background-color,color] duration-200 ease-[var(--ease-out-strong)] [clip-path:polygon(8%_0,92%_0,100%_100%,0_100%)] pointer-coarse:h-11 ${active === s.key ? 'translate-y-0 bg-white text-ink' : 'translate-y-2 bg-green-600 text-white hover:translate-y-0.5'}`}>
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

// Anéis de norma: as regras que o editor aplica giram em volta da folha (o lado escuro do hero)
const RINGS = [
    { r: 470, size: 17, dur: '140s', rev: false, op: 0.32, text: 'CAPA · FOLHA DE ROSTO · RESUMO · ABSTRACT · SUMÁRIO · INTRODUÇÃO · DESENVOLVIMENTO · CONCLUSÃO · REFERÊNCIAS · APÊNDICES · ANEXOS · ' },
    { r: 400, size: 18, dur: '110s', rev: true, op: 0.5, text: 'NBR 14724 · NBR 6023 · NBR 10520 · NBR 6024 · NBR 6027 · NBR 6028 · NBR 6022 · NBR 15287 · NBR 10719 · ' },
    { r: 330, size: 18, dur: '90s', rev: false, op: 0.38, text: 'FONTE 12 · ESPAÇAMENTO 1,5 · RECUO 1,25 CM · CITAÇÃO LONGA COM RECUO DE 4 CM · FONTE 10 · ' },
    { r: 260, size: 18, dur: '70s', rev: true, op: 0.6, text: 'MARGEM SUPERIOR 3 CM · ESQUERDA 3 CM · INFERIOR 2 CM · DIREITA 2 CM · ' },
];

const NormRings = () => (
    <div className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[min(1120px,170%)] -translate-x-1/2 -translate-y-1/2 select-none" aria-hidden="true">
        {RINGS.map((ring, i) => {
            const d = `M500,500 m-${ring.r},0 a${ring.r},${ring.r} 0 1,1 ${ring.r * 2},0 a${ring.r},${ring.r} 0 1,1 -${ring.r * 2},0`;
            return (
                <svg key={i} viewBox="0 0 1000 1000" className={`absolute inset-0 size-full ${ring.rev ? 'ring-spin-rev' : 'ring-spin'}`} style={{ '--ring-dur': ring.dur }}>
                    <defs><path id={`anel-${i}`} d={d} /></defs>
                    <text fill="#e4efe8" fillOpacity={ring.op} fontFamily="IBM Plex Mono, ui-monospace, monospace" fontSize={ring.size} fontWeight="500" letterSpacing="2">
                        <textPath href={`#anel-${i}`} textLength={Math.round(2 * Math.PI * ring.r * 0.985)} lengthAdjust="spacing">{ring.text}</textPath>
                    </text>
                </svg>
            );
        })}
    </div>
);

// Faixa corrida sob a navegação: o texto vai duas vezes para o laço não ter emenda
const TICKER = 'GRÁTIS · SEM CADASTRO · NBR 14724 · REFERÊNCIAS NA NBR 6023 · CITAÇÕES NA NBR 10520 · PDF E WORD · SALVO NO SEU NAVEGADOR · ';
const Ticker = () => (
    <div className="overflow-hidden whitespace-nowrap bg-paper text-ink" aria-hidden="true">
        <div className="marquee flex w-max">
            {[0, 1].map(k => <span key={k} className="label-mono px-0 py-1 text-[12px]">{TICKER.repeat(3)}</span>)}
        </div>
    </div>
);

const LandingPage = () => {
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [feature, setFeature] = useState('margens');
    const [titulo, setTitulo] = useState('');
    const [autor, setAutor] = useState('');
    useReveal();
    usePageMeta('/');

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
    // Botões em bloco, rótulo mono em caixa alta (como teclas)
    const block = 'label-mono inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] px-5 transition-[background-color,color,transform] duration-150 active:scale-[0.97] pointer-coarse:h-12';
    const primary = `${block} bg-accent-fill text-white hover:bg-accent-fill-hover`;
    const quiet = `${block} bg-surface-2 text-ink hover:bg-line`;
    const activeFeature = FEATURES.find(f => f.id === feature);
    const sectionTitle = 'text-[clamp(2.25rem,1.5rem+3vw,4rem)] font-bold leading-[1] tracking-[-0.03em]';

    return (
        <div className="theme-light relative min-h-dvh bg-paper font-sans text-ink">
            <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-[var(--radius-control)] focus:bg-surface focus:px-4 focus:py-2 focus:shadow-[var(--shadow-float)]">Pular para o conteúdo</a>

            {/* Navegação flutuante: uma barra escura no topo, com a faixa corrida embaixo */}
            <header className="safe-top pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3">
                <div className="pointer-events-auto mx-auto max-w-[720px] overflow-hidden rounded-[8px] bg-ink p-1 text-white shadow-[var(--shadow-float)] ring-1 ring-white/10">
                    <nav aria-label="Principal" className="flex h-11 items-center justify-between gap-2 pl-2">
                        <a href="/" className="flex items-center gap-2 rounded-[var(--radius-control)] text-base font-bold tracking-[-0.02em]" aria-label="ABNTFácil, início">
                            <img src="/favicon.svg" alt="" width="24" height="24" className="size-6" />
                            <span className="hidden sm:inline">ABNTFácil</span>
                        </a>
                        <div className="flex items-center gap-0.5">
                            <a href="#documentos" className="label-mono hidden rounded-[var(--radius-control)] px-2.5 py-2 text-[12px] text-white/70 transition-colors hover:bg-white/10 hover:text-white md:block">Documentos</a>
                            <a href="#como-funciona" className="label-mono hidden rounded-[var(--radius-control)] px-2.5 py-2 text-[12px] text-white/70 transition-colors hover:bg-white/10 hover:text-white md:block">Como funciona</a>
                            <a href="#perguntas" className="label-mono hidden rounded-[var(--radius-control)] px-2.5 py-2 text-[12px] text-white/70 transition-colors hover:bg-white/10 hover:text-white md:block">Perguntas</a>
                            <Link to="/dashboard" className="label-mono ml-1 inline-flex h-10 items-center gap-2 rounded-[var(--radius-control)] bg-accent-fill px-3.5 text-[12px] text-white transition-[background-color,transform] duration-150 hover:bg-accent-fill-hover active:scale-[0.97]">
                                Abrir o editor <ArrowRight size={15} aria-hidden="true" />
                            </Link>
                        </div>
                    </nav>
                    <div className="mt-1 overflow-hidden rounded-[4px]"><Ticker /></div>
                </div>
            </header>

            <main id="conteudo">
                {/* Hero dividido: o texto no papel, a folha ao vivo no verde com as normas girando em volta */}
                <section className="grid min-h-[100svh] lg:grid-cols-2">
                    <div className="flex flex-col px-4 pb-12 pt-32 md:px-10 lg:pb-10 lg:pl-[max(2.5rem,calc((100vw-80rem)/2))] lg:pr-12 lg:pt-36">
                        <div className="my-auto max-w-[36rem]">
                            <p className="label-mono reveal text-ink-2" style={delay(0)}>Formatador ABNT para trabalhos acadêmicos</p>
                            <h1 className="mt-5 text-[clamp(2.75rem,1.4rem+3.6vw,4.5rem)] font-bold leading-[0.95] tracking-[-0.035em]">
                                Escreva o trabalho. A ABNT fica com a gente.
                            </h1>
                            <p className="reveal mt-7 max-w-[32rem] font-serif text-[clamp(1.125rem,1rem+0.5vw,1.375rem)] leading-[1.5] text-ink" style={delay(120)}>
                                TCC, artigo, relatório, projeto de pesquisa ou resenha: você cuida do conteúdo e o editor monta capa, sumário, referências e o PDF em A4.
                            </p>
                            <div className="reveal mt-9 flex flex-wrap items-center gap-2" style={delay(180)}>
                                <Link to="/dashboard" className={primary}>
                                    Começar a escrever <ArrowRight size={17} aria-hidden="true" />
                                </Link>
                                <span className="inline-flex gap-1">
                                    <Link to={`/editor/${EXAMPLE_ID}`} className={quiet} aria-label="Ver TCC de exemplo">Ver TCC</Link>
                                    <Link to={`/editor/${EXAMPLE_ARTICLE_ID}`} className={quiet} aria-label="Ver artigo de exemplo">Ver artigo</Link>
                                </span>
                            </div>
                            <p className="reveal mt-7 text-base text-ink-2" style={delay(220)}>Grátis e sem cadastro. Feito por um estudante do IFPA Belém.</p>
                        </div>
                        <a href="#documentos" className="label-mono reveal mt-12 inline-flex w-fit items-center gap-3 text-[12px] text-ink-2 transition-colors hover:text-ink" style={delay(300)}>
                            <span className="grid size-7 place-items-center rounded-full ring-1 ring-line" aria-hidden="true"><span className="size-1.5 rounded-full bg-accent" /></span>
                            Role para ver como funciona
                        </a>
                    </div>

                    <div className="dot-grid relative isolate flex flex-col items-center justify-center overflow-hidden bg-green-900 px-4 pb-14 pt-16 lg:pt-32">
                        <NormRings />
                        <div className="reveal relative w-full max-w-[340px]" style={delay(140)}>
                            <SheetStack titulo={titulo} autor={autor} />
                        </div>
                        {/* A coisa viva: digite e a capa se monta */}
                        <div className="reveal relative mt-6 w-full max-w-[400px] rounded-[8px] bg-paper p-3 shadow-[var(--shadow-float)]" style={delay(220)}>
                            <p className="label-mono px-1 text-[12px] text-ink-2">Experimente: a capa se monta enquanto você digita</p>
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                <label className="block">
                                    <span className="sr-only">Título do trabalho</span>
                                    <input value={titulo} onChange={e => setTitulo(e.target.value)} maxLength={140} autoComplete="off" placeholder="Título do trabalho" className="h-11 w-full rounded-[var(--radius-control)] border border-line bg-surface px-3 text-base text-ink outline-none transition-[border-color,box-shadow] duration-150 focus:border-accent focus:ring-2 focus:ring-accent/20" />
                                </label>
                                <label className="block">
                                    <span className="sr-only">Seu nome</span>
                                    <input value={autor} onChange={e => setAutor(e.target.value)} maxLength={80} autoComplete="name" placeholder="Seu nome" className="h-11 w-full rounded-[var(--radius-control)] border border-line bg-surface px-3 text-base text-ink outline-none transition-[border-color,box-shadow] duration-150 focus:border-accent focus:ring-2 focus:ring-accent/20" />
                                </label>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Número grande: a margem que ninguém mais precisa medir */}
                <section data-reveal aria-labelledby="margem-titulo" className="dot-grid-ink border-y border-line">
                    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-20 md:grid-cols-12 md:items-end md:px-8 md:py-28">
                        <p id="margem-titulo" className="rv text-[clamp(6rem,3rem+14vw,15rem)] font-bold leading-[0.8] tracking-[-0.06em] md:col-span-7">
                            3<span className="text-accent">/</span>2<span className="ml-3 align-top text-[0.28em] tracking-[-0.02em]">cm</span>
                        </p>
                        <div className="rv md:col-span-5 md:pb-4">
                            <p className="label-mono flex flex-wrap items-center gap-2 text-ink-2">
                                Margens da folha A4 <span className="rounded-[3px] bg-accent-soft px-1.5 py-0.5 text-accent">NBR 14724:2011</span>
                            </p>
                            <p className="mt-4 max-w-sm text-lg leading-relaxed text-ink">
                                Três centímetros em cima e à esquerda, dois embaixo e à direita. O editor aplica em todas as folhas, e você não mede nenhuma.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Documentos e normas, como um índice numerado */}
                <section id="documentos" data-reveal className="scroll-mt-28">
                    <div className="mx-auto max-w-6xl px-4 py-24 md:px-8 md:py-32">
                        <div className="rv grid gap-5 md:grid-cols-12 md:items-end">
                            <div className="md:col-span-7">
                                <p className="label-mono text-ink-2">Índice · {Object.keys(DOCUMENT_TYPES).length} tipos de documento</p>
                                <h2 className={`mt-4 ${sectionTitle}`}>Do projeto de pesquisa à tese.</h2>
                            </div>
                            <p className="max-w-md text-lg leading-relaxed text-ink md:col-span-5">
                                Cada tipo de documento segue a norma que o rege: a estrutura, os elementos obrigatórios e a ordem das folhas mudam conforme o que você escolhe.
                            </p>
                        </div>
                        <ol className="rv mt-14 border-t border-ink">
                            {Object.entries(DOCUMENT_TYPES).map(([key, t], i) => (
                                <li key={key} className="border-b border-line">
                                    <Link to="/dashboard" className="group grid grid-cols-[2.5rem_1fr] items-baseline gap-x-4 gap-y-1 py-5 transition-colors hover:bg-surface md:grid-cols-[4rem_minmax(0,1fr)_minmax(0,1.3fr)_auto] md:px-3">
                                        <span className="label-mono tabular text-ink-3 transition-colors group-hover:text-accent">{String(i + 1).padStart(2, '0')}</span>
                                        <span className="text-lg font-semibold tracking-[-0.01em] transition-colors group-hover:text-accent">{t.label}</span>
                                        <span className="col-start-2 text-base leading-relaxed text-ink-2 md:col-start-auto">{t.description}</span>
                                        <span className="label-mono tabular col-start-2 whitespace-nowrap text-[12px] text-ink-2 md:col-start-auto">{t.norma}</span>
                                    </Link>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                {/* Como funciona: o editor como uma janela de trabalho; cada recurso acende a parte da folha que ele resolve */}
                <section id="como-funciona" data-reveal className="scroll-mt-28 bg-ink text-white">
                    <div className="mx-auto max-w-6xl px-4 py-24 md:px-8 md:py-32">
                        <p className="rv label-mono text-white/60">Como funciona</p>
                        <h2 className={`rv mt-4 max-w-3xl ${sectionTitle}`}>O trabalho mecânico sai da sua frente.</h2>
                        <p className="rv mt-5 max-w-xl text-lg leading-relaxed text-white/80">Nada de brigar com margens, quebras de página e numeração no Word às duas da manhã.</p>

                        <div className="rv mt-14 overflow-hidden rounded-[10px] bg-[#252420] ring-1 ring-white/10">
                            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-2.5">
                                <span className="flex gap-1">
                                    <span className="label-mono rounded-[3px] bg-white/10 px-2 py-1 text-[12px] text-white">trabalho.pdf</span>
                                    <span className="label-mono hidden px-2 py-1 text-[12px] text-white/50 sm:inline">referencias</span>
                                </span>
                                <span className="label-mono truncate text-[12px] text-white/50">Esta é a folha que sai no PDF</span>
                            </div>
                            <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
                                <ul className="flex flex-col gap-0.5 border-white/10 p-3 lg:border-r" aria-label="Recursos do editor">
                                    {FEATURES.map((f, i) => (
                                        <li key={f.id}>
                                            <button type="button" aria-pressed={feature === f.id} onClick={() => setFeature(f.id)} onMouseEnter={() => setFeature(f.id)} onFocus={() => setFeature(f.id)}
                                                className={`flex w-full items-start gap-3 rounded-[6px] px-3 py-3.5 text-left transition-colors duration-200 ${feature === f.id ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                                                <span className={`label-mono tabular mt-0.5 text-[12px] ${feature === f.id ? 'text-green-300' : 'text-white/40'}`}>{String(i + 1).padStart(2, '0')}</span>
                                                <span className="min-w-0">
                                                    <span className={`block text-lg font-bold tracking-[-0.015em] ${feature === f.id ? 'text-white' : 'text-white/75'}`}>{f.title}</span>
                                                    {feature === f.id && <span className="fade-in mt-1.5 block text-base leading-relaxed text-white/80">{f.desc}</span>}
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                <div className="dot-grid flex items-center justify-center p-6 md:p-10">
                                    <div className="w-full max-w-[340px]"><AnatomySheet active={feature} /></div>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-white/10 px-4 py-2">
                                <span className="label-mono text-[12px] text-white/50">A4 · 210 × 297 mm · fonte 12 · espaçamento 1,5</span>
                                <span className="label-mono text-[12px] text-green-300" aria-live="polite">{activeFeature?.title}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Quem fez + apoio: um cartão com picote no meio */}
                <section data-reveal aria-labelledby="quem-fez" className="px-2 py-20 sm:px-5 md:py-28">
                    <div className="relative mx-auto grid max-w-[1240px] overflow-hidden rounded-[12px] bg-green-900 text-green-50 lg:grid-cols-2">
                        <div className="rv px-6 py-14 md:px-14 md:py-20">
                            <h2 id="quem-fez" className="label-mono text-green-200">Quem fez</h2>
                            <blockquote className="mt-6 text-[clamp(1.5rem,1.2rem+0.9vw,2.25rem)] font-bold leading-[1.2] tracking-[-0.02em] text-white">
                                “Sei o que é passar a madrugada brigando com as margens do Word.”
                            </blockquote>
                            <p className="mt-6 max-w-lg font-serif text-lg leading-relaxed text-green-50">
                                Sou o Luiz Felipe, estudante de Engenharia de Controle e Automação no IFPA, em Belém. Criei o ABNTFácil para que nenhum colega perca tempo com formatação quando deveria estar pensando na pesquisa.
                            </p>
                        </div>
                        {/* Picote: linha tracejada com dois recortes de papel */}
                        <span className="pointer-events-none absolute left-1/2 top-0 hidden h-full -translate-x-1/2 border-l-2 border-dashed border-white/20 lg:block" aria-hidden="true">
                            <span className="absolute -left-[13px] -top-3 size-6 rounded-full bg-paper" />
                            <span className="absolute -bottom-3 -left-[13px] size-6 rounded-full bg-paper" />
                        </span>
                        <div className="rv flex flex-col gap-10 border-t-2 border-dashed border-white/20 px-6 py-14 md:px-14 md:py-20 lg:border-t-0">
                            <ol className="flex flex-col">
                                {['Todas as ferramentas são gratuitas', 'Sem cadastro: o trabalho fica no seu navegador', 'PDF e Word nas normas', 'Mantido com doações voluntárias'].map((item, i) => (
                                    <li key={item} className="label-mono flex gap-4 border-b border-white/15 py-3 text-[13px] text-white">
                                        <span className="tabular text-green-300">{String(i + 1).padStart(2, '0')}</span>{item}
                                    </li>
                                ))}
                            </ol>
                            <div>
                                <h3 className="text-xl font-bold text-white">Ajude a manter o site no ar</h3>
                                <p className="mt-2 text-base leading-relaxed text-green-50">
                                    Servidores e banco de dados têm custo. Se a ferramenta te poupou horas, um PIX de qualquer valor ajuda a mantê-la gratuita.
                                </p>
                                <p className="label-mono mb-2 mt-6 text-[12px] text-green-200" id="pix-label">Chave PIX</p>
                                <div className="flex items-center gap-2 rounded-[var(--radius-control)] bg-green-950/60 p-1.5 pl-3">
                                    <span aria-labelledby="pix-label" className="min-w-0 flex-1 truncate font-mono text-[15px] text-white">{PIX_KEY}</span>
                                    <button type="button" onClick={copyPix} aria-label="Copiar chave PIX" className="label-mono inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[var(--radius-control)] bg-white px-3 text-[12px] text-green-900 transition-[background-color,transform] duration-150 hover:bg-green-100">
                                        {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
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
                </section>

                {/* Perguntas: título fixo à esquerda, perguntas numeradas que abrem à direita */}
                <section id="perguntas" data-reveal className="scroll-mt-28 bg-ink text-white">
                    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 md:px-8 md:py-32 lg:grid-cols-12">
                        <div className="rv lg:col-span-4">
                            <div className="lg:sticky lg:top-32">
                                <h2 className={sectionTitle}>Antes de começar</h2>
                                <Link to="/dashboard" className={`${primary} mt-8`}>Abrir o editor <ArrowRight size={17} aria-hidden="true" /></Link>
                            </div>
                        </div>
                        <div className="rv border-t border-white/20 lg:col-span-8">
                            {FAQ.map((item, i) => (
                                <details key={item.q} className="faq-item group border-b border-white/20" open={i === 0}>
                                    <summary className="flex cursor-pointer items-start gap-4 py-5 transition-colors hover:text-green-200">
                                        <span className="label-mono tabular mt-1 shrink-0 text-[12px] text-white/45">P.{String(i + 1).padStart(3, '0')} /</span>
                                        <span className="flex-1 text-lg font-semibold tracking-[-0.01em]">{item.q}</span>
                                        <span className="faq-sign mt-0.5 grid size-7 shrink-0 place-items-center rounded-[3px] bg-white/10 text-lg leading-none" aria-hidden="true">+</span>
                                    </summary>
                                    <p className="faq-body pb-6 pl-[4.75rem] pr-10 text-base leading-relaxed text-white/80">{item.a}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Chamada final: a faixa inteira é o link */}
                <section aria-label="Começar">
                    <Link to="/dashboard" className="dot-grid group relative block min-h-[46svh] overflow-hidden bg-accent-fill px-4 pt-6 text-white transition-colors duration-0 hover:bg-green-900 focus-visible:bg-green-900 md:min-h-[60svh] md:px-8">
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
                        <p className="label-mono text-[12px]" suppressHydrationWarning>© {new Date().getFullYear()} ABNTFácil · projeto independente</p>
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
                    <FeedbackModal isOpen onClose={() => setIsFeedbackModalOpen(false)} />
            )}
        </div>
    );
};

export default LandingPage;
