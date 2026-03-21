import React, { useState } from 'react';
import { X, Book, Globe, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReferenceModal({ isOpen, onClose, onAddReference }) {
    // Controla qual aba está ativa (livro ou site)
    const [refType, setRefType] = useState('book');
    
    // Estado para armazenar os campos do formulário
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
        dataAcesso: ''
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGenerate = (e) => {
        e.preventDefault();
        let referenceStr = '';

        // LÓGICA DE GERAÇÃO ABNT
        if (refType === 'book') {
            if (!formData.autores || !formData.titulo || !formData.local || !formData.editora || !formData.ano) {
                toast.error("Preencha os campos obrigatórios (*)");
                return;
            }
            // Formato ABNT Livro: SOBRENOME, Nome. Título: subtítulo. Edição. Local: Editora, Ano.
            referenceStr = `${formData.autores.toUpperCase()}. ${formData.titulo}${formData.subtitulo ? `: ${formData.subtitulo}` : ''}. ${formData.edicao ? `${formData.edicao} ed. ` : ''}${formData.local}: ${formData.editora}, ${formData.ano}.`;
        } else {
            if (!formData.autores || !formData.titulo || !formData.url || !formData.dataAcesso) {
                toast.error("Preencha os campos obrigatórios (*)");
                return;
            }
            // Formato ABNT Site: SOBRENOME, Nome (ou ÓRGÃO). Título. Site, Ano. Disponível em: <link>. Acesso em: data.
            referenceStr = `${formData.autores.toUpperCase()}. ${formData.titulo}. ${formData.nomeSite ? `${formData.nomeSite}, ` : ''}${formData.ano ? `${formData.ano}. ` : ''}Disponível em: <${formData.url}>. Acesso em: ${formData.dataAcesso}.`;
        }

        // Envia a referência gerada de volta para o Editor/Sidebar
        if (onAddReference) {
            onAddReference(referenceStr);
        }
        
        toast.success("Referência gerada com sucesso!");
        
        // Limpa o formulário e fecha o modal
        setFormData({ autores: '', titulo: '', subtitulo: '', edicao: '', local: '', editora: '', ano: '', nomeSite: '', url: '', dataAcesso: '' });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        Gerador Automático ABNT
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-red-500 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    
                    {/* Tabs de Seleção */}
                    <div className="flex gap-4 mb-6">
                        <button 
                            type="button"
                            onClick={() => setRefType('book')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${refType === 'book' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                        >
                            <Book size={20} />
                            Livro / Obra Impressa
                        </button>
                        <button 
                            type="button"
                            onClick={() => setRefType('website')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${refType === 'website' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                        >
                            <Globe size={20} />
                            Site / Artigo Online
                        </button>
                    </div>

                    <form id="ref-form" onSubmit={handleGenerate} className="space-y-4">
                        {/* CAMPOS PARA LIVRO */}
                        {refType === 'book' ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Autor(es) * <span className="text-xs text-slate-500 font-normal">(Ex: SOBRENOME, Nome)</span></label>
                                    <input type="text" name="autores" value={formData.autores} onChange={handleChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="Ex: SILVA, João da; SANTOS, Maria" required />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título do Livro *</label>
                                        <input type="text" name="titulo" value={formData.titulo} onChange={handleChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subtítulo (opcional)</label>
                                        <input type="text" name="subtitulo" value={formData.subtitulo} onChange={handleChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Edição</label>
                                        <input type="text" name="edicao" value={formData.edicao} onChange={handleChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="Ex: 2" />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Local (Cidade) *</label>
                                        <input type="text" name="local" value={formData.local} onChange={handleChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="Ex: São Paulo" required />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Editora *</label>
                                        <input type="text" name="editora" value={formData.editora} onChange={handleChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" required />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ano *</label>
                                        <input type="text" name="ano" value={formData.ano} onChange={handleChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="Ex: 2023" required />
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* CAMPOS PARA SITE/ARTIGO ONLINE */
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Autor(es) ou Organização * <span className="text-xs text-slate-500 font-normal">(Ex: SOBRENOME, Nome ou INSTITUIÇÃO)</span></label>
                                    <input type="text" name="autores" value={formData.autores} onChange={handleChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="Ex: INSTITUTO BRASILEIRO DE GEOGRAFIA E ESTATÍSTICA" required />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título da Página/Artigo *</label>
                                        <input type="text" name="titulo" value={formData.titulo} onChange={handleChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Site (opcional)</label>
                                        <input type="text" name="nomeSite" value={formData.nomeSite} onChange={handleChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="Ex: G1, Wikipedia..." />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ano (opcional)</label>
                                        <input type="text" name="ano" value={formData.ano} onChange={handleChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="Ex: 2023" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL (Link) *</label>
                                        <input type="url" name="url" value={formData.url} onChange={handleChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="https://..." required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data de Acesso *</label>
                                    <input type="text" name="dataAcesso" value={formData.dataAcesso} onChange={handleChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="Ex: 15 out. 2023" required />
                                </div>
                            </>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        form="ref-form"
                        className="px-6 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <Check size={18} />
                        Gerar Referência
                    </button>
                </div>
            </div>
        </div>
    );
}