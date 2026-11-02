import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Dialog from '../common/Dialog';
import { btnPrimary, btnGhost, field, label as labelCls, help } from '../common/ui';

// Próxima letra da sequência (APÊNDICE A, B, C…) a partir do que já existe no texto
const nextLetterFor = (type, currentText) => {
    const label = type === 'apendice' ? 'APÊNDICE' : 'ANEXO';
    const regex = new RegExp(`${label} ([A-Z])`, 'g');
    let lastChar = '@'; // o caractere seguinte a '@' é 'A'
    let matches;
    while ((matches = regex.exec(currentText || '')) !== null) {
        if (matches[1] > lastChar) lastChar = matches[1];
    }
    return String.fromCharCode(lastChar.charCodeAt(0) + 1);
};

// Montado só enquanto aberto: os campos recomeçam vazios a cada abertura
const AttachmentModal = (props) => (props.isOpen ? <AttachmentModalContent {...props} /> : null);

const AttachmentModalContent = ({ onClose, type, currentText, onAdd }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const nextLetter = useMemo(() => nextLetterFor(type, currentText), [type, currentText]);

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
        toast.success(`${label} ${nextLetter} inserido.`);
    };

    return (
        <Dialog open onClose={onClose} title={`Novo ${label.toLowerCase()}: ${labelUpper} ${nextLetter}`}
            description={`${isApendice ? 'Material do próprio autor' : 'Material de terceiros'}. A letra segue a sequência do documento.`}
            footer={<>
                <button type="button" onClick={onClose} className={btnGhost}>Cancelar</button>
                <button type="button" onClick={handleAdd} className={btnPrimary}><Plus size={16} aria-hidden="true" /> Inserir {label.toLowerCase()}</button>
            </>}>
            <div className="space-y-5 pt-2">
                <div>
                    <label htmlFor="anexo-titulo" className={labelCls}>Título do {label.toLowerCase()}</label>
                    <input
                        id="anexo-titulo"
                        data-autofocus
                        type="text"
                        autoComplete="off"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={`Ex.: ${isApendice ? 'Questionário aplicado aos alunos' : 'Lei nº 12.345/2010'}`}
                        className={field}
                    />
                </div>
                <div>
                    <label htmlFor="anexo-conteudo" className={labelCls}>Conteúdo</label>
                    <textarea
                        id="anexo-conteudo"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={`Cole aqui o texto do ${label.toLowerCase()}…`}
                        className={`${field} h-40 resize-none`}
                    />
                    <p className={help}>Aceita texto, questionários e imagens com <span translate="no">[IMAGEM]: Título | Fonte | URL</span>.</p>
                </div>
            </div>
        </Dialog>
    );
};

export default AttachmentModal;