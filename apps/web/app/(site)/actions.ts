"use server";

import { prisma } from "@legaltech/db";

export interface ContactFormState {
  ok: boolean;
  error?: string;
}

/**
 * Recebe o formulário de contato do website e cria um ContactMessage.
 * Fase 2: sincronizar com o Chatwoot (criar contato + card no funil de leads).
 */
export async function submitContact(_prev: ContactFormState, formData: FormData): Promise<ContactFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const practiceArea = String(formData.get("practiceArea") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !message || (!email && !phone)) {
    return { ok: false, error: "Informe nome, mensagem e ao menos um contato (e-mail ou telefone)." };
  }

  await prisma.contactMessage.create({
    data: {
      name,
      email: email || null,
      phone: phone || null,
      practiceArea: practiceArea || null,
      message,
    },
  });

  // TODO Fase 2: enviar ao Chatwoot (lead) via adapter.
  return { ok: true };
}
