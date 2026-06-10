import { services } from "@legaltech/core";

/** Sincroniza todos os processos com CNJ no DataJud (cron diário). */
export async function syncDatajud(): Promise<{ processed: number }> {
  const result = await services.datajudSync.syncAllCases();
  if (result.processed) console.log(`[datajud] ${result.processed} processo(s) sincronizado(s)`);
  return result;
}
