"use server";

import { prisma } from "@legaltech/db";
import { requireSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseClient(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Nome é obrigatório");
  return {
    name,
    cpfCnpj: String(formData.get("cpfCnpj") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    street: String(formData.get("street") ?? "").trim() || null,
    city: String(formData.get("city") ?? "").trim() || null,
    state: String(formData.get("state") ?? "").trim() || null,
    zip: String(formData.get("zip") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
}

export async function createClient(formData: FormData) {
  await requireSession();
  const data = parseClient(formData);
  await prisma.client.create({ data });
  // TODO Fase 2: sincronizar com contato do Chatwoot.
  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function updateClient(id: string, formData: FormData) {
  await requireSession();
  const data = parseClient(formData);
  await prisma.client.update({ where: { id }, data });
  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function deleteClient(id: string) {
  await requireSession();
  await prisma.client.delete({ where: { id } });
  revalidatePath("/clientes");
}
