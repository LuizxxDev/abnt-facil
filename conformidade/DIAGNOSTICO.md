# Diagnóstico inicial: conformidade, privacidade, segurança e acessibilidade

**Data:** 02/11/2026. Inspeção do código no commit `b713bd7` e do site publicado (`abnt-facil-luiz-s-projects-bbeace80.vercel.app`). Nenhum arquivo foi alterado antes deste diagnóstico.

## Como o ABNTFácil funciona hoje (verificado no código)

| Recurso | Dados | Onde ficam | Quem recebe |
|---|---|---|---|
| Editor sem login | Todo o texto do trabalho, nomes de autores, orientador e banca, imagens coladas (base64) | `localStorage` do navegador (`ifpa_projects_final_v6`) | Ninguém, enquanto só edita |
| Preferências | Tema, fonte, nome escolhido, perfil acadêmico (instituição, curso, cidade, orientador) | `localStorage` (`ifpa_app_settings`) | Ninguém |
| **Baixar PDF** | **HTML completo do documento**, incluindo texto, nomes e imagens | Enviado a `/api/pdf` (função na Vercel), que gera o PDF e devolve; o código não grava nem registra o conteúdo | **Vercel** (hospedagem, fora do Brasil) |
| Baixar Word / importar .docx | Documento | Processado no próprio navegador | Ninguém |
| Login com Google | Nome, e-mail e foto do Google; token de sessão | Supabase Auth; token no `localStorage` (`sb-…-auth-token`) | **Google** e **Supabase** |
| Sincronização (com login) | Documento inteiro, autores, checklist | Tabela `projects` no Supabase | **Supabase** |
| Imagens (com login) | Arquivo de imagem | Bucket `project-assets` no Supabase, **com link público** | **Supabase**; qualquer pessoa que tenha o link |
| "Fale com o desenvolvedor" | Tipo e texto livre (pode conter dados pessoais) | Tabela `feedback` no Supabase, sem prazo de exclusão | **Supabase** |
| Fontes do site | Endereço IP e navegador do visitante, em toda visita | — | **Google Fonts** |
| Equações | IP do visitante, quando o documento tem equação | — | Google Fonts (fonte matemática) |
| TCC de exemplo | IP do visitante | — | **placehold.co** (imagem externa do exemplo) |
| Service worker | Cópia dos arquivos do site | Cache do navegador | Ninguém |

**Não existem no código:** analytics, pixels de publicidade, cookies próprios (`document.cookie` não é usado), pagamentos, IA, newsletter, telefone, CPF ou endereço.

## Riscos encontrados

| # | Gravidade | Problema | Evidência |
|---|---|---|---|
| 1 | **Crítico** | A landing promete que, sem login, "o texto nunca sai do seu computador" e que "tudo fica salvo só no seu navegador". Isso é falso: ao baixar o PDF, o documento inteiro vai para o servidor. | `LandingPage.jsx` (FAQ e lista de recursos); `pdfExport.js` envia `doc.innerHTML` para `/api/pdf` |
| 2 | **Crítico (depende do proprietário)** | Não foi possível confirmar que as regras de segurança do banco (RLS) estão ativas. O projeto Supabase está pausado e a migração nunca foi verificada em produção. Sem RLS, a chave pública permitiria ler os documentos de todos os usuários. | `supabase/migrations/20261027000000_rls.sql`; projeto `abnt-facil` com status INACTIVE |
| 3 | Alto | Não há Política de Privacidade nem Termos de Uso; o responsável e o canal para pedidos de privacidade não estão identificados (LGPD art. 9º; Resolução CD/ANPD nº 2/2022, art. 11). | Nenhuma rota `/privacidade` ou `/termos` |
| 4 | Alto | "Apagar todos os documentos" só limpa o navegador. Com login, os documentos continuam no Supabase, e o usuário acha que apagou tudo. | `Dashboard.jsx` (`localStorage.clear()`) |
| 5 | Alto | Imagens enviadas com login ficam em link público permanente. | `AssetModal.jsx` usa `getPublicUrl` |
| 6 | Alto | O bucket aceita SVG, que pode carregar script. | Migração: `allowed_mime_types` inclui `image/svg+xml` |
| 7 | Alto | Não há cabeçalhos de segurança (CSP, `X-Frame-Options`/`frame-ancestors`, `nosniff`, `Referrer-Policy`). Só o HSTS, que a Vercel já envia. | `curl -I` no site; `vercel.json` |
| 8 | Alto | `/api/pdf` é aberto a qualquer origem, sem limite de uso, e cada chamada abre um Chrome (custo e risco de abuso). | `api/pdf.js` |
| 9 | Médio | Google Fonts é carregado em toda visita: o IP vai para o Google sem necessidade. | `index.html`, `math.js` |
| 10 | Médio | O formulário de feedback não avisa onde o texto fica nem orienta a não incluir dados pessoais, e não tem limite de tamanho no cliente. | `FeedbackModal.jsx` |
| 11 | Médio | Afirmações absolutas: "O PDF sai mesmo nas normas? Sim", o selo "ABNT ok" e "Tudo certo" na revisão. Nada esclarece que o site não tem ligação com a ABNT. | `LandingPage.jsx`, `Editor.jsx` |
| 12 | Médio | O TCC de exemplo traz referências e dados de pesquisa inventados, apresentados como reais, e uma imagem externa (placehold.co). | `constants.jsx` (`EXAMPLE_PROJECT`) |
| 13 | Médio | Vulnerabilidades no Vite, que só afetam o servidor de desenvolvimento (7 altas, 1 baixa). | `npm audit` |
| 14 | Médio | O domínio publicado responde `X-Robots-Tag: noindex` (endereço de deployment da Vercel): o site não aparece no Google. | `curl -I` |
| 15 | Baixo | Se o login falha, o token fica na URL (`#access_token`). | `AppContext.jsx` |
| 16 | Baixo | Não há `robots.txt`, e o rodapé não tem links legais. | `public/` |

**Cookies:** nenhum cookie é criado pelo site. O que existe é armazenamento local necessário (documentos e sessão), preferências e o cache do service worker. Por isso, **não é preciso banner de consentimento**: basta informar essas tecnologias na política. Essa conclusão vale enquanto não entrarem analytics ou publicidade.
