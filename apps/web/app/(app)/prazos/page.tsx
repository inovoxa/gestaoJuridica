import { prisma } from "@legaltech/db";
import { br } from "@legaltech/core";
import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { completeDeadline, deleteDeadline } from "./actions";
import { formatDate, DEADLINE_LABEL, DEADLINE_STATUS_LABEL, DEADLINE_STATUS_BADGE } from "@/lib/format";
import { Check } from "lucide-react";

export const dynamic = "force-dynamic";

const RISK_TXT: Record<string, string> = {
  CRITICAL: "text-danger",
  HIGH: "text-warning",
  MEDIUM: "text-info",
  LOW: "text-muted",
};

export default async function PrazosPage() {
  await requireSession();
  const prazos = await prisma.deadline.findMany({
    orderBy: [{ status: "asc" }, { deadlineDate: "asc" }],
    include: { case: { include: { client: true } } },
  });

  return (
    <div>
      <PageHeader title="Prazos" subtitle={`${prazos.length} prazo(s)`} action={{ href: "/prazos/novo", label: "Novo prazo" }} />

      {prazos.length === 0 ? (
        <EmptyState message="Nenhum prazo cadastrado." action={{ href: "/prazos/novo", label: "Cadastrar prazo" }} />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Processo</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 font-medium tabular-nums">Vencimento</th>
                <th className="px-5 py-3 font-medium tabular-nums">Dias úteis</th>
                <th className="px-5 py-3 font-medium">Situação</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {prazos.map((d) => {
                const done = d.status === "COMPLETED";
                const remaining = br.businessDaysRemaining(d.deadlineDate);
                const risk = br.riskLevel(d.deadlineDate);
                return (
                  <tr key={d.id} className="border-b border-border/60 last:border-0 hover:bg-surface-2/40">
                    <td className="px-5 py-3">
                      <div className="font-medium text-foreground">{d.case.caseNumber}</div>
                      <div className="text-xs text-muted">{d.case.client.name}</div>
                    </td>
                    <td className="px-5 py-3 text-muted">{DEADLINE_LABEL[d.deadlineType]}</td>
                    <td className="px-5 py-3 tabular-nums text-muted">{formatDate(d.deadlineDate)}</td>
                    <td className={`px-5 py-3 tabular-nums font-medium ${done ? "text-muted" : RISK_TXT[risk]}`}>
                      {done ? "—" : remaining}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`badge ${DEADLINE_STATUS_BADGE[d.status]}`}>{DEADLINE_STATUS_LABEL[d.status]}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {!done && (
                          <form action={completeDeadline.bind(null, d.id)}>
                            <button className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-success/40 hover:text-success">
                              <Check className="h-3.5 w-3.5" strokeWidth={2} />
                              Cumprir
                            </button>
                          </form>
                        )}
                        <DeleteButton action={deleteDeadline.bind(null, d.id)} iconOnly />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
