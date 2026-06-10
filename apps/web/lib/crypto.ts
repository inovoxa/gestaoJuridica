// Criptografia de credenciais — reexporta do core (mesma chave/algoritmo no worker).
import { crypto } from "@legaltech/core";

export const encryptSecret = crypto.encryptSecret;
export const decryptSecret = crypto.decryptSecret;
