import { describe, it, expect } from 'vitest';
import { splitBlocks, parseTable, orderedLines, parseInline } from '../documentContent';
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
