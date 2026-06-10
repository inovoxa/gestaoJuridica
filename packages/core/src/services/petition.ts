import { prisma } from "@legaltech/db";
import { runAi, ensureAiConsent } from "./ai-service.js";
import { formatCnj } from "../br/cnj.js";

/** Monta o contexto textual do processo para alimentar a IA. */
async function buildCaseContext(caseId: string): Promise<{ text: string; clientId: string }> {
  const c = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      client: true,
      responsibleLawyer: true,
      court: true,
      judge: true,
      caseType: true,
      deadlines: { where: { status: { in: ["PENDING", "ALERTED"] } }, orderBy: { deadlineDate: "asc" }, take: 10 },
      datajudProcess: { include: { movements: { orderBy: { data: "desc" }, take: 15 } } },
    },
  });
  if (!c) throw new Error("Processo não encontrado");

  const movs = c.datajudProcess?.movements ?? [];
  const lines = [
    `Processo: ${c.caseNumber}${c.cnjNumber ? ` (CNJ ${formatCnj(c.cnjNumber) ?? c.cnjNumber})` : ""}`,
    `Cliente: ${c.client.name}`,
    `Parte contrária: ${c.oppositeParty ?? "—"}`,
    `Tipo: ${c.caseType?.name ?? "—"}`,
    `Tribunal: ${c.court?.name ?? "—"}`,
    `Juiz(a): ${c.judge?.name ?? "—"}`,
    `Advogado responsável: ${c.responsibleLawyer?.name ?? "—"}`,
    c.deadlines.length
      ? `Prazos pendentes:\n${c.deadlines.map((d) => `  - ${d.deadlineType} vence ${d.deadlineDate.toLocaleDateString("pt-BR")}`).join("\n")}`
      : "Prazos pendentes: nenhum",
    movs.length
      ? `Últimas movimentações:\n${movs.map((m) => `  - ${m.data?.toLocaleDateString("pt-BR") ?? ""}: ${m.descricao}`).join("\n")}`
      : "Movimentações: não sincronizadas",
  ];
  return { text: lines.join("\n"), clientId: c.clientId };
}

const PETITION_SYSTEM =
  "Você é um advogado brasileiro experiente. Redija peças processuais conforme o CPC/CLT e a praxe forense, " +
  "em português jurídico formal, com endereçamento, qualificação das partes, dos fatos, do direito (com fundamentação " +
  "legal e, quando cabível, jurisprudência) e dos pedidos. Use HTML simples (h3, p, ol/li) para estruturar. " +
  "Não invente fatos não informados; sinalize lacunas com [PREENCHER].";

/** Gera a petição com IA a partir do contexto do processo (exige consentimento do cliente). */
export async function generatePetition(petitionId: string, userId?: string): Promise<void> {
  const pet = await prisma.petition.findUnique({ where: { id: petitionId } });
  if (!pet) throw new Error("Petição não encontrada");

  const { text, clientId } = await buildCaseContext(pet.caseId);
  await ensureAiConsent(clientId); // bloqueia se não houver consentimento (OAB 001/2024)

  await prisma.petition.update({ where: { id: petitionId }, data: { state: "GENERATING", contextSummary: text } });

  const prompt =
    `Tipo de peça: ${pet.petitionType}\n\n` +
    `Contexto do processo:\n${text}\n\n` +
    (pet.userInstructions ? `Instruções do advogado:\n${pet.userInstructions}\n\n` : "") +
    `Redija a peça completa.`;

  try {
    const res = await runAi({ system: PETITION_SYSTEM, prompt, userId, entity: "Petition", entityId: petitionId });
    await prisma.petition.update({
      where: { id: petitionId },
      data: {
        generatedContent: res.content,
        finalContent: pet.finalContent ?? res.content,
        state: "GENERATED",
        aiProvider: res.provider,
        aiModel: res.model,
        aiTokens: res.tokens,
        generatedAt: new Date(),
      },
    });
  } catch (err) {
    await prisma.petition.update({ where: { id: petitionId }, data: { state: "DRAFT" } });
    throw err;
  }
}

const EXPLAIN_SYSTEM =
  "Você é um assistente jurídico que explica movimentações processuais brasileiras em linguagem simples e acessível. " +
  "Em até 4 frases, explique: (1) o que aconteceu, (2) o impacto prático e (3) o próximo passo do advogado.";

/** Explica uma movimentação do DataJud em linguagem simples (IA). */
export async function explainMovement(movementId: string, userId?: string): Promise<string> {
  const m = await prisma.datajudMovement.findUnique({
    where: { id: movementId },
    include: { process: true },
  });
  if (!m) throw new Error("Movimentação não encontrada");

  const res = await runAi({
    system: EXPLAIN_SYSTEM,
    prompt: `Tribunal: ${m.process.tribunalSigla ?? "—"}\nMovimentação: ${m.descricao}`,
    userId,
    entity: "DatajudMovement",
    entityId: movementId,
  });

  await prisma.datajudMovement.update({ where: { id: movementId }, data: { aiExplanation: res.content } });
  return res.content;
}
