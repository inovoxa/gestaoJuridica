import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { ClientForm } from "@/components/client-form";
import { createClient } from "../actions";

export default async function NovoClientePage() {
  await requireSession();
  return (
    <div>
      <PageHeader title="Novo cliente" subtitle="Cadastre um cliente do escritório" />
      <ClientForm action={createClient} submitLabel="Cadastrar" />
    </div>
  );
}
