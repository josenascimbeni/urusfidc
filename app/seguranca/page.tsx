import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { MfaPanel } from "@/components/auth/mfa-panel";

export const dynamic = "force-dynamic";
import { requireAccountContext } from "@/lib/auth/context";

export default async function SecurityPage() { const context = await requireAccountContext(); return <main className="standalone-security"><Link href={context.role === "admin" ? "/admin" : "/portal"}>← Voltar</Link><div><BrandLogo className="brand-logo--security" priority /><h1>Proteja seu acesso</h1><section className="security-password-card"><div><p className="eyebrow">SENHA DE ACESSO</p><h2>Senha configurada</h2><p>Sua senha já está definida. Agora prossiga com o aplicativo autenticador; use esta opção somente quando desejar trocar a senha.</p></div><Link className="live-gold-button" href="/redefinir-senha">Alterar senha</Link></section><MfaPanel /></div></main>; }
