import React, { useRef } from 'react';
import { 
  Settings2, Users, Trash2, Globe, BookOpen, Wand2, Lightbulb, 
  Quote, Image as ImageIcon, TableIcon, Box, BookMarked, GripVertical,
  UserCheck, Heart, LayoutTemplate, Layers, Plus, AlertTriangle, ArrowRight, ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  useSortable, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { SECTION_GUIDES, SECTION_TEMPLATES, ESTADOS_BR } from '../../utils/constants';
import { generateId } from '../../utils/helpers';
import { EditorToolbar } from './EditorToolbar';

const WordCounter = ({ text, min = 150, max = 500 }) => {
    const countWords = (str) => {
        if (!str) return 0;
        return str.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    const count = countWords(text);
    
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

const SortableSection = ({ s, i, settings, isReadOnly, focusedSection, setFocusedSection, insertTemplate, onDelete, onOpenAssetModal, onUpdate, onAddSubsection, onOpenRefModal }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id });
    const textareaRef = useRef(null);
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.6 : 1
    };

    const handleToolbarAction = (action) => {
        if (action.action === 'open_ref_modal') {
            onOpenRefModal();
            return;
        }

        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = s.conteudo || '';
        const selectedText = text.substring(start, end);

        let newText = text;
        let newCursorPos = end;

        if (action.syntax) {
            const before = text.substring(0, start);
            const after = text.substring(end);
            newText = `${before}${action.syntax}${selectedText}${action.syntax}${after}`;
            newCursorPos = end + (action.syntax.length * 2);
        } else if (action.prefix) {
            const before = text.substring(0, start);
            const after = text.substring(end);
            const prefix = start > 0 ? `\n\n${action.prefix}` : action.prefix;
            newText = `${before}${prefix}${selectedText}${after}`;
            newCursorPos = start + prefix.length + selectedText.length;
        }

        onUpdate(i, 'conteudo', newText);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    return (
        <div ref={setNodeRef} style={style} className={`p-4 border rounded-xl space-y-3 transition-all ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'} ${Number(s.level) > 1 ? 'ml-6 border-l-4 border-l-green-200' : ''}`}>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    {!isReadOnly && (
                        <button {...attributes} {...listeners} className="cursor-grab p-1 text-slate-300 hover:text-slate-500 active:cursor-grabbing touch-none">
                            <GripVertical size={16}/>
                        </button>
                    )}
                    <span className={`text-[8px] font-black uppercase tracking-tighter ${Number(s.level) > 1 ? 'text-slate-400' : 'text-green-500'}`}>
                        {Number(s.level) === 1 ? 'Seção' : 'Subseção'}
                    </span>
                </div>
                <div className="flex gap-1">
                    {!isReadOnly && (
                        <button 
                            onClick={() => onUpdate(i, 'level', Number(s.level) === 1 ? 2 : 1)} 
                            title={Number(s.level) === 1 ? "Transformar em Subseção" : "Promover a Seção Primária"} 
                            className={`p-1 rounded transition-colors ${Number(s.level) === 1 ? 'text-slate-300 hover:text-blue-500 hover:bg-blue-50' : 'text-blue-500 hover:text-blue-700 hover:bg-blue-100'}`}
                        >
                            {Number(s.level) === 1 ? <ArrowRight size={12}/> : <ArrowLeft size={12}/>}
                        </button>
                    )}
                    
                    <button onClick={() => insertTemplate(i, s.titulo)} title="Inserir Modelo" className="p-1 text-slate-300 hover:text-purple-500 hover:bg-purple-50 rounded"><Wand2 size={12}/></button>
                    {!isReadOnly && <button onClick={() => onDelete(s.id)} className="p-1 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 size={12}/></button>}
                </div>
            </div>
            
            <input 
                readOnly={isReadOnly} 
                className={`font-bold text-xs uppercase w-full bg-transparent border-b focus:border-green-600 outline-none pb-1 ${settings.theme === 'dark' ? 'border-slate-600 text-white' : 'border-slate-200 text-slate-800'}`} 
                value={s.titulo} 
                onChange={e => onUpdate(i, 'titulo', e.target.value)} 
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
                    <Lightbulb size={12} className="shrink-0"/>
                    {SECTION_GUIDES[Object.keys(SECTION_GUIDES).find(k => s.titulo.toUpperCase().includes(k))]}
                </div>
            )}
            
            <div className="flex justify-between items-center mt-2">
                <div className="flex flex-wrap gap-1">
                    <button onClick={() => onOpenAssetModal('cit', i)} className="text-[8px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100 flex items-center gap-1 hover:bg-green-100"><Quote size={10}/> Citação</button>
                    <button onClick={() => onOpenAssetModal('img', i)} className="text-[8px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100 flex items-center gap-1 hover:bg-blue-100"><ImageIcon size={10}/> Imagem</button>
                    <button onClick={() => onOpenAssetModal('tab', i)} className="text-[8px] font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded border border-orange-100 flex items-center gap-1 hover:bg-orange-100"><TableIcon size={10}/> Tabela</button>
                    <button onClick={() => onOpenAssetModal('box', i)} className="text-[8px] font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 flex items-center gap-1 hover:bg-indigo-100"><Box size={10}/> Quadro</button>
                </div>
                
                {!isReadOnly && (
                    <button 
                        onClick={() => onAddSubsection(i)} 
                        className="text-[9px] font-bold text-slate-500 hover:text-green-700 dark:hover:text-green-400 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded border border-transparent hover:border-green-200 dark:hover:border-green-800 flex items-center gap-1 transition-all uppercase"
                        title="Adicionar uma Subseção diretamente abaixo deste bloco"
                    >
                        <Plus size={10}/> Subseção
                    </button>
                )}
            </div>
        </div>
    );
};

const EditorForm = ({ data, setData, authors, setAuthors, settings, isReadOnly, focusedSection, setFocusedSection, onOpenAssetModal, onOpenRefModal, onOpenAttachmentModal }) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setData(prev => {
                const oldIndex = prev.secoes.findIndex(s => s.id === active.id);
                const newIndex = prev.secoes.findIndex(s => s.id === over.id);
                return { ...prev, secoes: arrayMove(prev.secoes, oldIndex, newIndex) };
            });
            toast.success("Ordem das seções atualizada!");
        }
    };

    // ATUALIZAÇÃO FUNCIONAL PARA EVITAR STALE CLOSURES
    const handleUpdateSection = (index, field, value) => {
        setData(prev => {
            if (!prev) return prev;
            const newSecoes = prev.secoes.map((sec, i) => 
                i === index ? { ...sec, [field]: value } : sec
            );
            return { ...prev, secoes: newSecoes };
        });
    };

    // ATUALIZAÇÃO FUNCIONAL DE ARRAY COM SPLICE CORRIGIDO
    const handleAddSubsection = (currentIndex) => {
        setData(prev => {
            if (!prev) return prev;
            const newSecoes = [...prev.secoes];
            newSecoes.splice(currentIndex + 1, 0, { 
                id: generateId(), 
                titulo: 'Nova Subseção', 
                conteudo: '', 
                level: 2 
            });
            return { ...prev, secoes: newSecoes };
        });
    };

    const handleAddSection = () => {
        setData(prev => {
            if (!prev) return prev;
            const newSecoes = [...prev.secoes, { 
                id: generateId(), 
                titulo: 'NOVA SEÇÃO', 
                conteudo: '', 
                level: 1 
            }];
            return { ...prev, secoes: newSecoes };
        });
    };

    const handleDeleteSection = (id) => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <Trash2 className="text-red-500 shrink-0" size={20} />
                    <span className={`font-bold text-sm ${settings.theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                        Remover esta seção?
                    </span>
                </div>
                <p className={`text-xs ${settings.theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Esta ação não pode ser desfeita. Todo o conteúdo será apagado.
                </p>
                <div className="flex gap-2 justify-end mt-2">
                    <button 
                        onClick={() => toast.dismiss(t.id)} 
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${settings.theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={() => {
                            setData(prev => ({...prev, secoes: prev.secoes.filter(s => s.id !== id)}));
                            toast.dismiss(t.id);
                            toast.success("Seção removida com sucesso.");
                        }} 
                        className="px-3 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                    >
                        Sim, Remover
                    </button>
                </div>
            </div>
        ), { 
            duration: Infinity,
            style: {
                background: settings.theme === 'dark' ? '#0f172a' : '#ffffff',
                border: `1px solid ${settings.theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                padding: '16px',
            }
        });
    };

    const insertTemplate = (index, sectionTitle) => {
        if(isReadOnly) return;
        const key = Object.keys(SECTION_TEMPLATES).find(k => sectionTitle.toUpperCase().includes(k));
        
        if (key) {
            toast((t) => (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <Wand2 className="text-purple-500 shrink-0" size={20} />
                        <span className={`font-bold text-sm ${settings.theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                            Carregar Modelo?
                        </span>
                    </div>
                    <p className={`text-xs ${settings.theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        Deseja inserir o texto base de auxílio para esta seção?
                    </p>
                    <div className="flex gap-2 justify-end mt-2">
                        <button 
                            onClick={() => toast.dismiss(t.id)} 
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${settings.theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={() => {
                                setData(prev => {
                                    const newSecoes = [...prev.secoes];
                                    newSecoes[index] = { 
                                        ...newSecoes[index], 
                                        conteudo: (newSecoes[index].conteudo + "\n\n" + SECTION_TEMPLATES[key]).trim() 
                                    };
                                    return { ...prev, secoes: newSecoes };
                                });
                                toast.dismiss(t.id);
                                toast.success("Modelo inserido!");
                            }} 
                            className="px-3 py-1.5 text-xs font-bold text-white bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
                        >
                            Sim, Inserir
                        </button>
                    </div>
                </div>
            ), { 
                duration: Infinity,
                style: {
                    background: settings.theme === 'dark' ? '#0f172a' : '#ffffff',
                    border: `1px solid ${settings.theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                    padding: '16px',
                }
            });
        } else {
            toast.error("Nenhum modelo disponível para este título.");
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-20">
            {/* Identificação */}
            <section className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Settings2 size={12}/> Identificação</h3>
              <input readOnly={isReadOnly} placeholder="Instituição" className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-green-600 ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={data.instituicao} onChange={e => setData(prev => ({...prev, instituicao: e.target.value}))} />
              <input readOnly={isReadOnly} placeholder="Nome do Curso" className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-green-600 ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={data.curso} onChange={e => setData(prev => ({...prev, curso: e.target.value}))} />
              <input readOnly={isReadOnly} placeholder="Título Oficial" className={`w-full p-2.5 border rounded-lg text-sm font-bold outline-none focus:border-green-600 ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={data.titulo} onChange={e => setData(prev => ({...prev, titulo: e.target.value}))} />
              <input readOnly={isReadOnly} placeholder="Subtítulo" className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-green-600 ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={data.subtitulo} onChange={e => setData(prev => ({...prev, subtitulo: e.target.value}))} />
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Natureza do Trabalho (Folha de Rosto)</label>
                <textarea 
                    readOnly={isReadOnly} 
                    placeholder="Ex: Trabalho de Conclusão de Curso apresentado ao IFPA..." 
                    className={`w-full p-2.5 border rounded-lg text-xs h-20 outline-none focus:border-green-600 ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
                    value={data.naturezaTrabalho} 
                    onChange={e => setData(prev => ({...prev, naturezaTrabalho: e.target.value}))} 
                />
              </div>

              <div className="flex gap-2">
                <input readOnly={isReadOnly} placeholder="Cidade" className={`flex-1 p-2 border rounded text-xs outline-none ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={data.cidade} onChange={e => setData(prev => ({...prev, cidade: e.target.value}))} />
                <select disabled={isReadOnly} className={`p-2 border rounded text-xs ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={data.estado} onChange={e => setData(prev => ({...prev, estado: e.target.value}))}>{ESTADOS_BR.map(u => <option key={u} value={u}>{u}</option>)}</select>
              </div>
            </section>
            
            {/* Alunos */}
            <section>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Users size={12}/> Alunos</h3>
                    <button disabled={isReadOnly} onClick={() => setAuthors([...authors].sort())} className="text-[10px] font-bold text-green-700 hover:underline">A-Z</button>
                </div>
                <div className="space-y-2">
                    {authors.map((a, i) => (
                        <div key={i} className="flex gap-2">
                            <input readOnly={isReadOnly} className={`flex-1 p-2 border rounded-lg text-xs ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={a} onChange={e => { const n = [...authors]; n[i] = e.target.value; setAuthors(n); }} placeholder="Nome Completo do Aluno" />
                            {!isReadOnly && authors.length > 1 && <button onClick={() => setAuthors(authors.filter((_, idx) => idx !== i))} className="text-red-300"><Trash2 size={16}/></button>}
                        </div>
                    ))}
                    {!isReadOnly && <button onClick={() => setAuthors([...authors, ''])} className="w-full py-1.5 border-2 border-dashed rounded text-[10px] font-bold text-slate-400 hover:text-green-700 transition-all">+ ADICIONAR ALUNO</button>}
                </div>
            </section>

            {/* Orientadores */}
            <section>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><UserCheck size={12}/> Orientadores</h3>
                </div>
                <div className="space-y-2">
                    {(data.orientadores || ['']).map((o, i) => (
                        <div key={i} className="flex gap-2">
                            <input readOnly={isReadOnly} className={`flex-1 p-2 border rounded-lg text-xs ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={o} onChange={e => { setData(prev => { const n = [...(prev.orientadores || [''])]; n[i] = e.target.value; return {...prev, orientadores: n}; }); }} placeholder="Nome do Orientador/Coorientador" />
                            {!isReadOnly && (data.orientadores || ['']).length > 1 && <button onClick={() => setData(prev => ({...prev, orientadores: prev.orientadores.filter((_, idx) => idx !== i)}))} className="text-red-300"><Trash2 size={16}/></button>}
                        </div>
                    ))}
                    {!isReadOnly && <button onClick={() => setData(prev => ({...prev, orientadores: [...(prev.orientadores || ['']), '']}))} className="w-full py-1.5 border-2 border-dashed rounded text-[10px] font-bold text-slate-400 hover:text-green-700 transition-all">+ ADICIONAR ORIENTADOR</button>}
                </div>
            </section>
            
            {/* Elementos Pré-Textuais Opcionais */}
            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Heart size={12}/> Elementos Pré-Textuais Opcionais</h3>
              <textarea readOnly={isReadOnly} placeholder="Dedicatória..." className={`w-full p-3 border rounded-lg text-xs h-20 ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={data.dedicatoria || ''} onChange={e => setData(prev => ({...prev, dedicatoria: e.target.value}))} />
              <textarea readOnly={isReadOnly} placeholder="Agradecimentos..." className={`w-full p-3 border rounded-lg text-xs h-32 ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={data.agradecimentos || ''} onChange={e => setData(prev => ({...prev, agradecimentos: e.target.value}))} />
              <textarea readOnly={isReadOnly} placeholder="Epígrafe (Citação que inspira o trabalho)..." className={`w-full p-3 border rounded-lg text-xs h-20 italic ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={data.epigrafe || ''} onChange={e => setData(prev => ({...prev, epigrafe: e.target.value}))} />
            </section>

            {/* Resumos com Contador Inteligente */}
            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Globe size={12}/> Resumos e Abstract</h3>
              
              <div className="space-y-1">
                  <textarea readOnly={isReadOnly} placeholder="Resumo (PT)" className={`w-full p-3 border rounded-lg text-xs h-32 ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={data.resumoPt} onChange={e => setData(prev => ({...prev, resumoPt: e.target.value}))} />
                  <div className="flex justify-end">
                      <WordCounter text={data.resumoPt} min={150} max={500} />
                  </div>
              </div>

              <input readOnly={isReadOnly} placeholder="Palavras-chave" className={`w-full p-2 border rounded-lg text-xs mb-2 ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={data.palavrasChavePt} onChange={e => setData(prev => ({...prev, palavrasChavePt: e.target.value}))} />
              
              <div className="space-y-1">
                  <textarea readOnly={isReadOnly} placeholder="Abstract (EN)" className={`w-full p-3 border rounded-lg text-xs h-32 italic ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={data.resumoEn} onChange={e => setData(prev => ({...prev, resumoEn: e.target.value}))} />
                  <div className="flex justify-end">
                      <WordCounter text={data.resumoEn} min={150} max={500} />
                  </div>
              </div>

              <input readOnly={isReadOnly} placeholder="Keywords (EN)" className={`w-full p-2 border rounded-lg text-xs ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={data.palavrasChaveEn} onChange={e => setData(prev => ({...prev, palavrasChaveEn: e.target.value}))} />
            </section>
            
            {/* Seções/Capítulos */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><BookOpen size={12}/> Capítulos</h3>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={data.secoes.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {data.secoes.map((s, i) => (
                      <SortableSection 
                        key={s.id} 
                        s={s} 
                        i={i} 
                        settings={settings}
                        isReadOnly={isReadOnly}
                        focusedSection={focusedSection}
                        setFocusedSection={setFocusedSection}
                        insertTemplate={insertTemplate}
                        onDelete={handleDeleteSection}
                        onOpenAssetModal={onOpenAssetModal}
                        onUpdate={handleUpdateSection}
                        onAddSubsection={handleAddSubsection}
                        onOpenRefModal={onOpenRefModal}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {!isReadOnly && (
                <div className="flex pt-2">
                  <button onClick={handleAddSection} className="w-full py-2.5 border-2 border-dashed border-green-300 dark:border-green-800 rounded-lg text-[10px] font-bold text-green-700 dark:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all flex justify-center items-center gap-1 uppercase">
                    <Plus size={14}/> Adicionar Nova Seção
                  </button>
                </div>
              )}
            </section>
            
            {/* Referências */}
            <section id="edit-sec-referencias" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><BookMarked size={12}/> Referências</h3>
                {!isReadOnly && <button onClick={onOpenRefModal} className="text-[9px] font-bold text-green-700 hover:underline uppercase transition-all">Gerar NBR 6023</button>}
              </div>
              <textarea readOnly={isReadOnly} placeholder="Cole as referências..." className={`w-full p-3 border rounded-lg text-[10px] font-mono h-40 outline-none ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={data.referencias} onChange={e => setData(prev => ({...prev, referencias: e.target.value}))} />
            </section>

            {/* Elementos Pós-Textuais Opcionais */}
            <section className="space-y-4 pb-10">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Layers size={12}/> Elementos Pós-Textuais Opcionais</h3>
              
              <div id="edit-sec-apendices" className="space-y-2">
                  <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Apêndices (Do Autor)</label>
                      {!isReadOnly && (
                          <button onClick={() => onOpenAttachmentModal('apendice')} className="text-[9px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 flex items-center gap-1 uppercase transition-all bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-md">
                              <Plus size={10}/> Gerar Automático
                          </button>
                      )}
                  </div>
                  <textarea readOnly={isReadOnly} placeholder="Documentos elaborados pelo próprio autor para complementar a argumentação..." className={`w-full p-3 border rounded-lg text-xs h-32 outline-none ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={data.apendices || ''} onChange={e => setData(prev => ({...prev, apendices: e.target.value}))} />
              </div>
              
              <div id="edit-sec-anexos" className="space-y-2 mt-6">
                  <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Anexos (De Terceiros)</label>
                      {!isReadOnly && (
                          <button onClick={() => onOpenAttachmentModal('anexo')} className="text-[9px] font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 flex items-center gap-1 uppercase transition-all bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded-md">
                              <Plus size={10}/> Gerar Automático
                          </button>
                      )}
                  </div>
                  <textarea readOnly={isReadOnly} placeholder="Documentos NÃO elaborados pelo autor, ex: leis, mapas de terceiros..." className={`w-full p-3 border rounded-lg text-xs h-32 outline-none ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={data.anexos || ''} onChange={e => setData(prev => ({...prev, anexos: e.target.value}))} />
              </div>
            </section>
        </div>
    );
};

export default EditorForm;