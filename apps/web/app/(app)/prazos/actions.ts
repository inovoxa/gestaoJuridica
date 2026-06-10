"use server";

import { prisma, type DeadlineType } from "@legaltech/db";
import { br } from "@legaltech/core";
import { requireSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/** Prazos legais padrão (CPC) por tipo, em dias úteis. */
const DEFAULT_DAYS: Record<string, number> = {
  INTIMACAO: 15,
  CITACAO: 15,
  SENTENCA: 15,
  DESPACHO: 5,
  PUBLICACAO: 15,
  OUTRO: 15,
};

export async function createDeadline(formData: FormData) {
  await requireSession();

  const caseId = String(formData.get("caseId") ?? "");
  if (!caseId) throw new Error("Processo é obrigatório");

  const deadlineType = (String(formData.get("deadlineType") ?? "OUTRO") || "OUTRO") as DeadlineType;
  const originStr = String(formData.get("originDate") ?? "");
  if (!originStr) throw new Error("Data de origem é obrigatória");
  const originDate = new Date(originStr + "T00:00:00.000Z");

  // Calcula o vencimento em dias úteis (CPC), salvo se uma data explícita for informada.
  const explicit = String(formData.get("deadlineDate") ?? "");
  const days = Number(formData.get("days")) || DEFAULT_DAYS[deadlineType] || 15;
  const deadlineDate = explicit
    ? new Date(explicit + "T00:00:00.000Z")
    : br.computeDeadline(originDate, days, { businessDays: true, nationalHolidays: true });

  await prisma.deadline.create({
    data: {
      caseId,
      deadlineType,
      originDate,
      deadlineDate,
      description: String(formData.get("description") ?? "").trim() || null,
    },
  });

  revalidatePath("/prazos");
  redirect("/prazos");
}

export async function completeDeadline(id: string) {
  await requireSession();
  await prisma.deadline.update({ where: { id }, data: { status: "COMPLETED" } });
  revalidatePath("/prazos");
}

export async function deleteDeadline(id: string) {
  await requireSession();
  await prisma.deadline.delete({ where: { id } });
  revalidatePath("/prazos");
}
