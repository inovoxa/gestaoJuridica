import { prisma } from "@legaltech/db";
import { adapters } from "@legaltech/core";
import { decryptSecret } from "./crypto";

const { chatwoot } = adapters;

/** Configuração ativa do Chatwoot (token decifrado), ou null se não configurado. */
export async function getChatwootConfig(): Promise<adapters.chatwoot.ChatwootConfig | null> {
  const integ = await prisma.chatwootIntegration.findUnique({ where: { id: "chatwoot" } }).catch(() => null);
  if (!integ?.active || !integ.baseUrl || !integ.apiTokenEncrypted) return null;
  try {
    return { baseUrl: integ.baseUrl, token: decryptSecret(integ.apiTokenEncrypted) };
  } catch {
    return null;
  }
}

/** Registra um lead (do formulário do site) no Chatwoot. Best-effort. */
export async function sendLeadToChatwoot(input: {
  name: string;
  email?: string | null;
  phone?: string | null;
  message: string;
  practiceArea?: string | null;
}): Promise<boolean> {
  const cfg = await getChatwootConfig();
  if (!cfg) return false;
  try {
    await chatwoot.createConversation(cfg, {
      name: input.name,
      email: input.email,
      phone: input.phone,
      message: input.message,
      extra: { source: "website", practiceArea: input.practiceArea ?? undefined },
    });
    return true;
  } catch (err) {
    console.error("[chatwoot] lead:", (err as Error).message);
    return false;
  }
}

/** Cria um card no funil de processos do Chatwoot espelhando um processo. Best-effort. */
export async function createCardForCase(caseId: string): Promise<void> {
  const cfg = await getChatwootConfig();
  if (!cfg) return;
  try {
    const c = await prisma.case.findUnique({ where: { id: caseId }, include: { client: true } });
    if (!c) return;
    const integ = await prisma.chatwootIntegration.findUnique({ where: { id: "chatwoot" } });
    const card = await chatwoot.createCard(cfg, {
      funnelId: integ?.defaultFunnelId ?? undefined,
      title: `${c.caseNumber} — ${c.client.name}`,
      contact: { name: c.client.name, email: c.client.email, phone: c.client.phone },
      meta: { caseNumber: c.caseNumber, cnj: c.cnjNumber ?? undefined },
    });
    if (card?.id || card?.conversationId) {
      await prisma.case.update({
        where: { id: caseId },
        data: {
          chatwootCardId: card.id ?? undefined,
          chatwootConversationId: card.conversationId ?? undefined,
        },
      });
    }
  } catch (err) {
    console.error("[chatwoot] card:", (err as Error).message);
  }
}
