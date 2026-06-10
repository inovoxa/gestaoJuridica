import Link from "next/link";
import { prisma } from "@legaltech/db";
import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { deleteHearing } from "./actions";
import { formatDateTime, HEARING_LABEL, HEARING_BADGE } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AudienciasPage() {
  await requireSession();
  const audiencias = await prisma.hearing.findMany({
    orderBy: { hearingDate: "asc" },
    include: { case: { include: { client: true } }, lawyer: true },
  });

  return (
    <div>
      <PageHeader title="Audiências" subtitle={`${audiencias.length} audiência(s)`} action={{ href: "/audiencias/nova", label: "Nova audiência" }} />

      {audiencias.length === 0 ? (
        <EmptyState message="Nenhuma audiência agendada." action={{ href: "/audiencias/nova", label: "Agendar audiência" }} />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Audiência</th>
                <th className="px-5 py-3 font-medium">Processo</th>
                <th className="px-5 py-3 font-medium tabular-nums">Data</th>
                <th className="px-5 py-3 font-medium">Situação</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {audiencias.map((h) => (
                <tr key={h.id} className="border-b border-border/60 last:border-0 hover:bg-surface-2/40">
                  <td className="px-5 py-3 font-medium text-foreground">{h.name}</td>
                  <td className="px-5 py-3 text-muted">
                    <Link href={`/processos/${h.caseId}`} className="hover:text-gold">
                      {h.case.caseNumber}
                    </Link>
                    <div className="text-xs">{h.case.client.name}</div>
                  </td>
                  <td className="px-5 py-3 tabular-nums text-muted">{formatDateTime(h.hearingDate)}</td>
                  <td className="px-5 py-3">
                    <span className={`badge ${HEARING_BADGE[h.stage]}`}>{HEARING_LABEL[h.stage]}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <DeleteButton action={deleteHearing.bind(null, h.id)} iconOnly />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
