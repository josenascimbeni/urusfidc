import Link from "next/link";
import { Suspense } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { RequestPasswordResetForm } from "@/components/auth/password-recovery-form";

export default function ForgotPasswordPage() {
  return <main className="live-auth-shell"><section className="live-auth-brand recovery-brand"><Link href="/" className="landing-brand" aria-label="Urus FIDC — início"><BrandLogo className="brand-logo--auth" priority /></Link><div><p className="landing-kicker"><span /> RECUPERAÇÃO SEGURA</p><h1>Retome o acesso.<br/><em>Sem perder o controle.</em></h1><p>Enviaremos um link temporário para o e-mail vinculado à sua conta profissional.</p></div><footer>Link temporário · Sessões encerradas após a troca</footer></section><section className="live-auth-panel"><div><p className="eyebrow">ESQUECI MINHA SENHA</p><h2>Recuperar acesso</h2><p>Informe seu e-mail profissional. Por segurança, a resposta será a mesma mesmo quando não houver uma conta cadastrada.</p><Suspense fallback={<p>Preparando recuperação…</p>}><RequestPasswordResetForm /></Suspense></div></section></main>;
}
