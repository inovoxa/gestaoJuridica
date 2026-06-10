import { prisma } from "@legaltech/db";
import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DocumentosPage() {
  await requireSession();
  const docs = await prisma.document.findMany({
    where: { state: { not: "DELETED" } },
    orderBy: { createdAt: "desc" },
    include: { case: true, client: true },
  });

  return (
    <div>
      <PageHeader title="Documentos" subtitle="Documentos do escritório e dos processos" />
      {docs.length === 0 ? (
        <EmptyState message="Nenhum documento. O upload com storage (local/S3) chega na próxima etapa da Fase 1." />
      ) : (
        <div className="card divide-y divide-border/60">
          {docs.map((d) => (
            <div key={d.id} className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-info/10 p-2 text-info">
                <FileText className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{d.name}</div>
                <div className="text-xs text-muted">
                  {d.documentType ?? "Documento"}
                  {d.case ? ` · ${d.case.caseNumber}` : d.client ? ` · ${d.client.name}` : ""}
                </div>
              </div>
              <div className="text-xs tabular-nums text-muted">{formatDate(d.createdAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
