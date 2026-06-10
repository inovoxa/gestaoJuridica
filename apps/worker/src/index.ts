import { Worker } from "bullmq";
import { connection, QUEUE_NAMES, deadlinesQueue, documentsQueue } from "./queues.js";
import { checkDeadlines } from "./jobs/check-deadlines.js";
import { purgeExpiredDocuments } from "./jobs/purge-documents.js";

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

for (const w of [deadlinesWorker, documentsWorker]) {
  w.on("completed", (job, result) => console.log(`✔ job ${job.queueName}/${job.name} ok`, result ?? ""));
  w.on("failed", (job, err) => console.error(`✖ job ${job?.queueName}/${job?.name} falhou:`, err?.message));
}

async function registerSchedulers() {
  // Verificação de prazos a cada 2h (equivalente ao cron Datajud do Odoo).
  await deadlinesQueue.upsertJobScheduler("check-deadlines-2h", { every: 2 * 60 * 60 * 1000 }, { name: "check-deadlines" });
  // Purga de documentos diária.
  await documentsQueue.upsertJobScheduler("purge-documents-daily", { every: 24 * 60 * 60 * 1000 }, { name: "purge-expired" });
  console.log("⏰ Schedulers registrados: check-deadlines (2h), purge-documents (24h)");
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
