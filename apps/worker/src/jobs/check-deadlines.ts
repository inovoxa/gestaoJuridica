import { prisma } from "@legaltech/db";
import { br } from "@legaltech/core";

/**
 * Verifica prazos pendentes, marca vencidos e dispara alertas (5d/3d/1d/vencimento).
 * Fase 1: marca OVERDUE e registra quais alertas seriam enviados.
 * Fase 2: integra envio real (e-mail / webhook n8n / mensagem Chatwoot).
 */
export async function checkDeadlines(now: Date = new Date()): Promise<{ checked: number; overdue: number; alerts: number }> {
  const pending = await prisma.deadline.findMany({
    where: { status: { in: ["PENDING", "ALERTED"] } },
    include: { case: { include: { responsibleLawyer: true, client: true } } },
  });

  let overdue = 0;
  let alerts = 0;

  for (const dl of pending) {
    const remaining = br.businessDaysRemaining(dl.deadlineDate, now);
    const calendarDays = Math.floor(
      (Date.UTC(dl.deadlineDate.getUTCFullYear(), dl.deadlineDate.getUTCMonth(), dl.deadlineDate.getUTCDate()) -
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) /
        86400000,
    );

    if (calendarDays < 0 && dl.status !== "OVERDUE") {
      await prisma.deadline.update({ where: { id: dl.id }, data: { status: "OVERDUE" } });
      overdue++;
      continue;
    }

    const toSend: { flag: keyof typeof dl; field: string }[] = [];
    if (calendarDays === 5 && !dl.alertSent5d) toSend.push({ flag: "alertSent5d", field: "alertSent5d" });
    if (calendarDays === 3 && !dl.alertSent3d) toSend.push({ flag: "alertSent3d", field: "alertSent3d" });
    if (calendarDays === 1 && !dl.alertSent1d) toSend.push({ flag: "alertSent1d", field: "alertSent1d" });
    if (calendarDays === 0 && !dl.alertSentDue) toSend.push({ flag: "alertSentDue", field: "alertSentDue" });

    for (const a of toSend) {
      // TODO Fase 2: enviar via e-mail / webhook / Chatwoot
      console.log(
        `[alerta] Processo ${dl.case.caseNumber} — prazo ${dl.deadlineType} vence em ${calendarDays}d ` +
          `(${remaining} dias úteis), advogado ${dl.case.responsibleLawyer?.name ?? "—"}`,
      );
      await prisma.deadline.update({
        where: { id: dl.id },
        data: { [a.field]: true, status: "ALERTED" },
      });
      alerts++;
    }
  }

  return { checked: pending.length, overdue, alerts };
}
