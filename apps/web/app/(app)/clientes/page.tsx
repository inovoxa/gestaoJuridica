import Link from "next/link";
import { prisma } from "@legaltech/db";
import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { deleteClient } from "./actions";
import { formatCpfCnpj, formatPhone } from "@/lib/format";
import { Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  await requireSession();
  const clientes = await prisma.client.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { cases: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle={`${clientes.length} cadastrado(s)`}
        action={{ href: "/clientes/novo", label: "Novo cliente" }}
      />

      {clientes.length === 0 ? (
        <EmptyState message="Nenhum cliente cadastrado ainda." action={{ href: "/clientes/novo", label: "Cadastrar cliente" }} />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Nome</th>
                <th className="px-5 py-3 font-medium">CPF/CNPJ</th>
                <th className="px-5 py-3 font-medium">Telefone</th>
                <th className="px-5 py-3 font-medium tabular-nums">Processos</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-surface-2/40">
                  <td className="px-5 py-3 font-medium text-foreground">{c.name}</td>
                  <td className="px-5 py-3 text-muted">{formatCpfCnpj(c.cpfCnpj)}</td>
                  <td className="px-5 py-3 text-muted">{formatPhone(c.phone)}</td>
                  <td className="px-5 py-3 tabular-nums text-muted">{c._count.cases}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/clientes/${c.id}`}
                        className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-gold/40 hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                        Editar
                      </Link>
                      <DeleteButton action={deleteClient.bind(null, c.id)} iconOnly />
                    </div>
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
