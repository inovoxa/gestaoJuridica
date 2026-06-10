import { prisma } from "@legaltech/db";
import { requireSession } from "@/lib/tenant";

function KpiCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="text-3xl font-bold" style={{ color }}>
        {value}
      </div>
      <div className="mt-1 text-sm text-gray-500">{label}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const { accountId, name } = await requireSession();

  // Todas as contagens escopadas pelo escritório (multi-tenant / sigilo).
  const [clientes, processos, advogados, audiencias, prazosVencendo] = await Promise.all([
    prisma.client.count({ where: { accountId } }),
    prisma.case.count({ where: { accountId } }),
    prisma.lawyer.count({ where: { accountId, active: true } }),
    prisma.hearing.count({ where: { accountId, stage: "SCHEDULED" } }),
    prisma.deadline.findMany({
      where: { accountId, status: { in: ["PENDING", "ALERTED"] } },
      orderBy: { deadlineDate: "asc" },
      take: 5,
      include: { case: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Olá, {name.split(" ")[0]} 👋</h1>
        <p className="text-sm text-gray-500">Visão geral do escritório</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Clientes" value={clientes} color="#4CAF50" />
        <KpiCard label="Processos" value={processos} color="#0B3C5D" />
        <KpiCard label="Advogados ativos" value={advogados} color="#C9A227" />
        <KpiCard label="Audiências agendadas" value={audiencias} color="#CC0000" />
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Próximos prazos</h2>
        {prazosVencendo.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum prazo pendente.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-gray-400">
                <th className="py-2">Processo</th>
                <th>Tipo</th>
                <th>Vencimento</th>
              </tr>
            </thead>
            <tbody>
              {prazosVencendo.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-2 font-medium">{p.case.caseNumber}</td>
                  <td className="text-gray-600">{p.deadlineType}</td>
                  <td className="text-gray-600">{p.deadlineDate.toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
