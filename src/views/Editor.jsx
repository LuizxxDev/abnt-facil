import React, { useState, useMemo, useEffect, useDeferredValue, useCallback, lazy, Suspense } from 'react';
import { flushSync } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Lock, Loader2, CheckCircle2, AlertTriangle, AlertCircle,
  ZoomOut, ZoomIn, List, FileEdit, Copy, Download, FileText,
  ListTodo, ShieldCheck,
  Sun, Moon, Eye, FileCog, Globe, BookOpen, BookMarked
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useAppContext } from '../contexts/AppContext';
import { useAutosave } from '../hooks/useAutosave';
import { useExport } from '../hooks/useExport';
import { DEFAULT_CHECKLIST, EXAMPLES } from '../utils/constants';
import { getDocType, hasElement, isRequired } from '../utils/documentTypes';
import { splitBlocks } from '../utils/documentContent';

import EditorForm from '../components/editor/EditorForm';
import Sidebar from '../components/editor/Sidebar';
import ABNTViewer from '../components/preview/ABNTViewer';
import Sheet from '../components/common/Sheet';
import { btnPrimary, btnSecondary, btnGhost, iconBtn } from '../components/common/ui';
import Dialog from '../components/common/Dialog';

// Modais só são baixados quando abertos pela primeira vez
const ReferenceModal = lazy(() => import('../components/editor/ReferenceModal'));
const AssetModal = lazy(() => import('../components/common/AssetModal'));
const AttachmentModal = lazy(() => import('../components/editor/AttachmentModal'));

const Editor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const { projects, setProjects, settings, setSettings, createFromExample, user } = useAppContext();
    
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
    const [exportGate, setExportGate] = useState(null); // 'pdf' | 'docx' quando há ajustes pendentes

    useEffect(() => {
        if (!id) return;
        if (loadedId === id) return;

        if (EXAMPLES[id]) {
            setData(EXAMPLES[id].data);
            setAuthors(EXAMPLES[id].authors);
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

    const isReadOnly = Boolean(EXAMPLES[id]);
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
            // NBR 6024: alíneas terminam em ponto e vírgula, a última em ponto (dois-pontos se houver subalíneas)
            const listas = (data.secoes || []).flatMap(s => splitBlocks(s.conteudo).filter(b => b.kind === 'list'));
            if (listas.some(l => l.items.some((it, idx) => {
                const end = it.text.trim().slice(-1);
                const last = idx === l.items.length - 1;
                return last ? end !== '.' : ![';', ':'].includes(end);
            }))) errs.push({msg: 'Pontuação das alíneas', explain: 'Na NBR 6024, cada alínea termina em ponto e vírgula e a última em ponto. Use dois-pontos quando vierem subalíneas.'});
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
                        explain: `"${missing[0]}" aparece citado no texto, mas não está na lista de referências (NBR 10520 e NBR 6023).`
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
        if (abntErrors.length === 0) return { label: 'Sem alertas', tone: 'bg-accent-soft text-accent', icon: <CheckCircle2 size={16} aria-hidden="true" /> };
        const n = abntErrors.length;
        return { label: `${n} ${n === 1 ? 'ajuste' : 'ajustes'}`, tone: n <= 2 ? 'bg-warn-soft text-warn' : 'bg-danger-soft text-danger', icon: <AlertCircle size={16} aria-hidden="true" /> };
    }, [abntErrors]);

    const numberSections = getDocType(data).numberedSections !== false;
    const secoes = data?.secoes;
    const sumarioItens = useMemo(() => {
        if (!secoes) return [];
        let counts = [0, 0, 0, 0, 0];
        return secoes.map(s => {
            const level = Math.min(Math.max(Number(s.level) || 1, 1), 5); 
            counts[level - 1]++;
            for (let k = level; k < 5; k++) counts[k] = 0;
            const numParts = [];
            for (let k = 0; k < level; k++) numParts.push(counts[k] === 0 ? 1 : counts[k]);
            return { ...s, level, num: numberSections ? numParts.join('.') : '' };
        }); 
    }, [secoes, numberSections]);

    const groupedSections = useMemo(() => {
        if (!secoes) return [];
        const groups = [];
        secoes.forEach((section, index) => {
          const sectionWithNum = { ...section, num: sumarioItens[index]?.num };
          if (Number(section.level) === 1 || groups.length === 0) groups.push([sectionWithNum]);
          else groups[groups.length - 1].push(sectionWithNum);
        });
        return groups;
    }, [secoes, sumarioItens]);

    // Só a gravação na nuvem é assíncrona: sem login o texto já está no navegador
    useEffect(() => {
        if (!isSaving || !user) return;
        const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [isSaving, user]);

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
            else if (type === 'box') tag = `\n\n[QUADRO]: ${title} | ${source} | ${content || 'Conteúdo…'}`;
            
            const newSec = [...newData.secoes]; 
            newSec[sectionIndex] = { ...newSec[sectionIndex], conteudo: newSec[sectionIndex].conteudo + tag };
            newData.secoes = newSec;
            return newData;
        }); 
        
        setAssetModal({ open: false, type: 'img', sectionIndex: null, title: '', source: '', url: '', content: '', rows: 3, cols: 3, tableData: [], localBase64: null });
    };

    const handleCreateFromExample = async () => {
        const newId = await createFromExample(id);
        toast.success('Exemplo copiado para os seus documentos');
        navigate(`/editor/${newId}`);
    };

    if (!data) return (
        <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-paper" role="status">
            <Sheet progress={60} className="w-12 animate-pulse" />
            <p className="text-sm text-ink-2">Abrindo o documento…</p>
        </div>
    );

    const docType = getDocType(data);
    const isArticle = docType.layout === 'article';
    const hasPreTextual = ['dedicatoria', 'agradecimentos', 'agradecimentosPos', 'epigrafe', 'resumoPt', 'resumoEn'].some(el => hasElement(docType, el));
    const panels = [
        { id: 'documento', label: 'Documento', short: 'Dados', icon: FileCog },
        ...(hasPreTextual ? [{ id: 'pretextuais', label: isArticle ? 'Resumo' : 'Pré-textuais', short: isArticle ? 'Resumo' : 'Pré', icon: Globe }] : []),
        { id: 'capitulos', label: isArticle ? 'Texto' : 'Capítulos', short: isArticle ? 'Texto' : 'Texto', icon: BookOpen },
        { id: 'referencias', label: 'Referências', short: 'Refs.', icon: BookMarked },
        { id: 'revisao', label: 'Revisão', short: 'Revisão', icon: ShieldCheck, badge: abntErrors.length },
    ];
    // Documento novo começa pela identificação; os demais abrem direto no texto
    const currentPanel = panels.some(p => p.id === panel) ? panel : (data.titulo ? 'capitulos' : 'documento');
    const nextPanel = panels[panels.findIndex(p => p.id === currentPanel) + 1];
    const checklistDone = checklist.filter(i => i.done).length;
    const isDark = settings.theme === 'dark';

    return (
        <div className="abnt-editor-app flex h-dvh flex-col overflow-hidden bg-paper text-ink">
            <header className="safe-top z-30 shrink-0 border-b border-line bg-surface print:hidden">
                <div className="flex h-14 items-center justify-between gap-2 px-2 lg:px-4">
                    <div className="flex min-w-0 items-center gap-1">
                        <button type="button" onClick={() => { if (isSaving && !window.confirm('Ainda salvando. Sair mesmo assim?')) return; navigate('/dashboard'); }} aria-label="Voltar aos documentos" className={iconBtn}><ArrowLeft size={20} /></button>
                        <div className="flex min-w-0 flex-col">
                            <h1 className="truncate text-sm font-semibold leading-tight" title={data.titulo || 'Documento sem título'}>{data.titulo || 'Documento sem título'}</h1>
                            <p className="flex min-w-0 items-center gap-1.5 text-xs text-ink-3" aria-live="polite">
                                <span className="hidden truncate sm:inline">{docType.label}</span>
                                <span className="hidden sm:inline" aria-hidden="true">·</span>
                                {isReadOnly
                                    ? <span className="flex min-w-0 items-center gap-1"><Lock size={12} className="shrink-0" aria-hidden="true" /><span className="truncate">Somente leitura</span></span>
                                    : isSaving || isExporting
                                        ? <span className="flex shrink-0 items-center gap-1"><Loader2 size={12} className="animate-spin" aria-hidden="true" /> Salvando…</span>
                                        : <span className="flex shrink-0 items-center gap-1"><CheckCircle2 size={12} className="text-accent" aria-hidden="true" /> Salvo</span>}
                            </p>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                        <button type="button" onClick={() => { setPanel('revisao'); setMobileView('editor'); }} title="Ver a revisão ABNT"
                            className={`flex h-9 items-center gap-1.5 rounded-[var(--radius-control)] px-2.5 text-xs font-semibold transition-colors duration-150 pointer-coarse:h-11 ${abntStatus.tone}`}>
                            {abntStatus.icon}<span className="hidden sm:inline">{abntStatus.label}</span><span className="sr-only sm:hidden">{abntStatus.label}</span>
                        </button>
                        <button type="button" onClick={() => setShowOutline(!showOutline)} aria-label="Sumário do documento" aria-pressed={showOutline} className={`${iconBtn} max-sm:hidden ${showOutline ? 'bg-accent-soft text-accent hover:bg-accent-soft hover:text-accent' : ''}`}><List size={18} /></button>
                        <button type="button" onClick={() => setSettings(s => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }))} aria-label={isDark ? 'Usar tema claro' : 'Usar tema escuro'} className={`${iconBtn} max-sm:hidden`}>{isDark ? <Sun size={18} /> : <Moon size={18} />}</button>
                        {!isReadOnly ? (
                            <>
                                <button type="button" onClick={() => abntErrors.length ? setExportGate('docx') : handleExportDocx()} disabled={isExporting} aria-label="Baixar no formato do Word (.docx)" title="Baixar .docx" className={`${btnSecondary} px-3`}><FileText size={16} aria-hidden="true" /><span className="hidden md:inline">Word</span></button>
                                <button type="button" onClick={() => abntErrors.length ? setExportGate('pdf') : handleExportPDF()} disabled={isExporting} aria-label="Baixar PDF em A4" title="Baixar PDF" className={`${btnPrimary} px-3`}>{isExporting ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}<span className="hidden md:inline">Baixar PDF</span></button>
                            </>
                        ) : (
                            <button type="button" onClick={handleCreateFromExample} className={`${btnPrimary} px-3`}><Copy size={16} aria-hidden="true" /> <span className="hidden sm:inline">Usar como base</span><span className="sm:hidden">Usar</span></button>
                        )}
                    </div>
                </div>
            </header>

            <main className="relative flex flex-1 overflow-hidden">
                {!focusMode && (
                    <aside aria-label="Editor" className={`fade-in absolute inset-x-0 top-0 bottom-[calc(4.125rem+env(safe-area-inset-bottom,0px))] z-10 w-full flex-col lg:bottom-auto border-r border-line bg-surface print:hidden lg:relative lg:z-auto lg:w-[460px] ${mobileView === 'editor' ? 'flex' : 'hidden lg:flex'}`}>
                        <nav aria-label="Etapas do documento" className="grid shrink-0 border-b border-line" style={{ gridTemplateColumns: `repeat(${panels.length}, minmax(0, 1fr))` }}>
                            {panels.map(p => {
                                const active = currentPanel === p.id;
                                return (
                                    <button key={p.id} type="button" onClick={() => setPanel(p.id)} aria-current={active ? 'step' : undefined}
                                        className={`relative -mb-px flex min-h-14 flex-col items-center justify-center gap-1 border-b-2 px-1 text-xs font-medium transition-colors duration-150 ${active ? 'border-accent text-accent' : 'border-transparent text-ink-2 hover:text-ink'}`}>
                                        <span className="relative">
                                            <p.icon size={18} aria-hidden="true" />
                                            {p.badge > 0 && <span className="tabular absolute -right-2.5 -top-1.5 min-w-4 rounded-full bg-warn px-1 text-[11px] font-bold leading-4 text-white dark:text-slate-950" aria-label={`${p.badge} pendências`}>{p.badge}</span>}
                                        </span>
                                        <span className="max-w-full truncate"><span className="min-[400px]:hidden">{p.short}</span><span className="hidden min-[400px]:inline">{p.label}</span></span>
                                    </button>
                                );
                            })}
                        </nav>

                        {isReadOnly && (
                            <p className="flex shrink-0 items-center gap-2 bg-warn-soft px-4 py-2.5 text-sm text-ink">
                                <Lock size={14} className="shrink-0 text-warn" aria-hidden="true" />
                                Este é o exemplo. Para editar, toque em “Usar como base”.
                            </p>
                        )}

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
                                onOpenAssetModal={(type, sectionIndex) => setAssetModal({ open: true, type, sectionIndex, title: '', source: '', url: '', content: '', rows: 3, cols: 3, tableData: type === 'tab' ? Array(3).fill('').map(()=>Array(3).fill('…')) : [], localBase64: null })}
                                onOpenRefModal={() => setIsRefModalOpen(true)}
                                onOpenAttachmentModal={(type) => setAttachmentModal({ open: true, type })}
                            />
                        ) : (
                            <div className="flex-1 space-y-8 overflow-y-auto overscroll-contain p-5">
                                <dl className="grid grid-cols-2 gap-3">
                                    <div className="rounded-[var(--radius-panel)] bg-surface-2 p-4">
                                        <dt className="text-xs text-ink-3">Palavras</dt>
                                        <dd className="tabular mt-1 text-2xl font-bold">{stats.words.toLocaleString('pt-BR')}</dd>
                                    </div>
                                    <div className="rounded-[var(--radius-panel)] bg-surface-2 p-4">
                                        <dt className="text-xs text-ink-3">Norma</dt>
                                        <dd className="tabular mt-1.5 text-sm font-semibold">{docType.norma}</dd>
                                    </div>
                                </dl>
                                <section aria-labelledby="conferencia">
                                    <h2 id="conferencia" className="flex items-center gap-2 font-semibold"><ShieldCheck size={18} className="text-accent" aria-hidden="true" /> Conferência automática</h2>
                                    <p className="mb-3 mt-1 text-xs leading-snug text-ink-3">Verifica parte das regras da ABNT (resumo, palavras-chave, citações, referências, alíneas e elementos obrigatórios). Revise o documento e o manual da sua instituição antes de entregar.</p>
                                    {abntErrors.length === 0 ? (
                                        <div className="flex flex-col items-center rounded-[var(--radius-panel)] bg-accent-soft px-4 py-8 text-center">
                                            <CheckCircle2 size={28} className="text-accent" aria-hidden="true" />
                                            <p className="mt-2 font-semibold">Nenhum alerta</p>
                                            <p className="text-sm text-ink-2">A conferência automática não encontrou problemas nas regras que ela verifica.</p>
                                        </div>
                                    ) : (
                                        <ul className="space-y-2">
                                            {abntErrors.map((err, i) => (
                                                <li key={i} className="rounded-[var(--radius-control)] bg-warn-soft p-3 text-sm">
                                                    <p className="flex items-start gap-2 font-semibold"><AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" aria-hidden="true" /> {err.msg}</p>
                                                    <p className="mt-1 pl-6 leading-relaxed text-ink-2">{err.explain}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </section>
                                <section aria-labelledby="checklist">
                                    <div className="mb-3 flex items-center justify-between">
                                        <h2 id="checklist" className="flex items-center gap-2 font-semibold"><ListTodo size={18} className="text-accent" aria-hidden="true" /> Checklist do trabalho</h2>
                                        <span className="tabular text-sm font-semibold text-ink-2">{checklistDone} de {checklist.length}</span>
                                    </div>
                                    <ul className="space-y-1.5">
                                        {checklist.map(item => (
                                            <li key={item.id}>
                                                <label className={`flex items-start gap-3 rounded-[var(--radius-control)] p-3 transition-colors duration-150 ${item.done ? 'bg-accent-soft' : 'bg-surface-2'} ${!item.auto && !isReadOnly ? 'cursor-pointer hover:bg-line/60' : ''}`}>
                                                    <input type="checkbox" checked={!!item.done} disabled={item.auto || isReadOnly}
                                                        onChange={() => setChecklist(checklist.map(i => i.id === item.id ? { ...i, done: !i.done } : i))}
                                                        className="mt-0.5 size-4 shrink-0 accent-[var(--accent-fill)]" />
                                                    <span className="min-w-0 flex-1">
                                                        <span className={`block text-sm ${item.done ? 'text-ink-2 line-through decoration-ink-3' : ''}`}>{item.text}</span>
                                                        {item.auto && <span className="mt-0.5 block text-xs text-ink-3">Conferido automaticamente</span>}
                                                    </span>
                                                </label>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            </div>
                        )}
                    </aside>
                )}

                <div className={`fade-in absolute inset-x-0 top-0 bottom-[calc(4.125rem+env(safe-area-inset-bottom,0px))] z-0 flex-1 flex-col lg:bottom-auto overflow-hidden bg-surface-2 lg:relative lg:z-auto ${mobileView === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
                    {/* useDeferredValue devolve o valor anterior (null) no primeiro render após carregar */}
                    {previewData && <ABNTViewer data={previewData} authors={previewAuthors} zoomLevel={zoomLevel} fontFamily={fontFamily} groupedSections={previewSections} />}

                    {/* Controles da pré-visualização, perto da folha */}
                    <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-[var(--radius-panel)] bg-surface p-1 shadow-[var(--shadow-float)] ring-1 ring-line print:hidden">
                        <button type="button" onClick={() => setZoomLevel(z => Math.max(0.3, +(z - 0.1).toFixed(2)))} aria-label="Diminuir zoom" className={iconBtn}><ZoomOut size={16} /></button>
                        <span className="tabular w-12 text-center text-xs font-semibold text-ink-2" aria-live="polite">{Math.round(zoomLevel * 100)}%</span>
                        <button type="button" onClick={() => setZoomLevel(z => Math.min(2, +(z + 0.1).toFixed(2)))} aria-label="Aumentar zoom" className={iconBtn}><ZoomIn size={16} /></button>
                        {!isReadOnly && (
                            <div role="radiogroup" aria-label="Fonte do documento" className="ml-1 flex gap-0.5 border-l border-line pl-1.5">
                                {['Arial', 'Times New Roman'].map(f => (
                                    <button key={f} type="button" role="radio" onClick={() => setFontFamily(f)} aria-checked={fontFamily === f}
                                        className={`h-9 rounded-[var(--radius-control)] px-2.5 text-xs font-semibold transition-colors duration-150 pointer-coarse:h-11 ${fontFamily === f ? 'bg-accent-fill text-white' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'}`}>{f === 'Arial' ? 'Arial' : 'Times'}</button>
                                ))}
                            </div>
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
            </main>

            {/* Celular: alterna entre escrever e ver a folha, sem cobrir o texto */}
            <nav aria-label="Modo de visualização" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] lg:hidden print:hidden">
                <div role="tablist" className="grid grid-cols-3 gap-1 rounded-[var(--radius-control)] bg-surface-2 p-1">
                    <button type="button" role="tab" aria-selected={mobileView === 'editor'} onClick={() => setMobileView('editor')}
                        className={`col-span-1 flex h-10 items-center justify-center gap-2 rounded-[4px] text-sm font-semibold transition-colors duration-150 ${mobileView === 'editor' ? 'bg-surface text-ink shadow-[0_1px_2px_rgb(28_27_25/0.12)]' : 'text-ink-2'}`}>
                        <FileEdit size={16} aria-hidden="true" /> Editar
                    </button>
                    <button type="button" role="tab" aria-selected={mobileView === 'preview'} onClick={() => setMobileView('preview')}
                        className={`col-span-1 flex h-10 items-center justify-center gap-2 rounded-[4px] text-sm font-semibold transition-colors duration-150 ${mobileView === 'preview' ? 'bg-surface text-ink shadow-[0_1px_2px_rgb(28_27_25/0.12)]' : 'text-ink-2'}`}>
                        <Eye size={16} aria-hidden="true" /> Ver folha
                    </button>
                    <button type="button" onClick={() => setShowOutline(!showOutline)} aria-pressed={showOutline}
                        className={`col-span-1 flex h-10 items-center justify-center gap-2 rounded-[4px] text-sm font-semibold transition-colors duration-150 ${showOutline ? 'bg-surface text-accent shadow-[0_1px_2px_rgb(28_27_25/0.12)]' : 'text-ink-2'}`}>
                        <List size={16} aria-hidden="true" /> Sumário
                    </button>
                </div>
            </nav>

            {/* Antes de entregar: avisa o que a revisão ainda aponta, sem impedir o download */}
            <Dialog open={!!exportGate} onClose={() => setExportGate(null)} size="sm"
                title={`${abntErrors.length} ${abntErrors.length === 1 ? 'ajuste pendente' : 'ajustes pendentes'} antes de entregar`}
                description="A revisão ABNT ainda aponta estes pontos. Você pode corrigir agora ou baixar assim mesmo."
                footer={<>
                    <button type="button" className={btnGhost} onClick={() => { setExportGate(null); setPanel('revisao'); setMobileView('editor'); }}>Ver os ajustes</button>
                    <button type="button" className={btnPrimary} data-autofocus onClick={() => { const kind = exportGate; setExportGate(null); if (kind === 'pdf') handleExportPDF(); else handleExportDocx(); }}>
                        Baixar {exportGate === 'pdf' ? 'PDF' : '.docx'} assim mesmo
                    </button>
                </>}>
                <ul className="space-y-2 pt-1">
                    {abntErrors.slice(0, 4).map((err, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm"><AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" aria-hidden="true" /> {err.msg}</li>
                    ))}
                    {abntErrors.length > 4 && <li className="pl-6 text-sm text-ink-3">e mais {abntErrors.length - 4}.</li>}
                </ul>
            </Dialog>

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
