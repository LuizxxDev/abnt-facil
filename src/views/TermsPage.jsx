import React from 'react';
import { Link } from 'react-router-dom';
import LegalLayout from '../components/common/LegalLayout';

export default function TermsPage() {
    return (
        <LegalLayout title="Termos de Uso" path="/termos" updated="2 de novembro de 2026">
            <p>Estes termos explicam como o ABNTFácil funciona e o que se espera de quem o usa. Ao usar a ferramenta, você concorda com eles.</p>

            <h2>O que é o ABNTFácil</h2>
            <p>O ABNTFácil é um editor gratuito que ajuda a formatar trabalhos acadêmicos seguindo normas da ABNT (como a NBR 14724, a NBR 6022, a NBR 6023 e a NBR 10520). É um projeto independente, mantido por um estudante do IFPA Campus Belém, sem vínculo com a Associação Brasileira de Normas Técnicas (ABNT) nem com o IFPA.</p>

            <h2>O que a ferramenta faz e o que não faz</h2>
            <ul>
                <li>Monta capa, folha de rosto, sumário, listas, referências e o PDF a partir do que você escreve.</li>
                <li>A conferência automática verifica <strong>parte</strong> das regras. Ela não garante que o trabalho esteja inteiramente de acordo com todas as normas.</li>
                <li>As normas são atualizadas de tempos em tempos e a sua instituição pode ter regras próprias, que prevalecem. Confira sempre o manual do seu curso.</li>
                <li>O ABNTFácil não garante aprovação, nota nem aceitação do trabalho por nenhuma instituição ou revista.</li>
                <li>Os documentos de exemplo usam nomes, obras e dados fictícios, só para mostrar a formatação. Não os use como fonte.</li>
            </ul>
            <p><strong>Revise o resultado antes de entregar.</strong></p>

            <h2>Seu conteúdo</h2>
            <p>O texto, as imagens e os dados que você coloca no editor continuam sendo seus. O ABNTFácil os usa apenas para mostrar, guardar (quando você usa conta) e gerar os arquivos que você pede. Veja os detalhes na <Link to="/privacidade">Política de Privacidade</Link>.</p>
            <p>Você é responsável pela autoria, pela originalidade e pela correção do conteúdo, pelas citações e referências das obras usadas e por ter autorização para usar imagens e dados de terceiros. A Lei de Direitos Autorais (Lei nº 9.610/1998) continua valendo para o que você escreve e cita.</p>

            <h2>Uso permitido</h2>
            <p>Não use o ABNTFácil para:</p>
            <ul>
                <li>enviar conteúdo ilegal ou que viole direitos de outras pessoas;</li>
                <li>sobrecarregar o servidor, por exemplo com pedidos automáticos e repetidos de geração de PDF;</li>
                <li>tentar acessar documentos de outras pessoas ou burlar a segurança do serviço.</li>
            </ul>

            <h2>Disponibilidade</h2>
            <p>O ABNTFácil é gratuito e mantido por uma única pessoa, com doações voluntárias. Ele pode ficar fora do ar, mudar ou deixar de existir. Sem conta, os documentos ficam só no navegador e podem se perder se você limpar os dados do site ou trocar de aparelho. Baixe cópias de segurança com frequência.</p>

            <h2>Doações</h2>
            <p>As doações por PIX são voluntárias e não dão acesso a recursos extras nem criam obrigação de suporte.</p>

            <h2>Mudanças nestes termos</h2>
            <p>Estes termos podem ser atualizados quando a ferramenta mudar. A data no topo indica a última versão.</p>

            <h2>Contato</h2>
            <p>Use o formulário <strong>Relatar um problema</strong>, no rodapé da página inicial ou no painel. Se quiser resposta, informe um e-mail na mensagem.</p>
            <p>Estes termos seguem a legislação brasileira.</p>
        </LegalLayout>
    );
}
