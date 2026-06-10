import { prisma } from "@legaltech/db";
import { adapters, crypto } from "@legaltech/core";

const { googleCalendar: gcal } = adapters;
const dec = crypto.decryptSecret;
const enc = crypto.encryptSecret;

/**
 * Pull bidirecional: traz mudanças do Google Calendar para o sistema.
 * Eventos que vieram do sistema (têm googleEventId) são atualizados; novos do
 * Google são criados como source="google". Cancelados são removidos.
 */
export async function pullGoogleCalendar(): Promise<{ synced: number } | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
  if (!clientId || !clientSecret) return null;

  const integ = await prisma.googleIntegration.findUnique({ where: { id: "google" } });
  if (!integ?.refreshTokenEnc || !integ.syncEnabled) return null;

  // access_token válido
  let accessToken: string;
  if (integ.accessTokenEnc && integ.tokenExpiry && integ.tokenExpiry.getTime() - Date.now() > 60_000) {
    accessToken = dec(integ.accessTokenEnc);
  } else {
    const t = await gcal.refreshAccessToken(clientId, clientSecret, dec(integ.refreshTokenEnc));
    accessToken = t.accessToken;
    await prisma.googleIntegration.update({
      where: { id: "google" },
      data: { accessTokenEnc: enc(t.accessToken), tokenExpiry: t.expiresAt },
    });
  }

  const { events, nextSyncToken } = await gcal.listEvents(accessToken, integ.calendarId, integ.syncToken ?? undefined);

  let synced = 0;
  for (const e of events) {
    const existing = await prisma.calendarEvent.findFirst({ where: { googleEventId: e.id } });

    if (e.status === "cancelled") {
      if (existing) await prisma.calendarEvent.delete({ where: { id: existing.id } }).catch(() => {});
      continue;
    }
    if (!e.start) continue;

    if (existing) {
      await prisma.calendarEvent.update({
        where: { id: existing.id },
        data: { title: e.title, start: e.start, end: e.end, allDay: e.allDay },
      });
    } else {
      await prisma.calendarEvent.create({
        data: { title: e.title, start: e.start, end: e.end, allDay: e.allDay, source: "google", googleEventId: e.id },
      });
    }
    synced++;
  }

  await prisma.googleIntegration.update({
    where: { id: "google" },
    data: { syncToken: nextSyncToken ?? integ.syncToken, lastSync: new Date() },
  });

  if (synced) console.log(`[google] ${synced} evento(s) sincronizado(s) do Google Calendar`);
  return { synced };
}
