import React, { useRef, useMemo } from 'react';
import { 
  Settings2, Users, Trash2, Globe, BookOpen, Wand2, Lightbulb, 
  Quote, Image as ImageIcon, TableIcon, Box, BookMarked, GripVertical,
  UserCheck, Heart, Layers, Plus, ArrowRight, ArrowLeft, FileType, Stamp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { SECTION_GUIDES, SECTION_TEMPLATES, ESTADOS_BR } from '../../utils/constants';
import { generateId } from '../../utils/helpers';
import { DOCUMENT_TYPES, getDocType, getDocTypeKey, hasElement, isRequired } from '../../utils/documentTypes';
import { EditorToolbar } from './EditorToolbar';
import { useAppContext } from '../../contexts/AppContext';

// -- Componentes Internos Abstratos --

const ThemedInput = ({ theme, className = '', ...props }) => (
    <input 
        {...props}
        className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-green-600 transition-colors ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400'} ${className}`} 
    />
);

const ThemedTextarea = ({ theme, className = '', ...props }) => (
    <textarea 
        {...props}
        className={`w-full p-3 border rounded-lg text-xs outline-none focus:border-green-600 transition-colors ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400'} ${className}`} 
    />
);

const WordCounter = ({ text, min = 150, max = 500 }) => {
    const count = useMemo(() => {
        if (!text || typeof text !== 'string') return 0;
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }, [text]);
    
    let colorClass = 'text-slate-400 bg-slate-100 border-transparent dark:bg-slate-800';
    let statusText = '';

    if (count > 0) {
        if (count < min) {
            colorClass = 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/30 dark:border-yellow-700/50';
            statusText = `Curto (Mín: ${min})`;
        } else if (count >= min && count <= max) {
            colorClass = 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/30 dark:border-green-700/50';
            statusText = 'Ideal ABNT';
        } else if (count > max) {
            colorClass = 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-700/50';
            statusText = `Longo (Máx: ${max})`;
        }
    }

    return (
        <div className={`text-[10px] font-bold px-2 py-1 rounded border flex items-center gap-1 w-fit transition-colors ${colorClass}`}>
            {count} palavras {statusText && `- ${statusText}`}
        </div>
    );
};

const LEVEL_NAMES = { 1: 'Primária', 2: 'Secundária', 3: 'Terciária', 4: 'Quaternária', 5: 'Quinária' };

const SortableSection = ({ s, i, settings, isReadOnly, focusedSection, setFocusedSection, insertTemplate, onDelete, onOpenAssetModal, onUpdate, onAddSubsection, onOpenRefModal }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id });
    const textareaRef = useRef(null);
    
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
        } else if (action.prefix) {
            const prefix = start > 0 ? `\n\n${action.prefix}` : action.prefix;
            newText = `${text.substring(0, start)}${prefix}${selectedText}${text.substring(end)}`;
            newCursorPos = start + prefix.length + selectedText.length;
        }

        onUpdate(i, 'conteudo', newText);
        setTimeout(() => { textarea.focus(); textarea.setSelectionRange(newCursorPos, newCursorPos); }, 0);
    };

    const currentLevel = Number(s.level) || 1;

    return (
        <div ref={setNodeRef} id={`edit-sec-${s.id}`} style={style} className={`p-4 border rounded-xl space-y-3 transition-all scroll-mt-4 ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'} ${currentLevel > 1 ? 'ml-6 border-l-4 border-l-green-200' : ''}`}>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    {!isReadOnly && <button {...attributes} {...listeners} className="cursor-grab p-1 text-slate-300 hover:text-slate-500 active:cursor-grabbing touch-none"><GripVertical size={16}/></button>}
                    <span className={`text-[8px] font-black uppercase tracking-tighter ${currentLevel > 1 ? 'text-slate-400' : 'text-green-500'}`}>Seção {LEVEL_NAMES[currentLevel] || 'Secundária'}</span>
                </div>
                <div className="flex gap-2">
                    {!isReadOnly && (
                        <div className="flex gap-1 bg-slate-100 dark:bg-slate-700/50 rounded p-0.5">
                            <button onClick={() => onUpdate(i, 'level', Math.max(1, currentLevel - 1))} disabled={currentLevel === 1} className={`p-1 rounded transition-colors ${currentLevel === 1 ? 'opacity-30 cursor-not-allowed text-slate-400' : 'text-blue-500 hover:bg-white dark:hover:bg-slate-600 shadow-sm'}`}><ArrowLeft size={12}/></button>
                            <span className="text-[9px] font-bold w-3 text-center my-auto text-slate-500">{currentLevel}</span>
                            <button onClick={() => onUpdate(i, 'level', Math.min(5, currentLevel + 1))} disabled={currentLevel === 5} className={`p-1 rounded transition-colors ${currentLevel === 5 ? 'opacity-30 cursor-not-allowed text-slate-400' : 'text-blue-500 hover:bg-white dark:hover:bg-slate-600 shadow-sm'}`}><ArrowRight size={12}/></button>
                        </div>
                    )}
                    <button onClick={() => insertTemplate(i, s.titulo)} className="p-1 text-slate-300 hover:text-purple-500 hover:bg-purple-50 rounded"><Wand2 size={12}/></button>
                    {!isReadOnly && <button onClick={() => onDelete(s.id)} className="p-1 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 size={12}/></button>}
                </div>
            </div>
            
            <input 
                readOnly={isReadOnly} 
                className={`font-bold text-xs ${currentLevel === 1 ? 'uppercase' : ''} w-full bg-transparent border-b focus:border-green-600 outline-none pb-1 ${settings.theme === 'dark' ? 'border-slate-600 text-white' : 'border-slate-200 text-slate-800'}`} 
                value={s.titulo} 
                onChange={e => onUpdate(i, 'titulo', e.target.value)} 
                placeholder={`Título da Seção Nível ${currentLevel}`}
            />

            {!isReadOnly && <EditorToolbar onAction={handleToolbarAction} />}

            <textarea 
                ref={textareaRef}
                readOnly={isReadOnly} 
                onFocus={() => setFocusedSection(s.titulo)} 
                onBlur={() => setFocusedSection(null)} 
                className={`w-full p-3 rounded-lg text-xs h-40 outline-none focus:ring-1 focus:ring-green-100 ${settings.theme === 'dark' ? 'bg-slate-900 text-slate-300' : 'bg-white text-slate-800'}`} 
                value={s.conteudo} 
                onChange={e => onUpdate(i, 'conteudo', e.target.value)} 
            />
            
            {focusedSection === s.titulo && Object.keys(SECTION_GUIDES).find(k => s.titulo.toUpperCase().includes(k)) && (
                <div className="text-[10px] text-blue-600 bg-blue-50 p-2 rounded mt-1 flex gap-2 animate-in fade-in slide-in-from-top-1">
                    <Lightbulb size={12} className="shrink-0"/> {SECTION_GUIDES[Object.keys(SECTION_GUIDES).find(k => s.titulo.toUpperCase().includes(k))]}
                </div>
            )}
            
            <div className="flex justify-between items-center mt-2">
                <div className="flex flex-wrap gap-1">
                    <button onClick={() => onOpenAssetModal('cit', i)} className="text-[8px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100 flex items-center gap-1 hover:bg-green-100"><Quote size={10}/> Citação</button>
                    <button onClick={() => onOpenAssetModal('img', i)} className="text-[8px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100 flex items-center gap-1 hover:bg-blue-100"><ImageIcon size={10}/> Imagem</button>
                    <button onClick={() => onOpenAssetModal('tab', i)} className="text-[8px] font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded border border-orange-100 flex items-center gap-1 hover:bg-orange-100"><TableIcon size={10}/> Tabela</button>
                    <button onClick={() => onOpenAssetModal('box', i)} className="text-[8px] font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 flex items-center gap-1 hover:bg-indigo-100"><Box size={10}/> Quadro</button>
                </div>
                
                {!isReadOnly && currentLevel < 5 && (
                    <button onClick={() => onAddSubsection(i, currentLevel)} className="text-[9px] font-bold text-slate-500 hover:text-green-700 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded border border-transparent flex items-center gap-1 uppercase">
                        <Plus size={10}/> Subseção Nvl {currentLevel + 1}
                    </button>
                )}
            </div>
        </div>
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
            toast.success("Ordem atualizada!");
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

    const handleDeleteSection = (id) => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2"><Trash2 className="text-red-500" size={20} /><span className="font-bold text-sm">Remover esta seção?</span></div>
                <p className="text-xs text-slate-500">Toda a informação será apagada permanentemente.</p>
                <div className="flex gap-2 justify-end mt-2">
                    <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-xs font-bold bg-slate-100 rounded-lg">Cancelar</button>
                    <button onClick={() => { setData(prev => ({...prev, secoes: prev.secoes.filter(s => s.id !== id)})); toast.dismiss(t.id); toast.success("Removida."); }} className="px-3 py-1.5 text-xs font-bold text-white bg-red-500 rounded-lg">Sim, Remover</button>
                </div>
            </div>
        ));
    };

    const insertTemplate = (index, sectionTitle) => {
        if(isReadOnly) return;
        const key = Object.keys(SECTION_TEMPLATES).find(k => sectionTitle.toUpperCase().includes(k));
        
        if (key) {
            setData(prev => {
                const newSecoes = [...prev.secoes];
                newSecoes[index] = { ...newSecoes[index], conteudo: (newSecoes[index].conteudo + "\n\n" + SECTION_TEMPLATES[key]).trim() };
                return { ...prev, secoes: newSecoes };
            });
            toast.success("Modelo inserido com sucesso!");
        } else {
            toast.error("Nenhum modelo disponível para este título.");
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

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-20">
            {panel === 'documento' && (
            <div className="space-y-8">
            {/* Tipo de documento */}
            <section className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2"><FileType size={12}/> Tipo de Documento</h3>
              <select
                disabled={isReadOnly}
                className={`w-full p-2.5 border rounded-lg text-sm font-bold outline-none focus:border-green-600 transition-colors ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                value={typeKey}
                onChange={e => updateField('tipoDocumento', e.target.value)}
              >
                {Object.entries(DOCUMENT_TYPES).map(([key, t]) => <option key={key} value={key}>{t.label}</option>)}
              </select>
              <p className="text-[10px] text-slate-400 leading-snug">
                <span className="font-bold text-green-600">{docType.norma}</span> — {docType.description}
              </p>
            </section>

            {/* Identificação */}
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2"><Settings2 size={12}/> Identificação</h3>
                {!isReadOnly && (
                  <div className="flex gap-3">
                    {hasPerfil && <button type="button" onClick={aplicarPerfil} className="text-[10px] font-bold text-green-700 dark:text-green-400 hover:underline" title="Preencher instituição, curso, cidade e orientador com o seu perfil">Usar meu perfil</button>}
                    <button type="button" onClick={salvarPerfil} className="text-[10px] font-bold text-slate-500 hover:text-green-700 hover:underline" title="Guardar instituição, curso, cidade e orientador para os próximos documentos">Salvar como perfil</button>
                  </div>
                )}
              </div>
              {hasElement(docType, 'folhaRosto') && (
                <>
                  <ThemedInput theme={settings.theme} readOnly={isReadOnly} placeholder="Instituição" value={data.instituicao} onChange={e => updateField('instituicao', e.target.value)} />
                  <ThemedInput theme={settings.theme} readOnly={isReadOnly} placeholder="Nome do Curso / Programa" value={data.curso} onChange={e => updateField('curso', e.target.value)} />
                </>
              )}
              <ThemedInput theme={settings.theme} readOnly={isReadOnly} placeholder="Título Oficial" className="font-bold" value={data.titulo} onChange={e => updateField('titulo', e.target.value)} />
              <ThemedInput theme={settings.theme} readOnly={isReadOnly} placeholder="Subtítulo (opcional)" value={data.subtitulo} onChange={e => updateField('subtitulo', e.target.value)} />
              {hasElement(docType, 'tituloEn') && (
                <ThemedInput theme={settings.theme} readOnly={isReadOnly} placeholder="Título em outro idioma (opcional)" className="italic" value={data.tituloEn || ''} onChange={e => updateField('tituloEn', e.target.value)} />
              )}

              {hasElement(docType, 'folhaRosto') && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">Natureza do Trabalho (Folha de Rosto)</label>
                    {!isReadOnly && docType.natureza && <button onClick={gerarNatureza} className="text-[9px] font-bold text-purple-600 flex items-center gap-1 uppercase bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-md"><Wand2 size={10}/> Gerar</button>}
                  </div>
                  <ThemedTextarea theme={settings.theme} readOnly={isReadOnly} className="h-24" placeholder="Ex: Trabalho de Conclusão de Curso apresentado ao IFPA..." value={data.naturezaTrabalho} onChange={e => updateField('naturezaTrabalho', e.target.value)} />
                </div>
              )}

              {hasElement(docType, 'obraResenhada') && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">Referência da Obra Resenhada (Obrigatório)</label>
                  <ThemedTextarea theme={settings.theme} readOnly={isReadOnly} className="h-20" placeholder="SOBRENOME, Nome. **Título da obra**. Edição. Local: Editora, ano." value={data.obraResenhada || ''} onChange={e => updateField('obraResenhada', e.target.value)} />
                </div>
              )}

              <div className="flex gap-2">
                <ThemedInput theme={settings.theme} readOnly={isReadOnly} placeholder="Cidade" className="flex-1" value={data.cidade} onChange={e => updateField('cidade', e.target.value)} />
                <select disabled={isReadOnly} className={`p-2 border rounded-lg text-xs outline-none focus:border-green-600 transition-colors ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} value={data.estado} onChange={e => updateField('estado', e.target.value)}>{ESTADOS_BR.map(u => <option key={u} value={u}>{u}</option>)}</select>
              </div>

              {(docType.elements.capa === 'opc' || hasElement(docType, 'listas') || hasElement(docType, 'fichaCatalografica')) && (
                <div className="flex flex-col gap-1.5 pt-1">
                  {docType.elements.capa === 'opc' && (
                    <label className="flex items-center gap-2 text-[11px] text-slate-500 cursor-pointer">
                      <input type="checkbox" disabled={isReadOnly} checked={data.incluirCapa !== false} onChange={e => updateField('incluirCapa', e.target.checked)} /> Incluir capa (opcional neste tipo)
                    </label>
                  )}
                  {hasElement(docType, 'listas') && (
                    <label className="flex items-center gap-2 text-[11px] text-slate-500 cursor-pointer">
                      <input type="checkbox" disabled={isReadOnly} checked={data.incluirListas !== false} onChange={e => updateField('incluirListas', e.target.checked)} /> Gerar listas de ilustrações e de tabelas
                    </label>
                  )}
                  {hasElement(docType, 'fichaCatalografica') && (
                    <>
                      <label className="flex items-center gap-2 text-[11px] text-slate-500 cursor-pointer">
                        <input type="checkbox" disabled={isReadOnly} checked={Boolean(data.fichaCatalografica)} onChange={e => updateField('fichaCatalografica', e.target.checked)} /> Incluir ficha catalográfica (verso da folha de rosto)
                      </label>
                      {data.fichaCatalografica && (
                        <div className="pl-5 space-y-1">
                          <ThemedInput theme={settings.theme} readOnly={isReadOnly} className="text-xs" placeholder="Classificação da biblioteca (ex.: CDD 616.89)" value={data.fichaCdd || ''} onChange={e => updateField('fichaCdd', e.target.value)} />
                          <p className="text-[10px] text-slate-400 leading-snug">A ficha usa as palavras-chave como assuntos. A classificação (CDD/CDU) é fornecida pela biblioteca da instituição.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </section>

            {/* Autores */}
            <section>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2"><Users size={12}/> Autores</h3>
                    <button disabled={isReadOnly} onClick={() => setAuthors([...authors].sort())} className="text-[10px] font-bold text-green-700 hover:underline">A-Z</button>
                </div>
                <div className="space-y-2">
                    {authors.map((a, i) => (
                        <div key={i} className="flex gap-2">
                            <ThemedInput theme={settings.theme} readOnly={isReadOnly} className="flex-1" value={a} onChange={e => { const n = [...authors]; n[i] = e.target.value; setAuthors(n); }} placeholder="Nome Completo" />
                            {!isReadOnly && authors.length > 1 && <button onClick={() => setAuthors(authors.filter((_, idx) => idx !== i))} className="text-red-300"><Trash2 size={16}/></button>}
                        </div>
                    ))}
                    {!isReadOnly && <button onClick={() => setAuthors([...authors, ''])} className="w-full py-1.5 border-2 border-dashed rounded text-[10px] font-bold text-slate-400 hover:text-green-700 transition-all">+ ADICIONAR AUTOR</button>}
                </div>
                {hasElement(docType, 'notaAutores') && (
                    <div className="space-y-1 mt-3">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">Nota de rodapé dos autores (um por linha)</label>
                        <ThemedTextarea theme={settings.theme} readOnly={isReadOnly} className="h-20" placeholder="Graduando em Engenharia pelo IFPA. E-mail: autor@email.com" value={data.notaAutores || ''} onChange={e => updateField('notaAutores', e.target.value)} />
                    </div>
                )}
            </section>

            {/* Orientadores */}
            {hasElement(docType, 'folhaRosto') && (
            <section>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2"><UserCheck size={12}/> Orientadores</h3>
                </div>
                <div className="space-y-2">
                    {(data.orientadores || ['']).map((o, i) => (
                        <div key={i} className="flex gap-2">
                            <ThemedInput theme={settings.theme} readOnly={isReadOnly} className="flex-1" value={o} onChange={e => { setData(prev => { const n = [...(prev.orientadores || [''])]; n[i] = e.target.value; return {...prev, orientadores: n}; }); }} placeholder="Nome do Orientador/Coorientador" />
                            {!isReadOnly && (data.orientadores || ['']).length > 1 && <button onClick={() => setData(prev => ({...prev, orientadores: prev.orientadores.filter((_, idx) => idx !== i)}))} className="text-red-300"><Trash2 size={16}/></button>}
                        </div>
                    ))}
                    {!isReadOnly && <button onClick={() => setData(prev => ({...prev, orientadores: [...(prev.orientadores || ['']), '']}))} className="w-full py-1.5 border-2 border-dashed rounded text-[10px] font-bold text-slate-400 hover:text-green-700 transition-all">+ ADICIONAR ORIENTADOR</button>}
                </div>
            </section>
            )}

            {/* Folha de aprovação (NBR 14724) */}
            {hasElement(docType, 'folhaAprovacao') && (
            <section className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2"><Stamp size={12}/> Folha de Aprovação ({tag('folhaAprovacao')})</h3>
                <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1 shrink-0">Aprovado em</label>
                    <ThemedInput theme={settings.theme} readOnly={isReadOnly} type="date" value={data.dataAprovacao || ''} onChange={e => updateField('dataAprovacao', e.target.value)} />
                </div>
                <div className="space-y-2">
                    {banca.map((m, i) => (
                        <div key={i} className={`p-2 rounded-lg border space-y-1.5 ${settings.theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                            <div className="flex gap-2">
                                <ThemedInput theme={settings.theme} readOnly={isReadOnly} className="flex-1" value={m.nome || ''} onChange={e => updateBanca(i, 'nome', e.target.value)} placeholder="Prof. Dr. Nome Completo" />
                                {!isReadOnly && <button onClick={() => setData(prev => ({...prev, banca: prev.banca.filter((_, idx) => idx !== i)}))} className="text-red-300"><Trash2 size={16}/></button>}
                            </div>
                            <div className="flex gap-2">
                                <ThemedInput theme={settings.theme} readOnly={isReadOnly} className="flex-1" value={m.titulacao || ''} onChange={e => updateBanca(i, 'titulacao', e.target.value)} placeholder="Função (Orientador, Examinador...)" />
                                <ThemedInput theme={settings.theme} readOnly={isReadOnly} className="w-28" value={m.instituicao || ''} onChange={e => updateBanca(i, 'instituicao', e.target.value)} placeholder="Instituição" />
                            </div>
                        </div>
                    ))}
                    {!isReadOnly && <button onClick={() => setData(prev => ({...prev, banca: [...(prev.banca || []), { nome: '', titulacao: '', instituicao: '' }]}))} className="w-full py-1.5 border-2 border-dashed rounded text-[10px] font-bold text-slate-400 hover:text-green-700 transition-all">+ ADICIONAR MEMBRO DA BANCA</button>}
                </div>
            </section>
            )}

            </div>
            )}

            {panel === 'pretextuais' && (
            <div className="space-y-8">
            {/* Elementos Pré-Textuais */}
            {(hasElement(docType, 'dedicatoria') || hasElement(docType, 'agradecimentos') || hasElement(docType, 'agradecimentosPos') || hasElement(docType, 'epigrafe')) && (
            <section className="space-y-4">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2"><Heart size={12}/> Elementos Opcionais</h3>
              {hasElement(docType, 'dedicatoria') && <ThemedTextarea theme={settings.theme} readOnly={isReadOnly} className="h-20" placeholder="Dedicatória..." value={data.dedicatoria || ''} onChange={e => updateField('dedicatoria', e.target.value)} />}
              {(hasElement(docType, 'agradecimentos') || hasElement(docType, 'agradecimentosPos')) && <ThemedTextarea theme={settings.theme} readOnly={isReadOnly} className="h-32" placeholder={hasElement(docType, 'agradecimentosPos') ? 'Agradecimentos (no artigo, ficam após as referências)...' : 'Agradecimentos...'} value={data.agradecimentos || ''} onChange={e => updateField('agradecimentos', e.target.value)} />}
              {hasElement(docType, 'epigrafe') && <ThemedTextarea theme={settings.theme} readOnly={isReadOnly} className="h-20 italic" placeholder="Epígrafe (Citação que inspira o trabalho)..." value={data.epigrafe || ''} onChange={e => updateField('epigrafe', e.target.value)} />}
            </section>
            )}

            {/* Resumos (NBR 6028:2021) */}
            {(hasElement(docType, 'resumoPt') || hasElement(docType, 'resumoEn')) && (
            <section className="space-y-4">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2"><Globe size={12}/> Resumos</h3>
              {hasElement(docType, 'resumoPt') && (
                <>
                  <div className="space-y-1">
                      <ThemedTextarea theme={settings.theme} readOnly={isReadOnly} className="h-32" placeholder={`Resumo (${tag('resumoPt')}) — parágrafo único, ${resumoMin} a ${resumoMax} palavras`} value={data.resumoPt} onChange={e => updateField('resumoPt', e.target.value)} />
                      <div className="flex justify-end"><WordCounter text={data.resumoPt} min={resumoMin} max={resumoMax} /></div>
                  </div>
                  <ThemedInput theme={settings.theme} readOnly={isReadOnly} placeholder="Palavras-chave: termo 1; termo 2; termo 3." value={data.palavrasChavePt} onChange={e => updateField('palavrasChavePt', e.target.value)} />
                </>
              )}
              {hasElement(docType, 'resumoEn') && (
                <>
                  <div className="space-y-1">
                      <ThemedTextarea theme={settings.theme} readOnly={isReadOnly} className="h-32 italic" placeholder={`Abstract (${tag('resumoEn')})`} value={data.resumoEn} onChange={e => updateField('resumoEn', e.target.value)} />
                      <div className="flex justify-end"><WordCounter text={data.resumoEn} min={resumoMin} max={resumoMax} /></div>
                  </div>
                  <ThemedInput theme={settings.theme} readOnly={isReadOnly} placeholder="Keywords: term 1; term 2; term 3." value={data.palavrasChaveEn} onChange={e => updateField('palavrasChaveEn', e.target.value)} />
                </>
              )}
              <p className="text-[10px] text-slate-400">Separe as palavras-chave com ponto e vírgula; o documento já aplica o formato da NBR 6028:2021.</p>
            </section>
            )}

            </div>
            )}

            {panel === 'capitulos' && (
            <div className="space-y-8">
            {/* Capítulos */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2"><BookOpen size={12}/> Capítulos</h3>
              </div>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={data.secoes.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {data.secoes.map((s, i) => (
                      <SortableSection key={s.id} s={s} i={i} settings={settings} isReadOnly={isReadOnly} focusedSection={focusedSection} setFocusedSection={setFocusedSection} insertTemplate={insertTemplate} onDelete={handleDeleteSection} onOpenAssetModal={onOpenAssetModal} onUpdate={handleUpdateSection} onAddSubsection={handleAddSubsection} onOpenRefModal={onOpenRefModal} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              {!isReadOnly && (
                <div className="flex pt-2">
                        <button 
                    onClick={handleAddSection} 
                    className="w-full py-2.5 border-2 border-dashed border-green-300 dark:border-green-800 rounded-lg text-[10px] font-bold text-green-700 dark:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all flex items-center justify-center gap-1 uppercase"
                  >
                    <Plus size={14}/> Adicionar Nova Seção
                  </button>
                </div>
              )}
            </section>
            
            </div>
            )}

            {panel === 'referencias' && (
            <div className="space-y-8">
            {/* Referências */}
            <section id="edit-sec-referencias" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2"><BookMarked size={12}/> Referências</h3>
                {!isReadOnly && <button onClick={onOpenRefModal} className="text-[9px] font-bold text-green-700 hover:underline uppercase transition-all">Gerar NBR 6023</button>}
              </div>
              <ThemedTextarea theme={settings.theme} readOnly={isReadOnly} className="h-40 font-mono text-[10px]" placeholder="Cole as referências..." value={data.referencias} onChange={e => updateField('referencias', e.target.value)} />
            </section>

            {/* Pós-Textuais */}
            {(hasElement(docType, 'glossario') || hasElement(docType, 'apendices') || hasElement(docType, 'anexos')) && (
            <section className="space-y-4 ">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2"><Layers size={12}/> Elementos Pós-Textuais Opcionais</h3>
              {hasElement(docType, 'glossario') && (
                <div id="edit-sec-glossario" className="space-y-2">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">Glossário (um termo por linha, ordenado automaticamente)</label>
                    <ThemedTextarea theme={settings.theme} readOnly={isReadOnly} className="h-24" placeholder="Termo: definição do termo." value={data.glossario || ''} onChange={e => updateField('glossario', e.target.value)} />
                </div>
              )}
              {hasElement(docType, 'apendices') && (
                <div id="edit-sec-apendices" className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">Apêndices (Do Autor)</label>
                        {!isReadOnly && <button onClick={() => onOpenAttachmentModal('apendice')} className="text-[9px] font-bold text-purple-600 flex items-center gap-1 uppercase bg-purple-50 px-2 py-1 rounded-md"><Plus size={10}/> Automático</button>}
                    </div>
                    <ThemedTextarea theme={settings.theme} readOnly={isReadOnly} className="h-32" placeholder="Documentos do próprio autor..." value={data.apendices || ''} onChange={e => updateField('apendices', e.target.value)} />
                </div>
              )}
              {hasElement(docType, 'anexos') && (
                <div id="edit-sec-anexos" className="space-y-2 mt-6">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">Anexos (De Terceiros)</label>
                        {!isReadOnly && <button onClick={() => onOpenAttachmentModal('anexo')} className="text-[9px] font-bold text-orange-600 flex items-center gap-1 uppercase bg-orange-50 px-2 py-1 rounded-md"><Plus size={10}/> Automático</button>}
                    </div>
                    <ThemedTextarea theme={settings.theme} readOnly={isReadOnly} className="h-32" placeholder="Leis, mapas de terceiros..." value={data.anexos || ''} onChange={e => updateField('anexos', e.target.value)} />
                </div>
              )}
            </section>
            )}
            </div>
            )}

            {next && (
                <button onClick={next.onClick} className={`w-full flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${settings.theme === 'dark' ? 'border-slate-800 hover:border-green-700 hover:bg-slate-800/60' : 'border-slate-200 hover:border-green-500 hover:bg-green-50/50'}`}>
                    <span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400">Próxima etapa</span>
                        <span className="block text-sm font-semibold">{next.label}</span>
                    </span>
                    <ArrowRight size={16} className="text-green-600 shrink-0" />
                </button>
            )}
        </div>
    );
};

export default EditorForm;