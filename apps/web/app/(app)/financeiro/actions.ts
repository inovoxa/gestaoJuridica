"use server";

import { prisma, type InvoiceStatus } from "@legaltech/db";
import { requireSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createInvoice(formData: FormData) {
  await requireSession();
  const number = String(formData.get("number") ?? "").trim();
  const amount = Number(String(formData.get("amount") ?? "0").replace(",", "."));
  if (!number || !amount) throw new Error("Número e valor são obrigatórios");

  const dueStr = String(formData.get("dueDate") ?? "");
  await prisma.invoice.create({
    data: {
      number,
      amount,
      caseId: String(formData.get("caseId") ?? "") || null,
      status: (String(formData.get("status") ?? "DRAFT") || "DRAFT") as InvoiceStatus,
      dueDate: dueStr ? new Date(dueStr + "T00:00:00.000Z") : null,
    },
  });
  revalidatePath("/financeiro");
  redirect("/financeiro");
}

export async function setInvoiceStatus(id: string, status: InvoiceStatus) {
  await requireSession();
  await prisma.invoice.update({ where: { id }, data: { status } });
  revalidatePath("/financeiro");
}

export async function deleteInvoice(id: string) {
  await requireSession();
  await prisma.invoice.delete({ where: { id } });
  revalidatePath("/financeiro");
}
