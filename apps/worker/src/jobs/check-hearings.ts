import { prisma } from "@legaltech/db";
import { adapters, crypto } from "@legaltech/core";

const { chatwoot } = adapters;

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
 * Lembretes de audiência: alerta 3 dias e 1 dia antes das audiências agendadas.
 * Complementa a automação de audiências (criadas a partir do DataJud).
 */
export async function checkHearings(now: Date = new Date()): Promise<{ checked: number; alerts: number }> {
  const upcoming = await prisma.hearing.findMany({
    where: { stage: "SCHEDULED", hearingDate: { gte: now } },
    include: { case: { include: { client: true, responsibleLawyer: true } } },
  });

  const cwCfg = await chatwootConfig();
  let alerts = 0;

  for (const h of upcoming) {
    const days = Math.floor(
      (Date.UTC(h.hearingDate.getUTCFullYear(), h.hearingDate.getUTCMonth(), h.hearingDate.getUTCDate()) -
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) /
        86400000,
    );

    const fields: string[] = [];
    if (days === 3 && !h.reminderSent3d) fields.push("reminderSent3d");
    if (days <= 1 && !h.reminderSent1d) fields.push("reminderSent1d");

    for (const field of fields) {
      const msg =
        `🏛️ Lembrete de audiência ${days <= 1 ? "AMANHÃ/HOJE" : `em ${days} dias`}\n` +
        `${h.name}\n` +
        `Processo: ${h.case.caseNumber} — ${h.case.client.name}\n` +
        `Data: ${h.hearingDate.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}`;

      if (cwCfg) {
        try {
          await chatwoot.createConversation(cwCfg, {
            name: h.case.responsibleLawyer?.name ?? "Equipe jurídica",
            message: msg,
            extra: { type: "hearing_reminder", caseNumber: h.case.caseNumber },
          });
        } catch (err) {
          console.error("[lembrete audiência]", (err as Error).message);
        }
      }
      console.log(`[audiência] ${msg.replace(/\n/g, " | ")}`);
      await prisma.hearing.update({ where: { id: h.id }, data: { [field]: true } });
      alerts++;
    }
  }

  return { checked: upcoming.length, alerts };
}
