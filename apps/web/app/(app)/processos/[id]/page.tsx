import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@legaltech/db";
import { requireSession } from "@/lib/session";
import { StageControl } from "@/components/stage-control";
import { DatajudSync } from "@/components/datajud-sync";
import { DeleteButton } from "@/components/ui/delete-button";
import { changeStage, deleteCase } from "../actions";
import {
  formatDate,
  formatDateTime,
  HEARING_LABEL,
  HEARING_BADGE,
  DEADLINE_LABEL,
  DEADLINE_STATUS_LABEL,
  DEADLINE_STATUS_BADGE,
} from "@/lib/format";
import { Lock, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value || "—"}</dd>
    </div>
  );
}

export default async function ProcessoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const c = await prisma.case.findUnique({
    where: { id },
    include: {
      client: true,
      responsibleLawyer: true,
      caseType: true,
      court: true,
      judge: true,
      hearings: { orderBy: { hearingDate: "asc" } },
      deadlines: { orderBy: { deadlineDate: "asc" } },
      documents: { where: { state: { not: "DELETED" } } },
      datajudProcess: { include: { movements: { orderBy: { data: "desc" }, take: 15 } } },
    },
  });
  if (!c) notFound();

  return (
    <div className="space-y-6">
      <Link href="/processos" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar aos processos
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-2xl font-semibold text-foreground">
            {c.confidential && <Lock className="h-5 w-5 text-gold" strokeWidth={2} />}
            {c.caseNumber}
          </h1>
          {c.cnjNumber && <p className="text-sm text-muted">CNJ: {c.cnjNumber}</p>}
        </div>
        <DeleteButton action={deleteCase.bind(null, c.id)} label="Excluir processo" />
      </div>

      <div className="card p-5">
        <StageControl current={c.stage} onChange={changeStage.bind(null, c.id)} />
      </div>

      <div className="card p-6">
        <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Cliente" value={<Link href={`/clientes/${c.clientId}`} className="hover:text-gold">{c.client.name}</Link>} />
          <Info label="Advogado responsável" value={c.responsibleLawyer?.name} />
          <Info label="Tipo" value={c.caseType?.name} />
          <Info label="Tribunal" value={c.court?.name} />
          <Info label="Juiz(a)" value={c.judge?.name} />
          <Info label="Parte contrária" value={c.oppositeParty} />
          <Info label="Cadastrado em" value={formatDate(c.registrationDate)} />
        </dl>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Audiências */}
        <div className="card p-5">
          <h2 className="mb-3 font-serif text-base font-semibold text-foreground">Audiências</h2>
          {c.hearings.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma audiência.</p>
          ) : (
            <ul className="space-y-2">
              {c.hearings.map((h) => (
                <li key={h.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="text-foreground">{h.name}</div>
                    <div className="text-xs text-muted">{formatDateTime(h.hearingDate)}</div>
                  </div>
                  <span className={`badge ${HEARING_BADGE[h.stage]}`}>{HEARING_LABEL[h.stage]}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Prazos */}
        <div className="card p-5">
          <h2 className="mb-3 font-serif text-base font-semibold text-foreground">Prazos</h2>
          {c.deadlines.length === 0 ? (
            <p className="text-sm text-muted">Nenhum prazo.</p>
          ) : (
            <ul className="space-y-2">
              {c.deadlines.map((d) => (
                <li key={d.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="text-foreground">{DEADLINE_LABEL[d.deadlineType]}</div>
                    <div className="text-xs text-muted">vence {formatDate(d.deadlineDate)}</div>
                  </div>
                  <span className={`badge ${DEADLINE_STATUS_BADGE[d.status]}`}>{DEADLINE_STATUS_LABEL[d.status]}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-1 font-serif text-base font-semibold text-foreground">Documentos</h2>
        <p className="text-sm text-muted">{c.documents.length} documento(s) vinculado(s).</p>
      </div>

      {/* DataJud */}
      {c.cnjNumber && (
        <div className="card p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-base font-semibold text-foreground">Movimentações (DataJud)</h2>
            <DatajudSync caseId={c.id} />
          </div>
          {!c.datajudProcess || c.datajudProcess.movements.length === 0 ? (
            <p className="text-sm text-muted">
              Nenhuma movimentação sincronizada. Clique em “Sincronizar DataJud” para buscar no CNJ.
            </p>
          ) : (
            <ul className="space-y-2">
              {c.datajudProcess.movements.map((m) => (
                <li key={m.id} className="flex items-start gap-3 border-b border-border/60 pb-2 text-sm last:border-0">
                  <span className="mt-0.5 w-20 shrink-0 tabular-nums text-xs text-muted">{formatDate(m.data)}</span>
                  <span className="flex-1 text-foreground">{m.descricao}</span>
                  {m.deadlineExtracted && <span className="badge badge-warning shrink-0">prazo</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
