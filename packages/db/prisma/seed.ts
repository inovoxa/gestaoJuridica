import { PrismaClient, UserRole, CaseStage, DeadlineType } from "@prisma/client";
import { createHash } from "node:crypto";

const prisma = new PrismaClient();

function seedHash(password: string): string {
  return "seed$" + createHash("sha256").update(password).digest("hex");
}

async function main() {
  console.log("🌱 Semeando dados de demonstração (escritório único)...");

  // Escritório (singleton) + conteúdo do website
  await prisma.firm.upsert({
    where: { id: "firm" },
    update: {},
    create: {
      id: "firm",
      name: "Silva & Associados",
      legalName: "Silva & Associados Sociedade de Advogados",
      cnpj: "12.345.678/0001-90",
      oab: "OAB/SP 12.345",
      email: "contato@silva.adv.br",
      phone: "(16) 3333-4444",
      whatsapp: "5516999998888",
      street: "Av. São Paulo",
      number: "1500",
      complement: "Conjunto 1201",
      district: "Centro",
      city: "Araraquara",
      state: "SP",
      zip: "14800-000",
      mapsUrl: "https://maps.google.com/?q=Araraquara",
      tagline: "Advocacia com tradição, técnica e resultado.",
      heroTitle: "Defesa jurídica de alto nível para você e sua empresa",
      heroSubtitle:
        "Atuação estratégica e personalizada em Direito Civil, Trabalhista, Empresarial e Tributário.",
      aboutTitle: "Sobre o escritório",
      aboutBody:
        "Há mais de 20 anos, o Silva & Associados oferece assessoria jurídica completa, unindo experiência, ética e tecnologia para proteger os interesses de seus clientes.",
      socialLinks: { instagram: "https://instagram.com/", linkedin: "https://linkedin.com/" },
    },
  });

  // Áreas de atuação (website)
  const areas = [
    { name: "Direito Civil", slug: "civil", icon: "Scale", summary: "Contratos, família, sucessões e responsabilidade civil." },
    { name: "Direito Trabalhista", slug: "trabalhista", icon: "Briefcase", summary: "Reclamatórias, acordos e consultoria preventiva." },
    { name: "Direito Empresarial", slug: "empresarial", icon: "Building2", summary: "Societário, contratos e recuperação de crédito." },
    { name: "Direito Tributário", slug: "tributario", icon: "Landmark", summary: "Planejamento, defesas fiscais e recuperação de tributos." },
  ];
  for (const [i, a] of areas.entries()) {
    await prisma.practiceArea.upsert({
      where: { slug: a.slug },
      update: {},
      create: { ...a, order: i },
    });
  }

  // Usuários
  await prisma.user.upsert({
    where: { email: "admin@silva.adv.br" },
    update: {},
    create: {
      email: "admin@silva.adv.br",
      name: "Administrador",
      passwordHash: seedHash("admin123"),
      role: UserRole.ADMIN_ESCRITORIO,
    },
  });

  const userAdv = await prisma.user.upsert({
    where: { email: "joao@silva.adv.br" },
    update: {},
    create: {
      email: "joao@silva.adv.br",
      name: "João Silva",
      passwordHash: seedHash("advogado123"),
      role: UserRole.ADVOGADO,
    },
  });

  const advogado = await prisma.lawyer.upsert({
    where: { userId: userAdv.id },
    update: {},
    create: {
      userId: userAdv.id,
      name: "João Silva",
      oab: "123456",
      oabUf: "SP",
      email: "joao@silva.adv.br",
      publicProfile: true,
      title: "Sócio fundador",
      bio: "Especialista em Direito Civil e Empresarial, com mais de 20 anos de atuação.",
      specialties: "Civil, Empresarial",
      order: 0,
    },
  });

  // Tipos, tribunal, juiz
  const tipoCivel = await prisma.caseType.create({ data: { name: "Cível", code: "CIV" } });
  await prisma.caseType.create({ data: { name: "Trabalhista", code: "TRA" } });
  const tribunal = await prisma.court.create({
    data: { name: "TJSP - 2ª Vara Cível", city: "Araraquara", state: "SP" },
  });
  const juiz = await prisma.judge.create({ data: { name: "Dr. Carlos Mendes", courtId: tribunal.id } });

  // Usuário do portal do cliente
  const clientePortalUser = await prisma.user.upsert({
    where: { email: "maria@exemplo.com" },
    update: {},
    create: {
      email: "maria@exemplo.com",
      name: "Maria Oliveira",
      passwordHash: seedHash("cliente123"),
      role: UserRole.CLIENTE_PORTAL,
    },
  });

  // Cliente + processo + audiência + prazo
  const cliente = await prisma.client.create({
    data: {
      name: "Maria Oliveira",
      cpfCnpj: "123.456.789-00",
      email: "maria@exemplo.com",
      phone: "+5516999990000",
      portalUserId: clientePortalUser.id,
    },
  });

  const processo = await prisma.case.create({
    data: {
      caseNumber: "PROC/00001",
      cnjNumber: "0018063-19.2013.8.26.0002",
      stage: CaseStage.IN_PROGRESS,
      clientId: cliente.id,
      responsibleLawyerId: advogado.id,
      caseTypeId: tipoCivel.id,
      courtId: tribunal.id,
      judgeId: juiz.id,
      oppositeParty: "Empresa XYZ Ltda.",
      caseLawyers: { create: { lawyerId: advogado.id, userId: userAdv.id, permission: "WRITE", isOwner: true } },
    },
  });

  await prisma.hearing.create({
    data: {
      caseId: processo.id,
      name: "Audiência de Instrução",
      hearingDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      lawyerId: advogado.id,
    },
  });

  await prisma.deadline.create({
    data: {
      caseId: processo.id,
      deadlineType: DeadlineType.INTIMACAO,
      originDate: new Date(),
      deadlineDate: new Date(Date.now() + 5 * 24 * 3600 * 1000),
      description: "Manifestar sobre documentos juntados (prazo de 15 dias úteis).",
    },
  });

  console.log("✅ Seed concluído:");
  console.log("   • Escritório: Silva & Associados (website + dados)");
  console.log("   • Admin:    admin@silva.adv.br / admin123");
  console.log("   • Advogado: joao@silva.adv.br / advogado123");
  console.log("   • Cliente (portal): maria@exemplo.com / cliente123");
  console.log("   • 4 áreas de atuação, 1 cliente, 1 processo, 1 audiência, 1 prazo");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
