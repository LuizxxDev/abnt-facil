import { describe, it, expect } from 'vitest';
import { splitBlocks, parseTable, orderedLines, parseInline, splitNotes, citationFor } from '../documentContent';
import { formatKeywords, getDocType, getDocTypeKey, hasElement, isRequired, DOCUMENT_TYPES } from '../documentTypes';
import { tokenizeHtml, sliceHtml } from '../pagination';

describe('splitBlocks', () => {
    it('separa parágrafos por linha em branco e reconhece marcadores', () => {
        const blocks = splitBlocks('Primeiro.\nlinha 2\n\n[CITAÇÃO]: Texto longo\n\n[IMAGEM]: Gráfico | IBGE (2020) | img1', { img1: 'data:x' });
        expect(blocks).toHaveLength(3);
        expect(blocks[0]).toEqual({ kind: 'p', lines: ['Primeiro.', 'linha 2'] });
        expect(blocks[1]).toMatchObject({ kind: 'asset', tipo: 'CITAÇÃO' });
        expect(blocks[2].conteudo).toBe('Gráfico | IBGE (2020) | data:x');
    });
    it('ignora entrada vazia', () => {
        expect(splitBlocks('')).toEqual([]);
        expect(splitBlocks(null)).toEqual([]);
    });
});

describe('parseTable', () => {
    it('lê título, fonte e células', () => {
        const t = parseTable('Sintomas | Dados (2024) | [["A","B"],["1",2]]');
        expect(t).toEqual({ title: 'Sintomas', source: 'Dados (2024)', rows: [['A', 'B'], ['1', '2']] });
    });
    it('tolera JSON inválido', () => {
        expect(parseTable('T | F | texto solto').rows).toEqual([['texto solto']]);
    });
});

describe('orderedLines (NBR 6023)', () => {
    it('ordena alfabeticamente ignorando negrito e acentos', () => {
        expect(orderedLines('SILVA, A. **Obra**.\nÁLVARES, B. Outra.\nBARROS, C. Texto.')).toEqual(['ÁLVARES, B. Outra.', 'BARROS, C. Texto.', 'SILVA, A. **Obra**.']);
    });
    it('mantém a ordem de listas numeradas', () => {
        expect(orderedLines('[2] B\n[1] A')).toEqual(['[2] B', '[1] A']);
    });
});

describe('parseInline', () => {
    it('separa negrito e itálico', () => {
        const segs = parseInline('a **b** *c*');
        expect(segs.map(s => s.text).join('')).toBe('a b c');
        expect(segs.find(s => s.text === 'b').bold).toBe(true);
        expect(segs.find(s => s.text === 'c').italics ?? segs.find(s => s.text === 'c').italic).toBe(true);
    });
});

describe('formatKeywords (NBR 6028)', () => {
    it('separa por ponto e vírgula e termina com ponto', () => {
        expect(formatKeywords('saúde mental, ansiedade; ensino superior.')).toBe('saúde mental; ansiedade; ensino superior.');
        expect(formatKeywords('  ')).toBe('');
    });
});

describe('tipos de documento', () => {
    it('cai no TCC quando o tipo é desconhecido', () => {
        expect(getDocTypeKey({ tipoDocumento: 'XYZ' })).toBe('TCC');
        expect(getDocType({})).toBe(DOCUMENT_TYPES.TCC);
    });
    it('artigo não tem capa e TCC tem ficha opcional', () => {
        expect(hasElement(DOCUMENT_TYPES.ARTIGO, 'capa')).toBe(false);
        expect(hasElement(DOCUMENT_TYPES.TCC, 'fichaCatalografica')).toBe(true);
        expect(isRequired(DOCUMENT_TYPES.TCC, 'fichaCatalografica')).toBe(false);
        expect(isRequired(DOCUMENT_TYPES.TCC, 'resumoPt')).toBe(true);
    });
    it('todo tipo declara norma, layout e seções', () => {
        Object.values(DOCUMENT_TYPES).forEach(t => {
            expect(t.norma).toMatch(/NBR/);
            expect(['academic', 'article']).toContain(t.layout);
            expect(Array.isArray(t.sections)).toBe(true);
        });
    });
});

describe('paginação: recorte de HTML', () => {
    it('mantém <strong> balanceado ao cortar o parágrafo', () => {
        const tokens = tokenizeHtml('um <strong>dois três</strong> quatro');
        const cut = tokens.indexOf('três');
        expect(sliceHtml(tokens, 0, cut)).toBe('um <strong>dois </strong>');
        expect(sliceHtml(tokens, cut, tokens.length)).toBe('<strong>três</strong> quatro');
    });
});

describe('alíneas, equações e notas', () => {
    it('reconhece alíneas com frase de introdução e subalíneas', () => {
        const blocks = splitBlocks('Os objetivos são:\na) medir;\n- calouros;\nb) propor.');
        expect(blocks[0]).toEqual({ kind: 'p', lines: ['Os objetivos são:'] });
        expect(blocks[1].kind).toBe('list');
        expect(blocks[1].items.map(i => [i.level, i.marker, i.text])).toEqual([[1, 'a)', 'medir;'], [2, '–', 'calouros;'], [1, 'b)', 'propor.']]);
    });
    it('não confunde parágrafo comum com alínea', () => {
        expect(splitBlocks('a) começo\ntexto solto')[0].kind).toBe('p');
    });
    it('reconhece [EQUAÇÃO] e [EQUACAO]', () => {
        expect(splitBlocks('[EQUACAO]: x^2')[0]).toEqual({ kind: 'asset', tipo: 'EQUAÇÃO', conteudo: 'x^2' });
    });
    it('separa notas de rodapé, inclusive com colchetes dentro', () => {
        expect(splitNotes('OMS^[ver [1] e mais] fim')).toEqual([{ text: 'OMS' }, { note: 'ver [1] e mais' }, { text: ' fim' }]);
        expect(splitNotes('sem nota ^[aberta')).toEqual([{ text: 'sem nota ^[aberta' }]);
        expect(parseInline('a^[**b**]').map(s => s.note ?? s.text)).toEqual(['a', '**b**']);
    });
});

describe('citationFor (NBR 10520:2023)', () => {
    it('monta autor-data a partir da referência', () => {
        expect(citationFor('SILVA, A. **Obra**. São Paulo: Saber, 2023.')).toBe('(Silva, 2023)');
        expect(citationFor('SILVA, A.; SOUZA, B. Obra. 2020.')).toBe('(Silva; Souza, 2020)');
        expect(citationFor('SILVA, A. et al. Obra. 2019.')).toBe('(Silva et al., 2019)');
        expect(citationFor('IBGE. Censo. Rio de Janeiro, 2022. Disponível em: x. Acesso em: 15 mar. 2024.')).toBe('(IBGE, 2022)');
        expect(citationFor('SANTOS, M. Texto sem data.')).toBe('(Santos, s. d.)');
    });
});
