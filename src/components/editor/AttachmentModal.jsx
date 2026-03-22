import React, { useState, useEffect } from 'react';
import { X, Layers, Plus, AlignLeft, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AttachmentModal = ({ isOpen, onClose, type, currentText, onAdd }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [nextLetter, setNextLetter] = useState('A');

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setContent('');
            
            // Lógica inteligente para descobrir a próxima letra (A, B, C...)
            const label = type === 'apendice' ? 'APÊNDICE' : 'ANEXO';
            const regex = new RegExp(`${label} ([A-Z])`, 'g');
            let matches;
            let lastChar = '@'; // ASCII 64, o próximo será 'A' (65)
            
            while ((matches = regex.exec(currentText || '')) !== null) {
                if (matches[1] > lastChar) lastChar = matches[1];
            }
            
            // Incrementa uma letra no alfabeto
            setNextLetter(String.fromCharCode(lastChar.charCodeAt(0) + 1));
        }
    }, [isOpen, type, currentText]);

    if (!isOpen) return null;

    const isApendice = type === 'apendice';
    const label = isApendice ? 'Apêndice' : 'Anexo';
    const labelUpper = isApendice ? 'APÊNDICE' : 'ANEXO';

    const handleAdd = () => {
        if (!title.trim()) {
            toast.error('O título é obrigatório.');
            return;
        }
        if (!content.trim()) {
            toast.error('O conteúdo não pode estar vazio.');
            return;
        }

        const formattedString = `**${labelUpper} ${nextLetter} - ${title.toUpperCase()}**\n\n${content}`;
        
        onAdd(formattedString);
        toast.success(`${label} ${nextLetter} gerado com sucesso!`);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <div>
                        <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <Layers size={18} className={isApendice ? 'text-purple-500' : 'text-orange-500'}/> 
                            Gerador de {label}
                        </h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">
                            {isApendice ? 'Material do próprio autor' : 'Material de terceiros'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-full">
                        <X size={18} />
                    </button>
                </div>
                
                {/* Body */}
                <div className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[70vh]">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl p-3 flex gap-3 text-blue-800 dark:text-blue-300">
                        <HelpCircle size={16} className="shrink-0 mt-0.5 text-blue-500"/>
                        <p className="text-xs">
                            A sequência é automática. Este será o teu <strong>{labelUpper} {nextLetter}</strong>. 
                            Podes colar texto, questionários ou usar as tags de imagem <code>[IMAGEM]: Título | Fonte | URL</code> no conteúdo.
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Título do {label}</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={`Ex: ${isApendice ? 'Questionário aplicado aos alunos' : 'Lei nº 12.345/2010'}`}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-green-500 dark:focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase ml-1 flex items-center gap-1"><AlignLeft size={12}/> Conteúdo</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={`Cole o conteúdo do seu ${label.toLowerCase()} aqui...`}
                            className="w-full h-40 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-green-500 dark:focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
                        Cancelar
                    </button>
                    <button 
                        onClick={handleAdd}
                        className="bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-green-900/20 flex items-center gap-2"
                    >
                        <Plus size={16}/> Gerar e Inserir
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AttachmentModal;