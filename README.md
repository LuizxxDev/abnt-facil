# ABNTFácil

**Você escreve. A ABNT fica com a gente.**

Editor gratuito que formata trabalhos acadêmicos nas normas da **ABNT** enquanto o estudante escreve: capa, sumário, referências, paginação em A4 e exportação para PDF e Word. Sem cadastro.

**Acesse: [abnt-facil-home.vercel.app](https://abnt-facil-home.vercel.app)**

Projeto independente, criado por um estudante de Engenharia de Controle e Automação do IFPA Belém. Não tem vínculo com a ABNT nem com o IFPA.

## O que ele faz

- **Pré-visualização em A4 em tempo real**, com paginação de verdade, capa, sumário e margens de 3 cm (superior e esquerda) e 2 cm (inferior e direita).
- **PDF direto**, gerado no servidor, com as mesmas folhas da pré-visualização e sem a janela de impressão.
- **Exportação para Word (.docx)**, com estilos, sumário e listas automáticas do próprio Word.
- **Importação de .docx**: os títulos viram seções, e resumo, abstract, referências, notas e equações vão para os campos certos.
- **Conferência automática** de parte das regras: citações sem referência, formato de citação, tamanho do resumo, palavras-chave, banca e data de aprovação.
- **Gerador de referências** (NBR 6023:2018) para livros, sites, artigos e teses, com a citação pronta para copiar, como `(Silva, 2023)`.
- **Notas de rodapé** (`palavra^[texto da nota]`), numeradas e impressas no pé da folha em que são chamadas.
- **Equações numeradas** em LaTeX (`[EQUAÇÃO]: E = mc^2`) e **alíneas** no formato da NBR 6024.
- **Ficha catalográfica** opcional e **perfil acadêmico** (instituição, curso, cidade e orientador) preenchido nos documentos novos.
- **Dois exemplos completos** (um TCC e um artigo científico) para ver o resultado ou usar como base.
- **Funciona offline** depois da primeira visita (PWA).

## Documentos e normas

| Documento | Norma |
|---|---|
| TCC / Monografia, Dissertação, Tese, Trabalho de Disciplina | NBR 14724:2011 |
| Projeto de Pesquisa | NBR 15287:2011 |
| Relatório Técnico-Científico e Relatório de Estágio | NBR 10719:2015 |
| Artigo Científico | NBR 6022:2018 |
| Resumo Expandido e Resenha Crítica | NBR 6022 e NBR 6028 |

Valem para todos: referências na NBR 6023:2018, citações na NBR 10520:2023, resumos na NBR 6028:2021 e alíneas na NBR 6024. A estrutura de cada tipo (folha de rosto, folha de aprovação, listas, sumário e assim por diante) é definida em `src/utils/documentTypes.jsx`.

> A conferência automática cobre parte das regras. Revise o resultado e o manual da sua instituição antes de entregar.

## Privacidade

- **Sem login**, os documentos ficam só no navegador, neste aparelho.
- **Com login Google**, os documentos são sincronizados no Supabase, protegidos por regras de acesso por usuário (RLS): cada pessoa só lê e altera os próprios.
- **Para gerar o PDF**, o documento passa pelo servidor (Vercel) e não é guardado lá.
- O site não usa cookies, rastreadores nem anúncios.

Detalhes na [Política de Privacidade](https://abnt-facil-home.vercel.app/privacidade) e nos [Termos de Uso](https://abnt-facil-home.vercel.app/termos).

## Tecnologias

- **Interface:** React 19, Vite 7 e Tailwind CSS 4, com fontes hospedadas no próprio site.
- **Nuvem e login:** Supabase (banco, autenticação Google e armazenamento de imagens).
- **PDF:** função na Vercel (`api/pdf.js`) com Puppeteer e Chromium.
- **Word:** biblioteca `docx`, no navegador.
- **Hospedagem:** Vercel. A página inicial é pré-renderizada no build, e as demais telas carregam sob demanda.

## Rodando localmente

Requisitos: Node.js 20.19 ou superior e, para gerar PDF em desenvolvimento, o Google Chrome instalado (ou o caminho dele em `CHROME_PATH`).

```bash
npm install
npm run dev       # servidor local em http://localhost:5173
npm test          # testes (Vitest)
npm run lint
npm run build     # gera dist/ com a página inicial pré-renderizada
npm run preview   # serve o build para conferir
```

Crie um arquivo `.env.local` com as variáveis do seu projeto Supabase. Sem elas, o editor funciona, mas o login e o envio de comentários não.

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica
```

Use apenas a chave **pública** (`anon`/publishable). Nunca coloque uma chave secreta (`service_role`) no código do site.

## Estrutura

```text
api/pdf.js              função que gera o PDF (Vercel)
src/
  views/                landing, painel, editor, 404 e páginas legais
  components/           editor, pré-visualização e peças comuns
  contexts/             estado do app, login e sincronização
  hooks/                autosave, exportação e metadados da página
  utils/                paginação, normas, exportação docx/pdf, importação docx
  lib/supabase.js       cliente do Supabase
public/                 ícones, manifesto, service worker, robots e sitemap
supabase/migrations/    regras de acesso do banco (RLS) e do armazenamento
```

## Banco de dados

As regras de segurança ficam em `supabase/migrations/` e são aplicadas pelo SQL Editor do Supabase ou pela CLI. Os arquivos podem ser executados mais de uma vez.

- `20261027000000_rls.sql`: regras iniciais de documentos, feedback e imagens.
- `20261102000000_rls_reforco.sql`: restringe tudo a usuários logados, limita o feedback e as imagens (5 MB, sem SVG) e fecha a leitura anônima.

## Publicação

Cada push na `main` publica na Vercel. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas variáveis de ambiente do projeto e, no Supabase, coloque o endereço do site em *Authentication → URL Configuration*.

## Comentários, erros e ideias

Achou um erro ou tem uma ideia? Use o botão **Relatar um problema**, no rodapé do site, ou abra uma [issue](https://github.com/LuizxxDev/abnt-facil/issues). Toda mensagem é lida.
