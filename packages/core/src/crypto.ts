import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

/**
 * Criptografia simétrica AES-256-GCM para credenciais em repouso.
 * Chave derivada de CREDENTIALS_ENCRYPTION_KEY (qualquer comprimento).
 * Formato: base64(iv).base64(authTag).base64(ciphertext)
 */
function getKey(): Buffer {
  return createHash("sha256").update(process.env.CREDENTIALS_ENCRYPTION_KEY ?? "").digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `${iv.toString("base64")}.${cipher.getAuthTag().toString("base64")}.${ct.toString("base64")}`;
}

export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, ctB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !ctB64) throw new Error("Credencial criptografada inválida");
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ctB64, "base64")), decipher.final()]).toString("utf8");
}
