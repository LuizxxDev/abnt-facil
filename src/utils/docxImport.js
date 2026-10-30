// Importa um .docx começado no Word: títulos (Título 1–5) viram seções, o texto mantém
// **negrito**/*itálico*, notas de rodapé viram ^[nota] e tabelas viram [TABELA].
// Resumo, abstract e referências vão para os campos próprios; capa, sumário e listas são ignorados.
import { unzipSync, strFromU8 } from 'fflate';

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const M = 'http://schemas.openxmlformats.org/officeDocument/2006/math';
const LIST_LINE = /^([a-z]\)|[-–—])\s/;
const kids = (el, name) => (el ? [...el.childNodes].filter(n => n.namespaceURI === W && n.localName === name) : []);
const kid = (el, name) => kids(el, name)[0];
const attr = (el, name) => el?.getAttributeNS(W, name) ?? el?.getAttribute(`w:${name}`) ?? null;
const isOn = (el) => el && !['0', 'false', 'off'].includes(attr(el, 'val'));

const parseXml = (files, path) => files[path] ? new DOMParser().parseFromString(strFromU8(files[path]), 'application/xml') : null;

// Estilo → nível de título (1–5), pelo nome ("heading 1"/"Título 1"), pelo id ou pelo nível de tópico
const headingLevels = (stylesDoc) => {
    const map = {};
    if (!stylesDoc) return map;
    for (const st of stylesDoc.getElementsByTagNameNS(W, 'style')) {
        const id = attr(st, 'styleId');
        const name = attr(kid(st, 'name'), 'val') || '';
        const m = name.match(/^(?:heading|t[íi]tulo)\s*([1-5])$/i) || (id || '').match(/^(?:heading|t[íi]?tulo)([1-5])$/i);
        const outline = attr(kid(kid(st, 'pPr'), 'outlineLvl'), 'val');
        if (m) map[id] = Number(m[1]);
        else if (outline !== null && Number(outline) < 5) map[id] = Number(outline) + 1;
        if (/^title$/i.test(name) || /^t[íi]?tulo$/i.test(id || '')) map[id] = 'title';
    }
    return map;
};

const footnoteTexts = (doc) => {
    const out = {};
    if (!doc) return out;
    for (const fn of doc.getElementsByTagNameNS(W, 'footnote')) {
        out[attr(fn, 'id')] = [...fn.getElementsByTagNameNS(W, 't')].map(t => t.textContent).join('').trim();
    }
    return out;
};

// Texto de um parágrafo com marcações do editor
const paragraphText = (p, notes) => {
    const parts = [];
    for (const r of p.getElementsByTagNameNS(W, 'r')) {
        const rPr = kid(r, 'rPr');
        const bold = isOn(kid(rPr, 'b'));
        const italic = isOn(kid(rPr, 'i'));
        let text = '';
        for (const n of r.childNodes) {
            if (n.namespaceURI !== W) continue;
            if (n.localName === 't') text += n.textContent.replace(/\t/g, ' ');
            else if (n.localName === 'tab') text += ' ';
            else if (n.localName === 'br') text += '\n';
            else if (n.localName === 'footnoteReference' && notes[attr(n, 'id')]) text += `^[${notes[attr(n, 'id')]}]`;
        }
        if (!text) continue;
        const prev = parts[parts.length - 1];
        if (prev && prev.bold === bold && prev.italic === italic) prev.text += text;
        else parts.push({ text, bold, italic });
    }
    return parts.map(({ text, bold, italic }) => {
        if (!text.trim() || (!bold && !italic)) return text;
        const [, lead, core, trail] = text.match(/^(\s*)([\s\S]*?)(\s*)$/);
        const mark = bold ? '**' : '*';
        return `${lead}${mark}${core}${mark}${trail}`;
    }).join('').trim();
};

const tableBlock = (tbl, notes) => {
    const rows = kids(tbl, 'tr').map(tr => kids(tr, 'tc').map(tc => kids(tc, 'p').map(p => paragraphText(p, notes)).join(' ').replace(/\*/g, '').trim()));
    return `[TABELA]: Tabela | Autor | ${JSON.stringify(rows)}`;
};

const norm = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z ]/g, '').trim();

export async function importDocx(file) {
    const files = unzipSync(new Uint8Array(await file.arrayBuffer()));
    const doc = parseXml(files, 'word/document.xml');
    if (!doc) throw new Error('Arquivo .docx inválido.');
    const levels = headingLevels(parseXml(files, 'word/styles.xml'));
    const notes = footnoteTexts(parseXml(files, 'word/footnotes.xml'));
    const body = doc.getElementsByTagNameNS(W, 'body')[0];

    const result = { titulo: '', secoes: [], resumoPt: '', resumoEn: '', referencias: '', images: 0 };
    let target = null;     // onde vai o texto: seção atual, campo especial ou nada (capa, sumário)
    let buffer = [];
    let seenHeading = false;
    const loose = []; // texto de um arquivo sem nenhum título: vira uma seção única
    const flush = () => {
        const text = buffer.join('\n\n').trim();
        buffer = [];
        if (!text || !target) return;
        if (target.kind === 'section') target.section.conteudo = text;
        else result[target.field] = [result[target.field], text].filter(Boolean).join(target.field === 'referencias' ? '\n' : '\n\n');
    };

    for (const node of body.childNodes) {
        if (node.namespaceURI !== W) continue;
        if (node.localName === 'tbl') { if (target) buffer.push(tableBlock(node, notes)); continue; }
        if (node.localName !== 'p') continue;

        result.images += node.getElementsByTagNameNS(W, 'drawing').length;
        const pPr = kid(node, 'pPr');
        const styleId = attr(kid(pPr, 'pStyle'), 'val');
        const outline = attr(kid(pPr, 'outlineLvl'), 'val');
        const level = levels[styleId] ?? (outline !== null && Number(outline) < 5 ? Number(outline) + 1 : null);
        // Equação do Word (OMML): o texto linear vira [EQUAÇÃO]; o número "(1)" é refeito pelo editor
        const math = node.getElementsByTagNameNS(M, 'oMath');
        if (math.length) {
            if (target) buffer.push(`[EQUAÇÃO]: ${[...math].map(m => [...m.getElementsByTagNameNS(M, 't')].map(t => t.textContent).join('')).join(' ')}`);
            continue;
        }
        const text = paragraphText(node, notes);
        if (!text) continue;

        if (level === 'title') { if (!result.titulo) result.titulo = text.replace(/\*/g, ''); continue; }
        if (level) {
            seenHeading = true;
            flush();
            const titulo = text.replace(/\*/g, '').replace(/^\d+(\.\d+)*\.?\s+/, '').trim();
            const key = norm(titulo);
            if (key === 'RESUMO') target = { field: 'resumoPt' };
            else if (key === 'ABSTRACT') target = { field: 'resumoEn' };
            else if (key === 'REFERENCIAS' || key === 'REFERENCIAS BIBLIOGRAFICAS') target = { field: 'referencias' };
            else if (key === 'SUMARIO' || key.startsWith('LISTA DE') || key === 'AGRADECIMENTOS') target = null;
            else {
                const section = { titulo: level === 1 ? titulo.toUpperCase() : titulo, level, conteudo: '' };
                result.secoes.push(section);
                target = { kind: 'section', section };
            }
            continue;
        }
        if (target) {
            const prev = buffer[buffer.length - 1];
            // Alíneas e subalíneas seguidas ficam no mesmo bloco (uma por linha)
            if (prev && LIST_LINE.test(text) && LIST_LINE.test(prev.split('\n').pop())) buffer[buffer.length - 1] = `${prev}\n${text}`;
            else buffer.push(target.field === 'referencias' ? text.replace(/\n/g, ' ') : text);
        }
        else if (!seenHeading) loose.push(text);
    }
    flush();
    if (!result.secoes.length && loose.length) result.secoes.push({ titulo: 'INTRODUÇÃO', level: 1, conteudo: loose.join('\n\n') });
    return result;
}
