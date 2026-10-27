/* ========================================================================== *
 * *    .         . .    .                 . .
.+'|      .+'| |`+. |`+. |~~|=|~~| .+'| |`+.
|  |      |  | |  | |  | |.+' |  | |  | |  |
|  |      |  | |  | |  |      |.+' .' .`. `.
|  |      |  | |  | |  |    .='    |  | |  |
|  |    . |  | |  | |  | .+'|    . |  | |  |
|  | .+'| |  | |  | |  | |  | .+'| |  | |  |
`+.|=|.+' `+.|=|.+' |.+' |..|=|..| `+.| |.+'
 * *
 * -------------------------------------------------------------------------- *
 * AUTOR: Luiz Felipe Batista Rodrigues                                     *
 * PROJETO: ABNT Editor Web                                                  *
 * DESCRIÇÃO: Motor de renderização e formatação ABNT rigorosa.              *
 * DIREITOS: Reservados. Cópia ou alteração estrutural não autorizada.       *
 * ========================================================================== */

import React, { useMemo, useLayoutEffect, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TAG_RENDERERS } from '../../utils/constants';
import { paginateFlows } from '../../utils/pagination';

const escapeHtml = (text) => text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

// Converte o texto do editor em blocos: parágrafos (HTML seguro) ou recursos ([CITAÇÃO], [IMAGEM]...)
const parseBlocks = (texto, assets) => {
    if (!texto || typeof texto !== 'string') return [];

    // Divide o texto em blocos separados por uma ou mais linhas em branco
    return texto.trim().split(/\n{2,}/).map(bloco => bloco.trim()).filter(Boolean).map(trimmed => {
        // ── Detecta tags especiais ──────────────────────────────────────
        const matchTag = trimmed.match(/^\[(CITAÇÃO|IMAGEM|TABELA|QUADRO)\]:\s*([\s\S]*)/i);

        if (matchTag && TAG_RENDERERS[matchTag[1].toUpperCase()]) {
            const tipo = matchTag[1].toUpperCase();
            let conteudo = matchTag[2];

            if (tipo === 'IMAGEM') {
                let [title, source, urlStr] = conteudo.split('|').map(s => s?.trim() || '');
                // Resolve asset local se existir
                if (urlStr && assets && assets[urlStr]) urlStr = assets[urlStr];
                conteudo = `${title} | ${source} | ${urlStr}`;
            }
            return { kind: 'asset', tipo, conteudo };
        }

        const html = trimmed.split('\n')
            .map(linha => escapeHtml(linha)
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>'))
            .join('<br/>');
        return { kind: 'p', html };
    });
};

// Renderiza um item de fluxo. `props` recebe a key e o id de âncora (folha) ou data-mkey (medidor)
const renderItem = (item, props) => {
    switch (item.kind) {
        case 'title':
            return (
                <div {...props} className={`abnt-title-container abnt-h${Number(item.level)}`}>
                    <span className="shrink-0">{item.num}</span>
                    <span>{item.titulo}</span>
                </div>
            );
        case 'heading':
            return <div {...props} className="abnt-center-bold">{item.text}</div>;
        case 'ref':
            return <div {...props} className="abnt-ref">{item.text}</div>;
        case 'asset':
            return <div {...props} className="abnt-asset-container">{TAG_RENDERERS[item.tipo](item.conteudo, 0)}</div>;
        default:
            return (
                <p
                    {...props}
                    className="abnt-p"
                    style={{
                        textIndent: item.cont ? 0 : undefined,           // continuação de parágrafo vindo da folha anterior
                        textAlignLast: item.split ? 'justify' : undefined // última linha antes da quebra fica justificada
                    }}
                    dangerouslySetInnerHTML={{ __html: item.html }}
                />
            );
    }
};

const ABNTViewer = ({ data, authors, zoomLevel, fontFamily, sumarioItens, groupedSections }) => {

    // CONFIGURAÇÃO DE PAGINAÇÃO:
    // Se a sua instituição exige que a numeração comece do "1" apenas na Introdução, alterar para 'false'.
    const STRICT_ABNT_PAGINATION = true;

    // Define dinamicamente se as páginas pré-textuais incrementam o contador CSS baseado na constante acima
    const preTextualClass = STRICT_ABNT_PAGINATION ? "page page-count" : "page";

    const formatConteudo = (texto) =>
        parseBlocks(texto, data?.assets).map((b, i) => renderItem(b, { key: i }));

    // Fluxos de conteúdo: cada um começa numa folha nova e pode ocupar várias folhas
    const flows = useMemo(() => {
        if (!data || !groupedSections) return [];
        const list = [];
        const blocksOf = (prefix, texto) =>
            parseBlocks(texto, data.assets).map((b, i) => ({ ...b, key: `${prefix}-${i}` }));

        // Seções primárias abrem folha nova; secundárias continuam no mesmo fluxo (NBR 14724)
        groupedSections.forEach((group, gi) => {
            const items = [];
            group.forEach(s => {
                items.push({ key: `t-${s.id}`, kind: 'title', anchor: s.id, level: s.level, num: s.num, titulo: s.titulo, keepWithNext: true });
                items.push(...blocksOf(`s-${s.id}`, s.conteudo));
            });
            list.push({ key: `g-${gi}`, items });
        });

        list.push({
            key: 'referencias',
            items: [
                { key: 'h-referencias', kind: 'heading', anchor: 'referencias', text: 'REFERÊNCIAS', keepWithNext: true },
                ...(data.referencias || '').trim().split('\n').filter(r => r.trim())
                    .map((ref, i) => ({ key: `ref-${i}`, kind: 'ref', text: ref })),
            ],
        });

        if (data.apendices && data.apendices.trim() !== '') {
            list.push({ key: 'apendices', items: [
                { key: 'h-apendices', kind: 'heading', anchor: 'apendices', text: 'APÊNDICES', keepWithNext: true },
                ...blocksOf('apd', data.apendices),
            ] });
        }

        if (data.anexos && data.anexos.trim() !== '') {
            list.push({ key: 'anexos', items: [
                { key: 'h-anexos', kind: 'heading', anchor: 'anexos', text: 'ANEXOS', keepWithNext: true },
                ...blocksOf('anx', data.anexos),
            ] });
        }
        return list;
    }, [data, groupedSections]);

    // Mede os blocos no medidor invisível e distribui-os em folhas A4
    const measurerRef = useRef(null);
    const [paged, setPaged] = useState(null);
    const [measureTick, setMeasureTick] = useState(0);

    useLayoutEffect(() => {
        if (!measurerRef.current) return;
        const result = paginateFlows(flows, measurerRef.current);
        if (result) setPaged(result);
    }, [flows, fontFamily, measureTick]);

    // Fontes, imagens e mudanças de layout alteram as alturas: medir de novo
    useEffect(() => {
        let alive = true;
        const remeasure = () => alive && setMeasureTick(t => t + 1);
        document.fonts?.ready.then(remeasure);
        const resizeObserver = new ResizeObserver(remeasure);
        const pageProbe = measurerRef.current?.querySelector('[data-page-probe]');
        if (pageProbe) resizeObserver.observe(pageProbe);
        const imgs = [...(measurerRef.current?.querySelectorAll('img') || [])].filter(img => !img.complete);
        imgs.forEach(img => { img.addEventListener('load', remeasure); img.addEventListener('error', remeasure); });
        return () => {
            alive = false;
            resizeObserver.disconnect();
            imgs.forEach(img => { img.removeEventListener('load', remeasure); img.removeEventListener('error', remeasure); });
        };
    }, [flows]);

    const pagesOf = (flow) => paged?.[flow.key] || [flow.items];

    // Número real da folha de cada seção, para o sumário
    const pageMapping = useMemo(() => {
        if (!data) return {};

        let preTextualPages = 1; // Folha de Rosto sempre existe no escopo

        if (data.dedicatoria && data.dedicatoria.trim() !== '') preTextualPages += 1;
        if (data.agradecimentos && data.agradecimentos.trim() !== '') preTextualPages += 1;
        if (data.epigrafe && data.epigrafe.trim() !== '') preTextualPages += 1;

        preTextualPages += 1; // Resumo Pt

        if (data.resumoEn && data.resumoEn.trim() !== '') {
            preTextualPages += 1; // Abstract
        }

        preTextualPages += 1; // Sumário

        // Se STRICT_ABNT_PAGINATION for false, o sumário e o CSS resetam e o conteúdo textual assume página 1
        let currentPage = STRICT_ABNT_PAGINATION ? (preTextualPages + 1) : 1;

        const mapping = {};
        flows.forEach(flow => {
            const pages = paged?.[flow.key] || [flow.items];
            pages.forEach((page, pi) => page.forEach(item => {
                if (item.anchor && mapping[item.anchor] === undefined) mapping[item.anchor] = currentPage + pi;
            }));
            currentPage += pages.length;
        });
        return mapping;
    }, [data, flows, paged, STRICT_ABNT_PAGINATION]);

    const getPageNumber = (secId) => {
        return pageMapping[secId] || "";
    };

    return (
        <section className="flex-1 overflow-y-auto p-12 flex justify-center bg-slate-200 dark:bg-slate-900 print:bg-white print:p-0 transition-all duration-300">
            <style>{`
                .abnt-doc { 
                    font-family: ${fontFamily === 'Arial' ? 'Arial, sans-serif' : '"Times New Roman", Times, serif'}; 
                    color: black;
                    line-height: 1.5;
                    transition: transform 0.2s ease;
                    counter-reset: pagina-abnt 0; 
                    
                    overflow-wrap: break-word;
                    word-wrap: break-word;
                    word-break: break-word;
                    hyphens: auto; 
                }
                
                .page { 
                    background: white; 
                    width: 210mm; 
                    height: 297mm;
                    overflow: hidden;       /* <- impede o vazamento */
                    page-break-after: always;
                    break-after: page; 
                    padding: 30mm 20mm 20mm 30mm; 
                    margin: 0 auto 30px auto; 
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                    display: flex; 
                    flex-direction: column; 
                    box-sizing: border-box; 
                    position: relative;
                }

                .page-count {
                    counter-increment: pagina-abnt; 
                }

                .page-numbered::after {
                    content: counter(pagina-abnt);
                    position: absolute;
                    top: 20mm;
                    right: 20mm;
                    font-size: 10pt;
                }

                .sumario-item {
                    display: flex;
                    align-items: baseline;
                    width: 100%;
                    margin-bottom: 4pt;
                    text-decoration: none;
                    color: black;
                    page-break-inside: avoid;
                    break-inside: avoid;
                }

                .sumario-label {
                    flex-shrink: 0;
                    max-width: 85%;
                }

                .sumario-dots {
                    flex-grow: 1;
                    border-bottom: 1pt dotted black;
                    margin: 0 4pt;
                    position: relative;
                    top: -4pt;
                }

                .sumario-page {
                    flex-shrink: 0;
                    text-align: right;
                    min-width: 20pt;
                }

                .abnt-p {
                text-align: justify !important;
                text-indent: 1.25cm;
                font-size: 12pt;
                line-height: 1.5;
                margin-bottom: 0;
                /* ADICIONE: */
                overflow-wrap: break-word;
                word-break: break-word;
                hyphens: auto;
                -webkit-hyphens: auto;
                white-space: normal;

                }
                
                .abnt-citacao-longa { 
                    margin-left: 4cm; 
                    font-size: 10pt; 
                    line-height: 1.0; 
                    text-align: justify !important; 
                    text-justify: inter-word;
                    margin-top: 1.5em; 
                    margin-bottom: 1.5em; 
                    orphans: 2;
                    widows: 2;
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
                
                .abnt-title-container {
                    display: flex;
                    gap: 1ch;
                    font-size: 12pt;
                    line-height: 1.5;
                    margin-bottom: 1.5em;
                    page-break-after: avoid;
                    break-after: avoid;
                }
                
                .abnt-h1 { font-weight: bold; text-transform: uppercase; }
                .abnt-h2 { font-weight: bold; text-transform: none; }
                .abnt-h3 { font-weight: bold; font-style: italic; text-transform: none; }
                .abnt-h4 { font-weight: normal; font-style: italic; text-transform: none; }
                .abnt-h5 { font-weight: normal; font-style: normal; text-transform: none; }
                
                .sumario-h1 { font-weight: bold; text-transform: uppercase; }
                .sumario-h2 { font-weight: bold; text-transform: none; }
                .sumario-h3 { font-weight: bold; font-style: italic; text-transform: none; }
                .sumario-h4 { font-weight: normal; font-style: italic; text-transform: none; }
                .sumario-h5 { font-weight: normal; font-style: normal; text-transform: none; }
                
                .abnt-center-bold { 
                    text-align: center; 
                    font-weight: bold; 
                    text-transform: uppercase; 
                    font-size: 12pt; 
                    margin-bottom: 1.5em; 
                    page-break-after: avoid;
                    break-after: avoid;
                }

                .abnt-natureza {
                    margin-left: 8cm;
                    text-align: justify !important;
                    text-justify: inter-word;
                    line-height: 1.0;
                    font-size: 12pt;
                    font-weight: normal;
                    text-transform: none;
                    orphans: 2;
                    widows: 2;
                }

                .abnt-pre-textual-bottom {
                    margin-top: auto; 
                    margin-left: 8cm; 
                    text-align: justify !important;
                    text-justify: inter-word;
                    font-size: 12pt; 
                    line-height: 1.5; 
                    orphans: 2;
                    widows: 2;
                }

                .abnt-ref {
                    line-height: 1.0;
                    margin-bottom: 12pt;
                    text-align: left;
                    font-size: 12pt;
                    orphans: 2;
                    widows: 2;
                    page-break-inside: avoid;
                    break-inside: avoid;
                }

                .abnt-asset-container {
                    line-height: 1.0;
                    font-size: 10pt;
                    margin-top: 1.5em;
                    margin-bottom: 1.5em;
                    page-break-inside: avoid;
                    break-inside: avoid;
                }

                .abnt-measurer {
                    position: fixed;
                    left: -100000px;
                    top: 0;
                    visibility: hidden;
                    pointer-events: none;
                    transform: none;
                }
                .abnt-measurer .page { margin: 0; box-shadow: none; }
                .abnt-measure-flow { height: auto; overflow: visible; }

                @media print {
                    @page { size: A4 portrait; margin: 0; }
                    .abnt-measurer { display: none !important; }
                    html, body { background: white !important; height: auto !important; overflow: visible !important; }
                    #root, .abnt-editor-app, main, main > div, section {
                        height: auto !important;
                        overflow: visible !important;
                        display: block !important;
                        position: static !important;
                    }
                    .print-hidden, header, aside, button { display: none !important; }
                    .abnt-doc { transform: none !important; width: 100% !important; margin: 0 !important; }
                    .page { 
                        margin: 0 !important;
                        box-shadow: none !important;
                        page-break-after: always !important; 
                        break-after: page !important;
                    }
                    .page:last-child {
                        page-break-after: auto !important;
                        break-after: auto !important;
                    }
                }
            `}</style>

            <div id="abnt-document" className="abnt-doc" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}>
                {/* Capa (Nunca é contada pela ABNT) */}
                <div className="page text-center text-[12pt] justify-between flex flex-col">
                    <div className="font-bold uppercase space-y-0">
                        <div>{data.instituicao || "NOME DA INSTITUIÇÃO"}</div>
                        {data.curso && <div className="mt-2">{data.curso}</div>}
                    </div>

                    <div className="mt-10 uppercase">
                        {authors.map((a, i) => (
                            <div key={i} className={i > 0 ? "mt-1" : ""}>
                                {a || "NOME DO AUTOR"}
                            </div>
                        ))}
                    </div>

                    <div className="my-auto px-10">
                        <div className="font-bold uppercase text-[12pt] leading-tight">
                            {data.titulo || "TÍTULO DO TRABALHO"}
                        </div>
                        {data.subtitulo && (
                            <div className="mt-2 uppercase font-normal text-[12pt]">
                                {data.subtitulo}
                            </div>
                        )}
                    </div>

                    <div className="mt-auto uppercase">
                        <div>{data.cidade || "CIDADE"} - {data.estado || "PA"}</div>
                        <div>{data.ano || new Date().getFullYear()}</div>
                    </div>
                </div>

                {/* Folha de Rosto */}
                <div className={`${preTextualClass} text-center text-[12pt] flex flex-col`}>
                    <div className="uppercase space-y-1">
                        {authors.map((a, i) => (
                            <div key={i}>{a || "NOME DO AUTOR"}</div>
                        ))}
                    </div>
                    
                    <div className="my-auto w-full">
                        <div className="mb-12 px-10 uppercase font-bold">
                            {data.titulo || "TÍTULO DO TRABALHO"}
                            {data.subtitulo && (
                                <div className="mt-2 font-normal">
                                    {data.subtitulo}
                                </div>
                            )}
                        </div>
                        
                        <div className="flex flex-col text-left">
                            <div className="abnt-natureza">
                                {data.naturezaTrabalho}<br/><br/>
                                
                                {data.orientadores && data.orientadores.some(o => o.trim() !== '') && (
                                    <div className="space-y-1 mt-4">
                                        <span className="font-bold">
                                            {data.orientadores.filter(o => o.trim() !== '').length > 1 
                                                ? (data.generoOrientador === 'F' ? "Orientadoras:" : "Orientadores:") 
                                                : (data.generoOrientador === 'F' ? "Orientadora:" : "Orientador:")
                                            }
                                        </span>
                                        {data.orientadores.map((o, idx) => (
                                            o.trim() !== '' && <div key={idx}>{o}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto uppercase">
                        <div>{data.cidade || "CIDADE"} - {data.estado || "PA"}</div>
                        <div>{data.ano || new Date().getFullYear()}</div>
                    </div>
                </div>

                {/* Dedicatória */}
                {data.dedicatoria && data.dedicatoria.trim() !== '' && (
                    <div className={preTextualClass}>
                        <div className="abnt-pre-textual-bottom whitespace-pre-wrap italic">
                            {data.dedicatoria}
                        </div>
                    </div>
                )}

                {/* Agradecimentos */}
                {data.agradecimentos && data.agradecimentos.trim() !== '' && (
                    <div className={preTextualClass}>
                        <div className="abnt-center-bold">AGRADECIMENTOS</div>
                        {formatConteudo(data.agradecimentos)}
                    </div>
                )}

                {/* Epígrafe */}
                {data.epigrafe && data.epigrafe.trim() !== '' && (
                    <div className={preTextualClass}>
                        <div className="abnt-pre-textual-bottom whitespace-pre-wrap italic">
                            {data.epigrafe}
                        </div>
                    </div>
                )}

                {/* Resumo */}
                <div className={preTextualClass}>
                    <div className="abnt-center-bold">RESUMO</div>
                    <div className="abnt-p indent-0!">{data.resumoPt || "Texto do resumo..."}</div>
                    {data.palavrasChavePt && (
                        <div className="mt-6 text-[12pt]">
                            <span className="font-bold">Palavras-chave: </span> 
                            {data.palavrasChavePt}
                        </div>
                    )}
                </div>

                {/* Abstract */}
                {data.resumoEn && data.resumoEn.trim() !== '' && (
                    <div className={preTextualClass}>
                        <div className="abnt-center-bold">ABSTRACT</div>
                        <div className="abnt-p indent-0! italic">{data.resumoEn}</div>
                        {data.palavrasChaveEn && (
                            <div className="mt-6 text-[12pt] italic">
                                <span className="font-bold">Keywords: </span> 
                                {data.palavrasChaveEn}
                            </div>
                        )}
                    </div>
                )}

                {/* Sumário */}
                <div className={preTextualClass}>
                    <div className="abnt-center-bold">SUMÁRIO</div>
                    <div className="flex flex-col w-full text-[12pt]">
                        {sumarioItens && sumarioItens.map((sec) => (
                            <div key={`sumario-${sec.id}`} className="sumario-item">
                                <div className={`sumario-label uppercase sumario-h${Number(sec.level)}`}>
                                    {sec.num} {sec.titulo}
                                </div>
                                <div className="sumario-dots"></div>
                                <div className="sumario-page">{getPageNumber(sec.id)}</div>
                            </div>
                        ))}

                        <div className="sumario-item font-bold uppercase mt-2">
                            <div className="sumario-label">REFERÊNCIAS</div>
                            <div className="sumario-dots"></div>
                            <div className="sumario-page">{getPageNumber('referencias')}</div>
                        </div>

                        {data.apendices && data.apendices.trim() !== '' && (
                            <div className="sumario-item font-bold uppercase">
                                <div className="sumario-label">APÊNDICES</div>
                                <div className="sumario-dots"></div>
                                <div className="sumario-page">{getPageNumber('apendices')}</div>
                            </div>
                        )}

                        {data.anexos && data.anexos.trim() !== '' && (
                            <div className="sumario-item font-bold uppercase">
                                <div className="sumario-label">ANEXOS</div>
                                <div className="sumario-dots"></div>
                                <div className="sumario-page">{getPageNumber('anexos')}</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Conteúdo Textual, Referências, Apêndices e Anexos (paginados) */}
                {flows.map(flow => pagesOf(flow).map((page, pi) => (
                    <div className="page page-count page-numbered" key={`${flow.key}-${pi}`}>
                        {page.map(item => renderItem(item, {
                            key: item.key,
                            id: item.anchor ? `preview-sec-${item.anchor}` : undefined,
                        }))}
                    </div>
                )))}
            </div>

            {/* Medidor invisível: mesma largura/fonte da folha, usado só para calcular a paginação.
                Fica no <body> para continuar medível quando o preview está oculto (aba "editor" no mobile). */}
            {createPortal(
                <div ref={measurerRef} className="abnt-doc abnt-measurer" aria-hidden="true">
                    <div className="page" data-page-probe />
                    <div className="page abnt-measure-flow">
                        <p className="abnt-p" data-p-probe />
                        {flows.map(flow => flow.items.map(item => renderItem(item, { key: item.key, 'data-mkey': item.key })))}
                    </div>
                </div>,
                document.body
            )}
        </section>
    );
};

export default ABNTViewer;