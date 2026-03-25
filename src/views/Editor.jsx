import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Lock, Loader2, CheckCircle2, AlertTriangle, AlertCircle, 
  ZoomOut, ZoomIn, List, Printer, FileEdit, 
  ListTodo, ShieldCheck, CheckSquare, Settings2, Sparkles, AlignLeft, FileText,
  Sun, Moon, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useAppContext } from '../contexts/AppContext';
import { useAutosave } from '../hooks/useAutosave';
import { useExport } from '../hooks/useExport';
import { DEFAULT_CHECKLIST, EXAMPLE_ID, EXAMPLE_PROJECT } from '../utils/constants';

import EditorForm from '../components/editor/EditorForm';
import Sidebar from '../components/editor/Sidebar';
import ABNTViewer from '../components/preview/ABNTViewer';

import ReferenceModal from '../components/editor/ReferenceModal';
import AssetModal from '../components/common/AssetModal';
import AttachmentModal from '../components/editor/AttachmentModal';

const Editor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const { projects, setProjects, settings, setSettings, setActiveProjectId, createFromExample } = useAppContext();
    
    const [data, setData] = useState(null);
    const [authors, setAuthors] = useState(['']);
    const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST);
    const [fontFamily, setFontFamily] = useState(settings.defaultFont);

    const [loadedId, setLoadedId] = useState(null);
    const [abntErrors, setAbntErrors] = useState([]); // Desacoplado da renderização principal

    const [tab, setTab] = useState('editor');
    const [focusedSection, setFocusedSection] = useState(null);
    const [focusMode] = useState(false);
    
    const [showOutline, setShowOutline] = useState(window.innerWidth >= 1280);
    const [zoomLevel, setZoomLevel] = useState(window.innerWidth < 768 ? 0.45 : 0.80);
    const [mobileView, setMobileView] = useState('editor'); 
    
    const [isRefModalOpen, setIsRefModalOpen] = useState(false);
    const [assetModal, setAssetModal] = useState({ open: false, type: 'img', sectionIndex: null, title: '', source: '', url: '', content: '', rows: 3, cols: 3, tableData: [], localBase64: null });
    
    const [attachmentModal, setAttachmentModal] = useState({ open: false, type: 'apendice' });

    useEffect(() => {
        setActiveProjectId(id);
    }, [id, setActiveProjectId]);

    useEffect(() => {
        if (!id) return;
        if (loadedId === id) return;

        if (id === EXAMPLE_ID) {
            setData(EXAMPLE_PROJECT.data); 
            setAuthors(EXAMPLE_PROJECT.authors); 
            setChecklist(DEFAULT_CHECKLIST); 
            setLoadedId(id);
            return;
        }
        if (projects.length > 0) {
            const proj = projects.find(p => p.id === id);
            if (proj) { 
                setData(proj.data); 
                setAuthors(proj.authors); 
                setChecklist(proj.checklist || DEFAULT_CHECKLIST); 
                setLoadedId(id);
            } 
            else { navigate('/dashboard'); }
        }
    }, [id, projects, navigate, loadedId]);

    const isReadOnly = id === EXAMPLE_ID;
    const { isSaving } = useAutosave(data, authors, checklist, id, projects, setProjects, settings, isReadOnly);
    const { handleExportPDF, isExporting } = useExport(data || {}, authors, fontFamily);

    // DEBOUNCE APLICADO: Previne congelamento da Main Thread por regex excessiva
    useEffect(() => {
        if (!data) return;
        
        const timeoutId = setTimeout(() => {
            const errs = [];
            if (!data.titulo) errs.push({msg: 'Falta o Título do Trabalho', explain: 'O título é obrigatório para identificação na capa.'});
            if (!data.curso) errs.push({msg: 'Defina o Curso', explain: 'Necessário para a folha de rosto.'});
            if (data.resumoPt.length < 100) errs.push({msg: 'O Resumo está muito curto (<100 chars)', explain: 'A ABNT recomenda entre 150 e 500 palavras para TCCs.'});
            if (!data.referencias) errs.push({msg: 'Nenhuma referência bibliográfica citada', explain: 'Todo trabalho acadêmico precisa listar as fontes consultadas.'});
            if (data.secoes.length < 3) errs.push({msg: 'Estrutura incompleta (min. 3 seções)', explain: 'Geralmente Introdução, Desenvolvimento e Conclusão.'});

            if (data.secoes && data.referencias) {
                const fullText = data.secoes.map(s => s.conteudo).join(' ');
                const citationRegex = /\(([A-ZÀ-ÖØ-Þ\s;]+?)(?:\s+et\s+al\.)?,\s*\d{4}[a-z]?\)/g;
                let match;
                const citedAuthors = new Set();
                
                while ((match = citationRegex.exec(fullText)) !== null) {
                    const authorsStr = match[1];
                    const authorsList = authorsStr.split(';').map(a => a.trim().toUpperCase());
                    authorsList.forEach(author => {
                        if (author.length > 2) citedAuthors.add(author); 
                    });
                }

                const refsUpper = data.referencias.toUpperCase();
                const missing = [];
                
                citedAuthors.forEach(author => {
                    if (!refsUpper.includes(author)) missing.push(author);
                });

                if (missing.length > 0) {
                    errs.push({
                        msg: `Citação sem Referência: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''}`,
                        explain: `Atenção: Citaste "${missing[0]}" no texto, mas não o incluíste na lista final de Referências. A banca desconta nota por isso!`
                    });
                }
            }
            setAbntErrors(errs);
        }, 800);

        return () => clearTimeout(timeoutId);
    }, [data]);

    const stats = useMemo(() => {
        if (!data) return { words: 0, pages: 0 };
        const textFields = [data.resumoPt, data.resumoEn, ...data.secoes.map(s => s.conteudo)];
        const words = textFields.join(' ').trim().split(/\s+/).length;
        return { words, pages: Math.ceil(words / 350) + 2 };
    }, [data]);

    const abntStatus = useMemo(() => {
        if (abntErrors.length === 0) return { label: 'ABNT OK', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 size={12}/> };
        if (abntErrors.length <= 2) return { label: 'Ajustes', color: 'bg-yellow-100 text-yellow-700', icon: <AlertCircle size={12}/> };
        return { label: 'Erros', color: 'bg-red-100 text-red-700', icon: <AlertTriangle size={12}/> };
    }, [abntErrors]);

    const sumarioItens = useMemo(() => { 
        if (!data || !data.secoes) return [];
        let counts = [0, 0, 0, 0, 0];
        return data.secoes.map(s => {
            const level = Math.min(Math.max(Number(s.level) || 1, 1), 5); 
            counts[level - 1]++;
            for (let k = level; k < 5; k++) counts[k] = 0;
            const numParts = [];
            for (let k = 0; k < level; k++) numParts.push(counts[k] === 0 ? 1 : counts[k]);
            return { ...s, level, num: numParts.join('.') };
        }); 
    }, [data?.secoes]);

    const groupedSections = useMemo(() => {
        if (!data || !data.secoes) return [];
        const groups = [];
        data.secoes.forEach((section, index) => {
          const sectionWithNum = { ...section, num: sumarioItens[index]?.num };
          if (Number(section.level) === 1 || groups.length === 0) groups.push([sectionWithNum]);
          else groups[groups.length - 1].push(sectionWithNum);
        });
        return groups;
    }, [data?.secoes, sumarioItens]);

    const scrollToSection = (secId) => {
        const editEl = document.getElementById(`edit-sec-${secId}`);
        if (editEl) editEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const previewEl = document.getElementById(`preview-sec-${secId}`);
        if (previewEl) previewEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const confirmAssetInsert = () => {
        if(isReadOnly) return;
        const { type, sectionIndex, title, source, url, content, tableData, localBase64 } = assetModal;
        
        setData(prevData => {
            let newData = { ...prevData };
            if (!newData.assets) newData.assets = {}; 
            
            let finalUrl = url;
            if (type === 'img' && localBase64) {
                const assetId = 'local_img_' + Date.now().toString(36);
                newData.assets[assetId] = localBase64;
                finalUrl = assetId; 
            }

            let tag = '';
            if (type === 'cit') tag = `\n\n[CITAÇÃO]: ${content}`;
            else if (type === 'img') tag = `\n\n[IMAGEM]: ${title} | ${source} | ${finalUrl}`;
            else if (type === 'tab') tag = `\n\n[TABELA]: ${title} | ${source} | ${JSON.stringify(tableData)}`;
            else if (type === 'box') tag = `\n\n[QUADRO]: ${title} | ${source} | ${content || 'Conteúdo...'}`;
            
            const newSec = [...newData.secoes]; 
            newSec[sectionIndex] = { ...newSec[sectionIndex], conteudo: newSec[sectionIndex].conteudo + tag };
            newData.secoes = newSec;
            return newData;
        }); 
        
        setAssetModal({ open: false, type: 'img', sectionIndex: null, title: '', source: '', url: '', content: '', rows: 3, cols: 3, tableData: [], localBase64: null });
    };

    const handleCreateFromExample = async () => {
        const newId = await createFromExample();
        toast.success("Exemplo clonado com sucesso!");
        navigate(`/editor/${newId}`);
    };

    if (!data) return <div className="flex h-screen items-center justify-center bg-slate-900"><Loader2 className="animate-spin text-green-700" size={40}/></div>;

    const headerBgClass = isReadOnly 
        ? (settings.theme === 'dark' ? 'bg-amber-900/20 border-amber-800/50' : 'bg-amber-50 border-amber-200')
        : (settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200');

    const readOnlyBadgeClass = settings.theme === 'dark' 
        ? 'bg-amber-900/50 text-amber-400 border-amber-700/50' 
        : 'bg-amber-100 text-amber-800 border-amber-300';

    return (
        <div className={`flex flex-col h-screen overflow-hidden abnt-editor-app transition-colors duration-300 ${settings.theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
            <header className={`min-h-[4rem] py-3 lg:py-0 lg:h-16 border-b flex flex-col lg:flex-row items-start lg:items-center justify-between px-4 lg:px-6 shrink-0 z-30 print:hidden shadow-sm transition-colors gap-3 lg:gap-0 ${headerBgClass}`}>
                <div className="flex items-center justify-between w-full lg:w-auto gap-4">
                    <div className="flex items-center gap-3 w-full">
                        <button onClick={() => { if(isSaving && !window.confirm("Salvando... Sair?")) return; navigate('/dashboard'); }} className="p-2 shrink-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-400 hover:text-green-700"><ArrowLeft size={20} /></button>
                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />
                        <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h2 className={`font-bold text-sm truncate max-w-[180px] sm:max-w-[250px] leading-tight ${settings.theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>{data.titulo || "Projeto sem Título"}</h2>
                                {isReadOnly && (
                                    <span className={`flex items-center shrink-0 gap-1 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border ${readOnlyBadgeClass}`}>
                                        <Lock size={10}/> Leitura
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">{isSaving || isExporting ? <span className="flex items-center gap-1 text-[10px] text-yellow-600 font-medium"><Loader2 size={10} className="animate-spin"/> Atualizando...</span> : <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium"><CheckCircle2 size={10}/> Alterações salvas</span>}</div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 lg:gap-4 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 justify-start lg:justify-end shrink-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {!isReadOnly && (
                        <div className="hidden lg:flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 gap-1 border border-slate-200 dark:border-slate-700 shrink-0">
                            <div className="flex items-center px-2"><button onClick={() => setZoomLevel(z => Math.max(0.3, z - 0.1))} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors"><ZoomOut size={16}/></button><span className="text-[11px] font-bold w-12 text-center text-slate-500">{Math.round(zoomLevel * 100)}%</span><button onClick={() => setZoomLevel(z => Math.min(2, z + 0.1))} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors"><ZoomIn size={16}/></button></div>
                            <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1" />
                            <div className="flex p-0.5 gap-1"><button onClick={() => setFontFamily('Arial')} className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${fontFamily === 'Arial' ? 'bg-white dark:bg-slate-700 shadow-sm text-green-700 dark:text-green-400' : 'text-slate-400 hover:text-slate-600'}`}>ARIAL</button><button onClick={() => setFontFamily('Times New Roman')} className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${fontFamily === 'Times New Roman' ? 'bg-white dark:bg-slate-700 shadow-sm text-green-700 dark:text-green-400' : 'text-slate-400 hover:text-slate-600'}`}>TIMES</button></div>
                        </div>
                    )}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="flex flex-col items-end hidden sm:flex"><span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-none">Métricas</span><div className="flex gap-2 text-[10px] font-bold text-slate-500"><span className="flex items-center gap-1"><AlignLeft size={10}/> {stats.words} pal.</span><span className="flex items-center gap-1"><FileText size={10}/> ~{stats.pages} pág.</span></div></div>
                        <button onClick={() => setTab(tab === 'checklist' ? 'editor' : 'checklist')} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${abntStatus.color}`}>{abntStatus.icon} {abntStatus.label}</button>
                    </div>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />
                    <div className="flex items-center gap-2 shrink-0 pr-4 lg:pr-0">
                        <button onClick={() => setSettings(s => ({...s, theme: s.theme === 'dark' ? 'light' : 'dark'}))} className="p-2 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-all" title="Alternar Tema">{settings.theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}</button>
                        
                        <button onClick={() => setShowOutline(!showOutline)} className={`flex p-2 rounded-xl transition-all ${showOutline ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`} title="Alternar Sumário Lateral"><List size={20}/></button>
                        
                        {!isReadOnly ? (
                            <button onClick={handleExportPDF} className="bg-green-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-green-800 shadow-lg shadow-green-900/20 transition-all"><Printer size={16}/><span className="hidden sm:inline">Gerar PDF</span></button>
                        ) : (
                            <button onClick={handleCreateFromExample} className="bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-orange-700 shadow-lg shadow-orange-900/10 transition-all"><Sparkles size={14}/> Clonar</button>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex flex-1 overflow-hidden relative">
                {!focusMode && (
                    <aside className={`absolute inset-0 z-10 lg:relative lg:z-auto w-full lg:w-[450px] border-r flex-col print:hidden transition-all duration-300 ${mobileView === 'editor' ? 'flex' : 'hidden lg:flex'} ${isReadOnly ? 'opacity-80' : ''} ${settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                         <div className={`flex border-b shrink-0 ${settings.theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}><button onClick={() => setTab('editor')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${tab === 'editor' ? 'text-green-600 border-b-2 border-green-600 bg-green-50/10' : 'text-slate-400'}`}><FileEdit size={14}/> Conteúdo</button><button onClick={() => setTab('checklist')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${tab === 'checklist' ? 'text-green-600 border-b-2 border-green-600 bg-green-50/10' : 'text-slate-400'}`}><ListTodo size={14}/> Assistente</button></div>
                         {tab === 'editor' ? (
                             <EditorForm 
                                data={data} 
                                setData={setData} 
                                authors={authors} 
                                setAuthors={setAuthors} 
                                settings={settings} 
                                isReadOnly={isReadOnly} 
                                focusedSection={focusedSection} 
                                setFocusedSection={setFocusedSection} 
                                onOpenAssetModal={(type, sectionIndex) => setAssetModal({ open: true, type, sectionIndex, title: '', source: '', url: '', content: '', rows: 3, cols: 3, tableData: type === 'tab' ? Array(3).fill('').map(()=>Array(3).fill('...')) : [], localBase64: null })} 
                                onOpenRefModal={() => setIsRefModalOpen(true)}
                                onOpenAttachmentModal={(type) => setAttachmentModal({ open: true, type })} 
                             />
                         ) : (
                            <div className={`flex-1 overflow-y-auto p-6 space-y-8 ${settings.theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
                                <section className={`p-6 rounded-2xl shadow-sm border ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}><h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-4"><ShieldCheck size={14} className="text-green-600"/> Saúde do Documento</h3>{abntErrors.length === 0 ? <div className="text-center py-6"><CheckCircle2 size={40} className="text-green-500 mx-auto mb-2"/><p className="text-sm font-bold text-slate-700 dark:text-slate-300">Tudo Certo!</p><p className="text-xs text-slate-400">Nenhum problema estrutural encontrado.</p></div> : <ul className="space-y-2">{abntErrors.map((err, i) => (<li key={i} className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 p-3 rounded"><div className="flex items-center gap-2 font-bold mb-1"><AlertTriangle size={14} className="shrink-0"/> {err.msg}</div><div className="pl-6 opacity-75">{err.explain}</div></li>))}</ul>}</section>
                                <section className={`p-6 rounded-2xl shadow-sm border ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}><div className="flex justify-between items-center mb-4"><h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2"><ListTodo size={14} className="text-blue-600"/> Checklist TCC</h3><span className="text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">{Math.round((checklist.filter(i=>i.done).length / (checklist.length || 1))*100)}%</span></div><div className="space-y-3">{checklist.map(item => (<div key={item.id} onClick={() => !item.auto && !isReadOnly && setChecklist(checklist.map(i => i.id === item.id ? {...i, done: !i.done} : i))} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${item.done ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : (settings.theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-100')} ${!item.auto && !isReadOnly ? 'cursor-pointer hover:border-blue-300' : 'cursor-default opacity-80'}`}><div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${item.done ? 'bg-green-600 text-white' : 'bg-slate-200 dark:bg-slate-600 text-transparent'}`}>{item.auto ? <Settings2 size={12}/> : <CheckSquare size={14}/>}</div><div className="flex-1"><span className={`text-xs font-medium ${item.done ? 'text-green-800 dark:text-green-400 line-through' : 'text-slate-600 dark:text-slate-300'}`}>{item.text}</span>{item.auto && <span className="text-[9px] text-slate-400 block mt-0.5 uppercase tracking-wide">Automático</span>}</div></div>))}</div></section>
                            </div>
                         )}
                    </aside>
                )}

                <div className={`absolute inset-0 z-0 lg:relative lg:z-auto flex-1 overflow-hidden flex-col ${mobileView === 'preview' ? 'flex' : 'hidden lg:flex'} ${settings.theme === 'dark' ? 'bg-slate-800' : 'bg-slate-300'}`}>
                    <ABNTViewer data={data} authors={authors} zoomLevel={zoomLevel} fontFamily={fontFamily} sumarioItens={sumarioItens} groupedSections={groupedSections} />
                </div>

                {!focusMode && showOutline && (
                    <Sidebar 
                        sumarioItens={sumarioItens} 
                        scrollToSection={scrollToSection} 
                        setShowOutline={setShowOutline} 
                        settings={settings} 
                        onReorder={(oldIndex, newIndex) => { 
                            if (isReadOnly) return; 
                            setData(prev => {
                                const newSecoes = [...prev.secoes]; 
                                const [moved] = newSecoes.splice(oldIndex, 1); 
                                newSecoes.splice(newIndex, 0, moved); 
                                return { ...prev, secoes: newSecoes }; 
                            });
                        }} 
                        data={data} 
                    />
                )}

                <button onClick={() => setMobileView(v => v === 'editor' ? 'preview' : 'editor')} className={`lg:hidden fixed bottom-6 right-6 z-30 p-4 rounded-full shadow-2xl transition-transform hover:scale-105 active:scale-95 border-4 ${settings.theme === 'dark' ? 'bg-green-600 text-white border-slate-900 shadow-green-900/50' : 'bg-green-600 text-white border-white shadow-green-600/30'}`}>
                    {mobileView === 'editor' ? <Eye size={24}/> : <FileEdit size={24}/>}
                    <span className={`absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full border-2 ${settings.theme === 'dark' ? 'border-slate-900' : 'border-white'}`}>{mobileView === 'editor' ? 'PDF' : 'EDITAR'}</span>
                </button>
            </main>

            <ReferenceModal isOpen={isRefModalOpen} onClose={() => setIsRefModalOpen(false)} onAddReference={(referenceStr) => { setData(prev => ({ ...prev, referencias: prev.referencias ? prev.referencias + '\n\n' + referenceStr : referenceStr })); }} />
            <AssetModal isOpen={assetModal.open} onClose={() => setAssetModal({...assetModal, open: false})} assetModal={assetModal} setAssetModal={setAssetModal} onConfirm={confirmAssetInsert} />
            
            <AttachmentModal 
                isOpen={attachmentModal.open} 
                onClose={() => setAttachmentModal({ ...attachmentModal, open: false })} 
                type={attachmentModal.type} 
                currentText={attachmentModal.type === 'apendice' ? data.apendices : data.anexos} 
                onAdd={(formattedStr) => { 
                    setData(prev => {
                        if (attachmentModal.type === 'apendice') {
                            return { ...prev, apendices: prev.apendices ? prev.apendices + '\n\n\n' + formattedStr : formattedStr };
                        } else {
                            return { ...prev, anexos: prev.anexos ? prev.anexos + '\n\n\n' + formattedStr : formattedStr };
                        }
                    });
                    setAttachmentModal({ ...attachmentModal, open: false });
                }} 
            />
        </div>
    );
};

export default Editor;