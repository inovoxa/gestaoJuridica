import { Field, TextArea, FormActions } from "@/components/ui/form";

export interface ClientFormData {
  name: string;
  cpfCnpj?: string | null;
  email?: string | null;
  phone?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  notes?: string | null;
}

export function ClientForm({
  action,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  initial?: ClientFormData;
  submitLabel?: string;
}) {
  return (
    <form action={action} className="card max-w-2xl space-y-5 p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nome / Razão social" name="name" required defaultValue={initial?.name} />
        <Field label="CPF / CNPJ" name="cpfCnpj" defaultValue={initial?.cpfCnpj ?? ""} />
        <Field label="E-mail" name="email" type="email" defaultValue={initial?.email ?? ""} />
        <Field label="Telefone / WhatsApp" name="phone" type="tel" defaultValue={initial?.phone ?? ""} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Endereço" name="street" defaultValue={initial?.street ?? ""} />
        <Field label="Cidade" name="city" defaultValue={initial?.city ?? ""} />
        <Field label="UF" name="state" defaultValue={initial?.state ?? ""} />
        <Field label="CEP" name="zip" defaultValue={initial?.zip ?? ""} />
      </div>

      <TextArea label="Observações" name="notes" defaultValue={initial?.notes ?? ""} />

      <FormActions cancelHref="/clientes" submitLabel={submitLabel} />
    </form>
  );
}
