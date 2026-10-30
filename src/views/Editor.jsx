import React, { useState, useMemo, useEffect, useDeferredValue, useCallback, lazy, Suspense } from 'react';
import { flushSync } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Lock, Loader2, CheckCircle2, AlertTriangle, AlertCircle,
  ZoomOut, ZoomIn, List, FileEdit, Copy, Download, FileText,
  ListTodo, ShieldCheck, CheckSquare, Settings2,
  Sun, Moon, Eye, FileCog, Globe, BookOpen, BookMarked
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useAppContext } from '../contexts/AppContext';
import { useAutosave } from '../hooks/useAutosave';
import { useExport } from '../hooks/useExport';
import { DEFAULT_CHECKLIST, EXAMPLE_ID, EXAMPLE_PROJECT } from '../utils/constants';
import { getDocType, hasElement, isRequired } from '../utils/documentTypes';

import EditorForm from '../components/editor/EditorForm';
import Sidebar from '../components/editor/Sidebar';
import ABNTViewer from '../components/preview/ABNTViewer';

// Modais só são baixados quando abertos pela primeira vez
const ReferenceModal = lazy(() => import('../components/editor/ReferenceModal'));
const AssetModal = lazy(() => import('../components/common/AssetModal'));
const AttachmentModal = lazy(() => import('../components/editor/AttachmentModal'));

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

    const [panel, setPanel] = useState(null);
    const [focusedSection, setFocusedSection] = useState(null);
    const [focusMode] = useState(false);
    
    const [showOutline, setShowOutline] = useState(window.innerWidth >= 1536);
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
    const { handleExportPDF: exportPdfNow, handleExportDocx: exportDocxNow, isExporting } = useExport(data, authors, fontFamily);

    // DEBOUNCE APLICADO: Previne congelamento da Main Thread por regex excessiva
    useEffect(() => {
        if (!data) return;
        
        const timeoutId = setTimeout(() => {
            const errs = [];
            const type = getDocType(data);
            const isFilled = (t) => typeof t === 'string' && t.trim() !== '';
            const wordCount = (t) => (t || '').trim().split(/\s+/).filter(Boolean).length;

            if (!data.titulo) errs.push({msg: 'Falta o Título do Trabalho', explain: 'O título é obrigatório para identificação do documento.'});
            if (hasElement(type, 'folhaRosto') && !data.curso && !data.instituicao) errs.push({msg: 'Defina a Instituição e o Curso', explain: 'Necessários para a capa e a folha de rosto.'});

            // NBR 6028:2021 — extensão do resumo conforme o tipo de documento
            if (isRequired(type, 'resumoPt') && type.resumoWords) {
                const [min, max] = type.resumoWords;
                const n = wordCount(data.resumoPt);
                if (n < min) errs.push({msg: `O Resumo está curto (${n} de ${min}–${max} palavras)`, explain: `A NBR 6028:2021 recomenda ${min} a ${max} palavras para ${type.label}.`});
                else if (n > max) errs.push({msg: `O Resumo está longo (${n} de ${min}–${max} palavras)`, explain: `A NBR 6028:2021 recomenda ${min} a ${max} palavras para ${type.label}.`});
            }
            if (isRequired(type, 'resumoEn') && !isFilled(data.resumoEn)) errs.push({msg: 'Falta o resumo em língua estrangeira (Abstract)', explain: `É elemento obrigatório na ${type.norma}.`});
            if (isRequired(type, 'folhaAprovacao') && !(data.banca || []).some(m => m?.nome?.trim())) errs.push({msg: 'Preencha a Banca Examinadora', explain: 'A folha de aprovação é obrigatória (NBR 14724) e lista os membros da banca.'});
            if (isRequired(type, 'folhaAprovacao') && !data.dataAprovacao) errs.push({msg: 'Falta a data de aprovação', explain: 'A folha de aprovação traz a data de aprovação (NBR 14724). Se ainda não houve defesa, deixe em branco e preencha à mão depois.'});
            if (isRequired(type, 'folhaAprovacao') && !(data.orientadores || []).some(o => o?.trim())) errs.push({msg: 'Informe o(a) orientador(a)', explain: 'O nome do orientador aparece na folha de rosto (NBR 14724).'});
            // NBR 6028:2021 — palavras-chave logo abaixo do resumo, separadas entre si por ponto e vírgula
            if (isRequired(type, 'resumoPt') && !isFilled(data.palavrasChavePt)) errs.push({msg: 'Faltam as palavras-chave', explain: 'Vêm logo abaixo do resumo, antecedidas de "Palavras-chave:" (NBR 6028:2021).'});
            [['Palavras-chave', data.palavrasChavePt], ['Keywords', data.palavrasChaveEn]].forEach(([label, kw]) => {
                if (isFilled(kw) && kw.includes(',') && !kw.includes(';')) errs.push({msg: `${label} separadas por vírgula`, explain: 'A NBR 6028:2021 separa as palavras-chave por ponto e vírgula: saúde mental; ensino superior; ansiedade.'});
            });
            if (data.fichaCatalografica && hasElement(type, 'fichaCatalografica') && !isFilled(data.palavrasChavePt)) errs.push({msg: 'A ficha catalográfica está sem assuntos', explain: 'Os assuntos da ficha vêm das palavras-chave do resumo. Preencha-as ou peça a ficha à biblioteca.'});
            // NBR 6023:2018 — documento on-line: "Disponível em: <endereço>. Acesso em: dia mês abreviado ano."
            if (isFilled(data.referencias)) {
                const semAcesso = data.referencias.split('\n').filter(l => /Dispon[ií]vel em:/i.test(l) && !/Acesso em:/i.test(l));
                if (semAcesso.length) errs.push({msg: `${semAcesso.length} referência(s) on-line sem data de acesso`, explain: 'Na NBR 6023:2018, documentos on-line terminam com "Disponível em: endereço. Acesso em: 15 mar. 2024."'});
            }
            if (hasElement(type, 'obraResenhada') && !isFilled(data.obraResenhada)) errs.push({msg: 'Informe a referência da obra resenhada', explain: 'A resenha começa pela referência completa da obra analisada (NBR 6028).'});
            if (!data.referencias) errs.push({msg: 'Nenhuma referência bibliográfica citada', explain: 'Todo trabalho acadêmico precisa listar as fontes consultadas (NBR 6023).'});
            if (type.layout === 'academic' && data.secoes.length < 3) errs.push({msg: 'Estrutura incompleta (min. 3 seções)', explain: 'A parte textual tem introdução, desenvolvimento e conclusão.'});

            if (data.secoes && data.referencias) {
                const fullText = data.secoes.map(s => s.conteudo).join(' ');
                // NBR 10520:2023 — (Silva, 2023, p. 15), (Silva; Souza, 2020), Silva e Souza (2020)
                const NAME = String.raw`[A-ZÀ-Ý][A-Za-zÀ-ÿ'\-]+`;
                const parenRegex = new RegExp(String.raw`\((${NAME}(?:\s+${NAME})*(?:\s*;\s*${NAME}(?:\s+${NAME})*)*)(?:\s+et\s+al\.)?,\s*\d{4}[a-z]?`, 'g');
                const narrativeRegex = new RegExp(String.raw`(${NAME})(?:\s+(?:e|&)\s+(${NAME}))?(?:\s+et\s+al\.)?\s+\(\d{4}[a-z]?`, 'g');
                const citedAuthors = new Set();
                const capsAuthors = new Set();
                let match;

                while ((match = parenRegex.exec(fullText)) !== null) {
                    match[1].split(';').map(a => a.trim()).forEach(author => {
                        const surname = author.split(/\s+/).pop();
                        if (surname.length > 2) citedAuthors.add(surname.toUpperCase());
                        // Sobrenome todo em maiúsculas (e que não é sigla curta como IBGE) segue a regra antiga
                        if (author.length >= 5 && author === author.toUpperCase()) capsAuthors.add(author);
                    });
                }
                while ((match = narrativeRegex.exec(fullText)) !== null) {
                    [match[1], match[2]].filter(Boolean).forEach(a => { if (a.length > 2) citedAuthors.add(a.toUpperCase()); });
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
                if (capsAuthors.size > 0) {
                    const ex = [...capsAuthors][0];
                    const fixed = ex.charAt(0) + ex.slice(1).toLowerCase();
                    errs.push({
                        msg: `Citação no formato antigo: (${ex}, ...)`,
                        explain: `Desde a NBR 10520:2023, o autor entre parênteses vai em maiúsculas e minúsculas: (${fixed}, ano). Siglas como (IBGE, 2020) continuam em maiúsculas.`
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
        if (abntErrors.length === 0) return { label: 'ABNT OK', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle2 size={14}/> };
        if (abntErrors.length <= 2) return { label: `${abntErrors.length} ajuste${abntErrors.length > 1 ? 's' : ''}`, color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', icon: <AlertCircle size={14}/> };
        return { label: `${abntErrors.length} pendências`, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: <AlertTriangle size={14}/> };
    }, [abntErrors]);

    const numberSections = getDocType(data).numberedSections !== false;
    const sumarioItens = useMemo(() => { 
        if (!data || !data.secoes) return [];
        let counts = [0, 0, 0, 0, 0];
        return data.secoes.map(s => {
            const level = Math.min(Math.max(Number(s.level) || 1, 1), 5); 
            counts[level - 1]++;
            for (let k = level; k < 5; k++) counts[k] = 0;
            const numParts = [];
            for (let k = 0; k < level; k++) numParts.push(counts[k] === 0 ? 1 : counts[k]);
            return { ...s, level, num: numberSections ? numParts.join('.') : '' };
        }); 
    }, [data?.secoes, numberSections]);

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

    const deferredData = useDeferredValue(data);
    const deferredAuthors = useDeferredValue(authors);
    const deferredSections = useDeferredValue(groupedSections);

    // No celular a pré-visualização fica escondida atrás do formulário: em vez de repaginar a cada
    // tecla, ela só é montada quando o formulário já apareceu e acompanha o texto após uma pausa.
    const [isNarrow, setIsNarrow] = useState(() => window.matchMedia('(max-width: 1023px)').matches);
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 1023px)');
        const onChange = () => setIsNarrow(mq.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);
    const previewHidden = isNarrow && mobileView === 'editor';
    const [hiddenSnapshot, setHiddenSnapshot] = useState(null);
    useEffect(() => {
        if (!previewHidden || !data) return;
        if (hiddenSnapshot && hiddenSnapshot.data === data && hiddenSnapshot.authors === authors && hiddenSnapshot.sections === groupedSections) return;
        const t = setTimeout(() => setHiddenSnapshot({ data, authors, sections: groupedSections }), hiddenSnapshot ? 1200 : 600);
        return () => clearTimeout(t);
    }, [previewHidden, data, authors, groupedSections, hiddenSnapshot]);
    const preview = previewHidden ? hiddenSnapshot : { data: deferredData, authors: deferredAuthors, sections: deferredSections };
    const previewData = preview?.data;
    const previewAuthors = preview?.authors;
    const previewSections = preview?.sections;

    // As exportações leem a pré-visualização: atualiza-a na hora antes de exportar
    const flushPreview = useCallback(async () => {
        if (!previewHidden) return;
        flushSync(() => setHiddenSnapshot({ data, authors, sections: groupedSections }));
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    }, [previewHidden, data, authors, groupedSections]);
    const handleExportPDF = useCallback(async () => { await flushPreview(); await exportPdfNow(); }, [flushPreview, exportPdfNow]);
    const handleExportDocx = useCallback(async () => { await flushPreview(); await exportDocxNow(); }, [flushPreview, exportDocxNow]);

    const scrollToSection = (secId) => {
        // Abre a etapa onde o item é editado antes de rolar até ele
        setPanel(['referencias', 'glossario', 'apendices', 'anexos'].includes(secId) ? 'referencias' : 'capitulos');
        requestAnimationFrame(() => {
            const editEl = document.getElementById(`edit-sec-${secId}`);
            if (editEl) editEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
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

    if (!data) return <div className="flex h-dvh items-center justify-center bg-slate-950"><Loader2 className="animate-spin text-green-700" size={40}/></div>;

    const headerBgClass = isReadOnly 
        ? (settings.theme === 'dark' ? 'bg-amber-900/20 border-amber-800/50' : 'bg-amber-50 border-amber-200')
        : (settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200');

    const readOnlyBadgeClass = settings.theme === 'dark' 
        ? 'bg-amber-900/50 text-amber-400 border-amber-700/50' 
        : 'bg-amber-100 text-amber-800 border-amber-300';

    const docType = getDocType(data);
    const isArticle = docType.layout === 'article';
    const hasPreTextual = ['dedicatoria', 'agradecimentos', 'agradecimentosPos', 'epigrafe', 'resumoPt', 'resumoEn'].some(el => hasElement(docType, el));
    const panels = [
        { id: 'documento', label: 'Documento', icon: FileCog },
        ...(hasPreTextual ? [{ id: 'pretextuais', label: isArticle ? 'Resumo' : 'Pré-textuais', icon: Globe }] : []),
        { id: 'capitulos', label: isArticle ? 'Texto' : 'Capítulos', icon: BookOpen },
        { id: 'referencias', label: 'Referências', icon: BookMarked },
        { id: 'revisao', label: 'Revisão', icon: ShieldCheck, badge: abntErrors.length },
    ];
    // Documento novo começa pela identificação; os demais abrem direto no texto
    const currentPanel = panels.some(p => p.id === panel) ? panel : (data.titulo ? 'capitulos' : 'documento');
    const nextPanel = panels[panels.findIndex(p => p.id === currentPanel) + 1];

    const isDark = settings.theme === 'dark';

    return (
        <div className={`flex flex-col h-dvh overflow-hidden abnt-editor-app transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
            <header className={`h-14 lg:h-16 border-b flex items-center justify-between gap-3 px-3 lg:px-5 shrink-0 z-30 print:hidden transition-colors ${headerBgClass}`}>
                <div className="flex items-center gap-2 lg:gap-3 min-w-0">
                    <button onClick={() => { if(isSaving && !window.confirm("Salvando... Sair?")) return; navigate('/dashboard'); }} aria-label="Voltar ao painel" className="p-2 shrink-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-green-700"><ArrowLeft size={20} /></button>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <h1 className={`font-semibold text-sm truncate leading-tight ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{data.titulo || "Documento sem título"}</h1>
                            {isReadOnly && (
                                <span className={`flex items-center shrink-0 gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${readOnlyBadgeClass}`}>
                                    <Lock size={10}/> Leitura
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 min-w-0">
                            <span className="truncate hidden sm:inline">{docType.label}</span>
                            <span className="hidden sm:inline" aria-hidden="true">·</span>
                            {isSaving || isExporting
                                ? <span className="flex items-center gap-1 text-amber-600 shrink-0"><Loader2 size={10} className="animate-spin"/> Salvando</span>
                                : <span className="flex items-center gap-1 text-green-600 dark:text-green-400 shrink-0"><CheckCircle2 size={10}/> Salvo</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 lg:gap-2 shrink-0">
                    <button onClick={() => { setPanel('revisao'); setMobileView('editor'); }} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${abntStatus.color}`} title="Ver revisão ABNT">
                        {abntStatus.icon}<span className="hidden sm:inline">{abntStatus.label}</span>
                    </button>
                    <button onClick={() => setShowOutline(!showOutline)} aria-label="Alternar navegação" aria-pressed={showOutline} className={`p-2 rounded-lg transition-colors ${showOutline ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><List size={18}/></button>
                    <button onClick={() => setSettings(s => ({...s, theme: s.theme === 'dark' ? 'light' : 'dark'}))} aria-label="Alternar tema" className="p-2 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">{isDark ? <Sun size={18}/> : <Moon size={18}/>}</button>
                    {!isReadOnly ? (
                        <>
                            <button onClick={handleExportDocx} disabled={isExporting} title="Baixar no formato do Word (.docx)" className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 border transition-colors disabled:opacity-60 ${isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}><FileText size={16}/><span className="hidden sm:inline">Word</span></button>
                            <button onClick={handleExportPDF} disabled={isExporting} title="Baixar o PDF em A4" className="bg-green-700 text-white px-3 lg:px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-green-800 transition-colors disabled:opacity-60">{isExporting ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>}<span className="hidden sm:inline">Baixar PDF</span></button>
                        </>
                    ) : (
                        <button onClick={handleCreateFromExample} className="bg-green-700 text-white px-3 lg:px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-green-800 transition-colors"><Copy size={15}/><span className="hidden sm:inline">Usar como base</span></button>
                    )}
                </div>
            </header>

            <main className="flex flex-1 overflow-hidden relative">
                {!focusMode && (
                    <aside className={`absolute inset-0 z-10 lg:relative lg:z-auto w-full lg:w-[440px] border-r flex-col print:hidden ${mobileView === 'editor' ? 'flex' : 'hidden lg:flex'} ${isReadOnly ? 'opacity-90' : ''} ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        {/* Etapas do documento */}
                        <nav aria-label="Etapas do documento" className={`grid shrink-0 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`} style={{ gridTemplateColumns: `repeat(${panels.length}, minmax(0, 1fr))` }}>
                            {panels.map(p => {
                                const active = currentPanel === p.id;
                                return (
                                    <button key={p.id} onClick={() => setPanel(p.id)} aria-current={active ? 'step' : undefined}
                                        className={`relative flex flex-col items-center gap-1 pt-2.5 pb-2 text-[11px] font-medium transition-colors border-b-2 -mb-px ${active ? 'text-green-700 dark:text-green-400 border-green-600' : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200'}`}>
                                        <p.icon size={16} aria-hidden="true" />
                                        <span className="truncate max-w-full px-1">{p.label}</span>
                                        {p.badge > 0 && <span className="absolute top-1.5 right-[calc(50%-18px)] min-w-4 h-4 px-1 rounded-full bg-amber-500 text-white text-[9px] font-bold leading-4 tabular">{p.badge}</span>}
                                    </button>
                                );
                            })}
                        </nav>

                        {currentPanel !== 'revisao' ? (
                            <EditorForm
                                data={data}
                                setData={setData}
                                authors={authors}
                                setAuthors={setAuthors}
                                settings={settings}
                                isReadOnly={isReadOnly}
                                focusedSection={focusedSection}
                                setFocusedSection={setFocusedSection}
                                panel={currentPanel}
                                next={nextPanel && { label: nextPanel.label, onClick: () => setPanel(nextPanel.id) }}
                                onOpenAssetModal={(type, sectionIndex) => setAssetModal({ open: true, type, sectionIndex, title: '', source: '', url: '', content: '', rows: 3, cols: 3, tableData: type === 'tab' ? Array(3).fill('').map(()=>Array(3).fill('...')) : [], localBase64: null })}
                                onOpenRefModal={() => setIsRefModalOpen(true)}
                                onOpenAttachmentModal={(type) => setAttachmentModal({ open: true, type })}
                            />
                        ) : (
                            <div className={`flex-1 overflow-y-auto p-6 space-y-6 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
                                <section className="grid grid-cols-2 gap-3">
                                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Palavras</p>
                                        <p className="tabular text-2xl font-semibold mt-1">{stats.words.toLocaleString('pt-BR')}</p>
                                    </div>
                                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Norma</p>
                                        <p className="text-sm font-semibold mt-1.5">{docType.norma}</p>
                                    </div>
                                </section>
                                <section className={`p-5 rounded-xl border ${isDark ? 'bg-slate-800/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-4"><ShieldCheck size={16} className="text-green-600"/> Conferência ABNT</h3>
                                    {abntErrors.length === 0 ? (
                                        <div className="text-center py-6"><CheckCircle2 size={36} className="text-green-500 mx-auto mb-2"/><p className="text-sm font-semibold">Tudo certo</p><p className="text-xs text-slate-500 dark:text-slate-400">Nenhum problema estrutural encontrado.</p></div>
                                    ) : (
                                        <ul className="space-y-2">
                                            {abntErrors.map((err, i) => (
                                                <li key={i} className="text-xs text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-300 p-3 rounded-lg">
                                                    <div className="flex items-center gap-2 font-semibold mb-1"><AlertTriangle size={14} className="shrink-0"/> {err.msg}</div>
                                                    <div className="pl-6 opacity-80 leading-relaxed">{err.explain}</div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </section>
                                <section className={`p-5 rounded-xl border ${isDark ? 'bg-slate-800/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-sm font-semibold flex items-center gap-2"><ListTodo size={16} className="text-green-600"/> Checklist do trabalho</h3>
                                        <span className="tabular text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">{Math.round((checklist.filter(i=>i.done).length / (checklist.length || 1))*100)}%</span>
                                    </div>
                                    <div className="space-y-2">
                                        {checklist.map(item => (
                                            <button key={item.id} disabled={item.auto || isReadOnly} onClick={() => setChecklist(checklist.map(i => i.id === item.id ? {...i, done: !i.done} : i))}
                                                className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border transition-colors disabled:cursor-default ${item.done ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : (isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200')} ${!item.auto && !isReadOnly ? 'hover:border-green-400' : 'opacity-80'}`}>
                                                <span className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${item.done ? 'bg-green-600 text-white' : 'bg-slate-200 dark:bg-slate-600 text-transparent'}`}>{item.auto ? <Settings2 size={12}/> : <CheckSquare size={14}/>}</span>
                                                <span className="flex-1">
                                                    <span className={`text-xs font-medium ${item.done ? 'text-green-800 dark:text-green-400 line-through' : ''}`}>{item.text}</span>
                                                    {item.auto && <span className="text-[10px] text-slate-400 block mt-0.5">Automático</span>}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        )}
                    </aside>
                )}

                <div className={`absolute inset-0 z-0 lg:relative lg:z-auto flex-1 overflow-hidden flex-col ${mobileView === 'preview' ? 'flex' : 'hidden lg:flex'} ${isDark ? 'bg-slate-900' : 'bg-slate-200'}`}>
                    {/* useDeferredValue devolve o valor anterior (null) no primeiro render após carregar */}
                    {previewData && <ABNTViewer data={previewData} authors={previewAuthors} zoomLevel={zoomLevel} fontFamily={fontFamily} groupedSections={previewSections} />}

                    {/* Controles da pré-visualização, perto da folha */}
                    <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-1 rounded-xl border shadow-lg print:hidden ${isDark ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-slate-200'}`}>
                        <button onClick={() => setZoomLevel(z => Math.max(0.3, +(z - 0.1).toFixed(2)))} aria-label="Diminuir zoom" className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><ZoomOut size={16}/></button>
                        <span className="tabular text-xs font-semibold w-11 text-center text-slate-600 dark:text-slate-300">{Math.round(zoomLevel * 100)}%</span>
                        <button onClick={() => setZoomLevel(z => Math.min(2, +(z + 0.1).toFixed(2)))} aria-label="Aumentar zoom" className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><ZoomIn size={16}/></button>
                        {!isReadOnly && (
                            <>
                                <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
                                {['Arial', 'Times New Roman'].map(f => (
                                    <button key={f} onClick={() => setFontFamily(f)} aria-pressed={fontFamily === f} className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${fontFamily === f ? 'bg-green-700 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>{f === 'Arial' ? 'Arial' : 'Times'}</button>
                                ))}
                            </>
                        )}
                    </div>
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

                <button onClick={() => setMobileView(v => v === 'editor' ? 'preview' : 'editor')} aria-label={mobileView === 'editor' ? 'Ver o documento' : 'Voltar a editar'} className="lg:hidden fixed bottom-20 right-4 z-30 h-14 w-14 rounded-full shadow-[0_10px_30px_-8px_rgba(28,27,25,0.5)] bg-green-700 text-white flex items-center justify-center">
                    {mobileView === 'editor' ? <Eye size={22}/> : <FileEdit size={22}/>}
                </button>
            </main>

            <Suspense fallback={null}>
                {isRefModalOpen && <ReferenceModal isOpen onClose={() => setIsRefModalOpen(false)} onAddReference={(referenceStr) => { setData(prev => ({ ...prev, referencias: prev.referencias ? prev.referencias + '\n\n' + referenceStr : referenceStr })); }} />}
                {assetModal.open && <AssetModal isOpen onClose={() => setAssetModal({...assetModal, open: false})} assetModal={assetModal} setAssetModal={setAssetModal} onConfirm={confirmAssetInsert} />}
                {attachmentModal.open && (
                    <AttachmentModal
                        isOpen
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
                )}
            </Suspense>
        </div>
    );
};

export default Editor;
