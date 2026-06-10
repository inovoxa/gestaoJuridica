import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@legaltech/db";
import { requireClient } from "@/lib/session";
import { EvidenceUpload } from "@/components/evidence-upload";
import {
  formatDate,
  formatDateTime,
  STAGE_LABEL,
  STAGE_BADGE,
  HEARING_LABEL,
  HEARING_BADGE,
  DEADLINE_LABEL,
  DEADLINE_STATUS_LABEL,
  DEADLINE_STATUS_BADGE,
} from "@/lib/format";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PortalCaseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { client } = await requireClient();
  const { id } = await params;

  // Escopo: só processos do próprio cliente.
  const c = await prisma.case.findFirst({
    where: { id, clientId: client.id },
    include: {
      caseType: true,
      responsibleLawyer: true,
      court: true,
      hearings: { orderBy: { hearingDate: "asc" } },
      deadlines: { orderBy: { deadlineDate: "asc" } },
      evidences: { orderBy: { submissionDate: "desc" } },
    },
  });
  if (!c) notFound();

  return (
    <div className="space-y-6">
      <Link href="/portal" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">{c.caseNumber}</h1>
          <p className="text-sm text-muted">{c.caseType?.name ?? "Processo"}</p>
        </div>
        <span className={`badge ${STAGE_BADGE[c.stage]}`}>{STAGE_LABEL[c.stage]}</span>
      </div>

      <div className="card grid gap-4 p-5 sm:grid-cols-2">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted">Advogado</div>
          <div className="text-sm text-foreground">{c.responsibleLawyer?.name ?? "—"}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted">Tribunal</div>
          <div className="text-sm text-foreground">{c.court?.name ?? "—"}</div>
        </div>
      </div>

      {/* Audiências */}
      {c.hearings.length > 0 && (
        <div className="card p-5">
          <h2 className="mb-3 font-serif text-base font-semibold text-foreground">Audiências</h2>
          <ul className="space-y-2">
            {c.hearings.map((h) => (
              <li key={h.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{h.name} · {formatDateTime(h.hearingDate)}</span>
                <span className={`badge ${HEARING_BADGE[h.stage]}`}>{HEARING_LABEL[h.stage]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Prazos (informativo) */}
      {c.deadlines.length > 0 && (
        <div className="card p-5">
          <h2 className="mb-3 font-serif text-base font-semibold text-foreground">Andamentos e prazos</h2>
          <ul className="space-y-2">
            {c.deadlines.map((d) => (
              <li key={d.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{DEADLINE_LABEL[d.deadlineType]} · {formatDate(d.deadlineDate)}</span>
                <span className={`badge ${DEADLINE_STATUS_BADGE[d.status]}`}>{DEADLINE_STATUS_LABEL[d.status]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Provas enviadas */}
      {c.evidences.length > 0 && (
        <div className="card p-5">
          <h2 className="mb-3 font-serif text-base font-semibold text-foreground">Documentos enviados</h2>
          <ul className="space-y-2 text-sm">
            {c.evidences.map((e) => (
              <li key={e.id} className="flex items-center justify-between">
                <span className="text-foreground">{e.name}</span>
                <span className="text-xs text-muted">{formatDate(e.submissionDate)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <EvidenceUpload caseId={c.id} />
    </div>
  );
}
