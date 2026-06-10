import { PrismaClient, UserRole, CaseStage, DeadlineType } from "@prisma/client";
import { createHash } from "node:crypto";

const prisma = new PrismaClient();

// Hash simples só para o seed; em produção usar bcrypt/argon2 (apps/web/lib/auth).
function seedHash(password: string): string {
  return "seed$" + createHash("sha256").update(password).digest("hex");
}

async function main() {
  console.log("🌱 Semeando dados de demonstração...");

  // Dois escritórios para validar o isolamento multi-tenant.
  const escritorioA = await prisma.account.create({
    data: {
      name: "Silva & Associados Advocacia",
      cnpj: "12.345.678/0001-90",
      users: {
        create: [
          {
            email: "admin@silva.adv.br",
            name: "Administrador Silva",
            passwordHash: seedHash("admin123"),
            role: UserRole.ADMIN_ESCRITORIO,
          },
        ],
      },
    },
    include: { users: true },
  });

  const escritorioB = await prisma.account.create({
    data: {
      name: "Costa Advogados",
      cnpj: "98.765.432/0001-10",
      users: {
        create: [
          {
            email: "admin@costa.adv.br",
            name: "Administrador Costa",
            passwordHash: seedHash("admin123"),
            role: UserRole.ADMIN_ESCRITORIO,
          },
        ],
      },
    },
  });

  // Advogado vinculado a um usuário no escritório A.
  const userAdv = await prisma.user.create({
    data: {
      accountId: escritorioA.id,
      email: "joao@silva.adv.br",
      name: "João Silva",
      passwordHash: seedHash("advogado123"),
      role: UserRole.ADVOGADO,
    },
  });

  const advogado = await prisma.lawyer.create({
    data: {
      accountId: escritorioA.id,
      userId: userAdv.id,
      name: "João Silva",
      oab: "123456",
      oabUf: "SP",
      email: "joao@silva.adv.br",
    },
  });

  // Tipos de processo, tribunal e juiz.
  const tipoCivel = await prisma.caseType.create({
    data: { accountId: escritorioA.id, name: "Cível", code: "CIV" },
  });
  await prisma.caseType.create({
    data: { accountId: escritorioA.id, name: "Trabalhista", code: "TRA" },
  });

  const tribunal = await prisma.court.create({
    data: { accountId: escritorioA.id, name: "TJSP - 2ª Vara Cível", city: "São Paulo", state: "SP" },
  });
  const juiz = await prisma.judge.create({
    data: { accountId: escritorioA.id, name: "Dr. Carlos Mendes", courtId: tribunal.id },
  });

  // Cliente + processo de exemplo.
  const cliente = await prisma.client.create({
    data: {
      accountId: escritorioA.id,
      name: "Maria Oliveira",
      cpfCnpj: "123.456.789-00",
      email: "maria@exemplo.com",
      phone: "+5511999998888",
    },
  });

  const processo = await prisma.case.create({
    data: {
      accountId: escritorioA.id,
      caseNumber: "PROC/00001",
      cnjNumber: "0018063-19.2013.8.26.0002",
      stage: CaseStage.IN_PROGRESS,
      clientId: cliente.id,
      responsibleLawyerId: advogado.id,
      caseTypeId: tipoCivel.id,
      courtId: tribunal.id,
      judgeId: juiz.id,
      oppositeParty: "Empresa XYZ Ltda.",
      caseLawyers: {
        create: {
          lawyerId: advogado.id,
          userId: userAdv.id,
          permission: "WRITE",
          isOwner: true,
        },
      },
    },
  });

  // Audiência e prazo de exemplo.
  await prisma.hearing.create({
    data: {
      accountId: escritorioA.id,
      caseId: processo.id,
      name: "Audiência de Instrução",
      hearingDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      lawyerId: advogado.id,
    },
  });

  await prisma.deadline.create({
    data: {
      accountId: escritorioA.id,
      caseId: processo.id,
      deadlineType: DeadlineType.INTIMACAO,
      originDate: new Date(),
      deadlineDate: new Date(Date.now() + 5 * 24 * 3600 * 1000),
      description: "Manifestar sobre documentos juntados (prazo de 15 dias úteis).",
    },
  });

  console.log("✅ Seed concluído:");
  console.log(`   • Escritório A: ${escritorioA.name} (admin@silva.adv.br / admin123)`);
  console.log(`   • Escritório B: ${escritorioB.name} (admin@costa.adv.br / admin123)`);
  console.log(`   • Advogado: joao@silva.adv.br / advogado123`);
  console.log(`   • 1 cliente, 1 processo, 1 audiência, 1 prazo`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
