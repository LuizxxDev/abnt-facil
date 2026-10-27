import { describe, it, expect } from 'vitest';
import { buildFichaCatalografica, entradaAutor, tituloProprio } from '../fichaCatalografica';

describe('entradaAutor', () => {
    it('inverte pelo último sobrenome', () => {
        expect(entradaAutor('Maria Souza da Silva')).toBe('SILVA, Maria Souza da');
    });
    it('mantém o sufixo de parentesco junto ao sobrenome', () => {
        expect(entradaAutor('João Pereira Filho')).toBe('PEREIRA FILHO, João');
    });
    it('aceita nome único', () => {
        expect(entradaAutor('Platão')).toBe('PLATÃO');
    });
});

describe('tituloProprio', () => {
    it('converte CAIXA ALTA mantendo preposições em minúsculas', () => {
        expect(tituloProprio('INSTITUTO FEDERAL DO PARÁ')).toBe('Instituto Federal do Pará');
    });
    it('não altera texto já em caixa mista', () => {
        expect(tituloProprio('Saúde mental no IFPA')).toBe('Saúde mental no IFPA');
    });
});

describe('buildFichaCatalografica', () => {
    const data = {
        titulo: 'SAÚDE MENTAL NO ENSINO SUPERIOR', subtitulo: 'um estudo de caso',
        cidade: 'Belém', ano: '2026', curso: 'CURSO DE ENGENHARIA', instituicao: 'INSTITUTO FEDERAL DO PARÁ',
        orientadores: ['Prof. Dr. Carlos Alberto Lima'], palavrasChavePt: 'saúde mental; ensino superior',
        fichaCdd: 'CDD 616.89', secoes: [],
    };
    const f = buildFichaCatalografica(data, ['Maria Souza'], { typeKey: 'TCC', folhas: 42 });

    it('monta entrada, título e imprenta', () => {
        expect(f.entrada).toBe('SOUZA, Maria.');
        expect(f.corpo[0]).toBe('Saúde mental no ensino superior: um estudo de caso / Maria Souza. – Belém, 2026.');
        expect(f.corpo[1]).toBe('42 f.');
    });
    it('descreve o grau, o curso e a instituição', () => {
        expect(f.notas).toContain('Orientador: Prof. Dr. Carlos Alberto Lima.');
        expect(f.notas).toContain('Trabalho de Conclusão de Curso (Graduação em Engenharia) – Instituto Federal do Pará, Belém, 2026.');
    });
    it('gera assuntos e entradas secundárias', () => {
        expect(f.pistas).toBe('1. Saúde mental. 2. Ensino superior. I. LIMA, Carlos Alberto, orient. II. Título.');
        expect(f.classificacao).toBe('CDD 616.89');
    });
    it('usa et al. acima de três autores e marca ilustrações', () => {
        const g = buildFichaCatalografica({ ...data, secoes: [{ conteudo: '[IMAGEM]: Gráfico | Fonte | x' }] }, ['A B', 'C D', 'E F', 'G H'], { typeKey: 'DISSERTACAO' });
        expect(g.corpo[0]).toContain('/ A B et al.');
        expect(g.corpo[1]).toBe('[n.] f. : il.');
        expect(g.notas[1]).toMatch(/^Dissertação \(Mestrado em Engenharia\)/);
    });
});
