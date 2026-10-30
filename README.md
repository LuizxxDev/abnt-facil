# ABNTFácil — editor acadêmico nas normas ABNT

O **ABNTFácil** formata trabalhos acadêmicos nas normas da **ABNT** enquanto o estudante escreve. Foi desenvolvido de forma independente por um aluno de **Engenharia de Controle e Automação do IFPA Belém**.

**Acesse:** https://abnt-facil-luiz-s-projects-bbeace80.vercel.app

## Funcionalidades

- **Pré-visualização em A4 em tempo real**, com paginação real, capa, sumário e margens de 3/2 cm.
- **PDF direto**: gerado no servidor, sem a janela de impressão, com as mesmas folhas da pré-visualização.
- **Exportação para Word (.docx)**, com estilos, sumário e listas automáticas do próprio Word.
- **Verificações da norma**: citações sem referência, formato de citação da NBR 10520:2023, tamanho do resumo, palavras-chave, banca e data de aprovação.
- **Gerador de referências** (NBR 6023:2018) para livros, sites, artigos e teses.
- **Ficha catalográfica** opcional no verso da folha de rosto.
- **Perfil acadêmico**: instituição, curso, cidade e orientador preenchidos automaticamente nos novos documentos.
- **Funciona offline** depois da primeira visita (PWA). Sem login, os documentos ficam no navegador; com login Google, são sincronizados no Supabase.

## Tipos de documento e normas

| Documento | Norma | Estrutura gerada automaticamente |
|---|---|---|
| TCC / Monografia, Dissertação, Tese | NBR 14724:2011 | Capa, folha de rosto, ficha catalográfica, folha de aprovação com banca, dedicatória, agradecimentos, epígrafe, resumo e abstract, listas de ilustrações e tabelas, sumário |
| Trabalho de Disciplina | NBR 14724:2011 | Capa, folha de rosto, sumário |
| Projeto de Pesquisa | NBR 15287:2011 | Folha de rosto, sumário; tema, problema, hipóteses, objetivos, justificativa, metodologia, recursos e cronograma |
| Relatório Técnico-Científico e de Estágio | NBR 10719:2015 | Folha de rosto, resumo na língua vernácula, sumário |
| Artigo Científico | NBR 6022:2018 | Título (e em outro idioma), autoria com nota de rodapé, resumo de 100–250 palavras, texto contínuo |
| Resumo Expandido e Resenha Crítica | NBR 6022 / 6028 | Texto contínuo; a resenha começa pela referência da obra |

Regras comuns: figuras, tabelas e quadros numerados; referências em ordem alfabética com título em negrito (NBR 6023:2018); palavras-chave separadas por ponto e vírgula (NBR 6028:2021); citações no formato (Silva, 2023) da NBR 10520:2023.

## Tecnologias

- **Interface:** React 19, Vite 7 e Tailwind CSS 4.
- **Nuvem e login:** Supabase (banco, autenticação Google e armazenamento de imagens).
- **PDF:** função na Vercel (`api/pdf.js`) com Puppeteer e Chromium.
- **Word:** biblioteca `docx`, no navegador.

## Desenvolvimento

```bash
npm install
npm run dev      # servidor local (o PDF usa o Chrome instalado na máquina)
npm test         # testes (Vitest)
npm run lint
npm run build    # gera dist/ com a página inicial pré-renderizada
```

Variáveis de ambiente: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. As regras de segurança do banco (RLS) ficam em `supabase/migrations/` e são executadas no SQL Editor do Supabase.
