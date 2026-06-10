import { Worker } from "bullmq";
import { connection, QUEUE_NAMES, deadlinesQueue, documentsQueue, googleQueue, datajudQueue } from "./queues.js";
import { checkDeadlines } from "./jobs/check-deadlines.js";
import { purgeExpiredDocuments } from "./jobs/purge-documents.js";
import { pullGoogleCalendar } from "./jobs/google-pull.js";
import { syncDatajud } from "./jobs/datajud-sync.js";

/**
 * Processo worker: substitui os ir.cron do Odoo.
 * Schedulers registram jobs repetíveis; Workers os processam.
 */

const deadlinesWorker = new Worker(
  QUEUE_NAMES.deadlines,
  async (job) => {
    if (job.name === "check-deadlines") return checkDeadlines();
    return null;
  },
  { connection },
);

const documentsWorker = new Worker(
  QUEUE_NAMES.documents,
  async (job) => {
    if (job.name === "purge-expired") return purgeExpiredDocuments();
    return null;
  },
  { connection },
);

const googleWorker = new Worker(
  QUEUE_NAMES.google,
  async (job) => {
    if (job.name === "pull-calendar") return pullGoogleCalendar();
    return null;
  },
  { connection },
);

const datajudWorker = new Worker(
  QUEUE_NAMES.datajud,
  async (job) => {
    if (job.name === "sync-all") return syncDatajud();
    return null;
  },
  { connection },
);

for (const w of [deadlinesWorker, documentsWorker, googleWorker, datajudWorker]) {
  w.on("completed", (job, result) => console.log(`✔ job ${job.queueName}/${job.name} ok`, result ?? ""));
  w.on("failed", (job, err) => console.error(`✖ job ${job?.queueName}/${job?.name} falhou:`, err?.message));
}

async function registerSchedulers() {
  // Verificação de prazos a cada 2h (equivalente ao cron Datajud do Odoo).
  await deadlinesQueue.upsertJobScheduler("check-deadlines-2h", { every: 2 * 60 * 60 * 1000 }, { name: "check-deadlines" });
  // Purga de documentos diária.
  await documentsQueue.upsertJobScheduler("purge-documents-daily", { every: 24 * 60 * 60 * 1000 }, { name: "purge-expired" });
  // Pull do Google Calendar a cada 10 min (sync bidirecional de entrada).
  await googleQueue.upsertJobScheduler("google-pull-10m", { every: 10 * 60 * 1000 }, { name: "pull-calendar" });
  // Sincronização DataJud diária.
  await datajudQueue.upsertJobScheduler("datajud-sync-daily", { every: 24 * 60 * 60 * 1000 }, { name: "sync-all" });
  console.log("⏰ Schedulers: check-deadlines (2h), purge-documents (24h), google-pull (10min), datajud-sync (24h)");
}

async function main() {
  await registerSchedulers();
  console.log("🚀 Worker LegalTech iniciado. Aguardando jobs...");
}

main().catch((err) => {
  console.error("Falha ao iniciar worker:", err);
  process.exit(1);
});

// Encerramento limpo
for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, async () => {
    console.log(`\nRecebido ${sig}, encerrando workers...`);
    await Promise.all([deadlinesWorker.close(), documentsWorker.close()]);
    await connection.quit();
    process.exit(0);
  });
}
