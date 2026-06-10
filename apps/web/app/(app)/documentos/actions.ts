"use server";

import { prisma } from "@legaltech/db";
import { adapters } from "@legaltech/core";
import { requireSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

const { storage } = adapters;

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

export async function uploadDocument(formData: FormData) {
  await requireSession();

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("Selecione um arquivo");
  if (file.size > MAX_BYTES) throw new Error("Arquivo excede 25 MB");

  const name = String(formData.get("name") ?? "").trim() || file.name;
  const documentType = String(formData.get("documentType") ?? "").trim() || null;
  const caseId = String(formData.get("caseId") ?? "") || null;
  const clientId = String(formData.get("clientId") ?? "") || null;

  const scope = caseId ? `processos/${caseId}` : clientId ? `clientes/${clientId}` : "geral";
  const driver = storage.getStorage();
  const key = storage.buildStorageKey(scope, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  // put() retorna a chave efetiva (no Google Drive, o id do arquivo).
  const stored = await driver.put(key, buffer, file.type);

  await prisma.document.create({
    data: {
      name,
      documentType,
      caseId,
      clientId,
      storageDriver: driver.name,
      storageKey: stored.key,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || null,
    },
  });

  revalidatePath("/documentos");
}

/** Solicita exclusão (ciclo de vida com atraso configurável — padrão 30 dias). */
export async function requestDeletion(id: string) {
  await requireSession();
  const days = Number(process.env.DOC_DELETION_DELAY_DAYS ?? 30);
  await prisma.document.update({
    where: { id },
    data: {
      state: "PENDING_DELETION",
      deletionRequestedDate: new Date(),
      scheduledDeletionDate: new Date(Date.now() + days * 86400_000),
    },
  });
  revalidatePath("/documentos");
}

export async function cancelDeletion(id: string) {
  await requireSession();
  await prisma.document.update({
    where: { id },
    data: { state: "ACTIVE", deletionRequestedDate: null, scheduledDeletionDate: null },
  });
  revalidatePath("/documentos");
}
