import { prisma } from "@legaltech/db";
import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { CaseForm } from "@/components/case-form";
import { createCase } from "../actions";

export const dynamic = "force-dynamic";

export default async function NovoProcessoPage() {
  await requireSession();
  const [clients, lawyers, courts, judges, caseTypes] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.lawyer.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.court.findMany({ orderBy: { name: "asc" } }),
    prisma.judge.findMany({ orderBy: { name: "asc" } }),
    prisma.caseType.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Novo processo" subtitle="Cadastre um novo processo jurídico" />
      <CaseForm action={createCase} clients={clients} lawyers={lawyers} courts={courts} judges={judges} caseTypes={caseTypes} />
    </div>
  );
}
