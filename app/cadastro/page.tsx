import Link from "next/link";
import { Suspense } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignUpPage() {
  return <main className="live-auth-shell"><section className="live-auth-brand"><Link href="/" className="landing-brand" aria-label="Urus FIDC — início"><BrandLogo className="brand-logo--auth" priority /></Link><div><p className="landing-kicker"><span /> URUS 100</p><h1>Uma conta.<br/><em>Cem oportunidades.</em></h1><p>R$ 99 por mês para qualificar até 100 novos casos por ciclo.</p></div><footer><span>Conta individual · Sem compartilhamento entre clientes</span><Link href="/termos-de-uso">Termos</Link><Link href="/aviso-de-privacidade">Privacidade</Link></footer></section><section className="live-auth-panel"><div><p className="eyebrow">NOVA CONTA</p><h2>Comece com seu espaço privado</h2><p>Após confirmar o e-mail, ative a assinatura para cadastrar operações.</p><Suspense fallback={<p>Preparando cadastro…</p>}><AuthForm mode="signup" /></Suspense></div></section></main>;
}
