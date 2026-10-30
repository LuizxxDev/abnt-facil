// Leitura do texto do editor, compartilhada pela pré-visualização e pela exportação para Word.

export const ASSET_LABELS = { IMAGEM: 'Figura', TABELA: 'Tabela', QUADRO: 'Quadro' };
const TAG_RE = /^\[(CITAÇÃO|IMAGEM|TABELA|QUADRO|EQUAÇÃO|EQUACAO)\]:\s*([\s\S]*)/i;

// Alíneas (NBR 6024): "a) texto" e subalíneas "- texto"
const ALINEA_RE = /^([a-z])\)\s+(.*)$/;
const SUBALINEA_RE = /^[-–—]\s+(.*)$/;
const listItem = (line) => {
    const a = line.match(ALINEA_RE);
    return a ? { level: 1, marker: `${a[1]})`, text: a[2] } : { level: 2, marker: '–', text: line.match(SUBALINEA_RE)[1] };
};

/**
 * Divide o texto em blocos separados por linha em branco:
 *   { kind: 'p', lines: [...] }              parágrafo (linhas simples viram quebra de linha)
 *   { kind: 'list', items: [...] }           alíneas e subalíneas
 *   { kind: 'asset', tipo, conteudo }        [CITAÇÃO], [IMAGEM], [TABELA], [QUADRO] ou [EQUAÇÃO]
 */
export const splitBlocks = (texto, assets) => {
    if (!texto || typeof texto !== 'string') return [];

    return texto.replace(/\r\n?/g, '\n').trim().split(/\n{2,}/).map(bloco => bloco.trim()).filter(Boolean).flatMap(trimmed => {
        const matchTag = trimmed.match(TAG_RE);

        if (matchTag) {
            const tipo = matchTag[1].toUpperCase() === 'EQUACAO' ? 'EQUAÇÃO' : matchTag[1].toUpperCase();
            let conteudo = matchTag[2];

            if (tipo === 'IMAGEM') {
                let [title, source, urlStr] = conteudo.split('|').map(s => s?.trim() || '');
                // Resolve asset local se existir
                if (urlStr && assets && assets[urlStr]) urlStr = assets[urlStr];
                conteudo = `${title} | ${source} | ${urlStr}`;
            }
            return [{ kind: 'asset', tipo, conteudo }];
        }

        // Alíneas, com ou sem uma frase de introdução na primeira linha do bloco
        const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
        const first = lines.findIndex(l => ALINEA_RE.test(l));
        if (first !== -1 && lines.slice(first).every(l => ALINEA_RE.test(l) || SUBALINEA_RE.test(l))) {
            const list = { kind: 'list', items: lines.slice(first).map(listItem) };
            return first > 0 ? [{ kind: 'p', lines: lines.slice(0, first) }, list] : [list];
        }

        return [{ kind: 'p', lines: trimmed.split('\n') }];
    });
};

// Notas de rodapé escritas no texto como palavra^[texto da nota] → trechos { text } e { note }
export const splitNotes = (text) => {
    const out = [];
    let buf = '';
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '^' && text[i + 1] === '[') {
            let depth = 0, j = i + 1;
            for (; j < text.length; j++) {
                if (text[j] === '[') depth++;
                else if (text[j] === ']' && --depth === 0) break;
            }
            if (j < text.length) {
                if (buf) out.push({ text: buf });
                buf = '';
                out.push({ note: text.slice(i + 2, j).trim() });
                i = j;
                continue;
            }
        }
        buf += text[i];
    }
    if (buf) out.push({ text: buf });
    return out;
};

// Campos de [TABELA]: título | fonte | JSON das células
export const parseTable = (conteudo) => {
    const parts = conteudo.split('|');
    const title = parts[0]?.trim();
    const source = parts[1]?.trim();
    const raw = parts.slice(2).join('|').trim();
    let rows = [];
    try { rows = JSON.parse(raw); } catch { rows = [[raw]]; }
    if (!Array.isArray(rows)) rows = [];
    return { title, source, rows: rows.filter(Array.isArray).map(r => r.map(c => (c && typeof c === 'object') ? JSON.stringify(c) : String(c ?? ''))) };
};

// Referências: ordem alfabética no sistema autor-data (NBR 6023:2018); listas numeradas mantêm a ordem
export const orderedLines = (text) => {
    const lines = (text || '').replace(/\r\n?/g, '\n').split('\n').map(r => r.trim()).filter(Boolean);
    const numeric = lines.length > 0 && /^\[?\d+[\].)]/.test(lines[0]);
    const plain = (s) => s.replace(/\*/g, '');
    return numeric ? lines : [...lines].sort((a, b) => plain(a).localeCompare(plain(b), 'pt-BR', { sensitivity: 'base' }));
};

// **negrito**, *itálico* e notas de rodapé → trechos com formatação ({ text, bold?, italic? } ou { note })
export const parseInline = (text) => splitNotes(text).flatMap(part => {
    if (part.note !== undefined) return [part];
    const out = [];
    const t = part.text;
    const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
    let last = 0;
    let m;
    while ((m = re.exec(t)) !== null) {
        if (m.index > last) out.push({ text: t.slice(last, m.index) });
        out.push(m[1] !== undefined ? { text: m[1], bold: true } : { text: m[2], italic: true });
        last = re.lastIndex;
    }
    if (last < t.length) out.push({ text: t.slice(last) });
    return out;
});

// Citação autor-data (NBR 10520:2023) a partir de uma referência (NBR 6023):
// "SILVA, A.; SOUZA, B. **Obra**. Local: Editora, 2023." → "(Silva; Souza, 2023)"
const capitalize = (word) => word.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m, sep, ch) => sep + ch.toUpperCase());
export const citationFor = (reference) => {
    const ref = (reference || '').replace(/\*/g, '').trim();
    if (!ref) return '';
    const semAcesso = ref.replace(/Acesso em:.*$/i, '');
    const years = semAcesso.match(/\b(1[5-9]\d\d|20\d\d)[a-z]?\b/g);
    const ano = years ? years[years.length - 1] : 's. d.';
    const head = ref.split(/\.\s/)[0];
    let autores;
    if (/^[^,]+,/.test(head) || /;/.test(head)) {
        const nomes = head.split(';').map(a => a.split(',')[0].trim()).filter(Boolean);
        const etAl = /et al/i.test(head) || /^[^.]*,[^.]*\.\s*et al\./i.test(ref) || nomes.length > 3;
        autores = etAl ? `${capitalize(nomes[0])} et al.` : nomes.map(capitalize).join('; ');
    } else {
        // Entidade (IBGE, BRASIL...) ou título: siglas curtas ficam em maiúsculas
        const nome = head.trim();
        autores = nome.length <= 6 ? nome.toUpperCase() : capitalize(nome);
    }
    return `(${autores}, ${ano})`;
};
