// Artigo científico de exemplo (NBR 6022:2018), completo: mostra todos os recursos do editor.
// Os dados da pesquisa são fictícios (avisado em nota de rodapé); as referências são obras reais.
import { generateId } from './helpers';
import { barChartDataUrl } from './exampleChart';

export const EXAMPLE_ARTICLE_ID = 'exemplo-artigo-saude-mental';

// Gráfico da Figura 1 (guardado como imagem local do documento)
const BARRAS = [
    ['Amigos e colegas de curso', 61],
    ['Família', 48],
    ['Internet e redes sociais', 37],
    ['Serviço de psicologia da instituição', 14],
    ['Profissional particular', 11],
];

const RESUMO = 'A entrada na universidade coincide com uma fase de transição marcada por novas cobranças acadêmicas, mudanças de rotina e, para muitos estudantes, o afastamento da família. Este artigo discute a importância da saúde mental na faculdade e sua relação com o desempenho e a permanência estudantil. Trata-se de um estudo exploratório, de abordagem quali-quantitativa, que combinou revisão de literatura com um levantamento ilustrativo aplicado a estudantes de graduação, por meio de questionário com a Escala de Estresse Percebido e perguntas abertas analisadas pela técnica de análise de conteúdo. Os resultados apontam estresse moderado ou alto na maior parte dos participantes, maior procura por apoio informal do que pelos serviços institucionais e a falta de tempo e o receio de julgamento como principais barreiras ao cuidado. Conclui-se que a atenção à saúde mental deve integrar a política de permanência das instituições, com ações de acolhimento, divulgação dos serviços e revisão de práticas pedagógicas que sobrecarregam os estudantes.';

const ABSTRACT = 'Starting university coincides with a period of transition marked by new academic demands, changes in routine and, for many students, distance from their families. This article discusses the importance of mental health in college and its relationship with student performance and retention. It is an exploratory study with a mixed-methods approach, which combined a literature review with an illustrative survey of undergraduate students, using a questionnaire with the Perceived Stress Scale and open questions examined through content analysis. The results show moderate or high stress in most participants, greater use of informal support than of institutional services, and lack of time and fear of judgment as the main barriers to care. It is concluded that mental health care should be part of institutional retention policies, through welcoming actions, wider dissemination of services and a review of teaching practices that overload students.';

export const EXAMPLE_ARTICLE = {
    id: EXAMPLE_ARTICLE_ID,
    title: 'Artigo de exemplo: saúde mental na faculdade',
    authors: ['Ana Beatriz Souza', 'Carlos Eduardo Lima'],
    data: {
        tipoDocumento: 'ARTIGO',
        instituicao: 'INSTITUTO FEDERAL DE EDUCAÇÃO, CIÊNCIA E TECNOLOGIA DO PARÁ',
        curso: '',
        titulo: 'A IMPORTÂNCIA DA SAÚDE MENTAL NA FACULDADE',
        subtitulo: 'estresse, apoio e permanência estudantil',
        tituloEn: 'The importance of mental health in college: stress, support and student retention',
        notaAutores: 'Graduanda em Psicologia pelo Instituto Federal do Pará (IFPA). E-mail: ana.souza@instituicao.edu.br\nMestre em Educação. Professor do Instituto Federal do Pará (IFPA). E-mail: carlos.lima@instituicao.edu.br',
        cidade: 'Belém',
        estado: 'PA',
        ano: '2026',
        orientadores: [''],
        banca: [],
        resumoPt: RESUMO,
        palavrasChavePt: 'saúde mental; ensino superior; estresse; permanência estudantil.',
        resumoEn: ABSTRACT,
        palavrasChaveEn: 'mental health; higher education; stress; student retention.',
        secoes: [
            {
                id: generateId(),
                titulo: 'INTRODUÇÃO',
                level: 1,
                conteudo: 'A graduação costuma ser lembrada como um período de descobertas, mas também é, para muitos estudantes, o momento em que surgem ou se agravam quadros de ansiedade, tristeza persistente e esgotamento. A rotina de provas, trabalhos e estágios soma-se a mudanças de cidade, à necessidade de conciliar estudo e trabalho e às incertezas sobre a carreira.\n\nUm levantamento conduzido em oito países pela Organização Mundial da Saúde mostrou que cerca de um terço dos calouros entrevistados apresentava ao menos um transtorno mental ao longo da vida, e que boa parte desses quadros havia começado antes do ingresso na universidade (Auerbach et al., 2018). No Brasil, a pesquisa nacional de perfil dos graduandos das instituições federais também registra dificuldades emocionais como um dos fatores que interferem na vida acadêmica (Andifes, 2019).\n\nDiante desse cenário, este artigo tem como objetivo discutir a importância da saúde mental na faculdade, analisando os níveis de estresse percebido, as fontes de apoio procuradas e as barreiras que afastam os estudantes do cuidado. Parte-se da pergunta: que fatores dificultam o acesso dos estudantes aos serviços de apoio psicológico oferecidos pela própria instituição?'
            },
            {
                id: generateId(),
                titulo: 'REFERENCIAL TEÓRICO',
                level: 1,
                conteudo: 'Esta seção apresenta o conceito de saúde mental adotado no estudo e as políticas que tratam do tema no ensino superior brasileiro.'
            },
            {
                id: generateId(),
                titulo: 'Saúde mental no contexto universitário',
                level: 2,
                conteudo: 'A Organização Mundial da Saúde entende a saúde mental como um estado de bem-estar que permite à pessoa lidar com as pressões da vida, desenvolver suas habilidades, aprender, trabalhar e contribuir com a comunidade, e não apenas como a ausência de doença (World Health Organization, 2022). Nessa perspectiva, cuidar da saúde mental na faculdade não se resume a tratar transtornos, mas envolve as condições em que o estudante vive e aprende.\n\nEstudos brasileiros já apontavam, no início dos anos 2000, uma prevalência elevada de transtornos mentais menores entre universitários, associada a fatores como dificuldades financeiras, insatisfação com o curso e falta de suporte social (Cerchiari; Caetano; Faccenda, 2005). Esses achados reforçam que o adoecimento não é um problema individual isolado, mas está ligado ao ambiente acadêmico e às condições de permanência.'
            },
            {
                id: generateId(),
                titulo: 'Assistência estudantil e permanência',
                level: 2,
                conteudo: 'No âmbito federal, o Programa Nacional de Assistência Estudantil (PNAES) inclui a atenção à saúde entre as áreas em que as instituições devem desenvolver ações de apoio aos estudantes. O decreto que instituiu o programa define seus objetivos da seguinte forma:\n\n[CITAÇÃO]: São objetivos do PNAES: I - democratizar as condições de permanência dos jovens na educação superior pública federal; II - minimizar os efeitos das desigualdades sociais e regionais na permanência e conclusão da educação superior; III - reduzir as taxas de retenção e evasão; e IV - contribuir para a promoção da inclusão social pela educação (Brasil, 2010, art. 2º).\n\nAo relacionar permanência e redução da evasão, o programa reconhece que dificuldades emocionais podem levar ao trancamento e ao abandono do curso. Por isso, os serviços de psicologia e de assistência estudantil são parte da política de permanência, e não apenas um benefício complementar.'
            },
            {
                id: generateId(),
                titulo: 'METODOLOGIA',
                level: 1,
                conteudo: 'Trata-se de um estudo exploratório, de abordagem quali-quantitativa, que combinou revisão de literatura com um levantamento por questionário on-line, conforme a classificação de Gil (2017). O levantamento apresentado aqui é ilustrativo^[Os dados apresentados neste artigo são fictícios e foram criados apenas para demonstrar a formatação de um artigo científico nas normas da ABNT.] e reúne respostas de 240 estudantes de graduação de diferentes áreas.\n\nForam adotados os seguintes critérios de inclusão:\na) estar regularmente matriculado em curso de graduação;\nb) ter 18 anos ou mais;\nc) concordar com o termo de consentimento livre e esclarecido, que garante:\n- participação voluntária;\n- anonimato das respostas.\n\nO questionário reuniu a Escala de Estresse Percebido, proposta por Cohen, Kamarck e Mermelstein (1983) e validada para o português por Luft et al. (2007), além de perguntas abertas sobre as fontes de apoio procuradas e as barreiras encontradas. A prevalência de cada condição foi calculada pela razão entre o número de casos e o total de participantes, conforme a Equação 1:\n\n[EQUAÇÃO]: P = \\frac{n}{N} \\times 100\n\nem que P é a prevalência, em porcentagem, n é o número de estudantes com a condição e N é o total de participantes. As respostas abertas foram examinadas por meio da análise de conteúdo, com a organização das falas em categorias temáticas (Bardin, 2016).'
            },
            {
                id: generateId(),
                titulo: 'RESULTADOS E DISCUSSÃO',
                level: 1,
                conteudo: 'A maior parte dos participantes apresentou estresse percebido moderado ou alto, com diferenças entre as áreas do conhecimento, como mostra a Tabela 1.\n\n[TABELA]: Nível de estresse percebido por área do curso | Elaborada pelos autores (2026) | [["Área do curso", "Participantes", "Estresse moderado", "Estresse alto"], ["Ciências exatas e engenharias", "82", "41%", "38%"], ["Ciências da saúde", "64", "45%", "31%"], ["Ciências humanas e sociais", "58", "48%", "24%"], ["Linguagens e artes", "36", "44%", "22%"], ["Total", "240", "44%", "31%"]]\n\nOs resultados acompanham a tendência descrita por Auerbach et al. (2018) e por Cerchiari, Caetano e Faccenda (2005): o sofrimento psíquico é frequente na graduação e se concentra nos cursos de maior carga horária. Quanto às fontes de apoio, os estudantes recorreram principalmente a amigos e familiares, enquanto a procura pelo serviço de psicologia da instituição foi baixa (Figura 1).\n\n[IMAGEM]: Fontes de apoio procuradas pelos estudantes | Elaborada pelos autores (2026) | local_img_grafico_apoio\n\nA análise das respostas abertas resultou em três categorias de barreiras ao cuidado, apresentadas no Quadro 1.\n\n[QUADRO]: Barreiras ao cuidado relatadas pelos estudantes | Elaborado pelos autores (2026) | Falta de tempo: horários de atendimento que coincidem com as aulas e o estágio.\nReceio de julgamento: medo de ser visto como incapaz por colegas e professores.\nDesconhecimento: estudantes que não sabiam que a instituição oferece atendimento psicológico.\n\nO baixo uso dos serviços institucionais indica que oferecer o atendimento não basta: é preciso torná-lo conhecido, acessível em horários diversos e livre de estigma. Ações de acolhimento no início do curso e a participação dos professores na identificação de estudantes em sofrimento aparecem como caminhos para aproximar o serviço de quem precisa dele.'
            },
            {
                id: generateId(),
                titulo: 'CONSIDERAÇÕES FINAIS',
                level: 1,
                conteudo: 'Este artigo discutiu a importância da saúde mental na faculdade a partir da literatura e de um levantamento ilustrativo com estudantes de graduação. Os resultados indicam estresse elevado na maior parte dos participantes, preferência por apoio informal e barreiras de tempo, estigma e informação para o acesso aos serviços institucionais.\n\nConclui-se que a saúde mental deve ser tratada como parte da política de permanência estudantil, em diálogo com os objetivos do PNAES. Recomenda-se que as instituições divulguem seus serviços desde o ingresso, ampliem os horários de atendimento e revejam práticas avaliativas que concentram prazos. Estudos futuros podem acompanhar os mesmos estudantes ao longo do curso para verificar como o estresse se relaciona com a evasão.'
            },
        ],
        agradecimentos: 'Os autores agradecem aos estudantes que participaram da pesquisa e à equipe de assistência estudantil da instituição pelo apoio na divulgação do questionário.',
        referencias: [
            'ANDIFES. **V Pesquisa Nacional de Perfil Socioeconômico e Cultural dos(as) Graduandos(as) das IFES – 2018**. Brasília, DF: ANDIFES, 2019.',
            'AUERBACH, R. P. et al. WHO World Mental Health Surveys International College Student Project: prevalence and distribution of mental disorders. **Journal of Abnormal Psychology**, Washington, v. 127, n. 7, p. 623-638, 2018.',
            'BARDIN, L. **Análise de conteúdo**. São Paulo: Edições 70, 2016.',
            'BRASIL. Decreto nº 7.234, de 19 de julho de 2010. Dispõe sobre o Programa Nacional de Assistência Estudantil - PNAES. Brasília, DF: Presidência da República, 2010. Disponível em: https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2010/decreto/d7234.htm. Acesso em: 2 nov. 2026.',
            'CERCHIARI, E. A. N.; CAETANO, D.; FACCENDA, O. Prevalência de transtornos mentais menores em estudantes universitários. **Estudos de Psicologia**, Natal, v. 10, n. 3, p. 413-420, 2005.',
            'COHEN, S.; KAMARCK, T.; MERMELSTEIN, R. A global measure of perceived stress. **Journal of Health and Social Behavior**, Washington, v. 24, n. 4, p. 385-396, 1983.',
            'GIL, A. C. **Como elaborar projetos de pesquisa**. 6. ed. São Paulo: Atlas, 2017.',
            'LUFT, C. D. B. et al. Versão brasileira da Escala de Estresse Percebido: tradução e validação para idosos. **Revista de Saúde Pública**, São Paulo, v. 41, n. 4, p. 606-615, 2007.',
            'WORLD HEALTH ORGANIZATION. **World mental health report**: transforming mental health for all. Geneva: WHO, 2022.',
        ].join('\n\n'),
        apendices: '**APÊNDICE A - QUESTIONÁRIO APLICADO AOS ESTUDANTES**\n\n1. Qual é o seu curso e em que semestre você está?\n\n2. No último mês, com que frequência você se sentiu nervoso ou estressado por causa da faculdade?\n\n3. Quando se sentiu sobrecarregado, a quem você recorreu?\n\n4. Você sabe que a instituição oferece atendimento psicológico? Já usou o serviço?\n\n5. O que dificulta ou impede você de procurar ajuda?',
        anexos: '',
        glossario: '',
        assets: { local_img_grafico_apoio: barChartDataUrl(BARRAS) },
    },
};
