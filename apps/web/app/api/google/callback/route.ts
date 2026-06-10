import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@legaltech/db";
import { adapters } from "@legaltech/core";
import { auth } from "@/lib/auth";
import { googleEnv } from "@/lib/google";
import { encryptSecret } from "@/lib/crypto";

const { googleCalendar: gcal } = adapters;

/** Callback OAuth2: troca o code por tokens e ativa a sincronização. */
export async function GET(req: NextRequest) {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const session = await auth();
  if (!session?.user) return NextResponse.redirect(new URL("/login", appUrl));

  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/agenda?google=erro", appUrl));

  const { clientId, clientSecret, redirectUri } = googleEnv();
  try {
    const tokens = await gcal.exchangeCode(clientId, clientSecret, code, redirectUri);

    await prisma.googleIntegration.upsert({
      where: { id: "google" },
      update: {
        accessTokenEnc: encryptSecret(tokens.accessToken),
        refreshTokenEnc: tokens.refreshToken ? encryptSecret(tokens.refreshToken) : undefined,
        tokenExpiry: tokens.expiresAt,
        syncEnabled: true,
      },
      create: {
        id: "google",
        accessTokenEnc: encryptSecret(tokens.accessToken),
        refreshTokenEnc: tokens.refreshToken ? encryptSecret(tokens.refreshToken) : null,
        tokenExpiry: tokens.expiresAt,
        syncEnabled: true,
      },
    });

    return NextResponse.redirect(new URL("/agenda?google=conectado", appUrl));
  } catch (err) {
    console.error("[google callback]", (err as Error).message);
    return NextResponse.redirect(new URL("/agenda?google=erro", appUrl));
  }
}
