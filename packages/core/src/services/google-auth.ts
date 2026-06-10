import { prisma } from "@legaltech/db";
import { decryptSecret, encryptSecret } from "../crypto.js";
import { refreshAccessToken } from "../adapters/google-calendar.js";

/**
 * Retorna um access_token válido do Google (renova com refresh_token se necessário).
 * Usa a conexão única em GoogleIntegration (cobre Calendar e Drive). Lança se não conectado.
 */
export async function getGoogleAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
  if (!clientId || !clientSecret) throw new Error("Google não configurado (GOOGLE_CLIENT_ID/SECRET).");

  const integ = await prisma.googleIntegration.findUnique({ where: { id: "google" } });
  if (!integ?.refreshTokenEnc) throw new Error("Conta Google não conectada.");

  if (integ.accessTokenEnc && integ.tokenExpiry && integ.tokenExpiry.getTime() - Date.now() > 60_000) {
    return decryptSecret(integ.accessTokenEnc);
  }

  const tokens = await refreshAccessToken(clientId, clientSecret, decryptSecret(integ.refreshTokenEnc));
  await prisma.googleIntegration.update({
    where: { id: "google" },
    data: { accessTokenEnc: encryptSecret(tokens.accessToken), tokenExpiry: tokens.expiresAt },
  });
  return tokens.accessToken;
}
