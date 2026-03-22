import React, { useMemo } from 'react';
import { TAG_RENDERERS } from '../../utils/constants';

const ABNTViewer = ({ data, authors, zoomLevel, fontFamily, sumarioItens, groupedSections }) => {
    
    const escapeHtml = (text) => {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    const formatConteudo = (texto) => {
        if (!texto) return null;
        return texto.trim().split('\n\n').map((p, i) => { 
            const m = p.trim().match(/^\[(CITAÇÃO|IMAGEM|TABELA|QUADRO)\]:\s*([\s\S]*)/i); 
            
            if (m && TAG_RENDERERS[m[1].toUpperCase()]) {
                return TAG_RENDERERS[m[1].toUpperCase()](m[2], i);
            }
            
            const textoSeguro = escapeHtml(p);
            const textoFormatado = textoSeguro
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                .replace(/\*(.*?)\*/g, '<em>$1</em>');            
            
            return (
                <p 
                    key={i} 
                    className="abnt-p" 
                    dangerouslySetInnerHTML={{ __html: textoFormatado }} 
                />
            );
        });
    };

    const pageMapping = useMemo(() => {
        if (!data || !groupedSections) return {};

        let currentPage = 2;
        
        if (data.dedicatoria && data.dedicatoria.trim() !== '') currentPage += 1;
        if (data.agradecimentos && data.agradecimentos.trim() !== '') currentPage += 1;
        if (data.epigrafe && data.epigrafe.trim() !== '') currentPage += 1;

        currentPage += 1; // Resumo Pt

        if (data.resumoEn && data.resumoEn.trim() !== '') {
            currentPage += 1; // Abstract
        }

        currentPage += 1; // Sumário

        const mapping = {};
        const CHARS_PER_PAGE = 2500;

        groupedSections.forEach(group => {
            let groupCharCount = 0;
            group.forEach(sec => {
                const offsetPages = Math.floor(groupCharCount / CHARS_PER_PAGE);
                mapping[sec.id] = currentPage + offsetPages;
                groupCharCount += (sec.titulo?.length || 0) + (sec.conteudo?.length || 0);
            });
            const groupTotalPages = Math.max(1, Math.ceil(groupCharCount / CHARS_PER_PAGE));
            currentPage += groupTotalPages;
        });

        mapping['referencias'] = currentPage;
        if (data.referencias && data.referencias.trim() !== '') {
            currentPage += Math.max(1, Math.ceil(data.referencias.length / CHARS_PER_PAGE));
        }

        if (data.apendices && data.apendices.trim() !== '') {
            mapping['apendices'] = currentPage;
            currentPage += Math.max(1, Math.ceil(data.apendices.length / CHARS_PER_PAGE));
        }

        if (data.anexos && data.anexos.trim() !== '') {
            mapping['anexos'] = currentPage;
            currentPage += Math.max(1, Math.ceil(data.anexos.length / CHARS_PER_PAGE));
        }

        return mapping;
    }, [data, groupedSections]);

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
                    counter-reset: pagina-abnt; 
                }
                
                .page { 
                    background: white; 
                    width: 210mm; 
                    min-height: 297mm; 
                    padding: 30mm 20mm 20mm 30mm; 
                    margin: 0 auto 30px auto; 
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                    display: flex; 
                    flex-direction: column; 
                    box-sizing: border-box; 
                    position: relative;
                    counter-increment: pagina-abnt; 
                }

                .page-numbered::after {
                    content: counter(pagina-abnt);
                    position: absolute;
                    top: 20mm;
                    right: 20mm;
                    font-size: 10pt;
                }

                /* UI/UX REFINEMENT: Pontos do Sumário Elegantes */
                .sumario-item {
                    display: flex;
                    align-items: baseline;
                    width: 100%;
                    margin-bottom: 4pt;
                    text-decoration: none;
                    color: black;
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

                .abnt-p { text-align: justify; text-indent: 1.25cm; margin-bottom: 0; font-size: 12pt; }
                .abnt-citacao-longa { margin-left: 4cm; font-size: 10pt; line-height: 1.1; text-align: justify; margin-top: 10pt; margin-bottom: 10pt; }
                .abnt-h1 { font-weight: bold; text-transform: uppercase; font-size: 12pt; margin-bottom: 1.5rem; }
                .abnt-h2 { font-weight: bold; font-size: 12pt; margin-bottom: 1rem; text-transform: uppercase; }
                .abnt-center-bold { text-align: center; font-weight: bold; text-transform: uppercase; font-size: 12pt; }

                @media print {
                    @page { size: A4 portrait; margin: 0; }
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
                {/* Capa */}
                <div className="page text-center font-bold uppercase justify-between">
                    <div>
                        <div className="text-[12pt]">{data.instituicao}</div>
                        {data.curso && <div className="mt-2 text-[12pt]">{data.curso}</div>}
                    </div>
                    <div className="mt-10 space-y-1">
                        {authors.map((a,i) => <div key={i}>{a || "AUTOR"}</div>)}
                    </div>
                    <div className="my-auto text-[14pt] leading-tight px-10">
                        {data.titulo || "TÍTULO DO TRABALHO"}
                        {data.subtitulo && <div className="text-[12pt] mt-2 italic normal-case font-normal">{data.subtitulo}</div>}
                    </div>
                    <div className="mt-auto">
                        <div>{data.cidade} - {data.estado}</div>
                        <div>{data.ano}</div>
                    </div>
                </div>

                {/* Folha de Rosto */}
                <div className="page text-center uppercase">
                    <div className="font-bold space-y-1">{authors.map((a,i) => <div key={i}>{a || "AUTOR"}</div>)}</div>
                    <div className="my-auto w-full">
                        <div className="font-bold text-[14pt] mb-12 px-10">{data.titulo}</div>
                        <div className="flex justify-end pr-0">
                            <div className="w-[105mm] ml-auto text-justify normal-case font-normal text-[10pt] leading-snug">
                                {data.naturezaTrabalho}<br/><br/>
                                <div className="space-y-1">
                                    <span className="font-bold">
                                        {(data.orientadores || []).length > 1 ? "Orientadores:" : "Orientador:"}
                                    </span>
                                    {(data.orientadores || ["Não informado"]).map((o, idx) => (
                                        <div key={idx}>{o}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-auto font-bold">
                        <div>{data.cidade} - {data.estado}</div>
                        <div>{data.ano}</div>
                    </div>
                </div>

                {/* Dedicatória */}
                {data.dedicatoria && data.dedicatoria.trim() !== '' && (
                    <div className="page">
                        <div className="mt-auto w-[105mm] ml-auto text-justify text-[10pt] italic">
                            {data.dedicatoria}
                        </div>
                    </div>
                )}

                {/* Agradecimentos */}
                {data.agradecimentos && data.agradecimentos.trim() !== '' && (
                    <div className="page">
                        <div className="abnt-center-bold mb-8">AGRADECIMENTOS</div>
                        {formatConteudo(data.agradecimentos)}
                    </div>
                )}

                {/* Epígrafe */}
                {data.epigrafe && data.epigrafe.trim() !== '' && (
                    <div className="page">
                        <div className="mt-auto w-[105mm] ml-auto text-justify text-[10pt] italic">
                            {data.epigrafe}
                        </div>
                    </div>
                )}

                {/* Resumo */}
                <div className="page">
                    <div className="abnt-center-bold mb-8">RESUMO</div>
                    <div className="abnt-p !indent-0">{data.resumoPt || "Texto do resumo..."}</div>
                    {data.palavrasChavePt && (
                        <div className="mt-6 text-[12pt]">
                            <span className="font-bold">Palavras-chave: </span> 
                            {data.palavrasChavePt}
                        </div>
                    )}
                </div>

                {/* Abstract */}
                {data.resumoEn && data.resumoEn.trim() !== '' && (
                    <div className="page">
                        <div className="abnt-center-bold mb-8 italic">ABSTRACT</div>
                        <div className="abnt-p !indent-0 italic">{data.resumoEn}</div>
                        {data.palavrasChaveEn && (
                            <div className="mt-6 text-[12pt] italic">
                                <span className="font-bold">Keywords: </span> 
                                {data.palavrasChaveEn}
                            </div>
                        )}
                    </div>
                )}

                {/* Sumário Refinado */}
                <div className="page">
                    <div className="abnt-center-bold mb-10">SUMÁRIO</div>
                    <div className="flex flex-col w-full text-[12pt]">
                        {data.secoes && data.secoes.map((sec) => (
                            <div key={`sumario-${sec.id}`} className="sumario-item">
                                <div className={`sumario-label ${sec.level === 1 ? 'font-bold uppercase' : 'ml-6'}`}>
                                    {sec.num} {sec.titulo}
                                </div>
                                <div className="sumario-dots"></div>
                                <div className="sumario-page">{getPageNumber(sec.id)}</div>
                            </div>
                        ))}

                        <div className="sumario-item font-bold uppercase">
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

                {/* Conteúdo Textual */}
                {groupedSections.map((group, groupIndex) => (
                    <div className="page page-numbered" key={`group-${groupIndex}`}>
                        {group.map((s) => (
                            <div key={s.id} id={`preview-sec-${s.id}`} className="mb-8">
                                <div className={s.level === 1 ? "abnt-h1" : "abnt-h2"}>{s.num} {s.titulo}</div>
                                <div className="abnt-content">{formatConteudo(s.conteudo)}</div>
                            </div>
                        ))}
                    </div>
                ))}

                {/* Referências */}
                <div id="preview-sec-referencias" className="page page-numbered">
                    <div className="abnt-center-bold mb-10">REFERÊNCIAS</div>
                    <div className="text-[12pt] space-y-4">
                        {data.referencias && data.referencias.trim().split('\n').map((ref, i) => (
                            ref.trim() && <div key={i} className="text-justify">{ref}</div>
                        ))}
                    </div>
                </div>

                {/* Apêndices */}
                {data.apendices && data.apendices.trim() !== '' && (
                    <div id="preview-sec-apendices" className="page page-numbered">
                        <div className="abnt-center-bold mb-8">APÊNDICES</div>
                        {formatConteudo(data.apendices)}
                    </div>
                )}

                {/* Anexos */}
                {data.anexos && data.anexos.trim() !== '' && (
                    <div id="preview-sec-anexos" className="page page-numbered">
                        <div className="abnt-center-bold mb-8">ANEXOS</div>
                        {formatConteudo(data.anexos)}
                    </div>
                )}
            </div>
        </section>
    );
};

export default ABNTViewer;