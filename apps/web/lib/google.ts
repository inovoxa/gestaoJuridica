import { prisma } from "@legaltech/db";
import { adapters } from "@legaltech/core";
import { encryptSecret, decryptSecret } from "./crypto";

const { googleCalendar: gcal } = adapters;

export function googleEnv() {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? `${process.env.APP_URL ?? "http://localhost:3000"}/api/google/callback`;
  return { clientId, clientSecret, redirectUri, configured: Boolean(clientId && clientSecret) };
}

/** Retorna um access_token válido (renova se expirado) + calendarId, ou null se não conectado. */
export async function getGoogleAccess(): Promise<{ accessToken: string; calendarId: string } | null> {
  const { clientId, clientSecret, configured } = googleEnv();
  if (!configured) return null;

  const integ = await prisma.googleIntegration.findUnique({ where: { id: "google" } });
  if (!integ?.refreshTokenEnc || !integ.syncEnabled) return null;

  // Token ainda válido (margem de 60s)?
  if (integ.accessTokenEnc && integ.tokenExpiry && integ.tokenExpiry.getTime() - Date.now() > 60_000) {
    return { accessToken: decryptSecret(integ.accessTokenEnc), calendarId: integ.calendarId };
  }

  // Renova com o refresh_token.
  const refreshToken = decryptSecret(integ.refreshTokenEnc);
  const tokens = await gcal.refreshAccessToken(clientId, clientSecret, refreshToken);
  await prisma.googleIntegration.update({
    where: { id: "google" },
    data: { accessTokenEnc: encryptSecret(tokens.accessToken), tokenExpiry: tokens.expiresAt },
  });
  return { accessToken: tokens.accessToken, calendarId: integ.calendarId };
}

/** Espelha um CalendarEvent local no Google Calendar (best-effort, não bloqueia o fluxo). */
export async function pushEventToGoogle(eventId: string): Promise<void> {
  try {
    const access = await getGoogleAccess();
    if (!access) return;
    const ev = await prisma.calendarEvent.findUnique({ where: { id: eventId } });
    if (!ev || ev.source === "google") return;

    const payload = {
      title: ev.title,
      description: ev.notes ?? undefined,
      start: ev.start,
      end: ev.end,
      allDay: ev.allDay,
    };

    if (ev.googleEventId) {
      await gcal.updateEvent(access.accessToken, access.calendarId, ev.googleEventId, payload);
    } else {
      const googleEventId = await gcal.insertEvent(access.accessToken, access.calendarId, payload);
      await prisma.calendarEvent.update({ where: { id: eventId }, data: { googleEventId } });
    }
  } catch (err) {
    console.error("[google] falha ao espelhar evento:", (err as Error).message);
  }
}

export async function deleteEventFromGoogle(googleEventId: string | null): Promise<void> {
  if (!googleEventId) return;
  try {
    const access = await getGoogleAccess();
    if (!access) return;
    await gcal.deleteEvent(access.accessToken, access.calendarId, googleEventId);
  } catch (err) {
    console.error("[google] falha ao remover evento:", (err as Error).message);
  }
}
