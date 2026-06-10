import { auth } from "./lib/auth";
import { NextResponse } from "next/server";

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

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPrivate = PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (isPrivate && !req.auth) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
