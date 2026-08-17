import Link from "next/link";
import { Suspense } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignInPage() {
  return <main className="live-auth-shell"><section className="live-auth-brand"><Link href="/" className="landing-brand" aria-label="Urus FIDC — início"><BrandLogo className="brand-logo--auth" priority /></Link><div><p className="landing-kicker"><span /> AMBIENTE REAL</p><h1>Suas operações.<br/><em>Seu espaço privado.</em></h1><p>Cada conta possui assinatura, franquia e dados completamente independentes.</p></div><footer><span>Isolamento por conta · Trilha de auditoria · LGPD</span><Link href="/termos-de-uso">Termos</Link><Link href="/aviso-de-privacidade">Privacidade</Link></footer></section><section className="live-auth-panel"><div><p className="eyebrow">ACESSO SEGURO</p><h2>Entrar na plataforma</h2><p>Use sua conta profissional. Para conhecer o produto sem cadastro, acesse a <Link href="/demo">demonstração</Link>.</p><Suspense fallback={<p>Preparando acesso…</p>}><AuthForm mode="signin" /></Suspense></div></section></main>;
}
