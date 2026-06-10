import { prisma } from "@legaltech/db";
import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { Select, Field, FormActions } from "@/components/ui/form";
import { createInvoice, setInvoiceStatus, deleteInvoice } from "./actions";
import { formatMoney, formatDate } from "@/lib/format";
import { Check } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Rascunho", SENT: "Enviada", PAID: "Paga", PARTIAL: "Parcial", CANCELLED: "Cancelada",
};
const STATUS_BADGE: Record<string, string> = {
  DRAFT: "badge-muted", SENT: "badge-info", PAID: "badge-success", PARTIAL: "badge-warning", CANCELLED: "badge-muted",
};

export default async function FinanceiroPage() {
  await requireSession();
  const [invoices, cases] = await Promise.all([
    prisma.invoice.findMany({ orderBy: { issuedAt: "desc" }, include: { case: { include: { client: true } } } }),
    prisma.case.findMany({ orderBy: { registrationDate: "desc" }, include: { client: true } }),
  ]);

  const totalPago = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + Number(i.amount), 0);
  const totalAberto = invoices.filter((i) => ["SENT", "PARTIAL", "DRAFT"].includes(i.status)).reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Financeiro" subtitle="Honorários e faturas" />

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="font-serif text-2xl font-semibold text-success">{formatMoney(totalPago)}</div>
          <div className="text-sm text-muted">Recebido</div>
        </div>
        <div className="card p-5">
          <div className="font-serif text-2xl font-semibold text-warning">{formatMoney(totalAberto)}</div>
          <div className="text-sm text-muted">Em aberto</div>
        </div>
      </div>

      <form action={createInvoice} className="card space-y-4 p-5">
        <h2 className="font-serif text-base font-semibold text-foreground">Nova fatura</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Número" name="number" required placeholder="HON/0001" />
          <Field label="Valor (R$)" name="amount" required placeholder="1500,00" />
          <Select
            label="Processo (opcional)"
            name="caseId"
            options={cases.map((c) => ({ value: c.id, label: `${c.caseNumber} — ${c.client.name}` }))}
          />
          <Field label="Vencimento" name="dueDate" type="date" />
          <Select
            label="Situação"
            name="status"
            defaultValue="DRAFT"
            options={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))}
          />
        </div>
        <FormActions cancelHref="/financeiro" submitLabel="Lançar" />
      </form>

      {invoices.length === 0 ? (
        <EmptyState message="Nenhuma fatura lançada." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Número</th>
                <th className="px-5 py-3 font-medium">Processo</th>
                <th className="px-5 py-3 font-medium tabular-nums">Valor</th>
                <th className="px-5 py-3 font-medium tabular-nums">Vencimento</th>
                <th className="px-5 py-3 font-medium">Situação</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {invoices.map((i) => (
                <tr key={i.id} className="border-b border-border/60 last:border-0 hover:bg-surface-2/40">
                  <td className="px-5 py-3 font-medium text-foreground">{i.number}</td>
                  <td className="px-5 py-3 text-muted">{i.case ? `${i.case.caseNumber} — ${i.case.client.name}` : "—"}</td>
                  <td className="px-5 py-3 tabular-nums text-foreground">{formatMoney(Number(i.amount))}</td>
                  <td className="px-5 py-3 tabular-nums text-muted">{formatDate(i.dueDate)}</td>
                  <td className="px-5 py-3">
                    <span className={`badge ${STATUS_BADGE[i.status]}`}>{STATUS_LABEL[i.status]}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {i.status !== "PAID" && (
                        <form action={setInvoiceStatus.bind(null, i.id, "PAID")}>
                          <button className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-success/40 hover:text-success">
                            <Check className="h-3.5 w-3.5" strokeWidth={2} /> Pagar
                          </button>
                        </form>
                      )}
                      <DeleteButton action={deleteInvoice.bind(null, i.id)} iconOnly />
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
