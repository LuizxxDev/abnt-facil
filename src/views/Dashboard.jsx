import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText, Settings2, PlusCircle, Lightbulb, Search,
    Trash2, Star, BookTemplate, Eye, Sparkles, MoreVertical,
    RotateCcw, Copy, Box, Clock, CheckCircle2, FileEdit, Ghost,
    ChevronRight, Loader2, LayoutGrid, List as ListIcon, Download, Upload
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppContext } from '../contexts/AppContext';
import { ABNT_TIPS, EXAMPLE_ID, PROJECT_TYPES, AVATAR_OPTIONS } from '../utils/constants'; 
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
        importAllProjects
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
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

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

    const userAvatar = useMemo(() => {
        const option = AVATAR_OPTIONS.find(a => a.id === settings.avatarId) || AVATAR_OPTIONS[0];
        return option.icon;
    }, [settings.avatarId]);

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

    if (isLoading) {
        return (
            <div className={`h-screen flex items-center justify-center transition-colors duration-300 ${theme.bg}`}>
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-green-700" size={48} />
                    <p className={`text-xs font-black uppercase tracking-widest animate-pulse ${theme.textMuted}`}>A preparar o teu espaço...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`h-screen overflow-y-auto font-sans p-6 md:p-12 scroll-smooth transition-colors duration-300 ${theme.bg} ${theme.text}`}>
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header com Nome Personalizado */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
                    <div className="flex items-center gap-6 animate-in fade-in slide-in-from-left duration-500">
                        <div className="relative group cursor-pointer" onClick={() => setIsSettingsModalOpen(true)}>
                            <div className="w-16 h-16 rounded-3xl bg-green-600 text-white flex items-center justify-center shadow-lg shadow-green-900/20 group-hover:scale-105 transition-all">
                                {userAvatar}
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 p-1 rounded-lg border shadow-sm text-slate-400 group-hover:text-green-600 transition-colors">
                                <Settings2 size={12} />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-bold uppercase tracking-widest ${theme.textMuted}`}>
                                    {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </span>
                            </div>
                            <h1 className={`text-4xl font-black tracking-tight mb-1 ${theme.text}`}>
                                Olá, {settings.userName || "Estudante"}
                            </h1>
                            <p className={`text-sm max-w-md ${theme.textMuted}`}>Gerencie seus {stats.total} projetos acadêmicos.</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap md:flex-nowrap items-center gap-4 w-full xl:w-auto animate-in fade-in slide-in-from-right duration-500">
                        <div className={`${theme.cardBg} p-4 pr-8 rounded-2xl shadow-sm border flex items-center gap-4 flex-1 xl:flex-none`}><div className="bg-blue-50 text-blue-600 p-3 rounded-xl"><FileText size={20} /></div><div><p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total</p><p className={`text-2xl font-black ${theme.text}`}>{stats.total}</p></div></div>
                        <div className={`${theme.cardBg} p-4 pr-8 rounded-2xl shadow-sm border flex items-center gap-4 flex-1 xl:flex-none`}><div className="bg-green-50 text-green-600 p-3 rounded-xl"><CheckCircle2 size={20} /></div><div><p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Concluídos</p><p className={`text-2xl font-black ${theme.text}`}>{stats.completed}</p></div></div>
                        <div className="h-12 w-px bg-slate-200 mx-2 hidden md:block"></div>
                        <div className="flex gap-3 flex-1 xl:flex-none">
                            <button onClick={() => setIsSettingsModalOpen(true)} className={`${theme.cardBg} h-14 w-14 rounded-2xl shadow-sm border flex items-center justify-center hover:bg-slate-100 transition-all text-slate-400 hover:text-slate-600`} title="Configurações"><Settings2 size={22} /></button>
                            <button onClick={() => setIsTitleModalOpen(true)} className="bg-green-700 text-white px-8 h-14 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-green-800 transition-all shadow-lg shadow-green-900/20 hover:shadow-xl hover:-translate-y-0.5 flex-1 xl:flex-none whitespace-nowrap"><PlusCircle size={22} /><span>Novo Projeto</span></button>
                        </div>
                    </div>
                </div>

                {/* O restante do Dashboard segue o mesmo padrão anterior */}
                {filterTab === 'all' && !searchTerm && (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-700">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Modelos Rápidos ABNT</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {Object.keys(PROJECT_TYPES).map((key) => (
                                <button 
                                    key={key}
                                    onClick={() => handleCreateModel(key)}
                                    className={`${theme.cardBg} p-5 rounded-3xl border-2 border-transparent hover:border-green-600 hover:shadow-xl hover:-translate-y-1 transition-all text-left group flex flex-col h-full relative overflow-hidden`}
                                >
                                    <div className="bg-green-50 text-green-700 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        {PROJECT_TYPES[key].icon}
                                    </div>
                                    <h3 className="font-bold text-base mb-1">{PROJECT_TYPES[key].label}</h3>
                                    <p className="text-[10px] text-slate-400 leading-tight mb-4 flex-1">
                                        {PROJECT_TYPES[key].description}
                                    </p>
                                    <div className="flex items-center text-[10px] font-bold text-green-600 uppercase tracking-wider">
                                        Começar agora <ChevronRight size={12} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-4 text-blue-800 animate-in fade-in slide-in-from-bottom-4 duration-500"><div className="bg-white p-2 rounded-lg shadow-sm text-blue-600"><Lightbulb size={20} /></div><div><p className="text-xs font-bold uppercase opacity-70">Dica ABNT da Semana</p><p className="text-sm font-medium">{ABNT_TIPS[tipIndex]}</p></div></div>

                <div className={`flex flex-col lg:flex-row justify-between items-center gap-4 p-2 rounded-2xl shadow-sm border ${theme.cardBg}`}>
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <div className={`flex p-1 rounded-xl ${settings.theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>
                            <button onClick={() => setFilterTab('all')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 ${filterTab === 'all' ? (settings.theme === 'dark' ? 'bg-slate-600 text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm') : 'text-slate-400 hover:text-slate-600'}`}>
                                Todos <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filterTab === 'all' ? 'bg-green-100 text-green-700' : 'bg-slate-200'}`}>{counts.all}</span>
                            </button>
                            <button onClick={() => setFilterTab('favorites')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 ${filterTab === 'favorites' ? (settings.theme === 'dark' ? 'bg-slate-600 text-orange-400 shadow-sm' : 'bg-white text-orange-500 shadow-sm') : 'text-slate-400 hover:text-orange-400'}`}>
                                <Star size={12} /> Favoritos
                            </button>
                            <button onClick={() => setFilterTab('trash')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 ${filterTab === 'trash' ? (settings.theme === 'dark' ? 'bg-slate-600 text-red-400 shadow-sm' : 'bg-white text-red-500 shadow-sm') : 'text-slate-400 hover:text-red-400'}`}>
                                <Trash2 size={12} /> Lixeira
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportBackup} />
                            <button onClick={() => fileInputRef.current.click()} className={`p-2 rounded-xl border transition-all ${theme.cardBg} hover:text-blue-600 hover:border-blue-200`} title="Importar Backup">
                                <Upload size={18}/>
                            </button>
                            <button onClick={handleExportBackup} className={`p-2 rounded-xl border transition-all ${theme.cardBg} hover:text-green-600 hover:border-green-200`} title="Exportar Backup">
                                <Download size={18}/>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className={`flex p-1 rounded-xl ${settings.theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>
                            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-green-700 shadow-sm' : 'text-slate-400'}`} title="Vista em Grid"><LayoutGrid size={16}/></button>
                            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-green-700 shadow-sm' : 'text-slate-400'}`} title="Vista em Lista"><ListIcon size={16}/></button>
                        </div>
                        <div className="relative flex-1 md:flex-none">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input type="text" placeholder="Procurar..." className={`w-full pl-10 pr-4 py-2 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500/20 ${theme.inputBg}`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <select className={`bg-transparent text-sm font-bold outline-none cursor-pointer ${settings.theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                            <option value="recent">Recentes</option>
                            <option value="az">A-Z</option>
                        </select>
                    </div>
                </div>

                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20" : "flex flex-col gap-3 pb-20"}>
                    {processedProjects.map((p, idx) => (
                        <div key={p.id} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 50}ms` }}>
                            <ProjectCard 
                                project={p} theme={theme}
                                viewMode={viewMode}
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
                </div>

                <TitleModal isOpen={isTitleModalOpen} onClose={() => setIsTitleModalOpen(false)} title={newProjectTitle} setTitle={setNewProjectTitle} onConfirm={handleCreate} />
                <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} settings={settings} setSettings={setSettings} onDeleteAll={() => { if(window.confirm("Desejas apagar TUDO? Esta ação é irreversível.")) { localStorage.clear(); toast.error("Todos os dados foram eliminados."); window.location.reload(); } }} />
            </div>
        </div>
    );
};

// Subcomponente Card
const ProjectCard = ({ 
    project, theme, viewMode, isMenuOpen, onToggleMenu,
    onLoad, onFav, onDel, onRestore, onDeletePermanent, onDuplicate, onDuplicateTemplate 
}) => {
    const progress = calculateProgress(project.data);
    const isTrash = project.deleted;

    if (viewMode === 'list') {
        return (
            <div className={`${theme.cardBg} rounded-2xl border border-transparent hover:border-green-600 transition-all px-6 py-3 group flex items-center justify-between shadow-sm project-menu-container`}>
                <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={!isTrash ? onLoad : undefined}>
                    <div className={`p-2 rounded-xl ${isTrash ? 'bg-slate-100 text-slate-400' : 'bg-green-50 text-green-700'}`}>
                        <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm truncate group-hover:text-green-700 transition-colors">{project.title}</h3>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase">
                            <span className={progress.status === 'green' ? 'text-green-600' : ''}>{progress.percent}%</span>
                            <span className="flex items-center gap-1"><Clock size={10} /> {timeAgo(project.updatedAt)}</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {!isTrash && (
                        <button onClick={onFav} className={`p-2 transition-colors ${project.favorite ? 'text-orange-400' : 'text-slate-300'}`}>
                            <Star size={16} fill={project.favorite ? "currentColor" : "none"} />
                        </button>
                    )}
                    <div className="relative">
                        <button onClick={onToggleMenu} className="p-2 text-slate-300 hover:text-slate-800"><MoreVertical size={16} /></button>
                        {isMenuOpen && (
                            <div className="absolute right-0 top-8 w-48 bg-white rounded-xl shadow-2xl border p-2 z-50 text-slate-800 dark:bg-slate-700 dark:text-white dark:border-slate-600">
                                {isTrash ? (
                                    <button onClick={onRestore} className="w-full text-left px-3 py-2 text-[10px] font-bold hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg flex items-center gap-2"><RotateCcw size={14}/> Restaurar</button>
                                ) : (
                                    <>
                                        <button onClick={onLoad} className="w-full text-left px-3 py-2 text-[10px] font-bold hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg flex items-center gap-2"><FileEdit size={14}/> Abrir</button>
                                        <button onClick={onDuplicate} className="w-full text-left px-3 py-2 text-[10px] font-bold hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg flex items-center gap-2"><Copy size={14}/> Duplicar</button>
                                    </>
                                )}
                                <button onClick={isTrash ? onDeletePermanent : onDel} className="w-full text-left px-3 py-2 text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg flex items-center gap-2"><Trash2 size={14}/> {isTrash ? 'Eliminar' : 'Excluir'}</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`${theme.cardBg} rounded-[2rem] border-2 border-transparent hover:border-green-600 transition-all p-6 group flex flex-col relative h-full shadow-sm hover:shadow-md project-menu-container`}>
            <div className="flex justify-between mb-4">
                <div onClick={!isTrash ? onLoad : undefined} className={`p-3 rounded-2xl transition-transform group-hover:scale-105 ${isTrash ? 'bg-slate-100 cursor-default text-slate-400' : 'bg-green-50 text-green-700 cursor-pointer'}`}><FileText size={24} /></div>
                <div className="flex items-center gap-1">
                    {!isTrash && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onFav(); }} 
                            className={`p-2 rounded-full hover:bg-slate-100 transition-colors ${project.favorite ? 'text-orange-400' : 'text-slate-300'}`}
                        >
                            <Star size={18} fill={project.favorite ? "currentColor" : "none"} />
                        </button>
                    )}
                    <button onClick={onToggleMenu} className="p-2 rounded-full text-slate-300 hover:bg-slate-100"><MoreVertical size={18} /></button>
                    {isMenuOpen && (
                        <div className="absolute right-6 top-16 w-52 bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600 rounded-2xl shadow-2xl border p-2 z-50 text-slate-800">
                            {isTrash ? (
                                <>
                                    <button onClick={onRestore} className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-700 rounded-xl flex items-center gap-3"><RotateCcw size={16} /> Restaurar</button>
                                    <button onClick={onDeletePermanent} className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl flex items-center gap-3"><Trash2 size={16} /> Eliminar</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={onLoad} className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-600 rounded-xl flex items-center gap-3 text-slate-600"><FileEdit size={16} /> Abrir</button>
                                    <button onClick={onDuplicate} className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-600 rounded-xl flex items-center gap-3 text-slate-600"><Copy size={16} /> Duplicar</button>
                                    <button onClick={onDel} className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl flex items-center gap-3"><Trash2 size={16} /> Lixeira</button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            <div onClick={!isTrash ? onLoad : undefined} className={`flex-1 ${!isTrash ? 'cursor-pointer' : ''}`}>
                <h3 className="font-bold text-lg mb-2 line-clamp-2 leading-tight group-hover:text-green-700 transition-colors">{project.title}</h3>
                <div className="flex items-center gap-2 mb-4 text-[10px] text-slate-400 font-bold uppercase">
                    <span className={`px-2 py-0.5 rounded-md ${progress.status === 'green' ? 'bg-green-100 text-green-700' : 'bg-slate-100'}`}>{progress.label}</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> {timeAgo(project.updatedAt)}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full mb-4 overflow-hidden shadow-inner">
                    <div className={`h-full rounded-full transition-all duration-1000 ${progress.status === 'green' ? 'bg-green-500' : 'bg-slate-300'}`} style={{ width: `${progress.percent}%` }} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;