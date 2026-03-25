import React from 'react';
import { ListTodo, X, GripVertical, BookMarked, Layers } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableNavItem = ({ item, scrollToSection, settings, closeOnMobile }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
    
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto', opacity: isDragging ? 0.5 : 1 };

    const handleClick = () => { scrollToSection(item.id); closeOnMobile(); };

    return (
        <div ref={setNodeRef} style={style} className={`w-full text-left p-1.5 rounded-lg text-xs transition-all flex items-center gap-1 group ${settings.theme === 'dark' ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'}`}>
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-green-500 transition-colors touch-none" title="Arrastar para reordenar"><GripVertical size={14} /></div>
            <button onClick={handleClick} className="flex items-center gap-2 flex-1 truncate text-left outline-none">
                <span className={`font-bold shrink-0 ${item.level === 1 ? 'text-green-600' : 'text-slate-300 group-hover:text-green-500'}`}>{item.num}</span>
                <span className={`truncate ${item.level === 1 ? 'font-bold' : 'font-medium'}`}>{item.titulo || 'Sem Título'}</span>
            </button>
        </div>
    );
};

// Componente Abstrato para secar a repetição dos elementos pós-textuais
const PostTextualButton = ({ onClick, icon: Icon, label, theme }) => (
    <button onClick={onClick} className={`w-full text-left p-2 rounded-lg text-xs transition-all flex items-center gap-2 font-bold ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'}`}>
        <Icon size={14} className="text-slate-400" /> {label}
    </button>
);

const Sidebar = ({ sumarioItens, scrollToSection, setShowOutline, settings, onReorder, data }) => {
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id && onReorder) {
            const oldIndex = sumarioItens.findIndex(s => s.id === active.id);
            const newIndex = sumarioItens.findIndex(s => s.id === over.id);
            onReorder(oldIndex, newIndex);
        }
    };

    const closeOnMobile = () => { if (window.innerWidth < 1280) setShowOutline(false); };

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-40 xl:hidden animate-in fade-in" onClick={() => setShowOutline(false)} />
            
            <aside className={`fixed inset-y-0 right-0 z-50 w-64 shadow-2xl xl:shadow-none xl:static xl:w-60 xl:border-l flex flex-col print:hidden transition-transform duration-300 ease-in-out transform translate-x-0 xl:translate-x-0 ${settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`p-4 border-b flex items-center justify-between ${settings.theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ListTodo size={12}/> Navegação</h3>
                  <button onClick={() => setShowOutline(false)} className={`p-1 rounded-md transition-colors ${settings.theme === 'dark' ? 'hover:bg-slate-800 text-slate-500 hover:text-red-400' : 'hover:bg-slate-100 text-slate-400 hover:text-red-500'}`} title="Fechar Navegação"><X size={14}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={sumarioItens.map(i => i.id)} strategy={verticalListSortingStrategy}>
                        {sumarioItens.map(item => (
                            <SortableNavItem key={item.id} item={item} scrollToSection={scrollToSection} settings={settings} closeOnMobile={closeOnMobile} />
                        ))}
                    </SortableContext>
                  </DndContext>
                  
                  {sumarioItens.length === 0 && <div className="text-center p-4 text-xs text-slate-400 italic">Adicione seções para navegar.</div>}

                  {data && (
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
                          <PostTextualButton onClick={() => { scrollToSection('referencias'); closeOnMobile(); }} icon={BookMarked} label="REFERÊNCIAS" theme={settings.theme} />
                          {data.apendices?.trim() && <PostTextualButton onClick={() => { scrollToSection('apendices'); closeOnMobile(); }} icon={Layers} label="APÊNDICES" theme={settings.theme} />}
                          {data.anexos?.trim() && <PostTextualButton onClick={() => { scrollToSection('anexos'); closeOnMobile(); }} icon={Layers} label="ANEXOS" theme={settings.theme} />}
                      </div>
                  )}

                </div>
            </aside>
        </>
    );
};

export default Sidebar;