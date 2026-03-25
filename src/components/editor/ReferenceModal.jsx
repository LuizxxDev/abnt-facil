import React, { useState } from 'react';
import { X, Book, Globe, Check, FileText, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

// Componente Abstrato para secar a repetição gigante de código
const RefInput = ({ label, hint, colorClass, ...props }) => (
    <div>
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">
            {label} {hint && <span className="text-[10px] text-slate-400 font-normal normal-case">{hint}</span>}
        </label>
        <input 
            className={`w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 transition-shadow ${colorClass}`} 
            {...props} 
        />
    </div>
);

export default function ReferenceModal({ isOpen, onClose, onAddReference }) {
    const [refType, setRefType] = useState('book');
    
    const [formData, setFormData] = useState({
        autores: '', titulo: '', subtitulo: '', edicao: '', local: '', editora: '', ano: '', 
        nomeSite: '', url: '', dataAcesso: '', 
        revista: '', volume: '', numero: '', paginas: '', doi: '',
        tipoTrabalho: 'Trabalho de Conclusão de Curso', grau: 'Bacharelado', curso: '', instituicao: ''
    });

    if (!isOpen) return null;

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleGenerate = (e) => {
        e.preventDefault();
        let referenceStr = '';

        if (refType === 'book') {
            if (!formData.autores || !formData.titulo || !formData.local || !formData.editora || !formData.ano) return toast.error("Preencha os campos obrigatórios (*)");
            referenceStr = `${formData.autores.toUpperCase()}. ${formData.titulo}${formData.subtitulo ? `: ${formData.subtitulo}` : ''}. ${formData.edicao ? `${formData.edicao} ed. ` : ''}${formData.local}: ${formData.editora}, ${formData.ano}.`;
        
        } else if (refType === 'website') {
            if (!formData.autores || !formData.titulo || !formData.url || !formData.dataAcesso) return toast.error("Preencha os campos obrigatórios (*)");
            referenceStr = `${formData.autores.toUpperCase()}. ${formData.titulo}. ${formData.nomeSite ? `${formData.nomeSite}, ` : ''}${formData.ano ? `${formData.ano}. ` : ''}Disponível em: <${formData.url}>. Acesso em: ${formData.dataAcesso}.`;
        
        } else if (refType === 'article') {
            if (!formData.autores || !formData.titulo || !formData.revista || !formData.local || !formData.ano) return toast.error("Preencha os campos obrigatórios (*)");
            let artStr = `${formData.autores.toUpperCase()}. ${formData.titulo}. ${formData.revista}, ${formData.local}, `;
            if (formData.volume) artStr += `v. ${formData.volume}, `;
            if (formData.numero) artStr += `n. ${formData.numero}, `;
            if (formData.paginas) artStr += `p. ${formData.paginas}, `;
            artStr += `${formData.ano}.`;
            if (formData.doi) artStr += ` DOI: ${formData.doi}.`;
            referenceStr = artStr;

        } else if (refType === 'thesis') {
            if (!formData.autores || !formData.titulo || !formData.ano || !formData.curso || !formData.instituicao || !formData.local) return toast.error("Preencha os campos obrigatórios (*)");
            referenceStr = `${formData.autores.toUpperCase()}. ${formData.titulo}${formData.subtitulo ? `: ${formData.subtitulo}` : ''}. ${formData.ano}. ${formData.tipoTrabalho} (${formData.grau} em ${formData.curso}) - ${formData.instituicao}, ${formData.local}, ${formData.ano}.`;
        }

        if (onAddReference) onAddReference(referenceStr);
        toast.success("Referência gerada com sucesso!");
        
        setFormData({ 
            autores: '', titulo: '', subtitulo: '', edicao: '', local: '', editora: '', ano: '', 
            nomeSite: '', url: '', dataAcesso: '', revista: '', volume: '', numero: '', paginas: '', doi: '',
            tipoTrabalho: 'Trabalho de Conclusão de Curso', grau: 'Bacharelado', curso: '', instituicao: '' 
        });
        onClose();
    };

    const tabs = [
        { id: 'book', label: 'Obra Impressa', icon: Book, color: 'blue' },
        { id: 'website', label: 'Site / Online', icon: Globe, color: 'emerald' },
        { id: 'article', label: 'Artigo Científico', icon: FileText, color: 'purple' },
        { id: 'thesis', label: 'Tese / TCC', icon: GraduationCap, color: 'orange' }
    ];

    const focusRing = { book: 'focus:ring-blue-500', website: 'focus:ring-emerald-500', article: 'focus:ring-purple-500', thesis: 'focus:ring-orange-500' }[refType];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-5 md:px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">Gerador Automático NBR 6023</h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <div className="p-5 md:p-6 overflow-y-auto flex-1 custom-scrollbar">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-6">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = refType === tab.id;
                            return (
                                <button 
                                    key={tab.id} type="button" onClick={() => setRefType(tab.id)}
                                    className={`flex flex-col md:flex-row items-center justify-center gap-2 p-3 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-wider transition-all border ${isActive ? `bg-${tab.color}-600 text-white border-${tab.color}-600 shadow-md` : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                >
                                    <Icon size={18} /> {tab.label}
                                </button>
                            )
                        })}
                    </div>

                    <form id="ref-form" onSubmit={handleGenerate} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        {refType === 'book' && (
                            <>
                                <RefInput colorClass={focusRing} label="Autor(es) *" hint="(Ex: SOBRENOME, Nome)" name="autores" value={formData.autores} onChange={handleChange} placeholder="Ex: SILVA, João" required />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <RefInput colorClass={focusRing} label="Título do Livro *" name="titulo" value={formData.titulo} onChange={handleChange} required />
                                    <RefInput colorClass={focusRing} label="Subtítulo" hint="(opcional)" name="subtitulo" value={formData.subtitulo} onChange={handleChange} />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <RefInput colorClass={focusRing} label="Edição" name="edicao" value={formData.edicao} onChange={handleChange} placeholder="Ex: 2" />
                                    <RefInput colorClass={focusRing} label="Local *" name="local" value={formData.local} onChange={handleChange} placeholder="Ex: São Paulo" required />
                                    <RefInput colorClass={focusRing} label="Editora *" name="editora" value={formData.editora} onChange={handleChange} required />
                                    <RefInput colorClass={focusRing} label="Ano *" name="ano" value={formData.ano} onChange={handleChange} placeholder="Ex: 2023" required />
                                </div>
                            </>
                        )}

                        {refType === 'website' && (
                            <>
                                <RefInput colorClass={focusRing} label="Autor / Organização *" hint="(Ex: IBGE)" name="autores" value={formData.autores} onChange={handleChange} placeholder="Ex: INSTITUTO BRASILEIRO DE GEOGRAFIA E ESTATÍSTICA" required />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <RefInput colorClass={focusRing} label="Título da Página *" name="titulo" value={formData.titulo} onChange={handleChange} required />
                                    <RefInput colorClass={focusRing} label="Nome do Site" hint="(opcional)" name="nomeSite" value={formData.nomeSite} onChange={handleChange} placeholder="Ex: G1, Wikipedia..." />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <RefInput colorClass={focusRing} label="Ano" hint="(opcional)" name="ano" value={formData.ano} onChange={handleChange} placeholder="Ex: 2023" />
                                    <div className="md:col-span-3">
                                        <RefInput colorClass={focusRing} label="URL (Link) *" type="url" name="url" value={formData.url} onChange={handleChange} placeholder="https://..." required />
                                    </div>
                                </div>
                                <RefInput colorClass={focusRing} label="Data de Acesso *" name="dataAcesso" value={formData.dataAcesso} onChange={handleChange} placeholder="Ex: 15 out. 2023" required />
                            </>
                        )}

                        {refType === 'article' && (
                            <>
                                <RefInput colorClass={focusRing} label="Autor(es) *" hint="(Ex: SOBRENOME, Nome)" name="autores" value={formData.autores} onChange={handleChange} required />
                                <RefInput colorClass={focusRing} label="Título do Artigo *" name="titulo" value={formData.titulo} onChange={handleChange} required />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <RefInput colorClass={focusRing} label="Nome da Revista/Periódico *" name="revista" value={formData.revista} onChange={handleChange} placeholder="Ex: Revista IEEE, Nature..." required />
                                    <RefInput colorClass={focusRing} label="Local de Publicação *" name="local" value={formData.local} onChange={handleChange} placeholder="Ex: São Paulo" required />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <RefInput colorClass={focusRing} label="Volume" name="volume" value={formData.volume} onChange={handleChange} placeholder="Ex: 12" />
                                    <RefInput colorClass={focusRing} label="Número" name="numero" value={formData.numero} onChange={handleChange} placeholder="Ex: 4" />
                                    <RefInput colorClass={focusRing} label="Páginas" name="paginas" value={formData.paginas} onChange={handleChange} placeholder="Ex: 45-60" />
                                    <RefInput colorClass={focusRing} label="Ano *" name="ano" value={formData.ano} onChange={handleChange} required />
                                    <RefInput colorClass={focusRing} label="DOI" hint="(Opcional)" name="doi" value={formData.doi} onChange={handleChange} />
                                </div>
                            </>
                        )}

                        {refType === 'thesis' && (
                            <>
                                <RefInput colorClass={focusRing} label="Autor *" hint="(Ex: SOBRENOME, Nome)" name="autores" value={formData.autores} onChange={handleChange} required />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <RefInput colorClass={focusRing} label="Título da Tese/TCC *" name="titulo" value={formData.titulo} onChange={handleChange} required />
                                    <RefInput colorClass={focusRing} label="Subtítulo" hint="(opcional)" name="subtitulo" value={formData.subtitulo} onChange={handleChange} />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Tipo de Trabalho *</label>
                                        <select name="tipoTrabalho" value={formData.tipoTrabalho} onChange={handleChange} className={`w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 ${focusRing}`}>
                                            <option value="Trabalho de Conclusão de Curso">TCC</option><option value="Dissertação">Dissertação</option><option value="Tese">Tese</option><option value="Monografia">Monografia</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Grau Obtido *</label>
                                        <select name="grau" value={formData.grau} onChange={handleChange} className={`w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 ${focusRing}`}>
                                            <option value="Bacharelado">Bacharelado</option><option value="Licenciatura">Licenciatura</option><option value="Mestrado">Mestrado</option><option value="Doutorado">Doutorado</option><option value="Especialização">Especialização</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <RefInput colorClass={focusRing} label="Nome do Curso *" name="curso" value={formData.curso} onChange={handleChange} placeholder="Ex: Eng. de Controle e Automação" required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <RefInput colorClass={focusRing} label="Instituição *" name="instituicao" value={formData.instituicao} onChange={handleChange} placeholder="Ex: IFPA" required />
                                    <RefInput colorClass={focusRing} label="Local de Defesa *" name="local" value={formData.local} onChange={handleChange} placeholder="Ex: Belém" required />
                                    <RefInput colorClass={focusRing} label="Ano de Defesa *" name="ano" value={formData.ano} onChange={handleChange} placeholder="Ex: 2024" required />
                                </div>
                            </>
                        )}
                    </form>
                </div>

                <div className="px-5 md:px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex flex-col-reverse md:flex-row justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
                    <button type="button" onClick={onClose} className="w-full md:w-auto px-6 py-3 md:py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
                    <button type="submit" form="ref-form" className={`w-full md:w-auto px-8 py-3 md:py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-colors shadow-lg active:scale-95 ${refType === 'book' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30' : refType === 'website' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30' : refType === 'article' ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30' : 'bg-orange-600 hover:bg-orange-500 shadow-orange-600/30'}`}><Check size={18} /> Gerar Referência</button>
                </div>
            </div>
        </div>
    );
}