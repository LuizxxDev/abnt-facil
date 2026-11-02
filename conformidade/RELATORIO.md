# Relatório de auditoria: LGPD, segurança, acessibilidade e transparência

**Data:** 02/11/2026 · **Base:** commit `b713bd7` mais as alterações deste trabalho · Diagnóstico inicial em [DIAGNOSTICO.md](DIAGNOSTICO.md).

> Esta é uma auditoria técnica. Ela não substitui análise jurídica individual e não declara que o ABNTFácil está em conformidade total com a legislação.

## A. Resumo executivo

O ABNTFácil é um site estático: React e Vite, hospedado na Vercel. Ele tem uma única função de servidor (`/api/pdf`). Usa o Supabase para login com Google, sincronização, imagens e feedback, e nesses dois casos (login e sincronização) só para quem escolhe entrar com a conta.

O site não tem analytics, publicidade, pagamentos, IA nem cookies próprios.

**Riscos principais encontrados**
- Uma promessa falsa de privacidade: "o texto nunca sai do seu computador". O PDF é gerado no servidor.
- Nenhuma política de privacidade nem termos de uso.
- A exclusão de dados não apagava a nuvem.
- Imagens enviadas ficavam em link público, e o bucket aceitava SVG.
- Ausência de cabeçalhos de segurança.
- A rota de PDF não tinha limite de uso.
- Envio do IP de todo visitante ao Google Fonts.
- Dados fictícios no exemplo de TCC sem aviso.

**Situação atual**
- Os itens técnicos foram corrigidos e testados.
- Ficam pendentes duas frentes:
  - confirmar que as regras de segurança (RLS) estão ativas no Supabase, que está pausado;
  - as decisões do proprietário listadas na seção L.

## B. Inventário técnico

| Recurso | Dados | Finalidade | Onde fica | Terceiros |
|---|---|---|---|---|
| Editor sem login | Texto, nomes (autores, orientador, banca), imagens em base64 | Escrever e formatar | `localStorage` (`ifpa_projects_final_v6`) | — |
| Preferências | Tema, fonte, nome, perfil acadêmico | Lembrar escolhas | `localStorage` (`ifpa_app_settings`) | — |
| Gerar PDF | HTML completo do documento | Gerar o arquivo | Trânsito: `api/pdf.js` não grava nem registra o conteúdo | Vercel |
| Word e importar .docx | Documento | Exportar e importar | No navegador | — |
| Login | Nome, e-mail, foto (Google); token | Conta e sincronização | Supabase Auth; token em `localStorage` (`sb-…-auth-token`) | Google, Supabase |
| Sincronização | Documento inteiro | Guardar na conta | Tabela `projects` | Supabase |
| Imagens com login | Arquivo | Figura no documento | Bucket `project-assets` (link público) | Supabase |
| Feedback | Tipo e mensagem livre | Corrigir e melhorar | Tabela `feedback` (anônima) | Supabase |
| Service worker | Arquivos do site | Uso sem internet | Cache Storage | — |
| PDF no servidor | Nenhum dado pessoal | Fontes Arimo, Tinos e Noto Sans Math | — | Google Fonts, chamado pelo servidor |

**Formulários**
- Novo documento: título e tipo.
- Configurações: nome e perfil, só no navegador.
- Feedback: tipo e mensagem.
- Gerador de referências, figuras e tabelas, apêndices: só no documento.

Nenhum desses formulários pede CPF, telefone, endereço ou pagamento.

## C. Matriz de conformidade

| Área | Situação encontrada | Gravidade | Correção feita | Pendência |
|---|---|---|---|---|
| Transparência da landing | Prometia que o texto "nunca sai do seu computador" | Crítico | Texto corrigido; nova pergunta "Para onde vai o meu texto?" | — |
| RLS no Supabase | Migração existe, mas não foi confirmada em produção | Crítico | SVG retirado do bucket; política de leitura da própria pasta adicionada (necessária para a exclusão) | **Reativar o Supabase e rodar `supabase/migrations/20261027000000_rls.sql`** |
| Política de Privacidade | Não existia | Alto | `/privacidade`, fiel ao código | Controlador e canal de contato (seção L) |
| Termos de Uso | Não existiam | Alto | `/termos` | Revisão jurídica |
| Exclusão de dados | Só apagava o navegador | Alto | Apaga também os documentos e imagens da conta e sai da conta | A conta do Supabase Auth só sai por pedido manual |
| Imagens públicas | `getPublicUrl` permanente | Alto | Aviso na política | Bucket privado com URLs assinadas (exige mudança e teste com o Supabase ativo) |
| SVG no upload | Permitido | Alto | Bloqueado no cliente e na migração | Rodar a migração |
| Cabeçalhos de segurança | Só HSTS (da própria Vercel) | Alto | CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP | Conferir depois do deploy |
| Abuso de `/api/pdf` | Aberto e sem limite | Alto | Só aceita a mesma origem; 8 pedidos por minuto por IP em cada instância | Regra de rate limit no Firewall da Vercel (limite global) |
| Google Fonts | IP de todo visitante enviado ao Google | Médio | Fontes hospedadas no site (`@fontsource`) | — |
| Formulário de feedback | Sem aviso nem limite de tamanho | Médio | Aviso de privacidade e limite de 5000 caracteres (igual à regra do banco) | Prazo de retenção |
| Alegações sobre a ABNT | "Sim, nas normas", selo "ABNT ok" | Médio | Textos ajustados; aviso de que não há vínculo com a ABNT nem com o IFPA | — |
| Exemplo de TCC | Referências e dados inventados, sem aviso; imagem externa | Médio | Nota de rodapé "fictício"; gráfico local no lugar de placehold.co | Substituir por referências reais (opcional) |
| Dependências | Vite com falhas (só no ambiente de desenvolvimento) | Médio | `npm audit fix` (Vite 7.3.7) | Falhas restantes no Vitest exigem atualização maior (só testes) |
| Indexação | Domínio da Vercel responde com `noindex` | Médio | `robots.txt` | Domínio de produção |
| Token na URL | Ficava na URL se o login falhasse | Baixo | Limpo sempre | — |
| Cookies | Nenhum | — | Informado na política; banner desnecessário | Revisar se entrar analytics |

## D. LGPD

**Dados pessoais tratados**
- Nome, e-mail e foto do Google, só com login.
- IP e dados técnicos, nos registros da Vercel e do Supabase.
- Conteúdo dos trabalhos, que pode conter dados pessoais do autor e de terceiros e, em temas de saúde, até dados sensíveis (art. 5º, II).
- Mensagens de feedback.

Não há coleta de CPF, telefone, endereço ou dados de pagamento.

**Bases legais a confirmar (art. 7º)**

| Operação | Base legal | Justificativa |
|---|---|---|
| Guardar e sincronizar documentos, conta, gerar PDF | Execução do serviço pedido pelo titular (art. 7º, V) | O titular pede o serviço; o login é opcional |
| Feedback e registros técnicos | Legítimo interesse (art. 7º, IX) | Corrigir erros e proteger o serviço |

Não se usa o consentimento como base geral, porque não há rastreamento.

**Compartilhamento:** Vercel, Supabase e Google (login). Há possível transferência internacional (art. 33): a região do Supabase e a da função na Vercel não foram confirmadas.

**Direitos dos titulares (art. 18)**

| Direito | Como o titular exerce |
|---|---|
| Acesso e portabilidade | Botão de cópia de segurança (JSON) |
| Correção | Edição no próprio editor |
| Eliminação | "Apagar todos os seus dados", que agora inclui a nuvem |
| Exclusão da conta de autenticação | Pedido pelo formulário; não há backend para automatizar (exige a chave `service_role`, que não pode ir para o frontend) |

**Agente e encarregado:** o controlador provável é o mantenedor (Luiz Felipe), mas isso depende de confirmação (seção L). Pela Resolução CD/ANPD nº 2/2022, um agente de pequeno porte pode ser dispensado de indicar encarregado, mas precisa manter um canal de comunicação com o titular (art. 11). Hoje, o canal publicado é o formulário, que é anônimo. Um e-mail de contato depende do proprietário.

**Retenção:**
- Navegador e conta: até o usuário apagar.
- PDF: nada é retido.
- Feedback: **sem prazo**. Proposta: 12 meses, ou apagar depois de tratado.
- Registros da Vercel e do Supabase: pelos prazos dos fornecedores (a confirmar).

**Crianças e adolescentes (art. 14):** o público pode incluir estudantes de ensino técnico integrado, menores de 18 anos. A política orienta a usar o editor sem conta. A decisão sobre restringir o login a maiores de idade é do proprietário.

## E. Cookies e armazenamento

- **Cookies:** nenhum criado pelo site.
- **`localStorage`:**
  - documentos: necessário;
  - preferências: preferência;
  - sessão do Supabase: necessário, só com login.
- **Cache Storage:** necessário para o uso offline.

**Teste no build de produção, com a CSP ativa:** nenhum pedido a hosts externos e nenhuma violação de CSP.

**Conclusão:** **não é necessário banner de consentimento.** Se um dia entrarem analytics ou publicidade, será preciso consentimento prévio e bloqueio dos scripts até a escolha.

## F. Segurança

**Verificado**
- `.env` não está versionado: nenhum arquivo `.env` aparece no histórico do Git.
- A única chave no frontend é a chave pública do Supabase (`anon`). Ela é pública por design e a proteção depende da RLS.
- `api/pdf.js` remove `<script>`, limita o tamanho a 4 MB, bloqueia pedidos a redes privadas (SSRF) e não registra o conteúdo nos logs.
- Não existe painel de administração nem rota administrativa.

**Riscos residuais**
- RLS não confirmada (crítico, depende do proprietário).
- Imagens em link público.
- Limite de pedidos por instância, não global.
- SSRF via DNS: um domínio público que aponta para um IP privado ainda passa no filtro por nome.
- 9 falhas em dependências de teste (Vitest).

**CSP aplicada:** `default-src 'self'`, `script-src 'self'`, `style-src 'self' 'unsafe-inline'`, `img-src 'self' data: blob: https:`, `connect-src 'self' https://*.supabase.co wss://*.supabase.co`, `frame-ancestors 'none'`, entre outras. `'unsafe-inline'` em estilos é necessário porque a prévia usa `style` e `<style>` dinâmicos.

## G. Acessibilidade (WCAG 2.2 AA)

- Corrigido no redesign anterior:
  - diálogos acessíveis;
  - foco visível;
  - contraste dentro do AA;
  - alvos de 44 px;
  - nomes acessíveis;
  - movimento reduzido.
- Neste trabalho:
  - páginas legais com link "pular para o conteúdo", hierarquia de títulos, tabela com `caption` e `th scope`, e linhas de no máximo 66 caracteres;
  - aviso do feedback ligado ao campo por `aria-describedby`.
- Testes automáticos (19 interações) passam: foco, Esc, nome acessível, sem rolagem horizontal.
- **Não testado:** leitor de tela real (NVDA, TalkBack) e zoom de 200% em aparelho físico.
- **LBI, art. 63:** a obrigação se aplica a sites mantidos por empresas com sede ou representação comercial no País ou por órgãos de governo. A aplicação a um projeto de pessoa física depende de análise. A acessibilidade foi adotada como boa prática. O § 1º prevê símbolo de acessibilidade em destaque, ainda não incluído (pendente de decisão).

## H. Conteúdo e transparência

- **Depoimentos:** a citação "Sei o que é passar a madrugada…" é do próprio mantenedor, identificado. Não foram encontrados depoimentos de terceiros, contadores falsos, selos ou logos de instituições.
- **Alegações corrigidas:**
  - privacidade ("nunca sai do seu computador");
  - "O PDF sai mesmo nas normas? Sim";
  - selo "ABNT ok", agora "Sem alertas";
  - "Tudo certo" na revisão, agora "Nenhum alerta", com explicação do alcance.
- **Avisos incluídos:** no rodapé e nos termos, que não há vínculo com a ABNT nem com o IFPA e que não há garantia de aprovação.
- **Exemplos:** os dois documentos de exemplo avisam que os dados são fictícios.
- **Pendente:** o nome "ABNTFácil" usa a sigla de uma entidade. O risco de marca deve ser avaliado juridicamente.

## I. Legislação aplicável

Fontes consultadas em 02/11/2026.

| Norma | Pontos pertinentes | Aplicabilidade | Obrigação ou ação |
|---|---|---|---|
| LGPD, [Lei 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm) | Arts. 6º, 7º, 9º, 14, 18, 33, 41 e 46 | Aplica-se: há tratamento de dados pessoais | Transparência (política feita), canal do titular (pendente: e-mail), segurança, direitos |
| [Res. CD/ANPD nº 2/2022](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022) | Agentes de pequeno porte; art. 11 (dispensa de encarregado com canal de comunicação) | Provável, a confirmar o enquadramento | Manter um canal; o tratamento de dados sensíveis pode afastar o regime simplificado |
| Marco Civil, [Lei 12.965/2014](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm) | Art. 7º (direitos do usuário); art. 15 (guarda de registros por 6 meses) | O art. 15 vale para pessoa jurídica com fins econômicos; para pessoa física sem fins econômicos, provavelmente não | Depende da forma de operação (seção L) |
| CDC, Lei 8.078/1990 | Informação clara e publicidade | Serviço gratuito com doações: a existência de relação de consumo depende de análise | As alegações foram corrigidas por boa prática |
| Decreto 7.962/2013 | Comércio eletrônico | Não se aplica hoje: não há venda | Rever se houver cobrança |
| LBI, [Lei 13.146/2015](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm) | Art. 63 | Ver seção G | Boa prática adotada |
| Direitos autorais, Lei 9.610/1998 | Titularidade do conteúdo do usuário; citação (art. 46, III) | Aplica-se | Termos esclarecem que o conteúdo é do usuário |
| LGPD art. 14 e [enunciado da ANPD](https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-divulga-enunciado-sobre-o-tratamento-de-dados-pessoais-de-criancas-e-adolescentes) | Melhor interesse; consentimento parental para crianças | Possível uso por adolescentes | Orientação na política; decisão pendente |

## J. Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `src/views/LandingPage.jsx` | Alegações corrigidas; FAQ sobre o destino do texto e o vínculo com a ABNT; links legais e aviso no rodapé |
| `src/views/Editor.jsx` | "Sem alertas" e explicação do alcance da conferência |
| `src/views/PrivacyPage.jsx`, `src/views/TermsPage.jsx`, `src/components/common/LegalLayout.jsx` | Páginas novas |
| `src/App.jsx` | Rotas `/privacidade` e `/termos` |
| `src/contexts/AppContext.jsx` | `deleteAllMyData` (nuvem e navegador); token removido da URL quando o login falha |
| `src/views/Dashboard.jsx`, `src/components/common/Modals.jsx` | Exclusão real e textos explicativos |
| `src/components/common/FeedbackModal.jsx` | Aviso de privacidade e limite de tamanho |
| `src/components/common/AssetModal.jsx` | SVG bloqueado |
| `supabase/migrations/20261027000000_rls.sql` | Sem SVG; leitura da própria pasta |
| `api/pdf.js` | Mesma origem e limite por IP |
| `vercel.json` | Cabeçalhos de segurança e CSP |
| `src/main.jsx`, `src/index.css`, `index.html`, `src/utils/math.js`, `src/utils/pdfExport.js`, `vite.config.js`, `package.json` | Fontes hospedadas no site |
| `src/utils/exampleChart.js`, `src/utils/exampleArticle.js`, `src/utils/constants.jsx` | Gráfico local; aviso de dados fictícios no TCC |
| `public/robots.txt` | Novo |
| `package-lock.json` | `npm audit fix` e pacotes de fonte |

## K. Testes realizados

- `npx eslint src api`: sem erros.
- `npx vitest run`: 26 testes passam.
- `vite build`: ok, com a landing pré-renderizada.
- **Build de produção com os cabeçalhos do `vercel.json`**, num servidor local que também roda a função `/api/pdf`:
  - CSP sem violações;
  - nenhum host externo chamado;
  - fontes locais carregadas;
  - `/privacidade` e `/termos` abrem;
  - artigo com equação e gráfico renderiza;
  - `.docx` e PDF baixados.
- **`/api/pdf`:**
  - origem de outro site → 403;
  - 10 pedidos seguidos → 8 aceitos e 2 com 429;
  - cabeçalhos presentes.
- **Testes de interação** (19), no servidor de desenvolvimento: todos passam.
- Detector do impeccable na página de privacidade: só avisos de comprimento de linha (corrigidos) e da cor de fundo da marca.

**Não executado:**
- **Exclusão com login e a RLS:** o Supabase está pausado. Não houve teste contra dados reais.
- **Leitor de tela real.**
- **Cabeçalhos no domínio de produção:** só depois do deploy.

## L. Pendências do proprietário

1. **Reativar o projeto Supabase e rodar a migração de RLS.** Depois, confirmar que um usuário não lê os documentos de outro. Este é o item crítico.
2. **Responsável.** O ABNTFácil é operado por você como pessoa física, ou existe empresa ou CNPJ? Posso publicar o seu nome completo na política?
3. **Canal de privacidade.** Qual e-mail pode ser publicado para pedidos de privacidade? (Hoje `abntfacil9@gmail.com` aparece como chave PIX.)
4. **Regiões dos dados.** Em que região está o projeto Supabase? E a função `/api/pdf` na Vercel, roda em qual região (padrão ou `gru1`)?
5. **Prazo do feedback.** Qual prazo de retenção quer adotar para as mensagens? Proposta: 12 meses.
6. **Menores de idade.** O login deve ser restrito a maiores de 18 anos, ou basta a orientação atual?
7. **Imagens.** Aceita trocar o bucket público por privado com URLs assinadas? Isso exige uma mudança no código, testada com o Supabase ativo.
8. **Domínio.** Pretende usar um domínio de produção? O endereço atual não é indexado pelo Google.
9. **Símbolo de acessibilidade.** Deseja exibir o símbolo de acessibilidade (LBI, art. 63, § 1º)?
10. **Revisão jurídica.** Recomenda-se revisão jurídica do nome "ABNTFácil", por usar a sigla da ABNT, e dos textos da Política e dos Termos antes de considerá-los finais.
