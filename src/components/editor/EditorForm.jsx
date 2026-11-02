import React, { useRef, useMemo, useState, useId } from 'react';
import {
  Trash2, Wand2, Lightbulb,
  Quote, Image as ImageIcon, TableIcon, Box, GripVertical,
  Plus, ArrowRight, ChevronLeft, ChevronRight, Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { SECTION_GUIDES, SECTION_TEMPLATES, ESTADOS_BR } from '../../utils/constants';
import { orderedLines, citationFor } from '../../utils/documentContent';
import { generateId } from '../../utils/helpers';
import { DOCUMENT_TYPES, getDocType, getDocTypeKey, hasElement, isRequired } from '../../utils/documentTypes';
import { EditorToolbar } from './EditorToolbar';
import { useAppContext } from '../../contexts/AppContext';
import { ConfirmDialog } from '../common/Dialog';
import { field, fieldBase, iconBtn, help } from '../common/ui';

// -- Componentes internos --

// Campo com rótulo visível (o placeholder fica só como exemplo)
const Field = ({ label, hint, children, className = '' }) => {
    const id = useId();
    return (
        <div className={className}>
            <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
            {React.cloneElement(children, { id })}
            {hint && <p className={help}>{hint}</p>}
        </div>
    );
};

// Com largura própria (w-24, w-28…) o campo não pode levar o w-full, senão a largura dada perde
const Input = ({ className = '', ...props }) => <input autoComplete="off" {...props} className={`${/(^|\s)w-/.test(className) ? `${fieldBase} shrink-0` : field} ${className}`} />;
const TextArea = ({ className = '', ...props }) => <textarea {...props} className={`${field} write-area min-h-24 resize-y leading-relaxed ${className}`} />;

const SectionTitle = ({ children, action }) => (
    <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-bold tracking-[-0.01em]">{children}</h2>
        {action}
    </div>
);

// Ação secundária em texto, ao lado de um título
const TextAction = ({ children, ...props }) => (
    <button type="button" {...props} className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-control)] px-2 text-sm font-semibold text-accent transition-colors duration-150 hover:bg-accent-soft pointer-coarse:h-10">{children}</button>
);

// "+ Adicionar …" ao fim de uma lista de campos
const AddButton = ({ children, ...props }) => (
    <button type="button" {...props} className="flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] text-sm font-semibold text-ink-2 border border-dashed border-line transition-colors duration-150 hover:bg-surface-2 hover:text-ink">
        <Plus size={16} aria-hidden="true" /> {children}
    </button>
);

const WordCounter = ({ text, min = 150, max = 500 }) => {
    const count = useMemo(() => {
        if (!text || typeof text !== 'string') return 0;
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }, [text]);

    let tone = 'text-ink-3';
    let status = `${min} a ${max} palavras`;
    if (count > 0 && count < min) { tone = 'text-warn'; status = `curto, mínimo ${min}`; }
    else if (count >= min && count <= max) { tone = 'text-accent'; status = 'dentro da norma'; }
    else if (count > max) { tone = 'text-danger'; status = `longo, máximo ${max}`; }

    return <p className={`tabular mt-1.5 text-right text-xs font-medium ${tone}`} aria-live="polite">{count} {count === 1 ? 'palavra' : 'palavras'} · {status}</p>;
};

const LEVEL_NAMES = { 1: 'primária', 2: 'secundária', 3: 'terciária', 4: 'quaternária', 5: 'quinária' };

const INSERTS = [
    { type: 'cit', label: 'Citação', icon: Quote },
    { type: 'img', label: 'Figura', icon: ImageIcon },
    { type: 'tab', label: 'Tabela', icon: TableIcon },
    { type: 'box', label: 'Quadro', icon: Box },
];

const SortableSection = ({ s, i, isReadOnly, focusedSection, setFocusedSection, insertTemplate, onDelete, onOpenAssetModal, onUpdate, onAddSubsection, onOpenRefModal }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id });
    const textareaRef = useRef(null);
    const titleId = useId();

    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto', opacity: isDragging ? 0.6 : 1 };

    const handleToolbarAction = (action) => {
        if (action.action === 'open_ref_modal') { onOpenRefModal(); return; }
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = s.conteudo || '';
        const selectedText = text.substring(start, end);

        let newText = text;
        let newCursorPos = end;

        if (action.syntax) {
            newText = `${text.substring(0, start)}${action.syntax}${selectedText}${action.syntax}${text.substring(end)}`;
            newCursorPos = end + (action.syntax.length * 2);
        } else if (action.wrap) {
            // Nota de rodapé: o cursor fica dentro dos colchetes para digitar o texto da nota
            const [open, close] = action.wrap;
            newText = `${text.substring(0, start)}${open}${selectedText}${close}${text.substring(end)}`;
            newCursorPos = start + open.length + selectedText.length;
        } else if (action.prefix) {
            const prefix = start > 0 ? `\n\n${action.prefix}` : action.prefix;
            newText = `${text.substring(0, start)}${prefix}${selectedText}${text.substring(end)}`;
            newCursorPos = start + prefix.length + selectedText.length;
        }

        onUpdate(i, 'conteudo', newText);
        setTimeout(() => { textarea.focus(); textarea.setSelectionRange(newCursorPos, newCursorPos); }, 0);
    };

    const currentLevel = Number(s.level) || 1;
    const guideKey = Object.keys(SECTION_GUIDES).find(k => s.titulo.toUpperCase().includes(k));
    const hasTemplate = Object.keys(SECTION_TEMPLATES).some(k => s.titulo.toUpperCase().includes(k));

    return (
        // Subseções: recuo e uma linha-guia fina, como num sumário
        <section ref={setNodeRef} id={`edit-sec-${s.id}`} style={{ ...style, marginLeft: `${(currentLevel - 1) * 0.875}rem` }} aria-labelledby={titleId}
            className={`scroll-mt-4 bg-surface py-6 ${currentLevel > 1 ? 'border-l border-line pl-4' : ''}`}>
            <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1">
                    {!isReadOnly && (
                        <button type="button" {...attributes} {...listeners} aria-label="Arrastar para mudar a ordem da seção" className={`${iconBtn} -ml-2 size-8 cursor-grab touch-none text-ink-3 active:cursor-grabbing`}><GripVertical size={16} /></button>
                    )}
                    <span className="text-xs text-ink-3">Seção {LEVEL_NAMES[currentLevel] || 'secundária'}</span>
                </div>
                <div className="-mr-2 flex items-center">
                    {!isReadOnly && (
                        <>
                            <button type="button" onClick={() => onUpdate(i, 'level', Math.max(1, currentLevel - 1))} disabled={currentLevel === 1} aria-label="Subir um nível (menos recuo)" title="Subir um nível" className={`${iconBtn} size-8`}><ChevronLeft size={16} /></button>
                            <span className="tabular w-5 text-center text-xs font-semibold text-ink-2" aria-label={`Nível ${currentLevel}`}>{currentLevel}</span>
                            <button type="button" onClick={() => onUpdate(i, 'level', Math.min(5, currentLevel + 1))} disabled={currentLevel === 5} aria-label="Descer um nível (mais recuo)" title="Descer um nível" className={`${iconBtn} size-8`}><ChevronRight size={16} /></button>
                        </>
                    )}
                    {!isReadOnly && hasTemplate && <button type="button" onClick={() => insertTemplate(i, s.titulo)} aria-label="Inserir texto-modelo desta seção" title="Inserir texto-modelo" className={`${iconBtn} size-8`}><Wand2 size={16} /></button>}
                    {!isReadOnly && <button type="button" onClick={() => onDelete(s.id, s.titulo)} aria-label={`Remover a seção ${s.titulo || 'sem título'}`} title="Remover seção" className={`${iconBtn} size-8 hover:bg-danger-soft hover:text-danger`}><Trash2 size={16} /></button>}
                </div>
            </div>

            <input
                id={titleId}
                readOnly={isReadOnly}
                aria-label="Título da seção"
                autoComplete="off"
                className={`w-full border-b border-line bg-transparent pb-2 text-base font-bold tracking-[-0.01em] text-ink outline-none transition-colors duration-150 placeholder:font-normal focus:border-accent ${currentLevel === 1 ? 'uppercase' : ''}`}
                value={s.titulo}
                onChange={e => onUpdate(i, 'titulo', e.target.value)}
                placeholder={currentLevel === 1 ? 'TÍTULO DA SEÇÃO' : 'Título da subseção'}
            />

            {!isReadOnly && <div className="mt-2"><EditorToolbar onAction={handleToolbarAction} /></div>}

            <textarea
                ref={textareaRef}
                readOnly={isReadOnly}
                aria-label={`Texto da seção ${s.titulo || 'sem título'}`}
                onFocus={() => setFocusedSection(s.titulo)}
                onBlur={() => setFocusedSection(null)}
                placeholder="Escreva aqui. Uma linha em branco começa um novo parágrafo."
                className="write-area mt-1 block min-h-64 w-full resize-y rounded-[var(--radius-control)] bg-transparent px-0 py-2 font-serif text-[1.0625rem] leading-[1.65] text-ink outline-none placeholder:text-ink-3 focus:bg-paper/60"
                value={s.conteudo}
                onChange={e => onUpdate(i, 'conteudo', e.target.value)}
            />

            {focusedSection === s.titulo && guideKey && (
                <p className="fade-in mt-2 flex gap-2 rounded-[var(--radius-control)] bg-accent-soft px-3 py-2 text-sm text-ink">
                    <Lightbulb size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" /> {SECTION_GUIDES[guideKey]}
                </p>
            )}

            {!isReadOnly && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="-ml-2 flex flex-wrap gap-0.5" role="group" aria-label="Inserir no texto">
                        {INSERTS.map((it) => {
                            const Icon = it.icon;
                            return (
                                <button key={it.type} type="button" onClick={() => onOpenAssetModal(it.type, i)} className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-control)] px-2 text-sm font-medium text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink pointer-coarse:h-10">
                                    <Icon size={16} aria-hidden="true" /> {it.label}
                                </button>
                            );
                        })}
                    </div>
                    {currentLevel < 5 && (
                        <button type="button" onClick={() => onAddSubsection(i, currentLevel)} className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-control)] px-2 text-sm font-semibold text-accent transition-colors duration-150 hover:bg-accent-soft pointer-coarse:h-10">
                            <Plus size={16} aria-hidden="true" /> Subseção
                        </button>
                    )}
                </div>
            )}
        </section>
    );
};

const EditorForm = ({ data, setData, authors, setAuthors, settings, isReadOnly, focusedSection, setFocusedSection, onOpenAssetModal, onOpenRefModal, onOpenAttachmentModal, panel = 'capitulos', next }) => {
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setData(prev => {
                const oldIndex = prev.secoes.findIndex(s => s.id === active.id);
                const newIndex = prev.secoes.findIndex(s => s.id === over.id);
                return { ...prev, secoes: arrayMove(prev.secoes, oldIndex, newIndex) };
            });
            toast.success('Ordem atualizada');
        }
    };

    const handleUpdateSection = (index, field, value) => {
        setData(prev => ({ ...prev, secoes: prev.secoes.map((sec, i) => i === index ? { ...sec, [field]: value } : sec) }));
    };

    const handleAddSubsection = (currentIndex, parentLevel) => {
        setData(prev => {
            const newLevel = Math.min(5, parentLevel + 1);
            const newSecoes = [...prev.secoes];
            newSecoes.splice(currentIndex + 1, 0, { id: generateId(), titulo: `Nova Seção Nível ${newLevel}`, conteudo: '', level: newLevel });
            return { ...prev, secoes: newSecoes };
        });
    };

    const handleAddSection = () => {
        setData(prev => ({ ...prev, secoes: [...prev.secoes, { id: generateId(), titulo: 'NOVA SEÇÃO', conteudo: '', level: 1 }] }));
    };

    const [pendingDelete, setPendingDelete] = useState(null);
    const handleDeleteSection = (id, titulo) => setPendingDelete({ id, titulo });

    const insertTemplate = (index, sectionTitle) => {
        if(isReadOnly) return;
        const key = Object.keys(SECTION_TEMPLATES).find(k => sectionTitle.toUpperCase().includes(k));
        
        if (key) {
            setData(prev => {
                const newSecoes = [...prev.secoes];
                newSecoes[index] = { ...newSecoes[index], conteudo: (newSecoes[index].conteudo + "\n\n" + SECTION_TEMPLATES[key]).trim() };
                return { ...prev, secoes: newSecoes };
            });
            toast.success('Texto-modelo inserido');
        } else {
            toast.error('Não há texto-modelo para este título.');
        }
    };

    const updateField = (field, value) => setData(prev => ({ ...prev, [field]: value }));

    // Perfil acadêmico: guarda os dados da instituição para os próximos documentos ou aplica-os neste
    const { setSettings } = useAppContext();
    const perfil = settings.perfil || {};
    const hasPerfil = Boolean(perfil.instituicao?.trim());
    const salvarPerfil = () => {
        setSettings(prev => ({ ...prev, perfil: {
            instituicao: data.instituicao || '', curso: data.curso || '', cidade: data.cidade || '', estado: data.estado || 'PA',
            orientador: (data.orientadores || [])[0] || '',
        } }));
        toast.success('Perfil salvo. Os próximos documentos já começam com estes dados.');
    };
    const aplicarPerfil = () => {
        setData(prev => ({
            ...prev,
            instituicao: perfil.instituicao || prev.instituicao, curso: perfil.curso || prev.curso,
            cidade: perfil.cidade || prev.cidade, estado: perfil.estado || prev.estado,
            orientadores: perfil.orientador && !(prev.orientadores || []).some(o => o?.trim()) ? [perfil.orientador] : prev.orientadores,
        }));
        toast.success('Dados do perfil aplicados.');
    };

    const docType = getDocType(data);
    const typeKey = getDocTypeKey(data);
    const tag = (el) => isRequired(docType, el) ? 'Obrigatório' : 'Opcional';
    const [resumoMin, resumoMax] = docType.resumoWords || [100, 500];
    const banca = data.banca || [];

    const updateBanca = (index, field, value) => setData(prev => {
        const n = [...(prev.banca || [])];
        n[index] = { ...n[index], [field]: value };
        return { ...prev, banca: n };
    });

    const gerarNatureza = () => {
        if (!docType.natureza) return;
        updateField('naturezaTrabalho', docType.natureza({ curso: data.curso, instituicao: data.instituicao }));
        toast.success('Texto gerado. Complete os campos entre [colchetes].');
    };

    const authorsLabel = authors.length > 1 ? 'Autores' : 'Autor';
    const block = 'border-t border-line pt-6';

    return (
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-10 pt-6 sm:px-6">
            {panel === 'documento' && (
            <div className="space-y-8">
            <section>
              <Field label="Tipo de documento" hint={<><span className="tabular font-semibold text-ink-2">{docType.norma}</span>. {docType.description}</>}>
                <select disabled={isReadOnly} className={field} value={typeKey} onChange={e => updateField('tipoDocumento', e.target.value)}>
                  {Object.entries(DOCUMENT_TYPES).map(([key, t]) => <option key={key} value={key}>{t.label}</option>)}
                </select>
              </Field>
            </section>

            <section className={block}>
              <SectionTitle action={!isReadOnly && (
                  <div className="-mr-2 flex">
                    {hasPerfil && <TextAction onClick={aplicarPerfil} title="Preencher instituição, curso, cidade e orientador com o seu perfil">Usar meu perfil</TextAction>}
                    <TextAction onClick={salvarPerfil} title="Guardar instituição, curso, cidade e orientador para os próximos documentos">Salvar como perfil</TextAction>
                  </div>
              )}>Identificação</SectionTitle>
              <div className="space-y-4">
                {hasElement(docType, 'folhaRosto') && (
                  <>
                    <Field label="Instituição"><Input readOnly={isReadOnly} placeholder="Ex.: Universidade Federal do Pará" value={data.instituicao} onChange={e => updateField('instituicao', e.target.value)} /></Field>
                    <Field label="Curso ou programa"><Input readOnly={isReadOnly} placeholder="Ex.: Bacharelado em Engenharia Civil" value={data.curso} onChange={e => updateField('curso', e.target.value)} /></Field>
                  </>
                )}
                <Field label="Título do trabalho"><Input readOnly={isReadOnly} className="font-semibold" value={data.titulo} onChange={e => updateField('titulo', e.target.value)} /></Field>
                <Field label="Subtítulo (opcional)"><Input readOnly={isReadOnly} value={data.subtitulo} onChange={e => updateField('subtitulo', e.target.value)} /></Field>
                {hasElement(docType, 'tituloEn') && (
                  <Field label="Título em outro idioma (opcional)"><Input readOnly={isReadOnly} className="italic" value={data.tituloEn || ''} onChange={e => updateField('tituloEn', e.target.value)} /></Field>
                )}

                {hasElement(docType, 'folhaRosto') && (
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="natureza" className="text-sm font-medium text-ink">Natureza do trabalho <span className="font-normal text-ink-3">(folha de rosto)</span></label>
                      {!isReadOnly && docType.natureza && <TextAction onClick={gerarNatureza}><Wand2 size={14} aria-hidden="true" /> Gerar texto</TextAction>}
                    </div>
                    <TextArea id="natureza" readOnly={isReadOnly} placeholder="Ex.: Trabalho de Conclusão de Curso apresentado ao Instituto Federal do Pará…" value={data.naturezaTrabalho} onChange={e => updateField('naturezaTrabalho', e.target.value)} />
                  </div>
                )}

                {hasElement(docType, 'obraResenhada') && (
                  <Field label="Referência da obra resenhada (obrigatório)">
                    <TextArea readOnly={isReadOnly} placeholder="SOBRENOME, Nome. **Título da obra**. Edição. Local: Editora, ano." value={data.obraResenhada || ''} onChange={e => updateField('obraResenhada', e.target.value)} />
                  </Field>
                )}

                <div className="flex gap-2">
                  <Field label="Cidade" className="min-w-0 flex-1"><Input readOnly={isReadOnly} autoComplete="address-level2" value={data.cidade} onChange={e => updateField('cidade', e.target.value)} /></Field>
                  <Field label="Estado" className="w-24"><select disabled={isReadOnly} className={field} value={data.estado} onChange={e => updateField('estado', e.target.value)}>{ESTADOS_BR.map(u => <option key={u} value={u}>{u}</option>)}</select></Field>
                </div>

                {(docType.elements.capa === 'opc' || hasElement(docType, 'listas') || hasElement(docType, 'fichaCatalografica')) && (
                  <fieldset className="space-y-1">
                    <legend className="sr-only">Elementos opcionais</legend>
                    {docType.elements.capa === 'opc' && (
                      <label className="flex cursor-pointer items-start gap-3 py-1.5 text-sm text-ink">
                        <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[var(--accent-fill)]" disabled={isReadOnly} checked={data.incluirCapa !== false} onChange={e => updateField('incluirCapa', e.target.checked)} /> Incluir capa (opcional neste tipo)
                      </label>
                    )}
                    {hasElement(docType, 'listas') && (
                      <label className="flex cursor-pointer items-start gap-3 py-1.5 text-sm text-ink">
                        <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[var(--accent-fill)]" disabled={isReadOnly} checked={data.incluirListas !== false} onChange={e => updateField('incluirListas', e.target.checked)} /> Gerar listas de ilustrações e de tabelas
                      </label>
                    )}
                    {hasElement(docType, 'fichaCatalografica') && (
                      <>
                        <label className="flex cursor-pointer items-start gap-3 py-1.5 text-sm text-ink">
                          <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[var(--accent-fill)]" disabled={isReadOnly} checked={Boolean(data.fichaCatalografica)} onChange={e => updateField('fichaCatalografica', e.target.checked)} /> Incluir ficha catalográfica (verso da folha de rosto)
                        </label>
                        {data.fichaCatalografica && (
                          <Field className="pl-7" label="Classificação da biblioteca" hint="A ficha usa as palavras-chave como assuntos. A classificação (CDD/CDU) é fornecida pela biblioteca da instituição.">
                            <Input readOnly={isReadOnly} placeholder="Ex.: CDD 616.89" value={data.fichaCdd || ''} onChange={e => updateField('fichaCdd', e.target.value)} />
                          </Field>
                        )}
                      </>
                    )}
                  </fieldset>
                )}
              </div>
            </section>

            <section className={block}>
                <SectionTitle action={!isReadOnly && authors.length > 1 && <TextAction onClick={() => setAuthors([...authors].sort())}>Ordenar A–Z</TextAction>}>{authorsLabel}</SectionTitle>
                <ul className="space-y-2">
                    {authors.map((a, i) => (
                        <li key={i} className="flex gap-1">
                            <Input readOnly={isReadOnly} aria-label={`Nome completo do autor ${i + 1}`} autoComplete="name" className="min-w-0 flex-1" value={a} onChange={e => { const n = [...authors]; n[i] = e.target.value; setAuthors(n); }} placeholder="Nome completo" />
                            {!isReadOnly && authors.length > 1 && <button type="button" onClick={() => setAuthors(authors.filter((_, idx) => idx !== i))} aria-label={`Remover ${a || `autor ${i + 1}`}`} className={`${iconBtn} size-11 hover:bg-danger-soft hover:text-danger`}><Trash2 size={16} /></button>}
                        </li>
                    ))}
                </ul>
                {!isReadOnly && <div className="mt-2"><AddButton onClick={() => setAuthors([...authors, ''])}>Adicionar autor</AddButton></div>}
                {hasElement(docType, 'notaAutores') && (
                    <Field className="mt-4" label="Nota de rodapé dos autores" hint="Uma linha por autor, na mesma ordem.">
                        <TextArea readOnly={isReadOnly} placeholder="Graduando em Engenharia pelo IFPA. E-mail: autor@email.com" value={data.notaAutores || ''} onChange={e => updateField('notaAutores', e.target.value)} />
                    </Field>
                )}
            </section>

            {hasElement(docType, 'folhaRosto') && (
            <section className={block}>
                <SectionTitle>Orientação</SectionTitle>
                <ul className="space-y-2">
                    {(data.orientadores || ['']).map((o, i) => (
                        <li key={i} className="flex gap-1">
                            <Input readOnly={isReadOnly} aria-label={i === 0 ? 'Orientador(a)' : `Coorientador(a) ${i}`} className="min-w-0 flex-1" value={o} onChange={e => { setData(prev => { const n = [...(prev.orientadores || [''])]; n[i] = e.target.value; return {...prev, orientadores: n}; }); }} placeholder={i === 0 ? 'Orientador(a): Prof. Dr. Nome' : 'Coorientador(a)'} />
                            {!isReadOnly && (data.orientadores || ['']).length > 1 && <button type="button" onClick={() => setData(prev => ({...prev, orientadores: prev.orientadores.filter((_, idx) => idx !== i)}))} aria-label={`Remover ${o || 'orientador'}`} className={`${iconBtn} size-11 hover:bg-danger-soft hover:text-danger`}><Trash2 size={16} /></button>}
                        </li>
                    ))}
                </ul>
                {!isReadOnly && <div className="mt-2"><AddButton onClick={() => setData(prev => ({...prev, orientadores: [...(prev.orientadores || ['']), '']}))}>Adicionar coorientador</AddButton></div>}
            </section>
            )}

            {hasElement(docType, 'folhaAprovacao') && (
            <section className={block}>
                <SectionTitle>Folha de aprovação <span className="text-sm font-normal text-ink-3">({tag('folhaAprovacao').toLowerCase()})</span></SectionTitle>
                <Field label="Data da aprovação" className="mb-4 max-w-56"><Input readOnly={isReadOnly} type="date" value={data.dataAprovacao || ''} onChange={e => updateField('dataAprovacao', e.target.value)} /></Field>
                <p className="mb-2 text-sm font-medium text-ink">Banca examinadora</p>
                <ul className="space-y-3">
                    {banca.map((m, i) => (
                        <li key={i} className="space-y-2 rounded-[var(--radius-control)] bg-surface-2 p-3">
                            <div className="flex gap-1">
                                <Input readOnly={isReadOnly} aria-label={`Nome do membro ${i + 1} da banca`} className="min-w-0 flex-1 bg-surface" value={m.nome || ''} onChange={e => updateBanca(i, 'nome', e.target.value)} placeholder="Prof. Dr. Nome Completo" />
                                {!isReadOnly && <button type="button" onClick={() => setData(prev => ({...prev, banca: prev.banca.filter((_, idx) => idx !== i)}))} aria-label={`Remover ${m.nome || `membro ${i + 1}`} da banca`} className={`${iconBtn} size-11 hover:bg-danger-soft hover:text-danger`}><Trash2 size={16} /></button>}
                            </div>
                            <div className="flex gap-2">
                                <Input readOnly={isReadOnly} aria-label="Função na banca" className="min-w-0 flex-1 bg-surface" value={m.titulacao || ''} onChange={e => updateBanca(i, 'titulacao', e.target.value)} placeholder="Orientador, examinador…" />
                                <Input readOnly={isReadOnly} aria-label="Instituição do membro" className="w-28 bg-surface" value={m.instituicao || ''} onChange={e => updateBanca(i, 'instituicao', e.target.value)} placeholder="Instituição" />
                            </div>
                        </li>
                    ))}
                </ul>
                {!isReadOnly && <div className="mt-2"><AddButton onClick={() => setData(prev => ({...prev, banca: [...(prev.banca || []), { nome: '', titulacao: '', instituicao: '' }]}))}>Adicionar membro da banca</AddButton></div>}
            </section>
            )}

            </div>
            )}

            {panel === 'pretextuais' && (
            <div className="space-y-8">
            {(hasElement(docType, 'dedicatoria') || hasElement(docType, 'agradecimentos') || hasElement(docType, 'agradecimentosPos') || hasElement(docType, 'epigrafe')) && (
            <section>
              <SectionTitle>Elementos opcionais</SectionTitle>
              <div className="space-y-4">
                {hasElement(docType, 'dedicatoria') && <Field label="Dedicatória"><TextArea readOnly={isReadOnly} className="font-serif text-base" value={data.dedicatoria || ''} onChange={e => updateField('dedicatoria', e.target.value)} /></Field>}
                {(hasElement(docType, 'agradecimentos') || hasElement(docType, 'agradecimentosPos')) && <Field label="Agradecimentos" hint={hasElement(docType, 'agradecimentosPos') ? 'No artigo, os agradecimentos ficam depois das referências.' : undefined}><TextArea readOnly={isReadOnly} className="min-h-32 font-serif text-base" value={data.agradecimentos || ''} onChange={e => updateField('agradecimentos', e.target.value)} /></Field>}
                {hasElement(docType, 'epigrafe') && <Field label="Epígrafe" hint="Uma citação que inspira o trabalho, com o autor."><TextArea readOnly={isReadOnly} className="font-serif text-base italic" value={data.epigrafe || ''} onChange={e => updateField('epigrafe', e.target.value)} /></Field>}
              </div>
            </section>
            )}

            {(hasElement(docType, 'resumoPt') || hasElement(docType, 'resumoEn')) && (
            <section className={hasElement(docType, 'dedicatoria') || hasElement(docType, 'epigrafe') || hasElement(docType, 'agradecimentos') ? block : ''}>
              <SectionTitle>Resumos</SectionTitle>
              <div className="space-y-5">
                {hasElement(docType, 'resumoPt') && (
                  <>
                    <div>
                      <Field label={`Resumo (${tag('resumoPt').toLowerCase()})`}>
                        <TextArea readOnly={isReadOnly} className="min-h-40 font-serif text-base" placeholder={`Parágrafo único, de ${resumoMin} a ${resumoMax} palavras.`} value={data.resumoPt} onChange={e => updateField('resumoPt', e.target.value)} />
                      </Field>
                      <WordCounter text={data.resumoPt} min={resumoMin} max={resumoMax} />
                    </div>
                    <Field label="Palavras-chave" hint="Separe com ponto e vírgula. O documento já aplica o formato da NBR 6028:2021."><Input readOnly={isReadOnly} placeholder="termo 1; termo 2; termo 3" value={data.palavrasChavePt} onChange={e => updateField('palavrasChavePt', e.target.value)} /></Field>
                  </>
                )}
                {hasElement(docType, 'resumoEn') && (
                  <>
                    <div>
                      <Field label={`Abstract (${tag('resumoEn').toLowerCase()})`}>
                        <TextArea readOnly={isReadOnly} lang="en" className="min-h-40 font-serif text-base italic" value={data.resumoEn} onChange={e => updateField('resumoEn', e.target.value)} />
                      </Field>
                      <WordCounter text={data.resumoEn} min={resumoMin} max={resumoMax} />
                    </div>
                    <Field label="Keywords"><Input readOnly={isReadOnly} lang="en" placeholder="term 1; term 2; term 3" value={data.palavrasChaveEn} onChange={e => updateField('palavrasChaveEn', e.target.value)} /></Field>
                  </>
                )}
              </div>
            </section>
            )}
            </div>
            )}

            {panel === 'capitulos' && (
            <section aria-label="Capítulos" className="-mt-6">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={data.secoes.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="divide-y divide-line">
                    {data.secoes.map((s, i) => (
                      <SortableSection key={s.id} s={s} i={i} isReadOnly={isReadOnly} focusedSection={focusedSection} setFocusedSection={setFocusedSection} insertTemplate={insertTemplate} onDelete={handleDeleteSection} onOpenAssetModal={onOpenAssetModal} onUpdate={handleUpdateSection} onAddSubsection={handleAddSubsection} onOpenRefModal={onOpenRefModal} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              {!isReadOnly && <div className="mt-2"><AddButton onClick={handleAddSection}>Adicionar seção</AddButton></div>}
            </section>
            )}

            {panel === 'referencias' && (
            <div className="space-y-8">
            <section id="edit-sec-referencias">
              <SectionTitle action={!isReadOnly && <TextAction onClick={onOpenRefModal}><Wand2 size={14} aria-hidden="true" /> Gerar referência</TextAction>}>Referências</SectionTitle>
              <Field label="Lista de referências" hint="Uma referência por parágrafo. A ordem alfabética é aplicada no documento.">
                <TextArea readOnly={isReadOnly} className="min-h-48 text-sm" placeholder="SOBRENOME, Nome. **Título**. Local: Editora, ano." value={data.referencias} onChange={e => updateField('referencias', e.target.value)} />
              </Field>
              {/* Citação pronta (NBR 10520:2023) a partir de cada referência: evita citar sem referenciar */}
              {orderedLines(data.referencias).length > 0 && (
                <div className="mt-5">
                  <p className="mb-2 text-sm font-medium text-ink">Citação pronta</p>
                  <p className={`${help} -mt-1 mb-2`}>Toque numa referência para copiar a citação e colar no texto.</p>
                  <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-control)] ring-1 ring-line">
                    {orderedLines(data.referencias).map((ref, i) => {
                      const cit = citationFor(ref);
                      return (
                        <li key={i}>
                          <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(cit); toast.success(`${cit} copiada`); } catch { toast.error('Não foi possível copiar. Selecione e copie à mão.'); } }}
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-surface-2">
                            <span className="min-w-0 flex-1 truncate text-sm text-ink-2" title={ref.replace(/\*/g, '')}>{ref.replace(/\*/g, '')}</span>
                            <span className="tabular shrink-0 text-sm font-semibold text-accent">{cit}</span>
                            <Copy size={14} className="shrink-0 text-ink-3" aria-hidden="true" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </section>

            {(hasElement(docType, 'glossario') || hasElement(docType, 'apendices') || hasElement(docType, 'anexos')) && (
            <section className={block}>
              <SectionTitle>Elementos pós-textuais</SectionTitle>
              <div className="space-y-5">
              {hasElement(docType, 'glossario') && (
                <div id="edit-sec-glossario">
                    <Field label="Glossário" hint="Um termo por linha. A ordem alfabética é automática.">
                        <TextArea readOnly={isReadOnly} placeholder="Termo: definição do termo." value={data.glossario || ''} onChange={e => updateField('glossario', e.target.value)} />
                    </Field>
                </div>
              )}
              {hasElement(docType, 'apendices') && (
                <div id="edit-sec-apendices">
                    <div className="mb-1.5 flex items-center justify-between">
                        <label htmlFor="apendices" className="text-sm font-medium text-ink">Apêndices <span className="font-normal text-ink-3">(material seu)</span></label>
                        {!isReadOnly && <TextAction onClick={() => onOpenAttachmentModal('apendice')}><Plus size={14} aria-hidden="true" /> Novo apêndice</TextAction>}
                    </div>
                    <TextArea id="apendices" readOnly={isReadOnly} className="min-h-32" placeholder="Questionários, roteiros e outros documentos do próprio autor…" value={data.apendices || ''} onChange={e => updateField('apendices', e.target.value)} />
                </div>
              )}
              {hasElement(docType, 'anexos') && (
                <div id="edit-sec-anexos">
                    <div className="mb-1.5 flex items-center justify-between">
                        <label htmlFor="anexos" className="text-sm font-medium text-ink">Anexos <span className="font-normal text-ink-3">(material de terceiros)</span></label>
                        {!isReadOnly && <TextAction onClick={() => onOpenAttachmentModal('anexo')}><Plus size={14} aria-hidden="true" /> Novo anexo</TextAction>}
                    </div>
                    <TextArea id="anexos" readOnly={isReadOnly} className="min-h-32" placeholder="Leis, mapas e documentos de terceiros…" value={data.anexos || ''} onChange={e => updateField('anexos', e.target.value)} />
                </div>
              )}
              </div>
            </section>
            )}
            </div>
            )}

            {next && (
                <button type="button" onClick={next.onClick} className="mt-10 flex w-full items-center justify-between gap-3 rounded-[var(--radius-panel)] bg-surface-2 px-4 py-3 text-left transition-colors duration-150 hover:bg-accent-soft">
                    <span>
                        <span className="block text-xs text-ink-3">Próxima etapa</span>
                        <span className="block font-semibold">{next.label}</span>
                    </span>
                    <ArrowRight size={18} className="shrink-0 text-accent" aria-hidden="true" />
                </button>
            )}

            <ConfirmDialog open={!!pendingDelete} onClose={() => setPendingDelete(null)}
                title="Remover esta seção?"
                description={pendingDelete ? `“${pendingDelete.titulo || 'Sem título'}” e todo o texto dela serão apagados.` : ''}
                confirmLabel="Remover seção"
                onConfirm={() => { setData(prev => ({ ...prev, secoes: prev.secoes.filter(s => s.id !== pendingDelete.id) })); toast.success('Seção removida'); }} />
        </div>
    );
};

export default EditorForm;
