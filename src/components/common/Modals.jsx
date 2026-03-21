import React from 'react';
import { Sun, Moon, Save, AlertOctagon, Eraser, Settings2, X, Check, UserCircle } from 'lucide-react';
import { AVATAR_OPTIONS } from '../../utils/constants';

export const TitleModal = ({ isOpen, onClose, title, setTitle, onConfirm }) => {
    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm();
        setTitle(''); 
        onClose();
    };

    const handleClose = () => {
        setTitle(''); 
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden transition-colors">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Novo Trabalho</h3>
                    <button type="button" onClick={handleClose} className="text-slate-400 hover:text-red-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-8">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                            Título do Projeto
                        </label>
                        <input 
                            autoFocus
                            type="text" 
                            className="w-full p-4 border-2 border-slate-200 dark:border-slate-600 rounded-2xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:border-green-600 dark:focus:border-green-500 transition-colors font-bold"
                            placeholder="Ex: TCC sobre IA..."
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            required
                        />
                    </div>
                    
                    <div className="flex justify-end gap-3">
                        <button 
                            type="button" 
                            onClick={handleClose}
                            className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            className="flex-[2] py-3 rounded-xl font-bold bg-green-700 text-white hover:bg-green-800 shadow-lg shadow-green-900/20 transition-all hover:-translate-y-0.5"
                        >
                            Criar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const SettingsModal = ({ isOpen, onClose, settings, setSettings, onDeleteAll }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className={`${settings.theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'} w-full max-w-md rounded-3xl p-8 shadow-2xl transition-all max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center gap-3 mb-6 border-b border-slate-200/20 pb-4">
              <Settings2 className="text-slate-400" />
              <h2 className="text-xl font-black">Configurações</h2>
            </div>
            
            <div className="space-y-6">
              {/* --- NOVO: CAMPO DE NOME --- */}
              <div>
                <label className="text-xs font-bold uppercase opacity-50 mb-2 block">Seu Nome</label>
                <div className="relative">
                    <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Como quer ser chamado?"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none focus:border-green-600 dark:focus:border-green-500 transition-all text-sm font-bold"
                        value={settings.userName}
                        onChange={(e) => setSettings({...settings, userName: e.target.value})}
                    />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase opacity-50 mb-3 block">Escolha seu Avatar</label>
                <div className="grid grid-cols-4 gap-2">
                    {AVATAR_OPTIONS.map((avatar) => (
                        <button
                            key={avatar.id}
                            onClick={() => setSettings({...settings, avatarId: avatar.id})}
                            className={`relative p-3 rounded-xl flex items-center justify-center transition-all ${settings.avatarId === avatar.id ? 'bg-green-600 text-white shadow-lg scale-110' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200'}`}
                            title={avatar.label}
                        >
                            {avatar.icon}
                            {settings.avatarId === avatar.id && (
                                <div className="absolute -top-1 -right-1 bg-white text-green-600 rounded-full p-0.5 shadow-sm">
                                    <Check size={10} strokeWidth={4} />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase opacity-50 mb-2 block">Aparência</label>
                <div className="flex bg-slate-100/10 p-1 rounded-xl">
                  <button onClick={() => setSettings({...settings, theme: 'light'})} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${settings.theme === 'light' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:bg-white/5'}`}><Sun size={14}/> Claro</button>
                  <button onClick={() => setSettings({...settings, theme: 'dark'})} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${settings.theme === 'dark' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:bg-white/5'}`}><Moon size={14}/> Escuro</button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase opacity-50 mb-2 block">Fonte Padrão do Editor</label>
                <div className="flex bg-slate-100/10 p-1 rounded-xl">
                  <button onClick={() => setSettings({...settings, defaultFont: 'Arial'})} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${settings.defaultFont === 'Arial' ? (settings.theme === 'dark' ? 'bg-slate-700' : 'bg-white shadow-sm') : 'opacity-50'}`}>Arial</button>
                  <button onClick={() => setSettings({...settings, defaultFont: 'Times New Roman'})} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold font-serif transition-all ${settings.defaultFont === 'Times New Roman' ? (settings.theme === 'dark' ? 'bg-slate-700' : 'bg-white shadow-sm') : 'opacity-50'}`}>Times New Roman</button>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${settings.autoSave ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}><Save size={18}/></div>
                  <div><p className="font-bold text-sm">Salvamento Automático</p><p className="text-[10px] opacity-60">Salvar enquanto digita</p></div>
                </div>
                <button onClick={() => setSettings({...settings, autoSave: !settings.autoSave})} className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.autoSave ? 'bg-green-500' : 'bg-slate-300'}`}><div className={`bg-white w-4 h-4 rounded-full shadow-md transition-transform ${settings.autoSave ? 'translate-x-6' : 'translate-x-0'}`} /></button>
              </div>

              <div className="pt-4 border-t border-slate-200/20">
                <label className="text-xs font-bold uppercase text-red-400 mb-2 block flex items-center gap-2"><AlertOctagon size={12}/> Zona de Perigo</label>
                <button onClick={onDeleteAll} className="w-full border border-red-200/30 text-red-500 hover:bg-red-500/10 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"><Eraser size={14}/> Apagar TODOS os Dados</button>
              </div>
            </div>
            <div className="mt-8"><button onClick={onClose} className="w-full py-3 bg-slate-200/10 hover:bg-slate-200/20 rounded-xl font-bold text-sm transition-colors">Fechar</button></div>
          </div>
        </div>
    );
};