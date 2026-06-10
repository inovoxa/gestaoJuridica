import { Queue } from "bullmq";
import IORedis from "ioredis";

export const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

/** Nomes de filas/jobs do sistema. */
export const QUEUE_NAMES = {
  deadlines: "deadlines", // verificação de prazos e alertas (Fase 1/2)
  datajud: "datajud", // sincronização DataJud (Fase 2)
  documents: "documents", // exclusão postergada de documentos (Fase 1)
  google: "google", // pull bidirecional do Google Calendar (Fase 1)
  ai: "ai", // tarefas de IA assíncronas (Fase 3)
} as const;

export const deadlinesQueue = new Queue(QUEUE_NAMES.deadlines, { connection });
export const documentsQueue = new Queue(QUEUE_NAMES.documents, { connection });
export const googleQueue = new Queue(QUEUE_NAMES.google, { connection });
