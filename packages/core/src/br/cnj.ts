/**
 * Utilidades para o Número Único de Processo do CNJ (Resolução CNJ nº 65/2008).
 * Formato: NNNNNNN-DD.AAAA.J.TR.OOOO
 *   NNNNNNN  sequencial (7)
 *   DD       dígito verificador (2) — ISO 7064 MOD 97-10
 *   AAAA     ano do ajuizamento (4)
 *   J        segmento do Judiciário (1)
 *   TR       tribunal (2)
 *   OOOO     unidade de origem (4)
 */

export interface CnjParts {
  sequencial: string;
  digito: string;
  ano: string;
  segmento: string;
  tribunal: string;
  origem: string;
}

const CNJ_REGEX = /^(\d{7})-?(\d{2})\.?(\d{4})\.?(\d)\.?(\d{2})\.?(\d{4})$/;

/** Remove tudo que não for dígito. */
export function onlyDigits(value: string): string {
  return (value ?? "").replace(/\D/g, "");
}

/** Decompõe um número CNJ (com ou sem máscara). Retorna null se o formato for inválido. */
export function parseCnj(value: string): CnjParts | null {
  if (!value) return null;
  const match = value.trim().match(CNJ_REGEX);
  if (match) {
    const [, sequencial, digito, ano, segmento, tribunal, origem] = match;
    return { sequencial, digito, ano, segmento, tribunal, origem };
  }
  // fallback: 20 dígitos puros
  const digits = onlyDigits(value);
  if (digits.length !== 20) return null;
  return {
    sequencial: digits.slice(0, 7),
    digito: digits.slice(7, 9),
    ano: digits.slice(9, 13),
    segmento: digits.slice(13, 14),
    tribunal: digits.slice(14, 16),
    origem: digits.slice(16, 20),
  };
}

/** Calcula o dígito verificador (2 dígitos) de um CNJ. */
export function calcCnjDigito(parts: Omit<CnjParts, "digito">): string {
  // ISO 7064 MOD 97-10: DV = 98 - ((sequencial+ano+segmento+tribunal+origem) * 100) mod 97
  const base = `${parts.sequencial}${parts.ano}${parts.segmento}${parts.tribunal}${parts.origem}`;
  const resto = Number(BigInt(base + "00") % 97n);
  const dv = 98 - resto;
  return String(dv).padStart(2, "0");
}

/** Valida formato e dígito verificador de um número CNJ. */
export function isValidCnj(value: string): boolean {
  const parts = parseCnj(value);
  if (!parts) return false;
  return calcCnjDigito(parts) === parts.digito;
}

/** Formata um número CNJ com a máscara padrão. */
export function formatCnj(value: string): string | null {
  const p = parseCnj(value);
  if (!p) return null;
  return `${p.sequencial}-${p.digito}.${p.ano}.${p.segmento}.${p.tribunal}.${p.origem}`;
}

/** Segmentos do Judiciário (posição J do CNJ). */
export const SEGMENTOS: Record<string, string> = {
  "1": "Supremo Tribunal Federal",
  "2": "Conselho Nacional de Justiça",
  "3": "Superior Tribunal de Justiça",
  "4": "Justiça Federal",
  "5": "Justiça do Trabalho",
  "6": "Justiça Eleitoral",
  "7": "Justiça Militar da União",
  "8": "Justiça Estadual",
  "9": "Justiça Militar Estadual",
};

/**
 * Identifica o tribunal a partir do número CNJ (segmento + TR).
 * Cobre os casos mais comuns (Justiça Estadual e Federal por UF/região).
 */
export function detectTribunal(value: string): { segmento: string; sigla: string | null } | null {
  const p = parseCnj(value);
  if (!p) return null;
  const segmentoNome = SEGMENTOS[p.segmento] ?? "Desconhecido";

  // Justiça Estadual (8): TR = código do TJ por UF
  const tjUf: Record<string, string> = {
    "01": "AC", "02": "AL", "03": "AP", "04": "AM", "05": "BA", "06": "CE",
    "07": "DF", "08": "ES", "09": "GO", "10": "MA", "11": "MT", "12": "MS",
    "13": "MG", "14": "PA", "15": "PB", "16": "PR", "17": "PE", "18": "PI",
    "19": "RJ", "20": "RN", "21": "RS", "22": "RO", "23": "RR", "24": "SC",
    "25": "SE", "26": "SP", "27": "TO",
  };

  let sigla: string | null = null;
  if (p.segmento === "8") {
    const uf = tjUf[p.tribunal];
    sigla = uf ? `TJ${uf}` : null;
  } else if (p.segmento === "4") {
    sigla = `TRF${Number(p.tribunal)}`;
  } else if (p.segmento === "5") {
    sigla = `TRT${Number(p.tribunal)}`;
  } else if (p.segmento === "6") {
    sigla = `TRE`;
  } else if (p.segmento === "3") {
    sigla = "STJ";
  } else if (p.segmento === "1") {
    sigla = "STF";
  }

  return { segmento: segmentoNome, sigla };
}
