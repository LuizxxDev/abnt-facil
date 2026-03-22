import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText, Settings2, PlusCircle, Lightbulb, Search,
    Trash2, Star, BookTemplate, Eye, Sparkles, MoreVertical,
    RotateCcw, Copy, Box, Clock, CheckCircle2, FileEdit, Ghost,
    ChevronRight, Loader2, LayoutGrid, List as ListIcon, Download, Upload,
    Sun, Moon, Cloud, CloudOff, User, Home
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppContext } from '../contexts/AppContext';
import { ABNT_TIPS, EXAMPLE_ID, PROJECT_TYPES } from '../utils/constants'; 
import { calculateProgress, timeAgo } from '../utils/helpers';
import { TitleModal, SettingsModal } from '../components/common/Modals';

const Dashboard = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const { 
        projects, settings, setSettings, 
        createNewProject, createFromExample, createFromModel,
        duplicateProject, duplicateAsTemplate,
        deleteProject, restoreProject, updateProject,
        importAllProjects,
        user, loginWithGoogle, logout,
        isAuthLoading, isDataLoading 
    } = useAppContext();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterTab, setFilterTab] = useState('all');
    const [sortOrder, setSortOrder] = useState('recent');
    const [viewMode, setViewMode] = useState('list'); 
    const [tipIndex, setTipIndex] = useState(0);
    const [isTitleModalOpen, setIsTitleModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [newProjectTitle, setNewProjectTitle] = useState('');
    const [activeMenuId, setActiveMenuId] = useState(null);

    const isLoadingGlobal = isAuthLoading || isDataLoading;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.project-menu-container')) {
                setActiveMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setTipIndex(Math.floor(Math.random() * ABNT_TIPS.length));
    }, []);

    const displayName = user?.user_metadata?.full_name?.split(' ')[0] || settings.userName || "Estudante";

    const userAvatar = useMemo(() => {
        if (user?.user_metadata?.avatar_url) {
            return <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-2xl md:rounded-3xl" referrerPolicy="no-referrer" />;
        }
        return <User size={28} className="md:w-8 md:h-8" />;
    }, [user]);

    const handleExportBackup = () => {
        if (projects.length === 0) {
            toast.error("Não há projetos para exportar.");
            return;
        }
        const dataStr = JSON.stringify(projects, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup_abnt_facil_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Backup gerado com sucesso!");
    };

    const handleImportBackup = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                if (!Array.isArray(imported)) throw new Error("Formato inválido");
                
                const count = importAllProjects(imported);
                if (count > 0) {
                    toast.success(`${count} projeto(s) importado(s)!`);
                } else {
                    toast.error("Nenhum projeto novo encontrado no ficheiro.");
                }
            } catch (err) {
                toast.error("Ficheiro de backup inválido.");
            }
        };
        reader.readAsText(file);
        e.target.value = null;
    };

    const toggleTheme = () => {
        setSettings(s => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }));
    };

    const counts = useMemo(() => ({
        all: projects.filter(p => !p.deleted).length,
        favorites: projects.filter(p => !p.deleted && p.favorite).length,
        trash: projects.filter(p => p.deleted).length
    }), [projects]);

    const stats = useMemo(() => {
        const active = projects.filter(p => !p.deleted);
        const completed = active.filter(p => calculateProgress(p.data).percent >= 80).length;
        return { total: active.length, completed: completed };
    }, [projects]);

    const processedProjects = useMemo(() => {
        let filtered = projects.filter(p => {
            if (filterTab === 'trash') return p.deleted;
            if (filterTab === 'favorites') return !p.deleted && p.favorite;
            return !p.deleted;
        });
        if (searchTerm) filtered = filtered.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
        return filtered.sort((a, b) => {
            if (sortOrder === 'recent') return new Date(b.updatedAt) - new Date(a.updatedAt);
            if (sortOrder === 'az') return a.title.localeCompare(b.title);
            if (sortOrder === 'progress') return calculateProgress(b.data).percent - calculateProgress(a.data).percent;
            return 0;
        });
    }, [projects, filterTab, searchTerm, sortOrder]);

    const handleCreate = () => {
        if (!newProjectTitle.trim()) return;
        const id = createNewProject(newProjectTitle);
        toast.success("Projeto criado!");
        navigate(`/editor/${id}`);
    };

    const handleCreateModel = (key) => {
        const id = createFromModel(key);
        toast.success(`${PROJECT_TYPES[key].label} criado!`);
        navigate(`/editor/${id}`);
    };

    const theme = {
        bg: settings.theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50',
        text: settings.theme === 'dark' ? 'text-slate-100' : 'text-slate-800',
        textMuted: settings.theme === 'dark' ? 'text-slate-400' : 'text-slate-500',
        cardBg: settings.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100',
        inputBg: settings.theme === 'dark' ? 'bg-slate-700 text-white' : 'bg-slate-50 text-slate-800',
    };

    if (isLoadingGlobal) {
        return (
            <div className={`h-screen flex items-center justify-center transition-colors duration-300 ${theme.bg}`}>
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-green-700" size={48} />
                    <p className={`text-xs font-black uppercase tracking-widest animate-pulse ${theme.textMuted}`}>A Sincronizar Informações...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`h-screen overflow-y-auto font-sans p-4 md:p-8 scroll-smooth transition-colors duration-300 ${theme.bg} ${theme.text}`}>
            <div className="max-w-7xl mx-auto space-y-6 pb-24">
                
                {/* Header Responsivo */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                    <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left duration-500">
                        <div className="relative group cursor-pointer shrink-0" onClick={() => setIsSettingsModalOpen(true)}>
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl md:rounded-3xl bg-green-600 text-white flex items-center justify-center shadow-lg shadow-green-900/20 group-hover:scale-105 transition-all">
                                {userAvatar}
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 p-1 rounded-lg border shadow-sm text-slate-400 group-hover:text-green-600 transition-colors z-10">
                                <Settings2 size={12} />
                            </div>
                            {user && (
                                <div className="absolute -top-1 -right-1 bg-green-500 text-white p-1 rounded-full border-2 border-white dark:border-slate-900 shadow-sm z-10" title="Sincronizado na Nuvem">
                                    <Cloud size={10} strokeWidth={3}/>
                                </div>
                            )}
                        </div>
                        <div>
                            <h1 className={`text-xl md:text-3xl font-black tracking-tight mb-0.5 ${theme.text}`}>
                                Olá, {displayName}
                            </h1>
                            <p className={`text-[10px] md:text-xs max-w-md ${theme.textMuted}`}>Gere os teus {stats.total} projetos académicos.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 md:gap-3 w-full xl:w-auto animate-in fade-in slide-in-from-right duration-500 overflow-x-auto pb-2 xl:pb-0" style={{ scrollbarWidth: 'none' }}>
                        <div className={`${theme.cardBg} px-3 py-2 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl shadow-sm border flex items-center gap-3 shrink-0`}>
                            <div className="bg-blue-50 text-blue-600 p-1.5 md:p-2 rounded-lg"><FileText size={16} /></div>
                            <div><p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Total</p><p className={`text-lg font-black leading-none mt-1 ${theme.text}`}>{stats.total}</p></div>
                        </div>
                        <div className={`${theme.cardBg} px-3 py-2 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl shadow-sm border flex items-center gap-3 shrink-0`}>
                            <div className="bg-green-50 text-green-600 p-1.5 md:p-2 rounded-lg"><CheckCircle2 size={16} /></div>
                            <div><p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Concluídos</p><p className={`text-lg font-black leading-none mt-1 ${theme.text}`}>{stats.completed}</p></div>
                        </div>
                        
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1 shrink-0"></div>
                        
                        <div className="flex gap-2 shrink-0">
                            <button onClick={toggleTheme} className={`${theme.cardBg} h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl shadow-sm border flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-slate-400 hover:text-amber-500 dark:hover:text-amber-400`} title="Alternar Tema">
                                {settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                            <button onClick={() => setIsSettingsModalOpen(true)} className={`${theme.cardBg} h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl shadow-sm border flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-slate-400 hover:text-slate-600 dark:hover:text-white`} title="Configurações">
                                <Settings2 size={18} />
                            </button>
                            
                            <button onClick={() => setIsTitleModalOpen(true)} className="fixed bottom-6 right-6 md:static md:bottom-auto md:right-auto z-40 bg-green-700 text-white px-4 md:px-6 h-12 md:h-12 rounded-full md:rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-800 transition-all shadow-xl shadow-green-900/20 hover:-translate-y-0.5">
                                <PlusCircle size={20} />
                                <span className="hidden md:inline text-xs">Novo Projeto</span>
                            </button>
                        </div>
                    </div>
                </div>

                {!user && (
                    <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-4 md:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-white animate-in fade-in slide-in-from-top-4 duration-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-8 -mr-8 text-blue-500/20 pointer-events-none">
                            <CloudOff size={100} />
                        </div>
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="bg-white/20 p-2 rounded-lg shrink-0 backdrop-blur-md border border-white/20">
                                <CloudOff size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Modo Local (Sem Backup)</h3>
                                <p className="text-[10px] text-blue-100 max-w-xl">Os projetos estão guardados neste navegador. Faz login para não perderes nada.</p>
                            </div>
                        </div>
                        <button onClick={loginWithGoogle} className="w-full md:w-auto bg-white text-blue-700 px-4 py-2 rounded-lg font-bold text-xs shadow-md hover:bg-blue-50 transition-all flex items-center justify-center gap-2 relative z-10">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                            Entrar
                        </button>
                    </div>
                )}

                {/* --- UI COMPACTA: Dica + Modelos na mesma área --- */}
                {filterTab === 'all' && !searchTerm && (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-700">
                        {/* Dica Ultra Fina */}
                        <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg p-2 flex items-center gap-2 text-blue-800 dark:text-blue-300">
                            <Lightbulb size={14} className="text-blue-500 shrink-0 ml-1"/>
                            <p className="text-[10px] md:text-xs"><span className="font-bold uppercase mr-1 opacity-70">Dica:</span> {ABNT_TIPS[tipIndex]}</p>
                        </div>

                        {/* Carrossel de Modelos e Exemplo (Compacto) */}
                        <div>
                            <div className="flex overflow-x-auto gap-3 pb-2 snap-x" style={{ scrollbarWidth: 'none' }}>
                                
                                {/* 1. Cartão Especial: Exemplo Completo */}
                                <div className={`${settings.theme === 'dark' ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'} p-4 rounded-[1.2rem] border-2 flex flex-col min-w-[220px] max-w-[220px] snap-center shrink-0 relative overflow-hidden group`}>
                                    <div className="absolute -right-4 -top-4 text-blue-500/10 pointer-events-none"><BookTemplate size={80} /></div>
                                    <div className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center mb-2 z-10 shadow-sm"><Star size={14} /></div>
                                    <h3 className="font-bold text-sm mb-0.5 text-blue-900 dark:text-blue-100 z-10">Exemplo Completo</h3>
                                    <p className="text-[9px] text-blue-700/70 dark:text-blue-300/70 leading-tight mb-3 flex-1 z-10">Um TCC preenchido com todos os elementos para inspiração.</p>
                                    <div className="flex gap-1.5 z-10 mt-auto">
                                        <button onClick={() => navigate(`/editor/${EXAMPLE_ID}`)} className="flex-1 py-1.5 rounded-md text-[9px] font-bold bg-white/50 dark:bg-slate-800 text-blue-800 dark:text-blue-300 hover:bg-white dark:hover:bg-slate-700 transition-colors border border-blue-200/50 dark:border-blue-700/50 flex items-center justify-center gap-1"><Eye size={12}/> Ver</button>
                                        <button onClick={async () => { const id = await createFromExample(); navigate(`/editor/${id}`); toast.success("Exemplo clonado!"); }} className="flex-1 py-1.5 rounded-md text-[9px] font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-1"><Copy size={12}/> Clonar</button>
                                    </div>
                                </div>

                                {/* 2. Cartões de Modelos Normais */}
                                {Object.keys(PROJECT_TYPES).map((key) => (
                                    <button 
                                        key={key}
                                        onClick={() => handleCreateModel(key)}
                                        className={`${theme.cardBg} p-4 rounded-[1.2rem] border-2 border-transparent hover:border-green-600 transition-all text-left group flex flex-col min-w-[180px] max-w-[180px] snap-center shrink-0`}
                                    >
                                        <div className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 w-8 h-8 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                            {PROJECT_TYPES[key].icon}
                                        </div>
                                        <h3 className="font-bold text-sm mb-0.5">{PROJECT_TYPES[key].label}</h3>
                                        <p className="text-[9px] text-slate-400 leading-tight mb-3 flex-1">{PROJECT_TYPES[key].description}</p>
                                        <div className="text-[9px] font-bold text-green-600 uppercase mt-auto flex items-center">Criar <ChevronRight size={10} className="ml-0.5" /></div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Filtros e Pesquisa */}
                <div className={`flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 p-1.5 rounded-2xl shadow-sm border ${theme.cardBg}`}>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                        <div className={`flex overflow-x-auto p-1 rounded-xl ${settings.theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`} style={{ scrollbarWidth: 'none' }}>
                            <button onClick={() => setFilterTab('all')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 shrink-0 ${filterTab === 'all' ? (settings.theme === 'dark' ? 'bg-slate-600 text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm') : 'text-slate-400 hover:text-slate-600'}`}>
                                Todos <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${filterTab === 'all' ? (settings.theme === 'dark' ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700') : (settings.theme === 'dark' ? 'bg-slate-600' : 'bg-slate-200')}`}>{counts.all}</span>
                            </button>
                            <button onClick={() => setFilterTab('favorites')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 shrink-0 ${filterTab === 'favorites' ? (settings.theme === 'dark' ? 'bg-slate-600 text-orange-400 shadow-sm' : 'bg-white text-orange-500 shadow-sm') : 'text-slate-400 hover:text-orange-400'}`}>
                                <Star size={12} /> Favoritos
                            </button>
                            <button onClick={() => setFilterTab('trash')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 shrink-0 ${filterTab === 'trash' ? (settings.theme === 'dark' ? 'bg-slate-600 text-red-400 shadow-sm' : 'bg-white text-red-500 shadow-sm') : 'text-slate-400 hover:text-red-400'}`}>
                                <Trash2 size={12} /> Lixeira
                            </button>
                        </div>

                        <div className="flex gap-1.5 justify-end">
                            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportBackup} />
                            <button onClick={() => fileInputRef.current.click()} className={`p-1.5 rounded-lg border transition-all flex justify-center ${theme.cardBg} hover:text-blue-600 hover:border-blue-200`} title="Importar Backup">
                                <Upload size={14}/>
                            </button>
                            <button onClick={handleExportBackup} className={`p-1.5 rounded-lg border transition-all flex justify-center ${theme.cardBg} hover:text-green-600 hover:border-green-200`} title="Exportar Backup">
                                <Download size={14}/>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full lg:w-auto">
                        <div className={`hidden md:flex p-1 rounded-xl ${settings.theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>
                            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? (settings.theme === 'dark' ? 'bg-slate-600 text-green-400 shadow-sm' : 'bg-white text-green-700 shadow-sm') : 'text-slate-400'}`} title="Vista em Grid"><LayoutGrid size={14}/></button>
                            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? (settings.theme === 'dark' ? 'bg-slate-600 text-green-400 shadow-sm' : 'bg-white text-green-700 shadow-sm') : 'text-slate-400'}`} title="Vista em Lista"><ListIcon size={14}/></button>
                        </div>
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input type="text" placeholder="Procurar projeto..." className={`w-full pl-8 pr-3 py-1.5 border-none rounded-xl text-xs outline-none focus:ring-2 focus:ring-green-500/20 ${theme.inputBg}`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <select className={`bg-transparent text-[10px] font-bold outline-none cursor-pointer p-1.5 ${settings.theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                            <option value="recent">Recentes</option>
                            <option value="az">A-Z</option>
                        </select>
                    </div>
                </div>

                {/* Lista de Projetos */}
                <div className={viewMode === 'grid' && window.innerWidth >= 768 ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-2.5"}>
                    {processedProjects.map((p, idx) => (
                        <div key={p.id} className="animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 30}ms` }}>
                            <ProjectCard 
                                project={p} theme={theme}
                                viewMode={window.innerWidth < 768 ? 'list' : viewMode}
                                isMenuOpen={activeMenuId === p.id}
                                onToggleMenu={() => setActiveMenuId(activeMenuId === p.id ? null : p.id)}
                                onLoad={() => navigate(`/editor/${p.id}`)}
                                onFav={() => { updateProject(p.id, { favorite: !p.favorite }); toast.success(p.favorite ? "Removido dos favoritos" : "Favorito!"); }}
                                onDel={() => { deleteProject(p.id); toast.success("Movido para a lixeira"); }}
                                onRestore={() => { restoreProject(p.id); toast.success("Restaurado!"); }}
                                onDeletePermanent={() => { if(window.confirm("Apagar permanentemente?")) { deleteProject(p.id, true); toast.success("Eliminado."); } }}
                                onDuplicate={() => { duplicateProject(p.id); toast.success("Cópia criada!"); }}
                                onDuplicateTemplate={() => { duplicateAsTemplate(p.id); toast.success("Modelo criado!"); }}
                            />
                        </div>
                    ))}
                    {processedProjects.length === 0 && (
                        <div className="text-center py-12 opacity-50 border-2 border-dashed rounded-3xl border-slate-300 dark:border-slate-700 mt-4">
                            <Ghost size={40} className="mx-auto mb-3 text-slate-400"/>
                            <p className="text-sm font-bold">Nenhum projeto por aqui.</p>
                            <p className="text-xs mt-1">Cria um novo TCC ou clona um modelo acima.</p>
                        </div>
                    )}
                </div>

                <TitleModal isOpen={isTitleModalOpen} onClose={() => setIsTitleModalOpen(false)} title={newProjectTitle} setTitle={setNewProjectTitle} onConfirm={handleCreate} />
                <SettingsModal 
                    isOpen={isSettingsModalOpen} 
                    onClose={() => setIsSettingsModalOpen(false)} 
                    settings={settings} 
                    setSettings={setSettings} 
                    onDeleteAll={() => { if(window.confirm("Desejas apagar TUDO? Esta ação é irreversível.")) { localStorage.clear(); toast.error("Todos os dados foram eliminados."); window.location.reload(); } }} 
                    user={user}
                    loginWithGoogle={loginWithGoogle}
                    logout={logout}
                />
            </div>
        </div>
    );
};

const ProjectCard = ({ project, theme, viewMode, isMenuOpen, onToggleMenu, onLoad, onFav, onDel, onRestore, onDeletePermanent, onDuplicate, onDuplicateTemplate }) => {
    const progress = calculateProgress(project.data);
    const isTrash = project.deleted;

    if (viewMode === 'list') {
        return (
            <div className={`${theme.cardBg} rounded-xl border border-transparent hover:border-green-600 transition-all px-4 py-2.5 group flex items-center justify-between shadow-sm project-menu-container`}>
                <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={!isTrash ? onLoad : undefined}>
                    <div className={`p-2 rounded-lg shrink-0 ${isTrash ? 'bg-slate-100 text-slate-400 dark:bg-slate-800' : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                        <FileText size={18} />
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                        <h3 className="font-bold text-sm truncate group-hover:text-green-700 transition-colors">{project.title}</h3>
                        <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                            <span className={progress.status === 'green' ? 'text-green-600 dark:text-green-400' : ''}>{progress.percent}% Concluído</span>
                            <span className="flex items-center gap-1"><Clock size={9}/> {timeAgo(project.updatedAt)}</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
                    {!isTrash && (
                        <button onClick={onFav} className={`p-2 transition-colors ${project.favorite ? 'text-orange-400' : 'text-slate-300'}`}>
                            <Star size={16} fill={project.favorite ? "currentColor" : "none"} />
                        </button>
                    )}
                    <div className="relative">
                        <button onClick={onToggleMenu} className="p-2 text-slate-300 hover:text-slate-800 dark:hover:text-white"><MoreVertical size={16}/></button>
                        {isMenuOpen && (
                            <div className="absolute right-0 top-8 w-44 bg-white rounded-xl shadow-2xl border p-1.5 z-50 text-slate-800 dark:bg-slate-700 dark:text-white dark:border-slate-600">
                                {isTrash ? (
                                    <button onClick={onRestore} className="w-full text-left px-3 py-2 text-[10px] font-bold hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg flex items-center gap-2"><RotateCcw size={14}/> Restaurar</button>
                                ) : (
                                    <>
                                        <button onClick={onLoad} className="w-full text-left px-3 py-2 text-[10px] font-bold hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg flex items-center gap-2"><FileEdit size={14}/> Abrir</button>
                                        <button onClick={onDuplicate} className="w-full text-left px-3 py-2 text-[10px] font-bold hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg flex items-center gap-2"><Copy size={14}/> Duplicar</button>
                                    </>
                                )}
                                <div className="h-px w-full bg-slate-100 dark:bg-slate-600 my-1"></div>
                                <button onClick={isTrash ? onDeletePermanent : onDel} className="w-full text-left px-3 py-2 text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg flex items-center gap-2"><Trash2 size={14}/> {isTrash ? 'Eliminar Definitivo' : 'Mover p/ Lixeira'}</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`${theme.cardBg} rounded-2xl border-2 border-transparent hover:border-green-600 transition-all p-5 group flex flex-col relative h-full shadow-sm hover:shadow-md project-menu-container`}>
            <div className="flex justify-between mb-3">
                <div onClick={!isTrash ? onLoad : undefined} className={`p-2.5 rounded-xl transition-transform group-hover:scale-105 ${isTrash ? 'bg-slate-100 dark:bg-slate-800 cursor-default text-slate-400' : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-pointer'}`}><FileText size={20} /></div>
                <div className="flex items-center gap-0.5">
                    {!isTrash && (
                        <button onClick={(e) => { e.stopPropagation(); onFav(); }} className={`p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${project.favorite ? 'text-orange-400' : 'text-slate-300'}`}>
                            <Star size={16} fill={project.favorite ? "currentColor" : "none"} />
                        </button>
                    )}
                    <button onClick={onToggleMenu} className="p-1.5 rounded-full text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"><MoreVertical size={16} /></button>
                    {isMenuOpen && (
                        <div className="absolute right-6 top-14 w-44 bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600 rounded-xl shadow-2xl border p-1.5 z-50 text-slate-800">
                            {isTrash ? (
                                <>
                                    <button onClick={onRestore} className="w-full text-left px-3 py-2 text-[10px] font-bold hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-400 rounded-lg flex items-center gap-2"><RotateCcw size={14} /> Restaurar</button>
                                    <button onClick={onDeletePermanent} className="w-full text-left px-3 py-2 text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg flex items-center gap-2"><Trash2 size={14} /> Eliminar</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={onLoad} className="w-full text-left px-3 py-2 text-[10px] font-bold hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg flex items-center gap-2"><FileEdit size={14} /> Abrir</button>
                                    <button onClick={onDuplicate} className="w-full text-left px-3 py-2 text-[10px] font-bold hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg flex items-center gap-2"><Copy size={14} /> Duplicar</button>
                                    <div className="h-px w-full bg-slate-100 dark:bg-slate-600 my-1"></div>
                                    <button onClick={onDel} className="w-full text-left px-3 py-2 text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg flex items-center gap-2"><Trash2 size={14} /> Lixeira</button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            <div onClick={!isTrash ? onLoad : undefined} className={`flex-1 ${!isTrash ? 'cursor-pointer' : ''}`}>
                <h3 className="font-bold text-base mb-1.5 line-clamp-2 leading-tight group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">{project.title}</h3>
                <div className="flex items-center gap-2 mb-3 text-[9px] text-slate-400 font-bold uppercase">
                    <span className={`px-1.5 py-0.5 rounded ${progress.status === 'green' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-700'}`}>{progress.label}</span>
                    <span className="flex items-center gap-1"><Clock size={9} /> {timeAgo(project.updatedAt)}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden shadow-inner">
                    <div className={`h-full rounded-full transition-all duration-1000 ${progress.status === 'green' ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-500'}`} style={{ width: `${progress.percent}%` }} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;