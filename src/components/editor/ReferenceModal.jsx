import React, { useState } from 'react';
import { Book, Globe, Check, FileText, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import Dialog from '../common/Dialog';
import { btnPrimary, btnGhost, field, label as labelCls } from '../common/ui';

// Campo com rótulo visível e dica opcional
const RefInput = ({ label, hint, name, ...props }) => (
    <div>
        <label htmlFor={`ref-${name}`} className={labelCls}>
            {label} {hint && <span className="font-normal text-ink-3">{hint}</span>}
        </label>
        <input id={`ref-${name}`} name={name} autoComplete="off" className={field} {...props} />
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

        const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // NBR 6023:2018 — "SOBRENOME, Prenome": só o sobrenome em maiúsculas; autores separados por ponto e vírgula
    const formatAuthors = (raw) => raw.split(';').map(a => a.trim()).filter(Boolean).map(a => {
        const comma = a.indexOf(',');
        if (comma === -1) return a.toUpperCase(); // entidade (ex.: BRASIL, UNIVERSIDADE FEDERAL DO PARÁ)
        return `${a.slice(0, comma).trim().toUpperCase()}, ${a.slice(comma + 1).trim()}`;
    }).join('; ');

    // "2024-03-15" ou "15/03/2024" → "15 mar. 2024" (meses abreviados da NBR 6023)
    const MESES = ['jan.', 'fev.', 'mar.', 'abr.', 'maio', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
    const formatAccessDate = (raw) => {
        const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        const br = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        const [d, m, y] = iso ? [iso[3], iso[2], iso[1]] : br ? [br[1], br[2], br[3]] : [];
        if (!y || !MESES[Number(m) - 1]) return raw;
        return `${Number(d)} ${MESES[Number(m) - 1]} ${y}`;
    };

    const handleGenerate = (e) => {
        e.preventDefault();
        let referenceStr = '';
        const autores = formatAuthors(formData.autores);
        const titulo = `**${formData.titulo}**${formData.subtitulo ? `: ${formData.subtitulo}` : ''}`;

        if (refType === 'book') {
            if (!formData.autores || !formData.titulo || !formData.local || !formData.editora || !formData.ano) return toast.error("Preencha os campos obrigatórios (*)");
            referenceStr = `${autores}. ${titulo}. ${formData.edicao ? `${formData.edicao}. ed. ` : ''}${formData.local}: ${formData.editora}, ${formData.ano}.`;

        } else if (refType === 'website') {
            if (!formData.autores || !formData.titulo || !formData.url || !formData.dataAcesso) return toast.error("Preencha os campos obrigatórios (*)");
            referenceStr = `${autores}. ${titulo}. ${formData.nomeSite ? `${formData.nomeSite}, ` : ''}${formData.ano ? `${formData.ano}. ` : ''}Disponível em: ${formData.url}. Acesso em: ${formatAccessDate(formData.dataAcesso.trim())}.`;

        } else if (refType === 'article') {
            if (!formData.autores || !formData.titulo || !formData.revista || !formData.local || !formData.ano) return toast.error("Preencha os campos obrigatórios (*)");
            // No artigo, o destaque vai no nome do periódico, não no título do artigo
            let artStr = `${autores}. ${formData.titulo}${formData.subtitulo ? `: ${formData.subtitulo}` : ''}. **${formData.revista}**, ${formData.local}, `;
            if (formData.volume) artStr += `v. ${formData.volume}, `;
            if (formData.numero) artStr += `n. ${formData.numero}, `;
            if (formData.paginas) artStr += `p. ${formData.paginas}, `;
            artStr += `${formData.ano}.`;
            if (formData.doi) artStr += ` DOI: ${formData.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, '')}.`;
            referenceStr = artStr;

        } else if (refType === 'thesis') {
            if (!formData.autores || !formData.titulo || !formData.ano || !formData.curso || !formData.instituicao || !formData.local) return toast.error("Preencha os campos obrigatórios (*)");
            referenceStr = `${autores}. ${titulo}. ${formData.ano}. ${formData.tipoTrabalho} (${formData.grau} em ${formData.curso}) – ${formData.instituicao}, ${formData.local}, ${formData.ano}.`;
        }

        if (onAddReference) onAddReference(referenceStr);
        toast.success("Referência adicionada à lista");
        
        setFormData({ 
            autores: '', titulo: '', subtitulo: '', edicao: '', local: '', editora: '', ano: '', 
            nomeSite: '', url: '', dataAcesso: '', revista: '', volume: '', numero: '', paginas: '', doi: '',
            tipoTrabalho: 'Trabalho de Conclusão de Curso', grau: 'Bacharelado', curso: '', instituicao: '' 
        });
        onClose();
    };

    const tabs = [
        { id: 'book', label: 'Livro', icon: Book },
        { id: 'website', label: 'Site', icon: Globe },
        { id: 'article', label: 'Artigo', icon: FileText },
        { id: 'thesis', label: 'TCC ou tese', icon: GraduationCap }
    ];

    return (
        <Dialog open={isOpen} onClose={onClose} title="Gerar referência" description="Preencha os campos e a referência sai no formato da NBR 6023:2018." size="lg"
            footer={<>
                <button type="button" onClick={onClose} className={btnGhost}>Cancelar</button>
                <button type="submit" form="ref-form" className={btnPrimary}><Check size={16} aria-hidden="true" /> Gerar referência</button>
            </>}>
                    <div role="radiogroup" aria-label="Tipo de obra" className="mb-6 mt-2 grid grid-cols-2 gap-1 rounded-[var(--radius-control)] bg-surface-2 p-1 sm:grid-cols-4">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = refType === tab.id;
                            return (
                                <button
                                    key={tab.id} type="button" role="radio" aria-checked={isActive} onClick={() => setRefType(tab.id)}
                                    className={`flex h-10 items-center justify-center gap-2 rounded-[4px] text-sm font-semibold transition-[background-color,color] duration-150 ${isActive ? 'bg-surface text-ink shadow-[0_1px_2px_rgb(28_27_25/0.12)]' : 'text-ink-2 hover:text-ink'}`}
                                >
                                    <Icon size={16} aria-hidden="true" /> {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    <form id="ref-form" onSubmit={handleGenerate} className="space-y-4">
                        {refType === 'book' && (
                            <>
                                <RefInput label="Autor(es) *" hint="(Sobrenome, Nome; vários separados por ;)" name="autores" value={formData.autores} onChange={handleChange} placeholder="Ex.: Silva, João; Souza, Maria" required />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <RefInput label="Título do Livro *" name="titulo" value={formData.titulo} onChange={handleChange} required />
                                    <RefInput label="Subtítulo" hint="(opcional)" name="subtitulo" value={formData.subtitulo} onChange={handleChange} />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <RefInput label="Edição" name="edicao" value={formData.edicao} onChange={handleChange} placeholder="Ex.: 2" />
                                    <RefInput label="Local *" name="local" value={formData.local} onChange={handleChange} placeholder="Ex.: São Paulo" required />
                                    <RefInput label="Editora *" name="editora" value={formData.editora} onChange={handleChange} required />
                                    <RefInput label="Ano *" name="ano" value={formData.ano} onChange={handleChange} placeholder="Ex.: 2023" required />
                                </div>
                            </>
                        )}

                        {refType === 'website' && (
                            <>
                                <RefInput label="Autor / Organização *" hint="(Ex.: IBGE)" name="autores" value={formData.autores} onChange={handleChange} placeholder="Ex.: INSTITUTO BRASILEIRO DE GEOGRAFIA E ESTATÍSTICA" required />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <RefInput label="Título da Página *" name="titulo" value={formData.titulo} onChange={handleChange} required />
                                    <RefInput label="Nome do Site" hint="(opcional)" name="nomeSite" value={formData.nomeSite} onChange={handleChange} placeholder="Ex.: G1, Wikipedia…" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <RefInput label="Ano" hint="(opcional)" name="ano" value={formData.ano} onChange={handleChange} placeholder="Ex.: 2023" />
                                    <div className="md:col-span-3">
                                        <RefInput label="URL (Link) *" type="url" name="url" value={formData.url} onChange={handleChange} placeholder="https://…" inputMode="url" spellCheck={false} required />
                                    </div>
                                </div>
                                <RefInput label="Data de Acesso *" name="dataAcesso" value={formData.dataAcesso} onChange={handleChange} placeholder="Ex.: 15 out. 2023" required />
                            </>
                        )}

                        {refType === 'article' && (
                            <>
                                <RefInput label="Autor(es) *" hint="(Sobrenome, Nome; vários separados por ;)" name="autores" value={formData.autores} onChange={handleChange} placeholder="Ex.: Silva, João; Souza, Maria" required />
                                <RefInput label="Título do Artigo *" name="titulo" value={formData.titulo} onChange={handleChange} required />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <RefInput label="Nome da Revista/Periódico *" name="revista" value={formData.revista} onChange={handleChange} placeholder="Ex.: Revista IEEE, Nature…" required />
                                    <RefInput label="Local de Publicação *" name="local" value={formData.local} onChange={handleChange} placeholder="Ex.: São Paulo" required />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <RefInput label="Volume" name="volume" value={formData.volume} onChange={handleChange} placeholder="Ex.: 12" />
                                    <RefInput label="Número" name="numero" value={formData.numero} onChange={handleChange} placeholder="Ex.: 4" />
                                    <RefInput label="Páginas" name="paginas" value={formData.paginas} onChange={handleChange} placeholder="Ex.: 45-60" />
                                    <RefInput label="Ano *" name="ano" value={formData.ano} onChange={handleChange} required />
                                    <RefInput label="DOI" hint="(Opcional)" name="doi" value={formData.doi} onChange={handleChange} />
                                </div>
                            </>
                        )}

                        {refType === 'thesis' && (
                            <>
                                <RefInput label="Autor *" hint="(Ex.: SOBRENOME, Nome)" name="autores" value={formData.autores} onChange={handleChange} required />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <RefInput label="Título da Tese/TCC *" name="titulo" value={formData.titulo} onChange={handleChange} required />
                                    <RefInput label="Subtítulo" hint="(opcional)" name="subtitulo" value={formData.subtitulo} onChange={handleChange} />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div>
                                        <label htmlFor="ref-tipoTrabalho" className={labelCls}>Tipo de trabalho *</label>
                                        <select id="ref-tipoTrabalho" name="tipoTrabalho" value={formData.tipoTrabalho} onChange={handleChange} className={field}>
                                            <option value="Trabalho de Conclusão de Curso">TCC</option><option value="Dissertação">Dissertação</option><option value="Tese">Tese</option><option value="Monografia">Monografia</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="ref-grau" className={labelCls}>Grau obtido *</label>
                                        <select id="ref-grau" name="grau" value={formData.grau} onChange={handleChange} className={field}>
                                            <option value="Bacharelado">Bacharelado</option><option value="Licenciatura">Licenciatura</option><option value="Mestrado">Mestrado</option><option value="Doutorado">Doutorado</option><option value="Especialização">Especialização</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <RefInput label="Nome do Curso *" name="curso" value={formData.curso} onChange={handleChange} placeholder="Ex.: Eng. de Controle e Automação" required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <RefInput label="Instituição *" name="instituicao" value={formData.instituicao} onChange={handleChange} placeholder="Ex.: IFPA" required />
                                    <RefInput label="Local de Defesa *" name="local" value={formData.local} onChange={handleChange} placeholder="Ex.: Belém" required />
                                    <RefInput label="Ano de Defesa *" name="ano" value={formData.ano} onChange={handleChange} placeholder="Ex.: 2024" required />
                                </div>
                            </>
                        )}
                    </form>
        </Dialog>
    );
}
