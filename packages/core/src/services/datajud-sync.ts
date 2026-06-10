import { prisma, type DatajudProcStatus } from "@legaltech/db";
import { createHash } from "node:crypto";
import { decryptSecret } from "../crypto.js";
import { fetchProcess } from "../adapters/datajud.js";
import { extractDeadline } from "../br/extracao-prazo.js";
import { extractHearing } from "../br/extracao-audiencia.js";
import { computeDeadline } from "../br/prazos.js";

export interface SyncResult {
  ok: boolean;
  message: string;
  newMovements?: number;
  newDeadlines?: number;
  newHearings?: number;
}

export async function getDatajudApiKey(): Promise<string | null> {
  const cfg = await prisma.datajudConfig.findUnique({ where: { id: "datajud" } });
  if (!cfg?.apiKeyEncrypted) return null;
  try {
    return decryptSecret(cfg.apiKeyEncrypted);
  } catch {
    return null;
  }
}

function movementHash(codigo: number | undefined | null, data: Date | null | undefined, descricao: string): string {
  return createHash("sha1").update(`${codigo ?? ""}|${data?.toISOString() ?? ""}|${descricao}`).digest("hex");
}

/**
 * Sincroniza um Case com o DataJud pelo número CNJ: capa + movimentações + extração de prazos.
 * Compartilhado entre a UI (ação manual) e o worker (sync diário).
 */
export async function syncCaseFromDatajud(caseId: string): Promise<SyncResult> {
  const apiKey = await getDatajudApiKey();
  if (!apiKey) return { ok: false, message: "DataJud não configurado." };

  const kase = await prisma.case.findUnique({ where: { id: caseId } });
  if (!kase?.cnjNumber) return { ok: false, message: "Processo sem número CNJ." };

  let dto;
  try {
    dto = await fetchProcess(apiKey, kase.cnjNumber);
  } catch (err) {
    await prisma.datajudSyncLog.create({
      data: { action: "fetch", status: "ERROR", message: (err as Error).message, processNumber: kase.cnjNumber },
    });
    return { ok: false, message: (err as Error).message };
  }
  if (!dto) {
    await prisma.datajudSyncLog.create({
      data: { action: "fetch", status: "INFO", message: "Processo não encontrado", processNumber: kase.cnjNumber },
    });
    return { ok: false, message: "Processo não encontrado no DataJud." };
  }

  const statusMap: Record<string, DatajudProcStatus> = { ATIVO: "ATIVO", ARQUIVADO: "ARQUIVADO", BAIXADO: "BAIXADO" };
  const proc = await prisma.datajudProcess.upsert({
    where: { numeroProcesso: kase.cnjNumber },
    update: {
      caseId,
      tribunalSigla: dto.tribunalSigla,
      classe: dto.classe,
      assunto: dto.assunto,
      orgaoJulgador: dto.orgaoJulgador,
      grau: dto.grau,
      dataAjuizamento: dto.dataAjuizamento,
      dataUltimaMov: dto.dataUltimaMov,
      dataUltimaVerificacao: new Date(),
      status: statusMap[(dto as any).status] ?? "DESCONHECIDO",
      rawJson: JSON.stringify(dto.raw).slice(0, 100_000),
    },
    create: {
      numeroProcesso: kase.cnjNumber,
      caseId,
      tribunalSigla: dto.tribunalSigla,
      classe: dto.classe,
      assunto: dto.assunto,
      orgaoJulgador: dto.orgaoJulgador,
      grau: dto.grau,
      dataAjuizamento: dto.dataAjuizamento,
      dataUltimaMov: dto.dataUltimaMov,
      dataUltimaVerificacao: new Date(),
      rawJson: JSON.stringify(dto.raw).slice(0, 100_000),
    },
  });

  const cfg = await prisma.datajudConfig.findUnique({ where: { id: "datajud" } });
  const autoExtract = cfg?.autoExtractDeadlines ?? true;
  let newMovements = 0;
  let newDeadlines = 0;
  let newHearings = 0;

  for (const m of dto.movements) {
    const hash = movementHash(m.codigo, m.data, m.descricao);
    const existing = await prisma.datajudMovement.findUnique({ where: { processId_hash: { processId: proc.id, hash } } });
    if (existing) continue;

    const mov = await prisma.datajudMovement.create({
      data: { processId: proc.id, data: m.data ?? null, codigo: m.codigo ?? null, descricao: m.descricao, hash },
    });
    newMovements++;

    // Extração automática de prazo.
    if (autoExtract && m.data) {
      const extracted = extractDeadline(m.descricao);
      if (extracted) {
        const deadlineDate = computeDeadline(m.data, extracted.days, {
          businessDays: cfg?.deadlineBusinessDays ?? true,
          nationalHolidays: true,
        });
        await prisma.deadline.create({
          data: {
            caseId,
            deadlineType: extracted.type,
            originDate: m.data,
            deadlineDate,
            description: `Extraído automaticamente do DataJud: "${m.descricao}"`,
          },
        });
        await prisma.datajudMovement.update({ where: { id: mov.id }, data: { deadlineExtracted: true } });
        newDeadlines++;
      }
    }

    // Automação de audiências: detecta designação e cria audiência + evento.
    const hearing = extractHearing(m.descricao);
    if (hearing && hearing.date.getTime() > Date.now()) {
      const kaseRow = await prisma.case.findUnique({ where: { id: caseId }, select: { responsibleLawyerId: true } });
      await prisma.hearing.create({
        data: {
          caseId,
          name: hearing.type,
          hearingDate: hearing.date,
          lawyerId: kaseRow?.responsibleLawyerId ?? null,
          autoCreated: true,
          notes: `Criada automaticamente do DataJud: "${m.descricao}"`,
          event: {
            create: {
              title: hearing.type,
              start: hearing.date,
              end: new Date(hearing.date.getTime() + 3600_000),
              type: "AUDIENCIA",
              caseId,
            },
          },
        },
      });
      await prisma.datajudMovement.update({ where: { id: mov.id }, data: { hearingExtracted: true } });
      newHearings++;
    }
  }

  await prisma.datajudConfig
    .update({ where: { id: "datajud" }, data: { lastSync: new Date(), requestsThisMonth: { increment: 1 } } })
    .catch(() => {});

  await prisma.datajudSyncLog.create({
    data: {
      action: "sync",
      status: "SUCCESS",
      message: `${newMovements} mov., ${newDeadlines} prazo(s), ${newHearings} audiência(s)`,
      processNumber: kase.cnjNumber,
      recordsFound: dto.movements.length,
    },
  });

  return {
    ok: true,
    message: `Sincronizado: ${newMovements} movimentações, ${newDeadlines} prazos, ${newHearings} audiências`,
    newMovements,
    newDeadlines,
    newHearings,
  };
}

/** Sincroniza todos os processos com número CNJ (usado pelo cron do worker). */
export async function syncAllCases(): Promise<{ processed: number }> {
  const cfg = await prisma.datajudConfig.findUnique({ where: { id: "datajud" } });
  if (!cfg?.autoSync || !cfg.apiKeyEncrypted) return { processed: 0 };

  const cases = await prisma.case.findMany({ where: { cnjNumber: { not: null } }, select: { id: true } });
  let processed = 0;
  for (const c of cases) {
    try {
      await syncCaseFromDatajud(c.id);
      processed++;
    } catch (err) {
      console.error("[datajud] erro ao sincronizar", c.id, (err as Error).message);
    }
  }
  return { processed };
}
