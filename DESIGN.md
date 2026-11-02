# DESIGN.md — ABNTFácil

Proposta da fase 2. Nada disso está aplicado ainda.

## Direção: "A folha com margem"

> Nesta interface, **a folha A4 com as margens da ABNT (3 cm em cima e à esquerda, 2 cm embaixo e à direita)** vira **o único motivo visual do sistema**.

**De onde veio.** O `design-taste-frontend` sorteou três direções: "One motif", "Sentence as layout" e "Borrowed category". Foi escolhida a **One motif**, com a semente 1382657260 e a paleta mantida da marca.

**Por que essa.** A folha com margens assimétricas de 3/2 cm é algo que só este produto tem.
- No teste do concorrente, "uma folha em branco" serviria para qualquer editor de texto.
- "Uma folha com 3 cm à esquerda e 2 cm à direita" só serve para a ABNT.
- A landing atual já usa essa folha como imagem principal. A proposta estende a mesma ideia ao painel e ao editor, em vez de criar uma segunda.

**Onde a folha aparece**, sempre a mesma forma (retângulo na proporção √2, com a caixa de margem deslocada 3:2):

| Escala | Uso |
|---|---|
| Gigante | Hero da landing: uma pilha de folhas com abas (os tipos de documento). A da frente é a capa ao vivo. |
| Média | Empty state do painel: uma folha vazia com a margem tracejada. |
| Pequena | Miniatura de cada documento no painel, no lugar do ícone genérico `FileText`, mostrando o progresso como preenchimento da área útil. |
| Mínima | Favicon e o indicador de carregamento (a folha se preenchendo de linhas). |

**A coisa viva da landing.** Você digita o título do trabalho e o seu nome, e a capa da folha da frente se monta na hora, em caixa alta e centralizada, como na NBR 14724. Sem JavaScript, mostra a capa de exemplo atual.

**Como a direção dá errado.** Quando aparece um segundo motivo: círculos, blobs, ícones decorativos. Só a folha. Todo o resto é texto, espaço e um verde.

### Modos

- **Landing: Persuade.** Escala grande, a folha como herói, imagens reais.
- **Painel e editor: Operate.** Precisão e calma. A marca aparece nos detalhes: a folha em miniatura, o verde só na ação principal, a serifa na área de escrita.

## Tipografia

Par sorteado: **Libre Franklin** (gótica americana) + **Source Serif 4** (serifa de leitura). É o par da primeira página de jornal, e combina com quem escreve texto acadêmico.

| Papel | Fonte | Peso | Ajustes |
|---|---|---|---|
| Títulos (landing e app) | Libre Franklin | 700 | tracking −0,03em, entrelinha 0,95–1,1 |
| Interface (botões, rótulos, menus) | Libre Franklin | 400 / 500 / 600 | tracking 0 |
| Leitura longa e **área de escrita do editor** | Source Serif 4 | 400 / 600 / itálico | entrelinha 1,6, 60–75 caracteres por linha |
| Números (NBR, contagens, %) | Libre Franklin | `tabular-nums` | sem monoespaçada |

**O que sai:**
- Geist e Geist Mono, que o detector marcou como fontes superusadas;
- Instrument Serif em itálico no título, outra marca de site feito por IA;
- o código NBR em monoespaçada.

**Por que a serifa no editor.** Quem escreve um TCC vê o texto como texto de trabalho, e não como formulário. Hoje são 12 px de sans numa caixinha.

### Escala (5 passos na landing, 6 no app)

```css
/* Landing */
--step-small: clamp(0.8125rem, 0.79rem + 0.1vw, 0.875rem);  /* 13–14 */
--step-body:  clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem);    /* 17–19 */
--step-lead:  clamp(1.25rem, 1.1rem + 0.7vw, 1.625rem);      /* 20–26 */
--step-head:  clamp(2rem, 1.3rem + 3.2vw, 4rem);             /* 32–64 */
--step-hero:  clamp(3rem, 1.5rem + 6.5vw, 8.5rem);           /* 48–136 */

/* App (Operate) — piso de 12 px para qualquer texto de interface */
--text-meta: 0.75rem;    /* 12 — metadados, ajuda de campo */
--text-ui:   0.875rem;   /* 14 — botões, rótulos, listas */
--text-body: 1rem;       /* 16 — campos, descrições */
--text-write: 1.0625rem; /* 17 — área de escrita (serifa) */
--text-title: 1.25rem;   /* 20 — títulos de painel/modal */
--text-page: 1.75rem;    /* 28 — título da tela */
```

## Cor

Mantida da marca, com papel quente, tinta e um único verde. Os tons de texto foram recalibrados para passar no **WCAG AA** nos dois temas. Contrastes medidos por script sobre `--paper` (claro) e `--surface` (escuro).

### Claro (passa a ser o padrão do app, como a landing)

| Token | Valor | Uso | Contraste |
|---|---|---|---|
| `--paper` | `#F7F6F1` | fundo | — |
| `--surface` | `#FFFFFF` | folha, campo, painel | — |
| `--surface-2` | `#EFEEE8` | degrau de tom (separa áreas sem linha) | — |
| `--ink` | `#1C1B19` | texto principal | 15,9:1 |
| `--ink-2` | `#56544D` | texto secundário | 7,0:1 |
| `--ink-3` | `#6B6961` | metadados (mínimo) | 5,1:1 |
| `--line` | `#DEDCD3` | borda de campo e de tabela (só controles) | — |
| `--accent` | `#1F5B40` | ação principal, foco, seleção | 7,4:1 |
| `--accent-hover` | `#174631` | hover/pressionado | 9,9:1 |
| `--accent-soft` | `#E4EFE8` | fundo de item ativo | — |
| `--on-accent` | `#FFFFFF` | texto sobre o verde | 8,0:1 |
| `--warn` / `--warn-soft` | `#7A5316` / `#FBF3E2` | avisos de norma | 6,3:1 |
| `--danger` / `--danger-soft` | `#A3302A` / `#FBECEA` | apagar, erro | 6,4:1 |

### Escuro (opcional)

| Token | Valor | Contraste |
|---|---|---|
| `--paper` | `#131311` | — |
| `--surface` | `#1C1B19` | — |
| `--surface-2` | `#25241F` | — |
| `--ink` | `#EFEEE9` | 14,8:1 |
| `--ink-2` | `#BAB7AD` | 8,6:1 |
| `--ink-3` | `#9F9C92` | 6,3:1 |
| `--line` | `#34332E` | — |
| `--accent` (texto/ícone) | `#6CB892` | 7,3:1 |
| `--accent-fill` (botão) | `#2A7652` com texto `#FFFFFF` | 5,5:1 |
| `--warn` | `#E0B562` | 9,0:1 |
| `--danger` | `#F08A80` | 7,1:1 |

**Regras**
- O verde aparece na ação principal de cada tela e no estado ativo. Em mais nada.
- Saem os chips coloridos (verde, âmbar, roxo, laranja).
- Áreas se separam por **degrau de tom** (`--paper` → `--surface` → `--surface-2`), não por borda nem sombra.
- Borda de 1 px só em campos de formulário, tabelas e na folha A4, que é o próprio produto.
- A pré-visualização A4 fica sempre branca com texto preto, em qualquer tema.

## Espaço

Base de 4 px: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 160`.

- **Margens da página:** 16 px no celular, 32 px no tablet, 48 px no desktop.
- **Landing:** 120–160 px entre seções no desktop e 72–96 px no celular, sempre maior que qualquer espaço interno.
- **App:** 24 px entre grupos, 12 px dentro de grupo, 8 px entre controles.
- **Alvos de toque:** 44×44 com `pointer: coarse`, 32×32 com mouse.

## Raios

Um raio para controles e um para contêineres, e nada além disso.

| Token | Valor | Uso |
|---|---|---|
| `--radius-control` | `6px` | botões, campos, chips, abas |
| `--radius-panel` | `10px` | painéis, menus, diálogos |
| `--radius-sheet` | `2px` | a folha A4 e as miniaturas (papel tem canto vivo) |
| `--radius-pill` | `999px` | só o botão flutuante e os contadores |

## Sombras

Nada em repouso tem sombra. Só o que flutua:

```css
--shadow-float: 0 12px 32px -12px rgb(28 27 25 / 0.28), 0 2px 6px rgb(28 27 25 / 0.08);  /* menu, diálogo, botão flutuante */
--shadow-sheet: 0 1px 2px rgb(28 27 25 / 0.06), 0 8px 24px -16px rgb(28 27 25 / 0.25);   /* a folha A4 */
```

Sem brilho colorido. No tema escuro, as sombras usam preto puro com mais opacidade (0,5) e o degrau de tom faz o resto.

## Movimento

```css
--ease-out:    cubic-bezier(0.23, 1, 0.32, 1);    /* entradas, pressão */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);    /* gaveta, folha */
--dur-press: 120ms;  --dur-fast: 160ms;  --dur-base: 220ms;  --dur-drawer: 280ms;
```

- Só `transform` e `opacity`.
- **Pressão:** `scale(0.97)` por 120 ms em todo botão.
- **Menus:** escala 0,96 → 1 a partir do gatilho, 160 ms.
- **Diálogo:** `translateY(8px) scale(.98)` → repouso, 220 ms; sai em 160 ms.
- **Gaveta do sumário:** `translateX(100%)` → 0, 280 ms.
- **Editor ↔ prévia no celular:** crossfade de 160 ms.
- **Com `prefers-reduced-motion`:** troca por opacidade de 120 ms e mantém o retorno visual. Não zera tudo.
- **Landing:** entrada escalonada de 60–90 ms por seção, uma vez.
- **Assinatura da landing:** as abas da pilha de folhas sobem ao apontar ou focar, e a capa ao vivo se reescreve enquanto se digita.
- **Nunca animar:**
  - a troca de abas do editor;
  - a lista do painel;
  - a troca de tema;
  - a prévia A4.

## Componentes-chave

- **Botão primário:** fundo `--accent`, texto branco, 600, `--radius-control`, altura 40 (44 no toque), sem sombra.
- **Botão secundário:** fundo `--surface-2`, texto `--ink`.
- **Botão terciário:** só texto, sublinhado no hover.
- **Botão de ícone:** quadrado de 36 (44 no toque) com `aria-label` e tooltip.
- **Diálogo:** um componente só, com `role="dialog"`, Esc, foco preso e `--shadow-float`.
- **Card de documento:** miniatura de folha à esquerda, título em Libre Franklin 600 com `line-clamp-2`, linha de metadados em `--ink-3` 12 px e menu ⋮ que nunca sai da tela. O card inteiro é um link.
- **Seção no editor:**
  - sem moldura de card;
  - título da seção em Libre Franklin 600;
  - o nível aparece como recuo e uma linha-guia de 1 px;
  - a área de escrita em Source Serif 17 px cresce com o texto.

## Proibido neste projeto

- Gradientes.
- Brilhos coloridos.
- Vidro (`backdrop-blur`) em painéis.
- Borda lateral grossa colorida.
- Cards dentro de cards.
- Rótulos minúsculos em caixa alta com espaçamento.
- Monoespaçada fora de código.
- Emoji como ícone.
- Roxo e índigo.
- Itálico serifado como destaque de título.
- Texto de interface abaixo de 12 px.
