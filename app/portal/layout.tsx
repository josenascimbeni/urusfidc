import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { requireAccountContext } from "@/lib/auth/context";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const context = await requireAccountContext();
  if (context.role === "admin") redirect("/admin");
  return <main className="live-app-shell"><aside className="live-sidebar"><Link href="/" className="live-brand" aria-label="Urus FIDC — início"><BrandLogo className="brand-logo--sidebar" priority /></Link><p>ÁREA DO PROFISSIONAL</p><nav><Link href="/portal">Visão geral</Link><Link href="/portal/nova-operacao">Nova operação</Link><Link href="/portal/seguranca">Segurança</Link></nav><div><small>{context.user.email}</small><SignOutButton /></div></aside><section className="live-workspace"><header><span><i/> AMBIENTE REAL · DADOS ISOLADOS</span><Link href="/demo">Abrir demonstração</Link></header>{children}</section></main>;
}
