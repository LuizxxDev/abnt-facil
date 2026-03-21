# 🎓 Editor TCC IFPA - Academics

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

Um editor de texto acadêmico focado na normalização automática para trabalhos do **IFPA (Instituto Federal do Pará)** seguindo as normas da **ABNT**. O projeto permite a criação, edição e exportação de TCCs, Artigos e Relatórios diretamente pelo navegador, com persistência local de dados.

---

## ✨ Funcionalidades Principais

* **📄 Formatação ABNT Automática:** Margens, fontes (Arial/Times), espaçamentos e recuos configurados automaticamente.
* **👁️ Visualização em Tempo Real:** Editor dividido (Split-screen) com formulário à esquerda e pré-visualização da folha A4 à direita.
* **🖨️ Exportação PDF Nativa:** Geração de arquivos PDF vetoriais perfeitos usando o motor de impressão do navegador (sem cortes ou páginas em branco).
* **💾 Persistência Local:** Todos os dados são salvos automaticamente no `localStorage` do navegador. Nada é perdido ao fechar a aba.
* **🌙 Modo Escuro:** Interface adaptável para ambientes com pouca luz.
* **drag-n-drop:** Reorganização de capítulos arrastando os itens.
* **🖼️ Upload de Imagens:** Suporte para imagens locais (convertidas para Base64) e via URL.

---

## 🛠️ Tech Stack

* **Core:** React.js (Vite)
* **Estilização:** Tailwind CSS
* **Ícones:** Lucide React
* **Roteamento:** React Router DOM
* **Notificações:** React Hot Toast
* **Drag & Drop:** Dnd-kit

---

## 📂 Estrutura do Projeto

A arquitetura foi refatorada para facilitar a manutenção e escalabilidade:

```text
src/
├── components/
│   ├── common/          # Modais (Título, Configs, Assets) e UI genérica
│   ├── editor/          # Formulários de edição e Sidebar
│   └── preview/         # ABNTViewer (O "papel" A4 visual)
├── contexts/
│   └── AppContext.jsx   # Estado Global (Projetos, Settings, CRUD)
├── hooks/
│   ├── useAutosave.js   # Lógica de persistência e debounce
│   └── useExport.js     # Lógica de window.print() e DOCX
├── utils/
│   ├── constants.jsx    # Templates de texto, Dicas ABNT e Renderizadores
│   └── helpers.js       # Funções puras (cálculos, formatação data)
├── views/
│   ├── Dashboard.jsx    # Tela de gerenciamento de projetos
│   ├── Editor.jsx       # Tela principal de edição
│   └── LandingPage.jsx  # Página inicial
└── App.jsx              # Rotas e Configuração Global