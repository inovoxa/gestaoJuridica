import { prisma } from "@legaltech/db";
import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { Select, Field, TextArea, FormActions } from "@/components/ui/form";
import { createHearing } from "../actions";

export const dynamic = "force-dynamic";

export default async function NovaAudienciaPage() {
  await requireSession();
  const cases = await prisma.case.findMany({ orderBy: { registrationDate: "desc" }, include: { client: true } });

  return (
    <div>
      <PageHeader title="Nova audiência" subtitle="Cria também um evento na agenda" />
      <form action={createHearing} className="card max-w-2xl space-y-5 p-6">
        <Select
          label="Processo"
          name="caseId"
          required
          options={cases.map((c) => ({ value: c.id, label: `${c.caseNumber} — ${c.client.name}` }))}
        />
        <Field label="Título" name="name" required placeholder="Audiência de instrução" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Data e hora" name="hearingDate" type="datetime-local" required />
          <Field label="Duração (horas)" name="durationHours" type="number" defaultValue={1} />
        </div>
        <TextArea label="Notas" name="notes" />
        <FormActions cancelHref="/audiencias" submitLabel="Agendar" />
      </form>
    </div>
  );
}
