"use server";

import { prisma } from "@legaltech/db";
import { adapters } from "@legaltech/core";
import { requireRole } from "@/lib/session";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import { revalidatePath } from "next/cache";

const { chatwoot } = adapters;

export async function saveChatwootConfig(formData: FormData) {
  await requireRole("ADMIN_ESCRITORIO");

  const baseUrl = String(formData.get("baseUrl") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();
  const defaultFunnelId = String(formData.get("defaultFunnelId") ?? "").trim() || null;
  const active = formData.get("active") === "on";
  if (!baseUrl) throw new Error("Base URL é obrigatória");

  const existing = await prisma.chatwootIntegration.findUnique({ where: { id: "chatwoot" } });
  // Mantém o token atual se o campo vier vazio (não sobrescreve com vazio).
  const apiTokenEncrypted = token ? encryptSecret(token) : existing?.apiTokenEncrypted ?? "";
  if (!apiTokenEncrypted) throw new Error("Informe o API Token");

  await prisma.chatwootIntegration.upsert({
    where: { id: "chatwoot" },
    update: { baseUrl, apiTokenEncrypted, defaultFunnelId, active },
    create: { id: "chatwoot", baseUrl, apiTokenEncrypted, defaultFunnelId, active },
  });

  revalidatePath("/config");
}

/** Testa a conexão com o Chatwoot usando a config salva. */
export async function testChatwoot(): Promise<{ ok: boolean; message: string }> {
  await requireRole("ADMIN_ESCRITORIO");
  const integ = await prisma.chatwootIntegration.findUnique({ where: { id: "chatwoot" } });
  if (!integ?.baseUrl || !integ.apiTokenEncrypted) return { ok: false, message: "Configuração incompleta" };
  try {
    await chatwoot.testConnection({ baseUrl: integ.baseUrl, token: decryptSecret(integ.apiTokenEncrypted) });
    return { ok: true, message: "Conexão bem-sucedida" };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}
