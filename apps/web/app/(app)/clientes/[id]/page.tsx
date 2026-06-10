import { notFound } from "next/navigation";
import { prisma } from "@legaltech/db";
import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { ClientForm } from "@/components/client-form";
import { updateClient } from "../actions";

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const cliente = await prisma.client.findUnique({ where: { id } });
  if (!cliente) notFound();

  const action = updateClient.bind(null, id);

  return (
    <div>
      <PageHeader title="Editar cliente" subtitle={cliente.name} />
      <ClientForm action={action} initial={cliente} submitLabel="Salvar alterações" />
    </div>
  );
}
