import { auth } from "./auth";
import { redirect } from "next/navigation";
import type { UserRole } from "@legaltech/db";

export interface SessionContext {
  userId: string;
  accountId: string;
  accountName: string;
  role: UserRole;
  name: string;
}

/**
 * Obtém o contexto da sessão atual (escritório/tenant + papel).
 * Redireciona para /login se não autenticado. Use em Server Components / Route Handlers.
 *
 * IMPORTANTE (LGPD/sigilo): toda query de domínio DEVE filtrar por `accountId`
 * obtido aqui — nunca confie em accountId vindo do cliente.
 */
export async function requireSession(): Promise<SessionContext> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return {
    userId: session.user.id,
    accountId: session.user.accountId,
    accountName: session.user.accountName,
    role: session.user.role,
    name: session.user.name ?? "",
  };
}

/** Garante que o usuário tem um dos papéis exigidos. */
export async function requireRole(...roles: UserRole[]): Promise<SessionContext> {
  const ctx = await requireSession();
  if (!roles.includes(ctx.role)) redirect("/dashboard");
  return ctx;
}
