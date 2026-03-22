import React, { useState } from 'react';
import { X, Book, Globe, Check, FileText, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReferenceModal({ isOpen, onClose, onAddReference }) {
    // Controla qual aba está ativa (book, website, article, thesis)
    const [refType, setRefType] = useState('book');
    
    // Estado para armazenar os campos do formulário ampliados
    const [formData, setFormData] = useState({
        autores: '',
        titulo: '',
        subtitulo: '',
        edicao: '',
        local: '',
        editora: '',
        ano: '',
        nomeSite: '',
        url: '',
        dataAcesso: '',
        // Novos campos para Artigos
        revista: '',
        volume: '',
        numero: '',
        paginas: '',
        doi: '',
        // Novos campos para Teses/TCCs
        tipoTrabalho: 'Trabalho de Conclusão de Curso', // Default
        grau: 'Bacharelado',
        curso: '',
        instituicao: ''
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGenerate = (e) => {
        e.preventDefault();
        let referenceStr = '';

        // LÓGICA DE GERAÇÃO ABNT (NBR 6023)
        if (refType === 'book') {
            if (!formData.autores || !formData.titulo || !formData.local || !formData.editora || !formData.ano) {
                toast.error("Preencha os campos obrigatórios (*)");
                return;
            }
            // Formato ABNT Livro: SOBRENOME, Nome. Título: subtítulo. Edição. Local: Editora, Ano.
            referenceStr = `${formData.autores.toUpperCase()}. ${formData.titulo}${formData.subtitulo ? `: ${formData.subtitulo}` : ''}. ${formData.edicao ? `${formData.edicao} ed. ` : ''}${formData.local}: ${formData.editora}, ${formData.ano}.`;
        
        } else if (refType === 'website') {
            if (!formData.autores || !formData.titulo || !formData.url || !formData.dataAcesso) {
                toast.error("Preencha os campos obrigatórios (*)");
                return;
            }
            // Formato ABNT Site: SOBRENOME, Nome (ou ÓRGÃO). Título. Site, Ano. Disponível em: <link>. Acesso em: data.
            referenceStr = `${formData.autores.toUpperCase()}. ${formData.titulo}. ${formData.nomeSite ? `${formData.nomeSite}, ` : ''}${formData.ano ? `${formData.ano}. ` : ''}Disponível em: <${formData.url}>. Acesso em: ${formData.dataAcesso}.`;
        
        } else if (refType === 'article') {
            if (!formData.autores || !formData.titulo || !formData.revista || !formData.local || !formData.ano) {
                toast.error("Preencha os campos obrigatórios (*)");
                return;
            }
            // Formato ABNT Artigo: SOBRENOME, Nome. Título do artigo. Nome da Revista, Local, v., n., p. inicial-final, ano.
            let artStr = `${formData.autores.toUpperCase()}. ${formData.titulo}. ${formData.revista}, ${formData.local}, `;
            if (formData.volume) artStr += `v. ${formData.volume}, `;
            if (formData.numero) artStr += `n. ${formData.numero}, `;
            if (formData.paginas) artStr += `p. ${formData.paginas}, `;
            artStr += `${formData.ano}.`;
            if (formData.doi) artStr += ` DOI: ${formData.doi}.`;
            
            referenceStr = artStr;

        } else if (refType === 'thesis') {
            if (!formData.autores || !formData.titulo || !formData.ano || !formData.curso || !formData.instituicao || !formData.local) {
                toast.error("Preencha os campos obrigatórios (*)");
                return;
            }
            // Formato ABNT Tese/Dissertação/TCC: SOBRENOME, Nome. Título. Ano. Tipo (Grau em Curso) - Instituição, Local, Ano.
            referenceStr = `${formData.autores.toUpperCase()}. ${formData.titulo}${formData.subtitulo ? `: ${formData.subtitulo}` : ''}. ${formData.ano}. ${formData.tipoTrabalho} (${formData.grau} em ${formData.curso}) - ${formData.instituicao}, ${formData.local}, ${formData.ano}.`;
        }

        // Envia a referência gerada de volta para o Editor/Sidebar
        if (onAddReference) {
            onAddReference(referenceStr);
        }
        
        toast.success("Referência gerada com sucesso!");
        
        // Limpa o formulário e fecha o modal
        setFormData({ 
            autores: '', titulo: '', subtitulo: '', edicao: '', local: '', editora: '', ano: '', 
            nomeSite: '', url: '', dataAcesso: '', 
            revista: '', volume: '', numero: '', paginas: '', doi: '',
            tipoTrabalho: 'Trabalho de Conclusão de Curso', grau: 'Bacharelado', curso: '', instituicao: '' 
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-5 md:px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        Gerador Automático NBR 6023
                    </h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 md:p-6 overflow-y-auto flex-1 custom-scrollbar">
                    
                    {/* Tabs de Seleção Responsivas */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-6">
                        <button 
                            type="button"
                            onClick={() => setRefType('book')}
                            className={`flex flex-col md:flex-row items-center justify-center gap-2 p-3 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-wider transition-all border ${refType === 'book' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            <Book size={18} /> Obra Impressa
                        </button>
                        <button 
                            type="button"
                            onClick={() => setRefType('website')}
                            className={`flex flex-col md:flex-row items-center justify-center gap-2 p-3 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-wider transition-all border ${refType === 'website' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            <Globe size={18} /> Site / Online
                        </button>
                        <button 
                            type="button"
                            onClick={() => setRefType('article')}
                            className={`flex flex-col md:flex-row items-center justify-center gap-2 p-3 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-wider transition-all border ${refType === 'article' ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            <FileText size={18} /> Artigo Científico
                        </button>
                        <button 
                            type="button"
                            onClick={() => setRefType('thesis')}
                            className={`flex flex-col md:flex-row items-center justify-center gap-2 p-3 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-wider transition-all border ${refType === 'thesis' ? 'bg-orange-600 text-white border-orange-600 shadow-md' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            <GraduationCap size={18} /> Tese / TCC
                        </button>
                    </div>

                    <form id="ref-form" onSubmit={handleGenerate} className="space-y-4">
                        
                        {/* ----------------- LIVRO ----------------- */}
                        {refType === 'book' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Autor(es) * <span className="text-[10px] text-slate-400 font-normal normal-case">(Ex: SOBRENOME, Nome)</span></label>
                                    <input type="text" name="autores" value={formData.autores} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: SILVA, João da; SANTOS, Maria" required />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Título do Livro *</label>
                                        <input type="text" name="titulo" value={formData.titulo} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Subtítulo <span className="text-[10px] font-normal normal-case">(opcional)</span></label>
                                        <input type="text" name="subtitulo" value={formData.subtitulo} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Edição</label>
                                        <input type="text" name="edicao" value={formData.edicao} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: 2" />
                                    </div>
                                    <div className="col-span-1 md:col-span-1">
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Local *</label>
                                        <input type="text" name="local" value={formData.local} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: São Paulo" required />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Editora *</label>
                                        <input type="text" name="editora" value={formData.editora} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" required />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Ano *</label>
                                        <input type="text" name="ano" value={formData.ano} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: 2023" required />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ----------------- SITE / ONLINE ----------------- */}
                        {refType === 'website' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Autor(es) / Organização * <span className="text-[10px] text-slate-400 font-normal normal-case">(Ex: IBGE)</span></label>
                                    <input type="text" name="autores" value={formData.autores} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ex: INSTITUTO BRASILEIRO DE GEOGRAFIA E ESTATÍSTICA" required />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Título da Página *</label>
                                        <input type="text" name="titulo" value={formData.titulo} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Nome do Site <span className="text-[10px] font-normal normal-case">(opcional)</span></label>
                                        <input type="text" name="nomeSite" value={formData.nomeSite} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ex: G1, Wikipedia..." />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Ano <span className="text-[10px] font-normal normal-case">(opcional)</span></label>
                                        <input type="text" name="ano" value={formData.ano} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ex: 2023" />
                                    </div>
                                    <div className="col-span-1 md:col-span-3">
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">URL (Link) *</label>
                                        <input type="url" name="url" value={formData.url} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="https://..." required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Data de Acesso *</label>
                                    <input type="text" name="dataAcesso" value={formData.dataAcesso} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ex: 15 out. 2023" required />
                                </div>
                            </div>
                        )}

                        {/* ----------------- ARTIGO CIENTÍFICO ----------------- */}
                        {refType === 'article' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Autor(es) * <span className="text-[10px] text-slate-400 font-normal normal-case">(Ex: SOBRENOME, Nome)</span></label>
                                    <input type="text" name="autores" value={formData.autores} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Título do Artigo *</label>
                                    <input type="text" name="titulo" value={formData.titulo} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" required />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Nome da Revista/Periódico *</label>
                                        <input type="text" name="revista" value={formData.revista} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Ex: Revista IEEE, Nature..." required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Local de Publicação *</label>
                                        <input type="text" name="local" value={formData.local} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Ex: São Paulo" required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Volume</label>
                                        <input type="text" name="volume" value={formData.volume} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Ex: 12" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Número</label>
                                        <input type="text" name="numero" value={formData.numero} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Ex: 4" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Páginas</label>
                                        <input type="text" name="paginas" value={formData.paginas} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Ex: 45-60" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Ano *</label>
                                        <input type="text" name="ano" value={formData.ano} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" required />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">DOI <span className="text-[10px] font-normal normal-case">(Opcional)</span></label>
                                        <input type="text" name="doi" value={formData.doi} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ----------------- TESE / TCC / DISSERTAÇÃO ----------------- */}
                        {refType === 'thesis' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Autor * <span className="text-[10px] text-slate-400 font-normal normal-case">(Ex: SOBRENOME, Nome)</span></label>
                                    <input type="text" name="autores" value={formData.autores} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none" required />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Título da Tese/TCC *</label>
                                        <input type="text" name="titulo" value={formData.titulo} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Subtítulo <span className="text-[10px] font-normal normal-case">(opcional)</span></label>
                                        <input type="text" name="subtitulo" value={formData.subtitulo} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Tipo de Trabalho *</label>
                                        <select name="tipoTrabalho" value={formData.tipoTrabalho} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none">
                                            <option value="Trabalho de Conclusão de Curso">TCC</option>
                                            <option value="Dissertação">Dissertação</option>
                                            <option value="Tese">Tese</option>
                                            <option value="Monografia">Monografia</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Grau Obtido *</label>
                                        <select name="grau" value={formData.grau} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none">
                                            <option value="Bacharelado">Bacharelado</option>
                                            <option value="Licenciatura">Licenciatura</option>
                                            <option value="Mestrado">Mestrado</option>
                                            <option value="Doutorado">Doutorado</option>
                                            <option value="Especialização">Especialização</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Nome do Curso *</label>
                                        <input type="text" name="curso" value={formData.curso} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Ex: Engenharia de Controle e Automação" required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Instituição *</label>
                                        <input type="text" name="instituicao" value={formData.instituicao} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Ex: IFPA" required />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Local de Defesa *</label>
                                        <input type="text" name="local" value={formData.local} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Ex: Belém" required />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Ano de Defesa *</label>
                                        <input type="text" name="ano" value={formData.ano} onChange={handleChange} className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Ex: 2024" required />
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer Responsivo */}
                <div className="px-5 md:px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex flex-col-reverse md:flex-row justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="w-full md:w-auto px-6 py-3 md:py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        form="ref-form"
                        className={`w-full md:w-auto px-8 py-3 md:py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-colors shadow-lg active:scale-95 ${
                            refType === 'book' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30' : 
                            refType === 'website' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30' : 
                            refType === 'article' ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30' :
                            'bg-orange-600 hover:bg-orange-500 shadow-orange-600/30'
                        }`}
                    >
                        <Check size={18} />
                        Gerar Referência
                    </button>
                </div>
            </div>
        </div>
    );
}