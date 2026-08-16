"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SparklesCore } from "@/components/ui/sparkles";
import {
  BRAZIL_STATES,
  createDocuments,
  INITIAL_CHECKLIST_TEMPLATES,
  INITIAL_COMMISSIONS,
  INITIAL_FIDCS,
  INITIAL_NOTIFICATIONS,
  INITIAL_OPERATIONS,
  INITIAL_PLAN_VERSIONS,
  INITIAL_PROPOSALS,
  INITIAL_REVIEWS,
  INITIAL_SELECTIONS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_USAGE,
  OPERATION_TYPES,
  SEGMENTS,
  USERS,
} from "./mock-data";
import { calculateMatches } from "./matching";
import { BillingService, CompanyRegistryService, DocumentAiService, DocumentStorageService, formatCnpj, formatMoneyInput, isValidCnpj, MunicipalityService, NotificationService, onlyDigits, parseMoneyInput } from "./mock-services";
import { ReportService } from "./report-services";
import type { AiDocumentReview, ChecklistDocument, ChecklistTemplate, ChecklistTemplateItem, Commission, DistributionPackage, FidcProfile, FidcSelection, FidcStatus, JourneyState, MunicipalityOption, NotificationEvent, Operation, OperationForm, PlanVersion, Proposal, RevenueMode, SecureDelivery, Subscription, UploadedDocument, UsagePeriod, User } from "./types";

type View = "dashboard" | "operations" | "new-operation" | "operation-detail" | "fidcs" | "checklist" | "distribution" | "reports" | "notifications" | "professionals" | "subscriptions" | "account";
type DetailTab = "summary" | "matching" | "documents" | "journey";

const EMPTY_OPERATION: OperationForm = { companyName: "", cnpj: "", segment: "", annualRevenue: 0, city: "", state: "", amount: 0, operationType: "", hasGuarantee: true, guaranteeValue: 0, guaranteeType: "", salesMethod: "", receiptMethod: "" };
const EMPTY_JOURNEY: JourneyState = { sentToUrus: false, distributed: false, interested: false, meetingScheduled: false, committeeResult: "Pendente", proposalShared: false, commission: "Aguardando FIDC" };

function currency(value: number, compact = false) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: compact ? "compact" : "standard", maximumFractionDigits: compact ? 1 : 2 }).format(value / 100);
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((word) => word.charAt(0)).join("").toUpperCase();
}

function Landing({ onAccess }: { onAccess: () => void }) {
  return (
    <main className="landing-shell">
      <header className="landing-header">
        <a className="landing-brand" href="#inicio" aria-label="Urus FIDC — início"><span className="brand-mark">U</span><span>URUS <b>FIDC</b></span></a>
        <nav aria-label="Navegação da página inicial"><a href="#plataforma">Plataforma</a><a href="#como-funciona">Como funciona</a><a href="#para-quem">Para quem</a><a href="#seguranca">Segurança</a></nav>
        <button className="landing-access" onClick={onAccess}>Acessar plataforma <span>↗</span></button>
      </header>
      <section className="landing-hero" id="inicio">
        <div className="hero-sparkles" aria-hidden="true">
          <SparklesCore id="urus-premium-sparkles" background="transparent" minSize={0.35} maxSize={1.15} particleDensity={180} particleColor="#d8c28d" speed={0.55} className="h-full w-full" />
        </div>
        <div className="hero-aura" aria-hidden="true" />
        <div className="hero-copy">
          <p className="landing-kicker"><span /> CURADORIA, TECNOLOGIA E CRÉDITO</p>
          <h1>Crédito certo.<br/><em>No FIDC certo.</em></h1>
          <p className="hero-lead">Uma plataforma exclusiva para qualificar operações financeiras, encontrar os fundos mais aderentes e conduzir toda a jornada com precisão.</p>
          <div className="hero-actions"><button className="landing-primary" onClick={onAccess}>Encontrar o match <span>→</span></button><a href="#plataforma">Conhecer a plataforma <span>↓</span></a></div>
          <div className="hero-signature" aria-hidden="true"><i/><span>Matching inteligente de crédito</span><i/></div>
        </div>
        <div className="hero-proof" aria-label="Diferenciais da Urus FIDC">
          <article><span>01</span><strong>Curadoria especializada</strong><small>Perfis e critérios de FIDCs organizados pela Urus.</small></article>
          <article><span>02</span><strong>Decisão explicável</strong><small>Score, aderências e divergências visíveis em cada match.</small></article>
          <article><span>03</span><strong>Jornada integral</strong><small>Da originação ao comitê, proposta e comissão.</small></article>
        </div>
        <div className="hero-foot"><span>QUALIFICAÇÃO</span><i/><span>MATCHING EXPLICÁVEL</span><i/><span>JORNADA PONTA A PONTA</span></div>
      </section>

      <section className="landing-numbers" aria-label="Números da plataforma">
        <div><strong>15</strong><span>FIDCs mapeados<br/>no protótipo</span></div>
        <div><strong>20+</strong><span>modalidades de<br/>operações</span></div>
        <div><strong>Brasil</strong><span>cobertura nacional<br/>e regional</span></div>
        <div><strong>100%</strong><span>matching baseado<br/>em regras explicáveis</span></div>
      </section>

      <section className="landing-platform" id="plataforma">
        <div className="landing-section-heading">
          <p className="landing-kicker dark"><span /> UMA PLATAFORMA. TODA A JORNADA.</p>
          <h2>Da oportunidade ao crédito,<br/><em>sem perder o fio da operação.</em></h2>
          <p>A Urus FIDC organiza dados, documentos e decisões em um único fluxo, dando clareza para quem origina e eficiência para quem analisa.</p>
        </div>
        <div className="platform-grid">
          <article className="platform-card featured-card"><span className="feature-number">01</span><div className="feature-symbol">◎</div><h3>Qualificação estruturada</h3><p>Perfil da empresa, operação, garantias, recebíveis e faturamento organizados desde a origem.</p><b>Dados que chegam prontos para análise</b></article>
          <article className="platform-card"><span className="feature-number">02</span><div className="feature-symbol">◇</div><h3>Matching inteligente</h3><p>Compatibilidade calculada por faturamento, segmento, modalidade e região de atuação.</p><b>Score, critérios e motivos visíveis</b></article>
          <article className="platform-card"><span className="feature-number">03</span><div className="feature-symbol">▱</div><h3>Documentos sob controle</h3><p>Checklist por exercício e por sócio, com pendências identificadas antes da distribuição.</p><b>Menos retrabalho na originação</b></article>
          <article className="platform-card"><span className="feature-number">04</span><div className="feature-symbol">↗</div><h3>Jornada acompanhada</h3><p>Interesse, reunião, comitê, proposta, comissão e repasse em uma linha do tempo única.</p><b>Visibilidade ponta a ponta</b></article>
        </div>
      </section>

      <section className="landing-process" id="como-funciona">
        <div className="process-intro"><p className="landing-kicker"><span /> COMO FUNCIONA</p><h2>Um fluxo coordenado.<br/><em>Cada etapa no seu tempo.</em></h2><p>O sistema transforma uma indicação comercial em uma operação qualificada, pronta para encontrar capital aderente.</p><button className="landing-primary" onClick={onAccess}>Conhecer por dentro <span>→</span></button></div>
        <ol className="process-steps">
          <li><span>01</span><div><strong>Cadastre a empresa</strong><p>O profissional informa o perfil financeiro e a necessidade de crédito.</p></div><b>↗</b></li>
          <li><span>02</span><div><strong>Encontre os FIDCs</strong><p>As regras comparam o perfil da operação com cada fundo ativo.</p></div><b>↗</b></li>
          <li><span>03</span><div><strong>Complete o checklist</strong><p>A distribuição é liberada somente após a validação documental.</p></div><b>↗</b></li>
          <li><span>04</span><div><strong>Acompanhe até o resultado</strong><p>Reunião, comitê, proposta e comissão ficam registrados na jornada.</p></div><b>✓</b></li>
        </ol>
      </section>

      <section className="landing-audience" id="para-quem">
        <div className="audience-copy"><p className="landing-kicker dark"><span /> FEITA PARA QUEM ORIGINA NEGÓCIOS</p><h2>Mais acesso ao crédito.<br/><em>Mais valor para a relação.</em></h2></div>
        <div className="audience-grid">
          {["Assessores de investimentos", "Gerentes comerciais de bancos", "Gerentes comerciais de FIDCs", "Consultores de captação", "Consultores financeiros", "Contadores"].map((audience, index) => <article key={audience}><span>{String(index + 1).padStart(2, "0")}</span><strong>{audience}</strong><b>→</b></article>)}
        </div>
        <div className="audience-statement"><span>“</span><p>Transforme cada indicação em uma operação estruturada, rastreável e conectada aos FIDCs certos.</p></div>
      </section>

      <section className="landing-security" id="seguranca">
        <div className="security-orbit" aria-hidden="true"><span/><span/><span/><div>U</div></div>
        <div className="security-copy"><p className="landing-kicker"><span /> SEGURANÇA E GOVERNANÇA</p><h2>Confiança não é uma etapa.<br/><em>É parte da arquitetura.</em></h2><p>A versão de produção será construída com isolamento individual, menor privilégio, rastreabilidade e proteção do ciclo de vida dos documentos.</p><div className="security-principles"><article><span>01</span><strong>LGPD por concepção</strong><p>Minimização, finalidade, retenção e descarte definidos desde o início.</p></article><article><span>02</span><strong>Decisões explicáveis</strong><p>Regras objetivas e critérios visíveis, sem uma caixa-preta comercial.</p></article><article><span>03</span><strong>Isolamento de dados</strong><p>Cada profissional acessa somente suas próprias empresas e operações.</p></article><article><span>04</span><strong>Trilha de auditoria</strong><p>Acessos, mudanças e eventos relevantes registrados para controle.</p></article></div></div>
      </section>

      <section className="landing-final-cta">
        <p className="landing-kicker dark"><span /> PRONTO PARA ENCONTRAR O MATCH?</p>
        <h2>Leve uma operação.<br/><em>Encontre o capital certo.</em></h2>
        <button className="landing-primary" onClick={onAccess}>Acessar demonstração <span>→</span></button>
        <small>Ambiente mockado · Não utilize dados reais</small>
      </section>

      <footer className="landing-footer">
        <div><a className="landing-brand" href="#inicio"><span className="brand-mark">U</span><span>URUS <b>FIDC</b></span></a><p>O matching inteligente entre empresas e FIDCs.</p></div>
        <div><span>PLATAFORMA</span><a href="#plataforma">Solução</a><a href="#como-funciona">Como funciona</a><button onClick={onAccess}>Acessar portal</button></div>
        <div><span>GOVERNANÇA</span><a href="#seguranca">Segurança</a><a href="#seguranca">LGPD</a><a href="#seguranca">Matching explicável</a></div>
        <div className="footer-note"><p>© 2026 Urus FIDC</p><p>Protótipo para validação</p></div>
      </footer>
    </main>
  );
}

function Login({ onLogin, onBack }: { onLogin: (user: User) => void; onBack: () => void }) {
  return (
    <main className="login-shell">
      <section className="login-brand-panel">
        <div className="login-brand"><span className="brand-mark large">U</span><span>URUS <b>FIDC</b></span></div>
        <div className="login-message"><p className="eyebrow light">CRÉDITO QUE ENCONTRA O CAMINHO CERTO</p><h1>O matching inteligente entre empresas e FIDCs.</h1><p>Qualifique operações, encontre parceiros aderentes e acompanhe cada etapa com transparência.</p></div>
        <div className="login-trust"><span>● Ambiente demonstrativo</span><span>LGPD por concepção</span><span>Decisões explicáveis</span></div>
      </section>
      <section className="login-access-panel">
        <div className="login-box">
          <button className="login-back" onClick={onBack}>← Voltar para o site</button>
          <p className="eyebrow">ACESSO AO PROTÓTIPO</p><h2>Escolha um perfil</h2><p>Os dados são fictícios e restaurados ao recarregar a página.</p>
          <div className="access-list">
            {USERS.map((user) => (
              <button key={user.id} onClick={() => onLogin(user)}>
                <span className={`avatar ${user.role === "admin" ? "admin-avatar" : ""}`}>{user.initials}</span>
                <span><strong>{user.name}</strong><small>{user.role === "admin" ? "Administrador Urus FIDC" : user.professionalType}</small></span>
                <b>→</b>
              </button>
            ))}
          </div>
          <div className="privacy-box"><span>♙</span><p><strong>Não use dados reais.</strong><br />Nenhuma informação deste protótipo é persistida ou compartilhada.</p></div>
        </div>
      </section>
    </main>
  );
}

export default function Home() {
  const [entry, setEntry] = useState<"home" | "login">("home");
  const [session, setSession] = useState<User | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [fidcs, setFidcs] = useState<FidcProfile[]>(INITIAL_FIDCS);
  const [operations, setOperations] = useState<Operation[]>(INITIAL_OPERATIONS);
  const [selectedOperationId, setSelectedOperationId] = useState("OP-2026-084");
  const [detailTab, setDetailTab] = useState<DetailTab>("summary");
  const [documents, setDocuments] = useState<Record<string, ChecklistDocument[]>>(() => Object.fromEntries(INITIAL_OPERATIONS.map((operation) => [operation.id, createDocuments(operation.id, operation.ownerId, operation.selectedFidcs.length ? operation.selectedFidcs : ["standard"])])));
  const [uploads, setUploads] = useState<UploadedDocument[]>([]);
  const [reviews, setReviews] = useState<AiDocumentReview[]>(INITIAL_REVIEWS);
  const [selections, setSelections] = useState<FidcSelection[]>(INITIAL_SELECTIONS);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>(INITIAL_CHECKLIST_TEMPLATES);
  const [notifications, setNotifications] = useState<NotificationEvent[]>(INITIAL_NOTIFICATIONS);
  const [packages, setPackages] = useState<DistributionPackage[]>([]);
  const [deliveries, setDeliveries] = useState<SecureDelivery[]>([]);
  const [planVersions, setPlanVersions] = useState<PlanVersion[]>(INITIAL_PLAN_VERSIONS);
  const [subscriptions] = useState<Subscription[]>(INITIAL_SUBSCRIPTIONS);
  const [usagePeriods, setUsagePeriods] = useState<UsagePeriod[]>(INITIAL_USAGE);
  const [proposals] = useState<Proposal[]>(INITIAL_PROPOSALS);
  const [commissions] = useState<Commission[]>(INITIAL_COMMISSIONS);
  const [journeys, setJourneys] = useState<Record<string, JourneyState>>({
    "OP-2026-084": { ...EMPTY_JOURNEY, sentToUrus: true },
    "OP-2026-079": { ...EMPTY_JOURNEY, sentToUrus: true, distributed: true, interested: true, meetingScheduled: true },
    "OP-2026-071": { sentToUrus: true, distributed: true, interested: true, meetingScheduled: true, committeeResult: "Aprovado", proposalShared: true, commission: "Recebida pela Urus FIDC" },
  });
  const [formStep, setFormStep] = useState(1);
  const [operationForm, setOperationForm] = useState<OperationForm>(EMPTY_OPERATION);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");
  const [fidcSearch, setFidcSearch] = useState("");
  const [showFidcForm, setShowFidcForm] = useState(false);
  const [editingFidcId, setEditingFidcId] = useState<string | null>(null);
  const [fidcError, setFidcError] = useState("");
  const [fidcForm, setFidcForm] = useState<FidcProfile>({ id: "", name: "", email: "", status: "Rascunho", minRevenue: 0, revenueMode: "Mínimo", revenueRequired: true, segments: [], operationTypes: [], regions: [], weights: { revenue: 25, segment: 20, operation: 35, region: 20 }, checklistTemplateId: "tpl-standard", createdAt: "16/08/2026", linkedOperations: 0 });

  const userOperations = useMemo(() => session ? operations.filter((operation) => session.role === "admin" || operation.ownerId === session.id) : [], [operations, session]);
  const selectedOperation = operations.find((operation) => operation.id === selectedOperationId) ?? userOperations[0];
  const currentDocuments = selectedOperation ? documents[selectedOperation.id] ?? [] : [];
  const allDocumentsApproved = currentDocuments.length > 0 && currentDocuments.filter((document) => document.required).every((document) => document.status === "Aprovado");
  const matches = selectedOperation ? calculateMatches(selectedOperation, fidcs) : [];
  const currentJourney = selectedOperation ? journeys[selectedOperation.id] ?? EMPTY_JOURNEY : EMPTY_JOURNEY;
  const currentSelections = selectedOperation ? selections.filter((selection) => selection.operationId === selectedOperation.id) : [];

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  function navigate(next: View) {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const handleCompanyFound = useCallback((companyName: string, state: string, city: string) => {
    setOperationForm((form) => ({ ...form, companyName, state, city }));
  }, []);

  function openOperation(operation: Operation, tab: DetailTab = "summary") {
    setSelectedOperationId(operation.id);
    setDetailTab(tab);
    navigate("operation-detail");
  }

  function fillExample() {
    setOperationForm({ companyName: "Horizonte Agroindustrial Ltda.", cnpj: "11222333000181", segment: "Agro", annualRevenue: 5_200_000_000, city: "Campo Grande", state: "MS", amount: 500_000_000, operationType: "Capital de Giro", hasGuarantee: true, guaranteeValue: 750_000_000, guaranteeType: "Recebíveis", salesMethod: "Contratos B2B recorrentes", receiptMethod: "Boleto e transferência" });
    setFormError("");
  }

  function nextFormStep() {
    let error = "";
    if (formStep === 1 && (!operationForm.companyName || !isValidCnpj(operationForm.cnpj) || !operationForm.segment || !operationForm.annualRevenue || !operationForm.city || !operationForm.state)) error = "Preencha os dados obrigatórios e informe um CNPJ válido.";
    if (formStep === 2 && (!operationForm.amount || !operationForm.operationType)) error = "Informe o valor e o tipo da operação.";
    if (formStep === 3 && ((operationForm.hasGuarantee && (!operationForm.guaranteeValue || !operationForm.guaranteeType)) || !operationForm.salesMethod || !operationForm.receiptMethod)) error = "Complete as informações de garantia, vendas e recebimentos.";
    if (error) return setFormError(error);
    setFormError("");
    if (formStep < 4) return setFormStep((step) => step + 1);
    if (!session) return;
    const subscription = subscriptions.find((current) => current.userId === session.id);
    const usage = usagePeriods.find((current) => current.subscriptionId === subscription?.id);
    if (!usage) return setFormError("Não foi possível localizar a franquia da assinatura demonstrativa.");
    let consumed: UsagePeriod;
    try {
      consumed = BillingService.consumeCase(usage, false);
    } catch (caught) {
      return setFormError(caught instanceof Error ? caught.message : "Franquia mensal atingida.");
    }
    const id = `OP-2026-${String(operations.length + 85).padStart(3, "0")}`;
    const operation: Operation = { ...operationForm, cnpj: onlyDigits(operationForm.cnpj), id, ownerId: session.id, createdAt: "16/08/2026", status: "Qualificação", selectedFidcs: [], matchingSubmittedAt: "16/08/2026" };
    setOperations((items) => [operation, ...items]);
    setUsagePeriods((items) => items.map((current) => current.subscriptionId === consumed.subscriptionId ? consumed : current));
    setDocuments((items) => ({ ...items, [id]: [] }));
    setJourneys((items) => ({ ...items, [id]: EMPTY_JOURNEY }));
    setSelectedOperationId(id);
    setDetailTab("matching");
    setOperationForm(EMPTY_OPERATION);
    setFormStep(1);
    navigate("operation-detail");
    notify("Operação qualificada e matching processado.");
  }

  function requestFidc(fidcId: string, eligible: boolean, reason?: string) {
    if (!selectedOperation) return;
    const existing = selections.find((selection) => selection.operationId === selectedOperation.id && selection.fidcId === fidcId);
    if (existing?.decision === "Aprovado") return notify("Este FIDC já foi aprovado pela Urus.");
    if (!eligible && !reason?.trim()) return notify("Informe uma justificativa para solicitar a exceção.");
    const next: FidcSelection = {
      id: existing?.id ?? `${selectedOperation.id}-${fidcId}-${Date.now()}`,
      operationId: selectedOperation.id,
      fidcId,
      origin: eligible ? "Automático" : "Solicitação manual",
      decision: "Solicitado",
      reason: reason?.trim(),
      requestedBy: session?.id ?? selectedOperation.ownerId,
      requestedAt: "16/08/2026 10:30",
    };
    setSelections((items) => existing ? items.map((selection) => selection.id === existing.id ? next : selection) : [next, ...items]);
    notify(eligible ? "FIDC sugerido para análise da Urus." : "Exceção enviada para análise da Urus.");
  }

  function setDocumentStatus(documentId: string, status: ChecklistDocument["status"]) {
    if (!selectedOperation) return;
    setDocuments((items) => ({ ...items, [selectedOperation.id]: (items[selectedOperation.id] ?? []).map((document) => document.id === documentId ? { ...document, status } : document) }));
    setNotifications((events) => NotificationService.enqueue(events, { operationId: selectedOperation.id, audience: "Profissional", title: `Documento ${status.toLowerCase()}`, summary: "A Urus atualizou a conferência de um documento da operação.", dedupeKey: `${selectedOperation.id}-${documentId}-${status}-professional` }));
  }

  function approveAllDocuments() {
    if (!selectedOperation) return;
    setDocuments((items) => ({ ...items, [selectedOperation.id]: (items[selectedOperation.id] ?? []).map((document) => ({ ...document, status: "Aprovado" })) }));
    setOperations((items) => items.map((operation) => operation.id === selectedOperation.id ? { ...operation, status: "Documentos" } : operation));
    notify("Checklist validado. A distribuição foi liberada.");
  }

  async function uploadDocument(requirementId: string, file: File) {
    if (!selectedOperation || !session) return;
    const requirement = currentDocuments.find((document) => document.id === requirementId);
    if (!requirement) return;
    const equivalent = currentDocuments.filter((document) => document.name === requirement.name);
    try {
      const uploaded = await DocumentStorageService.upload(file, selectedOperation.id, session.id, equivalent.map((document) => document.id));
      setUploads((items) => [uploaded, ...items]);
      setDocuments((items) => ({ ...items, [selectedOperation.id]: (items[selectedOperation.id] ?? []).map((document) => equivalent.some((candidate) => candidate.id === document.id) ? { ...document, status: "Analisando", uploadedDocumentIds: [...new Set([...document.uploadedDocumentIds, uploaded.id])] } : document) }));
      notify(`Arquivo vinculado a ${equivalent.length} checklist(s). IA simulada em andamento.`);
      const results = await Promise.all(equivalent.map((document) => DocumentAiService.review(uploaded, document)));
      setReviews((items) => [...results, ...items.filter((review) => !results.some((result) => result.requirementId === review.requirementId))]);
      setDocuments((items) => ({ ...items, [selectedOperation.id]: (items[selectedOperation.id] ?? []).map((document) => {
        const result = results.find((review) => review.requirementId === document.id);
        return result ? { ...document, aiReviewId: result.id, status: "Revisão necessária" } : document;
      }) }));
      setNotifications((events) => NotificationService.enqueue(events, { operationId: selectedOperation.id, audience: "Urus", title: "Documento pronto para revisão", summary: "A análise preliminar foi concluída e aguarda decisão humana.", dedupeKey: `${selectedOperation.id}-${uploaded.id}-review-urus` }));
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : "Não foi possível carregar o arquivo.");
    }
  }

  function updateJourney(changes: Partial<JourneyState>, message: string) {
    if (!selectedOperation) return;
    setJourneys((items) => ({ ...items, [selectedOperation.id]: { ...(items[selectedOperation.id] ?? EMPTY_JOURNEY), ...changes } }));
    notify(message);
  }

  function sendToUrus() {
    if (!selectedOperation) return;
    const requested = selections.some((selection) => selection.operationId === selectedOperation.id && ["Solicitado", "Aprovado"].includes(selection.decision));
    if (!requested) return notify("Sugira ao menos um FIDC antes de enviar para a Urus.");
    updateJourney({ sentToUrus: true }, "Operação enviada para análise da Urus.");
    setOperations((items) => items.map((operation) => operation.id === selectedOperation.id ? { ...operation, status: "Revisão Urus" } : operation));
    setNotifications((events) => NotificationService.enqueue(events, { operationId: selectedOperation.id, audience: "Urus", title: "Nova operação para análise", summary: "Um profissional enviou uma operação qualificada para revisão.", dedupeKey: `${selectedOperation.id}-submitted-urus` }));
  }

  function decideSelection(selectionId: string, decision: "Aprovado" | "Rejeitado") {
    const selection = selections.find((current) => current.id === selectionId);
    if (!selection) return;
    const operation = operations.find((current) => current.id === selection.operationId);
    if (!operation) return;
    setSelections((items) => items.map((current) => current.id === selectionId ? { ...current, decision, decidedBy: session?.id ?? "admin", decidedAt: "16/08/2026 10:30" } : current));
    if (decision === "Aprovado") {
      setOperations((items) => items.map((current) => current.id === operation.id ? { ...current, status: "Documentos", selectedFidcs: [...new Set([...current.selectedFidcs, selection.fidcId])] } : current));
      setDocuments((items) => {
        const existing = items[operation.id] ?? [];
        if (existing.some((document) => document.fidcId === selection.fidcId)) return items;
        return { ...items, [operation.id]: [...existing, ...createDocuments(operation.id, operation.ownerId, [selection.fidcId], templates).map((document) => ({ ...document, status: "Pendente" as const }))] };
      });
    }
    setNotifications((events) => NotificationService.enqueue(events, { operationId: operation.id, audience: "Profissional", title: decision === "Aprovado" ? "FIDC aprovado pela Urus" : "Sugestão de FIDC não aprovada", summary: "A análise da seleção de FIDC foi concluída.", dedupeKey: `${operation.id}-${selection.fidcId}-${decision}-professional` }));
    notify(`Seleção ${decision.toLowerCase()} pela Urus.`);
  }

  function distributeToFidc(operationId: string, fidcId: string) {
    const operation = operations.find((current) => current.id === operationId);
    const fidc = fidcs.find((current) => current.id === fidcId);
    const requirements = documents[operationId]?.filter((document) => document.fidcId === fidcId && document.required) ?? [];
    if (!operation || !fidc || !requirements.length || requirements.some((document) => document.status !== "Aprovado")) return notify("O checklist deste FIDC ainda possui pendências.");
    if (deliveries.some((delivery) => packages.find((item) => item.id === delivery.packageId)?.operationId === operationId && packages.find((item) => item.id === delivery.packageId)?.fidcId === fidcId)) return notify("Este pacote já foi enviado.");
    const packageId = `pkg-${operationId}-${fidcId}`;
    const nextPackage: DistributionPackage = { id: packageId, operationId, fidcId, requirementIds: requirements.map((item) => item.id), documentIds: uploads.filter((upload) => upload.operationId === operationId && upload.requirementIds.some((id) => requirements.some((requirement) => requirement.id === id))).map((upload) => upload.id), createdAt: "16/08/2026 10:30", status: "Enviado" };
    const delivery: SecureDelivery = { id: `delivery-${operationId}-${fidcId}`, packageId, recipientEmail: fidc.email, expiresAt: "23/08/2026 10:30", status: "Enviado", tokenPreview: "urus_••••••••" };
    setPackages((items) => [nextPackage, ...items]);
    setDeliveries((items) => [delivery, ...items]);
    const alreadySent = packages.filter((item) => item.operationId === operationId).map((item) => item.fidcId);
    const everySent = operation.selectedFidcs.every((id) => id === fidcId || alreadySent.includes(id));
    setJourneys((items) => ({ ...items, [operationId]: { ...(items[operationId] ?? EMPTY_JOURNEY), distributed: everySent } }));
    setOperations((items) => items.map((current) => current.id === operationId ? { ...current, status: "Em análise" } : current));
    setNotifications((events) => {
      let next = NotificationService.enqueue(events, { operationId, audience: "FIDC", title: "Nova oportunidade Urus FIDC", summary: "Uma operação foi disponibilizada por link seguro e temporário.", dedupeKey: `${operationId}-${fidcId}-distribution-fidc` });
      next = NotificationService.enqueue(next, { operationId, audience: "Profissional", title: "Operação distribuída", summary: "A Urus encaminhou o pacote ao FIDC aprovado.", dedupeKey: `${operationId}-${fidcId}-distribution-professional` });
      return next;
    });
    notify(`Pacote enviado para ${fidc.name} por link seguro.`);
  }

  function startNewFidc() {
    setEditingFidcId(null);
    setFidcForm({ id: "", name: "", email: "", status: "Rascunho", minRevenue: 0, revenueMode: "Mínimo", revenueRequired: true, segments: [], operationTypes: [], regions: [], weights: { revenue: 25, segment: 20, operation: 35, region: 20 }, checklistTemplateId: "tpl-standard", createdAt: "16/08/2026", linkedOperations: 0 });
    setFidcError("");
    setShowFidcForm(true);
  }

  function editFidc(fidc: FidcProfile) {
    setEditingFidcId(fidc.id);
    setFidcForm({ ...fidc, segments: [...fidc.segments], operationTypes: [...fidc.operationTypes], regions: [...fidc.regions] });
    setFidcError("");
    setShowFidcForm(true);
  }

  function saveFidc() {
    const duplicate = fidcs.some((fidc) => fidc.id !== editingFidcId && fidc.name.trim().toLowerCase() === fidcForm.name.trim().toLowerCase());
    const complete = Boolean(fidcForm.name.trim() && fidcForm.email.includes("@") && fidcForm.minRevenue > 0 && fidcForm.segments.length && fidcForm.operationTypes.length && fidcForm.regions.length);
    if (!fidcForm.name.trim()) return setFidcError("Informe o nome do FIDC.");
    if (duplicate) return setFidcError("Já existe um FIDC com este nome.");
    if (fidcForm.status === "Ativo" && !complete) return setFidcError("Para ativar, complete e-mail, faturamento, segmento, operação e região.");
    const savedId = editingFidcId ?? fidcForm.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
    const saved = { ...fidcForm, id: savedId, checklistTemplateId: editingFidcId ? fidcForm.checklistTemplateId : `tpl-${savedId}` };
    setFidcs((items) => editingFidcId ? items.map((fidc) => fidc.id === editingFidcId ? saved : fidc) : [saved, ...items]);
    if (!editingFidcId) {
      const standard = templates.find((template) => template.id === "tpl-standard");
      if (standard) setTemplates((items) => [...items, { ...structuredClone(standard), id: `tpl-${savedId}`, name: `Checklist ${saved.name}`, scope: "FIDC", fidcId: savedId, versions: standard.versions.map((version) => ({ ...version, id: `tpl-${savedId}-v${version.version}`, items: version.items.map((item) => ({ ...item })) })) }]);
    }
    setShowFidcForm(false);
    notify(editingFidcId ? "Perfil do FIDC atualizado." : "Novo FIDC cadastrado como rascunho.");
  }

  function changeFidcStatus(fidcId: string, status: FidcStatus) {
    const fidc = fidcs.find((item) => item.id === fidcId);
    const complete = Boolean(fidc?.name.trim() && fidc.email.includes("@") && fidc.minRevenue > 0 && fidc.segments.length && fidc.operationTypes.length && fidc.regions.length);
    if (status === "Ativo" && !complete) return notify("Complete e-mail, faturamento, segmento, operação e região antes de ativar.");
    setFidcs((items) => items.map((fidc) => fidc.id === fidcId ? { ...fidc, status } : fidc));
    notify(status === "Arquivado" ? "FIDC arquivado com histórico preservado." : `Status alterado para ${status.toLowerCase()}.`);
  }

  function saveChecklistItem(templateId: string, draft: ChecklistTemplateItem) {
    setTemplates((items) => items.map((template) => {
      if (template.id !== templateId) return template;
      const active = template.versions.find((version) => version.version === template.activeVersion) ?? template.versions[0];
      const exists = active.items.some((item) => item.id === draft.id);
      const nextItems = exists ? active.items.map((item) => item.id === draft.id ? draft : item) : [...active.items, { ...draft, order: active.items.length + 1 }];
      const nextVersion = template.activeVersion + 1;
      return { ...template, activeVersion: nextVersion, versions: [...template.versions, { id: `${template.id}-v${nextVersion}`, version: nextVersion, createdAt: "16/08/2026", createdBy: session?.id ?? "admin", items: nextItems }] };
    }));
    notify("Nova versão do checklist criada sem alterar operações em andamento.");
  }

  function archiveChecklistItem(templateId: string, itemId: string) {
    const template = templates.find((current) => current.id === templateId);
    const active = template?.versions.find((version) => version.version === template.activeVersion);
    const current = active?.items.find((item) => item.id === itemId);
    if (current) saveChecklistItem(templateId, { ...current, active: false });
  }

  function createPlanVersion(price: number, limit: number) {
    const latest = [...planVersions].sort((a, b) => b.version - a.version)[0];
    const next: PlanVersion = { id: `urus-100-v${(latest?.version ?? 0) + 1}`, name: "Urus 100", version: (latest?.version ?? 0) + 1, price, monthlyCaseLimit: limit, status: "Ativo", effectiveFrom: "01/09/2026" };
    setPlanVersions((items) => [...items.map((plan): PlanVersion => ({ ...plan, status: "Arquivado" })), next]);
    notify("Nova versão do plano criada para futuras assinaturas.");
  }

  function resetDemo() {
    setFidcs(INITIAL_FIDCS);
    setOperations(INITIAL_OPERATIONS);
    setDocuments(Object.fromEntries(INITIAL_OPERATIONS.map((operation) => [operation.id, createDocuments(operation.id, operation.ownerId, operation.selectedFidcs.length ? operation.selectedFidcs : ["standard"])])));
    setUploads([]);
    setReviews(INITIAL_REVIEWS);
    setSelections(INITIAL_SELECTIONS);
    setTemplates(INITIAL_CHECKLIST_TEMPLATES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setPackages([]);
    setDeliveries([]);
    setPlanVersions(INITIAL_PLAN_VERSIONS);
    setUsagePeriods(INITIAL_USAGE);
    setJourneys({ "OP-2026-084": { ...EMPTY_JOURNEY, sentToUrus: true }, "OP-2026-079": { ...EMPTY_JOURNEY, sentToUrus: true, distributed: true, interested: true, meetingScheduled: true }, "OP-2026-071": { sentToUrus: true, distributed: true, interested: true, meetingScheduled: true, committeeResult: "Aprovado", proposalShared: true, commission: "Recebida pela Urus FIDC" } });
    navigate("dashboard");
    notify("Demonstração restaurada.");
  }

  if (!session && entry === "home") return <Landing onAccess={() => setEntry("login")} />;
  if (!session) return <Login onBack={() => setEntry("home")} onLogin={(user) => { setSession(user); setView(user.role === "admin" ? "fidcs" : "dashboard"); }} />;

  const professionalNav: { id: View; label: string; icon: string }[] = [
    { id: "dashboard", label: "Visão geral", icon: "⌂" }, { id: "operations", label: "Operações", icon: "▤" },
    { id: "reports", label: "Relatórios", icon: "↧" },
    { id: "account", label: "Minha assinatura", icon: "◎" },
  ];
  const adminNav: { id: View; label: string; icon: string }[] = [
    { id: "distribution", label: "Distribuição", icon: "↗" }, { id: "fidcs", label: "FIDCs", icon: "◇" }, { id: "checklist", label: "Checklists", icon: "▱" },
    { id: "reports", label: "Relatórios", icon: "↧" },
    { id: "professionals", label: "Profissionais", icon: "◉" }, { id: "subscriptions", label: "Assinaturas", icon: "◎" },
  ];
  const nav = session.role === "admin" ? adminNav : professionalNav;

  return (
    <main className="app-shell">
      {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">U</span><span>URUS <b>FIDC</b></span></div>
        <div className="role-chip">{session.role === "admin" ? "ADMINISTRAÇÃO" : "ÁREA DO PROFISSIONAL"}</div>
        <nav className="nav-list" aria-label="Navegação principal">
          {nav.map((item) => <button key={item.id} className={view === item.id || (item.id === "operations" && ["new-operation", "operation-detail"].includes(view)) ? "nav-item active" : "nav-item"} onClick={() => navigate(item.id)}><span>{item.icon}</span>{item.label}{item.id === "operations" && <span className="nav-count">{userOperations.length}</span>}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <button className="reset-button" onClick={resetDemo}>↻ Restaurar demonstração</button>
          <div className="security-note"><span>●</span><div><strong>Ambiente protegido</strong><small>Dados demonstrativos</small></div></div>
          <button className="profile-card" onClick={() => { setSession(null); setEntry("home"); setView("dashboard"); }}><span className="avatar">{session.initials}</span><span><strong>{session.name}</strong><small>{session.role === "admin" ? "Administrador" : session.professionalType}</small></span><span>↗</span></button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar"><div className="demo-pill"><span /> MODO DEMONSTRAÇÃO · NÃO USE DADOS REAIS</div><div className="top-actions"><button aria-label="Central de ajuda">?</button><button aria-label="Notificações" onClick={() => navigate("notifications")}>♢<b>{notifications.filter((event) => event.status !== "Lido" && (session.role === "admin" ? event.audience === "Urus" : event.audience === "Profissional")).length}</b></button></div></header>

        {view === "dashboard" && <Dashboard user={session} operations={userOperations} fidcs={fidcs} onNew={() => navigate("new-operation")} onOpen={openOperation} />}
        {view === "operations" && <OperationsPage operations={userOperations} onNew={() => navigate("new-operation")} onOpen={openOperation} />}
        {view === "new-operation" && <NewOperation step={formStep} form={operationForm} error={formError} onChange={(field, value) => setOperationForm((form) => ({ ...form, [field]: value }))} onCompanyFound={handleCompanyFound} onNext={nextFormStep} onBack={() => formStep > 1 ? setFormStep((step) => step - 1) : navigate("operations")} onFill={fillExample} />}
        {view === "operation-detail" && selectedOperation && <OperationDetail role={session.role} operation={selectedOperation} tab={detailTab} setTab={setDetailTab} matches={matches} selections={currentSelections} documents={currentDocuments} uploads={uploads.filter((upload) => upload.operationId === selectedOperation.id)} reviews={reviews} fidcs={fidcs} proposals={proposals} journey={currentJourney} allApproved={allDocumentsApproved} onBack={() => navigate("operations")} onRequestFidc={requestFidc} onDocument={setDocumentStatus} onUpload={uploadDocument} onApproveAll={approveAllDocuments} onSendToUrus={sendToUrus} onJourney={updateJourney} onOperationStatus={(status) => setOperations((items) => items.map((operation) => operation.id === selectedOperation.id ? { ...operation, status } : operation))} />}
        {view === "distribution" && <DistributionQueue operations={operations} users={USERS} fidcs={fidcs} selections={selections} documents={documents} packages={packages} deliveries={deliveries} onDecision={decideSelection} onDistribute={distributeToFidc} onOpen={openOperation} />}
        {view === "fidcs" && <AdminFidcs fidcs={fidcs} search={fidcSearch} setSearch={setFidcSearch} onNew={startNewFidc} onEdit={editFidc} onStatus={changeFidcStatus} />}
        {view === "checklist" && <AdminChecklist templates={templates} fidcs={fidcs} onSave={saveChecklistItem} onArchive={archiveChecklistItem} />}
        {view === "reports" && <ReportsPage role={session.role} operations={userOperations} allOperations={operations} users={USERS} documents={documents} uploads={uploads} fidcs={fidcs} proposals={proposals} commissions={session.role === "admin" ? commissions : commissions.filter((commission) => commission.professionalId === session.id)} notify={notify} />}
        {view === "notifications" && <NotificationsPage role={session.role} notifications={notifications} onRead={(id) => setNotifications((items) => items.map((event) => event.id === id ? { ...event, status: "Lido" } : event))} />}
        {view === "professionals" && <ProfessionalsPage />}
        {view === "subscriptions" && <SubscriptionsPage plans={planVersions} subscriptions={subscriptions} usage={usagePeriods} onCreateVersion={createPlanVersion} />}
        {view === "account" && <AccountPage user={session} operations={userOperations} plans={planVersions} subscription={subscriptions.find((item) => item.userId === session.id)} usage={usagePeriods.find((item) => item.subscriptionId === subscriptions.find((subscription) => subscription.userId === session.id)?.id)} notify={notify} />}
      </section>

      {showFidcForm && <FidcModal form={fidcForm} setForm={setFidcForm} error={fidcError} editing={Boolean(editingFidcId)} onClose={() => setShowFidcForm(false)} onSave={saveFidc} />}
    </main>
  );
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="welcome-row page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function Dashboard({ user, operations, fidcs, onNew, onOpen }: { user: User; operations: Operation[]; fidcs: FidcProfile[]; onNew: () => void; onOpen: (operation: Operation, tab?: DetailTab) => void }) {
  const volume = operations.reduce((sum, operation) => sum + operation.amount, 0);
  return <div className="page-content">
    <PageHeader eyebrow="SÁBADO, 15 DE AGOSTO" title={`Olá, ${user.name.split(" ")[0]}.`} description="Acompanhe suas oportunidades e encontre o FIDC certo para cada operação." action={<button className="primary-button" onClick={onNew}><span>＋</span> Nova operação</button>} />
    <div className="metrics-grid">
      <article className="metric-card featured"><div className="metric-icon">↗</div><span>Volume em operações</span><strong>{currency(volume, true)}</strong><small><b>+12,4%</b> nos últimos 30 dias</small></article>
      <article className="metric-card"><div className="metric-icon">◇</div><span>FIDCs disponíveis</span><strong>{fidcs.filter((fidc) => fidc.status === "Ativo").length}</strong><small>perfis ativos no matching</small></article>
      <article className="metric-card"><div className="metric-icon">✓</div><span>Crédito aprovado</span><strong>{currency(operations.filter((operation) => operation.status === "Aprovada").reduce((sum, operation) => sum + operation.amount, 0), true)}</strong><small>{operations.filter((operation) => operation.status === "Aprovada").length} operação concluída</small></article>
      <article className="metric-card"><div className="metric-icon">◎</div><span>Comissões previstas</span><strong>R$ 84,5 mil</strong><small>Próximo repasse em 22 ago</small></article>
    </div>
    <div className="content-grid">
      <section className="panel"><div className="panel-heading"><div><h2>Operações recentes</h2><p>Atualizações da sua carteira</p></div></div><OperationRows operations={operations.slice(0, 4)} onOpen={onOpen} /></section>
      <aside className="panel journey-panel"><div className="panel-heading"><div><h2>Próximos passos</h2><p>3 ações precisam de você</p></div><span className="attention-dot">3</span></div><div className="task-list">
        <button onClick={() => operations[0] && onOpen(operations[0], "documents")}><span className="task-icon gold">▱</span><span><strong>Documentos pendentes</strong><small>{operations[0]?.companyName}</small></span><b>›</b></button>
        <button onClick={() => operations[1] && onOpen(operations[1], "journey")}><span className="task-icon navy">◷</span><span><strong>Reunião amanhã, 10h30</strong><small>Vértice Logística + Multiplica</small></span><b>›</b></button>
        <button onClick={() => operations[2] && onOpen(operations[2], "journey")}><span className="task-icon green">R$</span><span><strong>Comissão liberada</strong><small>R$ 28.400 disponível</small></span><b>›</b></button>
      </div><div className="insight-card"><div className="spark">✦</div><div><span>INSIGHT URUS</span><strong>Uma nova operação pode ser qualificada em poucos minutos.</strong><button onClick={onNew}>Iniciar qualificação →</button></div></div></aside>
    </div>
  </div>;
}

function OperationRows({ operations, onOpen }: { operations: Operation[]; onOpen: (operation: Operation) => void }) {
  return <div className="operation-list">{operations.map((operation) => <button className="operation-row" key={operation.id} onClick={() => onOpen(operation)}><span className="company-logo">{initials(operation.companyName)}</span><span className="operation-main"><strong>{operation.companyName}</strong><small>{operation.id} · {operation.operationType}</small></span><span className="operation-amount"><strong>{currency(operation.amount, true)}</strong><small>{operation.state} · {operation.segment}</small></span><span className={`status status-${operation.status.toLowerCase().replaceAll(" ", "-")}`}>{operation.status}</span><span className="row-arrow">›</span></button>)}</div>;
}

function OperationsPage({ operations, onNew, onOpen }: { operations: Operation[]; onNew: () => void; onOpen: (operation: Operation) => void }) {
  return <div className="page-content"><PageHeader eyebrow="CARTEIRA" title="Suas operações" description={`${operations.length} oportunidades visíveis somente para este profissional.`} action={<button className="primary-button" onClick={onNew}>＋ Nova operação</button>} /><section className="panel table-panel"><div className="filter-row"><input aria-label="Buscar operação" placeholder="Buscar por empresa, CNPJ ou operação..."/><select aria-label="Filtrar por status"><option>Todos os status</option><option>Qualificação</option><option>Documentos</option><option>Em análise</option><option>Aprovada</option></select></div><OperationRows operations={operations} onOpen={onOpen}/></section><div className="tenant-note">♙ Isolamento ativo: você visualiza apenas as operações vinculadas ao seu usuário.</div></div>;
}

function NewOperation({ step, form, error, onChange, onCompanyFound, onNext, onBack, onFill }: { step: number; form: OperationForm; error: string; onChange: (field: keyof OperationForm, value: string | number | boolean) => void; onCompanyFound: (companyName: string, state: string, city: string) => void; onNext: () => void; onBack: () => void; onFill: () => void }) {
  const titles = ["Vamos conhecer a empresa.", "Qual é a necessidade de crédito?", "Como a operação será estruturada?", "Revise antes do matching."];
  return <div className="page-content form-page"><button className="back-button" onClick={onBack}>← {step === 1 ? "Voltar para operações" : "Etapa anterior"}</button><div className="form-header"><div><p className="eyebrow">NOVA OPERAÇÃO</p><h1>{titles[step - 1]}</h1><p>As informações serão comparadas com os perfis configurados pelos FIDCs.</p></div><span>Etapa <b>{step}</b> de 4</span></div><div className="stepper">{[1, 2, 3, 4].map((item) => <span key={item} className={item <= step ? "done" : ""}/>)}</div><section className="form-card">{step === 1 && <><div className="form-card-title"><span>01</span><div><h2>Dados da empresa</h2><p>Identificação e porte financeiro.</p></div><button className="text-button" onClick={onFill}>Preencher exemplo</button></div><div className="form-grid"><Field label="CNPJ"><CnpjField value={form.cnpj} onChange={(value) => onChange("cnpj", value)} onFound={onCompanyFound}/></Field><Field label="Razão social" wide><input value={form.companyName} onChange={(event) => onChange("companyName", event.target.value)} placeholder="Ex.: Empresa Brasileira Ltda."/></Field><Field label="Segmento"><select value={form.segment} onChange={(event) => onChange("segment", event.target.value)}><option value="">Selecione</option>{SEGMENTS.map((segment) => <option key={segment}>{segment}</option>)}</select></Field><Field label="Faturamento anual"><MoneyField value={form.annualRevenue} onChange={(value) => onChange("annualRevenue", value)} /></Field><Field label="Estado"><select value={form.state} onChange={(event) => { onChange("state", event.target.value); onChange("city", ""); }}><option value="">UF</option>{BRAZIL_STATES.map((state) => <option key={state}>{state}</option>)}</select></Field><Field label="Cidade"><MunicipalityField state={form.state} value={form.city} onChange={(value) => onChange("city", value)}/></Field></div></>}
      {step === 2 && <><div className="form-card-title"><span>02</span><div><h2>Perfil da operação</h2><p>Valor solicitado e modalidade de crédito.</p></div></div><div className="form-grid"><Field label="Valor da operação"><MoneyField value={form.amount} onChange={(value) => onChange("amount", value)} /></Field><Field label="Tipo da operação"><select value={form.operationType} onChange={(event) => onChange("operationType", event.target.value)}><option value="">Selecione</option>{OPERATION_TYPES.map((type) => <option key={type}>{type}</option>)}</select></Field></div><div className="qualification-hint"><span>✦</span><p><strong>Por que perguntamos isso?</strong><br/>Modalidade e valor ajudam a encontrar FIDCs com apetite compatível.</p></div></>}
      {step === 3 && <><div className="form-card-title"><span>03</span><div><h2>Garantias e recebíveis</h2><p>Estrutura comercial da empresa.</p></div></div><div className="guarantee-choice"><label><input type="radio" name="guarantee" checked={form.hasGuarantee} onChange={() => onChange("hasGuarantee", true)}/> Possui garantia</label><label><input type="radio" name="guarantee" checked={!form.hasGuarantee} onChange={() => { onChange("hasGuarantee", false); onChange("guaranteeValue", 0); onChange("guaranteeType", ""); }}/> Não possuo garantia</label></div><div className="form-grid">{form.hasGuarantee && <><Field label="Valor da garantia"><MoneyField value={form.guaranteeValue} onChange={(value) => onChange("guaranteeValue", value)} /></Field><Field label="Tipo de garantia"><input value={form.guaranteeType} onChange={(event) => onChange("guaranteeType", event.target.value)} placeholder="Ex.: Recebíveis, imóvel, aval"/></Field></>}<Field label="Como a empresa vende?"><textarea value={form.salesMethod} onChange={(event) => onChange("salesMethod", event.target.value)} placeholder="Descreva os recebíveis e prazos"/></Field><Field label="Como a empresa recebe?"><textarea value={form.receiptMethod} onChange={(event) => onChange("receiptMethod", event.target.value)} placeholder="Boleto, PIX, cartão, transferência..."/></Field></div></>}
      {step === 4 && <><div className="form-card-title"><span>04</span><div><h2>Revisão da qualificação</h2><p>Confirme os dados antes de processar o matching.</p></div></div><div className="review-grid"><Review label="Empresa" value={form.companyName}/><Review label="CNPJ" value={formatCnpj(form.cnpj)}/><Review label="Segmento / região" value={`${form.segment} · ${form.city}/${form.state}`}/><Review label="Faturamento anual" value={currency(form.annualRevenue)}/><Review label="Operação" value={form.operationType}/><Review label="Valor solicitado" value={currency(form.amount)}/><Review label="Garantia" value={form.hasGuarantee ? `${form.guaranteeType} · ${currency(form.guaranteeValue)}` : "Sem garantia"}/><Review label="Recebimentos" value={form.receiptMethod}/></div><div className="ai-disclaimer"><span>✦</span><p><strong>Matching explicável</strong><br/>O resultado será calculado por regras objetivas e pesos configurados. Nenhuma decisão de crédito é tomada pela Urus FIDC.</p></div></>}
      {error && <div className="error-box" role="alert">{error}</div>}<div className="privacy-box"><span>♙</span><p><strong>Ambiente de demonstração.</strong><br/>Nenhum dado informado é persistido ou compartilhado.</p></div><div className="form-actions"><button className="secondary-button" onClick={onBack}>{step === 1 ? "Cancelar" : "Voltar"}</button><button className="primary-button" onClick={onNext}>{step === 4 ? "Processar matching" : "Continuar"} <span>→</span></button></div></section></div>;
}

function CnpjField({ value, onChange, onFound }: { value: string; onChange: (value: string) => void; onFound: (name: string, state: string, city: string) => void }) {
  const [state, setState] = useState<"idle" | "loading" | "found" | "not-found" | "unavailable">("idle");
  const handleChange = async (raw: string) => {
    const digits = onlyDigits(raw).slice(0, 14);
    onChange(digits);
    if (digits.length !== 14 || !isValidCnpj(digits)) { setState("idle"); return; }
    setState("loading");
    try {
      const company = await CompanyRegistryService.lookup(digits);
      if (!company) return setState("not-found");
      onFound(company.legalName, company.state, company.city);
      setState("found");
    } catch { setState("unavailable"); }
  };
  const invalid = onlyDigits(value).length === 14 && !isValidCnpj(value);
  return <div className="smart-field"><input inputMode="numeric" value={formatCnpj(value)} onChange={(event) => void handleChange(event.target.value)} placeholder="00.000.000/0000-00" aria-invalid={invalid}/><small className={invalid || state === "unavailable" ? "field-error" : "field-status"}>{invalid ? "CNPJ inválido" : state === "loading" ? "Consultando cadastro demonstrativo…" : state === "found" ? "✓ Empresa localizada e campos sugeridos" : state === "not-found" ? "CNPJ não encontrado — preencha manualmente" : state === "unavailable" ? "Consulta indisponível — continue manualmente" : "Validação pelos dígitos verificadores"}</small></div>;
}

function MoneyField({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return <input inputMode="numeric" value={formatMoneyInput(value)} onChange={(event) => onChange(parseMoneyInput(event.target.value))} placeholder="R$ 0,00"/>;
}

function MunicipalityField({ state, value, onChange }: { state: string; value: string; onChange: (value: string) => void }) {
  const [cities, setCities] = useState<MunicipalityOption[]>([]);
  useEffect(() => {
    if (!state) return;
    let cancelled = false;
    MunicipalityService.byState(state).then((items) => { if (!cancelled) setCities(items); });
    return () => { cancelled = true; };
  }, [state]);
  const listId = `municipalities-${state || "none"}`;
  return <div className="smart-field"><input list={listId} value={value} disabled={!state} onChange={(event) => onChange(event.target.value)} placeholder={state ? "Busque ou selecione" : "Selecione a UF primeiro"}/><datalist id={listId}>{cities.filter((city) => city.state === state).map((city) => <option key={city.id} value={city.name}/>)}</datalist><small className="field-status">{state ? `${cities.filter((city) => city.state === state).length || "Carregando"} municípios na base local IBGE` : "A cidade depende da UF"}</small></div>;
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) { return <label className={wide ? "wide" : ""}>{label}{children}</label>; }
function Review({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value || "—"}</strong></div>; }

/* Migração visual anterior preservada no histórico do Git.
function LegacyOperationDetail({ operation, tab, setTab, matches, documents, journey, allApproved, onBack, onSelectFidc, onDocument, onApproveAll, onDistribute, onJourney, onOperationStatus }: { operation: Operation; tab: DetailTab; setTab: (tab: DetailTab) => void; matches: ReturnType<typeof calculateMatches>; documents: ChecklistDocument[]; journey: JourneyState; allApproved: boolean; onBack: () => void; onSelectFidc: (id: string) => void; onDocument: (id: string, status: ChecklistDocument["status"]) => void; onApproveAll: () => void; onDistribute: () => void; onJourney: (changes: Partial<JourneyState>, message: string) => void; onOperationStatus: (status: Operation["status"]) => void }) {
  const eligible = matches.filter((match) => match.eligible);
  return <div className="page-content detail-page"><button className="back-button" onClick={onBack}>← Voltar para operações</button><div className="operation-hero"><div className="company-logo large-logo">{initials(operation.companyName)}</div><div><p className="eyebrow">{operation.id}</p><h1>{operation.companyName}</h1><p>{operation.operationType} · {currency(operation.amount)} · {operation.state}</p></div><span className={`status hero-status status-${operation.status.toLowerCase().replaceAll(" ", "-")}`}>{operation.status}</span></div><nav className="tabs" aria-label="Detalhes da operação">{(["summary", "matching", "documents", "journey"] as DetailTab[]).map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{({ summary: "Resumo", matching: `Matching (${eligible.length})`, documents: `Documentos (${documents.filter((doc) => doc.status === "Aprovado").length}/${documents.length})`, journey: "Jornada" })[item]}</button>)}</nav>
    {tab === "summary" && <div className="detail-grid"><section className="panel summary-card"><div className="panel-heading"><div><h2>Perfil qualificado</h2><p>Dados declarados pelo profissional</p></div></div><div className="summary-list"><Review label="CNPJ" value={operation.cnpj}/><Review label="Segmento" value={operation.segment}/><Review label="Faturamento anual" value={currency(operation.annualRevenue)}/><Review label="Cidade / Estado" value={`${operation.city} / ${operation.state}`}/><Review label="Valor solicitado" value={currency(operation.amount)}/><Review label="Garantia" value={`${operation.guaranteeType} · ${currency(operation.guaranteeValue)}`}/><Review label="Como vende" value={operation.salesMethod}/><Review label="Como recebe" value={operation.receiptMethod}/></div></section><aside className="panel audit-card"><div className="panel-heading"><div><h2>Rastreabilidade</h2><p>Eventos desta oportunidade</p></div></div><ul><li><span>✓</span><div><strong>Perfil cadastrado</strong><small>{operation.createdAt} · por você</small></div></li><li><span>✦</span><div><strong>Matching processado</strong><small>{eligible.length} FIDCs elegíveis</small></div></li><li><span>♙</span><div><strong>Acesso protegido</strong><small>Visível somente neste usuário</small></div></li></ul></aside></div>}
    {tab === "matching" && <section><div className="match-summary"><div><span className="spark">✦</span><div><p className="eyebrow light">MATCH INTELIGENTE CONCLUÍDO</p><h2>{eligible.length} FIDCs aderentes à operação</h2><p>Ranking calculado por critérios objetivos. Selecione quem receberá a oportunidade após o checklist.</p></div></div><div className="score-ring"><strong>{eligible[0]?.score ?? 0}</strong><span>melhor<br/>score</span></div></div><div className="match-list">{matches.map((match, index) => <article className={`match-card ${!match.eligible ? "ineligible" : ""}`} key={match.fidc.id}><div className="match-rank">{match.eligible ? String(index + 1).padStart(2, "0") : "—"}</div><div className="fund-logo">{initials(match.fidc.name)}</div><div className="match-main"><div className="match-title"><h3>{match.fidc.name}</h3><span className={match.eligible ? "eligible-pill" : "not-eligible-pill"}>{match.eligible ? "Elegível" : "Fora do perfil"}</span></div><p>{match.explanation}</p><div className="criteria-row">{match.criteria.map((criterion) => <span className={criterion.passed ? "passed" : "failed"} key={criterion.label} title={criterion.detail}>{criterion.passed ? "✓" : "×"} {criterion.label}</span>)}</div></div><div className="match-score"><strong>{match.score}</strong><span>/100</span></div><label className="select-match"><input type="checkbox" checked={operation.selectedFidcs.includes(match.fidc.id)} disabled={!match.eligible} onChange={() => onSelectFidc(match.fidc.id)}/><span>{operation.selectedFidcs.includes(match.fidc.id) ? "Selecionado" : "Selecionar"}</span></label></article>)}</div><div className="sticky-action"><div><strong>{operation.selectedFidcs.length} FIDC(s) selecionado(s)</strong><small>{allApproved ? "Checklist completo: distribuição liberada." : "Complete os documentos antes da distribuição."}</small></div><button className="primary-button" disabled={!allApproved || operation.selectedFidcs.length === 0 || journey.distributed} onClick={onDistribute}>{journey.distributed ? "Operação distribuída ✓" : "Compartilhar com FIDCs"}</button></div></section>}
    {tab === "documents" && <section><div className="document-header"><div><p className="eyebrow">CHECKLIST INTELIGENTE</p><h2>{documents.filter((document) => document.status === "Aprovado").length} de {documents.length} documentos validados</h2><p>O controle simula a análise de presença e legibilidade dos arquivos.</p></div><div className="progress-ring"><strong>{Math.round((documents.filter((document) => document.status === "Aprovado").length / documents.length) * 100)}%</strong></div></div><div className="security-banner">♙ <span><strong>Não envie arquivos reais neste protótipo.</strong> Os botões abaixo apenas alteram o estado visual do checklist.</span><button onClick={onApproveAll}>Simular análise completa</button></div><div className="document-list">{documents.map((document) => <article key={document.id}><span className="doc-icon">▱</span><div><strong>{document.name}</strong><small>{document.detail}</small></div><span className={`doc-status doc-${document.status.toLowerCase().replaceAll(" ", "-")}`}>{document.status}</span><select aria-label={`Alterar status de ${document.name}`} value={document.status} onChange={(event) => onDocument(document.id, event.target.value as ChecklistDocument["status"])}><option>Pendente</option><option>Em análise</option><option>Aprovado</option><option>Rejeitado</option></select></article>)}</div></section>}
    {tab === "journey" && (
      <LegacyJourney operation={operation} journey={journey} allApproved={allApproved} selectedCount={operation.selectedFidcs.length} onDistribute={onDistribute} onUpdate={onJourney} onStatus={onOperationStatus}/>
    )}
  </div>;
}

function LegacyJourney({ operation, journey, allApproved, selectedCount, onDistribute, onUpdate, onStatus }: { operation: Operation; journey: JourneyState; allApproved: boolean; selectedCount: number; onDistribute: () => void; onUpdate: (changes: Partial<JourneyState>, message: string) => void; onStatus: (status: Operation["status"]) => void }) {
  const steps = [
    { title: "Perfil e matching", text: "Qualificação concluída", done: true },
    { title: "Documentos", text: allApproved ? "Checklist validado" : "Aguardando documentos", done: allApproved },
    { title: "Distribuição", text: journey.distributed ? `Compartilhada com ${selectedCount} FIDC(s)` : "Aguardando liberação", done: journey.distributed, action: !journey.distributed && allApproved && selectedCount > 0 ? <button onClick={onDistribute}>Distribuir agora</button> : null },
    { title: "Interesse do FIDC", text: journey.interested ? "Multiplica demonstrou interesse" : "Aguardando retorno", done: journey.interested, action: journey.distributed && !journey.interested ? <button onClick={() => onUpdate({ interested: true }, "Interesse do FIDC registrado.")}>Simular interesse</button> : null },
    { title: "Reunião tripartite", text: journey.meetingScheduled ? "18/08/2026 às 10h30" : "Não agendada", done: journey.meetingScheduled, action: journey.interested && !journey.meetingScheduled ? <button onClick={() => onUpdate({ meetingScheduled: true }, "Reunião agendada com sucesso.")}>Agendar reunião</button> : null },
    { title: "Comitê de crédito", text: journey.committeeResult === "Pendente" ? "Aguardando decisão" : `Crédito ${journey.committeeResult.toLowerCase()}`, done: journey.committeeResult !== "Pendente", action: journey.meetingScheduled && journey.committeeResult === "Pendente" ? <span className="button-group"><button onClick={() => { onUpdate({ committeeResult: "Aprovado" }, "Crédito aprovado no comitê."); onStatus("Aprovada"); }}>Aprovar</button><button className="danger" onClick={() => { onUpdate({ committeeResult: "Negado" }, "Crédito negado no comitê."); onStatus("Negada"); }}>Negar</button></span> : null },
    { title: "Proposta ao profissional", text: journey.proposalShared ? "Proposta compartilhada" : "Aguardando aprovação", done: journey.proposalShared, action: journey.committeeResult === "Aprovado" && !journey.proposalShared ? <button onClick={() => onUpdate({ proposalShared: true }, "Proposta compartilhada com o profissional.")}>Compartilhar proposta</button> : null },
    { title: "Comissão e repasse", text: journey.commission, done: journey.commission === "Repassada ao profissional", action: journey.proposalShared && journey.commission !== "Repassada ao profissional" ? <button onClick={() => onUpdate({ commission: journey.commission === "Aguardando FIDC" ? "Recebida pela Urus FIDC" : "Repassada ao profissional" }, journey.commission === "Aguardando FIDC" ? "Comissão recebida pela Urus FIDC." : "Comissão repassada ao profissional.")}>{journey.commission === "Aguardando FIDC" ? "Simular recebimento" : "Simular repasse"}</button> : null },
  ];
  return <div className="journey-layout"><section className="panel journey-timeline"><div className="panel-heading"><div><h2>Jornada da operação</h2><p>Acompanhamento ponta a ponta</p></div></div><ol>{steps.map((step, index) => <li key={step.title} className={step.done ? "done" : ""}><span className="timeline-marker">{step.done ? "✓" : index + 1}</span><div><strong>{step.title}</strong><small>{step.text}</small></div>{step.action}</li>)}</ol></section><aside className="proposal-card"><p className="eyebrow light">RESUMO FINANCEIRO</p><h2>{currency(operation.amount)}</h2><p>{operation.operationType}</p><hr/><div><span>Comissão estimada</span><strong>{currency(operation.amount * 0.008)}</strong></div><div><span>Destinatário</span><strong>Profissional indicador</strong></div><small>Valores exclusivamente demonstrativos.</small></aside></div>;
}

*/
function AdminFidcs({ fidcs, search, setSearch, onNew, onEdit, onStatus }: { fidcs: FidcProfile[]; search: string; setSearch: (value: string) => void; onNew: () => void; onEdit: (fidc: FidcProfile) => void; onStatus: (id: string, status: FidcStatus) => void }) {
  const filtered = fidcs.filter((fidc) => fidc.name.toLowerCase().includes(search.toLowerCase()));
  return <div className="page-content"><PageHeader eyebrow="ADMINISTRAÇÃO" title="Perfis de FIDCs" description="Cadastre e configure quem participa do matching inteligente." action={<button className="primary-button" onClick={onNew}>＋ Cadastrar novo FIDC</button>}/><div className="admin-metrics"><article><span>Perfis cadastrados</span><strong>{fidcs.length}</strong></article><article><span>Ativos no matching</span><strong>{fidcs.filter((fidc) => fidc.status === "Ativo").length}</strong></article><article><span>Em rascunho</span><strong>{fidcs.filter((fidc) => fidc.status === "Rascunho").length}</strong></article><article><span>Critérios configuráveis</span><strong>7</strong></article></div><section className="panel table-panel"><div className="filter-row"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar FIDC..."/><span className="audit-label">Última revisão: hoje, 17h42</span></div><div className="fidc-table"><div className="table-head"><span>FIDC</span><span>Faturamento</span><span>Região</span><span>Operações</span><span>Status</span><span>Ações</span></div>{filtered.map((fidc) => <div className="table-row" key={fidc.id}><span className="fidc-name"><b className="fund-logo small">{initials(fidc.name)}</b><span><strong>{fidc.name}</strong><small>{fidc.segments.length} segmentos · {fidc.linkedOperations} vínculos</small></span></span><span><strong>{fidc.revenueMode}</strong><small>{currency(fidc.minRevenue, true)}</small></span><span>{fidc.regions.includes("Brasil") ? "Brasil" : fidc.regions.join(", ")}</span><span>{fidc.operationTypes.length} modalidades</span><span><b className={`admin-status status-${fidc.status.toLowerCase()}`}>{fidc.status}</b></span><span className="row-actions"><button onClick={() => onEdit(fidc)}>Editar</button>{fidc.status === "Ativo" ? <button onClick={() => onStatus(fidc.id, "Inativo")}>Desativar</button> : fidc.status !== "Arquivado" && <button onClick={() => onStatus(fidc.id, "Ativo")}>Ativar</button>}<button className="danger-link" onClick={() => onStatus(fidc.id, "Arquivado")}>Arquivar</button></span></div>)}</div></section></div>;
}

/* Migração visual anterior preservada no histórico do Git.
function LegacyFidcModal({ form, setForm, error, editing, onClose, onSave }: { form: FidcProfile; setForm: React.Dispatch<React.SetStateAction<FidcProfile>>; error: string; editing: boolean; onClose: () => void; onSave: () => void }) {
  const selectedOptions = (event: React.ChangeEvent<HTMLSelectElement>) => Array.from(event.target.selectedOptions, (option) => option.value);
  return <div className="modal-backdrop" role="presentation"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="fidc-modal-title"><header><div><p className="eyebrow">ADMINISTRAÇÃO DE MATCHING</p><h2 id="fidc-modal-title">{editing ? "Editar perfil do FIDC" : "Cadastrar novo FIDC"}</h2><p>Defina o perfil que será comparado às operações.</p></div><button aria-label="Fechar" onClick={onClose}>×</button></header><div className="modal-body"><div className="form-grid"><Field label="Nome do FIDC" wide><input value={form.name} onChange={(event) => setForm((item) => ({ ...item, name: event.target.value }))} placeholder="Nome comercial"/></Field><Field label="Status"><select value={form.status} onChange={(event) => setForm((item) => ({ ...item, status: event.target.value as FidcStatus }))}><option>Rascunho</option><option>Ativo</option><option>Inativo</option></select></Field><Field label="Regra de faturamento"><select value={form.revenueMode} onChange={(event) => setForm((item) => ({ ...item, revenueMode: event.target.value as RevenueMode }))}><option>Mínimo</option><option>Máximo</option><option>Faixa</option><option>Pontuação</option></select></Field><Field label="Valor de referência"><input type="number" value={form.minRevenue || ""} onChange={(event) => setForm((item) => ({ ...item, minRevenue: Number(event.target.value) }))}/></Field>{form.revenueMode === "Faixa" && <Field label="Valor máximo"><input type="number" value={form.maxRevenue || ""} onChange={(event) => setForm((item) => ({ ...item, maxRevenue: Number(event.target.value) }))}/></Field>}<Field label="Peso do faturamento"><input type="number" min="0" max="100" value={form.weights.revenue} onChange={(event) => setForm((item) => ({ ...item, weights: { ...item.weights, revenue: Number(event.target.value) } }))}/></Field><Field label="Segmentos"><select multiple value={form.segments} onChange={(event) => setForm((item) => ({ ...item, segments: selectedOptions(event) }))}>{SEGMENTS.map((segment) => <option key={segment}>{segment}</option>)}</select><small>Use Cmd/Ctrl para selecionar vários.</small></Field><Field label="Regiões"><select multiple value={form.regions} onChange={(event) => setForm((item) => ({ ...item, regions: selectedOptions(event) }))}><option>Brasil</option>{BRAZIL_STATES.map((state) => <option key={state}>{state}</option>)}</select><small>“Brasil” inclui todos os estados.</small></Field><Field label="Tipos de operação" wide><select multiple value={form.operationTypes} onChange={(event) => setForm((item) => ({ ...item, operationTypes: selectedOptions(event) }))}>{OPERATION_TYPES.map((type) => <option key={type}>{type}</option>)}</select></Field></div><div className="required-toggle"><input id="revenue-required" aria-label="Critério eliminatório de faturamento" type="checkbox" checked={form.revenueRequired} onChange={(event) => setForm((item) => ({ ...item, revenueRequired: event.target.checked }))}/><label htmlFor="revenue-required"><strong>Critério eliminatório</strong><small>Se não atender, o FIDC ficará inelegível.</small></label></div>{error && <div className="error-box">{error}</div>}<div className="draft-hint">Perfis em rascunho não participam do matching. Para ativar, complete todos os campos obrigatórios.</div></div><footer><button className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" onClick={onSave}>{editing ? "Salvar alterações" : "Cadastrar FIDC"}</button></footer></section></div>;
}

function LegacyAdminChecklist() { return <div className="page-content"><PageHeader eyebrow="ADMINISTRAÇÃO" title="Checklist documental" description="Documentos exigidos em todas as operações antes da distribuição."/><section className="panel checklist-admin"><div className="panel-heading"><div><h2>Checklist padrão</h2><p>{DOCUMENT_BLUEPRINT.length} categorias obrigatórias</p></div><button>＋ Adicionar item</button></div>{DOCUMENT_BLUEPRINT.map(([id, name, detail], index) => <div className="checklist-row" key={id}><span className="drag">⠿</span><span className="doc-icon">▱</span><span><strong>{name}</strong><small>{detail}</small></span><b>Obrigatório</b><button>Editar</button><span>{index + 1}</span></div>)}</section><div className="tenant-note">Alterações futuras deverão ser versionadas para não modificar retroativamente operações em andamento.</div></div>; }

*/
function ProfessionalsPage() { const professionals = USERS.filter((user) => user.role === "professional"); return <div className="page-content"><PageHeader eyebrow="ADMINISTRAÇÃO" title="Profissionais" description="Assinantes individuais e isolamento das respectivas operações."/><section className="panel people-grid">{professionals.map((user) => <article key={user.id}><span className="avatar">{user.initials}</span><div><strong>{user.name}</strong><small>{user.professionalType}</small><span>{user.email}</span></div><b className="admin-status status-ativo">Ativo</b><div className="people-stats"><span>Plano <strong>{user.plan}</strong></span><span>Operações <strong>{INITIAL_OPERATIONS.filter((operation) => operation.ownerId === user.id).length}</strong></span></div><button>Ver perfil →</button></article>)}</section></div>; }

/* Migração visual anterior preservada no histórico do Git.
function LegacySubscriptionsPage() { return <div className="page-content"><PageHeader eyebrow="ADMINISTRAÇÃO" title="Assinaturas" description="Visão demonstrativa dos planos e cobranças da plataforma."/><div className="admin-metrics"><article><span>Receita mensal simulada</span><strong>R$ 1.288</strong></article><article><span>Assinaturas ativas</span><strong>2</strong></article><article><span>Inadimplência</span><strong>0%</strong></article><article><span>Próxima cobrança</span><strong>22 ago</strong></article></div><section className="panel billing-table"><div className="table-head"><span>Assinante</span><span>Plano</span><span>Valor</span><span>Status</span><span>Próxima cobrança</span></div><div className="table-row"><span>Marina Costa</span><span>Profissional</span><span>R$ 899/mês</span><span><b className="admin-status status-ativo">Ativa</b></span><span>22/08/2026</span></div><div className="table-row"><span>Ricardo Alves</span><span>Essencial</span><span>R$ 389/mês</span><span><b className="admin-status status-ativo">Ativa</b></span><span>25/08/2026</span></div></section></div>; }

function LegacyAccountPage({ user, operations }: { user: User; operations: Operation[] }) { return <div className="page-content account-page"><PageHeader eyebrow="CONTA" title="Minha assinatura" description="Plano, consumo e segurança da sua conta individual."/><div className="account-grid"><section className="plan-card"><p className="eyebrow light">PLANO ATUAL</p><h2>{user.plan}</h2><p>Para profissionais que originam e acompanham operações de crédito.</p><div className="plan-price"><strong>R$ 899</strong><span>/ mês</span></div><ul><li>✓ Até 20 operações ativas</li><li>✓ Matching com todos os FIDCs</li><li>✓ Checklist inteligente</li><li>✓ Acompanhamento de comissões</li></ul><button>Gerenciar plano</button></section><section className="panel usage-card"><div className="panel-heading"><div><h2>Uso no período</h2><p>Agosto de 2026</p></div><b className="admin-status status-ativo">Assinatura ativa</b></div><div className="usage-item"><div><span>Operações ativas</span><strong>{operations.length} de 20</strong></div><progress value={operations.length} max="20"/></div><div className="usage-item"><div><span>Usuários</span><strong>1 de 1</strong></div><progress value="1" max="1"/></div><div className="billing-summary"><Review label="Próxima cobrança" value="22/08/2026"/><Review label="Valor" value="R$ 899,00"/><Review label="Forma de pagamento" value="•••• 4821"/></div><div className="account-security"><strong>♙ Segurança da conta</strong><p>Na versão de produção: MFA, sessões controladas, criptografia e trilha de auditoria.</p></div></section></div></div>; }

*/
type OperationDetailProps = {
  role: User["role"];
  operation: Operation;
  tab: DetailTab;
  setTab: (tab: DetailTab) => void;
  matches: ReturnType<typeof calculateMatches>;
  selections: FidcSelection[];
  documents: ChecklistDocument[];
  uploads: UploadedDocument[];
  reviews: AiDocumentReview[];
  fidcs: FidcProfile[];
  proposals: Proposal[];
  journey: JourneyState;
  allApproved: boolean;
  onBack: () => void;
  onRequestFidc: (fidcId: string, eligible: boolean, reason?: string) => void;
  onDocument: (id: string, status: ChecklistDocument["status"]) => void;
  onUpload: (requirementId: string, file: File) => void;
  onApproveAll: () => void;
  onSendToUrus: () => void;
  onJourney: (changes: Partial<JourneyState>, message: string) => void;
  onOperationStatus: (status: Operation["status"]) => void;
};

function MatchRequestAction({ match, selection, onRequest }: { match: ReturnType<typeof calculateMatches>[number]; selection?: FidcSelection; onRequest: (reason?: string) => void }) {
  const [reason, setReason] = useState("");
  if (selection) return <div className={`selection-state selection-${selection.decision.toLowerCase()}`}><strong>{selection.decision}</strong><small>{selection.origin}{selection.reason ? ` · ${selection.reason}` : ""}</small></div>;
  if (match.eligible) return <button className="secondary-button compact" onClick={() => onRequest()}>Sugerir à Urus</button>;
  return <div className="exception-request"><textarea aria-label={`Justificativa para ${match.fidc.name}`} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Justifique a inclusão fora do perfil"/><button disabled={!reason.trim()} onClick={() => onRequest(reason)}>Solicitar exceção</button></div>;
}

function OperationDetail(props: OperationDetailProps) {
  const { role, operation, tab, setTab, matches, selections, documents, uploads, reviews, fidcs, journey, allApproved, onBack, onRequestFidc, onDocument, onUpload, onApproveAll, onSendToUrus, onJourney, onOperationStatus } = props;
  const eligible = matches.filter((match) => match.eligible);
  const approvedFidcs = operation.selectedFidcs.map((id) => fidcs.find((fidc) => fidc.id === id)).filter(Boolean) as FidcProfile[];
  const documentGroups = approvedFidcs.map((fidc) => ({ fidc, items: documents.filter((document) => document.fidcId === fidc.id) }));
  const approvedCount = documents.filter((document) => document.status === "Aprovado").length;
  return <div className="page-content detail-page">
    <button className="back-button" onClick={onBack}>← Voltar para operações</button>
    <div className="operation-hero"><div className="company-logo large-logo">{initials(operation.companyName)}</div><div><p className="eyebrow">{operation.id}</p><h1>{operation.companyName}</h1><p>{operation.operationType} · {currency(operation.amount)} · {operation.state}</p></div><span className={`status hero-status status-${operation.status.toLowerCase().replaceAll(" ", "-")}`}>{operation.status}</span></div>
    <nav className="tabs" aria-label="Detalhes da operação">{(["summary", "matching", "documents", "journey"] as DetailTab[]).map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{({ summary: "Resumo", matching: `Matching (${eligible.length})`, documents: `Documentos (${approvedCount}/${documents.length})`, journey: "Jornada" })[item]}</button>)}</nav>
    {tab === "summary" && <div className="detail-grid"><section className="panel summary-card"><div className="panel-heading"><div><h2>Perfil qualificado</h2><p>Dados declarados pelo profissional</p></div></div><div className="summary-list"><Review label="CNPJ" value={formatCnpj(operation.cnpj)}/><Review label="Segmento" value={operation.segment}/><Review label="Faturamento anual" value={currency(operation.annualRevenue)}/><Review label="Cidade / Estado" value={`${operation.city} / ${operation.state}`}/><Review label="Valor solicitado" value={currency(operation.amount)}/><Review label="Garantia" value={operation.hasGuarantee ? `${operation.guaranteeType} · ${currency(operation.guaranteeValue)}` : "Sem garantia"}/><Review label="Como vende" value={operation.salesMethod}/><Review label="Como recebe" value={operation.receiptMethod}/></div></section><aside className="panel audit-card"><div className="panel-heading"><div><h2>Rastreabilidade</h2><p>Eventos e segregação</p></div></div><ul><li><span>✓</span><div><strong>Perfil cadastrado</strong><small>{operation.createdAt} · profissional responsável</small></div></li><li><span>✦</span><div><strong>Matching explicável</strong><small>{eligible.length} FIDCs elegíveis</small></div></li><li><span>♙</span><div><strong>Acesso isolado</strong><small>Sem dados sensíveis em URL ou e-mail</small></div></li></ul></aside></div>}
    {tab === "matching" && <section><div className="match-summary"><div><span className="spark">✦</span><div><p className="eyebrow light">MATCH INTELIGENTE CONCLUÍDO</p><h2>{eligible.length} FIDCs aderentes à operação</h2><p>O profissional sugere; a Urus revisa, aprova exceções e controla a distribuição.</p></div></div><div className="score-ring"><strong>{eligible[0]?.score ?? 0}</strong><span>melhor<br/>score</span></div></div><div className="match-list">{matches.map((match, index) => <article className={`match-card ${!match.eligible ? "ineligible" : ""}`} key={match.fidc.id}><div className="match-rank">{match.eligible ? String(index + 1).padStart(2, "0") : "—"}</div><div className="fund-logo">{initials(match.fidc.name)}</div><div className="match-main"><div className="match-title"><h3>{match.fidc.name}</h3><span className={match.eligible ? "eligible-pill" : "not-eligible-pill"}>{match.eligible ? "Elegível" : "Fora do perfil"}</span></div><p>{match.explanation}</p><div className="criteria-row">{match.criteria.map((criterion) => <span className={criterion.passed ? "passed" : "failed"} key={criterion.label} title={criterion.detail}>{criterion.passed ? "✓" : "×"} {criterion.label}</span>)}</div></div><div className="match-score"><strong>{match.score}</strong><span>/100</span></div>{role === "professional" ? <MatchRequestAction match={match} selection={selections.find((selection) => selection.fidcId === match.fidc.id)} onRequest={(reason) => onRequestFidc(match.fidc.id, match.eligible, reason)}/> : <div className="selection-state"><strong>{selections.find((selection) => selection.fidcId === match.fidc.id)?.decision ?? "Sem solicitação"}</strong><small>Decisão na fila administrativa</small></div>}</article>)}</div>{role === "professional" && <div className="sticky-action"><div><strong>{selections.length} FIDC(s) sugerido(s)</strong><small>A Urus fará a revisão humana e solicitará os checklists aplicáveis.</small></div><button className="primary-button" disabled={!selections.length || journey.sentToUrus} onClick={onSendToUrus}>{journey.sentToUrus ? "Enviado para a Urus ✓" : "Enviar para análise da Urus"}</button></div>}</section>}
    {tab === "documents" && <section><div className="document-header"><div><p className="eyebrow">CHECKLISTS CONGELADOS POR FIDC</p><h2>{approvedCount} de {documents.length} exigências aprovadas</h2><p>Um arquivo pode atender itens equivalentes, mas cada FIDC recebe avaliação e decisão independentes.</p></div><div className="progress-ring"><strong>{documents.length ? Math.round((approvedCount / documents.length) * 100) : 0}%</strong></div></div><div className="security-banner">♙ <span><strong>Não envie documentos reais.</strong> Upload, OpenRouter, antivírus e storage privado são apenas simulados nesta fase.</span>{role === "admin" && documents.length > 0 && <button onClick={onApproveAll}>Aprovar todos na demonstração</button>}</div>{!documentGroups.length ? <div className="empty-state"><span>▱</span><h3>Checklist ainda não liberado</h3><p>A Urus precisa aprovar ao menos um FIDC antes da coleta documental.</p></div> : <div className="fidc-checklists">{documentGroups.map(({ fidc, items }) => { const groupApproved = items.filter((item) => item.status === "Aprovado").length; return <section className="panel fidc-checklist" key={fidc.id}><header><div><span className="fund-logo small">{initials(fidc.name)}</span><div><h3>{fidc.name}</h3><p>Versão congelada · {groupApproved}/{items.length} aprovados</p></div></div><b className={items.every((item) => !item.required || item.status === "Aprovado") ? "ready-pill" : "pending-pill"}>{items.every((item) => !item.required || item.status === "Aprovado") ? "Pronto para distribuição" : "Com pendências"}</b></header><div className="document-list">{items.map((document) => { const review = reviews.find((item) => item.id === document.aiReviewId); const linkedUploads = uploads.filter((upload) => document.uploadedDocumentIds.includes(upload.id)); return <article className="document-item" key={document.id}><span className="doc-icon">▱</span><div className="document-copy"><strong>{document.name}{document.required ? " *" : ""}</strong><small>{document.detail} · {document.maxSizeMb} MB · {document.allowedMimeTypes.map((type) => type.split("/").pop()?.toUpperCase()).join(", ")}</small>{linkedUploads.map((upload) => <em key={upload.id}>✓ {upload.name} · {(upload.size / 1024).toFixed(0)} KB</em>)}{review && <div className="ai-review"><span>✦ IA simulada · {review.confidence}%</span><small>{review.detectedType} · Legibilidade {review.legibility} · Recomendação: {review.recommendation}</small>{review.riskFlags.map((flag) => <small className="field-error" key={flag}>{flag}</small>)}</div>}</div><span className={`doc-status doc-${document.status.toLowerCase().replaceAll(" ", "-")}`}>{document.status}</span><label className="upload-button">Carregar<input type="file" accept=".pdf,.xls,.xlsx,.csv,.jpg,.jpeg,.png" onChange={(event) => { const file = event.target.files?.[0]; if (file) onUpload(document.id, file); event.target.value = ""; }}/></label>{role === "admin" ? <select aria-label={`Decisão humana para ${document.name}`} value={document.status} onChange={(event) => onDocument(document.id, event.target.value as ChecklistDocument["status"])}><option>Pendente</option><option>Enviado</option><option>Analisando</option><option>Revisão necessária</option><option>Aprovado</option><option>Rejeitado</option></select> : <small className="human-review">Decisão final: Urus</small>}</article>; })}</div></section>; })}</div>}</section>}
    {tab === "journey" && <Journey role={role} operation={operation} journey={journey} allApproved={allApproved} selectedCount={operation.selectedFidcs.length} onUpdate={onJourney} onStatus={onOperationStatus}/>}
  </div>;
}

function Journey({ role, operation, journey, allApproved, selectedCount, onUpdate, onStatus }: { role: User["role"]; operation: Operation; journey: JourneyState; allApproved: boolean; selectedCount: number; onUpdate: (changes: Partial<JourneyState>, message: string) => void; onStatus: (status: Operation["status"]) => void }) {
  const adminAction = (node: React.ReactNode) => role === "admin" ? node : null;
  const steps = [
    { title: "Perfil e matching", text: "Qualificação concluída", done: true },
    { title: "Análise da Urus", text: journey.sentToUrus ? "Recebida pela equipe Urus" : "Aguardando envio do profissional", done: journey.sentToUrus },
    { title: "Documentos", text: allApproved ? "Checklists validados" : "Aguardando revisão humana", done: allApproved },
    { title: "Distribuição", text: journey.distributed ? `Pacotes enviados a ${selectedCount} FIDC(s)` : "A Urus controla cada envio", done: journey.distributed },
    { title: "Interesse do FIDC", text: journey.interested ? "Interesse registrado" : "Aguardando link seguro", done: journey.interested, action: adminAction(journey.distributed && !journey.interested ? <button onClick={() => onUpdate({ interested: true }, "Interesse do FIDC registrado.")}>Registrar interesse</button> : null) },
    { title: "Reunião tripartite", text: journey.meetingScheduled ? "18/08/2026 às 10h30" : "Não agendada", done: journey.meetingScheduled, action: adminAction(journey.interested && !journey.meetingScheduled ? <button onClick={() => onUpdate({ meetingScheduled: true }, "Reunião agendada com sucesso.")}>Agendar reunião</button> : null) },
    { title: "Comitê de crédito", text: journey.committeeResult === "Pendente" ? "Aguardando decisão" : `Crédito ${journey.committeeResult.toLowerCase()}`, done: journey.committeeResult !== "Pendente", action: adminAction(journey.meetingScheduled && journey.committeeResult === "Pendente" ? <span className="button-group"><button onClick={() => { onUpdate({ committeeResult: "Aprovado" }, "Crédito aprovado no comitê."); onStatus("Aprovada"); }}>Aprovar</button><button className="danger" onClick={() => { onUpdate({ committeeResult: "Negado" }, "Crédito negado no comitê."); onStatus("Negada"); }}>Negar</button></span> : null) },
    { title: "Proposta ao profissional", text: journey.proposalShared ? "Proposta compartilhada" : "Aguardando aprovação", done: journey.proposalShared, action: adminAction(journey.committeeResult === "Aprovado" && !journey.proposalShared ? <button onClick={() => onUpdate({ proposalShared: true }, "Proposta compartilhada com o profissional.")}>Compartilhar proposta</button> : null) },
    { title: "Comissão e repasse", text: journey.committeeResult === "Aprovado" ? journey.commission : "Exibida apenas após aprovação", done: journey.commission === "Repassada ao profissional", action: adminAction(journey.proposalShared && journey.commission !== "Repassada ao profissional" ? <button onClick={() => onUpdate({ commission: journey.commission === "Aguardando FIDC" ? "Recebida pela Urus FIDC" : "Repassada ao profissional" }, journey.commission === "Aguardando FIDC" ? "Comissão recebida pela Urus FIDC." : "Comissão repassada ao profissional.")}>{journey.commission === "Aguardando FIDC" ? "Registrar recebimento" : "Registrar repasse"}</button> : null) },
  ];
  return <div className="journey-layout"><section className="panel journey-timeline"><div className="panel-heading"><div><h2>Jornada da operação</h2><p>Cada transição gera uma única notificação, sem anexos sensíveis.</p></div></div><ol>{steps.map((step, index) => <li key={step.title} className={step.done ? "done" : ""}><span className="timeline-marker">{step.done ? "✓" : index + 1}</span><div><strong>{step.title}</strong><small>{step.text}</small></div>{step.action}</li>)}</ol></section><aside className="proposal-card"><p className="eyebrow light">RESUMO FINANCEIRO</p><h2>{currency(operation.amount)}</h2><p>{operation.operationType}</p>{journey.committeeResult === "Aprovado" && <><hr/><div><span>Comissão estimada</span><strong>{currency(Math.round(operation.amount * 0.008))}</strong></div><div><span>Destinatário</span><strong>Profissional indicador</strong></div></>}<small>Valores exclusivamente demonstrativos.</small></aside></div>;
}

function DistributionQueue({ operations, users, fidcs, selections, documents, packages, deliveries, onDecision, onDistribute, onOpen }: { operations: Operation[]; users: User[]; fidcs: FidcProfile[]; selections: FidcSelection[]; documents: Record<string, ChecklistDocument[]>; packages: DistributionPackage[]; deliveries: SecureDelivery[]; onDecision: (id: string, decision: "Aprovado" | "Rejeitado") => void; onDistribute: (operationId: string, fidcId: string) => void; onOpen: (operation: Operation, tab?: DetailTab) => void }) {
  const queued = operations.filter((operation) => selections.some((selection) => selection.operationId === operation.id));
  return <div className="page-content"><PageHeader eyebrow="OPERAÇÃO URUS" title="Fila de análise e distribuição" description="A Urus aprova destinos, valida documentos e autoriza cada pacote."/><div className="admin-metrics"><article><span>Operações na fila</span><strong>{queued.length}</strong></article><article><span>Seleções pendentes</span><strong>{selections.filter((item) => ["Solicitado", "Sugerido"].includes(item.decision)).length}</strong></article><article><span>Pacotes enviados</span><strong>{packages.filter((item) => item.status === "Enviado").length}</strong></article><article><span>Links temporários</span><strong>{deliveries.filter((item) => item.status === "Enviado").length}</strong></article></div><div className="queue-list">{queued.map((operation) => { const owner = users.find((user) => user.id === operation.ownerId); const operationSelections = selections.filter((selection) => selection.operationId === operation.id); return <section className="panel queue-card" key={operation.id}><header><div><span className="company-logo">{initials(operation.companyName)}</span><div><p className="eyebrow">{operation.id}</p><h2>{operation.companyName}</h2><small>{owner?.name} · {currency(operation.amount)} · {operation.status}</small></div></div><button className="secondary-button compact" onClick={() => onOpen(operation, "documents")}>Abrir operação</button></header><div className="selection-queue">{operationSelections.map((selection) => { const fidc = fidcs.find((item) => item.id === selection.fidcId); const requirements = (documents[operation.id] ?? []).filter((item) => item.fidcId === selection.fidcId && item.required); const ready = requirements.length > 0 && requirements.every((item) => item.status === "Aprovado"); const packet = packages.find((item) => item.operationId === operation.id && item.fidcId === selection.fidcId); const delivery = packet && deliveries.find((item) => item.packageId === packet.id); return <article key={selection.id}><div className="selection-info"><span className="fund-logo small">{initials(fidc?.name ?? "FIDC")}</span><div><strong>{fidc?.name ?? selection.fidcId}</strong><small>{selection.origin} · {selection.reason || "aderência automática"}</small></div><b className={`admin-status status-${selection.decision.toLowerCase()}`}>{selection.decision}</b></div>{["Solicitado", "Sugerido"].includes(selection.decision) && <div className="decision-actions"><button onClick={() => onDecision(selection.id, "Aprovado")}>Aprovar seleção</button><button className="danger" onClick={() => onDecision(selection.id, "Rejeitado")}>Rejeitar</button></div>}{selection.decision === "Aprovado" && <div className="distribution-action"><div><strong>{requirements.filter((item) => item.status === "Aprovado").length}/{requirements.length} documentos aprovados</strong><small>{delivery ? `Enviado para ${delivery.recipientEmail} · expira ${delivery.expiresAt}` : ready ? "Pacote pronto para envio" : "Envio bloqueado por checklist"}</small></div><button className="primary-button compact" disabled={!ready || Boolean(packet)} onClick={() => onDistribute(operation.id, selection.fidcId)}>{packet ? "Enviado ✓" : "Autorizar distribuição"}</button></div>}</article>; })}</div></section>; })}</div></div>;
}

const EMPTY_CHECKLIST_ITEM: ChecklistTemplateItem = { id: "", name: "", detail: "", instructions: "", required: true, multiplicity: "Único", allowedMimeTypes: ["application/pdf"], maxSizeMb: 25, expectedEvidence: [], aiStandard: "Confirmar identificação, período, completude e legibilidade.", active: true, order: 1 };

function AdminChecklist({ templates, fidcs, onSave, onArchive }: { templates: ChecklistTemplate[]; fidcs: FidcProfile[]; onSave: (templateId: string, item: ChecklistTemplateItem) => void; onArchive: (templateId: string, itemId: string) => void }) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [draft, setDraft] = useState<ChecklistTemplateItem>({ ...EMPTY_CHECKLIST_ITEM });
  const template = templates.find((item) => item.id === templateId) ?? templates[0];
  const version = template?.versions.find((item) => item.version === template.activeVersion);
  const save = () => {
    if (!template || !draft.name.trim() || !draft.instructions.trim()) return;
    onSave(template.id, { ...draft, id: draft.id || `requirement-${Date.now()}`, detail: draft.detail || draft.name, expectedEvidence: draft.expectedEvidence.filter(Boolean) });
    setDraft({ ...EMPTY_CHECKLIST_ITEM });
  };
  return <div className="page-content"><PageHeader eyebrow="ADMINISTRAÇÃO" title="Templates documentais" description="Padrão versionado e cópias configuráveis por FIDC."/><div className="checklist-toolbar"><label>Template<select value={template?.id ?? ""} onChange={(event) => { setTemplateId(event.target.value); setDraft({ ...EMPTY_CHECKLIST_ITEM }); }}>{templates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div><strong>Versão {template?.activeVersion}</strong><small>{template?.scope === "FIDC" ? fidcs.find((fidc) => fidc.id === template.fidcId)?.name : "Base da plataforma"} · alterações criam nova versão</small></div></div><div className="checklist-layout"><section className="panel checklist-admin"><div className="panel-heading"><div><h2>Exigências ativas</h2><p>{version?.items.filter((item) => item.active).length ?? 0} itens nesta versão</p></div></div>{version?.items.sort((a, b) => a.order - b.order).map((item) => <div className={`checklist-row ${!item.active ? "archived" : ""}`} key={item.id}><span className="drag">⠿</span><span className="doc-icon">▱</span><span><strong>{item.name}</strong><small>{item.detail} · {item.multiplicity} · {item.maxSizeMb} MB</small></span><b>{item.required ? "Obrigatório" : "Opcional"}</b><button onClick={() => setDraft({ ...item, expectedEvidence: [...item.expectedEvidence] })}>Editar</button>{item.active ? <button className="danger-link" onClick={() => onArchive(template.id, item.id)}>Arquivar</button> : <span>Arquivado</span>}</div>)}</section><aside className="panel checklist-editor"><p className="eyebrow">{draft.id ? "EDITAR EXIGÊNCIA" : "NOVA EXIGÊNCIA"}</p><h2>{draft.id ? draft.name : "Configurar item"}</h2><Field label="Nome"><input value={draft.name} onChange={(event) => setDraft((item) => ({ ...item, name: event.target.value }))}/></Field><Field label="Descrição"><input value={draft.detail} onChange={(event) => setDraft((item) => ({ ...item, detail: event.target.value }))}/></Field><Field label="Instruções"><textarea value={draft.instructions} onChange={(event) => setDraft((item) => ({ ...item, instructions: event.target.value }))}/></Field><div className="form-grid"><Field label="Multiplicidade"><select value={draft.multiplicity} onChange={(event) => setDraft((item) => ({ ...item, multiplicity: event.target.value as ChecklistTemplateItem["multiplicity"] }))}><option>Único</option><option>Por exercício</option><option>Por sócio</option></select></Field><Field label="Tamanho máximo (MB)"><input type="number" min="1" max="25" value={draft.maxSizeMb} onChange={(event) => setDraft((item) => ({ ...item, maxSizeMb: Number(event.target.value) }))}/></Field><Field label="Validade (dias)"><input type="number" value={draft.validityDays ?? ""} onChange={(event) => setDraft((item) => ({ ...item, validityDays: Number(event.target.value) || undefined }))}/></Field><Field label="Obrigatoriedade"><select value={draft.required ? "Obrigatório" : "Opcional"} onChange={(event) => setDraft((item) => ({ ...item, required: event.target.value === "Obrigatório" }))}><option>Obrigatório</option><option>Opcional</option></select></Field></div><Field label="Evidências esperadas"><textarea value={draft.expectedEvidence.join(", ")} onChange={(event) => setDraft((item) => ({ ...item, expectedEvidence: event.target.value.split(",").map((value) => value.trim()) }))}/></Field><Field label="Padrão de validação da IA"><textarea value={draft.aiStandard} onChange={(event) => setDraft((item) => ({ ...item, aiStandard: event.target.value }))}/></Field><div className="draft-hint">Formatos aceitos na demonstração: PDF, XLS/XLSX, CSV, JPG e PNG. A IA apenas recomenda; a Urus decide.</div><div className="form-actions"><button className="secondary-button" onClick={() => setDraft({ ...EMPTY_CHECKLIST_ITEM })}>Limpar</button><button className="primary-button" disabled={!draft.name.trim() || !draft.instructions.trim()} onClick={save}>Salvar nova versão</button></div></aside></div></div>;
}

function ReportsPage({ role, operations, allOperations, users, documents, uploads, fidcs, proposals, commissions, notify }: { role: User["role"]; operations: Operation[]; allOperations: Operation[]; users: User[]; documents: Record<string, ChecklistDocument[]>; uploads: UploadedDocument[]; fidcs: FidcProfile[]; proposals: Proposal[]; commissions: Commission[]; notify: (message: string) => void }) {
  const visibleOperations = role === "admin" ? allOperations : operations;
  const [operationId, setOperationId] = useState(visibleOperations[0]?.id ?? "");
  const operation = visibleOperations.find((item) => item.id === operationId);
  const availableFidcs = operation?.selectedFidcs.map((id) => fidcs.find((fidc) => fidc.id === id)).filter(Boolean) as FidcProfile[] | undefined;
  const [fidcId, setFidcId] = useState("");
  const proposal = proposals.find((item) => item.operationId === operationId && item.status === "Aprovada");
  const execute = async (work: () => Promise<unknown>, success: string) => { try { await work(); notify(success); } catch { notify("Não foi possível gerar o arquivo demonstrativo."); } };
  return <div className="page-content"><PageHeader eyebrow="RELATÓRIOS E EXPORTAÇÕES" title="Central de arquivos" description="PDFs, planilhas e pacotes filtrados pelo papel e pelo destinatário."/><div className="security-banner">♙ <span><strong>Exportação com escopo.</strong> O profissional acessa somente sua carteira; o ZIP por FIDC contém apenas exigências daquele fundo.</span></div><section className="panel report-filters"><Field label="Operação"><select value={operationId} onChange={(event) => { setOperationId(event.target.value); setFidcId(""); }}>{visibleOperations.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.companyName}</option>)}</select></Field><Field label="FIDC de destino"><select value={fidcId} onChange={(event) => setFidcId(event.target.value)}><option value="">Selecione quando necessário</option>{availableFidcs?.map((fidc) => <option key={fidc.id} value={fidc.id}>{fidc.name}</option>)}</select></Field><Field label="Etapa"><select defaultValue="Todas"><option>Todas</option>{["Qualificação", "Revisão Urus", "Documentos", "Em análise", "Aprovada", "Negada"].map((status) => <option key={status}>{status}</option>)}</select></Field><Field label="Período"><select defaultValue="Agosto de 2026"><option>Agosto de 2026</option><option>Últimos 90 dias</option><option>Todo o período</option></select></Field></section><div className="report-grid"><article><span>PDF</span><h3>Dossiê da operação</h3><p>Dados qualificados, destinos aprovados e resumo dos checklists.</p><button disabled={!operation} onClick={() => operation && execute(() => ReportService.operationDossier(operation, documents[operation.id] ?? [], fidcs), "Dossiê PDF gerado.")}>Baixar dossiê</button></article><article><span>PDF</span><h3>Proposta aprovada</h3><p>Disponível somente quando há uma proposta formal aprovada.</p><button disabled={!operation || !proposal} onClick={() => { const fidc = proposal && fidcs.find((item) => item.id === proposal.fidcId); if (operation && proposal && fidc) execute(() => ReportService.proposalPdf(operation, proposal, fidc), "Proposta PDF gerada."); }}>{proposal ? "Baixar proposta" : "Aguardando aprovação"}</button></article><article><span>XLSX</span><h3>Pipeline de operações</h3><p>Carteira, etapa, assessor, FIDC e volume financeiro.</p><button onClick={() => execute(() => ReportService.pipelineExcel(visibleOperations, users), "Pipeline Excel gerado.")}>Baixar pipeline</button></article><article><span>XLSX</span><h3>Comissões</h3><p>Valores aprovados e situação do repasse, respeitando o isolamento.</p><button onClick={() => execute(() => ReportService.commissionsExcel(commissions, visibleOperations, users), "Planilha de comissões gerada.")}>Baixar comissões</button></article><article><span>ZIP</span><h3>Pacote consolidado Urus</h3><p>Informações e arquivos autorizados de toda a operação.</p><button disabled={role !== "admin" || !operation} onClick={() => operation && execute(() => ReportService.documentsZip({ operation, requirements: documents[operation.id] ?? [], documents: uploads }), "ZIP consolidado gerado.")}>{role === "admin" ? "Baixar ZIP Urus" : "Somente Admin Urus"}</button></article><article><span>ZIP</span><h3>Pacote específico por FIDC</h3><p>Sem documentos ou exigências pertencentes a outros fundos.</p><button disabled={!operation || !fidcId} onClick={() => { const fidc = fidcs.find((item) => item.id === fidcId); if (operation && fidc) execute(() => ReportService.documentsZip({ operation, requirements: documents[operation.id] ?? [], documents: uploads, fidc }), `ZIP de ${fidc.name} gerado.`); }}>Baixar ZIP do FIDC</button></article></div></div>;
}

function NotificationsPage({ role, notifications, onRead }: { role: User["role"]; notifications: NotificationEvent[]; onRead: (id: string) => void }) {
  const audience = role === "admin" ? "Urus" : "Profissional";
  const visible = notifications.filter((item) => item.audience === audience);
  return <div className="page-content"><PageHeader eyebrow="ATUALIZAÇÕES" title="Central de notificações" description="Eventos únicos por transição e e-mails sem dados ou anexos sensíveis."/><section className="panel notification-list">{visible.length ? visible.map((event) => <button key={event.id} className={event.status === "Lido" ? "read" : ""} onClick={() => onRead(event.id)}><span>{event.status === "Lido" ? "✓" : "●"}</span><div><strong>{event.title}</strong><p>{event.summary}</p><small>{event.createdAt} · {event.status}</small></div><b>{event.operationId ?? "Plataforma"}</b></button>) : <div className="empty-state"><span>♢</span><h3>Nenhuma notificação</h3><p>Novos avanços aparecerão aqui.</p></div>}</section><div className="tenant-note">Os e-mails simulados contêm somente um resumo não sensível e um link de acesso à plataforma.</div></div>;
}

function SubscriptionsPage({ plans, subscriptions, usage, onCreateVersion }: { plans: PlanVersion[]; subscriptions: Subscription[]; usage: UsagePeriod[]; onCreateVersion: (price: number, limit: number) => void }) {
  const active = plans.find((plan) => plan.status === "Ativo") ?? plans[0];
  const [price, setPrice] = useState(active?.price ?? 9900);
  const [limit, setLimit] = useState(active?.monthlyCaseLimit ?? 100);
  return <div className="page-content"><PageHeader eyebrow="ADMINISTRAÇÃO" title="Planos e assinaturas" description="Versões preservam as condições contratadas; checkout e cobrança são simulados."/><div className="admin-metrics"><article><span>Receita mensal simulada</span><strong>{currency(subscriptions.filter((item) => item.status === "Ativa").reduce((sum, item) => sum + (plans.find((plan) => plan.id === item.planVersionId)?.price ?? 0), 0))}</strong></article><article><span>Assinaturas ativas</span><strong>{subscriptions.filter((item) => item.status === "Ativa").length}</strong></article><article><span>Plano vigente</span><strong>{active?.name}</strong></article><article><span>Franquia</span><strong>{active?.monthlyCaseLimit} casos</strong></article></div><div className="subscription-layout"><section className="panel billing-table"><div className="table-head"><span>Assinante</span><span>Versão</span><span>Consumo</span><span>Status</span><span>Renovação</span></div>{subscriptions.map((subscription) => { const plan = plans.find((item) => item.id === subscription.planVersionId); const period = usage.find((item) => item.subscriptionId === subscription.id); return <div className="table-row" key={subscription.id}><span>{USERS.find((user) => user.id === subscription.userId)?.name}</span><span>{plan?.name} v{plan?.version} · {currency(plan?.price ?? 0)}</span><span>{period?.submittedCases ?? 0}/{period?.limit ?? plan?.monthlyCaseLimit}</span><span><b className={`admin-status status-${subscription.status.toLowerCase()}`}>{subscription.status}</b></span><span>{subscription.currentPeriodEnd}</span></div>; })}</section><aside className="panel plan-editor"><p className="eyebrow">NOVA VERSÃO</p><h2>Configurar Urus 100</h2><p>Assinantes atuais continuam na versão contratada.</p><Field label="Valor mensal"><MoneyField value={price} onChange={setPrice}/></Field><Field label="Casos por ciclo"><input type="number" min="1" value={limit} onChange={(event) => setLimit(Number(event.target.value))}/></Field><button className="primary-button" disabled={!price || !limit} onClick={() => onCreateVersion(price, limit)}>Criar nova versão</button><small>Stripe Checkout, Customer Portal e webhooks serão conectados somente no backend.</small></aside></div></div>;
}

function AccountPage({ user, operations, plans, subscription, usage, notify }: { user: User; operations: Operation[]; plans: PlanVersion[]; subscription?: Subscription; usage?: UsagePeriod; notify: (message: string) => void }) {
  const plan = plans.find((item) => item.id === subscription?.planVersionId) ?? plans.find((item) => item.status === "Ativo");
  const used = usage?.submittedCases ?? 0;
  const limit = usage?.limit ?? plan?.monthlyCaseLimit ?? 100;
  return <div className="page-content account-page"><PageHeader eyebrow="CONTA" title="Minha assinatura" description="Plano, consumo e cobrança simulada da conta individual."/><div className="account-grid"><section className="plan-card"><p className="eyebrow light">PLANO ATUAL</p><h2>{plan?.name ?? user.plan}</h2><p>Para profissionais que originam e acompanham operações de crédito.</p><div className="plan-price"><strong>{currency(plan?.price ?? 9900)}</strong><span>/ mês</span></div><ul><li>✓ {limit} novos casos por ciclo</li><li>✓ Reprocessamentos não consomem franquia</li><li>✓ Matching com todos os FIDCs ativos</li><li>✓ Relatórios e acompanhamento</li></ul><button onClick={() => notify("Portal Stripe simulado aberto. Nenhuma cobrança foi realizada.")}>Gerenciar plano</button></section><section className="panel usage-card"><div className="panel-heading"><div><h2>Uso no período</h2><p>{usage?.cycleStart} a {usage?.cycleEnd}</p></div><b className={`admin-status status-${(subscription?.status ?? "Ativa").toLowerCase()}`}>{subscription?.status ?? "Ativa"}</b></div><div className="usage-item"><div><span>Novos casos submetidos</span><strong>{used} de {limit}</strong></div><progress value={used} max={limit}/><small>{limit - used > 0 ? `${limit - used} casos disponíveis` : "Limite atingido — novos casos bloqueados"}</small></div><div className="usage-item"><div><span>Operações acessíveis</span><strong>{operations.length}</strong></div><small>Casos existentes permanecem disponíveis mesmo após atingir a franquia.</small></div><div className="billing-summary"><Review label="Próxima renovação" value={subscription?.currentPeriodEnd ?? "—"}/><Review label="Valor" value={currency(plan?.price ?? 9900)}/><Review label="Gateway futuro" value="Stripe (simulado)"/></div><div className="account-security"><strong>♙ Segurança da conta</strong><p>Na produção: MFA, criptografia, trilha imutável, retenção e resposta a incidentes.</p></div></section></div></div>;
}

function FidcModal({ form, setForm, error, editing, onClose, onSave }: { form: FidcProfile; setForm: React.Dispatch<React.SetStateAction<FidcProfile>>; error: string; editing: boolean; onClose: () => void; onSave: () => void }) {
  const selectedOptions = (event: React.ChangeEvent<HTMLSelectElement>) => Array.from(event.target.selectedOptions, (option) => option.value);
  return <div className="modal-backdrop" role="presentation"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="fidc-modal-title"><header><div><p className="eyebrow">ADMINISTRAÇÃO DE MATCHING</p><h2 id="fidc-modal-title">{editing ? "Editar perfil do FIDC" : "Cadastrar novo FIDC"}</h2><p>Configure matching, endereço de distribuição e checklist.</p></div><button aria-label="Fechar" onClick={onClose}>×</button></header><div className="modal-body"><div className="form-grid"><Field label="Nome do FIDC" wide><input value={form.name} onChange={(event) => setForm((item) => ({ ...item, name: event.target.value }))} placeholder="Nome comercial"/></Field><Field label="E-mail de distribuição"><input type="email" value={form.email} onChange={(event) => setForm((item) => ({ ...item, email: event.target.value }))} placeholder="credito@fidc.com.br"/></Field><Field label="Status"><select value={form.status} onChange={(event) => setForm((item) => ({ ...item, status: event.target.value as FidcStatus }))}><option>Rascunho</option><option>Ativo</option><option>Inativo</option></select></Field><Field label="Regra de faturamento"><select value={form.revenueMode} onChange={(event) => setForm((item) => ({ ...item, revenueMode: event.target.value as RevenueMode }))}><option>Mínimo</option><option>Máximo</option><option>Faixa</option><option>Pontuação</option></select></Field><Field label="Valor de referência"><MoneyField value={form.minRevenue} onChange={(value) => setForm((item) => ({ ...item, minRevenue: value }))}/></Field>{form.revenueMode === "Faixa" && <Field label="Valor máximo"><MoneyField value={form.maxRevenue ?? 0} onChange={(value) => setForm((item) => ({ ...item, maxRevenue: value }))}/></Field>}<Field label="Peso do faturamento"><input type="number" min="0" max="100" value={form.weights.revenue} onChange={(event) => setForm((item) => ({ ...item, weights: { ...item.weights, revenue: Number(event.target.value) } }))}/></Field><Field label="Segmentos"><select multiple value={form.segments} onChange={(event) => setForm((item) => ({ ...item, segments: selectedOptions(event) }))}>{SEGMENTS.map((segment) => <option key={segment}>{segment}</option>)}</select><small>Use Cmd/Ctrl para selecionar vários.</small></Field><Field label="Regiões"><select multiple value={form.regions} onChange={(event) => setForm((item) => ({ ...item, regions: selectedOptions(event) }))}><option>Brasil</option>{BRAZIL_STATES.map((state) => <option key={state}>{state}</option>)}</select></Field><Field label="Tipos de operação" wide><select multiple value={form.operationTypes} onChange={(event) => setForm((item) => ({ ...item, operationTypes: selectedOptions(event) }))}>{OPERATION_TYPES.map((type) => <option key={type}>{type}</option>)}</select></Field></div><div className="required-toggle"><input id="revenue-required-new" type="checkbox" checked={form.revenueRequired} onChange={(event) => setForm((item) => ({ ...item, revenueRequired: event.target.checked }))}/><label htmlFor="revenue-required-new"><strong>Critério eliminatório</strong><small>Falha torna o FIDC inelegível; critérios preferenciais apenas pontuam.</small></label></div>{error && <div className="error-box">{error}</div>}<div className="draft-hint">Rascunhos não participam do matching. Novos FIDCs recebem uma cópia versionada do checklist padrão.</div></div><footer><button className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" onClick={onSave}>{editing ? "Salvar alterações" : "Cadastrar FIDC"}</button></footer></section></div>;
}
