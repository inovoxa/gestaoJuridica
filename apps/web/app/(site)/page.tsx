import { prisma } from "@legaltech/db";
import { ContactForm } from "@/components/site/contact-form";
import { getFirm } from "@/lib/session";
import { Scale, Briefcase, Building2, Landmark, ShieldCheck, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

// Mapa de ícones lucide para as áreas de atuação.
const ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  Scale,
  Briefcase,
  Building2,
  Landmark,
};

export default async function HomePage() {
  const [firm, areas, lawyers] = await Promise.all([
    getFirm(),
    prisma.practiceArea.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
    prisma.lawyer.findMany({ where: { active: true, publicProfile: true }, orderBy: { order: "asc" } }),
  ]);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.10]"
          style={{ backgroundImage: "radial-gradient(circle at 75% 15%, rgb(var(--gold)) 0, transparent 45%)" }}
        />
        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium text-gold">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
              {firm?.oab ?? "Advocacia"}
            </span>
            <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight text-foreground md:text-5xl">
              {firm?.heroTitle ?? "Defesa jurídica de alto nível"}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">{firm?.heroSubtitle ?? firm?.tagline}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#contato"
                className="flex items-center gap-2 rounded-lg bg-gold px-5 py-3 text-sm font-semibold transition-transform hover:brightness-110 active:scale-[0.99]"
                style={{ color: "rgb(var(--bg))" }}
              >
                Agende uma consulta <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#areas"
                className="rounded-lg border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-gold/40"
              >
                Áreas de atuação
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Áreas de atuação */}
      <section id="areas" className="border-t border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 text-center">
            <h2 className="font-serif text-3xl font-semibold text-foreground">Áreas de atuação</h2>
            <p className="mt-2 text-muted">Assessoria completa nas principais frentes do Direito.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {areas.map((a) => {
              const Icon = (a.icon && ICONS[a.icon]) || Scale;
              return (
                <div
                  key={a.id}
                  className="card group p-6 transition-colors duration-200 hover:border-gold/40"
                >
                  <div className="mb-4 inline-flex rounded-lg bg-gold/10 p-3 text-gold">
                    <Icon className="h-6 w-6" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-foreground">{a.name}</h3>
                  <p className="mt-2 text-sm text-muted">{a.summary}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sobre */}
      <section id="sobre" className="border-t border-border">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2">
          <div>
            <h2 className="font-serif text-3xl font-semibold text-foreground">
              {firm?.aboutTitle ?? "Sobre o escritório"}
            </h2>
            <p className="mt-4 leading-relaxed text-muted">{firm?.aboutBody}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { k: "+20", v: "anos de experiência" },
              { k: "100%", v: "atendimento personalizado" },
              { k: "4", v: "áreas de atuação" },
              { k: "LGPD", v: "dados protegidos" },
            ].map((s) => (
              <div key={s.v} className="card p-6 text-center">
                <div className="font-serif text-3xl font-semibold text-gold">{s.k}</div>
                <div className="mt-1 text-sm text-muted">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipe */}
      {lawyers.length > 0 && (
        <section id="equipe" className="border-t border-border bg-surface/40">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="mb-12 text-center">
              <h2 className="font-serif text-3xl font-semibold text-foreground">Nossa equipe</h2>
              <p className="mt-2 text-muted">Profissionais dedicados à sua causa.</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {lawyers.map((l) => (
                <div key={l.id} className="card p-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 font-serif text-xl font-semibold text-gold">
                    {l.name.charAt(0)}
                  </div>
                  <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">{l.name}</h3>
                  {l.title && <p className="text-sm text-gold">{l.title}</p>}
                  {l.bio && <p className="mt-2 text-sm text-muted">{l.bio}</p>}
                  {l.oab && (
                    <p className="mt-3 text-xs text-muted">
                      OAB/{l.oabUf} {l.oab}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contato */}
      <section className="border-t border-border">
        <div className="mx-auto grid max-w-6xl items-start gap-12 px-6 py-20 md:grid-cols-2">
          <div>
            <h2 className="font-serif text-3xl font-semibold text-foreground">Fale com o escritório</h2>
            <p className="mt-3 text-muted">
              Envie sua mensagem e nossa equipe entrará em contato para entender o seu caso.
            </p>
          </div>
          <ContactForm areas={areas.map((a) => ({ slug: a.slug, name: a.name }))} />
        </div>
      </section>
    </main>
  );
}
