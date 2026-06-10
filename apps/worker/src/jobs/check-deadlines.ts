import { prisma } from "@legaltech/db";
import { br, adapters, crypto } from "@legaltech/core";

const { chatwoot } = adapters;

/** Config do Chatwoot (token decifrado) ou null. */
async function chatwootConfig() {
  const integ = await prisma.chatwootIntegration.findUnique({ where: { id: "chatwoot" } }).catch(() => null);
  if (!integ?.active || !integ.baseUrl || !integ.apiTokenEncrypted) return null;
  try {
    return { baseUrl: integ.baseUrl, token: crypto.decryptSecret(integ.apiTokenEncrypted) };
  } catch {
    return null;
  }
}

/**
 * Verifica prazos pendentes, marca vencidos e envia alertas (5d/3d/1d/vencimento).
 * Canal: Chatwoot (se configurado) + log. E-mail/webhook entram conforme config futura.
 */
export async function checkDeadlines(now: Date = new Date()): Promise<{ checked: number; overdue: number; alerts: number }> {
  const pending = await prisma.deadline.findMany({
    where: { status: { in: ["PENDING", "ALERTED"] } },
    include: { case: { include: { responsibleLawyer: true, client: true } } },
  });

  const cwCfg = await chatwootConfig();
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

    const fields: string[] = [];
    if (calendarDays === 5 && !dl.alertSent5d) fields.push("alertSent5d");
    if (calendarDays === 3 && !dl.alertSent3d) fields.push("alertSent3d");
    if (calendarDays === 1 && !dl.alertSent1d) fields.push("alertSent1d");
    if (calendarDays === 0 && !dl.alertSentDue) fields.push("alertSentDue");

    for (const field of fields) {
      const venceTxt = calendarDays === 0 ? "VENCE HOJE" : `vence em ${calendarDays} dia(s)`;
      const msg =
        `⚖️ Prazo ${dl.deadlineType} ${venceTxt}\n` +
        `Processo: ${dl.case.caseNumber}${dl.case.cnjNumber ? ` (${dl.case.cnjNumber})` : ""}\n` +
        `Cliente: ${dl.case.client.name}\n` +
        `Dias úteis restantes: ${remaining}`;

      // Canal Chatwoot (best-effort).
      if (cwCfg) {
        try {
          await chatwoot.createConversation(cwCfg, {
            name: dl.case.responsibleLawyer?.name ?? "Equipe jurídica",
            phone: null,
            message: msg,
            extra: { type: "deadline_alert", caseNumber: dl.case.caseNumber, daysRemaining: calendarDays },
          });
        } catch (err) {
          console.error("[alerta chatwoot]", (err as Error).message);
        }
      }
      console.log(`[alerta] ${msg.replace(/\n/g, " | ")}`);

      await prisma.deadline.update({ where: { id: dl.id }, data: { [field]: true, status: "ALERTED" } });
      alerts++;
    }
  }

  return { checked: pending.length, overdue, alerts };
}
