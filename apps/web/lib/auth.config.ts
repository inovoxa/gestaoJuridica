import type { NextAuthConfig } from "next-auth";

/**
 * Configuração base do Auth.js — Edge-safe: SEM dependências de Node
 * (bcrypt / node:crypto / Prisma). É a config que o middleware carrega.
 * O provider Credentials (que usa bcrypt/crypto/Prisma) fica em auth.ts,
 * usado apenas no runtime Node (server actions, route handlers).
 */
// Anotação explícita (em vez de `satisfies`) para o tipo ser nomeável e
// evitar o TS2742 do next-auth + pnpm (estrutura symlinked).
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
