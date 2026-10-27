// Leitura do texto do editor, compartilhada pela pré-visualização e pela exportação para Word.

export const ASSET_LABELS = { IMAGEM: 'Figura', TABELA: 'Tabela', QUADRO: 'Quadro' };
const ASSET_TAGS = ['CITAÇÃO', 'IMAGEM', 'TABELA', 'QUADRO'];

/**
 * Divide o texto em blocos separados por linha em branco:
 *   { kind: 'p', lines: [...] }              parágrafo (linhas simples viram quebra de linha)
 *   { kind: 'asset', tipo, conteudo }        [CITAÇÃO], [IMAGEM], [TABELA] ou [QUADRO]
 */
export const splitBlocks = (texto, assets) => {
    if (!texto || typeof texto !== 'string') return [];

    return texto.replace(/\r\n?/g, '\n').trim().split(/\n{2,}/).map(bloco => bloco.trim()).filter(Boolean).map(trimmed => {
        const matchTag = trimmed.match(/^\[(CITAÇÃO|IMAGEM|TABELA|QUADRO)\]:\s*([\s\S]*)/i);

        if (matchTag && ASSET_TAGS.includes(matchTag[1].toUpperCase())) {
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

        return { kind: 'p', lines: trimmed.split('\n') };
    });
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

// **negrito** e *itálico* → trechos com formatação
export const parseInline = (text) => {
    const out = [];
    const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
    let last = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
        if (m.index > last) out.push({ text: text.slice(last, m.index) });
        out.push(m[1] !== undefined ? { text: m[1], bold: true } : { text: m[2], italic: true });
        last = re.lastIndex;
    }
    if (last < text.length) out.push({ text: text.slice(last) });
    return out;
};
