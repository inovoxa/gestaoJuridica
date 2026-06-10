"use server";

import { prisma, type CaseStage } from "@legaltech/db";
import { br } from "@legaltech/core";
import { requireSession } from "@/lib/session";
import { createCardForCase } from "@/lib/chatwoot";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/** Gera o próximo número interno sequencial (PROC/NNNNN). */
async function nextCaseNumber(): Promise<string> {
  const count = await prisma.case.count();
  return `PROC/${String(count + 1).padStart(5, "0")}`;
}

export async function createCase(formData: FormData) {
  await requireSession();

  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) throw new Error("Cliente é obrigatório");

  const cnjRaw = String(formData.get("cnjNumber") ?? "").trim();
  let cnjNumber: string | null = null;
  if (cnjRaw) {
    if (!br.isValidCnj(cnjRaw)) throw new Error("Número CNJ inválido (verifique o dígito verificador)");
    cnjNumber = br.formatCnj(cnjRaw);
  }

  const caseNumber = await nextCaseNumber();
  const responsibleLawyerId = String(formData.get("responsibleLawyerId") ?? "") || null;

  const created = await prisma.case.create({
    data: {
      caseNumber,
      cnjNumber,
      clientId,
      responsibleLawyerId,
      caseTypeId: String(formData.get("caseTypeId") ?? "") || null,
      courtId: String(formData.get("courtId") ?? "") || null,
      judgeId: String(formData.get("judgeId") ?? "") || null,
      oppositeParty: String(formData.get("oppositeParty") ?? "").trim() || null,
      confidential: formData.get("confidential") === "on",
      // Advogado responsável entra como owner com permissão de escrita.
      caseLawyers: responsibleLawyerId
        ? { create: { lawyerId: responsibleLawyerId, permission: "WRITE", isOwner: true } }
        : undefined,
    },
  });

  // Espelha o processo como card no funil do Chatwoot (best-effort).
  await createCardForCase(created.id);

  revalidatePath("/processos");
  redirect(`/processos/${created.id}`);
}

export async function changeStage(id: string, stage: CaseStage) {
  await requireSession();
  await prisma.case.update({ where: { id }, data: { stage } });
  // TODO Fase 2: mover card no Kanban do Chatwoot.
  revalidatePath(`/processos/${id}`);
  revalidatePath("/processos");
}

export async function deleteCase(id: string) {
  await requireSession();
  await prisma.case.delete({ where: { id } });
  revalidatePath("/processos");
  redirect("/processos");
}
