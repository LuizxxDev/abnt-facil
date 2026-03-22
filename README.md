# 🎓 ABNTFácil — Editor Académico Inteligente

O **ABNTFácil** é uma plataforma de edição e formatação automática de trabalhos académicos seguindo as normas da **ABNT** (NBR 14724, NBR 6023). Desenvolvido de forma independente por um aluno de **Engenharia de Controle e Automação no IFPA Belém**, o sistema automatiza as tarefas mecânicas de formatação para que o estudante se foque exclusivamente na qualidade da sua pesquisa científica.

🚀 **Acesse agora:** [Link do Projeto na Vercel](https://abnt-facil-luiz-s-projects-bbeace80.vercel.app)

---

## ✨ Funcionalidades Principais

- **📝 Edição em Tempo Real:** Escreva o conteúdo e visualize instantaneamente o documento formatado com capa, sumário e margens automáticas.
- **🧠 Assistente de Saúde ABNT:** Validação cruzada inteligente que deteta se citou um autor no texto mas esqueceu-se de o incluir nas referências finais.
- **📚 Gerador de Referências NBR 6023:** Formulários especializados para Livros, Sites, Artigos Científicos e Teses/TCCs.
- **🖼️ Gestão Inteligente de Imagens:** Integração com **Supabase Storage** para suporte a diagramas e figuras pesadas sem comprometer a performance.
- **📄 Exportação PDF Nativa:** Motor de geração de PDF que garante as margens milimétricas (3cm/2cm) e fontes (Arial/Times) exigidas pela norma.
- **📱 PWA (App Feel):** Instale a plataforma como uma aplicação nativa no seu telemóvel ou computador para acesso rápido e suporte offline.

---

## 🛠️ Tecnologias Utilizadas

O projeto utiliza o que há de mais moderno no ecossistema **React** para garantir performance e escalabilidade:

- **Frontend:** [React.js](https://reactjs.org/) com [Tailwind CSS](https://tailwindcss.com/) (UI/UX responsiva e Dark Mode).
- **Backend/Auth:** [Supabase](https://supabase.com/) (Persistência na nuvem e autenticação Google).
- **Armazenamento:** Supabase Storage para gestão de ficheiros multimédia.
- **Exportação:** `html2pdf.js` para geração precisa de documentos PDF.
- **Ícones:** [Lucide-React](https://lucide.dev/).

---

## 💾 Arquitetura de Dados Híbrida

O ABNTFácil foi desenhado com um sistema de dados resiliente:
1. **Modo Visitante:** Os dados são guardados localmente no navegador via `LocalStorage`.
2. **Modo Sincronizado:** Ao fazer login, os projetos são automaticamente migrados e sincronizados com a nuvem do **Supabase**, garantindo que nunca perde o seu trabalho.
