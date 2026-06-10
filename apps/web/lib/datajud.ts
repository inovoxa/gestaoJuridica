// Reexporta a sincronização DataJud do core (compartilhada com o worker).
import { services } from "@legaltech/core";

export const syncCaseFromDatajud = services.datajudSync.syncCaseFromDatajud;
export const getDatajudApiKey = services.datajudSync.getDatajudApiKey;
export type SyncResult = services.datajudSync.SyncResult;
