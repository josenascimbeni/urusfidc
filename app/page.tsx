"use client";

import { useMemo, useState } from "react";
import { BRAZIL_STATES, createDocuments, DOCUMENT_BLUEPRINT, INITIAL_FIDCS, INITIAL_OPERATIONS, OPERATION_TYPES, SEGMENTS, USERS } from "./mock-data";
import { calculateMatches } from "./matching";
import type { ChecklistDocument, FidcProfile, FidcStatus, JourneyState, Operation, OperationForm, RevenueMode, User } from "./types";

type View = "dashboard" | "operations" | "new-operation" | "operation-detail" | "fidcs" | "checklist" | "professionals" | "subscriptions" | "account";
type DetailTab = "summary" | "matching" | "documents" | "journey";

const EMPTY_OPERATION: OperationForm = { companyName: "", cnpj: "", segment: "", annualRevenue: 0, city: "", state: "", amount: 0, operationType: "", guaranteeValue: 0, guaranteeType: "", salesMethod: "", receiptMethod: "" };
const EMPTY_JOURNEY: JourneyState = { distributed: false, interested: false, meetingScheduled: false, committeeResult: "Pendente", proposalShared: false, commission: "Aguardando FIDC" };

function currency(value: number, compact = false) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: compact ? "compact" : "standard", maximumFractionDigits: compact ? 1 : 0 }).format(value);
}

function validCnpj(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false;
  const calc = (base: string, weights: number[]) => {
    const sum = base.split("").reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const first = calc(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = calc(digits.slice(0, 12) + first, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return digits.endsWith(`${first}${second}`);
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((word) => word.charAt(0)).join("").toUpperCase();
}

function Login({ onLogin }: { onLogin: (user: User) => void }) {
  return (
    <main className="login-shell">
      <section className="login-brand-panel">
        <div className="login-brand"><span className="brand-mark large">U</span><span>URUS <b>FIDC</b></span></div>
        <div className="login-message"><p className="eyebrow light">CRÉDITO QUE ENCONTRA O CAMINHO CERTO</p><h1>O matching inteligente entre empresas e FIDCs.</h1><p>Qualifique operações, encontre parceiros aderentes e acompanhe cada etapa com transparência.</p></div>
        <div className="login-trust"><span>● Ambiente demonstrativo</span><span>LGPD por concepção</span><span>Decisões explicáveis</span></div>
      </section>
      <section className="login-access-panel">
        <div className="login-box">
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
  const [session, setSession] = useState<User | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [fidcs, setFidcs] = useState<FidcProfile[]>(INITIAL_FIDCS);
  const [operations, setOperations] = useState<Operation[]>(INITIAL_OPERATIONS);
  const [selectedOperationId, setSelectedOperationId] = useState("OP-2026-084");
  const [detailTab, setDetailTab] = useState<DetailTab>("summary");
  const [documents, setDocuments] = useState<Record<string, ChecklistDocument[]>>(() => Object.fromEntries(INITIAL_OPERATIONS.map((operation) => [operation.id, createDocuments(operation.id, operation.ownerId)])));
  const [journeys, setJourneys] = useState<Record<string, JourneyState>>({
    "OP-2026-084": EMPTY_JOURNEY,
    "OP-2026-079": { ...EMPTY_JOURNEY, distributed: true, interested: true, meetingScheduled: true },
    "OP-2026-071": { distributed: true, interested: true, meetingScheduled: true, committeeResult: "Aprovado", proposalShared: true, commission: "Recebida pela Urus FIDC" },
  });
  const [formStep, setFormStep] = useState(1);
  const [operationForm, setOperationForm] = useState<OperationForm>(EMPTY_OPERATION);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");
  const [fidcSearch, setFidcSearch] = useState("");
  const [showFidcForm, setShowFidcForm] = useState(false);
  const [editingFidcId, setEditingFidcId] = useState<string | null>(null);
  const [fidcError, setFidcError] = useState("");
  const [fidcForm, setFidcForm] = useState<FidcProfile>({ id: "", name: "", status: "Rascunho", minRevenue: 0, revenueMode: "Mínimo", revenueRequired: true, segments: [], operationTypes: [], regions: [], weights: { revenue: 25, segment: 20, operation: 35, region: 20 }, createdAt: "15/08/2026", linkedOperations: 0 });

  const userOperations = useMemo(() => session ? operations.filter((operation) => session.role === "admin" || operation.ownerId === session.id) : [], [operations, session]);
  const selectedOperation = operations.find((operation) => operation.id === selectedOperationId) ?? userOperations[0];
  const currentDocuments = selectedOperation ? documents[selectedOperation.id] ?? [] : [];
  const allDocumentsApproved = currentDocuments.length > 0 && currentDocuments.every((document) => document.status === "Aprovado");
  const matches = selectedOperation ? calculateMatches(selectedOperation, fidcs) : [];
  const currentJourney = selectedOperation ? journeys[selectedOperation.id] ?? EMPTY_JOURNEY : EMPTY_JOURNEY;

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  function navigate(next: View) {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openOperation(operation: Operation, tab: DetailTab = "summary") {
    setSelectedOperationId(operation.id);
    setDetailTab(tab);
    navigate("operation-detail");
  }

  function fillExample() {
    setOperationForm({ companyName: "Horizonte Agroindustrial Ltda.", cnpj: "11.222.333/0001-81", segment: "Agro", annualRevenue: 52_000_000, city: "Campo Grande", state: "MS", amount: 5_000_000, operationType: "Capital de Giro", guaranteeValue: 7_500_000, guaranteeType: "Recebíveis", salesMethod: "Contratos B2B recorrentes", receiptMethod: "Boleto e transferência" });
    setFormError("");
  }

  function nextFormStep() {
    let error = "";
    if (formStep === 1 && (!operationForm.companyName || !validCnpj(operationForm.cnpj) || !operationForm.segment || !operationForm.annualRevenue || !operationForm.city || !operationForm.state)) error = "Preencha os dados obrigatórios e informe um CNPJ válido.";
    if (formStep === 2 && (!operationForm.amount || !operationForm.operationType)) error = "Informe o valor e o tipo da operação.";
    if (formStep === 3 && (!operationForm.guaranteeValue || !operationForm.guaranteeType || !operationForm.salesMethod || !operationForm.receiptMethod)) error = "Complete as informações de garantia, vendas e recebimentos.";
    if (error) return setFormError(error);
    setFormError("");
    if (formStep < 4) return setFormStep((step) => step + 1);
    if (!session) return;
    const id = `OP-2026-${String(operations.length + 85).padStart(3, "0")}`;
    const operation: Operation = { ...operationForm, id, ownerId: session.id, createdAt: "15/08/2026", status: "Qualificação", selectedFidcs: [] };
    setOperations((items) => [operation, ...items]);
    setDocuments((items) => ({ ...items, [id]: createDocuments(id, session.id).map((document) => ({ ...document, status: "Pendente" })) }));
    setJourneys((items) => ({ ...items, [id]: EMPTY_JOURNEY }));
    setSelectedOperationId(id);
    setDetailTab("matching");
    setOperationForm(EMPTY_OPERATION);
    setFormStep(1);
    navigate("operation-detail");
    notify("Operação qualificada e matching processado.");
  }

  function selectFidc(fidcId: string) {
    if (!selectedOperation) return;
    setOperations((items) => items.map((operation) => operation.id !== selectedOperation.id ? operation : { ...operation, selectedFidcs: operation.selectedFidcs.includes(fidcId) ? operation.selectedFidcs.filter((id) => id !== fidcId) : [...operation.selectedFidcs, fidcId] }));
  }

  function setDocumentStatus(documentId: string, status: ChecklistDocument["status"]) {
    if (!selectedOperation) return;
    setDocuments((items) => ({ ...items, [selectedOperation.id]: (items[selectedOperation.id] ?? []).map((document) => document.id === documentId ? { ...document, status } : document) }));
  }

  function approveAllDocuments() {
    if (!selectedOperation) return;
    setDocuments((items) => ({ ...items, [selectedOperation.id]: (items[selectedOperation.id] ?? []).map((document) => ({ ...document, status: "Aprovado" })) }));
    setOperations((items) => items.map((operation) => operation.id === selectedOperation.id ? { ...operation, status: "Documentos" } : operation));
    notify("Checklist validado. A distribuição foi liberada.");
  }

  function updateJourney(changes: Partial<JourneyState>, message: string) {
    if (!selectedOperation) return;
    setJourneys((items) => ({ ...items, [selectedOperation.id]: { ...(items[selectedOperation.id] ?? EMPTY_JOURNEY), ...changes } }));
    notify(message);
  }

  function distribute() {
    if (!selectedOperation || !allDocumentsApproved || selectedOperation.selectedFidcs.length === 0) return;
    updateJourney({ distributed: true }, `Operação compartilhada com ${selectedOperation.selectedFidcs.length} FIDC(s).`);
    setOperations((items) => items.map((operation) => operation.id === selectedOperation.id ? { ...operation, status: "Em análise" } : operation));
  }

  function startNewFidc() {
    setEditingFidcId(null);
    setFidcForm({ id: "", name: "", status: "Rascunho", minRevenue: 0, revenueMode: "Mínimo", revenueRequired: true, segments: [], operationTypes: [], regions: [], weights: { revenue: 25, segment: 20, operation: 35, region: 20 }, createdAt: "15/08/2026", linkedOperations: 0 });
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
    const complete = Boolean(fidcForm.name.trim() && fidcForm.minRevenue > 0 && fidcForm.segments.length && fidcForm.operationTypes.length && fidcForm.regions.length);
    if (!fidcForm.name.trim()) return setFidcError("Informe o nome do FIDC.");
    if (duplicate) return setFidcError("Já existe um FIDC com este nome.");
    if (fidcForm.status === "Ativo" && !complete) return setFidcError("Para ativar, complete faturamento, segmento, operação e região.");
    const saved = { ...fidcForm, id: editingFidcId ?? fidcForm.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-") };
    setFidcs((items) => editingFidcId ? items.map((fidc) => fidc.id === editingFidcId ? saved : fidc) : [saved, ...items]);
    setShowFidcForm(false);
    notify(editingFidcId ? "Perfil do FIDC atualizado." : "Novo FIDC cadastrado como rascunho.");
  }

  function changeFidcStatus(fidcId: string, status: FidcStatus) {
    setFidcs((items) => items.map((fidc) => fidc.id === fidcId ? { ...fidc, status } : fidc));
    notify(status === "Arquivado" ? "FIDC arquivado com histórico preservado." : `Status alterado para ${status.toLowerCase()}.`);
  }

  function resetDemo() {
    setFidcs(INITIAL_FIDCS);
    setOperations(INITIAL_OPERATIONS);
    setDocuments(Object.fromEntries(INITIAL_OPERATIONS.map((operation) => [operation.id, createDocuments(operation.id, operation.ownerId)])));
    setJourneys({ "OP-2026-084": EMPTY_JOURNEY, "OP-2026-079": { ...EMPTY_JOURNEY, distributed: true, interested: true, meetingScheduled: true }, "OP-2026-071": { distributed: true, interested: true, meetingScheduled: true, committeeResult: "Aprovado", proposalShared: true, commission: "Recebida pela Urus FIDC" } });
    navigate("dashboard");
    notify("Demonstração restaurada.");
  }

  if (!session) return <Login onLogin={(user) => { setSession(user); setView(user.role === "admin" ? "fidcs" : "dashboard"); }} />;

  const professionalNav: { id: View; label: string; icon: string }[] = [
    { id: "dashboard", label: "Visão geral", icon: "⌂" }, { id: "operations", label: "Operações", icon: "▤" },
    { id: "account", label: "Minha assinatura", icon: "◎" },
  ];
  const adminNav: { id: View; label: string; icon: string }[] = [
    { id: "fidcs", label: "FIDCs", icon: "◇" }, { id: "checklist", label: "Checklist", icon: "▱" },
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
          <button className="profile-card" onClick={() => { setSession(null); setView("dashboard"); }}><span className="avatar">{session.initials}</span><span><strong>{session.name}</strong><small>{session.role === "admin" ? "Administrador" : session.professionalType}</small></span><span>↗</span></button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar"><div className="demo-pill"><span /> MODO DEMONSTRAÇÃO · NÃO USE DADOS REAIS</div><div className="top-actions"><button aria-label="Central de ajuda">?</button><button aria-label="Notificações">♢</button></div></header>

        {view === "dashboard" && <Dashboard user={session} operations={userOperations} fidcs={fidcs} onNew={() => navigate("new-operation")} onOpen={openOperation} />}
        {view === "operations" && <OperationsPage operations={userOperations} onNew={() => navigate("new-operation")} onOpen={openOperation} />}
        {view === "new-operation" && <NewOperation step={formStep} form={operationForm} error={formError} onChange={(field, value) => setOperationForm((form) => ({ ...form, [field]: value }))} onNext={nextFormStep} onBack={() => formStep > 1 ? setFormStep((step) => step - 1) : navigate("operations")} onFill={fillExample} />}
        {view === "operation-detail" && selectedOperation && <OperationDetail operation={selectedOperation} tab={detailTab} setTab={setDetailTab} matches={matches} documents={currentDocuments} journey={currentJourney} allApproved={allDocumentsApproved} onBack={() => navigate("operations")} onSelectFidc={selectFidc} onDocument={setDocumentStatus} onApproveAll={approveAllDocuments} onDistribute={distribute} onJourney={updateJourney} onOperationStatus={(status) => setOperations((items) => items.map((operation) => operation.id === selectedOperation.id ? { ...operation, status } : operation))} />}
        {view === "fidcs" && <AdminFidcs fidcs={fidcs} search={fidcSearch} setSearch={setFidcSearch} onNew={startNewFidc} onEdit={editFidc} onStatus={changeFidcStatus} />}
        {view === "checklist" && <AdminChecklist />}
        {view === "professionals" && <ProfessionalsPage />}
        {view === "subscriptions" && <SubscriptionsPage />}
        {view === "account" && <AccountPage user={session} operations={userOperations} />}
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

function NewOperation({ step, form, error, onChange, onNext, onBack, onFill }: { step: number; form: OperationForm; error: string; onChange: (field: keyof OperationForm, value: string | number) => void; onNext: () => void; onBack: () => void; onFill: () => void }) {
  const titles = ["Vamos conhecer a empresa.", "Qual é a necessidade de crédito?", "Como a operação será estruturada?", "Revise antes do matching."];
  return <div className="page-content form-page"><button className="back-button" onClick={onBack}>← {step === 1 ? "Voltar para operações" : "Etapa anterior"}</button><div className="form-header"><div><p className="eyebrow">NOVA OPERAÇÃO</p><h1>{titles[step - 1]}</h1><p>As informações serão comparadas com os perfis configurados pelos FIDCs.</p></div><span>Etapa <b>{step}</b> de 4</span></div><div className="stepper">{[1, 2, 3, 4].map((item) => <span key={item} className={item <= step ? "done" : ""}/>)}</div><section className="form-card">{step === 1 && <><div className="form-card-title"><span>01</span><div><h2>Dados da empresa</h2><p>Identificação e porte financeiro.</p></div><button className="text-button" onClick={onFill}>Preencher exemplo</button></div><div className="form-grid"><Field label="Razão social" wide><input value={form.companyName} onChange={(event) => onChange("companyName", event.target.value)} placeholder="Ex.: Empresa Brasileira Ltda."/></Field><Field label="CNPJ"><input value={form.cnpj} onChange={(event) => onChange("cnpj", event.target.value)} placeholder="00.000.000/0000-00"/></Field><Field label="Segmento"><select value={form.segment} onChange={(event) => onChange("segment", event.target.value)}><option value="">Selecione</option>{SEGMENTS.map((segment) => <option key={segment}>{segment}</option>)}</select></Field><Field label="Faturamento anual"><input type="number" value={form.annualRevenue || ""} onChange={(event) => onChange("annualRevenue", Number(event.target.value))} placeholder="R$ 0"/></Field><Field label="Cidade"><input value={form.city} onChange={(event) => onChange("city", event.target.value)} placeholder="Ex.: São Paulo"/></Field><Field label="Estado"><select value={form.state} onChange={(event) => onChange("state", event.target.value)}><option value="">UF</option>{BRAZIL_STATES.map((state) => <option key={state}>{state}</option>)}</select></Field></div></>}
      {step === 2 && <><div className="form-card-title"><span>02</span><div><h2>Perfil da operação</h2><p>Valor solicitado e modalidade de crédito.</p></div></div><div className="form-grid"><Field label="Valor da operação"><input type="number" value={form.amount || ""} onChange={(event) => onChange("amount", Number(event.target.value))} placeholder="R$ 0"/></Field><Field label="Tipo da operação"><select value={form.operationType} onChange={(event) => onChange("operationType", event.target.value)}><option value="">Selecione</option>{OPERATION_TYPES.map((type) => <option key={type}>{type}</option>)}</select></Field></div><div className="qualification-hint"><span>✦</span><p><strong>Por que perguntamos isso?</strong><br/>Modalidade e valor ajudam a encontrar FIDCs com apetite compatível.</p></div></>}
      {step === 3 && <><div className="form-card-title"><span>03</span><div><h2>Garantias e recebíveis</h2><p>Estrutura comercial da empresa.</p></div></div><div className="form-grid"><Field label="Valor da garantia"><input type="number" value={form.guaranteeValue || ""} onChange={(event) => onChange("guaranteeValue", Number(event.target.value))}/></Field><Field label="Tipo de garantia"><input value={form.guaranteeType} onChange={(event) => onChange("guaranteeType", event.target.value)} placeholder="Ex.: Recebíveis, imóvel, aval"/></Field><Field label="Como a empresa vende?"><textarea value={form.salesMethod} onChange={(event) => onChange("salesMethod", event.target.value)} placeholder="Descreva os recebíveis e prazos"/></Field><Field label="Como a empresa recebe?"><textarea value={form.receiptMethod} onChange={(event) => onChange("receiptMethod", event.target.value)} placeholder="Boleto, PIX, cartão, transferência..."/></Field></div></>}
      {step === 4 && <><div className="form-card-title"><span>04</span><div><h2>Revisão da qualificação</h2><p>Confirme os dados antes de processar o matching.</p></div></div><div className="review-grid"><Review label="Empresa" value={form.companyName}/><Review label="CNPJ" value={form.cnpj}/><Review label="Segmento / região" value={`${form.segment} · ${form.city}/${form.state}`}/><Review label="Faturamento anual" value={currency(form.annualRevenue)}/><Review label="Operação" value={form.operationType}/><Review label="Valor solicitado" value={currency(form.amount)}/><Review label="Garantia" value={`${form.guaranteeType} · ${currency(form.guaranteeValue)}`}/><Review label="Recebimentos" value={form.receiptMethod}/></div><div className="ai-disclaimer"><span>✦</span><p><strong>Matching explicável</strong><br/>O resultado será calculado por regras objetivas e pesos configurados. Nenhuma decisão de crédito é tomada pela Urus FIDC.</p></div></>}
      {error && <div className="error-box" role="alert">{error}</div>}<div className="privacy-box"><span>♙</span><p><strong>Ambiente de demonstração.</strong><br/>Nenhum dado informado é persistido ou compartilhado.</p></div><div className="form-actions"><button className="secondary-button" onClick={onBack}>{step === 1 ? "Cancelar" : "Voltar"}</button><button className="primary-button" onClick={onNext}>{step === 4 ? "Processar matching" : "Continuar"} <span>→</span></button></div></section></div>;
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) { return <label className={wide ? "wide" : ""}>{label}{children}</label>; }
function Review({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value || "—"}</strong></div>; }

function OperationDetail({ operation, tab, setTab, matches, documents, journey, allApproved, onBack, onSelectFidc, onDocument, onApproveAll, onDistribute, onJourney, onOperationStatus }: { operation: Operation; tab: DetailTab; setTab: (tab: DetailTab) => void; matches: ReturnType<typeof calculateMatches>; documents: ChecklistDocument[]; journey: JourneyState; allApproved: boolean; onBack: () => void; onSelectFidc: (id: string) => void; onDocument: (id: string, status: ChecklistDocument["status"]) => void; onApproveAll: () => void; onDistribute: () => void; onJourney: (changes: Partial<JourneyState>, message: string) => void; onOperationStatus: (status: Operation["status"]) => void }) {
  const eligible = matches.filter((match) => match.eligible);
  return <div className="page-content detail-page"><button className="back-button" onClick={onBack}>← Voltar para operações</button><div className="operation-hero"><div className="company-logo large-logo">{initials(operation.companyName)}</div><div><p className="eyebrow">{operation.id}</p><h1>{operation.companyName}</h1><p>{operation.operationType} · {currency(operation.amount)} · {operation.state}</p></div><span className={`status hero-status status-${operation.status.toLowerCase().replaceAll(" ", "-")}`}>{operation.status}</span></div><nav className="tabs" aria-label="Detalhes da operação">{(["summary", "matching", "documents", "journey"] as DetailTab[]).map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{({ summary: "Resumo", matching: `Matching (${eligible.length})`, documents: `Documentos (${documents.filter((doc) => doc.status === "Aprovado").length}/${documents.length})`, journey: "Jornada" })[item]}</button>)}</nav>
    {tab === "summary" && <div className="detail-grid"><section className="panel summary-card"><div className="panel-heading"><div><h2>Perfil qualificado</h2><p>Dados declarados pelo profissional</p></div></div><div className="summary-list"><Review label="CNPJ" value={operation.cnpj}/><Review label="Segmento" value={operation.segment}/><Review label="Faturamento anual" value={currency(operation.annualRevenue)}/><Review label="Cidade / Estado" value={`${operation.city} / ${operation.state}`}/><Review label="Valor solicitado" value={currency(operation.amount)}/><Review label="Garantia" value={`${operation.guaranteeType} · ${currency(operation.guaranteeValue)}`}/><Review label="Como vende" value={operation.salesMethod}/><Review label="Como recebe" value={operation.receiptMethod}/></div></section><aside className="panel audit-card"><div className="panel-heading"><div><h2>Rastreabilidade</h2><p>Eventos desta oportunidade</p></div></div><ul><li><span>✓</span><div><strong>Perfil cadastrado</strong><small>{operation.createdAt} · por você</small></div></li><li><span>✦</span><div><strong>Matching processado</strong><small>{eligible.length} FIDCs elegíveis</small></div></li><li><span>♙</span><div><strong>Acesso protegido</strong><small>Visível somente neste usuário</small></div></li></ul></aside></div>}
    {tab === "matching" && <section><div className="match-summary"><div><span className="spark">✦</span><div><p className="eyebrow light">MATCH INTELIGENTE CONCLUÍDO</p><h2>{eligible.length} FIDCs aderentes à operação</h2><p>Ranking calculado por critérios objetivos. Selecione quem receberá a oportunidade após o checklist.</p></div></div><div className="score-ring"><strong>{eligible[0]?.score ?? 0}</strong><span>melhor<br/>score</span></div></div><div className="match-list">{matches.map((match, index) => <article className={`match-card ${!match.eligible ? "ineligible" : ""}`} key={match.fidc.id}><div className="match-rank">{match.eligible ? String(index + 1).padStart(2, "0") : "—"}</div><div className="fund-logo">{initials(match.fidc.name)}</div><div className="match-main"><div className="match-title"><h3>{match.fidc.name}</h3><span className={match.eligible ? "eligible-pill" : "not-eligible-pill"}>{match.eligible ? "Elegível" : "Fora do perfil"}</span></div><p>{match.explanation}</p><div className="criteria-row">{match.criteria.map((criterion) => <span className={criterion.passed ? "passed" : "failed"} key={criterion.label} title={criterion.detail}>{criterion.passed ? "✓" : "×"} {criterion.label}</span>)}</div></div><div className="match-score"><strong>{match.score}</strong><span>/100</span></div><label className="select-match"><input type="checkbox" checked={operation.selectedFidcs.includes(match.fidc.id)} disabled={!match.eligible} onChange={() => onSelectFidc(match.fidc.id)}/><span>{operation.selectedFidcs.includes(match.fidc.id) ? "Selecionado" : "Selecionar"}</span></label></article>)}</div><div className="sticky-action"><div><strong>{operation.selectedFidcs.length} FIDC(s) selecionado(s)</strong><small>{allApproved ? "Checklist completo: distribuição liberada." : "Complete os documentos antes da distribuição."}</small></div><button className="primary-button" disabled={!allApproved || operation.selectedFidcs.length === 0 || journey.distributed} onClick={onDistribute}>{journey.distributed ? "Operação distribuída ✓" : "Compartilhar com FIDCs"}</button></div></section>}
    {tab === "documents" && <section><div className="document-header"><div><p className="eyebrow">CHECKLIST INTELIGENTE</p><h2>{documents.filter((document) => document.status === "Aprovado").length} de {documents.length} documentos validados</h2><p>O controle simula a análise de presença e legibilidade dos arquivos.</p></div><div className="progress-ring"><strong>{Math.round((documents.filter((document) => document.status === "Aprovado").length / documents.length) * 100)}%</strong></div></div><div className="security-banner">♙ <span><strong>Não envie arquivos reais neste protótipo.</strong> Os botões abaixo apenas alteram o estado visual do checklist.</span><button onClick={onApproveAll}>Simular análise completa</button></div><div className="document-list">{documents.map((document) => <article key={document.id}><span className="doc-icon">▱</span><div><strong>{document.name}</strong><small>{document.detail}</small></div><span className={`doc-status doc-${document.status.toLowerCase().replaceAll(" ", "-")}`}>{document.status}</span><select aria-label={`Alterar status de ${document.name}`} value={document.status} onChange={(event) => onDocument(document.id, event.target.value as ChecklistDocument["status"])}><option>Pendente</option><option>Em análise</option><option>Aprovado</option><option>Rejeitado</option></select></article>)}</div></section>}
    {tab === "journey" && (
      <Journey operation={operation} journey={journey} allApproved={allApproved} selectedCount={operation.selectedFidcs.length} onDistribute={onDistribute} onUpdate={onJourney} onStatus={onOperationStatus}/>
    )}
  </div>;
}

function Journey({ operation, journey, allApproved, selectedCount, onDistribute, onUpdate, onStatus }: { operation: Operation; journey: JourneyState; allApproved: boolean; selectedCount: number; onDistribute: () => void; onUpdate: (changes: Partial<JourneyState>, message: string) => void; onStatus: (status: Operation["status"]) => void }) {
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

function AdminFidcs({ fidcs, search, setSearch, onNew, onEdit, onStatus }: { fidcs: FidcProfile[]; search: string; setSearch: (value: string) => void; onNew: () => void; onEdit: (fidc: FidcProfile) => void; onStatus: (id: string, status: FidcStatus) => void }) {
  const filtered = fidcs.filter((fidc) => fidc.name.toLowerCase().includes(search.toLowerCase()));
  return <div className="page-content"><PageHeader eyebrow="ADMINISTRAÇÃO" title="Perfis de FIDCs" description="Cadastre e configure quem participa do matching inteligente." action={<button className="primary-button" onClick={onNew}>＋ Cadastrar novo FIDC</button>}/><div className="admin-metrics"><article><span>Perfis cadastrados</span><strong>{fidcs.length}</strong></article><article><span>Ativos no matching</span><strong>{fidcs.filter((fidc) => fidc.status === "Ativo").length}</strong></article><article><span>Em rascunho</span><strong>{fidcs.filter((fidc) => fidc.status === "Rascunho").length}</strong></article><article><span>Critérios configuráveis</span><strong>7</strong></article></div><section className="panel table-panel"><div className="filter-row"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar FIDC..."/><span className="audit-label">Última revisão: hoje, 17h42</span></div><div className="fidc-table"><div className="table-head"><span>FIDC</span><span>Faturamento</span><span>Região</span><span>Operações</span><span>Status</span><span>Ações</span></div>{filtered.map((fidc) => <div className="table-row" key={fidc.id}><span className="fidc-name"><b className="fund-logo small">{initials(fidc.name)}</b><span><strong>{fidc.name}</strong><small>{fidc.segments.length} segmentos · {fidc.linkedOperations} vínculos</small></span></span><span><strong>{fidc.revenueMode}</strong><small>{currency(fidc.minRevenue, true)}</small></span><span>{fidc.regions.includes("Brasil") ? "Brasil" : fidc.regions.join(", ")}</span><span>{fidc.operationTypes.length} modalidades</span><span><b className={`admin-status status-${fidc.status.toLowerCase()}`}>{fidc.status}</b></span><span className="row-actions"><button onClick={() => onEdit(fidc)}>Editar</button>{fidc.status === "Ativo" ? <button onClick={() => onStatus(fidc.id, "Inativo")}>Desativar</button> : fidc.status !== "Arquivado" && <button onClick={() => onStatus(fidc.id, "Ativo")}>Ativar</button>}<button className="danger-link" onClick={() => onStatus(fidc.id, "Arquivado")}>Arquivar</button></span></div>)}</div></section></div>;
}

function FidcModal({ form, setForm, error, editing, onClose, onSave }: { form: FidcProfile; setForm: React.Dispatch<React.SetStateAction<FidcProfile>>; error: string; editing: boolean; onClose: () => void; onSave: () => void }) {
  const selectedOptions = (event: React.ChangeEvent<HTMLSelectElement>) => Array.from(event.target.selectedOptions, (option) => option.value);
  return <div className="modal-backdrop" role="presentation"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="fidc-modal-title"><header><div><p className="eyebrow">ADMINISTRAÇÃO DE MATCHING</p><h2 id="fidc-modal-title">{editing ? "Editar perfil do FIDC" : "Cadastrar novo FIDC"}</h2><p>Defina o perfil que será comparado às operações.</p></div><button aria-label="Fechar" onClick={onClose}>×</button></header><div className="modal-body"><div className="form-grid"><Field label="Nome do FIDC" wide><input value={form.name} onChange={(event) => setForm((item) => ({ ...item, name: event.target.value }))} placeholder="Nome comercial"/></Field><Field label="Status"><select value={form.status} onChange={(event) => setForm((item) => ({ ...item, status: event.target.value as FidcStatus }))}><option>Rascunho</option><option>Ativo</option><option>Inativo</option></select></Field><Field label="Regra de faturamento"><select value={form.revenueMode} onChange={(event) => setForm((item) => ({ ...item, revenueMode: event.target.value as RevenueMode }))}><option>Mínimo</option><option>Máximo</option><option>Faixa</option><option>Pontuação</option></select></Field><Field label="Valor de referência"><input type="number" value={form.minRevenue || ""} onChange={(event) => setForm((item) => ({ ...item, minRevenue: Number(event.target.value) }))}/></Field>{form.revenueMode === "Faixa" && <Field label="Valor máximo"><input type="number" value={form.maxRevenue || ""} onChange={(event) => setForm((item) => ({ ...item, maxRevenue: Number(event.target.value) }))}/></Field>}<Field label="Peso do faturamento"><input type="number" min="0" max="100" value={form.weights.revenue} onChange={(event) => setForm((item) => ({ ...item, weights: { ...item.weights, revenue: Number(event.target.value) } }))}/></Field><Field label="Segmentos"><select multiple value={form.segments} onChange={(event) => setForm((item) => ({ ...item, segments: selectedOptions(event) }))}>{SEGMENTS.map((segment) => <option key={segment}>{segment}</option>)}</select><small>Use Cmd/Ctrl para selecionar vários.</small></Field><Field label="Regiões"><select multiple value={form.regions} onChange={(event) => setForm((item) => ({ ...item, regions: selectedOptions(event) }))}><option>Brasil</option>{BRAZIL_STATES.map((state) => <option key={state}>{state}</option>)}</select><small>“Brasil” inclui todos os estados.</small></Field><Field label="Tipos de operação" wide><select multiple value={form.operationTypes} onChange={(event) => setForm((item) => ({ ...item, operationTypes: selectedOptions(event) }))}>{OPERATION_TYPES.map((type) => <option key={type}>{type}</option>)}</select></Field></div><div className="required-toggle"><input id="revenue-required" aria-label="Critério eliminatório de faturamento" type="checkbox" checked={form.revenueRequired} onChange={(event) => setForm((item) => ({ ...item, revenueRequired: event.target.checked }))}/><label htmlFor="revenue-required"><strong>Critério eliminatório</strong><small>Se não atender, o FIDC ficará inelegível.</small></label></div>{error && <div className="error-box">{error}</div>}<div className="draft-hint">Perfis em rascunho não participam do matching. Para ativar, complete todos os campos obrigatórios.</div></div><footer><button className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" onClick={onSave}>{editing ? "Salvar alterações" : "Cadastrar FIDC"}</button></footer></section></div>;
}

function AdminChecklist() { return <div className="page-content"><PageHeader eyebrow="ADMINISTRAÇÃO" title="Checklist documental" description="Documentos exigidos em todas as operações antes da distribuição."/><section className="panel checklist-admin"><div className="panel-heading"><div><h2>Checklist padrão</h2><p>{DOCUMENT_BLUEPRINT.length} categorias obrigatórias</p></div><button>＋ Adicionar item</button></div>{DOCUMENT_BLUEPRINT.map(([id, name, detail], index) => <div className="checklist-row" key={id}><span className="drag">⠿</span><span className="doc-icon">▱</span><span><strong>{name}</strong><small>{detail}</small></span><b>Obrigatório</b><button>Editar</button><span>{index + 1}</span></div>)}</section><div className="tenant-note">Alterações futuras deverão ser versionadas para não modificar retroativamente operações em andamento.</div></div>; }

function ProfessionalsPage() { const professionals = USERS.filter((user) => user.role === "professional"); return <div className="page-content"><PageHeader eyebrow="ADMINISTRAÇÃO" title="Profissionais" description="Assinantes individuais e isolamento das respectivas operações."/><section className="panel people-grid">{professionals.map((user) => <article key={user.id}><span className="avatar">{user.initials}</span><div><strong>{user.name}</strong><small>{user.professionalType}</small><span>{user.email}</span></div><b className="admin-status status-ativo">Ativo</b><div className="people-stats"><span>Plano <strong>{user.plan}</strong></span><span>Operações <strong>{INITIAL_OPERATIONS.filter((operation) => operation.ownerId === user.id).length}</strong></span></div><button>Ver perfil →</button></article>)}</section></div>; }

function SubscriptionsPage() { return <div className="page-content"><PageHeader eyebrow="ADMINISTRAÇÃO" title="Assinaturas" description="Visão demonstrativa dos planos e cobranças da plataforma."/><div className="admin-metrics"><article><span>Receita mensal simulada</span><strong>R$ 1.288</strong></article><article><span>Assinaturas ativas</span><strong>2</strong></article><article><span>Inadimplência</span><strong>0%</strong></article><article><span>Próxima cobrança</span><strong>22 ago</strong></article></div><section className="panel billing-table"><div className="table-head"><span>Assinante</span><span>Plano</span><span>Valor</span><span>Status</span><span>Próxima cobrança</span></div><div className="table-row"><span>Marina Costa</span><span>Profissional</span><span>R$ 899/mês</span><span><b className="admin-status status-ativo">Ativa</b></span><span>22/08/2026</span></div><div className="table-row"><span>Ricardo Alves</span><span>Essencial</span><span>R$ 389/mês</span><span><b className="admin-status status-ativo">Ativa</b></span><span>25/08/2026</span></div></section></div>; }

function AccountPage({ user, operations }: { user: User; operations: Operation[] }) { return <div className="page-content account-page"><PageHeader eyebrow="CONTA" title="Minha assinatura" description="Plano, consumo e segurança da sua conta individual."/><div className="account-grid"><section className="plan-card"><p className="eyebrow light">PLANO ATUAL</p><h2>{user.plan}</h2><p>Para profissionais que originam e acompanham operações de crédito.</p><div className="plan-price"><strong>R$ 899</strong><span>/ mês</span></div><ul><li>✓ Até 20 operações ativas</li><li>✓ Matching com todos os FIDCs</li><li>✓ Checklist inteligente</li><li>✓ Acompanhamento de comissões</li></ul><button>Gerenciar plano</button></section><section className="panel usage-card"><div className="panel-heading"><div><h2>Uso no período</h2><p>Agosto de 2026</p></div><b className="admin-status status-ativo">Assinatura ativa</b></div><div className="usage-item"><div><span>Operações ativas</span><strong>{operations.length} de 20</strong></div><progress value={operations.length} max="20"/></div><div className="usage-item"><div><span>Usuários</span><strong>1 de 1</strong></div><progress value="1" max="1"/></div><div className="billing-summary"><Review label="Próxima cobrança" value="22/08/2026"/><Review label="Valor" value="R$ 899,00"/><Review label="Forma de pagamento" value="•••• 4821"/></div><div className="account-security"><strong>♙ Segurança da conta</strong><p>Na versão de produção: MFA, sessões controladas, criptografia e trilha de auditoria.</p></div></section></div></div>; }
