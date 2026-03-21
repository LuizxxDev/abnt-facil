import React from 'react';
import { Sun, Moon, Save, AlertOctagon, Eraser, Settings2, X, Check, UserCircle, Cloud, CloudOff, LogOut } from 'lucide-react';

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

export const SettingsModal = ({ isOpen, onClose, settings, setSettings, onDeleteAll, user, loginWithGoogle, logout }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className={`${settings.theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'} w-full max-w-md rounded-3xl p-8 shadow-2xl transition-all max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center gap-3 mb-6 border-b border-slate-200/20 pb-4">
              <Settings2 className="text-slate-400" />
              <h2 className="text-xl font-black">Configurações</h2>
            </div>
            
            <div className="space-y-8">
              
              {/* --- CONTA E SINCRONIZAÇÃO NUVEM --- */}
              <div>
                <label className="text-xs font-bold uppercase opacity-50 mb-3 flex items-center gap-2">
                    <Cloud size={14} /> Nuvem e Sincronização
                </label>
                {user ? (
                    <div className="bg-green-500/10 border border-green-500/20 p-5 rounded-2xl flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            {user.user_metadata?.avatar_url ? (
                                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-12 h-12 rounded-full border-2 border-green-500/30" />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><UserCircle size={24}/></div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-green-600 dark:text-green-400 truncate">{user.user_metadata?.full_name || 'Estudante'}</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{user.email}</p>
                            </div>
                        </div>
                        <button onClick={logout} className="w-full py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2">
                            <LogOut size={14}/> Sair da Conta
                        </button>
                    </div>
                ) : (
                    <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-200 dark:bg-slate-800 rounded-lg text-slate-400"><CloudOff size={20}/></div>
                            <div>
                                <p className="text-sm font-bold">Modo Local Offline</p>
                                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Sem cópias de segurança na nuvem.</p>
                            </div>
                        </div>
                        <button onClick={loginWithGoogle} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-md">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                            Fazer Login para Sincronizar
                        </button>
                    </div>
                )}
              </div>

              {/* --- CAMPO DE NOME (Apenas exibido se não estiver logado pelo Google para evitar conflitos) --- */}
              {!user && (
                  <div>
                    <label className="text-xs font-bold uppercase opacity-50 mb-2 block">Seu Nome Local</label>
                    <div className="relative">
                        <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Como quer ser chamado?"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none focus:border-green-600 dark:focus:border-green-500 transition-all text-sm font-bold"
                            value={settings.userName || ''}
                            onChange={(e) => setSettings({...settings, userName: e.target.value})}
                        />
                    </div>
                  </div>
              )}

              {/* --- PREFERÊNCIAS DO EDITOR --- */}
              <div className="space-y-5">
                  <div>
                    <label className="text-xs font-bold uppercase opacity-50 mb-2 block">Aparência da Aplicação</label>
                    <div className="flex bg-slate-100/50 dark:bg-slate-700/50 p-1 rounded-xl">
                      <button onClick={() => setSettings({...settings, theme: 'light'})} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${settings.theme === 'light' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}><Sun size={14}/> Claro</button>
                      <button onClick={() => setSettings({...settings, theme: 'dark'})} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${settings.theme === 'dark' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}><Moon size={14}/> Escuro</button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase opacity-50 mb-2 block">Fonte Padrão no Editor</label>
                    <div className="flex bg-slate-100/50 dark:bg-slate-700/50 p-1 rounded-xl">
                      <button onClick={() => setSettings({...settings, defaultFont: 'Arial'})} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${settings.defaultFont === 'Arial' ? (settings.theme === 'dark' ? 'bg-slate-700' : 'bg-white shadow-sm') : 'opacity-50 hover:opacity-100'}`}>Arial</button>
                      <button onClick={() => setSettings({...settings, defaultFont: 'Times New Roman'})} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold font-serif transition-all ${settings.defaultFont === 'Times New Roman' ? (settings.theme === 'dark' ? 'bg-slate-700' : 'bg-white shadow-sm') : 'opacity-50 hover:opacity-100'}`}>Times New Roman</button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${settings.autoSave ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}><Save size={18}/></div>
                      <div><p className="font-bold text-sm">Salvamento Automático</p><p className="text-[10px] opacity-60">Salvar projeto enquanto digita</p></div>
                    </div>
                    <button onClick={() => setSettings({...settings, autoSave: !settings.autoSave})} className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.autoSave ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}><div className={`bg-white w-4 h-4 rounded-full shadow-md transition-transform ${settings.autoSave ? 'translate-x-6' : 'translate-x-0'}`} /></button>
                  </div>
              </div>

              <div className="pt-4 border-t border-slate-200/20">
                <label className="text-xs font-bold uppercase text-red-400 mb-3 block flex items-center gap-2"><AlertOctagon size={14}/> Zona de Perigo</label>
                <button onClick={onDeleteAll} className="w-full border border-red-200/30 text-red-500 hover:bg-red-500 hover:text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"><Eraser size={16}/> Apagar Todos os Meus Projetos</button>
              </div>
            </div>
            <div className="mt-8"><button onClick={onClose} className="w-full py-3.5 bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-xl font-bold text-sm transition-colors">Guardar e Fechar</button></div>
          </div>
        </div>
    );
};