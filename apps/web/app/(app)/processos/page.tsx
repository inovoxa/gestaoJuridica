import Link from "next/link";
import { prisma } from "@legaltech/db";
import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { STAGE_LABEL, STAGE_BADGE } from "@/lib/format";
import { Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProcessosPage() {
  await requireSession();
  const processos = await prisma.case.findMany({
    orderBy: { registrationDate: "desc" },
    include: { client: true, responsibleLawyer: true, caseType: true },
  });

  return (
    <div>
      <PageHeader
        title="Processos"
        subtitle={`${processos.length} processo(s)`}
        action={{ href: "/processos/novo", label: "Novo processo" }}
      />

      {processos.length === 0 ? (
        <EmptyState message="Nenhum processo cadastrado." action={{ href: "/processos/novo", label: "Cadastrar processo" }} />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Número</th>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 font-medium">Advogado</th>
                <th className="px-5 py-3 font-medium">Situação</th>
              </tr>
            </thead>
            <tbody>
              {processos.map((p) => (
                <tr key={p.id} className="border-b border-border/60 last:border-0 hover:bg-surface-2/40">
                  <td className="px-5 py-3">
                    <Link href={`/processos/${p.id}`} className="flex items-center gap-1.5 font-medium text-foreground hover:text-gold">
                      {p.confidential && <Lock className="h-3.5 w-3.5 text-gold" strokeWidth={2} />}
                      {p.caseNumber}
                    </Link>
                    {p.cnjNumber && <div className="text-xs text-muted">{p.cnjNumber}</div>}
                  </td>
                  <td className="px-5 py-3 text-muted">{p.client.name}</td>
                  <td className="px-5 py-3 text-muted">{p.caseType?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-muted">{p.responsibleLawyer?.name ?? "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`badge ${STAGE_BADGE[p.stage]}`}>{STAGE_LABEL[p.stage]}</span>
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
