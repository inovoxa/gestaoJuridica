import NextAuth, { type NextAuthResult } from "next-auth";
import { NextResponse, type NextMiddleware } from "next/server";
import { authConfig } from "./lib/auth.config";

// O middleware roda no Edge runtime: usa só a config Edge-safe (sem bcrypt/Prisma).
// A sessão é JWT, então a verificação do cookie não precisa do provider Credentials.
// Anotação explícita evita o TS2742 do next-auth v5 + pnpm.
const auth: NextAuthResult["auth"] = NextAuth(authConfig).auth;

/**
 * Rotas do PAINEL (privadas) exigem login. O WEBSITE público e o login são abertos.
 */
const PRIVATE_PREFIXES = [
  "/dashboard",
  "/clientes",
  "/processos",
  "/audiencias",
  "/agenda",
  "/prazos",
  "/documentos",
  "/financeiro",
  "/relatorios",
  "/portal",
  "/config",
];

// Cast para NextMiddleware: nomeia o tipo do export e evita o TS2742 do next-auth.
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPrivate = PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (isPrivate && !req.auth) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}) as unknown as NextMiddleware;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
