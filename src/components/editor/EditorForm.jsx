import React, { useRef, useMemo } from 'react';
import { 
  Settings2, Users, Trash2, Globe, BookOpen, Wand2, Lightbulb, 
  Quote, Image as ImageIcon, TableIcon, Box, BookMarked, GripVertical,
  UserCheck, Heart, Layers, Plus, ArrowRight, ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { SECTION_GUIDES, SECTION_TEMPLATES, ESTADOS_BR } from '../../utils/constants';
import { generateId } from '../../utils/helpers';
import { EditorToolbar } from './EditorToolbar';

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
        <div ref={setNodeRef} style={style} className={`p-4 border rounded-xl space-y-3 transition-all ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'} ${currentLevel > 1 ? 'ml-6 border-l-4 border-l-green-200' : ''}`}>
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

const EditorForm = ({ data, setData, authors, setAuthors, settings, isReadOnly, focusedSection, setFocusedSection, onOpenAssetModal, onOpenRefModal, onOpenAttachmentModal }) => {
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

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-20">
            {/* Identificação */}
            <section className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Settings2 size={12}/> Identificação</h3>
              <ThemedInput theme={settings.theme} readOnly={isReadOnly} placeholder="Instituição" value={data.instituicao} onChange={e => updateField('instituicao', e.target.value)} />
              <ThemedInput theme={settings.theme} readOnly={isReadOnly} placeholder="Nome do Curso" value={data.curso} onChange={e => updateField('curso', e.target.value)} />
              <ThemedInput theme={settings.theme} readOnly={isReadOnly} placeholder="Título Oficial" className="font-bold" value={data.titulo} onChange={e => updateField('titulo', e.target.value)} />
              <ThemedInput theme={settings.theme} readOnly={isReadOnly} placeholder="Subtítulo" value={data.subtitulo} onChange={e => updateField('subtitulo', e.target.value)} />
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Natureza do Trabalho (Folha de Rosto)</label>
                <ThemedTextarea theme={settings.theme} readOnly={isReadOnly} className="h-20" placeholder="Ex: Trabalho de Conclusão de Curso apresentado ao IFPA..." value={data.naturezaTrabalho} onChange={e => updateField('naturezaTrabalho', e.target.value)} />
              </div>

              <div className="flex gap-2">
                <ThemedInput theme={settings.theme} readOnly={isReadOnly} placeholder="Cidade" className="flex-1" value={data.cidade} onChange={e => updateField('cidade', e.target.value)} />
                <select disabled={isReadOnly} className={`p-2 border rounded-lg text-xs outline-none focus:border-green-600 transition-colors ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} value={data.estado} onChange={e => updateField('estado', e.target.value)}>{ESTADOS_BR.map(u => <option key={u} value={u}>{u}</option>)}</select>
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
                            <ThemedInput theme={settings.theme} readOnly={isReadOnly} className="flex-1" value={a} onChange={e => { const n = [...authors]; n[i] = e.target.value; setAuthors(n); }} placeholder="Nome Completo do Aluno" />
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
                            <ThemedInput theme={settings.theme} readOnly={isReadOnly} className="flex-1" value={o} onChange={e => { setData(prev => { const n = [...(prev.orientadores || [''])]; n[i] = e.target.value; return {...prev, orientadores: n}; }); }} placeholder="Nome do Orientador/Coorientador" />
                            {!isReadOnly && (data.orientadores || ['']).length > 1 && <button onClick={() => setData(prev => ({...prev, orientadores: prev.orientadores.filter((_, idx) => idx !== i)}))} className="text-red-300"><Trash2 size={16}/></button>}
                        </div>
                    ))}
                    {!isReadOnly && <button onClick={() => setData(prev => ({...prev, orientadores: [...(prev.orientadores || ['']), '']}))} className="w-full py-1.5 border-2 border-dashed rounded text-[10px] font-bold text-slate-400 hover:text-green-700 transition-all">+ ADICIONAR ORIENTADOR</button>}
                </div>
            </section>
            
            {/* Elementos Pré-Textuais */}
            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Heart size={12}/> Elementos Pré-Textuais Opcionais</h3>
              <ThemedTextarea theme={settings.theme} readOnly={isReadOnly} className="h-20" placeholder="Dedicatória..." value={data.dedicatoria || ''} onChange={e => updateField('dedicatoria', e.target.value)} />
              <ThemedTextarea theme={settings.theme} readOnly={isReadOnly} className="h-32" placeholder="Agradecimentos..." value={data.agradecimentos || ''} onChange={e => updateField('agradecimentos', e.target.value)} />
              <ThemedTextarea theme={settings.theme} readOnly={isReadOnly} className="h-20 italic" placeholder="Epígrafe (Citação que inspira o trabalho)..." value={data.epigrafe || ''} onChange={e => updateField('epigrafe', e.target.value)} />
            </section>

            {/* Resumos */}
            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Globe size={12}/> Resumos e Abstract</h3>
              <div className="space-y-1">
                  <ThemedTextarea theme={settings.theme} readOnly={isReadOnly} className="h-32" placeholder="Resumo (PT)" value={data.resumoPt} onChange={e => updateField('resumoPt', e.target.value)} />
                  <div className="flex justify-end"><WordCounter text={data.resumoPt} min={150} max={500} /></div>
              </div>
              <ThemedInput theme={settings.theme} readOnly={isReadOnly} placeholder="Palavras-chave" value={data.palavrasChavePt} onChange={e => updateField('palavrasChavePt', e.target.value)} />
              
              <div className="space-y-1">
                  <ThemedTextarea theme={settings.theme} readOnly={isReadOnly} className="h-32 italic" placeholder="Abstract (EN)" value={data.resumoEn} onChange={e => updateField('resumoEn', e.target.value)} />
                  <div className="flex justify-end"><WordCounter text={data.resumoEn} min={150} max={500} /></div>
              </div>
              <ThemedInput theme={settings.theme} readOnly={isReadOnly} placeholder="Keywords (EN)" value={data.palavrasChaveEn} onChange={e => updateField('palavrasChaveEn', e.target.value)} />
            </section>
            
            {/* Capítulos */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><BookOpen size={12}/> Capítulos</h3>
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
                  {/* CORREÇÃO DO BOTÃO ADICIONAR NOVA SEÇÃO AQUI */}
                  <button 
                    onClick={handleAddSection} 
                    className="w-full py-2.5 border-2 border-dashed border-green-300 dark:border-green-800 rounded-lg text-[10px] font-bold text-green-700 dark:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all flex items-center justify-center gap-1 uppercase"
                  >
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
              <ThemedTextarea theme={settings.theme} readOnly={isReadOnly} className="h-40 font-mono text-[10px]" placeholder="Cole as referências..." value={data.referencias} onChange={e => updateField('referencias', e.target.value)} />
            </section>

            {/* Pós-Textuais */}
            <section className="space-y-4 pb-10">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Layers size={12}/> Elementos Pós-Textuais Opcionais</h3>
              <div id="edit-sec-apendices" className="space-y-2">
                  <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Apêndices (Do Autor)</label>
                      {!isReadOnly && <button onClick={() => onOpenAttachmentModal('apendice')} className="text-[9px] font-bold text-purple-600 flex items-center gap-1 uppercase bg-purple-50 px-2 py-1 rounded-md"><Plus size={10}/> Automático</button>}
                  </div>
                  <ThemedTextarea theme={settings.theme} readOnly={isReadOnly} className="h-32" placeholder="Documentos do próprio autor..." value={data.apendices || ''} onChange={e => updateField('apendices', e.target.value)} />
              </div>
              <div id="edit-sec-anexos" className="space-y-2 mt-6">
                  <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Anexos (De Terceiros)</label>
                      {!isReadOnly && <button onClick={() => onOpenAttachmentModal('anexo')} className="text-[9px] font-bold text-orange-600 flex items-center gap-1 uppercase bg-orange-50 px-2 py-1 rounded-md"><Plus size={10}/> Automático</button>}
                  </div>
                  <ThemedTextarea theme={settings.theme} readOnly={isReadOnly} className="h-32" placeholder="Leis, mapas de terceiros..." value={data.anexos || ''} onChange={e => updateField('anexos', e.target.value)} />
              </div>
            </section>
        </div>
    );
};

export default EditorForm;