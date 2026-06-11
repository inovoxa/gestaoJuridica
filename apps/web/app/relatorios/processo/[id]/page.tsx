import { notFound } from "next/navigation";
import { prisma } from "@legaltech/db";
import { requireSession, getFirm } from "@/lib/session";
import { PrintButton } from "@/components/print-button";
import { formatDate, formatDateTime, formatMoney, STAGE_LABEL, DEADLINE_LABEL } from "@/lib/format";

export const dynamic = "force-dynamic";

/** Relatório do processo em folha branca (impressão / salvar como PDF). */
export default async function RelatorioProcesso({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const [firm, c] = await Promise.all([
    getFirm(),
    prisma.case.findUnique({
      where: { id },
      include: {
        client: true,
        responsibleLawyer: true,
        court: true,
        judge: true,
        caseType: true,
        hearings: { orderBy: { hearingDate: "asc" } },
        deadlines: { orderBy: { deadlineDate: "asc" } },
        invoices: true,
      },
    }),
  ]);
  if (!c) notFound();

  const endereco = [
    [firm?.street, firm?.number].filter(Boolean).join(", "),
    firm?.city && firm?.state ? `${firm.city}/${firm.state}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="min-h-dvh bg-neutral-200 py-8 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex justify-end print:hidden">
          <PrintButton />
        </div>

        <div className="bg-white p-10 text-[13px] leading-relaxed text-neutral-900 shadow-lg print:shadow-none">
          {/* Cabeçalho */}
          <div className="border-b-2 border-neutral-800 pb-4">
            <h1 className="text-xl font-bold" style={{ color: "#0B3C5D" }}>
              {firm?.name ?? "Escritório de Advocacia"}
            </h1>
            {firm?.oab && <div className="text-xs text-neutral-600">{firm.oab}</div>}
            {endereco && <div className="text-xs text-neutral-600">{endereco}</div>}
            {firm?.phone && <div className="text-xs text-neutral-600">{firm.phone} · {firm?.email}</div>}
          </div>

          <h2 className="mt-6 text-lg font-semibold">Relatório do Processo {c.caseNumber}</h2>
          {c.cnjNumber && <div className="text-xs text-neutral-600">CNJ: {c.cnjNumber}</div>}

          {/* Dados */}
          <table className="mt-4 w-full border-collapse text-xs">
            <tbody>
              {[
                ["Cliente", c.client.name],
                ["Parte contrária", c.oppositeParty ?? "—"],
                ["Tipo", c.caseType?.name ?? "—"],
                ["Situação", STAGE_LABEL[c.stage]],
                ["Tribunal", c.court?.name ?? "—"],
                ["Juiz(a)", c.judge?.name ?? "—"],
                ["Advogado", c.responsibleLawyer?.name ?? "—"],
                ["Cadastro", formatDate(c.registrationDate)],
              ].map(([k, v]) => (
                <tr key={k} className="border-b border-neutral-200">
                  <td className="w-40 py-1.5 font-semibold text-neutral-600">{k}</td>
                  <td className="py-1.5">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Audiências */}
          <Section title="Audiências">
            {c.hearings.length === 0 ? (
              <Empty />
            ) : (
              c.hearings.map((h) => (
                <Row key={h.id} left={h.name} right={`${formatDateTime(h.hearingDate)} · ${STAGE_LABEL_HEARING[h.stage] ?? h.stage}`} />
              ))
            )}
          </Section>

          {/* Prazos */}
          <Section title="Prazos">
            {c.deadlines.length === 0 ? (
              <Empty />
            ) : (
              c.deadlines.map((d) => (
                <Row key={d.id} left={DEADLINE_LABEL[d.deadlineType] ?? d.deadlineType} right={`vence ${formatDate(d.deadlineDate)}`} />
              ))
            )}
          </Section>

          {/* Honorários */}
          <Section title="Honorários">
            {c.invoices.length === 0 ? (
              <Empty />
            ) : (
              <>
                {c.invoices.map((i) => (
                  <Row key={i.id} left={i.number} right={formatMoney(Number(i.amount))} />
                ))}
                <Row
                  left="Total"
                  right={formatMoney(c.invoices.reduce((s, i) => s + Number(i.amount), 0))}
                  bold
                />
              </>
            )}
          </Section>

          {/* Assinatura */}
          <div className="mt-12 text-center text-xs">
            <div className="mx-auto w-64 border-t border-neutral-800 pt-1">
              {c.responsibleLawyer?.name ?? "Advogado(a) responsável"}
            </div>
            <div className="mt-1 text-neutral-500">Emitido em {formatDate(new Date())}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const STAGE_LABEL_HEARING: Record<string, string> = { SCHEDULED: "Agendada", COMPLETED: "Realizada", ADJOURNED: "Adiada" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="mb-1 border-b border-neutral-300 pb-1 text-sm font-semibold" style={{ color: "#0B3C5D" }}>
        {title}
      </h3>
      <div className="text-xs">{children}</div>
    </div>
  );
}
function Row({ left, right, bold }: { left: string; right: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between border-b border-neutral-100 py-1 ${bold ? "font-semibold" : ""}`}>
      <span>{left}</span>
      <span>{right}</span>
    </div>
  );
}
function Empty() {
  return <div className="py-1 text-neutral-400">Nenhum registro.</div>;
}
