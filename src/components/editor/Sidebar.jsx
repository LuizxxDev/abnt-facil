import React from 'react';
import { ListTodo, X } from 'lucide-react';

const Sidebar = ({ sumarioItens, scrollToSection, setShowOutline, settings }) => {
    return (
        <aside className={`w-52 border-l hidden xl:flex flex-col print:hidden transition-all ${settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className={`p-4 border-b flex items-center justify-between ${settings.theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ListTodo size={12}/> Navegação</h3>
              <button onClick={() => setShowOutline(false)} className={`p-1 rounded-md transition-colors ${settings.theme === 'dark' ? 'hover:bg-slate-800 text-slate-500 hover:text-red-400' : 'hover:bg-slate-100 text-slate-400 hover:text-red-500'}`} title="Fechar Navegação"><X size={14}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {sumarioItens.map(item => (
                <button 
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full text-left p-2 rounded-lg text-xs transition-all flex items-center gap-3 group ${settings.theme === 'dark' ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'}`}
                >
                  <span className={`font-bold shrink-0 ${item.level === 1 ? 'text-green-600' : 'text-slate-300 group-hover:text-green-500'}`}>{item.num}</span>
                  <span className={`truncate ${item.level === 1 ? 'font-bold' : 'font-medium'}`}>{item.titulo || 'Sem Título'}</span>
                </button>
              ))}
              {sumarioItens.length === 0 && (
                <div className="text-center p-4 text-xs text-slate-400 italic">Adicione seções para navegar.</div>
              )}
            </div>
        </aside>
    );
};

export default Sidebar;