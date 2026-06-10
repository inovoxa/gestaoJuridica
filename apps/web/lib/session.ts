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
