import React, { useRef } from 'react';
import { 
  Settings2, Users, Trash2, Globe, BookOpen, Wand2, Lightbulb, 
  Quote, Image as ImageIcon, TableIcon, Box, BookMarked, GripVertical,
  UserCheck
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

const SortableSection = ({ s, i, settings, isReadOnly, focusedSection, setFocusedSection, insertTemplate, onDelete, onOpenAssetModal, onUpdate, onOpenRefModal }) => {
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
        <div ref={setNodeRef} style={style} className={`p-4 border rounded-xl space-y-3 transition-all ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'} ${s.level > 1 ? 'ml-6 border-l-4 border-l-green-200' : ''}`}>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    {!isReadOnly && (
                        <button {...attributes} {...listeners} className="cursor-grab p-1 text-slate-300 hover:text-slate-500 active:cursor-grabbing touch-none">
                            <GripVertical size={16}/>
                        </button>
                    )}
                    <span className={`text-[8px] font-black uppercase tracking-tighter ${s.level > 1 ? 'text-green-500' : 'text-slate-300'}`}>
                        {s.level === 1 ? 'Primária' : 'Secundária'}
                    </span>
                </div>
                <div className="flex gap-1">
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
            <div className="flex flex-wrap gap-1 mt-2">
                <button onClick={() => onOpenAssetModal('cit', i)} className="text-[8px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100 flex items-center gap-1 hover:bg-green-100"><Quote size={10}/> Citação</button>
                <button onClick={() => onOpenAssetModal('img', i)} className="text-[8px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100 flex items-center gap-1 hover:bg-blue-100"><ImageIcon size={10}/> Imagem</button>
                <button onClick={() => onOpenAssetModal('tab', i)} className="text-[8px] font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded border border-orange-100 flex items-center gap-1 hover:bg-orange-100"><TableIcon size={10}/> Tabela</button>
                <button onClick={() => onOpenAssetModal('box', i)} className="text-[8px] font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 flex items-center gap-1 hover:bg-indigo-100"><Box size={10}/> Quadro</button>
            </div>
        </div>
    );
};

const EditorForm = ({ data, setData, authors, setAuthors, settings, isReadOnly, focusedSection, setFocusedSection, onOpenAssetModal, onOpenRefModal }) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = data.secoes.findIndex(s => s.id === active.id);
            const newIndex = data.secoes.findIndex(s => s.id === over.id);
            setData({ ...data, secoes: arrayMove(data.secoes, oldIndex, newIndex) });
            toast.success("Ordem das seções atualizada!");
        }
    };

    const handleUpdateSection = (index, field, value) => {
        const n = [...data.secoes];
        n[index][field] = value;
        setData({...data, secoes: n});
    };

    const handleDeleteSection = (id) => {
        if (window.confirm("Deseja realmente remover esta seção?")) {
            setData({...data, secoes: data.secoes.filter(s => s.id !== id)});
            toast.success("Seção removida.");
        }
    };

    const insertTemplate = (index, sectionTitle) => {
        if(isReadOnly) return;
        const key = Object.keys(SECTION_TEMPLATES).find(k => sectionTitle.toUpperCase().includes(k));
        if (key && window.confirm("Deseja carregar o modelo de texto para esta seção?")) {
            const newSec = [...data.secoes];
            newSec[index].conteudo = (newSec[index].conteudo + "\n\n" + SECTION_TEMPLATES[key]).trim();
            setData({...data, secoes: newSec});
            toast.success("Modelo inserido!");
        } else if (!key) {
            toast.error("Nenhum modelo disponível para este título.");
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-20">
            {/* Identificação */}
            <section className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Settings2 size={12}/> Identificação</h3>
              <input readOnly={isReadOnly} placeholder="Instituição" className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-green-600 ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={data.instituicao} onChange={e => setData({...data, instituicao: e.target.value})} />
              <input readOnly={isReadOnly} placeholder="Nome do Curso" className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-green-600 ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={data.curso} onChange={e => setData({...data, curso: e.target.value})} />
              <input readOnly={isReadOnly} placeholder="Título Oficial" className={`w-full p-2.5 border rounded-lg text-sm font-bold outline-none focus:border-green-600 ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={data.titulo} onChange={e => setData({...data, titulo: e.target.value})} />
              <input readOnly={isReadOnly} placeholder="Subtítulo" className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-green-600 ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={data.subtitulo} onChange={e => setData({...data, subtitulo: e.target.value})} />
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Natureza do Trabalho (Folha de Rosto)</label>
                <textarea 
                    readOnly={isReadOnly} 
                    placeholder="Ex: Trabalho de Conclusão de Curso apresentado ao IFPA..." 
                    className={`w-full p-2.5 border rounded-lg text-xs h-20 outline-none focus:border-green-600 ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
                    value={data.naturezaTrabalho} 
                    onChange={e => setData({...data, naturezaTrabalho: e.target.value})} 
                />
              </div>

              <div className="flex gap-2">
                <input readOnly={isReadOnly} placeholder="Cidade" className={`flex-1 p-2 border rounded text-xs outline-none ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={data.cidade} onChange={e => setData({...data, cidade: e.target.value})} />
                <select disabled={isReadOnly} className={`p-2 border rounded text-xs ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={data.estado} onChange={e => setData({...data, estado: e.target.value})}>{ESTADOS_BR.map(u => <option key={u} value={u}>{u}</option>)}</select>
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

            {/* Orientadores - NOVO BLOCO DINÂMICO */}
            <section>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><UserCheck size={12}/> Orientadores</h3>
                </div>
                <div className="space-y-2">
                    {(data.orientadores || ['']).map((o, i) => (
                        <div key={i} className="flex gap-2">
                            <input readOnly={isReadOnly} className={`flex-1 p-2 border rounded-lg text-xs ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={o} onChange={e => { const n = [...(data.orientadores || [''])]; n[i] = e.target.value; setData({...data, orientadores: n}); }} placeholder="Nome do Orientador/Coorientador" />
                            {!isReadOnly && (data.orientadores || ['']).length > 1 && <button onClick={() => setData({...data, orientadores: data.orientadores.filter((_, idx) => idx !== i)})} className="text-red-300"><Trash2 size={16}/></button>}
                        </div>
                    ))}
                    {!isReadOnly && <button onClick={() => setData({...data, orientadores: [...(data.orientadores || ['']), '']})} className="w-full py-1.5 border-2 border-dashed rounded text-[10px] font-bold text-slate-400 hover:text-green-700 transition-all">+ ADICIONAR ORIENTADOR</button>}
                </div>
            </section>
            
            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Globe size={12}/> Resumos e Abstract</h3>
              <textarea readOnly={isReadOnly} placeholder="Resumo (PT)" className={`w-full p-3 border rounded-lg text-xs h-32 ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={data.resumoPt} onChange={e => setData({...data, resumoPt: e.target.value})} />
              <input readOnly={isReadOnly} placeholder="Palavras-chave" className={`w-full p-2 border rounded-lg text-xs mb-2 ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={data.palavrasChavePt} onChange={e => setData({...data, palavrasChavePt: e.target.value})} />
              <textarea readOnly={isReadOnly} placeholder="Abstract (EN)" className={`w-full p-3 border rounded-lg text-xs h-32 italic ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={data.resumoEn} onChange={e => setData({...data, resumoEn: e.target.value})} />
              <input readOnly={isReadOnly} placeholder="Keywords (EN)" className={`w-full p-2 border rounded-lg text-xs ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={data.palavrasChaveEn} onChange={e => setData({...data, palavrasChaveEn: e.target.value})} />
            </section>
            
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><BookOpen size={12}/> Capítulos</h3>
                {!isReadOnly && (
                  <div className="flex gap-1">
                    <button onClick={() => setData({...data, secoes: [...data.secoes, { id: generateId(), titulo: 'Nova Subseção', conteudo: '', level: 2 }]})} className="text-[9px] bg-slate-100 px-2 py-1 rounded font-bold uppercase hover:bg-slate-200 transition-all text-slate-700">+ Subseção</button>
                    <button onClick={() => setData({...data, secoes: [...data.secoes, { id: generateId(), titulo: 'NOVA SEÇÃO', conteudo: '', level: 1 }]})} className="text-[9px] bg-green-700 text-white px-2 py-1 rounded font-bold uppercase hover:bg-green-800 transition-all">+ Seção</button>
                  </div>
                )}
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
                        onOpenRefModal={onOpenRefModal}
                        onUpdate={handleUpdateSection}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </section>
            
            <section className="space-y-4 pb-10">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><BookMarked size={12}/> Referências</h3>
                {!isReadOnly && <button onClick={onOpenRefModal} className="text-[9px] font-bold text-green-700 hover:underline uppercase transition-all">Gerar NBR 6023</button>}
              </div>
              <textarea readOnly={isReadOnly} placeholder="Cole as referências..." className={`w-full p-3 border rounded-lg text-[10px] font-mono h-40 outline-none ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={data.referencias} onChange={e => setData({...data, referencias: e.target.value})} />
            </section>
        </div>
    );
};

export default EditorForm;