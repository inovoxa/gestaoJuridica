import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@legaltech/db";
import { verifyPassword } from "./password";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
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

        const user = await prisma.user.findFirst({
          where: { email, active: true },
          include: { account: true },
        });
        if (!user || !user.account.active) return null;
        if (!(await verifyPassword(password, user.passwordHash))) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          accountId: user.accountId,
          accountName: user.account.name,
        };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.role = user.role;
        token.accountId = user.accountId;
        token.accountName = user.accountName;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role;
        session.user.accountId = token.accountId;
        session.user.accountName = token.accountName;
      }
      return session;
    },
  },
});
