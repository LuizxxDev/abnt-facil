import React from 'react';
import { 
  BarChart3, ArrowLeftRight, FlaskConical, FileText, BookOpen, ClipboardList, AlignLeft,
  User, UserCheck, GraduationCap, Ghost, Monitor, Cpu, Code2, BrainCircuit
} from 'lucide-react';
import { generateId } from './helpers';

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
    authors: ["Estudante Universitário"],
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
        curso: "CURSO DE BACHARELADO EM ENGENHARIA DE CONTROLE E AUTOMAÇÃO",
        titulo: "A IMPORTÂNCIA DA SAÚDE MENTAL NO ENSINO SUPERIOR",
        subtitulo: "Desafios Psicológicos e Impactos no Desempenho de Estudantes de Ciências Exatas",
        naturezaTrabalho: "Trabalho de Conclusão de Curso apresentado ao Instituto Federal do Pará como requisito parcial para obtenção do título de Bacharel.",
        orientadores: ["Prof. Dr. Ciclano de Souza"],
        cidade: "Belém",
        estado: "PA",
        ano: new Date().getFullYear().toString(),
        dedicatoria: "Dedico este trabalho a todos os estudantes que silenciosamente enfrentam batalhas internas enquanto buscam seus sonhos acadêmicos. Que a jornada se torne mais leve.",
        agradecimentos: "Agradeço primeiramente a Deus, pela força nos momentos de dificuldade.\n\nAo meu orientador, pela paciência, empatia e por compreender que por trás de um acadêmico existe um ser humano.\n\nAos profissionais de psicologia e assistência estudantil do IFPA, cujo trabalho diário salva vidas e resgata futuros.",
        epigrafe: "O que a saúde mental precisa é de mais luz e menos silêncio. (Viktor Frankl)",
        resumoPt: "O ingresso no ensino superior representa um período de transição crítica, frequentemente acompanhado por um aumento significativo de estresse, ansiedade e pressão por desempenho, especialmente em cursos de ciências exatas. Este trabalho tem como objetivo analisar a importância da saúde mental e seus impactos diretos no rendimento acadêmico de estudantes de engenharia. Através de uma revisão bibliográfica sistemática e da aplicação de questionários, investigou-se a prevalência de transtornos mentais comuns no ambiente universitário e a eficácia das redes de apoio institucional. Os resultados indicam que a carga horária exaustiva e o rigor das avaliações contribuem para o esgotamento (burnout) estudantil. Conclui-se que a implementação de políticas de acolhimento psicológico não é apenas uma questão de saúde pública, mas uma estratégia pedagógica indispensável para reduzir a evasão e promover uma formação integral.",
        palavrasChavePt: "Saúde Mental. Ensino Superior. Ansiedade. Evasão Universitária. Engenharia.",
        resumoEn: "Entry into higher education represents a critical transition period, often accompanied by a significant increase in stress, anxiety, and performance pressure, especially in exact sciences courses. This study aims to analyze the importance of mental health and its direct impacts on the academic performance of engineering students. Through a systematic literature review and the application of questionnaires, the prevalence of common mental disorders in the university environment and the effectiveness of institutional support networks were investigated. The results indicate that the exhaustive workload and the rigor of assessments contribute to student burnout. It is concluded that the implementation of psychological support policies is not only a public health issue but an indispensable pedagogical strategy to reduce dropout rates and promote comprehensive education.",
        palavrasChaveEn: "Mental Health. Higher Education. Anxiety. University Dropout. Engineering.",
        secoes: [
            {
                id: generateId(),
                num: "1",
                titulo: "INTRODUÇÃO",
                level: 1,
                conteudo: "O ambiente universitário é, por excelência, um espaço de desenvolvimento intelectual, profissional e pessoal. No entanto, para muitos estudantes, a transição para o ensino superior é marcada por desafios que transcendem as exigências puramente acadêmicas, adentrando a esfera psicológica e emocional. O aumento da carga de estudos, a pressão por notas, as incertezas quanto ao futuro no mercado de trabalho e, muitas vezes, o afastamento do núcleo familiar, configuram um cenário propício ao adoecimento mental.\n\nO problema de pesquisa que norteia este estudo é: de que maneira o esgotamento psicológico afeta o rendimento e a permanência de discentes em cursos de alta exigência analítica, como as Engenharias?\n\nO objetivo geral é compreender os impactos da saúde mental no desempenho de estudantes universitários, propondo diretrizes para a criação de um ambiente acadêmico mais acolhedor. A justificativa fundamenta-se nos alarmantes índices de evasão escolar motivados por quadros de depressão, ansiedade e síndrome de burnout."
            },
            {
                id: generateId(),
                num: "2",
                titulo: "REFERENCIAL TEÓRICO",
                level: 1,
                conteudo: "Historicamente, o foco das instituições de ensino superior esteve quase que exclusivamente voltado para a excelência técnica e científica, relegando o bem-estar biopsicossocial do aluno a um segundo plano. Segundo Oliveira e Fernandes (2022), a cultura do produtivismo acadêmico frequentemente valida o sofrimento como parte natural e obrigatória do processo de formação.\n\n[CITAÇÃO]: A universidade moderna exige do sujeito uma performance contínua e sem falhas, o que gera uma internalização da culpa frente ao fracasso. O aluno deixa de ser visto em sua totalidade humana para ser avaliado apenas como um repositório de produtividade e notas (SILVA, 2023, p. 112).\n\nPara fins de compreensão das patologias mais comuns, apresenta-se o quadro abaixo:\n\n[QUADRO]: Principais Transtornos no Ambiente Acadêmico | Adaptado de Ministério da Saúde (2023) | Ansiedade: Semanas de provas, apresentações de TCC, prazos apertados. Dificuldade de concentração e branco em avaliações.\nDepressão: Isolamento social, reprovações recorrentes, sensação de insuficiência. Perda de motivação, absenteísmo e evasão.\nBurnout: Sobrecarga extrema de projetos, estágios e relatórios. Exaustão crônica, cinismo e queda brusca de notas."
            },
            {
                id: generateId(),
                num: "3",
                titulo: "METODOLOGIA",
                level: 1,
                conteudo: "A pesquisa possui caráter qualiquantitativo e delineamento transversal. A coleta de dados foi realizada por meio de um questionário online estruturado, aplicado a uma amostra de 150 alunos matriculados nos últimos quatro semestres de cursos de ciências exatas de uma instituição federal.\n\nO instrumento de coleta incluiu a versão adaptada da Escala de Estresse Percebido (Perceived Stress Scale - PSS-10), além de perguntas abertas sobre a utilização e a percepção dos serviços de apoio psicológico oferecidos pela instituição."
            },
            {
                id: generateId(),
                num: "4",
                titulo: "RESULTADOS E DISCUSSÃO",
                level: 1,
                conteudo: "A análise dos dados revelou um cenário preocupante. Dos 150 entrevistados, aproximadamente 68% relataram ter experimentado níveis altos ou muito altos de estresse durante o último período letivo. Além disso, 45% afirmaram já ter cogitado abandonar o curso devido à exaustão mental.\n\n[TABELA]: Prevalência de Sintomas Relatados | Dados da pesquisa de campo (2024) | [[\"Sintoma Relatado\", \"Frequência (%)\", \"Impacto Percebido na Nota\"], [\"Insônia crônica\", \"58%\", \"Alto\"], [\"Crises de ansiedade\", \"42%\", \"Muito Alto\"], [\"Desmotivação generalizada\", \"71%\", \"Médio-Alto\"], [\"Pensamentos de desistência\", \"45%\", \"Extremo\"]]\n\nApesar dos altos índices de sofrimento, notou-se que apenas 12% dos estudantes buscaram o núcleo de apoio psicológico da universidade. Quando questionados sobre o motivo, a maioria apontou o estigma associado à saúde mental e a incompatibilidade de horários entre as aulas e os plantões de atendimento.\n\n[IMAGEM]: Gráfico de Busca por Apoio | Dados da pesquisa (2024) | https://placehold.co/600x300/EEE/31343C?text=Alunos+que+buscaram+Apoio:+12%25"
            },
            {
                id: generateId(),
                num: "5",
                titulo: "CONCLUSÃO",
                level: 1,
                conteudo: "Conclui-se que a saúde mental é um pilar fundamental e indissociável do sucesso acadêmico. A negligência institucional frente ao sofrimento psíquico dos estudantes não apenas compromete a qualidade do ensino, mas também resulta em perdas significativas de talentos devido à evasão.\n\nFaz-se necessária uma mudança de paradigma na cultura acadêmica, substituindo a romantização do esgotamento por estratégias efetivas de cuidado. Recomenda-se, para trabalhos futuros, a investigação de como a adoção de metodologias ativas e avaliações formativas pode mitigar os picos de estresse gerados pelo modelo tradicional de provas."
            }
        ],
        referencias: "MINISTÉRIO DA SAÚDE. Manual de Saúde Mental do Estudante Universitário. Brasília: MS, 2023.\n\nOLIVEIRA, M. A.; FERNANDES, L. R. O produtivismo acadêmico e suas consequências. Revista de Psicologia da Educação, v. 21, n. 4, p. 89-105, 2022.\n\nSILVA, P. T. Subjetividade e Sofrimento na Universidade. São Paulo: Editora Saber, 2023.",
        apendices: "APÊNDICE A - Questionário de Estresse Percebido\n\n1. No último mês, com que frequência você se sentiu nervoso ou estressado por causa da faculdade?\n2. Com que frequência você sentiu que não conseguiria lidar com todas as tarefas acadêmicas?",
        anexos: "ANEXO A - Cartilha Nacional de Prevenção ao Suicídio\n\n[O conteúdo da cartilha do Ministério da Saúde seria inserido aqui]"
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