import { prisma } from "@legaltech/db";
import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { Select, Field, TextArea, FormActions } from "@/components/ui/form";
import { createDeadline } from "../actions";

export const dynamic = "force-dynamic";

const TYPES = [
  { value: "INTIMACAO", label: "Intimação (15 dias úteis)" },
  { value: "CITACAO", label: "Citação (15 dias úteis)" },
  { value: "SENTENCA", label: "Sentença / recurso (15 dias úteis)" },
  { value: "DESPACHO", label: "Despacho (5 dias úteis)" },
  { value: "PUBLICACAO", label: "Publicação (15 dias úteis)" },
  { value: "OUTRO", label: "Outro" },
];

export default async function NovoPrazoPage() {
  await requireSession();
  const cases = await prisma.case.findMany({
    orderBy: { registrationDate: "desc" },
    include: { client: true },
  });

  return (
    <div>
      <PageHeader title="Novo prazo" subtitle="O vencimento é calculado em dias úteis (CPC), considerando feriados nacionais." />
      <form action={createDeadline} className="card max-w-2xl space-y-5 p-6">
        <Select
          label="Processo"
          name="caseId"
          required
          options={cases.map((c) => ({ value: c.id, label: `${c.caseNumber} — ${c.client.name}` }))}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Select label="Tipo de prazo" name="deadlineType" required options={TYPES} />
          <Field
            label="Dias úteis (opcional)"
            name="days"
            type="number"
            helper="Deixe vazio para usar o padrão do tipo."
          />
          <Field label="Data de origem (intimação/publicação)" name="originDate" type="date" required />
          <Field
            label="Vencimento (opcional)"
            name="deadlineDate"
            type="date"
            helper="Se vazio, calculamos automaticamente."
          />
        </div>
        <TextArea label="Descrição" name="description" />
        <FormActions cancelHref="/prazos" submitLabel="Cadastrar prazo" />
      </form>
    </div>
  );
}
