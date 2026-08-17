import type { Metadata } from "next";
import { LegalDocument, type LegalSection } from "@/components/legal/legal-document";

export const metadata: Metadata = {
  title: "Termos de Uso — Urus FIDC",
  description: "Condições para acesso e uso da plataforma Urus FIDC.",
};

const sections: LegalSection[] = [
  {
    id: "quem-somos",
    title: "Quem somos e como falar conosco",
    content: <>
      <p>A plataforma Urus FIDC é disponibilizada por <strong>URUS ASSESSORIA EMPRESARIAL LTDA</strong>, inscrita no CNPJ sob nº <strong>35.028.407/0001-01</strong>, com sede na Alameda Rio Negro, nº 503, Sala 2020, Alphaville Centro Industrial e Empresarial/Alphaville, Barueri/SP, CEP 06454-000, doravante denominada “Urus”.</p>
      <p>A empresa utiliza o nome fantasia <strong>Urus Capital</strong> e, neste serviço, a marca <strong>Urus FIDC</strong>. Para suporte, assuntos jurídicos ou privacidade, escreva para <a href="mailto:adm@uruscapital.com.br">adm@uruscapital.com.br</a>, aos cuidados do Departamento Jurídico.</p>
    </>,
  },
  {
    id: "sobre-os-termos",
    title: "Sobre estes Termos",
    content: <>
      <p>Estes Termos regulam o acesso e o uso da plataforma Urus FIDC, doravante “Plataforma”. Ao criar uma conta, a pessoa usuária declara que leu e aceitou estes Termos. O Aviso de Privacidade explica separadamente como os dados pessoais são tratados.</p>
      <p>Se você utiliza a Plataforma em nome de uma empresa, declara ter poderes para vinculá-la a estes Termos. Se não concordar com alguma condição, não crie uma conta nem utilize a área autenticada.</p>
    </>,
  },
  {
    id: "quem-pode-usar",
    title: "Quem pode utilizar a Plataforma",
    content: <>
      <p>A Plataforma é destinada a pessoas com 18 anos ou mais e a profissionais autorizados a cadastrar e acompanhar operações empresariais de crédito. O usuário deve fornecer informações verdadeiras, completas e atualizadas.</p>
      <p>É responsabilidade do usuário verificar se possui autorização e fundamento jurídico para inserir dados e documentos de empresas, sócios, representantes, garantidores ou terceiros. A Plataforma não deve ser utilizada para dados obtidos de forma ilícita, excessiva ou incompatível com a análise da operação.</p>
    </>,
  },
  {
    id: "o-que-fazemos",
    title: "O que a Plataforma faz",
    content: <>
      <p>A Plataforma oferece, conforme o plano contratado:</p>
      <ul>
        <li>cadastro e organização de operações empresariais;</li>
        <li>comparação da operação com critérios previamente configurados para FIDCs;</li>
        <li>pontuação, critérios de aderência e justificativas do matching;</li>
        <li>gestão de checklists e envio privado de documentos;</li>
        <li>triagem documental assistida por inteligência artificial, seguida de revisão humana;</li>
        <li>relatórios e pacotes temporários;</li>
        <li>distribuição segura a FIDCs autorizados; e</li>
        <li>assinatura, cobrança, suporte, segurança e auditoria.</li>
      </ul>
      <p>As funcionalidades e os limites disponíveis podem variar conforme o plano, a etapa da operação, a situação da assinatura e as integrações contratadas.</p>
    </>,
  },
  {
    id: "o-que-nao-fazemos",
    title: "O que a Plataforma não faz",
    content: <>
      <p>A Urus disponibiliza tecnologia de organização, matching e apoio operacional. Salvo quando informado em instrumento específico, a Urus:</p>
      <ul>
        <li>não é instituição financeira nem FIDC;</li>
        <li>não concede crédito, capta recursos ou recebe depósitos;</li>
        <li>não presta recomendação individual de investimento, consultoria jurídica, contábil ou tributária;</li>
        <li>não garante elegibilidade, aprovação, contratação, taxa, prazo ou liberação de recursos; e</li>
        <li>não substitui a análise cadastral, documental, de risco, compliance ou crédito de cada FIDC.</li>
      </ul>
      <p>Cada FIDC define de forma independente seus critérios, solicitações, decisão de crédito e condições comerciais. O matching é indicativo e depende da qualidade e atualidade das informações cadastradas.</p>
    </>,
  },
  {
    id: "inteligencia-artificial",
    title: "Inteligência artificial e decisões humanas",
    content: <>
      <p>A Plataforma pode utilizar inteligência artificial para identificar documentos, avaliar legibilidade, localizar evidências, apontar campos ausentes ou riscos e gerar recomendação preliminar.</p>
      <p>Essa análise não concede nem nega crédito e não produz aprovação documental definitiva. A decisão sobre o documento é submetida a uma pessoa autorizada, e a decisão de crédito compete ao FIDC.</p>
      <p>Resultados automatizados podem conter imprecisões. O usuário deve revisar informações relevantes e pode solicitar esclarecimentos ou revisão pelo e-mail <a href="mailto:adm@uruscapital.com.br">adm@uruscapital.com.br</a>.</p>
    </>,
  },
  {
    id: "conta-seguranca",
    title: "Conta, credenciais e segurança",
    content: <>
      <p>A conta é individual e não pode ser compartilhada. O usuário deve:</p>
      <ul>
        <li>criar senha forte e exclusiva;</li>
        <li>manter credenciais e códigos em sigilo;</li>
        <li>ativar autenticação multifator quando disponível ou exigida;</li>
        <li>encerrar a sessão em dispositivos compartilhados; e</li>
        <li>comunicar imediatamente suspeita de acesso indevido.</li>
      </ul>
      <p>A Urus poderá bloquear temporariamente acessos ou solicitar verificações adicionais diante de risco de fraude, abuso ou comprometimento. A Urus nunca solicitará a senha completa por e-mail, telefone ou mensagem.</p>
    </>,
  },
  {
    id: "dados-documentos",
    title: "Dados e documentos enviados",
    content: <>
      <p>Ao cadastrar uma operação ou enviar um arquivo, o usuário declara que:</p>
      <ol>
        <li>as informações são verdadeiras e pertinentes;</li>
        <li>possui autorização, atribuição profissional ou base jurídica válida;</li>
        <li>informou os titulares quando exigido;</li>
        <li>não enviará conteúdo ilícito ou malicioso; e</li>
        <li>utilizará apenas os documentos necessários.</li>
      </ol>
      <p>Antes da distribuição, a Plataforma deverá informar o FIDC destinatário e os documentos do pacote. O usuário é responsável por confirmar que o compartilhamento é autorizado, sem prejuízo dos controles e da responsabilidade da Urus.</p>
      <p>Não devem ser enviados documentos estranhos à operação nem dados pessoais sensíveis, salvo quando estritamente necessários, permitidos pela legislação e solicitados para a finalidade indicada.</p>
    </>,
  },
  {
    id: "distribuicao-fidcs",
    title: "Distribuição a FIDCs",
    content: <>
      <p>Documentos e dados somente serão distribuídos a FIDCs no contexto da jornada e após os controles aplicáveis. O acesso externo pode ser protegido por link temporário, código de uso único e sessão limitada.</p>
      <p>Após receber os dados, cada FIDC poderá atuar como controlador independente para sua análise e obrigações legais. As regras do FIDC também poderão se aplicar à relação direta com a empresa analisada e demais titulares.</p>
      <p>O usuário não deve encaminhar links ou códigos a pessoas não autorizadas.</p>
    </>,
  },
  {
    id: "planos-cobranca",
    title: "Planos, franquias e cobrança",
    content: <>
      <p>Valores, impostos, periodicidade, franquias, recursos e condições são os apresentados na contratação. Informações promocionais ou exemplos não substituem as condições confirmadas no checkout.</p>
      <p>A cobrança poderá ser processada por provedor especializado. O usuário autoriza cobranças recorrentes conforme o plano escolhido até o cancelamento.</p>
      <p>Na versão atual, um caso é contabilizado na primeira submissão da operação ao matching. Novas consultas sobre a mesma operação não devem consumir outra unidade, salvo informação prévia diferente.</p>
      <p>Em caso de inadimplência, cancelamento ou encerramento, novos cadastros, uploads, processamentos ou distribuições poderão ser suspensos. O cancelamento pode ser solicitado na área de assinatura ou pelo e-mail <a href="mailto:adm@uruscapital.com.br">adm@uruscapital.com.br</a>. Permanecem preservados os direitos obrigatórios do consumidor quando aplicáveis.</p>
    </>,
  },
  {
    id: "uso-permitido",
    title: "Uso permitido",
    content: <>
      <p>O usuário concorda em não:</p>
      <ul>
        <li>acessar conta, operação ou documento sem autorização;</li>
        <li>compartilhar conta ou contornar controles e limites do plano;</li>
        <li>explorar vulnerabilidades ou interferir na disponibilidade sem autorização;</li>
        <li>inserir malware, código malicioso ou arquivos deliberadamente enganosos;</li>
        <li>copiar, revender, descompilar ou extrair o código, salvo direito legal;</li>
        <li>usar a Plataforma para fraude, discriminação ilícita ou outra atividade ilegal; ou</li>
        <li>usar resultados como única base para decisão relevante sobre pessoa natural.</li>
      </ul>
      <p>Violações poderão resultar em remoção, limitação, suspensão ou encerramento, conforme a gravidade e as obrigações legais.</p>
    </>,
  },
  {
    id: "propriedade-intelectual",
    title: "Propriedade intelectual",
    content: <>
      <p>A Plataforma, marca, interfaces, código, textos, critérios, documentação e demais ativos pertencem à Urus ou a seus licenciadores. A contratação concede licença limitada, revogável, não exclusiva e intransferível para uso profissional durante a vigência da conta.</p>
      <p>O usuário preserva os direitos sobre os dados e documentos enviados e concede à Urus autorização limitada para tratá-los apenas na medida necessária à prestação do serviço, segurança, cumprimento da lei e instruções autorizadas.</p>
      <p>Sugestões podem ser usadas para melhorar o produto, sem revelar informações confidenciais ou dados pessoais.</p>
    </>,
  },
  {
    id: "confidencialidade",
    title: "Confidencialidade",
    content: <>
      <p>A Urus adotará controles razoáveis para limitar o acesso a dados não públicos a pessoas autorizadas, fornecedores necessários e FIDCs destinatários. Pessoas com acesso de suporte, revisão ou administração devem estar sujeitas a confidencialidade e rastreabilidade.</p>
      <p>O usuário também deve proteger informações confidenciais acessadas pela Plataforma, inclusive critérios de FIDCs, documentos e dados de terceiros.</p>
    </>,
  },
  {
    id: "disponibilidade",
    title: "Disponibilidade, manutenção e alterações",
    content: <>
      <p>A Urus busca manter a Plataforma segura e disponível, mas não garante operação ininterrupta ou livre de falhas. Manutenções, fornecedores, força maior e incidentes podem afetar temporariamente o serviço.</p>
      <p>Mudanças que reduzam materialmente uma funcionalidade contratada serão comunicadas com antecedência razoável quando possível. Correções de segurança e adequações legais poderão ser imediatas.</p>
    </>,
  },
  {
    id: "responsabilidades",
    title: "Responsabilidades",
    content: <>
      <p>Cada parte responde pelos danos diretos que causar por descumprimento da lei ou destes Termos, na medida de sua responsabilidade.</p>
      <p>A Urus não responde por informações incorretas ou ilícitas do usuário, decisões e condições de FIDCs, uso de resultados sem revisão profissional adequada ou serviços externos fora de seu controle razoável.</p>
      <p>Nada nestes Termos exclui responsabilidade que não possa ser afastada por lei, inclusive por falha de segurança imputável à Urus, violação à proteção de dados, dolo, culpa grave ou direito do consumidor.</p>
    </>,
  },
  {
    id: "encerramento",
    title: "Suspensão e encerramento",
    content: <>
      <p>O usuário pode solicitar o encerramento pelo e-mail <a href="mailto:adm@uruscapital.com.br">adm@uruscapital.com.br</a>. Isso não implica eliminação imediata de todos os registros: alguns poderão ser mantidos para obrigações legais, exercício de direitos, prevenção a fraudes e auditoria.</p>
      <p>A Urus poderá suspender ou encerrar a conta por fraude, risco de segurança, violação grave, ordem de autoridade ou inadimplência, com comunicação quando isso não prejudicar investigação, segurança ou cumprimento da lei.</p>
      <p>Antes do encerramento, o usuário deverá ter oportunidade razoável de exportar dados disponíveis, salvo impedimento legal ou risco de segurança.</p>
    </>,
  },
  {
    id: "protecao-dados",
    title: "Proteção de dados",
    content: <>
      <p>O tratamento de dados pessoais é explicado no Aviso de Privacidade, que integra a transparência da relação, mas não transforma todos os tratamentos em consentimento. Bases legais adequadas serão aplicadas conforme cada finalidade.</p>
      <p>Quando a Urus tratar dados exclusivamente em nome e segundo instruções documentadas de cliente controlador, as partes deverão observar as regras aplicáveis à relação controlador-operador.</p>
    </>,
  },
  {
    id: "comunicacoes",
    title: "Comunicações e registros eletrônicos",
    content: <>
      <p>A Urus poderá enviar comunicações operacionais, de segurança, cobrança, suporte e atualizações contratuais ao e-mail cadastrado ou pela Plataforma. Marketing, se houver, deverá permitir oposição ou descadastramento quando aplicável.</p>
      <p>Registros eletrônicos de aceite, autenticação, ações relevantes, distribuição e auditoria poderão ser utilizados como prova, respeitada a legislação.</p>
    </>,
  },
  {
    id: "alteracoes-termos",
    title: "Alterações destes Termos",
    content: <p>A Urus poderá atualizar estes Termos por mudanças legais, de segurança, comerciais ou do produto. Alterações materiais serão destacadas e, quando necessário, será solicitado novo aceite. Versões anteriores e datas de vigência serão preservadas para auditoria.</p>,
  },
  {
    id: "lei-foro",
    title: "Lei aplicável e solução de conflitos",
    content: <>
      <p>Estes Termos são regidos pelas leis brasileiras. As partes buscarão resolver divergências pelo e-mail <a href="mailto:adm@uruscapital.com.br">adm@uruscapital.com.br</a>, aos cuidados do Departamento Jurídico.</p>
      <p>Fica eleito o foro da comarca de <strong>Barueri/SP</strong>, sem prejuízo do foro do domicílio do consumidor quando aplicável nem de outro foro obrigatório previsto em lei.</p>
    </>,
  },
];

export default function TermsOfUsePage() {
  return <LegalDocument active="terms" eyebrow="RELAÇÃO CONTRATUAL · TRANSPARÊNCIA" title="Termos de Uso" summary="As condições que orientam o acesso, o uso responsável e os limites da plataforma Urus FIDC." sections={sections} />;
}
