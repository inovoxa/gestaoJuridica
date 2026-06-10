"use server";

import { prisma } from "@legaltech/db";
import { services } from "@legaltech/core";
import { requireSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPetition(caseId: string, formData: FormData) {
  await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  const petitionType = String(formData.get("petitionType") ?? "").trim();
  if (!name || !petitionType) throw new Error("Título e tipo são obrigatórios");

  const pet = await prisma.petition.create({
    data: {
      caseId,
      name,
      petitionType,
      userInstructions: String(formData.get("userInstructions") ?? "").trim() || null,
    },
  });
  revalidatePath(`/processos/${caseId}/peticoes`);
  redirect(`/processos/${caseId}/peticoes/${pet.id}`);
}

/** Gera a petição com IA. Retorna mensagem de erro (ex.: consentimento) ou ok. */
export async function generatePetition(petitionId: string): Promise<{ ok: boolean; message: string }> {
  const ctx = await requireSession();
  const pet = await prisma.petition.findUnique({ where: { id: petitionId } });
  if (!pet) return { ok: false, message: "Petição não encontrada" };
  try {
    await services.petition.generatePetition(petitionId, ctx.userId);
    revalidatePath(`/processos/${pet.caseId}/peticoes/${petitionId}`);
    return { ok: true, message: "Petição gerada" };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}

export async function saveFinalContent(petitionId: string, formData: FormData) {
  await requireSession();
  const finalContent = String(formData.get("finalContent") ?? "");
  const pet = await prisma.petition.update({
    where: { id: petitionId },
    data: { finalContent, state: "REVISED" },
  });
  revalidatePath(`/processos/${pet.caseId}/peticoes/${petitionId}`);
}

export async function finalizePetition(petitionId: string) {
  await requireSession();
  const pet = await prisma.petition.update({ where: { id: petitionId }, data: { state: "FINALIZED" } });
  revalidatePath(`/processos/${pet.caseId}/peticoes/${petitionId}`);
}

export async function deletePetition(petitionId: string) {
  await requireSession();
  const pet = await prisma.petition.delete({ where: { id: petitionId } });
  revalidatePath(`/processos/${pet.caseId}/peticoes`);
  redirect(`/processos/${pet.caseId}/peticoes`);
}

/** Registra o consentimento escrito do cliente para uso de IA (OAB 001/2024). */
export async function grantAiConsent(caseId: string) {
  await requireSession();
  const kase = await prisma.case.findUnique({ where: { id: caseId }, select: { clientId: true } });
  if (!kase) throw new Error("Processo não encontrado");
  await prisma.consentRecord.create({
    data: { clientId: kase.clientId, purpose: "uso_ia", granted: true, grantedAt: new Date() },
  });
  revalidatePath(`/processos/${caseId}/peticoes`);
}
