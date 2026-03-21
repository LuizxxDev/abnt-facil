import React from 'react';
import { 
  BarChart3, ArrowLeftRight, FlaskConical, FileText, BookOpen, ClipboardList, AlignLeft,
  User, UserCheck, GraduationCap, Ghost, Monitor, Cpu, Code2, BrainCircuit
} from 'lucide-react';
import { generateId } from './helpers';

// --- NOVO: AVATARES DISPONÍVEIS ---
export const AVATAR_OPTIONS = [
  { id: 'user', icon: <User size={24} />, label: 'Padrão' },
  { id: 'student', icon: <GraduationCap size={24} />, label: 'Estudante' },
  { id: 'pro', icon: <UserCheck size={24} />, label: 'Pesquisador' },
  { id: 'dev', icon: <Code2 size={24} />, label: 'Dev' },
  { id: 'tech', icon: <Cpu size={24} />, label: 'Hardware' },
  { id: 'ai', icon: <BrainCircuit size={24} />, label: 'IA' },
  { id: 'ghost', icon: <Ghost size={24} />, label: 'Fantasma' },
  { id: 'it', icon: <Monitor size={24} />, label: 'Técnico' }
];

export const ABNT_TIPS = [
  "ABNT: Tabelas devem ter as laterais abertas (sem bordas verticais).",
  "ABNT: Figuras sempre precisam de título (acima) e fonte (abaixo).",
  "ABNT: Citações com mais de 3 linhas devem ter recuo de 4cm e fonte 10.",
  "ABNT: O resumo não deve conter parágrafos, apenas um bloco único de texto.",
  "ABNT: Títulos de seções primárias devem ser em NEGRITO e CAIXA ALTA.",
  "ABNT: Numeração de página começa a aparecer na Introdução, mas conta desde a folha de rosto."
];

export const PROJECT_TYPES = {
  TCC: {
    label: 'TCC (Padrão)',
    icon: <BookOpen size={24} />,
    description: 'Trabalho de Conclusão de Curso completo com todos os elementos pré-textuais.',
    sections: [
      { id: 't1', titulo: 'INTRODUÇÃO', conteudo: '', level: 1 },
      { id: 't2', titulo: 'REFERENCIAL TEÓRICO', conteudo: '', level: 1 },
      { id: 't3', titulo: 'METODOLOGIA', conteudo: '', level: 1 },
      { id: 't4', titulo: 'RESULTADOS E DISCUSSÃO', conteudo: '', level: 1 },
      { id: 't5', titulo: 'CONCLUSÃO', conteudo: '', level: 1 }
    ]
  },
  ARTIGO: {
    label: 'Artigo Acadêmico',
    icon: <FileText size={24} />,
    description: 'Publicação de resultados de pesquisa de forma concisa e direta.',
    sections: [
      { id: 'a1', titulo: 'INTRODUÇÃO', conteudo: 'O artigo deve começar com a exposição do tema e objetivos...', level: 1 },
      { id: 'a2', titulo: 'DESENVOLVIMENTO', conteudo: 'Parte principal contendo a fundamentação e argumentação...', level: 1 },
      { id: 'a3', titulo: 'CONSIDERAÇÕES FINAIS', conteudo: 'Síntese das conclusões e fechamento do estudo.', level: 1 }
    ]
  },
  RELATORIO: {
    label: 'Relatório Técnico',
    icon: <ClipboardList size={24} />,
    description: 'Documento que descreve formalmente o progresso ou resultados de atividades.',
    sections: [
      { id: 'r1', titulo: 'INTRODUÇÃO', conteudo: '', level: 1 },
      { id: 'r2', titulo: 'OBJETIVOS', conteudo: '', level: 1 },
      { id: 'r3', titulo: 'DESENVOLVIMENTO', conteudo: '', level: 1 },
      { id: 'r4', titulo: 'CONCLUSÕES E RECOMENDAÇÕES', conteudo: '', level: 1 }
    ]
  },
  RESUMO: {
    label: 'Resumo Expandido',
    icon: <AlignLeft size={24} />,
    description: 'Versão detalhada de um resumo para apresentações em eventos e congressos.',
    sections: [
      { id: 're1', titulo: 'INTRODUÇÃO', conteudo: '', level: 1 },
      { id: 're2', titulo: 'METODOLOGIA', conteudo: '', level: 1 },
      { id: 're3', titulo: 'RESULTADOS E DISCUSSÃO', conteudo: '', level: 1 },
      { id: 're4', titulo: 'CONCLUSÕES', conteudo: '', level: 1 }
    ]
  }
};

export const TABLE_PRESETS = [
  { id: 'numeric', label: 'Dados Numéricos', icon: <BarChart3 size={16}/>, rows: 4, cols: 3, data: [['Item', 'Qtd', '%'], ['A', '10', '20%'], ['B', '20', '40%'], ['Total', '30', '100%']] },
  { id: 'comparative', label: 'Comparativa', icon: <ArrowLeftRight size={16}/>, rows: 3, cols: 2, data: [['Aspecto', 'Descrição'], ['Vantagem', '...'], ['Desvantagem', '...']] },
  { id: 'experimental', label: 'Experimental', icon: <FlaskConical size={16}/>, rows: 4, cols: 4, data: [['Amostra', 'Var 1', 'Var 2', 'Res'], ['1', '...', '...', '...'], ['2', '...', '...', '...'], ['Média', '...', '...', '...']] }
];

export const SECTION_TEMPLATES = {
  'INTRODUÇÃO': `A apresentação do tema é fundamental para situar o leitor...\n\nO problema de pesquisa que norteia este trabalho é: [INSERIR PROBLEMA].\n\nO objetivo geral deste estudo é [VERBO NO INFINITIVO]...\n\nA justificativa para a escolha deste tema reside na necessidade de...`,
  'METODOLOGIA': `Para o desenvolvimento deste trabalho, optou-se por uma pesquisa de natureza [Qualitativa/Quantitativa]...\n\nQuanto aos procedimentos técnicos, utilizou-se a pesquisa bibliográfica, realizada a partir de materiais já publicados como livros e artigos científicos.`,
  'CONCLUSÃO': `Com base nos objetivos propostos, conclui-se que...\n\nFoi possível observar que...\n\nSugere-se, para trabalhos futuros, aprofundar a análise sobre...`
};

export const SECTION_GUIDES = {
  'INTRODUÇÃO': "💡 Dica: A introdução deve conter Contextualização, Problema, Objetivos e Justificativa.",
  'REFERENCIAL TEÓRICO': "💡 Dica: Apresente os principais autores. Use citações diretas (curtas/longas) e indiretas.",
  'METODOLOGIA': "💡 Dica: Descreva COMO você fez a pesquisa. Defina o tipo (bibliográfica, campo) e ferramentas.",
  'RESULTADOS': "💡 Dica: Apresente os dados coletados sem emitir opinião pessoal ainda. Use gráficos/tabelas.",
  'CONCLUSÃO': "💡 Dica: Retome o objetivo geral e diga se foi alcançado. Não traga dados novos aqui."
};

export const DEFAULT_CHECKLIST = [
  { id: 'tema', text: 'Definir Tema, Título e Orientador', done: false, auto: true },
  { id: 'intro', text: 'Escrever Introdução e Objetivos', done: false, auto: false },
  { id: 'ref', text: 'Coletar Referencial Teórico', done: false, auto: false },
  { id: 'metod', text: 'Escrever Metodologia', done: false, auto: false },
  { id: 'resul', text: 'Analisar Resultados', done: false, auto: false },
  { id: 'concl', text: 'Escrever Conclusão', done: false, auto: false },
  { id: 'citacoes', text: 'Revisar Citações e Referências', done: false, auto: true },
  { id: 'revisao', text: 'Revisão Ortográfica Final', done: false, auto: false }
];

export const EXAMPLE_ID = 'exemplo-tcc-ifpa-readonly';
export const ESTADOS_BR = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export const EXAMPLE_PROJECT = {
    id: EXAMPLE_ID,
    title: "Modelo de TCC (Exemplo Completo)",
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    authors: ["Fulano da Silva"],
    checklist: [
        { id: "ck1", text: "Definir tema e problema", done: true },
        { id: "ck2", text: "Escrever resumo e abstract", done: true },
        { id: "ck3", text: "Fundamentação teórica", done: true },
        { id: "ck4", text: "Revisar referências", done: true },
        { id: "ck5", text: "Exportar PDF final", done: false }
    ],
    deleted: false,
    favorite: true,
    data: {
        instituicao: "INSTITUTO FEDERAL DE EDUCAÇÃO, CIÊNCIA E TECNOLOGIA DO PARÁ",
        curso: "CURSO DE TECNOLOGIA EM ANÁLISE E DESENVOLVIMENTO DE SISTEMAS",
        titulo: "O IMPACTO DA INTELIGÊNCIA ARTIFICIAL NA EDUCAÇÃO TÉCNICA",
        subtitulo: "Desafios e Oportunidades no Ensino de Programação",
        naturezaTrabalho: "Trabalho de Conclusão de Curso apresentado ao Instituto Federal do Pará como requisito parcial para obtenção do título de Tecnólogo em Análise e Desenvolvimento de Sistemas.",
        orientador: "Prof. Dr. Ciclano de Souza",
        cidade: "Belém",
        estado: "PA",
        ano: new Date().getFullYear().toString(),
        resumoPt: "O presente trabalho analisa a integração de ferramentas de Inteligência Artificial (IA) no ensino de lógica de programação. Através de uma revisão bibliográfica e estudo de caso, investigou-se como LLMs (Large Language Models) podem auxiliar alunos iniciantes na detecção de erros e compreensão de código. Os resultados indicam que, quando utilizada como tutora e não apenas como geradora de respostas, a IA aumenta a eficácia do aprendizado em 30%. Conclui-se que a mediação docente é indispensável para evitar a dependência tecnológica e fomentar o pensamento crítico.",
        palavrasChavePt: "Inteligência Artificial. Educação. Programação. Ensino Técnico.",
        resumoEn: "This paper analyzes the integration of Artificial Intelligence (AI) tools in the teaching of programming logic. Through a literature review and case study, we investigated how LLMs (Large Language Models) can assist beginner students in error detection and code understanding. The results indicate that, when used as a tutor rather than just an answer generator, AI increases learning effectiveness by 30%. It is concluded that teaching mediation is indispensable to avoid technological dependence and foster critical thinking.",
        palavrasChaveEn: "Artificial Intelligence. Education. Programming. Technical Teaching.",
        dedicatoria: "Dedico este trabalho aos meus pais, pelo incentivo constante, e aos professores que me ensinaram a amar a tecnologia.",
        epigrafe: "A tecnologia é apenas uma ferramenta. No que se refere a motivar as crianças e conseguir que trabalhem juntas, o professor é o recurso mais importante. (Bill Gates)",
        
        secoes: [
            {
                id: generateId(),
                num: "1",
                titulo: "INTRODUÇÃO",
                level: 1,
                conteudo: "A evolução da Inteligência Artificial (IA) tem transformado diversos setores da sociedade, e a educação não é exceção. No contexto do ensino técnico, especificamente na formação de programadores, ferramentas como o ChatGPT e o GitHub Copilot têm alterado a dinâmica da sala de aula.\n\nO problema de pesquisa deste trabalho consiste em: como as ferramentas de IA generativa podem ser utilizadas para potencializar o aprendizado de lógica de programação sem comprometer o desenvolvimento do raciocínio algorítmico do aluno?\n\nO objetivo geral é analisar os impactos pedagógicos do uso assistido de IA em turmas introdutórias de desenvolvimento de sistemas no IFPA. A metodologia adotada foi a pesquisa bibliográfica combinada com a análise qualitativa de dados."
            },
            {
                id: generateId(),
                num: "2",
                titulo: "REFERENCIAL TEÓRICO",
                level: 1,
                conteudo: "Segundo Silva (2023), a inteligência artificial na educação pode atuar como um sistema de tutoria inteligente, personalizando o ritmo de estudo. No entanto, é crucial distinguir entre o uso da ferramenta como apoio cognitivo e como muleta intelectual.\n\n[CITAÇÃO]: A automação de tarefas cognitivas básicas permite que o aluno foque em problemas de maior complexidade, desde que a base teórica esteja consolidada (ALMEIDA, 2022, p. 45).\n\nAbaixo, apresenta-se um quadro comparativo sobre os tipos de uso da IA:\n\n[QUADRO]:\n**Quadro 1 - Modos de Uso da IA**\n| Modo | Descrição | Impacto |\n|---|---|---|\n| Gerador | O aluno pede a resposta pronta. | Baixo aprendizado |\n| Tutor | O aluno pede explicação do erro. | Alto aprendizado |\n| Revisor | O aluno pede melhorias no código. | Médio aprendizado |\nFonte: Elaborado pelo autor (2024)."
            },
            {
                id: generateId(),
                num: "3",
                titulo: "METODOLOGIA",
                level: 1,
                conteudo: "Esta pesquisa classifica-se como exploratória e descritiva. Para a coleta de dados, foram analisados artigos publicados entre 2020 e 2024 nas bases Google Acadêmico e Scielo.\n\nO procedimento técnico envolveu a comparação de desempenho entre dois grupos de alunos: o Grupo A utilizou IA apenas para tirar dúvidas conceituais, enquanto o Grupo B utilizou IA para gerar códigos completos."
            },
            {
                id: generateId(),
                num: "4",
                titulo: "RESULTADOS E DISCUSSÃO",
                level: 1,
                conteudo: "Os dados coletados demonstraram que o Grupo A obteve notas 15% superiores nas avaliações presenciais (sem consulta) em comparação ao Grupo B. Isso sugere que o uso da IA para gerar código pronto cria uma falsa sensação de competência.\n\n[IMAGEM]: https://placehold.co/600x300/EEE/31343C?text=Gráfico+de+Desempenho\nFonte: Dados da pesquisa (2024).\n\nA figura acima ilustra a curva de aprendizado. Nota-se que o uso crítico da ferramenta acelera a compreensão de sintaxe, mas não substitui a prática de lógica."
            },
            {
                id: generateId(),
                num: "5",
                titulo: "CONCLUSÃO",
                level: 1,
                conteudo: "Conclui-se que a Inteligência Artificial é uma aliada poderosa no ensino técnico, desde que mediada por estratégias pedagógicas claras. A proibição dessas ferramentas mostra-se ineficaz; o caminho é o letramento digital.\n\nPara trabalhos futuros, sugere-se a criação de um guia de boas práticas para docentes sobre como integrar LLMs em planos de aula de disciplinas técnicas."
            }
        ],
        referencias: "ALMEIDA, R. T. Tecnologias na Educação. São Paulo: Editora Moderna, 2022.\n\nSILVA, J. P. Inteligência Artificial e o Futuro do Ensino. Revista Brasileira de Informática na Educação, v. 10, n. 2, p. 12-25, 2023.\n\nOPENAI. ChatGPT: Optimizing Language Models for Dialogue. 2022. Disponível em: <https://openai.com/blog/chatgpt/>. Acesso em: 15 jan. 2024."
    }
};

export const TAG_RENDERERS = {
  'CITAÇÃO': (content, idx) => <div key={idx} className="abnt-citacao-longa">{content.trim()}</div>,
  'IMAGEM': (content, idx) => {
    const [title, source, url] = content.split('|').map(s => s.trim());
    return (
      <div key={idx} className="my-6 text-center">
        <div className="text-[10pt] font-bold mb-2 uppercase">Figura – {title || 'Título'}</div>
        <div className="border border-slate-200 bg-slate-50 p-4 inline-block min-w-[200px] min-h-[100px] flex items-center justify-center italic text-slate-400">
           {url ? (
             <img 
               src={url} 
               alt="Figura" 
               className="max-h-[400px] object-contain"
               crossOrigin="anonymous"
               onError={(e) => {
                 e.target.onerror = null; 
                 e.target.parentNode.innerHTML = `<div class="text-red-500 text-xs flex flex-col items-center"><span class="font-bold">Erro ao carregar imagem</span><span>Verifique a URL ou permissões (CORS)</span></div>`;
               }}
             />
           ) : '[Pré-visualização da Imagem]'}
        </div>
        <div className="text-[10pt] mt-1 italic">Fonte: {source || 'Autor.'}</div>
      </div>
    );
  },
  'TABELA': (content, idx) => {
    const parts = content.split('|');
    const title = parts[0]?.trim();
    const source = parts[1]?.trim();
    const rawData = parts.slice(2).join('|').trim();
    let tableData = [];
    try { tableData = JSON.parse(rawData); } catch (e) { tableData = [[rawData]]; }
    if (!Array.isArray(tableData)) tableData = [];
    return (
      <div key={idx} className="my-6 text-center w-full">
        <div className="text-[10pt] font-bold mb-2 uppercase text-left">Tabela – {title || 'Título'}</div>
        <div className="overflow-x-auto">
          <table className="w-full border-y-2 border-black border-collapse text-[10pt] mb-2">
            <thead>
              <tr className="border-b border-black">
                {Array.isArray(tableData[0]) && tableData[0].map((header, i) => (
                  <th key={i} className="p-2 text-left font-bold bg-slate-50/50">{typeof header === 'object' ? JSON.stringify(header) : header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.slice(1).map((row, rI) => (
                <tr key={rI} className="border-b border-slate-200 last:border-0">
                  {Array.isArray(row) && row.map((cell, cI) => (
                    <td key={cI} className="p-2 text-left">{typeof cell === 'object' && cell !== null ? JSON.stringify(cell) : cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-[10pt] italic text-left">Fonte: {source || 'Autor.'}</div>
      </div>
    );
  },
  'QUADRO': (content, idx) => {
    const [title, source, text] = content.split('|').map(s => s.trim());
    return (
      <div key={idx} className="my-6 text-center">
        <div className="text-[10pt] font-bold mb-2 uppercase text-left">Quadro – {title || 'Título'}</div>
        <div className="border-2 border-black p-4 text-[10pt] text-left leading-tight bg-white whitespace-pre-wrap">{text || '[Conteúdo]'}</div>
        <div className="text-[10pt] mt-1 italic text-left">Fonte: {source || 'Autor.'}</div>
      </div>
    );
  }
};