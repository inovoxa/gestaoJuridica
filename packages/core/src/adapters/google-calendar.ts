/**
 * Adapter Google Calendar (API v3) — funções puras via fetch.
 * Fluxo OAuth2 (server-side, access_type=offline) + CRUD de eventos + pull incremental.
 *
 * Os tokens são gerenciados pela camada web/worker (criptografados no banco);
 * este módulo recebe tokens já decifrados e nunca persiste nada.
 */

const OAUTH_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const OAUTH_TOKEN = "https://oauth2.googleapis.com/token";
const CAL_API = "https://www.googleapis.com/calendar/v3";
export const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";
export const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

export interface GoogleTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

export interface GcalEvent {
  id?: string;
  title: string;
  description?: string;
  start: Date;
  end?: Date | null;
  allDay?: boolean;
}

/** URL de consentimento OAuth2 (access_type=offline para obter refresh_token). */
export function buildAuthUrl(clientId: string, redirectUri: string, state?: string, scope?: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scope ?? GOOGLE_CALENDAR_SCOPE,
    access_type: "offline",
    prompt: "consent",
    ...(state ? { state } : {}),
  });
  return `${OAUTH_AUTH}?${params.toString()}`;
}

/** Troca o code por tokens (inclui refresh_token na primeira autorização). */
export async function exchangeCode(
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string,
): Promise<GoogleTokens> {
  const res = await fetch(OAUTH_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) throw new Error(`Google OAuth falhou: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

/** Renova o access_token usando o refresh_token. */
export async function refreshAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<GoogleTokens> {
  const res = await fetch(OAUTH_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Google refresh falhou: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  return { accessToken: data.access_token, refreshToken, expiresAt: new Date(Date.now() + data.expires_in * 1000) };
}

function toGoogleEvent(e: GcalEvent) {
  if (e.allDay) {
    const d = e.start.toISOString().slice(0, 10);
    return { summary: e.title, description: e.description, start: { date: d }, end: { date: d } };
  }
  return {
    summary: e.title,
    description: e.description,
    start: { dateTime: e.start.toISOString() },
    end: { dateTime: (e.end ?? new Date(e.start.getTime() + 3600_000)).toISOString() },
  };
}

export async function insertEvent(accessToken: string, calendarId: string, e: GcalEvent): Promise<string> {
  const res = await fetch(`${CAL_API}/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(toGoogleEvent(e)),
  });
  if (!res.ok) throw new Error(`Google insertEvent: ${res.status} ${await res.text()}`);
  return ((await res.json()) as { id: string }).id;
}

export async function updateEvent(accessToken: string, calendarId: string, eventId: string, e: GcalEvent): Promise<void> {
  const res = await fetch(`${CAL_API}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(toGoogleEvent(e)),
  });
  if (!res.ok) throw new Error(`Google updateEvent: ${res.status} ${await res.text()}`);
}

export async function deleteEvent(accessToken: string, calendarId: string, eventId: string): Promise<void> {
  const res = await fetch(`${CAL_API}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  // 410 = já removido
  if (!res.ok && res.status !== 410 && res.status !== 404) {
    throw new Error(`Google deleteEvent: ${res.status} ${await res.text()}`);
  }
}

export interface PulledEvent {
  id: string;
  title: string;
  start: Date | null;
  end: Date | null;
  allDay: boolean;
  status: "confirmed" | "cancelled" | string;
}

/**
 * Pull incremental de eventos. Use syncToken da chamada anterior para obter só o delta.
 * Retorna eventos e o novo syncToken (para a próxima sincronização).
 */
export async function listEvents(
  accessToken: string,
  calendarId: string,
  syncToken?: string,
): Promise<{ events: PulledEvent[]; nextSyncToken?: string }> {
  const params = new URLSearchParams();
  if (syncToken) params.set("syncToken", syncToken);
  else params.set("timeMin", new Date(Date.now() - 30 * 86400_000).toISOString());
  params.set("showDeleted", "true");
  params.set("singleEvents", "true");

  const res = await fetch(`${CAL_API}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Google listEvents: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as {
    items?: Array<{
      id: string;
      summary?: string;
      status: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
    }>;
    nextSyncToken?: string;
  };

  const events: PulledEvent[] = (data.items ?? []).map((it) => {
    const allDay = Boolean(it.start?.date);
    const start = it.start?.dateTime ?? it.start?.date ?? null;
    const end = it.end?.dateTime ?? it.end?.date ?? null;
    return {
      id: it.id,
      title: it.summary ?? "(sem título)",
      start: start ? new Date(start) : null,
      end: end ? new Date(end) : null,
      allDay,
      status: it.status,
    };
  });

  return { events, nextSyncToken: data.nextSyncToken };
}
