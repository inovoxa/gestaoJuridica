"use server";

import { prisma } from "@legaltech/db";
import { adapters } from "@legaltech/core";
import { requireClient } from "@/lib/session";
import { revalidatePath } from "next/cache";

const { storage } = adapters;
const MAX_BYTES = 25 * 1024 * 1024;

/** Cliente do portal envia uma prova para um de seus processos. */
export async function uploadEvidence(caseId: string, formData: FormData) {
  const { client } = await requireClient();

  // Garante que o processo pertence ao cliente logado (sigilo).
  const kase = await prisma.case.findFirst({ where: { id: caseId, clientId: client.id } });
  if (!kase) throw new Error("Processo não encontrado");

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("Selecione um arquivo");
  if (file.size > MAX_BYTES) throw new Error("Arquivo excede 25 MB");

  const name = String(formData.get("name") ?? "").trim() || file.name;
  const driver = storage.getStorage();
  const key = storage.buildStorageKey(`provas/${caseId}`, file.name);
  const stored = await driver.put(key, Buffer.from(await file.arrayBuffer()), file.type);

  await prisma.evidence.create({
    data: {
      caseId,
      name,
      description: String(formData.get("description") ?? "").trim() || null,
      storageDriver: driver.name,
      storageKey: stored.key,
      fileName: file.name,
    },
  });

  revalidatePath(`/portal/processos/${caseId}`);
}
