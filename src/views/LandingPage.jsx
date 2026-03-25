import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    BookOpen, AlertTriangle, Coffee, 
    GraduationCap, ChevronRight,
    HelpCircle, ChevronDown, MessageSquare,
    Layers, Zap, Download, ShieldCheck, ArrowRight
} from 'lucide-react';
import { FeedbackModal } from '../components/common/FeedbackModal';

const LandingPage = () => {
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState(null);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

    const featuresData = [
        { icon: <Layers size={24} className="text-emerald-400" />, title: "Organização Visual", desc: "Arraste e solte capítulos facilmente. Estruture o seu referencial teórico sem confusão com o nosso sistema de blocos." },
        { icon: <Zap size={24} className="text-blue-400" />, title: "Gerador NBR 6023", desc: "Chega de sofrer. Preencha os dados e nós geramos a citação perfeita em menos tempo do que leva a tirar um café expresso." },
        { icon: <Download size={24} className="text-purple-400" />, title: "Exportação PDF Exata", desc: "O seu trabalho formatado num único clique. Vá buscar um café enquanto a magia acontece (spoiler: é instantâneo)." },
        { icon: <ShieldCheck size={24} className="text-orange-400" />, title: "Privacidade Total", desc: "Tudo é salvo no seu navegador ou na sua conta segura na nuvem. O seu TCC é totalmente privado e seguro." }
    ];

    const stepsData = [
        { num: "01", title: "Crie o seu Projeto", desc: "Inicie um projeto do zero ou poupe tempo escolhendo um dos nossos modelos pré-configurados (TCC, Artigo, Relatório).", color: "from-blue-500/20 to-blue-500/5", iconColor: "text-blue-400" },
        { num: "02", title: "Escreva sem Medo", desc: "Concentre-se na sua pesquisa. O nosso editor com assistente de saúde ABNT integrado garante que não se esquece de nada.", color: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-400" },
        { num: "03", title: "Exporte em Segundos", desc: "Com um único clique, gere um documento PDF perfeitamente formatado, com sumário, capa e margens nas normas exatas.", color: "from-purple-500/20 to-purple-500/5", iconColor: "text-purple-400" }
    ];

    const faqData = [
        { question: "Os meus dados estão seguros?", answer: "Totalmente. A plataforma utiliza tecnologia de armazenamento híbrido (LocalStorage e Supabase). Se não fizer login, os seus textos nunca saem do seu computador e não são guardados em nenhum banco de dados externo." },
        { question: "O projeto é oficial do IFPA?", answer: "Não. O ABNTFácil é um projeto de desenvolvimento de software 100% independente, criado por mim, Luiz Felipe, como aluno do IFPA Campus Belém, com o único objetivo de ajudar os meus colegas e a comunidade académica em geral." },
        { question: "Preciso pagar para usar?", answer: "Não. O uso de todas as ferramentas de formatação e exportação é gratuito. A plataforma é mantida através de doações voluntárias de quem deseja apoiar o projeto." },
        { question: "O PDF sai realmente nas normas da ABNT?", answer: "Sim. O sistema está configurado com as margens padrão (3cm superior/esquerda, 2cm inferior/direita), fontes Arial ou Times New Roman 12pt, e recuos de parágrafo de 1,25cm, conforme a NBR 14724." },
        { question: "Como faço para não perder o meu trabalho?", answer: "Recomendamos que faça login com a sua conta Google para sincronização automática na nuvem. Se preferir usar sem login, utilize a função 'Exportar Backup' no Dashboard regularmente para salvar os seus ficheiros no computador." }
    ];

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-green-500/30 overflow-x-hidden transition-colors duration-500">
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/20 blur-[150px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <header className="bg-slate-900/50 border-b border-slate-800/50 sticky top-0 z-50 px-4 md:px-8 py-4 flex justify-between items-center backdrop-blur-xl">
                <div className="flex items-center gap-2 text-green-500 font-black text-xl tracking-tighter shrink-0 hover:scale-105 transition-transform cursor-default">
                    <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 p-1.5 rounded-xl border border-green-500/30 shadow-inner">
                        <BookOpen size={22} className="md:w-[24px] md:h-[24px]" />
                    </div>
                    <span>ABNT<span className="text-white">Fácil</span></span>
                </div>
                <button 
                    onClick={() => navigate('/dashboard')}
                    className="bg-green-600 text-white px-5 py-2 md:px-6 md:py-2.5 rounded-xl text-xs md:text-sm font-bold hover:bg-green-500 transition-all shadow-[0_0_20px_rgba(22,163,74,0.3)] hover:shadow-[0_0_25px_rgba(22,163,74,0.5)] active:scale-95 whitespace-nowrap flex items-center gap-2"
                >
                    Acessar Plataforma <ArrowRight size={16} className="hidden sm:block" />
                </button>
            </header>

            <main className="relative z-10 max-w-6xl mx-auto px-6 py-12 md:py-20 space-y-24 md:space-y-32">
                
                <section className="text-center space-y-8 animate-in fade-in zoom-in duration-1000 flex flex-col items-center pt-8">
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="inline-flex items-center gap-2 bg-slate-900/80 text-emerald-400 px-4 py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest border border-emerald-900/50 shadow-2xl backdrop-blur-md">
                            <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            Plataforma 100% Gratuita
                        </div>
                        <div className="inline-flex items-center gap-2 bg-blue-900/30 text-blue-300 px-4 py-2 rounded-full text-[10px] md:text-xs font-bold border border-blue-900/50 shadow-2xl backdrop-blur-md">
                            <GraduationCap size={14} /> Projeto independente de um aluno do IFPA Belém
                        </div>
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-[1.05] md:leading-[1.1] max-w-4xl">
                        Formatação ABNT <br className="hidden sm:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-500 animate-gradient">Sem Dor de Cabeça.</span>
                    </h1>
                    
                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed font-medium">
                        O editor académico inteligente que cuida de todas as normas irritantes para que se possa concentrar no que realmente importa: <strong className="text-slate-200">a pesquisa.</strong>
                    </p>
                    
                    <div className="pt-6 w-full flex flex-col sm:flex-row justify-center gap-4">
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="w-full sm:w-auto bg-slate-100 text-slate-950 px-8 py-4 md:px-12 md:py-5 rounded-2xl text-base md:text-lg font-black hover:bg-green-500 hover:text-white transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(22,163,74,0.4)] flex items-center justify-center gap-3 hover:-translate-y-1 active:scale-95 group"
                        >
                            Começar a Escrever <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
                    {featuresData.map((feature, index) => (
                        <div key={index} className="bg-slate-900/40 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 md:p-8 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-2xl hover:bg-slate-800/50 group">
                            <div className="bg-slate-950 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-slate-800 group-hover:scale-110 transition-transform shadow-inner">
                                {feature.icon}
                            </div>
                            <h3 className="text-lg font-black text-white mb-3">{feature.title}</h3>
                            <p className="text-sm text-slate-400 leading-relaxed font-medium">{feature.desc}</p>
                        </div>
                    ))}
                </section>

                <section className="py-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">Como Funciona?</h2>
                        <p className="text-slate-400 text-lg">Três passos simples para deixar o Word de lado.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-blue-500/20 via-emerald-500/20 to-purple-500/20 z-0"></div>
                        {stepsData.map((step, index) => (
                            <div key={index} className="relative z-10 flex flex-col items-center text-center group">
                                <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${step.color} border border-slate-700/50 flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-500 backdrop-blur-sm`}>
                                    <span className={`text-3xl font-black ${step.iconColor}`}>{step.num}</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                                <p className="text-sm text-slate-400 leading-relaxed max-w-xs">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-gradient-to-r from-slate-900/80 to-slate-900/40 border border-orange-500/20 rounded-[2rem] p-8 md:p-10 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8 group hover:border-orange-500/40 transition-colors shadow-2xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                        <AlertTriangle size={200} />
                    </div>
                    <div className="bg-orange-500/10 p-5 rounded-[1.5rem] text-orange-400 shrink-0 group-hover:scale-110 transition-transform z-10 border border-orange-500/20">
                        <AlertTriangle size={36} />
                    </div>
                    <div className="flex-1 z-10">
                        <h3 className="text-xl md:text-2xl font-black text-orange-200 mb-3">Projeto Independente em Desenvolvimento</h3>
                        <p className="text-slate-400 text-sm md:text-base leading-relaxed text-justify">
                            Este site <strong>não é um projeto oficial do IFPA</strong>. Desenvolvi esta plataforma de forma totalmente independente para ajudar os meus colegas e a comunidade académica. Como a ferramenta é mantida por um único estudante e está em evolução contínua, <strong>não confie o seu TCC exclusivamente aqui sem precauções</strong>. Faça sempre backups externos.
                        </p>
                    </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    <div className="bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors rounded-[2rem] p-8 md:p-12 shadow-xl backdrop-blur-sm flex flex-col justify-center">
                        <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mb-8 border border-blue-500/20">
                            <GraduationCap size={28} />
                        </div>
                        <h3 className="text-3xl font-black text-white mb-4">De Estudante para Estudantes</h3>
                        <p className="text-slate-400 text-base leading-relaxed font-medium">
                            Eu sou o Luiz Felipe, estudo Engenharia de Controle e Automação no <strong className="text-white font-black">IFPA Belém</strong> e sei bem o que é passar a madrugada à base de cafeína a lutar contra as margens do Word. Criei o ABNTFácil por iniciativa própria para que nenhum colega tenha que perder tempo com formatação mecânica quando devia estar focado no conteúdo da pesquisa.
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-amber-900/20 to-slate-900 border border-amber-500/20 hover:border-amber-500/40 transition-colors rounded-[2rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden flex flex-col justify-center backdrop-blur-sm group">
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mb-8 border border-amber-500/20 group-hover:rotate-12 transition-transform">
                                <Coffee size={28} />
                            </div>
                            <h3 className="text-3xl font-black mb-4 text-amber-50">Mantenha o Projeto Acordado ☕</h3>
                            <p className="text-slate-300 leading-relaxed mb-8 text-sm font-medium">
                                O ABNTFácil é mantido à base de muita vontade e litros de café. No entanto, existem custos reais para manter os servidores e os bancos de dados no ar. Se a ferramenta poupou horas de choro e desespero, considere pagar um expresso simbólico. Qualquer valor ajuda a manter este projeto vivo e gratuito!
                            </p>
                            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-inner backdrop-blur-md">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Coffee size={14} className="text-amber-500"/> Chave PIX (Apoio / Servidores)
                                </p>
                                <code className="block bg-[#020617] p-4 rounded-xl text-amber-400 font-mono text-xs md:text-sm break-all select-all border border-amber-500/20 text-center font-bold">
                                    luizfelipe.ifpa.2022@gmail.com
                                </code>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-10 max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-blue-500/20">
                            <HelpCircle size={14} /> Dúvidas Comuns
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">Perguntas Frequentes</h2>
                    </div>

                    <div className="grid gap-4">
                        {faqData.map((item, index) => (
                            <div key={index} className={`border transition-all duration-300 rounded-2xl overflow-hidden ${openFaq === index ? 'bg-slate-900 border-emerald-500/40 shadow-lg shadow-emerald-900/10' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'}`}>
                                <button onClick={() => setOpenFaq(openFaq === index ? null : index)} className="w-full px-6 py-5 md:py-6 flex items-center justify-between text-left focus:outline-none">
                                    <span className={`font-bold text-sm md:text-base ${openFaq === index ? 'text-emerald-400' : 'text-slate-200'}`}>{item.question}</span>
                                    <div className={`p-1 rounded-full transition-colors ${openFaq === index ? 'bg-emerald-500/10' : 'bg-slate-800'}`}>
                                        <ChevronDown size={20} className={`transition-transform duration-300 ${openFaq === index ? 'rotate-180 text-emerald-500' : 'text-slate-500'}`} />
                                    </div>
                                </button>
                                <div className={`transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="px-6 pb-6 md:pb-8 text-sm text-slate-400 leading-relaxed border-t border-slate-800/50 pt-5">{item.answer}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-gradient-to-t from-emerald-900/20 to-transparent rounded-[2.5rem] md:rounded-[3rem] p-10 md:p-16 text-center border border-emerald-500/10 relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-2xl md:text-4xl font-black text-white mb-6">Pronto para formatar o seu trabalho?</h3>
                        <p className="text-slate-400 mb-10 max-w-xl mx-auto text-sm md:text-base font-medium">Junte-se a outros estudantes que já estão a simplificar a vida académica e a poupar dezenas de horas.</p>
                        <button onClick={() => navigate('/dashboard')} className="bg-emerald-600 text-white px-10 md:px-12 py-4 md:py-5 rounded-2xl font-black text-sm md:text-base hover:bg-emerald-500 transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-95 flex items-center justify-center gap-3 mx-auto">
                            Acessar Editor Grátis <ArrowRight size={20} />
                        </button>
                    </div>
                </section>

            </main>

            <footer className="bg-[#020617] border-t border-slate-900 text-slate-600 py-12 text-center text-xs font-medium z-10 relative">
                <p className="flex items-center justify-center gap-1.5">Projeto independente desenvolvido com <Coffee size={14} className="text-amber-700 fill-amber-700"/> e código.</p>
                <p className="mt-3 text-[10px] uppercase tracking-widest opacity-50 font-bold">© {new Date().getFullYear()} ABNTFácil</p>
            </footer>

            <button
                onClick={() => setIsFeedbackModalOpen(true)}
                className="fixed bottom-6 right-6 z-40 bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-500 hover:scale-110 transition-all group flex items-center justify-center border-4 border-slate-950 focus:outline-none"
                title="Reportar Bug ou Sugerir Melhoria"
            >
                <MessageSquare size={24} />
                <span className="absolute right-full mr-4 bg-slate-800 text-white text-[10px] font-bold px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-slate-700 hidden md:block">
                    Bugs ou Sugestões?
                </span>
            </button>

            <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} />
        </div>
    );
};

export default LandingPage;