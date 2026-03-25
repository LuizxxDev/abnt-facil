import React, { useState } from 'react';
import { MessageSquare, X, Bug, Heart, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

export const FeedbackModal = ({ isOpen, onClose }) => {
    const [feedbackType, setFeedbackType] = useState('bug');
    const [feedbackText, setFeedbackText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSendFeedback = async () => {
        if (!feedbackText.trim()) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('feedback').insert([{ type: feedbackType, message: feedbackText }]);
            if (error) throw error;
            toast.success('Feedback enviado com sucesso! Muito obrigado pela ajuda.');
            setFeedbackText('');
            onClose();
        } catch (error) {
            console.error('Erro ao enviar feedback:', error);
            toast.error('Ocorreu um erro ao enviar o feedback. Tente novamente mais tarde.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <MessageSquare size={20} className="text-blue-500"/> Enviar Feedback
                    </h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors bg-slate-100 dark:bg-slate-800 p-2 rounded-full focus:outline-none">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 space-y-6 flex-1">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        Encontrou algum erro no editor ou tem uma ideia para melhorar a plataforma? A sua ajuda é vital!
                    </p>

                    <div className="flex gap-2 p-1.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                        <button
                            onClick={() => setFeedbackType('bug')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold transition-all focus:outline-none ${feedbackType === 'bug' ? 'bg-white dark:bg-slate-800 text-red-500 dark:text-red-400 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            <Bug size={16}/> Reportar Bug
                        </button>
                        <button
                            onClick={() => setFeedbackType('suggestion')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold transition-all focus:outline-none ${feedbackType === 'suggestion' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            <Heart size={16}/> Sugerir Melhoria
                        </button>
                    </div>

                    <div>
                        <textarea
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder={feedbackType === 'bug' ? 'Descreva o problema ou onde a formatação falhou...' : 'O que acha que falta no ABNTFácil?'}
                            className="w-full h-36 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none font-medium disabled:opacity-50"
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
                    <button onClick={onClose} disabled={isSubmitting} className="px-5 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors focus:outline-none disabled:opacity-50">
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSendFeedback}
                        disabled={!feedbackText.trim() || isSubmitting}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] flex items-center gap-2 focus:outline-none"
                    >
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16}/>} 
                        {isSubmitting ? 'A enviar...' : 'Enviar'}
                    </button>
                </div>
            </div>
        </div>
    );
};