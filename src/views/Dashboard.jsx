import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Settings2, Plus, Lightbulb, Search, Trash2, Star, Eye, MoreVertical,
    RotateCcw, Copy, ChevronRight, Loader2, LayoutGrid, List as ListIcon, Download, Upload,
    Sun, Moon, CloudOff, MessageSquare, SearchX, ArchiveRestore
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppContext } from '../contexts/AppContext';
import { ABNT_TIPS, EXAMPLE_ID } from '../utils/constants';
import { EXAMPLE_ARTICLE_ID } from '../utils/exampleArticle';
import { DOCUMENT_TYPES, DEFAULT_DOC_TYPE, getDocType } from '../utils/documentTypes';
import { calculateProgress, timeAgo } from '../utils/helpers';
import { TitleModal, SettingsModal, GoogleIcon } from '../components/common/Modals';
import { ConfirmDialog } from '../components/common/Dialog';
import Sheet from '../components/common/Sheet';
import { btnPrimary, btnSecondary, btnGhost, iconBtn, field, fieldBase } from '../components/common/ui';
import { FeedbackModal } from '../components/common/FeedbackModal';

const Dashboard = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const docxInputRef = useRef(null);
    const [isImporting, setIsImporting] = useState(false);
    const { 
        projects, settings, setSettings, 
        createNewProject, createFromExample, createFromModel, createFromImport,
        duplicateProject,
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
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [newProjectTitle, setNewProjectTitle] = useState('');
    const [newProjectType, setNewProjectType] = useState(DEFAULT_DOC_TYPE);
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [modelsOpen, setModelsOpen] = useState(null); // null = automático: aberto só sem documentos

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

    const displayName = (user?.user_metadata?.full_name || settings.userName || 'Estudante').trim().split(/\s+/)[0];

    const handleExportBackup = () => {
        if (projects.length === 0) {
            toast.error('Ainda não há documentos para guardar.');
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
        toast.success('Cópia de segurança baixada');
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
                    toast.success(count === 1 ? '1 documento restaurado' : `${count} documentos restaurados`);
                } else {
                    toast.error('Todos os documentos deste arquivo já estão aqui.');
                }
            } catch {
                toast.error('Este arquivo não é uma cópia de segurança do ABNTFácil.');
            }
        };
        reader.readAsText(file);
        e.target.value = null;
    };

    // Trabalho começado no Word: títulos viram seções e o texto mantém negrito, itálico e notas
    const handleImportDocx = async (e) => {
        const file = e.target.files[0];
        e.target.value = null;
        if (!file) return;
        setIsImporting(true);
        const toastId = toast.loading('Lendo o arquivo do Word…');
        try {
            const { importDocx } = await import('../utils/docxImport');
            const imported = await importDocx(file);
            const title = imported.titulo || file.name.replace(/\.docx$/i, '');
            const id = await createFromImport(title, imported);
            const avisos = [`${imported.secoes.length} seção(ões) importada(s).`];
            if (imported.images) avisos.push(`${imported.images} imagem(ns) ficaram de fora: insira-as pelo botão Imagem.`);
            toast.success(avisos.join(' '), { id: toastId, duration: 7000 });
            navigate(`/editor/${id}`);
        } catch (error) {
            console.error('Falha ao importar .docx:', error);
            toast.error('Não foi possível ler este arquivo. Salve-o no Word como .docx e tente de novo.', { id: toastId });
        } finally {
            setIsImporting(false);
        }
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

    // Lixeira com "Desfazer" no aviso, em vez de pedir confirmação
    const moveToTrash = (p) => {
        deleteProject(p.id);
        toast((t) => (
            <span className="flex items-center gap-3">
                Movido para a lixeira
                <button type="button" onClick={() => { restoreProject(p.id); toast.dismiss(t.id); }} className="font-semibold text-accent underline underline-offset-2">Desfazer</button>
            </span>
        ), { duration: 6000 });
    };

    const handleCreate = async () => {
        if (!newProjectTitle.trim()) return;
        const id = await createNewProject(newProjectTitle, newProjectType);
        toast.success('Documento criado');
        navigate(`/editor/${id}`);
    };

    const handleCreateModel = async (key) => {
        const id = await createFromModel(key);
        toast.success(`${DOCUMENT_TYPES[key].label} criado`);
        navigate(`/editor/${id}`);
    };

    if (isLoadingGlobal) {
        return (
            <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-paper" role="status">
                <Sheet progress={60} className="w-12 animate-pulse" />
                <p className="text-sm text-ink-2">Carregando seus documentos…</p>
            </div>
        );
    }

    const showModels = modelsOpen ?? stats.total === 0;
    const tabs = [
        { id: 'all', label: 'Todos', count: counts.all },
        { id: 'favorites', label: 'Favoritos', count: counts.favorites },
        { id: 'trash', label: 'Lixeira', count: counts.trash },
    ];

    return (
        <div className="h-dvh overflow-y-auto overscroll-contain bg-paper text-ink">
            <header className="safe-top sticky top-0 z-30 bg-paper/95 supports-[backdrop-filter]:bg-paper/85 supports-[backdrop-filter]:backdrop-blur-sm">
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 md:px-8">
                    <Link to="/" className="flex min-h-10 items-center gap-2 rounded-[var(--radius-control)] text-[15px] font-bold tracking-[-0.01em]" aria-label="ABNTFácil, página inicial">
                        <Sheet className="w-[15px]" progress={70} />
                        ABNTFácil
                    </Link>
                    <div className="flex items-center gap-1">
                        <button type="button" onClick={() => setIsFeedbackModalOpen(true)} className={iconBtn} aria-label="Enviar comentário ou relatar erro" title="Comentários e erros"><MessageSquare size={18} /></button>
                        <button type="button" onClick={toggleTheme} className={iconBtn} aria-label={settings.theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'} title="Tema">{settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
                        <button type="button" onClick={() => setIsSettingsModalOpen(true)} className={iconBtn} aria-label="Configurações" title="Configurações">
                            {user?.user_metadata?.avatar_url
                                ? <img src={user.user_metadata.avatar_url} alt="" width="24" height="24" className="size-6 rounded-full" referrerPolicy="no-referrer" />
                                : <Settings2 size={18} />}
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 md:px-8 md:pt-10">
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                    <div className="min-w-0">
                        <h1 className="line-clamp-2 text-[1.75rem] font-bold leading-[1.1] tracking-[-0.02em] md:text-[2.25rem]">Olá, {displayName}</h1>
                        <p className="mt-1.5 text-[15px] text-ink-2">
                            {stats.total === 0 ? 'Nenhum documento ainda.' : <><span className="tabular">{stats.total}</span> {stats.total === 1 ? 'documento' : 'documentos'}{stats.completed > 0 && <>, <span className="tabular">{stats.completed}</span> {stats.completed === 1 ? 'quase pronto' : 'quase prontos'}</>}</>}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <input type="file" ref={docxInputRef} className="hidden" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleImportDocx} />
                        <button type="button" onClick={() => docxInputRef.current.click()} disabled={isImporting} className={`${btnSecondary} whitespace-nowrap`} title="Trazer um trabalho começado no Word (.docx)">
                            {isImporting ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Upload size={16} aria-hidden="true" />}
                            <span>Importar<span className="hidden sm:inline"> do Word</span></span>
                        </button>
                        <button type="button" onClick={() => setIsTitleModalOpen(true)} className={`${btnPrimary} flex-1 whitespace-nowrap md:flex-none`}>
                            <Plus size={16} aria-hidden="true" /> Novo documento
                        </button>
                    </div>
                </div>

                {!user && (
                    <div className="mt-6 flex flex-col gap-3 rounded-[var(--radius-panel)] bg-warn-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="flex items-start gap-2.5 text-sm text-ink">
                            <CloudOff size={18} className="mt-0.5 shrink-0 text-warn" aria-hidden="true" />
                            <span><strong className="font-semibold">Seus documentos estão só neste navegador.</strong> Entre com o Google para guardar uma cópia na nuvem.</span>
                        </p>
                        <button type="button" onClick={loginWithGoogle} className={`${btnSecondary} shrink-0 bg-surface hover:bg-surface-2`}><GoogleIcon /> Entrar com Google</button>
                    </div>
                )}

                {filterTab === 'all' && !searchTerm && (
                    <section aria-labelledby="novo" className="mt-10">
                        <div className="flex items-center justify-between gap-3">
                            <h2 id="novo" className="text-lg font-bold tracking-[-0.01em]">Começar um documento</h2>
                            {stats.total > 0 && (
                                <button type="button" onClick={() => setModelsOpen(!showModels)} aria-expanded={showModels} aria-controls="modelos" className={`${btnGhost} -mr-2 h-9 px-2 text-accent hover:text-accent`}>
                                    {showModels ? 'Esconder modelos' : 'Ver modelos'} <ChevronRight size={16} className={`transition-transform duration-200 ${showModels ? '-rotate-90' : 'rotate-90'}`} aria-hidden="true" />
                                </button>
                            )}
                        </div>
                        <p className="mt-1 flex items-start gap-2 text-sm text-ink-2">
                            <Lightbulb size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                            <span><span className="sr-only">Dica: </span>{ABNT_TIPS[tipIndex]}</span>
                        </p>

                        {showModels && <div id="modelos" className="fade-in mt-5 grid gap-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                            <div className="rounded-[var(--radius-panel)] bg-accent-soft p-5">
                                <h3 className="font-bold">Exemplos completos</h3>
                                <p className="mt-1 text-sm text-ink-2">Trabalhos inteiros já formatados. Veja como fica ou comece por um deles.</p>
                                <ul className="mt-4 space-y-4">
                                    {[
                                        { id: EXAMPLE_ID, nome: 'TCC', desc: 'Capa, folha de aprovação, resumo, capítulos e referências.' },
                                        { id: EXAMPLE_ARTICLE_ID, nome: 'Artigo científico', desc: 'Resumo e abstract, notas, equação, tabela, gráfico e quadro.' },
                                    ].map(ex => (
                                        <li key={ex.id} className="flex gap-4">
                                            <Sheet progress={100} className="w-11 self-start sm:w-12" />
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold">{ex.nome}</p>
                                                <p className="text-sm text-ink-2">{ex.desc}</p>
                                                <div className="mt-2 flex flex-wrap gap-x-1 gap-y-2">
                                                    <button type="button" onClick={async () => { const id = await createFromExample(ex.id); navigate(`/editor/${id}`); toast.success('Exemplo copiado para os seus documentos'); }} className={`${btnPrimary} h-9 px-3`} aria-label={`Usar o ${ex.nome.toLowerCase()} de exemplo como base`}><Copy size={16} aria-hidden="true" /> Usar como base</button>
                                                    <Link to={`/editor/${ex.id}`} className={`${btnGhost} h-9 px-3 text-accent hover:text-accent`} aria-label={`Ver o ${ex.nome.toLowerCase()} de exemplo`}><Eye size={16} aria-hidden="true" /> Só ver</Link>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <ul className="grid gap-px overflow-hidden rounded-[var(--radius-panel)] bg-line sm:grid-cols-2" aria-label="Modelos de documento">
                                {Object.keys(DOCUMENT_TYPES).map((key) => (
                                    <li key={key} className="bg-surface">
                                        <button type="button" onClick={() => handleCreateModel(key)} className="group flex h-full w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-surface-2">
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-sm font-semibold leading-snug">{DOCUMENT_TYPES[key].label}</span>
                                                <span className="tabular block text-xs text-ink-3">{DOCUMENT_TYPES[key].norma}</span>
                                            </span>
                                            <ChevronRight size={16} className="shrink-0 text-ink-3 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden="true" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>}
                    </section>
                )}

                <section aria-labelledby="meus" className="mt-12">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                        <h2 id="meus" className="text-lg font-bold tracking-[-0.01em]">Seus documentos</h2>
                        <div className="flex flex-wrap items-center gap-2">
                            <div role="tablist" aria-label="Filtrar documentos" className="flex rounded-[var(--radius-control)] bg-surface-2 p-1">
                                {tabs.map(t => (
                                    <button key={t.id} type="button" role="tab" aria-selected={filterTab === t.id} onClick={() => setFilterTab(t.id)}
                                        className={`flex h-8 items-center gap-1.5 rounded-[4px] px-3 text-sm font-semibold transition-[background-color,color] duration-150 pointer-coarse:h-10 ${filterTab === t.id ? 'bg-surface text-ink shadow-[0_1px_2px_rgb(28_27_25/0.12)]' : 'text-ink-2 hover:text-ink'}`}>
                                        {t.label} <span className="tabular text-xs font-medium text-ink-3">{t.count}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="relative min-w-0 flex-1 sm:w-56 sm:flex-none">
                                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" size={16} aria-hidden="true" />
                                <input type="search" aria-label="Procurar documento" placeholder="Procurar…" autoComplete="off" className={`${field} h-10 py-0 pl-9`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                            <select aria-label="Ordenar" className={`${fieldBase} h-10 py-0 pr-8 text-sm`} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                                <option value="recent">Mais recentes</option>
                                <option value="az">A–Z</option>
                                <option value="progress">Mais adiantados</option>
                            </select>
                            <div className="hidden rounded-[var(--radius-control)] bg-surface-2 p-1 md:flex" role="group" aria-label="Modo de exibição">
                                <button type="button" onClick={() => setViewMode('list')} aria-pressed={viewMode === 'list'} aria-label="Ver em lista" className={`flex size-8 items-center justify-center rounded-[4px] ${viewMode === 'list' ? 'bg-surface text-ink shadow-[0_1px_2px_rgb(28_27_25/0.12)]' : 'text-ink-2 hover:text-ink'}`}><ListIcon size={16} /></button>
                                <button type="button" onClick={() => setViewMode('grid')} aria-pressed={viewMode === 'grid'} aria-label="Ver em grade" className={`flex size-8 items-center justify-center rounded-[4px] ${viewMode === 'grid' ? 'bg-surface text-ink shadow-[0_1px_2px_rgb(28_27_25/0.12)]' : 'text-ink-2 hover:text-ink'}`}><LayoutGrid size={16} /></button>
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportBackup} />
                            <button type="button" onClick={() => fileInputRef.current.click()} className={iconBtn} aria-label="Restaurar cópia de segurança (.json)" title="Restaurar cópia de segurança"><ArchiveRestore size={18} /></button>
                            <button type="button" onClick={handleExportBackup} className={iconBtn} aria-label="Baixar cópia de segurança de todos os documentos" title="Baixar cópia de segurança"><Download size={18} /></button>
                        </div>
                    </div>

                    {processedProjects.length > 0 ? (
                        <ul className={`mt-4 ${viewMode === 'grid' ? 'grid gap-3 md:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-2'}`}>
                            {processedProjects.map((p) => (
                                <li key={p.id} className="min-w-0">
                                    <ProjectCard
                                        project={p}
                                        grid={viewMode === 'grid'}
                                        isMenuOpen={activeMenuId === p.id}
                                        onToggleMenu={() => setActiveMenuId(activeMenuId === p.id ? null : p.id)}
                                        onCloseMenu={() => setActiveMenuId(null)}
                                        onFav={() => updateProject(p.id, { favorite: !p.favorite })}
                                        onDel={() => moveToTrash(p)}
                                        onRestore={() => { restoreProject(p.id); toast.success('Documento restaurado'); }}
                                        onDeletePermanent={() => setConfirm({ title: 'Apagar de vez?', description: `“${p.title}” será apagado para sempre. Esta ação não pode ser desfeita.`, confirmLabel: 'Apagar de vez', onConfirm: () => { deleteProject(p.id, true); toast.success('Documento apagado'); } })}
                                        onDuplicate={() => { duplicateProject(p.id); toast.success('Cópia criada'); }}
                                    />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="mt-4 flex flex-col items-center rounded-[var(--radius-panel)] bg-surface-2 px-6 py-14 text-center">
                            {searchTerm ? (
                                <>
                                    <SearchX size={32} className="text-ink-3" aria-hidden="true" />
                                    <p className="mt-4 font-semibold">Nada encontrado</p>
                                    <p className="mt-1 max-w-xs text-sm text-ink-2">Nenhum documento tem “{searchTerm}” no título.</p>
                                </>
                            ) : filterTab === 'favorites' ? (
                                <>
                                    <Star size={32} className="text-ink-3" aria-hidden="true" />
                                    <p className="mt-4 font-semibold">Nenhum favorito</p>
                                    <p className="mt-1 max-w-xs text-sm text-ink-2">Toque na estrela de um documento para encontrá-lo aqui.</p>
                                </>
                            ) : filterTab === 'trash' ? (
                                <>
                                    <Trash2 size={32} className="text-ink-3" aria-hidden="true" />
                                    <p className="mt-4 font-semibold">A lixeira está vazia</p>
                                    <p className="mt-1 max-w-xs text-sm text-ink-2">Os documentos que você apagar ficam aqui até serem apagados de vez.</p>
                                </>
                            ) : (
                                <>
                                    <Sheet className="w-20" />
                                    <p className="mt-5 font-semibold">Nenhum documento ainda</p>
                                    <p className="mt-1 max-w-xs text-sm text-ink-2">Comece um trabalho em branco, escolha um modelo acima ou traga um arquivo do Word.</p>
                                    <button type="button" onClick={() => setIsTitleModalOpen(true)} className={`${btnPrimary} mt-6`}><Plus size={16} aria-hidden="true" /> Novo documento</button>
                                </>
                            )}
                        </div>
                    )}
                </section>
            </main>

            <TitleModal isOpen={isTitleModalOpen} onClose={() => setIsTitleModalOpen(false)} title={newProjectTitle} setTitle={setNewProjectTitle} typeKey={newProjectType} setTypeKey={setNewProjectType} onConfirm={handleCreate} />
            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                settings={settings}
                setSettings={setSettings}
                onDeleteAll={() => setConfirm({ title: 'Apagar tudo?', description: 'Todos os documentos e configurações deste navegador serão apagados. Esta ação não pode ser desfeita.', confirmLabel: 'Apagar tudo', onConfirm: () => { localStorage.clear(); window.location.reload(); } })}
                user={user}
                loginWithGoogle={loginWithGoogle}
                logout={logout}
            />
            <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} />
            <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} {...confirm} />
        </div>
    );
};

const ProjectCard = ({ project, grid, isMenuOpen, onToggleMenu, onCloseMenu, onFav, onDel, onRestore, onDeletePermanent, onDuplicate }) => {
    const progress = calculateProgress(project.data);
    const isTrash = project.deleted;
    const docLabel = getDocType(project.data).label;
    const menuItem = 'flex w-full items-center gap-2.5 rounded-[4px] px-3 py-2 text-left text-sm text-ink hover:bg-surface-2 pointer-coarse:py-3';

    const title = isTrash
        ? <span className="line-clamp-2 font-semibold leading-snug text-ink-2">{project.title}</span>
        : (
            // O link cobre o card inteiro (::after); estrela e menu ficam por cima
            <Link to={`/editor/${project.id}`} className="line-clamp-2 font-semibold leading-snug after:absolute after:inset-0 after:rounded-[var(--radius-panel)] after:content-[''] hover:text-accent focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-accent" title={project.title}>
                {project.title}
            </Link>
        );

    return (
        <article className={`project-menu-container relative flex rounded-[var(--radius-panel)] bg-surface ring-1 ring-transparent transition-[box-shadow] duration-150 hover:ring-line ${grid ? 'h-full flex-col gap-4 p-4' : 'items-center gap-4 px-4 py-3'}`}
            onKeyDown={(e) => { if (e.key === 'Escape' && isMenuOpen) { e.stopPropagation(); onCloseMenu(); } }}>
            <div className={`flex min-w-0 flex-1 gap-4 ${grid ? 'items-start' : 'items-center'}`}>
                <Sheet progress={progress.percent} faded={isTrash} className={grid ? 'w-12' : 'w-9'} />
                <div className="min-w-0 flex-1">
                    {title}
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-ink-3">
                        <span className="truncate">{docLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span className={`tabular ${progress.status === 'green' ? 'font-semibold text-accent' : ''}`}>{progress.percent}% pronto</span>
                        <span aria-hidden="true">·</span>
                        <span>{timeAgo(project.updatedAt)}</span>
                    </p>
                </div>
            </div>

            <div className={`relative z-10 flex shrink-0 items-center gap-0.5 ${grid ? 'self-end -mb-1 -mr-1' : '-mr-2'}`}>
                {!isTrash && (
                    <button type="button" onClick={onFav} aria-pressed={!!project.favorite} aria-label={project.favorite ? 'Tirar dos favoritos' : 'Marcar como favorito'}
                        className={`${iconBtn} ${project.favorite ? 'text-warn hover:text-warn' : ''}`}>
                        <Star size={18} fill={project.favorite ? 'currentColor' : 'none'} />
                    </button>
                )}
                <div className="relative">
                    <button type="button" onClick={onToggleMenu} aria-label={`Mais ações para ${project.title}`} aria-haspopup="menu" aria-expanded={isMenuOpen} className={iconBtn}><MoreVertical size={18} /></button>
                    {isMenuOpen && (
                        <div role="menu" className="pop-in absolute right-0 top-full z-50 mt-1 w-48 rounded-[var(--radius-panel)] bg-surface p-1 shadow-[var(--shadow-float)] ring-1 ring-line">
                            {isTrash ? (
                                <>
                                    <button type="button" role="menuitem" onClick={() => { onRestore(); onCloseMenu(); }} className={menuItem}><RotateCcw size={16} aria-hidden="true" /> Restaurar</button>
                                    <button type="button" role="menuitem" onClick={() => { onDeletePermanent(); onCloseMenu(); }} className={`${menuItem} text-danger hover:bg-danger-soft`}><Trash2 size={16} aria-hidden="true" /> Apagar de vez</button>
                                </>
                            ) : (
                                <>
                                    <button type="button" role="menuitem" onClick={() => { onDuplicate(); onCloseMenu(); }} className={menuItem}><Copy size={16} aria-hidden="true" /> Duplicar</button>
                                    <button type="button" role="menuitem" onClick={() => { onDel(); onCloseMenu(); }} className={`${menuItem} text-danger hover:bg-danger-soft`}><Trash2 size={16} aria-hidden="true" /> Mover para a lixeira</button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
};

export default Dashboard;
