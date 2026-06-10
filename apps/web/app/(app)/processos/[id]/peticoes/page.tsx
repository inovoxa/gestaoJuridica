import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@legaltech/db";
import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { Select, Field, TextArea, FormActions } from "@/components/ui/form";
import { createPetition, grantAiConsent } from "./actions";
import { formatDate } from "@/lib/format";
import { ArrowLeft, ShieldCheck, ShieldAlert, FileSignature } from "lucide-react";

export const dynamic = "force-dynamic";

const PETITION_TYPES = [
  "Petição inicial", "Contestação", "Réplica", "Recurso de apelação", "Agravo de instrumento",
  "Embargos de declaração", "Mandado de segurança", "Habeas corpus", "Tutela de urgência",
  "Cumprimento de sentença", "Manifestação", "Alegações finais", "Memoriais",
];

const STATE_BADGE: Record<string, string> = {
  DRAFT: "badge-muted", GENERATING: "badge-warning", GENERATED: "badge-info", REVISED: "badge-info", FINALIZED: "badge-success",
};
const STATE_LABEL: Record<string, string> = {
  DRAFT: "Rascunho", GENERATING: "Gerando", GENERATED: "Gerada", REVISED: "Revisada", FINALIZED: "Finalizada",
};

export default async function PeticoesPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const c = await prisma.case.findUnique({
    where: { id },
    include: { client: true, petitions: { orderBy: { createdAt: "desc" } } },
  });
  if (!c) notFound();

  const consent = await prisma.consentRecord.findFirst({
    where: { clientId: c.clientId, purpose: "uso_ia", granted: true, revokedAt: null },
  });

  return (
    <div className="space-y-6">
      <Link href={`/processos/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar ao processo
      </Link>
      <PageHeader title="Petições inteligentes" subtitle={`${c.caseNumber} — ${c.client.name}`} />

      {/* Consentimento LGPD/OAB */}
      {consent ? (
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-4 py-2 text-sm text-success ring-1 ring-inset ring-success/30">
          <ShieldCheck className="h-4 w-4" /> Consentimento do cliente para uso de IA registrado.
        </div>
      ) : (
        <div className="card flex flex-col gap-3 border-warning/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-sm text-warning">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Necessário o consentimento escrito do cliente para usar IA sobre seus dados (Recomendação OAB 001/2024).
            </span>
          </div>
          <form action={grantAiConsent.bind(null, id)}>
            <button className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-gold/40 hover:text-foreground">
              Registrar consentimento
            </button>
          </form>
        </div>
      )}

      {/* Nova petição */}
      <form action={createPetition.bind(null, id)} className="card space-y-4 p-5">
        <h2 className="flex items-center gap-2 font-serif text-base font-semibold text-foreground">
          <FileSignature className="h-4 w-4 text-gold" /> Nova petição
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Título" name="name" required placeholder="Ex.: Contestação - Maria Oliveira" />
          <Select label="Tipo de peça" name="petitionType" required options={PETITION_TYPES.map((t) => ({ value: t, label: t }))} />
        </div>
        <TextArea label="Instruções adicionais (opcional)" name="userInstructions" rows={2} />
        <FormActions cancelHref={`/processos/${id}`} submitLabel="Criar" />
      </form>

      {/* Lista */}
      {c.petitions.length > 0 && (
        <div className="card divide-y divide-border/60">
          {c.petitions.map((p) => (
            <Link key={p.id} href={`/processos/${id}/peticoes/${p.id}`} className="flex items-center gap-4 p-4 hover:bg-surface-2/40">
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{p.name}</div>
                <div className="text-xs text-muted">{p.petitionType} · {formatDate(p.createdAt)}</div>
              </div>
              <span className={`badge ${STATE_BADGE[p.state]}`}>{STATE_LABEL[p.state]}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
