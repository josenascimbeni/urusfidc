import type { ReactNode } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export type LegalSection = {
  id: string;
  title: string;
  content: ReactNode;
};

type LegalDocumentProps = {
  active: "terms" | "privacy";
  eyebrow: string;
  title: string;
  summary: string;
  sections: LegalSection[];
};

export function LegalDocument({ active, eyebrow, title, summary, sections }: LegalDocumentProps) {
  return (
    <main className="legal-shell">
      <a className="legal-skip-link" href="#documento">Ir para o documento</a>
      <header className="legal-topbar">
        <Link href="/" className="legal-brand" aria-label="Urus FIDC — página inicial">
          <BrandLogo className="brand-logo--legal" priority />
        </Link>
        <nav aria-label="Documentos legais">
          <Link href="/termos-de-uso" aria-current={active === "terms" ? "page" : undefined}>Termos de Uso</Link>
          <Link href="/aviso-de-privacidade" aria-current={active === "privacy" ? "page" : undefined}>Aviso de Privacidade</Link>
        </nav>
        <Link className="legal-back" href="/">Voltar à plataforma <span aria-hidden="true">↗</span></Link>
      </header>

      <section className="legal-hero" aria-labelledby="legal-title">
        <div className="legal-hero-copy">
          <p className="legal-eyebrow">{eyebrow}</p>
          <h1 id="legal-title">{title}</h1>
          <p>{summary}</p>
        </div>
        <aside className="legal-seal" aria-label="Informações do documento">
          <span>DOCUMENTO VIGENTE</span>
          <strong>2026<small>/08</small></strong>
          <dl>
            <div><dt>Versão</dt><dd>2026-08</dd></div>
            <div><dt>Vigência</dt><dd>17.08.2026</dd></div>
            <div><dt>Controlador</dt><dd>Urus Assessoria Empresarial Ltda.</dd></div>
          </dl>
        </aside>
      </section>

      <div className="legal-controller-strip">
        <span>35.028.407/0001-01</span>
        <p>Alameda Rio Negro, 503 · Sala 2020 · Barueri/SP</p>
        <a href="mailto:adm@uruscapital.com.br">adm@uruscapital.com.br</a>
      </div>

      <div className="legal-reading-layout">
        <aside className="legal-index">
          <p>Neste documento</p>
          <nav aria-label={`Índice de ${title}`}>
            {sections.map((section, index) => (
              <a key={section.id} href={`#${section.id}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>{section.title}
              </a>
            ))}
          </nav>
          <div>
            <strong>Dúvidas ou solicitações?</strong>
            <p>Fale com o Departamento Jurídico.</p>
            <a href="mailto:adm@uruscapital.com.br">Enviar e-mail</a>
          </div>
        </aside>

        <article className="legal-document" id="documento">
          {sections.map((section, index) => (
            <section id={section.id} key={section.id} aria-labelledby={`${section.id}-title`}>
              <header>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h2 id={`${section.id}-title`}>{section.title}</h2>
              </header>
              <div>{section.content}</div>
            </section>
          ))}
        </article>
      </div>

      <footer className="legal-footer">
        <div>
          <BrandLogo className="brand-logo--footer" />
          <p>Transparência para uma jornada de crédito responsável.</p>
        </div>
        <nav aria-label="Navegação legal do rodapé">
          <Link href="/termos-de-uso">Termos de Uso</Link>
          <Link href="/aviso-de-privacidade">Aviso de Privacidade</Link>
          <a href="mailto:adm@uruscapital.com.br">Departamento Jurídico</a>
        </nav>
        <p>© 2026 Urus FIDC</p>
      </footer>
    </main>
  );
}
