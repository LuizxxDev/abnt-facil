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

## 📚 Tipos de Documento e Normas Aplicadas

| Documento | Norma | Estrutura gerada automaticamente |
|---|---|---|
| TCC / Monografia, Dissertação, Tese | NBR 14724:2011 | Capa, folha de rosto, folha de aprovação com banca, dedicatória, agradecimentos, epígrafe, resumo e abstract, listas de ilustrações e tabelas, sumário |
| Trabalho de Disciplina | NBR 14724:2011 | Capa, folha de rosto, sumário |
| Projeto de Pesquisa | NBR 15287:2011 | Folha de rosto, sumário; tema, problema, hipóteses, objetivos, justificativa, metodologia, recursos e cronograma |
| Relatório Técnico-Científico e de Estágio | NBR 10719:2015 | Folha de rosto, resumo na língua vernácula, sumário |
| Artigo Científico | NBR 6022:2018 | Título (e em outro idioma), autoria com nota de rodapé, resumo de 100–250 palavras, texto contínuo |
| Resumo Expandido e Resenha Crítica | NBR 6022 / 6028 | Texto contínuo; a resenha começa pela referência da obra |

Regras comuns: paginação real em A4 (NBR 14724), figuras/tabelas/quadros numerados, referências em ordem alfabética com título em negrito (NBR 6023:2018), palavras-chave separadas por ponto e vírgula (NBR 6028:2021) e verificação de citações no formato (Silva, 2023) da NBR 10520:2023.

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
