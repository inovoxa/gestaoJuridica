import { prisma } from "@legaltech/db";
import { adapters } from "@legaltech/core";

const { storage } = adapters;

/**
 * Exclui definitivamente documentos cuja data de exclusão agendada já passou
 * (ciclo de vida: ACTIVE → PENDING_DELETION → DELETED). Remove o objeto do storage.
 */
export async function purgeExpiredDocuments(now: Date = new Date()): Promise<number> {
  const expired = await prisma.document.findMany({
    where: { state: "PENDING_DELETION", scheduledDeletionDate: { lte: now } },
  });

  const driver = storage.getStorage();
  for (const doc of expired) {
    if (doc.storageKey) await driver.delete(doc.storageKey).catch((e) => console.error("[purge] storage:", e.message));
    await prisma.document.update({ where: { id: doc.id }, data: { state: "DELETED", storageKey: null } });
  }

  if (expired.length) console.log(`[purge] ${expired.length} documento(s) excluído(s) definitivamente`);
  return expired.length;
}
