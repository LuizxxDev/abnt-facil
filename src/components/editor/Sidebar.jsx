import React, { useEffect } from 'react';
import { X, GripVertical, BookMarked, Layers } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { iconBtn } from '../common/ui';

const itemCls = 'flex min-h-9 w-full items-center gap-2 rounded-[var(--radius-control)] px-2 text-left text-sm text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink pointer-coarse:min-h-11';

const SortableNavItem = ({ item, scrollToSection, closeOnMobile }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto', opacity: isDragging ? 0.6 : 1 };

    return (
        <li ref={setNodeRef} style={style} className="group flex items-center" >
            <button type="button" {...attributes} {...listeners} aria-label={`Arrastar “${item.titulo || 'Sem título'}” para reordenar`}
                className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-[4px] text-ink-3 opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing pointer-coarse:opacity-100">
                <GripVertical size={14} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => { scrollToSection(item.id); closeOnMobile(); }} className={`${itemCls} min-w-0`} style={{ paddingLeft: `${0.5 + (item.level - 1) * 0.75}rem` }}>
                {item.num && <span className={`tabular shrink-0 ${item.level === 1 ? 'font-semibold text-ink' : 'text-ink-3'}`}>{item.num}</span>}
                <span className={`truncate ${item.level === 1 ? 'font-semibold text-ink' : ''}`}>{item.titulo || 'Sem título'}</span>
            </button>
        </li>
    );
};

const Sidebar = ({ sumarioItens, scrollToSection, setShowOutline, onReorder, data }) => {
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id && onReorder) {
            const oldIndex = sumarioItens.findIndex(s => s.id === active.id);
            const newIndex = sumarioItens.findIndex(s => s.id === over.id);
            onReorder(oldIndex, newIndex);
        }
    };

    const closeOnMobile = () => { if (!window.matchMedia('(min-width: 1280px)').matches) setShowOutline(false); };

    // Esc fecha a gaveta (só ocupa a tela abaixo de 1280px)
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape' && !window.matchMedia('(min-width: 1280px)').matches) setShowOutline(false); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [setShowOutline]);

    return (
        <>
            <div className="fade-in fixed inset-0 z-40 bg-slate-950/40 xl:hidden" onClick={() => setShowOutline(false)} aria-hidden="true" />

            <aside aria-label="Sumário" className="drawer-in safe-top fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col bg-surface shadow-[var(--shadow-float)] print:hidden xl:static xl:z-auto xl:w-64 xl:border-l xl:border-line xl:pt-0 xl:shadow-none">
                <div className="flex h-14 shrink-0 items-center justify-between border-b border-line pl-4 pr-2">
                    <h2 className="text-sm font-semibold">Sumário</h2>
                    <button type="button" onClick={() => setShowOutline(false)} className={iconBtn} aria-label="Fechar sumário"><X size={18} /></button>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={sumarioItens.map(i => i.id)} strategy={verticalListSortingStrategy}>
                            <ul className="space-y-0.5">
                                {sumarioItens.map(item => (
                                    <SortableNavItem key={item.id} item={item} scrollToSection={scrollToSection} closeOnMobile={closeOnMobile} />
                                ))}
                            </ul>
                        </SortableContext>
                    </DndContext>

                    {sumarioItens.length === 0 && <p className="p-4 text-center text-sm text-ink-3">As seções que você criar aparecem aqui.</p>}

                    {data && (
                        <ul className="mt-3 space-y-0.5 border-t border-line pt-3">
                            <li><button type="button" onClick={() => { scrollToSection('referencias'); closeOnMobile(); }} className={itemCls}><BookMarked size={16} className="shrink-0 text-ink-3" aria-hidden="true" /> Referências</button></li>
                            {data.apendices?.trim() && <li><button type="button" onClick={() => { scrollToSection('apendices'); closeOnMobile(); }} className={itemCls}><Layers size={16} className="shrink-0 text-ink-3" aria-hidden="true" /> Apêndices</button></li>}
                            {data.anexos?.trim() && <li><button type="button" onClick={() => { scrollToSection('anexos'); closeOnMobile(); }} className={itemCls}><Layers size={16} className="shrink-0 text-ink-3" aria-hidden="true" /> Anexos</button></li>}
                        </ul>
                    )}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
