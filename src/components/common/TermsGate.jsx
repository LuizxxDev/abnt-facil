import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Dialog from './Dialog';
import { btnPrimary, btnSecondary } from './ui';
import { TERMS_VERSION, TERMS_KEY } from '../../utils/constants';

// O aceite fica no navegador com a versão dos termos; quando os termos mudam, a pergunta volta
const readAccepted = () => {
    try {
        return JSON.parse(localStorage.getItem(TERMS_KEY) || 'null')?.versao === TERMS_VERSION;
    } catch {
        return false;
    }
};

const PONTOS = [
    'É uma ferramenta gratuita e independente, sem vínculo com a ABNT nem com o IFPA.',
    'A conferência automática cobre parte das normas: revise o trabalho e o manual da sua instituição antes de entregar.',
    'O conteúdo é seu, e você responde pela autoria, pelas citações e pelas imagens que usar.',
    'Sem conta, os documentos ficam só neste navegador. Baixe cópias de segurança.',
    'Para gerar o PDF, o documento passa pelo servidor e não é guardado lá.',
];

// Pergunta, antes do painel e do editor, se a pessoa aceita os termos de uso
export default function TermsGate({ children }) {
    const [accepted, setAccepted] = useState(readAccepted);
    const navigate = useNavigate();

    const accept = () => {
        try {
            localStorage.setItem(TERMS_KEY, JSON.stringify({ versao: TERMS_VERSION, em: new Date().toISOString() }));
        } catch {
            // Sem armazenamento (aba privada bloqueada): vale só para esta visita
        }
        setAccepted(true);
    };

    const decline = () => {
        toast('Para usar o editor, é preciso aceitar os termos de uso.');
        navigate('/', { replace: true });
    };

    if (accepted) return children;

    return (
        <Dialog open onClose={decline} title="Termos de uso" description="Antes de começar, leia o resumo e diga se você aceita."
            footer={<>
                <button type="button" onClick={decline} className={btnSecondary}>Não aceito</button>
                <button type="button" onClick={accept} className={btnPrimary} data-autofocus>Aceito os termos</button>
            </>}>
            <ol className="flex flex-col">
                {PONTOS.map((p, i) => (
                    <li key={p} className="flex gap-3 border-b border-line py-3 text-[15px] leading-relaxed text-ink last:border-b-0">
                        <span className="label-mono tabular mt-0.5 shrink-0 text-[12px] text-ink-3">{String(i + 1).padStart(2, '0')}</span>
                        {p}
                    </li>
                ))}
            </ol>
            <p className="mt-3 text-sm leading-relaxed text-ink-2">
                Leia a íntegra dos <Link to="/termos" className="font-semibold text-accent underline underline-offset-2">Termos de Uso</Link> e da <Link to="/privacidade" className="font-semibold text-accent underline underline-offset-2">Política de Privacidade</Link>. Se não aceitar, você volta para a página inicial e nada é salvo.
            </p>
        </Dialog>
    );
}
