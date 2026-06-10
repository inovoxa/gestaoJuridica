import Link from "next/link";
import { prisma } from "@legaltech/db";
import { requireClient } from "@/lib/session";
import { EmptyState } from "@/components/ui/empty-state";
import { STAGE_LABEL, STAGE_BADGE } from "@/lib/format";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PortalHome() {
  const { client } = await requireClient();
  const cases = await prisma.case.findMany({
    where: { clientId: client.id },
    orderBy: { registrationDate: "desc" },
    include: { caseType: true, responsibleLawyer: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Olá, {client.name.split(" ")[0]}</h1>
        <p className="text-sm text-muted">Acompanhe seus processos</p>
      </div>

      {cases.length === 0 ? (
        <EmptyState message="Você ainda não possui processos cadastrados." />
      ) : (
        <div className="space-y-3">
          {cases.map((c) => (
            <Link key={c.id} href={`/portal/processos/${c.id}`} className="card flex items-center gap-4 p-5 transition-colors hover:border-gold/40">
              <div className="flex-1">
                <div className="font-medium text-foreground">{c.caseNumber}</div>
                <div className="text-sm text-muted">
                  {c.caseType?.name ?? "Processo"}
                  {c.responsibleLawyer ? ` · Adv. ${c.responsibleLawyer.name}` : ""}
                </div>
              </div>
              <span className={`badge ${STAGE_BADGE[c.stage]}`}>{STAGE_LABEL[c.stage]}</span>
              <ChevronRight className="h-4 w-4 text-muted" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
