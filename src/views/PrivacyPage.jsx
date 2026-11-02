import React from 'react';
import LegalLayout from '../components/common/LegalLayout';

// Política de Privacidade: descreve o que o código faz de fato (ver conformidade/RELATORIO.md).
// Ao mudar uma integração, um armazenamento ou um formulário, atualize esta página.
const DADOS = [
    ['Texto do trabalho, títulos, nomes de autores, orientador e banca, imagens coladas', 'Escrever e formatar o documento', 'No seu navegador (armazenamento local). Com login, também na sua conta no Supabase'],
    ['Preferências (tema, fonte, nome escolhido, perfil acadêmico)', 'Lembrar suas escolhas', 'No seu navegador'],
    ['Documento completo, no momento em que você baixa o PDF', 'Gerar o arquivo PDF', 'Enviado ao servidor do ABNTFácil na Vercel, que devolve o PDF e não guarda o documento'],
    ['Nome, e-mail e foto da conta Google (só se você entrar)', 'Identificar a sua conta e sincronizar os documentos', 'Supabase (autenticação)'],
    ['Imagens enviadas com login', 'Mostrar a figura no documento', 'Supabase (armazenamento de arquivos), em endereço público'],
    ['Mensagens do formulário "Relatar um problema"', 'Corrigir erros e melhorar a ferramenta', 'Supabase (banco de dados), sem identificação de quem enviou'],
    ['Endereço IP e dados técnicos de acesso', 'Entregar as páginas e manter o serviço funcionando', 'Registros técnicos da Vercel e do Supabase'],
];

export default function PrivacyPage() {
    return (
        <LegalLayout title="Política de Privacidade" path="/privacidade" updated="2 de novembro de 2026">
            <p>Esta política explica quais dados o ABNTFácil usa, para quê, onde eles ficam e como você pode controlá-los. Ela descreve o funcionamento atual da ferramenta e será atualizada sempre que algo mudar.</p>

            <h2>Quem cuida dos dados</h2>
            <p>O ABNTFácil é um projeto independente, mantido por Luiz Felipe, estudante do IFPA Campus Belém. Ele não tem vínculo com o IFPA nem com a Associação Brasileira de Normas Técnicas (ABNT).</p>
            <p>Para dúvidas e pedidos sobre seus dados, use o formulário <strong>Relatar um problema</strong>, no rodapé da página inicial ou no painel. O formulário é anônimo: se quiser resposta, escreva na mensagem um e-mail de contato.</p>

            <h2>Você pode usar sem conta</h2>
            <p>O editor funciona sem cadastro. Nesse caso, os documentos ficam salvos apenas no armazenamento do seu navegador, neste aparelho. O ABNTFácil não recebe o seu texto enquanto você escreve.</p>
            <p>Há uma exceção: <strong>para gerar o PDF, o documento inteiro é enviado ao servidor</strong> do ABNTFácil, hospedado na Vercel. O servidor monta o arquivo, devolve o PDF e não grava o conteúdo. Baixar no formato do Word e importar um arquivo .docx acontecem no próprio navegador, sem envio.</p>

            <h2>Quais dados são usados</h2>
            <div className="table-wrap">
                <table>
                    <caption>Dados, finalidade e local</caption>
                    <thead><tr><th scope="col">Dado</th><th scope="col">Para quê</th><th scope="col">Onde fica</th></tr></thead>
                    <tbody>{DADOS.map(([d, f, o]) => <tr key={d}><td>{d}</td><td>{f}</td><td>{o}</td></tr>)}</tbody>
                </table>
            </div>
            <p>O ABNTFácil não pede CPF, telefone, endereço nem dados de pagamento. Não usa publicidade, ferramentas de estatística de visitas nem pixels de rastreamento. Seus textos não são enviados a serviços de inteligência artificial e não são usados para treinar modelos.</p>
            <p>O conteúdo de um trabalho pode incluir dados pessoais, seus ou de outras pessoas (por exemplo, nomes de participantes de uma pesquisa). Evite incluir informações de saúde, religião ou outros dados sensíveis que não sejam necessários ao trabalho, principalmente se usar a sincronização na nuvem.</p>

            <h2>Por que podemos usar esses dados</h2>
            <p>De acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), entendemos que se aplicam:</p>
            <ul>
                <li><strong>Execução do serviço que você pediu</strong> (art. 7º, V): guardar e sincronizar seus documentos, gerar o PDF e manter a sua conta, quando você escolhe entrar com o Google.</li>
                <li><strong>Legítimo interesse</strong> (art. 7º, IX): ler as mensagens do formulário para corrigir erros e manter registros técnicos que protegem o serviço contra abuso.</li>
            </ul>
            <p>Entrar com o Google é opcional. Se você não quiser, use o editor sem conta.</p>

            <h2>Com quem os dados são compartilhados</h2>
            <ul>
                <li><strong>Vercel</strong>: hospeda o site e gera o PDF.</li>
                <li><strong>Supabase</strong>: banco de dados, login e armazenamento de imagens, para quem usa conta.</li>
                <li><strong>Google</strong>: somente quando você escolhe entrar com a conta Google. O Google informa ao ABNTFácil seu nome, e-mail e foto.</li>
            </ul>
            <p>Esses serviços podem processar os dados em servidores fora do Brasil. Os dados não são vendidos nem cedidos para outras finalidades.</p>

            <h2>Imagens enviadas com login</h2>
            <p>Quando você insere uma imagem estando conectado, ela é guardada no Supabase em um endereço público, difícil de adivinhar. Quem tiver o endereço consegue abrir a imagem. Não envie imagens com informações que você não queira tornar acessíveis por link.</p>

            <h2>Cookies e armazenamento no navegador</h2>
            <p>O ABNTFácil não cria cookies. Ele usa o armazenamento local do navegador, que só é lido pelo próprio site:</p>
            <ul>
                <li><strong>Documentos</strong> (<code>ifpa_projects_final_v6</code>): necessário para o editor funcionar sem conta.</li>
                <li><strong>Preferências</strong> (<code>ifpa_app_settings</code>): tema, fonte e perfil acadêmico.</li>
                <li><strong>Aceite dos termos</strong> (<code>abntfacil_termos_aceitos</code>): a versão dos Termos de Uso que você aceitou e a data, para não perguntar de novo.</li>
                <li><strong>Sessão de login</strong> (<code>sb-…-auth-token</code>): só existe se você entrar com o Google e é necessária para manter a conta conectada.</li>
                <li><strong>Cópia do site para uso sem internet</strong> (cache do navegador): guarda os arquivos do próprio site, não os seus documentos.</li>
            </ul>
            <p>Como não há cookies de publicidade nem de estatística, o site não exibe aviso de consentimento de cookies. Você pode apagar tudo isso nas configurações do navegador ou pelo botão descrito abaixo.</p>

            <h2>Por quanto tempo os dados ficam guardados</h2>
            <ul>
                <li>No navegador: até você apagar os documentos ou limpar os dados do site.</li>
                <li>Na conta: enquanto o documento existir. Ao apagar um documento de vez, ele sai do banco de dados.</li>
                <li>Documento enviado para gerar o PDF: não é guardado depois que o arquivo é devolvido.</li>
                <li>Mensagens do formulário: ainda não há prazo definido para a exclusão. Você pode pedir que uma mensagem sua seja apagada.</li>
                <li>Registros técnicos da Vercel e do Supabase: pelos prazos desses serviços.</li>
            </ul>

            <h2>Seus direitos e como exercê-los</h2>
            <p>A LGPD (art. 18) garante a você, entre outros direitos, confirmar se há tratamento dos seus dados, acessá-los, corrigi-los, pedir a eliminação, obter a portabilidade e saber com quem são compartilhados. No ABNTFácil:</p>
            <ul>
                <li><strong>Acesso e portabilidade</strong>: no painel, o botão de cópia de segurança baixa todos os seus documentos em um arquivo.</li>
                <li><strong>Correção</strong>: edite os documentos e o perfil a qualquer momento.</li>
                <li><strong>Eliminação</strong>: em Configurações, <strong>Apagar todos os documentos</strong> remove o que está no navegador e, se você estiver conectado, os documentos e imagens da sua conta na nuvem.</li>
                <li><strong>Exclusão da conta de login</strong> (nome e e-mail vindos do Google): peça pelo formulário <strong>Relatar um problema</strong>, informando um e-mail de contato.</li>
            </ul>
            <p>Você também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD), em <a href="https://www.gov.br/anpd" rel="noopener noreferrer" target="_blank">gov.br/anpd</a>.</p>

            <h2>Segurança</h2>
            <p>As conexões usam HTTPS, o servidor do PDF só busca fontes e imagens públicas e não grava o documento, e o site adota cabeçalhos de segurança contra a inclusão em outros sites e a execução de scripts de terceiros. Mesmo assim, nenhum sistema é totalmente seguro. Guarde cópias dos seus trabalhos.</p>

            <h2>Estudantes menores de idade</h2>
            <p>O ABNTFácil não pede a idade de quem usa. Se você tem menos de 18 anos, prefira usar o editor sem conta e converse com o seu responsável antes de entrar com uma conta Google.</p>

            <h2>Mudanças nesta política</h2>
            <p>Se o funcionamento mudar (por exemplo, uma nova integração), esta página será atualizada e a data no topo mudará.</p>
        </LegalLayout>
    );
}
