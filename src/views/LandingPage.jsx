import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    BookOpen, AlertTriangle, Heart, Coffee, 
    FileText, CheckCircle, GraduationCap, ChevronRight,
    HelpCircle, ChevronDown, MessageSquare, Bug, X, Send
} from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState(null);
    
    // Estados para a funcionalidade de Feedback
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackType, setFeedbackType] = useState('bug');
    const [feedbackText, setFeedbackText] = useState('');

    const faqData = [
        {
            question: "Os meus dados estão seguros?",
            answer: "Totalmente. A plataforma utiliza tecnologia de armazenamento local (LocalStorage). Isso significa que os seus textos nunca saem do seu computador e não são guardados em nenhum banco de dados externo."
        },
        {
            question: "Preciso pagar para usar?",
            answer: "Não. Este é um projeto acadêmico independente desenvolvido por um aluno do IFPA para ajudar a comunidade. O uso de todas as ferramentas de formatação e exportação é 100% gratuito."
        },
        {
            question: "O PDF sai realmente nas normas da ABNT?",
            answer: "Sim. O sistema está configurado com as margens padrão (3cm superior/esquerda, 2cm inferior/direita), fontes Arial ou Times New Roman 12pt, e recuos de parágrafo de 1,25cm, conforme a NBR 14724."
        },
        {
            question: "Como faço para não perder o meu trabalho?",
            answer: "Como os dados ficam no navegador, recomendamos que utilize a função 'Exportar Backup' no Dashboard regularmente. Assim, pode carregar o seu arquivo em qualquer outro computador sem perder nada."
        }
    ];

    // Função que lida com o envio do feedback via email
    const handleSendFeedback = () => {
        if (!feedbackText.trim()) return;
        const subject = feedbackType === 'bug' ? '[ABNTFácil] Reporte de Bug' : '[ABNTFácil] Sugestão de Melhoria';
        const body = `Olá,\n\nGostaria de relatar o seguinte:\n\n${feedbackText}\n\n---\nEnviado via site ABNTFácil`;
        window.location.href = `mailto:luizfelipe.ifpa.2022@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        setShowFeedback(false);
        setFeedbackText('');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-green-500/30 overflow-x-hidden transition-colors duration-500">
            
            {/* Background Decorativo Animado */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-900/20 blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Navbar Dark Glass - Ajustada para Mobile */}
            <header className="bg-slate-900/60 border-b border-slate-800/50 sticky top-0 z-50 px-4 md:px-6 py-4 flex justify-between items-center backdrop-blur-xl">
                <div className="flex items-center gap-2 text-green-500 font-black text-lg md:text-xl tracking-tighter shrink-0">
                    <div className="bg-green-500/10 p-1.5 rounded-lg border border-green-500/20">
                        <BookOpen size={20} className="md:w-[22px] md:h-[22px]" />
                    </div>
                    <span>ABNT<span className="text-white">Fácil</span></span>
                </div>
                <button 
                    onClick={() => navigate('/dashboard')}
                    className="bg-green-600 text-white px-4 py-2 md:px-6 md:py-2.5 rounded-xl text-[10px] md:text-sm font-bold hover:bg-green-500 transition-all shadow-lg shadow-green-900/20 active:scale-95 whitespace-nowrap"
                >
                    Acessar a Plataforma
                </button>
            </header>

            <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 space-y-24">
                
                {/* Hero Section - Ajustada para Mobile */}
                <section className="text-center space-y-8 pt-8 md:pt-16 animate-in fade-in zoom-in duration-1000">
                    <div className="inline-flex items-center gap-2 bg-slate-900/80 text-green-400 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-slate-700 shadow-2xl">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Projeto 100% Gratuito
                    </div>
                    <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-[1] md:leading-[0.9]">
                        Formatação ABNT <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 animate-gradient">Sem Dor de Cabeça.</span>
                    </h1>
                    <p className="text-base md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
                        O editor académico que cuida das normas para você focar no que importa: a sua pesquisa.
                    </p>
                    <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="w-full sm:w-auto bg-white text-slate-950 px-6 py-4 md:px-10 md:py-5 rounded-2xl text-base md:text-lg font-black hover:bg-green-500 hover:text-white transition-all shadow-2xl flex items-center justify-center gap-2 hover:-translate-y-1 active:scale-95"
                        >
                            Começar a Escrever <ChevronRight size={22} />
                        </button>
                    </div>
                </section>

                {/* Aviso de Desenvolvimento Sincero */}
                <section className="bg-slate-900/40 border border-orange-500/20 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8 group hover:border-orange-500/40 transition-colors">
                    <div className="bg-orange-500/10 p-5 rounded-[1.5rem] text-orange-400 shrink-0 group-hover:scale-110 transition-transform">
                        <AlertTriangle size={32} className="md:w-[40px] md:h-[40px]" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg md:text-xl font-bold text-orange-200 mb-2">Plataforma em Desenvolvimento</h3>
                        <p className="text-slate-400 text-xs md:text-sm leading-relaxed text-justify">
                            Como estudante do <strong>IFPA Campus Belém</strong>, estou desenvolvendo este site para ajudar colegas e a comunidade externa. A plataforma é gratuita, mas como ainda está em fase de testes, <strong>não confie 100% o seu TCC apenas aqui</strong>. Faça sempre backups externos e revisões regulares enquanto evoluímos o sistema juntos.
                        </p>
                    </div>
                </section>

                {/* Sobre e Apoio Financeiro */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 shadow-xl backdrop-blur-sm">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mb-6 md:mb-8 border border-blue-500/20">
                            <GraduationCap size={24} className="md:w-[28px] md:h-[28px]" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black text-white mb-4">De Estudante para Estudante</h3>
                        <p className="text-slate-400 text-sm md:text-base leading-relaxed font-medium">
                            Eu sou o Luiz Felipe, estudo Engenharia no <strong className="text-white font-black">IFPA Belém</strong> e sei bem o que é passar a madrugada lutando contra as margens do Word. Criei o ABNTFácil para que nenhum colega tenha que perder tempo com formatação quando devia estar focado na sua pesquisa.
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-green-600/20 to-teal-900/20 border border-green-500/20 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-center backdrop-blur-sm group">
                        <div className="relative z-10">
                            <div className="w-12 h-12 md:w-14 md:h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-6 md:mb-8 border border-white/20 group-hover:rotate-12 transition-transform">
                                <Coffee size={24} className="md:w-[28px] md:h-[28px]" />
                            </div>
                            <h3 className="text-2xl md:text-3xl font-black mb-4">Mantenha o Projeto Vivo</h3>
                            <p className="text-slate-300 leading-relaxed mb-8 text-xs md:text-sm font-medium">
                                O ABNTFácil é gratuito e feito para ajudar. No entanto, existem custos reais para manter o site no ar. Se a ferramenta te ajudou a poupar tempo, considera dar um apoio para manter o projeto de pé para os próximos alunos.
                            </p>
                            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-inner">
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-3">PIX para Manutenção (Servidores/Domínio)</p>
                                <code className="block bg-slate-900 p-3 md:p-4 rounded-xl text-green-400 font-mono text-[10px] md:text-xs break-all select-all border border-green-500/10 text-center">
                                    luizfelipe.ifpa.2022@gmail.com
                                </code>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="py-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-blue-500/20">
                            <HelpCircle size={12} /> Dúvidas Comuns
                        </div>
                        <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">Perguntas Frequentes</h2>
                    </div>

                    <div className="grid gap-4 max-w-3xl mx-auto">
                        {faqData.map((item, index) => (
                            <div 
                                key={index} 
                                className={`border transition-all duration-300 rounded-2xl overflow-hidden ${openFaq === index ? 'bg-slate-900 border-green-500/30 shadow-lg shadow-green-900/5' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'}`}
                            >
                                <button 
                                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                    className="w-full px-6 py-4 md:py-5 flex items-center justify-between text-left"
                                >
                                    <span className={`font-bold text-xs md:text-base ${openFaq === index ? 'text-green-400' : 'text-slate-200'}`}>
                                        {item.question}
                                    </span>
                                    <ChevronDown 
                                        size={20} 
                                        className={`text-slate-500 transition-transform duration-300 ${openFaq === index ? 'rotate-180 text-green-500' : ''}`} 
                                    />
                                </button>
                                <div className={`transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="px-6 pb-6 text-xs md:text-sm text-slate-400 leading-relaxed border-t border-slate-800/50 pt-4">
                                        {item.answer}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA Final */}
                <section className="bg-gradient-to-t from-green-900/20 to-transparent rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 text-center border border-green-500/10">
                    <h3 className="text-xl md:text-2xl font-black text-white mb-4">Pronto para formatar o seu trabalho?</h3>
                    <p className="text-slate-400 mb-8 max-w-lg mx-auto text-xs md:text-sm">Junte-se a outros estudantes do IFPA que já estão simplificando a sua vida académica.</p>
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="bg-green-600 text-white px-8 md:px-10 py-3.5 md:py-4 rounded-2xl font-black hover:bg-green-500 transition-all shadow-xl shadow-green-900/20 active:scale-95"
                    >
                        Aceder Editor Grátis
                    </button>
                </section>

            </main>

            <footer className="bg-slate-950 border-t border-slate-900 text-slate-600 py-16 text-center text-xs md:text-sm font-medium">
                <p>Desenvolvido com ☕ por um aluno do IFPA Belém.</p>
                <p className="mt-2 text-[9px] md:text-[10px] uppercase tracking-widest opacity-40">© {new Date().getFullYear()} ABNTFácil</p>
            </footer>

            {/* BOTÃO FLUTUANTE DE FEEDBACK */}
            <button
                onClick={() => setShowFeedback(true)}
                className="fixed bottom-6 right-6 z-40 bg-blue-600 text-white p-3.5 md:p-4 rounded-full shadow-2xl hover:bg-blue-500 hover:scale-110 transition-all group flex items-center justify-center border-4 border-slate-950"
                title="Reportar Bug ou Sugerir Melhoria"
            >
                <MessageSquare size={22} className="md:w-[24px] md:h-[24px]" />
                <span className="absolute right-full mr-4 bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-slate-700 hidden md:block">
                    Bugs ou Sugestões?
                </span>
            </button>

            {/* MODAL DE FEEDBACK */}
            {showFeedback && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-800">
                            <h3 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
                                <MessageSquare size={20} className="text-blue-500"/> Enviar Feedback
                            </h3>
                            <button onClick={() => setShowFeedback(false)} className="text-slate-500 hover:text-white transition-colors bg-slate-800/50 p-1.5 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6 flex-1">
                            <p className="text-xs md:text-sm text-slate-400">
                                Encontrou algum erro ou tem uma ideia para melhorar a plataforma? Sua ajuda é muito importante!
                            </p>

                            <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                                <button
                                    onClick={() => setFeedbackType('bug')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${feedbackType === 'bug' ? 'bg-slate-800 text-red-400 shadow-sm border border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    <Bug size={14}/> Reportar Bug
                                </button>
                                <button
                                    onClick={() => setFeedbackType('suggestion')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${feedbackType === 'suggestion' ? 'bg-slate-800 text-green-400 shadow-sm border border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    <Heart size={14}/> Sugerir Melhoria
                                </button>
                            </div>

                            <div>
                                <textarea
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    placeholder={feedbackType === 'bug' ? 'Descreva o erro que você encontrou com o máximo de detalhes...' : 'Como posso melhorar a sua experiência no ABNTFácil?'}
                                    className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs md:text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                            <button onClick={() => setShowFeedback(false)} className="px-5 py-2.5 text-xs md:text-sm font-bold text-slate-400 hover:text-white transition-colors">
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSendFeedback}
                                disabled={!feedbackText.trim()}
                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2"
                            >
                                <Send size={16}/> Enviar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingPage;