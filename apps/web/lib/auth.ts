import NextAuth, { type NextAuthResult } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@legaltech/db";
import { authConfig } from "./auth.config";
import { verifyPassword } from "./password";

const result = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.active) return null;
        if (!(await verifyPassword(password, user.passwordHash))) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  // session/pages/trustHost/callbacks vêm de authConfig (...authConfig acima).
});

// Anotações explícitas evitam o TS2742 do next-auth v5 + pnpm
// ("inferred type cannot be named without a reference to next-auth/lib").
export const handlers: NextAuthResult["handlers"] = result.handlers;
export const auth: NextAuthResult["auth"] = result.auth;
export const signIn: NextAuthResult["signIn"] = result.signIn;
export const signOut: NextAuthResult["signOut"] = result.signOut;
