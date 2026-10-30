import React, { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Copy, Check, MessageSquare, AlertTriangle, Coffee } from 'lucide-react';
import toast from 'react-hot-toast';
import { DOCUMENT_TYPES } from '../utils/documentTypes';
import { EXAMPLE_ID } from '../utils/constants';

const FeedbackModal = lazy(() => import('../components/common/FeedbackModal').then(m => ({ default: m.FeedbackModal })));

const PIX_KEY = 'luizfelipe.ifpa.2022@gmail.com';

const FEATURES = [
    { title: 'Paginação real em A4', desc: 'O texto é distribuído em folhas de verdade: margens de 3 cm e 2 cm, parágrafos que continuam na folha seguinte e número da página no canto superior direito.' },
    { title: 'Capa, sumário e listas automáticos', desc: 'Folha de rosto, folha de aprovação, sumário, listas de ilustrações e de tabelas são montados a partir do que você escreve, com os números de página certos.' },
    { title: 'Referências na NBR 6023:2018', desc: 'Preencha autor, título e ano: o gerador monta a referência com o destaque correto e a lista sai em ordem alfabética.' },
    { title: 'Assistente que confere as normas', desc: 'Avisa quando o resumo está fora do tamanho, quando um autor citado não está nas referências e quando a citação ainda está no formato antigo, como (SILVA, 2023).' },
    { title: 'Seus dados ficam com você', desc: 'Sem login, tudo fica salvo só no seu navegador. Com login Google, os projetos sincronizam na nuvem.' },
];

const FAQ = [
    { q: 'Preciso pagar para usar?', a: 'Não. Todas as ferramentas de formatação e exportação são gratuitas. O projeto se mantém com doações voluntárias.' },
    { q: 'O PDF sai mesmo nas normas?', a: 'Sim: A4, margens de 3 cm (superior e esquerda) e 2 cm (inferior e direita), Arial ou Times 12, espaçamento 1,5, recuo de 1,25 cm e paginação conforme a NBR 14724.' },
    { q: 'Meus dados estão seguros?', a: 'Sem login, o texto nunca sai do seu computador. Com login, fica na sua conta, acessível só por você.' },
    { q: 'É um projeto oficial do IFPA?', a: 'Não. É um projeto independente, criado por um estudante do IFPA Campus Belém para ajudar colegas e a comunidade acadêmica.' },
    { q: 'Como não perder meu trabalho?', a: 'Entre com sua conta Google para sincronizar na nuvem ou use "Exportar backup" no painel com frequência.' },
    { q: 'Minha instituição tem regras próprias.', a: 'O manual da sua instituição prevalece sobre a ABNT. Os textos da folha de rosto, a fonte e as seções podem ser ajustados no editor.' },
];

// Página A4 em miniatura com as margens da NBR 14724 anotadas
const PagePreview = () => (
    <div className="relative mx-auto w-full max-w-[420px]" aria-hidden="true">
        <div className="absolute inset-0 translate-x-4 translate-y-4 rotate-[2deg] rounded-[3px] bg-white/70 shadow-[0_20px_50px_-20px_rgba(31,91,64,0.25)] ring-1 ring-slate-200" />
        <div className="relative aspect-[210/297] w-full rounded-[3px] bg-white shadow-[0_30px_80px_-30px_rgba(28,27,25,0.35)] ring-1 ring-slate-200">
            {/* margens: 30mm/210mm = 14.3%, 20mm/210mm = 9.5%; 30mm/297mm = 10.1%, 20mm/297mm = 6.7% */}
            <div className="absolute left-[14.3%] right-[9.5%] top-[10.1%] bottom-[6.7%] rounded-[2px] border border-dashed border-green-500/50" />
            <span className="absolute left-[14.3%] top-[3.5%] -translate-x-1/2 font-mono text-[10px] text-green-700">3 cm</span>
            <span className="absolute left-[1.5%] top-[45%] -rotate-90 font-mono text-[10px] text-green-700">3 cm</span>
            <span className="absolute right-[1%] top-[28%] rotate-90 font-mono text-[10px] text-green-700">2 cm</span>
            <span className="absolute bottom-[1.6%] left-1/2 -translate-x-1/2 font-mono text-[10px] text-green-700">2 cm</span>
            <span className="absolute right-[9.5%] top-[6.6%] font-mono text-[9px] text-slate-500">11</span>

            <div className="absolute left-[14.3%] right-[9.5%] top-[10.1%] flex flex-col gap-[6px] pt-2">
                <div className="mb-2 h-[7px] w-[38%] rounded-sm bg-slate-800" />
                {[0, 1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`h-[5px] rounded-sm bg-slate-300 ${i === 0 ? 'ml-[9%]' : ''} ${i === 5 ? 'w-[64%]' : ''}`} />
                ))}
                <div className="my-2 ml-[30%] flex flex-col gap-[4px]">
                    {[0, 1, 2].map(i => <div key={i} className={`h-[4px] rounded-sm bg-slate-400/70 ${i === 2 ? 'w-[55%]' : ''}`} />)}
                </div>
                {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-[5px] rounded-sm bg-slate-300 ${i === 0 ? 'ml-[9%]' : ''} ${i === 4 ? 'w-[48%]' : ''}`} />
                ))}
                <div className="mx-auto mt-3 flex w-[70%] flex-col items-center gap-[4px]">
                    <div className="h-[4px] w-[55%] rounded-sm bg-slate-500" />
                    <div className="grid w-full grid-cols-3 border-y border-slate-700 py-[5px]">
                        {[0, 1, 2].map(i => <div key={i} className="mx-1 h-[4px] rounded-sm bg-slate-300" />)}
                    </div>
                    <div className="h-[3px] w-[35%] self-start rounded-sm bg-slate-400/70" />
                </div>
                <div className="mt-3 h-[6px] w-[30%] rounded-sm bg-slate-700" />
                {[0, 1, 2, 3, 4, 5, 6].map(i => (
                    <div key={`b${i}`} className={`h-[5px] rounded-sm bg-slate-300 ${i === 0 ? 'ml-[9%]' : ''} ${i === 6 ? 'w-[72%]' : ''}`} />
                ))}
            </div>

            <div className="absolute -left-3 top-[30%] hidden rounded-md bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg sm:block">
                Recuo 1,25 cm
            </div>
            <div className="absolute -right-4 top-[45%] hidden rounded-md bg-green-700 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg sm:block">
                Citação longa: 4 cm, fonte 10
            </div>
        </div>
    </div>
);

const LandingPage = () => {
    const navigate = useNavigate();
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);

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

    return (
        <div className="relative min-h-dvh bg-[#f7f7f4] text-slate-900 font-sans">
            <div className="paper-grain pointer-events-none absolute inset-0 z-0" aria-hidden="true" />

            <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:shadow">Pular para o conteúdo</a>

            <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-[#f7f7f4]/85 backdrop-blur-md">
                <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 md:px-8">
                    <a href="/" className="flex items-center gap-2.5" aria-label="ABNTFácil, início">
                        <img src="/favicon.svg" alt="" className="h-8 w-8" />
                        <span className="font-serif text-[1.45rem] leading-none tracking-tight">ABNT<span className="italic text-green-700">Fácil</span></span>
                    </a>
                    <div className="flex items-center gap-1 sm:gap-3">
                        <a href="#documentos" className="hidden rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 md:block">Documentos</a>
                        <a href="#perguntas" className="hidden rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 md:block">Perguntas</a>
                        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-green-700">
                            Abrir o editor <ArrowRight size={15} aria-hidden="true" />
                        </button>
                    </div>
                </nav>
            </header>

            <main id="conteudo" className="relative z-10">
                {/* Hero */}
                <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-14 md:px-8 md:pt-20 lg:grid-cols-[1.3fr_0.7fr] lg:gap-12 lg:pb-28">
                    <div>
                        <p className="reveal mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600" style={delay(0)}>
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />
                            Gratuito · feito por um estudante do IFPA Belém
                        </p>
                        <h1 className="font-serif text-[3.1rem] leading-[0.98] tracking-[-0.02em] text-slate-950 sm:text-7xl lg:text-[4.6rem] xl:text-[5rem]">
                            Escreva o trabalho.<br />
                            <span className="italic text-green-700">A ABNT fica com a gente.</span>
                        </h1>
                        <p className="reveal mt-7 max-w-[34rem] text-lg leading-relaxed text-slate-600" style={delay(120)}>
                            TCC, artigo, relatório, projeto de pesquisa ou resenha: você foca no conteúdo e o editor monta capa, sumário, referências e o PDF em A4 nas normas.
                        </p>
                        <div className="reveal mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6" style={delay(180)}>
                            <button onClick={() => navigate('/dashboard')} className="group flex items-center justify-center gap-2 rounded-xl bg-green-700 px-7 py-4 text-base font-semibold text-white shadow-[0_10px_30px_-10px_rgba(31,91,64,0.6)] transition-[background-color,transform] duration-200 hover:bg-green-800">
                                Começar a escrever
                                <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                            </button>
                            <button onClick={() => navigate(`/editor/${EXAMPLE_ID}`)} className="text-center text-base font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-green-700 hover:decoration-green-500">
                                Ver um TCC de exemplo
                            </button>
                        </div>
                        <p className="reveal mt-10 font-mono text-xs tracking-wide text-slate-500" style={delay(240)}>
                            NBR 14724 · 6022 · 6023 · 6024 · 6027 · 6028 · 10520 · 10719 · 15287
                        </p>
                    </div>
                    <div className="reveal px-4 sm:px-10 lg:px-0" style={delay(200)}>
                        <PagePreview />
                    </div>
                </section>

                {/* Tipos de documento */}
                <section id="documentos" className="border-t border-slate-200 bg-white/60">
                    <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
                        <div className="mb-12 grid gap-4 md:grid-cols-[1fr_1.2fr] md:items-end">
                            <h2 className="font-serif text-4xl leading-[1.05] tracking-[-0.01em] md:text-6xl">Do projeto de pesquisa à tese.</h2>
                            <p className="max-w-lg text-base leading-relaxed text-slate-600 md:justify-self-end">
                                Cada tipo de documento segue a norma que o rege: a estrutura, os elementos obrigatórios e a ordem das folhas mudam conforme o que você escolhe.
                            </p>
                        </div>
                        <ul className="grid border-t border-slate-200 sm:grid-cols-2">
                            {Object.entries(DOCUMENT_TYPES).map(([key, t]) => (
                                <li key={key} className="border-b border-slate-200 sm:odd:border-r sm:odd:pr-8 sm:even:pl-8">
                                    <button onClick={() => navigate('/dashboard')} className="group flex w-full items-start gap-4 py-5 text-left">
                                        <span className="mt-0.5 text-green-700 [&_svg]:h-5 [&_svg]:w-5" aria-hidden="true">{t.icon}</span>
                                        <span className="flex-1">
                                            <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                                                <span className="text-[1.05rem] font-semibold text-slate-900 transition-colors group-hover:text-green-700">{t.label}</span>
                                                <span className="font-mono text-xs text-slate-500">{t.norma}</span>
                                            </span>
                                            <span className="mt-1 block text-sm leading-relaxed text-slate-600">{t.description}</span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* O que o editor faz */}
                <section className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
                    <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
                        <div className="lg:sticky lg:top-28 lg:self-start">
                            <h2 className="font-serif text-4xl leading-[1.05] tracking-[-0.01em] md:text-6xl">
                                O trabalho mecânico <span className="italic text-green-700">sai da sua frente.</span>
                            </h2>
                            <p className="mt-5 max-w-sm text-base leading-relaxed text-slate-600">
                                Nada de brigar com margens, quebras de página e numeração no Word às duas da manhã.
                            </p>
                        </div>
                        <ol className="divide-y divide-slate-200 border-y border-slate-200">
                            {FEATURES.map((f, i) => (
                                <li key={f.title} className="grid grid-cols-[2.5rem_1fr] gap-4 py-7">
                                    <span className="tabular font-mono text-sm text-green-700">{String(i + 1).padStart(2, '0')}</span>
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
                                        <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-slate-600">{f.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                {/* Aviso + autor + apoio */}
                <section className="mx-auto max-w-6xl px-5 pb-20 md:px-8 md:pb-28">
                    <div className="mb-8 flex items-start gap-4 rounded-xl border border-amber-300/70 bg-amber-50 px-5 py-4 text-amber-900">
                        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
                        <p className="text-sm leading-relaxed">
                            <strong className="font-semibold">Projeto independente, em evolução.</strong> Não é um projeto oficial do IFPA e é mantido por um único estudante. Guarde backups do seu trabalho e confira o manual da sua instituição.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-[1.3fr_1fr] [&>*]:min-w-0">
                        <div className="rounded-2xl bg-slate-900 p-8 text-slate-100 md:p-12">
                            <p className="font-serif text-3xl leading-[1.15] md:text-[2.6rem]">
                                “Sei o que é passar a madrugada brigando com as margens do Word.”
                            </p>
                            <p className="mt-6 max-w-lg text-sm leading-relaxed text-slate-400">
                                Sou o Luiz Felipe, estudante de Engenharia de Controle e Automação no IFPA Belém. Criei o ABNTFácil para que nenhum colega perca tempo com formatação quando deveria estar pensando na pesquisa.
                            </p>
                        </div>
                        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-8 md:p-10">
                            <div>
                                <Coffee size={22} className="mb-5 text-amber-600" aria-hidden="true" />
                                <h3 className="text-xl font-semibold">Ajude a manter o site no ar</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                    Servidores e banco de dados têm custo. Se a ferramenta te poupou horas, um PIX de qualquer valor ajuda a mantê-la gratuita.
                                </p>
                            </div>
                            <div className="mt-6">
                                <p className="mb-2 text-xs font-medium text-slate-500">Chave PIX</p>
                                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1.5 pl-3">
                                    <code className="min-w-0 flex-1 truncate font-mono text-sm text-slate-800">{PIX_KEY}</code>
                                    <button onClick={copyPix} aria-label="Copiar chave PIX" className="flex shrink-0 items-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-700">
                                        {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                                        {copied ? 'Copiada' : 'Copiar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Perguntas: todas visíveis, sem acordeão */}
                <section id="perguntas" className="border-t border-slate-200 bg-white/60">
                    <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
                        <h2 className="mb-12 font-serif text-4xl leading-[1.05] tracking-[-0.01em] md:text-6xl">Perguntas frequentes</h2>
                        <dl className="grid gap-x-14 gap-y-10 md:grid-cols-2">
                            {FAQ.map(item => (
                                <div key={item.q}>
                                    <dt className="text-base font-semibold text-slate-900">{item.q}</dt>
                                    <dd className="mt-2 text-[0.95rem] leading-relaxed text-slate-600">{item.a}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </section>

                {/* Chamada final */}
                <section className="mx-auto max-w-6xl px-5 py-24 text-center md:px-8 md:py-32">
                    <h2 className="mx-auto max-w-3xl font-serif text-5xl leading-[1] tracking-[-0.02em] md:text-7xl">
                        Seu próximo trabalho começa <span className="italic text-green-700">pela página certa.</span>
                    </h2>
                    <button onClick={() => navigate('/dashboard')} className="mx-auto mt-10 flex items-center gap-2 rounded-xl bg-green-700 px-8 py-4 text-base font-semibold text-white shadow-[0_10px_30px_-10px_rgba(31,91,64,0.6)] transition-[background-color,transform] duration-200 hover:bg-green-800">
                        Abrir o editor gratuito <ArrowRight size={18} aria-hidden="true" />
                    </button>
                </section>
            </main>

            <footer className="relative z-10 border-t border-slate-200">
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-slate-500 sm:flex-row md:px-8">
                    <p suppressHydrationWarning>© {new Date().getFullYear()} ABNTFácil · projeto independente</p>
                    <button onClick={() => setIsFeedbackModalOpen(true)} className="font-medium text-slate-600 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-green-700">
                        Reportar um problema ou sugerir melhoria
                    </button>
                </div>
            </footer>

            <button
                onClick={() => setIsFeedbackModalOpen(true)}
                className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-[0_10px_30px_-8px_rgba(28,27,25,0.5)] transition-[background-color,transform] duration-200 hover:bg-green-700"
                aria-label="Reportar um problema ou sugerir melhoria"
                title="Bugs ou sugestões"
            >
                <MessageSquare size={20} aria-hidden="true" />
            </button>

            {isFeedbackModalOpen && (
                <Suspense fallback={null}>
                    <FeedbackModal isOpen onClose={() => setIsFeedbackModalOpen(false)} />
                </Suspense>
            )}
        </div>
    );
};

export default LandingPage;
