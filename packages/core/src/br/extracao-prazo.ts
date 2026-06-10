/**
 * Extração heurística de prazos a partir do texto de uma movimentação processual.
 * Fallback por palavras-chave (a IA entra na Fase 3). Dias úteis padrão do CPC.
 */

export type DeadlineKind = "INTIMACAO" | "CITACAO" | "SENTENCA" | "DESPACHO" | "PUBLICACAO";

export interface ExtractedDeadline {
  type: DeadlineKind;
  days: number;
  keyword: string;
}

const RULES: { type: DeadlineKind; days: number; patterns: RegExp[] }[] = [
  { type: "CITACAO", days: 15, patterns: [/cita[çc][ãa]o/i, /citad[oa]/i] },
  { type: "INTIMACAO", days: 15, patterns: [/intima[çc][ãa]o/i, /intimad[oa]/i, /notifica[çc][ãa]o/i] },
  { type: "SENTENCA", days: 15, patterns: [/senten[çc]a/i, /julgamento/i, /ac[óo]rd[ãa]o/i] },
  { type: "PUBLICACAO", days: 15, patterns: [/publica[çc][ãa]o/i, /di[áa]rio oficial/i, /disponibiliza[çc][ãa]o/i] },
  { type: "DESPACHO", days: 5, patterns: [/despacho/i, /determina[çc][ãa]o/i, /manifeste-se/i] },
];

/**
 * Detecta se a movimentação gera prazo. Retorna o tipo e os dias úteis sugeridos.
 * Prioriza citação/intimação/sentença sobre despacho.
 */
export function extractDeadline(text: string): ExtractedDeadline | null {
  if (!text) return null;
  for (const rule of RULES) {
    for (const re of rule.patterns) {
      const m = text.match(re);
      if (m) return { type: rule.type, days: rule.days, keyword: m[0] };
    }
  }
  return null;
}
