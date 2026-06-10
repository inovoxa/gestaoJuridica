import { prisma } from "@legaltech/db";
import { requireSession } from "@/lib/session";
import { br } from "@legaltech/core";
import { Users, Scale, UserCog, Landmark, AlertTriangle } from "lucide-react";

const RISK_BADGE: Record<string, string> = {
  CRITICAL: "badge-danger",
  HIGH: "badge-warning",
  MEDIUM: "badge-info",
  LOW: "badge-muted",
};
const RISK_LABEL: Record<string, string> = {
  CRITICAL: "Vencido/Crítico",
  HIGH: "Urgente",
  MEDIUM: "Atenção",
  LOW: "Tranquilo",
};

function Kpi({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  accent: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-serif text-3xl font-semibold text-foreground">{value}</div>
          <div className="mt-1 text-sm text-muted">{label}</div>
        </div>
        <div className={`rounded-lg p-2 ${accent}`}>
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const { name } = await requireSession();

  const [clientes, processos, advogados, audiencias, prazos] = await Promise.all([
    prisma.client.count(),
    prisma.case.count(),
    prisma.lawyer.count({ where: { active: true } }),
    prisma.hearing.count({ where: { stage: "SCHEDULED" } }),
    prisma.deadline.findMany({
      where: { status: { in: ["PENDING", "ALERTED"] } },
      orderBy: { deadlineDate: "asc" },
      take: 6,
      include: { case: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Olá, {name.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted">Visão geral do escritório</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Clientes" value={clientes} icon={Users} accent="bg-info/10 text-info" />
        <Kpi label="Processos" value={processos} icon={Scale} accent="bg-navy-light/10 text-navy-light" />
        <Kpi label="Advogados ativos" value={advogados} icon={UserCog} accent="bg-gold/10 text-gold" />
        <Kpi label="Audiências agendadas" value={audiencias} icon={Landmark} accent="bg-danger/10 text-danger" />
      </div>

      <div className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-gold" strokeWidth={1.75} />
          <h2 className="font-serif text-base font-semibold text-foreground">Próximos prazos</h2>
        </div>

        {prazos.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Nenhum prazo pendente.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="pb-2 font-medium">Processo</th>
                <th className="pb-2 font-medium">Tipo</th>
                <th className="pb-2 font-medium tabular-nums">Vencimento</th>
                <th className="pb-2 font-medium">Situação</th>
              </tr>
            </thead>
            <tbody>
              {prazos.map((p) => {
                const risk = br.riskLevel(p.deadlineDate);
                return (
                  <tr key={p.id} className="border-b border-border/60 last:border-0">
                    <td className="py-3 font-medium text-foreground">{p.case.caseNumber}</td>
                    <td className="py-3 text-muted">{p.deadlineType}</td>
                    <td className="py-3 tabular-nums text-muted">
                      {p.deadlineDate.toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-3">
                      <span className={`badge ${RISK_BADGE[risk]}`}>{RISK_LABEL[risk]}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
