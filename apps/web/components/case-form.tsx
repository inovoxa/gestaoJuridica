import { Field, Select, FormActions } from "@/components/ui/form";

interface Option {
  id: string;
  name: string;
}

export function CaseForm({
  action,
  clients,
  lawyers,
  courts,
  judges,
  caseTypes,
}: {
  action: (formData: FormData) => void;
  clients: Option[];
  lawyers: Option[];
  courts: Option[];
  judges: Option[];
  caseTypes: Option[];
}) {
  const opts = (arr: Option[]) => arr.map((o) => ({ value: o.id, label: o.name }));

  return (
    <form action={action} className="card max-w-2xl space-y-5 p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Select label="Cliente" name="clientId" required options={opts(clients)} />
        <Select label="Advogado responsável" name="responsibleLawyerId" options={opts(lawyers)} />
        <Select label="Tipo de processo" name="caseTypeId" options={opts(caseTypes)} />
        <Field
          label="Número CNJ"
          name="cnjNumber"
          placeholder="0000000-00.0000.0.00.0000"
          helper="Opcional. Validamos o dígito verificador."
        />
        <Select label="Tribunal" name="courtId" options={opts(courts)} />
        <Select label="Juiz(a)" name="judgeId" options={opts(judges)} />
        <Field label="Parte contrária" name="oppositeParty" />
      </div>

      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" name="confidential" className="h-4 w-4 rounded border-border bg-bg accent-gold" />
        Processo em segredo de justiça (acesso restrito)
      </label>

      <FormActions cancelHref="/processos" submitLabel="Criar processo" />
    </form>
  );
}
