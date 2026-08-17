import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { UpdatePasswordForm } from "@/components/auth/password-recovery-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function UpdatePasswordPage() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/esqueci-senha?erro=link-invalido");
  return <main className="live-auth-shell"><section className="live-auth-brand recovery-brand"><Link href="/" className="landing-brand" aria-label="Urus FIDC — início"><BrandLogo className="brand-logo--auth" priority /></Link><div><p className="landing-kicker"><span /> NOVA CREDENCIAL</p><h1>Uma nova senha.<br/><em>O mesmo espaço privado.</em></h1><p>Crie uma senha exclusiva para proteger suas operações, documentos e informações financeiras.</p></div><footer>Acesso individual · Encerramento global de sessões</footer></section><section className="live-auth-panel"><div><p className="eyebrow">REDEFINIR SENHA</p><h2>Crie sua nova senha</h2><p>Após a alteração, você entrará novamente com a nova credencial.</p><UpdatePasswordForm /></div></section></main>;
}
