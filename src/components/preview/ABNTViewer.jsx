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
import { getDocType, getDocTypeKey, hasElement, isRequired, formatKeywords } from '../../utils/documentTypes';
import { buildFichaCatalografica } from '../../utils/fichaCatalografica';
import { splitBlocks, orderedLines, ASSET_LABELS } from '../../utils/documentContent';

const escapeHtml = (text) => text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

// **negrito** e *itálico* sobre texto já escapado
const inlineHtml = (text) => escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');

const filled = (text) => typeof text === 'string' && text.trim() !== '';

// Blocos do editor com o HTML seguro de cada parágrafo
const parseBlocks = (texto, assets) => splitBlocks(texto, assets).map(b =>
    b.kind === 'p' ? { kind: 'p', html: b.lines.map(inlineHtml).join('<br/>') } : b);

// Renderiza um item de fluxo. `props` recebe a key e o id de âncora (folha) ou data-mkey (medidor);
// `ctx.pageOf(anchor)` devolve o número da folha (sumário e listas).
const renderItem = (item, { key, ...props }, ctx) => {
    if (item.kind === 'node') return React.cloneElement(item.node, { key, ...props });
    return <React.Fragment key={key}>{renderItemBody(item, props, ctx)}</React.Fragment>;
};

const renderItemBody = (item, props, ctx) => {
    switch (item.kind) {
        case 'title':
            return (
                <div {...props} className={`abnt-title-container abnt-h${Number(item.level)}`}>
                    {item.num && <span className="shrink-0">{item.num}</span>}
                    <span>{item.titulo}</span>
                </div>
            );
        case 'heading':
            return <div {...props} className="abnt-center-bold">{item.text}</div>;
        case 'ref':
            return <div {...props} className={item.className || 'abnt-ref'} dangerouslySetInnerHTML={{ __html: item.html }} />;
        case 'asset':
            return <div {...props} className="abnt-asset-container">{TAG_RENDERERS[item.tipo](item.conteudo, 0, item.num)}</div>;
        case 'toc':
            return (
                <div {...props} className="sumario-item">
                    <div className={`sumario-label ${item.labelClass || ''}`}>{item.num ? `${item.num} ` : ''}{item.label}</div>
                    <div className="sumario-dots"></div>
                    <div className="sumario-page">{ctx.pageOf(item.target)}</div>
                </div>
            );
        default:
            return (
                <p
                    {...props}
                    className={`abnt-p ${item.className || ''}`}
                    style={{
                        textIndent: item.cont || item.noIndent ? 0 : undefined, // continuação vinda da folha anterior
                        textAlignLast: item.split ? 'justify' : undefined        // última linha antes da quebra fica justificada
                    }}
                    dangerouslySetInnerHTML={{ __html: item.html }}
                />
            );
    }
};

// Referências: alinhadas à esquerda, espaço simples, em ordem alfabética (NBR 6023:2018)
const referenceItems = (text, prefix, className) =>
    orderedLines(text).map((ref, i) => ({ key: `${prefix}-${i}`, kind: 'ref', html: inlineHtml(ref), className }));

const ABNTViewer = ({ data, authors, zoomLevel, fontFamily, groupedSections }) => {

    // CONFIGURAÇÃO DE PAGINAÇÃO:
    // Se a sua instituição exige que a numeração comece do "1" apenas na Introdução, alterar para 'false'.
    const STRICT_ABNT_PAGINATION = true;

    const docType = getDocType(data);
    const isArticle = docType.layout === 'article';
    const numbered = docType.numberedSections !== false;
    const autores = authors.filter(a => a && a.trim());
    const orientadores = (data.orientadores || []).filter(o => o && o.trim());
    const banca = (data.banca || []).filter(m => m && m.nome && m.nome.trim());

    // Partes do documento, na ordem: folhas fixas (capa, folha de rosto...) e fluxos paginados.
    // role 'pre' = pré-textual (contada a partir da folha de rosto, sem número impresso);
    // role 'text' = textual/pós-textual (contada e numerada); capa nunca é contada.
    const { parts, flows } = useMemo(() => {
        const list = [];
        const assets = data.assets;
        const nomes = authors.filter(a => a && a.trim());

        // ── Conteúdo textual, com numeração de figuras/tabelas/quadros ──────────
        const counters = { IMAGEM: 0, TABELA: 0, QUADRO: 0 };
        const illustrations = [];
        const blocksOf = (prefix, texto) => parseBlocks(texto, assets).map((b, i) => {
            const it = { ...b, key: `${prefix}-${i}` };
            if (b.kind === 'asset' && ASSET_LABELS[b.tipo]) {
                const n = ++counters[b.tipo];
                it.num = n;
                it.anchor = `${b.tipo.toLowerCase()}-${n}`;
                illustrations.push({ tipo: b.tipo, num: n, anchor: it.anchor, title: b.conteudo.split('|')[0].trim() || 'Título' });
            }
            return it;
        });

        const sectionItems = (s) => [
            ...(filled(s.titulo) ? [{ key: `t-${s.id}`, kind: 'title', anchor: s.id, level: s.level, num: numbered ? s.num : '', titulo: s.titulo, keepWithNext: true }] : []),
            ...blocksOf(`s-${s.id}`, s.conteudo),
        ];
        const textualGroups = (groupedSections || []).map(group => group.flatMap(sectionItems));

        const heading = (anchor, text) => ({ key: `h-${anchor}`, kind: 'heading', anchor, text, keepWithNext: true });
        const posTextual = [];
        posTextual.push({ key: 'referencias', items: [heading('referencias', 'REFERÊNCIAS'), ...referenceItems(data.referencias, 'ref')] });
        if (hasElement(docType, 'glossario') && filled(data.glossario)) {
            const glossItems = referenceItems(data.glossario.split('\n').filter(l => !/^\[?\d+[\].)]/.test(l)).join('\n'), 'glo', 'abnt-ref abnt-glossario');
            posTextual.push({ key: 'glossario', items: [heading('glossario', 'GLOSSÁRIO'), ...glossItems] });
        }
        if (hasElement(docType, 'apendices') && filled(data.apendices)) {
            posTextual.push({ key: 'apendices', items: [heading('apendices', 'APÊNDICES'), ...blocksOf('apd', data.apendices)] });
        }
        if (hasElement(docType, 'anexos') && filled(data.anexos)) {
            posTextual.push({ key: 'anexos', items: [heading('anexos', 'ANEXOS'), ...blocksOf('anx', data.anexos)] });
        }

        // Entradas do sumário (NBR 6027): só elementos textuais e pós-textuais
        const tocItems = [
            ...(groupedSections || []).flat().filter(s => filled(s.titulo)).map(s => ({
                key: `toc-${s.id}`, kind: 'toc', target: s.id, num: numbered ? s.num : '', label: s.titulo,
                labelClass: `sumario-h${Math.min(Number(s.level) || 1, 5)}`,
            })),
            ...posTextual.map(f => ({ key: `toc-${f.key}`, kind: 'toc', target: f.key, label: f.items[0].text, labelClass: 'sumario-h1 sumario-pos' })),
        ];

        const listItems = (tipos, prefix) => illustrations.filter(il => tipos.includes(il.tipo)).map(il => ({
            key: `${prefix}-${il.anchor}`, kind: 'toc', target: il.anchor, label: `${ASSET_LABELS[il.tipo]} ${il.num} – ${il.title}`,
        }));

        if (isArticle) {
            // ── Artigo / resumo expandido / resenha (NBR 6022): fluxo único ────────
            const notas = (data.notaAutores || '').split('\n').map(n => n.trim()).filter(Boolean);
            const items = [];
            items.push({
                key: 'art-titulo', kind: 'node', node: (
                    <div className="abnt-art-titulo">
                        <div className="font-bold uppercase">{data.titulo || 'TÍTULO DO TRABALHO'}{filled(data.subtitulo) ? ':' : ''}</div>
                        {filled(data.subtitulo) && <div className="uppercase">{data.subtitulo}</div>}
                        {hasElement(docType, 'tituloEn') && filled(data.tituloEn) && <div className="italic mt-3">{data.tituloEn}</div>}
                    </div>
                ),
            });
            items.push({
                key: 'art-autores', kind: 'node', node: (
                    <div className="abnt-art-autores">
                        {(nomes.length ? nomes : ['Nome do Autor']).map((a, i) => (
                            <div key={i}>{a}{notas[i] && <sup>{'*'.repeat(i + 1)}</sup>}</div>
                        ))}
                    </div>
                ),
            });
            if (hasElement(docType, 'obraResenhada')) {
                items.push({ key: 'art-obra', kind: 'ref', className: 'abnt-ref abnt-obra-resenhada', html: inlineHtml(data.obraResenhada || 'SOBRENOME, Nome. **Título da obra resenhada**. Local: Editora, ano.') });
            }
            const resumoBlock = (key, label, text, kwLabel, kw, extraClass) => {
                items.push({ key, kind: 'p', noIndent: true, className: `abnt-art-resumo ${extraClass}`, html: `<strong>${label}:</strong> ${escapeHtml(text.replace(/\s+/g, ' ').trim())}` });
                if (filled(kw)) items.push({ key: `${key}-kw`, kind: 'node', node: <div className={`abnt-art-kw ${extraClass}`}><strong>{kwLabel}:</strong> {formatKeywords(kw)}</div> });
            };
            if (hasElement(docType, 'resumoPt') && (isRequired(docType, 'resumoPt') || filled(data.resumoPt))) {
                resumoBlock('art-resumo', 'Resumo', data.resumoPt || 'Texto do resumo...', 'Palavras-chave', data.palavrasChavePt, '');
            }
            if (hasElement(docType, 'resumoEn') && filled(data.resumoEn)) {
                resumoBlock('art-abstract', 'Abstract', data.resumoEn, 'Keywords', data.palavrasChaveEn, 'italic');
            }
            items.push(...textualGroups.flat());
            posTextual.forEach(f => items.push(...f.items));
            if (hasElement(docType, 'agradecimentosPos') && filled(data.agradecimentos)) {
                items.push(heading('agradecimentos', 'AGRADECIMENTOS'), ...blocksOf('agr', data.agradecimentos));
            }

            const flow = { key: 'artigo', items };
            if (notas.length) {
                flow.reserveKey = 'fn-artigo';
                flow.footnote = (
                    <div className="abnt-footnote">
                        {notas.map((n, i) => <div key={i}><sup>{'*'.repeat(i + 1)}</sup> {n}</div>)}
                    </div>
                );
            }
            list.push({ key: 'artigo', kind: 'flow', role: 'text', flow });
        } else {
            // ── Trabalhos acadêmicos e relatórios (NBR 14724 / 15287 / 10719) ─────
            const pre = (key, render) => list.push({ key, kind: 'fixed', role: 'pre', render });
            const preFlow = (key, items) => list.push({ key, kind: 'flow', role: 'pre', flow: { key, items } });

            if (hasElement(docType, 'capa') && (isRequired(docType, 'capa') || data.incluirCapa !== false)) {
                list.push({ key: 'capa', kind: 'fixed', role: 'capa', render: 'capa' });
            }
            if (hasElement(docType, 'folhaRosto')) pre('folhaRosto', 'folhaRosto');
            // Verso da folha de rosto: não entra na contagem das folhas
            if (hasElement(docType, 'fichaCatalografica') && data.fichaCatalografica) list.push({ key: 'ficha', kind: 'fixed', role: 'ficha', render: 'ficha' });
            if (hasElement(docType, 'folhaAprovacao') && (isRequired(docType, 'folhaAprovacao') || (data.banca || []).some(m => m?.nome?.trim()))) pre('folhaAprovacao', 'folhaAprovacao');
            if (hasElement(docType, 'dedicatoria') && filled(data.dedicatoria)) pre('dedicatoria', 'dedicatoria');
            if (hasElement(docType, 'agradecimentos') && filled(data.agradecimentos)) {
                preFlow('agradecimentos', [heading('pre-agradecimentos', 'AGRADECIMENTOS'), ...blocksOf('agr', data.agradecimentos)]);
            }
            if (hasElement(docType, 'epigrafe') && filled(data.epigrafe)) pre('epigrafe', 'epigrafe');

            const resumoFlow = (key, title, text, kwLabel, kw, extraClass) => {
                const items = [
                    heading(`pre-${key}`, title),
                    { key: `${key}-p`, kind: 'p', noIndent: true, className: extraClass, html: escapeHtml((text || 'Texto do resumo...').replace(/\s+/g, ' ').trim()) },
                ];
                if (filled(kw)) items.push({ key: `${key}-kw`, kind: 'node', node: <div className={`mt-6 text-[12pt] ${extraClass}`}><span className="font-bold">{kwLabel}:</span> {formatKeywords(kw)}</div> });
                preFlow(key, items);
            };
            if (hasElement(docType, 'resumoPt') && (isRequired(docType, 'resumoPt') || filled(data.resumoPt))) {
                resumoFlow('resumo', 'RESUMO', data.resumoPt, 'Palavras-chave', data.palavrasChavePt, '');
            }
            if (hasElement(docType, 'resumoEn') && (isRequired(docType, 'resumoEn') || filled(data.resumoEn))) {
                resumoFlow('abstract', 'ABSTRACT', data.resumoEn || 'Abstract text...', 'Keywords', data.palavrasChaveEn, 'italic');
            }

            // Listas de ilustrações e de tabelas (NBR 14724, opcionais): geradas a partir das legendas
            if (hasElement(docType, 'listas') && data.incluirListas !== false) {
                const ilus = listItems(['IMAGEM', 'QUADRO'], 'lil');
                const tabs = listItems(['TABELA'], 'ltb');
                if (ilus.length) preFlow('listaIlustracoes', [heading('pre-lista-ilustracoes', 'LISTA DE ILUSTRAÇÕES'), ...ilus]);
                if (tabs.length) preFlow('listaTabelas', [heading('pre-lista-tabelas', 'LISTA DE TABELAS'), ...tabs]);
            }

            if (hasElement(docType, 'sumario')) preFlow('sumario', [heading('pre-sumario', 'SUMÁRIO'), ...tocItems]);

            // Seções primárias abrem folha nova; secundárias continuam no mesmo fluxo (NBR 14724)
            textualGroups.forEach((items, gi) => list.push({ key: `g-${gi}`, kind: 'flow', role: 'text', flow: { key: `g-${gi}`, items } }));
            posTextual.forEach(f => list.push({ key: f.key, kind: 'flow', role: 'text', flow: f }));
        }

        return { parts: list, flows: list.filter(p => p.kind === 'flow').map(p => p.flow) };
    }, [data, groupedSections, docType, isArticle, numbered, authors]);

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

    // Folhas finais com numeração (NBR 14724: contadas a partir da folha de rosto,
    // número impresso a partir da parte textual, no canto superior direito)
    const { sheets, pageMapping, totalFolhas } = useMemo(() => {
        const out = [];
        const mapping = {};
        let counter = 0;
        parts.forEach(part => {
            const pages = part.kind === 'fixed' ? [null] : (paged?.[part.flow.key] || [part.flow.items]);
            pages.forEach((page, pi) => {
                const counted = part.role === 'text' || (part.role === 'pre' && STRICT_ABNT_PAGINATION);
                if (counted) counter += 1;
                (page || []).forEach(item => {
                    if (item.anchor && mapping[item.anchor] === undefined) mapping[item.anchor] = counted ? counter : '';
                });
                out.push({ key: `${part.key}-${pi}`, part, page, pi, number: part.role === 'text' ? counter : null });
            });
        });
        return { sheets: out, pageMapping: mapping, totalFolhas: counter };
    }, [parts, paged, STRICT_ABNT_PAGINATION]);

    const ctx = { pageOf: (anchor) => pageMapping[anchor] || '' };

    // ── Folhas fixas ─────────────────────────────────────────────────────────
    const cidadeAno = (
        <div className="mt-auto uppercase">
            <div>{data.cidade || "CIDADE"}{data.estado ? ` - ${data.estado}` : ''}</div>
            <div>{data.ano || new Date().getFullYear()}</div>
        </div>
    );
    const tituloBloco = (
        <>
            {data.titulo || "TÍTULO DO TRABALHO"}
            {filled(data.subtitulo) && <div className="mt-2 font-normal">{data.subtitulo}</div>}
        </>
    );
    const autoresBloco = (autores.length ? autores : ['NOME DO AUTOR']).map((a, i) => <div key={i}>{a}</div>);

    const fixedPages = {
        capa: (
            <>
                <div className="font-bold uppercase space-y-0">
                    <div>{data.instituicao || "NOME DA INSTITUIÇÃO"}</div>
                    {data.curso && <div className="mt-2">{data.curso}</div>}
                </div>
                <div className="mt-10 uppercase space-y-1">{autoresBloco}</div>
                <div className="my-auto px-10">
                    <div className="font-bold uppercase text-[12pt] leading-tight">{tituloBloco}</div>
                </div>
                {cidadeAno}
            </>
        ),
        folhaRosto: (
            <>
                <div className="uppercase space-y-1">{autoresBloco}</div>
                <div className="my-auto w-full">
                    <div className="mb-12 px-10 uppercase font-bold">{tituloBloco}</div>
                    <div className="flex flex-col text-left">
                        <div className="abnt-natureza whitespace-pre-line">
                            {data.naturezaTrabalho}
                            {orientadores.length > 0 && (
                                <div className="space-y-1 mt-6">
                                    <span className="font-bold">
                                        {orientadores.length > 1
                                            ? (data.generoOrientador === 'F' ? "Orientadoras:" : "Orientadores:")
                                            : (data.generoOrientador === 'F' ? "Orientadora:" : "Orientador:")}
                                    </span>
                                    {orientadores.map((o, idx) => <div key={idx}>{o}</div>)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {cidadeAno}
            </>
        ),
        // NBR 14724: autor, título, natureza, data de aprovação, banca examinadora com assinaturas
        folhaAprovacao: (
            <>
                <div className="uppercase space-y-1">{autoresBloco}</div>
                <div className="mt-10 px-10 uppercase font-bold">{tituloBloco}</div>
                <div className="flex flex-col text-left mt-10">
                    <div className="abnt-natureza whitespace-pre-line">{data.naturezaTrabalho}</div>
                </div>
                <div className="mt-8 text-left">
                    Aprovado em: {data.dataAprovacao ? new Date(`${data.dataAprovacao}T12:00:00`).toLocaleDateString('pt-BR') : '____/____/________'}.
                </div>
                <div className="mt-8 font-bold uppercase">Banca Examinadora</div>
                <div className="mt-4 flex flex-col gap-10">
                    {(banca.length ? banca : [{ nome: 'Nome do(a) Orientador(a)', titulacao: 'Orientador(a)' }, { nome: 'Nome do(a) Examinador(a)' }, { nome: 'Nome do(a) Examinador(a)' }]).map((m, i) => (
                        <div key={i} className="abnt-assinatura">
                            <div className="abnt-assinatura-linha" />
                            <div>{m.nome}</div>
                            {(m.titulacao || m.instituicao) && <div>{[m.titulacao, m.instituicao].filter(Boolean).join(' – ')}</div>}
                        </div>
                    ))}
                </div>
            </>
        ),
        ficha: (() => {
            if (!data.fichaCatalografica) return null;
            const f = buildFichaCatalografica(data, authors, { typeKey: getDocTypeKey(data), folhas: totalFolhas });
            return (
                <div className="abnt-ficha-wrap">
                    <div className="abnt-ficha-legenda">Ficha catalográfica elaborada com o ABNTFácil.<br />Confirme os dados e a classificação com a biblioteca da instituição.</div>
                    <div className="abnt-ficha">
                        <div>{f.entrada}</div>
                        <div className="abnt-ficha-recuo">
                            {f.corpo.map((l, i) => <div key={i}>{l}</div>)}
                            <div className="mt-[1em]">{f.notas.map((l, i) => <div key={i}>{l}</div>)}</div>
                            <div className="mt-[1em]">{f.pistas}</div>
                        </div>
                        <div className="text-right mt-[1em]">{f.classificacao}</div>
                    </div>
                </div>
            );
        })(),
        dedicatoria: <div className="abnt-pre-textual-bottom whitespace-pre-wrap italic">{data.dedicatoria}</div>,
        epigrafe: <div className="abnt-pre-textual-bottom whitespace-pre-wrap italic">{data.epigrafe}</div>,
    };
    const fixedClass = { capa: 'text-center text-[12pt] justify-between', folhaRosto: 'text-center text-[12pt]', folhaAprovacao: 'text-center text-[12pt]' };

    return (
        <section className="flex-1 overflow-y-auto p-12 flex justify-center bg-slate-200 dark:bg-slate-900 print:bg-white print:p-0 transition-all duration-300">
            <style>{`
                .abnt-doc {
                    font-family: ${fontFamily === 'Arial' ? 'Arial, sans-serif' : '"Times New Roman", Times, serif'};
                    color: black;
                    line-height: 1.5;
                    transition: transform 0.2s ease;

                    overflow-wrap: break-word;
                    word-wrap: break-word;
                    word-break: break-word;
                    hyphens: auto;
                }

                .page {
                    background: white;
                    width: 210mm;
                    height: 297mm;
                    overflow: hidden;
                    page-break-after: always;
                    break-after: page;
                    padding: 30mm 20mm 20mm 30mm;
                    margin: 0 auto 30px auto;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                    display: flex;
                    flex-direction: column;
                    box-sizing: border-box;
                    position: relative;
                    font-size: 12pt;
                }

                /* Paginação: canto superior direito, 2 cm das bordas (NBR 14724) */
                .abnt-page-number {
                    position: absolute;
                    top: 20mm;
                    right: 20mm;
                    font-size: 10pt;
                    line-height: 1;
                }

                .abnt-footnote {
                    position: absolute;
                    left: 30mm;
                    right: 20mm;
                    bottom: 20mm;
                    font-size: 10pt;
                    line-height: 1.0;
                    text-align: justify;
                    padding-top: 4pt;
                    border-top: 0.5pt solid black;
                    border-image: linear-gradient(to right, black 5cm, transparent 5cm) 1;
                }
                .abnt-footnote > div + div { margin-top: 2pt; }

                .sumario-item {
                    display: flex;
                    align-items: baseline;
                    width: 100%;
                    margin-bottom: 4pt;
                    text-decoration: none;
                    color: black;
                    page-break-inside: avoid;
                    break-inside: avoid;
                    font-size: 12pt;
                }

                .sumario-label {
                    flex-shrink: 1;
                    max-width: 85%;
                }

                .sumario-dots {
                    flex-grow: 1;
                    border-bottom: 1pt dotted black;
                    margin: 0 4pt;
                    position: relative;
                    top: -4pt;
                    min-width: 10pt;
                }

                .sumario-page {
                    flex-shrink: 0;
                    text-align: right;
                    min-width: 20pt;
                }
                .sumario-pos { margin-top: 0; }

                .abnt-p {
                    text-align: justify !important;
                    text-indent: 1.25cm;
                    font-size: 12pt;
                    line-height: 1.5;
                    margin-bottom: 0;
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

                /* Títulos separados do texto anterior e posterior por um espaço de 1,5 (NBR 14724) */
                .abnt-title-container {
                    display: flex;
                    gap: 1ch;
                    font-size: 12pt;
                    line-height: 1.5;
                    margin-top: 1.5em;
                    margin-bottom: 1.5em;
                    page-break-after: avoid;
                    break-after: avoid;
                }
                .page-flow > :first-child { margin-top: 0 !important; }

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
                    margin-top: 1.5em;
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

                /* Ficha catalográfica: quadro de 12,5 x 7,5 cm na parte inferior do verso da folha de rosto */
                .abnt-ficha-wrap { margin-top: auto; display: flex; flex-direction: column; align-items: center; }
                .abnt-ficha-legenda { font-size: 10pt; line-height: 1.2; text-align: center; margin-bottom: 8pt; }
                .abnt-ficha {
                    width: 12.5cm; min-height: 7.5cm; border: 1px solid black; padding: 0.5cm;
                    font-size: 10pt; line-height: 1.15; text-align: left;
                }
                .abnt-ficha-recuo { padding-left: 0.6cm; }

                .abnt-assinatura { margin-left: auto; margin-right: auto; width: 75%; line-height: 1.2; }
                .abnt-assinatura-linha { border-top: 1px solid black; margin-bottom: 4pt; }

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
                .abnt-obra-resenhada { margin-top: 1.5em; margin-bottom: 1.5em; text-align: justify; }

                .abnt-asset-container {
                    line-height: 1.0;
                    font-size: 10pt;
                    margin-top: 1.5em;
                    margin-bottom: 1.5em;
                    page-break-inside: avoid;
                    break-inside: avoid;
                }

                /* Artigo (NBR 6022): título centralizado, autoria à direita, resumo em espaço simples */
                .abnt-art-titulo { text-align: center; font-size: 12pt; line-height: 1.5; }
                .abnt-art-autores { text-align: right; font-size: 12pt; line-height: 1.5; margin-top: 1.5em; }
                .abnt-art-resumo { line-height: 1.0 !important; margin-top: 1.5em; }
                .abnt-art-kw { font-size: 12pt; line-height: 1.0; margin-top: 12pt; }

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
                .abnt-measurer .abnt-footnote { position: static; }

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
                {sheets.map(({ key, part, page, pi, number }) => (
                    <div key={key} data-role={part.role} className={`page ${part.kind === 'fixed' ? (fixedClass[part.render] || '') : 'page-flow'}`}>
                        {part.kind === 'fixed'
                            ? fixedPages[part.render]
                            : page.map(item => renderItem(item, {
                                key: item.key,
                                id: item.anchor ? `preview-sec-${item.anchor}` : undefined,
                            }, ctx))}
                        {pi === 0 && part.flow?.footnote}
                        {number != null && <span className="abnt-page-number">{number}</span>}
                    </div>
                ))}
            </div>

            {/* Medidor invisível: mesma largura/fonte da folha, usado só para calcular a paginação.
                Fica no <body> para continuar medível quando o preview está oculto (aba "editor" no mobile). */}
            {createPortal(
                <div ref={measurerRef} className="abnt-doc abnt-measurer" aria-hidden="true">
                    <div className="page" data-page-probe />
                    <div className="page abnt-measure-flow">
                        <p className="abnt-p" data-p-probe />
                        {flows.map(flow => flow.items.map(item => renderItem(item, { key: item.key, 'data-mkey': item.key }, ctx)))}
                        {flows.filter(f => f.footnote).map(f => React.cloneElement(f.footnote, { key: `fn-${f.key}`, 'data-mkey': `fn-${f.key}` }))}
                    </div>
                </div>,
                document.body
            )}
        </section>
    );
};

// memo: só re-renderiza quando o conteúdo do documento muda, não a cada clique na interface
export default React.memo(ABNTViewer);
