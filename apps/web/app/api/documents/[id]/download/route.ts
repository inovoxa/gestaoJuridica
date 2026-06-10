import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@legaltech/db";
import { adapters } from "@legaltech/core";
import { auth } from "@/lib/auth";

const { storage } = adapters;

/** Download protegido de documento (somente usuário autenticado). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc || !doc.storageKey || doc.state === "DELETED") {
    return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
  }

  // Auditoria de acesso a dado sensível (LGPD).
  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "document.download", entity: "Document", entityId: id },
  });

  const buffer = await storage.getStorage().get(doc.storageKey);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": doc.mimeType ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.fileName ?? doc.name)}"`,
    },
  });
}
