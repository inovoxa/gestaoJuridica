import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";

/**
 * Verificação de senha. Suporta:
 *  - hashes bcrypt (produção)
 *  - hashes "seed$<sha256>" gerados pelo seed de demonstração
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (hash.startsWith("seed$")) {
    const expected = "seed$" + createHash("sha256").update(plain).digest("hex");
    return expected === hash;
  }
  return bcrypt.compare(plain, hash);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}
