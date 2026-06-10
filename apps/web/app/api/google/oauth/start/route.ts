import { NextResponse } from "next/server";
import { adapters } from "@legaltech/core";
import { auth } from "@/lib/auth";
import { googleEnv } from "@/lib/google";

const { googleCalendar: gcal } = adapters;

/** Inicia o fluxo OAuth2 do Google Calendar (somente usuário autenticado). */
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.redirect(new URL("/login", process.env.APP_URL ?? "http://localhost:3000"));

  const { clientId, redirectUri, configured } = googleEnv();
  if (!configured) {
    return NextResponse.json(
      { error: "Google não configurado. Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET." },
      { status: 500 },
    );
  }

  // Escopo combinado: Calendar (agenda) + Drive.file (storage de documentos).
  const scope = `${gcal.GOOGLE_CALENDAR_SCOPE} ${gcal.GOOGLE_DRIVE_SCOPE}`;
  const url = gcal.buildAuthUrl(clientId, redirectUri, "calendar", scope);
  return NextResponse.redirect(url);
}
