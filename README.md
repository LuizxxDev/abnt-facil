# 🎓 ABNTFácil

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

O **ABNTFácil** é um editor académico focado na produtividade de estudantes, desenvolvido para automatizar as normas da ABNT (NBR 14724, NBR 6023, entre outras). O projeto nasceu da necessidade de simplificar a formatação de TCCs, artigos e relatórios técnicos, permitindo que o autor foque apenas no conteúdo científico.

Este projeto foi desenvolvido por **Luiz Felipe**, estudante de Engenharia de Controle e Automação no **IFPA Campus Belém**.

---

## ✨ Funcionalidades Principais

- **🚀 Modelos Prontos**: Inicie rapidamente com estruturas pré-definidas para TCC, Artigo Académico, Relatório Técnico e Resumo Expandido.
- **📝 Editor Inteligente**: Sistema de arrastar e soltar (drag-and-drop) para reordenar capítulos e subseções.
- **📚 Gerador de Referências**: Ferramenta automática para formatar referências de livros e sites conforme a NBR 6023.
- **🖼️ Elementos Automáticos**: Inserção simplificada de imagens, tabelas, quadros e citações longas com formatação ABNT nativa.
- **🌗 Personalização**: Suporte completo a Modo Escuro (Dark Mode) e Modo Claro, além de escolha de avatar e nome de utilizador.
- **📄 Exportação Otimizada**: Gere PDFs formatados com margens de 3cm (superior/esquerda) e 2cm (inferior/direita) diretamente do navegador.

---

## 🔒 Privacidade e Segurança

Diferente de outros editores online, o **ABNTFácil** prioriza a segurança dos teus dados:
- **Armazenamento Local**: Todos os teus textos são guardados apenas no teu navegador através do `LocalStorage`. Nada é enviado para servidores externos.
- **Backups**: Podes exportar e importar ficheiros JSON para salvaguardar o teu trabalho ou continuar noutro computador.


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
