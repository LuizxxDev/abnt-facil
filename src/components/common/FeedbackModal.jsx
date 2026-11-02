import React, { useState } from 'react';
import { Bug, Lightbulb, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import Dialog from './Dialog';
import { btnPrimary, btnGhost, field } from './ui';

const TYPES = [
    { value: 'bug', label: 'Algo deu errado', icon: Bug, placeholder: 'O que aconteceu? Em que parte do documento a formatação falhou?' },
    { value: 'suggestion', label: 'Ideia de melhoria', icon: Lightbulb, placeholder: 'O que falta no ABNTFácil para o seu trabalho?' },
];

export const FeedbackModal = ({ isOpen, onClose }) => {
    const [feedbackType, setFeedbackType] = useState('bug');
    const [feedbackText, setFeedbackText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSendFeedback = async (e) => {
        e.preventDefault();
        if (!feedbackText.trim()) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('feedback').insert([{ type: feedbackType, message: feedbackText }]);
            if (error) throw error;
            toast.success('Mensagem enviada. Obrigado pela ajuda.');
            setFeedbackText('');
            onClose();
        } catch (error) {
            console.error('Erro ao enviar feedback:', error);
            toast.error('Não foi possível enviar agora. Verifique a conexão e tente de novo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const current = TYPES.find(t => t.value === feedbackType);

    return (
        <Dialog open={isOpen} onClose={onClose} title="Fale com o desenvolvedor"
            description="Encontrou um erro ou tem uma ideia? Cada mensagem é lida."
            footer={<>
                <button type="button" onClick={onClose} disabled={isSubmitting} className={btnGhost}>Cancelar</button>
                <button type="submit" form="feedback-form" disabled={!feedbackText.trim() || isSubmitting} className={btnPrimary}>
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
                    {isSubmitting ? 'Enviando…' : 'Enviar mensagem'}
                </button>
            </>}>
            <form id="feedback-form" onSubmit={handleSendFeedback} className="space-y-4 pt-2">
                <div role="radiogroup" aria-label="Tipo de mensagem" className="grid grid-cols-2 gap-1 rounded-[var(--radius-control)] bg-surface-2 p-1">
                    {TYPES.map((t) => {
                        const Icon = t.icon;
                        return (
                            <button key={t.value} type="button" role="radio" aria-checked={feedbackType === t.value} onClick={() => setFeedbackType(t.value)}
                                className={`flex h-10 items-center justify-center gap-2 rounded-[4px] text-sm font-semibold transition-[background-color,color] duration-150 ${feedbackType === t.value ? 'bg-surface text-ink shadow-[0_1px_2px_rgb(28_27_25/0.12)]' : 'text-ink-2 hover:text-ink'}`}>
                                <Icon size={16} aria-hidden="true" /> {t.label}
                            </button>
                        );
                    })}
                </div>
                <textarea
                    data-autofocus
                    aria-label="Mensagem"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder={current.placeholder}
                    className={`${field} h-36 resize-none leading-relaxed`}
                    disabled={isSubmitting}
                />
            </form>
        </Dialog>
    );
};
