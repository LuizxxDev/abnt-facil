import React from 'react';
import {
  BookOpen, GraduationCap, Award, NotebookPen, FileSearch, ClipboardList, Briefcase,
  FileText, AlignLeft, MessageSquareQuote
} from 'lucide-react';

// =============================================================================
// Tipos de documento acadêmico e as normas ABNT que regem cada um.
//
// layout:
//   'academic' → folhas separadas: capa, folha de rosto, pré-textuais, sumário;
//                cada seção primária começa numa folha nova (NBR 14724, 15287, 10719)
//   'article'  → documento contínuo, sem capa, numerado desde a 1ª página (NBR 6022)
//
// elements: 'obr' (obrigatório), 'opc' (opcional) ou ausente (não se aplica ao tipo).
// =============================================================================

const ACADEMIC_PRE = {
  capa: 'obr', folhaRosto: 'obr', folhaAprovacao: 'obr',
  dedicatoria: 'opc', agradecimentos: 'opc', epigrafe: 'opc',
  resumoPt: 'obr', resumoEn: 'obr', listas: 'opc', sumario: 'obr',
  glossario: 'opc', apendices: 'opc', anexos: 'opc',
};

const sec = (titulo, level = 1, conteudo = '') => ({ titulo, level, conteudo });

const CRONOGRAMA = '[TABELA]: Cronograma de atividades | Elaborado pelo autor | '
  + JSON.stringify([
    ['Atividade', 'Mês 1', 'Mês 2', 'Mês 3', 'Mês 4'],
    ['Revisão bibliográfica', 'X', 'X', '', ''],
    ['Coleta de dados', '', 'X', 'X', ''],
    ['Análise dos resultados', '', '', 'X', 'X'],
    ['Redação final', '', '', '', 'X'],
  ]);

const RECURSOS = '[TABELA]: Recursos necessários | Elaborado pelo autor | '
  + JSON.stringify([
    ['Item', 'Quantidade', 'Valor (R$)'],
    ['Material de consumo', '1', '0,00'],
    ['Total', '', '0,00'],
  ]);

export const DOCUMENT_TYPES = {
  TCC: {
    label: 'TCC / Monografia',
    norma: 'NBR 14724:2011',
    icon: <BookOpen size={24} />,
    description: 'Trabalho de conclusão de graduação ou especialização, com capa, folha de aprovação e resumos.',
    layout: 'academic',
    elements: ACADEMIC_PRE,
    resumoWords: [150, 500],
    natureza: ({ curso, instituicao }) =>
      `Trabalho de Conclusão de Curso apresentado ao ${curso || '[Curso]'} do ${instituicao || '[Instituição]'}, como requisito parcial para obtenção do título de [Bacharel/Licenciado/Tecnólogo] em [Área].`,
    sections: [sec('INTRODUÇÃO'), sec('REFERENCIAL TEÓRICO'), sec('METODOLOGIA'), sec('RESULTADOS E DISCUSSÃO'), sec('CONCLUSÃO')],
  },
  DISSERTACAO: {
    label: 'Dissertação (Mestrado)',
    norma: 'NBR 14724:2011',
    icon: <GraduationCap size={24} />,
    description: 'Trabalho de mestrado com todos os elementos pré-textuais da NBR 14724.',
    layout: 'academic',
    elements: ACADEMIC_PRE,
    resumoWords: [150, 500],
    natureza: ({ curso, instituicao }) =>
      `Dissertação apresentada ao ${curso || 'Programa de Pós-Graduação em [Área]'} do ${instituicao || '[Instituição]'}, como requisito parcial para obtenção do título de Mestre em [Área].\n\nÁrea de concentração: [Área].`,
    sections: [sec('INTRODUÇÃO'), sec('REVISÃO DE LITERATURA'), sec('MATERIAIS E MÉTODOS'), sec('RESULTADOS'), sec('DISCUSSÃO'), sec('CONCLUSÃO')],
  },
  TESE: {
    label: 'Tese (Doutorado)',
    norma: 'NBR 14724:2011',
    icon: <Award size={24} />,
    description: 'Trabalho de doutorado com todos os elementos pré-textuais da NBR 14724.',
    layout: 'academic',
    elements: ACADEMIC_PRE,
    resumoWords: [150, 500],
    natureza: ({ curso, instituicao }) =>
      `Tese apresentada ao ${curso || 'Programa de Pós-Graduação em [Área]'} do ${instituicao || '[Instituição]'}, como requisito parcial para obtenção do título de Doutor em [Área].\n\nÁrea de concentração: [Área].`,
    sections: [sec('INTRODUÇÃO'), sec('REVISÃO DE LITERATURA'), sec('MATERIAIS E MÉTODOS'), sec('RESULTADOS'), sec('DISCUSSÃO'), sec('CONCLUSÃO')],
  },
  TRABALHO: {
    label: 'Trabalho de Disciplina',
    norma: 'NBR 14724:2011',
    icon: <NotebookPen size={24} />,
    description: 'Trabalho acadêmico para avaliação em disciplina: capa, folha de rosto e sumário.',
    layout: 'academic',
    elements: { capa: 'obr', folhaRosto: 'obr', sumario: 'obr', listas: 'opc', apendices: 'opc', anexos: 'opc', glossario: 'opc' },
    natureza: ({ curso, instituicao }) =>
      `Trabalho apresentado à disciplina [Nome da Disciplina], do ${curso || '[Curso]'} do ${instituicao || '[Instituição]'}, como requisito parcial de avaliação.`,
    sections: [sec('INTRODUÇÃO'), sec('DESENVOLVIMENTO'), sec('CONCLUSÃO')],
  },
  PROJETO: {
    label: 'Projeto de Pesquisa',
    norma: 'NBR 15287:2011',
    icon: <FileSearch size={24} />,
    description: 'Pré-projeto de TCC, mestrado ou doutorado: tema, problema, objetivos, metodologia e cronograma.',
    layout: 'academic',
    elements: { capa: 'opc', folhaRosto: 'obr', listas: 'opc', sumario: 'obr', glossario: 'opc', apendices: 'opc', anexos: 'opc' },
    natureza: ({ curso, instituicao }) =>
      `Projeto de pesquisa apresentado ao ${curso || '[Curso/Programa]'} do ${instituicao || '[Instituição]'}, como requisito para [elaboração do Trabalho de Conclusão de Curso / seleção do Programa].`,
    sections: [
      sec('INTRODUÇÃO'), sec('Tema', 2), sec('Problema', 2), sec('Hipóteses', 2),
      sec('OBJETIVOS'), sec('Objetivo geral', 2), sec('Objetivos específicos', 2),
      sec('JUSTIFICATIVA'), sec('REFERENCIAL TEÓRICO'), sec('METODOLOGIA'),
      sec('RECURSOS', 1, RECURSOS), sec('CRONOGRAMA', 1, CRONOGRAMA),
    ],
  },
  RELATORIO: {
    label: 'Relatório Técnico-Científico',
    norma: 'NBR 10719:2015',
    icon: <ClipboardList size={24} />,
    description: 'Relatório de pesquisa, projeto ou atividade técnica, com resumo obrigatório.',
    layout: 'academic',
    elements: { capa: 'opc', folhaRosto: 'obr', agradecimentos: 'opc', resumoPt: 'obr', listas: 'opc', sumario: 'obr', glossario: 'opc', apendices: 'opc', anexos: 'opc' },
    resumoWords: [150, 500],
    natureza: ({ instituicao }) =>
      `Relatório técnico-científico apresentado ao ${instituicao || '[Órgão/Instituição]'}, referente a [projeto/atividade], período de [mês/ano] a [mês/ano].`,
    sections: [sec('INTRODUÇÃO'), sec('DESENVOLVIMENTO'), sec('RESULTADOS'), sec('CONSIDERAÇÕES FINAIS')],
  },
  ESTAGIO: {
    label: 'Relatório de Estágio',
    norma: 'NBR 10719:2015',
    icon: <Briefcase size={24} />,
    description: 'Relatório de estágio supervisionado: empresa, atividades desenvolvidas e considerações.',
    layout: 'academic',
    elements: { capa: 'obr', folhaRosto: 'obr', folhaAprovacao: 'opc', agradecimentos: 'opc', resumoPt: 'obr', listas: 'opc', sumario: 'obr', apendices: 'opc', anexos: 'opc' },
    resumoWords: [150, 500],
    natureza: ({ curso, instituicao }) =>
      `Relatório de Estágio Supervisionado apresentado ao ${curso || '[Curso]'} do ${instituicao || '[Instituição]'}, como requisito parcial para aprovação na disciplina de Estágio Supervisionado.\n\nLocal do estágio: [Empresa/Instituição].\nSupervisor(a): [Nome].`,
    sections: [
      sec('INTRODUÇÃO'), sec('CARACTERIZAÇÃO DA EMPRESA'), sec('ATIVIDADES DESENVOLVIDAS'),
      sec('RELAÇÃO ENTRE TEORIA E PRÁTICA'), sec('CONSIDERAÇÕES FINAIS'),
    ],
  },
  ARTIGO: {
    label: 'Artigo Científico',
    norma: 'NBR 6022:2018',
    icon: <FileText size={24} />,
    description: 'Artigo para periódico ou disciplina: título, autoria, resumo de 100 a 250 palavras e texto contínuo.',
    layout: 'article',
    elements: { tituloEn: 'opc', notaAutores: 'opc', resumoPt: 'obr', resumoEn: 'opc', apendices: 'opc', anexos: 'opc', glossario: 'opc', agradecimentosPos: 'opc' },
    resumoWords: [100, 250],
    sections: [sec('INTRODUÇÃO'), sec('REFERENCIAL TEÓRICO'), sec('METODOLOGIA'), sec('RESULTADOS E DISCUSSÃO'), sec('CONSIDERAÇÕES FINAIS')],
  },
  RESUMO_EXPANDIDO: {
    label: 'Resumo Expandido',
    norma: 'NBR 6022 / 6028',
    icon: <AlignLeft size={24} />,
    description: 'Trabalho curto para eventos e congressos. Confira o limite de páginas do evento.',
    layout: 'article',
    elements: { notaAutores: 'opc', resumoPt: 'opc' },
    resumoWords: [100, 250],
    sections: [sec('INTRODUÇÃO'), sec('METODOLOGIA'), sec('RESULTADOS E DISCUSSÃO'), sec('CONCLUSÕES')],
  },
  RESENHA: {
    label: 'Resenha Crítica',
    norma: 'NBR 6028:2021',
    icon: <MessageSquareQuote size={24} />,
    description: 'Resumo crítico de uma obra: referência da obra, síntese e apreciação do resenhista.',
    layout: 'article',
    elements: { obraResenhada: 'obr', notaAutores: 'opc' },
    numberedSections: false,
    sections: [sec('')],
  },
};

export const DEFAULT_DOC_TYPE = 'TCC';

// Projetos antigos (sem tipo) eram todos TCC
export const getDocType = (data) => DOCUMENT_TYPES[data?.tipoDocumento] || DOCUMENT_TYPES[DEFAULT_DOC_TYPE];
export const getDocTypeKey = (data) => (DOCUMENT_TYPES[data?.tipoDocumento] ? data.tipoDocumento : DEFAULT_DOC_TYPE);

export const hasElement = (type, el) => Boolean(type.elements?.[el]);
export const isRequired = (type, el) => type.elements?.[el] === 'obr';

// NBR 6028:2021 — palavras-chave separadas por ponto e vírgula e finalizadas por ponto
export const formatKeywords = (text) => {
  if (!text || !text.trim()) return '';
  const terms = text.split(/[;.]|,(?=\s)/).map(t => t.trim()).filter(Boolean);
  return terms.length ? `${terms.join('; ')}.` : '';
};
