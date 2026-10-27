// Ficha catalográfica (dados de catalogação-na-publicação), verso da folha de rosto (NBR 14724).
// O texto segue o formato usado pelas bibliotecas (AACR2): entrada pelo sobrenome do primeiro
// autor, área de título e responsabilidade, imprenta, descrição física, notas e pistas.
// É um rascunho: a classificação (CDD/CDU) e o número de chamada são da biblioteca.

const filled = (t) => typeof t === 'string' && t.trim() !== '';

const SUFIXOS = ['JUNIOR', 'JÚNIOR', 'FILHO', 'FILHA', 'NETO', 'NETA', 'SOBRINHO', 'SOBRINHA'];
const MINUSCULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'nos', 'nas', 'ao', 'aos', 'à', 'às', 'com', 'por', 'pela', 'pelo', 'para', 'sobre', 'a', 'o']);

// "Maria Souza da Silva" → "SILVA, Maria Souza da"; "João Pereira Filho" → "PEREIRA FILHO, João"
export function entradaAutor(nome) {
    const partes = (nome || '').trim().split(/\s+/).filter(Boolean);
    if (partes.length < 2) return (partes[0] || '').toUpperCase();
    let corte = partes.length - 1;
    if (SUFIXOS.includes(partes[corte].toUpperCase()) && corte > 1) corte -= 1;
    const sobrenome = partes.slice(corte).join(' ').toUpperCase();
    return `${sobrenome}, ${partes.slice(0, corte).join(' ')}`;
}

// Nomes em CAIXA ALTA (como na capa) passam a iniciais maiúsculas na ficha
export function tituloProprio(texto) {
    const t = (texto || '').trim();
    if (!t || t !== t.toUpperCase()) return t;
    return t.toLowerCase().split(/\s+/).map((w, i) => (i > 0 && MINUSCULAS.has(w)) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Título na ficha: só a primeira letra maiúscula (AACR2); texto em caixa mista é mantido como está
export function tituloFicha(texto) {
    const t = (texto || '').trim();
    if (!t || t !== t.toUpperCase()) return t;
    const lower = t.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
}

const GRAU = {
    TCC: ['Trabalho de Conclusão de Curso', 'Graduação'],
    DISSERTACAO: ['Dissertação', 'Mestrado'],
    TESE: ['Tese', 'Doutorado'],
};

const nomeCurso = (curso) => tituloProprio(curso).replace(/^(curso|programa)\s+(de\s+)?(pós-graduação\s+)?(em\s+|de\s+)?/i, '').replace(/^(bacharelado|licenciatura)\s+em\s+/i, '');

const semPontoFinal = (t) => t.trim().replace(/[.\s]+$/, '');

/**
 * Monta as linhas da ficha catalográfica.
 * @returns {{ entrada: string, corpo: string[], notas: string[], pistas: string, classificacao: string }}
 */
export function buildFichaCatalografica(data, authors, { typeKey, folhas } = {}) {
    const autores = (authors || []).filter(filled);
    const orientadores = (data.orientadores || []).filter(filled);
    const ano = String(data.ano || new Date().getFullYear());
    const cidade = filled(data.cidade) ? data.cidade.trim() : '[S. l.]';

    const titulo = semPontoFinal(data.titulo || 'Título do trabalho');
    const tituloCompleto = filled(data.subtitulo) ? `${tituloFicha(titulo)}: ${semPontoFinal(data.subtitulo).toLowerCase()}` : tituloFicha(titulo);
    // Até três autores aparecem na responsabilidade; acima disso, o primeiro seguido de "et al."
    const responsabilidade = autores.length > 3 ? `${autores[0]} et al.` : autores.join(', ');

    const corpo = [
        `${tituloCompleto}${responsabilidade ? ` / ${responsabilidade}` : ''}. – ${cidade}, ${ano}.`,
        `${folhas ? folhas : '[n.]'} f.${(data.assets && Object.keys(data.assets).length) || /\[(IMAGEM|QUADRO)\]/.test((data.secoes || []).map(s => s.conteudo).join('\n')) ? ' : il.' : ''}`,
    ];

    const notas = [];
    if (orientadores.length) {
        const rotulo = data.generoOrientador === 'F' ? 'Orientadora' : 'Orientador';
        notas.push(`${orientadores.length > 1 ? `${rotulo}es` : rotulo}: ${orientadores.join('; ')}.`.replace('Orientadoraes', 'Orientadoras'));
    }
    const [trabalho, nivel] = GRAU[typeKey] || ['Trabalho acadêmico', ''];
    const curso = filled(data.curso) ? nomeCurso(data.curso) : '';
    const grau = nivel ? ` (${nivel}${curso ? ` em ${curso}` : ''})` : '';
    const instituicao = filled(data.instituicao) ? tituloProprio(data.instituicao) : '';
    notas.push(`${trabalho}${grau}${instituicao ? ` – ${instituicao}` : ''}, ${cidade}, ${ano}.`);

    // Pistas: assuntos numerados em arábico (palavras-chave) e entradas secundárias em romano
    const assuntos = (data.palavrasChavePt || '').split(/[;\n]/).map(k => semPontoFinal(k)).filter(Boolean);
    const semTitulacao = (nome) => nome.replace(/^((prof|profa|dr|dra|me|ma|msc|esp)\.?\s+)+/i, '');
    const secundarias = [...orientadores.map(o => `${entradaAutor(semTitulacao(o))}, orient.`), 'Título'];
    const romanos = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
    const pistas = [
        ...assuntos.map((a, i) => `${i + 1}. ${a.charAt(0).toUpperCase()}${a.slice(1)}.`),
        ...secundarias.map((s, i) => `${romanos[i] || i + 1}. ${s}.`),
    ].join(' ').replace(/\.\./g, '.');

    return {
        entrada: autores.length ? `${entradaAutor(autores[0])}.` : 'SOBRENOME, Nome.',
        corpo,
        notas,
        pistas,
        classificacao: filled(data.fichaCdd) ? data.fichaCdd.trim() : 'CDD',
    };
}
