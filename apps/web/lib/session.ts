import { auth } from "./auth";
import { redirect } from "next/navigation";
import { prisma, type UserRole } from "@legaltech/db";

export interface SessionContext {
  userId: string;
  role: UserRole;
  name: string;
}

/** Sessão atual; redireciona para /login se não autenticado. */
export async function requireSession(): Promise<SessionContext> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return {
    userId: session.user.id,
    role: session.user.role,
    name: session.user.name ?? "",
  };
}

/** Exige um dos papéis informados. */
export async function requireRole(...roles: UserRole[]): Promise<SessionContext> {
  const ctx = await requireSession();
  if (!roles.includes(ctx.role)) redirect("/dashboard");
  return ctx;
}

/** Dados do escritório (singleton). Cacheado por request pelo Next. */
export async function getFirm() {
  return prisma.firm.findUnique({ where: { id: "firm" } });
}

/**
 * Exige um cliente do portal e retorna o Client vinculado ao usuário logado.
 * Redireciona para /dashboard se não for CLIENTE_PORTAL ou /login se sem vínculo.
 */
export async function requireClient() {
  const ctx = await requireSession();
  if (ctx.role !== "CLIENTE_PORTAL") redirect("/dashboard");
  const client = await prisma.client.findUnique({ where: { portalUserId: ctx.userId } });
  if (!client) redirect("/login");
  return { ctx, client };
}
