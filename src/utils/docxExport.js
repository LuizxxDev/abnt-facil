// Exportação para Word (.docx) seguindo as mesmas normas da pré-visualização.
// Usa estilos e campos reais do Word: a paginação, o sumário e as listas continuam
// automáticos quando o aluno edita o arquivo no Word.
import {
    Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Header, PageNumber,
    TableOfContents, Table, TableRow, TableCell, BorderStyle, WidthType, ImageRun,
    FootnoteReferenceRun, SectionType, VerticalAlignSection, SimpleField,
} from 'docx';
import { getDocType, getDocTypeKey, hasElement, isRequired, formatKeywords } from './documentTypes';
import { buildFichaCatalografica } from './fichaCatalografica';
import { splitBlocks, parseTable, orderedLines, parseInline, ASSET_LABELS } from './documentContent';
import { download, safeFileName } from './pdfExport';

const cm = (v) => Math.round(v * 567); // twips
const PT12 = 24;                      // tamanhos em meio-ponto
const PT10 = 20;
const LINE_15 = 360;                  // espaçamento 1,5
const LINE_1 = 240;                   // espaçamento simples
const BLANK_15 = 360;                 // uma linha em branco de 1,5

const filled = (t) => typeof t === 'string' && t.trim() !== '';

const PAGE = {
    size: { width: 11906, height: 16838 }, // A4
    margin: { top: cm(3), left: cm(3), bottom: cm(2), right: cm(2), header: cm(2), footer: cm(1.25) },
};

// Trechos com **negrito**/*itálico*; linhas simples viram quebra de linha
const runs = (lines, base = {}) => {
    const list = Array.isArray(lines) ? lines : [lines];
    return list.flatMap((line, i) => parseInline(line).map((seg, j) => new TextRun({
        ...base,
        text: seg.text,
        bold: base.bold || seg.bold,
        italics: base.italics || seg.italic,
        ...(i > 0 && j === 0 ? { break: 1 } : {}),
    })));
};

const multiline = (text, base = {}) => runs((text || '').replace(/\r\n?/g, '\n').split('\n'), base);

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const LINE = (size = 6) => ({ style: BorderStyle.SINGLE, size, color: '000000' });

// Carrega a imagem num canvas e devolve PNG + dimensões (converte SVG/WebP; falha se o servidor bloquear CORS)
const loadImage = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            canvas.getContext('2d').drawImage(img, 0, 0);
            canvas.toBlob(async (blob) => {
                if (!blob) return reject(new Error('Imagem vazia'));
                resolve({ data: new Uint8Array(await blob.arrayBuffer()), width: img.naturalWidth, height: img.naturalHeight });
            }, 'image/png');
        } catch (e) { reject(e); }
    };
    img.onerror = () => reject(new Error('Imagem inacessível'));
    img.src = src;
});

export async function exportDocx(data, authors, fontFamily = 'Arial', { folhas } = {}) {
    const type = getDocType(data);
    const isArticle = type.layout === 'article';
    const font = fontFamily === 'Times New Roman' ? 'Times New Roman' : 'Arial';
    const warnings = [];
    const autores = (authors || []).filter(filled);
    const orientadores = (data.orientadores || []).filter(filled);
    const banca = (data.banca || []).filter(m => filled(m?.nome));

    // ── Estilos (NBR 14724 / 6022) ──────────────────────────────────────────
    // Nomes e níveis de tópico iguais aos estilos nativos do Word ("heading 1"...), que o sumário procura
    const heading = (id, name, run, level) => ({
        id, name, basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font, size: PT12, color: '000000', ...run },
        paragraph: {
            alignment: AlignmentType.LEFT, indent: { firstLine: 0 },
            spacing: { before: BLANK_15, after: BLANK_15, line: LINE_15 }, keepNext: true, keepLines: true,
            outlineLevel: level,
        },
    });
    const styles = {
        default: { document: { run: { font, size: PT12 } } },
        paragraphStyles: [
            { id: 'Normal', name: 'Normal', run: { font, size: PT12 }, paragraph: { alignment: AlignmentType.JUSTIFIED, indent: { firstLine: cm(1.25) }, spacing: { line: LINE_15, before: 0, after: 0 } } },
            heading('Heading1', 'heading 1', { bold: true }, 0),
            heading('Heading2', 'heading 2', { bold: true }, 1),
            heading('Heading3', 'heading 3', { bold: true, italics: true }, 2),
            heading('Heading4', 'heading 4', { italics: true }, 3),
            heading('Heading5', 'heading 5', {}, 4),
            { id: 'TituloCentral', name: 'Título sem indicativo', basedOn: 'Normal', next: 'Normal', run: { bold: true }, paragraph: { alignment: AlignmentType.CENTER, indent: { firstLine: 0 }, spacing: { after: BLANK_15 }, keepNext: true } },
            { id: 'SemRecuo', name: 'Texto sem recuo', basedOn: 'Normal', paragraph: { indent: { firstLine: 0 } } },
            { id: 'Citacao', name: 'Citação longa', basedOn: 'Normal', run: { size: PT10 }, paragraph: { indent: { left: cm(4), firstLine: 0 }, spacing: { line: LINE_1, before: BLANK_15, after: BLANK_15 } } },
            { id: 'Legenda', name: 'Legenda ABNT', basedOn: 'Normal', run: { size: PT10 }, paragraph: { indent: { firstLine: 0 }, alignment: AlignmentType.LEFT, spacing: { line: LINE_1, before: 0, after: 60 }, keepNext: true } },
            { id: 'Fonte', name: 'Fonte da ilustração', basedOn: 'Normal', run: { size: PT10 }, paragraph: { indent: { firstLine: 0 }, alignment: AlignmentType.LEFT, spacing: { line: LINE_1, before: 60, after: BLANK_15 } } },
            { id: 'Celula', name: 'Texto de tabela', basedOn: 'Normal', run: { size: PT10 }, paragraph: { indent: { firstLine: 0 }, alignment: AlignmentType.LEFT, spacing: { line: LINE_1 } } },
            { id: 'Referencia', name: 'Referência', basedOn: 'Normal', paragraph: { alignment: AlignmentType.LEFT, indent: { firstLine: 0 }, spacing: { line: LINE_1, after: LINE_1 } } },
            { id: 'Natureza', name: 'Natureza do trabalho', basedOn: 'Normal', paragraph: { indent: { left: cm(8), firstLine: 0 }, spacing: { line: LINE_1 } } },
            { id: 'Centro', name: 'Centralizado', basedOn: 'Normal', paragraph: { alignment: AlignmentType.CENTER, indent: { firstLine: 0 } } },
            { id: 'NotaRodape', name: 'Nota de rodapé ABNT', basedOn: 'Normal', run: { size: PT10 }, paragraph: { indent: { firstLine: 0 }, spacing: { line: LINE_1 } } },
        ],
    };

    // ── Numeração progressiva (NBR 6024) e conteúdo textual ──────────────────
    const numbered = type.numberedSections !== false;
    const counts = [0, 0, 0, 0, 0];
    const secoes = (data.secoes || []).map(s => {
        const level = Math.min(Math.max(Number(s.level) || 1, 1), 5);
        counts[level - 1]++;
        for (let k = level; k < 5; k++) counts[k] = 0;
        const num = numbered ? counts.slice(0, level).map(c => c || 1).join('.') : '';
        return { ...s, level, num };
    });

    const HEADINGS = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4, HeadingLevel.HEADING_5];
    const hasIllustration = { IMAGEM: false, TABELA: false, QUADRO: false };
    const counters = { IMAGEM: 0, TABELA: 0, QUADRO: 0 };

    const caption = (tipo, title, align = AlignmentType.LEFT) => {
        hasIllustration[tipo] = true;
        const label = ASSET_LABELS[tipo];
        return new Paragraph({
            style: 'Legenda', alignment: align,
            // Campo SEQ: o Word renumera e as listas de ilustrações/tabelas o encontram.
            // O número já vai preenchido para editores que não atualizam campos (Google Docs, LibreOffice).
            children: [new TextRun({ text: `${label} `, bold: true }), new SimpleField(`SEQ ${label} \\* ARABIC`, String(++counters[tipo])), new TextRun({ text: ` – ${title || 'Título'}`, bold: true })],
        });
    };

    const assetBlocks = async (block) => {
        if (block.tipo === 'CITAÇÃO') return [new Paragraph({ style: 'Citacao', children: runs(block.conteudo.trim()) })];

        if (block.tipo === 'IMAGEM') {
            const [title, source, url] = block.conteudo.split('|').map(s => s.trim());
            const out = [caption('IMAGEM', title, AlignmentType.CENTER)];
            let image = null;
            if (url) {
                try { image = await loadImage(url); } catch { warnings.push(`A imagem "${title || url}" não pôde ser incluída (o site de origem bloqueia o acesso). Insira-a manualmente no Word.`); }
            }
            if (image) {
                const scale = Math.min(1, 600 / image.width, 420 / image.height);
                out.push(new Paragraph({ style: 'Centro', keepNext: true, children: [new ImageRun({ type: 'png', data: image.data, transformation: { width: Math.round(image.width * scale), height: Math.round(image.height * scale) } })] }));
            } else {
                out.push(new Paragraph({ style: 'Centro', keepNext: true, children: [new TextRun({ text: '[Insira a figura aqui]', italics: true, color: '75726A' })] }));
            }
            out.push(new Paragraph({ style: 'Fonte', alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Fonte: ${source || 'Autor.'}` })] }));
            return out;
        }

        if (block.tipo === 'TABELA') {
            const { title, source, rows } = parseTable(block.conteudo);
            const cols = Math.max(1, ...rows.map(r => r.length));
            // Tabela no padrão IBGE: bordas horizontais no topo, sob o cabeçalho e no fim; laterais abertas
            const table = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: { top: LINE(12), bottom: LINE(12), left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
                rows: (rows.length ? rows : [['']]).map((row, ri) => new TableRow({
                    tableHeader: ri === 0,
                    cantSplit: true,
                    children: Array.from({ length: cols }, (_, ci) => new TableCell({
                        borders: ri === 0 ? { bottom: LINE(6) } : undefined,
                        margins: { top: 40, bottom: 40, left: 80, right: 80 },
                        children: [new Paragraph({ style: 'Celula', children: [new TextRun({ text: row[ci] ?? '', bold: ri === 0 })] })],
                    })),
                })),
            });
            return [caption('TABELA', title), table, new Paragraph({ style: 'Fonte', children: [new TextRun({ text: `Fonte: ${source || 'Autor.'}` })] })];
        }

        // QUADRO: texto em caixa fechada
        const [title, source, ...rest] = block.conteudo.split('|');
        const text = rest.join('|').trim();
        const box = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: { top: LINE(), bottom: LINE(), left: LINE(), right: LINE(), insideHorizontal: LINE(), insideVertical: LINE() },
            rows: [new TableRow({ children: [new TableCell({ margins: { top: 100, bottom: 100, left: 120, right: 120 }, children: (text || '[Conteúdo]').split('\n').map(l => new Paragraph({ style: 'Celula', children: runs(l) })) })] })],
        });
        return [caption('QUADRO', title?.trim()), box, new Paragraph({ style: 'Fonte', children: [new TextRun({ text: `Fonte: ${source?.trim() || 'Autor.'}` })] })];
    };

    const contentBlocks = async (texto) => {
        const out = [];
        for (const block of splitBlocks(texto, data.assets)) {
            if (block.kind === 'p') out.push(new Paragraph({ children: runs(block.lines) }));
            else out.push(...await assetBlocks(block));
        }
        return out;
    };

    const textual = [];
    for (const s of secoes) {
        if (filled(s.titulo)) {
            const titulo = s.level === 1 ? s.titulo.toUpperCase() : s.titulo;
            // Seções primárias começam em folha nova (a primeira já abre a seção textual numa folha nova)
            const breakBefore = !isArticle && s.level === 1 && textual.length > 0;
            textual.push(new Paragraph({ heading: HEADINGS[s.level - 1], pageBreakBefore: breakBefore, children: [new TextRun(s.num ? `${s.num} ${titulo}` : titulo)] }));
        }
        textual.push(...await contentBlocks(s.conteudo));
    }

    // Pós-textuais: títulos centralizados, sem indicativo numérico, mas presentes no sumário
    const posTitle = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, pageBreakBefore: !isArticle, children: [new TextRun(text)] });
    const pos = [posTitle('REFERÊNCIAS'), ...orderedLines(data.referencias).map(r => new Paragraph({ style: 'Referencia', children: runs(r) }))];
    if (hasElement(type, 'glossario') && filled(data.glossario)) {
        pos.push(posTitle('GLOSSÁRIO'), ...orderedLines(data.glossario).map(r => new Paragraph({ style: 'Referencia', children: runs(r) })));
    }
    if (hasElement(type, 'apendices') && filled(data.apendices)) pos.push(posTitle('APÊNDICES'), ...await contentBlocks(data.apendices));
    if (hasElement(type, 'anexos') && filled(data.anexos)) pos.push(posTitle('ANEXOS'), ...await contentBlocks(data.anexos));

    const pageNumberHeader = new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, indent: { firstLine: 0 }, children: [new TextRun({ children: [PageNumber.CURRENT], size: PT10 })] })] });
    const resumoParagraphs = (title, text, kwLabel, kw, italics, first) => [
        new Paragraph({ style: 'TituloCentral', pageBreakBefore: !first, children: [new TextRun(title)] }),
        new Paragraph({ style: 'SemRecuo', children: runs((text || '').replace(/\s+/g, ' ').trim() || ' ', { italics }) }),
        ...(filled(kw) ? [new Paragraph({ style: 'SemRecuo', spacing: { before: BLANK_15 }, children: [new TextRun({ text: `${kwLabel}: `, bold: true, italics }), new TextRun({ text: formatKeywords(kw), italics })] })] : []),
    ];

    const sections = [];
    const footnotes = {};

    if (isArticle) {
        // ── Artigo (NBR 6022): documento contínuo, numerado desde a primeira página ──
        const notas = (data.notaAutores || '').split('\n').map(n => n.trim()).filter(Boolean);
        notas.forEach((n, i) => { footnotes[i + 1] = { children: [new Paragraph({ style: 'NotaRodape', children: [new TextRun(n)] })] }; });
        const head = [
            new Paragraph({ style: 'Centro', children: [new TextRun({ text: `${(data.titulo || 'TÍTULO DO TRABALHO').toUpperCase()}${filled(data.subtitulo) ? ':' : ''}`, bold: true }), ...(filled(data.subtitulo) ? [new TextRun({ text: data.subtitulo.toUpperCase(), break: 1 })] : [])] }),
        ];
        if (hasElement(type, 'tituloEn') && filled(data.tituloEn)) head.push(new Paragraph({ style: 'Centro', spacing: { before: 120 }, children: [new TextRun({ text: data.tituloEn, italics: true })] }));
        head.push(new Paragraph({
            style: 'SemRecuo', alignment: AlignmentType.RIGHT, spacing: { before: BLANK_15 },
            children: (autores.length ? autores : ['Nome do Autor']).flatMap((a, i) => [new TextRun({ text: a, ...(i > 0 ? { break: 1 } : {}) }), ...(notas[i] ? [new FootnoteReferenceRun(i + 1)] : [])]),
        }));
        if (hasElement(type, 'obraResenhada')) head.push(new Paragraph({ style: 'Referencia', alignment: AlignmentType.JUSTIFIED, spacing: { before: BLANK_15, after: BLANK_15 }, children: runs(data.obraResenhada || '') }));
        const resumoArtigo = (label, text, kwLabel, kw, italics) => {
            head.push(new Paragraph({ style: 'SemRecuo', spacing: { before: BLANK_15, line: LINE_1 }, children: [new TextRun({ text: `${label}: `, bold: true, italics }), ...runs(text.replace(/\s+/g, ' ').trim(), { italics })] }));
            if (filled(kw)) head.push(new Paragraph({ style: 'SemRecuo', spacing: { before: 240, line: LINE_1 }, children: [new TextRun({ text: `${kwLabel}: `, bold: true, italics }), new TextRun({ text: formatKeywords(kw), italics })] }));
        };
        if (hasElement(type, 'resumoPt') && (isRequired(type, 'resumoPt') || filled(data.resumoPt))) resumoArtigo('Resumo', data.resumoPt || 'Texto do resumo...', 'Palavras-chave', data.palavrasChavePt, false);
        if (hasElement(type, 'resumoEn') && filled(data.resumoEn)) resumoArtigo('Abstract', data.resumoEn, 'Keywords', data.palavrasChaveEn, true);

        const tail = [];
        if (hasElement(type, 'agradecimentosPos') && filled(data.agradecimentos)) tail.push(new Paragraph({ style: 'TituloCentral', spacing: { before: BLANK_15 }, children: [new TextRun('AGRADECIMENTOS')] }), ...await contentBlocks(data.agradecimentos));

        sections.push({ properties: { page: { ...PAGE, pageNumbers: { start: 1 } } }, headers: { default: pageNumberHeader }, children: [...head, ...textual, ...pos, ...tail] });
    } else {
        // ── Trabalhos acadêmicos e relatórios (NBR 14724 / 15287 / 10719) ──
        const cidadeAno = new Paragraph({ style: 'Centro', children: [new TextRun((`${data.cidade || 'CIDADE'}${data.estado ? ` - ${data.estado}` : ''}`).toUpperCase()), new TextRun({ text: String(data.ano || new Date().getFullYear()), break: 1 })] });
        const autoresP = new Paragraph({ style: 'Centro', children: runs((autores.length ? autores : ['NOME DO AUTOR']).map(a => a.toUpperCase())) });
        const tituloP = (extra = {}) => new Paragraph({ style: 'Centro', ...extra, children: [new TextRun({ text: (data.titulo || 'TÍTULO DO TRABALHO').toUpperCase(), bold: true }), ...(filled(data.subtitulo) ? [new TextRun({ text: data.subtitulo.toUpperCase(), break: 1 })] : [])] });
        const naturezaP = (extraLines = []) => new Paragraph({ style: 'Natureza', children: [...multiline(data.naturezaTrabalho), ...extraLines] });
        const section = (children, opts = {}) => sections.push({ properties: { type: SectionType.NEXT_PAGE, verticalAlign: opts.align || VerticalAlignSection.TOP, page: { ...PAGE, ...(opts.start ? { pageNumbers: { start: opts.start } } : {}) } }, ...(opts.header ? { headers: { default: opts.header } } : {}), children });

        let counting = false; // a contagem começa na folha de rosto (a capa não é contada)
        let restartAt;        // depois do verso (ficha catalográfica) a numeração segue a do anverso
        const startOnce = () => {
            if (restartAt) { const n = restartAt; restartAt = undefined; return n; }
            if (counting) return undefined;
            counting = true; return 1;
        };

        if (hasElement(type, 'capa') && (isRequired(type, 'capa') || data.incluirCapa !== false)) {
            section([
                new Paragraph({ style: 'Centro', children: [new TextRun({ text: (data.instituicao || 'NOME DA INSTITUIÇÃO').toUpperCase(), bold: true }), ...(filled(data.curso) ? [new TextRun({ text: data.curso.toUpperCase(), bold: true, break: 1 })] : [])] }),
                autoresP, tituloP(), cidadeAno,
            ], { align: VerticalAlignSection.BOTH });
        }
        if (hasElement(type, 'folhaRosto')) {
            const orient = orientadores.length ? [
                new TextRun({ text: orientadores.length > 1 ? (data.generoOrientador === 'F' ? 'Orientadoras:' : 'Orientadores:') : (data.generoOrientador === 'F' ? 'Orientadora:' : 'Orientador:'), bold: true, break: 2 }),
                ...orientadores.map(o => new TextRun({ text: o, break: 1 })),
            ] : [];
            section([autoresP, tituloP(), naturezaP(orient), cidadeAno], { align: VerticalAlignSection.BOTH, start: startOnce() });
        }
        if (hasElement(type, 'fichaCatalografica') && data.fichaCatalografica) {
            const f = buildFichaCatalografica(data, autores, { typeKey: getDocTypeKey(data), folhas });
            const fichaRun = (text, opts = {}) => new Paragraph({ spacing: { line: 276, before: 0, after: 0 }, indent: { firstLine: 0, ...(opts.indent ? { left: cm(0.6) } : {}) }, alignment: opts.right ? AlignmentType.RIGHT : AlignmentType.LEFT, children: [new TextRun({ text, size: PT10 })] });
            const blank = () => fichaRun('');
            const cell = new TableCell({
                width: { size: cm(12.5), type: WidthType.DXA },
                margins: { top: cm(0.4), bottom: cm(0.4), left: cm(0.4), right: cm(0.4) },
                borders: { top: LINE(), bottom: LINE(), left: LINE(), right: LINE() },
                children: [
                    fichaRun(f.entrada),
                    ...f.corpo.map(l => fichaRun(l, { indent: true })), blank(),
                    ...f.notas.map(l => fichaRun(l, { indent: true })), blank(),
                    fichaRun(f.pistas, { indent: true }), blank(),
                    fichaRun(f.classificacao, { right: true }),
                ],
            });
            section([
                new Paragraph({ style: 'Centro', spacing: { line: LINE_1, after: 160 }, children: [new TextRun({ text: 'Ficha catalográfica elaborada com o ABNTFácil.', size: PT10 }), new TextRun({ text: 'Confirme os dados e a classificação com a biblioteca da instituição.', size: PT10, break: 1 })] }),
                new Table({ alignment: AlignmentType.CENTER, width: { size: cm(12.5), type: WidthType.DXA }, rows: [new TableRow({ height: { value: cm(7.5), rule: 'atLeast' }, children: [cell] })] }),
            ], { align: VerticalAlignSection.BOTTOM });
            restartAt = 2;
        }
        if (hasElement(type, 'folhaAprovacao') && (isRequired(type, 'folhaAprovacao') || banca.length)) {
            const membros = banca.length ? banca : [{ nome: 'Nome do(a) Orientador(a)', titulacao: 'Orientador(a)' }, { nome: 'Nome do(a) Examinador(a)' }, { nome: 'Nome do(a) Examinador(a)' }];
            const data_ = data.dataAprovacao ? new Date(`${data.dataAprovacao}T12:00:00`).toLocaleDateString('pt-BR') : '____/____/________';
            section([
                autoresP, tituloP({ spacing: { before: BLANK_15 * 2 } }),
                new Paragraph({ style: 'Natureza', spacing: { before: BLANK_15 * 2 }, children: multiline(data.naturezaTrabalho) }),
                new Paragraph({ style: 'SemRecuo', spacing: { before: BLANK_15 * 2 }, children: [new TextRun(`Aprovado em: ${data_}.`)] }),
                new Paragraph({ style: 'TituloCentral', spacing: { before: BLANK_15 * 2 }, children: [new TextRun('BANCA EXAMINADORA')] }),
                ...membros.map(m => new Paragraph({
                    style: 'Centro', spacing: { before: 900, line: LINE_1 }, indent: { left: cm(2.5), right: cm(2.5), firstLine: 0 },
                    border: { top: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 4 } },
                    children: [new TextRun(m.nome), ...([m.titulacao, m.instituicao].filter(Boolean).length ? [new TextRun({ text: [m.titulacao, m.instituicao].filter(Boolean).join(' – '), break: 1 })] : [])],
                })),
            ], { start: startOnce() });
        }
        const bottomPage = (text) => section([new Paragraph({ style: 'Natureza', children: multiline(text, { italics: true }) })], { align: VerticalAlignSection.BOTTOM, start: startOnce() });
        if (hasElement(type, 'dedicatoria') && filled(data.dedicatoria)) bottomPage(data.dedicatoria);
        if (hasElement(type, 'agradecimentos') && filled(data.agradecimentos)) {
            section([new Paragraph({ style: 'TituloCentral', children: [new TextRun('AGRADECIMENTOS')] }), ...await contentBlocks(data.agradecimentos)], { start: startOnce() });
        }
        if (hasElement(type, 'epigrafe') && filled(data.epigrafe)) bottomPage(data.epigrafe);

        // Resumos, listas e sumário: cada um começa em folha nova
        const pre = [];
        const first = () => pre.length === 0;
        if (hasElement(type, 'resumoPt') && (isRequired(type, 'resumoPt') || filled(data.resumoPt))) pre.push(...resumoParagraphs('RESUMO', data.resumoPt || 'Texto do resumo...', 'Palavras-chave', data.palavrasChavePt, false, first()));
        if (hasElement(type, 'resumoEn') && (isRequired(type, 'resumoEn') || filled(data.resumoEn))) pre.push(...resumoParagraphs('ABSTRACT', data.resumoEn || 'Abstract text...', 'Keywords', data.palavrasChaveEn, true, first()));
        if (hasElement(type, 'listas') && data.incluirListas !== false) {
            if (hasIllustration.IMAGEM || hasIllustration.QUADRO) {
                pre.push(new Paragraph({ style: 'TituloCentral', pageBreakBefore: !first(), children: [new TextRun('LISTA DE ILUSTRAÇÕES')] }));
                if (hasIllustration.IMAGEM) pre.push(new TableOfContents('Lista de figuras', { captionLabelIncludingNumbers: 'Figura', hyperlink: true }));
                if (hasIllustration.QUADRO) pre.push(new TableOfContents('Lista de quadros', { captionLabelIncludingNumbers: 'Quadro', hyperlink: true }));
            }
            if (hasIllustration.TABELA) {
                pre.push(new Paragraph({ style: 'TituloCentral', pageBreakBefore: !first(), children: [new TextRun('LISTA DE TABELAS')] }));
                pre.push(new TableOfContents('Lista de tabelas', { captionLabelIncludingNumbers: 'Tabela', hyperlink: true }));
            }
        }
        if (hasElement(type, 'sumario')) {
            pre.push(new Paragraph({ style: 'TituloCentral', pageBreakBefore: !first(), children: [new TextRun('SUMÁRIO')] }));
            pre.push(new TableOfContents('Sumário', { hyperlink: true, headingStyleRange: '1-5', useAppliedParagraphOutlineLevel: true }));
        }
        if (pre.length) section(pre, { start: startOnce() });

        // Parte textual e pós-textual: número da página no canto superior direito
        section([...textual, ...pos], { header: pageNumberHeader, start: startOnce() });
    }

    const doc = new Document({
        creator: autores.join('; ') || 'ABNTFácil',
        title: data.titulo || 'Documento',
        description: `${type.label} gerado pelo ABNTFácil (${type.norma})`,
        styles,
        footnotes,
        features: { updateFields: true },
        sections,
    });

    download(await Packer.toBlob(doc), `${safeFileName(data.titulo)}.docx`);
    return { warnings };
}
