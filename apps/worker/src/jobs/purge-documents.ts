import { prisma } from "@legaltech/db";

/**
 * Exclui definitivamente documentos cuja data de exclusão agendada já passou
 * (ciclo de vida: ACTIVE → PENDING_DELETION → DELETED). Fase 1.
 */
export async function purgeExpiredDocuments(now: Date = new Date()): Promise<number> {
  const expired = await prisma.document.findMany({
    where: { state: "PENDING_DELETION", scheduledDeletionDate: { lte: now } },
  });

  for (const doc of expired) {
    // TODO: remover objeto do storage (adapter) antes de marcar DELETED
    await prisma.document.update({
      where: { id: doc.id },
      data: { state: "DELETED", storageKey: null },
    });
  }

  if (expired.length) console.log(`[purge] ${expired.length} documento(s) excluído(s) definitivamente`);
  return expired.length;
}
