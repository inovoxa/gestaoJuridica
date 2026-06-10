import { prisma } from "@legaltech/db";
import { decryptSecret } from "../crypto.js";
import { complete, type AiProviderName, type AiResponse } from "../adapters/ai.js";

export class ConsentError extends Error {
  constructor(message = "Consentimento do cliente para uso de IA não registrado (Recomendação OAB 001/2024).") {
    super(message);
    this.name = "ConsentError";
  }
}

export class AiNotConfiguredError extends Error {
  constructor(message = "Nenhum provedor de IA configurado e ativo.") {
    super(message);
    this.name = "AiNotConfiguredError";
  }
}

/** Verifica consentimento escrito do cliente para uso de IA. Lança ConsentError se ausente. */
export async function ensureAiConsent(clientId: string, purpose = "uso_ia"): Promise<void> {
  const consent = await prisma.consentRecord.findFirst({
    where: { clientId, purpose, granted: true, revokedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!consent) throw new ConsentError();
}

/** Retorna o provedor de IA ativo de maior prioridade, com a chave decifrada. */
async function getActiveAi() {
  const cfg = await prisma.aiConfig.findFirst({ where: { active: true }, orderBy: { priority: "asc" } });
  if (!cfg) throw new AiNotConfiguredError();
  return { cfg, apiKey: decryptSecret(cfg.apiKeyEnc) };
}

export interface RunAiInput {
  system: string;
  prompt: string;
  /** Usuário que disparou (para AuditLog). */
  userId?: string;
  /** Entidade relacionada (para AuditLog). */
  entity?: string;
  entityId?: string;
}

/** Executa uma chamada de IA com o provedor ativo, registra uso e auditoria. */
export async function runAi(input: RunAiInput): Promise<AiResponse & { provider: AiProviderName }> {
  const { cfg, apiKey } = await getActiveAi();

  const res = await complete({
    provider: cfg.provider as AiProviderName,
    apiKey,
    model: cfg.model ?? undefined,
    system: input.system,
    prompt: input.prompt,
    maxTokens: cfg.maxTokens,
    temperature: cfg.temperature,
  });

  await prisma.aiConfig.update({
    where: { id: cfg.id },
    data: { totalRequests: { increment: 1 }, totalTokens: { increment: res.tokens }, lastUsed: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      userId: input.userId ?? null,
      action: "ai.invoke",
      entity: input.entity ?? "Ai",
      entityId: input.entityId ?? null,
      metadata: { provider: cfg.provider, model: res.model, tokens: res.tokens },
    },
  });

  return { ...res, provider: cfg.provider as AiProviderName };
}
