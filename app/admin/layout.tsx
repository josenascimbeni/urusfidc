import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { requireAdminPage } from "@/lib/auth/admin-page";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) { const context = await requireAdminPage(); return <main className="live-app-shell admin-live"><aside className="live-sidebar"><Link href="/" className="live-brand" aria-label="Urus FIDC — início"><BrandLogo className="brand-logo--sidebar" priority /></Link><p>ADMINISTRAÇÃO</p><nav><Link href="/admin">Profissionais</Link><Link href="/admin/operacoes">Fila operacional</Link><Link href="/admin/fidcs">FIDCs e critérios</Link><Link href="/admin/checklists">Checklists</Link><Link href="/admin/relatorios">Relatórios</Link><Link href="/admin/planos">Planos e cupons</Link><Link href="/admin/integracoes">Integrações</Link><Link href="/demo">Demonstração completa</Link></nav><div><small>{context.user.email}</small><SignOutButton /></div></aside><section className="live-workspace"><header><span><i/> ADMIN URUS · MFA CONFIRMADO</span><Link href="/seguranca">Segurança</Link></header>{children}</section></main>; }
