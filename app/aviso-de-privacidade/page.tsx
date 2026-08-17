import type { Metadata } from "next";
import { LegalDocument, type LegalSection } from "@/components/legal/legal-document";

export const metadata: Metadata = {
  title: "Aviso de Privacidade — Urus FIDC",
  description: "Como a Urus FIDC coleta, utiliza, compartilha, armazena e protege dados pessoais.",
};

const sections: LegalSection[] = [
  {
    id: "objetivo",
    title: "Objetivo e alcance",
    content: <>
      <p>Este Aviso explica como a Urus FIDC coleta, utiliza, compartilha, armazena e protege dados pessoais no site, na área autenticada, no suporte e na entrega segura de documentos.</p>
      <p>Ele se aplica a usuários, representantes e sócios de empresas cadastradas, destinatários de FIDCs e outras pessoas cujos dados sejam incluídos de forma autorizada em uma operação ou documento.</p>
    </>,
  },
  {
    id: "responsavel-dados",
    title: "Quem é responsável pelos dados",
    content: <>
      <p><strong>Controlador:</strong> URUS ASSESSORIA EMPRESARIAL LTDA, CNPJ 35.028.407/0001-01, com sede na Alameda Rio Negro, nº 503, Sala 2020, Alphaville Centro Industrial e Empresarial/Alphaville, Barueri/SP, CEP 06454-000. Nome fantasia: Urus Capital. Marca deste serviço: Urus FIDC.</p>
      <p><strong>Área responsável por privacidade:</strong> Departamento Jurídico.<br/><strong>Contato:</strong> <a href="mailto:adm@uruscapital.com.br">adm@uruscapital.com.br</a>.</p>
      <p>A Urus atua como controladora dos dados necessários para cadastro, autenticação, assinatura, segurança, suporte, auditoria, matching, gestão da jornada e suas obrigações.</p>
      <p>Quando um cliente insere dados de terceiros e define finalidade e elementos essenciais, a Urus também poderá atuar como operadora, segundo instruções documentadas. Após o envio a um FIDC autorizado, esse FIDC poderá atuar como controlador independente para análise de crédito, compliance e obrigações legais.</p>
    </>,
  },
  {
    id: "dados-tratados",
    title: "Quais dados pessoais tratamos",
    content: <>
      <div className="legal-table-wrap"><table>
        <thead><tr><th>Categoria</th><th>Exemplos</th></tr></thead>
        <tbody>
          <tr><td>Cadastro e conta</td><td>Nome, e-mail profissional, atuação, telefone se informado, identificador e assinatura.</td></tr>
          <tr><td>Autenticação e segurança</td><td>Credenciais protegidas, fatores de autenticação, sessões, tentativas, IP ou hashes, dispositivo e navegador.</td></tr>
          <tr><td>Cobrança</td><td>Nome ou razão social, CPF ou CNPJ, endereço, assinatura e identificadores de transação. O cartão é processado pelo provedor de pagamentos.</td></tr>
          <tr><td>Empresa e operação</td><td>CNPJ, razão social, segmento, localização, faturamento, valor, modalidade, garantias e formas de venda e recebimento.</td></tr>
          <tr><td>Documentos</td><td>Arquivos societários, financeiros, fiscais, bancários e comprovantes, que podem conter dados de sócios, representantes, garantidores, clientes ou fornecedores.</td></tr>
          <tr><td>Análises e decisões</td><td>Matching, critérios, justificativas, triagem de IA, evidências, ausências, alertas e decisão humana sobre documentos.</td></tr>
          <tr><td>Distribuição</td><td>FIDC e destinatário, pacote enviado, códigos, links, horários, tentativas e downloads.</td></tr>
          <tr><td>Suporte e auditoria</td><td>Mensagens, motivo de acesso administrativo, eventos e relatórios.</td></tr>
          <tr><td>Dados técnicos</td><td>Logs, data e hora, rotas, eventos de segurança e cookies necessários.</td></tr>
        </tbody>
      </table></div>
      <p>Documentos podem conter dados sensíveis ou de crianças e adolescentes mesmo que essa não seja a finalidade. O usuário deve evitar esse envio e, quando estritamente necessário e permitido, limitar o conteúdo ao mínimo indispensável. A Urus aplicará salvaguardas reforçadas.</p>
    </>,
  },
  {
    id: "origem-dados",
    title: "Como obtemos os dados",
    content: <>
      <p>Os dados podem ser obtidos:</p>
      <ul>
        <li>diretamente do usuário no cadastro, contratação, operação, upload ou suporte;</li>
        <li>de pessoa autorizada que cadastre a operação ou envie o documento;</li>
        <li>de bases públicas empresariais, atualmente por consulta à BrasilAPI;</li>
        <li>de provedores de autenticação, pagamento e infraestrutura;</li>
        <li>de FIDCs e profissionais envolvidos na jornada; e</li>
        <li>automaticamente, por registros técnicos e de segurança necessários.</li>
      </ul>
      <p>Quem recebeu uma entrega segura ou teve dados incluídos por outra pessoa pode pedir informações sobre origem e contexto, observados sigilos legais e direitos de terceiros.</p>
    </>,
  },
  {
    id: "finalidades-bases",
    title: "Finalidades e bases legais",
    content: <>
      <p>A base legal depende da finalidade e do contexto. Não tratamos todos os dados com base em consentimento.</p>
      <div className="legal-table-wrap"><table>
        <thead><tr><th>Finalidade</th><th>Bases que podem ser aplicáveis</th></tr></thead>
        <tbody>
          <tr><td>Criar conta, autenticar, prestar funções, assinar e atender solicitações</td><td>Execução de contrato e procedimentos preliminares.</td></tr>
          <tr><td>Cadastrar, organizar e acompanhar operações</td><td>Execução de contrato; legítimo interesse quando cabível; exercício regular de direitos.</td></tr>
          <tr><td>Consultar cadastro empresarial público</td><td>Execução de contrato e legítimo interesse em validar dados empresariais.</td></tr>
          <tr><td>Realizar matching</td><td>Execução de contrato e legítimo interesse, com transparência e revisão.</td></tr>
          <tr><td>Fazer triagem por IA e revisão humana</td><td>Execução de contrato; legítimo interesse documentado; exercício regular de direitos.</td></tr>
          <tr><td>Distribuir ao FIDC autorizado</td><td>Execução de contrato e procedimentos relacionados; exercício regular de direitos; outras bases exigidas pelo conteúdo.</td></tr>
          <tr><td>Processar pagamentos e deveres fiscais</td><td>Execução de contrato e obrigação legal ou regulatória.</td></tr>
          <tr><td>Prevenir fraude, abuso, malware e incidentes</td><td>Legítimo interesse; obrigação legal; exercício regular de direitos.</td></tr>
          <tr><td>Manter auditoria e comprovar aceites</td><td>Obrigação legal ou regulatória e exercício regular de direitos.</td></tr>
          <tr><td>Comunicações operacionais e de segurança</td><td>Execução de contrato, obrigação legal e legítimo interesse.</td></tr>
        </tbody>
      </table></div>
      <p>Quando houver dados sensíveis, a Urus identificará uma hipótese específica do artigo 11 da LGPD. O aceite deste Aviso não autoriza genericamente o tratamento de dados sensíveis.</p>
    </>,
  },
  {
    id: "matching-ia",
    title: "Matching, inteligência artificial e revisão",
    content: <>
      <p>O matching compara faturamento, segmento, modalidade e região com critérios de cada FIDC e apresenta pontuação, elegibilidade e justificativa.</p>
      <p>A triagem documental pode enviar o arquivo ou texto extraído a serviço de inteligência artificial para verificar identidade, período, legibilidade, evidências, ausências e sinais de risco. A configuração atual instrui o provedor a não usar os dados para coleta própria, e a Urus busca manter garantias contratuais e técnicas adequadas.</p>
      <p>Essas ferramentas não aprovam documentos definitivamente nem concedem ou negam crédito. A aprovação documental exige revisão humana, e a decisão de crédito é do FIDC.</p>
      <p>O titular pode solicitar critérios relevantes, contestar resultado e pedir revisão humana pelo e-mail <a href="mailto:adm@uruscapital.com.br">adm@uruscapital.com.br</a>, respeitados segredos comerciais e direitos de terceiros.</p>
    </>,
  },
  {
    id: "compartilhamento",
    title: "Com quem compartilhamos",
    content: <>
      <p>Podemos compartilhar somente os dados necessários com:</p>
      <ul>
        <li><strong>FIDCs autorizados:</strong> análise da operação e dos documentos selecionados;</li>
        <li><strong>Supabase:</strong> banco de dados, autenticação e armazenamento privado;</li>
        <li><strong>Vercel ou provedor efetivo:</strong> hospedagem, aplicação, rede e logs;</li>
        <li><strong>Stripe:</strong> assinatura, checkout e pagamentos;</li>
        <li><strong>Resend:</strong> e-mails transacionais e códigos;</li>
        <li><strong>OpenRouter e provedores de modelo:</strong> triagem documental por IA;</li>
        <li><strong>BrasilAPI e fontes públicas:</strong> cadastro empresarial por CNPJ;</li>
        <li>prestadores profissionais sujeitos a confidencialidade;</li>
        <li>autoridades, quando houver obrigação ou ordem válida; e</li>
        <li>partes de operação societária, com salvaguardas adequadas.</li>
      </ul>
      <p>Não vendemos dados pessoais. Não compartilhamos documentos com todos os FIDCs: a distribuição deve ser limitada ao destinatário autorizado e ao pacote aplicável.</p>
    </>,
  },
  {
    id: "transferencias",
    title: "Transferências internacionais",
    content: <>
      <p>Alguns fornecedores ou suboperadores podem armazenar ou acessar dados fora do Brasil. A Urus somente realizará transferências internacionais quando houver mecanismo previsto na LGPD e na regulamentação da ANPD, como decisão de adequação, cláusulas-padrão contratuais ou outra hipótese válida.</p>
      <p>Conforme o risco, são exigidas medidas de segurança, limitação de finalidade, confidencialidade, regras de subcontratação, apoio a direitos, devolução ou eliminação e notificação de incidentes.</p>
      <p>Informações sobre países, fornecedores e mecanismo utilizado podem ser solicitadas ao Departamento Jurídico.</p>
    </>,
  },
  {
    id: "retencao",
    title: "Por quanto tempo mantemos os dados",
    content: <>
      <p>Mantemos os dados pelo período necessário à finalidade, à vigência da conta e às obrigações legais, regulatórias, contratuais, de auditoria e exercício de direitos. Também são considerados riscos de fraude, segurança, litígios e ordens de preservação.</p>
      <p>Na versão atual:</p>
      <ul>
        <li>links de relatório duram cerca de 10 minutos, e a exportação expira em 24 horas;</li>
        <li>links de entrega a FIDCs têm validade de 24 horas;</li>
        <li>códigos de entrega expiram em 10 minutos;</li>
        <li>sessões de entrega e acesso administrativo duram até 30 minutos; e</li>
        <li>documentos podem ser eliminados quando a retenção da operação termina e não há bloqueio legal.</li>
      </ul>
      <p>Metadados, auditoria e dados da conta podem observar prazos diferentes, conforme sua finalidade e obrigação aplicável. Quando a eliminação imediata não for possível em backups protegidos, os dados permanecem isolados até eliminação ou sobrescrita no ciclo seguro.</p>
    </>,
  },
  {
    id: "cookies",
    title: "Cookies e tecnologias semelhantes",
    content: <>
      <p>A versão atual utiliza cookies estritamente necessários para autenticação, renovação de sessão, prevenção de abuso e entrega segura. Podem estar presentes cookies do Supabase e as sessões <code>urus_delivery</code> e <code>urus_impersonation</code>.</p>
      <p>Esses cookies não são usados para publicidade comportamental. Na versão analisada, não foram identificados cookies de analytics ou marketing.</p>
      <p>Se tecnologias opcionais forem adicionadas, este Aviso e a relação de cookies serão atualizados, e será oferecida escolha antes da ativação quando exigido. Bloquear cookies necessários pode impedir login ou entrega segura.</p>
    </>,
  },
  {
    id: "seguranca",
    title: "Como protegemos os dados",
    content: <>
      <p>A Plataforma possui isolamento por conta, políticas de acesso no banco, armazenamento privado, URLs assinadas e temporárias, MFA administrativo, sessões limitadas, validação de arquivos, checksum, limitação de requisições, auditoria e acesso administrativo somente para leitura e com motivo registrado.</p>
      <p>Nenhum sistema é imune a riscos. A Urus mantém gestão de acessos, atualização, treinamento, backups, testes, gestão de fornecedores, resposta a incidentes e melhoria contínua.</p>
      <aside className="legal-risk-note"><strong>Limitação atual relevante</strong><p>A varredura de malware ainda não está habilitada na versão analisada. Os arquivos passam por validação técnica de formato, tamanho e integridade, mas isso não substitui antivírus.</p></aside>
      <p>Em incidente com risco ou dano relevante, a Urus adotará contenção, investigação e comunicação à ANPD e aos titulares nos prazos e condições aplicáveis.</p>
    </>,
  },
  {
    id: "direitos",
    title: "Direitos dos titulares",
    content: <>
      <p>Nos termos da LGPD, o titular pode, conforme o caso:</p>
      <ul>
        <li>confirmar o tratamento e acessar os dados;</li>
        <li>corrigir dados incompletos, inexatos ou desatualizados;</li>
        <li>solicitar anonimização, bloqueio ou eliminação de dados inadequados;</li>
        <li>solicitar portabilidade conforme regulamentação;</li>
        <li>obter informações sobre compartilhamentos;</li>
        <li>revogar consentimento e pedir eliminação quando essa for a base;</li>
        <li>opor-se a tratamento irregular;</li>
        <li>pedir revisão de decisão unicamente automatizada; e</li>
        <li>peticionar perante ANPD e órgãos de defesa do consumidor.</li>
      </ul>
      <p>Envie a solicitação para <a href="mailto:adm@uruscapital.com.br">adm@uruscapital.com.br</a>, aos cuidados do Departamento Jurídico. A Urus poderá confirmar sua identidade de forma proporcional ao risco. Nunca envie senha.</p>
      <p>A confirmação e o acesso simplificado serão atendidos imediatamente quando possível; a declaração completa será fornecida em até 15 dias. Outros pedidos serão respondidos no prazo aplicável. Eventual impossibilidade será explicada.</p>
    </>,
  },
  {
    id: "responsabilidade-usuario",
    title: "Dados de terceiros",
    content: <>
      <p>Usuários que cadastram dados ou documentos de outras pessoas devem coletar apenas o necessário, ter hipótese legal adequada, informar titulares quando cabível, respeitar sigilos, manter dados corretos, evitar documentos estranhos à operação e atender direitos quando atuarem como controladores.</p>
      <p>A Urus não utiliza essa obrigação do usuário para afastar suas próprias responsabilidades legais e de segurança.</p>
    </>,
  },
  {
    id: "criancas-adolescentes",
    title: "Crianças e adolescentes",
    content: <>
      <p>A Plataforma não é destinada a crianças ou adolescentes. Se documento estritamente necessário contiver dados de menor, o usuário deverá sinalizar e confirmar fundamento jurídico adequado. A Urus aplicará o melhor interesse e salvaguardas reforçadas.</p>
      <p>Se você acreditar que esses dados foram enviados indevidamente, contate <a href="mailto:adm@uruscapital.com.br">adm@uruscapital.com.br</a>.</p>
    </>,
  },
  {
    id: "alteracoes",
    title: "Alterações deste Aviso",
    content: <p>Este Aviso poderá ser atualizado por mudanças legais, regulatórias, operacionais ou tecnológicas. Alterações materiais serão destacadas e comunicadas. Quando uma nova finalidade depender de consentimento, ele será solicitado separadamente. O histórico de versões e datas de vigência será preservado.</p>,
  },
  {
    id: "contato-reclamacoes",
    title: "Contato e reclamações",
    content: <>
      <address>
        <strong>Departamento Jurídico</strong><br/>
        <a href="mailto:adm@uruscapital.com.br">adm@uruscapital.com.br</a><br/>
        Alameda Rio Negro, nº 503, Sala 2020<br/>
        Alphaville Centro Industrial e Empresarial/Alphaville<br/>
        Barueri/SP · CEP 06454-000
      </address>
      <p>Se a resposta não for satisfatória, o titular pode peticionar perante a Autoridade Nacional de Proteção de Dados, buscar órgãos de defesa do consumidor ou o Poder Judiciário.</p>
    </>,
  },
];

export default function PrivacyNoticePage() {
  return <LegalDocument active="privacy" eyebrow="PRIVACIDADE · CONTROLE · PRESTAÇÃO DE CONTAS" title="Aviso de Privacidade" summary="Como os dados percorrem a jornada Urus — da criação da conta à entrega segura para o FIDC autorizado." sections={sections} />;
}
