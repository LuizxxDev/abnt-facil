# Auditoria de design — ABNTFácil (fase 1)

Data: 02/11/2026 · Commit auditado: `77de32c` · Só leitura, nenhum arquivo do app foi alterado.

**Como foi feita**
- **Capturas:** Chrome headless, a 1440 px e a 375 px. Os testes de pior caso também a 320 px. Ficam em `design-audit/before/`.
- **Detector automático do impeccable:** rodou no código e nas páginas renderizadas `/` e `/dashboard`.
- **Leitura do código:** comparado com as regras de cada skill:
  - impeccable audit;
  - redesign-existing-projects;
  - web-design-guidelines (regras da Vercel);
  - ui-ux-pro-max, padrão "Notes & Writing App";
  - improve-animations e find-animation-opportunities;
  - break-ui, com dados de pior caso injetados no localStorage;
  - mobile-native.
- **Não testado:** aparelho físico. A emulação não reproduz hover preso, teclado virtual nem área segura.

## Nota geral (impeccable audit)

| # | Dimensão | Nota | Principal achado |
|---|---|---|---|
| 1 | Acessibilidade | 1/4 | Modais sem `role="dialog"`, sem fechar com Esc e sem prender o foco; contraste abaixo de AA no tema escuro |
| 2 | Desempenho | 3/4 | Bom (pré-render, divisão do código em partes); só a barra de progresso anima `width` |
| 3 | Temas | 2/4 | Os tokens existem, mas `settings.theme === 'dark' ? … : …` se repete em dezenas de lugares; o app abre escuro e a landing é clara |
| 4 | Responsivo | 2/4 | Funciona no celular, mas há botões flutuantes que cobrem conteúdo e alvos de toque de 20 px |
| 5 | Integridade | 2/4 | A identidade "papel e tinta verde" é boa, mas a fonte Geist, o itálico serifado no título, o brilho verde e a borda lateral grossa são marcas de site feito por IA |
| **Total** | | **10/20** | **Aceitável. Precisa de trabalho significativo** |

**Veredito de integridade:** passa em parte. A landing tem uma direção própria: papel, verde e uma folha A4 como imagem principal. O painel e o editor são outro produto, escuro por padrão, com chips coloridos, textos de 8–10 px e animações que não funcionam. A ponte entre os dois mundos não existe.

---

## CRÍTICO — impede tarefa ou viola WCAG A/AA de forma grave

| # | Problema | Onde | Impacto | Correção |
|---|---|---|---|---|
| C1 | **Modais sem semântica nem teclado.** Não têm `role="dialog"`, `aria-modal`, Esc, foco inicial ou foco preso. | `src/components/common/Modals.jsx:22` e `:88`<br>`FeedbackModal.jsx:31`<br>`AssetModal.jsx:119`<br>`editor/ReferenceModal.jsx:100`<br>`editor/AttachmentModal.jsx:46` | Leitor de tela e teclado se perdem atrás do modal. Esc não fecha. | Criar um componente `Dialog` único: `role="dialog"`, `aria-modal`, `aria-labelledby`, Esc, foco preso e devolução do foco ao botão de origem. |
| C2 | **Card de projeto (lista): título longo empurra a estrela e o menu ⋮ para fora da tela.** Os botões ficam inalcançáveis. | `src/views/Dashboard.jsx:440–446` (o contêiner flex não tem `min-w-0` no lugar certo) | Não dá para favoritar, duplicar ou apagar um TCC de título longo, que é o caso comum. Ver `before/worst-desktop-dashboard.png`. | `min-w-0` no contêiner `flex-1` (`:441`), `shrink-0` nas ações (`:457`), e `line-clamp-2` + `title` no `h3`. |
| C3 | **Cabeçalho do painel: com nome longo, os botões "Importar .docx" e "Novo documento" somem.** São cortados pelo `overflow-x-auto` sem barra visível. | `src/views/Dashboard.jsx:217–224` | A ação principal da tela some no desktop. | Mostrar só o primeiro nome (já é feito para o Google, `:61`), `line-clamp` no `h1` e as ações numa linha própria. |
| C4 | **Cards clicáveis como `<div onClick>`.** Não recebem foco nem respondem ao Enter. | `Dashboard.jsx:203` (avatar), `:441`, `:488`, `:531` | Quem usa teclado não abre o documento. | Usar `<button>` ou `<Link>` no título do card, com área clicável estendida. |
| C5 | **Botões só com ícone e sem nome acessível.** Abrir, Lixeira, Restaurar, ⋮, estrela, nível ←/→, varinha, excluir seção e arrastar. | `Dashboard.jsx:459`, `:494`, `:496`, `:499`, `:504`, `:509`<br>`EditorForm.jsx:109`, `:115`, `:117`, `:120`, `:121` | O leitor de tela lê "botão" sem dizer o quê. | `aria-label` em cada um; `aria-pressed` na estrela. |
| C6 | **Contraste abaixo de AA** (medido no detector). | `Dashboard.jsx:248` (`#75726a` sobre `#1c1b19`, 3,6:1)<br>`Dashboard.jsx:226`, `:281` (`#52a37a` sobre `#37493d`, 3,2:1)<br>abas do filtro (`#58564f` sobre `#161614`, 2,5:1)<br>`LandingPage.jsx:140` (4,2:1) | Texto ilegível para baixa visão e no sol. | Novos tokens de texto com contraste garantido, ≥ 4,5:1, nos dois temas (ver DESIGN.md). |
| C7 | **No app instalado no iPhone, o conteúdo fica atrás do relógio e do notch.** `black-translucent` com `viewport-fit=cover` e nenhum `env(safe-area-inset-*)`. | `index.html:29`<br>cabeçalhos em `Editor.jsx:327` e `Dashboard.jsx:198` | O botão voltar e o título ficam por baixo da barra de status. | `padding-top: env(safe-area-inset-top)` nos cabeçalhos; botões flutuantes com `env(safe-area-inset-bottom)`. |

## ALTO — dificuldade real ou marca forte de site "feito por IA"

| # | Problema | Onde | Correção |
|---|---|---|---|
| A1 | **Dois produtos visuais.** A landing é clara (papel). O app abre **escuro** por padrão, e o editor no modo leitura usa cabeçalho âmbar escuro (parece marrom). O padrão para apps de escrita (ui-ux-pro-max) é fundo claro tipo papel, com um acento. | `src/contexts/AppContext.jsx:26` (`theme: 'dark'`)<br>`Editor.jsx:301–303` | Tema claro como padrão, escuro opcional; o modo leitura vira uma faixa discreta, não o cabeçalho inteiro tingido. |
| A2 | **Texto funcional de 8–10 px.** 52 ocorrências: rótulos "SEÇÃO PRIMÁRIA" (8 px), "Total"/"Concluídos" (9 px), códigos NBR (10 px), ajudas do formulário, chip "Subseção NVL 2", citação copiada. | `EditorForm.jsx` (27×, ex.: `:110`, `:116`, `:160`, `:286`, `:469`, `:513`, `:515`)<br>`Dashboard.jsx:227`, `:231`, `:313`, `:327`, `:357`<br>`Editor.jsx:334`, `:378`, `:439` | Piso de 12 px (`text-xs`) para texto de interface; 11 px só para metadados em mono. |
| A3 | **A área de escrita é pequena demais.** A caixa tem 160 px de altura e texto de 12 px no desktop, para escrever um TCC inteiro. | `EditorForm.jsx:133–141` (`text-xs h-40`); referências em `:515` (`text-[10px]`) | Texto de 15–16 px, `line-height` 1,6, caixa que cresce com o conteúdo (`field-sizing: content` com fallback) e altura mínima de cerca de 12 linhas. |
| A4 | **As animações `animate-in`, `fade-in`, `zoom-in-95` e `slide-in-*` não fazem nada.** O plugin `tailwindcss-animate` não está instalado (13 usos). Modais, menus, a gaveta do sumário e a lista do painel aparecem "do nada". | `Dashboard.jsx:202`, `:224`, `:280`, `:366`, `:466`, `:511`<br>`Sidebar.jsx:48`<br>`FeedbackModal.jsx:31`<br>`AttachmentModal.jsx:46`<br>`ReferenceModal.jsx:123`<br>`EditorForm.jsx:146` | Remover as classes mortas e criar poucas transições reais, com `@starting-style` e tokens de duração (ver Movimento). |
| A5 | **Fonte Geist em 63–80% do texto** (detector: "fonte superusada"), mais **itálico serifado gigante no título** (detector: o título padrão de startup feita por IA). | `src/index.css:13–14`<br>`LandingPage.jsx:124`, h2 das seções | Trocar o par tipográfico (ver DESIGN.md). |
| A6 | **Chips coloridos com quatro cores** (Citação verde, Tabela âmbar, Imagem e Quadro claros) **e roxo/laranja residual** nos botões "Gerar", "Apêndice" e "Anexo". Fere o "um acento só" que o próprio `index.css` declara. | `EditorForm.jsx:58`, `:318`, `:552`, `:561`<br>`EditorToolbar.jsx` | Uma família neutra para as ações de inserir; o verde só no que é primário. |
| A7 | **Botões flutuantes cobrem conteúdo no celular.** O "+" cobre "Usar como base" (`worst-mobile-dashboard.png`). O olho do editor cobre o canto da caixa de texto e da seção seguinte. | `Dashboard.jsx:253`<br>`Editor.jsx:489` | Reservar espaço no fim da página (`pb` do tamanho do botão + área segura) ou usar uma barra inferior fixa com as duas ações. |
| A8 | **Alvos de toque de 20–28 px.** Nível ←/→ (`p-1` com ícone 12), varinha, lixeira da seção, ⋮ (`p-1.5`), importar/exportar backup (`p-1.5`, ícone 14), zoom. | `EditorForm.jsx:115–121`<br>`Dashboard.jsx:339`, `:342`, `:509`<br>`Editor.jsx:456` | Mínimo de 44×44 no toque (`pointer: coarse`), 32×32 no mouse. |
| A9 | **Abas do editor cortadas a 320 px** ("Documen…", "Pré-textu…", "Referênci…"). | `Editor.jsx:370–379` | Rótulos curtos ("Doc.", "Pré", "Cap.", "Ref.", "Revisão") abaixo de 360 px, ou rolagem horizontal com fade. |
| A10 | **Português de Portugal misturado:** "A Sincronizar Informações...", "Desejas apagar TUDO?", "Cria um novo projeto… para começares", "Eliminar Definitivo", "Eliminado.", "Mover p/ Lixeira". Também "projeto" e "documento" usados para a mesma coisa. | `Dashboard.jsx:191`, `:406`, `:422`, `:476`, `:376` | Revisar os textos para português do Brasil e usar só "documento". |
| A11 | **Exclusão definitiva com `window.confirm`** (feio, fora do tema, sem desfazer). Mover para a lixeira não tem "Desfazer". | `Dashboard.jsx:376`, `:422`<br>`Editor.jsx:329` | Diálogo próprio para apagar de vez; toast com "Desfazer" ao mover para a lixeira. |

## MÉDIO

| # | Problema | Onde | Correção |
|---|---|---|---|
| M1 | **Borda lateral grossa colorida** nas subseções (detector: "side-tab", marca de IA). | `EditorForm.jsx:106` (`border-l-4 border-l-green-200`) | Indicar o nível com recuo e uma linha-guia fina de 1 px, como num sumário. |
| M2 | **Brilho verde** no botão flutuante (detector: "dark-glow"). | `Dashboard.jsx:253` (`shadow-[0_10px_30px_-10px_rgba(31,91,64,0.7)]`) | Sombra neutra de elevação, tingida pelo fundo. |
| M3 | **`transition-all` em 43 lugares.** A barra de progresso anima `width` por 1 s. | `Dashboard.jsx` (14×), `Modals.jsx` (9×), `EditorForm.jsx` (6×)…<br>`Dashboard.jsx:539` | Listar as propriedades; a barra usa `transform: scaleX()`. |
| M4 | **Hierarquia de títulos quebrada:** h1 vai direto para h3 ("Modo local…"). Não há link "pular para o conteúdo". | `Dashboard.jsx:268` | h2/h3 em ordem; link de pular conteúdo no app. |
| M5 | **`theme-color` único e verde** (`#1f5b40`), que não bate com o topo de nenhuma tela. Falta `color-scheme`. | `index.html:27` | Uma cor por tema, igual ao fundo do cabeçalho; atualizar ao trocar o tema; `color-scheme` no `<html>`. |
| M6 | **Ações do card só aparecem no hover** (grid, desktop). | `Dashboard.jsx:491` (`opacity-0 group-hover:opacity-100`) | Mostrar também com `:focus-within`; no toque, o menu ⋮ já cobre essas ações. |
| M7 | **O layout lê `window.innerWidth` durante o render.** Não atualiza ao girar ou redimensionar a tela. | `Dashboard.jsx:364`, `:369` | Classes responsivas (`md:grid`) no lugar da leitura em JS. |
| M8 | **Cards dentro de cards no editor:** seção (card) → barra de ferramentas (card) → caixa de texto (card) → chips. | `EditorForm.jsx:106`, `:131`, `:133` | A seção vira um bloco sem moldura, separado por linha e espaço; a caixa de texto é a única superfície. |
| M9 | **Reticências "..." em vez de "…"**, aspas retas em textos de interface. | `AssetModal.jsx:71`, `:93`<br>`Dashboard.jsx:191`, `:355`<br>`AppContext.jsx:35`, `:163`<br>placeholders em `EditorForm.jsx` | Trocar por "…". |
| M10 | **`prefers-reduced-motion` zera tudo para 0,01 ms**, inclusive o retorno visual útil. | `src/index.css:206–211` | Trocar movimento por troca de opacidade curta, em vez de desligar tudo. |
| M11 | **Não avisa ao sair com algo sendo salvo**, só no botão voltar. | `Editor.jsx:329` | `beforeunload` enquanto `isSaving`. |
| M12 | **Mobile sem `touch-action: manipulation` nem `user-select: none` nos controles;** o cabeçalho e os botões podem ser selecionados num toque longo. | `src/index.css` (base) | Adicionar no `@layer base` (mobile-native, seções 5 e 8). |

## BAIXO

| # | Problema | Onde | Correção |
|---|---|---|---|
| B1 | Rótulos em CAIXA ALTA com tracking apertado ("SEÇÃO PRIMÁRIA", `tracking-tighter`). | `EditorForm.jsx:110` | Caixa normal, 12 px, tracking 0. |
| B2 | Avatar do usuário genérico (ícone de pessoa) num quadrado verde de 56 px. Pesa mais que o próprio título. | `Dashboard.jsx:203–215` | Iniciais ou nada; as configurações num botão comum. |
| B3 | O empty state usa o fantasma (`Ghost`) e o texto "Nenhum projeto por aqui." | `Dashboard.jsx:404–406` | Folha A4 vazia (o mesmo motivo da landing) e o texto "Nenhum documento ainda". |
| B4 | Seletor de ordenação nativo de 10 px sem `background-color` definido. Fica branco no Windows escuro. | `Dashboard.jsx:357` | Fundo e cor explícitos, 12 px. |
| B5 | `Loader` com "A Sincronizar Informações..." em caixa alta piscando (`animate-pulse`). | `Dashboard.jsx:190–191` | Esqueleto do painel no lugar do spinner. |

---

## Movimento (improve-animations + find-animation-opportunities)

**Situação atual**
- Existe o token `--ease-out-strong` (bom).
- A landing usa `reveal` com atraso escalonado (bom, raro e decorativo).
- Há retorno de pressão `scale(0.97)` global (bom).
- Quase todo o resto não funciona (A4).

**Oportunidades que passam no filtro** (todas em transform/opacity, sem animação em atalhos de teclado):

| # | Onde | Hoje | Propósito | Frequência | Movimento sugerido |
|---|---|---|---|---|---|
| 1 | Modais (C1) | Aparecem do nada | Evitar troca brusca | Ocasional | Fundo: opacidade 0→1, 200 ms ease-out.<br>Painel: `opacity 0; translateY(8px) scale(.98)` → repouso, 240 ms `cubic-bezier(.23,1,.32,1)`.<br>Saída: 160 ms. Origem no centro. |
| 2 | Menu ⋮ do card | Aparece do nada | Continuidade espacial | Dezenas/dia | `scale(.96)`+opacidade → 1, 150 ms ease-out, `transform-origin: top right` |
| 3 | Gaveta do sumário (`Sidebar.jsx:48`) | Aparece do nada | Continuidade espacial | Ocasional | `translateX(100%)` → 0, 280 ms `cubic-bezier(.32,.72,0,1)`; fundo em opacidade |
| 4 | Alternar editor ↔ prévia no celular (`Editor.jsx:489`) | Troca instantânea | Evitar troca brusca | Dezenas/dia | Crossfade de 160 ms com opacidade (sem deslocar o texto) |
| 5 | Barra de progresso do card (`Dashboard.jsx:539`) | Anima `width` por 1 s | Indicar estado | Ocasional | `transform: scaleX()` com `origin-left`, 400 ms |

**Recusados**
- **Lista de documentos com entrada escalonada** (`Dashboard.jsx:366`). É vista toda vez que se abre o painel: frequência alta, e não é decorativo.
- **Troca de tema com transição de 300 ms no `body`** (`index.css:105`). Pinta a página inteira; deve ser instantânea.
- **Pré-visualização A4.** É o conteúdo que a pessoa lê; não deve se mexer.
- **Abas do editor.** São trocadas dezenas de vezes por sessão. Basta a cor mudar.

---

## O que já está bom (manter)

- **Identidade da landing:**
  - folha A4 com cotas de margem como imagem principal (é o próprio produto);
  - paleta papel + verde;
  - textura de papel;
  - lista de documentos e de normas em tabela, sem grade de três cards.
- **Uso de `h-dvh`.**
- **Campos com 16 px no celular**, o que evita o zoom do iOS.
- **`tabular-nums` nos números.**
- **Foco visível global** (`:focus-visible`).
- **Pré-render da landing; `tap-highlight` transparente.**
- **Textos da landing:** diretos, em português do Brasil, sem chavões.
- **Do teste de pior caso:**
  - o título longo no cabeçalho do editor trunca certo;
  - os autores longos quebram certo na capa;
  - a folha A4 aguenta título de 5 linhas.

---

# Fases 3 e 4: resultado (02/11/2026)

Capturas de depois em `design-audit/after/`, comparações lado a lado em `design-audit/comparacao-*.jpg`.

| Item | Situação |
|---|---|
| C1 Modais | Feito: componente `Dialog` único (role, aria-modal, Esc, foco preso e devolvido), usado em todos os 6 modais |
| C2 Card com título longo | Feito: `line-clamp-2`, `min-w-0`, ações fixas; testado com título de 260 caracteres |
| C3 Cabeçalho com nome longo | Feito: saudação usa só o primeiro nome; ações em linha própria |
| C4 `<div onClick>` | Feito: card é um `<Link>` com área clicável estendida |
| C5 Botões sem nome | Feito: 0 botões sem nome no painel e no editor (teste automático) |
| C6 Contraste | Feito: tokens novos medidos (todos ≥ 5,1:1 nos dois temas) |
| C7 Área segura | Feito: `safe-top` nos cabeçalhos, `env(safe-area-inset-bottom)` nas barras inferiores |
| A1 Dois produtos visuais | Feito: tema claro padrão (quem já escolheu escuro continua no escuro); faixa discreta de "somente leitura" |
| A2 Texto de 8–10 px | Feito: nenhum `text-[8–10px]` restante no app |
| A3 Área de escrita | Feito: Source Serif 17 px, entrelinha 1,65, cresce com o texto |
| A4 Animações mortas | Feito: classes removidas; entradas reais com `@starting-style` |
| A5 Fontes | Feito: Libre Franklin + Source Serif 4 |
| A6 Chips coloridos | Feito: ações de inserir neutras |
| A7 Botões flutuantes | Feito: painel sem botão flutuante; editor com barra inferior "Editar / Ver folha / Sumário" |
| A8 Alvos de toque | Feito: 44 px no toque (`pointer-coarse`) |
| A9 Abas cortadas | Feito: rótulos curtos abaixo de 400 px |
| A10 Português de Portugal | Feito |
| A11 `confirm()` | Feito: diálogo de confirmação e "Desfazer" na lixeira (o `confirm` ficou só ao sair durante o salvamento na nuvem) |
| Médios e baixos | Feitos, exceto o que está em "Pendências" abaixo |
| Extra (crítica final) | Aviso antes de exportar com ajustes ABNT pendentes; modelos recolhidos quando já há documentos |

**Verificação**
- `eslint` sem avisos.
- 26 testes passam.
- `vite build` concluído, com a landing pré-renderizada.
- 19 testes de interação passam (diálogo, foco, Esc, menu, Desfazer, capa ao vivo, folha no celular, sem rolagem horizontal, sem erros de JS).
- Detector impeccable: código-fonte limpo.

**Pendências e escolhas deliberadas**
- **Fundo papel `#f7f6f1`.** O detector e o inspetor da skill de direção marcam como "creme". Mantido porque é a cor da marca e da folha.
- **Arial dentro das folhas de exemplo.** É a fonte que a ABNT pede para o documento, não a da interface.
- **Título da landing em 3 linhas no celular.** O limite da skill é 2. Manter 2 linhas no celular exigiria trocar o texto ou descer a cerca de 30 px.
- **Sem vídeo na landing.** Não há clipe honesto do assunto.
- **Barra de formatação.** Sugestão da crítica, ainda não feita: mostrar a barra completa só na seção em foco.
- **Ícones PNG do app instalado.** `icon-192.png` e `icon-512.png` não foram redesenhados; só o `favicon.svg` mudou.
