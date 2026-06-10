import { prisma } from "@legaltech/db";
import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { DocumentUpload } from "@/components/document-upload";
import { requestDeletion, cancelDeletion } from "./actions";
import { formatDate } from "@/lib/format";
import { FileText, Download, Trash2, RotateCcw } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DocumentosPage() {
  await requireSession();

  const [docs, cases, clients] = await Promise.all([
    prisma.document.findMany({
      where: { state: { not: "DELETED" } },
      orderBy: { createdAt: "desc" },
      include: { case: true, client: true },
    }),
    prisma.case.findMany({ orderBy: { registrationDate: "desc" }, include: { client: true } }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Documentos" subtitle="Documentos do escritório e dos processos" />

      <DocumentUpload
        cases={cases.map((c) => ({ id: c.id, label: `${c.caseNumber} — ${c.client.name}` }))}
        clients={clients.map((c) => ({ id: c.id, label: c.name }))}
      />

      {docs.length === 0 ? (
        <EmptyState message="Nenhum documento enviado ainda." />
      ) : (
        <div className="card divide-y divide-border/60">
          {docs.map((d) => {
            const pending = d.state === "PENDING_DELETION";
            return (
              <div key={d.id} className="flex items-center gap-4 p-4">
                <div className="rounded-lg bg-info/10 p-2 text-info">
                  <FileText className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    {d.name}
                    {pending && <span className="badge badge-warning">Exclusão agendada</span>}
                  </div>
                  <div className="text-xs text-muted">
                    {d.documentType ?? "Documento"}
                    {d.case ? ` · ${d.case.caseNumber}` : d.client ? ` · ${d.client.name}` : ""}
                    {" · "}
                    {formatDate(d.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/documents/${d.id}/download`}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-gold/40 hover:text-foreground"
                  >
                    <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Baixar
                  </a>
                  {pending ? (
                    <form action={cancelDeletion.bind(null, d.id)}>
                      <button className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-success/40 hover:text-success">
                        <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
                        Restaurar
                      </button>
                    </form>
                  ) : (
                    <form action={requestDeletion.bind(null, d.id)}>
                      <button className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-danger/40 hover:text-danger">
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                        Excluir
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
